/**
 * The design switcher's remember-and-redirect script, executed for real.
 *
 * THE BUG THIS PINS. The script used to remember the current design on LOAD:
 *
 *     if (here !== def) { localStorage.setItem(KEY, here); }
 *
 * running on every page view, not on any click. So merely VIEWING one alternate
 * page once — following a link someone shared, opening a search result, poking
 * at the trial — silently made that design permanent, and every later visit to
 * the canonical `/sscsb/` redirected away from the default the site had chosen.
 * A visit is not a choice. The site's default design could be defeated forever
 * by a single page view, and there was no obvious way back.
 *
 * The script is a browser IIFE inside a `<script>` tag, so it is extracted from
 * the real `switcherFor()` output and run against a DOM/localStorage stub
 * implementing exactly the surface it touches. Re-implementing the logic here
 * would pass while the shipped page stayed broken.
 */
import { describe, expect, test } from "bun:test";
import { switcherFor } from "../src/build";
import { BASE_PATH, STAY_PARAM } from "../src/config";
import { DEFAULT_DESIGN, DESIGNS } from "../src/designs/registry";

const ALT = DESIGNS.find((d) => d.id !== DEFAULT_DESIGN.id)!;

function scriptOf(html: string): string {
  const m = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!m) throw new Error("switcherFor emitted no script");
  return m[1]!;
}

interface Link {
  design: string;
  href: string;
  click(): void;
}

interface Run {
  /** What localStorage holds after the load (and any clicks). */
  stored: string | null;
  /** The URL location.replace() was called with, or null if it never was. */
  redirectedTo: string | null;
  links: Link[];
  link(design: string): Link;
}

/**
 * Load one switcher-bearing page in a stub browser.
 *
 * `stored` is what localStorage holds when the page loads; `search` is the
 * query string on the URL being loaded.
 */
function load(opts: {
  design: (typeof DESIGNS)[number];
  subpath?: string;
  stored?: string | null;
  search?: string;
  storageThrows?: boolean;
}): Run {
  const html = switcherFor(opts.design, opts.subpath ?? "");
  let stored: string | null = opts.stored ?? null;
  let redirectedTo: string | null = null;

  const anchors = [...html.matchAll(/<a data-design="([^"]+)" href="([^"]+)"/g)].map(
    ([, design, href]) => ({
      design: design!,
      href: href!,
      listeners: [] as Array<(this: unknown) => void>,
    }),
  );

  const storage = {
    getItem: (k: string) => {
      if (opts.storageThrows) throw new Error("storage disabled");
      return k === "sscsb-design" ? stored : null;
    },
    setItem: (k: string, v: string) => {
      if (opts.storageThrows) throw new Error("storage disabled");
      if (k === "sscsb-design") stored = v;
    },
    removeItem: (k: string) => {
      if (opts.storageThrows) throw new Error("storage disabled");
      if (k === "sscsb-design") stored = null;
    },
  };

  const elFor = (design: string) => {
    const a = anchors.find((x) => x.design === design);
    if (!a) return null;
    return {
      getAttribute: (k: string) =>
        k === "href" ? a.href : k === "data-design" ? a.design : null,
      addEventListener: (_k: string, fn: () => void) => a.listeners.push(fn),
    };
  };

  const document = {
    querySelector: (sel: string) => {
      const m = sel.match(/data-design="([^"]+)"/);
      return m ? elFor(m[1]!) : null;
    },
    querySelectorAll: () => anchors.map((a) => elFor(a.design)!),
  };
  const location = {
    search: opts.search ?? "",
    replace: (url: string) => {
      redirectedTo = url;
    },
  };

  new Function("document", "location", "localStorage", scriptOf(html))(
    document,
    location,
    storage,
  );

  const links: Link[] = anchors.map((a) => ({
    design: a.design,
    href: a.href,
    click: () => a.listeners.forEach((fn) => fn.call(elFor(a.design))),
  }));
  return {
    get stored() {
      return stored;
    },
    get redirectedTo() {
      return redirectedTo;
    },
    links,
    link: (d) => links.find((l) => l.design === d)!,
  };
}

