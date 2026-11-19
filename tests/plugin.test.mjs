import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { JSDOM } from "jsdom";

const bundle = await readFile(new URL("../main.js", import.meta.url), "utf8");

async function fixture({ saved = null, side = "left", previousWidth = "", saveError = false } = {}) {
  const dom = new JSDOM('<body><div class="workspace"><div class="mod-root"><div class="workspace-tabs"><div class="workspace-tab-header-container"></div></div></div></div></body>', { pretendToBeVisual: true });
  const { window } = dom;
  const { document } = window;
  window.HTMLElement.prototype.createDiv = function () {
    return this.appendChild(document.createElement("div"));
  };
  document.body.className = `jvt-active jvt-side-${side}`;
  if (previousWidth) document.body.style.setProperty("--jvt-tab-width", previousWidth, "important");
  const captures = new WeakMap();
  window.HTMLElement.prototype.setPointerCapture = function (id) { captures.set(this, id); };
  window.HTMLElement.prototype.hasPointerCapture = function (id) { return captures.get(this) === id; };
  window.HTMLElement.prototype.releasePointerCapture = function () { captures.delete(this); };
  const writes = [];
  const notices = [];
  const events = new Map();
  const disposers = [];
  const workspace = {
    containerEl: document.querySelector(".workspace"),
    on(name, callback) { events.set(name, callback); return { name }; },
    onLayoutReady(callback) { callback(); },
    trigger() {},
  };
  class Plugin {
    app = { workspace };
    loadData() { return Promise.resolve(saved); }
    async saveData(value) {
      await Promise.resolve();
      if (saveError) throw new Error("Simulated write failure");
      writes.push(structuredClone(value));
    }
    registerDomEvent(target, name, callback, options) {
      target.addEventListener(name, callback, options);
      disposers.push(() => target.removeEventListener(name, callback, options));
    }
    registerEvent() {}
    addCommand() {}
  }
  const module = { exports: {} };
  vm.runInNewContext(bundle, {
    module,
    exports: module.exports,
    require(name) {
      assert.equal(name, "obsidian");
      return { Plugin, Notice: class { constructor(text) { notices.push(text); } } };
    },
    MutationObserver: window.MutationObserver,
    console: { error() {} },
  });
  const plugin = new module.exports.default();
  await plugin.onload();
  const width = () => Number.parseInt(document.body.style.getPropertyValue("--jvt-tab-width"), 10);
  const handle = () => document.querySelector(".jvt-width-resize-handle");
  function pointer(target, name, clientX, pointerId = 1, button = 0) {
    const event = new window.MouseEvent(name, { clientX, button, bubbles: true, cancelable: true });
    Object.defineProperty(event, "pointerId", { value: pointerId });
    target.dispatchEvent(event);
  }
  function key(keyName) {
    handle().dispatchEvent(new window.KeyboardEvent("keydown", { key: keyName, bubbles: true, cancelable: true }));
  }
  async function settle() {
    await new Promise((resolve) => window.setTimeout(resolve, 40));
  }
  function unload() {
    plugin.onunload();
    for (const dispose of disposers) dispose();
  }
  return { dom, window, document, plugin, workspace, writes, notices, width, handle, pointer, key, settle, unload };
}

test("left dragging changes width and saves the final value", async (t) => {
  const f = await fixture();
  t.after(() => { f.unload(); f.window.close(); });
  assert.equal(f.width(), 240);
  f.pointer(f.handle(), "pointerdown", 240);
  f.pointer(f.document, "pointermove", 300);
  assert.equal(f.width(), 300);
  f.pointer(f.document, "pointerup", 300);
  await f.settle();
  assert.equal(f.writes.at(-1).width, 300);
  assert.equal(f.document.body.classList.contains("jvt-width-resizing"), false);
});

test("right dragging reverses direction and clamps widths", async (t) => {
  const f = await fixture({ side: "right" });
  t.after(() => { f.unload(); f.window.close(); });
  f.pointer(f.handle(), "pointerdown", 500);
  f.pointer(f.document, "pointermove", 440);
  assert.equal(f.width(), 300);
  f.pointer(f.document, "pointermove", -1000);
  assert.equal(f.width(), 600);
  f.pointer(f.document, "pointermove", 2000);
  assert.equal(f.width(), 100);
  f.pointer(f.document, "pointercancel", 2000);
  await f.settle();
  assert.equal(f.writes.at(-1).width, 100);
});

