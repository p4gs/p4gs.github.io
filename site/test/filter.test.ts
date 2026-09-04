/**
 * `site/public/filter.js`, driven for real.
 *
 * THE BUG THIS PINS. filter.js decided "is this repository already listed?" by
 * scanning `table.directory tbody tr[data-name]`. That is correct on the
 * directory page and silently wrong anywhere else: with no table the row list
 * is empty, `exact` can never become true, and the control offers to SCAN a
 * repository that already has a live listing. Moving the search onto the home
 * page — a page with no table — is exactly the move that fires it.
 *
 * The file is a browser IIFE with no module system, so it is executed here
 * against a DOM stub implementing precisely the surface it touches. That is
 * deliberate: a re-implementation of the logic in the test would pass while the
 * shipped file stayed broken.
 */
import { describe, expect, test } from "bun:test";

const SRC = await Bun.file(
  new URL("../public/filter.js", import.meta.url).pathname,
).text();

interface StubEl {
  id: string;
  tag: string;
  attrs: Record<string, string>;
  textContent: string;
  hidden: boolean;
  disabled: boolean;
  checked: boolean;
  value: string;
  style: { display: string };
  children: StubEl[];
  listeners: Record<string, Array<() => void>>;
  getAttribute(k: string): string | null;
  setAttribute(k: string, v: string): void;
  addEventListener(k: string, fn: () => void): void;
  appendChild(c: StubEl): void;
  fire(k: string): void;
}

function el(id: string, attrs: Record<string, string> = {}, tag = "div"): StubEl {
  const e: StubEl = {
    id,
    tag,
    attrs,
    textContent: "",
    hidden: false,
    disabled: false,
    checked: false,
    value: "",
    style: { display: "" },
    children: [],
    listeners: {},
    getAttribute: (k) => (k in e.attrs ? e.attrs[k]! : null),
    setAttribute: (k, v) => {
      e.attrs[k] = v;
    },
    addEventListener: (k, fn) => {
      (e.listeners[k] ??= []).push(fn);
    },
    appendChild: (c) => {
      e.children.push(c);
    },
    fire: (k) => (e.listeners[k] ?? []).forEach((fn) => fn()),
  };
  return e;
}

interface Harness {
  input: StubEl;
  scan: StubEl;
  found: StubEl;
  foundLink: StubEl;
  count: StubEl;
  cta: StubEl;
  status: StubEl;
  /** What `window.open` was called with, in order. */
  opened: string[];
  /** The feature strings passed to `window.open`. */
  openFeatures: string[];
  /** Handles `window.open` handed back, so the test can inspect `opener`. */
  openedHandles: Array<{ closed: boolean; opener: unknown }>;
  type(text: string): void;
  /** Press "Scan now". */
  clickScan(): void;
  /** The status line as a reader sees it: text plus any link it carries. */
  statusText(): string;
  statusLink(): { href: string; text: string } | null;
}

/**
 * How `window.open` behaves for a run.
 *
 * `blocked` is the case the shipped code could not previously detect: the
 * popup attempt happens two promise hops inside a `.catch()`, long after the
 * click that started it, which is exactly the shape browsers block.
 * `blocked-closed` is the other real blocker behaviour — hand back a window
 * and close it in the same tick.
 */
type PopupMode = "allowed" | "blocked" | "blocked-closed" | "throws";

/**
 * A page carrying the search control. `listed` becomes the embedded JSON index
 * (the home page's shape); `rows` become directory table rows (the directory's
 * shape). Both together is the third case: they must agree.
 */
