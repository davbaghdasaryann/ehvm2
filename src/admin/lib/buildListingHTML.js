// Plain JS helper - no JSX, no template literal nesting issues
// Called from PreviewPanel to generate the full listing HTML

function h(strings) {
  return strings || ''
}

function section(condition, label, title, content) {
  if (!condition) return ''
  return [
    '<div style="margin-top:52px;">',
    '<div style="font-family:-apple-system,sans-serif;font-size:10px;font-weight:700;color:#aaa;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:10px;">' + label + '</div>',
    '<h2 style="font-size:clamp(20px,3vw,28px);letter-spacing:-0.5px;color:#111;margin-bottom:20px;">' + title + '</h2>',
    content,
    '</div>',
    '<div style="height:1px;background:linear-gradient(90deg,transparent,rgba(0,0,0,0.1),transparent);margin:40px 0;"></div>',
  ].join('')
}

function glass(content, extra) {
  extra = extra || ''
  return '<div style="background:linear-gradient(145deg,rgba(255,255,255,0.42),rgba(255,255,255,0.18));border:1px solid rgba(255,255,255,0.62);box-shadow:inset 0 1px 1px rgba(255,255,255,0.88),0 4px 24px rgba(0,0,0,0.08);border-radius:18px;padding:22px;' + extra + '">' + content + '</div>'
}

function kpiCard(k) {
  return glass(
    '<div style="font-size:10px;font-weight:600;color:#888;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:6px;">' + h(k.label) + '</div>' +
    '<div style="font-family:Georgia,serif;font-size:30px;font-weight:700;color:#111;line-height:1;">' + h(k.value) + '</div>' +
    (k.trend ? '<div style="display:inline-flex;align-items:center;background:#e8f5ee;color:#2d7a4f;border-radius:50px;padding:2px 8px;font-size:10px;font-weight:700;margin-top:6px;">' + k.trend + '</div>' : '') +
    (k.sub ? '<div style="font-size:11px;color:#888;margin-top:4px;">' + k.sub + '</div>' : '')
  )
}

