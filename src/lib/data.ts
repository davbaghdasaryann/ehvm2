import { Client, isFullPage } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import type { App } from "@/data/apps";
import {
  articles as staticArticles,
  type Article,
  type ContentBlock,
} from "@/data/articles";

export type { App, Article, ContentBlock };

type NotionPage = PageObjectResponse;
type NotionProperty = NotionPage["properties"][string];
type PaidChannel = App["userAcquisition"]["paid"][number];
type OrganicChannel = App["userAcquisition"]["organic"][number];
type Faq = App["faqs"][number];
type NotionDbField = NonNullable<App["notionDbFields"]>[number];
type NotionDetailBlock = NonNullable<App["notionDetailBlocks"]>[number];
type NotionPageBlock = NonNullable<App["notionPageBlocks"]>[number];

type ParsedBlock = {
  type: string;
  section: string;
  text: string;
  links: string[];
  imageUrl?: string;
};

type ParsedAppContent = {
  about?: string;
  appStoreLink?: string;
  playStoreLink?: string;
  screenshotsImage?: string;
  opportunities?: string[];
  faqs?: Faq[];
  userAcquisition?: App["userAcquisition"];
  notionDetailBlocks?: NotionDetailBlock[];
  notionPageBlocks?: NotionPageBlock[];
  contact?: Partial<App["contact"]>;
  highlights?: Partial<App["highlights"]>;
  rating?: number;
};

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

type NotionDatabaseConfig = {
  filterPropertyIds: string[];
  slugPropertyType?: string;
};

const notionApiKey = process.env.NOTION_API_KEY;
const notionAppsDbId = process.env.NOTION_APPS_DB_ID;
const notionClient = notionApiKey ? new Client({ auth: notionApiKey }) : null;

const NOTION_PAGES_TTL_MS = 15 * 60 * 1000;
const APP_SUMMARIES_TTL_MS = 15 * 60 * 1000;
const PARSED_CONTENT_TTL_MS = 60 * 60 * 1000;
const DATABASE_CONFIG_TTL_MS = 6 * 60 * 60 * 1000;
const BLOCK_TRAVERSAL_CONCURRENCY = 3;

let notionPagesCache: CacheEntry<NotionPage[]> | null = null;
let appSummariesCache: CacheEntry<App[]> | null = null;
const appDetailCache = new Map<string, CacheEntry<App | undefined>>();
const parsedContentCache = new Map<string, CacheEntry<ParsedAppContent>>();
let notionDatabaseConfigCache: CacheEntry<NotionDatabaseConfig> | null = null;
let notionPagesInFlight: Promise<NotionPage[]> | null = null;
let appSummariesInFlight: Promise<App[]> | null = null;
let notionDatabaseConfigInFlight: Promise<NotionDatabaseConfig> | null = null;
const parsedContentInFlight = new Map<string, Promise<ParsedAppContent>>();

const DEFAULT_ICON = "/images/EHVM_Icon.png";
const DEFAULT_SCREENSHOTS = "/images/app-screenshots.png";
const DEFAULT_CONTACT: App["contact"] = {
  name: "Evelin Herrera",
  image: "/images/evelin.png",
  email: "hi@evelinherrera.com",
  phone: "+1 415 798 1766",
};

const EXCLUDED_DB_FIELD_NAMES = new Set([
  "Name",
  "Slug",
  "Icon",
  "PaidChannelsJSON",
  "OrganicChannelsJSON",
  "FAQsJSON",
  "ContactImage",
  "Screenshots",
]);

function isFresh<T>(entry: CacheEntry<T> | null | undefined): entry is CacheEntry<T> {
  return Boolean(entry && entry.expiresAt > Date.now());
}

async function getNotionDatabaseConfig(): Promise<NotionDatabaseConfig> {
  if (isFresh(notionDatabaseConfigCache)) return notionDatabaseConfigCache.value;
  if (notionDatabaseConfigInFlight) return notionDatabaseConfigInFlight;

  if (!notionClient || !notionAppsDbId) {
    return { filterPropertyIds: [] };
  }

  notionDatabaseConfigInFlight = (async () => {
    try {
      const database = await notionClient.databases.retrieve({ database_id: notionAppsDbId });
      const properties =
        (database as { properties?: Record<string, { id?: string; type?: string }> }).properties || {};
      const filterPropertyIds = Object.values(properties)
        .map((property) => property?.id)
        .filter((id): id is string => Boolean(id));

      const config: NotionDatabaseConfig = {
        filterPropertyIds,
        slugPropertyType: properties.Slug?.type,
      };

      notionDatabaseConfigCache = {
        value: config,
        expiresAt: Date.now() + DATABASE_CONFIG_TTL_MS,
      };

      return config;
    } catch (error) {
      console.error("Failed to read Notion database schema.", error);
      return { filterPropertyIds: [] };
    }
  })();

  try {
    return await notionDatabaseConfigInFlight;
  } finally {
    notionDatabaseConfigInFlight = null;
  }
}

async function getNotionPages(): Promise<NotionPage[]> {
  if (isFresh(notionPagesCache)) return notionPagesCache.value;
  if (notionPagesInFlight) return notionPagesInFlight;

  if (!notionClient || !notionAppsDbId) {
    console.warn("Missing NOTION_API_KEY or NOTION_APPS_DB_ID. Returning empty apps list.");
    return [];
  }

  notionPagesInFlight = (async () => {
    try {
      const notionPages: NotionPage[] = [];
      let cursor: string | undefined;
      const { filterPropertyIds } = await getNotionDatabaseConfig();

      do {
        const response = await notionClient.databases.query({
          database_id: notionAppsDbId,
          start_cursor: cursor,
          page_size: 100,
          ...(filterPropertyIds.length > 0 ? { filter_properties: filterPropertyIds } : {}),
        });

        for (const result of response.results) {
          if (isFullPage(result)) notionPages.push(result);
        }

        cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
      } while (cursor);

      notionPagesCache = {
        value: notionPages,
        expiresAt: Date.now() + NOTION_PAGES_TTL_MS,
      };

      return notionPages;
    } catch (error) {
      console.error("Failed to fetch apps from Notion.", error);
      if (notionPagesCache?.value?.length) return notionPagesCache.value;
      return [];
    }
  })();

  try {
    return await notionPagesInFlight;
  } finally {
    notionPagesInFlight = null;
  }
}