function mount(opts: {
  listed?: string[];
  rows?: string[];
  malformedIndex?: boolean;
  /** Pre-filled issue-form base URL; "" (the default) means none configured. */
  fallback?: string;
  /** Scan-intake relay endpoint; "" (the default) means the relay is off. */
  api?: string;
  popup?: PopupMode;
  fetchImpl?: (url: string, init?: unknown) => Promise<unknown>;
}): Harness {
  const input = el("dir-filter", {}, "input");
  const scan = el("dir-scan", {
    "data-api": opts.api ?? "",
    "data-fallback": opts.fallback ?? "",
  });
  const cta = el("dir-scan-cta", {}, "button");
  const status = el("dir-scan-status");
  const found = el("dir-found", { "data-detail-base": "/sscsb/directory/" });
  const foundLink = el("dir-found-link", { href: "/sscsb/directory/" }, "a");
  const count = el("dir-count");
  const index = el("dir-index", {}, "script");
  index.textContent = opts.malformedIndex
    ? "{not json"
    : JSON.stringify(opts.listed ?? []);

  const rows: StubEl[] = (opts.rows ?? []).map((name) =>
    el("", { "data-name": name, "data-complete": "1", "data-coverage": "80", "data-grade": "A" }, "tr"),
  );
  const tbody = el("", {}, "tbody");

  const byId: Record<string, StubEl> = {
    "dir-filter": input,
    "dir-scan": scan,
    "dir-scan-cta": cta,
    "dir-scan-status": status,
    "dir-found": found,
    "dir-found-link": foundLink,
    "dir-count": count,
    "dir-index": index,
  };
  if (!opts.listed && !opts.malformedIndex) delete byId["dir-index"];

  const document = {
    getElementById: (id: string) => byId[id] ?? null,
    querySelector: (sel: string) =>
      sel.includes("tbody") && rows.length ? tbody : null,
    querySelectorAll: (sel: string) => (sel.includes("tbody tr") ? rows : []),
    createElement: (tag: string) => el("", {}, tag),
  };
  const location = { search: "" };
  const opened: string[] = [];
  const mode: PopupMode = opts.popup ?? "blocked";
  const openFeatures: string[] = [];
  const openedHandles: Array<{ closed: boolean; opener: unknown }> = [];
  const win = {
    open: (url: string, _target?: string, features?: string) => {
      opened.push(url);
      openFeatures.push(features ?? "");
      if (mode === "throws") throw new Error("popup blocked");
      if (mode === "blocked") return null;
      if (mode === "blocked-closed") return { closed: true, opener: win };
      const handle = { closed: false, opener: win as unknown };
      openedHandles.push(handle);
      return handle;
    },
  };
  // filter.js is an IIFE that reads these as globals.
  new Function("document", "window", "location", "fetch", SRC)(
    document,
    win,
    location,
    opts.fetchImpl ?? (() => Promise.reject(new Error("no network in this test"))),
  );
  return {
    input, scan, found, foundLink, count, cta, status, opened, openFeatures, openedHandles,
    type(text: string) {
      input.value = text;
      input.fire("input");
    },
    clickScan() {
      cta.fire("click");
    },
    statusText() {
      return status.textContent;
    },
    statusLink() {
      // setStatus() assigns .href/.textContent as PROPERTIES on the created
      // element, which is what a real anchor does too.
      const a = status.children[0] as (StubEl & { href?: string }) | undefined;
      return a ? { href: a.href ?? "", text: a.textContent } : null;
    },
  };
}

/** A GitHub lookup that says "this repository exists". */
function repoExists(): (url: string) => Promise<unknown> {
  return (url: string) => {
    if (url.startsWith("https://api.github.com/repos/")) {
      return Promise.resolve({ status: 200, ok: true });
    }
    return Promise.reject(new Error(`unexpected fetch: ${url}`));
  };
}

/** Let the promise chain inside requestScan() settle. */
const settle = () => new Promise((r) => setTimeout(r, 0));