function buildListingHTMLHelper(app) {
  var m = app.meta || {}
  var fin = app.financials || {}
  var prod = app.product || {}
  var mkt = app.market || {}
  var con = app.contact || {}
  var media = app.media || {}

  var kpisHTML = (app.kpis || []).map(kpiCard).join('')
  var tagsHTML = (m.tags || []).map(function(t) {
    return '<span style="display:inline-flex;align-items:center;background:rgba(255,255,255,0.45);border:1px solid rgba(255,255,255,0.65);border-radius:50px;padding:4px 12px;font-size:11px;font-weight:600;color:#444;">' + t + '</span>'
  }).join('')

  var chartsHTML = (app.charts || []).map(function(chart, i) {
    return glass(
      '<div style="font-size:13px;font-weight:700;color:#111;margin-bottom:4px;">' + h(chart.title) + '</div>' +
      '<div style="font-size:11px;color:#888;margin-bottom:14px;">' + h(chart.subtitle) + '</div>' +
      '<div style="position:relative;height:200px;"><canvas id="pc_' + i + '"></canvas></div>'
    )
  }).join('')

  var plRowsHTML = (fin.plRows || []).map(function(r) {
    var hl = r.highlight ? 'background:rgba(255,255,255,0.3);' : ''
    return '<tr style="' + hl + '">' +
      '<td style="padding:11px 14px;border-bottom:1px solid rgba(0,0,0,0.04);color:#222;">' + (r.highlight ? '<strong>' + r.label + '</strong>' : r.label) + '</td>' +
      '<td style="padding:11px 14px;border-bottom:1px solid rgba(0,0,0,0.04);font-weight:700;font-size:14px;">' + h(r.amount) + '</td>' +
      '<td style="padding:11px 14px;border-bottom:1px solid rgba(0,0,0,0.04);color:' + (r.trend && r.trend[0] === String.fromCharCode(8593) ? '#2d7a4f' : '#888') + ';">' + h(r.trend) + '</td>' +
      '<td style="padding:11px 14px;border-bottom:1px solid rgba(0,0,0,0.04);color:#888;">' + h(r.notes) + '</td>' +
      '</tr>'
  }).join('')

  var funnelHTML = (app.funnel || []).map(function(step, i, arr) {
    var pct = parseFloat(step.pct) || (100 - i * 15)
    return '<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">' +
      '<div style="font-size:11px;color:#666;width:110px;text-align:right;flex-shrink:0;">' + h(step.label) + '</div>' +
      '<div style="flex:1;height:34px;background:rgba(0,0,0,0.06);border-radius:8px;overflow:hidden;">' +
      '<div style="width:' + pct + '%;height:100%;border-radius:8px;background:linear-gradient(90deg,rgba(255,255,255,0.6),rgba(255,255,255,0.3));border:1px solid rgba(255,255,255,0.7);display:flex;align-items:center;padding-left:12px;font-size:12px;font-weight:700;color:#111;">' + h(step.value) + '</div>' +
      '</div>' +
      '<div style="font-size:11px;font-weight:700;color:' + (i === arr.length - 1 ? '#2d7a4f' : '#111') + ';width:40px;flex-shrink:0;">' + h(step.pct) + '</div>' +
      '</div>'
  }).join('')

  var dotColors = { done: '#2d7a4f', progress: '#f0a020', planned: '#ccc' }
  var dotBg = { done: '#e8f5ee', progress: '#fff3e0', planned: 'rgba(0,0,0,0.06)' }
  var dotLabel = { done: 'Shipped', progress: 'In Progress', planned: 'Planned' }
  var roadmapHTML = (prod.roadmap || []).map(function(item) {
    var s = item.status || 'done'
    return '<div style="display:flex;gap:16px;padding:14px 0;border-bottom:1px solid rgba(0,0,0,0.06);">' +
      '<div style="display:flex;flex-direction:column;align-items:center;padding-top:3px;"><div style="width:12px;height:12px;border-radius:50%;background:' + (dotColors[s] || '#ccc') + ';flex-shrink:0;"></div></div>' +
      '<div><div style="display:inline-block;font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:2px 8px;border-radius:50px;margin-bottom:4px;background:' + (dotBg[s] || 'rgba(0,0,0,0.06)') + ';color:' + (dotColors[s] || '#888') + ';">' + (dotLabel[s] || s) + '</div>' +
      '<div style="font-size:13px;font-weight:700;color:#111;">' + h(item.title) + '</div>' +
      '<div style="font-size:11px;color:#888;margin-top:2px;line-height:1.5;">' + h(item.description) + '</div></div></div>'
  }).join('')

  var competitorsHTML = (mkt.competitors || []).map(function(c) {
    var bg = c.isThisApp ? 'rgba(45,122,79,0.15)' : 'rgba(255,255,255,0.5)'
    var border = c.isThisApp ? 'rgba(45,122,79,0.3)' : 'rgba(255,255,255,0.7)'
    return '<div style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid rgba(0,0,0,0.05);">' +
      '<div style="width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;background:' + bg + ';border:1px solid ' + border + ';flex-shrink:0;">' + h(c.icon) + '</div>' +
      '<div><div style="font-size:13px;font-weight:700;">' + h(c.name) + (c.isThisApp ? ' <span style="font-size:10px;color:#2d7a4f;font-weight:600;background:#e8f5ee;padding:2px 7px;border-radius:50px;margin-left:6px;">\u2190 This listing</span>' : '') + '</div>' +
      '<div style="font-size:11px;color:#888;margin-top:1px;">' + h(c.description) + '</div></div>' +
      '<div style="margin-left:auto;font-size:12px;font-weight:700;background:rgba(255,255,255,0.5);border:1px solid rgba(255,255,255,0.7);border-radius:50px;padding:3px 10px;flex-shrink:0;">' + h(c.rating) + '</div>' +
      '</div>'
  }).join('')

  var keywordsHTML = (mkt.keywords || []).map(function(k) {
    var rank = parseFloat(k.rank)
    var rankColor = rank <= 5 ? '#2d7a4f' : '#f0a020'
    return '<div style="display:flex;align-items:center;gap:10px;padding:9px 14px;border-bottom:1px solid rgba(0,0,0,0.05);">' +
      '<div style="font-size:12px;font-weight:600;flex:1;">' + h(k.keyword) + '</div>' +
      '<div style="font-size:11px;color:#888;width:48px;text-align:right;">' + h(k.volume) + '</div>' +
      '<div style="font-size:11px;font-weight:700;width:36px;text-align:right;color:' + rankColor + ';">' + h(k.rank) + '</div></div>'
  }).join('')

  var oppsHTML = (app.opportunities || []).map(function(o) {
    return '<div style="display:flex;align-items:flex-start;gap:12px;padding:14px 0;border-bottom:1px solid rgba(0,0,0,0.05);">' +
      '<div style="font-size:18px;flex-shrink:0;margin-top:1px;">' + h(o.icon) + '</div>' +
      '<div><div style="font-size:13px;font-weight:700;color:#111;">' + h(o.title) + '</div>' +
      '<div style="font-size:11px;color:#777;margin-top:2px;line-height:1.5;">' + h(o.description) + '</div></div></div>'
  }).join('')

  var stepsHTML = (con.processSteps || []).map(function(s, i) {
    return '<div style="display:flex;align-items:flex-start;gap:16px;padding:18px 0;border-bottom:1px solid rgba(0,0,0,0.05);">' +
      '<div style="width:32px;height:32px;border-radius:50%;background:#1a1a1a;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;">' + (i + 1) + '</div>' +
      '<div><div style="font-size:14px;font-weight:700;color:#111;">' + h(s.title) + (s.note ? ' <span style="font-size:10px;color:#888;font-weight:400;">\u00b7 ' + s.note + '</span>' : '') + '</div>' +
      '<div style="font-size:12px;color:#666;line-height:1.5;margin-top:3px;">' + h(s.description) + '</div></div></div>'
  }).join('')

  var marketCirclesHTML = ''
  if (mkt.tam || mkt.sam || mkt.som) {
    var labelsCol = ''
    if (mkt.tam) labelsCol += '<div style="display:flex;flex-direction:column;gap:2px;"><span style="display:inline-block;font-size:8px;font-weight:700;letter-spacing:0.1em;color:#999;background:rgba(0,0,0,0.06);border-radius:4px;padding:1px 6px;">TAM</span><span style="font-family:Georgia,serif;font-size:16px;font-weight:700;color:#111;">' + mkt.tam + '</span><span style="font-size:9px;color:#aaa;">' + (mkt.tamLabel || '') + '</span></div>'
    if (mkt.sam) labelsCol += '<div style="display:flex;flex-direction:column;gap:2px;"><span style="display:inline-block;font-size:8px;font-weight:700;letter-spacing:0.1em;color:#999;background:rgba(0,0,0,0.06);border-radius:4px;padding:1px 6px;">SAM</span><span style="font-family:Georgia,serif;font-size:14px;font-weight:700;color:#111;">' + mkt.sam + '</span><span style="font-size:9px;color:#aaa;">' + (mkt.samLabel || '') + '</span></div>'
    if (mkt.som) labelsCol += '<div style="display:flex;flex-direction:column;gap:2px;"><span style="display:inline-block;font-size:8px;font-weight:700;letter-spacing:0.1em;color:#2d7a4f;background:rgba(45,122,79,0.12);border-radius:4px;padding:1px 6px;">SOM</span><span style="font-family:Georgia,serif;font-size:12px;font-weight:700;color:#2d7a4f;">' + mkt.som + '</span></div>'
    var circlesCol = '<div style="position:relative;width:220px;height:220px;flex-shrink:0;">' +
      '<div style="border-radius:50%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:220px;height:220px;background:rgba(0,0,0,0.045);border:1px solid rgba(255,255,255,0.55);"></div>' +
      '<div style="border-radius:50%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:148px;height:148px;background:rgba(0,0,0,0.05);border:1px solid rgba(255,255,255,0.5);"></div>' +
      '<div style="border-radius:50%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:76px;height:76px;background:rgba(45,122,79,0.14);border:1px solid rgba(45,122,79,0.28);"></div></div>'
    marketCirclesHTML = glass(
      '<div style="font-size:13px;font-weight:700;color:#111;margin-bottom:4px;">Total Addressable Market</div>' +
      '<div style="font-size:11px;color:#888;margin-bottom:14px;">Global fitness app market sizing \u00b7 ' + (mkt.year || '') + '</div>' +
      '<div style="display:flex;align-items:center;justify-content:center;gap:32px;padding:24px 0 20px;">' +
      '<div style="display:flex;flex-direction:column;gap:20px;flex-shrink:0;">' + labelsCol + '</div>' +
      circlesCol + '</div>',
      'margin-bottom:12px;'
    )
  }

  var iconHTML = media.icon ? '<img src="' + media.icon + '" style="width:56px;height:56px;border-radius:14px;border:2px solid rgba(255,255,255,0.6);object-fit:cover;flex-shrink:0;" onerror="this.style.display=\'none\'">' : ''
  var coverHTML = media.cover ? '<div style="width:100%;height:240px;overflow:hidden;border-radius:16px;margin-bottom:16px;"><img src="' + media.cover + '" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display=\'none\'"></div>' : ''
  var screenshotsHTML = ''
  if ((media.screenshots || []).length) {
    screenshotsHTML = '<div style="display:flex;gap:10px;overflow-x:auto;padding-bottom:8px;margin-top:12px;">' +
      (media.screenshots || []).map(function(s) {
        return '<div style="flex-shrink:0;"><img src="' + s.url + '" style="height:160px;border-radius:10px;border:1px solid rgba(255,255,255,0.4);" onerror="this.style.display=\'none\'">' +
          (s.caption ? '<div style="font-size:10px;color:#888;text-align:center;margin-top:4px;">' + s.caption + '</div>' : '') + '</div>'
      }).join('') + '</div>'
  }

  var finSummaryHTML = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:12px;">' +
    (fin.mrr ? glass('<div style="font-size:10px;font-weight:600;color:#888;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:6px;">MRR</div><div style="font-family:Georgia,serif;font-size:24px;font-weight:700;color:#111;">' + fin.mrr + '</div>' + (fin.yoyGrowth ? '<div style="display:inline-flex;background:#e8f5ee;color:#2d7a4f;border-radius:50px;padding:2px 8px;font-size:10px;font-weight:700;margin-top:6px;">\u2191 ' + fin.yoyGrowth + ' YoY</div>' : ''), 'padding:20px 18px;') : '') +
    (fin.arr ? glass('<div style="font-size:10px;font-weight:600;color:#888;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:6px;">ARR</div><div style="font-family:Georgia,serif;font-size:24px;font-weight:700;color:#111;">' + fin.arr + '</div>', 'padding:20px 18px;') : '') +
    (fin.ltvCac ? glass('<div style="font-size:10px;font-weight:600;color:#888;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:6px;">LTV : CAC</div><div style="font-family:Georgia,serif;font-size:24px;font-weight:700;color:#111;">' + fin.ltvCac + '</div>', 'padding:20px 18px;') : '') +
    '</div>'

  var chartScript = (app.charts || []).map(function(chart, i) {
    var type = chart.type === 'horizontalBar' ? 'bar' : chart.type
    var indexAxis = chart.type === 'horizontalBar' ? 'y' : 'x'
    var labels = Array.isArray(chart.labels) ? chart.labels : String(chart.labels).split(',').map(function(l) { return l.trim() })
    var datasets = chart.datasets.map(function(ds) {
      var data = Array.isArray(ds.data) ? ds.data : String(ds.data).split(',').map(function(d) { return parseFloat(d.trim()) }).filter(function(n) { return !isNaN(n) })
      var color = ds.color || '#1a1a1a'
      function rgba(hex, a) {
        try { var r = parseInt(hex.slice(1,3),16)||26, g = parseInt(hex.slice(3,5),16)||26, b = parseInt(hex.slice(5,7),16)||26; return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')' } catch(e) { return 'rgba(26,26,26,' + a + ')' }
      }
      var bg = type === 'line' ? '"' + rgba(color, 0.08) + '"' : (type === 'doughnut' || type === 'pie') ? '["rgba(26,26,26,0.7)","rgba(26,26,26,0.58)","rgba(26,26,26,0.46)","rgba(26,26,26,0.34)","rgba(26,26,26,0.22)","rgba(26,26,26,0.1)"]' : '"' + rgba(color, 0.2) + '"'
      return '{label:"' + ds.label + '",data:' + JSON.stringify(data) + ',borderColor:"' + color + '",backgroundColor:' + bg + ',borderWidth:' + (type === 'line' ? 2 : 1) + ',borderRadius:' + (type === 'bar' ? 4 : 0) + ',pointRadius:' + (type === 'line' ? 3 : 0) + ',fill:' + (type === 'line') + ',tension:0.4}'
    }).join(',')
    var scales = (type === 'doughnut' || type === 'pie') ? '{}' : '{x:{grid:{display:false},border:{display:false}},y:{grid:{color:"rgba(0,0,0,0.05)"},border:{display:false}}}'
    var cutout = type === 'doughnut' ? '"60%"' : 'undefined'
    return '(function(){var c=document.getElementById("pc_' + i + '");if(!c)return;new Chart(c,{type:"' + type + '",data:{labels:' + JSON.stringify(labels) + ',datasets:[' + datasets + ']},options:{indexAxis:"' + indexAxis + '",responsive:true,maintainAspectRatio:false,plugins:{legend:{display:' + (chart.datasets.length > 1) + ',position:"top",labels:{boxWidth:10,padding:12,font:{size:10}}}},scales:' + scales + ',cutout:' + cutout + '}});})()'
  }).join(';')

  var ndaBtn = con.ndaUrl ? '<div style="padding:12px 4px 4px;"><button onclick="window.open(\'' + con.ndaUrl + '\',\'_blank\')" style="display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:16px 36px;border-radius:50px;border:none;cursor:pointer;font-size:15px;font-weight:700;color:#1a1a1a;background:linear-gradient(145deg,rgba(255,255,255,0.75),rgba(255,255,255,0.35));backdrop-filter:blur(24px);box-shadow:0 0 0 1.5px rgba(255,255,255,0.72),inset 0 2px 3px rgba(255,255,255,0.92),0 8px 28px rgba(0,0,0,0.1);">\u270d\ufe0f &nbsp; Sign NDA to Access Full Data Room</button></div>' : ''

  var pocHTML = ''
  if (con.name) {
    var pocBtns = ''
    if (con.calendarUrl) pocBtns += '<button onclick="window.open(\'' + con.calendarUrl + '\',\'_blank\')" style="font-size:12px;font-weight:600;padding:7px 16px;border-radius:50px;border:none;cursor:pointer;background:#1a1a1a;color:#fff;">\ud83d\udcc5 Book a Call</button>'
    if (con.email) pocBtns += '<button onclick="window.location.href=\'mailto:' + con.email + '\'" style="font-size:12px;font-weight:600;padding:7px 16px;border-radius:50px;border:none;cursor:pointer;background:rgba(255,255,255,0.5);border:1px solid rgba(255,255,255,0.7);color:#111;">\u2709\ufe0f Send Email</button>'
    if (con.ndaUrl) pocBtns += '<button onclick="window.open(\'' + con.ndaUrl + '\',\'_blank\')" style="font-size:12px;font-weight:600;padding:7px 16px;border-radius:50px;border:none;cursor:pointer;background:rgba(255,255,255,0.5);border:1px solid rgba(255,255,255,0.7);color:#111;">\u270d\ufe0f Sign NDA</button>'
    pocHTML = section(true, 'Contact', 'Your Point of Contact',
      glass(
        '<div style="display:flex;align-items:center;gap:20px;">' +
        '<div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#ccc,#aaa);display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0;border:2px solid rgba(255,255,255,0.7);">\ud83d\udc69\u200d\ud83d\udcbc</div>' +
        '<div><div style="font-size:20px;font-weight:700;margin-bottom:4px;">' + con.name + '</div>' +
        (con.title ? '<div style="font-size:12px;color:#666;">' + con.title + '</div>' : '') +
        (con.email ? '<div style="font-size:12px;color:#666;margin-top:4px;">\u2709\ufe0f ' + con.email + (con.phone ? ' &nbsp;\u00b7&nbsp; \ud83d\udcde ' + con.phone : '') + '</div>' : '') +
        '<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">' + pocBtns + '</div></div></div>',
        'padding:28px;'
      )
    )
  }

  var year = new Date().getFullYear()

  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"><\/script></head><body style="margin:0;background:#d4d4d4;font-family:-apple-system,sans-serif;">' +
    '<div style="background:#d4d4d4;font-family:Georgia,serif;color:#111;min-height:100vh;padding-bottom:60px;">' +
    '<div style="position:sticky;top:0;z-index:10;padding:16px 24px 0;max-width:900px;margin:0 auto;"><div style="display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.5);backdrop-filter:blur(16px);border-radius:50px;padding:10px 10px 10px 20px;border:1px solid rgba(255,255,255,0.75);box-shadow:0 2px 16px rgba(0,0,0,0.08);"><div style="font-family:-apple-system,sans-serif;font-size:13px;font-weight:700;">EHVM <span style="color:#888;font-weight:400;">/ M&amp;A Advisory</span></div><div style="display:flex;gap:8px;align-items:center;"><span style="font-size:11px;color:#888;">Active Listing</span><button style="background:#1a1a1a;color:#fff;border:none;border-radius:50px;padding:9px 20px;font-size:13px;font-weight:600;cursor:pointer;">Sign NDA \u2197</button></div></div></div>' +
    '<div style="max-width:900px;margin:0 auto;padding:0 24px 80px;">' +
    '<div style="padding:48px 0 32px;"><div style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.5);border:1px solid rgba(255,255,255,0.7);border-radius:50px;padding:5px 14px;font-family:-apple-system,sans-serif;font-size:11px;font-weight:600;color:#555;letter-spacing:0.05em;text-transform:uppercase;margin-bottom:12px;"><span style="width:6px;height:6px;border-radius:50%;background:#2d7a4f;display:inline-block;"></span> ' + (m.badge || 'Acquisition Opportunity') + '</div>' +
    '<h1 style="font-size:clamp(34px,5vw,54px);line-height:1.05;letter-spacing:-1.5px;color:#0f0f0f;display:flex;align-items:center;gap:16px;flex-wrap:wrap;">' + iconHTML + (m.name || 'App Name') + '<br><span style="color:#555;font-weight:400;">' + (m.tagline || '') + '</span></h1>' +
    '<p style="font-family:-apple-system,sans-serif;font-size:15px;color:#555;line-height:1.6;max-width:620px;margin-top:8px;">' + (m.description || '') + '</p>' +
    '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:12px;">' + tagsHTML + '</div></div>' +
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin:24px 0;">' + kpisHTML + '</div>' +
    coverHTML + screenshotsHTML +
    '<div style="height:1px;background:linear-gradient(90deg,transparent,rgba(0,0,0,0.1),transparent);margin:40px 0;"></div>' +
    section((app.charts || []).length > 0, 'Company', 'Business Overview', '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;">' + chartsHTML + '</div>') +
    section(!!(fin.mrr || (fin.plRows || []).length), 'Financials', 'Financial Snapshot',
      finSummaryHTML +
      ((fin.plRows || []).length ? glass('<div style="font-size:13px;font-weight:700;margin-bottom:4px;">TTM Financial Summary</div><div style="font-size:11px;color:#888;margin-bottom:14px;">Trailing twelve months \u00b7 All figures USD</div><table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr><th style="text-align:left;padding:10px 14px;font-size:10px;font-weight:700;color:#aaa;letter-spacing:0.08em;text-transform:uppercase;border-bottom:1px solid rgba(0,0,0,0.06);">Metric</th><th style="text-align:left;padding:10px 14px;font-size:10px;font-weight:700;color:#aaa;letter-spacing:0.08em;text-transform:uppercase;border-bottom:1px solid rgba(0,0,0,0.06);">TTM Amount</th><th style="text-align:left;padding:10px 14px;font-size:10px;font-weight:700;color:#aaa;letter-spacing:0.08em;text-transform:uppercase;border-bottom:1px solid rgba(0,0,0,0.06);">MoM Trend</th><th style="text-align:left;padding:10px 14px;font-size:10px;font-weight:700;color:#aaa;letter-spacing:0.08em;text-transform:uppercase;border-bottom:1px solid rgba(0,0,0,0.06);">Notes</th></tr></thead><tbody>' + plRowsHTML + '</tbody></table>') : '')
    ) +
    section((app.funnel || []).length > 0, 'Performance', 'Conversion Funnel', glass('<div style="font-size:13px;font-weight:700;margin-bottom:14px;">Impression \u2192 Install \u2192 Trial \u2192 Paid</div>' + funnelHTML)) +
    section(!!(prod.vision || (prod.roadmap || []).length), 'Product', 'Vision & Roadmap',
      (prod.vision ? glass('<div style="font-size:13px;font-weight:700;margin-bottom:8px;">Product Vision</div><p style="font-size:14px;line-height:1.7;color:#333;font-family:-apple-system,sans-serif;">' + prod.vision + '</p>', 'margin-bottom:12px;') : '') +
      ((prod.roadmap || []).length ? glass('<div style="font-size:13px;font-weight:700;margin-bottom:4px;">Product Roadmap</div><div style="font-size:11px;color:#888;margin-bottom:14px;">Shipped \u00b7 In Progress \u00b7 Planned</div>' + roadmapHTML) : '')
    ) +
    section(!!(mkt.tam || (mkt.competitors || []).length || (mkt.keywords || []).length), 'Market', 'Market Overview',
      marketCirclesHTML +
      ((mkt.competitors || []).length ? glass('<div style="font-size:13px;font-weight:700;margin-bottom:4px;">Competitive Landscape</div><div style="font-size:11px;color:#888;margin-bottom:14px;">This app vs key players</div>' + competitorsHTML, 'margin-bottom:12px;') : '') +
      ((mkt.keywords || []).length ? glass('<div style="font-size:13px;font-weight:700;margin-bottom:4px;">App Store Keyword Rankings</div><div style="font-size:11px;color:#888;margin-bottom:14px;">Top ranked keywords by volume</div>' + keywordsHTML) : '')
    ) +
    section((app.opportunities || []).length > 0, 'Upside', 'Growth Opportunities', glass(oppsHTML)) +
    section((con.processSteps || []).length > 0, 'Next Steps', 'Acquisition Process', glass(stepsHTML + ndaBtn)) +
    pocHTML +
    '<div style="text-align:center;margin-top:48px;font-family:-apple-system,sans-serif;font-size:11px;color:#aaa;line-height:1.8;"><p>\u00a9 ' + year + ' EHVM M&amp;A Advisory \u00b7 All financial figures are illustrative pending NDA execution</p></div>' +
    '</div></div>' +
    (chartScript ? '<script>' + chartScript + '<\/script>' : '') +
    '</body></html>'
}

module.exports = { buildListingHTMLHelper }