async function getNotionApps(): Promise<App[]> {
  if (isFresh(appSummariesCache)) return appSummariesCache.value;
  if (appSummariesInFlight) return appSummariesInFlight;

  appSummariesInFlight = (async () => {
    const pages = await getNotionPages();
    const apps = pages
      .map(mapNotionPageToAppSummary)
      .filter((app): app is App => app !== null);

    appSummariesCache = {
      value: apps,
      expiresAt: Date.now() + APP_SUMMARIES_TTL_MS,
    };

    return apps;
  })();

  try {
    return await appSummariesInFlight;
  } finally {
    appSummariesInFlight = null;
  }
}

async function getParsedNotionAppContent(pageId: string): Promise<ParsedAppContent> {
  const cached = parsedContentCache.get(pageId);
  const staleCachedValue = cached?.value;
  if (isFresh(cached)) return cached.value;
  const inFlight = parsedContentInFlight.get(pageId);
  if (inFlight) return staleCachedValue ?? inFlight;

  if (!notionClient) return {};

  if (staleCachedValue) {
    const refreshPromise = parseAndCacheNotionContent(pageId, staleCachedValue)
      .catch(() => staleCachedValue)
      .finally(() => {
        parsedContentInFlight.delete(pageId);
      });
    parsedContentInFlight.set(pageId, refreshPromise);
    return staleCachedValue;
  }

  const parsePromise = parseAndCacheNotionContent(pageId)
    .catch((error) => {
      console.error(`Failed to parse Notion blocks for app page ${pageId}.`, error);
      return {};
    })
    .finally(() => {
      parsedContentInFlight.delete(pageId);
    });
  parsedContentInFlight.set(pageId, parsePromise);
  return parsePromise;
}