describe("the already-listed check works without a directory table", () => {
  /**
   * The regression itself. Before the fix this asserted the opposite outcome:
   * scan.hidden === false for a repository that is already in the directory.
   */
  test("a listed repository does NOT get offered a scan on a table-less page", () => {
    const h = mount({ listed: ["p4gs/sscs-bootstrapper", "p4gs/sscsb-action"] });
    h.type("p4gs/sscs-bootstrapper");
    expect(h.scan.hidden).toBe(true);
    expect(h.found.hidden).toBe(false);
    expect(h.foundLink.getAttribute("href")).toBe(
      "/sscsb/directory/p4gs--sscs-bootstrapper/",
    );
  });

  test("an unlisted repository still gets offered a scan", () => {
    const h = mount({ listed: ["p4gs/sscs-bootstrapper"] });
    h.type("torvalds/linux");
    expect(h.scan.hidden).toBe(false);
    expect(h.scan.getAttribute("data-slug")).toBe("torvalds/linux");
    expect(h.found.hidden).toBe(true);
  });

  test("the match is case-insensitive in both directions", () => {
    const h = mount({ listed: ["p4gs/sscs-bootstrapper"] });
    h.type("P4GS/SSCS-Bootstrapper");
    expect(h.scan.hidden).toBe(true);
    expect(h.found.hidden).toBe(false);
  });

  test("a full GitHub URL resolves to the same listing", () => {
    const h = mount({ listed: ["p4gs/sscs-bootstrapper"] });
    h.type("https://github.com/p4gs/sscs-bootstrapper");
    expect(h.scan.hidden).toBe(true);
  });

  test("text that is not a repository slug offers nothing at all", () => {
    const h = mount({ listed: ["p4gs/sscs-bootstrapper"] });
    h.type("supply chain");
    expect(h.scan.hidden).toBe(true);
    expect(h.found.hidden).toBe(true);
  });
});

describe("the directory page keeps working from its rows alone", () => {
  test("no index element, rows only — a listed repository is recognised", () => {
    const h = mount({ rows: ["p4gs/sscs-bootstrapper"] });
    h.type("p4gs/sscs-bootstrapper");
    expect(h.scan.hidden).toBe(true);
  });

  test("rows and index together are unioned, not fought over", () => {
    const h = mount({ rows: ["a/one"], listed: ["b/two"] });
    h.type("a/one");
    expect(h.scan.hidden).toBe(true);
    h.type("b/two");
    expect(h.scan.hidden).toBe(true);
    h.type("c/three");
    expect(h.scan.hidden).toBe(false);
  });

  test("the count is reported from rows, and stays silent on a page with none", () => {
    const withRows = mount({ rows: ["a/one", "b/two"] });
    withRows.type("");
    expect(withRows.count.textContent).toBe("2 listings");

    // A table-less page used to report "0 listings" beside a directory that
    // demonstrably has some.
    const noRows = mount({ listed: ["a/one", "b/two"] });
    noRows.type("");
    expect(noRows.count.textContent).toBe("");
  });
});

/**
 * THE BUG THIS PINS. The scan CTA's last-resort path opens a pre-filled issue
 * form in a popup. `fallback()` called `window.open`, THREW AWAY the returned
 * handle, and returned the URL string; the catch handler then branched on that
 * string. So the status line read "One more click: a pre-filled scan request
 * just opened in a popup — press 'Submit new issue' there" whether or not
 * anything had opened, and structurally could not tell the difference.
 *
 * It matters because the open happens two promise hops inside a `.catch()`,
 * long after the click that started it — precisely the shape browsers block.
 * The common case was a reader being told to press a button in a window that
 * did not exist.
 */