test("saved widths restore and malformed settings fall back to 240", async () => {
  for (const [saved, expected] of [[{ width: 315 }, 315], [{ width: 900 }, 600], [{ width: 20 }, 100], [{ width: null }, 240], [{ width: "320" }, 240], [null, 240]]) {
    const f = await fixture({ saved });
    try { assert.equal(f.width(), expected); } finally { f.unload(); f.window.close(); }
  }
});

test("double-click and Home reset while rapid saves retain order", async (t) => {
  const f = await fixture({ saved: { width: 320 } });
  t.after(() => { f.unload(); f.window.close(); });
  f.handle().dispatchEvent(new f.window.MouseEvent("dblclick", { bubbles: true }));
  assert.equal(f.width(), 240);
  f.key("ArrowRight");
  f.key("ArrowRight");
  f.key("ArrowLeft");
  assert.equal(f.width(), 250);
  f.key("Home");
  await f.settle();
  assert.equal(f.width(), 240);
  assert.deepEqual(f.writes.map(({ width }) => width), [240, 250, 260, 250, 240]);
});

test("collapsed or disabled vertical tabs cannot start dragging", async (t) => {
  const f = await fixture();
  t.after(() => { f.unload(); f.window.close(); });
  f.document.body.classList.add("jvt-collapse-tab-bar");
  f.pointer(f.handle(), "pointerdown", 240);
  f.pointer(f.document, "pointermove", 400);
  assert.equal(f.width(), 240);
  f.document.body.classList.remove("jvt-collapse-tab-bar", "jvt-active");
  f.pointer(f.handle(), "pointerdown", 240);
  f.pointer(f.document, "pointermove", 400);
  assert.equal(f.width(), 240);
});

test("unrelated pointers are ignored and lost capture ends the drag", async (t) => {
  const f = await fixture();
  t.after(() => { f.unload(); f.window.close(); });
  f.pointer(f.handle(), "pointerdown", 240, 1);
  f.pointer(f.document, "pointermove", 500, 2);
  assert.equal(f.width(), 240);
  f.pointer(f.document, "pointermove", 280, 1);
  f.handle().dispatchEvent(new f.window.Event("lostpointercapture"));
  f.pointer(f.document, "pointermove", 500, 1);
  await f.settle();
  assert.equal(f.width(), 280);
  assert.equal(f.writes.at(-1).width, 280);
});

test("new split groups receive one handle and removing a dragged group cleans up", async (t) => {
  const f = await fixture();
  t.after(() => { f.unload(); f.window.close(); });
  const group = f.document.createElement("div");
  group.className = "workspace-tab-header-container";
  f.document.querySelector(".mod-root").appendChild(group);
  await f.settle();
  assert.equal(f.document.querySelectorAll(".jvt-width-resize-handle").length, 2);
  f.pointer(group.querySelector(".jvt-width-resize-handle"), "pointerdown", 240);
  group.remove();
  await f.settle();
  assert.equal(f.document.querySelectorAll(".jvt-width-resize-handle").length, 1);
  assert.equal(f.document.body.classList.contains("jvt-width-resizing"), false);
});

test("unloading restores a prior inline width and removes all handles", async () => {
  const f = await fixture({ previousWidth: "275px" });
  f.pointer(f.handle(), "pointerdown", 240);
  f.pointer(f.document, "pointermove", 320);
  f.unload();
  assert.equal(f.width(), 275);
  assert.equal(f.document.body.style.getPropertyPriority("--jvt-tab-width"), "important");
  assert.equal(f.handle(), null);
  assert.equal(f.document.querySelector(".jvt-resize-container"), null);
  assert.equal(f.document.body.classList.contains("jvt-width-resizing"), false);
  f.window.close();
});

test("save failures are reported without an unhandled rejection", async (t) => {
  const f = await fixture({ saveError: true });
  t.after(() => { f.unload(); f.window.close(); });
  f.key("ArrowRight");
  await f.settle();
  assert.equal(f.notices.length, 1);
  assert.match(f.notices[0], /Could not save/);
});
