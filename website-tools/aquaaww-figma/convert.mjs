// Figma (React+Tailwind) -> static HTML for /aquaaww/. Usage: node convert.mjs
import fs from "node:fs";
import { parse } from "@babel/parser";

const SRC = "/private/tmp/site_work/aq_ctx.js";
const code = fs.readFileSync(SRC, "utf8");
const ast = parse(code, { sourceType: "module", plugins: ["jsx"] });

// ---- asset id -> served path ------------------------------------------------
const prefixMatch = code.match(/assetPathPrefix = "([^"]+)"/)[1];
const NAMES = {
  Website: "/flipbook/img/bg.webp", Image14: "/flipbook/img/torn14.webp", Image13: "/flipbook/img/torn13.webp",
  Frame6: "grid", Screen: "screen", Screenshot20261018At45808Am1: "widget", Base: "base",
  Screenshot20261017At25025Pm1: "phone-shot", IPhone14Pro: "iphone", PasteImageHere1: "app-a", PasteImageHere2: "app-b",
  Paper39: "paper39", Screenshot20261018At21148Am1: "lucky", Paper32: "paper32", Paper27: "paper27", Paper18: "paper18",
  Paper10: "paper10", Paper08: "paper08", Paper07: "paper07",
};
const assets = {}; // identifier -> url
for (const node of ast.program.body) {
  if (node.type !== "VariableDeclaration") continue;
  for (const d of node.declarations) {
    if (!d.id.name?.startsWith("img")) continue;
    const tpl = d.init;
    if (tpl.type !== "TemplateLiteral") continue;
    const file = tpl.quasis[1].value.cooked.slice(1); // "72dcd.png"
    const [hash, ext] = file.split(".");
    const key = d.id.name.slice(3);
    let url;
    if (ext === "svg") url = `/aquaaww/img/${hash}.svg`;
    else {
      const n = NAMES[key];
      url = n?.startsWith("/") ? n : `/aquaaww/img/${n || hash}.webp`;
    }
    assets[d.id.name] = url;
  }
}
fs.writeFileSync("/private/tmp/site_work/tw/assets.json", JSON.stringify(assets, null, 1));

// ---- helpers -----------------------------------------------------------------
const FONTS = [
  [/font-\['Architects_Daughter:Regular'\]/g, "ff-ad"],
  [/font-\['Permanent_Marker:Regular'\]/g, "ff-pm"],
  [/font-\['JetBrains_Mono:Regular'\]/g, "ff-jb"],
  [/font-\['Inter:Semi_Bold'\]/g, "ff-in"],
];
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escA = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

function evalExpr(e) {
  if (!e) return "";
  if (e.type === "StringLiteral") return e.value;
  if (e.type === "Identifier") return assets[e.name] ?? e.name;
  if (e.type === "TemplateLiteral") {
    let out = "";
    e.quasis.forEach((q, i) => {
      out += q.value.cooked;
      if (e.expressions[i]) out += evalExpr(e.expressions[i]);
    });
    return out;
  }
  throw new Error("expr " + e.type);
}

function jsxText(raw) {
  const lines = raw.split(/\r\n|\n|\r/);
  let last = 0;
  lines.forEach((l, i) => { if (/[^ \t]/.test(l)) last = i; });
  let out = "";
  lines.forEach((l, i) => {
    let t = l.replace(/\t/g, " ");
    if (i !== 0) t = t.replace(/^ +/, "");
    if (i !== lines.length - 1) t = t.replace(/ +$/, "");
    if (t) { if (i !== last) t += " "; out += t; }
  });
  return out;
}

// tree: {tag, attrs:{}, children:[node|string]}
function build(n) {
  if (n.type === "JSXText") { const t = jsxText(n.value); return t ? t : null; }
  if (n.type === "JSXExpressionContainer") {
    if (n.expression.type === "JSXEmptyExpression") return null;
    return { text: evalExpr(n.expression) };
  }
  if (n.type !== "JSXElement") return null;
  const tag = n.openingElement.name.name;
  const attrs = {};
  for (const a of n.openingElement.attributes) {
    const k = a.name.name;
    if (a.value == null) { attrs[k] = true; continue; }
    if (a.value.type === "StringLiteral") { attrs[k] = a.value.value; continue; }
    const ex = a.value.expression;
    if (k === "style") {
      attrs.style = ex.properties.map((p) => {
        const key = (p.key.name || p.key.value).replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
        return `${key}:${evalExpr(p.value)}`;
      }).join(";");
    } else attrs[k] = evalExpr(ex);
  }
  const children = n.children.map(build).filter((c) => c !== null);
  return { tag, attrs, children };
}

function findByNode(t, id) {
  if (!t || typeof t === "string" || t.text !== undefined) return null;
  if (t.attrs["data-node-id"] === id) return t;
  for (const c of t.children) { const r = findByNode(c, id); if (r) return r; }
  return null;
}
function parentOf(t, target) {
  if (!t || typeof t === "string" || t.text !== undefined) return null;
  if (t.children.includes(target)) return t;
  for (const c of t.children) { const r = parentOf(c, target); if (r) return r; }
  return null;
}

