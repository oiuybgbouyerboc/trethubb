// Vercel Serverless Function (Node.js) — TretHub Private Order & Stock Bot
// Endpoint: https://www.trethub.shop/api/order-bot

declare const process: { env: Record<string, string | undefined> };

const PRODUCT_CATALOG: Record<string, { name: string; price: number; row: number }> = {
  t2: { name: "Tretinoin 0.025%", price: 13, row: 2 },
  t5: { name: "Tretinoin 0.05%", price: 14.5, row: 3 },
  t1: { name: "Tretinoin 0.1%", price: 15.5, row: 4 },
  a1: { name: "Azelaic Acid 10%", price: 14, row: 5 },
  a2: { name: "Azelaic Acid 20%", price: 16, row: 6 },
  ta1: { name: "Tazarotene 0.1%", price: 20, row: 7 },
  h4: { name: "Hydroquinone 4%", price: 16, row: 8 },
};

const MAIN_SHEET = "Feuille de commande";
const POOL_SHEET = "Pool Vinted";
const STOCK_SHEET = "Stock";

const CONTACT_PREFIX_RE = /^(tt@|tg@|vin@|vinted@|v@|ig@|wa@)/i;

function getEnv(name: string, fallback = ""): string {
  return (process.env[name] || fallback).trim();
}

function escHtml(text: unknown): string {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function parsePrice(val: unknown): number {
  if (typeof val === "number") return val;
  const cleaned = String(val ?? "")
    .replace(/€/g, "")
    .replace(/,/g, ".")
    .replace(/[^\d.-]/g, "");
  return parseFloat(cleaned);
}

function formatEuroEn(num: number): string {
  return `€${Number(num).toFixed(2)}`;
}

function formatEuroFr(num: number): string {
  return `${Number(num).toFixed(2).replace(".", ",")} €`;
}

function normalizeProdKey(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\s+/g, "")
    .split(/[;+,]/)
    .filter(Boolean)
    .sort()
    .join(";");
}

