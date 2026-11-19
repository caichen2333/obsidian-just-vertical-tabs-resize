import { Notice, Plugin } from "obsidian";

const DEFAULT_WIDTH = 240;
const MIN_WIDTH = 100;
const MAX_WIDTH = 600;
const WIDTH_PROPERTY = "--jvt-tab-width";
const TAB_BARS = ".mod-root .workspace-tab-header-container";

interface HandleEntry {
  handle: HTMLDivElement;
  cleanup: () => void;
}

interface DragState {
  pointerId: number;
  handle: HTMLDivElement;
  startX: number;
  startWidth: number;
  direction: number;
}

export default class JustVerticalTabsResize extends Plugin {
  private width = DEFAULT_WIDTH;
  private bars = new Map<HTMLElement, HandleEntry>();
  private drag: DragState | null = null;
  private saveQueue = Promise.resolve();
  private stopped = false;
  private document!: Document;
  private window!: Window;
  private previousWidth = "";
  private previousPriority = "";
  private frame: number | null = null;
  private observer: MutationObserver | null = null;
  private bodyObserver: MutationObserver | null = null;

  async onload(): Promise<void> {
    const saved: unknown = await this.loadData();
    const storedWidth = saved && typeof saved === "object" && "width" in saved
      ? saved.width : DEFAULT_WIDTH;
    this.width = this.normalizeWidth(storedWidth);
    const workspace = this.app.workspace;
    this.document = workspace.containerEl.ownerDocument;
    this.window = this.document.defaultView!;
    const body = this.document.body;
    this.previousWidth = body.style.getPropertyValue(WIDTH_PROPERTY);
    this.previousPriority = body.style.getPropertyPriority(WIDTH_PROPERTY);
    this.applyWidth(this.width);

    this.registerDomEvent(this.document, "pointermove", (event) => this.moveDrag(event), true);
    this.registerDomEvent(this.document, "pointerup", (event) => this.endDrag(event), true);
    this.registerDomEvent(this.document, "pointercancel", (event) => this.endDrag(event), true);
    this.registerDomEvent(this.window, "blur", () => this.finishDrag());
    this.registerEvent(workspace.on("layout-change", () => this.scheduleSync()));
    workspace.onLayoutReady(() => this.scheduleSync());

    this.observer = new MutationObserver(() => this.scheduleSync());
    this.observer.observe(workspace.containerEl, { childList: true, subtree: true });
    this.bodyObserver = new MutationObserver(() => {
      if (!this.isResizable()) this.finishDrag();
    });
    this.bodyObserver.observe(body, { attributes: true, attributeFilter: ["class"] });

    this.addCommand({
      id: "reset-width",
      name: "Reset tab bar width to 240px",
      callback: () => this.resetWidth(),
    });
    this.syncHandles();
  }

