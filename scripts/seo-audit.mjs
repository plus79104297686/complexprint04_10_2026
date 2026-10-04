import fs from "fs";
import path from "path";

const SUFFIX = " | Комплекс Принт — Аналитика"; // added to article titles
const root = "/app/src";

// --- 1. Articles ---
const artSrc = fs.readFileSync(path.join(root, "data/articles.js"), "utf8");
// crude parse: find blocks "title: \"...\"" and "description: \"...\"" and slug
const articles = [];
const re = /slug:\s*"([^"]+)"[\s\S]*?title:\s*"((?:[^"\\]|\\.)*)"[\s\S]*?description:\s*"((?:[^"\\]|\\.)*)"/g;
let m;
while ((m = re.exec(artSrc)) !== null) {
  articles.push({ slug: m[1], title: m[2], description: m[3] });
}

console.log("=== ARTICLES (" + articles.length + ") ===");
for (const a of articles) {
  const fullTitle = a.title + SUFFIX;
  console.log(`\nslug: ${a.slug}`);
  console.log(`  TITLE(full=${fullTitle.length}) base=${a.title.length}: ${fullTitle}`);
  console.log(`  DESC(${a.description.length}): ${a.description}`);
}

// --- 2. Static pages: parse <title>...</title> and meta description ---
const pagesDir = path.join(root, "pages");
function walk(dir) {
  let files = [];
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) files = files.concat(walk(p));
    else if (f.endsWith(".jsx") || f.endsWith(".js")) files.push(p);
  }
  return files;
}
const files = walk(pagesDir).concat(["/app/src/App.js", "/app/public/index.html"]);

console.log("\n\n=== STATIC PAGES ===");
const titleMap = {};
const descMap = {};
for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  const tM = src.match(/<title>([\s\S]*?)<\/title>/);
  const dM = src.match(/<meta\s+name=["']description["']\s+content=\{?["']?([\s\S]*?)["']?\}?\s*\/?>/);
  let title = tM ? tM[1].trim() : null;
  let desc = dM ? dM[1].trim() : null;
  // only show if string literal (no template expr complexity)
  console.log(`\n${file.replace("/app/","")}`);
  if (title) {
    const dyn = title.includes("{");
    console.log(`  TITLE(${dyn ? "dynamic" : title.length}): ${title}`);
    if (!dyn) titleMap[title] = (titleMap[title]||[]).concat(file);
  } else console.log("  TITLE: (none found)");
  if (desc) {
    const dyn = desc.includes("{") || desc.includes("article.");
    console.log(`  DESC(${dyn ? "dynamic" : desc.length}): ${desc}`);
    if (!dyn) descMap[desc] = (descMap[desc]||[]).concat(file);
  } else console.log("  DESC: (none found)");
}

console.log("\n\n=== DUPLICATE STATIC TITLES ===");
for (const [k,v] of Object.entries(titleMap)) if (v.length>1) console.log(`  (${v.length}) "${k}" -> ${v.map(x=>x.replace("/app/src/","")).join(", ")}`);
console.log("\n=== DUPLICATE STATIC DESCRIPTIONS ===");
for (const [k,v] of Object.entries(descMap)) if (v.length>1) console.log(`  (${v.length}) "${k}" -> ${v.map(x=>x.replace("/app/src/","")).join(", ")}`);

// --- 3. Article duplicates & length flags ---
console.log("\n\n=== ARTICLE TITLE LENGTH > 70 (full with suffix) ===");
for (const a of articles) {
  const full = a.title + SUFFIX;
  if (full.length > 70) console.log(`  ${full.length}: ${full}  [${a.slug}]`);
}
console.log("\n=== ARTICLE DESC OUT OF 25..160 ===");
for (const a of articles) {
  if (a.description.length < 25 || a.description.length > 160) console.log(`  ${a.description.length}: ${a.description}  [${a.slug}]`);
}