function parseProductItems(raw: string): Array<{ code: string; qty: number; label: string }> {
  const parts = raw
    .split(/[;+,]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.map((item) => {
    const m = item.match(/^(\d+)\s*x?\s*(.+)$/i);
    const qty = m ? Math.max(1, parseInt(m[1], 10)) : 1;
    const rawCode = (m ? m[2] : item).trim();
    const resolved = resolveProductCode(rawCode);
    const label = resolved ? PRODUCT_CATALOG[resolved].name : rawCode;
    return { code: resolved || rawCode.toLowerCase(), qty, label };
  });
}

function formatProductsReadable(raw: string): string {
  return parseProductItems(raw)
    .map((it) => `${it.qty}x ${it.label}`)
    .join(" + ");
}

function resolveProductCode(input: string): string | null {
  const s = input.trim().toLowerCase().replace(/\s+/g, " ");
  if (PRODUCT_CATALOG[s]) return s;
  if (s.includes("0.025") || s.includes("0,025")) return "t2";
  if (s.includes("0.05") || s.includes("0,05")) return "t5";
  if (s.includes("taz") || s.includes("ta1")) return "ta1";
  if ((s.includes("tret") || s === "0.1" || s === "0.1%") && (s.includes("0.1") || s.includes("0,1"))) return "t1";
  if (s.includes("az") && s.includes("10")) return "a1";
  if (s.includes("az") && s.includes("20")) return "a2";
  if (s.includes("hydro") || s.includes("h4") || s.includes("4%")) return "h4";
  return null;
}

function isProductToken(token: string): boolean {
  return /^(\d+x?)?(t2|t5|t1|a1|a2|ta1|h4)([;+,](\d+x?)?(t2|t5|t1|a1|a2|ta1|h4))*$/i.test(token.trim());
}

function isPriceToken(token: string): boolean {
  if (!/^€?\d+([.,]\d{1,2})?€?$/.test(token.trim())) return false;
  const n = parsePrice(token);
  return !isNaN(n) && n > 0 && n < 500;
}

function normalizeSpacingAroundSeparators(input: string): string {
  // Ne touche jamais aux URLs ni aux virgules décimales (ex: 14,50)
  return input
    .split(/(https?:\/\/\S+)/gi)
    .map((chunk) => (/^https?:\/\//i.test(chunk) ? chunk : chunk.replace(/\s*([;+])\s*/g, "+")))
    .join("");
}

function normalizeContact(token: string): string {
  const t = token.trim();
  if (/^(vin@|v@)/i.test(t)) return "vin@" + t.replace(/^(vin@|v@)/i, "");
  return t;
}

function extractCoverFromVintedUrl(url: string): string {
  const m = url.match(/\/items\/\d+-([^/?#]+)/i);
  if (!m) return "Fake Cover";
  return m[1]
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ");
}

function todayParis(): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
}

interface OrderRow {
  rowNum: number;
  date: string;
  client: string;
  order: string;
  price: number;
  priceDisplay: string;
  status: string;
  contact: string;
  vintedUser: string;
  link: string;
  orderStatus: string;
}

async function fetchAllOrders(): Promise<OrderRow[]> {
  const res = await callBridge({ action: "read", sheet: MAIN_SHEET, range: "B8:J500" });
  const vals: any[][] = res.values || [];
  const disp: any[][] = res.displayValues || vals;
  const out: OrderRow[] = [];
  for (let i = 0; i < vals.length; i++) {
    const client = String(vals[i]?.[1] ?? "").trim();
    if (!client) continue;
    out.push({
      rowNum: 8 + i,
      date: String(disp[i]?.[0] ?? "").trim(),
      client,
      order: String(vals[i]?.[2] ?? "").trim(),
      price: parsePrice(vals[i]?.[3]),
      priceDisplay: String(disp[i]?.[3] ?? "").trim(),
      status: String(vals[i]?.[4] ?? "").trim(),
      contact: String(vals[i]?.[5] ?? "").trim(),
      vintedUser: String(vals[i]?.[6] ?? "").trim(),
      link: String(vals[i]?.[7] ?? "").trim(),
      orderStatus: String(vals[i]?.[8] ?? "").trim(),
    });
  }
  return out;
}

function findClientOrder(orders: OrderRow[], query: string, filterFn?: (o: OrderRow) => boolean): OrderRow | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  for (let i = orders.length - 1; i >= 0; i--) {
    const o = orders[i];
    if (filterFn && !filterFn(o)) continue;
    if (o.client.toLowerCase().includes(q) || o.contact.toLowerCase().includes(q)) {
      return o;
    }
  }
  return null;
}

// ============================================================
// Bridge client to Google Apps Script (fixed bridge)
// ============================================================
async function callBridge(payload: Record<string, unknown>): Promise<any> {
  const url = getEnv("SHEETS_BRIDGE_URL");
  const secret = getEnv("SHEETS_BRIDGE_SECRET");
  if (!url || !secret) {
    throw new Error("Variables SHEETS_BRIDGE_URL ou SHEETS_BRIDGE_SECRET manquantes sur Vercel.");
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ secret, ...payload }),
    redirect: "follow",
  });

  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Réponse non-JSON du pont Google Sheets (HTTP ${res.status}): ${text.slice(0, 180)}`);
  }
  if (!json.ok) {
    throw new Error(json.error || "Erreur inconnue du pont Google Sheets");
  }
  return json;
}

async function sendTg(chatId: string, text: string, parseMode: "HTML" | undefined = "HTML"): Promise<void> {
  const token = getEnv("ORDER_BOT_TOKEN");
  if (!token) throw new Error("Variable ORDER_BOT_TOKEN manquante sur Vercel.");

  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
  };
  if (parseMode) body.parse_mode = parseMode;

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errTxt = await res.text();
    console.error("Telegram sendMessage error:", res.status, errTxt);
  }
}

// ============================================================
// Command Handlers
// ============================================================
async function handleHelp(chatId: string): Promise<void> {
  const msg =
    `🤖 <b>TRETHUB BOT — GUIDE COMPLET</b>\n` +
    `<i>(Virgule <code>14,50</code> ou point <code>14.50</code> acceptés · Zéro <code>|</code> requis)</i>\n\n` +
    `<b>🛒 1. CRÉER UNE COMMANDE / PROSPECT</b>\n` +
    `• <code>/pre fr Antox Frt t5 14,50 [lien]</code>\n` +
    `  <i>Précommande (lien caché) + Sheet + Message</i>\n` +
    `• <code>/order en Kyle Butler t5 a2 27 [lien]</code>\n` +
    `  <i>En stock (paiement direct) + Sheet + Message</i>\n` +
    `• <code>/lead Lucas t2 13 vin@lucas92</code>\n` +
    `  <i>Ajoute un prospect en statut <b>démarchage</b></i>\n\n` +
    `<b>💬 2. GÉNÉRER UN MESSAGE (SANS DOUBLON SHEET)</b>\n` +
    `• <code>/msg fr Antox</code> — Regénère le msg précommande en FR\n` +
    `• <code>/msg order en Kyle</code> — Msg paiement (quand lien ouvert)\n` +
    `• <code>/msg update en Riccardo</code> — Relance retard + 22/11\n` +
    `• <code>/msg review en Ghost</code> — Demande d'avis 5★ + photo\n\n` +
    `<b>✅ 3. SUIVI DES CLIENTS</b>\n` +
    `• <code>/client Antox</code> — Voir la fiche complète du client\n` +
    `• <code>/pending</code> — Liste de toutes les précos en attente\n` +
    `• <code>/paid Kyle [pseudo_vinted]</code> — Passe en Payé + déduit stock\n` +
    `• <code>/ship Kyle</code> — Passe le colis en <b>Expédié</b>\n` +
    `• <code>/done Kyle</code> — Passe en <b>Reçu</b> + sort le msg Avis 5★\n` +
    `• <code>/cancel Nom</code> — Passe en <b>Annulé</b> (libère le stock)\n\n` +
    `<b>📦 4. STOCK &amp; POOL VINTED</b>\n` +
    `• <code>/stock</code> ou <code>/stock t5</code> — Stock global ou par produit\n` +
    `• <code>/setstock t5 20</code> <i>(ou <code>+10</code> / <code>-1</code>)</i> — Stock physique\n` +
    `• <code>/restock t2 23</code> — Quantité en arrivage\n` +
    `• <code>/arrive</code> — Transfère le restock reçu dans le Stock Physique\n` +
    `• <code>/add compte1 t5 14,50 https://vinted...</code> — Ajoute au Pool\n` +
    `• <code>/pool</code> ou <code>/pool t5</code> — Liens Vinted Libres\n\n` +
    `<b>📊 5. PILOTAGE</b>\n` +
    `• <code>/stats</code> — Tous les KPIs en direct\n` +
    `• <code>/date Sunday, Nov 29th | dimanche 29/11</code> — Date restock\n\n` +
    `<b>📌 CODES PRODUITS :</b> <code>t2</code> (0.025%) · <code>t5</code> (0.05%) · <code>t1</code> (0.1%) · <code>a1</code> (Az 10%) · <code>a2</code> (Az 20%) · <code>ta1</code> (Taz 0.1%) · <code>h4</code> (Hydro 4%)\n` +
    `<b>📱 CONTACTS :</b> <code>tg@</code> (défaut) · <code>tt@</code> (TikTok) · <code>vin@</code> (Vinted) · <code>ig@</code> (Insta) · <code>wa@</code> (WhatsApp)`;
  await sendTg(chatId, msg);
}

async function handleStock(chatId: string, text: string): Promise<void> {
  const arg = text.replace(/^\/stock\s*/i, "").trim();
  const stockData = await callBridge({ action: "read", sheet: STOCK_SHEET, range: "A2:H9" });
  const rows: any[][] = stockData.values || [];

  if (arg) {
    const code = resolveProductCode(arg);
    if (!code) {
      await sendTg(
        chatId,
        `❌ Produit inconnu : <code>${escHtml(arg)}</code>\nCodes : <code>t2</code>, <code>t5</code>, <code>t1</code>, <code>a1</code>, <code>a2</code>, <code>ta1</code>, <code>h4</code>`
      );
      return;
    }
    const row = rows.find((r) => String(r[0]).trim().toLowerCase() === code);
    if (!row) {
      await sendTg(chatId, `❌ Ligne introuvable pour <code>${escHtml(code)}</code> dans l'onglet Stock.`);
      return;
    }
    const phys = Number(row[3]) || 0;
    const reserved = Number(row[4]) || 0;
    const net = Number(row[5]) || 0;
    const incoming = Number(row[6]) || 0;
    const freeLinksCount = Number(row[7]) || 0;

    const poolRes = await callBridge({ action: "read", sheet: POOL_SHEET, range: "C4:I500" });
    const poolRows: any[][] = poolRes.values || [];
    const matchingLinks = poolRows.filter((r) => {
      if (String(r[5]).trim().toLowerCase() !== "libre") return false;
      return parseProductItems(String(r[1] || "")).some((it) => it.code === code);
    });

    let msg =
      `📦 <b>STOCK — ${escHtml(row[1])} (<code>${escHtml(code)}</code>)</b>\n\n` +
      `💶 Prix catalogue : <b>${formatEuroFr(parsePrice(row[2]))}</b>\n` +
      `🏠 Stock physique : <b>${phys}</b>\n` +
      `⏳ Réservé (Commandé) : <b>${reserved}</b>\n` +
      `${net > 0 ? "✅" : "⚠️"} Dispo net actuel : <b>${net}</b>\n` +
      `🚚 Restock à venir : <b>+${incoming}</b> <i>(Dispo après restock : ${net + incoming})</i>\n` +
      `🔗 Liens Vinted Libres : <b>${freeLinksCount}</b>`;

    if (matchingLinks.length > 0) {
      msg +=
        `\n\n<b>Liens Libres contenant <code>${escHtml(code)}</code> :</b>\n` +
        matchingLinks
          .slice(0, 8)
          .map((r) => `• <b>${formatEuroFr(parsePrice(r[2]))}</b> — <code>${escHtml(r[1])}</code> (${escHtml(r[0])} · ${escHtml(r[3])})`)
          .join("\n");
    }
    await sendTg(chatId, msg);
    return;
  }

  const lines: string[] = [];
  let totPhys = 0,
    totRes = 0,
    totNet = 0,
    totInc = 0,
    totLinks = 0;

  for (const r of rows) {
    const code = String(r[0] || "").trim().toLowerCase();
    if (!code || code === "total") continue;
    const phys = Number(r[3]) || 0;
    const res = Number(r[4]) || 0;
    const net = Number(r[5]) || 0;
    const inc = Number(r[6]) || 0;
    const links = Number(r[7]) || 0;
    totPhys += phys;
    totRes += res;
    totNet += net;
    totInc += inc;
    totLinks += links;

    const icon = net > 0 ? "🟢" : inc + net > 0 ? "🟡" : "🔴";
    lines.push(
      `${icon} <code>${escHtml(code)}</code> <b>${escHtml(r[1])}</b>\n` +
        `   Phys: <b>${phys}</b> · Rés: <b>${res}</b> · Net: <b>${net}</b> · +${inc} 🚚 · 🔗${links}`
    );
  }

  await sendTg(
    chatId,
    `📦 <b>ÉTAT DU STOCK TRETHUB</b>\n\n` +
      lines.join("\n") +
      `\n\n📊 <b>TOTAL :</b> Phys <b>${totPhys}</b> · Rés <b>${totRes}</b> · Net <b>${totNet}</b> · Restock <b>+${totInc}</b> · Liens Libres <b>${totLinks}</b>\n\n` +
      `<i>💡 Détail : <code>/stock t5</code> · Modifier : <code>/setstock t5 20</code></i>`
  );
}

async function handleSetStock(chatId: string, text: string, colIndex: number, label: string): Promise<void> {
  const parts = text.trim().split(/\s+/);
  if (parts.length < 3) {
    const cmd = colIndex === 4 ? "/setstock" : "/restock";
    await sendTg(chatId, `❌ Format : <code>${cmd} t5 20</code> ou <code>${cmd} t5 +10</code> ou <code>${cmd} t5 -1</code>`);
    return;
  }
  const code = resolveProductCode(parts[1]);
  if (!code) {
    await sendTg(chatId, `❌ Code produit inconnu : <code>${escHtml(parts[1])}</code>`);
    return;
  }
  const qtyArg = parts[2].trim();
  const isDelta = qtyArg.startsWith("+") || qtyArg.startsWith("-");
  const num = parseInt(qtyArg, 10);
  if (isNaN(num)) {
    await sendTg(chatId, `❌ Quantité invalide : <code>${escHtml(qtyArg)}</code>`);
    return;
  }

  const row = PRODUCT_CATALOG[code].row;
  let newValue = num;
  if (isDelta) {
    const cur = await callBridge({ action: "read", sheet: STOCK_SHEET, range: `A${row}:H${row}` });
    const currentVal = Number(cur.values?.[0]?.[colIndex - 1]) || 0;
    newValue = Math.max(0, currentVal + num);
  } else {
    newValue = Math.max(0, num);
  }

  await callBridge({ action: "setCell", sheet: STOCK_SHEET, row, col: colIndex, value: newValue });
  await sendTg(
    chatId,
    `✅ <b>${escHtml(label)} mis à jour !</b>\n📦 ${escHtml(PRODUCT_CATALOG[code].name)} (<code>${code}</code>) → <b>${newValue}</b>`
  );
}

async function handleArrive(chatId: string): Promise<void> {
  const stockData = await callBridge({ action: "read", sheet: STOCK_SHEET, range: "A2:G8" });
  const rows: any[][] = stockData.values || [];
  const writes: Array<{ row: number; col: number; value: number }> = [];
  const summaryLines: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const code = String(rows[i][0] || "").trim();
    const name = String(rows[i][1] || "").trim();
    const phys = Number(rows[i][3]) || 0;
    const inc = Number(rows[i][6]) || 0;
    if (inc > 0) {
      const rowNum = i + 2;
      writes.push({ row: rowNum, col: 4, value: phys + inc });
      writes.push({ row: rowNum, col: 7, value: 0 });
      summaryLines.push(`• <code>${escHtml(code)}</code> ${escHtml(name)} : ${phys} → <b>${phys + inc}</b> (+${inc})`);
    }
  }

  if (writes.length === 0) {
    await sendTg(chatId, "ℹ️ Aucune quantité en attente dans <b>Restock à venir</b>.");
    return;
  }

  await callBridge({ action: "batchCells", sheet: STOCK_SHEET, writes });
  await sendTg(
    chatId,
    `🚚✅ <b>RESTOCK RÉCEPTIONNÉ !</b>\nLes quantités ont été ajoutées au Stock Physique :\n\n${summaryLines.join("\n")}`
  );
}

