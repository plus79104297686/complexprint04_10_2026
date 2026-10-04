import fs from "fs";
import path from "path";

const root = "/app/src";
const artSrc = fs.readFileSync(path.join(root, "data/articles.js"), "utf8");
const re = /slug:\s*"([^"]+)",\s*\n\s*seoTitle:\s*"((?:[^"\\]|\\.)*)",\s*\n\s*seoDescription:\s*\n?\s*"((?:[^"\\]|\\.)*)"/g;
let m; const arts = [];
while ((m = re.exec(artSrc)) !== null) arts.push({ slug: m[1], t: m[2], d: m[3] });

console.log("=== ARTICLES: seoTitle/seoDescription (" + arts.length + ") ===");
let bad = 0;
for (const a of arts) {
  const tFlag = a.t.length > 70 ? " !!! TITLE>70" : "";
  const dFlag = a.d.length < 25 || a.d.length > 160 ? " !!! DESC out" : "";
  if (tFlag || dFlag) bad++;
  console.log(`  T(${a.t.length})${tFlag}  D(${a.d.length})${dFlag}  ${a.slug}`);
}
console.log(bad === 0 ? "\n✅ ALL ARTICLES OK" : `\n❌ ${bad} problem(s)`);

// static pages
const pagesDir = path.join(root, "pages");
function walk(d){let f=[];for(const n of fs.readdirSync(d)){const p=path.join(d,n);if(fs.statSync(p).isDirectory())f=f.concat(walk(p));else if(n.endsWith(".jsx"))f.push(p);}return f;}
const files = walk(pagesDir).concat(["/app/public/index.html"]);
console.log("\n=== STATIC PAGES ===");
const titleMap={}, descMap={}; let sbad=0;
for (const file of files){
  const src = fs.readFileSync(file,"utf8");
  const tM = src.match(/<title>([\s\S]*?)<\/title>/);
  const dM = src.match(/<meta\s+name=["']description["']\s+content=\{?["']([\s\S]*?)["']\}?\s*\/?>/);
  const name = file.replace("/app/src/pages/","").replace("/app/","");
  let title = tM ? tM[1].trim() : null;
  let desc = dM ? dM[1].trim() : null;
  const tdyn = title && (title.includes("{") || title.includes("article."));
  const ddyn = desc && (desc.includes("{") || desc.includes("article."));
  const tlen = title && !tdyn ? title.length : null;
  const dlen = desc && !ddyn ? desc.length : null;
  const tFlag = tlen && tlen>70 ? " !!! >70" : "";
  const dFlag = dlen && (dlen<25||dlen>160) ? " !!! out" : "";
  if (tFlag||dFlag) sbad++;
  if (!title) { console.log(`  [NO TITLE] ${name}`); sbad++; }
  console.log(`  T(${tdyn?"dyn":tlen})${tFlag} D(${ddyn?"dyn":dlen})${dFlag}  ${name}`);
  if (tlen) (titleMap[title]=titleMap[title]||[]).push(name);
  if (dlen) (descMap[desc]=descMap[desc]||[]).push(name);
}
console.log("\n=== DUP TITLES ===");
let dup=0; for(const [k,v] of Object.entries(titleMap)) if(v.length>1){dup++;console.log(`  (${v.length}) ${k} -> ${v.join(", ")}`);}
console.log("=== DUP DESCRIPTIONS ===");
for(const [k,v] of Object.entries(descMap)) if(v.length>1){dup++;console.log(`  (${v.length}) ${k} -> ${v.join(", ")}`);}
console.log(`\n${sbad===0?"✅ STATIC OK":"❌ "+sbad+" static problem(s)"}  |  ${dup===0?"✅ NO DUPLICATES":"❌ "+dup+" dup group(s)"}`);