let rootJsx;
(function find(n) {
  if (!n || typeof n !== "object") return;
  if (n.type === "ReturnStatement" && n.argument?.type === "JSXElement") { rootJsx = n.argument; return; }
  for (const k of Object.keys(n)) { const v = n[k]; if (Array.isArray(v)) v.forEach(find); else if (v && typeof v.type === "string") find(v); }
})(ast.program);
const tree = build(rootJsx);
const column = findByNode(tree, "2915:1862");
const logo = findByNode(tree, "2915:1869");

// ---- semantic hooks --------------------------------------------------------------
const hooks = JSON.parse(fs.readFileSync("/private/tmp/site_work/tw/hooks.json", "utf8"));
for (const h of hooks.retag || []) {
  const el = findByNode(column, h.id) || findByNode(logo, h.id);
  if (!el) { console.error("hook miss", h.id); continue; }
  el.tag = h.tag;
  Object.assign(el.attrs, h.attrs || {});
  if (h.removeClass) el.attrs.className = el.attrs.className.replace(h.removeClass, "").replace(/\s+/g, " ").trim();
  if (h.addClass) el.attrs.className = (el.attrs.className + " " + h.addClass).trim();
}
function allEls(t, out = []) { if (t && typeof t !== "string" && t.text === undefined) { out.push(t); t.children.forEach((c) => allEls(c, out)); } return out; }
function textOf(t) { return typeof t === "string" ? t : t.text !== undefined ? t.text : t.children.map(textOf).join(""); }
for (const h of hooks.retagText || []) {
  const el = allEls(column).find((e) => e.tag === "p" && textOf(e).startsWith(h.text));
  if (!el) { console.error("text hook miss", h.text); continue; }
  el.tag = h.tag;
  Object.assign(el.attrs, h.attrs || {});
}
for (const h of hooks.attrs || []) {
  const el = findByNode(column, h.id);
  if (!el) { console.error("hook miss", h.id); continue; }
  Object.assign(el.attrs, h.set);
}
for (const h of hooks.html || []) { // replace the whole element with a raw html string
  const el = findByNode(column, h.id);
  if (!el) { console.error("hook miss", h.id); continue; }
  el.raw = fs.readFileSync(h.file, "utf8");
}
for (const h of hooks.wrap || []) { // wrap an element in a new tag (e.g. a link)
  const el = findByNode(column, h.id);
  const p = parentOf(column, el);
  if (!el || !p) { console.error("hook miss", h.id); continue; }
  const w = { tag: h.tag, attrs: { ...h.attrs }, children: [el] };
  p.children[p.children.indexOf(el)] = w;
}
for (const h of hooks.group || []) { // wrap several sibling elements in one tag
  const els = h.ids.map((id) => findByNode(column, id));
  if (els.some((e) => !e)) { console.error("hook miss", h.ids); continue; }
  const p = parentOf(column, els[0]);
  const idx = p.children.indexOf(els[0]);
  const w = { tag: h.tag, attrs: { ...h.attrs }, children: els };
  p.children.splice(idx, 0, w);
  els.forEach((e) => p.children.splice(p.children.indexOf(e), 1));
}

// ---- serialise ---------------------------------------------------------------------
const VOID = new Set(["img", "br"]);
const KEEP = new Set(["href", "id", "type", "role", "alt", "aria-label", "aria-hidden", "src", "style", "class", "data-os", "loading", "decoding", "target", "rel", "open", "title", "width", "height", "data-open"]);
let lazy = hooks.lazyAfterNode || null;
let lazyOn = false;
function ser(n) {
  if (typeof n === "string") return esc(n);
  if (n.text !== undefined) return esc(n.text);
  if (n.raw !== undefined) return n.raw;
  if (n.attrs["data-node-id"] === lazy) lazyOn = true;
  let cls = ((n.attrs.className || "") + " " + (n.attrs.class || "")).trim();
  if (n.attrs["data-node-id"] === "2915:1862") cls = "col flex flex-col gap-[16px] items-start w-[830px]";
  for (const [re, to] of FONTS) cls = cls.replace(re, to);
  cls = cls.replace("border border-black border-solid", "card-b");
  const attrs = { ...n.attrs };
  delete attrs.className;
  if (cls) attrs.class = cls.replace(/\s+/g, " ").trim();
  if (attrs["aria-hidden"] === true) attrs["aria-hidden"] = "true";
  if (n.tag === "img") {
    if (attrs.alt === undefined || attrs.alt === "") {
      attrs.alt = "";
      for (const [k, v] of Object.entries(hooks.alts || {})) if (String(attrs.src).includes(k)) attrs.alt = v;
    }
    if (lazyOn) { attrs.loading = "lazy"; attrs.decoding = "async"; }
  }
  const parts = [];
  for (const [k, v] of Object.entries(attrs)) {
    if (!KEEP.has(k)) continue;
    if (v === true) parts.push(k); else parts.push(`${k}="${escA(String(v))}"`);
  }
  const open = `<${n.tag}${parts.length ? " " + parts.join(" ") : ""}>`;
  if (VOID.has(n.tag)) return open;
  return open + n.children.map(ser).join("") + `</${n.tag}>`;
}
// containerType style: keep (needed for cqw/cqh units). style attr already carries it as container-type.
const body = ser(column);
const logoHtml = ser(logo);
fs.writeFileSync("/private/tmp/site_work/tw/body.html", body);
fs.writeFileSync("/private/tmp/site_work/tw/logo.html", logoHtml);
console.log("body bytes", body.length, "logo", logoHtml.length);
