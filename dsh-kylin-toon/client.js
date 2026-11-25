window.__ModuleLoader__.load({id:"dsh-kylin-toon",factory:(require)=>{var module={exports:{}};var exports=module.exports;
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// client/src/index.jsx
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  default: () => index_default,
  inject: () => inject,
  name: () => name
});
module.exports = __toCommonJS(index_exports);
var import_react8 = __toESM(require("react"), 1);

// client/src/Workbench.jsx
var import_react7 = __toESM(require("react"), 1);
var import_react_dom = require("react-dom");

// client/src/api.js
var BASE = "/kylin-toon";
function endpoint(route, sessionId, extra) {
  const query = [];
  if (sessionId !== void 0 && sessionId !== "") query.push("sessionId=" + encodeURIComponent(sessionId));
  if (extra !== void 0) {
    for (const [key, value] of Object.entries(extra)) {
      if (value === void 0 || value === null) continue;
      query.push(encodeURIComponent(key) + "=" + encodeURIComponent(String(value)));
    }
  }
  return BASE + "/" + route + (query.length === 0 ? "" : "?" + query.join("&"));
}
function mediaUrl(sessionId, path) {
  return endpoint("media", sessionId, { path });
}
async function json(response) {
  var _a;
  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }
  if (!response.ok) {
    const error = new Error((_a = payload == null ? void 0 : payload.error) != null ? _a : "\u8BF7\u6C42\u5931\u8D25\uFF08" + String(response.status) + "\uFF09");
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}
async function fetchWorkspace(sessionId, signal) {
  return json(await fetch(endpoint("workspace", sessionId), { signal, cache: "no-store" }));
}
async function fetchFile(sessionId, path, signal) {
  return json(await fetch(endpoint("file", sessionId, { path }), { signal, cache: "no-store" }));
}
async function saveFile(sessionId, path, content, baseVersion) {
  var _a;
  const response = await fetch(endpoint("file", sessionId, { path }), {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ content, baseVersion })
  });
  if (response.status === 412) {
    const payload = await response.json().catch(() => ({}));
    const error = new Error((_a = payload == null ? void 0 : payload.error) != null ? _a : "\u6587\u4EF6\u5DF2\u5728\u78C1\u76D8\u4E0A\u66F4\u65B0");
    error.conflict = true;
    error.payload = payload;
    throw error;
  }
  return json(response);
}
async function fetchGame(sessionId, project, signal) {
  return json(await fetch(endpoint("game", sessionId, { project }), { signal, cache: "no-store" }));
}
async function switchGameProject(sessionId, project) {
  return json(await fetch(endpoint("game", sessionId), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "switch", project })
  }));
}
async function fetchDramaTemplates(sessionId, signal) {
  return json(await fetch(endpoint("drama/templates", sessionId), { signal, cache: "no-store" }));
}
async function createDramaTemplate(sessionId, directory, name2) {
  return json(await fetch(endpoint("drama/templates", sessionId), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "create", episode: directory, name: name2 })
  }));
}
async function applyDramaTemplate(sessionId, directory, id) {
  return json(await fetch(endpoint("drama/templates", sessionId), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "apply", episode: directory, id })
  }));
}
async function fetchComposition(sessionId, directory, signal) {
  return json(await fetch(endpoint("drama/composition", sessionId, { episode: directory }), { signal, cache: "no-store" }));
}
async function scaffoldComposition(sessionId, directory, options = {}) {
  return json(await fetch(endpoint("drama/composition", sessionId), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "scaffold", episode: directory, ...options })
  }));
}
async function repairComposition(sessionId, directory) {
  return json(await fetch(endpoint("drama/composition", sessionId), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "repair", episode: directory })
  }));
}
async function startCompositionStudio(sessionId, directory) {
  return json(await fetch(endpoint("drama/composition", sessionId), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "studio", episode: directory })
  }));
}
async function stopCompositionStudio(sessionId, directory) {
  return json(await fetch(endpoint("drama/composition", sessionId), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "stop", episode: directory })
  }));
}
async function renderComposition(sessionId, directory) {
  return json(await fetch(endpoint("drama/composition", sessionId), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "render", episode: directory })
  }));
}
async function fetchDramaVersions(sessionId, directory, signal) {
  return json(await fetch(endpoint("drama/versions", sessionId, { episode: directory }), { signal, cache: "no-store" }));
}
async function createDramaVersion(sessionId, directory, summary) {
  return json(await fetch(endpoint("drama/versions", sessionId), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "create", episode: directory, summary })
  }));
}
async function restoreDramaVersion(sessionId, directory, id) {
  return json(await fetch(endpoint("drama/versions", sessionId), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "restore", episode: directory, id })
  }));
}
async function fetchDramaMotion(sessionId, directory, signal) {
  return json(await fetch(endpoint("drama/motion", sessionId, { episode: directory }), { signal, cache: "no-store" }));
}
async function applyDramaMotion(sessionId, directory) {
  return json(await fetch(endpoint("drama/motion", sessionId), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "apply", episode: directory })
  }));
}
async function fetchGameBrief(sessionId, project, signal) {
  return json(await fetch(endpoint("game/brief", sessionId, { project }), { signal, cache: "no-store" }));
}
async function saveGameBrief(sessionId, project, fields) {
  return json(await fetch(endpoint("game/brief", sessionId), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ project, fields })
  }));
}
async function applyGameStage(sessionId, project, stage) {
  return json(await fetch(endpoint("game/stage", sessionId), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "apply", project, stage })
  }));
}
async function fetchConceptOptions(sessionId, project, signal) {
  return json(await fetch(endpoint("game/stage", sessionId, { action: "options", project }), { signal, cache: "no-store" }));
}
async function chooseGameConcept(sessionId, project, option) {
  return json(await fetch(endpoint("game/stage", sessionId), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "choose", project, option })
  }));
}
async function fetchGameSnapshots(sessionId, project, signal) {
  return json(await fetch(endpoint("game/snapshots", sessionId, { project }), { signal, cache: "no-store" }));
}
async function createGameSnapshot(sessionId, project, label) {
  return json(await fetch(endpoint("game/snapshots", sessionId), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "create", project, label })
  }));
}
async function restoreGameSnapshot(sessionId, project, id) {
  return json(await fetch(endpoint("game/snapshots", sessionId), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "restore", project, id })
  }));
}
async function deleteGameSnapshot(sessionId, project, id) {
  return json(await fetch(endpoint("game/snapshots", sessionId), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "delete", project, id })
  }));
}
async function fetchGameQa(sessionId, project, signal) {
  return json(await fetch(endpoint("game/qa", sessionId, { project }), { signal, cache: "no-store" }));
}
async function writeGameQaBrief(sessionId, project, authorSessionId) {
  return json(await fetch(endpoint("game/qa", sessionId), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "brief", project, authorSessionId })
  }));
}
async function recordGameQaSession(sessionId, project, qaSessionId) {
  return json(await fetch(endpoint("game/qa", sessionId), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "record", project, sessionId: qaSessionId })
  }));
}
async function fetchDrama(sessionId, directory, signal) {
  return json(await fetch(endpoint("drama", sessionId, { episode: directory }), { signal, cache: "no-store" }));
}
async function fetchIntents(sessionId, since, signal) {
  return json(await fetch(endpoint("intents", sessionId, { since }), { signal, cache: "no-store" }));
}
async function fetchReference(sessionId, signal) {
  return json(await fetch(endpoint("reference", sessionId), { signal, cache: "no-store" }));
}
async function uploadReference(sessionId, file) {
  return json(await fetch(endpoint("reference/upload", sessionId, { name: file.name }), {
    method: "POST",
    headers: { "content-type": file.type || "application/octet-stream" },
    body: file
  }));
}
async function intakeReferencePath(sessionId, path) {
  return json(await fetch(endpoint("reference/intake", sessionId), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ path })
  }));
}
async function downloadReference(sessionId, url) {
  return json(await fetch(endpoint("reference/fetch", sessionId), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url })
  }));
}
async function analyzeReference(sessionId) {
  return json(await fetch(endpoint("reference/analyze", sessionId), { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }));
}
async function chooseReference(sessionId, planId) {
  return json(await fetch(endpoint("reference/choose", sessionId), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ planId }) }));
}
async function confirmReferenceRights(sessionId, basis) {
  return json(await fetch(endpoint("reference/rights", sessionId), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ basis }) }));
}
async function exportReferenceDoc(sessionId) {
  return json(await fetch(endpoint("reference/export", sessionId), { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }));
}
async function resetReferenceDoc(sessionId) {
  return json(await fetch(endpoint("reference/reset", sessionId), { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }));
}
async function fetchNovel(sessionId, signal) {
  return json(await fetch(endpoint("novel", sessionId), { signal, cache: "no-store" }));
}
async function initNovelProject(sessionId, input) {
  return json(await fetch(endpoint("novel/init", sessionId), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input != null ? input : {})
  }));
}
async function createNovelChapter(sessionId, input) {
  return json(await fetch(endpoint("novel/chapter", sessionId), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "create", ...input != null ? input : {} })
  }));
}
async function fetchNovelChapterContext(sessionId, number) {
  return json(await fetch(endpoint("novel/chapter", sessionId), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "context", number })
  }));
}
async function publishNovel(sessionId, input) {
  return json(await fetch(endpoint("novel/publish", sessionId), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input != null ? input : {})
  }));
}
async function adaptNovel(sessionId, input) {
  return json(await fetch(endpoint("novel/adapt", sessionId), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input != null ? input : {})
  }));
}
async function reviewNovelChapter(sessionId, number) {
  return json(await fetch(endpoint("novel/review", sessionId), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ number })
  }));
}
async function buildNovelTask(sessionId, number) {
  return json(await fetch(endpoint("novel/task", sessionId), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ number })
  }));
}
async function finalizeNovelChapter(sessionId, number, force) {
  return json(await fetch(endpoint("novel/finalize", sessionId), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ number, ...force === true ? { force: true } : {} })
  }));
}
async function editNovelWorld(sessionId, input) {
  return json(await fetch(endpoint("novel/world", sessionId), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input != null ? input : {})
  }));
}
async function editNovelCharacter(sessionId, input) {
  return json(await fetch(endpoint("novel/character", sessionId), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input != null ? input : {})
  }));
}
async function importNovelProject(sessionId, input) {
  return json(await fetch(endpoint("novel/import", sessionId), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input != null ? input : {})
  }));
}
async function switchNovelProject(sessionId, project) {
  return json(await fetch(endpoint("novel/project", sessionId), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ project })
  }));
}

// client/src/tree.js
function buildTree(files, allowed) {
  const root = { name: "", children: /* @__PURE__ */ new Map(), files: [] };
  for (const file of files) {
    if (allowed !== void 0 && !allowed(file.path)) continue;
    const parts = file.path.split("/");
    let node = root;
    for (let index = 0; index < parts.length - 1; index++) {
      const part = parts[index];
      if (!node.children.has(part)) node.children.set(part, { name: part, path: parts.slice(0, index + 1).join("/"), children: /* @__PURE__ */ new Map(), files: [] });
      node = node.children.get(part);
    }
    node.files.push(file);
  }
  const sort = (node) => {
    const children = [...node.children.values()].map((child) => sort(child)).sort((a, b) => a.name.localeCompare(b.name, "zh-Hans-CN"));
    const files2 = node.files.slice().sort((a, b) => a.path.localeCompare(b.path, "zh-Hans-CN"));
    return { name: node.name, path: node.path, children, files: files2 };
  };
  return sort(root);
}

// client/src/markdown.jsx
var import_react = __toESM(require("react"), 1);
var INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
function inline(text, keyBase) {
  var _a;
  const nodes = [];
  let last = 0;
  let index = 0;
  for (const match of text.matchAll(INLINE)) {
    const start = (_a = match.index) != null ? _a : 0;
    if (start > last) nodes.push(text.slice(last, start));
    const token = match[0];
    if (token.startsWith("**")) nodes.push(import_react.default.createElement("strong", { key: keyBase + "-" + String(index++) }, token.slice(2, -2)));
    else if (token.startsWith("`")) nodes.push(import_react.default.createElement("code", { key: keyBase + "-" + String(index++) }, token.slice(1, -1)));
    else {
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (link !== null && /^https?:\/\//.test(link[2])) {
        nodes.push(import_react.default.createElement("a", { key: keyBase + "-" + String(index++), href: link[2], target: "_blank", rel: "noreferrer noopener" }, link[1]));
      } else nodes.push(token);
    }
    last = start + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}
function renderMarkdown(source) {
  const lines = String(source != null ? source : "").replace(/\r/g, "").split("\n");
  const blocks = [];
  let index = 0;
  let paragraph = [];
  const flush = () => {
    if (paragraph.length > 0) {
      blocks.push(import_react.default.createElement("p", { key: "p" + String(blocks.length) }, inline(paragraph.join(" "), "p" + String(blocks.length))));
      paragraph = [];
    }
  };
  while (index < lines.length) {
    const line = lines[index];
    if (/^```/.test(line)) {
      flush();
      const language = line.slice(3).trim();
      const body = [];
      index++;
      while (index < lines.length && !/^```/.test(lines[index])) {
        body.push(lines[index]);
        index++;
      }
      index++;
      blocks.push(import_react.default.createElement("pre", { key: "code" + String(blocks.length), "data-language": language }, import_react.default.createElement("code", null, body.join("\n"))));
      continue;
    }
    const heading = /^(#{1,4})\s+(.+)$/.exec(line);
    if (heading !== null) {
      flush();
      blocks.push(import_react.default.createElement("h" + String(heading[1].length), { key: "h" + String(blocks.length) }, inline(heading[2], "h" + String(blocks.length))));
      index++;
      continue;
    }
    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) {
      flush();
      blocks.push(import_react.default.createElement("hr", { key: "hr" + String(blocks.length) }));
      index++;
      continue;
    }
    if (/^\s*>\s?/.test(line)) {
      flush();
      const quote = [];
      while (index < lines.length && /^\s*>\s?/.test(lines[index])) {
        quote.push(lines[index].replace(/^\s*>\s?/, ""));
        index++;
      }
      blocks.push(import_react.default.createElement("blockquote", { key: "q" + String(blocks.length) }, quote.map((item, itemIndex) => import_react.default.createElement("p", { key: "q" + String(itemIndex) }, inline(item, "q" + String(itemIndex))))));
      continue;
    }
    if (/^\s*\|.*\|\s*$/.test(line)) {
      flush();
      const rows = [];
      while (index < lines.length && /^\s*\|.*\|\s*$/.test(lines[index])) {
        const cells = lines[index].trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
        if (!cells.every((cell) => /^:?-{2,}:?$/.test(cell))) rows.push(cells);
        index++;
      }
      blocks.push(import_react.default.createElement(
        "table",
        { key: "t" + String(blocks.length) },
        import_react.default.createElement("tbody", null, rows.map((cells, rowIndex) => import_react.default.createElement(
          "tr",
          { key: "r" + String(rowIndex) },
          cells.map((cell, cellIndex) => import_react.default.createElement(rowIndex === 0 ? "th" : "td", { key: "c" + String(cellIndex) }, inline(cell, "c" + String(rowIndex) + "-" + String(cellIndex))))
        )))
      ));
      continue;
    }
    const list = /^\s*([-*+]|\d+[.)])\s+(.+)$/.exec(line);
    if (list !== null) {
      flush();
      const ordered = /^\d/.test(list[1]);
      const items = [];
      while (index < lines.length) {
        const item = /^\s*([-*+]|\d+[.)])\s+(.+)$/.exec(lines[index]);
        if (item === null || ordered && !/^\d/.test(item[1]) || !ordered && /^\d/.test(item[1])) break;
        items.push(item[2]);
        index++;
      }
      blocks.push(import_react.default.createElement(ordered ? "ol" : "ul", { key: "l" + String(blocks.length) }, items.map((item, itemIndex) => import_react.default.createElement("li", { key: "i" + String(itemIndex) }, inline(item, "i" + String(itemIndex))))));
      continue;
    }
    if (line.trim() === "") {
      flush();
      index++;
      continue;
    }
    paragraph.push(line.trim());
    index++;
  }
  flush();
  return blocks;
}

// client/src/GameCanvas.jsx
var import_react2 = __toESM(require("react"), 1);
var STAGE_ICON = { done: "\u2713", partial: "\u25B3", pending: "\xB7", skipped: "\u2014", optional: "\u25C7" };
var ISOLATION_LABEL = { isolated: "\u5DF2\u9694\u79BB", "same-session": "\u540C\u4F1A\u8BDD\u81EA\u5BA1", unknown: "\u672A\u8BB0\u5F55" };
function statusText(stage) {
  var _a;
  return (_a = STAGE_ICON[stage.status]) != null ? _a : "\xB7";
}
function GameCanvas({
  projection,
  projectRoot,
  snapshots,
  qa,
  game,
  onOpenFile,
  onPrompt,
  onPlay,
  onCreateSnapshot,
  onRestoreSnapshot,
  onDeleteSnapshot,
  onWriteQaBrief,
  onRecordQa
}) {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  const [view, setView] = (0, import_react2.useState)({ x: 0, y: 0, scale: 1 });
  const drag = (0, import_react2.useRef)(void 0);
  if (projection === void 0 || projection === null) {
    return /* @__PURE__ */ import_react2.default.createElement("div", { className: "kt-empty" }, "\u8FD8\u6CA1\u6709\u9636\u6BB5\u6295\u5F71\uFF1A\u5148\u5EFA\u5DE5\u7A0B\u5E76\u5199 PRODUCT_BRIEF.md\u3002");
  }
  const stages = projection.stages;
  const docs = (_a = projection.documents) != null ? _a : [];
  const snapshotList = (_b = snapshots == null ? void 0 : snapshots.snapshots) != null ? _b : [];
  const stageTop = 64;
  const stageGap = 84;
  const stageIndex = new Map(stages.map((stage, index) => [stage.id, index]));
  const stageY = (id) => {
    var _a2;
    return stageTop + ((_a2 = stageIndex.get(id)) != null ? _a2 : 0) * stageGap;
  };
  const docsHeight = Math.max(360, docs.length * 48 + 80);
  const worldHeight = Math.max(560, stageTop + stages.length * stageGap + 40, docsHeight);
  const snapshotTop = 250;
  const qaTop = snapshotTop + Math.max(1, snapshotList.length) * 66 + 24;
  const nodes = [];
  for (const [index, stage] of stages.entries()) {
    nodes.push({ kind: "stage", stage, x: 32, y: stageTop + index * stageGap, w: 176, h: 60 });
  }
  for (const [index, document2] of docs.entries()) {
    nodes.push({ kind: "doc", document: document2, x: 286, y: 64 + index * 48, w: 240, h: 40 });
  }
  const build = { kind: "build", x: 604, y: stageTop, w: 300, h: 132 };
  const qaNode = { kind: "qa", x: 604, y: qaTop, w: 300, h: 138 };
  const snapshotNodes = snapshotList.map((snapshot, index) => ({ kind: "snapshot", snapshot, x: 604, y: snapshotTop + index * 66, w: 300, h: 52 }));
  const startDrag = (event) => {
    var _a2, _b2;
    if (event.button !== 0) return;
    drag.current = { x: event.clientX, y: event.clientY, originX: view.x, originY: view.y };
    (_b2 = (_a2 = event.currentTarget).setPointerCapture) == null ? void 0 : _b2.call(_a2, event.pointerId);
  };
  const onMove = (event) => {
    if (drag.current === void 0) return;
    setView((current) => ({ ...current, x: drag.current.originX + (event.clientX - drag.current.x), y: drag.current.originY + (event.clientY - drag.current.y) }));
  };
  const endDrag = () => {
    drag.current = void 0;
  };
  const zoom = (delta) => setView((current) => ({ ...current, scale: Math.min(1.6, Math.max(0.5, Math.round((current.scale + delta) * 10) / 10)) }));
  const openStage = (stage) => {
    var _a2;
    if (stage.status === "done" || stage.status === "partial") onOpenFile(projectRoot === void 0 ? stage.file : projectRoot + "/" + stage.file);
    else if (stage.status !== "skipped") onPrompt("\u7EE7\u7EED\u4E92\u52A8\u6E38\u620F\u300A" + projection.title + "\u300B\u7684\u300C" + stage.label + "\u300D\u9636\u6BB5\uFF1A" + ((_a2 = stage.action) != null ? _a2 : "") + " \u53EA\u5199 " + stage.file + "\uFF1B\u4E0D\u8981\u8DF3\u5230\u540E\u7EED\u9636\u6BB5\u3002");
  };
  return /* @__PURE__ */ import_react2.default.createElement("div", { className: "kt-canvas-wrap" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "kt-canvas-toolbar" }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "kt-canvas-title" }, "\u6E38\u620F\u753B\u5E03 \xB7 ", projection.title), /* @__PURE__ */ import_react2.default.createElement("span", { className: "kt-canvas-meta" }, projection.counts.done, "/", projection.counts.total, " \u9636\u6BB5 \xB7 ", projection.previewReady ? "\u53EF\u8BD5\u73A9" : "\u672A\u6784\u5EFA"), /* @__PURE__ */ import_react2.default.createElement("div", { className: "kt-canvas-tools" }, /* @__PURE__ */ import_react2.default.createElement("button", { type: "button", onClick: () => zoom(-0.1), title: "\u7F29\u5C0F" }, "\u2212"), /* @__PURE__ */ import_react2.default.createElement("span", null, Math.round(view.scale * 100), "%"), /* @__PURE__ */ import_react2.default.createElement("button", { type: "button", onClick: () => zoom(0.1), title: "\u653E\u5927" }, "+"), /* @__PURE__ */ import_react2.default.createElement("button", { type: "button", onClick: () => setView({ x: 0, y: 0, scale: 1 }) }, "\u590D\u4F4D"), /* @__PURE__ */ import_react2.default.createElement("button", { type: "button", onClick: () => onCreateSnapshot("\u753B\u5E03\u5FEB\u7167") }, "\u5B58\u5FEB\u7167"))), /* @__PURE__ */ import_react2.default.createElement(
    "div",
    {
      className: "kt-canvas",
      onPointerDown: startDrag,
      onPointerMove: onMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onWheel: (event) => {
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          zoom(event.deltaY > 0 ? -0.1 : 0.1);
        }
      }
    },
    /* @__PURE__ */ import_react2.default.createElement("div", { className: "kt-canvas-world", style: { width: 960, height: worldHeight, transform: "translate(" + view.x + "px, " + view.y + "px) scale(" + view.scale + ")" } }, /* @__PURE__ */ import_react2.default.createElement("svg", { className: "kt-canvas-lines", width: "960", height: worldHeight, "aria-hidden": "true" }, stages.slice(0, -1).map((stage, index) => /* @__PURE__ */ import_react2.default.createElement("line", { key: "chain-" + stage.id, x1: 120, y1: stageTop + index * stageGap + 60, x2: 120, y2: stageTop + (index + 1) * stageGap })), docs.map((document2, index) => {
      const y = stageY(document2.stage) + 30;
      return /* @__PURE__ */ import_react2.default.createElement("line", { key: "doc-" + document2.path, x1: 208, y1: y, x2: 286, y2: 64 + index * 48 + 20 });
    }), stages.map((stage) => /* @__PURE__ */ import_react2.default.createElement("line", { key: "build-" + stage.id, x1: 208, y1: stageY(stage.id) + 30, x2: 604, y2: stageTop + 66 })), snapshotNodes.map((node) => /* @__PURE__ */ import_react2.default.createElement("line", { key: "snap-" + node.snapshot.id, x1: 604, y1: stageTop + 66, x2: 604, y2: node.y + 26 })), /* @__PURE__ */ import_react2.default.createElement("line", { x1: 754, y1: stageTop + 132, x2: 754, y2: qaTop })), nodes.map((node) => {
      var _a2;
      return node.kind === "stage" ? /* @__PURE__ */ import_react2.default.createElement(
        "button",
        {
          key: "stage-" + node.stage.id,
          type: "button",
          className: "kt-canvas-node kt-canvas-stage is-" + node.stage.status + (((_a2 = projection.nextStage) == null ? void 0 : _a2.id) === node.stage.id ? " is-next" : ""),
          style: { left: node.x, top: node.y, width: node.w, height: node.h },
          onClick: () => openStage(node.stage),
          title: node.stage.detail
        },
        /* @__PURE__ */ import_react2.default.createElement("span", { className: "kt-canvas-dot" }, statusText(node.stage)),
        /* @__PURE__ */ import_react2.default.createElement("span", null, /* @__PURE__ */ import_react2.default.createElement("strong", null, node.stage.label), /* @__PURE__ */ import_react2.default.createElement("em", null, node.stage.file.split("/").pop()))
      ) : /* @__PURE__ */ import_react2.default.createElement(
        "button",
        {
          key: "doc-" + node.document.path,
          type: "button",
          className: "kt-canvas-node kt-canvas-doc",
          style: { left: node.x, top: node.y, width: node.w, height: node.h },
          onClick: () => onOpenFile(node.document.path),
          title: node.document.path
        },
        /* @__PURE__ */ import_react2.default.createElement("strong", null, node.document.label),
        /* @__PURE__ */ import_react2.default.createElement("em", null, node.document.file)
      );
    }), /* @__PURE__ */ import_react2.default.createElement("div", { className: "kt-canvas-node kt-canvas-build", style: { left: build.x, top: build.y, width: build.w, height: build.h } }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "kt-canvas-node-head" }, /* @__PURE__ */ import_react2.default.createElement("strong", null, "\u53EF\u73A9\u6784\u5EFA"), /* @__PURE__ */ import_react2.default.createElement("span", { className: projection.previewReady ? "kt-canvas-ok" : "kt-canvas-warn" }, projection.previewReady ? "\u5DF2\u5C31\u7EEA" : "\u672A\u751F\u6210")), /* @__PURE__ */ import_react2.default.createElement("code", null, "build/app/index.html"), projection.previewReady ? /* @__PURE__ */ import_react2.default.createElement("button", { type: "button", onClick: onPlay }, "\u8FDB\u5165\u8BD5\u73A9") : /* @__PURE__ */ import_react2.default.createElement("button", { type: "button", onClick: () => onPrompt("\u7EE7\u7EED\u4E92\u52A8\u6E38\u620F\u300A" + projection.title + "\u300B\u7684\u300C\u7070\u76D2\u300D\u9636\u6BB5\uFF1A\u5148\u628A\u6838\u5FC3\u5FAA\u73AF\u505A\u6210 build/app/index.html\u3002") }, "\u53BB\u5BF9\u8BDD\u505A\u7070\u76D2")), snapshotNodes.map((node) => /* @__PURE__ */ import_react2.default.createElement("div", { key: "snapshot-" + node.snapshot.id, className: "kt-canvas-node kt-canvas-snapshot", style: { left: node.x, top: node.y, width: node.w, height: node.h } }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "kt-canvas-node-head" }, /* @__PURE__ */ import_react2.default.createElement("strong", null, node.snapshot.label), /* @__PURE__ */ import_react2.default.createElement("em", null, node.snapshot.id)), /* @__PURE__ */ import_react2.default.createElement("div", { className: "kt-canvas-snapshot-actions" }, /* @__PURE__ */ import_react2.default.createElement("button", { type: "button", onClick: () => onRestoreSnapshot(node.snapshot.id) }, "\u56DE\u6EDA"), /* @__PURE__ */ import_react2.default.createElement("button", { type: "button", onClick: () => onDeleteSnapshot(node.snapshot.id) }, "\u5220\u9664")))), /* @__PURE__ */ import_react2.default.createElement("div", { className: "kt-canvas-node kt-canvas-qa", style: { left: qaNode.x, top: qaNode.y, width: qaNode.w, height: qaNode.h } }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "kt-canvas-node-head" }, /* @__PURE__ */ import_react2.default.createElement("strong", null, "\u76F2\u6D4B\u4E0E\u9A8C\u6536"), /* @__PURE__ */ import_react2.default.createElement("span", { className: "kt-canvas-isolation is-" + ((_e = (_d = (_c = qa == null ? void 0 : qa.isolation) == null ? void 0 : _c.status) != null ? _d : projection.qaIsolation) != null ? _e : "unknown") }, (_h = ISOLATION_LABEL[(_g = (_f = qa == null ? void 0 : qa.isolation) == null ? void 0 : _f.status) != null ? _g : projection.qaIsolation]) != null ? _h : "\u672A\u8BB0\u5F55")), /* @__PURE__ */ import_react2.default.createElement("p", null, projection.verification.status === "PASS" ? "\u516D\u9879 PASS" : projection.verification.status === "FAIL" ? "\u9A8C\u6536\u672A\u901A\u8FC7" : "\u5C1A\u672A\u9A8C\u6536", " \xB7 \u5FEB\u7167 ", snapshotList.length, " \u4E2A"), /* @__PURE__ */ import_react2.default.createElement("div", { className: "kt-canvas-qa-actions" }, /* @__PURE__ */ import_react2.default.createElement("button", { type: "button", onClick: () => onWriteQaBrief() }, "\u751F\u6210\u76F2\u6D4B\u4EA4\u63A5\u5355"), /* @__PURE__ */ import_react2.default.createElement("button", { type: "button", onClick: () => onRecordQa() }, "\u672C\u4F1A\u8BDD\u662F\u76F2\u6D4B\u4F1A\u8BDD"))))
  ), /* @__PURE__ */ import_react2.default.createElement("div", { className: "kt-canvas-hint" }, "\u62D6\u52A8\u5E73\u79FB \xB7 \u6309\u4F4F Ctrl/\u2318 \u6EDA\u8F6E\u7F29\u653E \xB7 \u70B9\u8282\u70B9\u6253\u5F00\u6587\u4EF6\u6216\u9001\u5BF9\u8BDD"));
}

// client/src/GameStage.jsx
var import_react3 = __toESM(require("react"), 1);
var ISOLATION_LABEL2 = { isolated: "\u5DF2\u9694\u79BB", "same-session": "\u540C\u4F1A\u8BDD\u81EA\u5BA1", unknown: "\u672A\u8BB0\u5F55" };
var BRIEF_INPUTS = [
  ["sourceNovel", "\u539F\u8457", "text", "\u65E0\uFF08\u539F\u521B\uFF09\u6216\u300A\u4E66\u540D\u300B"],
  ["platform", "\u5E73\u53F0\u4E0E\u8FD0\u884C\u65F6", "text", "\u7F51\u9875 / Godot 4 / Unity / \u79FB\u52A8\u7AEF"],
  ["playDirection", "\u73A9\u6CD5\u65B9\u5411", "textarea", "\u73A9\u5BB6\u53CD\u590D\u505A\u4EC0\u4E48\uFF0C\u4E00\u53E5\u8BDD\u8BF4\u6E05"],
  ["immersion", "\u6838\u5FC3\u4EE3\u5165\u611F", "textarea", "\u73A9\u5BB6\u626E\u6F14\u8C01\u3001\u8FFD\u6C42\u4EC0\u4E48\u3001\u5931\u8D25\u7684\u4EE3\u4EF7"],
  ["reference", "\u5BF9\u6807\u5148\u4F8B", "text", "\u53EF\u9009\uFF1A\u76F8\u8FD1\u7684\u6E38\u620F\u6216\u4F5C\u54C1"],
  ["audience", "\u53D7\u4F17", "text", "\u53EF\u9009"],
  ["language", "\u5E02\u573A\u4E0E\u754C\u9762\u8BED\u8A00", "text", "\u4E2D\u6587"],
  ["notDoing", "\u660E\u786E\u4E0D\u505A", "textarea", "\u8303\u56F4\u5916\u7684\u4E1C\u897F"],
  ["budget", "\u65F6\u957F\u4E0E\u9884\u7B97", "text", "\u53EF\u9009"],
  ["rating", "\u7248\u6743\u4E0E\u5206\u7EA7", "text", "\u53EF\u9009"]
];
function BriefForm({ brief, projectRoot, saving, error, onSaveBrief, onOpenFile }) {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  const [fields, setFields] = (0, import_react3.useState)((_a = brief == null ? void 0 : brief.fields) != null ? _a : {});
  const [title, setTitle] = (0, import_react3.useState)((_b = brief == null ? void 0 : brief.title) != null ? _b : "");
  const [localError, setLocalError] = (0, import_react3.useState)(void 0);
  const projectRef = (0, import_react3.useRef)(brief == null ? void 0 : brief.project);
  (0, import_react3.useEffect)(() => {
    var _a2, _b2;
    if ((brief == null ? void 0 : brief.project) !== projectRef.current) {
      projectRef.current = brief == null ? void 0 : brief.project;
      setFields((_a2 = brief == null ? void 0 : brief.fields) != null ? _a2 : {});
      setTitle((_b2 = brief == null ? void 0 : brief.title) != null ? _b2 : "");
    }
  }, [brief == null ? void 0 : brief.project, brief == null ? void 0 : brief.fields, brief == null ? void 0 : brief.title]);
  if (brief === void 0) return /* @__PURE__ */ import_react3.default.createElement("div", { className: "kt-empty" }, "\u8BFB\u53D6 PRODUCT_BRIEF \u8868\u5355\u2026");
  const set = (key) => (event) => setFields((current) => ({ ...current, [key]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    setLocalError(void 0);
    const result = await onSaveBrief({ ...fields, title });
    if ((result == null ? void 0 : result.form) !== void 0) {
      setFields(result.form.fields);
      setTitle(result.form.title);
    }
  };
  const shownError = localError != null ? localError : error;
  return /* @__PURE__ */ import_react3.default.createElement("form", { className: "kt-stage-card kt-brief-form", onSubmit: submit }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "kt-stage-card-head" }, /* @__PURE__ */ import_react3.default.createElement("strong", null, "\u7ACB\u9879 \xB7 PRODUCT_BRIEF"), /* @__PURE__ */ import_react3.default.createElement("span", { className: "kt-stage-hint" }, "\u586B\u5B8C\u5E73\u53F0\u3001\u73A9\u6CD5\u3001\u6838\u5FC3\u4EE3\u5165\u611F\u624D\u7B97\u7ACB\u9879\u5B8C\u6210"), /* @__PURE__ */ import_react3.default.createElement("button", { type: "button", className: "kt-link", onClick: () => onOpenFile(projectRoot + "/PRODUCT_BRIEF.md") }, "\u6253\u5F00\u539F\u6587")), /* @__PURE__ */ import_react3.default.createElement("div", { className: "kt-form-grid" }, /* @__PURE__ */ import_react3.default.createElement("label", { className: "kt-form-row kt-form-wide" }, /* @__PURE__ */ import_react3.default.createElement("span", null, "\u6807\u9898"), /* @__PURE__ */ import_react3.default.createElement("input", { value: title, onChange: (event) => setTitle(event.target.value), placeholder: "\u4F5C\u54C1\u6807\u9898" })), BRIEF_INPUTS.map(([key, label, kind, placeholder]) => {
    var _a2, _b2;
    return /* @__PURE__ */ import_react3.default.createElement("label", { className: "kt-form-row" + (kind === "textarea" ? " kt-form-wide" : ""), key }, /* @__PURE__ */ import_react3.default.createElement("span", null, label), kind === "textarea" ? /* @__PURE__ */ import_react3.default.createElement("textarea", { rows: 2, value: (_a2 = fields[key]) != null ? _a2 : "", onChange: set(key), placeholder }) : /* @__PURE__ */ import_react3.default.createElement("input", { value: (_b2 = fields[key]) != null ? _b2 : "", onChange: set(key), placeholder }));
  }), /* @__PURE__ */ import_react3.default.createElement("label", { className: "kt-form-row" }, /* @__PURE__ */ import_react3.default.createElement("span", null, "\u5B8C\u6210\u5EA6 targetFinish"), /* @__PURE__ */ import_react3.default.createElement("select", { value: (_c = fields.targetFinish) != null ? _c : "playable-prototype", onChange: set("targetFinish") }, ((_e = (_d = brief.enums) == null ? void 0 : _d.targetFinish) != null ? _e : []).map((value) => /* @__PURE__ */ import_react3.default.createElement("option", { key: value, value }, value)))), /* @__PURE__ */ import_react3.default.createElement("label", { className: "kt-form-row" }, /* @__PURE__ */ import_react3.default.createElement("span", null, "\u4F53\u9A8C\u4E3B\u7EBF experienceProfile"), /* @__PURE__ */ import_react3.default.createElement("select", { value: (_f = fields.experienceProfile) != null ? _f : "narrative-led", onChange: set("experienceProfile") }, ((_h = (_g = brief.enums) == null ? void 0 : _g.experienceProfile) != null ? _h : []).map((value) => /* @__PURE__ */ import_react3.default.createElement("option", { key: value, value }, value))))), shownError === void 0 ? null : /* @__PURE__ */ import_react3.default.createElement("p", { className: "kt-form-error" }, shownError), /* @__PURE__ */ import_react3.default.createElement("div", { className: "kt-form-actions" }, /* @__PURE__ */ import_react3.default.createElement("button", { type: "submit", className: "kt-primary", disabled: saving }, saving ? "\u4FDD\u5B58\u4E2D\u2026" : "\u4FDD\u5B58\u7ACB\u9879"), /* @__PURE__ */ import_react3.default.createElement("span", { className: "kt-stage-hint" }, "\u300C\u5F85\u5B9A\u300D\u4F1A\u4FDD\u7559\u4E3A\u672A\u5B8C\u6210\uFF1B\u4E0D\u4F1A\u66FF\u521B\u4F5C\u8005\u62CD\u677F\u3002")));
}
function ConceptChooser({ projection, projectRoot, options, choosing, onApplyStage, onChooseOption, onOpenFile }) {
  var _a, _b;
  const list = (_a = options == null ? void 0 : options.options) != null ? _a : [];
  const chosen = options == null ? void 0 : options.chosen;
  const relevant = ((_b = projection.nextStage) == null ? void 0 : _b.id) === "concept" || list.length > 0 || chosen !== void 0;
  if (!relevant) return null;
  return /* @__PURE__ */ import_react3.default.createElement("section", { className: "kt-stage-card" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "kt-stage-card-head" }, /* @__PURE__ */ import_react3.default.createElement("strong", null, "\u6982\u5FF5 \xB7 \u4E09\u9009\u4E00"), /* @__PURE__ */ import_react3.default.createElement("span", { className: "kt-stage-hint" }, chosen === void 0 ? "\u9009\u4E00\u4E2A\u65B9\u5411\uFF0C\u518D\u5199 CONCEPT.md" : "\u5DF2\u9009\u5B9A\u65B9\u6848 " + chosen), chosen === void 0 ? null : /* @__PURE__ */ import_react3.default.createElement("button", { type: "button", className: "kt-link", onClick: () => onOpenFile(projectRoot + "/concepts/CONCEPT.md") }, "\u6253\u5F00\u6982\u5FF5")), list.length === 0 ? /* @__PURE__ */ import_react3.default.createElement("div", { className: "kt-stage-empty" }, /* @__PURE__ */ import_react3.default.createElement("p", null, "\u8FD8\u6CA1\u6709\u4E09\u4E2A\u65B9\u5411\u7684\u5BF9\u6BD4\u3002\u5148\u843D\u6A21\u677F\uFF0C\u518D\u8BA9 Agent \u586B\u6210\u5DEE\u5F02\u660E\u663E\u7684 A/B/C\u3002"), /* @__PURE__ */ import_react3.default.createElement("button", { type: "button", onClick: () => onApplyStage("concept") }, "\u751F\u6210\u6982\u5FF5\u4E09\u9009\u4E00\u6A21\u677F")) : /* @__PURE__ */ import_react3.default.createElement("div", { className: "kt-concept-options" }, list.map((option) => /* @__PURE__ */ import_react3.default.createElement("article", { key: option.id, className: "kt-concept-card" + (chosen === option.id ? " is-chosen" : "") }, /* @__PURE__ */ import_react3.default.createElement("header", null, /* @__PURE__ */ import_react3.default.createElement("b", null, option.id), /* @__PURE__ */ import_react3.default.createElement("strong", null, option.title)), /* @__PURE__ */ import_react3.default.createElement("p", null, option.summary), /* @__PURE__ */ import_react3.default.createElement(
    "button",
    {
      type: "button",
      disabled: chosen !== void 0 || choosing !== void 0,
      onClick: () => onChooseOption(option.id)
    },
    chosen === option.id ? "\u5DF2\u9009\u5B9A" : choosing === option.id ? "\u9009\u5B9A\u4E2D\u2026" : "\u9009\u5B9A " + option.id
  )))), /* @__PURE__ */ import_react3.default.createElement("p", { className: "kt-stage-hint" }, "\u9009\u5B9A\u53EA\u751F\u6210 CONCEPT.md\uFF1B\u628A\u300C\u5F85\u586B\u300D\u8865\u5B8C\u624D\u4F1A\u88AB\u6295\u5F71\u7B97\u4F5C\u6982\u5FF5\u5B8C\u6210\u3002"));
}
function TemplateCard({ projection, projectRoot, onApplyStage, onOpenFile, onPrompt }) {
  const stage = projection.nextStage;
  if (stage === void 0 || ["brief", "concept", "qa"].includes(stage.id)) return null;
  const exists = stage.status === "partial";
  return /* @__PURE__ */ import_react3.default.createElement("section", { className: "kt-stage-card" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "kt-stage-card-head" }, /* @__PURE__ */ import_react3.default.createElement("strong", null, "\u4E0B\u4E00\u6B65 \xB7 ", stage.label), /* @__PURE__ */ import_react3.default.createElement("span", { className: "kt-stage-hint" }, stage.file)), /* @__PURE__ */ import_react3.default.createElement("p", { className: "kt-stage-detail" }, stage.detail), /* @__PURE__ */ import_react3.default.createElement("div", { className: "kt-form-actions" }, exists ? /* @__PURE__ */ import_react3.default.createElement("button", { type: "button", onClick: () => onOpenFile(projectRoot + "/" + stage.file) }, "\u6253\u5F00\u5F85\u586B\u6587\u4EF6") : /* @__PURE__ */ import_react3.default.createElement("button", { type: "button", onClick: () => onApplyStage(stage.id) }, "\u5957\u7528 ", stage.label, " \u6A21\u677F"), /* @__PURE__ */ import_react3.default.createElement("button", { type: "button", onClick: () => {
    var _a;
    return onPrompt("\u7EE7\u7EED\u4E92\u52A8\u6E38\u620F\u300A" + projection.title + "\u300B\u7684\u300C" + stage.label + "\u300D\u9636\u6BB5\uFF1A" + ((_a = stage.action) != null ? _a : "") + " \u53EA\u5199 " + stage.file + "\u3002");
  } }, "\u8BA9 Agent \u7EE7\u7EED")));
}
function QaCard({ projection, projectRoot, qa, onWriteQa, onRecordQa, onOpenFile }) {
  var _a, _b, _c, _d, _e, _f;
  const status = (_c = (_b = (_a = qa == null ? void 0 : qa.isolation) == null ? void 0 : _a.status) != null ? _b : projection.qaIsolation) != null ? _c : "unknown";
  const relevant = ((_d = projection.nextStage) == null ? void 0 : _d.id) === "qa" || (qa == null ? void 0 : qa.plan) !== void 0 || projection.verification.status === "PASS";
  if (!relevant) return null;
  const prompt = (_e = qa == null ? void 0 : qa.prompt) != null ? _e : "";
  const copy = () => {
    if (prompt === "") return;
    if (typeof navigator !== "undefined" && navigator.clipboard !== void 0) navigator.clipboard.writeText(prompt).catch(() => {
    });
  };
  return /* @__PURE__ */ import_react3.default.createElement("section", { className: "kt-stage-card kt-qa-card" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "kt-stage-card-head" }, /* @__PURE__ */ import_react3.default.createElement("strong", null, "\u76F2\u6D4B\u4E0E\u9A8C\u6536"), /* @__PURE__ */ import_react3.default.createElement("span", { className: "kt-canvas-isolation is-" + status }, (_f = ISOLATION_LABEL2[status]) != null ? _f : status), (qa == null ? void 0 : qa.plan) === void 0 ? null : /* @__PURE__ */ import_react3.default.createElement("button", { type: "button", className: "kt-link", onClick: () => onOpenFile(projectRoot + "/qa/\u76F2\u6D4B\u4EFB\u52A1.md") }, "\u6253\u5F00\u4EFB\u52A1\u4E66")), /* @__PURE__ */ import_react3.default.createElement("p", { className: "kt-stage-hint" }, "\u9A8C\u6536\u8981\u5728\u4E00\u4E2A\u6CA1\u8BFB\u8FC7\u6E90\u7801\u548C\u8BBE\u8BA1\u6587\u6863\u7684\u65B0\u4F1A\u8BDD\u91CC\u76F2\u73A9\uFF1B\u540C\u4F1A\u8BDD\u81EA\u5BA1\u4F1A\u88AB\u5224\u4E3A\u672A\u5B8C\u6210\u3002"), /* @__PURE__ */ import_react3.default.createElement("div", { className: "kt-form-actions" }, /* @__PURE__ */ import_react3.default.createElement("button", { type: "button", onClick: onWriteQa }, (qa == null ? void 0 : qa.plan) === void 0 ? "\u751F\u6210\u76F2\u6D4B\u4EA4\u63A5\u5355" : "\u91CD\u65B0\u751F\u6210\u4EA4\u63A5\u5355"), /* @__PURE__ */ import_react3.default.createElement("button", { type: "button", onClick: copy, disabled: prompt === "" }, "\u590D\u5236\u76F2\u6D4B\u63D0\u793A\u8BCD"), /* @__PURE__ */ import_react3.default.createElement("button", { type: "button", onClick: onRecordQa }, "\u672C\u4F1A\u8BDD\u662F\u76F2\u6D4B\u4F1A\u8BDD\uFF0C\u8BB0\u5F55 id")), prompt === "" ? null : /* @__PURE__ */ import_react3.default.createElement("pre", { className: "kt-qa-prompt" }, prompt), status === "same-session" ? /* @__PURE__ */ import_react3.default.createElement("p", { className: "kt-form-error" }, "\u5F53\u524D\u8BB0\u5F55\u7684\u76F2\u6D4B\u4F1A\u8BDD\u5C31\u662F\u521B\u4F5C\u4F1A\u8BDD\uFF1B\u6362\u4E00\u4E2A\u65B0\u4F1A\u8BDD\u91CD\u8DD1\uFF0C\u4E0D\u8981\u5728\u8FD9\u91CC\u81EA\u5BA1\u3002") : null);
}
function GameStageWorkbench({ projection, projectRoot, brief, options, qa, savingBrief, briefError, choosing, onSaveBrief, onApplyStage, onChooseOption, onOpenFile, onPrompt, onWriteQa, onRecordQa }) {
  if (projection === void 0 || projection === null) return /* @__PURE__ */ import_react3.default.createElement("div", { className: "kt-empty" }, "\u8BFB\u53D6\u9636\u6BB5\u6295\u5F71\u2026");
  return /* @__PURE__ */ import_react3.default.createElement("div", { className: "kt-stage-workbench" }, /* @__PURE__ */ import_react3.default.createElement(BriefForm, { brief, projectRoot, saving: savingBrief, error: briefError, onSaveBrief, onOpenFile }), /* @__PURE__ */ import_react3.default.createElement(ConceptChooser, { projection, projectRoot, options, choosing, onApplyStage, onChooseOption, onOpenFile }), /* @__PURE__ */ import_react3.default.createElement(TemplateCard, { projection, projectRoot, onApplyStage, onOpenFile, onPrompt }), /* @__PURE__ */ import_react3.default.createElement(QaCard, { projection, projectRoot, qa, onWriteQa, onRecordQa, onOpenFile }));
}

// client/src/MotionView.jsx
var import_react4 = __toESM(require("react"), 1);
var SEVERITY_LABEL = { blocker: "\u963B\u65AD", warning: "\u63D0\u793A" };
function MotionView({ data, loading, error, episode, onApply, onRefresh, onPrompt, onOpenFile }) {
  var _a, _b, _c, _d, _e, _f;
  if (loading === true) return /* @__PURE__ */ import_react4.default.createElement("div", { className: "kt-empty" }, "\u8BFB\u53D6 Motion \u5951\u7EA6\u2026");
  if (error !== void 0) return /* @__PURE__ */ import_react4.default.createElement("div", { className: "kt-empty" }, "\u8BFB\u53D6\u5931\u8D25\uFF1A", error);
  const motion = data;
  const actions = /* @__PURE__ */ import_react4.default.createElement("div", { className: "kt-form-actions" }, (motion == null ? void 0 : motion.present) === true ? null : /* @__PURE__ */ import_react4.default.createElement("button", { type: "button", onClick: onApply }, "\u751F\u6210 Motion \u6A21\u677F"), /* @__PURE__ */ import_react4.default.createElement("button", { type: "button", onClick: onRefresh }, "\u6821\u9A8C / \u5237\u65B0"), (motion == null ? void 0 : motion.present) === true ? /* @__PURE__ */ import_react4.default.createElement("button", { type: "button", onClick: () => onOpenFile(motion.path) }, "\u6253\u5F00 MOTION.md") : null, /* @__PURE__ */ import_react4.default.createElement("button", { type: "button", onClick: () => onPrompt("\u7ED9 " + (episode != null ? episode : "\u672C\u96C6") + " \u8865\u5199 MOTION.md\uFF1A\u4FDD\u6301\u955C\u5934\u987A\u5E8F\u4E0E\u65F6\u957F\uFF0C\u5199\u6E05\u4FDD\u6301\u9879\u3001\u66FF\u6362\u9879\u3001\u89C6\u89C9\u8FD0\u52A8\u3001\u58F0\u97F3\u4E0E\u81F3\u5C11\u4E09\u4E2A\u540C\u523B\u5BF9\u6BD4\u8BC1\u636E\uFF1B\u5148\u53EA\u6539 MOTION.md\u3002") }, "\u8BA9 Agent \u8865\u5168"));
  if (motion === void 0 || motion.present !== true) {
    return /* @__PURE__ */ import_react4.default.createElement("div", { className: "kt-motion" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "kt-stage-card" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "kt-stage-card-head" }, /* @__PURE__ */ import_react4.default.createElement("strong", null, "Motion \u5951\u7EA6 \xB7 \u8FD8\u6CA1\u6709 MOTION.md")), /* @__PURE__ */ import_react4.default.createElement("p", { className: "kt-stage-hint" }, "\u5148\u4ECE\u5206\u955C\u751F\u6210\u955C\u5934\u65F6\u95F4\u8F74\u9AA8\u67B6\uFF0C\u518D\u8BA9 Agent \u5199\u4FDD\u6301/\u66FF\u6362/\u8BC1\u636E\u3002\u5B83\u4E0D\u662F\u5206\u955C\u7684\u66FF\u4EE3\u54C1\uFF0C\u800C\u662F\u201C\u8FD9\u96C6\u4FDD\u7559\u4EC0\u4E48\u3001\u6362\u4EC0\u4E48\u3001\u62FF\u4EC0\u4E48\u8BC1\u660E\u201D\u7684\u5951\u7EA6\u3002"), actions));
  }
  const blockers = ((_a = motion.diagnostics) != null ? _a : []).filter((item) => item.severity === "blocker");
  const warnings = ((_b = motion.diagnostics) != null ? _b : []).filter((item) => item.severity !== "blocker");
  return /* @__PURE__ */ import_react4.default.createElement("div", { className: "kt-motion" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "kt-stage-card" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "kt-stage-card-head" }, /* @__PURE__ */ import_react4.default.createElement("strong", null, "Motion \xB7 ", (_c = motion.episode) != null ? _c : episode), /* @__PURE__ */ import_react4.default.createElement("span", { className: motion.ok ? "kt-canvas-ok" : "kt-canvas-warn" }, motion.ok ? "\u5951\u7EA6\u901A\u8FC7" : "\u6709\u963B\u65AD"), /* @__PURE__ */ import_react4.default.createElement("span", { className: "kt-stage-hint" }, "\u65F6\u95F4\u8F74 ", (_e = (_d = motion.timeline) == null ? void 0 : _d.length) != null ? _e : 0, " \u955C")), actions), /* @__PURE__ */ import_react4.default.createElement("div", { className: "kt-stage-card" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "kt-stage-card-head" }, /* @__PURE__ */ import_react4.default.createElement("strong", null, "\u955C\u5934\u65F6\u95F4\u8F74"), /* @__PURE__ */ import_react4.default.createElement("span", { className: "kt-stage-hint" }, "\u4E0E\u5206\u955C\u9010\u955C\u5BF9\u8D26")), ((_f = motion.timeline) != null ? _f : []).length === 0 ? /* @__PURE__ */ import_react4.default.createElement("p", { className: "kt-stage-hint" }, "\u65F6\u95F4\u8F74\u6CA1\u6709\u955C\u5934\u884C\u3002") : /* @__PURE__ */ import_react4.default.createElement("table", { className: "kt-motion-table" }, /* @__PURE__ */ import_react4.default.createElement("thead", null, /* @__PURE__ */ import_react4.default.createElement("tr", null, /* @__PURE__ */ import_react4.default.createElement("th", null, "\u955C\u5934"), /* @__PURE__ */ import_react4.default.createElement("th", null, "\u5165\u70B9"), /* @__PURE__ */ import_react4.default.createElement("th", null, "\u51FA\u70B9"), /* @__PURE__ */ import_react4.default.createElement("th", null, "\u65F6\u957F"), /* @__PURE__ */ import_react4.default.createElement("th", null, "\u8F6C\u573A"), /* @__PURE__ */ import_react4.default.createElement("th", null, "\u53F0\u8BCD/\u58F0\u97F3"))), /* @__PURE__ */ import_react4.default.createElement("tbody", null, motion.timeline.map((row) => {
    var _a2, _b2, _c2;
    return /* @__PURE__ */ import_react4.default.createElement("tr", { key: row.id + ":" + row.line }, /* @__PURE__ */ import_react4.default.createElement("td", null, row.id), /* @__PURE__ */ import_react4.default.createElement("td", null, (_a2 = row.start) != null ? _a2 : "?"), /* @__PURE__ */ import_react4.default.createElement("td", null, (_b2 = row.end) != null ? _b2 : "?"), /* @__PURE__ */ import_react4.default.createElement("td", null, (_c2 = row.duration) != null ? _c2 : "?", "s"), /* @__PURE__ */ import_react4.default.createElement("td", null, row.transition), /* @__PURE__ */ import_react4.default.createElement("td", null, row.note));
  })))), /* @__PURE__ */ import_react4.default.createElement("div", { className: "kt-motion-grid" }, /* @__PURE__ */ import_react4.default.createElement(MotionList, { title: "\u4FDD\u6301", items: motion.keep }), /* @__PURE__ */ import_react4.default.createElement(MotionList, { title: "\u66FF\u6362", items: motion.replace }), /* @__PURE__ */ import_react4.default.createElement(MotionList, { title: "\u68C0\u67E5\u4E0E\u8BC1\u636E", items: motion.evidence })), blockers.length > 0 || warnings.length > 0 ? /* @__PURE__ */ import_react4.default.createElement("div", { className: "kt-stage-card" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "kt-stage-card-head" }, /* @__PURE__ */ import_react4.default.createElement("strong", null, "\u8BCA\u65AD"), /* @__PURE__ */ import_react4.default.createElement("span", { className: "kt-stage-hint" }, "\u963B\u65AD ", blockers.length, " \xB7 \u63D0\u793A ", warnings.length)), blockers.map((item) => /* @__PURE__ */ import_react4.default.createElement("p", { key: "b" + item.code + item.line, className: "kt-form-error" }, SEVERITY_LABEL[item.severity], " ", item.line ? "\u7B2C " + item.line + " \u884C \xB7 " : "", item.message)), warnings.map((item) => /* @__PURE__ */ import_react4.default.createElement("p", { key: "w" + item.code + item.line, className: "kt-stage-hint" }, SEVERITY_LABEL[item.severity], " ", item.line ? "\u7B2C " + item.line + " \u884C \xB7 " : "", item.message))) : /* @__PURE__ */ import_react4.default.createElement("p", { className: "kt-stage-hint" }, "\u6CA1\u6709\u53D1\u73B0\u5951\u7EA6\u95EE\u9898\u3002"));
}
function MotionList({ title, items }) {
  const list = items != null ? items : [];
  return /* @__PURE__ */ import_react4.default.createElement("div", { className: "kt-stage-card" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "kt-stage-card-head" }, /* @__PURE__ */ import_react4.default.createElement("strong", null, title), /* @__PURE__ */ import_react4.default.createElement("span", { className: "kt-stage-hint" }, list.length, " \u6761")), list.length === 0 ? /* @__PURE__ */ import_react4.default.createElement("p", { className: "kt-stage-hint" }, "\u8FD8\u6CA1\u6709\u5199\u3002") : /* @__PURE__ */ import_react4.default.createElement("ul", { className: "kt-motion-list" }, list.map((item, index) => /* @__PURE__ */ import_react4.default.createElement("li", { key: index }, item))));
}

// client/src/VersionsView.jsx
var import_react5 = __toESM(require("react"), 1);
function VersionsView({ data, loading, error, episode, onCreate, onRestore, onRefresh }) {
  var _a, _b, _c;
  const [summary, setSummary] = (0, import_react5.useState)("");
  if (loading === true) return /* @__PURE__ */ import_react5.default.createElement("div", { className: "kt-empty" }, "\u8BFB\u53D6\u672C\u96C6\u7248\u672C\u2026");
  if (error !== void 0) return /* @__PURE__ */ import_react5.default.createElement("div", { className: "kt-empty" }, "\u8BFB\u53D6\u5931\u8D25\uFF1A", error);
  const versions = (_a = data == null ? void 0 : data.versions) != null ? _a : [];
  return /* @__PURE__ */ import_react5.default.createElement("div", { className: "kt-motion" }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "kt-stage-card" }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "kt-stage-card-head" }, /* @__PURE__ */ import_react5.default.createElement("strong", null, "\u7248\u672C \xB7 ", (_c = (_b = data == null ? void 0 : data.episode) != null ? _b : episode) != null ? _c : "\u672C\u96C6"), /* @__PURE__ */ import_react5.default.createElement("span", { className: "kt-stage-hint" }, versions.length, " \u4E2A\u7248\u672C \xB7 \u6062\u590D\u4F1A\u65B0\u5EFA vN")), /* @__PURE__ */ import_react5.default.createElement("div", { className: "kt-form-actions" }, /* @__PURE__ */ import_react5.default.createElement("input", { value: summary, placeholder: "\u7248\u672C\u8BF4\u660E\uFF08\u53EF\u9009\uFF09", onChange: (event) => setSummary(event.target.value) }), /* @__PURE__ */ import_react5.default.createElement("button", { type: "button", onClick: () => {
    onCreate(summary);
    setSummary("");
  } }, "\u5B58\u4E00\u7248"), /* @__PURE__ */ import_react5.default.createElement("button", { type: "button", onClick: onRefresh }, "\u5237\u65B0")), /* @__PURE__ */ import_react5.default.createElement("p", { className: "kt-stage-hint" }, "\u5FEB\u7167 \u5267\u672C / \u89C6\u89C9\u8BBE\u5B9A / \u5206\u955C / MOTION / \u63D0\u793A\u8BCD / \u526A\u8F91\u5355\uFF0C\u4EE5\u53CA composition \u7684 HTML/JSON\uFF1B\u4E0D\u590D\u5236 assets \u5A92\u4F53\u4E0E\u5236\u4F5C\u6210\u679C\u3002")), versions.length === 0 ? /* @__PURE__ */ import_react5.default.createElement("div", { className: "kt-empty" }, "\u8FD8\u6CA1\u6709\u7248\u672C\u5FEB\u7167\u3002") : /* @__PURE__ */ import_react5.default.createElement("div", { className: "kt-stage-card" }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "kt-stage-card-head" }, /* @__PURE__ */ import_react5.default.createElement("strong", null, "\u5386\u53F2")), /* @__PURE__ */ import_react5.default.createElement("table", { className: "kt-motion-table" }, /* @__PURE__ */ import_react5.default.createElement("thead", null, /* @__PURE__ */ import_react5.default.createElement("tr", null, /* @__PURE__ */ import_react5.default.createElement("th", null, "\u7248\u672C"), /* @__PURE__ */ import_react5.default.createElement("th", null, "\u65F6\u95F4"), /* @__PURE__ */ import_react5.default.createElement("th", null, "\u6587\u4EF6"), /* @__PURE__ */ import_react5.default.createElement("th", null, "\u8BF4\u660E"), /* @__PURE__ */ import_react5.default.createElement("th", null))), /* @__PURE__ */ import_react5.default.createElement("tbody", null, versions.map((version) => {
    var _a2;
    return /* @__PURE__ */ import_react5.default.createElement("tr", { key: version.id }, /* @__PURE__ */ import_react5.default.createElement("td", null, "v", version.versionNumber), /* @__PURE__ */ import_react5.default.createElement("td", null, version.createdAt), /* @__PURE__ */ import_react5.default.createElement("td", null, version.files.length), /* @__PURE__ */ import_react5.default.createElement("td", null, (_a2 = version.summary) != null ? _a2 : "\u2014"), /* @__PURE__ */ import_react5.default.createElement("td", null, /* @__PURE__ */ import_react5.default.createElement("button", { type: "button", onClick: () => onRestore(version.id) }, "\u6062\u590D")));
  })))));
}

// client/src/CompositionView.jsx
var import_react6 = __toESM(require("react"), 1);
function CompositionView({ data, loading, error, episode, templates, onScaffold, onStudio, onStop, onRender, onRefresh, openBrowser, onCreateTemplate, onApplyTemplate, onRefreshTemplates, onRepair }) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
  const [busy, setBusy] = (0, import_react6.useState)(void 0);
  const [actionError, setActionError] = (0, import_react6.useState)(void 0);
  const [renderResult, setRenderResult] = (0, import_react6.useState)(void 0);
  const [width, setWidth] = (0, import_react6.useState)(1080);
  const [height, setHeight] = (0, import_react6.useState)(1920);
  const [fps, setFps] = (0, import_react6.useState)(30);
  const [templateName, setTemplateName] = (0, import_react6.useState)("");
  const [templateMessage, setTemplateMessage] = (0, import_react6.useState)(void 0);
  const [templateBusy, setTemplateBusy] = (0, import_react6.useState)(false);
  if (loading === true && data === void 0) return /* @__PURE__ */ import_react6.default.createElement("div", { className: "kt-empty" }, "\u68C0\u67E5 HTML \u5DE5\u7A0B\u2026");
  if (error !== void 0 && data === void 0) return /* @__PURE__ */ import_react6.default.createElement("div", { className: "kt-empty" }, "\u8BFB\u53D6\u5931\u8D25\uFF1A", error);
  const present = (data == null ? void 0 : data.present) === true;
  const run = async (name2, task) => {
    setBusy(name2);
    setActionError(void 0);
    try {
      await task();
    } catch (cause) {
      setActionError(cause.message);
    } finally {
      setBusy(void 0);
    }
  };
  const scaffold = () => run("scaffold", async () => {
    await onScaffold({ width: Number(width), height: Number(height), fps: Number(fps) });
    await onRefresh();
  });
  const studio = () => run("studio", async () => {
    const result = await onStudio();
    if ((result == null ? void 0 : result.proxyUrl) === void 0) throw new Error("Studio \u542F\u52A8\u5931\u8D25\uFF1A\u6CA1\u6709\u53CD\u4EE3\u5730\u5740");
    if (typeof openBrowser !== "function" || openBrowser(result.proxyUrl) !== true) {
      throw new Error("\u5F15\u64CE\u81EA\u5E26\u6D4F\u89C8\u5668\u4E0D\u53EF\u7528\uFF1B\u4E0D\u6253\u5F00\u7CFB\u7EDF\u6D4F\u89C8\u5668\uFF0C\u8BF7\u68C0\u67E5\u53F3\u4FA7 Browser \u9875\u7B7E");
    }
  });
  const render = () => run("render", async () => {
    const result = await onRender();
    setRenderResult(result);
    await onRefresh();
  });
  return /* @__PURE__ */ import_react6.default.createElement("div", { className: "kt-composition" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "kt-stage-card" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "kt-stage-card-head" }, /* @__PURE__ */ import_react6.default.createElement("strong", null, "HTML \u5DE5\u7A0B \xB7 ", episode), /* @__PURE__ */ import_react6.default.createElement("span", { className: "kt-stage-hint" }, present ? (_a = data.path) != null ? _a : "composition/" : "\u8FD8\u6CA1\u6709 composition/")), /* @__PURE__ */ import_react6.default.createElement("p", { className: "kt-stage-hint" }, "\u6E32\u67D3\u6808\u4E0E\u7F16\u8F91\u5668\u6539\u7528 Hyperframes\uFF1A\u5DE5\u7A0B\u662F ", /* @__PURE__ */ import_react6.default.createElement("code", null, "composition/index.html"), " + \u955C\u5934\u6587\u4EF6\uFF0CStudio \u7F16\u8F91\u540C\u4E00\u7EC4\u6587\u4EF6\uFF0C", /* @__PURE__ */ import_react6.default.createElement("code", null, "hyperframes render"), " \u51FA MP4\u3002\u81EA\u7814\u65F6\u95F4\u7EBF/ffmpeg \u88C5\u914D\u4E0D\u518D\u7528\u4E8E\u65B0\u5DE5\u7A0B\u3002"), !present ? /* @__PURE__ */ import_react6.default.createElement("div", { className: "kt-form-grid" }, /* @__PURE__ */ import_react6.default.createElement("label", { className: "kt-form-row" }, /* @__PURE__ */ import_react6.default.createElement("span", null, "\u753B\u5BBD"), /* @__PURE__ */ import_react6.default.createElement("input", { type: "number", value: width, onChange: (event) => setWidth(event.target.value) })), /* @__PURE__ */ import_react6.default.createElement("label", { className: "kt-form-row" }, /* @__PURE__ */ import_react6.default.createElement("span", null, "\u753B\u9AD8"), /* @__PURE__ */ import_react6.default.createElement("input", { type: "number", value: height, onChange: (event) => setHeight(event.target.value) })), /* @__PURE__ */ import_react6.default.createElement("label", { className: "kt-form-row" }, /* @__PURE__ */ import_react6.default.createElement("span", null, "\u5E27\u7387"), /* @__PURE__ */ import_react6.default.createElement("input", { type: "number", value: fps, onChange: (event) => setFps(event.target.value) })), /* @__PURE__ */ import_react6.default.createElement("div", { className: "kt-form-row" }, /* @__PURE__ */ import_react6.default.createElement("span", null)), /* @__PURE__ */ import_react6.default.createElement("div", { className: "kt-form-actions" }, /* @__PURE__ */ import_react6.default.createElement("button", { type: "button", disabled: busy !== void 0, onClick: scaffold }, busy === "scaffold" ? "\u751F\u6210\u4E2D\u2026" : "\u4ECE\u5206\u955C\u751F\u6210 HTML \u5DE5\u7A0B"))) : /* @__PURE__ */ import_react6.default.createElement(import_react6.default.Fragment, null, /* @__PURE__ */ import_react6.default.createElement("div", { className: "kt-form-actions" }, /* @__PURE__ */ import_react6.default.createElement("button", { type: "button", disabled: busy !== void 0, onClick: studio }, busy === "studio" ? "\u542F\u52A8\u4E2D\u2026" : "\u5728\u5F15\u64CE\u6D4F\u89C8\u5668\u4E2D\u6253\u5F00 Studio"), /* @__PURE__ */ import_react6.default.createElement("button", { type: "button", disabled: busy !== void 0, onClick: render }, busy === "render" ? "\u6E32\u67D3\u4E2D\u2026" : "\u6E32\u67D3\u6210\u7247"), /* @__PURE__ */ import_react6.default.createElement("button", { type: "button", disabled: busy !== void 0, onClick: () => run("stop", onStop) }, "\u505C\u6B62 Studio"), /* @__PURE__ */ import_react6.default.createElement("button", { type: "button", disabled: busy !== void 0, onClick: () => run("repair", async () => {
    await onRepair();
    await onRefresh();
  }) }, busy === "repair" ? "\u4FEE\u590D\u4E2D\u2026" : "\u4FEE\u590D\u65E7\u573A\u666F\u8BA1\u65F6"), /* @__PURE__ */ import_react6.default.createElement("button", { type: "button", disabled: busy !== void 0, onClick: onRefresh }, "\u5237\u65B0\u68C0\u67E5")), /* @__PURE__ */ import_react6.default.createElement("p", { className: "kt-stage-hint" }, data.ok === true ? "lint \u901A\u8FC7\uFF08" + String((_b = data.warningCount) != null ? _b : 0) + " warning\uFF09" : "lint \u6709 " + String((_c = data.errorCount) != null ? _c : 0) + " error / " + String((_d = data.warningCount) != null ? _d : 0) + " warning", data.cli === false ? " \xB7 \u627E\u4E0D\u5230 hyperframes CLI" : ""), data.coverage === void 0 ? null : /* @__PURE__ */ import_react6.default.createElement("p", { className: data.coverage.ok ? "kt-stage-hint" : "kt-form-error" }, "\u955C\u5934\u8986\u76D6\uFF1A", data.coverage.hosted, "/", data.coverage.expected, data.coverage.missing.length > 0 ? " \xB7 \u7F3A " + data.coverage.missing.join("\u3001") : "", data.coverage.extra.length > 0 ? " \xB7 \u591A " + data.coverage.extra.join("\u3001") : "")), actionError === void 0 ? null : /* @__PURE__ */ import_react6.default.createElement("p", { className: "kt-form-error" }, actionError), (data == null ? void 0 : data.error) === void 0 ? null : /* @__PURE__ */ import_react6.default.createElement("p", { className: "kt-form-error" }, data.error)), renderResult === void 0 ? null : /* @__PURE__ */ import_react6.default.createElement("div", { className: "kt-stage-card" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "kt-stage-card-head" }, /* @__PURE__ */ import_react6.default.createElement("strong", null, "\u6E32\u67D3\u7ED3\u679C"), /* @__PURE__ */ import_react6.default.createElement("span", { className: "kt-stage-hint" }, renderResult.ok ? "\u6280\u672F\u9A8C\u8BC1\u901A\u8FC7" : "\u6280\u672F\u9A8C\u8BC1\u672A\u901A\u8FC7")), /* @__PURE__ */ import_react6.default.createElement("p", { className: "kt-stage-hint" }, renderResult.output, " \xB7 ", (_e = renderResult.actual) == null ? void 0 : _e.width, "\xD7", (_f = renderResult.actual) == null ? void 0 : _f.height, " \xB7 ", (_g = renderResult.actual) == null ? void 0 : _g.fps, "fps \xB7 ", (_h = renderResult.actual) == null ? void 0 : _h.durationSec, "s"), ((_i = renderResult.checks) != null ? _i : []).filter((check) => !check.ok).map((check) => /* @__PURE__ */ import_react6.default.createElement("p", { key: check.id, className: "kt-form-error" }, "\u672A\u901A\u8FC7 ", check.id, "\uFF1A\u671F\u671B ", String(check.expected), "\uFF0C\u5B9E\u9645 ", String(check.actual)))), /* @__PURE__ */ import_react6.default.createElement("div", { className: "kt-stage-card" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "kt-stage-card-head" }, /* @__PURE__ */ import_react6.default.createElement("strong", null, "\u6A21\u677F\u5305"), /* @__PURE__ */ import_react6.default.createElement("span", { className: "kt-stage-hint" }, "\u5206\u955C/\u955C\u5934\u8868 \xB7 kt-template.json + TEMPLATE.md + sha256")), /* @__PURE__ */ import_react6.default.createElement("div", { className: "kt-form-actions" }, /* @__PURE__ */ import_react6.default.createElement("input", { value: templateName, placeholder: "\u6A21\u677F\u540D\uFF08\u7F3A\u7701\u7528\u5267\u96C6 ID\uFF09", onChange: (event) => setTemplateName(event.target.value) }), /* @__PURE__ */ import_react6.default.createElement("button", { type: "button", disabled: templateBusy, onClick: async () => {
    setTemplateBusy(true);
    setTemplateMessage(void 0);
    try {
      const result = await onCreateTemplate(templateName);
      setTemplateMessage("\u5DF2\u521B\u5EFA " + result.path);
      setTemplateName("");
      await onRefreshTemplates();
    } catch (cause) {
      setTemplateMessage(cause.message);
    } finally {
      setTemplateBusy(false);
    }
  } }, "\u628A\u672C\u96C6\u5B58\u4E3A\u6A21\u677F")), ((_j = templates == null ? void 0 : templates.templates) != null ? _j : []).length === 0 ? /* @__PURE__ */ import_react6.default.createElement("p", { className: "kt-stage-hint" }, "\u8FD8\u6CA1\u6709\u6A21\u677F\uFF1B\u5148\u5B58\u4E00\u7248\u5DF2\u9A8C\u8BC1\u7ED3\u6784\u3002") : /* @__PURE__ */ import_react6.default.createElement("table", { className: "kt-motion-table" }, /* @__PURE__ */ import_react6.default.createElement("thead", null, /* @__PURE__ */ import_react6.default.createElement("tr", null, /* @__PURE__ */ import_react6.default.createElement("th", null, "\u6A21\u677F"), /* @__PURE__ */ import_react6.default.createElement("th", null, "\u7248\u672C"), /* @__PURE__ */ import_react6.default.createElement("th", null, "\u6587\u4EF6/\u69FD\u4F4D"), /* @__PURE__ */ import_react6.default.createElement("th", null))), /* @__PURE__ */ import_react6.default.createElement("tbody", null, ((_k = templates.templates) != null ? _k : []).map((template) => /* @__PURE__ */ import_react6.default.createElement("tr", { key: template.id }, /* @__PURE__ */ import_react6.default.createElement("td", null, template.name, /* @__PURE__ */ import_react6.default.createElement("br", null), /* @__PURE__ */ import_react6.default.createElement("span", { className: "kt-stage-hint" }, template.id)), /* @__PURE__ */ import_react6.default.createElement("td", null, "v", template.version), /* @__PURE__ */ import_react6.default.createElement("td", null, template.files, " / ", template.slots), /* @__PURE__ */ import_react6.default.createElement("td", null, /* @__PURE__ */ import_react6.default.createElement("button", { type: "button", disabled: templateBusy, onClick: async () => {
    setTemplateBusy(true);
    setTemplateMessage(void 0);
    try {
      const result = await onApplyTemplate(template.id);
      setTemplateMessage("\u5DF2\u751F\u6210 " + result.path);
    } catch (cause) {
      setTemplateMessage(cause.message);
    } finally {
      setTemplateBusy(false);
    }
  } }, "\u5957\u7528")))))), templateMessage === void 0 ? null : /* @__PURE__ */ import_react6.default.createElement("p", { className: "kt-stage-hint" }, templateMessage)), present && ((_l = data.findings) != null ? _l : []).length > 0 ? /* @__PURE__ */ import_react6.default.createElement("div", { className: "kt-stage-card" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "kt-stage-card-head" }, /* @__PURE__ */ import_react6.default.createElement("strong", null, "lint \u53D1\u73B0"), /* @__PURE__ */ import_react6.default.createElement("span", { className: "kt-stage-hint" }, data.findings.length, " \u6761")), data.findings.slice(0, 20).map((finding, index) => /* @__PURE__ */ import_react6.default.createElement("p", { key: index, className: finding.severity === "error" ? "kt-form-error" : "kt-stage-hint" }, finding.severity, " \xB7 ", finding.code, " \xB7 ", finding.message, finding.file === void 0 ? "" : " \xB7 " + finding.file))) : null);
}

// client/src/game-state.js
function selectActiveGameProjection(gameData, currentGame) {
  const projection = gameData == null ? void 0 : gameData.projection;
  if (projection === void 0 || projection === null) return void 0;
  return projection.id === (currentGame == null ? void 0 : currentGame.id) ? projection : void 0;
}

// client/src/selection.js
function buildSelectionPrompt(path, text, instruction) {
  const quote = String(text != null ? text : "").split(/\r?\n/).map((line) => "> " + line).join("\n");
  const ask = String(instruction != null ? instruction : "").trim() === "" ? "\u8FD9\u6BB5\u63CF\u5199\u4E0D\u597D\uFF0C\u8BF7\u6539\u5199\u5F97\u66F4\u81EA\u7136\u3001\u5177\u4F53\uFF0C\u907F\u514D\u5957\u8BDD\uFF0C\u4FDD\u7559\u539F\u6709\u60C5\u8282\u4FE1\u606F\u3002" : String(instruction).trim();
  return "\u4FEE\u6539\u6587\u4EF6 `" + (path != null ? path : "\u5F53\u524D\u6587\u4EF6") + "` \u4E2D\u8FD9\u6BB5\u5185\u5BB9\uFF1A\n\n" + quote + "\n\n\u8981\u6C42\uFF1A" + ask + "\n\n\u5148\u8BFB\u4E0A\u4E0B\u6587\uFF0C\u76F4\u63A5\u4FEE\u6539\u6587\u4EF6\u5E76\u4FDD\u7559\u5176\u4ED6\u6BB5\u843D\uFF1B\u6539\u5B8C\u5217\u51FA\u6539\u4E86\u54EA\u91CC\u3002";
}

// client/src/file-refresh.js
function shouldAutoReload(disk, buffer) {
  if (disk === void 0 || buffer === void 0) return false;
  if (buffer.dirty === true || buffer.error !== void 0) return false;
  if (disk.version === void 0) return false;
  return String(disk.version) !== String(buffer.version);
}

// client/src/tab-visibility.js
function visibleTabIds(workspace, ids) {
  var _a;
  const kinds = (_a = workspace == null ? void 0 : workspace.kinds) != null ? _a : {};
  return ids.filter((id) => kinds[id] === true);
}

// client/src/Workbench.jsx
var TABS = [
  { id: "story", label: "\u5C0F\u8BF4" },
  { id: "drama", label: "\u77ED\u5267\u6F2B\u5267" },
  { id: "game", label: "\u4E92\u52A8\u6E38\u620F" },
  { id: "video", label: "\u89C6\u9891\u89E3\u8BF4" }
];
var NOVEL_DIRECTORIES = ["\u6B63\u6587", "\u5927\u7EB2", "\u8BBE\u5B9A", "\u8FFD\u8E2A", "\u7AE0\u8282", "\u5BF9\u6807", "\u53C2\u8003\u8D44\u6599"];
var NOVEL_ROOT_FILES = ["\u7075\u611F.md", "\u6545\u4E8B\u67B6\u6784.md", "\u8BBE\u5B9A.md", "\u4EBA\u7269.md", "\u5927\u7EB2.md", "\u5C0F\u8282\u5927\u7EB2.md", "\u6B63\u6587.md", "\u8FFD\u8E2A.md", "\u53D1\u5E03\u8D44\u6599.md", "\u6539\u7F16\u8BA1\u5212.md"];
var DRAMA_DIRECTORY = "\u5267\u96C6";
var DRAMA_FILES = ["\u5267\u672C.md", "\u89C6\u89C9\u8BBE\u5B9A.md", "\u5206\u955C.md", "MOTION.md", "\u56FE\u7247\u63D0\u793A\u8BCD.md", "\u89C6\u9891\u63D0\u793A\u8BCD.md", "\u526A\u8F91\u5355.md"];
var GAME_DIRECTORY = "game-adaptations";
var VIDEO_DIRECTORY = "video-recaps";
var KIND_LABEL = { story: "\u5C0F\u8BF4", drama: "\u77ED\u5267\u6F2B\u5267", game: "\u4E92\u52A8\u6E38\u620F", video: "\u89C6\u9891\u89E3\u8BF4" };
function headOf(path) {
  return path.split("/")[0];
}
function isStoryPath(path) {
  return NOVEL_ROOT_FILES.includes(path) || NOVEL_DIRECTORIES.includes(headOf(path));
}
function isDramaPath(path) {
  return headOf(path) === DRAMA_DIRECTORY || DRAMA_FILES.includes(path) || path === "short-drama.json";
}
function isGamePath(path) {
  return headOf(path) === GAME_DIRECTORY;
}
function isVideoPath(path) {
  return headOf(path) === VIDEO_DIRECTORY;
}
function pathAllowed(tab, path) {
  if (tab === "story") return isStoryPath(path);
  if (tab === "drama") return isDramaPath(path);
  if (tab === "game") return isGamePath(path);
  if (tab === "video") return isVideoPath(path);
  return false;
}
function tabForPath(path) {
  if (isStoryPath(path)) return "story";
  if (isDramaPath(path)) return "drama";
  if (isGamePath(path)) return "game";
  if (isVideoPath(path)) return "video";
  return void 0;
}
function availableTabs(workspace) {
  return visibleTabIds(workspace, TABS.map((tab) => tab.id));
}
function extensionOf(path) {
  const name2 = path.slice(path.lastIndexOf("/") + 1);
  const index = name2.lastIndexOf(".");
  return index <= 0 ? "" : name2.slice(index).toLowerCase();
}
function isImage(path) {
  return [".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"].includes(extensionOf(path));
}
function isVideo(path) {
  return [".mp4", ".webm", ".mov", ".mkv", ".m4v"].includes(extensionOf(path));
}
function isAudio(path) {
  return [".mp3", ".wav", ".m4a", ".aac", ".flac", ".ogg"].includes(extensionOf(path));
}
function isText(path) {
  return [".md", ".txt", ".json", ".jsonl", ".srt", ".ass", ".vtt", ".csv"].includes(extensionOf(path));
}
function storageGet(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function storageSet(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
  }
}
function FileTree({ tree, depth, selected, onSelect }) {
  const pad = { paddingLeft: String(6 + depth * 12) + "px" };
  return import_react7.default.createElement(
    "div",
    { className: depth === 0 ? "kt-tree-scroll" : "kt-tree-group" },
    tree.children.map((folder) => import_react7.default.createElement(
      "details",
      { key: folder.path, className: "kt-folder", open: depth < 2 },
      import_react7.default.createElement("summary", { style: pad }, folder.name),
      import_react7.default.createElement(FileTree, { tree: folder, depth: depth + 1, selected, onSelect })
    )),
    tree.files.map((file) => import_react7.default.createElement("button", {
      key: file.path,
      type: "button",
      className: "kt-file" + (selected === file.path ? " is-selected" : ""),
      style: pad,
      onClick: () => onSelect(file.path),
      title: file.path
    }, file.path.slice(file.path.lastIndexOf("/") + 1)))
  );
}
function MarkdownView({ source, path, onSelectionPrompt }) {
  const previewRef = (0, import_react7.useRef)(null);
  const toolbarRef = (0, import_react7.useRef)(null);
  const [selection, setSelection] = (0, import_react7.useState)(void 0);
  const [instruction, setInstruction] = (0, import_react7.useState)("");
  const clearSelection = () => {
    setSelection(void 0);
    setInstruction("");
  };
  const capture = () => {
    if (typeof onSelectionPrompt !== "function") return;
    const view = window.getSelection();
    if (view === null || view.rangeCount === 0) return;
    const text = view.toString().trim();
    if (text === "") {
      setSelection(void 0);
      return;
    }
    const range = view.getRangeAt(0);
    const container = previewRef.current;
    if (container === null || !container.contains(range.commonAncestorContainer)) return;
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;
    setSelection({ text: text.slice(0, 12e3), top: Math.min(Math.max(8, rect.bottom + 8), window.innerHeight - 92), left: Math.min(Math.max(8, rect.left), window.innerWidth - 380) });
  };
  (0, import_react7.useEffect)(() => {
    const hide = (event) => {
      var _a;
      const target = event.target;
      if (target instanceof Element && (((_a = toolbarRef.current) == null ? void 0 : _a.contains(target)) || target.closest(".kt-selection-tools") !== null)) return;
      setSelection(void 0);
    };
    window.addEventListener("scroll", hide, true);
    return () => window.removeEventListener("scroll", hide, true);
  }, []);
  const send = () => {
    if (selection === void 0 || selection.text === "") return;
    onSelectionPrompt(buildSelectionPrompt(path, selection.text, instruction));
    const view = window.getSelection();
    if (view !== null) view.removeAllRanges();
    clearSelection();
  };
  return import_react7.default.createElement(
    "div",
    { className: "kt-markdown-wrap" },
    import_react7.default.createElement("div", { ref: previewRef, className: "kt-markdown", onMouseUp: capture, onKeyUp: capture }, renderMarkdown(source)),
    selection === void 0 ? null : import_react7.default.createElement(
      "div",
      { ref: toolbarRef, className: "kt-selection-tools", style: { top: selection.top, left: selection.left } },
      import_react7.default.createElement("span", { className: "kt-selection-count" }, "\u5DF2\u9009 " + String(selection.text.length) + " \u5B57"),
      import_react7.default.createElement("input", {
        value: instruction,
        placeholder: "\u53EF\u9009\uFF1A\u60F3\u600E\u4E48\u6539\uFF1F",
        onChange: (event) => setInstruction(event.target.value),
        onKeyDown: (event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            send();
          }
        }
      }),
      import_react7.default.createElement("button", { type: "button", onClick: send }, "\u8BA9 Agent \u6539\u8FD9\u6BB5"),
      import_react7.default.createElement("button", { type: "button", className: "kt-selection-close", onClick: clearSelection, title: "\u53D6\u6D88" }, "\xD7")
    )
  );
}
function MediaView({ sessionId, path }) {
  const url = mediaUrl(sessionId, path);
  if (isImage(path)) return import_react7.default.createElement("img", { className: "kt-media", src: url, alt: path });
  if (isVideo(path)) return import_react7.default.createElement("video", { className: "kt-media", src: url, controls: true, preload: "metadata" });
  if (isAudio(path)) return import_react7.default.createElement("audio", { className: "kt-media-audio", src: url, controls: true, preload: "metadata" });
  return null;
}
function Editor({ buffer, path, onSelectionPrompt, onChange, onSave, onReload, saving, conflict }) {
  var _a;
  const mode = (_a = buffer.mode) != null ? _a : "preview";
  if (buffer.error !== void 0 && buffer.content === "") {
    return import_react7.default.createElement(
      "div",
      { className: "kt-editor" },
      import_react7.default.createElement(
        "div",
        { className: "kt-editor-bar" },
        import_react7.default.createElement("span", { className: "kt-dirty" }, "\u8BFB\u53D6\u5931\u8D25")
      ),
      import_react7.default.createElement("div", { className: "kt-error" }, buffer.error)
    );
  }
  return import_react7.default.createElement(
    "div",
    { className: "kt-editor" },
    import_react7.default.createElement(
      "div",
      { className: "kt-editor-bar" },
      import_react7.default.createElement(
        "div",
        { className: "kt-editor-tabs", role: "tablist", "aria-label": "\u7F16\u8F91\u6A21\u5F0F" },
        import_react7.default.createElement("button", { type: "button", role: "tab", "aria-selected": mode === "preview", className: mode === "preview" ? "is-active" : "", onClick: () => onChange({ mode: "preview" }) }, "\u9884\u89C8"),
        import_react7.default.createElement("button", { type: "button", role: "tab", "aria-selected": mode === "source", className: mode === "source" ? "is-active" : "", onClick: () => onChange({ mode: "source" }) }, "\u539F\u6587")
      ),
      import_react7.default.createElement(
        "div",
        { className: "kt-editor-actions" },
        buffer.dirty ? import_react7.default.createElement("span", { className: "kt-dirty" }, "\u672A\u4FDD\u5B58") : null,
        import_react7.default.createElement("button", { type: "button", className: "kt-save", disabled: !buffer.dirty || saving, onClick: onSave }, saving ? "\u4FDD\u5B58\u4E2D\u2026" : "\u4FDD\u5B58"),
        buffer.error ? import_react7.default.createElement("button", { type: "button", className: "kt-reload", onClick: onReload }, "\u91CD\u8F7D") : null
      )
    ),
    conflict !== void 0 ? import_react7.default.createElement(
      "div",
      { className: "kt-conflict" },
      import_react7.default.createElement("strong", null, "\u78C1\u76D8\u4E0A\u7684\u6587\u4EF6\u5DF2\u7ECF\u66F4\u65B0"),
      import_react7.default.createElement("p", null, conflict),
      import_react7.default.createElement(
        "div",
        { className: "kt-conflict-actions" },
        import_react7.default.createElement("button", { type: "button", onClick: onReload }, "\u8F7D\u5165\u78C1\u76D8\u7248\u672C\uFF08\u653E\u5F03\u6211\u7684\u4FEE\u6539\uFF09"),
        import_react7.default.createElement("button", { type: "button", onClick: () => onChange({ dismissConflict: true }) }, "\u4FDD\u7559\u6211\u7684\u8349\u7A3F")
      )
    ) : null,
    mode === "source" ? import_react7.default.createElement("textarea", {
      className: "kt-source",
      value: buffer.content,
      spellCheck: false,
      onChange: (event) => onChange({ content: event.target.value }),
      onKeyDown: (event) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
          event.preventDefault();
          onSave();
        }
      }
    }) : import_react7.default.createElement(MarkdownView, { source: buffer.content, path, onSelectionPrompt })
  );
}
function GateRow({ gates }) {
  if (gates === void 0) return null;
  return import_react7.default.createElement("div", { className: "kt-gates" }, gates.map((gate) => {
    var _a;
    return import_react7.default.createElement("span", {
      key: gate.id,
      className: "kt-gate kt-gate--" + gate.status,
      title: ((_a = gate.reasons) != null ? _a : []).join("\uFF1B")
    }, gate.id + " " + gate.label + " \xB7 " + (gate.status === "pass" ? "\u901A\u8FC7" : gate.status === "blocked" ? "\u963B\u65AD" : "\u5F85\u529E"));
  }));
}
function ShotCard({ shot, mediaPaths, mediaUrlOf, onFocus, onDiscuss }) {
  var _a, _b;
  const related = (mediaPaths != null ? mediaPaths : []).filter((path) => {
    var _a2;
    return shot.id !== void 0 && (path.includes(shot.id) || ((_a2 = path.split("/").pop()) != null ? _a2 : "").includes(shot.id));
  });
  const image = related.find(isImage);
  return import_react7.default.createElement(
    "article",
    { className: "kt-shot", onClick: () => onFocus(shot.id), tabIndex: 0, onKeyDown: (event) => {
      if (event.key === "Enter") onFocus(shot.id);
    } },
    import_react7.default.createElement(
      "header",
      null,
      import_react7.default.createElement("strong", null, (_a = shot.id) != null ? _a : "\u672A\u7F16\u53F7\u955C\u5934"),
      import_react7.default.createElement("span", null, shot.duration > 0 ? shot.duration + "s" : "\u7F3A\u65F6\u957F")
    ),
    image !== void 0 && typeof mediaUrlOf === "function" ? import_react7.default.createElement("img", { className: "kt-shot-image", src: mediaUrlOf(image), alt: (_b = shot.id) != null ? _b : "" }) : null,
    import_react7.default.createElement(
      "dl",
      null,
      import_react7.default.createElement("dt", null, "\u5165\u573A"),
      import_react7.default.createElement("dd", null, shot.entryState || "\u672A\u5199"),
      import_react7.default.createElement("dt", null, "\u51FA\u573A"),
      import_react7.default.createElement("dd", null, shot.exitState || "\u672A\u5199"),
      import_react7.default.createElement("dt", null, "\u8F6C\u573A"),
      import_react7.default.createElement("dd", null, shot.transitionOut || "cut")
    ),
    import_react7.default.createElement(
      "footer",
      null,
      import_react7.default.createElement("button", { type: "button", onClick: (event) => {
        event.stopPropagation();
        onDiscuss(shot);
      } }, "\u53BB\u5BF9\u8BDD\u6539\u8FD9\u4E00\u955C")
    )
  );
}
function DramaProduction({ data, loading, error, sessionId, onDiscuss, onRequest, onRefresh, onOpenFile }) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i;
  if (loading && data === void 0) return import_react7.default.createElement("div", { className: "kt-empty" }, "\u6B63\u5728\u8BFB\u53D6\u672C\u96C6\u2026");
  if (error !== void 0) return import_react7.default.createElement("div", { className: "kt-error" }, error);
  if (data === void 0) return import_react7.default.createElement("div", { className: "kt-empty" }, "\u8FD9\u4E00\u96C6\u8FD8\u6CA1\u6709\u6587\u6863\u3002");
  const media = (_a = data.media) != null ? _a : [];
  const blockers = ((_b = data.diagnostics) != null ? _b : []).filter((item) => ["shot-state-discontinuous", "duplicate-id", "prompt-without-shot", "segment-overlap"].includes(item.code));
  const warnings = ((_c = data.diagnostics) != null ? _c : []).filter((item) => !blockers.includes(item));
  const directory = (_d = data.directory) != null ? _d : ".";
  const docItems = [
    ...((_e = data.documents) != null ? _e : []).map((kind) => ({ path: directory === "." ? kind : directory + "/" + kind, label: kind })),
    ...((_f = data.additionalDocuments) != null ? _f : []).map((path) => {
      var _a2;
      return { path, label: (_a2 = path.split("/").pop()) != null ? _a2 : path };
    })
  ];
  const assetPaths = [.../* @__PURE__ */ new Set([...(_g = data.assets) != null ? _g : [], ...(_h = data.media) != null ? _h : []])].sort((a, b) => {
    const rank = (path) => /\/_/.test(path) ? 2 : /E0\d|试片|场景/.test(path) ? 0 : 1;
    return rank(a) - rank(b) || a.localeCompare(b);
  });
  const imageAssets = assetPaths.filter((path) => isImage(path));
  const videoAssets = assetPaths.filter((path) => isVideo(path));
  return import_react7.default.createElement(
    "div",
    { className: "kt-drama" },
    import_react7.default.createElement(
      "div",
      { className: "kt-drama-head" },
      import_react7.default.createElement(
        "div",
        null,
        import_react7.default.createElement("strong", null, data.episode),
        import_react7.default.createElement("span", null, "\u955C\u5934 " + String(data.shots.length) + " \xB7 \u6587\u6863 " + String(docItems.length) + " \xB7 \u7D20\u6750 " + String(assetPaths.length) + " \xB7 \u963B\u65AD " + String(blockers.length))
      ),
      import_react7.default.createElement(
        "div",
        { className: "kt-drama-actions" },
        import_react7.default.createElement("button", { type: "button", onClick: onRefresh }, "\u5237\u65B0"),
        import_react7.default.createElement("button", { type: "button", onClick: () => onRequest("toon_shot_qc", data) }, "\u955C\u5934\u8D28\u68C0"),
        import_react7.default.createElement("button", { type: "button", onClick: () => onRequest("toon_gate", data) }, "\u6838\u5BF9\u95F8\u95E8"),
        import_react7.default.createElement("button", { type: "button", onClick: () => onRequest("toon_assemble", data) }, "\u88C5\u914D\u6837\u7247")
      )
    ),
    import_react7.default.createElement(GateRow, { gates: (_i = data.gates) == null ? void 0 : _i.gates }),
    docItems.length > 0 ? import_react7.default.createElement(
      "section",
      { className: "kt-drama-section" },
      import_react7.default.createElement("h3", null, "\u672C\u96C6\u6587\u6863"),
      import_react7.default.createElement(
        "div",
        { className: "kt-drama-docs" },
        docItems.map((item) => import_react7.default.createElement("button", { key: item.path, type: "button", onClick: () => onOpenFile(item.path), title: item.path }, item.label))
      )
    ) : null,
    imageAssets.length > 0 || videoAssets.length > 0 ? import_react7.default.createElement(
      "section",
      { className: "kt-drama-section" },
      import_react7.default.createElement("h3", null, "\u672C\u96C6\u7D20\u6750 \xB7 " + String(imageAssets.length) + " \u56FE / " + String(videoAssets.length) + " \u89C6\u9891"),
      import_react7.default.createElement(
        "div",
        { className: "kt-asset-grid" },
        imageAssets.slice(0, 24).map((path) => {
          var _a2, _b2;
          return import_react7.default.createElement(
            "button",
            { key: path, type: "button", className: "kt-asset-card", onClick: () => onOpenFile(path), title: path },
            import_react7.default.createElement("img", { src: mediaUrl(sessionId, path), alt: (_a2 = path.split("/").pop()) != null ? _a2 : path, loading: "lazy" }),
            import_react7.default.createElement("span", null, (_b2 = path.split("/").pop()) != null ? _b2 : path)
          );
        }),
        videoAssets.slice(0, 8).map((path) => {
          var _a2;
          return import_react7.default.createElement(
            "div",
            { key: path, className: "kt-asset-card kt-asset-video" },
            import_react7.default.createElement("video", { src: mediaUrl(sessionId, path), controls: true, preload: "metadata" }),
            import_react7.default.createElement("span", null, (_a2 = path.split("/").pop()) != null ? _a2 : path)
          );
        })
      ),
      imageAssets.length > 24 || videoAssets.length > 8 ? import_react7.default.createElement("p", { className: "kt-muted" }, "\u4EC5\u663E\u793A\u524D 24 \u5F20\u56FE / 8 \u4E2A\u89C6\u9891\uFF1B\u5176\u4F59\u53EF\u5728\u5DE6\u4FA7\u6587\u4EF6\u6811\u6216\u9879\u76EE\u76EE\u5F55\u6253\u5F00\u3002") : null
    ) : null,
    import_react7.default.createElement(
      "div",
      { className: "kt-shot-grid" },
      data.shots.length === 0 ? import_react7.default.createElement("div", { className: "kt-empty" }, "\u6CA1\u6709\u8BC6\u522B\u5230\u6807\u51C6\u5206\u955C\uFF08## S01-01 \u6807\u9898\u5757\uFF09\u3002\u5DF2\u8BC6\u522B " + String(docItems.length) + " \u4EFD\u6587\u6863 / " + String(assetPaths.length) + " \u4E2A\u7D20\u6750\uFF1B\u53EF\u5148\u6253\u5F00\u4E0A\u65B9\u300C\u672C\u96C6\u6587\u6863\u300D\u67E5\u770B\u62C6\u5206\u8BBE\u8BA1\uFF0C\u6216\u8BA9 Agent \u6309\u6807\u51C6\u683C\u5F0F\u8865 \u5206\u955C.md\u3002") : data.shots.map((shot) => {
        var _a2;
        return import_react7.default.createElement(ShotCard, {
          key: ((_a2 = shot.id) != null ? _a2 : "line") + String(shot.line),
          shot,
          mediaPaths: media,
          mediaUrlOf: (path) => mediaUrl(sessionId, path),
          onFocus: () => onDiscuss(shot),
          onDiscuss
        });
      })
    ),
    import_react7.default.createElement(
      "section",
      { className: "kt-diagnostics" },
      import_react7.default.createElement("h3", null, "\u5236\u4F5C\u8BE6\u60C5"),
      blockers.length === 0 && warnings.length === 0 ? import_react7.default.createElement("p", { className: "kt-ok" }, "\u6CA1\u6709\u53D1\u73B0\u5951\u7EA6\u4E0E\u65AD\u94FE\u95EE\u9898\u3002") : null,
      blockers.map((item, index) => import_react7.default.createElement(
        "p",
        { key: "b" + String(index), className: "kt-blocker" },
        (item.line === void 0 ? "" : "\u7B2C " + String(item.line) + " \u884C \xB7 ") + item.message
      )),
      warnings.slice(0, 20).map((item, index) => import_react7.default.createElement(
        "p",
        { key: "w" + String(index), className: "kt-warning" },
        (item.line === void 0 ? "" : "\u7B2C " + String(item.line) + " \u884C \xB7 ") + item.message
      ))
    )
  );
}
var GAME_STAGE_ICON = { done: "\u2713", partial: "\u25B3", pending: "\xB7", skipped: "\u2014", optional: "\u25C7" };
function gameStagePrompt(projection, stage) {
  var _a;
  return "\u7EE7\u7EED\u4E92\u52A8\u6E38\u620F\u300A" + projection.title + "\u300B\u7684\u300C" + stage.label + "\u300D\u9636\u6BB5\uFF1A" + ((_a = stage.action) != null ? _a : "") + " \u53EA\u5199 " + stage.file + "\uFF1B\u4E0D\u8981\u8DF3\u5230\u540E\u7EED\u9636\u6BB5\uFF0C\u4E5F\u4E0D\u8981\u4F2A\u9020\u53EF\u73A9\u6784\u5EFA\u6216\u9A8C\u6536\u7ED3\u679C\u3002";
}
function GameStageRail({ projection, activeStage, onOpen, onPrompt }) {
  if (projection === void 0 || projection === null) {
    return import_react7.default.createElement("div", { className: "kt-game-stages is-empty" }, "\u6B63\u5728\u8BFB\u53D6\u9636\u6BB5\u6295\u5F71\u2026");
  }
  return import_react7.default.createElement(
    "div",
    { className: "kt-game-stages", "aria-label": "\u5236\u4F5C\u9636\u6BB5" },
    projection.stages.map((stage) => {
      var _a, _b;
      return import_react7.default.createElement(
        "button",
        {
          key: stage.id,
          type: "button",
          className: "kt-game-stage is-" + stage.status + (((_a = projection.nextStage) == null ? void 0 : _a.id) === stage.id ? " is-next" : "") + (activeStage === stage.file ? " is-active" : ""),
          title: stage.file + " \u2014 " + stage.detail,
          onClick: () => {
            if (stage.status === "done" || stage.status === "partial") onOpen((projection.root === void 0 ? "" : projection.root + "/") + stage.file);
            else if (stage.status !== "skipped") onPrompt(gameStagePrompt(projection, stage));
          }
        },
        import_react7.default.createElement("span", { className: "kt-game-stage-dot", "aria-hidden": true }, (_b = GAME_STAGE_ICON[stage.status]) != null ? _b : "\xB7"),
        import_react7.default.createElement("span", null, stage.label)
      );
    })
  );
}
function GameNext({ projection, onPrompt, onOpen }) {
  if (projection === void 0 || projection === null) return null;
  const stage = projection.nextStage;
  if (stage === void 0) {
    return import_react7.default.createElement(
      "div",
      { className: "kt-game-next is-done" },
      import_react7.default.createElement("strong", null, "\u5168\u90E8\u9636\u6BB5\u5DF2\u5B8C\u6210"),
      import_react7.default.createElement("p", null, "\u6700\u540E\u6838\u5BF9 qa/verification.json \u7684\u516D\u9879\u662F\u5426\u90FD\u662F\u5B9E\u8DD1 PASS\uFF0C\u5E76\u786E\u8BA4 BUILD_BRIEF \u7684\u9650\u5236\u9879\u5199\u6E05\u4E86\u3002")
    );
  }
  return import_react7.default.createElement(
    "div",
    { className: "kt-game-next" },
    import_react7.default.createElement("strong", null, "\u4E0B\u4E00\u6B65 \xB7 " + stage.label),
    import_react7.default.createElement("p", null, stage.detail),
    import_react7.default.createElement(
      "div",
      { className: "kt-game-next-actions" },
      import_react7.default.createElement("button", { type: "button", onClick: () => onPrompt(gameStagePrompt(projection, stage)) }, "\u5728\u5BF9\u8BDD\u91CC\u7EE7\u7EED"),
      stage.status === "pending" ? null : import_react7.default.createElement("button", { type: "button", onClick: () => onOpen((projection.root === void 0 ? "" : projection.root + "/") + stage.file) }, "\u6253\u5F00 " + stage.file.split("/").pop())
    )
  );
}
function GameEmpty({ onPrompt }) {
  return import_react7.default.createElement(
    "div",
    { className: "kt-game-empty" },
    import_react7.default.createElement("h3", null, "\u4E92\u52A8\u6E38\u620F\uFF1A\u4ECE\u4E00\u53E5\u9700\u6C42\u5F00\u59CB"),
    import_react7.default.createElement("p", null, "\u5165\u53E3\u5148\u8BC6\u522B\u4F60\u8BF4\u7684\u662F\u539F\u521B\u8FD8\u662F\u6539\u7F16\u3001\u76EE\u6807\u5E73\u53F0\u548C\u73A9\u6CD5\uFF0C\u518D\u7ED9\u51FA\u5DE5\u7A0B\u9AA8\u67B6\u4E0E\u7B2C\u4E00\u9636\u6BB5\u3002"),
    import_react7.default.createElement("code", null, "game-adaptations/<project>/PRODUCT_BRIEF.md"),
    import_react7.default.createElement("p", { className: "kt-muted" }, "\u9636\u6BB5\uFF1A\u7ACB\u9879 \u2192 \u62C6\u4E66\uFF08\u4EC5\u6539\u7F16\uFF09\u2192 \u6982\u5FF5 \u2192 \u8BBE\u8BA1 \u2192 \u7070\u76D2 \u2192 \u7F8E\u672F\u65B9\u5411 \u2192 \u6784\u5EFA \u2192 \u9A8C\u6536\u3002\u6838\u5FC3\u5FAA\u73AF\u6CA1\u8DD1\u901A\u524D\u4E0D\u505A\u7F8E\u672F\u91CF\u4EA7\u3002"),
    import_react7.default.createElement(
      "div",
      { className: "kt-game-empty-actions" },
      import_react7.default.createElement("button", { type: "button", onClick: () => onPrompt("\u6211\u60F3\u505A\u4E00\u4E2A\u4E92\u52A8\u6E38\u620F\uFF1A\u5148\u8DD1 toon_game_intake \u8BC6\u522B\u6211\u7684\u9700\u6C42\uFF0C\u7ED9\u6211\u5DE5\u7A0B\u9AA8\u67B6\u4E0E\u7B2C\u4E00\u9636\u6BB5\uFF0C\u5148\u4E0D\u8981\u5199\u6587\u4EF6\u3002") }, "\u8BF4\u8BF4\u6211\u60F3\u505A\u4EC0\u4E48"),
      import_react7.default.createElement("button", { type: "button", onClick: () => onPrompt("\u628A\u5F53\u524D\u5DE5\u4F5C\u533A\u7684\u5C0F\u8BF4\u6539\u7F16\u6210\u4E92\u52A8\u6E38\u620F\uFF1A\u5148\u8DD1 toon_game_intake \u786E\u8BA4\u539F\u6587\u6765\u6E90\u4E0E\u6539\u7F16\u65B9\u5411\uFF0C\u518D\u7ED9\u51FA\u5DE5\u7A0B\u9AA8\u67B6\u4E0E\u62C6\u4E66\u8BA1\u5212\uFF0C\u5148\u4E0D\u8981\u5199\u6587\u4EF6\u3002") }, "\u628A\u5C0F\u8BF4\u6539\u6210\u6E38\u620F")
    )
  );
}
function GameStudio({ game, projection, snapshots, onOpenFile, onPrompt, onCreateSnapshot, onRestoreSnapshot, onDeleteSnapshot }) {
  var _a, _b;
  const [reload, setReload] = (0, import_react7.useState)(0);
  const [label, setLabel] = (0, import_react7.useState)("");
  const [selectedSnapshot, setSelectedSnapshot] = (0, import_react7.useState)("");
  if (game === void 0 || game === null) return import_react7.default.createElement(GameEmpty, { onPrompt });
  const list = (_a = snapshots == null ? void 0 : snapshots.snapshots) != null ? _a : [];
  const snapshotBar = import_react7.default.createElement(
    "div",
    { className: "kt-snapshot-bar" },
    import_react7.default.createElement(
      "select",
      { value: selectedSnapshot, onChange: (event) => setSelectedSnapshot(event.target.value) },
      import_react7.default.createElement("option", { value: "" }, list.length === 0 ? "\u8FD8\u6CA1\u6709\u5FEB\u7167" : "\u9009\u62E9\u5FEB\u7167\u2026"),
      list.map((snapshot) => import_react7.default.createElement("option", { key: snapshot.id, value: snapshot.id }, snapshot.label + " \xB7 " + snapshot.id))
    ),
    import_react7.default.createElement("button", { type: "button", disabled: selectedSnapshot === "", onClick: () => onRestoreSnapshot(selectedSnapshot) }, "\u56DE\u6EDA"),
    import_react7.default.createElement("button", { type: "button", disabled: selectedSnapshot === "", onClick: () => {
      onDeleteSnapshot(selectedSnapshot);
      setSelectedSnapshot("");
    } }, "\u5220\u9664"),
    import_react7.default.createElement("input", { value: label, placeholder: "\u5FEB\u7167\u8BF4\u660E\uFF08\u53EF\u9009\uFF09", onChange: (event) => setLabel(event.target.value) }),
    import_react7.default.createElement("button", { type: "button", disabled: !game.previewReady, onClick: () => {
      onCreateSnapshot(label);
      setLabel("");
    } }, "\u5B58\u5FEB\u7167"),
    import_react7.default.createElement("span", null, String(list.length) + " \u4E2A\u7248\u672C")
  );
  if (!game.previewReady) {
    return import_react7.default.createElement(
      "div",
      { className: "kt-game-play" },
      import_react7.default.createElement(GameNext, { projection, onPrompt, onOpen: onOpenFile }),
      import_react7.default.createElement("div", { className: "kt-empty" }, "\u8FD8\u6CA1\u6709\u53EF\u73A9\u6784\u5EFA\uFF1A\u6309\u9636\u6BB5\u8F68\u8D70\u5230\u300C\u7070\u76D2\u300D\uFF0C\u751F\u6210 game-adaptations/" + game.id + "/build/app/index.html \u540E\u518D\u8BD5\u73A9\u3002")
    );
  }
  const src = "/kylin-toon/game-preview/" + encodeURIComponent(game.id) + "/index.html?build=" + encodeURIComponent(String((_b = game.previewVersion) != null ? _b : "") + "-" + String(reload));
  return import_react7.default.createElement(
    "div",
    { className: "kt-game-play" },
    import_react7.default.createElement(GameNext, { projection, onPrompt, onOpen: onOpenFile }),
    import_react7.default.createElement(
      "div",
      { className: "kt-game-frame-bar" },
      import_react7.default.createElement("span", null, "\u53EF\u73A9\u6784\u5EFA \xB7 " + game.id),
      import_react7.default.createElement("button", { type: "button", onClick: () => setReload((value) => value + 1) }, "\u91CD\u65B0\u8F7D\u5165\u6784\u5EFA")
    ),
    snapshotBar,
    import_react7.default.createElement("iframe", { key: src, className: "kt-game-frame", src, title: game.title, sandbox: "allow-scripts allow-pointer-lock allow-downloads" })
  );
}
function GameDocs({ game, projection, onOpenFile, onPrompt }) {
  var _a, _b, _c, _d, _e;
  const groups = /* @__PURE__ */ new Map();
  for (const document2 of (_a = projection == null ? void 0 : projection.documents) != null ? _a : []) {
    const list = (_b = groups.get(document2.stage)) != null ? _b : [];
    list.push({ path: document2.path, label: document2.label });
    groups.set(document2.stage, list);
  }
  const known = new Set(((_c = projection == null ? void 0 : projection.documents) != null ? _c : []).map((document2) => document2.path));
  const extras = ((_d = game == null ? void 0 : game.documents) != null ? _d : []).map((item) => typeof item === "string" ? item : item.path).filter((path) => !known.has(path));
  if (extras.length > 0) groups.set("other", extras.map((path) => ({ path, label: path.slice(path.lastIndexOf("/") + 1) })));
  const order = [...((_e = projection == null ? void 0 : projection.stages) != null ? _e : []).map((stage) => [stage.id, stage.label]), ["meta", "\u8FDB\u5EA6"], ["other", "\u5176\u4ED6"]];
  const sections = order.filter(([id]) => {
    var _a2;
    return ((_a2 = groups.get(id)) != null ? _a2 : []).length > 0;
  });
  return import_react7.default.createElement(
    "div",
    { className: "kt-game-docs" },
    import_react7.default.createElement(GameNext, { projection, onPrompt, onOpen: onOpenFile }),
    sections.length === 0 ? import_react7.default.createElement("div", { className: "kt-empty" }, "\u8FD8\u6CA1\u6709\u6587\u7A3F\uFF1A\u5148\u5EFA\u5DE5\u7A0B\u9AA8\u67B6\u5E76\u5199 PRODUCT_BRIEF.md\uFF0C\u518D\u8FDB\u5165\u6982\u5FF5\u4E0E\u8BBE\u8BA1\u3002") : sections.map(([id, label]) => {
      var _a2;
      return import_react7.default.createElement(
        "section",
        { key: id, className: "kt-game-docs-group" },
        import_react7.default.createElement("h4", null, label),
        ((_a2 = groups.get(id)) != null ? _a2 : []).map((item) => import_react7.default.createElement(
          "button",
          { key: item.path, type: "button", onClick: () => onOpenFile(item.path) },
          import_react7.default.createElement("span", null, item.label),
          import_react7.default.createElement("em", null, item.path)
        ))
      );
    })
  );
}
function VideoStudio({ workspace, sessionId, projectId, setProjectId, view, setView, openFile }) {
  var _a, _b, _c, _d, _e, _f;
  const video = (_c = ((_a = workspace == null ? void 0 : workspace.videos) != null ? _a : []).find((item) => item.id === projectId)) != null ? _c : (_b = workspace == null ? void 0 : workspace.videos) == null ? void 0 : _b[0];
  const [sourceKind, setSourceKind] = (0, import_react7.useState)("output");
  if (video === void 0) return import_react7.default.createElement("div", { className: "kt-empty" }, "\u8FD8\u6CA1\u6709\u89C6\u9891\u89E3\u8BF4\u5DE5\u7A0B\uFF1A\u5728 video-recaps/<project>/ \u4E0B\u653E sources/ \u539F\u7247\u4E0E\u89E3\u8BF4\u7A3F\u3002");
  const outputs = (_d = video.outputs) != null ? _d : [];
  const candidates = sourceKind === "output" ? outputs.map((item) => {
    var _a2;
    return (_a2 = item.path) != null ? _a2 : item;
  }) : sourceKind === "edited" ? video.editedSource === void 0 ? [] : [video.editedSource] : ((_e = workspace == null ? void 0 : workspace.files) != null ? _e : []).filter((file) => isVideo(file.path) && file.path.startsWith(video.root + "/sources/")).map((file) => file.path);
  const playing = candidates[0];
  return import_react7.default.createElement(
    "div",
    { className: "kt-studio" },
    import_react7.default.createElement(
      "div",
      { className: "kt-studio-bar" },
      import_react7.default.createElement("select", { value: video.id, onChange: (event) => setProjectId(event.target.value) }, workspace.videos.map((item) => import_react7.default.createElement("option", { key: item.id, value: item.id }, item.title + "\uFF08" + item.id + "\uFF09"))),
      import_react7.default.createElement(
        "div",
        { role: "tablist", className: "kt-subtabs" },
        import_react7.default.createElement("button", { type: "button", role: "tab", "aria-selected": view === "preview", className: view === "preview" ? "is-active" : "", onClick: () => setView("preview") }, "\u9884\u89C8"),
        import_react7.default.createElement("button", { type: "button", role: "tab", "aria-selected": view === "docs", className: view === "docs" ? "is-active" : "", onClick: () => setView("docs") }, "\u6587\u7A3F")
      )
    ),
    view === "preview" ? import_react7.default.createElement(
      "div",
      { className: "kt-player" },
      import_react7.default.createElement(
        "div",
        { className: "kt-source-tabs" },
        [["output", "\u6210\u7247"], ["edited", "\u526A\u540E\u753B\u9762"], ["source", "\u539F\u7247"]].map(([id, label]) => import_react7.default.createElement("button", {
          key: id,
          type: "button",
          className: sourceKind === id ? "is-active" : "",
          onClick: () => setSourceKind(id)
        }, label))
      ),
      playing === void 0 ? import_react7.default.createElement("div", { className: "kt-empty" }, "\u8FD9\u4E2A\u6765\u6E90\u8FD8\u6CA1\u6709\u53EF\u64AD\u653E\u6587\u4EF6\u3002") : import_react7.default.createElement("video", { className: "kt-player-video", src: mediaUrl(sessionId, playing), controls: true, preload: "metadata" }),
      import_react7.default.createElement("p", { className: "kt-player-path" }, playing != null ? playing : "")
    ) : import_react7.default.createElement("div", { className: "kt-doc-list" }, ((_f = video.documents) != null ? _f : []).map((path) => import_react7.default.createElement("button", { key: path, type: "button", onClick: () => openFile(path) }, path)))
  );
}
function SetupCard({ tab, onSend }) {
  var _a;
  const guides = {
    story: { title: "\u5C0F\u8BF4", files: "\u6B63\u6587.md / \u8BBE\u5B9A.md\uFF0C\u6216 \u6B63\u6587/ \u5927\u7EB2/ \u8BBE\u5B9A/ \u76EE\u5F55", prompt: "\u5728\u5F53\u524D\u5DE5\u4F5C\u533A\u521B\u5EFA\u5C0F\u8BF4\u5DE5\u7A0B\uFF1A\u5199 \u6B63\u6587.md\u3001\u8BBE\u5B9A.md\u3001\u5C0F\u8282\u5927\u7EB2.md\uFF0C\u5148\u7ED9\u5F00\u5C40\u4E00\u9875\uFF0C\u4E0D\u8981\u751F\u6210\u5A92\u4F53\u3002" },
    drama: { title: "\u77ED\u5267\u6F2B\u5267", files: "\u5267\u96C6/EP001/ \u4E0B\u7684 \u5267\u672C.md\u3001\u89C6\u89C9\u8BBE\u5B9A.md\u3001\u5206\u955C.md", prompt: "\u5728\u5F53\u524D\u5DE5\u4F5C\u533A\u521B\u5EFA\u77ED\u5267\u5DE5\u7A0B\uFF1A\u5EFA \u5267\u96C6/EP001/\uFF0C\u5199\u5267\u672C.md\u3001\u89C6\u89C9\u8BBE\u5B9A.md\u3001\u5206\u955C.md\uFF08\u955C\u5934\u5E26 ID\u3001\u65F6\u957F\u3001\u5165\u573A/\u51FA\u573A\u3001\u8F6C\u573A\uFF09\uFF0C\u5148\u53EA\u5199\u6587\u6863\uFF0C\u4E0D\u8981\u751F\u6210\u5A92\u4F53\u3002" },
    game: { title: "\u4E92\u52A8\u6E38\u620F", files: "game-adaptations/<project>/ \xB7 PRODUCT_BRIEF.md \xB7 design/GAME_DESIGN.md \xB7 build/app/index.html", prompt: "\u6211\u60F3\u505A\u4E00\u4E2A\u4E92\u52A8\u6E38\u620F\uFF1A\u5148\u8DD1 toon_game_intake \u8BC6\u522B\u6211\u7684\u9700\u6C42\uFF08\u539F\u521B\u8FD8\u662F\u6539\u7F16\u3001\u5E73\u53F0\u4E0E\u73A9\u6CD5\uFF09\uFF0C\u7ED9\u51FA\u5DE5\u7A0B\u9AA8\u67B6\u4E0E\u7B2C\u4E00\u9636\u6BB5\uFF1B\u6211\u786E\u8BA4\u540E\u518D\u5199\u6587\u4EF6\u3002" },
    video: { title: "\u89C6\u9891\u89E3\u8BF4", files: "video-recaps/<project>/ \u4E0E sources/ \u539F\u7247", prompt: "\u5728\u5F53\u524D\u5DE5\u4F5C\u533A\u521B\u5EFA\u89C6\u9891\u89E3\u8BF4\u5DE5\u7A0B\uFF1A\u5EFA video-recaps/<\u9879\u76EE\u540D>/ \u4E0E sources/\uFF0C\u544A\u8BC9\u6211\u9700\u8981\u653E\u5165\u54EA\u6BB5\u539F\u7247\u3002" }
  };
  const guide = (_a = guides[tab]) != null ? _a : guides.drama;
  return import_react7.default.createElement(
    "div",
    { className: "kt-setup" },
    import_react7.default.createElement("h3", null, "\u8FD9\u4E2A\u5DE5\u4F5C\u533A\u8FD8\u6CA1\u6709" + guide.title + "\u4F5C\u54C1"),
    import_react7.default.createElement("p", null, "\u521B\u4F5C\u53F0\u6309\u6587\u4EF6\u8BC6\u522B\u4F5C\u54C1\u3002" + guide.title + "\u9700\u8981\uFF1A"),
    import_react7.default.createElement("code", null, guide.files),
    import_react7.default.createElement("p", { className: "kt-muted" }, "\u5728\u5BF9\u8BDD\u91CC\u8BA9 Agent \u5EFA\u597D\u7ED3\u6784\uFF0C\u6587\u4EF6\u5199\u51FA\u6765\u540E\u9762\u677F\u4F1A\u81EA\u52A8\u5C55\u5F00\u3002"),
    import_react7.default.createElement("button", { type: "button", onClick: () => onSend(guide.prompt) }, "\u5728\u5BF9\u8BDD\u91CC\u521B\u5EFA")
  );
}
function planChips(plan) {
  var _a;
  const formats = { horizontal: "\u6A2A\u5C4F", vertical: "\u7AD6\u5C4F", concept: "\u6982\u5FF5\u7247", other: "\u5176\u4ED6" };
  const chips = [];
  if (plan.format !== void 0) chips.push((_a = formats[plan.format]) != null ? _a : plan.format);
  if (plan.aspectRatio !== void 0) chips.push(plan.aspectRatio);
  if (plan.targetDurationSec !== void 0) chips.push(plan.targetDurationSec < 120 ? String(plan.targetDurationSec) + " \u79D2" : String(Math.round(plan.targetDurationSec / 60)) + " \u5206\u949F");
  if (plan.episodeCount !== void 0) chips.push(String(plan.episodeCount) + " \u96C6");
  if (plan.platform !== void 0) chips.push(plan.platform);
  return chips;
}
function ReferenceView({ data, loading, error, sessionId, onPrompt, onRefresh }) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E, _F, _G, _H, _I;
  const state = (_a = data == null ? void 0 : data.state) != null ? _a : null;
  const readiness = (_b = data == null ? void 0 : data.readiness) != null ? _b : { ready: true, blockers: [] };
  const videos = (_c = data == null ? void 0 : data.videos) != null ? _c : [];
  const [urlValue, setUrlValue] = (0, import_react7.useState)("");
  const [pathValue, setPathValue] = (0, import_react7.useState)("");
  const [busy, setBusy] = (0, import_react7.useState)(void 0);
  const [actionError, setActionError] = (0, import_react7.useState)(void 0);
  const [notice, setNotice] = (0, import_react7.useState)(void 0);
  const [picked, setPicked] = (0, import_react7.useState)([]);
  const styleKey = ((_e = (_d = state == null ? void 0 : state.analysis) == null ? void 0 : _d.styleRefs) != null ? _e : []).join("|");
  (0, import_react7.useEffect)(() => {
    var _a2, _b2;
    setPicked((_b2 = (_a2 = state == null ? void 0 : state.analysis) == null ? void 0 : _a2.styleRefs) != null ? _b2 : []);
  }, [styleKey]);
  const run = async (kind, action) => {
    var _a2;
    setBusy(kind);
    setActionError(void 0);
    try {
      await action();
      onRefresh();
    } catch (cause) {
      setActionError((_a2 = cause.message) != null ? _a2 : String(cause));
    } finally {
      setBusy(void 0);
    }
  };
  const upload = (file) => {
    if (file !== void 0) void run("upload", () => uploadReference(sessionId, file));
  };
  const registerPanel = import_react7.default.createElement(
    "section",
    { className: "kt-ref-register" },
    import_react7.default.createElement("h4", null, "\u4F20\u5165\u53C2\u8003\u7247"),
    import_react7.default.createElement(
      "div",
      { className: "kt-ref-register-row" },
      import_react7.default.createElement(
        "label",
        { className: "kt-ref-file" },
        import_react7.default.createElement("input", {
          type: "file",
          accept: "video/*",
          disabled: busy !== void 0,
          onChange: (event) => {
            var _a2;
            const file = (_a2 = event.target.files) == null ? void 0 : _a2[0];
            event.target.value = "";
            upload(file);
          }
        }),
        busy === "upload" ? "\u4E0A\u4F20\u4E2D\u2026" : "\u9009\u62E9\u89C6\u9891\u6587\u4EF6"
      ),
      import_react7.default.createElement("span", { className: "kt-muted" }, "\u4E0A\u4F20\u5230\u5DE5\u4F5C\u533A\u7684 \u53C2\u8003\u89C6\u9891/ \u76EE\u5F55\uFF0C\u4E0D\u7ECF\u8FC7\u5BF9\u8BDD")
    ),
    import_react7.default.createElement(
      "div",
      { className: "kt-ref-url" },
      import_react7.default.createElement("input", {
        value: pathValue,
        placeholder: "\u6216\u586B\u672C\u673A\u8DEF\u5F84\uFF1A/Users/\u2026/\u53C2\u8003.mp4",
        onChange: (event) => setPathValue(event.target.value)
      }),
      import_react7.default.createElement("button", {
        type: "button",
        disabled: pathValue.trim() === "" || busy !== void 0,
        onClick: () => void run("intake", () => intakeReferencePath(sessionId, pathValue.trim()))
      }, busy === "intake" ? "\u767B\u8BB0\u4E2D\u2026" : "\u6309\u8DEF\u5F84\u767B\u8BB0")
    ),
    import_react7.default.createElement(
      "div",
      { className: "kt-ref-url" },
      import_react7.default.createElement("input", {
        value: urlValue,
        placeholder: "\u7C98\u8D34\u89C6\u9891\u94FE\u63A5\uFF08YouTube / Bilibili / \u6296\u97F3\u2026\uFF09",
        onChange: (event) => setUrlValue(event.target.value)
      }),
      import_react7.default.createElement("button", {
        type: "button",
        disabled: urlValue.trim() === "" || busy !== void 0,
        onClick: () => void run("link", () => downloadReference(sessionId, urlValue.trim()))
      }, busy === "link" ? "\u4E0B\u8F7D\u4E2D\u2026" : "\u4E0B\u8F7D\u5E76\u767B\u8BB0")
    ),
    import_react7.default.createElement("p", { className: "kt-muted" }, "\u94FE\u63A5\u4E0B\u8F7D\u9700\u8981\u672C\u673A yt-dlp\uFF1B\u6CA1\u6709\u65F6\u8FD9\u91CC\u4F1A\u663E\u793A\u5B89\u88C5\u547D\u4EE4\u3002\u4E5F\u53EF\u4EE5\u76F4\u63A5\u628A\u89C6\u9891\u653E\u8FDB\u5DE5\u4F5C\u533A\u6839\u76EE\u5F55\u7684 \u53C2\u8003\u89C6\u9891/\u3002"),
    actionError === void 0 ? null : import_react7.default.createElement("p", { className: "kt-error" }, actionError)
  );
  if (loading && data === void 0) return import_react7.default.createElement("div", { className: "kt-empty" }, "\u6B63\u5728\u8BFB\u53D6\u53C2\u8003\u7247\u2026");
  if (error !== void 0) return import_react7.default.createElement("div", { className: "kt-error" }, error);
  if (state === null) {
    return import_react7.default.createElement(
      "div",
      { className: "kt-reference" },
      import_react7.default.createElement(
        "section",
        { className: "kt-ref-hero" },
        import_react7.default.createElement("h3", null, "\u62CD\u540C\u6B3E\uFF1A\u53C2\u8003\u89C6\u9891"),
        import_react7.default.createElement("p", null, "\u7ED9\u4E00\u6761\u53C2\u8003\u7247\uFF0C\u62C6\u5B83\u7684\u7ED3\u6784\uFF08\u5207\u70B9\u3001\u8282\u594F\u3001\u5F00\u573A\u94A9\u5B50\u3001\u753B\u5E45\uFF09\uFF0C\u51FA 2\u20133 \u5F20\u5DEE\u5F02\u5316\u65B9\u6848\uFF1B\u5B66\u7ED3\u6784\uFF0C\u4E0D\u6284\u753B\u9762\u3002"),
        registerPanel,
        videos.length === 0 ? null : import_react7.default.createElement("div", { className: "kt-doc-list" }, videos.map((video) => import_react7.default.createElement("button", {
          key: video.path,
          type: "button",
          disabled: busy !== void 0,
          onClick: () => void run("intake", () => intakeReferencePath(sessionId, video.path))
        }, "\u767B\u8BB0 " + video.path + "\uFF08" + String(Math.round(video.bytes / 1024 / 1024)) + "MB\uFF09")))
      )
    );
  }
  const analysis = state.analysis;
  const plans = (_f = state.plans) != null ? _f : [];
  const rights = (_g = state.rights) != null ? _g : { status: "pending" };
  const frames = (_h = analysis == null ? void 0 : analysis.frames) != null ? _h : [];
  const transcript = analysis == null ? void 0 : analysis.transcript;
  const toggle = (frame) => setPicked((current) => current.includes(frame) ? current.filter((item) => item !== frame) : [...current, frame]);
  return import_react7.default.createElement(
    "div",
    { className: "kt-reference" },
    import_react7.default.createElement(
      "section",
      { className: "kt-ref-head" },
      import_react7.default.createElement(
        "div",
        null,
        import_react7.default.createElement("strong", null, (_j = (_i = state.source) == null ? void 0 : _i.title) != null ? _j : "\u53C2\u8003\u7247"),
        import_react7.default.createElement("span", null, ((_n = (_m = (_k = state.source) == null ? void 0 : _k.path) != null ? _m : (_l = state.source) == null ? void 0 : _l.url) != null ? _n : "") + " \xB7 v" + String((_o = state.revision) != null ? _o : 0))
      ),
      import_react7.default.createElement(
        "div",
        { className: "kt-ref-actions" },
        ((_p = data.projects) != null ? _p : []).length > 1 ? import_react7.default.createElement("select", { value: (_s = (_r = ((_q = data.projects) != null ? _q : []).find((item) => item.active)) == null ? void 0 : _r.id) != null ? _s : ".", onChange: (event) => {
          void (async () => {
            var _a2;
            try {
              await switchNovelProject(sessionId, event.target.value);
              onRefresh();
            } catch (cause) {
              setActionError((_a2 = cause.message) != null ? _a2 : String(cause));
            }
          })();
        } }, ((_t = data.projects) != null ? _t : []).map((item) => import_react7.default.createElement("option", { key: item.id, value: item.id }, item.title + (item.chapters > 0 ? "\uFF08" + String(item.chapters) + "\u7AE0\uFF09" : "")))) : null,
        import_react7.default.createElement("button", { type: "button", onClick: onRefresh }, "\u5237\u65B0"),
        import_react7.default.createElement("button", { type: "button", onClick: () => void run("analyze", () => analyzeReference(sessionId)) }, "\u91CD\u65B0\u62C6\u89E3"),
        import_react7.default.createElement("button", { type: "button", onClick: () => onPrompt("\u57FA\u4E8E\u53C2\u8003\u5206\u6790\u51FA 3 \u5F20\u5DEE\u5F02\u5316\u540C\u6B3E\u65B9\u6848\uFF08keep=\u4FDD\u7559\u7ED3\u6784 / replace=\u6362\u5185\u5BB9\uFF09\uFF0C\u5199\u8FDB toon_reference_plans\u3002") }, "\u51FA\u540C\u6B3E\u65B9\u6848"),
        import_react7.default.createElement("button", { type: "button", onClick: () => void run("export", async () => {
          const exported = await exportReferenceDoc(sessionId);
          setNotice("\u5DF2\u5BFC\u51FA " + exported.path);
        }) }, busy === "export" ? "\u5BFC\u51FA\u4E2D\u2026" : "\u5BFC\u51FA\u62C6\u89E3"),
        import_react7.default.createElement("button", { type: "button", onClick: () => {
          const ok = typeof window.confirm === "function" ? window.confirm("\u6E05\u9664\u5F53\u524D\u53C2\u8003\u7247\u6863\u6848\uFF1F\u65E7\u72B6\u6001\u4F1A\u5F52\u6863\uFF0C\u5173\u952E\u5E27\u4F1A\u5220\u9664\u3002") : true;
          if (ok) void run("reset", () => resetReferenceDoc(sessionId));
        } }, "\u6E05\u9664")
      )
    ),
    notice === void 0 ? null : import_react7.default.createElement("p", { className: "kt-ok" }, notice),
    actionError === void 0 ? null : import_react7.default.createElement("p", { className: "kt-error" }, actionError),
    analysis === void 0 ? import_react7.default.createElement(
      "div",
      { className: "kt-ref-empty" },
      import_react7.default.createElement("p", { className: "kt-empty" }, "\u5DF2\u767B\u8BB0\uFF0C\u8FD8\u6CA1\u6709\u62C6\u89E3\u3002\u70B9\u300C\u91CD\u65B0\u62C6\u89E3\u300D\u8BA9 Agent \u8DD1 toon_reference_analyze\uFF08\u672C\u673A ffmpeg\uFF09\u3002"),
      registerPanel
    ) : import_react7.default.createElement(
      import_react7.default.Fragment,
      null,
      import_react7.default.createElement(
        "div",
        { className: "kt-ref-stats" },
        import_react7.default.createElement("span", null, "\u65F6\u957F " + String(Math.round(analysis.durationSec)) + "s"),
        import_react7.default.createElement("span", null, String(analysis.width) + "\xD7" + String(analysis.height)),
        import_react7.default.createElement("span", null, String(analysis.fps) + "fps"),
        import_react7.default.createElement("span", null, "\u955C\u5934 " + String((_v = (_u = analysis.pacing) == null ? void 0 : _u.shotCount) != null ? _v : 0)),
        import_react7.default.createElement("span", null, "\u5E73\u5747 " + String((_x = (_w = analysis.pacing) == null ? void 0 : _w.avgShotSec) != null ? _x : 0) + "s"),
        import_react7.default.createElement("span", null, "\u6700\u957F " + String((_z = (_y = analysis.pacing) == null ? void 0 : _y.longestShotSec) != null ? _z : 0) + "s"),
        import_react7.default.createElement("span", null, "\u6BCF\u5206\u949F\u5207 " + String((_B = (_A = analysis.pacing) == null ? void 0 : _A.cutsPerMinute) != null ? _B : 0)),
        import_react7.default.createElement("span", null, "\u5F00\u573A\u94A9\u5B50 " + (((_C = analysis.pacing) == null ? void 0 : _C.openingHookSec) === void 0 ? "\u65E0\u5207\u70B9" : String(analysis.pacing.openingHookSec) + "s")),
        ...((_D = analysis.tags) != null ? _D : []).map((tag) => import_react7.default.createElement("em", { key: tag }, tag))
      ),
      frames.length > 0 ? import_react7.default.createElement(
        "section",
        { className: "kt-ref-frames-wrap" },
        import_react7.default.createElement("h4", null, "\u5173\u952E\u5E27 \xB7 \u70B9\u51FB\u9009\u4F5C\u5B9A\u5986\u7167\u98CE\u683C\u53C2\u8003"),
        import_react7.default.createElement("div", { className: "kt-ref-frames" }, frames.slice(0, 24).map((frame, index) => import_react7.default.createElement(
          "figure",
          {
            key: frame,
            className: picked.includes(frame) ? "is-picked" : "",
            onClick: () => toggle(frame),
            title: "\u70B9\u51FB\u5207\u6362\u98CE\u683C\u53C2\u8003"
          },
          import_react7.default.createElement("img", { src: mediaUrl(sessionId, frame), alt: "\u955C\u5934 " + String(index + 1), loading: "lazy" }),
          import_react7.default.createElement("figcaption", null, "#" + String(index + 1) + (picked.includes(frame) ? " \xB7 \u53C2\u8003" : ""))
        ))),
        import_react7.default.createElement("button", {
          type: "button",
          className: "kt-primary-action",
          disabled: picked.length === 0,
          onClick: () => onPrompt("\u628A\u5173\u952E\u5E27 " + picked.map((frame) => "#" + String(frames.indexOf(frame) + 1)).join("\u3001") + " \u6807\u8BB0\u4E3A\u5B9A\u5986\u7167\u98CE\u683C\u53C2\u8003\uFF1A\u8C03\u7528 toon_reference_style_refs\uFF1B\u5E76\u5728\u89C6\u89C9\u8BBE\u5B9A\u91CC\u5199\u660E\u53EA\u7528\u5149\u7EBF/\u8272\u8C03/\u8D28\u611F\uFF0C\u4E0D\u590D\u7528\u6784\u56FE\u4E0E\u4EBA\u7269\u8EAB\u4EFD\u3002\u4E4B\u540E\u51FA\u5B9A\u5986\u7167\u65F6\u5148 media_upload \u8FD9\u4E9B\u56FE\uFF0C\u518D\u7528 media_generate \u53C2\u8003\u751F\u56FE\u3002")
        }, "\u6807\u8BB0\u4E3A\u5B9A\u5986\u7167\u98CE\u683C\u53C2\u8003\uFF08" + String(picked.length) + "\uFF09")
      ) : null,
      ((_E = analysis.shots) == null ? void 0 : _E.length) > 0 ? import_react7.default.createElement("div", { className: "kt-ref-slice" }, analysis.shots.slice(0, 30).map((shot) => import_react7.default.createElement("span", {
        key: shot.index,
        style: { flexGrow: Math.max(1, shot.durationSec) },
        title: "#" + String(shot.index) + " " + String(shot.startSec) + "\u2013" + String(shot.endSec) + "s"
      }, String(shot.index)))) : null
    ),
    import_react7.default.createElement(
      "section",
      { className: "kt-ref-transcript" },
      import_react7.default.createElement("h4", null, "\u8F6C\u5199"),
      transcript !== void 0 ? import_react7.default.createElement(
        import_react7.default.Fragment,
        null,
        import_react7.default.createElement("p", { className: "kt-muted" }, String(((_F = transcript.segments) != null ? _F : []).length) + " \u6BB5 \xB7 " + String((_G = transcript.method) != null ? _G : "asr") + (transcript.language === void 0 ? "" : " \xB7 " + transcript.language)),
        import_react7.default.createElement("div", { className: "kt-ref-segments" }, ((_H = transcript.segments) != null ? _H : []).slice(0, 6).map((segment) => import_react7.default.createElement(
          "p",
          { key: segment.index },
          import_react7.default.createElement("time", null, String(segment.startSec) + "s"),
          import_react7.default.createElement("span", null, segment.text)
        )))
      ) : import_react7.default.createElement("p", { className: "kt-muted" }, "\u8FD8\u6CA1\u6709\u8F6C\u5199\u3002\u5148\u7528\u591A\u5A92\u4F53\u7F51\u5173 media_audio action=transcribe \u8F6C\u5199\u53C2\u8003\u7247\uFF0C\u518D\u628A\u5206\u6BB5\u4EA4\u7ED9 toon_reference_transcript\uFF1B\u63D2\u4EF6\u4E0D\u81EA\u5DF1\u8DD1 ASR\u3002"),
      import_react7.default.createElement(
        "div",
        { className: "kt-ref-actions" },
        import_react7.default.createElement("button", { type: "button", onClick: () => onPrompt("\u7528\u591A\u5A92\u4F53\u7F51\u5173 media_audio transcribe \u8F6C\u5199\u53C2\u8003\u7247\uFF0C\u7136\u540E\u628A\u5206\u6BB5\u4EA4\u7ED9 toon_reference_transcript \u5199\u8FDB\u53C2\u8003\u6863\u6848\uFF1B\u8BED\u8A00\u81EA\u52A8\u68C0\u6D4B\u3002") }, "\u5728\u5BF9\u8BDD\u91CC\u8F6C\u5199")
      )
    ),
    plans.length > 0 ? import_react7.default.createElement(
      "section",
      { className: "kt-ref-plans" },
      import_react7.default.createElement("h4", null, "\u540C\u6B3E\u65B9\u6848"),
      plans.map((plan) => {
        var _a2, _b2;
        return import_react7.default.createElement(
          "article",
          { key: plan.id, className: state.chosenPlanId === plan.id ? "is-chosen" : "" },
          import_react7.default.createElement("header", null, import_react7.default.createElement("strong", null, plan.id + " \xB7 " + plan.title), state.chosenPlanId === plan.id ? import_react7.default.createElement("em", null, "\u5DF2\u9009") : null),
          import_react7.default.createElement("p", null, plan.summary),
          planChips(plan).length === 0 ? null : import_react7.default.createElement("div", { className: "kt-ref-chips" }, planChips(plan).map((chip) => import_react7.default.createElement("span", { key: chip }, chip))),
          import_react7.default.createElement(
            "dl",
            null,
            import_react7.default.createElement("dt", null, "\u4FDD\u7559"),
            import_react7.default.createElement("dd", null, ((_a2 = plan.keep) != null ? _a2 : []).join("\u3001")),
            import_react7.default.createElement("dt", null, "\u66FF\u6362"),
            import_react7.default.createElement("dd", null, ((_b2 = plan.replace) != null ? _b2 : []).join("\u3001"))
          ),
          plan.risks ? import_react7.default.createElement("p", { className: "kt-muted" }, "\u98CE\u9669\uFF1A" + plan.risks) : null,
          import_react7.default.createElement("button", { type: "button", onClick: () => void run("choose", () => chooseReference(sessionId, plan.id)) }, "\u9009\u8FD9\u4E2A\u65B9\u6848")
        );
      })
    ) : null,
    import_react7.default.createElement(
      "section",
      { className: "kt-ref-rights" },
      import_react7.default.createElement("h4", null, "\u7248\u6743 / \u6765\u6E90"),
      import_react7.default.createElement("p", null, rights.status === "confirmed" ? "\u5DF2\u786E\u8BA4\uFF1A" + ((_I = { self: "\u81EA\u6709", licensed: "\u5DF2\u6388\u6743", "structure-only": "\u53EA\u5B66\u7ED3\u6784\u3001\u4E0D\u590D\u7528\u753B\u9762" }[rights.basis]) != null ? _I : rights.basis) : "\u672A\u786E\u8BA4\u3002\u672A\u786E\u8BA4\u7248\u6743\u65F6 G0 \u4E0D\u4F1A\u901A\u8FC7\u3002"),
      rights.status === "confirmed" ? null : import_react7.default.createElement(
        "div",
        { className: "kt-ref-actions" },
        import_react7.default.createElement("button", { type: "button", onClick: () => void run("rights", () => confirmReferenceRights(sessionId, "self")) }, "\u81EA\u6709"),
        import_react7.default.createElement("button", { type: "button", onClick: () => void run("rights", () => confirmReferenceRights(sessionId, "licensed")) }, "\u5DF2\u6388\u6743"),
        import_react7.default.createElement("button", { type: "button", onClick: () => void run("rights", () => confirmReferenceRights(sessionId, "structure-only")) }, "\u53EA\u5B66\u7ED3\u6784")
      )
    ),
    readiness.ready ? import_react7.default.createElement("p", { className: "kt-ok" }, "G0 \u524D\u7F6E\u5DF2\u5C31\u7EEA\u3002") : import_react7.default.createElement("p", { className: "kt-warning" }, "G0 \u8FD8\u7F3A\uFF1A" + readiness.blockers.join("\uFF1B"))
  );
}
function NovelView({ data, loading, error, sessionId, onOpenFile, onPrompt, onRefresh }) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n;
  const [title, setTitle] = (0, import_react7.useState)("");
  const [genre, setGenre] = (0, import_react7.useState)("");
  const [platform, setPlatform] = (0, import_react7.useState)("");
  const [logline, setLogline] = (0, import_react7.useState)("");
  const [importPath, setImportPath] = (0, import_react7.useState)("");
  const [projectName, setProjectName] = (0, import_react7.useState)("");
  const [busy, setBusy] = (0, import_react7.useState)(void 0);
  const [actionError, setActionError] = (0, import_react7.useState)(void 0);
  const [chapterBusy, setChapterBusy] = (0, import_react7.useState)(void 0);
  const [chapterContextText, setChapterContextText] = (0, import_react7.useState)(void 0);
  const [chapterFilter, setChapterFilter] = (0, import_react7.useState)("all");
  const [chapterCommentFor, setChapterCommentFor] = (0, import_react7.useState)(void 0);
  const [chapterCommentText, setChapterCommentText] = (0, import_react7.useState)("");
  const [notice, setNotice] = (0, import_react7.useState)(void 0);
  const [worldCategory, setWorldCategory] = (0, import_react7.useState)("rule");
  const [worldText, setWorldText] = (0, import_react7.useState)("");
  const [charName, setCharName] = (0, import_react7.useState)("");
  const [charDesire, setCharDesire] = (0, import_react7.useState)("");
  const [charVoice, setCharVoice] = (0, import_react7.useState)("");
  const doImport = async () => {
    var _a2;
    setBusy("import");
    setActionError(void 0);
    try {
      await importNovelProject(sessionId, { path: importPath.trim() });
      setImportPath("");
      onRefresh();
    } catch (cause) {
      setActionError((_a2 = cause.message) != null ? _a2 : String(cause));
    } finally {
      setBusy(void 0);
    }
  };
  const init = async (input) => {
    var _a2;
    setBusy("init");
    setActionError(void 0);
    try {
      await initNovelProject(sessionId, input);
      onRefresh();
    } catch (cause) {
      setActionError((_a2 = cause.message) != null ? _a2 : String(cause));
    } finally {
      setBusy(void 0);
    }
  };
  const mutate = async (action) => {
    var _a2;
    setChapterBusy("edit");
    setActionError(void 0);
    try {
      await action();
      onRefresh();
    } catch (cause) {
      setActionError((_a2 = cause.message) != null ? _a2 : String(cause));
    } finally {
      setChapterBusy(void 0);
    }
  };
  const addWorld = () => void mutate(async () => {
    await editNovelWorld(sessionId, { action: "add", category: worldCategory, text: worldText });
    setWorldText("");
  });
  const dropWorld = (category, index) => void mutate(() => editNovelWorld(sessionId, { action: "remove", category, index }));
  const saveCharacter = () => void mutate(async () => {
    await editNovelCharacter(sessionId, { action: "upsert", name: charName, fields: { "\u6B32\u671B": charDesire, "\u53E3\u543B": charVoice } });
    setCharName("");
    setCharDesire("");
    setCharVoice("");
  });
  const dropCharacter = (name2) => void mutate(() => editNovelCharacter(sessionId, { action: "remove", name: name2 }));
  const publish = async () => {
    var _a2, _b2;
    setChapterBusy("publish");
    setActionError(void 0);
    try {
      const result = await publishNovel(sessionId, {});
      setNotice("\u5DF2\u5199\u5165 " + result.path + (((_a2 = result.missing) == null ? void 0 : _a2.length) ? "\uFF1B\u5F85\u8865\uFF1A" + result.missing.join("\u3001") : ""));
    } catch (cause) {
      setActionError((_b2 = cause.message) != null ? _b2 : String(cause));
    } finally {
      setChapterBusy(void 0);
    }
  };
  const adapt = async () => {
    var _a2;
    setChapterBusy("adapt");
    setActionError(void 0);
    try {
      const result = await adaptNovel(sessionId, { target: "\u77ED\u5267" });
      setNotice("\u5DF2\u5199\u5165 " + result.path + "\uFF1A" + result.target + " \xB7 " + String(result.episodes) + " \u96C6");
    } catch (cause) {
      setActionError((_a2 = cause.message) != null ? _a2 : String(cause));
    } finally {
      setChapterBusy(void 0);
    }
  };
  const task = async (number) => {
    var _a2;
    setChapterBusy(number);
    setActionError(void 0);
    try {
      const result = await buildNovelTask(sessionId, number);
      setChapterContextText(result.markdown);
      setNotice("\u5DF2\u751F\u6210 " + result.path);
    } catch (cause) {
      setActionError((_a2 = cause.message) != null ? _a2 : String(cause));
    } finally {
      setChapterBusy(void 0);
    }
  };
  const finalize = async (number) => {
    var _a2;
    setChapterBusy(number);
    setActionError(void 0);
    try {
      const result = await finalizeNovelChapter(sessionId, number, false);
      setNotice("\u5DF2\u5B9A\u7A3F " + result.path);
      onRefresh();
    } catch (cause) {
      setActionError((_a2 = cause.message) != null ? _a2 : String(cause));
    } finally {
      setChapterBusy(void 0);
    }
  };
  const review = async (number) => {
    var _a2;
    setChapterBusy(number);
    setActionError(void 0);
    try {
      const result = await reviewNovelChapter(sessionId, number);
      setChapterContextText(result.markdown);
      setNotice("\u5DF2\u751F\u6210 " + result.path + "\uFF1A" + result.verdict);
      onRefresh();
    } catch (cause) {
      setActionError((_a2 = cause.message) != null ? _a2 : String(cause));
    } finally {
      setChapterBusy(void 0);
    }
  };
  const addChapter = async () => {
    var _a2;
    setChapterBusy("create");
    setActionError(void 0);
    try {
      await createNovelChapter(sessionId, {});
      onRefresh();
    } catch (cause) {
      setActionError((_a2 = cause.message) != null ? _a2 : String(cause));
    } finally {
      setChapterBusy(void 0);
    }
  };
  const showContext = async (number) => {
    var _a2;
    setChapterBusy(number);
    setActionError(void 0);
    try {
      const context = await fetchNovelChapterContext(sessionId, number);
      setChapterContextText(context.text);
    } catch (cause) {
      setActionError((_a2 = cause.message) != null ? _a2 : String(cause));
    } finally {
      setChapterBusy(void 0);
    }
  };
  if (loading && data === void 0) return import_react7.default.createElement("div", { className: "kt-empty" }, "\u6B63\u5728\u8BFB\u53D6\u5C0F\u8BF4\u5DE5\u4F5C\u53F0\u2026");
  if (error !== void 0) return import_react7.default.createElement("div", { className: "kt-error" }, error);
  if (data === void 0) return import_react7.default.createElement("div", { className: "kt-empty" }, "\u8FD8\u6CA1\u6709\u5C0F\u8BF4\u9879\u76EE\u3002");
  const hasProject = Object.values((_a = data.files) != null ? _a : {}).some((file) => file.present === true);
  if (!hasProject) {
    return import_react7.default.createElement(
      "div",
      { className: "kt-novel" },
      import_react7.default.createElement(
        "section",
        { className: "kt-novel-hero" },
        import_react7.default.createElement("h3", null, "\u4ECE\u96F6\u521B\u5EFA\u4E00\u90E8\u5C0F\u8BF4"),
        import_react7.default.createElement("p", null, "\u5148\u5EFA\u53EF\u6838\u5BF9\u7684\u7ED3\u6784\uFF1A\u7075\u611F\u4E0E\u524D\u63D0\u3001\u6545\u4E8B\u67B6\u6784\u3001\u4E16\u754C\u89C2\u516D\u7C7B\u3001\u4EBA\u7269\u3001\u5927\u7EB2\u3001\u6B63\u6587\u3001\u8FFD\u8E2A\u3002\u4E4B\u540E\u6BCF\u4E00\u7AE0\u90FD\u4ECE\u5927\u7EB2\u548C\u8BBE\u5B9A\u91CC\u53D6\u4E0A\u4E0B\u6587\uFF0C\u4E0D\u628A\u6574\u672C\u4E66\u585E\u7ED9\u6A21\u578B\u3002"),
        import_react7.default.createElement(
          "div",
          { className: "kt-novel-form" },
          import_react7.default.createElement("input", { value: title, placeholder: "\u4E66\u540D\uFF08\u53EF\u540E\u6539\uFF09", onChange: (event) => setTitle(event.target.value) }),
          import_react7.default.createElement("input", { value: genre, placeholder: "\u9898\u6750\uFF08\u7384\u5E7B/\u90FD\u5E02/\u60AC\u7591\u2026\uFF09", onChange: (event) => setGenre(event.target.value) }),
          import_react7.default.createElement("input", { value: platform, placeholder: "\u5E73\u53F0\uFF08\u8D77\u70B9/\u756A\u8304/\u664B\u6C5F\u2026\uFF09", onChange: (event) => setPlatform(event.target.value) }),
          import_react7.default.createElement("input", { value: logline, placeholder: "\u4E00\u53E5\u8BDD\u6545\u4E8B", onChange: (event) => setLogline(event.target.value) }),
          import_react7.default.createElement("input", { value: projectName, placeholder: "\u9879\u76EE\u540D\uFF08\u591A\u4E66\u65F6\u586B\uFF0C\u5982 \u957F\u591C\u884C\uFF09", onChange: (event) => setProjectName(event.target.value) })
        ),
        import_react7.default.createElement(
          "div",
          { className: "kt-ref-actions" },
          import_react7.default.createElement("button", {
            type: "button",
            className: "kt-primary-action",
            disabled: busy !== void 0,
            onClick: () => void init({ title, genre, platform, logline, project: projectName.trim() === "" ? void 0 : "\u5C0F\u8BF4/" + projectName.trim() })
          }, busy === "init" ? "\u521B\u5EFA\u4E2D\u2026" : "\u521B\u5EFA\u5C0F\u8BF4\u7ED3\u6784"),
          import_react7.default.createElement("button", { type: "button", onClick: () => onPrompt("\u4ECE\u96F6\u5E2E\u6211\u7ACB\u9879\u4E00\u90E8\u5C0F\u8BF4\uFF1A\u5148\u95EE\u6E05\u9898\u6750\u3001\u5E73\u53F0\u3001\u7BC7\u5E45\u3001\u4E00\u53E5\u8BDD\u6545\u4E8B\u548C\u4E3B\u89D2\uFF0C\u518D\u8C03\u7528 toon_novel_init \u5EFA\u7ED3\u6784\u3002") }, "\u8BA9 Agent \u4ECE\u7ACB\u9879\u5F00\u59CB")
        ),
        import_react7.default.createElement(
          "div",
          { className: "kt-novel-form" },
          import_react7.default.createElement("input", { value: importPath, placeholder: "\u6216\u5BFC\u5165\u73B0\u6210\u5C0F\u8BF4\uFF1A\u65E7\u7A3F.md / /path/\u65E7\u7A3F.txt", onChange: (event) => setImportPath(event.target.value) }),
          import_react7.default.createElement("button", { type: "button", className: "kt-primary-action", disabled: busy !== void 0 || importPath.trim() === "", onClick: () => void doImport() }, busy === "import" ? "\u5BFC\u5165\u4E2D\u2026" : "\u5BFC\u5165\u5C0F\u8BF4")
        ),
        import_react7.default.createElement("p", { className: "kt-muted" }, "\u53EA\u521B\u5EFA\u7F3A\u5931\u6587\u4EF6\uFF0C\u4E0D\u4F1A\u8986\u76D6\u5DF2\u6709\u6B63\u6587\u3002"),
        actionError === void 0 ? null : import_react7.default.createElement("p", { className: "kt-error" }, actionError)
      )
    );
  }
  const counts = (_b = data.counts) != null ? _b : {};
  const stages = (_c = data.stages) != null ? _c : [];
  const diagnostics = (_d = data.diagnostics) != null ? _d : [];
  const next = data.nextStage;
  const partText = { blueprint: "\u84DD\u56FE", draft: "\u8349\u7A3F", review: "\u5BA1\u7A3F", final: "\u5B9A\u7A3F" };
  const statusText2 = { blueprint: "\u84DD\u56FE", draft: "\u8349\u7A3F", review: "\u5BA1\u7A3F", final: "\u5B9A\u7A3F", empty: "\u7A7A" };
  const allChapters = [...(_e = data.chapters) != null ? _e : []].sort((a, b) => b.number - a.number);
  const finalCount = allChapters.filter((chapter) => chapter.status === "final").length;
  const chapterList = chapterFilter === "all" ? allChapters : allChapters.filter((chapter) => chapter.status === chapterFilter);
  const chaptersSection = import_react7.default.createElement(
    "section",
    { className: "kt-novel-chapters" },
    import_react7.default.createElement(
      "div",
      { className: "kt-novel-chapters-head" },
      import_react7.default.createElement("h4", null, "\u7AE0\u8282\u5DE5\u4F5C\u53F0"),
      import_react7.default.createElement("span", { className: "kt-muted" }, "\u5DF2\u5B9A\u7A3F " + String(finalCount) + " / \u5171 " + String(allChapters.length) + " \u7AE0"),
      import_react7.default.createElement(
        "select",
        { value: chapterFilter, onChange: (event) => setChapterFilter(event.target.value), "aria-label": "\u7B5B\u9009\u7AE0\u8282" },
        import_react7.default.createElement("option", { value: "all" }, "\u5168\u90E8"),
        ["final", "draft", "review", "blueprint"].map((key) => import_react7.default.createElement("option", { key, value: key }, partText[key] + "\uFF08" + String(allChapters.filter((chapter) => chapter.status === key).length) + "\uFF09"))
      ),
      import_react7.default.createElement("button", { type: "button", disabled: chapterBusy !== void 0, onClick: () => void addChapter() }, chapterBusy === "create" ? "\u65B0\u5EFA\u4E2D\u2026" : "\u65B0\u5EFA\u4E0B\u4E00\u7AE0")
    ),
    allChapters.length === 0 ? import_react7.default.createElement("p", { className: "kt-muted" }, "\u8FD8\u6CA1\u6709\u7AE0\u8282\u3002\u5148\u5728\u5927\u7EB2\u91CC\u5199\u7B2C 1 \u7AE0\u76EE\u6807\u4E0E\u94A9\u5B50\uFF0C\u518D\u70B9\u300C\u65B0\u5EFA\u4E0B\u4E00\u7AE0\u300D\u3002") : chapterList.length === 0 ? import_react7.default.createElement("p", { className: "kt-muted" }, "\u8FD9\u4E2A\u72B6\u6001\u4E0B\u6CA1\u6709\u7AE0\u8282\u3002") : import_react7.default.createElement("div", { className: "kt-novel-chapter-list" }, chapterList.map((chapter) => {
      var _a2, _b2, _c2, _d2, _e2, _f2, _g2, _h2, _i2;
      const parts = (_a2 = chapter.parts) != null ? _a2 : {};
      const primary = ["final", "draft", "review", "blueprint"].find((key) => {
        var _a3;
        return (_a3 = parts[key]) == null ? void 0 : _a3.present;
      });
      const primaryFile = primary === void 0 ? void 0 : parts[primary].file;
      const heading = /^第/.test(chapter.title) ? chapter.title : "\u7B2C" + String(chapter.number) + "\u7AE0 " + chapter.title;
      const mainChars = primary === void 0 ? 0 : (_c2 = (_b2 = parts[primary]) == null ? void 0 : _b2.chars) != null ? _c2 : 0;
      const present = ["final", "draft", "review", "blueprint"].filter((key) => {
        var _a3;
        return (_a3 = parts[key]) == null ? void 0 : _a3.present;
      });
      const reviewPart = ((_d2 = parts.final) == null ? void 0 : _d2.present) ? "final" : ((_e2 = parts.draft) == null ? void 0 : _e2.present) ? "draft" : "blueprint";
      const reviewFile = (_g2 = (_f2 = parts[reviewPart]) == null ? void 0 : _f2.file) != null ? _g2 : chapter.dir;
      const openChapter = () => {
        if (primaryFile !== void 0) onOpenFile(primaryFile);
      };
      const commentOpen = chapterCommentFor === chapter.number;
      const sendComment = () => {
        const comment = chapterCommentText.trim().replace(/[。！？.!?]+$/, "");
        if (comment === "") return;
        onPrompt("\u9488\u5BF9" + heading + "\uFF08" + reviewFile + "\uFF09\u7684\u4FEE\u6539\u610F\u89C1\uFF1A" + comment + "\u3002\u5148\u8BFB\u84DD\u56FE\u3001\u5F53\u524D\u7A3F\u548C\u5BA1\u7A3F\uFF0C\u7ED9\u51FA\u5177\u4F53\u6539\u6CD5\u4E0E\u5F71\u54CD\u8303\u56F4\uFF1B\u5148\u4E0D\u8981\u76F4\u63A5\u6539\u6587\u4EF6\uFF0C\u7B49\u6211\u786E\u8BA4\u3002");
        setChapterCommentFor(void 0);
        setChapterCommentText("");
      };
      return import_react7.default.createElement(
        "div",
        { key: chapter.number, className: "kt-novel-chapter-wrap" },
        import_react7.default.createElement(
          "div",
          {
            className: "kt-novel-chapter",
            role: "button",
            tabIndex: 0,
            title: "\u70B9\u51FB\u9884\u89C8\u672C\u7AE0",
            onClick: (event) => {
              if (event.target.closest("button,select,textarea")) return;
              openChapter();
            },
            onKeyDown: (event) => {
              if (event.key === "Enter") openChapter();
            }
          },
          import_react7.default.createElement(
            "div",
            null,
            import_react7.default.createElement("strong", null, heading),
            import_react7.default.createElement("span", null, ((_h2 = statusText2[chapter.status]) != null ? _h2 : chapter.status) + " \xB7 " + (present.length === 0 ? "\u8FD8\u6CA1\u6709\u5185\u5BB9" : present.map((key) => partText[key]).join(" / ")) + " \xB7 " + String(mainChars) + " \u5B57")
          ),
          import_react7.default.createElement(
            "div",
            { className: "kt-ref-actions kt-novel-chapter-actions" },
            ["final", "draft", "review", "blueprint"].filter((key) => {
              var _a3;
              return (_a3 = parts[key]) == null ? void 0 : _a3.present;
            }).map((key) => {
              var _a3;
              return import_react7.default.createElement("button", {
                key,
                type: "button",
                title: "\u6253\u5F00 " + parts[key].file + "\uFF08" + String((_a3 = parts[key].chars) != null ? _a3 : 0) + " \u5B57\uFF09",
                onClick: () => onOpenFile(parts[key].file)
              }, "\u9884\u89C8" + partText[key]);
            }),
            import_react7.default.createElement("button", {
              type: "button",
              onClick: () => {
                setChapterCommentFor(commentOpen ? void 0 : chapter.number);
                setChapterCommentText("");
              }
            }, commentOpen ? "\u6536\u8D77\u610F\u89C1" : "\u63D0\u4FEE\u6539\u610F\u89C1"),
            import_react7.default.createElement("button", { type: "button", disabled: chapterBusy !== void 0, onClick: () => void task(chapter.number) }, chapterBusy === chapter.number ? "\u751F\u6210\u4E2D\u2026" : "\u5199\u4F5C\u4EFB\u52A1"),
            import_react7.default.createElement("button", { type: "button", disabled: chapterBusy !== void 0, onClick: () => void review(chapter.number) }, chapterBusy === chapter.number ? "\u5BA1\u7A3F\u4E2D\u2026" : "\u5BA1\u7A3F"),
            ((_i2 = parts.draft) == null ? void 0 : _i2.present) ? import_react7.default.createElement("button", { type: "button", disabled: chapterBusy !== void 0, onClick: () => void finalize(chapter.number) }, chapterBusy === chapter.number ? "\u5B9A\u7A3F\u4E2D\u2026" : "\u5B9A\u7A3F") : null,
            import_react7.default.createElement("button", { type: "button", disabled: chapterBusy !== void 0, onClick: () => void showContext(chapter.number) }, chapterBusy === chapter.number ? "\u88C5\u914D\u4E2D\u2026" : "\u770B\u4E0A\u4E0B\u6587")
          )
        ),
        commentOpen ? import_react7.default.createElement(
          "div",
          { className: "kt-novel-comment" },
          import_react7.default.createElement("textarea", {
            value: chapterCommentText,
            placeholder: "\u5199\u4E0B\u8981\u6539\u7684\u5730\u65B9\u3001\u539F\u56E0\u548C\u671F\u671B\u6548\u679C\u2026",
            onChange: (event) => setChapterCommentText(event.target.value)
          }),
          import_react7.default.createElement(
            "div",
            { className: "kt-ref-actions" },
            import_react7.default.createElement("button", { type: "button", disabled: chapterCommentText.trim() === "", onClick: sendComment }, "\u53D1\u9001\u610F\u89C1"),
            import_react7.default.createElement("button", { type: "button", onClick: () => {
              setChapterCommentFor(void 0);
              setChapterCommentText("");
            } }, "\u53D6\u6D88")
          )
        ) : null
      );
    }))
  );
  return import_react7.default.createElement(
    "div",
    { className: "kt-novel" },
    import_react7.default.createElement(
      "section",
      { className: "kt-novel-head" },
      import_react7.default.createElement(
        "div",
        null,
        import_react7.default.createElement("strong", null, "\u5C0F\u8BF4\u5DE5\u4F5C\u53F0"),
        import_react7.default.createElement("span", null, String((_f = counts.volumes) != null ? _f : 0) + " \u5377 \xB7 " + String((_g = counts.chapters) != null ? _g : 0) + " \u7AE0\u5927\u7EB2 \xB7 " + String((_h = counts.bodyChars) != null ? _h : 0) + " \u5B57\u6B63\u6587 \xB7 " + String((_i = counts.characters) != null ? _i : 0) + " \u5F20\u4EBA\u7269\u5361")
      ),
      import_react7.default.createElement(
        "div",
        { className: "kt-ref-actions" },
        import_react7.default.createElement("button", { type: "button", onClick: onRefresh }, "\u5237\u65B0"),
        import_react7.default.createElement("button", { type: "button", disabled: busy !== void 0, onClick: () => void init({}) }, busy === "init" ? "\u8865\u7F3A\u4E2D\u2026" : "\u8865\u9F50\u7F3A\u5931\u6587\u4EF6"),
        import_react7.default.createElement("button", { type: "button", disabled: chapterBusy !== void 0, onClick: () => void publish() }, chapterBusy === "publish" ? "\u6C47\u603B\u4E2D\u2026" : "\u53D1\u5E03\u8D44\u6599"),
        import_react7.default.createElement("button", { type: "button", disabled: chapterBusy !== void 0, onClick: () => void adapt() }, chapterBusy === "adapt" ? "\u751F\u6210\u4E2D\u2026" : "\u6539\u7F16\u4EA4\u63A5"),
        import_react7.default.createElement("button", { type: "button", onClick: () => onPrompt("\u8BFB\u5C0F\u8BF4\u5DE5\u4F5C\u53F0\u72B6\u6001\uFF08toon_novel_status\uFF09\uFF0C\u4ECE\u300C" + (next === void 0 ? "\u6B63\u6587" : next.label) + "\u300D\u5F00\u59CB\u7EE7\u7EED\uFF1B\u5148\u7ED9\u6211\u770B\u8FD9\u4E00\u6B65\u8981\u8865\u4EC0\u4E48\uFF0C\u518D\u52A8\u6587\u4EF6\u3002") }, "\u8BA9 Agent \u7EE7\u7EED")
      )
    ),
    import_react7.default.createElement(
      "section",
      { className: "kt-novel-stages" },
      stages.map((item) => import_react7.default.createElement(
        "div",
        { key: item.id, className: "kt-novel-stage is-" + item.status },
        import_react7.default.createElement("span", { className: "kt-novel-mark" }, item.status === "done" ? "\u2713" : item.status === "partial" ? "\xB7" : "\u2717"),
        import_react7.default.createElement(
          "div",
          null,
          import_react7.default.createElement("strong", null, item.label),
          import_react7.default.createElement("span", null, item.detail)
        ),
        import_react7.default.createElement("button", { type: "button", onClick: () => onOpenFile(item.file) }, "\u6253\u5F00")
      ))
    ),
    notice === void 0 ? null : import_react7.default.createElement("p", { className: "kt-ok" }, notice),
    chaptersSection,
    import_react7.default.createElement(
      "section",
      { className: "kt-novel-edit" },
      import_react7.default.createElement("h4", null, "\u8BBE\u5B9A\u4E0E\u4EBA\u7269"),
      import_react7.default.createElement(
        "div",
        { className: "kt-novel-world-add" },
        import_react7.default.createElement(
          "select",
          { value: worldCategory, onChange: (event) => setWorldCategory(event.target.value) },
          ((_k = (_j = data.world) == null ? void 0 : _j.categories) != null ? _k : []).map((category) => import_react7.default.createElement("option", { key: category.id, value: category.id }, category.label))
        ),
        import_react7.default.createElement("input", { value: worldText, placeholder: "\u65B0\u589E\u4E00\u6761\u4E16\u754C\u89C2\uFF08\u4E8B\u5B9E + \u4EE3\u4EF7 + \u53EF\u51B2\u7A81\u70B9\uFF09", onChange: (event) => setWorldText(event.target.value) }),
        import_react7.default.createElement("button", { type: "button", disabled: chapterBusy !== void 0, onClick: addWorld }, "\u6DFB\u52A0")
      ),
      import_react7.default.createElement(
        "div",
        { className: "kt-novel-world-list" },
        ((_m = (_l = data.world) == null ? void 0 : _l.categories) != null ? _m : []).map((category) => {
          var _a2, _b2;
          return import_react7.default.createElement(
            "div",
            { key: category.id },
            import_react7.default.createElement("strong", null, category.label + "\uFF08" + String((_a2 = category.entries) != null ? _a2 : 0) + "\uFF09"),
            ((_b2 = category.lines) != null ? _b2 : []).map((line, index) => import_react7.default.createElement(
              "span",
              { key: category.id + index },
              line,
              import_react7.default.createElement("button", { type: "button", disabled: chapterBusy !== void 0, onClick: () => dropWorld(category.id, index + 1) }, "\xD7")
            ))
          );
        })
      ),
      import_react7.default.createElement(
        "div",
        { className: "kt-novel-char-add" },
        import_react7.default.createElement("input", { value: charName, placeholder: "\u4EBA\u7269\u540D", onChange: (event) => setCharName(event.target.value) }),
        import_react7.default.createElement("input", { value: charDesire, placeholder: "\u6B32\u671B/\u76EE\u6807", onChange: (event) => setCharDesire(event.target.value) }),
        import_react7.default.createElement("input", { value: charVoice, placeholder: "\u53E3\u543B", onChange: (event) => setCharVoice(event.target.value) }),
        import_react7.default.createElement("button", { type: "button", disabled: chapterBusy !== void 0 || charName.trim() === "", onClick: saveCharacter }, "\u4FDD\u5B58\u4EBA\u7269")
      ),
      import_react7.default.createElement(
        "div",
        { className: "kt-novel-char-list" },
        ((_n = data.characters) != null ? _n : []).map((card) => {
          var _a2, _b2, _c2, _d2, _e2, _f2;
          return import_react7.default.createElement(
            "div",
            { key: card.name },
            import_react7.default.createElement("strong", null, card.name),
            import_react7.default.createElement("span", null, ((_d2 = (_c2 = (_a2 = card.fields) == null ? void 0 : _a2["\u6B32\u671B"]) != null ? _c2 : (_b2 = card.fields) == null ? void 0 : _b2["\u76EE\u6807"]) != null ? _d2 : "\u672A\u5199\u6B32\u671B") + " \xB7 " + ((_f2 = (_e2 = card.fields) == null ? void 0 : _e2["\u53E3\u543B"]) != null ? _f2 : "\u672A\u5199\u53E3\u543B")),
            import_react7.default.createElement("button", { type: "button", disabled: chapterBusy !== void 0, onClick: () => dropCharacter(card.name) }, "\xD7")
          );
        })
      )
    ),
    chapterContextText === void 0 ? null : import_react7.default.createElement("pre", { className: "kt-novel-context" }, chapterContextText),
    diagnostics.length > 0 ? import_react7.default.createElement(
      "section",
      { className: "kt-novel-diag" },
      import_react7.default.createElement("h4", null, "\u5F85\u5904\u7406"),
      import_react7.default.createElement("ul", null, diagnostics.slice(0, 12).map((item) => import_react7.default.createElement("li", { key: item.code + item.message }, item.message)))
    ) : import_react7.default.createElement("p", { className: "kt-ok" }, "\u5F53\u524D\u9636\u6BB5\u6CA1\u6709\u53D1\u73B0\u7ED3\u6784\u7F3A\u53E3\u3002"),
    actionError === void 0 ? null : import_react7.default.createElement("p", { className: "kt-error" }, actionError)
  );
}
function WelcomeCard({ onDismiss }) {
  return import_react7.default.createElement(
    "section",
    { className: "kt-welcome" },
    import_react7.default.createElement("h2", null, "KToon \u521B\u4F5C\u53F0"),
    import_react7.default.createElement("p", null, "\u8FD9\u662F\u4E00\u5F20\u8DDF\u7740\u6587\u4EF6\u8D70\u7684\u5DE5\u4F5C\u53F0\uFF1A\u5DE5\u4F5C\u533A\u91CC\u51FA\u73B0\u521B\u4F5C\u6587\u4EF6\uFF0C\u5B83\u5C31\u5728\u8FD9\u91CC\u5C55\u5F00\uFF1B\u6CA1\u6709\u521B\u4F5C\u6587\u4EF6\u65F6\uFF0C\u5B83\u4FDD\u6301\u539F\u751F\u5BF9\u8BDD\u4E0D\u52A8\u3002"),
    import_react7.default.createElement(
      "ol",
      null,
      import_react7.default.createElement("li", null, "\u5C0F\u8BF4\uFF1A\u5199 \u6B63\u6587.md / \u8BBE\u5B9A.md\uFF0C\u6216\u5EFA \u6B63\u6587/ \u5927\u7EB2/ \u8BBE\u5B9A/ \u76EE\u5F55\u3002"),
      import_react7.default.createElement("li", null, "\u77ED\u5267\u6F2B\u5267\uFF1A\u5EFA \u5267\u96C6/EP001/ \u4E0E \u5267\u672C.md\u3001\u89C6\u89C9\u8BBE\u5B9A.md\u3001\u5206\u955C.md\u3002"),
      import_react7.default.createElement("li", null, "\u4E92\u52A8\u6E38\u620F\uFF1Agame-adaptations/<project>/ + build/app/index.html\u3002"),
      import_react7.default.createElement("li", null, "\u89C6\u9891\u89E3\u8BF4\uFF1Avideo-recaps/<project>/ + sources/\u3002")
    ),
    import_react7.default.createElement("p", { className: "kt-welcome-note" }, "\u5728\u5BF9\u8BDD\u91CC\u8BF4\u6E05\u695A\u8981\u505A\u7684\u4F5C\u54C1\u7C7B\u578B\uFF0CAgent \u4F1A\u6309\u76EE\u5F55\u7EA6\u5B9A\u5199\u51FA\u7B2C\u4E00\u4EFD\u6587\u4EF6\u3002\u5A92\u4F53\u751F\u6210\u7531\u5DF2\u5B89\u88C5\u7684\u591A\u5A92\u4F53\u7F51\u5173\u63D2\u4EF6\u63D0\u4F9B\u3002"),
    import_react7.default.createElement("button", { type: "button", className: "kt-welcome-dismiss", onClick: onDismiss }, "\u77E5\u9053\u4E86\uFF0C\u6536\u8D77\u5F15\u5BFC")
  );
}
function Workbench(props) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
  const sessionId = props.sessionId;
  const marker = (0, import_react7.useRef)(null);
  const [target, setTarget] = (0, import_react7.useState)(void 0);
  const [tabsTarget, setTabsTarget] = (0, import_react7.useState)(void 0);
  const [fallbackTabsTarget, setFallbackTabsTarget] = (0, import_react7.useState)(void 0);
  const [workspace, setWorkspace] = (0, import_react7.useState)(void 0);
  const [error, setError] = (0, import_react7.useState)(void 0);
  const [tab, setTab] = (0, import_react7.useState)("story");
  const [selected, setSelected] = (0, import_react7.useState)(void 0);
  const [buffers, setBuffers] = (0, import_react7.useState)({});
  const [saving, setSaving] = (0, import_react7.useState)(false);
  const [open, setOpen] = (0, import_react7.useState)(false);
  const [preferenceLoaded, setPreferenceLoaded] = (0, import_react7.useState)(false);
  const [dramaEpisode, setDramaEpisode] = (0, import_react7.useState)(void 0);
  const [drama, setDrama] = (0, import_react7.useState)(void 0);
  const [dramaError, setDramaError] = (0, import_react7.useState)(void 0);
  const [dramaLoading, setDramaLoading] = (0, import_react7.useState)(false);
  const [dramaRetry, setDramaRetry] = (0, import_react7.useState)(0);
  const [dramaView, setDramaView] = (0, import_react7.useState)("production");
  const [dramaMotion, setDramaMotion] = (0, import_react7.useState)(void 0);
  const [dramaMotionError, setDramaMotionError] = (0, import_react7.useState)(void 0);
  const [dramaMotionLoading, setDramaMotionLoading] = (0, import_react7.useState)(false);
  const [dramaMotionTick, setDramaMotionTick] = (0, import_react7.useState)(0);
  const [dramaVersions, setDramaVersions] = (0, import_react7.useState)(void 0);
  const [dramaVersionsError, setDramaVersionsError] = (0, import_react7.useState)(void 0);
  const [dramaVersionsLoading, setDramaVersionsLoading] = (0, import_react7.useState)(false);
  const [dramaVersionsTick, setDramaVersionsTick] = (0, import_react7.useState)(0);
  const [dramaComposition, setDramaComposition] = (0, import_react7.useState)(void 0);
  const [dramaCompositionError, setDramaCompositionError] = (0, import_react7.useState)(void 0);
  const [dramaCompositionLoading, setDramaCompositionLoading] = (0, import_react7.useState)(false);
  const [dramaCompositionTick, setDramaCompositionTick] = (0, import_react7.useState)(0);
  const [dramaTemplates, setDramaTemplates] = (0, import_react7.useState)(void 0);
  const [dramaTemplatesError, setDramaTemplatesError] = (0, import_react7.useState)(void 0);
  const [dramaTemplatesTick, setDramaTemplatesTick] = (0, import_react7.useState)(0);
  const [storyView, setStoryView] = (0, import_react7.useState)("documents");
  const [novelData, setNovelData] = (0, import_react7.useState)(void 0);
  const [novelError, setNovelError] = (0, import_react7.useState)(void 0);
  const [novelLoading, setNovelLoading] = (0, import_react7.useState)(false);
  const [novelTick, setNovelTick] = (0, import_react7.useState)(0);
  const [referenceData, setReferenceData] = (0, import_react7.useState)(void 0);
  const [referenceError, setReferenceError] = (0, import_react7.useState)(void 0);
  const [referenceLoading, setReferenceLoading] = (0, import_react7.useState)(false);
  const [referenceTick, setReferenceTick] = (0, import_react7.useState)(0);
  const [gameId, setGameId] = (0, import_react7.useState)(void 0);
  const [gameView, setGameView] = (0, import_react7.useState)("play");
  const [gameData, setGameData] = (0, import_react7.useState)(void 0);
  const [gameError, setGameError] = (0, import_react7.useState)(void 0);
  const [gameBrief, setGameBrief] = (0, import_react7.useState)(void 0);
  const [gameBriefSaving, setGameBriefSaving] = (0, import_react7.useState)(false);
  const [gameBriefError, setGameBriefError] = (0, import_react7.useState)(void 0);
  const [gameOptions, setGameOptions] = (0, import_react7.useState)(void 0);
  const [gameSnapshots, setGameSnapshots] = (0, import_react7.useState)(void 0);
  const [gameQa, setGameQa] = (0, import_react7.useState)(void 0);
  const [gamePanelError, setGamePanelError] = (0, import_react7.useState)(void 0);
  const [gamePanelTick, setGamePanelTick] = (0, import_react7.useState)(0);
  const [gameChoosing, setGameChoosing] = (0, import_react7.useState)(void 0);
  const [videoId, setVideoId] = (0, import_react7.useState)(void 0);
  const [videoView, setVideoView] = (0, import_react7.useState)("preview");
  const [intents, setIntents] = (0, import_react7.useState)([]);
  const [welcomeDismissed, setWelcomeDismissed] = (0, import_react7.useState)(false);
  const [chatWidth, setChatWidth] = (0, import_react7.useState)(void 0);
  const intentCursor = (0, import_react7.useRef)(0);
  const forceOpenRef = (0, import_react7.useRef)(false);
  const workspaceVersion = (0, import_react7.useMemo)(() => {
    var _a2;
    return ((_a2 = workspace == null ? void 0 : workspace.files) != null ? _a2 : []).map((file) => file.path + ":" + file.version).join("|");
  }, [workspace]);
  (0, import_react7.useEffect)(() => {
    var _a2;
    const document2 = (_a2 = marker.current) == null ? void 0 : _a2.ownerDocument;
    if (document2 === void 0) return;
    const locate = () => {
      var _a3;
      const anchor = (_a3 = document2.querySelector('[data-conversation-content]:not([data-sidebar-chat] *) [data-slot="conversation.session"]')) != null ? _a3 : document2.querySelector("[data-conversation-content]:not([data-sidebar-chat] *) [data-conversation-scroll]");
      setTarget((current) => current === anchor ? current : anchor != null ? anchor : void 0);
    };
    locate();
    const locateTabs = () => {
      var _a3;
      const creative2 = (workspace == null ? void 0 : workspace.creative) === true;
      const viewTabs = document2.querySelector("[data-conversation-tabs]");
      if (!creative2) {
        (_a3 = document2.querySelector("[data-kylin-toon-top-tabs]")) == null ? void 0 : _a3.remove();
        const stale2 = document2.querySelector("[data-kylin-toon-tabs]");
        if (stale2 !== null) stale2.remove();
        setTabsTarget((current) => current === void 0 ? current : void 0);
        setFallbackTabsTarget((current) => current === void 0 ? current : void 0);
        return;
      }
      if (viewTabs === null) {
        const content = document2.querySelector("[data-conversation-content]");
        if (content === null) return;
        let fallback = document2.querySelector("[data-kylin-toon-top-tabs]");
        if (fallback === null) {
          fallback = document2.createElement("div");
          fallback.setAttribute("data-kylin-toon-top-tabs", "");
          fallback.className = "kt-top-tabs-host";
          content.insertBefore(fallback, content.firstChild);
        }
        setTabsTarget((current) => current === void 0 ? current : void 0);
        setFallbackTabsTarget((current) => current === fallback ? current : fallback);
        return;
      }
      const stale = document2.querySelector("[data-kylin-toon-top-tabs]");
      if (stale !== null) stale.remove();
      setFallbackTabsTarget((current) => current === void 0 ? current : void 0);
      const row = viewTabs.parentElement;
      if (row === null) return;
      let holder = document2.querySelector("[data-kylin-toon-tabs]");
      if (holder === null) {
        holder = document2.createElement("div");
        holder.setAttribute("data-kylin-toon-tabs", "");
        holder.className = "kt-tabs-holder";
      }
      if (holder.parentElement !== row || holder.previousElementSibling !== viewTabs) {
        row.insertBefore(holder, viewTabs.nextSibling);
      }
      setTabsTarget((current) => current === holder ? current : holder);
    };
    locateTabs();
    const onViewTabClick = (event) => {
      const viewTabs = document2.querySelector("[data-conversation-tabs]");
      if (viewTabs === null) return;
      const button = event.target instanceof Element ? event.target.closest("button") : null;
      if (button === null || button.parentElement !== viewTabs) return;
      if (viewTabs.querySelector("button") === button) setOpen(false);
    };
    document2.addEventListener("click", onViewTabClick, true);
    const observer = new MutationObserver(() => {
      locate();
      locateTabs();
    });
    observer.observe(document2.body, { childList: true, subtree: true });
    return () => {
      var _a3;
      observer.disconnect();
      document2.removeEventListener("click", onViewTabClick, true);
      (_a3 = document2.querySelector("[data-kylin-toon-top-tabs]")) == null ? void 0 : _a3.remove();
    };
  }, [workspace == null ? void 0 : workspace.creative]);
  (0, import_react7.useEffect)(() => {
    if (target === void 0 || !open) return;
    const scroller = target.parentElement;
    if (scroller === null) return;
    const measure = () => {
      scroller.style.setProperty("--kt-scroll-height", String(scroller.clientHeight) + "px");
      const composer2 = scroller.querySelector(":scope > [data-composer-seat]");
      if (composer2 !== null) scroller.style.setProperty("--kt-composer-height", String(composer2.clientHeight) + "px");
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    const composer = scroller.querySelector(":scope > [data-composer-seat]");
    if (composer !== null) observer.observe(composer);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [target, open]);
  (0, import_react7.useEffect)(() => {
    if (target === void 0) return;
    const scroller = target.parentElement;
    if (scroller === null) return;
    if (typeof chatWidth === "number" && chatWidth > 0) scroller.style.setProperty("--kt-chat-width", String(chatWidth) + "px");
    else scroller.style.removeProperty("--kt-chat-width");
  }, [target, chatWidth]);
  (0, import_react7.useEffect)(() => {
    if (target === void 0 || !open) return;
    const scroller = target.parentElement;
    if (scroller === null) return;
    let frame = 0;
    let count = 0;
    const pin = () => {
      scroller.scrollTop = scroller.scrollHeight;
      count += 1;
      if (count < 40) frame = requestAnimationFrame(pin);
    };
    frame = requestAnimationFrame(pin);
    return () => cancelAnimationFrame(frame);
  }, [open, target]);
  (0, import_react7.useEffect)(() => {
    let cancelled = false;
    const controller = new AbortController();
    const load = () => {
      fetchWorkspace(sessionId, controller.signal).then((payload) => {
        if (!cancelled) {
          setWorkspace(payload);
          setError(void 0);
        }
      }).catch((cause) => {
        if (!cancelled && cause.name !== "AbortError") setError(cause.message);
      });
    };
    load();
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    const timer = setInterval(load, 4e3);
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      cancelled = true;
      controller.abort();
      clearInterval(timer);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [sessionId]);
  (0, import_react7.useEffect)(() => {
    try {
      if (window.localStorage.getItem("kylin-toon:open-session:" + sessionId) === "1") {
        window.localStorage.removeItem("kylin-toon:open-session:" + sessionId);
        forceOpenRef.current = true;
        setOpen(true);
      }
    } catch {
    }
    const handler = (event) => {
      var _a2, _b2;
      if (((_a2 = event == null ? void 0 : event.detail) == null ? void 0 : _a2.sessionId) !== sessionId) return;
      forceOpenRef.current = true;
      if ((workspace == null ? void 0 : workspace.cwd) !== void 0) storageSet("kylin-toon:open:" + workspace.cwd, true);
      setOpen(true);
      setWelcomeDismissed(true);
      const kinds = (_b2 = workspace == null ? void 0 : workspace.kinds) != null ? _b2 : {};
      if (kinds.game === true) setTab("game");
      else if (kinds.drama === true) setTab("drama");
      else if (kinds.story === true) setTab("story");
      else if (kinds.video === true) setTab("video");
    };
    window.addEventListener("ktoon:open-workbench", handler);
    return () => window.removeEventListener("ktoon:open-workbench", handler);
  }, [sessionId, workspace]);
  (0, import_react7.useEffect)(() => {
    var _a2, _b2, _c2, _d2, _e2, _f2, _g2, _h2, _i2, _j2;
    if (workspace === void 0 || preferenceLoaded) return;
    const cwd = workspace.cwd;
    const forced = forceOpenRef.current;
    setOpen(workspace.creative === true ? forced || storageGet("kylin-toon:open:" + cwd, false) === true : false);
    if (forced) storageSet("kylin-toon:open:" + cwd, true);
    forceOpenRef.current = false;
    const tabs2 = availableTabs(workspace);
    const stored = storageGet("kylin-toon:tab:" + cwd, void 0);
    const initial = ((_a2 = workspace.kinds) == null ? void 0 : _a2.story) === true ? "story" : (_b2 = tabs2[0]) != null ? _b2 : "story";
    const chosen = stored !== void 0 && tabs2.includes(stored) ? stored : initial;
    setTab(chosen);
    const savedEpisode = storageGet("kylin-toon:episode:" + cwd, void 0);
    const episodes = (_d2 = (_c2 = workspace.drama) == null ? void 0 : _c2.episodes) != null ? _d2 : [];
    const savedDirectory = (_e2 = episodes.find((item) => item.directory === savedEpisode || item.id === savedEpisode)) == null ? void 0 : _e2.directory;
    setDramaEpisode(savedDirectory != null ? savedDirectory : (_f2 = episodes[0]) == null ? void 0 : _f2.directory);
    setGameId((_h2 = (_g2 = workspace.games) == null ? void 0 : _g2[0]) == null ? void 0 : _h2.id);
    setVideoId((_j2 = (_i2 = workspace.videos) == null ? void 0 : _i2[0]) == null ? void 0 : _j2.id);
    setWelcomeDismissed(storageGet("kylin-toon:welcome:" + cwd, false));
    setChatWidth(storageGet("kylin-toon:chat-width:" + cwd, void 0));
    setPreferenceLoaded(true);
  }, [workspace, preferenceLoaded]);
  (0, import_react7.useEffect)(() => {
    if (workspace === void 0) return;
    const tabs2 = availableTabs(workspace);
    if (tabs2.length > 0 && !tabs2.includes(tab)) setTab(tabs2[0]);
  }, [workspace, tab]);
  const autoOpened = (0, import_react7.useRef)("");
  (0, import_react7.useEffect)(() => {
    var _a2;
    if (workspace === void 0 || workspace.creative !== true) return;
    if (autoOpened.current === workspace.cwd) return;
    autoOpened.current = workspace.cwd;
    setOpen(storageGet("kylin-toon:open:" + workspace.cwd, false) === true);
    const kinds = (_a2 = workspace.kinds) != null ? _a2 : {};
    const populated = TABS.map((item) => item.id).filter((id) => kinds[id] === true);
    const stored = storageGet("kylin-toon:tab:" + workspace.cwd, void 0);
    if (stored !== void 0 && populated.includes(stored)) setTab(stored);
    else if (populated.length > 0 && !populated.includes(tab)) setTab(populated[0]);
  }, [workspace, tab]);
  (0, import_react7.useEffect)(() => {
    const controller = new AbortController();
    let cancelled = false;
    const poll = () => {
      fetchIntents(sessionId, intentCursor.current, controller.signal).then((payload) => {
        var _a2, _b2, _c2;
        if (cancelled || payload.intents.length === 0) return;
        intentCursor.current = payload.intents[payload.intents.length - 1].id;
        setIntents((current) => [...current, ...payload.intents].slice(-40));
        for (const intent of payload.intents) {
          if (intent.episode !== void 0) {
            const match = ((_b2 = (_a2 = workspace == null ? void 0 : workspace.drama) == null ? void 0 : _a2.episodes) != null ? _b2 : []).find((episode) => episode.id === intent.episode || episode.directory === intent.episode);
            setDramaEpisode((_c2 = match == null ? void 0 : match.directory) != null ? _c2 : intent.episode);
          }
          if (intent.action === "focus_workspace") {
            setOpen(true);
            if (["story", "drama", "game", "video"].includes(intent.kind)) setTab(intent.kind);
            if (intent.kind === "game" && typeof intent.project === "string" && intent.project !== "") setGameId(intent.project);
          }
          if (intent.action === "open_section") {
            setOpen(true);
            setTab("drama");
            if (intent.section === "reference") setDramaView("reference");
            else if (intent.section === "tasks" || intent.section === "canvas") setDramaView("production");
          }
          if (intent.action === "set_sequence" && Array.isArray(intent.shotIds)) setIntents((current) => current);
        }
      }).catch(() => {
      });
    };
    poll();
    const timer = setInterval(poll, 2500);
    return () => {
      cancelled = true;
      controller.abort();
      clearInterval(timer);
    };
  }, [sessionId]);
  const lastDramaVersion = (0, import_react7.useRef)("");
  (0, import_react7.useEffect)(() => {
    var _a2, _b2, _c2;
    const episodes = (_b2 = (_a2 = workspace == null ? void 0 : workspace.drama) == null ? void 0 : _a2.episodes) != null ? _b2 : [];
    if (episodes.length === 0) return;
    if (dramaEpisode === void 0 || !episodes.some((episode) => episode.directory === dramaEpisode || episode.id === dramaEpisode)) {
      setDramaEpisode((_c2 = episodes[0]) == null ? void 0 : _c2.directory);
    }
  }, [workspace, dramaEpisode]);
  (0, import_react7.useEffect)(() => {
    if (tab !== "drama" || dramaEpisode === void 0) return;
    const key = dramaEpisode + "|" + workspaceVersion;
    if (key === lastDramaVersion.current) return;
    lastDramaVersion.current = key;
    const controller = new AbortController();
    setDramaLoading(true);
    let retry;
    fetchDrama(sessionId, dramaEpisode, controller.signal).then((payload) => {
      setDrama(payload);
      setDramaError(void 0);
    }).catch((cause) => {
      if (cause.name === "AbortError") return;
      setDramaError(cause.message);
      retry = setTimeout(() => setDramaRetry((value) => value + 1), 3e3);
    }).finally(() => setDramaLoading(false));
    return () => {
      controller.abort();
      if (retry !== void 0) clearTimeout(retry);
    };
  }, [tab, dramaEpisode, workspaceVersion, sessionId, dramaRetry, open]);
  (0, import_react7.useEffect)(() => {
    const report = () => {
      var _a2, _b2, _c2, _d2;
      const bar = document.querySelector(".kt-header-tabs");
      const row = (_b2 = (_a2 = document.querySelector("[data-conversation-tabs]")) == null ? void 0 : _a2.parentElement) != null ? _b2 : null;
      const rect = bar == null ? void 0 : bar.getBoundingClientRect();
      const rowRect = row == null ? void 0 : row.getBoundingClientRect();
      const style = bar === void 0 || bar === null ? void 0 : getComputedStyle(bar);
      const scroller = document.querySelector("[data-conversation-scroll]");
      const composer = document.querySelector("[data-composer-seat]");
      const scrollerInfo = scroller === null ? null : {
        top: Math.round(scroller.scrollTop),
        height: Math.round(scroller.scrollHeight),
        client: Math.round(scroller.clientHeight),
        atBottom: scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight <= 8,
        columns: getComputedStyle(scroller).gridTemplateColumns
      };
      const composerRect = composer == null ? void 0 : composer.getBoundingClientRect();
      const sampleButton = document.querySelector(".kt-header-tabs button");
      const sampleStyle = sampleButton === null ? void 0 : getComputedStyle(sampleButton);
      const hit = bar === void 0 || bar === null || typeof document.elementFromPoint !== "function" ? void 0 : document.elementFromPoint(rect.x + 4, rect.y + 8);
      const rowStyle = row === null ? void 0 : getComputedStyle(row);
      const fallbackHost = document.querySelector("[data-kylin-toon-top-tabs]");
      const fallbackRect = fallbackHost === null ? void 0 : fallbackHost.getBoundingClientRect();
      fetch("/kylin-toon/client-status", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionId != null ? sessionId : "",
          stage: "workbench",
          hasTarget: target !== void 0,
          hasTabsTarget: tabsTarget !== void 0,
          hasWorkspace: workspace !== void 0,
          creative: (workspace == null ? void 0 : workspace.creative) === true,
          open,
          shots: document.querySelectorAll(".kt-shot").length,
          dramaShots: (_d2 = (_c2 = drama == null ? void 0 : drama.shots) == null ? void 0 : _c2.length) != null ? _d2 : null,
          dramaError: dramaError != null ? dramaError : null,
          dramaEpisode: dramaEpisode != null ? dramaEpisode : null,
          dramaView,
          error: error != null ? error : null,
          bar: rect === void 0 ? null : {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            w: Math.round(rect.width),
            h: Math.round(rect.height),
            display: style == null ? void 0 : style.display,
            visibility: style == null ? void 0 : style.visibility,
            opacity: style == null ? void 0 : style.opacity,
            overflow: style == null ? void 0 : style.overflow,
            buttons: [...document.querySelectorAll(".kt-header-tabs button")].map((button) => ({
              text: button.textContent,
              x: Math.round(button.getBoundingClientRect().x),
              y: Math.round(button.getBoundingClientRect().y),
              w: Math.round(button.getBoundingClientRect().width),
              h: Math.round(button.getBoundingClientRect().height),
              color: getComputedStyle(button).color
            }))
          },
          row: rowRect === void 0 || rowRect === null ? null : { x: Math.round(rowRect.x), y: Math.round(rowRect.y), w: Math.round(rowRect.width), h: Math.round(rowRect.height), overflow: rowStyle == null ? void 0 : rowStyle.overflow, position: rowStyle == null ? void 0 : rowStyle.position, zIndex: rowStyle == null ? void 0 : rowStyle.zIndex, display: rowStyle == null ? void 0 : rowStyle.display },
          fallback: fallbackHost === null ? null : {
            x: Math.round(fallbackRect.x),
            y: Math.round(fallbackRect.y),
            w: Math.round(fallbackRect.width),
            h: Math.round(fallbackRect.height),
            children: fallbackHost.children.length,
            display: getComputedStyle(fallbackHost).display,
            visibility: getComputedStyle(fallbackHost).visibility,
            opacity: getComputedStyle(fallbackHost).opacity
          },
          scroller: scrollerInfo,
          composer: composerRect === void 0 ? null : { top: Math.round(composerRect.top), bottom: Math.round(composerRect.bottom), h: Math.round(composerRect.height) },
          resizer: document.querySelector(".kt-resizer") !== null,
          reference: document.querySelector(".kt-reference") !== null,
          rowOrder: (() => {
            const viewTabs = document.querySelector("[data-conversation-tabs]");
            const row2 = viewTabs == null ? void 0 : viewTabs.parentElement;
            return row2 === void 0 || row2 === null ? null : [...row2.children].map((child) => {
              var _a3;
              return {
                tag: child.tagName.toLowerCase(),
                cls: String(child.className).slice(0, 24),
                text: ((_a3 = child.innerText) != null ? _a3 : "").replace(/\s+/g, " ").trim().slice(0, 30),
                gap: (() => {
                  const s = getComputedStyle(child);
                  return { col: s.columnGap, row: s.rowGap };
                })(),
                x: Math.round(child.getBoundingClientRect().x),
                w: Math.round(child.getBoundingClientRect().width)
              };
            });
          })(),
          surface: (() => {
            var _a3, _b3;
            const surface = document.querySelector(".kt-surface");
            const tree2 = document.querySelector(".kt-tree");
            const main2 = document.querySelector(".kt-main");
            const rect2 = tree2 == null ? void 0 : tree2.getBoundingClientRect();
            return surface === null ? null : {
              open: surface.getAttribute("data-open"),
              tree: tree2 === null || tree2 === void 0 ? null : { x: Math.round(rect2.x), y: Math.round(rect2.y), w: Math.round(rect2.width), h: Math.round(rect2.height), text: String((_a3 = tree2.innerText) != null ? _a3 : "").slice(0, 60), display: getComputedStyle(tree2).display, bg: getComputedStyle(tree2).backgroundColor, color: getComputedStyle(tree2).color },
              main: main2 === void 0 || main2 === null ? null : { w: Math.round(main2.getBoundingClientRect().width), h: Math.round(main2.getBoundingClientRect().height), text: String((_b3 = main2.innerText) != null ? _b3 : "").slice(0, 60) },
              files: files.length,
              tab,
              selected: selected != null ? selected : null
            };
          })()
        })
      }).catch(() => {
      });
    };
    report();
    const timer = setTimeout(report, 2500);
    return () => clearTimeout(timer);
  }, [sessionId, target, tabsTarget, workspace, open, error]);
  (0, import_react7.useEffect)(() => {
    if (tab !== "drama" || dramaView !== "reference") return;
    const controller = new AbortController();
    setReferenceLoading(true);
    fetchReference(sessionId, controller.signal).then((payload) => {
      setReferenceData(payload);
      setReferenceError(void 0);
    }).catch((cause) => {
      if (cause.name !== "AbortError") setReferenceError(cause.message);
    }).finally(() => setReferenceLoading(false));
    return () => controller.abort();
  }, [tab, dramaView, workspaceVersion, sessionId, referenceTick]);
  (0, import_react7.useEffect)(() => {
    if (tab !== "drama" || dramaView !== "composition") return;
    const controller = new AbortController();
    fetchDramaTemplates(sessionId, controller.signal).then((payload) => {
      setDramaTemplates(payload);
      setDramaTemplatesError(void 0);
    }).catch((cause) => {
      if (cause.name !== "AbortError") setDramaTemplatesError(cause.message);
    });
    return () => controller.abort();
  }, [tab, dramaView, workspaceVersion, sessionId, dramaTemplatesTick]);
  (0, import_react7.useEffect)(() => {
    if (tab !== "drama" || dramaView !== "composition" || dramaEpisode === void 0) return;
    const controller = new AbortController();
    setDramaCompositionLoading(true);
    fetchComposition(sessionId, dramaEpisode, controller.signal).then((payload) => {
      setDramaComposition(payload);
      setDramaCompositionError(void 0);
    }).catch((cause) => {
      if (cause.name !== "AbortError") setDramaCompositionError(cause.message);
    }).finally(() => setDramaCompositionLoading(false));
    return () => controller.abort();
  }, [tab, dramaView, dramaEpisode, workspaceVersion, sessionId, dramaCompositionTick]);
  (0, import_react7.useEffect)(() => {
    if (tab !== "drama" || dramaView !== "versions" || dramaEpisode === void 0) return;
    const controller = new AbortController();
    setDramaVersionsLoading(true);
    fetchDramaVersions(sessionId, dramaEpisode, controller.signal).then((payload) => {
      setDramaVersions(payload);
      setDramaVersionsError(void 0);
    }).catch((cause) => {
      if (cause.name !== "AbortError") setDramaVersionsError(cause.message);
    }).finally(() => setDramaVersionsLoading(false));
    return () => controller.abort();
  }, [tab, dramaView, dramaEpisode, workspaceVersion, sessionId, dramaVersionsTick]);
  (0, import_react7.useEffect)(() => {
    if (tab !== "drama" || dramaView !== "motion" || dramaEpisode === void 0) return;
    const controller = new AbortController();
    setDramaMotionLoading(true);
    fetchDramaMotion(sessionId, dramaEpisode, controller.signal).then((payload) => {
      setDramaMotion(payload);
      setDramaMotionError(void 0);
    }).catch((cause) => {
      if (cause.name !== "AbortError") setDramaMotionError(cause.message);
    }).finally(() => setDramaMotionLoading(false));
    return () => controller.abort();
  }, [tab, dramaView, dramaEpisode, workspaceVersion, sessionId, dramaMotionTick]);
  (0, import_react7.useEffect)(() => {
    if (tab !== "story" || storyView !== "plan") return;
    const controller = new AbortController();
    setNovelLoading(true);
    fetchNovel(sessionId, controller.signal).then((payload) => {
      setNovelData(payload);
      setNovelError(void 0);
    }).catch((cause) => {
      if (cause.name !== "AbortError") setNovelError(cause.message);
    }).finally(() => setNovelLoading(false));
    return () => controller.abort();
  }, [tab, storyView, workspaceVersion, sessionId, novelTick]);
  const gameVersion = (0, import_react7.useMemo)(() => {
    var _a2, _b2, _c2;
    const game = ((_a2 = workspace == null ? void 0 : workspace.games) != null ? _a2 : []).find((item) => item.id === gameId);
    if (game === void 0) return "";
    return String((_b2 = game.previewVersion) != null ? _b2 : "") + "|" + JSON.stringify((_c2 = game.docVersions) != null ? _c2 : {});
  }, [workspace, gameId]);
  (0, import_react7.useEffect)(() => {
    var _a2;
    const games = (_a2 = workspace == null ? void 0 : workspace.games) != null ? _a2 : [];
    if (games.length === 0) return;
    if (gameId === void 0 || gameId === null || !games.some((game) => game.id === gameId)) setGameId(games[0].id);
  }, [workspace, gameId]);
  (0, import_react7.useEffect)(() => {
    if (tab !== "game") return;
    const controller = new AbortController();
    fetchGame(sessionId, gameId, controller.signal).then((payload) => {
      setGameData(payload);
      setGameError(void 0);
    }).catch((cause) => {
      if (cause.name !== "AbortError") setGameError(cause.message);
    });
    return () => controller.abort();
  }, [tab, sessionId, gameId, workspaceVersion, gameVersion]);
  (0, import_react7.useEffect)(() => {
    if (tab !== "game" || gameId === void 0 || gameId === null) return;
    const controller = new AbortController();
    Promise.all([
      fetchGameBrief(sessionId, gameId, controller.signal),
      fetchConceptOptions(sessionId, gameId, controller.signal),
      fetchGameSnapshots(sessionId, gameId, controller.signal),
      fetchGameQa(sessionId, gameId, controller.signal)
    ]).then(([brief, options, snapshots, qa]) => {
      setGameBrief(brief);
      setGameOptions(options);
      setGameSnapshots(snapshots);
      setGameQa(qa);
      setGamePanelError(void 0);
    }).catch((cause) => {
      if (cause.name !== "AbortError") setGamePanelError(cause.message);
    });
    return () => controller.abort();
  }, [tab, sessionId, gameId, workspaceVersion, gameVersion, gamePanelTick]);
  const files = (_a = workspace == null ? void 0 : workspace.files) != null ? _a : [];
  const openFile = (0, import_react7.useCallback)((path) => {
    const known = tabForPath(path);
    if (known !== void 0) setTab(known);
    if (known === "story") setStoryView("documents");
    if (known === "drama") setDramaView("documents");
    if (known === "game") setGameView("docs");
    if (known === "video") setVideoView("docs");
    setSelected(path);
    if (buffers[path] !== void 0) return;
    fetchFile(sessionId, path).then((payload) => setBuffers((current) => ({ ...current, [path]: { content: payload.content, version: payload.version, saved: payload.content, dirty: false, mode: isText(path) ? "preview" : "preview" } }))).catch((cause) => setBuffers((current) => ({ ...current, [path]: { content: "", version: "", saved: "", dirty: false, mode: "source", error: cause.message } })));
  }, [buffers, sessionId]);
  const updateBuffer = (0, import_react7.useCallback)((path, patch) => {
    setBuffers((current) => {
      const buffer = current[path];
      if (buffer === void 0) return current;
      const next = { ...buffer, ...patch };
      if (patch.dismissConflict === true) {
        next.conflict = void 0;
        delete next.dismissConflict;
      }
      if (patch.content !== void 0) next.dirty = patch.content !== next.saved;
      return { ...current, [path]: next };
    });
  }, []);
  const persist = (0, import_react7.useCallback)((path) => {
    const buffer = buffers[path];
    if (buffer === void 0 || !buffer.dirty) return;
    setSaving(true);
    saveFile(sessionId, path, buffer.content, buffer.version).then((payload) => setBuffers((current) => ({ ...current, [path]: { ...current[path], version: payload.version, saved: payload.content, dirty: false, conflict: void 0, error: void 0 } }))).catch((cause) => {
      var _a2;
      if (cause.conflict === true) {
        const payload = (_a2 = cause.payload) != null ? _a2 : {};
        setBuffers((current) => {
          var _a3, _b2;
          return { ...current, [path]: { ...current[path], version: (_a3 = payload.version) != null ? _a3 : current[path].version, conflict: (_b2 = payload.error) != null ? _b2 : cause.message } };
        });
      } else {
        setBuffers((current) => ({ ...current, [path]: { ...current[path], error: cause.message } }));
      }
    }).finally(() => setSaving(false));
  }, [buffers, sessionId]);
  const reload = (0, import_react7.useCallback)((path) => {
    fetchFile(sessionId, path).then((payload) => setBuffers((current) => ({ ...current, [path]: { ...current[path], content: payload.content, saved: payload.content, version: payload.version, dirty: false, conflict: void 0, error: void 0 } }))).catch((cause) => setBuffers((current) => ({ ...current, [path]: { ...current[path], error: cause.message } })));
  }, [sessionId]);
  (0, import_react7.useEffect)(() => {
    var _a2;
    if (selected === void 0) return;
    const disk = ((_a2 = workspace == null ? void 0 : workspace.files) != null ? _a2 : []).find((file) => file.path === selected);
    const buffer = buffers[selected];
    if (!shouldAutoReload(disk, buffer)) return;
    reload(selected);
  }, [workspaceVersion, selected, buffers, reload]);
  const chooseTab = (next) => {
    setTab(next);
    setWelcomeDismissed(true);
    if (workspace !== void 0) {
      storageSet("kylin-toon:tab:" + workspace.cwd, next);
      storageSet("kylin-toon:welcome:" + workspace.cwd, true);
    }
  };
  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (workspace !== void 0) storageSet("kylin-toon:open:" + workspace.cwd, next);
  };
  const startResize = (event) => {
    var _a2, _b2;
    const scroller = target == null ? void 0 : target.parentElement;
    if (scroller === void 0 || scroller === null) return;
    event.preventDefault();
    const startX = event.clientX;
    const columns = getComputedStyle(scroller).gridTemplateColumns.split(" ").filter((part) => part !== "");
    const startWidth = Number.parseFloat((_a2 = columns[columns.length - 1]) != null ? _a2 : "430");
    const handle = event.currentTarget;
    handle.setAttribute("data-dragging", "true");
    (_b2 = handle.setPointerCapture) == null ? void 0 : _b2.call(handle, event.pointerId);
    let latest = startWidth;
    const move = (moveEvent) => {
      latest = Math.min(720, Math.max(300, startWidth - (moveEvent.clientX - startX)));
      scroller.style.setProperty("--kt-chat-width", String(latest) + "px");
    };
    const up = () => {
      handle.removeAttribute("data-dragging");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setChatWidth(Math.round(latest));
      if (workspace !== void 0) storageSet("kylin-toon:chat-width:" + workspace.cwd, Math.round(latest));
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
  };
  const changeEpisode = (directory) => {
    setDramaEpisode(directory);
    setDrama(void 0);
    if (workspace !== void 0) storageSet("kylin-toon:episode:" + workspace.cwd, directory);
  };
  const sendPrompt = props.sendPrompt;
  const sendRequest = (kind, data) => {
    var _a2, _b2, _c2, _d2, _e2;
    if (typeof sendPrompt !== "function") return;
    const episode = (_b2 = (_a2 = data == null ? void 0 : data.episode) != null ? _a2 : dramaEpisode) != null ? _b2 : "";
    const directory = (_d2 = (_c2 = data == null ? void 0 : data.id) != null ? _c2 : dramaEpisode) != null ? _d2 : "";
    const prompts = {
      toon_shot_qc: "\u5BF9 " + directory + " \u8DD1 toon_shot_qc\uFF0C\u628A\u963B\u65AD\u9879\u9010\u6761\u5217\u51FA\u6765\u5E76\u7ED9\u6211\u4FEE\u6539\u5EFA\u8BAE\uFF1B\u5148\u53EA\u62A5\u544A\uFF0C\u4E0D\u6539\u6587\u4EF6\u3002",
      toon_gate: "\u5BF9 " + directory + " \u8DD1 toon_gate\uFF0C\u544A\u8BC9\u6211\u4E0B\u4E00\u4E2A\u95F8\u95E8\u548C\u7F3A\u4EC0\u4E48\u8BC1\u636E\uFF1B\u5148\u53EA\u62A5\u544A\u3002",
      toon_assemble: "\u5BF9 " + directory + " \u5148\u68C0\u67E5\u53EF\u7528\u7247\u6BB5\uFF0C\u518D\u7ED9\u51FA\u88C5\u914D\u65B9\u6848\uFF08\u753B\u5E45\u3001\u9010\u5207\u70B9\u8F6C\u573A\u3001\u8F93\u51FA\u8DEF\u5F84\uFF09\uFF0C\u7B49\u6211\u786E\u8BA4\u540E\u518D\u8DD1 toon_assemble \u51FA\u6837\u7247\u3002",
      focus: "\u6211\u4EEC\u805A\u7126\u955C\u5934 " + ((_e2 = data == null ? void 0 : data.id) != null ? _e2 : "") + "\uFF1A\u5148\u590D\u8FF0\u5B83\u5728\u5206\u955C\u91CC\u7684\u5165\u573A/\u51FA\u573A/\u8F6C\u573A/\u65F6\u957F\uFF0C\u5E76\u6307\u51FA\u8FD9\u4E0E\u76F8\u90BB\u955C\u5934\u662F\u5426\u63A5\u5F97\u4E0A\u3002"
    };
    const text = prompts[kind];
    if (text !== void 0) sendPrompt(text);
  };
  const discussShot = (shot) => {
    var _a2;
    if (typeof sendPrompt !== "function") return;
    sendPrompt("\u8BA8\u8BBA\u955C\u5934 " + ((_a2 = shot.id) != null ? _a2 : "") + "\uFF1A\u5165\u573A\u300C" + (shot.entryState || "\u672A\u5199") + "\u300D\u3001\u51FA\u573A\u300C" + (shot.exitState || "\u672A\u5199") + "\u300D\u3001\u8F6C\u573A\u300C" + (shot.transitionOut || "cut") + "\u300D\u3001\u65F6\u957F " + String(shot.duration) + "s\u3002\u5148\u4E0D\u8981\u6539\u6587\u4EF6\uFF0C\u7ED9\u6211\u4E24\u4E2A\u80FD\u63A5\u4E0A\u4E0B\u4E00\u955C\u7684\u6539\u6CD5\u3002");
  };
  const tabs = availableTabs(workspace);
  const creative = (workspace == null ? void 0 : workspace.creative) === true;
  const showWelcome = workspace !== void 0 && !creative && workspace.welcomeGuide === true && !welcomeDismissed;
  const activeBuffer = selected === void 0 ? void 0 : buffers[selected];
  const dramaPaths = (0, import_react7.useMemo)(() => {
    var _a2, _b2, _c2, _d2;
    const set = /* @__PURE__ */ new Set();
    for (const episode of (_b2 = (_a2 = workspace == null ? void 0 : workspace.drama) == null ? void 0 : _a2.episodes) != null ? _b2 : []) {
      for (const document2 of (_c2 = episode.documents) != null ? _c2 : []) set.add(document2.path);
      for (const path of (_d2 = episode.outputs) != null ? _d2 : []) set.add(path);
    }
    return set;
  }, [workspace]);
  const currentEpisode = ((_c = (_b = workspace == null ? void 0 : workspace.drama) == null ? void 0 : _b.episodes) != null ? _c : []).find((episode) => episode.directory === dramaEpisode || episode.id === dramaEpisode);
  const currentGame = (_f = ((_d = workspace == null ? void 0 : workspace.games) != null ? _d : []).find((item) => item.id === gameId)) != null ? _f : ((_e = workspace == null ? void 0 : workspace.games) != null ? _e : [])[0];
  const activeGameProjection = selectActiveGameProjection(gameData, currentGame);
  const sendToConversation = (text) => {
    if (typeof props.sendPrompt === "function") props.sendPrompt(text);
  };
  const openGameFile = (path) => {
    void openFile(path);
  };
  const gameProjectId = currentGame == null ? void 0 : currentGame.id;
  const refreshGamePanel = () => setGamePanelTick((value) => value + 1);
  const applyGameProjection = (projection) => {
    if (projection !== void 0) setGameData((current) => current === void 0 ? current : { ...current, projection });
  };
  const handleSaveBrief = async (fields) => {
    if (gameProjectId === void 0) return void 0;
    setGameBriefSaving(true);
    setGameBriefError(void 0);
    try {
      const payload = await saveGameBrief(sessionId, gameProjectId, fields);
      setGameBrief(payload.form);
      applyGameProjection(payload.projection);
      refreshGamePanel();
      return payload;
    } catch (cause) {
      setGameBriefError(cause.message);
      return void 0;
    } finally {
      setGameBriefSaving(false);
    }
  };
  const handleApplyStage = async (stage) => {
    if (gameProjectId === void 0) return;
    try {
      const result = await applyGameStage(sessionId, gameProjectId, stage);
      applyGameProjection(result.projection);
      refreshGamePanel();
      if (result.path !== void 0) void openFile(result.path);
    } catch (cause) {
      setGamePanelError(cause.message);
    }
  };
  const handleChooseOption = async (option) => {
    if (gameProjectId === void 0) return;
    setGameChoosing(option);
    try {
      const result = await chooseGameConcept(sessionId, gameProjectId, option);
      setGameOptions((current) => current === void 0 ? current : { ...current, chosen: result.option });
      applyGameProjection(result.projection);
      refreshGamePanel();
      if (result.path !== void 0) void openFile(result.path);
    } catch (cause) {
      setGamePanelError(cause.message);
    } finally {
      setGameChoosing(void 0);
    }
  };
  const handleCreateSnapshot = async (label) => {
    if (gameProjectId === void 0) return;
    try {
      const result = await createGameSnapshot(sessionId, gameProjectId, label);
      setGameSnapshots(result.list);
      refreshGamePanel();
    } catch (cause) {
      setGamePanelError(cause.message);
    }
  };
  const handleRestoreSnapshot = async (id) => {
    if (gameProjectId === void 0) return;
    try {
      const result = await restoreGameSnapshot(sessionId, gameProjectId, id);
      setGameSnapshots(result.list);
      applyGameProjection(result.projection);
      setGameView("play");
      refreshGamePanel();
    } catch (cause) {
      setGamePanelError(cause.message);
    }
  };
  const handleDeleteSnapshot = async (id) => {
    if (gameProjectId === void 0) return;
    try {
      const result = await deleteGameSnapshot(sessionId, gameProjectId, id);
      setGameSnapshots(result.list);
      refreshGamePanel();
    } catch (cause) {
      setGamePanelError(cause.message);
    }
  };
  const handleWriteQa = async () => {
    if (gameProjectId === void 0) return;
    try {
      const result = await writeGameQaBrief(sessionId, gameProjectId, sessionId);
      setGameQa((current) => ({ ...current != null ? current : {}, plan: result.plan, isolation: result.isolation, prompt: result.prompt }));
      refreshGamePanel();
    } catch (cause) {
      setGamePanelError(cause.message);
    }
  };
  const handleRecordQa = async () => {
    if (gameProjectId === void 0) return;
    try {
      const result = await recordGameQaSession(sessionId, gameProjectId, sessionId);
      setGameQa((current) => ({ ...current != null ? current : {}, session: result.session, isolation: result.isolation }));
      applyGameProjection(result.projection);
      refreshGamePanel();
    } catch (cause) {
      setGamePanelError(cause.message);
    }
  };
  const gameMain = import_react7.default.createElement(
    "div",
    { className: "kt-game" },
    currentGame === void 0 ? null : import_react7.default.createElement(GameStageRail, {
      projection: activeGameProjection,
      activeStage: selected,
      onOpen: openGameFile,
      onPrompt: sendToConversation
    }),
    gameError === void 0 ? null : import_react7.default.createElement("div", { className: "kt-game-error" }, "\u9636\u6BB5\u6295\u5F71\u8BFB\u53D6\u5931\u8D25\uFF1A" + gameError),
    gamePanelError === void 0 ? null : import_react7.default.createElement("div", { className: "kt-game-error" }, "\u6E38\u620F\u9762\u677F\u8BFB\u53D6\u5931\u8D25\uFF1A" + gamePanelError),
    gameView === "play" ? import_react7.default.createElement(GameStudio, {
      game: currentGame,
      projection: activeGameProjection,
      snapshots: gameSnapshots,
      onOpenFile: openGameFile,
      onPrompt: sendToConversation,
      onCreateSnapshot: handleCreateSnapshot,
      onRestoreSnapshot: handleRestoreSnapshot,
      onDeleteSnapshot: handleDeleteSnapshot
    }) : gameView === "stage" ? import_react7.default.createElement(GameStageWorkbench, {
      projection: activeGameProjection,
      projectRoot: activeGameProjection == null ? void 0 : activeGameProjection.root,
      brief: gameBrief,
      options: gameOptions,
      qa: gameQa,
      savingBrief: gameBriefSaving,
      briefError: gameBriefError,
      choosing: gameChoosing,
      onSaveBrief: handleSaveBrief,
      onApplyStage: handleApplyStage,
      onChooseOption: handleChooseOption,
      onOpenFile: openGameFile,
      onPrompt: sendToConversation,
      onWriteQa: handleWriteQa,
      onRecordQa: handleRecordQa
    }) : gameView === "canvas" ? import_react7.default.createElement(GameCanvas, {
      projection: activeGameProjection,
      projectRoot: activeGameProjection == null ? void 0 : activeGameProjection.root,
      snapshots: gameSnapshots,
      qa: gameQa,
      game: currentGame,
      onOpenFile: openGameFile,
      onPrompt: sendToConversation,
      onPlay: () => setGameView("play"),
      onCreateSnapshot: handleCreateSnapshot,
      onRestoreSnapshot: handleRestoreSnapshot,
      onDeleteSnapshot: handleDeleteSnapshot,
      onWriteQaBrief: handleWriteQa,
      onRecordQa: handleRecordQa
    }) : activeBuffer === void 0 ? import_react7.default.createElement(GameDocs, { game: currentGame, projection: activeGameProjection, onOpenFile: openGameFile, onPrompt: sendToConversation }) : isText(selected) ? import_react7.default.createElement(Editor, {
      buffer: activeBuffer,
      path: selected,
      onSelectionPrompt: sendToConversation,
      conflict: activeBuffer.conflict,
      saving,
      onChange: (patch) => updateBuffer(selected, patch),
      onSave: () => persist(selected),
      onReload: () => reload(selected)
    }) : import_react7.default.createElement(MediaView, { sessionId, path: selected })
  );
  const tree = (0, import_react7.useMemo)(() => buildTree(files, (path) => pathAllowed(tab, path) || tab === "drama" && dramaPaths.has(path)), [files, tab, dramaPaths]);
  (0, import_react7.useEffect)(() => {
    var _a2, _b2;
    if (tab !== "drama" || dramaView !== "documents") return;
    if (selected !== void 0 && dramaPaths.has(selected)) return;
    const first = (_b2 = (_a2 = currentEpisode == null ? void 0 : currentEpisode.documents) == null ? void 0 : _a2[0]) == null ? void 0 : _b2.path;
    if (first !== void 0) openFile(first);
  }, [tab, dramaView, selected, currentEpisode, dramaPaths, openFile]);
  const showSurface = creative && target !== void 0;
  const tabButtons = TABS.filter((item) => tabs.includes(item.id)).map((item) => import_react7.default.createElement("button", {
    key: item.id,
    type: "button",
    role: "tab",
    "aria-selected": tab === item.id,
    className: tab === item.id ? "is-active" : "",
    onClick: () => {
      if (item.id === tab && open) {
        toggleOpen();
        return;
      }
      chooseTab(item.id);
      if (!open) setOpen(true);
    }
  }, item.label));
  const headerTabs = import_react7.default.createElement("div", { className: "kt-header-tabs kt-tabs", role: "tablist", "aria-label": "\u5DE5\u4F5C\u53F0" }, tabButtons);
  const header = import_react7.default.createElement(
    "div",
    { className: "kt-tree-head" },
    creative && tabsTarget === void 0 && fallbackTabsTarget === void 0 ? headerTabs : null,
    import_react7.default.createElement(
      "div",
      { className: "kt-tree-title" },
      import_react7.default.createElement("span", null, (_g = KIND_LABEL[tab]) != null ? _g : "\u521B\u4F5C\u53F0"),
      import_react7.default.createElement("em", null, workspace === void 0 ? "" : (_h = workspace.cwd.split("/").pop()) != null ? _h : ""),
      import_react7.default.createElement("button", { type: "button", className: "kt-collapse", onClick: toggleOpen, title: "\u6536\u8D77\u521B\u4F5C\u53F0" }, "\xD7")
    ),
    tab === "drama" ? import_react7.default.createElement(
      "div",
      { className: "kt-episode-bar" },
      import_react7.default.createElement(
        "select",
        { value: dramaEpisode != null ? dramaEpisode : "", onChange: (event) => changeEpisode(event.target.value) },
        ((_j = (_i = workspace == null ? void 0 : workspace.drama) == null ? void 0 : _i.episodes) != null ? _j : []).map((episode) => import_react7.default.createElement("option", { key: episode.directory, value: episode.directory }, episode.id))
      ),
      import_react7.default.createElement(
        "div",
        { className: "kt-subtabs" },
        import_react7.default.createElement("button", { type: "button", className: dramaView === "production" ? "is-active" : "", onClick: () => setDramaView("production") }, "\u5236\u4F5C"),
        import_react7.default.createElement("button", { type: "button", className: dramaView === "documents" ? "is-active" : "", onClick: () => setDramaView("documents") }, "\u6587\u7A3F"),
        import_react7.default.createElement("button", { type: "button", className: dramaView === "motion" ? "is-active" : "", onClick: () => setDramaView("motion") }, "Motion"),
        import_react7.default.createElement("button", { type: "button", className: dramaView === "versions" ? "is-active" : "", onClick: () => setDramaView("versions") }, "\u7248\u672C"),
        import_react7.default.createElement("button", { type: "button", className: dramaView === "composition" ? "is-active" : "", onClick: () => setDramaView("composition") }, "HTML \u5DE5\u7A0B"),
        import_react7.default.createElement("button", { type: "button", className: dramaView === "reference" ? "is-active" : "", onClick: () => setDramaView("reference") }, "\u53C2\u8003")
      )
    ) : null,
    tab === "story" ? import_react7.default.createElement(
      "div",
      { className: "kt-episode-bar" },
      import_react7.default.createElement(
        "div",
        { className: "kt-subtabs" },
        import_react7.default.createElement("button", { type: "button", className: storyView === "plan" ? "is-active" : "", onClick: () => setStoryView("plan") }, "\u521B\u4F5C"),
        import_react7.default.createElement("button", { type: "button", className: storyView === "documents" ? "is-active" : "", onClick: () => setStoryView("documents") }, "\u6587\u7A3F")
      )
    ) : null,
    tab === "game" && ((_k = workspace == null ? void 0 : workspace.games) != null ? _k : []).length > 0 ? import_react7.default.createElement(
      "div",
      { className: "kt-episode-bar" },
      import_react7.default.createElement("select", {
        value: (_l = currentGame == null ? void 0 : currentGame.id) != null ? _l : "",
        onChange: (event) => {
          const next = event.target.value;
          setGameId(next);
          setGameView("play");
          setSelected(void 0);
          switchGameProject(sessionId, next).catch(() => {
          });
        }
      }, ((_m = workspace == null ? void 0 : workspace.games) != null ? _m : []).map((item) => import_react7.default.createElement("option", { key: item.id, value: item.id }, item.title + "\uFF08" + item.id + "\uFF09"))),
      import_react7.default.createElement(
        "div",
        { className: "kt-subtabs" },
        import_react7.default.createElement("button", { type: "button", className: gameView === "play" ? "is-active" : "", onClick: () => setGameView("play") }, "\u8BD5\u73A9"),
        import_react7.default.createElement("button", { type: "button", className: gameView === "stage" ? "is-active" : "", onClick: () => setGameView("stage") }, "\u9636\u6BB5"),
        import_react7.default.createElement("button", { type: "button", className: gameView === "docs" ? "is-active" : "", onClick: () => setGameView("docs") }, "\u6587\u7A3F"),
        import_react7.default.createElement("button", { type: "button", className: gameView === "canvas" ? "is-active" : "", onClick: () => setGameView("canvas") }, "\u753B\u5E03")
      )
    ) : null
  );
  const main = !creative ? import_react7.default.createElement(SetupCard, { tab, onSend: (text) => {
    if (typeof props.sendPrompt === "function") props.sendPrompt(text);
    else setOpen(true);
  } }) : tab === "story" && storyView === "plan" ? import_react7.default.createElement(NovelView, {
    data: novelData,
    loading: novelLoading,
    error: novelError,
    sessionId,
    onOpenFile: (path) => {
      void openFile(path);
    },
    onPrompt: (text) => {
      if (typeof props.sendPrompt === "function") props.sendPrompt(text);
    },
    onRefresh: () => {
      setNovelData(void 0);
      setNovelTick((value) => value + 1);
    }
  }) : tab === "drama" && dramaView === "composition" ? import_react7.default.createElement(CompositionView, {
    data: dramaComposition,
    loading: dramaCompositionLoading,
    error: dramaCompositionError,
    episode: dramaEpisode,
    openBrowser: props.openBrowser,
    onRefresh: () => setDramaCompositionTick((value) => value + 1),
    onScaffold: (options) => scaffoldComposition(sessionId, dramaEpisode, options),
    onStudio: () => startCompositionStudio(sessionId, dramaEpisode),
    onStop: () => stopCompositionStudio(sessionId, dramaEpisode),
    onRender: () => renderComposition(sessionId, dramaEpisode),
    onRepair: () => repairComposition(sessionId, dramaEpisode),
    templates: dramaTemplates,
    templatesError: dramaTemplatesError,
    onCreateTemplate: (name2) => createDramaTemplate(sessionId, dramaEpisode, name2),
    onApplyTemplate: (id) => applyDramaTemplate(sessionId, dramaEpisode, id),
    onRefreshTemplates: () => setDramaTemplatesTick((value) => value + 1)
  }) : tab === "drama" && dramaView === "versions" ? import_react7.default.createElement(VersionsView, {
    data: dramaVersions,
    loading: dramaVersionsLoading,
    error: dramaVersionsError,
    episode: dramaEpisode,
    onCreate: (summary) => {
      createDramaVersion(sessionId, dramaEpisode, summary).then(() => {
        setDramaVersionsTick((value) => value + 1);
        setDramaVersionsError(void 0);
      }).catch((cause) => setDramaVersionsError(cause.message));
    },
    onRestore: (id) => {
      restoreDramaVersion(sessionId, dramaEpisode, id).then(() => {
        setDramaVersionsTick((value) => value + 1);
        setDramaVersionsError(void 0);
      }).catch((cause) => setDramaVersionsError(cause.message));
    },
    onRefresh: () => setDramaVersionsTick((value) => value + 1)
  }) : tab === "drama" && dramaView === "motion" ? import_react7.default.createElement(MotionView, {
    data: dramaMotion,
    loading: dramaMotionLoading,
    error: dramaMotionError,
    episode: dramaEpisode,
    onOpenFile: (path) => {
      void openFile(path);
    },
    onPrompt: (text) => {
      if (typeof props.sendPrompt === "function") props.sendPrompt(text);
    },
    onRefresh: () => setDramaMotionTick((value) => value + 1),
    onApply: () => {
      applyDramaMotion(sessionId, dramaEpisode).then(() => {
        setDramaMotionTick((value) => value + 1);
        setDramaMotionError(void 0);
      }).catch((cause) => setDramaMotionError(cause.message));
    }
  }) : tab === "drama" && dramaView === "reference" ? import_react7.default.createElement(ReferenceView, {
    data: referenceData,
    loading: referenceLoading,
    error: referenceError,
    sessionId,
    onPrompt: (text) => {
      if (typeof props.sendPrompt === "function") props.sendPrompt(text);
    },
    onRefresh: () => {
      setReferenceData(void 0);
      setReferenceTick((value) => value + 1);
    }
  }) : tab === "drama" && dramaView === "production" ? import_react7.default.createElement(DramaProduction, {
    data: drama,
    loading: dramaLoading,
    error: dramaError,
    sessionId,
    onDiscuss: discussShot,
    onRequest: sendRequest,
    onOpenFile: (path) => {
      void openFile(path);
    },
    onRefresh: () => {
      lastDramaVersion.current = "";
      setDramaEpisode((current) => current);
    }
  }) : tab === "game" ? gameMain : tab === "video" && videoView === "preview" ? import_react7.default.createElement(VideoStudio, { workspace, sessionId, projectId: videoId, setProjectId: setVideoId, view: videoView, setView: setVideoView, openFile }) : activeBuffer === void 0 ? import_react7.default.createElement("div", { className: "kt-empty" }, selected === void 0 ? "\u4ECE\u5DE6\u4FA7\u9009\u4E00\u4E2A\u6587\u4EF6\u5F00\u59CB\u3002" : "\u6B63\u5728\u8BFB\u53D6\u2026") : isText(selected) ? import_react7.default.createElement(Editor, {
    buffer: activeBuffer,
    path: selected,
    onSelectionPrompt: sendToConversation,
    conflict: activeBuffer.conflict,
    saving,
    onChange: (patch) => updateBuffer(selected, patch),
    onSave: () => persist(selected),
    onReload: () => reload(selected)
  }) : import_react7.default.createElement(MediaView, { sessionId, path: selected });
  const mode = tab === "game" || tab === "video" ? tab : "split";
  return import_react7.default.createElement(
    import_react7.default.Fragment,
    null,
    import_react7.default.createElement("span", { ref: marker, className: "kt-bridge-marker", "aria-hidden": true }),
    creative && tabsTarget !== void 0 && workspace !== void 0 ? (0, import_react_dom.createPortal)(headerTabs, tabsTarget) : creative && fallbackTabsTarget !== void 0 && workspace !== void 0 ? (0, import_react_dom.createPortal)(headerTabs, fallbackTabsTarget) : null,
    showSurface ? (0, import_react_dom.createPortal)(import_react7.default.createElement(
      "div",
      { className: "kt-surface", "data-open": open ? "true" : "false", "data-mode": mode },
      open ? import_react7.default.createElement(
        import_react7.default.Fragment,
        null,
        import_react7.default.createElement(
          "aside",
          { className: "kt-tree" },
          header,
          import_react7.default.createElement(FileTree, { tree, depth: 0, selected, onSelect: openFile }),
          import_react7.default.createElement(
            "div",
            { className: "kt-foot" },
            workspace === void 0 ? "\u8BFB\u53D6\u5DE5\u4F5C\u533A\u2026" : creative ? "\u5DE5\u4F5C\u533A\uFF1A" + workspace.cwd.split("/").pop() : "\u8FD8\u6CA1\u6709\u521B\u4F5C\u6587\u4EF6",
            error === void 0 ? null : import_react7.default.createElement("span", { className: "kt-foot-error" }, error)
          )
        ),
        import_react7.default.createElement(
          "main",
          { className: "kt-main" },
          main,
          import_react7.default.createElement("div", { className: "kt-resizer", onPointerDown: startResize, role: "separator", "aria-orientation": "vertical", title: "\u62D6\u52A8\u8C03\u6574\u804A\u5929\u533A\u5BBD\u5EA6" })
        ),
        intents.length > 0 ? import_react7.default.createElement(
          "section",
          { className: "kt-jobs", "aria-label": "\u5236\u4F5C\u4EFB\u52A1" },
          import_react7.default.createElement("strong", null, "\u5236\u4F5C\u6295\u5F71"),
          intents.slice(-4).map((intent) => import_react7.default.createElement("span", { key: String(intent.id) }, intent.action + (intent.episode === void 0 ? "" : " \xB7 " + intent.episode) + (intent.jobId === void 0 ? "" : " \xB7 " + intent.jobId)))
        ) : null
      ) : null,
      showWelcome ? import_react7.default.createElement(WelcomeCard, { onDismiss: () => {
        setWelcomeDismissed(true);
        if (workspace !== void 0) storageSet("kylin-toon:welcome:" + workspace.cwd, true);
      } }) : null
    ), target) : null
  );
}

// client/src/styles.css
var styles_default = '/* KToon \u521B\u4F5C\u53F0\uFF1A\u6CBF\u7528\u5BBF\u4E3B\u4E3B\u9898\u53D8\u91CF\uFF0C\u53EA\u5728\u539F\u751F\u4F1A\u8BDD\u5217\u65C1\u8FB9\u52A0\u4E24\u680F\uFF0C\u4E0D\u8986\u76D6 Chat \u7EC4\u4EF6\u3002 */\n.kt-bridge-marker { display: none; }\n.kt-surface { display: contents; font-family: var(--dsw-font-family, system-ui, -apple-system, "PingFang SC", sans-serif); }\n\n/* \u4F1A\u8BDD\u6EDA\u52A8\u5BBF\u4E3B\u53D8\u4E09\u680F\uFF1A\u6587\u4EF6\u6811 / \u4F5C\u54C1 / \u539F\u751F Chat\u3002 */\n[data-conversation-scroll]:has(> [data-slot="conversation.session"] > .kt-surface[data-open="true"]) {\n  --kt-border: var(--dsw-alias-border-l2, rgba(128,128,128,.24));\n  --kt-muted: var(--dsw-alias-label-secondary, #8a8a8a);\n  --kt-primary: var(--dsw-alias-label-primary, #1d1d1f);\n  --kt-hover: var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,.1));\n  --kt-accent: var(--dsw-alias-state-business-primary, #4f7cff);\n  display: grid;\n  grid-template-columns: clamp(180px, 15%, 230px) minmax(240px, 1fr) clamp(320px, var(--kt-chat-width, 430px), 720px);\n  grid-template-rows: minmax(0, 1fr);\n  min-height: 0;\n  overflow-x: hidden;\n  overflow-y: auto;\n  position: relative;\n  scrollbar-gutter: stable;\n  scroll-padding-bottom: calc(max(var(--dsh-composer-height, 152px), var(--kt-composer-height, 0px)) + 16px);\n}\n\n/* \u539F\u751F\u4F1A\u8BDD\u4ECD\u662F\u8FD9\u4E00\u5217\u7684\u552F\u4E00 scroller \u7684\u6D88\u8D39\u8005\uFF1A\u4E0D\u53E6\u52A0 overflow\uFF0C\u5426\u5219\u5B83\u7684\u81EA\u52A8\u8D34\u5E95\u4F1A\u5931\u6548\u3002 */\n[data-conversation-scroll]:has(> [data-slot="conversation.session"] > .kt-surface[data-open="true"])\n  > [data-slot="conversation.session"] > :not(.kt-surface) {\n  grid-column: 3;\n  grid-row: 1;\n  min-width: 0;\n  min-height: 100%;\n  border-left: 1px solid var(--kt-border);\n}\n\n/* \u7ED9\u6700\u540E\u4E00\u884C\u548C\u4EFB\u52A1\u9762\u677F\u7559\u51FA Composer \u7684\u9AD8\u5EA6\uFF0C\u907F\u514D\u88AB\u6D6E\u5C42\u538B\u4F4F\u3002 */\n[data-conversation-scroll]:has(> [data-slot="conversation.session"] > .kt-surface[data-open="true"])\n  [data-chat-flow]:not([data-step-process-content]) {\n  padding-bottom: calc(max(var(--dsh-composer-height, 152px), var(--kt-composer-height, 0px)) + 40px);\n}\n\n[data-conversation-scroll]:has(> [data-slot="conversation.session"] > .kt-surface[data-open="true"])\n  > [data-composer-seat] {\n  grid-column: 3;\n  background: var(--dsw-alias-bg-base, #fff);\n  z-index: 40;\n  grid-row: 1;\n  min-width: 0;\n  width: 100%;\n  align-self: start;\n  position: sticky;\n  top: calc(var(--kt-scroll-height, 720px) - max(var(--dsh-composer-height, 152px), var(--kt-composer-height, 0px)));\n  bottom: auto;\n}\n\n.kt-tree {\n  box-sizing: border-box;\n  display: flex;\n  grid-column: 1;\n  grid-row: 1;\n  position: sticky;\n  z-index: 9;\n  top: 0;\n  align-self: start;\n  height: 100%;\n  min-width: 0;\n  min-height: 0;\n  flex-direction: column;\n  overflow: hidden;\n  border-right: 1px solid var(--kt-border);\n  background: var(--dsw-alias-bg-base, #fff);\n  color: var(--kt-primary);\n}\n.kt-main {\n  box-sizing: border-box;\n  position: sticky;\n  z-index: 9;\n  top: 0;\n  align-self: start;\n  height: 100%;\n  display: flex;\n  grid-column: 2;\n  grid-row: 1;\n  min-width: 0;\n  min-height: 0;\n  flex-direction: column;\n  overflow: hidden;\n  background: var(--dsw-alias-bg-base, #fff);\n}\n.kt-tree-head { display: grid; gap: 6px; padding: 8px 8px 8px; border-bottom: 1px solid var(--kt-border); }\n.kt-tree-title { display: flex; align-items: baseline; justify-content: space-between; gap: 6px; padding: 0 2px; }\n.kt-tree-title span { font-size: 12px; font-weight: 600; }\n.kt-tree-title em { min-width: 0; flex: 1; overflow: hidden; color: var(--kt-muted); font-size: 11px; font-style: normal; text-align: right; text-overflow: ellipsis; white-space: nowrap; }\n.kt-tree-title .kt-collapse { width: 20px; height: 20px; flex: none; border: 0; border-radius: 4px; background: transparent; color: var(--kt-muted); cursor: pointer; font-size: 13px; line-height: 1; }\n.kt-tree-title .kt-collapse:hover { background: var(--kt-hover); color: var(--kt-primary); }\n.kt-brand { display: flex; align-items: center; justify-content: space-between; gap: 8px; }\n.kt-brand strong { font-size: 13px; letter-spacing: .04em; }\n.kt-brand strong::after { content: " \u521B\u4F5C\u53F0"; font-weight: 400; color: var(--kt-muted); font-size: 11px; letter-spacing: 0; }\n.kt-collapse { width: 24px; height: 24px; border: 1px solid var(--kt-border); border-radius: 6px; background: transparent; color: var(--kt-muted); cursor: pointer; font-size: 14px; line-height: 1; }\n.kt-collapse:hover { background: var(--kt-hover); color: var(--kt-primary); }\n/* \u5F15\u64CE View \u9875\u7B7E\u884C\u7684\u540C\u6392\u9875\u7B7E\uFF1A\u590D\u7528\u539F\u751F\u9875\u7B7E\u7684\u5C3A\u5BF8\u4E0E\u9009\u4E2D\u4E0B\u5212\u7EBF\uFF0C\u7EDD\u4E0D\u6362\u884C\u3002 */\n.kt-tabs-holder { display: contents; }\n.kt-header-tabs {\n  display: flex; flex: 1 1 auto; min-width: 0; align-items: flex-start;\n  position: relative; z-index: 10;\n  /* \u4E0E\u539F\u751F View \u9875\u7B7E\u7684 32px \u95F4\u8DDD\u4E00\u81F4\uFF1A\u7EC4\u5185 32\uFF0C\u7EC4\u95F4\u8865\u8DB3 32\uFF08\u9875\u7B7E\u884C\u81EA\u8EAB gap \u662F 24\uFF09\u3002 */\n  gap: 32px; margin-left: 8px;\n  overflow: hidden; white-space: nowrap;\n}\n.kt-header-tabs.kt-tabs { flex-wrap: nowrap; }\n.kt-header-tabs button {\n  position: relative; flex: none; min-height: 25px;\n  padding: 0 0 calc(var(--qilin-space-2, 6px) + 1px);\n  border: 0; background: none; cursor: pointer;\n  color: var(--qilin-alias-label-tertiary, var(--dsw-alias-label-secondary, #8a8a8a));\n  font: 500 var(--qilin-text-base, 14px)/16px var(--dsw-font-family, system-ui, sans-serif);\n}\n.kt-header-tabs button:hover { color: var(--qilin-alias-label-primary, var(--dsw-alias-label-primary, #1d1d1f)); }\n.kt-header-tabs button.is-active { color: var(--qilin-alias-label-primary, var(--dsw-alias-label-primary, #1d1d1f)); }\n.kt-header-tabs button.is-active::after {\n  content: ""; position: absolute; left: 0; right: 0; bottom: 2px; height: 2px; border-radius: 1px;\n  background: var(--qilin-alias-state-business-primary, var(--dsw-alias-state-business-primary, #4f7cff));\n}\n/* \u5DE6\u4FA7\u6587\u4EF6\u6811\u5934\u91CC\u7684\u9875\u7B7E\uFF08\u5F15\u64CE\u6CA1\u6709 View \u9875\u7B7E\u884C\u65F6\u7684\u515C\u5E95\uFF09 */\n.kt-tree-head .kt-header-tabs { flex-wrap: wrap; gap: 3px; margin: 0; overflow: visible; }\n.kt-tree-head .kt-header-tabs button {\n  padding: 2px 6px; border: 1px solid transparent; border-radius: 6px;\n  color: var(--kt-muted); font-size: 12px; line-height: 1.3;\n}\n.kt-tree-head .kt-header-tabs button.is-active { border-color: var(--kt-border); background: var(--kt-hover); color: var(--kt-primary); }\n.kt-tree-head .kt-header-tabs button.is-active::after { display: none; }\n.kt-tree-head .kt-tabs button, .kt-subtabs button {\n  min-height: 26px; border: 1px solid transparent; border-radius: 6px; padding: 3px 6px;\n  background: transparent; color: var(--kt-muted); cursor: pointer;\n  font: 12px/1.3 var(--dsw-font-family, sans-serif); white-space: nowrap;\n}\n.kt-tree-head .kt-tabs button:hover, .kt-subtabs button:hover { background: var(--kt-hover); color: var(--kt-primary); }\n.kt-tree-head .kt-tabs button.is-active, .kt-subtabs button.is-active { border-color: var(--kt-border); background: var(--kt-hover); color: var(--kt-primary); font-weight: 600; }\n.kt-episode-bar { display: grid; gap: 4px; }\n.kt-episode-bar select, .kt-studio-bar select {\n  min-height: 26px; border: 1px solid var(--kt-border); border-radius: 6px;\n  background: var(--dsw-alias-bg-base, #fff); color: var(--kt-primary);\n  padding: 2px 6px; font: 12px/1.3 var(--dsw-font-family, sans-serif);\n}\n.kt-subtabs { display: flex; gap: 3px; }\n\n.kt-tree-scroll { flex: 1; min-height: 0; overflow: auto; padding: 6px 6px 14px; }\n.kt-tree-group { display: grid; }\n.kt-folder > summary { cursor: pointer; padding: 3px 0 3px 6px; color: var(--kt-muted); font-size: 12px; border-radius: 4px; user-select: none; }\n.kt-folder > summary:hover { background: var(--kt-hover); color: var(--kt-primary); }\n.kt-file {\n  display: block; width: 100%; border: 0; border-radius: 4px; padding: 3px 6px;\n  background: transparent; color: var(--kt-primary); text-align: left; cursor: pointer;\n  font: 12px/1.45 var(--dsw-font-family, sans-serif);\n  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;\n}\n.kt-file:hover { background: var(--kt-hover); }\n.kt-file.is-selected { background: var(--kt-accent); color: #fff; }\n.kt-foot { display: grid; gap: 2px; border-top: 1px solid var(--kt-border); padding: 7px 9px; color: var(--kt-muted); font-size: 11px; }\n.kt-foot-error { color: var(--dsw-alias-state-error-primary, #c0392b); }\n\n.kt-editor { display: flex; flex: 1; min-height: 0; flex-direction: column; }\n.kt-editor-bar { display: flex; align-items: center; justify-content: space-between; gap: 8px; border-bottom: 1px solid var(--kt-border); padding: 6px 10px; }\n.kt-editor-tabs { display: flex; gap: 4px; }\n.kt-editor-tabs button { border: 1px solid transparent; border-radius: 5px; padding: 2px 9px; background: transparent; color: var(--kt-muted); cursor: pointer; font: 12px/1.4 var(--dsw-font-family, sans-serif); }\n.kt-editor-tabs button.is-active { border-color: var(--kt-border); background: var(--kt-hover); color: var(--kt-primary); }\n.kt-editor-actions { display: flex; align-items: center; gap: 6px; }\n.kt-dirty { color: var(--kt-muted); font-size: 11px; }\n.kt-save, .kt-reload {\n  min-height: 24px; border: 1px solid var(--kt-border); border-radius: 5px; padding: 2px 10px;\n  background: var(--kt-accent); color: #fff; cursor: pointer; font: 12px/1.3 var(--dsw-font-family, sans-serif);\n}\n.kt-save:disabled { opacity: .45; cursor: default; }\n.kt-reload { background: transparent; color: var(--kt-primary); }\n.kt-source {\n  flex: 1; box-sizing: border-box; width: 100%; min-height: 0; resize: none; border: 0; outline: none;\n  padding: 20px clamp(16px, 4vw, 44px) 60px; background: transparent; color: var(--kt-primary);\n  font: 13px/1.8 ui-monospace, SFMono-Regular, Menlo, monospace; tab-size: 2;\n}\n.kt-markdown { flex: 1; min-height: 0; overflow: auto; padding: 20px clamp(16px, 4vw, 48px) 72px; color: var(--kt-primary); font-size: 14px; line-height: 1.78; }\n.kt-markdown h1 { font-size: 22px; margin: 18px 0 10px; line-height: 1.3; }\n.kt-markdown h2 { font-size: 18px; margin: 22px 0 9px; line-height: 1.35; }\n.kt-markdown h3 { font-size: 15px; margin: 18px 0 7px; }\n.kt-markdown h4 { font-size: 14px; margin: 14px 0 6px; color: var(--kt-muted); }\n.kt-markdown p { margin: 0 0 10px; overflow-wrap: anywhere; }\n.kt-markdown ul, .kt-markdown ol { margin: 0 0 12px; padding-left: 22px; }\n.kt-markdown li { margin: 2px 0; }\n.kt-markdown code { padding: 1px 5px; border-radius: 4px; background: var(--dsw-alias-markdown-inline-code, rgba(128,128,128,.16)); font: 12px/1.5 ui-monospace, Menlo, monospace; }\n.kt-markdown pre { overflow: auto; border: 1px solid var(--kt-border); border-radius: 8px; padding: 12px 14px; background: var(--dsw-alias-bg-layer-1, rgba(128,128,128,.06)); }\n.kt-markdown pre code { padding: 0; background: transparent; font-size: 12px; line-height: 1.7; }\n.kt-markdown blockquote { margin: 10px 0; border-left: 3px solid var(--kt-border); padding: 2px 0 2px 12px; color: var(--kt-muted); }\n.kt-markdown table { border-collapse: collapse; margin: 8px 0 14px; font-size: 13px; }\n.kt-markdown th, .kt-markdown td { border: 1px solid var(--kt-border); padding: 4px 8px; text-align: left; }\n.kt-markdown a { color: var(--kt-accent); }\n.kt-markdown hr { border: 0; border-top: 1px solid var(--kt-border); margin: 18px 0; }\n\n.kt-media { max-width: 100%; max-height: 100%; object-fit: contain; margin: auto; }\n.kt-media-audio { width: min(520px, 90%); margin: auto; }\n.kt-empty { display: grid; place-items: center; min-height: 160px; padding: 28px; color: var(--kt-muted); font-size: 13px; line-height: 1.7; text-align: center; }\n.kt-error { padding: 20px; color: var(--dsw-alias-state-error-primary, #c0392b); font-size: 13px; }\n.kt-setup { display: grid; align-content: center; justify-items: start; gap: 10px; max-width: 520px; margin: 0 auto; padding: 40px 24px; }\n.kt-setup h3 { margin: 0; font-size: 17px; }\n.kt-setup p { margin: 0; color: var(--dsw-alias-label-secondary, #8a8a8a); font-size: 13px; line-height: 1.7; }\n.kt-setup code { border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.3)); border-radius: 6px; padding: 6px 9px; background: var(--dsw-alias-bg-layer-1, rgba(128,128,128,.06)); font: 12px/1.6 ui-monospace, Menlo, monospace; }\n.kt-setup button { border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.3)); border-radius: 999px; padding: 4px 14px; background: var(--dsw-alias-state-business-primary, #4f7cff); color: #fff; cursor: pointer; font: 12px/1.5 var(--dsw-font-family, sans-serif); }\n.kt-muted { color: var(--dsw-alias-label-secondary, #8a8a8a); }\n\n.kt-drama { display: flex; flex: 1; min-height: 0; flex-direction: column; overflow: auto; padding: 12px 14px 40px; gap: 10px; }\n.kt-drama-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }\n.kt-drama-head > div:first-child { display: grid; gap: 2px; }\n.kt-drama-head strong { font-size: 15px; }\n.kt-drama-head span { color: var(--kt-muted); font-size: 12px; }\n.kt-drama-actions { display: flex; flex-wrap: wrap; gap: 6px; }\n.kt-drama-actions button, .kt-shot footer button {\n  border: 1px solid var(--kt-border); border-radius: 6px; padding: 4px 10px;\n  background: transparent; color: var(--kt-primary); cursor: pointer;\n  font: 12px/1.3 var(--dsw-font-family, sans-serif);\n}\n.kt-drama-actions button:hover, .kt-shot footer button:hover { background: var(--kt-hover); }\n.kt-gates { display: flex; flex-wrap: wrap; gap: 4px; }\n.kt-gate { border: 1px solid var(--kt-border); border-radius: 999px; padding: 2px 9px; font-size: 11px; color: var(--kt-muted); }\n.kt-gate--pass { border-color: rgba(46,160,67,.5); color: #2ea043; }\n.kt-gate--blocked { border-color: rgba(192,57,43,.5); color: #c0392b; }\n.kt-shot-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 8px; }\n.kt-shot { display: flex; flex-direction: column; gap: 6px; border: 1px solid var(--kt-border); border-radius: 9px; padding: 9px 10px; background: var(--dsw-alias-bg-layer-1, rgba(128,128,128,.04)); cursor: pointer; }\n.kt-shot:hover { border-color: var(--kt-accent); }\n.kt-shot header { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }\n.kt-shot header strong { font-size: 13px; }\n.kt-shot header span { color: var(--kt-muted); font-size: 11px; }\n.kt-shot dl { display: grid; grid-template-columns: 34px 1fr; gap: 2px 6px; margin: 0; font-size: 11px; line-height: 1.5; }\n.kt-shot dt { color: var(--kt-muted); }\n.kt-shot dd { margin: 0; overflow-wrap: anywhere; }\n.kt-shot-image { width: 100%; aspect-ratio: 16/9; object-fit: cover; border-radius: 6px; background: rgba(0,0,0,.06); }\n.kt-shot footer { margin-top: auto; }\n.kt-diagnostics { border-top: 1px solid var(--kt-border); padding-top: 10px; display: grid; gap: 3px; }\n.kt-diagnostics h3 { margin: 0 0 4px; font-size: 13px; }\n.kt-diagnostics p { margin: 0; font-size: 12px; line-height: 1.6; }\n.kt-blocker { color: var(--dsw-alias-state-error-primary, #c0392b); }\n.kt-warning { color: var(--dsw-alias-state-warning-primary, #b7791f); }\n.kt-ok { color: #2ea043; }\n\n.kt-studio { display: flex; flex: 1; min-height: 0; flex-direction: column; gap: 8px; padding: 10px 12px 16px; }\n.kt-studio-bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }\n.kt-studio-tabs { padding: 0 12px 6px; }\n.kt-game-frame { flex: 1; width: 100%; min-height: 320px; border: 1px solid var(--kt-border); border-radius: 8px; background: #0d100e; }\n.kt-doc-list { display: grid; align-content: start; gap: 3px; overflow: auto; padding: 4px 2px; }\n.kt-doc-list button { border: 1px solid transparent; border-radius: 6px; padding: 5px 8px; background: transparent; color: var(--kt-primary); text-align: left; cursor: pointer; font: 12px/1.5 var(--dsw-font-family, sans-serif); }\n.kt-doc-list button:hover { background: var(--kt-hover); }\n\n/* \u4E92\u52A8\u6E38\u620F\uFF1A\u9636\u6BB5\u8F68\u3001\u4E0B\u4E00\u6B65\u5361\u3001\u6587\u7A3F\u5206\u7EC4\u4E0E\u7A7A\u6001\u3002 */\n.kt-game { display: flex; flex: 1; min-height: 0; flex-direction: column; }\n.kt-game-stages {\n  display: flex; flex: none; gap: 6px; overflow-x: auto;\n  padding: 8px 12px 6px; border-bottom: 1px solid var(--kt-border);\n  scrollbar-width: thin;\n}\n.kt-game-stages.is-empty { color: var(--kt-muted); font-size: 12px; padding: 10px 12px; }\n.kt-game-stage {\n  display: inline-flex; flex: none; align-items: center; gap: 5px;\n  border: 1px solid var(--kt-border); border-radius: 999px; background: transparent;\n  color: var(--kt-muted); padding: 4px 9px;\n  font: 11px/1.4 var(--dsw-font-family, sans-serif); cursor: pointer;\n}\n.kt-game-stage:hover { background: var(--kt-hover); color: var(--kt-primary); }\n.kt-game-stage.is-done { color: var(--kt-primary); border-color: var(--kt-accent); }\n.kt-game-stage.is-partial { color: var(--kt-primary); border-style: dashed; }\n.kt-game-stage.is-skipped { opacity: .45; text-decoration: line-through; }\n.kt-game-stage.is-optional { border-style: dotted; }\n.kt-game-stage.is-next { background: var(--kt-hover); box-shadow: inset 0 0 0 1px var(--kt-accent); color: var(--kt-primary); font-weight: 600; }\n.kt-game-stage.is-active { background: var(--kt-hover); }\n.kt-game-stage-dot { font-size: 10px; }\n.kt-game-play, .kt-game-docs {\n  display: flex; flex: 1; min-height: 0; flex-direction: column;\n  gap: 8px; padding: 8px 12px 14px; overflow: auto;\n}\n.kt-game-frame-bar { display: flex; align-items: center; justify-content: space-between; gap: 8px; color: var(--kt-muted); font-size: 11px; }\n.kt-game-frame-bar button, .kt-game-next-actions button, .kt-game-empty-actions button {\n  border: 1px solid var(--kt-border); border-radius: 6px; background: transparent;\n  color: var(--kt-primary); padding: 4px 9px; font-size: 11px; cursor: pointer;\n}\n.kt-game-frame-bar button:hover, .kt-game-next-actions button:hover, .kt-game-empty-actions button:hover { background: var(--kt-hover); }\n.kt-game-frame { flex: 1; width: 100%; min-height: 320px; border: 1px solid var(--kt-border); border-radius: 8px; background: #0d100e; }\n.kt-game-next {\n  flex: none; border: 1px solid var(--kt-border); border-left: 2px solid var(--kt-accent);\n  border-radius: 8px; padding: 8px 10px; background: var(--kt-hover);\n}\n.kt-game-next strong { display: block; margin-bottom: 2px; font-size: 12px; }\n.kt-game-next p { margin: 0 0 6px; color: var(--kt-muted); font-size: 11px; line-height: 1.6; }\n.kt-game-next-actions { display: flex; gap: 6px; flex-wrap: wrap; }\n.kt-game-docs-group { display: grid; gap: 3px; }\n.kt-game-docs-group h4 { margin: 4px 0 2px; color: var(--kt-muted); font-size: 11px; font-weight: 600; }\n.kt-game-docs-group button {\n  display: flex; align-items: baseline; gap: 8px; border: 1px solid transparent; border-radius: 6px;\n  background: transparent; color: var(--kt-primary); text-align: left; padding: 5px 8px;\n  font: 12px/1.5 var(--dsw-font-family, sans-serif); cursor: pointer;\n}\n.kt-game-docs-group button:hover { background: var(--kt-hover); }\n.kt-game-docs-group em { min-width: 0; overflow: hidden; color: var(--kt-muted); font-size: 10px; font-style: normal; text-overflow: ellipsis; white-space: nowrap; }\n.kt-game-empty { display: grid; gap: 8px; align-content: start; padding: 18px 16px; }\n.kt-game-empty h3 { margin: 0; font-size: 13px; }\n.kt-game-empty p { margin: 0; color: var(--kt-muted); font-size: 12px; line-height: 1.7; }\n.kt-game-empty code { display: block; padding: 6px 8px; border: 1px solid var(--kt-border); border-radius: 6px; color: var(--kt-primary); font-size: 11px; overflow-x: auto; }\n.kt-game-empty-actions { display: flex; gap: 6px; flex-wrap: wrap; }\n.kt-game-error { margin: 8px 12px 0; color: #b3261e; font-size: 12px; }\n.kt-player { display: flex; flex: 1; min-height: 0; flex-direction: column; gap: 8px; }\n.kt-source-tabs { display: flex; gap: 4px; }\n.kt-source-tabs button { border: 1px solid var(--kt-border); border-radius: 999px; padding: 2px 10px; background: transparent; color: var(--kt-muted); cursor: pointer; font: 11px/1.4 var(--dsw-font-family, sans-serif); }\n.kt-source-tabs button.is-active { color: var(--kt-primary); background: var(--kt-hover); }\n.kt-player-video { width: 100%; max-height: calc(100vh - 220px); border-radius: 8px; background: #000; }\n.kt-player-path { margin: 0; color: var(--kt-muted); font-size: 11px; overflow-wrap: anywhere; }\n\n.kt-jobs { grid-column: 1 / span 2; grid-row: 2; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; border-top: 1px solid var(--kt-border); padding: 4px 10px; color: var(--kt-muted); font-size: 11px; background: var(--dsw-alias-bg-base, #fff); }\n.kt-jobs strong { color: var(--kt-primary); font-weight: 600; }\n.kt-jobs span { border: 1px solid var(--kt-border); border-radius: 999px; padding: 1px 8px; }\n\n.kt-launcher {\n  position: fixed; right: 18px; bottom: 18px; z-index: 9;\n  display: flex; align-items: center; gap: 6px;\n  border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.3)); border-radius: 999px;\n  padding: 5px 12px; background: var(--dsw-alias-bg-base, #fff); color: var(--dsw-alias-label-secondary, #666);\n  cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,.12);\n  font: 12px/1.4 var(--dsw-font-family, sans-serif);\n}\n.kt-launcher b { color: var(--dsw-alias-label-primary, #1d1d1f); font-weight: 600; }\n.kt-launcher:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,.1)); }\n\n.kt-welcome {\n  box-sizing: border-box; order: -1; flex: none; width: min(640px, calc(100% - 32px));\n  margin: 24px auto; padding: 20px 24px; border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.3));\n  border-radius: 12px; background: var(--dsw-alias-bg-base, #fff); color: var(--dsw-alias-label-primary, #1d1d1f);\n  font: 14px/1.75 var(--dsw-font-family, sans-serif);\n}\n.kt-welcome h2 { margin: 0 0 8px; font-size: 19px; }\n.kt-welcome ol { margin: 8px 0 10px; padding-left: 22px; }\n.kt-welcome-note { color: var(--dsw-alias-label-secondary, #666); font-size: 12px; }\n.kt-welcome-dismiss { margin-top: 6px; border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.3)); border-radius: 999px; padding: 3px 12px; background: transparent; color: inherit; cursor: pointer; font: 12px/1.4 var(--dsw-font-family, sans-serif); }\n.kt-welcome-dismiss:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,.1)); }\n\n@media (max-width: 1180px) {\n  [data-conversation-scroll]:has(> [data-slot="conversation.session"] > .kt-surface[data-open="true"]) {\n    grid-template-columns: clamp(176px, 20%, 210px) minmax(260px, 1fr) clamp(340px, 36%, 440px);\n  }\n}\n@media (max-width: 900px) {\n  [data-conversation-scroll]:has(> [data-slot="conversation.session"] > .kt-surface[data-open="true"]) {\n    grid-template-columns: 160px minmax(220px, 1fr) minmax(300px, 40%);\n  }\n}\n/* \u53F3\u680F\u62D6\u62FD\uFF1A\u62D6\u52A8\u5206\u754C\u7EBF\u8C03\u6574\u804A\u5929\u5217\u5BBD\uFF0C\u5BBD\u5EA6\u6309\u5DE5\u4F5C\u533A\u8BB0\u4F4F\u3002 */\n.kt-resizer {\n  position: absolute; z-index: 12; top: 0; right: 0; width: 10px; height: 100%;\n  cursor: col-resize; touch-action: none; background: transparent;\n}\n.kt-resizer::after {\n  content: ""; position: absolute; top: 0; right: 3px; width: 1px; height: 100%;\n  background: var(--kt-border, rgba(128,128,128,.24));\n}\n.kt-resizer:hover::after, .kt-resizer[data-dragging="true"]::after {\n  width: 2px; background: var(--kt-accent, var(--dsw-alias-state-business-primary, #4f7cff));\n}\n/* \u53C2\u8003\u89C6\u9891\uFF08\u62CD\u540C\u6B3E\uFF09 */\n.kt-reference { flex: 1; min-height: 0; overflow: auto; display: grid; align-content: start; gap: 12px; padding: 14px 18px 48px; }\n.kt-ref-hero { display: grid; gap: 8px; max-width: 640px; }\n.kt-ref-hero h3 { margin: 0; font-size: 17px; }\n.kt-ref-hero p { margin: 0; color: var(--dsw-alias-label-secondary, #8a8a8a); font-size: 13px; line-height: 1.7; }\n.kt-primary-action { justify-self: start; border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.3)); border-radius: 999px; padding: 4px 14px; background: var(--dsw-alias-state-business-primary, #4f7cff); color: #fff; cursor: pointer; font: 12px/1.5 var(--dsw-font-family, sans-serif); }\n.kt-ref-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; }\n.kt-ref-head > div:first-child { display: grid; gap: 2px; min-width: 0; }\n.kt-ref-head strong { font-size: 14px; }\n.kt-ref-head span { color: var(--kt-muted, #8a8a8a); font-size: 11px; overflow-wrap: anywhere; }\n.kt-ref-actions { display: flex; flex-wrap: wrap; gap: 6px; }\n.kt-ref-actions button { border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.3)); border-radius: 6px; padding: 3px 9px; background: transparent; color: var(--dsw-alias-label-primary, #1d1d1f); cursor: pointer; font: 12px/1.4 var(--dsw-font-family, sans-serif); }\n.kt-ref-actions button:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,.12)); }\n.kt-ref-stats { display: flex; flex-wrap: wrap; align-items: center; gap: 5px; font-size: 11px; color: var(--dsw-alias-label-secondary, #8a8a8a); }\n.kt-ref-stats span { border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.3)); border-radius: 999px; padding: 1px 8px; }\n.kt-ref-stats em { border: 1px solid rgba(79,124,255,.45); border-radius: 999px; color: var(--dsw-alias-state-business-primary, #4f7cff); padding: 1px 8px; font-style: normal; }\n.kt-ref-frames { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 6px; }\n.kt-ref-frames figure { margin: 0; display: grid; gap: 2px; }\n.kt-ref-frames img { width: 100%; aspect-ratio: 16/9; object-fit: cover; border-radius: 6px; background: rgba(0,0,0,.08); }\n.kt-ref-frames figcaption { color: var(--dsw-alias-label-secondary, #8a8a8a); font-size: 10px; text-align: right; }\n.kt-ref-slice { display: flex; gap: 2px; height: 26px; }\n.kt-ref-slice span { display: grid; place-items: center; min-width: 12px; border-radius: 3px; background: rgba(79,124,255,.18); color: var(--dsw-alias-label-secondary, #8a8a8a); font-size: 10px; overflow: hidden; }\n.kt-ref-plans { display: grid; gap: 8px; }\n.kt-ref-plans h4, .kt-ref-rights h4 { margin: 0; font-size: 13px; }\n.kt-ref-plans article { display: grid; gap: 6px; border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.3)); border-radius: 9px; padding: 9px 11px; }\n.kt-ref-plans article.is-chosen { border-color: var(--dsw-alias-state-business-primary, #4f7cff); }\n.kt-ref-plans article header { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }\n.kt-ref-plans article em { color: var(--dsw-alias-state-business-primary, #4f7cff); font-size: 11px; font-style: normal; }\n.kt-ref-plans article p { margin: 0; font-size: 12px; line-height: 1.6; }\n.kt-ref-plans article dl { display: grid; grid-template-columns: 36px 1fr; gap: 2px 6px; margin: 0; font-size: 11px; }\n.kt-ref-plans article dt { color: var(--dsw-state-secondary, #8a8a8a); }\n.kt-ref-plans article dd { margin: 0; }\n.kt-ref-plans article button { justify-self: start; border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.3)); border-radius: 6px; padding: 3px 10px; background: transparent; color: inherit; cursor: pointer; font: 12px/1.4 var(--dsw-font-family, sans-serif); }\n.kt-ref-rights { display: grid; gap: 6px; border-top: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.24)); padding-top: 10px; }\n.kt-ref-rights p { margin: 0; font-size: 12px; line-height: 1.6; color: var(--dsw-alias-label-secondary, #8a8a8a); }\n.kt-ref-url { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }\n.kt-ref-url input { min-width: 220px; flex: 1; min-height: 28px; border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.3)); border-radius: 6px; padding: 2px 8px; background: transparent; color: inherit; font: 12px/1.5 var(--dsw-font-family, sans-serif); }\n.kt-ref-url button { border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.3)); border-radius: 6px; padding: 3px 10px; background: transparent; color: inherit; cursor: pointer; font: 12px/1.4 var(--dsw-font-family, sans-serif); }\n.kt-ref-url button:disabled, .kt-primary-action:disabled { opacity: .45; cursor: default; }\n.kt-ref-frames-wrap { display: grid; gap: 6px; }\n.kt-ref-frames-wrap h4, .kt-ref-transcript h4 { margin: 0; font-size: 13px; }\n.kt-ref-frames figure { cursor: pointer; border: 2px solid transparent; border-radius: 7px; padding: 1px; }\n.kt-ref-frames figure.is-picked { border-color: var(--dsw-alias-state-business-primary, #4f7cff); }\n.kt-ref-transcript { display: grid; gap: 6px; border-top: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.24)); padding-top: 10px; }\n.kt-ref-transcript p { margin: 0; font-size: 12px; line-height: 1.6; }\n.kt-ref-segments { display: grid; gap: 3px; }\n.kt-ref-segments p { display: flex; gap: 8px; color: var(--dsw-alias-label-secondary, #8a8a8a); }\n.kt-ref-segments time { flex: none; color: var(--dsw-alias-state-business-primary, #4f7cff); font: 11px/1.6 ui-monospace, Menlo, monospace; }\n.kt-ref-segments span { color: var(--dsw-alias-label-primary, #1d1d1f); }\n.kt-ref-register { display: grid; gap: 8px; border: 1px dashed var(--dsw-alias-border-l2, rgba(128,128,128,.4)); border-radius: 9px; padding: 10px 12px; background: var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,.06)); }\n.kt-ref-register h4 { margin: 0; font-size: 13px; }\n.kt-ref-register-row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }\n.kt-ref-file { display: inline-flex; align-items: center; border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.35)); border-radius: 6px; padding: 4px 12px; cursor: pointer; font: 12px/1.4 var(--dsw-font-family, sans-serif); }\n.kt-ref-file:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,.12)); }\n.kt-ref-file input { display: none; }\n.kt-ref-empty { display: grid; gap: 10px; }\n.kt-ref-empty .kt-empty { padding: 0; }\n\n.kt-ref-chips { display: flex; flex-wrap: wrap; gap: 4px; }\n.kt-ref-chips span { border: 1px solid rgba(79,124,255,.4); border-radius: 999px; padding: 0 7px; color: var(--dsw-alias-state-business-primary, #4f7cff); font-size: 10px; line-height: 1.7; }\n\n.kt-novel { flex: 1; min-height: 0; overflow: auto; display: grid; align-content: start; gap: 12px; padding: 14px 18px 48px; }\n.kt-novel-hero { display: grid; gap: 8px; max-width: 720px; }\n.kt-novel-hero h3 { margin: 0; font-size: 17px; }\n.kt-novel-hero p { margin: 0; color: var(--dsw-alias-label-secondary, #8a8a8a); font-size: 13px; line-height: 1.7; }\n.kt-novel-form { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 6px; }\n.kt-novel-form input { min-height: 28px; border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.3)); border-radius: 6px; padding: 2px 8px; background: transparent; color: inherit; font: 12px/1.5 var(--dsw-font-family, sans-serif); }\n.kt-novel-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; }\n.kt-novel-head > div:first-child { display: grid; gap: 2px; }\n.kt-novel-head strong { font-size: 14px; }\n.kt-novel-head span { color: var(--dsw-alias-label-secondary, #8a8a8a); font-size: 11px; }\n.kt-novel-stages { display: grid; gap: 4px; }\n.kt-novel-stage { display: flex; align-items: center; gap: 8px; border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.24)); border-radius: 7px; padding: 6px 9px; }\n.kt-novel-stage > div { flex: 1; min-width: 0; display: grid; gap: 1px; }\n.kt-novel-stage strong { font-size: 12px; }\n.kt-novel-stage span { color: var(--dsw-alias-label-secondary, #8a8a8a); font-size: 11px; overflow-wrap: anywhere; }\n.kt-novel-mark { flex: none; width: 16px; text-align: center; color: var(--dsw-alias-label-secondary, #8a8a8a); }\n.kt-novel-stage.is-done .kt-novel-mark { color: #3ea675; }\n.kt-novel-stage.is-missing .kt-novel-mark { color: #d05a5a; }\n.kt-novel-stage button { border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.3)); border-radius: 5px; padding: 1px 8px; background: transparent; color: inherit; cursor: pointer; font: 11px/1.6 var(--dsw-font-family, sans-serif); }\n.kt-novel-diag { display: grid; gap: 4px; border-top: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.24)); padding-top: 10px; }\n.kt-novel-diag h4 { margin: 0; font-size: 13px; }\n.kt-novel-diag ul { margin: 0; padding-left: 18px; display: grid; gap: 2px; font-size: 12px; line-height: 1.6; color: var(--dsw-alias-label-secondary, #8a8a8a); }\n\n.kt-novel-chapters { display: grid; gap: 6px; border-top: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.24)); padding-top: 10px; }\n.kt-novel-chapters-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }\n.kt-novel-chapters-head h4 { margin: 0; font-size: 13px; }\n.kt-novel-chapters-head button { border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.3)); border-radius: 6px; padding: 2px 9px; background: transparent; color: inherit; cursor: pointer; font: 11px/1.6 var(--dsw-font-family, sans-serif); }\n.kt-novel-chapter-list { display: grid; gap: 4px; }\n.kt-novel-chapter { display: flex; align-items: center; gap: 8px; border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.24)); border-radius: 7px; padding: 5px 9px; }\n.kt-novel-chapter > div:first-child { flex: 1; min-width: 0; display: grid; gap: 1px; }\n.kt-novel-chapter strong { font-size: 12px; }\n.kt-novel-chapter span { color: var(--dsw-alias-label-secondary, #8a8a8a); font-size: 11px; }\n.kt-novel-context { margin: 0; max-height: 320px; overflow: auto; border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.24)); border-radius: 7px; padding: 10px; background: var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,.06)); font: 11px/1.6 ui-monospace, Menlo, monospace; white-space: pre-wrap; }\n\n.kt-novel-edit { display: grid; gap: 6px; border-top: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.24)); padding-top: 10px; }\n.kt-novel-edit h4 { margin: 0; font-size: 13px; }\n.kt-novel-world-add, .kt-novel-char-add { display: flex; flex-wrap: wrap; gap: 5px; }\n.kt-novel-world-add select, .kt-novel-world-add input, .kt-novel-char-add input { min-height: 26px; border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.3)); border-radius: 5px; padding: 1px 7px; background: transparent; color: inherit; font: 11px/1.6 var(--dsw-font-family, sans-serif); }\n.kt-novel-world-add input { flex: 1; min-width: 180px; }\n.kt-novel-char-add input { flex: 1; min-width: 90px; }\n.kt-novel-world-add button, .kt-novel-char-add button { border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.3)); border-radius: 5px; padding: 1px 9px; background: transparent; color: inherit; cursor: pointer; font: 11px/1.6 var(--dsw-font-family, sans-serif); }\n.kt-novel-world-list, .kt-novel-char-list { display: grid; gap: 3px; }\n.kt-novel-world-list > div { display: grid; gap: 1px; }\n.kt-novel-world-list strong { font-size: 11px; color: var(--dsw-alias-label-secondary, #8a8a8a); }\n.kt-novel-world-list span, .kt-novel-char-list > div { display: flex; align-items: center; gap: 6px; font-size: 11px; line-height: 1.6; }\n.kt-novel-world-list span button, .kt-novel-char-list button { border: 0; background: transparent; color: var(--dsw-alias-label-secondary, #8a8a8a); cursor: pointer; }\n.kt-novel-char-list > div strong { font-size: 11px; }\n.kt-novel-char-list > div span { flex: 1; color: var(--dsw-alias-label-secondary, #8a8a8a); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n/* \u539F\u751F View \u9875\u7B7E\u884C\u7F3A\u5E2D\u65F6\u7684\u72EC\u7ACB\u9876\u680F\uFF0C\u907F\u514D\u9875\u7B7E\u88AB\u6536\u8FDB\u521B\u4F5C\u53F0\u5DE6\u680F */\n.kt-top-tabs-host { position: sticky; top: 0; z-index: 30; display: flex; align-items: center; min-height: 32px; padding: 0 12px; background: var(--dsw-alias-bg-base, var(--dsw-alias-bg-l1, #fff)); border-bottom: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.24)); }\n.kt-top-tabs-host .kt-header-tabs { display: flex; gap: 32px; align-items: center; }\n[data-conversation-scroll]:has(> [data-slot="conversation.session"] > .kt-surface[data-open="true"]) > [data-composer-seat] > * { background: var(--dsw-alias-bg-base, #fff); }\n/* \u6536\u8D77\u6001\uFF1A\u53EA\u7559\u4E00\u4E2A\u5165\u53E3\uFF0C\u4E0D\u5360\u4F1A\u8BDD\u5934\u9875\u7B7E\u884C */\n.kt-collapsed { position: fixed; right: 18px; bottom: 150px; z-index: 9999; display: flex; align-items: center; }\n.kt-launcher { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--kt-border, rgba(128,128,128,.3)); border-radius: 999px; padding: 4px 12px; background: var(--dsw-alias-bg-base, #fff); color: var(--dsw-alias-label-primary, #1d1d1f); box-shadow: 0 2px 10px rgba(0,0,0,.12); cursor: pointer; font: 12px/1.5 var(--dsw-font-family, system-ui, sans-serif); }\n.kt-launcher b { font-size: 11px; letter-spacing: .04em; color: var(--kt-accent, #4f7cff); }\n.kt-launcher:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,.12)); }\n\n/* \u4E92\u52A8\u6E38\u620F\uFF1A\u9636\u6BB5\u5DE5\u4F5C\u53F0\uFF08\u7B80\u62A5\u8868\u5355 / \u6982\u5FF5\u4E09\u9009\u4E00 / \u6A21\u677F / \u76F2\u6D4B\uFF09\u3002 */\n.kt-stage-workbench { display: flex; flex: 1; min-height: 0; flex-direction: column; gap: 10px; padding: 10px 12px 16px; overflow: auto; }\n.kt-stage-card { display: flex; flex-direction: column; gap: 8px; border: 1px solid var(--kt-border); border-radius: 8px; padding: 10px; }\n.kt-stage-card-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }\n.kt-stage-card-head strong { font-size: 12px; }\n.kt-stage-hint { margin: 0; color: var(--kt-muted); font-size: 11px; line-height: 1.55; }\n.kt-stage-detail { margin: 0; color: var(--kt-muted); font-size: 11px; line-height: 1.6; }\n.kt-link { margin-left: auto; border: 0; background: none; color: var(--kt-accent); padding: 0; font-size: 11px; cursor: pointer; }\n.kt-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }\n.kt-form-row { display: grid; gap: 3px; color: var(--kt-muted); font-size: 11px; }\n.kt-form-wide { grid-column: 1 / -1; }\n.kt-form-row input, .kt-form-row select, .kt-form-row textarea {\n  box-sizing: border-box; width: 100%; padding: 5px 7px; border: 1px solid var(--kt-border); border-radius: 6px;\n  background: transparent; color: var(--kt-primary); font: 12px/1.4 var(--dsw-font-family, sans-serif); resize: vertical;\n}\n.kt-form-row input:focus, .kt-form-row select:focus, .kt-form-row textarea:focus { outline: 1px solid var(--kt-accent); outline-offset: 0; }\n.kt-form-actions { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }\n.kt-form-actions button, .kt-stage-empty button, .kt-concept-card button {\n  border: 1px solid var(--kt-border); border-radius: 6px; background: transparent; color: var(--kt-primary);\n  padding: 5px 10px; font-size: 11px; cursor: pointer;\n}\n.kt-form-actions button:hover, .kt-stage-empty button:hover, .kt-concept-card button:hover { background: var(--kt-hover); }\n.kt-form-actions button.kt-primary { border-color: var(--kt-accent); background: var(--kt-accent); color: #fff; }\n.kt-form-actions button:disabled, .kt-concept-card button:disabled { opacity: .5; cursor: default; }\n.kt-form-error { margin: 0; color: #b3261e; font-size: 11px; line-height: 1.5; }\n.kt-stage-empty { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; }\n.kt-stage-empty p { margin: 0; color: var(--kt-muted); font-size: 11px; }\n.kt-concept-options { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 8px; }\n.kt-concept-card { display: flex; flex-direction: column; gap: 6px; border: 1px solid var(--kt-border); border-radius: 8px; padding: 8px; }\n.kt-concept-card.is-chosen { border-color: var(--kt-accent); box-shadow: inset 0 0 0 1px var(--kt-accent); }\n.kt-concept-card header { display: flex; align-items: baseline; gap: 6px; }\n.kt-concept-card header b { color: var(--kt-accent); font-size: 10px; }\n.kt-concept-card header strong { min-width: 0; overflow: hidden; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }\n.kt-concept-card p { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 4; overflow: hidden; margin: 0; color: var(--kt-muted); font-size: 11px; line-height: 1.55; }\n.kt-qa-prompt {\n  max-height: 140px; overflow: auto; margin: 0; padding: 7px 8px; border: 1px solid var(--kt-border); border-radius: 6px;\n  color: var(--kt-muted); font: 10px/1.6 ui-monospace, SFMono-Regular, Menlo, monospace; white-space: pre-wrap;\n}\n\n/* \u4E92\u52A8\u6E38\u620F\uFF1A\u6784\u5EFA\u5FEB\u7167\u6761\u3002 */\n.kt-snapshot-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 5px; padding: 5px 0; color: var(--kt-muted); font-size: 10px; }\n.kt-snapshot-bar select, .kt-snapshot-bar input {\n  min-width: 0; padding: 4px 6px; border: 1px solid var(--kt-border); border-radius: 6px;\n  background: transparent; color: var(--kt-primary); font: 11px/1.3 var(--dsw-font-family, sans-serif);\n}\n.kt-snapshot-bar input { width: 110px; }\n.kt-snapshot-bar button {\n  border: 1px solid var(--kt-border); border-radius: 6px; background: transparent; color: var(--kt-primary);\n  padding: 4px 8px; font-size: 10px; cursor: pointer;\n}\n.kt-snapshot-bar button:hover { background: var(--kt-hover); }\n.kt-snapshot-bar button:disabled { opacity: .45; cursor: default; }\n\n/* \u4E92\u52A8\u6E38\u620F\uFF1A\u753B\u5E03\u3002 */\n.kt-canvas-wrap { display: flex; flex: 1; min-height: 0; flex-direction: column; }\n.kt-canvas-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 6px 12px; border-bottom: 1px solid var(--kt-border); }\n.kt-canvas-title { font-size: 12px; font-weight: 600; }\n.kt-canvas-meta { color: var(--kt-muted); font-size: 10px; }\n.kt-canvas-tools { display: flex; align-items: center; gap: 5px; margin-left: auto; color: var(--kt-muted); font-size: 10px; }\n.kt-canvas-tools button, .kt-canvas-node button {\n  border: 1px solid var(--kt-border); border-radius: 5px; background: transparent; color: var(--kt-primary);\n  padding: 3px 7px; font-size: 10px; cursor: pointer;\n}\n.kt-canvas-tools button:hover, .kt-canvas-node button:hover { background: var(--kt-hover); }\n.kt-canvas { position: relative; flex: 1; min-height: 340px; overflow: hidden; cursor: grab; background-image: radial-gradient(var(--kt-border) 0.6px, transparent 0.6px); background-size: 16px 16px; }\n.kt-canvas:active { cursor: grabbing; }\n.kt-canvas-world { position: absolute; inset: 0; transform-origin: 0 0; }\n.kt-canvas-lines { position: absolute; inset: 0; stroke: var(--kt-border); stroke-width: 1; }\n.kt-canvas-node {\n  position: absolute; box-sizing: border-box; border: 1px solid var(--kt-border); border-radius: 8px;\n  background: var(--dsw-alias-bg-base, #fff); color: var(--kt-primary); padding: 7px 9px;\n  font: 11px/1.4 var(--dsw-font-family, sans-serif); text-align: left;\n}\nbutton.kt-canvas-node { cursor: pointer; }\nbutton.kt-canvas-node:hover { background: var(--kt-hover); }\n.kt-canvas-stage { display: flex; align-items: center; gap: 7px; }\n.kt-canvas-stage strong, .kt-canvas-doc strong { display: block; font-size: 12px; }\n.kt-canvas-stage em, .kt-canvas-doc em { display: block; overflow: hidden; color: var(--kt-muted); font-size: 10px; font-style: normal; text-overflow: ellipsis; white-space: nowrap; }\n.kt-canvas-stage.is-done { border-color: var(--kt-accent); }\n.kt-canvas-stage.is-partial { border-style: dashed; }\n.kt-canvas-stage.is-skipped { opacity: .5; }\n.kt-canvas-stage.is-optional { border-style: dotted; }\n.kt-canvas-stage.is-next { box-shadow: inset 0 0 0 1px var(--kt-accent); }\n.kt-canvas-dot { color: var(--kt-muted); font-size: 11px; }\n.kt-canvas-doc { display: flex; flex-direction: column; justify-content: center; }\n.kt-canvas-build, .kt-canvas-qa, .kt-canvas-snapshot { display: flex; flex-direction: column; gap: 5px; cursor: default; }\n.kt-canvas-node-head { display: flex; align-items: baseline; justify-content: space-between; gap: 6px; }\n.kt-canvas-node-head em { overflow: hidden; color: var(--kt-muted); font-size: 9px; font-style: normal; text-overflow: ellipsis; white-space: nowrap; }\n.kt-canvas-build code { color: var(--kt-muted); font-size: 10px; }\n.kt-canvas-qa p { margin: 0; color: var(--kt-muted); font-size: 10px; }\n.kt-canvas-qa-actions, .kt-canvas-snapshot-actions { display: flex; flex-wrap: wrap; gap: 5px; }\n.kt-canvas-isolation { font-size: 10px; color: var(--kt-muted); }\n.kt-canvas-isolation.is-isolated { color: #2e7d32; }\n.kt-canvas-isolation.is-same-session { color: #b3261e; }\n.kt-canvas-ok { color: #2e7d32; font-size: 10px; }\n.kt-canvas-warn { color: #b26a00; font-size: 10px; }\n.kt-canvas-hint { padding: 5px 12px; border-top: 1px solid var(--kt-border); color: var(--kt-muted); font-size: 10px; }\n\n\n* KToon \u521B\u4F5C\u53F0\uFF1A\u6CBF\u7528\u5BBF\u4E3B\u4E3B\u9898\u53D8\u91CF\uFF0C\u53EA\u5728\u539F\u751F\u4F1A\u8BDD\u5217\u65C1\u8FB9\u52A0\u4E24\u680F\uFF0C\u4E0D\u8986\u76D6 Chat \u7EC4\u4EF6\u3002 */\n.kt-bridge-marker { display: none; }\n.kt-surface { display: contents; font-family: var(--dsw-font-family, system-ui, -apple-system, "PingFang SC", sans-serif); }\n\n/* \u4F1A\u8BDD\u6EDA\u52A8\u5BBF\u4E3B\u53D8\u4E09\u680F\uFF1A\u6587\u4EF6\u6811 / \u4F5C\u54C1 / \u539F\u751F Chat\u3002 */\n[data-conversation-scroll]:has(> [data-slot="conversation.session"] > .kt-surface[data-open="true"]) {\n  --kt-border: var(--dsw-alias-border-l2, rgba(128,128,128,.24));\n  --kt-muted: var(--dsw-alias-label-secondary, #8a8a8a);\n  --kt-primary: var(--dsw-alias-label-primary, #1d1d1f);\n  --kt-hover: var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,.1));\n  --kt-accent: var(--dsw-alias-state-business-primary, #4f7cff);\n  display: grid;\n  grid-template-columns: clamp(180px, 15%, 230px) minmax(240px, 1fr) clamp(320px, var(--kt-chat-width, 430px), 720px);\n  grid-template-rows: minmax(0, 1fr);\n  min-height: 0;\n  overflow-x: hidden;\n  overflow-y: auto;\n  position: relative;\n  scrollbar-gutter: stable;\n  scroll-padding-bottom: calc(max(var(--dsh-composer-height, 152px), var(--kt-composer-height, 0px)) + 16px);\n}\n\n/* \u539F\u751F\u4F1A\u8BDD\u4ECD\u662F\u8FD9\u4E00\u5217\u7684\u552F\u4E00 scroller \u7684\u6D88\u8D39\u8005\uFF1A\u4E0D\u53E6\u52A0 overflow\uFF0C\u5426\u5219\u5B83\u7684\u81EA\u52A8\u8D34\u5E95\u4F1A\u5931\u6548\u3002 */\n[data-conversation-scroll]:has(> [data-slot="conversation.session"] > .kt-surface[data-open="true"])\n  > [data-slot="conversation.session"] > :not(.kt-surface) {\n  grid-column: 3;\n  grid-row: 1;\n  min-width: 0;\n  min-height: 100%;\n  border-left: 1px solid var(--kt-border);\n}\n\n/* \u7ED9\u6700\u540E\u4E00\u884C\u548C\u4EFB\u52A1\u9762\u677F\u7559\u51FA Composer \u7684\u9AD8\u5EA6\uFF0C\u907F\u514D\u88AB\u6D6E\u5C42\u538B\u4F4F\u3002 */\n[data-conversation-scroll]:has(> [data-slot="conversation.session"] > .kt-surface[data-open="true"])\n  [data-chat-flow]:not([data-step-process-content]) {\n  padding-bottom: calc(max(var(--dsh-composer-height, 152px), var(--kt-composer-height, 0px)) + 40px);\n}\n\n[data-conversation-scroll]:has(> [data-slot="conversation.session"] > .kt-surface[data-open="true"])\n  > [data-composer-seat] {\n  grid-column: 3;\n  background: var(--dsw-alias-bg-base, #fff);\n  z-index: 40;\n  grid-row: 1;\n  min-width: 0;\n  width: 100%;\n  align-self: start;\n  position: sticky;\n  top: calc(var(--kt-scroll-height, 720px) - max(var(--dsh-composer-height, 152px), var(--kt-composer-height, 0px)));\n  bottom: auto;\n}\n\n.kt-tree {\n  box-sizing: border-box;\n  display: flex;\n  grid-column: 1;\n  grid-row: 1;\n  position: sticky;\n  z-index: 9;\n  top: 0;\n  align-self: start;\n  height: 100%;\n  min-width: 0;\n  min-height: 0;\n  flex-direction: column;\n  overflow: hidden;\n  border-right: 1px solid var(--kt-border);\n  background: var(--dsw-alias-bg-base, #fff);\n  color: var(--kt-primary);\n}\n.kt-main {\n  box-sizing: border-box;\n  position: sticky;\n  z-index: 9;\n  top: 0;\n  align-self: start;\n  height: 100%;\n  display: flex;\n  grid-column: 2;\n  grid-row: 1;\n  min-width: 0;\n  min-height: 0;\n  flex-direction: column;\n  overflow: hidden;\n  background: var(--dsw-alias-bg-base, #fff);\n}\n.kt-tree-head { display: grid; gap: 6px; padding: 8px 8px 8px; border-bottom: 1px solid var(--kt-border); }\n.kt-tree-title { display: flex; align-items: baseline; justify-content: space-between; gap: 6px; padding: 0 2px; }\n.kt-tree-title span { font-size: 12px; font-weight: 600; }\n.kt-tree-title em { min-width: 0; flex: 1; overflow: hidden; color: var(--kt-muted); font-size: 11px; font-style: normal; text-align: right; text-overflow: ellipsis; white-space: nowrap; }\n.kt-tree-title .kt-collapse { width: 20px; height: 20px; flex: none; border: 0; border-radius: 4px; background: transparent; color: var(--kt-muted); cursor: pointer; font-size: 13px; line-height: 1; }\n.kt-tree-title .kt-collapse:hover { background: var(--kt-hover); color: var(--kt-primary); }\n.kt-brand { display: flex; align-items: center; justify-content: space-between; gap: 8px; }\n.kt-brand strong { font-size: 13px; letter-spacing: .04em; }\n.kt-brand strong::after { content: " \u521B\u4F5C\u53F0"; font-weight: 400; color: var(--kt-muted); font-size: 11px; letter-spacing: 0; }\n.kt-collapse { width: 24px; height: 24px; border: 1px solid var(--kt-border); border-radius: 6px; background: transparent; color: var(--kt-muted); cursor: pointer; font-size: 14px; line-height: 1; }\n.kt-collapse:hover { background: var(--kt-hover); color: var(--kt-primary); }\n/* \u5F15\u64CE View \u9875\u7B7E\u884C\u7684\u540C\u6392\u9875\u7B7E\uFF1A\u590D\u7528\u539F\u751F\u9875\u7B7E\u7684\u5C3A\u5BF8\u4E0E\u9009\u4E2D\u4E0B\u5212\u7EBF\uFF0C\u7EDD\u4E0D\u6362\u884C\u3002 */\n.kt-tabs-holder { display: contents; }\n.kt-header-tabs {\n  display: flex; flex: 1 1 auto; min-width: 0; align-items: flex-start;\n  position: relative; z-index: 10;\n  /* \u4E0E\u539F\u751F View \u9875\u7B7E\u7684 32px \u95F4\u8DDD\u4E00\u81F4\uFF1A\u7EC4\u5185 32\uFF0C\u7EC4\u95F4\u8865\u8DB3 32\uFF08\u9875\u7B7E\u884C\u81EA\u8EAB gap \u662F 24\uFF09\u3002 */\n  gap: 32px; margin-left: 8px;\n  overflow: hidden; white-space: nowrap;\n}\n.kt-header-tabs.kt-tabs { flex-wrap: nowrap; }\n.kt-header-tabs button {\n  position: relative; flex: none; min-height: 25px;\n  padding: 0 0 calc(var(--qilin-space-2, 6px) + 1px);\n  border: 0; background: none; cursor: pointer;\n  color: var(--qilin-alias-label-tertiary, var(--dsw-alias-label-secondary, #8a8a8a));\n  font: 500 var(--qilin-text-base, 14px)/16px var(--dsw-font-family, system-ui, sans-serif);\n}\n.kt-header-tabs button:hover { color: var(--qilin-alias-label-primary, var(--dsw-alias-label-primary, #1d1d1f)); }\n.kt-header-tabs button.is-active { color: var(--qilin-alias-label-primary, var(--dsw-alias-label-primary, #1d1d1f)); }\n.kt-header-tabs button.is-active::after {\n  content: ""; position: absolute; left: 0; right: 0; bottom: 2px; height: 2px; border-radius: 1px;\n  background: var(--qilin-alias-state-business-primary, var(--dsw-alias-state-business-primary, #4f7cff));\n}\n/* \u5DE6\u4FA7\u6587\u4EF6\u6811\u5934\u91CC\u7684\u9875\u7B7E\uFF08\u5F15\u64CE\u6CA1\u6709 View \u9875\u7B7E\u884C\u65F6\u7684\u515C\u5E95\uFF09 */\n.kt-tree-head .kt-header-tabs { flex-wrap: wrap; gap: 3px; margin: 0; overflow: visible; }\n.kt-tree-head .kt-header-tabs button {\n  padding: 2px 6px; border: 1px solid transparent; border-radius: 6px;\n  color: var(--kt-muted); font-size: 12px; line-height: 1.3;\n}\n.kt-tree-head .kt-header-tabs button.is-active { border-color: var(--kt-border); background: var(--kt-hover); color: var(--kt-primary); }\n.kt-tree-head .kt-header-tabs button.is-active::after { display: none; }\n.kt-tree-head .kt-tabs button, .kt-subtabs button {\n  min-height: 26px; border: 1px solid transparent; border-radius: 6px; padding: 3px 6px;\n  background: transparent; color: var(--kt-muted); cursor: pointer;\n  font: 12px/1.3 var(--dsw-font-family, sans-serif); white-space: nowrap;\n}\n.kt-tree-head .kt-tabs button:hover, .kt-subtabs button:hover { background: var(--kt-hover); color: var(--kt-primary); }\n.kt-tree-head .kt-tabs button.is-active, .kt-subtabs button.is-active { border-color: var(--kt-border); background: var(--kt-hover); color: var(--kt-primary); font-weight: 600; }\n.kt-episode-bar { display: grid; gap: 4px; }\n.kt-episode-bar select, .kt-studio-bar select {\n  min-height: 26px; border: 1px solid var(--kt-border); border-radius: 6px;\n  background: var(--dsw-alias-bg-base, #fff); color: var(--kt-primary);\n  padding: 2px 6px; font: 12px/1.3 var(--dsw-font-family, sans-serif);\n}\n.kt-subtabs { display: flex; gap: 3px; }\n\n.kt-tree-scroll { flex: 1; min-height: 0; overflow: auto; padding: 6px 6px 14px; }\n.kt-tree-group { display: grid; }\n.kt-folder > summary { cursor: pointer; padding: 3px 0 3px 6px; color: var(--kt-muted); font-size: 12px; border-radius: 4px; user-select: none; }\n.kt-folder > summary:hover { background: var(--kt-hover); color: var(--kt-primary); }\n.kt-file {\n  display: block; width: 100%; border: 0; border-radius: 4px; padding: 3px 6px;\n  background: transparent; color: var(--kt-primary); text-align: left; cursor: pointer;\n  font: 12px/1.45 var(--dsw-font-family, sans-serif);\n  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;\n}\n.kt-file:hover { background: var(--kt-hover); }\n.kt-file.is-selected { background: var(--kt-accent); color: #fff; }\n.kt-foot { display: grid; gap: 2px; border-top: 1px solid var(--kt-border); padding: 7px 9px; color: var(--kt-muted); font-size: 11px; }\n.kt-foot-error { color: var(--dsw-alias-state-error-primary, #c0392b); }\n\n.kt-editor { display: flex; flex: 1; min-height: 0; flex-direction: column; }\n.kt-editor-bar { display: flex; align-items: center; justify-content: space-between; gap: 8px; border-bottom: 1px solid var(--kt-border); padding: 6px 10px; }\n.kt-editor-tabs { display: flex; gap: 4px; }\n.kt-editor-tabs button { border: 1px solid transparent; border-radius: 5px; padding: 2px 9px; background: transparent; color: var(--kt-muted); cursor: pointer; font: 12px/1.4 var(--dsw-font-family, sans-serif); }\n.kt-editor-tabs button.is-active { border-color: var(--kt-border); background: var(--kt-hover); color: var(--kt-primary); }\n.kt-editor-actions { display: flex; align-items: center; gap: 6px; }\n.kt-dirty { color: var(--kt-muted); font-size: 11px; }\n.kt-save, .kt-reload {\n  min-height: 24px; border: 1px solid var(--kt-border); border-radius: 5px; padding: 2px 10px;\n  background: var(--kt-accent); color: #fff; cursor: pointer; font: 12px/1.3 var(--dsw-font-family, sans-serif);\n}\n.kt-save:disabled { opacity: .45; cursor: default; }\n.kt-reload { background: transparent; color: var(--kt-primary); }\n.kt-source {\n  flex: 1; box-sizing: border-box; width: 100%; min-height: 0; resize: none; border: 0; outline: none;\n  padding: 20px clamp(16px, 4vw, 44px) 60px; background: transparent; color: var(--kt-primary);\n  font: 13px/1.8 ui-monospace, SFMono-Regular, Menlo, monospace; tab-size: 2;\n}\n.kt-markdown { flex: 1; min-height: 0; overflow: auto; padding: 20px clamp(16px, 4vw, 48px) 72px; color: var(--kt-primary); font-size: 14px; line-height: 1.78; }\n.kt-markdown h1 { font-size: 22px; margin: 18px 0 10px; line-height: 1.3; }\n.kt-markdown h2 { font-size: 18px; margin: 22px 0 9px; line-height: 1.35; }\n.kt-markdown h3 { font-size: 15px; margin: 18px 0 7px; }\n.kt-markdown h4 { font-size: 14px; margin: 14px 0 6px; color: var(--kt-muted); }\n.kt-markdown p { margin: 0 0 10px; overflow-wrap: anywhere; }\n.kt-markdown ul, .kt-markdown ol { margin: 0 0 12px; padding-left: 22px; }\n.kt-markdown li { margin: 2px 0; }\n.kt-markdown code { padding: 1px 5px; border-radius: 4px; background: var(--dsw-alias-markdown-inline-code, rgba(128,128,128,.16)); font: 12px/1.5 ui-monospace, Menlo, monospace; }\n.kt-markdown pre { overflow: auto; border: 1px solid var(--kt-border); border-radius: 8px; padding: 12px 14px; background: var(--dsw-alias-bg-layer-1, rgba(128,128,128,.06)); }\n.kt-markdown pre code { padding: 0; background: transparent; font-size: 12px; line-height: 1.7; }\n.kt-markdown blockquote { margin: 10px 0; border-left: 3px solid var(--kt-border); padding: 2px 0 2px 12px; color: var(--kt-muted); }\n.kt-markdown table { border-collapse: collapse; margin: 8px 0 14px; font-size: 13px; }\n.kt-markdown th, .kt-markdown td { border: 1px solid var(--kt-border); padding: 4px 8px; text-align: left; }\n.kt-markdown a { color: var(--kt-accent); }\n.kt-markdown hr { border: 0; border-top: 1px solid var(--kt-border); margin: 18px 0; }\n\n.kt-media { max-width: 100%; max-height: 100%; object-fit: contain; margin: auto; }\n.kt-media-audio { width: min(520px, 90%); margin: auto; }\n.kt-empty { display: grid; place-items: center; min-height: 160px; padding: 28px; color: var(--kt-muted); font-size: 13px; line-height: 1.7; text-align: center; }\n.kt-error { padding: 20px; color: var(--dsw-alias-state-error-primary, #c0392b); font-size: 13px; }\n.kt-setup { display: grid; align-content: center; justify-items: start; gap: 10px; max-width: 520px; margin: 0 auto; padding: 40px 24px; }\n.kt-setup h3 { margin: 0; font-size: 17px; }\n.kt-setup p { margin: 0; color: var(--dsw-alias-label-secondary, #8a8a8a); font-size: 13px; line-height: 1.7; }\n.kt-setup code { border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.3)); border-radius: 6px; padding: 6px 9px; background: var(--dsw-alias-bg-layer-1, rgba(128,128,128,.06)); font: 12px/1.6 ui-monospace, Menlo, monospace; }\n.kt-setup button { border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.3)); border-radius: 999px; padding: 4px 14px; background: var(--dsw-alias-state-business-primary, #4f7cff); color: #fff; cursor: pointer; font: 12px/1.5 var(--dsw-font-family, sans-serif); }\n.kt-muted { color: var(--dsw-alias-label-secondary, #8a8a8a); }\n\n.kt-drama { display: flex; flex: 1; min-height: 0; flex-direction: column; overflow: auto; padding: 12px 14px 40px; gap: 10px; }\n.kt-drama-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }\n.kt-drama-head > div:first-child { display: grid; gap: 2px; }\n.kt-drama-head strong { font-size: 15px; }\n.kt-drama-head span { color: var(--kt-muted); font-size: 12px; }\n.kt-drama-actions { display: flex; flex-wrap: wrap; gap: 6px; }\n.kt-drama-actions button, .kt-shot footer button {\n  border: 1px solid var(--kt-border); border-radius: 6px; padding: 4px 10px;\n  background: transparent; color: var(--kt-primary); cursor: pointer;\n  font: 12px/1.3 var(--dsw-font-family, sans-serif);\n}\n.kt-drama-actions button:hover, .kt-shot footer button:hover { background: var(--kt-hover); }\n.kt-gates { display: flex; flex-wrap: wrap; gap: 4px; }\n.kt-gate { border: 1px solid var(--kt-border); border-radius: 999px; padding: 2px 9px; font-size: 11px; color: var(--kt-muted); }\n.kt-gate--pass { border-color: rgba(46,160,67,.5); color: #2ea043; }\n.kt-gate--blocked { border-color: rgba(192,57,43,.5); color: #c0392b; }\n.kt-shot-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 8px; }\n.kt-shot { display: flex; flex-direction: column; gap: 6px; border: 1px solid var(--kt-border); border-radius: 9px; padding: 9px 10px; background: var(--dsw-alias-bg-layer-1, rgba(128,128,128,.04)); cursor: pointer; }\n.kt-shot:hover { border-color: var(--kt-accent); }\n.kt-shot header { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }\n.kt-shot header strong { font-size: 13px; }\n.kt-shot header span { color: var(--kt-muted); font-size: 11px; }\n.kt-shot dl { display: grid; grid-template-columns: 34px 1fr; gap: 2px 6px; margin: 0; font-size: 11px; line-height: 1.5; }\n.kt-shot dt { color: var(--kt-muted); }\n.kt-shot dd { margin: 0; overflow-wrap: anywhere; }\n.kt-shot-image { width: 100%; aspect-ratio: 16/9; object-fit: cover; border-radius: 6px; background: rgba(0,0,0,.06); }\n.kt-shot footer { margin-top: auto; }\n.kt-diagnostics { border-top: 1px solid var(--kt-border); padding-top: 10px; display: grid; gap: 3px; }\n.kt-diagnostics h3 { margin: 0 0 4px; font-size: 13px; }\n.kt-diagnostics p { margin: 0; font-size: 12px; line-height: 1.6; }\n.kt-blocker { color: var(--dsw-alias-state-error-primary, #c0392b); }\n.kt-warning { color: var(--dsw-alias-state-warning-primary, #b7791f); }\n.kt-ok { color: #2ea043; }\n\n.kt-studio { display: flex; flex: 1; min-height: 0; flex-direction: column; gap: 8px; padding: 10px 12px 16px; }\n.kt-studio-bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }\n.kt-studio-tabs { padding: 0 12px 6px; }\n.kt-game-frame { flex: 1; width: 100%; min-height: 320px; border: 1px solid var(--kt-border); border-radius: 8px; background: #0d100e; }\n.kt-doc-list { display: grid; align-content: start; gap: 3px; overflow: auto; padding: 4px 2px; }\n.kt-doc-list button { border: 1px solid transparent; border-radius: 6px; padding: 5px 8px; background: transparent; color: var(--kt-primary); text-align: left; cursor: pointer; font: 12px/1.5 var(--dsw-font-family, sans-serif); }\n.kt-doc-list button:hover { background: var(--kt-hover); }\n\n/* \u4E92\u52A8\u6E38\u620F\uFF1A\u9636\u6BB5\u8F68\u3001\u4E0B\u4E00\u6B65\u5361\u3001\u6587\u7A3F\u5206\u7EC4\u4E0E\u7A7A\u6001\u3002 */\n.kt-game { display: flex; flex: 1; min-height: 0; flex-direction: column; }\n.kt-game-stages {\n  display: flex; flex: none; gap: 6px; overflow-x: auto;\n  padding: 8px 12px 6px; border-bottom: 1px solid var(--kt-border);\n  scrollbar-width: thin;\n}\n.kt-game-stages.is-empty { color: var(--kt-muted); font-size: 12px; padding: 10px 12px; }\n.kt-game-stage {\n  display: inline-flex; flex: none; align-items: center; gap: 5px;\n  border: 1px solid var(--kt-border); border-radius: 999px; background: transparent;\n  color: var(--kt-muted); padding: 4px 9px;\n  font: 11px/1.4 var(--dsw-font-family, sans-serif); cursor: pointer;\n}\n.kt-game-stage:hover { background: var(--kt-hover); color: var(--kt-primary); }\n.kt-game-stage.is-done { color: var(--kt-primary); border-color: var(--kt-accent); }\n.kt-game-stage.is-partial { color: var(--kt-primary); border-style: dashed; }\n.kt-game-stage.is-skipped { opacity: .45; text-decoration: line-through; }\n.kt-game-stage.is-optional { border-style: dotted; }\n.kt-game-stage.is-next { background: var(--kt-hover); box-shadow: inset 0 0 0 1px var(--kt-accent); color: var(--kt-primary); font-weight: 600; }\n.kt-game-stage.is-active { background: var(--kt-hover); }\n.kt-game-stage-dot { font-size: 10px; }\n.kt-game-play, .kt-game-docs {\n  display: flex; flex: 1; min-height: 0; flex-direction: column;\n  gap: 8px; padding: 8px 12px 14px; overflow: auto;\n}\n.kt-game-frame-bar { display: flex; align-items: center; justify-content: space-between; gap: 8px; color: var(--kt-muted); font-size: 11px; }\n.kt-game-frame-bar button, .kt-game-next-actions button, .kt-game-empty-actions button {\n  border: 1px solid var(--kt-border); border-radius: 6px; background: transparent;\n  color: var(--kt-primary); padding: 4px 9px; font-size: 11px; cursor: pointer;\n}\n.kt-game-frame-bar button:hover, .kt-game-next-actions button:hover, .kt-game-empty-actions button:hover { background: var(--kt-hover); }\n.kt-game-frame { flex: 1; width: 100%; min-height: 320px; border: 1px solid var(--kt-border); border-radius: 8px; background: #0d100e; }\n.kt-game-next {\n  flex: none; border: 1px solid var(--kt-border); border-left: 2px solid var(--kt-accent);\n  border-radius: 8px; padding: 8px 10px; background: var(--kt-hover);\n}\n.kt-game-next strong { display: block; margin-bottom: 2px; font-size: 12px; }\n.kt-game-next p { margin: 0 0 6px; color: var(--kt-muted); font-size: 11px; line-height: 1.6; }\n.kt-game-next-actions { display: flex; gap: 6px; flex-wrap: wrap; }\n.kt-game-docs-group { display: grid; gap: 3px; }\n.kt-game-docs-group h4 { margin: 4px 0 2px; color: var(--kt-muted); font-size: 11px; font-weight: 600; }\n.kt-game-docs-group button {\n  display: flex; align-items: baseline; gap: 8px; border: 1px solid transparent; border-radius: 6px;\n  background: transparent; color: var(--kt-primary); text-align: left; padding: 5px 8px;\n  font: 12px/1.5 var(--dsw-font-family, sans-serif); cursor: pointer;\n}\n.kt-game-docs-group button:hover { background: var(--kt-hover); }\n.kt-game-docs-group em { min-width: 0; overflow: hidden; color: var(--kt-muted); font-size: 10px; font-style: normal; text-overflow: ellipsis; white-space: nowrap; }\n.kt-game-empty { display: grid; gap: 8px; align-content: start; padding: 18px 16px; }\n.kt-game-empty h3 { margin: 0; font-size: 13px; }\n.kt-game-empty p { margin: 0; color: var(--kt-muted); font-size: 12px; line-height: 1.7; }\n.kt-game-empty code { display: block; padding: 6px 8px; border: 1px solid var(--kt-border); border-radius: 6px; color: var(--kt-primary); font-size: 11px; overflow-x: auto; }\n.kt-game-empty-actions { display: flex; gap: 6px; flex-wrap: wrap; }\n.kt-game-error { margin: 8px 12px 0; color: #b3261e; font-size: 12px; }\n.kt-player { display: flex; flex: 1; min-height: 0; flex-direction: column; gap: 8px; }\n.kt-source-tabs { display: flex; gap: 4px; }\n.kt-source-tabs button { border: 1px solid var(--kt-border); border-radius: 999px; padding: 2px 10px; background: transparent; color: var(--kt-muted); cursor: pointer; font: 11px/1.4 var(--dsw-font-family, sans-serif); }\n.kt-source-tabs button.is-active { color: var(--kt-primary); background: var(--kt-hover); }\n.kt-player-video { width: 100%; max-height: calc(100vh - 220px); border-radius: 8px; background: #000; }\n.kt-player-path { margin: 0; color: var(--kt-muted); font-size: 11px; overflow-wrap: anywhere; }\n\n.kt-jobs { grid-column: 1 / span 2; grid-row: 2; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; border-top: 1px solid var(--kt-border); padding: 4px 10px; color: var(--kt-muted); font-size: 11px; background: var(--dsw-alias-bg-base, #fff); }\n.kt-jobs strong { color: var(--kt-primary); font-weight: 600; }\n.kt-jobs span { border: 1px solid var(--kt-border); border-radius: 999px; padding: 1px 8px; }\n\n.kt-launcher {\n  position: fixed; right: 18px; bottom: 18px; z-index: 9;\n  display: flex; align-items: center; gap: 6px;\n  border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.3)); border-radius: 999px;\n  padding: 5px 12px; background: var(--dsw-alias-bg-base, #fff); color: var(--dsw-alias-label-secondary, #666);\n  cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,.12);\n  font: 12px/1.4 var(--dsw-font-family, sans-serif);\n}\n.kt-launcher b { color: var(--dsw-alias-label-primary, #1d1d1f); font-weight: 600; }\n.kt-launcher:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,.1)); }\n\n.kt-welcome {\n  box-sizing: border-box; order: -1; flex: none; width: min(640px, calc(100% - 32px));\n  margin: 24px auto; padding: 20px 24px; border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.3));\n  border-radius: 12px; background: var(--dsw-alias-bg-base, #fff); color: var(--dsw-alias-label-primary, #1d1d1f);\n  font: 14px/1.75 var(--dsw-font-family, sans-serif);\n}\n.kt-welcome h2 { margin: 0 0 8px; font-size: 19px; }\n.kt-welcome ol { margin: 8px 0 10px; padding-left: 22px; }\n.kt-welcome-note { color: var(--dsw-alias-label-secondary, #666); font-size: 12px; }\n.kt-welcome-dismiss { margin-top: 6px; border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.3)); border-radius: 999px; padding: 3px 12px; background: transparent; color: inherit; cursor: pointer; font: 12px/1.4 var(--dsw-font-family, sans-serif); }\n.kt-welcome-dismiss:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,.1)); }\n\n@media (max-width: 1180px) {\n  [data-conversation-scroll]:has(> [data-slot="conversation.session"] > .kt-surface[data-open="true"]) {\n    grid-template-columns: clamp(176px, 20%, 210px) minmax(260px, 1fr) clamp(340px, 36%, 440px);\n  }\n}\n@media (max-width: 900px) {\n  [data-conversation-scroll]:has(> [data-slot="conversation.session"] > .kt-surface[data-open="true"]) {\n    grid-template-columns: 160px minmax(220px, 1fr) minmax(300px, 40%);\n  }\n}\n/* \u53F3\u680F\u62D6\u62FD\uFF1A\u62D6\u52A8\u5206\u754C\u7EBF\u8C03\u6574\u804A\u5929\u5217\u5BBD\uFF0C\u5BBD\u5EA6\u6309\u5DE5\u4F5C\u533A\u8BB0\u4F4F\u3002 */\n.kt-resizer {\n  position: absolute; z-index: 12; top: 0; right: 0; width: 10px; height: 100%;\n  cursor: col-resize; touch-action: none; background: transparent;\n}\n.kt-resizer::after {\n  content: ""; position: absolute; top: 0; right: 3px; width: 1px; height: 100%;\n  background: var(--kt-border, rgba(128,128,128,.24));\n}\n.kt-resizer:hover::after, .kt-resizer[data-dragging="true"]::after {\n  width: 2px; background: var(--kt-accent, var(--dsw-alias-state-business-primary, #4f7cff));\n}\n/* \u53C2\u8003\u89C6\u9891\uFF08\u62CD\u540C\u6B3E\uFF09 */\n.kt-reference { flex: 1; min-height: 0; overflow: auto; display: grid; align-content: start; gap: 12px; padding: 14px 18px 48px; }\n.kt-ref-hero { display: grid; gap: 8px; max-width: 640px; }\n.kt-ref-hero h3 { margin: 0; font-size: 17px; }\n.kt-ref-hero p { margin: 0; color: var(--dsw-alias-label-secondary, #8a8a8a); font-size: 13px; line-height: 1.7; }\n.kt-primary-action { justify-self: start; border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.3)); border-radius: 999px; padding: 4px 14px; background: var(--dsw-alias-state-business-primary, #4f7cff); color: #fff; cursor: pointer; font: 12px/1.5 var(--dsw-font-family, sans-serif); }\n.kt-ref-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; }\n.kt-ref-head > div:first-child { display: grid; gap: 2px; min-width: 0; }\n.kt-ref-head strong { font-size: 14px; }\n.kt-ref-head span { color: var(--kt-muted, #8a8a8a); font-size: 11px; overflow-wrap: anywhere; }\n.kt-ref-actions { display: flex; flex-wrap: wrap; gap: 6px; }\n.kt-ref-actions button { border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.3)); border-radius: 6px; padding: 3px 9px; background: transparent; color: var(--dsw-alias-label-primary, #1d1d1f); cursor: pointer; font: 12px/1.4 var(--dsw-font-family, sans-serif); }\n.kt-ref-actions button:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,.12)); }\n.kt-ref-stats { display: flex; flex-wrap: wrap; align-items: center; gap: 5px; font-size: 11px; color: var(--dsw-alias-label-secondary, #8a8a8a); }\n.kt-ref-stats span { border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.3)); border-radius: 999px; padding: 1px 8px; }\n.kt-ref-stats em { border: 1px solid rgba(79,124,255,.45); border-radius: 999px; color: var(--dsw-alias-state-business-primary, #4f7cff); padding: 1px 8px; font-style: normal; }\n.kt-ref-frames { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 6px; }\n.kt-ref-frames figure { margin: 0; display: grid; gap: 2px; }\n.kt-ref-frames img { width: 100%; aspect-ratio: 16/9; object-fit: cover; border-radius: 6px; background: rgba(0,0,0,.08); }\n.kt-ref-frames figcaption { color: var(--dsw-alias-label-secondary, #8a8a8a); font-size: 10px; text-align: right; }\n.kt-ref-slice { display: flex; gap: 2px; height: 26px; }\n.kt-ref-slice span { display: grid; place-items: center; min-width: 12px; border-radius: 3px; background: rgba(79,124,255,.18); color: var(--dsw-alias-label-secondary, #8a8a8a); font-size: 10px; overflow: hidden; }\n.kt-ref-plans { display: grid; gap: 8px; }\n.kt-ref-plans h4, .kt-ref-rights h4 { margin: 0; font-size: 13px; }\n.kt-ref-plans article { display: grid; gap: 6px; border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.3)); border-radius: 9px; padding: 9px 11px; }\n.kt-ref-plans article.is-chosen { border-color: var(--dsw-alias-state-business-primary, #4f7cff); }\n.kt-ref-plans article header { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }\n.kt-ref-plans article em { color: var(--dsw-alias-state-business-primary, #4f7cff); font-size: 11px; font-style: normal; }\n.kt-ref-plans article p { margin: 0; font-size: 12px; line-height: 1.6; }\n.kt-ref-plans article dl { display: grid; grid-template-columns: 36px 1fr; gap: 2px 6px; margin: 0; font-size: 11px; }\n.kt-ref-plans article dt { color: var(--dsw-state-secondary, #8a8a8a); }\n.kt-ref-plans article dd { margin: 0; }\n.kt-ref-plans article button { justify-self: start; border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.3)); border-radius: 6px; padding: 3px 10px; background: transparent; color: inherit; cursor: pointer; font: 12px/1.4 var(--dsw-font-family, sans-serif); }\n.kt-ref-rights { display: grid; gap: 6px; border-top: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.24)); padding-top: 10px; }\n.kt-ref-rights p { margin: 0; font-size: 12px; line-height: 1.6; color: var(--dsw-alias-label-secondary, #8a8a8a); }\n.kt-ref-url { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }\n.kt-ref-url input { min-width: 220px; flex: 1; min-height: 28px; border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.3)); border-radius: 6px; padding: 2px 8px; background: transparent; color: inherit; font: 12px/1.5 var(--dsw-font-family, sans-serif); }\n.kt-ref-url button { border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.3)); border-radius: 6px; padding: 3px 10px; background: transparent; color: inherit; cursor: pointer; font: 12px/1.4 var(--dsw-font-family, sans-serif); }\n.kt-ref-url button:disabled, .kt-primary-action:disabled { opacity: .45; cursor: default; }\n.kt-ref-frames-wrap { display: grid; gap: 6px; }\n.kt-ref-frames-wrap h4, .kt-ref-transcript h4 { margin: 0; font-size: 13px; }\n.kt-ref-frames figure { cursor: pointer; border: 2px solid transparent; border-radius: 7px; padding: 1px; }\n.kt-ref-frames figure.is-picked { border-color: var(--dsw-alias-state-business-primary, #4f7cff); }\n.kt-ref-transcript { display: grid; gap: 6px; border-top: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.24)); padding-top: 10px; }\n.kt-ref-transcript p { margin: 0; font-size: 12px; line-height: 1.6; }\n.kt-ref-segments { display: grid; gap: 3px; }\n.kt-ref-segments p { display: flex; gap: 8px; color: var(--dsw-alias-label-secondary, #8a8a8a); }\n.kt-ref-segments time { flex: none; color: var(--dsw-alias-state-business-primary, #4f7cff); font: 11px/1.6 ui-monospace, Menlo, monospace; }\n.kt-ref-segments span { color: var(--dsw-alias-label-primary, #1d1d1f); }\n.kt-ref-register { display: grid; gap: 8px; border: 1px dashed var(--dsw-alias-border-l2, rgba(128,128,128,.4)); border-radius: 9px; padding: 10px 12px; background: var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,.06)); }\n.kt-ref-register h4 { margin: 0; font-size: 13px; }\n.kt-ref-register-row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }\n.kt-ref-file { display: inline-flex; align-items: center; border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.35)); border-radius: 6px; padding: 4px 12px; cursor: pointer; font: 12px/1.4 var(--dsw-font-family, sans-serif); }\n.kt-ref-file:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,.12)); }\n.kt-ref-file input { display: none; }\n.kt-ref-empty { display: grid; gap: 10px; }\n.kt-ref-empty .kt-empty { padding: 0; }\n\n.kt-ref-chips { display: flex; flex-wrap: wrap; gap: 4px; }\n.kt-ref-chips span { border: 1px solid rgba(79,124,255,.4); border-radius: 999px; padding: 0 7px; color: var(--dsw-alias-state-business-primary, #4f7cff); font-size: 10px; line-height: 1.7; }\n\n.kt-novel { flex: 1; min-height: 0; overflow: auto; display: grid; align-content: start; gap: 12px; padding: 14px 18px 48px; }\n.kt-novel-hero { display: grid; gap: 8px; max-width: 720px; }\n.kt-novel-hero h3 { margin: 0; font-size: 17px; }\n.kt-novel-hero p { margin: 0; color: var(--dsw-alias-label-secondary, #8a8a8a); font-size: 13px; line-height: 1.7; }\n.kt-novel-form { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 6px; }\n.kt-novel-form input { min-height: 28px; border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.3)); border-radius: 6px; padding: 2px 8px; background: transparent; color: inherit; font: 12px/1.5 var(--dsw-font-family, sans-serif); }\n.kt-novel-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; }\n.kt-novel-head > div:first-child { display: grid; gap: 2px; }\n.kt-novel-head strong { font-size: 14px; }\n.kt-novel-head span { color: var(--dsw-alias-label-secondary, #8a8a8a); font-size: 11px; }\n.kt-novel-stages { display: grid; gap: 4px; }\n.kt-novel-stage { display: flex; align-items: center; gap: 8px; border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.24)); border-radius: 7px; padding: 6px 9px; }\n.kt-novel-stage > div { flex: 1; min-width: 0; display: grid; gap: 1px; }\n.kt-novel-stage strong { font-size: 12px; }\n.kt-novel-stage span { color: var(--dsw-alias-label-secondary, #8a8a8a); font-size: 11px; overflow-wrap: anywhere; }\n.kt-novel-mark { flex: none; width: 16px; text-align: center; color: var(--dsw-alias-label-secondary, #8a8a8a); }\n.kt-novel-stage.is-done .kt-novel-mark { color: #3ea675; }\n.kt-novel-stage.is-missing .kt-novel-mark { color: #d05a5a; }\n.kt-novel-stage button { border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.3)); border-radius: 5px; padding: 1px 8px; background: transparent; color: inherit; cursor: pointer; font: 11px/1.6 var(--dsw-font-family, sans-serif); }\n.kt-novel-diag { display: grid; gap: 4px; border-top: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.24)); padding-top: 10px; }\n.kt-novel-diag h4 { margin: 0; font-size: 13px; }\n.kt-novel-diag ul { margin: 0; padding-left: 18px; display: grid; gap: 2px; font-size: 12px; line-height: 1.6; color: var(--dsw-alias-label-secondary, #8a8a8a); }\n\n.kt-novel-chapters { display: grid; gap: 6px; border-top: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.24)); padding-top: 10px; }\n.kt-novel-chapters-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }\n.kt-novel-chapters-head h4 { margin: 0; font-size: 13px; }\n.kt-novel-chapters-head button { border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.3)); border-radius: 6px; padding: 2px 9px; background: transparent; color: inherit; cursor: pointer; font: 11px/1.6 var(--dsw-font-family, sans-serif); }\n.kt-novel-chapter-list { display: grid; gap: 4px; }\n.kt-novel-chapter { display: flex; align-items: center; gap: 8px; border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.24)); border-radius: 7px; padding: 5px 9px; }\n.kt-novel-chapter > div:first-child { flex: 1; min-width: 0; display: grid; gap: 1px; }\n.kt-novel-chapter strong { font-size: 12px; }\n.kt-novel-chapter span { color: var(--dsw-alias-label-secondary, #8a8a8a); font-size: 11px; }\n.kt-novel-context { margin: 0; max-height: 320px; overflow: auto; border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.24)); border-radius: 7px; padding: 10px; background: var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,.06)); font: 11px/1.6 ui-monospace, Menlo, monospace; white-space: pre-wrap; }\n\n.kt-novel-edit { display: grid; gap: 6px; border-top: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.24)); padding-top: 10px; }\n.kt-novel-edit h4 { margin: 0; font-size: 13px; }\n.kt-novel-world-add, .kt-novel-char-add { display: flex; flex-wrap: wrap; gap: 5px; }\n.kt-novel-world-add select, .kt-novel-world-add input, .kt-novel-char-add input { min-height: 26px; border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.3)); border-radius: 5px; padding: 1px 7px; background: transparent; color: inherit; font: 11px/1.6 var(--dsw-font-family, sans-serif); }\n.kt-novel-world-add input { flex: 1; min-width: 180px; }\n.kt-novel-char-add input { flex: 1; min-width: 90px; }\n.kt-novel-world-add button, .kt-novel-char-add button { border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.3)); border-radius: 5px; padding: 1px 9px; background: transparent; color: inherit; cursor: pointer; font: 11px/1.6 var(--dsw-font-family, sans-serif); }\n.kt-novel-world-list, .kt-novel-char-list { display: grid; gap: 3px; }\n.kt-novel-world-list > div { display: grid; gap: 1px; }\n.kt-novel-world-list strong { font-size: 11px; color: var(--dsw-alias-label-secondary, #8a8a8a); }\n.kt-novel-world-list span, .kt-novel-char-list > div { display: flex; align-items: center; gap: 6px; font-size: 11px; line-height: 1.6; }\n.kt-novel-world-list span button, .kt-novel-char-list button { border: 0; background: transparent; color: var(--dsw-alias-label-secondary, #8a8a8a); cursor: pointer; }\n.kt-novel-char-list > div strong { font-size: 11px; }\n.kt-novel-char-list > div span { flex: 1; color: var(--dsw-alias-label-secondary, #8a8a8a); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n/* \u539F\u751F View \u9875\u7B7E\u884C\u7F3A\u5E2D\u65F6\u7684\u72EC\u7ACB\u9876\u680F\uFF0C\u907F\u514D\u9875\u7B7E\u88AB\u6536\u8FDB\u521B\u4F5C\u53F0\u5DE6\u680F */\n.kt-top-tabs-host { position: sticky; top: 0; z-index: 30; display: flex; align-items: center; min-height: 32px; padding: 0 12px; background: var(--dsw-alias-bg-base, var(--dsw-alias-bg-l1, #fff)); border-bottom: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.24)); }\n.kt-top-tabs-host .kt-header-tabs { display: flex; gap: 32px; align-items: center; }\n[data-conversation-scroll]:has(> [data-slot="conversation.session"] > .kt-surface[data-open="true"]) > [data-composer-seat] > * { background: var(--dsw-alias-bg-base, #fff); }\n/* \u6536\u8D77\u6001\uFF1A\u53EA\u7559\u4E00\u4E2A\u5165\u53E3\uFF0C\u4E0D\u5360\u4F1A\u8BDD\u5934\u9875\u7B7E\u884C */\n.kt-collapsed { position: fixed; right: 18px; bottom: 150px; z-index: 9999; display: flex; align-items: center; }\n.kt-launcher { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--kt-border, rgba(128,128,128,.3)); border-radius: 999px; padding: 4px 12px; background: var(--dsw-alias-bg-base, #fff); color: var(--dsw-alias-label-primary, #1d1d1f); box-shadow: 0 2px 10px rgba(0,0,0,.12); cursor: pointer; font: 12px/1.5 var(--dsw-font-family, system-ui, sans-serif); }\n.kt-launcher b { font-size: 11px; letter-spacing: .04em; color: var(--kt-accent, #4f7cff); }\n.kt-launcher:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,.12)); }\n\n/* \u4E92\u52A8\u6E38\u620F\uFF1A\u9636\u6BB5\u5DE5\u4F5C\u53F0\uFF08\u7B80\u62A5\u8868\u5355 / \u6982\u5FF5\u4E09\u9009\u4E00 / \u6A21\u677F / \u76F2\u6D4B\uFF09\u3002 */\n.kt-stage-workbench { display: flex; flex: 1; min-height: 0; flex-direction: column; gap: 10px; padding: 10px 12px 16px; overflow: auto; }\n.kt-stage-card { display: flex; flex-direction: column; gap: 8px; border: 1px solid var(--kt-border); border-radius: 8px; padding: 10px; }\n.kt-stage-card-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }\n.kt-stage-card-head strong { font-size: 12px; }\n.kt-stage-hint { margin: 0; color: var(--kt-muted); font-size: 11px; line-height: 1.55; }\n.kt-stage-detail { margin: 0; color: var(--kt-muted); font-size: 11px; line-height: 1.6; }\n.kt-link { margin-left: auto; border: 0; background: none; color: var(--kt-accent); padding: 0; font-size: 11px; cursor: pointer; }\n.kt-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }\n.kt-form-row { display: grid; gap: 3px; color: var(--kt-muted); font-size: 11px; }\n.kt-form-wide { grid-column: 1 / -1; }\n.kt-form-row input, .kt-form-row select, .kt-form-row textarea {\n  box-sizing: border-box; width: 100%; padding: 5px 7px; border: 1px solid var(--kt-border); border-radius: 6px;\n  background: transparent; color: var(--kt-primary); font: 12px/1.4 var(--dsw-font-family, sans-serif); resize: vertical;\n}\n.kt-form-row input:focus, .kt-form-row select:focus, .kt-form-row textarea:focus { outline: 1px solid var(--kt-accent); outline-offset: 0; }\n.kt-form-actions { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }\n.kt-form-actions button, .kt-stage-empty button, .kt-concept-card button {\n  border: 1px solid var(--kt-border); border-radius: 6px; background: transparent; color: var(--kt-primary);\n  padding: 5px 10px; font-size: 11px; cursor: pointer;\n}\n.kt-form-actions button:hover, .kt-stage-empty button:hover, .kt-concept-card button:hover { background: var(--kt-hover); }\n.kt-form-actions button.kt-primary { border-color: var(--kt-accent); background: var(--kt-accent); color: #fff; }\n.kt-form-actions button:disabled, .kt-concept-card button:disabled { opacity: .5; cursor: default; }\n.kt-form-error { margin: 0; color: #b3261e; font-size: 11px; line-height: 1.5; }\n.kt-stage-empty { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; }\n.kt-stage-empty p { margin: 0; color: var(--kt-muted); font-size: 11px; }\n.kt-concept-options { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 8px; }\n.kt-concept-card { display: flex; flex-direction: column; gap: 6px; border: 1px solid var(--kt-border); border-radius: 8px; padding: 8px; }\n.kt-concept-card.is-chosen { border-color: var(--kt-accent); box-shadow: inset 0 0 0 1px var(--kt-accent); }\n.kt-concept-card header { display: flex; align-items: baseline; gap: 6px; }\n.kt-concept-card header b { color: var(--kt-accent); font-size: 10px; }\n.kt-concept-card header strong { min-width: 0; overflow: hidden; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }\n.kt-concept-card p { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 4; overflow: hidden; margin: 0; color: var(--kt-muted); font-size: 11px; line-height: 1.55; }\n.kt-qa-prompt {\n  max-height: 140px; overflow: auto; margin: 0; padding: 7px 8px; border: 1px solid var(--kt-border); border-radius: 6px;\n  color: var(--kt-muted); font: 10px/1.6 ui-monospace, SFMono-Regular, Menlo, monospace; white-space: pre-wrap;\n}\n\n/* \u4E92\u52A8\u6E38\u620F\uFF1A\u6784\u5EFA\u5FEB\u7167\u6761\u3002 */\n.kt-snapshot-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 5px; padding: 5px 0; color: var(--kt-muted); font-size: 10px; }\n.kt-snapshot-bar select, .kt-snapshot-bar input {\n  min-width: 0; padding: 4px 6px; border: 1px solid var(--kt-border); border-radius: 6px;\n  background: transparent; color: var(--kt-primary); font: 11px/1.3 var(--dsw-font-family, sans-serif);\n}\n.kt-snapshot-bar input { width: 110px; }\n.kt-snapshot-bar button {\n  border: 1px solid var(--kt-border); border-radius: 6px; background: transparent; color: var(--kt-primary);\n  padding: 4px 8px; font-size: 10px; cursor: pointer;\n}\n.kt-snapshot-bar button:hover { background: var(--kt-hover); }\n.kt-snapshot-bar button:disabled { opacity: .45; cursor: default; }\n\n/* \u4E92\u52A8\u6E38\u620F\uFF1A\u753B\u5E03\u3002 */\n.kt-canvas-wrap { display: flex; flex: 1; min-height: 0; flex-direction: column; }\n.kt-canvas-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 6px 12px; border-bottom: 1px solid var(--kt-border); }\n.kt-canvas-title { font-size: 12px; font-weight: 600; }\n.kt-canvas-meta { color: var(--kt-muted); font-size: 10px; }\n.kt-canvas-tools { display: flex; align-items: center; gap: 5px; margin-left: auto; color: var(--kt-muted); font-size: 10px; }\n.kt-canvas-tools button, .kt-canvas-node button {\n  border: 1px solid var(--kt-border); border-radius: 5px; background: transparent; color: var(--kt-primary);\n  padding: 3px 7px; font-size: 10px; cursor: pointer;\n}\n.kt-canvas-tools button:hover, .kt-canvas-node button:hover { background: var(--kt-hover); }\n.kt-canvas { position: relative; flex: 1; min-height: 340px; overflow: hidden; cursor: grab; background-image: radial-gradient(var(--kt-border) 0.6px, transparent 0.6px); background-size: 16px 16px; }\n.kt-canvas:active { cursor: grabbing; }\n.kt-canvas-world { position: absolute; inset: 0; transform-origin: 0 0; }\n.kt-canvas-lines { position: absolute; inset: 0; stroke: var(--kt-border); stroke-width: 1; }\n.kt-canvas-node {\n  position: absolute; box-sizing: border-box; border: 1px solid var(--kt-border); border-radius: 8px;\n  background: var(--dsw-alias-bg-base, #fff); color: var(--kt-primary); padding: 7px 9px;\n  font: 11px/1.4 var(--dsw-font-family, sans-serif); text-align: left;\n}\nbutton.kt-canvas-node { cursor: pointer; }\nbutton.kt-canvas-node:hover { background: var(--kt-hover); }\n.kt-canvas-stage { display: flex; align-items: center; gap: 7px; }\n.kt-canvas-stage strong, .kt-canvas-doc strong { display: block; font-size: 12px; }\n.kt-canvas-stage em, .kt-canvas-doc em { display: block; overflow: hidden; color: var(--kt-muted); font-size: 10px; font-style: normal; text-overflow: ellipsis; white-space: nowrap; }\n.kt-canvas-stage.is-done { border-color: var(--kt-accent); }\n.kt-canvas-stage.is-partial { border-style: dashed; }\n.kt-canvas-stage.is-skipped { opacity: .5; }\n.kt-canvas-stage.is-optional { border-style: dotted; }\n.kt-canvas-stage.is-next { box-shadow: inset 0 0 0 1px var(--kt-accent); }\n.kt-canvas-dot { color: var(--kt-muted); font-size: 11px; }\n.kt-canvas-doc { display: flex; flex-direction: column; justify-content: center; }\n.kt-canvas-build, .kt-canvas-qa, .kt-canvas-snapshot { display: flex; flex-direction: column; gap: 5px; cursor: default; }\n.kt-canvas-node-head { display: flex; align-items: baseline; justify-content: space-between; gap: 6px; }\n.kt-canvas-node-head em { overflow: hidden; color: var(--kt-muted); font-size: 9px; font-style: normal; text-overflow: ellipsis; white-space: nowrap; }\n.kt-canvas-build code { color: var(--kt-muted); font-size: 10px; }\n.kt-canvas-qa p { margin: 0; color: var(--kt-muted); font-size: 10px; }\n.kt-canvas-qa-actions, .kt-canvas-snapshot-actions { display: flex; flex-wrap: wrap; gap: 5px; }\n.kt-canvas-isolation { font-size: 10px; color: var(--kt-muted); }\n.kt-canvas-isolation.is-isolated { color: #2e7d32; }\n.kt-canvas-isolation.is-same-session { color: #b3261e; }\n.kt-canvas-ok { color: #2e7d32; font-size: 10px; }\n.kt-canvas-warn { color: #b26a00; font-size: 10px; }\n.kt-canvas-hint { padding: 5px 12px; border-top: 1px solid var(--kt-border); color: var(--kt-muted); font-size: 10px; }\n\n\n/* \u4FA7\u8FB9\u680F\u4F1A\u8BDD\u884C\u53F3\u4FA7\u7684 KToon \u5165\u53E3\uFF1A\u4E0D\u4F9D\u8D56\u4F1A\u8BDD\u5934 View \u884C\u3002 */\n.kt-sidebar-entry {\n  display: inline-flex; flex: none; align-items: center; justify-content: center;\n  width: 18px; height: 18px; margin-left: 3px; padding: 0;\n  border: 1px solid transparent; border-radius: 5px;\n  background: var(--dsw-alias-state-business-primary, #4f7cff); color: #fff;\n  font: 700 10px/1 var(--dsw-font-family, system-ui, sans-serif); cursor: pointer; opacity: .9;\n}\n.kt-sidebar-entry:hover { opacity: 1; filter: brightness(1.08); }\n\n/* \u77ED\u5267 Motion \u5951\u7EA6\u9875\u3002 */\n.kt-motion { display: flex; flex: 1; min-height: 0; flex-direction: column; gap: 10px; padding: 10px 12px 16px; overflow: auto; }\n.kt-motion-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; }\n.kt-motion-table { width: 100%; border-collapse: collapse; color: var(--kt-primary); font-size: 11px; }\n.kt-motion-table th, .kt-motion-table td { padding: 4px 6px; border-bottom: 1px solid var(--kt-border); text-align: left; vertical-align: top; }\n.kt-motion-table th { color: var(--kt-muted); font-weight: 600; }\n.kt-motion-list { margin: 0; padding-left: 16px; color: var(--kt-muted); font-size: 11px; line-height: 1.65; }\n.kt-motion-list li { margin: 0 0 2px; }\n\n/* \u672C\u96C6\u7248\u672C\uFF1A\u5C0F\u8F93\u5165\u6846\u4E0E\u591A\u9875\u7B7E\u6A2A\u5411\u6EDA\u52A8\u3002 */\n.kt-form-actions input {\n  min-width: 0; padding: 5px 7px; border: 1px solid var(--kt-border); border-radius: 6px;\n  background: transparent; color: var(--kt-primary); font: 11px/1.4 var(--dsw-font-family, sans-serif);\n}\n.kt-episode-bar .kt-subtabs { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: thin; }\n\n\n/* Hyperframes HTML \u5DE5\u7A0B\u9875\uFF1A\u6E32\u67D3/Studio \u5165\u53E3\uFF0C\u4E0D\u518D\u5185\u5D4C\u81EA\u7814\u65F6\u95F4\u7EBF\u3002 */\n.kt-composition { display: flex; flex: 1; min-height: 0; flex-direction: column; gap: 10px; padding: 10px 12px 16px; overflow: auto; }\n.kt-composition code { padding: 1px 4px; border: 1px solid var(--kt-border); border-radius: 4px; color: var(--kt-primary); font: 10px/1.5 ui-monospace, SFMono-Regular, monospace; }\n\n/* \u5C0F\u8BF4\u7AE0\u8282\uFF1A\u6574\u884C\u53EF\u70B9\u9884\u89C8\uFF0C\u52A8\u4F5C\u533A\u53EF\u6362\u884C\uFF0C\u907F\u514D\u7A84\u5DE5\u4F5C\u53F0\u628A\u6309\u94AE\u6324\u6CA1\u3002 */\n.kt-novel-chapter { cursor: pointer; }\n.kt-novel-chapter:hover { border-color: var(--dsw-alias-state-business-primary, #4f7cff); }\n.kt-novel-chapter-actions { flex-wrap: wrap; justify-content: flex-end; }\n.kt-novel-chapters-head { flex-wrap: wrap; }\n.kt-novel-chapters-head select { border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.3)); border-radius: 6px; background: transparent; color: inherit; font: 11px/1.6 var(--dsw-font-family, sans-serif); padding: 2px 6px; }\n\n/* \u5C0F\u8BF4\u7AE0\u8282\u4FEE\u6539\u610F\u89C1\uFF1A\u884C\u5185\u8F93\u5165\uFF0C\u53D1\u9001\u7ED9 Agent\uFF0C\u4E0D\u76F4\u63A5\u6539\u7A3F\u3002 */\n.kt-novel-chapter-wrap { display: grid; gap: 4px; }\n.kt-novel-comment { display: grid; gap: 5px; padding: 7px 9px; border: 1px dashed var(--dsw-alias-border-l2, rgba(128,128,128,.35)); border-radius: 7px; }\n.kt-novel-comment textarea { min-height: 54px; resize: vertical; border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.3)); border-radius: 6px; padding: 5px 7px; background: transparent; color: inherit; font: 12px/1.6 var(--dsw-font-family, sans-serif); }\n\n/* \u5C0F\u8BF4\u5212\u8BCD\u4FEE\u6539\uFF1A\u9009\u533A\u4E0A\u65B9\u6D6E\u51FA\uFF0C\u8F93\u5165\u53EF\u9009\u8981\u6C42\u540E\u76F4\u63A5\u53D1\u7ED9 Agent\u3002 */\n.kt-markdown-wrap { position: relative; min-height: 0; display: flex; flex: 1; flex-direction: column; }\n.kt-selection-tools { position: fixed; z-index: 60; display: flex; align-items: center; gap: 6px; max-width: min(520px, 92vw); padding: 6px 7px; border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.3)); border-radius: 8px; background: var(--dsw-alias-bg-base, #fff); color: var(--dsw-alias-label-primary, #1b1b1b); box-shadow: 0 8px 28px rgba(0,0,0,.22); font: 12px/1.4 var(--dsw-font-family, sans-serif); }\n.kt-selection-count { flex: none; color: var(--dsw-alias-label-secondary, #777); font-size: 11px; }\n.kt-selection-tools input { min-width: 0; flex: 1; height: 26px; padding: 0 7px; border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.3)); border-radius: 5px; background: transparent; color: inherit; font: 11px/1.4 var(--dsw-font-family, sans-serif); }\n.kt-selection-tools button { flex: none; height: 26px; padding: 0 8px; border: 1px solid var(--dsw-alias-state-business-primary, #4f7cff); border-radius: 5px; background: var(--dsw-alias-state-business-primary, #4f7cff); color: #fff; font: 11px/1 var(--dsw-font-family, sans-serif); cursor: pointer; }\n.kt-selection-tools .kt-selection-close { width: 26px; padding: 0; border-color: var(--dsw-alias-border-l2, rgba(128,128,128,.3)); background: transparent; color: inherit; }\n\n/* \u77ED\u5267/\u6F2B\u5267\uFF1A\u975E\u6807\u51C6\u5DE5\u7A0B\u4E5F\u5148\u5C55\u793A\u6587\u6863\u4E0E\u7D20\u6750\uFF0C\u4E0D\u53EA\u4F9D\u8D56\u5206\u955C\u5361\u7247\u3002 */\n.kt-drama-section { display: grid; gap: 6px; border-top: 1px solid var(--kt-border); padding-top: 10px; margin-top: 10px; }\n.kt-drama-section h3 { margin: 0; font-size: 12px; color: var(--kt-muted); }\n.kt-drama-docs { display: flex; flex-wrap: wrap; gap: 6px; }\n.kt-drama-docs button { border: 1px solid var(--kt-border); border-radius: 6px; padding: 4px 8px; background: transparent; color: var(--kt-primary); font: 11px/1.5 var(--dsw-font-family, sans-serif); cursor: pointer; }\n.kt-asset-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 8px; }\n.kt-asset-card { display: flex; flex-direction: column; gap: 4px; padding: 0; border: 1px solid var(--kt-border); border-radius: 7px; overflow: hidden; background: transparent; color: var(--kt-primary); text-align: left; cursor: pointer; }\n.kt-asset-card img, .kt-asset-card video { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; display: block; background: #111; }\n.kt-asset-card span { padding: 3px 5px 5px; overflow: hidden; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }\n.kt-asset-video { cursor: default; }\n';

// client/src/index.jsx
var name = "dsh-kylin-toon";
var inject = ["slots", "sessions", "conversation"];
function ensureStyles() {
  const id = "kylin-toon-styles";
  const existing = document.getElementById(id);
  if (existing !== null) {
    if (existing.textContent !== styles_default) existing.textContent = styles_default;
    return;
  }
  const element = document.createElement("style");
  element.id = id;
  element.textContent = styles_default;
  document.head.appendChild(element);
}
var WorkbenchBoundary = class extends import_react8.default.Component {
  constructor(props) {
    super(props);
    this.state = { error: void 0 };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    var _a, _b;
    fetch("/kylin-toon/client-status", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId: (_a = this.props.sessionId) != null ? _a : "", stage: "error-boundary", error: String(error), info: String((_b = info == null ? void 0 : info.componentStack) != null ? _b : "").slice(0, 800) })
    }).catch(() => {
    });
    console.error("[dsh-kylin-toon]", error, info);
  }
  render() {
    if (this.state.error !== void 0) {
      return import_react8.default.createElement("div", {
        className: "kt-error",
        role: "alert",
        style: {
          position: "fixed",
          left: "12px",
          bottom: "12px",
          zIndex: 9999,
          maxWidth: "460px",
          padding: "10px 12px",
          border: "1px solid #b3261e",
          borderRadius: "8px",
          background: "#fff4f3",
          color: "#8c1d18",
          fontSize: "12px",
          lineHeight: "1.6",
          boxShadow: "0 6px 24px rgba(0,0,0,.18)"
        }
      }, "KToon \u521B\u4F5C\u53F0\u6E32\u67D3\u5931\u8D25\uFF1A" + String(this.state.error));
    }
    return this.props.children;
  }
};
function Seat({ SessionProvider, renderSlot }) {
  if (typeof renderSlot !== "function" || typeof SessionProvider !== "function") return null;
  return import_react8.default.createElement(SessionProvider, { empty: () => null }, import_react8.default.createElement(WorkbenchBoundary, { sessionId: void 0 }, renderSlot("kylin.toon.workspace", {})));
}
function apply(context) {
  ensureStyles();
  context.slots.inject("shell.overlay", () => {
    const seat = context.slots.register({
      name: "shell.overlay",
      id: "kylin-toon-seat",
      order: -100,
      children: { "kylin.toon.workspace": { kind: "single", scope: "session" } }
    }, Seat);
    const workspace = context.slots.register({
      name: "kylin.toon.workspace",
      inject: (sessionId) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _i;
        try {
          const binding = (_b = (_a = context.sessions) == null ? void 0 : _a.binding) == null ? void 0 : _b.call(_a, sessionId);
          const conversation = (_d = (_c = binding == null ? void 0 : binding.ctx) == null ? void 0 : _c.get) == null ? void 0 : _d.call(_c, "conversation");
          const sidebarRight = (_i = (_h = (_e = context.get) == null ? void 0 : _e.call(context, "sidebarRight")) != null ? _h : (_g = (_f = context.reflect) == null ? void 0 : _f.get) == null ? void 0 : _g.call(_f, "sidebarRight")) != null ? _i : context.sidebarRight;
          return {
            sendPrompt: typeof (conversation == null ? void 0 : conversation.send) === "function" ? (text) => conversation.send(text) : void 0,
            openBrowser: typeof (sidebarRight == null ? void 0 : sidebarRight.openTabIn) === "function" ? (url) => {
              try {
                sidebarRight.openTabIn(sessionId, "browser", { params: { url } });
                return true;
              } catch {
                return false;
              }
            } : typeof (sidebarRight == null ? void 0 : sidebarRight.openTab) === "function" ? (url) => {
              try {
                sidebarRight.openTab("browser", { params: { url } });
                return true;
              } catch {
                return false;
              }
            } : void 0
          };
        } catch {
          return { sendPrompt: void 0, openBrowser: void 0 };
        }
      }
    }, Workbench);
    return [seat, workspace];
  });
}
var index_default = { name, inject, apply };

return module.exports;}});