async function handleAddPool(chatId: string, text: string): Promise<void> {
  const body = text.replace(/^\/add\s*/i, "").trim();
  if (!body) {
    await sendTg(
      chatId,
      `❌ Format ultra-rapide :\n<code>/add moncompte t5 14,50 https://www.vinted.fr/items/...</code>\n<code>/add compte 2 t5 a2 27 https://www.vinted.fr/items/...</code>`
    );
    return;
  }

  let account = "",
    products = "",
    priceRaw = "",
    link = "",
    cover = "";

  if (body.includes("|") || body.includes("\n")) {
    const parts = body.split(body.includes("|") ? "|" : "\n").map((s) => s.trim()).filter(Boolean);
    account = parts[0] || "";
    products = parts[1] || "";
    priceRaw = parts[2] || "";
    link = parts[3] || "";
    cover = parts[4] || "";
  } else {
    const tokens = normalizeSpacingAroundSeparators(body).split(/\s+/).filter(Boolean);
    const linkIdx = tokens.findIndex((t) => /^https?:\/\//i.test(t));
    if (linkIdx !== -1) {
      link = tokens[linkIdx];
      if (linkIdx + 1 < tokens.length) cover = tokens.slice(linkIdx + 1).join(" ");
    }
    const beforeLink = linkIdx !== -1 ? tokens.slice(0, linkIdx) : tokens;
    let priceIdx = -1;
    for (let i = beforeLink.length - 1; i >= 0; i--) {
      if (isPriceToken(beforeLink[i])) {
        priceIdx = i;
        priceRaw = beforeLink[i];
        break;
      }
    }
    const prodIndices: number[] = [];
    const prodTokens: string[] = [];
    for (let i = 0; i < beforeLink.length; i++) {
      if (i === priceIdx) continue;
      if (isProductToken(beforeLink[i])) {
        prodIndices.push(i);
        prodTokens.push(beforeLink[i].replace(/\+/g, " ; "));
      }
    }
    products = prodTokens.join(" ; ");
    account = beforeLink.filter((_, i) => i !== priceIdx && !prodIndices.includes(i)).join(" ").trim();
  }

  const price = parsePrice(priceRaw);
  if (!account || !products || isNaN(price) || !link.startsWith("http")) {
    await sendTg(
      chatId,
      `❌ Données invalides.\nExemples :\n<code>/add alexis t5 14,50 https://www.vinted.fr/items/...</code>\n<code>/add compte 2 t5 a2 27 https://www.vinted.fr/items/...</code>`
    );
    return;
  }

  if (!cover) cover = extractCoverFromVintedUrl(link);

  const poolRead = await callBridge({ action: "read", sheet: POOL_SHEET, range: "G4:G500" });
  const colG: any[][] = poolRead.values || [];
  let targetRow = 4 + colG.length;
  for (let i = 0; i < colG.length; i++) {
    if (String(colG[i]?.[0] ?? "").trim() === "") {
      targetRow = 4 + i;
      break;
    }
  }

  await callBridge({
    action: "write",
    sheet: POOL_SHEET,
    range: `C${targetRow}:I${targetRow}`,
    values: [[account, products, price, cover, link, "Libre", ""]],
  });

  await sendTg(
    chatId,
    `✅ <b>Lien ajouté à Pool Vinted</b> (Ligne ${targetRow})\n` +
      `👤 Compte : <b>${escHtml(account)}</b>\n` +
      `📦 Produit(s) : <code>${escHtml(products)}</code>\n` +
      `💶 Prix : <b>${formatEuroFr(price)}</b>\n` +
      `📝 Fake Cover : ${escHtml(cover)}\n` +
      `📌 Statut : <b>Libre</b>`
  );
}

async function handlePool(chatId: string, text: string): Promise<void> {
  const filterArg = text.replace(/^\/pool\s*/i, "").trim().toLowerCase();
  const poolRead = await callBridge({ action: "read", sheet: POOL_SHEET, range: "C4:I500" });
  const rows: any[][] = poolRead.values || [];

  let free = rows.filter(
    (r) => String(r[5] ?? "").trim().toLowerCase() === "libre" && String(r[4] ?? "").trim().startsWith("http")
  );

  if (filterArg) {
    const code = resolveProductCode(filterArg);
    const maybePrice = parsePrice(filterArg);
    free = free.filter((r) => {
      if (code) return parseProductItems(String(r[1] ?? "")).some((it) => it.code === code);
      if (!isNaN(maybePrice)) return Math.abs(parsePrice(r[2]) - maybePrice) < 0.01;
      return String(r[0] ?? "").toLowerCase().includes(filterArg) || String(r[1] ?? "").toLowerCase().includes(filterArg);
    });
  }

  if (free.length === 0) {
    await sendTg(
      chatId,
      filterArg
        ? `🔴 Aucun lien <b>Libre</b> trouvé pour <code>${escHtml(filterArg)}</code>.`
        : `🔴 Aucun lien <b>Libre</b> dans <code>Pool Vinted</code>. Ajoute-en avec <code>/add</code> !`
    );
    return;
  }

  const lines = free
    .slice(0, 25)
    .map(
      (r) =>
        `• <b>${formatEuroFr(parsePrice(r[2]))}</b> — <code>${escHtml(r[1])}</code> (${escHtml(r[0])} · ${escHtml(r[3])})`
    );
  await sendTg(chatId, `🟢 <b>Liens Vinted Libres (${free.length}) :</b>\n\n${lines.join("\n")}`);
}

async function handleBooking(chatId: string, text: string, mode: "order" | "pre"): Promise<void> {
  const body = text.replace(/^\/(order|pre)\s*/i, "").trim();
  if (!body) {
    await sendTg(
      chatId,
      `❌ Formats ultra-rapides :\n<code>/${mode} en Kyle Butler t5 a2 27</code>\n<code>/${mode} fr Antox Frt t5 14,50 https://vinted...</code>\n<i>(Contacts possibles : <code>tt@</code>, <code>vin@</code>, <code>ig@</code>, <code>wa@</code>)</i>`
    );
    return;
  }

  let lang: "EN" | "FR" = "EN";
  let clientName = "";
  let rawProducts = "";
  let price = NaN;
  let directLink = "";
  let contactWay = "";

  if (body.includes("|") || body.includes("\n")) {
    const parts = body.split(body.includes("|") ? "|" : "\n").map((s) => s.trim()).filter(Boolean);
    if (parts.length < 4) {
      await sendTg(chatId, `❌ Il manque un champ.\nExemple : <code>/${mode} en Kyle Butler t5 a2 27</code>`);
      return;
    }
    lang = parts[0].toUpperCase() === "FR" ? "FR" : "EN";
    clientName = parts[1];
    rawProducts = parts[2];
    price = parsePrice(parts[3]);
    for (let i = 4; i < parts.length; i++) {
      const p = parts[i];
      if (p.startsWith("http")) directLink = p;
      else if (p) contactWay = normalizeContact(p);
    }
  } else {
    const tokens = normalizeSpacingAroundSeparators(body).split(/\s+/).filter(Boolean);
    let startIdx = 0;
    if (tokens[0] && /^(en|fr)$/i.test(tokens[0])) {
      lang = tokens[0].toUpperCase() === "FR" ? "FR" : "EN";
      startIdx = 1;
    }
    const work = tokens.slice(startIdx);
    const used = new Set<number>();

    work.forEach((t, i) => {
      if (/^https?:\/\//i.test(t)) {
        directLink = t;
        used.add(i);
      } else if (CONTACT_PREFIX_RE.test(t)) {
        contactWay = normalizeContact(t);
        used.add(i);
      }
    });

    const prodList: string[] = [];
    work.forEach((t, i) => {
      if (used.has(i)) return;
      if (isProductToken(t)) {
        prodList.push(t.replace(/\+/g, " ; "));
        used.add(i);
      }
    });
    rawProducts = prodList.join(" ; ");

    for (let i = work.length - 1; i >= 0; i--) {
      if (used.has(i)) continue;
      if (isPriceToken(work[i])) {
        price = parsePrice(work[i]);
        used.add(i);
        break;
      }
    }

    clientName = work.filter((_, i) => !used.has(i)).join(" ").trim();
  }

  if (!contactWay) contactWay = `tg@${clientName}`;

  if (!clientName || !rawProducts || isNaN(price)) {
    await sendTg(
      chatId,
      `❌ Vérifie la commande.\nExemples :\n<code>/${mode} en Kyle Butler t5 a2 27</code>\n<code>/${mode} fr Antox t5 14,50 https://vinted...</code>`
    );
    return;
  }

  let chosenLink = directLink;
  let poolInfo = "Lien fourni manuellement";

  if (!chosenLink) {
    const poolRead = await callBridge({ action: "read", sheet: POOL_SHEET, range: "C4:I500" });
    const pRows: any[][] = poolRead.values || [];
    const normProd = normalizeProdKey(rawProducts);

    let exactIdx = -1;
    let priceIdx = -1;
    for (let i = 0; i < pRows.length; i++) {
      const status = String(pRows[i][5] ?? "").trim().toLowerCase();
      const rowPrice = parsePrice(pRows[i][2]);
      const link = String(pRows[i][4] ?? "").trim();
      if (status === "libre" && link.startsWith("http") && Math.abs(rowPrice - price) < 0.01) {
        if (priceIdx === -1) priceIdx = i;
        if (normalizeProdKey(String(pRows[i][1] ?? "")) === normProd) {
          exactIdx = i;
          break;
        }
      }
    }

    const idx = exactIdx !== -1 ? exactIdx : priceIdx;
    if (idx === -1) {
      await sendTg(
        chatId,
        `❌ Aucun lien <b>Libre</b> à <b>${formatEuroFr(price)}</b> dans <code>Pool Vinted</code>.\n\n` +
          `👉 Ajoute-en un avec <code>/add</code> ou colle ton lien à la fin :\n` +
          `<code>/${mode} ${lang.toLowerCase()} ${escHtml(clientName)} ${escHtml(rawProducts)} ${price} https://vinted...</code>`
      );
      return;
    }

    const poolRow = idx + 4;
    chosenLink = String(pRows[idx][4]).trim();
    poolInfo = `Pool Vinted (Ligne ${poolRow} · ${pRows[idx][0]} · ${pRows[idx][3]})`;

    await callBridge({
      action: "batchCells",
      sheet: POOL_SHEET,
      writes: [
        { row: poolRow, col: 8, value: "Pris" },
        { row: poolRow, col: 9, value: clientName },
      ],
    });
  }

  const mainRead = await callBridge({ action: "read", sheet: MAIN_SHEET, range: "C8:C500" });
  const colC: any[][] = mainRead.values || [];
  let mainRow = 8 + colC.length;
  for (let i = 0; i < colC.length; i++) {
    if (String(colC[i]?.[0] ?? "").trim() === "") {
      mainRow = 8 + i;
      break;
    }
  }

  await callBridge({
    action: "batchCells",
    sheet: MAIN_SHEET,
    writes: [
      { row: mainRow, col: 2, value: todayParis() },
      { row: mainRow, col: 3, value: clientName },
      { row: mainRow, col: 4, value: rawProducts },
      { row: mainRow, col: 5, value: price },
      { row: mainRow, col: 6, value: "Commandé" },
      { row: mainRow, col: 7, value: contactWay },
      { row: mainRow, col: 9, value: chosenLink },
      { row: mainRow, col: 10, value: "Pas payé" },
    ],
  });

  const props = await callBridge({ action: "getProps", keys: ["RESTOCK_EN", "RESTOCK_FR"] });
  const restockEn = props.values?.RESTOCK_EN || "Sunday, Nov 22nd";
  const restockFr = props.values?.RESTOCK_FR || "dimanche 22/11";

  const readableProducts = formatProductsReadable(rawProducts);

  await sendTg(
    chatId,
    `✅ <b>Commande enregistrée !</b>\n` +
      `📄 ${MAIN_SHEET} : Ligne <b>${mainRow}</b> (${escHtml(clientName)} · <code>${escHtml(rawProducts)}</code> · <b>${formatEuroFr(price)}</b>)\n` +
      `🔗 Source : ${escHtml(poolInfo)}\n` +
      `<i>💡 Mauvaise langue ? Tape <code>/msg ${lang === "EN" ? "fr" : "en"} ${escHtml(clientName.split(" ")[0])}</code></i>\n\n` +
      `👇 <b>Copie-colle le message ci-dessous au client :</b>`
  );

  const clientMsg = buildClientMessage(mode, lang, readableProducts, price, chosenLink, restockEn, restockFr);
  await sendTg(chatId, clientMsg, undefined);
}

async function handleMsg(chatId: string, text: string): Promise<void> {
  const body = text.replace(/^\/msg\s*/i, "").trim();
  if (!body) {
    await sendTg(
      chatId,
      `💬 <b>Générer un message sans toucher au Sheet :</b>\n\n` +
        `• <code>/msg fr Antox</code> — Précommande FR\n` +
        `• <code>/msg en García</code> — Précommande EN\n` +
        `• <code>/msg order en Kyle</code> — Paiement immédiat (lien débloqué)\n` +
        `• <code>/msg update en Riccardo</code> — Relance retard + restock 22/11\n` +
        `• <code>/msg review fr Antox</code> — Demande d'avis 5★ + photo`
    );
    return;
  }

  const tokens = body.split(/\s+/).filter(Boolean);
  let msgType: "pre" | "order" | "update" | "review" = "pre";
  let lang: "EN" | "FR" = "EN";
  const nameTokens: string[] = [];

  for (const t of tokens) {
    const low = t.toLowerCase();
    if (nameTokens.length === 0 && (low === "pre" || low === "order" || low === "update" || low === "review")) {
      msgType = low;
    } else if (nameTokens.length === 0 && (low === "fr" || low === "en")) {
      lang = low === "fr" ? "FR" : "EN";
    } else {
      nameTokens.push(t);
    }
  }

  // Review message doesn't even require finding a client
  if (msgType === "review" && nameTokens.length === 0) {
    await sendTg(chatId, buildReviewMessage(lang), undefined);
    return;
  }

  const query = nameTokens.join(" ").trim();
  if (!query) {
    await sendTg(chatId, `❌ Précise le nom du client.\nEx : <code>/msg fr Antox</code> ou <code>/msg update en Riccardo</code>`);
    return;
  }

  const orders = await fetchAllOrders();
  const found = findClientOrder(orders, query);
  if (!found) {
    await sendTg(chatId, `❌ Aucun client trouvé pour <code>${escHtml(query)}</code> dans ${MAIN_SHEET}.`);
    return;
  }

  if (msgType === "review") {
    await sendTg(chatId, `💬 <b>Message Avis 5★ (${lang}) pour ${escHtml(found.client)} :</b>`);
    await sendTg(chatId, buildReviewMessage(lang), undefined);
    return;
  }

  const props = await callBridge({ action: "getProps", keys: ["RESTOCK_EN", "RESTOCK_FR"] });
  const restockEn = props.values?.RESTOCK_EN || "Sunday, Nov 22nd";
  const restockFr = props.values?.RESTOCK_FR || "dimanche 22/11";

  const readableProducts = formatProductsReadable(found.order);
  const priceVal = isNaN(found.price) ? 0 : found.price;
  const linkVal = found.link || "[LIEN_VINTED]";

  await sendTg(
    chatId,
    `💬 <b>Message <code>${msgType.toUpperCase()}</code> (${lang}) pour ${escHtml(found.client)}</b> (Ligne ${found.rowNum} · ${escHtml(found.order)} · ${formatEuroFr(priceVal)}) :`
  );

  const outMsg =
    msgType === "update"
      ? buildUpdateMessage(lang, readableProducts, priceVal, linkVal, restockEn, restockFr)
      : buildClientMessage(msgType, lang, readableProducts, priceVal, linkVal, restockEn, restockFr);

  await sendTg(chatId, outMsg, undefined);
}

async function handleLead(chatId: string, text: string): Promise<void> {
  const body = text.replace(/^\/(lead|demarchage)\s*/i, "").trim();
  if (!body) {
    await sendTg(
      chatId,
      `❌ Format :\n<code>/lead Lucas t2 13 vin@lucas92</code>\n<i>(Contacts : <code>tg@</code>, <code>tt@</code>, <code>vin@</code>, <code>ig@</code>, <code>wa@</code> · Lien optionnel)</i>`
    );
    return;
  }

  let clientName = "";
  let rawProducts = "";
  let price = NaN;
  let directLink = "";
  let contactWay = "";

  if (body.includes("|")) {
    const parts = body.split("|").map((s) => s.trim());
    clientName = parts[0] || "";
    rawProducts = parts[1] || "";
    price = parsePrice(parts[2] ?? "");
    for (let i = 3; i < parts.length; i++) {
      if (parts[i].startsWith("http")) directLink = parts[i];
      else if (parts[i]) contactWay = normalizeContact(parts[i]);
    }
  } else {
    const tokens = normalizeSpacingAroundSeparators(body).split(/\s+/).filter(Boolean);
    const used = new Set<number>();
    tokens.forEach((t, i) => {
      if (/^https?:\/\//i.test(t)) {
        directLink = t;
        used.add(i);
      } else if (CONTACT_PREFIX_RE.test(t)) {
        contactWay = normalizeContact(t);
        used.add(i);
      }
    });
    const prodList: string[] = [];
    tokens.forEach((t, i) => {
      if (used.has(i)) return;
      if (isProductToken(t)) {
        prodList.push(t.replace(/\+/g, " ; "));
        used.add(i);
      }
    });
    rawProducts = prodList.join(" ; ");
    for (let i = tokens.length - 1; i >= 0; i--) {
      if (used.has(i)) continue;
      if (isPriceToken(tokens[i])) {
        price = parsePrice(tokens[i]);
        used.add(i);
        break;
      }
    }
    clientName = tokens.filter((_, i) => !used.has(i)).join(" ").trim();
  }

  if (!clientName) {
    await sendTg(chatId, `❌ Précise au moins le nom du prospect.\nEx : <code>/lead Lucas t2 13 vin@lucas92</code>`);
    return;
  }
  if (!contactWay) contactWay = `tg@${clientName}`;

  const mainRead = await callBridge({ action: "read", sheet: MAIN_SHEET, range: "C8:C500" });
  const colC: any[][] = mainRead.values || [];
  let mainRow = 8 + colC.length;
  for (let i = 0; i < colC.length; i++) {
    if (String(colC[i]?.[0] ?? "").trim() === "") {
      mainRow = 8 + i;
      break;
    }
  }

  const writes: Array<{ row: number; col: number; value: string | number }> = [
    { row: mainRow, col: 2, value: todayParis() },
    { row: mainRow, col: 3, value: clientName },
    { row: mainRow, col: 6, value: "démarchage" },
    { row: mainRow, col: 7, value: contactWay },
    { row: mainRow, col: 10, value: "Pas payé" },
  ];
  if (rawProducts) writes.push({ row: mainRow, col: 4, value: rawProducts });
  if (!isNaN(price)) writes.push({ row: mainRow, col: 5, value: price });
  if (directLink) writes.push({ row: mainRow, col: 9, value: directLink });

  await callBridge({ action: "batchCells", sheet: MAIN_SHEET, writes });

  await sendTg(
    chatId,
    `🎯 <b>Prospect ajouté en démarchage !</b>\n` +
      `📄 ${MAIN_SHEET} : Ligne <b>${mainRow}</b>\n` +
      `👤 Client : <b>${escHtml(clientName)}</b> (${escHtml(contactWay)})\n` +
      (rawProducts ? `📦 Produit(s) : <code>${escHtml(rawProducts)}</code>\n` : "") +
      (!isNaN(price) ? `💶 Prix estimé : <b>${formatEuroFr(price)}</b>\n` : "") +
      `📌 Statut : <b>démarchage</b> · <b>Pas payé</b>`
  );
}

async function handleClient(chatId: string, text: string): Promise<void> {
  const query = text.replace(/^\/client\s*/i, "").trim();
  if (!query) {
    await sendTg(chatId, `❌ Format : <code>/client Antox</code>`);
    return;
  }
  const orders = await fetchAllOrders();
  const matches = orders.filter(
    (o) => o.client.toLowerCase().includes(query.toLowerCase()) || o.contact.toLowerCase().includes(query.toLowerCase())
  );
  if (matches.length === 0) {
    await sendTg(chatId, `❌ Aucun client trouvé pour <code>${escHtml(query)}</code>.`);
    return;
  }

  const blocks = matches.slice(-3).map((o) => {
    return (
      `👤 <b>${escHtml(o.client)}</b> <i>(Ligne ${o.rowNum})</i>\n` +
      `📅 Ajouté : ${escHtml(o.date || "—")}\n` +
      `📦 Commande : <code>${escHtml(o.order || "—")}</code> (${escHtml(formatProductsReadable(o.order))})\n` +
      `💶 Prix : <b>${escHtml(o.priceDisplay || "—")}</b>\n` +
      `📌 Statut : <b>${escHtml(o.status)}</b> · Colis : <b>${escHtml(o.orderStatus)}</b>\n` +
      `💬 Contact : <code>${escHtml(o.contact || "—")}</code>` +
      (o.vintedUser ? `\n🛍️ Pseudo Vinted : <code>${escHtml(o.vintedUser)}</code>` : "") +
      (o.link ? `\n🔗 ${escHtml(o.link)}` : "")
    );
  });

  await sendTg(chatId, blocks.join("\n\n━━━━━━━━━━\n\n"));
}

async function handlePending(chatId: string): Promise<void> {
  const orders = await fetchAllOrders();
  const pending = orders.filter((o) => o.status.toLowerCase() === "commandé");
  if (pending.length === 0) {
    await sendTg(chatId, "✅ Aucune précommande en attente !");
    return;
  }

  let total = 0;
  const lines = pending.map((o, idx) => {
    if (!isNaN(o.price)) total += o.price;
    const tag = o.contact.startsWith("tt@") ? "📱TT" : o.contact.startsWith("vin@") ? "🛍️VIN" : "✈️TG";
    return `${idx + 1}. <b>${escHtml(o.client)}</b> — <code>${escHtml(o.order)}</code> · <b>${escHtml(o.priceDisplay)}</b> (${tag})`;
  });

  await sendTg(
    chatId,
    `⏳ <b>COMMANDES EN ATTENTE (${pending.length}) — Total : ${formatEuroFr(total)}</b>\n\n` +
      lines.join("\n") +
      `\n\n<i>💡 Pour relancer un client : <code>/msg update en Nom</code> ou <code>/msg order fr Nom</code></i>`
  );
}

async function handlePaid(chatId: string, text: string): Promise<void> {
  const body = text.replace(/^\/paid\s*/i, "").trim();
  if (!body) {
    await sendTg(chatId, `❌ Format : <code>/paid NomClient</code>\n<i>(Optionnel : <code>/paid Kyle vin@pseudo_vinted</code>)</i>`);
    return;
  }

  const tokens = body.split(/\s+/).filter(Boolean);
  let vintedPseudo = "";
  const queryTokens: string[] = [];
  for (const t of tokens) {
    if (/^(vin@|vinted@|v@)/i.test(t)) {
      vintedPseudo = t.replace(/^(vin@|vinted@|v@)/i, "");
    } else {
      queryTokens.push(t);
    }
  }
  const query = queryTokens.join(" ");

  const orders = await fetchAllOrders();
  const found = findClientOrder(orders, query, (o) => o.status.toLowerCase() !== "payé" && o.status.toLowerCase() !== "annulé");
  if (!found) {
    await sendTg(chatId, `❌ Aucune commande non payée trouvée pour <code>${escHtml(query)}</code>.`);
    return;
  }

  const writes: Array<{ row: number; col: number; value: string }> = [
    { row: found.rowNum, col: 6, value: "Payé" },
    { row: found.rowNum, col: 10, value: "À expédier" },
  ];
  if (vintedPseudo) writes.push({ row: found.rowNum, col: 8, value: vintedPseudo });

  await callBridge({ action: "batchCells", sheet: MAIN_SHEET, writes });

  // Decrement Stock Physique
  const items = parseProductItems(found.order);
  const stockRead = await callBridge({ action: "read", sheet: STOCK_SHEET, range: "A2:D8" });
  const sRows: any[][] = stockRead.values || [];
  const stockWrites: Array<{ row: number; col: number; value: number }> = [];
  const stockChanges: string[] = [];

  for (const it of items) {
    const cat = PRODUCT_CATALOG[it.code];
    if (!cat) continue;
    const currentPhys = Number(sRows[cat.row - 2]?.[3]) || 0;
    const nextPhys = Math.max(0, currentPhys - it.qty);
    sRows[cat.row - 2][3] = nextPhys;
    stockWrites.push({ row: cat.row, col: 4, value: nextPhys });
    stockChanges.push(`• <code>${it.code}</code> : ${currentPhys} → <b>${nextPhys}</b> (-${it.qty})`);
  }

  if (stockWrites.length > 0) {
    await callBridge({ action: "batchCells", sheet: STOCK_SHEET, writes: stockWrites });
  }

  await sendTg(
    chatId,
    `💸✅ <b>PAIEMENT VALIDÉ !</b>\n` +
      `👤 Client : <b>${escHtml(found.client)}</b> (Ligne ${found.rowNum})\n` +
      `📦 Commande : <code>${escHtml(found.order)}</code> (${escHtml(found.priceDisplay)})\n` +
      (vintedPseudo ? `🛍️ Pseudo Vinted : <code>${escHtml(vintedPseudo)}</code>\n` : "") +
      `📌 Statut : <b>Payé</b> · <b>À expédier</b>` +
      (stockChanges.length > 0 ? `\n\n<b>Stock physique mis à jour :</b>\n${stockChanges.join("\n")}` : "")
  );
}

async function handleShip(chatId: string, text: string): Promise<void> {
  const query = text.replace(/^\/ship\s*/i, "").trim();
  if (!query) {
    await sendTg(chatId, `❌ Format : <code>/ship NomClient</code>`);
    return;
  }
  const orders = await fetchAllOrders();
  const found = findClientOrder(orders, query);
  if (!found) {
    await sendTg(chatId, `❌ Client introuvable : <code>${escHtml(query)}</code>`);
    return;
  }
  await callBridge({
    action: "setCell",
    sheet: MAIN_SHEET,
    row: found.rowNum,
    col: 10,
    value: "Expédié",
  });
  await sendTg(
    chatId,
    `🚚 <b>Colis marqué EXPÉDIÉ !</b>\n👤 <b>${escHtml(found.client)}</b> (Ligne ${found.rowNum} · <code>${escHtml(found.order)}</code>)`
  );
}

async function handleDone(chatId: string, text: string): Promise<void> {
  const body = text.replace(/^\/done\s*/i, "").trim();
  if (!body) {
    await sendTg(chatId, `❌ Format : <code>/done NomClient</code> ou <code>/done fr NomClient</code>`);
    return;
  }
  const tokens = body.split(/\s+/).filter(Boolean);
  let lang: "EN" | "FR" = "EN";
  if (tokens[0] && /^(fr|en)$/i.test(tokens[0])) {
    lang = tokens.shift()!.toUpperCase() === "FR" ? "FR" : "EN";
  }
  const query = tokens.join(" ");

  const orders = await fetchAllOrders();
  const found = findClientOrder(orders, query);
  if (!found) {
    await sendTg(chatId, `❌ Client introuvable : <code>${escHtml(query)}</code>`);
    return;
  }
  await callBridge({
    action: "batchCells",
    sheet: MAIN_SHEET,
    writes: [
      { row: found.rowNum, col: 6, value: "Payé" },
      { row: found.rowNum, col: 10, value: "Reçu" },
    ],
  });
  await sendTg(
    chatId,
    `📦✅ <b>Commande marquée REÇUE !</b>\n👤 <b>${escHtml(found.client)}</b> (Ligne ${found.rowNum})\n\n👇 <b>Message Avis 5★ prêt à envoyer (${lang}) :</b>`
  );
  await sendTg(chatId, buildReviewMessage(lang), undefined);
}

async function handleCancel(chatId: string, text: string): Promise<void> {
  const query = text.replace(/^\/cancel\s*/i, "").trim();
  if (!query) {
    await sendTg(chatId, `❌ Format : <code>/cancel NomClient</code>`);
    return;
  }
  const orders = await fetchAllOrders();
  const found = findClientOrder(orders, query, (o) => o.status.toLowerCase() !== "annulé");
  if (!found) {
    await sendTg(chatId, `❌ Aucune commande active trouvée pour <code>${escHtml(query)}</code>.`);
    return;
  }
  await callBridge({
    action: "batchCells",
    sheet: MAIN_SHEET,
    writes: [
      { row: found.rowNum, col: 6, value: "Annulé" },
      { row: found.rowNum, col: 10, value: "Annulé" },
    ],
  });
  await sendTg(
    chatId,
    `❌ <b>Commande annulée !</b>\n👤 <b>${escHtml(found.client)}</b> (Ligne ${found.rowNum} · <code>${escHtml(found.order)}</code>)\n<i>Ses tubes ont été libérés dans l'onglet Stock ✅</i>`
  );
}

async function handleStats(chatId: string): Promise<void> {
  const [kpi, pool, stock] = await Promise.all([
    callBridge({ action: "read", sheet: MAIN_SHEET, range: "B5:J5" }),
    callBridge({ action: "read", sheet: POOL_SHEET, range: "H4:H500" }),
    callBridge({ action: "read", sheet: STOCK_SHEET, range: "D9:G9" }),
  ]);

  const d: any[] = kpi.displayValues?.[0] || kpi.values?.[0] || [];
  const freeLinks = (pool.values || []).filter((r: any[]) => String(r[0] ?? "").trim().toLowerCase() === "libre").length;
  const s: any[] = stock.values?.[0] || [];

  await sendTg(
    chatId,
    `📊 <b>STATS TRETHUB EN DIRECT</b>\n\n` +
      `📦 Total commandes : <b>${escHtml(d[1] ?? "0")}</b>\n` +
      `⏳ En cours (Commandé) : <b>${escHtml(d[2] ?? "0")}</b> (${escHtml(d[8] ?? "0 €")})\n` +
      `✅ Payées : <b>${escHtml(d[3] ?? "0")}</b> (${escHtml(d[6] ?? "0 €")})\n` +
      `💶 CA potentiel total : <b>${escHtml(d[7] ?? "0 €")}</b>\n\n` +
      `🏠 Stock physique total : <b>${escHtml(s[0] ?? "0")}</b> tubes\n` +
      `🚚 Restock à venir : <b>+${escHtml(s[3] ?? "0")}</b> tubes\n` +
      `🟢 Liens Vinted Libres : <b>${freeLinks}</b>`
  );
}

async function handleDate(chatId: string, text: string): Promise<void> {
  const body = text.replace(/^\/date\s*/i, "").trim();
  const parts = body.split("|").map((s) => s.trim());
  if (parts.length < 2) {
    const props = await callBridge({ action: "getProps", keys: ["RESTOCK_EN", "RESTOCK_FR"] });
    const curEn = props.values?.RESTOCK_EN || "Sunday, Nov 22nd";
    const curFr = props.values?.RESTOCK_FR || "dimanche 22/11";
    await sendTg(
      chatId,
      `📅 <b>Date de restock actuelle :</b>\n• EN : <b>${escHtml(curEn)}</b>\n• FR : <b>${escHtml(curFr)}</b>\n\nPour changer :\n<code>/date Sunday, Nov 29th | dimanche 29/11</code>`
    );
    return;
  }

  await callBridge({
    action: "setProps",
    props: { RESTOCK_EN: parts[0], RESTOCK_FR: parts[1] },
  });
  await sendTg(
    chatId,
    `✅ <b>Nouvelle date enregistrée :</b>\n• EN : <b>${escHtml(parts[0])}</b>\n• FR : <b>${escHtml(parts[1])}</b>`
  );
}

// ============================================================
// Message Templates (EN & FR)
// ============================================================
function buildClientMessage(
  mode: "order" | "pre",
  lang: "EN" | "FR",
  productsText: string,
  price: number,
  link: string,
  restockEn: string,
  restockFr: string
): string {
  if (mode === "pre" && lang === "EN") {
    return (
      `Awesome, you're all locked in! 🤩🔥 Thank you so much for your trust 🙏🏻\n\n` +
      `📦 Your reserved order: ${productsText}\n` +
      `💶 Total: ${formatEuroEn(price)}\n` +
      `🔗 Your private Vinted link: ${link}\n\n` +
      `⚠️ Why can't you open the link yet?\n` +
      `The listing is hidden on purpose right now because our fresh stock lands on ${restockEn}, and Vinted automatically cancels orders if we don't ship within 5 business days. So you pay €0 today!\n\n` +
      `✅ What you need to do right now:\n` +
      `Just save this link & keep your notifications ON. The second the stock arrives, I'll DM you a photo of your sealed order 📦, unlock the Vinted link so you can pay, and ship it straight to you! 🤝\n\n` +
      `🚨 IMPORTANT: On Vinted, NEVER write "Tretinoin", "Tret", "Azelaic", "skincare" or "cream" in chat/notes or the order will get cancelled.\n\n` +
      `All good for you? 🫡`
    );
  }
  if (mode === "pre" && lang === "FR") {
    return (
      `Parfait, ta commande est bien réservée ! 🤩🔥 Merci beaucoup pour ta confiance 🙏🏻\n\n` +
      `📦 Ta commande : ${productsText}\n` +
      `💶 Total : ${formatEuroFr(price)}\n` +
      `🔗 Ton lien Vinted réservé : ${link}\n\n` +
      `⚠️ Pourquoi tu ne peux pas encore ouvrir le lien ?\n` +
      `L'annonce est masquée pour l'instant car le nouvel arrivage arrive ${restockFr}, et Vinted annule automatiquement les commandes si on n'expédie pas sous 5 jours ouvrés. Tu paies donc 0 € aujourd'hui !\n\n` +
      `✅ Ce que tu as à faire maintenant :\n` +
      `Garde juste ce lien de côté et laisse tes notifs activées. Dès que le stock arrive, je t'envoie une photo de ta commande 📦, je rends le lien visible pour que tu puisses payer et j'expédie ton colis direct ! 🤝\n\n` +
      `🚨 IMPORTANT : Sur Vinted, n'écris JAMAIS « Tretinoin », « Tret », « Azelaic », « skincare » ou « crème » en message, sinon la commande risque d'être annulée.\n\n` +
      `C'est tout bon pour toi ? 🫡`
    );
  }
  if (mode === "order" && lang === "EN") {
    return (
      `Awesome! 🤩🔥 Thank you so much for your trust 🙏🏻\n\n` +
      `📦 Your order: ${productsText}\n` +
      `💶 Total: ${formatEuroEn(price)}\n` +
      `🔗 Your private Vinted link: ${link}\n\n` +
      `✅ What to do right now:\n` +
      `1️⃣ Tap the link & buy the disguised item (CD/book/t-shirt) — you're 100% covered by Vinted Buyer Protection 🔒\n` +
      `2️⃣ Reply "Done" here once you paid!\n` +
      `3️⃣ I'll send you a photo of your sealed skincare parcel with your name before shipping within 24h from France (3–5 days EU) 📦⚡\n\n` +
      `🚨 IMPORTANT: On Vinted, NEVER write "Tretinoin", "Tret", "Azelaic", "skincare" or "cream" in chat/notes or the order will get cancelled.\n\n` +
      `Let me know as soon as you've ordered! 🫡👊`
    );
  }
  return (
    `Carré ! 🤩🔥 Merci beaucoup pour ta confiance 🙏🏻\n\n` +
    `📦 Ta commande : ${productsText}\n` +
    `💶 Total : ${formatEuroFr(price)}\n` +
    `🔗 Ton lien Vinted privé : ${link}\n\n` +
    `✅ Ce que tu as à faire maintenant :\n` +
    `1️⃣ Clique sur le lien et achète l'article déguisé (CD/livre/t-shirt) — paiement 100 % protégé par Vinted 🔒\n` +
    `2️⃣ Envoie-moi « C'est bon » ici dès que c'est payé !\n` +
    `3️⃣ Je t'envoie une photo de tes tubes scellés avec ton prénom avant d'expédier sous 24h depuis la France 📦⚡\n\n` +
    `🚨 IMPORTANT : Sur Vinted, n'écris JAMAIS « Tretinoin », « Tret », « Azelaic », « skincare » ou « crème » en message, sinon la commande risque d'être annulée.\n\n` +
    `Dis-moi dès que c'est fait ! 🫡👊`
  );
}

function buildUpdateMessage(
  lang: "EN" | "FR",
  productsText: string,
  price: number,
  link: string,
  restockEn: string,
  restockFr: string
): string {
  if (lang === "FR") {
    return (
      `Salut ! Tout d'abord sincèrement désolé pour l'attente 🙏🏻 Le restock a pris un peu plus de temps que prévu en transit, mais il devrait enfin arriver ${restockFr} 🔥\n\n` +
      `Petit rappel de ta commande réservée :\n` +
      `📦 Commande : ${productsText}\n` +
      `💶 Total : ${formatEuroFr(price)}\n` +
      `🔗 Lien Vinted réservé : ${link}\n\n` +
      `Pour rappel : l'annonce est toujours masquée pour l'instant (c'est normal si tu ne peux pas encore l'ouvrir). Dès que je reçois le stock, je t'envoie une photo de ta commande et j'ouvre le lien pour que tu puisses payer direct 🤝\n\n` +
      `Comme ça fait un petit moment que tu attends, tu me confirmes que c'est toujours bon pour toi que je te garde tes tubes de côté ? 🫡`
    );
  }
  return (
    `Hey! First, I'm really sorry for the wait 🙏🏻 The restock took a little longer in transit than expected, but it should finally land on ${restockEn} 🔥\n\n` +
    `Quick recap of your reserved order:\n` +
    `📦 Order: ${productsText}\n` +
    `💶 Total: ${formatEuroEn(price)}\n` +
    `🔗 Reserved Vinted link: ${link}\n\n` +
    `Reminder: the link is still hidden for now (totally normal if you can't open it yet). As soon as the stock lands, I'll send you a photo of your order and unlock the link so you can pay right away 🤝\n\n` +
    `Since you've been waiting a bit, quick check: is everything still good on your side so I keep your tubes locked for you? 🫡`
  );
}

function buildReviewMessage(lang: "EN" | "FR"): string {
  if (lang === "FR") {
    return (
      `Ton colis est livré ! 📦✅\n` +
      `J'espère que tout est carré ! Si t'es satisfait, mets-moi un petit avis 5 étoiles sur Vinted (sans jamais mentionner le produit 🙏🏻) et balance une petite photo ici pour le canal d'avis ! 🫡🔥`
    );
  }
  return (
    `Your package is delivered! 📦✅\n` +
    `Hope you love it! If you're happy with everything, please leave a 5-star review on Vinted (without mentioning the product 🙏🏻) and drop a quick pic here for our reviews channel! 🫡🔥`
  );
}

// ============================================================
// Vercel Web Standard HTTP Handlers
// ============================================================
export async function GET(): Promise<Response> {
  return new Response(JSON.stringify({ ok: true, service: "TretHubOrderBot" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: Request): Promise<Response> {
  const allowedUserId = getEnv("ALLOWED_TELEGRAM_ID", "6285490129");
  try {
    const update: any = await request.json();
    const msg = update?.message;
    if (!msg || typeof msg.text !== "string") {
      return new Response("OK", { status: 200 });
    }

    const fromId = String(msg.from?.id ?? "");
    const chatId = String(msg.chat?.id ?? "");

    if (fromId !== allowedUserId) {
      return new Response("OK", { status: 200 });
    }

    const text = msg.text.trim();
    if (/^\/(start|help)\b/i.test(text)) {
      await handleHelp(chatId);
    } else if (/^\/stock\b/i.test(text)) {
      await handleStock(chatId, text);
    } else if (/^\/setstock\b/i.test(text)) {
      await handleSetStock(chatId, text, 4, "Stock Physique");
    } else if (/^\/restock\b/i.test(text)) {
      await handleSetStock(chatId, text, 7, "Restock à venir");
    } else if (/^\/arrive\b/i.test(text)) {
      await handleArrive(chatId);
    } else if (/^\/add\b/i.test(text)) {
      await handleAddPool(chatId, text);
    } else if (/^\/pool\b/i.test(text)) {
      await handlePool(chatId, text);
    } else if (/^\/order\b/i.test(text)) {
      await handleBooking(chatId, text, "order");
    } else if (/^\/pre\b/i.test(text)) {
      await handleBooking(chatId, text, "pre");
    } else if (/^\/msg\b/i.test(text)) {
      await handleMsg(chatId, text);
    } else if (/^\/(lead|demarchage)\b/i.test(text)) {
      await handleLead(chatId, text);
    } else if (/^\/client\b/i.test(text)) {
      await handleClient(chatId, text);
    } else if (/^\/pending\b/i.test(text)) {
      await handlePending(chatId);
    } else if (/^\/paid\b/i.test(text)) {
      await handlePaid(chatId, text);
    } else if (/^\/ship\b/i.test(text)) {
      await handleShip(chatId, text);
    } else if (/^\/done\b/i.test(text)) {
      await handleDone(chatId, text);
    } else if (/^\/cancel\b/i.test(text)) {
      await handleCancel(chatId, text);
    } else if (/^\/stats\b/i.test(text)) {
      await handleStats(chatId);
    } else if (/^\/date\b/i.test(text)) {
      await handleDate(chatId, text);
    } else {
      await sendTg(chatId, "❓ Commande non reconnue. Tape <code>/help</code> pour la liste complète.");
    }
  } catch (err: any) {
    console.error("OrderBot error:", err);
    try {
      await sendTg(allowedUserId, `⚠️ <b>Erreur Bot :</b> <code>${escHtml(err?.message || err)}</code>`);
    } catch (innerErr) {
      console.error("Failed to notify admin:", innerErr);
    }
  }

  return new Response("OK", { status: 200 });
}