  private normalizeWidth(value: unknown): number {
    if (typeof value !== "number" || !Number.isFinite(value)) return DEFAULT_WIDTH;
    return Math.round(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, value)));
  }

  private isResizable(): boolean {
    const classes = this.document.body.classList;
    return classes.contains("jvt-active") && !classes.contains("jvt-collapse-tab-bar");
  }

  private applyWidth(value: number): void {
    this.width = this.normalizeWidth(value);
    this.document.body.style.setProperty(WIDTH_PROPERTY, `${this.width}px`);
    for (const { handle } of this.bars.values()) {
      handle.setAttribute("aria-valuenow", String(this.width));
    }
  }

  private scheduleSync(): void {
    if (this.stopped || this.frame !== null) return;
    this.frame = this.window.requestAnimationFrame(() => {
      this.frame = null;
      this.syncHandles();
    });
  }

  private syncHandles(): void {
    if (this.stopped) return;
    const currentBars = new Set(this.app.workspace.containerEl.querySelectorAll<HTMLElement>(TAB_BARS));
    for (const [bar, entry] of this.bars) {
      if (!currentBars.has(bar) || entry.handle.parentElement !== bar) {
        if (this.drag?.handle === entry.handle) this.finishDrag();
        entry.cleanup();
        this.bars.delete(bar);
      }
    }
    for (const bar of currentBars) {
      if (!this.bars.has(bar)) this.attachHandle(bar);
    }
  }

  private attachHandle(bar: HTMLElement): void {
    const handle = bar.createDiv();
    handle.className = "jvt-width-resize-handle";
    handle.tabIndex = 0;
    handle.setAttribute("role", "separator");
    handle.setAttribute("aria-orientation", "vertical");
    handle.setAttribute("aria-label", "Resize tab bar");
    handle.setAttribute("aria-valuemin", String(MIN_WIDTH));
    handle.setAttribute("aria-valuemax", String(MAX_WIDTH));
    handle.setAttribute("aria-valuenow", String(this.width));
    handle.title = "Drag to resize. Double-click to restore 240px.";

    const onDown = (event: PointerEvent): void => this.startDrag(event, handle);
    const onLostCapture = (): void => {
      if (this.drag?.handle === handle) this.finishDrag();
    };
    const onDoubleClick = (event: MouseEvent): void => {
      event.preventDefault();
      event.stopPropagation();
      this.resetWidth();
    };
    const onKey = (event: KeyboardEvent): void => {
      if (!this.isResizable() || !["ArrowLeft", "ArrowRight", "Home"].includes(event.key)) return;
      event.preventDefault();
      event.stopPropagation();
      const direction = this.document.body.classList.contains("jvt-side-right") ? -1 : 1;
      const delta = event.key === "ArrowRight" ? 10 : -10;
      this.applyWidth(event.key === "Home" ? DEFAULT_WIDTH : this.width + direction * delta);
      this.persistWidth();
      this.app.workspace.trigger("resize");
    };
    const stopClick = (event: MouseEvent): void => event.stopPropagation();
    handle.addEventListener("pointerdown", onDown);
    handle.addEventListener("lostpointercapture", onLostCapture);
    handle.addEventListener("dblclick", onDoubleClick);
    handle.addEventListener("keydown", onKey);
    handle.addEventListener("click", stopClick);
    const hadClass = bar.classList.contains("jvt-resize-container");
    bar.classList.add("jvt-resize-container");
    this.bars.set(bar, {
      handle,
      cleanup: () => {
        handle.removeEventListener("pointerdown", onDown);
        handle.removeEventListener("lostpointercapture", onLostCapture);
        handle.removeEventListener("dblclick", onDoubleClick);
        handle.removeEventListener("keydown", onKey);
        handle.removeEventListener("click", stopClick);
        handle.remove();
        if (!hadClass) bar.classList.remove("jvt-resize-container");
      },
    });
  }

  private startDrag(event: PointerEvent, handle: HTMLDivElement): void {
    if (event.button !== 0 || !this.isResizable()) return;
    event.preventDefault();
    event.stopPropagation();
    this.finishDrag();
    this.drag = {
      pointerId: event.pointerId,
      handle,
      startX: event.clientX,
      startWidth: this.width,
      direction: this.document.body.classList.contains("jvt-side-right") ? -1 : 1,
    };
    handle.setPointerCapture(event.pointerId);
    this.document.body.classList.add("jvt-width-resizing");
  }

  private moveDrag(event: PointerEvent): void {
    const drag = this.drag;
    if (!drag || event.pointerId !== drag.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    this.applyWidth(drag.startWidth + (event.clientX - drag.startX) * drag.direction);
  }

  private endDrag(event: PointerEvent): void {
    if (!this.drag || event.pointerId !== this.drag.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    this.finishDrag();
  }

  private finishDrag(): void {
    const drag = this.drag;
    if (!drag) return;
    this.drag = null;
    if (drag.handle.hasPointerCapture(drag.pointerId)) {
      drag.handle.releasePointerCapture(drag.pointerId);
    }
    this.document.body.classList.remove("jvt-width-resizing");
    this.persistWidth();
    this.app.workspace.trigger("resize");
  }

  private resetWidth(): void {
    this.finishDrag();
    this.applyWidth(DEFAULT_WIDTH);
    this.persistWidth();
    this.app.workspace.trigger("resize");
  }

  private persistWidth(): void {
    const width = this.width;
    this.saveQueue = this.saveQueue
      .then(() => this.saveData({ width }))
      .catch((error: unknown) => {
        console.error("Just Vertical Tabs Resize: could not save width", error);
        new Notice("Could not save tab bar width. Check your vault's write permissions.");
      });
  }

  onunload(): void {
    this.stopped = true;
    this.observer?.disconnect();
    this.bodyObserver?.disconnect();
    if (this.frame !== null) this.window.cancelAnimationFrame(this.frame);
    this.finishDrag();
    for (const entry of this.bars.values()) entry.cleanup();
    this.bars.clear();
    if (this.previousWidth) {
      this.document.body.style.setProperty(WIDTH_PROPERTY, this.previousWidth, this.previousPriority);
    } else {
      this.document.body.style.removeProperty(WIDTH_PROPERTY);
    }
  }
}