async function parseAndCacheNotionContent(
  pageId: string,
  staleCachedValue?: ParsedAppContent,
): Promise<ParsedAppContent> {
  try {
    const { blocks, toggles, notionPageBlocks } = await parseNotionPageBlocks(pageId);

    const linkPool = uniqueStrings([
      ...blocks.flatMap((block) => block.links),
      ...blocks.flatMap((block) => extractUrlsFromText(block.text)),
    ]);

    const appStoreLink = linkPool.find((url) => /apps\.apple\.com/i.test(url));
    const playStoreLink = linkPool.find((url) => /play\.google\.com/i.test(url));

    const about = blocks.find(
      (block) =>
        block.type === "paragraph" &&
        !block.section &&
        isNarrativeText(block.text),
    )?.text;

    const screenshotsImage =
      blocks.find((block) => block.type === "image" && !block.section)?.imageUrl ||
      blocks.find((block) => block.type === "image")?.imageUrl;

    const opportunities = uniqueStrings(
      blocks
        .filter(
          (block) =>
            /opportunit/i.test(block.section) &&
            ["quote", "paragraph", "bulleted_list_item", "numbered_list_item"].includes(block.type),
        )
        .map((block) => normalizeSpacing(block.text))
        .filter((text) => isNarrativeText(text)),
    );

    const userAcquisitionLines = uniqueStrings(
      blocks
        .filter(
          (block) =>
            /user acquisition/i.test(block.section) &&
            ["quote", "paragraph", "bulleted_list_item", "numbered_list_item"].includes(block.type),
        )
        .map((block) => normalizeSpacing(block.text))
        .filter((text) => isNarrativeText(text))
        .filter((text) => !/^(active paid channels)$/i.test(text)),
    );

    const ndaLink =
      linkPool.find((url) => /docuseal|nda/i.test(url)) ||
      linkPool.find((url) => /^https?:\/\//.test(url));

    const parsedPaidChannels = userAcquisitionLines
      .map((line, index): PaidChannel => {
        const channel = inferChannelFromLine(line, index);
        return {
          name: channel.name,
          subtitle: "Paid",
          icon: channel.icon,
          metric: inferMetricFromLine(line),
          metricStyle: channel.metricStyle,
          link: ndaLink,
        };
      })
      .slice(0, 5);

    const notionDetailBlocks = buildNotionDetailBlocks(blocks);

    const highlightMrrRaw = blocks.find(
      (block) => block.type === "heading_1" && /[$€£]/.test(block.text),
    )?.text;
    const highlightRatingRaw = blocks.find(
      (block) => block.type === "heading_1" && /⭐|\b[0-5](?:\.\d+)?\b/.test(block.text),
    )?.text;
    const parsedRating = highlightRatingRaw ? parseRatingFromText(highlightRatingRaw) : undefined;

    const highlightRatingLabel = blocks.find(
      (block) =>
        block.type === "paragraph" &&
        !block.section &&
        /rating/i.test(block.text),
    )?.text;

    const contactSectionKey = "have more questions";
    const contactName = blocks.find(
      (block) =>
        block.type === "heading_1" &&
        block.section.toLowerCase().includes(contactSectionKey) &&
        !/have more questions/i.test(block.text),
    )?.text;
    const contactImage = blocks.find(
      (block) =>
        block.type === "image" &&
        block.section.toLowerCase().includes(contactSectionKey),
    )?.imageUrl;

    const mailto = linkPool.find((url) => /^mailto:/i.test(url));
    const emailFromMailto = mailto ? mailto.replace(/^mailto:/i, "").trim() : "";
    const emailFromText = findFirstEmail(blocks.map((block) => block.text).join(" \n "));

    const phoneFromText = findFirstPhone(blocks.map((block) => block.text).join(" \n "));

    const parsedContent: ParsedAppContent = {
      about,
      appStoreLink,
      playStoreLink,
      screenshotsImage,
      opportunities: opportunities.length > 0 ? opportunities : undefined,
      faqs: toggles.length > 0 ? toggles : undefined,
      userAcquisition:
        parsedPaidChannels.length > 0
          ? { paid: parsedPaidChannels, organic: [] }
          : undefined,
      notionDetailBlocks: notionDetailBlocks.length > 0 ? notionDetailBlocks : undefined,
      notionPageBlocks: notionPageBlocks.length > 0 ? notionPageBlocks : undefined,
      contact: {
        name: contactName,
        image: contactImage,
        email: emailFromMailto || emailFromText || undefined,
        phone: phoneFromText || undefined,
      },
      highlights: {
        mrr: highlightMrrRaw ? cleanHeadingMetric(highlightMrrRaw) : undefined,
        rating: parsedRating !== undefined ? String(parsedRating) : undefined,
        ratingLabel: highlightRatingLabel,
      },
      rating: parsedRating,
    };

    parsedContentCache.set(pageId, {
      value: parsedContent,
      expiresAt: Date.now() + PARSED_CONTENT_TTL_MS,
    });

    return parsedContent;
  } catch (error) {
    if (staleCachedValue) return staleCachedValue;
    throw error;
  }
}

function mapNotionPageToAppSummary(page: NotionPage): App | null {
  const props = page.properties;
  const name = getTitle(props.Name) || "Untitled App";

  if (isSoldPage(page)) return null;

  const slug = getAppSlugFromPage(page);
  const rawMrr = getRichText(props.MRR);
  const mrr = parseMrrForCard(rawMrr) || "—";
  const rating = getNumber(props.Rating) ?? 0;
  const category = normalizeSpacing(getRichText(props.Category)) || "Other";
  const subtitle = getRichText(props.Subtitle) || deriveSubtitle(name);
  const followers = getRichText(props.Followers);
  const featured = getCheckbox(props.Featured) ?? false;
  const monetizationType = getRichText(props["Monetization type"]) || undefined;
  const hearingOffersStatus = getStatusName(props["Hearing offers"]) || undefined;

  const { platform, platformEmoji } = parsePlatform(getMultiSelectNames(props.OS));

  const icon =
    getFileUrl(props.Icon) ||
    getPageIconUrl(page) ||
    DEFAULT_ICON;

  const paidChannels = parsePaidChannels(getRichText(props.PaidChannelsJSON)) || [];
  const organicChannels = parseOrganicChannels(getRichText(props.OrganicChannelsJSON)) || [];
  const faqs = parseFaqs(getRichText(props.FAQsJSON)) || [];
  const opportunities = parseMultiline(getRichText(props.Opportunities)) || [];

  const highlights: App["highlights"] = {
    mrr: getRichText(props.HighlightsMRR) || (mrr !== "—" ? `$${mrr}` : "—"),
    rating: getRichText(props.HighlightsRating) || (rating > 0 ? String(rating) : "—"),
    ratingLabel: getRichText(props.HighlightsRatingLabel) || "Rating",
    followers: getRichText(props.HighlightsFollowers) || followers || "—",
    followersLabel: getRichText(props.HighlightsFollowersLabel) || "Followers",
  };

  const contact: App["contact"] = {
    name: getRichText(props.ContactName) || DEFAULT_CONTACT.name,
    image: getFileUrl(props.ContactImage) || DEFAULT_CONTACT.image,
    email: getRichText(props.ContactEmail) || DEFAULT_CONTACT.email,
    phone: getRichText(props.ContactPhone) || DEFAULT_CONTACT.phone,
  };
  const notionDbFields = parseNotionDbFields(props);

  return {
    notionPageId: page.id,
    slug,
    name,
    subtitle,
    icon,
    mrr,
    platform,
    platformEmoji,
    monetizationType,
    hearingOffersStatus,
    rating,
    followers: followers || undefined,
    category,
    about: getRichText(props.About) || `${name} is listed for acquisition on EHVM.`,
    highlights,
    screenshotsImage: getFileUrl(props.Screenshots) || DEFAULT_SCREENSHOTS,
    appStoreLink: getUrl(props.AppStoreLink),
    playStoreLink: getUrl(props.PlayStoreLink),
    userAcquisition: {
      paid: paidChannels,
      organic: organicChannels,
    },
    opportunities,
    developerCountry: getRichText(props.DeveloperCountry) || "Unknown",
    developerFlag: getRichText(props.DeveloperFlag) || "🌍",
    faqs,
    contact,
    featured,
    notionDbFields: notionDbFields.length > 0 ? notionDbFields : undefined,
  };
}

function parseNotionDbFields(
  props: NotionPage["properties"],
): NotionDbField[] {
  const fields: NotionDbField[] = [];

  for (const [label, prop] of Object.entries(props)) {
    if (EXCLUDED_DB_FIELD_NAMES.has(label)) continue;
    const parsed = parseNotionPropertyToField(prop);
    if (!parsed) continue;
    fields.push({
      label,
      value: parsed.value,
      url: parsed.url,
    });
  }

  return fields;
}

function parseNotionPropertyToField(
  prop?: NotionProperty,
): { value: string; url?: string } | null {
  if (!prop) return null;

  switch (prop.type) {
    case "title": {
      const value = prop.title.map((part) => part.plain_text).join("").trim();
      const url =
        prop.title
          .map((part) => {
            if (part.href) return part.href;
            if (part.type === "text") return part.text.link?.url || "";
            return "";
          })
          .find((candidate): candidate is string => Boolean(candidate)) || undefined;
      return value ? { value, url } : null;
    }
    case "rich_text": {
      const value = prop.rich_text.map((part) => part.plain_text).join("").trim();
      const url =
        prop.rich_text
          .map((part) => {
            if (part.href) return part.href;
            if (part.type === "text") return part.text.link?.url || "";
            return "";
          })
          .find((candidate): candidate is string => Boolean(candidate)) || undefined;
      return value ? { value, url } : null;
    }
    case "number":
      return prop.number === null ? null : { value: String(prop.number) };
    case "select":
      return prop.select?.name ? { value: prop.select.name } : null;
    case "multi_select": {
      const value = prop.multi_select.map((option) => option.name).filter(Boolean).join(", ");
      return value ? { value } : null;
    }
    case "status":
      return prop.status?.name ? { value: prop.status.name } : null;
    case "url":
      return prop.url ? { value: prop.url, url: prop.url } : null;
    case "email":
      return prop.email ? { value: prop.email, url: `mailto:${prop.email}` } : null;
    case "phone_number":
      return prop.phone_number ? { value: prop.phone_number, url: `tel:${prop.phone_number}` } : null;
    case "checkbox":
      return { value: prop.checkbox ? "Yes" : "No" };
    case "date": {
      const value = formatNotionDateRange(prop.date);
      return value ? { value } : null;
    }
    case "files": {
      if (prop.files.length === 0) return null;
      const first = prop.files[0];
      const url = "external" in first ? first.external.url : first.file.url;
      if (!url) return null;
      return {
        value: prop.files.length === 1 ? "Open file" : `${prop.files.length} files`,
        url,
      };
    }
    case "people": {
      if (prop.people.length === 0) return null;
      const names = prop.people
        .map((person) => getNotionUserName(person))
        .filter((name): name is string => Boolean(name));
      return names.length > 0
        ? { value: names.join(", ") }
        : { value: `${prop.people.length} people` };
    }
    case "relation":
      return prop.relation.length > 0 ? { value: `${prop.relation.length} related` } : null;
    case "formula": {
      if (prop.formula.type === "string") return prop.formula.string ? { value: prop.formula.string } : null;
      if (prop.formula.type === "number") return prop.formula.number === null ? null : { value: String(prop.formula.number) };
      if (prop.formula.type === "boolean") return { value: prop.formula.boolean ? "Yes" : "No" };
      if (prop.formula.type === "date") {
        const value = formatNotionDateRange(prop.formula.date);
        return value ? { value } : null;
      }
      return null;
    }
    case "rollup": {
      if (prop.rollup.type === "number") return prop.rollup.number === null ? null : { value: String(prop.rollup.number) };
      if (prop.rollup.type === "date") {
        const value = formatNotionDateRange(prop.rollup.date);
        return value ? { value } : null;
      }
      if (prop.rollup.type === "array") {
        if (prop.rollup.array.length === 0) return null;
        const parts = prop.rollup.array
          .map((item) => parseRollupArrayItem(item))
          .filter((item): item is string => Boolean(item));
        if (parts.length > 0) return { value: parts.join(", ") };
        return { value: `${prop.rollup.array.length} items` };
      }
      return null;
    }
    case "created_time":
      return prop.created_time ? { value: formatNotionTimestamp(prop.created_time) } : null;
    case "last_edited_time":
      return prop.last_edited_time ? { value: formatNotionTimestamp(prop.last_edited_time) } : null;
    case "created_by":
      return getNotionUserName(prop.created_by) ? { value: getNotionUserName(prop.created_by)! } : null;
    case "last_edited_by":
      return getNotionUserName(prop.last_edited_by) ? { value: getNotionUserName(prop.last_edited_by)! } : null;
    case "unique_id":
      return prop.unique_id
        ? {
            value: `${prop.unique_id.prefix ?? ""}${prop.unique_id.number}`,
          }
        : null;
    default:
      return null;
  }
}

function formatNotionTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 10);
}

