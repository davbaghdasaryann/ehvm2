import path from "node:path";

export const UPLOAD_URL_PREFIX = "/uploads";

export function getUploadRoot(): string {
  const configured = process.env.EHVM_UPLOAD_DIR?.trim();
  if (configured) {
    return path.resolve(configured);
  }

  return path.join(process.cwd(), "uploads");
}

export function getUploadPath(parts: string[]): string | null {
  const root = getUploadRoot();
  const target = path.resolve(root, ...parts);
  const relative = path.relative(root, target);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return null;
  }

  return target;
}

export function getUploadUrl(parts: string[]): string {
  return `${UPLOAD_URL_PREFIX}/${parts.map(encodeURIComponent).join("/")}`;
}