describe("viewing a page never changes the remembered design", () => {
  /** The regression itself. Before the fix this stored ALT's id. */
  test("loading an alternate design by URL writes nothing", () => {
    const r = load({ design: ALT });
    expect(r.stored).toBeNull();
    expect(r.redirectedTo).toBeNull();
  });

  test("loading the default writes nothing either", () => {
    const r = load({ design: DEFAULT_DESIGN });
    expect(r.stored).toBeNull();
    expect(r.redirectedTo).toBeNull();
  });

  test("a stored preference survives a view of a DIFFERENT alternate", () => {
    const third = DESIGNS.find((d) => d.id !== DEFAULT_DESIGN.id && d.id !== ALT.id)!;
    const r = load({ design: third, stored: ALT.id });
    expect(r.stored).toBe(ALT.id);
  });
});

describe("clicking the switcher is the only thing that chooses", () => {
  test("clicking an alternate stores it", () => {
    const r = load({ design: DEFAULT_DESIGN });
    r.link(ALT.id).click();
    expect(r.stored).toBe(ALT.id);
  });

  test("clicking the default FORGETS the choice, rather than storing the default", () => {
    // Storing "ledger" would work too, but leaving a stale key behind means a
    // future change of default silently strands everyone on the old one.
    const r = load({ design: ALT, stored: ALT.id });
    r.link(DEFAULT_DESIGN.id).click();
    expect(r.stored).toBeNull();
  });

  test("the default's own link carries the opt-out, so it cannot be bounced", () => {
    const r = load({ design: ALT });
    expect(r.link(DEFAULT_DESIGN.id).href).toBe(`${BASE_PATH}?${STAY_PARAM}`);
  });

  test("alternate links point at the equivalent page in their own tree", () => {
    const r = load({ design: DEFAULT_DESIGN, subpath: "directory/" });
    expect(r.link(ALT.id).href).toBe(`${BASE_PATH}_d/${ALT.id}/directory/`);
    expect(r.link(DEFAULT_DESIGN.id).href).toBe(
      `${BASE_PATH}directory/?${STAY_PARAM}`,
    );
  });
});

describe("the redirect on the canonical tree", () => {
  test("a first-time visitor gets the default — nothing stored, no redirect", () => {
    const r = load({ design: DEFAULT_DESIGN, stored: null });
    expect(r.redirectedTo).toBeNull();
  });

  test("a stored alternate redirects the canonical page once", () => {
    const r = load({ design: DEFAULT_DESIGN, stored: ALT.id, subpath: "directory/" });
    expect(r.redirectedTo).toBe(`${BASE_PATH}_d/${ALT.id}/directory/`);
  });

  test("the opt-out parameter both suppresses the redirect AND forgets the choice", () => {
    const r = load({
      design: DEFAULT_DESIGN,
      stored: ALT.id,
      search: `?${STAY_PARAM}`,
    });
    expect(r.redirectedTo).toBeNull();
    expect(r.stored).toBeNull();
  });

  test("the opt-out is an exact parameter, not a substring of the query", () => {
    // `indexOf("stay")` matched any query containing those letters, so a
    // perfectly ordinary search silently disabled the feature.
    const r = load({
      design: DEFAULT_DESIGN,
      stored: ALT.id,
      search: "?q=homestay",
    });
    expect(r.redirectedTo).toBe(`${BASE_PATH}_d/${ALT.id}/`);
    expect(r.stored).toBe(ALT.id);
  });

  test("a stored design that no longer exists is forgotten, not followed", () => {
    const r = load({ design: DEFAULT_DESIGN, stored: "brutalist" });
    expect(r.redirectedTo).toBeNull();
    expect(r.stored).toBeNull();
  });

  test("an alternate page never redirects, whatever is stored", () => {
    const r = load({ design: ALT, stored: DEFAULT_DESIGN.id });
    expect(r.redirectedTo).toBeNull();
  });

  test("storage that throws leaves a working page rather than a blank one", () => {
    // Private windows and blocked site data both do this.
    const r = load({ design: DEFAULT_DESIGN, storageThrows: true });
    expect(r.redirectedTo).toBeNull();
    expect(r.links.length).toBe(DESIGNS.length);
  });
});

describe("what the crawler sees", () => {
  test("the switcher is links first — the script only ever adds behaviour", () => {
    const html = switcherFor(ALT, "methodology/");
    const withoutScript = html.replace(/<script>[\s\S]*?<\/script>/, "");
    for (const d of DESIGNS) {
      expect(withoutScript).toContain(`data-design="${d.id}"`);
    }
    // No script, no redirect: the default tree is what a crawler indexes.
    expect(withoutScript).not.toContain("location.replace");
  });
});