function formatNotionDateRange(
  value: { start: string; end: string | null } | null,
): string {
  if (!value?.start) return "";
  if (!value.end) return value.start;
  return `${value.start} -> ${value.end}`;
}

function parseRollupArrayItem(item: unknown): string {
  if (!item || typeof item !== "object") return "";
  const typedItem = item as {
    type?: string;
    number?: number | null;
    checkbox?: boolean;
    url?: string | null;
    email?: string | null;
    phone_number?: string | null;
    select?: { name?: string } | null;
    status?: { name?: string } | null;
    multi_select?: Array<{ name?: string }>;
    rich_text?: Array<{ plain_text?: string }>;
    title?: Array<{ plain_text?: string }>;
    date?: { start: string; end: string | null } | null;
  };

  switch (typedItem.type) {
    case "number":
      return typedItem.number === null || typedItem.number === undefined ? "" : String(typedItem.number);
    case "checkbox":
      return typedItem.checkbox ? "Yes" : "No";
    case "url":
      return typedItem.url || "";
    case "email":
      return typedItem.email || "";
    case "phone_number":
      return typedItem.phone_number || "";
    case "select":
      return typedItem.select?.name || "";
    case "status":
      return typedItem.status?.name || "";
    case "multi_select":
      return (typedItem.multi_select || []).map((entry) => entry.name || "").filter(Boolean).join(", ");
    case "rich_text":
      return (typedItem.rich_text || []).map((entry) => entry.plain_text || "").join("").trim();
    case "title":
      return (typedItem.title || []).map((entry) => entry.plain_text || "").join("").trim();
    case "date":
      return formatNotionDateRange(typedItem.date || null);
    default:
      return "";
  }
}

function getNotionUserName(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const maybeName = (value as { name?: unknown }).name;
  return typeof maybeName === "string" ? maybeName.trim() : "";
}

async function parseNotionPageBlocks(pageId: string): Promise<{ blocks: ParsedBlock[]; toggles: Faq[]; notionPageBlocks: NotionPageBlock[] }> {
  const topLevelBlocks = await listAllBlockChildren(pageId);
  const blocks: ParsedBlock[] = [];
  const toggles: Faq[] = [];
  const notionPageBlocks: NotionPageBlock[] = [];

  const sectionPerTopLevelBlock: string[] = [];
  let currentSection = "";
  for (const block of topLevelBlocks) {
    sectionPerTopLevelBlock.push(currentSection);
    const maybeHeading = parseBlockContent(block);
    if (block.type === "heading_1" && maybeHeading.text) currentSection = maybeHeading.text;
  }

  const traversedTopLevelBlocks = await mapWithConcurrency(
    topLevelBlocks.map((block, index) => ({ block, section: sectionPerTopLevelBlock[index] || "" })),
    BLOCK_TRAVERSAL_CONCURRENCY,
    ({ block, section }) => traverseBlock(block, section),
  );

  for (const parsed of traversedTopLevelBlocks) {
    blocks.push(...parsed.parsedBlocks);
    toggles.push(...parsed.toggles);
    if (parsed.pageBlock) notionPageBlocks.push(parsed.pageBlock);
  }

  return { blocks, toggles, notionPageBlocks };
}