describe("the fallback popup says what actually happened", () => {
  const FORM = "https://github.com/p4gs/p4gs.github.io/issues/new?template=scan-request.yml";

  async function submit(popup: PopupMode, fallback = FORM) {
    const h = mount({
      listed: ["p4gs/sscs-bootstrapper"],
      fallback,
      api: "", // relay off → the unconfigured path → the popup fallback
      popup,
      fetchImpl: repoExists(),
    });
    h.type("torvalds/linux");
    h.clickScan();
    await settle();
    return h;
  }

  test("it tries to open the pre-filled form for the typed repository", async () => {
    const h = await submit("allowed");
    expect(h.opened.length).toBe(1);
    expect(h.opened[0]).toContain("template=scan-request.yml");
    expect(h.opened[0]).toContain(encodeURIComponent("https://github.com/torvalds/linux"));
    expect(h.opened[0]).toContain(encodeURIComponent("[scan] torvalds/linux"));
  });

  test("popup ALLOWED: it may say the popup opened, and still offers the link", async () => {
    const h = await submit("allowed");
    expect(h.statusText()).toContain("just opened in a popup");
    expect(h.statusLink()?.href).toBe(h.opened[0]!);
  });

  /**
   * The second half of the same defect, found by driving real Chrome. Passing
   * "noopener" makes `window.open` return null BY SPECIFICATION — that is the
   * whole point of it — so a SUCCESSFUL open is indistinguishable from a
   * blocked one. Measured live: with "noopener" the return was null while a
   * GitHub tab demonstrably opened. Keeping it would have swapped "always
   * claims it opened" for "always claims it was blocked".
   */
  test("the feature string omits `noopener`, because it would null the handle", async () => {
    const h = await submit("allowed");
    expect(h.openFeatures[0]).not.toContain("noopener");
    expect(h.openFeatures[0]).toContain("width=");
  });

  test("the isolation noopener would have given is restored on the handle", async () => {
    const h = await submit("allowed");
    // The opened window must not keep a reference back to this page.
    expect(h.openedHandles.length).toBe(1);
    expect(h.openedHandles[0]!.opener).toBeNull();
  });

  test("the link path keeps rel=noopener — nothing is given up there", async () => {
    const h = await submit("blocked");
    const a = h.status.children[0] as unknown as { rel?: string; target?: string };
    expect(a.rel).toBe("noopener");
    expect(a.target).toBe("_blank");
  });

  test("popup BLOCKED (null): it says so, and hands over a link instead", async () => {
    const h = await submit("blocked");
    // The claim it could not substantiate must not appear.
    expect(h.statusText()).not.toContain("just opened in a popup");
    expect(h.statusText().toLowerCase()).toContain("blocked");
    // A link the reader clicks themselves IS a user gesture, so it cannot be
    // blocked in turn. This is the real path out.
    const link = h.statusLink();
    expect(link).not.toBeNull();
    expect(link!.href).toBe(h.opened[0]!);
    expect(link!.text.length).toBeGreaterThan(0);
  });

  test("popup BLOCKED (handed back already-closed): treated the same", async () => {
    const h = await submit("blocked-closed");
    expect(h.statusText()).not.toContain("just opened in a popup");
    expect(h.statusText().toLowerCase()).toContain("blocked");
    expect(h.statusLink()?.href).toBe(h.opened[0]!);
  });

  test("popup THROWS: treated as blocked rather than crashing the handler", async () => {
    const h = await submit("throws");
    expect(h.statusText().toLowerCase()).toContain("blocked");
    expect(h.statusLink()?.href).toContain("template=scan-request.yml");
    // The button comes back either way — a dead disabled button is its own bug.
    expect(h.cta.disabled).toBe(false);
  });

  test("no fallback form configured: it claims nothing at all", async () => {
    const h = await submit("blocked", "");
    expect(h.opened.length).toBe(0);
    expect(h.statusText()).toBe("The scan service isn't available right now. ");
    expect(h.statusLink()).toBeNull();
  });

  test("the button is re-enabled on every one of these paths", async () => {
    for (const mode of ["allowed", "blocked", "blocked-closed", "throws"] as PopupMode[]) {
      const h = await submit(mode);
      expect(h.cta.disabled, mode).toBe(false);
    }
  });
});

describe("a broken index must not take the search box down with it", () => {
  test("malformed JSON degrades to scan-offered, not to a dead page", () => {
    const h = mount({ malformedIndex: true });
    h.type("p4gs/sscs-bootstrapper");
    expect(h.scan.hidden).toBe(false);
    expect(h.input.value).toBe("p4gs/sscs-bootstrapper");
  });
});