async function traverseBlock(
  block: any,
  section: string,
): Promise<{ parsedBlocks: ParsedBlock[]; toggles: Faq[]; textParts: string[]; pageBlock?: NotionPageBlock }> {
  const parsed = parseBlockContent(block);
  const parsedBlocks: ParsedBlock[] = [{
    type: block.type,
    section,
    text: parsed.text,
    links: parsed.links,
    imageUrl: parsed.imageUrl,
  }];

  const toggles: Faq[] = [];
  const childrenText: string[] = [];
  const childPageBlocks: NotionPageBlock[] = [];
  if (block.has_children) {
    const nextSection =
      block.type === "heading_1" && parsed.text ? parsed.text : section;
    const children = await listAllBlockChildren(block.id);

    const childResults = await mapWithConcurrency(
      children,
      BLOCK_TRAVERSAL_CONCURRENCY,
      (child) => traverseBlock(child, nextSection),
    );

    for (const childResult of childResults) {
      childrenText.push(...childResult.textParts);
      parsedBlocks.push(...childResult.parsedBlocks);
      toggles.push(...childResult.toggles);
      if (childResult.pageBlock) childPageBlocks.push(childResult.pageBlock);
    }
  }

  const selfText = parsed.text ? [parsed.text] : [];

  if (block.type === "toggle" && parsed.text) {
    const answer = normalizeSpacing(childrenText.join(" "));
    toggles.push({
      question: parsed.text,
      answer: answer || undefined,
    });
  }

  return {
    parsedBlocks,
    toggles,
    textParts: [...selfText, ...childrenText],
    pageBlock: toNotionPageBlock(block, parsed, childPageBlocks),
  };
}

function toNotionPageBlock(
  block: any,
  parsed: { text: string; links: string[]; imageUrl?: string },
  children: NotionPageBlock[],
): NotionPageBlock | undefined {
  switch (block.type) {
    case "paragraph":
    case "heading_1":
    case "heading_2":
    case "heading_3":
    case "quote":
    case "bulleted_list_item":
    case "numbered_list_item":
    case "toggle":
    case "callout":
      if (!parsed.text && children.length === 0) return undefined;
      return {
        type: block.type,
        value: parsed.text || undefined,
        links: parsed.links.length > 0 ? parsed.links : undefined,
        children: children.length > 0 ? children : undefined,
      };
    case "to_do":
      if (!parsed.text && children.length === 0) return undefined;
      return {
        type: "bulleted_list_item",
        value: parsed.text || undefined,
        links: parsed.links.length > 0 ? parsed.links : undefined,
        children: children.length > 0 ? children : undefined,
      };
    case "code":
      if (!parsed.text && children.length === 0) return undefined;
      return {
        type: "quote",
        value: parsed.text || undefined,
        links: parsed.links.length > 0 ? parsed.links : undefined,
        children: children.length > 0 ? children : undefined,
      };
    case "table_row":
      if (!parsed.text && children.length === 0) return undefined;
      return {
        type: "paragraph",
        value: parsed.text || undefined,
        links: parsed.links.length > 0 ? parsed.links : undefined,
        children: children.length > 0 ? children : undefined,
      };
    case "child_page": {
      const title = normalizeSpacing(block?.child_page?.title ?? parsed.text);
      if (!title && children.length === 0) return undefined;
      return {
        type: "heading_3",
        value: title || undefined,
        children: children.length > 0 ? children : undefined,
      };
    }
    case "child_database": {
      const title = normalizeSpacing(block?.child_database?.title ?? parsed.text);
      if (!title && children.length === 0) return undefined;
      return {
        type: "heading_3",
        value: title || undefined,
        children: children.length > 0 ? children : undefined,
      };
    }
    case "embed": {
      const url = block?.embed?.url || parsed.text;
      if (!url) return undefined;
      return { type: "embed", url };
    }
    case "bookmark": {
      const url = block?.bookmark?.url || parsed.text;
      if (!url) return undefined;
      return { type: "bookmark", url };
    }
    case "image":
      if (!parsed.imageUrl) return undefined;
      return { type: "image", src: parsed.imageUrl };
    case "file":
    case "pdf":
    case "audio":
    case "video": {
      const url = extractFileLikeUrl(block?.[block.type]);
      if (!url) return undefined;
      return { type: "bookmark", url };
    }
    case "divider":
      return { type: "divider" };
    case "column":
      if (children.length === 0) return undefined;
      return { type: "column", children };
    case "column_list":
      if (children.length === 0) return undefined;
      return { type: "column_list", children };
    default:
      if (children.length === 1) return children[0];
      if (children.length > 1) return { type: "column", children };
      return undefined;
  }
}

function parseBlockContent(block: any): { text: string; links: string[]; imageUrl?: string } {
  switch (block.type) {
    case "paragraph":
    case "heading_1":
    case "heading_2":
    case "heading_3":
    case "code":
    case "quote":
    case "bulleted_list_item":
    case "numbered_list_item":
    case "toggle":
    case "callout": {
      const richText = block?.[block.type]?.rich_text ?? [];
      return parseRichText(richText);
    }
    case "to_do": {
      const richText = block?.to_do?.rich_text ?? [];
      const parsed = parseRichText(richText);
      const checked = Boolean(block?.to_do?.checked);
      return {
        text: parsed.text ? `${checked ? "☑" : "☐"} ${parsed.text}` : "",
        links: parsed.links,
      };
    }
    case "table_row": {
      const cells = Array.isArray(block?.table_row?.cells) ? block.table_row.cells : [];
      const pieces = cells
        .map((cell: any[]) => parseRichText(Array.isArray(cell) ? cell : []))
        .filter((part: { text: string }) => Boolean(part.text));
      return {
        text: pieces.map((part: { text: string }) => part.text).join(" | "),
        links: pieces.flatMap((part: { links: string[] }) => part.links),
      };
    }
    case "child_page": {
      const title = normalizeSpacing(block?.child_page?.title ?? "");
      return { text: title, links: [] };
    }
    case "child_database": {
      const title = normalizeSpacing(block?.child_database?.title ?? "");
      return { text: title, links: [] };
    }
    case "embed": {
      const url = block?.embed?.url ?? "";
      return { text: url, links: url ? [url] : [] };
    }
    case "bookmark": {
      const url = block?.bookmark?.url ?? "";
      return { text: url, links: url ? [url] : [] };
    }
    case "image": {
      const image = block?.image;
      const imageUrl =
        image?.type === "external" ? image?.external?.url : image?.file?.url;
      return { text: "", links: [], imageUrl };
    }
    case "file":
    case "pdf":
    case "audio":
    case "video": {
      const url = extractFileLikeUrl(block?.[block.type]) ?? "";
      return { text: url, links: url ? [url] : [] };
    }
    default:
      return parseUnknownTextBlock(block);
  }
}

function parseUnknownTextBlock(block: any): { text: string; links: string[] } {
  const data = block?.[block?.type];
  if (!data) return { text: "", links: [] };

  const richText = data?.rich_text;
  if (Array.isArray(richText)) return parseRichText(richText);

  const plainText = normalizeSpacing(String(data?.text ?? data?.title ?? data?.expression ?? ""));
  return { text: plainText, links: extractUrlsFromText(plainText) };
}

function extractFileLikeUrl(value: any): string | undefined {
  if (!value) return undefined;
  if (value?.external?.url) return value.external.url;
  if (value?.file?.url) return value.file.url;
  if (value?.url) return value.url;
  return undefined;
}

function parseRichText(richText: any[]): { text: string; links: string[] } {
  const text = normalizeSpacing(richText.map((part) => part?.plain_text ?? "").join(""));
  const links = richText
    .map((part) => part?.href ?? part?.text?.link?.url)
    .filter((value): value is string => Boolean(value));

  return { text, links };
}

async function listAllBlockChildren(blockId: string): Promise<any[]> {
  if (!notionClient) return [];

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const blocks: any[] = [];
      let cursor: string | undefined;

      do {
        const response = await notionClient.blocks.children.list({
          block_id: blockId,
          start_cursor: cursor,
          page_size: 100,
        });

        blocks.push(...response.results);
        cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
      } while (cursor);

      return blocks;
    } catch (error) {
      if (attempt === 4) throw error;
      await sleep(getNotionRetryDelayMs(error, attempt));
    }
  }

  return [];
}

function getNotionRetryDelayMs(error: unknown, attempt: number): number {
  const retryAfterHeader =
    (error as { headers?: Record<string, string | undefined> })?.headers?.["retry-after"] ||
    (error as { response?: { headers?: { get?: (name: string) => string | null } } })?.response?.headers?.get?.("retry-after");
  const retryAfterSeconds = Number(retryAfterHeader);
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
    return retryAfterSeconds * 1000;
  }

  const status = (error as { status?: number })?.status;
  const code = String((error as { code?: string })?.code || "");

  if (status === 429 || code === "rate_limited") {
    return 1000 * (attempt + 1);
  }

  if (status === 503 || status === 502 || status === 500 || code === "service_unavailable") {
    return 300 * 2 ** attempt;
  }

  return 250 * (attempt + 1);
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  const workers = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      results[index] = await mapper(items[index]);
    }
  });

  await Promise.all(workers);
  return results;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getAppSlugFromPage(page: NotionPage): string {
  const slugFromProperty = slugify(getRichText(page.properties.Slug));
  const slugFromName = slugify(getTitle(page.properties.Name));
  return slugFromProperty || slugFromName || page.id.replace(/-/g, "");
}

function isSoldPage(page: NotionPage): boolean {
  const status = getStatusName(page.properties["Hearing offers"]);
  return status.toLowerCase() === "sold";
}

function cleanHeadingMetric(value: string): string {
  return normalizeSpacing(value.replace(/^[^$€£\d]+/, ""));
}

function parseRatingFromText(value: string): number | undefined {
  const match = value.match(/([0-4](?:\.\d+)?|5(?:\.0+)?)/);
  if (!match) return undefined;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function extractUrlsFromText(value: string): string[] {
  return value.match(/https?:\/\/[^\s)]+/g) ?? [];
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function findFirstEmail(value: string): string {
  const match = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match?.[0] ?? "";
}

function findFirstPhone(value: string): string {
  const match = value.match(/\+\d[\d\s().-]{7,}\d/);
  return match?.[0]?.trim() ?? "";
}

function isNarrativeText(value: string): boolean {
  const text = normalizeSpacing(value);
  if (!text || text.length < 18) return false;
  if (/^https?:\/\//i.test(text)) return false;
  if (text.startsWith("↗")) return false;
  return true;
}

function inferChannelFromLine(
  line: string,
  index: number,
): { name: string; icon: string; metricStyle: "dark" | "light" } {
  const lower = line.toLowerCase();
  if (/(apple|asa|app store|ios)/.test(lower)) {
    return { name: "Apple Search Ads", icon: "/images/Icons/app-store.svg", metricStyle: "dark" };
  }
  if (/(google|play|admob|android)/.test(lower)) {
    return { name: "Google Ads", icon: "/images/Icons/google-play.svg", metricStyle: "light" };
  }
  if (/instagram/.test(lower)) {
    return { name: "Instagram", icon: "/images/Icons/instagram.svg", metricStyle: "light" };
  }
  if (/(meta|facebook)/.test(lower)) {
    return { name: "Meta Ads", icon: "/images/Icons/meta-ads.svg", metricStyle: "light" };
  }
  if (/tiktok/.test(lower)) {
    return { name: "TikTok Ads", icon: "/images/Icons/tiktok.svg", metricStyle: "dark" };
  }

  return {
    name: `Channel ${index + 1}`,
    icon: "/images/Icons/meta-ads.svg",
    metricStyle: "light",
  };
}

function inferMetricFromLine(line: string): string {
  const normalized = normalizeSpacing(line);
  const match = normalized.match(
    /(\\d+(?:\\.\\d+)?x\\s*ROAS|\\$\\d+(?:\\.\\d+)?\\s*CPI|\\d+(?:\\.\\d+)?%[^,.]*)/i,
  );
  if (match) return match[1];
  if (/profitable/i.test(normalized)) return "Profitable";
  if (/nda|sign nda/i.test(normalized)) return "Metrics (NDA)";
  return normalized.length > 36 ? `${normalized.slice(0, 33)}...` : normalized;
}

function buildNotionDetailBlocks(blocks: ParsedBlock[]): NotionDetailBlock[] {
  const detailBlocks: NotionDetailBlock[] = [];
  let inAcquisitionSection = false;
  const startPattern = /(acquisition|main geos|user growth|channels?)/i;
  const stopPattern = /(opportunit|faq|have more questions)/i;

  for (const block of blocks) {
    const text = normalizeSpacing(block.text);
    const section = block.section.toLowerCase();
    const isHeading = block.type.startsWith("heading_");
    const startsSection = startPattern.test(text) || startPattern.test(section);
    const stopsSection = stopPattern.test(text);

    if (isHeading && startsSection) {
      inAcquisitionSection = true;
    }

    if (!inAcquisitionSection) continue;

    if (isHeading && stopsSection) {
      break;
    }

    if (block.type.startsWith("heading_") && text) {
      detailBlocks.push({ type: "heading", value: text });
      continue;
    }

    if (block.type === "divider") {
      detailBlocks.push({ type: "divider" });
      continue;
    }

    if (block.type === "image" && block.imageUrl) {
      detailBlocks.push({ type: "image", src: block.imageUrl });
      continue;
    }

    if (["quote", "callout"].includes(block.type) && text) {
      detailBlocks.push({ type: "quote", value: text });
      continue;
    }

    if (
      ["paragraph", "bulleted_list_item", "numbered_list_item"].includes(block.type) &&
      text &&
      text !== "/"
    ) {
      detailBlocks.push({ type: "text", value: text });
    }
  }

  return compactDetailBlocks(detailBlocks);
}

function compactDetailBlocks(blocks: NotionDetailBlock[]): NotionDetailBlock[] {
  const compacted: NotionDetailBlock[] = [];

  for (const block of blocks) {
    const previous = compacted[compacted.length - 1];
    if (!previous) {
      compacted.push(block);
      continue;
    }

    if (block.type === "divider" && previous.type === "divider") continue;
    if (
      block.type === previous.type &&
      block.value &&
      previous.value &&
      block.value === previous.value
    ) {
      continue;
    }
    if (
      block.type === "image" &&
      previous.type === "image" &&
      block.src &&
      previous.src &&
      block.src === previous.src
    ) {
      continue;
    }

    compacted.push(block);
  }

  return compacted;
}

function getTitle(prop?: NotionProperty): string {
  if (!prop || prop.type !== "title") return "";
  return prop.title.map((part) => part.plain_text).join("").trim();
}

function getRichText(prop?: NotionProperty): string {
  if (!prop) return "";
  if (prop.type === "rich_text") {
    return prop.rich_text.map((part) => part.plain_text).join("").trim();
  }
  if (prop.type === "title") {
    return prop.title.map((part) => part.plain_text).join("").trim();
  }
  if (prop.type === "select") {
    return prop.select?.name ?? "";
  }
  return "";
}

function getFileUrl(prop?: NotionProperty): string | undefined {
  if (!prop || prop.type !== "files") return undefined;
  const file = prop.files[0];
  if (!file) return undefined;
  if ("external" in file) return file.external.url;
  if ("file" in file) return file.file.url;
  return undefined;
}

function getUrl(prop?: NotionProperty): string | undefined {
  if (!prop || prop.type !== "url") return undefined;
  return prop.url ?? undefined;
}

function getNumber(prop?: NotionProperty): number | undefined {
  if (!prop || prop.type !== "number") return undefined;
  return typeof prop.number === "number" ? prop.number : undefined;
}

function getCheckbox(prop?: NotionProperty): boolean | undefined {
  if (!prop || prop.type !== "checkbox") return undefined;
  return prop.checkbox;
}

function getStatusName(prop?: NotionProperty): string {
  if (!prop || prop.type !== "status") return "";
  return prop.status?.name ?? "";
}

function getMultiSelectNames(prop?: NotionProperty): string[] {
  if (!prop) return [];
  if (prop.type === "multi_select") {
    return prop.multi_select.map((option) => option.name).filter(Boolean);
  }
  if (prop.type === "select" && prop.select?.name) {
    return [prop.select.name];
  }
  return [];
}

function getPageIconUrl(page: NotionPage): string | undefined {
  const icon = page.icon;
  if (!icon) return undefined;
  if (icon.type === "file") return icon.file.url;
  if (icon.type === "external") return icon.external.url;
  const maybeCustomEmoji = icon as { type?: string; custom_emoji?: { url?: string } };
  if (maybeCustomEmoji.type === "custom_emoji" && maybeCustomEmoji.custom_emoji?.url) {
    return maybeCustomEmoji.custom_emoji.url;
  }
  return undefined;
}

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function normalizeSpacing(value: string): string {
  return value.replace(/\u00A0/g, " ").replace(/\s+/g, " ").trim();
}

function parseMrrForCard(rawValue: string): string {
  const normalized = normalizeSpacing(rawValue);
  const match = normalized.match(/(\d+(?:\.\d+)?\s*[kKmM]?)/);
  if (!match) return "";
  return match[1].replace(/\s+/g, "").toUpperCase();
}

function parsePlatform(rawValues: string[]): { platform: string; platformEmoji: string } {
  const values = rawValues.map(normalizeSpacing);
  const hasIOS = values.some((value) => value.toLowerCase().includes("ios"));
  const hasAndroid = values.some((value) => value.toLowerCase().includes("android"));
  const hasWeb = values.some((value) => /\bweb\b/i.test(value));

  if (hasIOS && hasAndroid) return { platform: "iOS + Android", platformEmoji: "📱" };
  if (hasIOS) return { platform: "iOS", platformEmoji: "🔵" };
  if (hasAndroid) return { platform: "Android", platformEmoji: "🟢" };
  if (hasWeb) return { platform: "Web", platformEmoji: "💻" };

  if (values.length > 0) {
    const label = values
      .map((value) => value.replace(/^[^A-Za-z0-9]+/, "").trim())
      .filter(Boolean)
      .join(" + ");

    if (label) return { platform: label, platformEmoji: "📱" };
  }

  return {
    platform: "iOS",
    platformEmoji: "📱",
  };
}

function deriveSubtitle(name: string): string {
  const separatorMatch = name.match(/[:\-·](.+)$/);
  if (separatorMatch && separatorMatch[1]) return separatorMatch[1].trim();
  return "";
}

function parseMultiline(value: string): string[] | null {
  if (!value.trim()) return null;
  const parts = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : null;
}

function parsePaidChannels(json: string): PaidChannel[] | null {
  if (!json.trim()) return null;
  try {
    const parsed = JSON.parse(json) as Array<{
      name?: string;
      subtitle?: string;
      icon?: string;
      metric?: string;
      metricStyle?: string;
      link?: string;
    }>;

    const channels: PaidChannel[] = parsed
      .map((item): PaidChannel => ({
        name: item.name?.trim() || "",
        subtitle: item.subtitle?.trim() || "Paid",
        icon: item.icon?.trim() || "/images/Icons/meta-ads.svg",
        metric: item.metric?.trim() || "N/A",
        metricStyle: item.metricStyle === "dark" ? "dark" : "light",
        link: item.link?.trim() || undefined,
      }))
      .filter((channel) => Boolean(channel.name));

    return channels.length > 0 ? channels : null;
  } catch {
    return null;
  }
}

function parseOrganicChannels(json: string): OrganicChannel[] | null {
  if (!json.trim()) return null;
  try {
    const parsed = JSON.parse(json) as Array<{
      name?: string;
      subtitle?: string;
      icon?: string;
      metric?: string;
      link?: string;
    }>;

    const channels: OrganicChannel[] = parsed
      .map((item): OrganicChannel => ({
        name: item.name?.trim() || "",
        subtitle: item.subtitle?.trim() || "",
        icon: item.icon?.trim() || "/images/Icons/app-store.svg",
        metric: item.metric?.trim() || "N/A",
        link: item.link?.trim() || undefined,
      }))
      .filter((channel) => Boolean(channel.name));

    return channels.length > 0 ? channels : null;
  } catch {
    return null;
  }
}

function parseFaqs(json: string): Faq[] | null {
  if (!json.trim()) return null;
  try {
    const parsed = JSON.parse(json) as Array<{ question?: string; answer?: string }>;
    const faqs = parsed
      .map((item) => ({
        question: item.question?.trim() || "",
        answer: item.answer?.trim() || undefined,
      }))
      .filter((faq) => Boolean(faq.question));
    return faqs.length > 0 ? faqs : null;
  } catch {
    return null;
  }
}

export async function getApps(): Promise<App[]> {
  return getNotionApps();
}

async function findNotionPageBySlug(slug: string): Promise<NotionPage | undefined> {
  if (notionClient && notionAppsDbId) {
    try {
      const { slugPropertyType, filterPropertyIds } = await getNotionDatabaseConfig();
      const slugFilter =
        slugPropertyType === "title"
          ? {
              property: "Slug",
              title: {
                equals: slug,
              },
            }
          : slugPropertyType === "rich_text"
            ? {
                property: "Slug",
                rich_text: {
                  equals: slug,
                },
              }
            : null;

      if (slugFilter) {
        const response = await notionClient.databases.query({
          database_id: notionAppsDbId,
          page_size: 5,
          ...(filterPropertyIds.length > 0 ? { filter_properties: filterPropertyIds } : {}),
          filter: slugFilter,
        });

        const firstMatch = response.results.find((candidate) => isFullPage(candidate));
        if (firstMatch && !isSoldPage(firstMatch)) return firstMatch;
      }
    } catch {
      // Fall back to full-list scan below when direct slug filtering isn't available.
    }
  }

  const pages = await getNotionPages();
  return pages.find(
    (candidate) => !isSoldPage(candidate) && getAppSlugFromPage(candidate) === slug,
  );
}

export async function getAppBySlug(slug: string): Promise<App | undefined> {
  const cached = appDetailCache.get(slug);
  if (isFresh(cached)) return cached.value;

  if (isFresh(appSummariesCache)) {
    const fromSummaryCache = appSummariesCache.value.find((candidate) => candidate.slug === slug);
    if (fromSummaryCache) {
      appDetailCache.set(slug, {
        value: fromSummaryCache,
        expiresAt: Date.now() + APP_SUMMARIES_TTL_MS,
      });
      return fromSummaryCache;
    }
  }

  const page = await findNotionPageBySlug(slug);

  if (!page) {
    appDetailCache.set(slug, {
      value: undefined,
      expiresAt: Date.now() + 30 * 1000,
    });
    return undefined;
  }

  const baseApp = mapNotionPageToAppSummary(page);
  if (!baseApp) {
    appDetailCache.set(slug, {
      value: undefined,
      expiresAt: Date.now() + 30 * 1000,
    });
    return undefined;
  }

  appDetailCache.set(slug, {
    value: baseApp,
    expiresAt: Date.now() + APP_SUMMARIES_TTL_MS,
  });

  return baseApp;
}

export async function getAppParsedContentByPageId(pageId: string): Promise<ParsedAppContent> {
  return getParsedNotionAppContent(pageId);
}

export async function getAppSlugs(): Promise<string[]> {
  const allApps = await getApps();
  return allApps.map((app) => app.slug);
}

export async function getFeaturedApps(): Promise<App[]> {
  const allApps = await getApps();
  const featuredApps = allApps.filter((app) => app.featured);
  return featuredApps.length > 0 ? featuredApps : allApps.slice(0, 6);
}

export async function getAppCategories(): Promise<string[]> {
  const allApps = await getApps();
  const uniqueCategories = [...new Set(allApps.map((app) => app.category).filter(Boolean))];
  return ["All", ...uniqueCategories];
}

export async function getArticles(): Promise<Article[]> {
  return staticArticles;
}

export async function getArticleBySlug(slug: string): Promise<Article | undefined> {
  const allArticles = await getArticles();
  return allArticles.find((article) => article.slug === slug);
}

export async function getArticleSlugs(): Promise<string[]> {
  const allArticles = await getArticles();
  return allArticles.map((article) => article.slug);
}
