// Directory search + single-click scan intake — vanilla, no dependencies.
//
// Contract (every design renders these):
//   #dir-filter      search input, doubles as the scan-submission field
//   #dir-scan        hidden container revealed when the query is a repo slug
//                    with no exact directory entry; carries:
//                      data-api      scan-intake relay endpoint ("" = disabled)
//                      data-fallback pre-filled GitHub issue-form URL
//   #dir-scan-cta    the "Scan now" button inside #dir-scan
//   #dir-scan-status aria-live status line inside #dir-scan
//   table.directory tbody tr[data-name="owner/repo"] — the rows, each also
//                    carrying data-grade, data-lane, data-coverage (number),
//                    data-scanned (YYYY-MM-DD) and data-complete ("1"/"0")
//
// Optional (a design that omits them keeps the original behaviour exactly):
//   #dir-sort        <select> with values: grade | coverage | name | scanned
//   #dir-incomplete  checkbox — show only listings below the coverage floor
//   #dir-count       element whose textContent is set to "N of M shown"
//   #dir-index       <script type="application/json"> holding every listed slug
//                    as an array of lowercase "owner/repo" strings
//   #dir-found       hidden container revealed when the query names a repo that
//                    IS listed; carries data-detail-base — the directory prefix
//                    as a PATH ("/sscsb/directory/"), never an absolute URL: a
//                    prefix that names a scheme is refused, and the panel then
//                    stays hidden rather than showing a link built from it
//   #dir-found-link  the anchor inside it, pointed at that listing
//
// WHY #dir-index EXISTS. "Is this repository already listed?" used to be
// answered by scanning the table's rows — which is correct on the directory
// page and silently wrong anywhere else. On a page with no table the row list
// is empty, no query can ever match, and the control offers to SCAN a
// repository that already has a live listing. The home page is exactly that
// page. So the known-slug set is the UNION of the rendered rows and this
// index: the directory keeps working from its rows alone, the home page works
// from its index alone, and a page carrying both agrees with itself.
(function () {
  var input = document.getElementById("dir-filter");
  if (!input) return;
  var tbody = document.querySelector("table.directory tbody");
  var rows = Array.prototype.slice.call(document.querySelectorAll("table.directory tbody tr"));
  var scan = document.getElementById("dir-scan");
  var found = document.getElementById("dir-found");
  var foundLink = document.getElementById("dir-found-link");
  // Every slug this site lists, lowercase, from both sources.
  var listed = {};
  rows.forEach(function (tr) {
    var n = (tr.getAttribute("data-name") || "").toLowerCase();
    if (n) listed[n] = true;
  });
  var indexEl = document.getElementById("dir-index");
  if (indexEl) {
    try {
      var parsed = JSON.parse(indexEl.textContent || "[]");
      if (parsed && parsed.length) {
        for (var i = 0; i < parsed.length; i++) {
          if (typeof parsed[i] === "string") listed[parsed[i].toLowerCase()] = true;
        }
      }
    } catch (e) {
      /* a malformed index must not take the search box down with it */
    }
  }
  var cta = document.getElementById("dir-scan-cta");
  var status = document.getElementById("dir-scan-status");
  var sortSel = document.getElementById("dir-sort");
  var onlyIncomplete = document.getElementById("dir-incomplete");
  var count = document.getElementById("dir-count");

  var GRADE_ORDER = { "A+": 0, A: 1, B: 2, C: 3, D: 4, F: 5, NA: 6 };

  function num(tr, attr) {
    var v = parseFloat(tr.getAttribute(attr));
    return isNaN(v) ? -1 : v;
  }

  // Sorting reorders the tbody itself so the DOM order matches what is read
  // out; "grade" restores the server-rendered order (grade, then coverage).
  function applySort() {
    if (!sortSel || !tbody) return;
    var mode = sortSel.value;
    var sorted = rows.slice().sort(function (a, b) {
      if (mode === "coverage") return num(b, "data-coverage") - num(a, "data-coverage");
      if (mode === "name") {
        return (a.getAttribute("data-name") || "") < (b.getAttribute("data-name") || "") ? -1 : 1;
      }
      if (mode === "scanned") {
        return (b.getAttribute("data-scanned") || "") < (a.getAttribute("data-scanned") || "") ? -1 : 1;
      }
      var g =
        (GRADE_ORDER[a.getAttribute("data-grade")] === undefined ? 9 : GRADE_ORDER[a.getAttribute("data-grade")]) -
        (GRADE_ORDER[b.getAttribute("data-grade")] === undefined ? 9 : GRADE_ORDER[b.getAttribute("data-grade")]);
      if (g !== 0) return g;
      return num(b, "data-coverage") - num(a, "data-coverage");
    });
    sorted.forEach(function (tr) {
      tbody.appendChild(tr);
    });
  }

  // Mirrors extractSlug() in src/scan/parse-request.ts (owner/repo or GitHub URL).
  function parseSlug(text) {
    var m = text.trim().match(
      /^(?:(?:https?:\/\/)?(?:www\.)?github\.com\/)?([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))\/([A-Za-z0-9._-]{1,100}?)(?:\.git)?\/?$/
    );
    if (!m || m[2] === "." || m[2] === "..") return null;
    return m[1] + "/" + m[2];
  }

  // ── Anything that becomes a URL ────────────────────────────────────────────
  //
  // An href is one of the last places in a modern page where a plain string
  // still executes: `javascript:…` runs on click, and `data:text/html,…` opens
  // a document with its own script. Two of the URLs this file hands to the DOM
  // come from outside it — `data-fallback` is an attribute on the page, and
  // `issue_url` is a field in a JSON body from the scan relay — so neither is
  // this file's to vouch for. `safeHref` is the one gate they both pass
  // through: an absolute http(s) URL comes back normalised, everything else
  // comes back null and the caller shows the message without a link.
  function safeHref(url) {
    if (!url) return null;
    var parsed;
    try {
      parsed = new URL(String(url));
    } catch (e) {
      return null; // relative, malformed, or not a URL at all
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.href;
  }

  // Building the listing link.
  //
  // Two DOM-supplied strings meet in this href: the slug the visitor typed and
  // the `data-detail-base` prefix the page carries. Neither is interpolated
  // into it.
  //
  // WHY parseSlug IS NOT ENOUGH ON ITS OWN. Its allowlist is strict, and
  // nothing it can return today is dangerous in an href. But that is a claim
  // about the CURRENT regex, made in a different function, three call sites
  // away from the DOM write — precisely the kind of reasoning that stops being
  // true the first time someone widens the pattern to accept a host, a query
  // string or a percent escape, and nothing near the write would notice. The
  // guarantee is therefore made HERE, where the write happens.
  //
  // HOW. Every character of the finished path is re-emitted from a literal
  // alphabet in this file: each input character is looked up in the alphabet,
  // and the character appended is the one taken back OUT of the alphabet
  // constant — never the one that came in. Anything outside the alphabet makes
  // the whole path null. So the string handed to setAttribute is built from
  // characters in this source file and cannot contain `:`, `%`, `?`, `#`, `<`,
  // `>`, a quote, a backslash or whitespace, whatever the inputs were.
  //
  // Three checks sit on top of that, because a string can be entirely inside
  // the alphabet and still not be a place on this site — "//evil.example/" and
  // "/sscsb/directory/../../" both are:
  //   - a leading "//" (protocol-relative) is refused outright,
  //   - no path segment may be "." or ".." — a prefix is a place, not a walk,
  //     and the origin check below cannot see a traversal because the result of
  //     one is still on this origin, and
  //   - the finished path is resolved against the current document and must
  //     land on this origin.
  // Resolution is a CHECK ONLY. What gets assigned is the alphabet-built path,
  // so nothing derived from location.href reaches the DOM either.
  var SEGMENT_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789._-";
  var BASE_CHARS =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789._-/";

  function fromAlphabet(text, alphabet) {
    var out = "";
    for (var i = 0; i < text.length; i++) {
      var at = alphabet.indexOf(text.charAt(i));
      if (at === -1) return null;
      out += alphabet.charAt(at);
    }
    return out;
  }

  function listingPath(base, slug) {
    // Exactly one "/" separates owner from repo. Splitting on it and REFUSING
    // anything else is what the old `slug.replace("/", "--")` only looked like
    // it did: replace() without /g rewrites the FIRST slash and leaves every
    // other one in place, so a two-slash value would have walked a directory
    // level out of the listing prefix rather than being rejected. parseSlug
    // cannot produce one today; this no longer depends on that.
    var parts = String(slug).toLowerCase().split("/");
    if (parts.length !== 2) return null;
    var owner = fromAlphabet(parts[0], SEGMENT_CHARS);
    var repo = fromAlphabet(parts[1], SEGMENT_CHARS);
    var prefix = fromAlphabet(String(base), BASE_CHARS);
    if (owner === null || repo === null || prefix === null) return null;
    if (!owner || !repo) return null;
    if (prefix.slice(0, 2) === "//") return null;
    // Found by driving the built file against a hostile corpus, not by reading
    // it: a base of "/sscsb/directory/../../" is entirely inside BASE_CHARS,
    // resolves to this origin quite happily, and lands the link at the site
    // root — outside the directory it claims to address. Measured before this
    // loop existed: "/sscsb/directory/../../p4gs--sscs-bootstrapper/" resolved
    // to "/p4gs--sscs-bootstrapper/".
    var segments = prefix.split("/");
    for (var s = 0; s < segments.length; s++) {
      if (segments[s] === "." || segments[s] === "..") return null;
    }
    // encodeURIComponent is a no-op on SEGMENT_CHARS today — every character in
    // it is unreserved. It is here so the segments stay URL-safe if that
    // alphabet is ever widened, rather than relying on a reader noticing.
    var path =
      prefix + encodeURIComponent(owner) + "--" + encodeURIComponent(repo) + "/";
    try {
      var here = location.href;
      if (new URL(path, here).origin !== new URL(here).origin) return null;
    } catch (e) {
      return null; // no usable document URL: fail closed, offer no link
    }
    return path;
  }

  function setStatus(text, href, linkText) {
    if (!status) return;
    status.textContent = text ? text + " " : "";
    var safe = safeHref(href);
    if (safe) {
      var a = document.createElement("a");
      a.href = safe;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = linkText || safe;
      status.appendChild(a);
    }
    status.hidden = !text;
  }

  function update() {
    var q = input.value.trim().toLowerCase();
    var visible = 0;
    var exact = false;
    var incompleteOnly = !!(onlyIncomplete && onlyIncomplete.checked);
    rows.forEach(function (tr) {
      var name = (tr.getAttribute("data-name") || "").toLowerCase();
      var hit = !q || name.indexOf(q) !== -1;
      if (hit && incompleteOnly && tr.getAttribute("data-complete") !== "0") hit = false;
      tr.style.display = hit ? "" : "none";
      if (hit) visible++;
    });
    // Only a page that actually renders rows can report a count. Without this
    // guard a table-less page reports "0 listings" beside a directory that
    // demonstrably has some.
    if (count && rows.length > 0) {
      count.textContent =
        visible === rows.length
          ? rows.length + (rows.length === 1 ? " listing" : " listings")
          : visible + " of " + rows.length + " shown";
    }
    var slug = parseSlug(input.value);
    if (slug) exact = listed[slug.toLowerCase()] === true;
    // The other half of the same fix: when the typed repository IS listed, say
    // so and offer the listing. Before, a matching query simply hid the scan
    // panel and left the visitor staring at an unchanged page.
    if (found) {
      var path =
        exact && slug
          ? listingPath(found.getAttribute("data-detail-base") || "", slug)
          : null;
      // Fail closed. A listing whose address we cannot vouch for is not
      // announced at all, rather than announced behind a link we could not
      // build safely. The scan panel below stays hidden too — `exact` is still
      // true — so a broken `data-detail-base` costs the visitor one message,
      // never a bad link and never an offer to re-scan a listed repository.
      found.hidden = !path;
      if (path && foundLink) {
        foundLink.setAttribute("href", path);
        foundLink.textContent = "Open " + slug + " →";
      }
    }
    if (scan) {
      var show = !!slug && !exact;
      scan.hidden = !show;
      if (show) {
        scan.setAttribute("data-slug", slug);
        if (cta) {
          cta.disabled = false;
          cta.textContent = cta.getAttribute("data-label") || "Scan " + slug + " now";
        }
        setStatus("");
      }
    }
  }

  // The pre-filled issue-form URL for a slug, or null when no fallback form is
  // configured — or when the configured one is not an http(s) URL. That last
  // case matters because this value is both opened with window.open() and
  // written into an href, and `data-fallback` is page-supplied: a scheme
  // allowlist here covers both sinks at their single source.
  function fallbackUrl(slug) {
    var base = (scan && scan.getAttribute("data-fallback")) || "";
    if (!base) return null;
    return safeHref(
      base +
        (base.indexOf("?") === -1 ? "?" : "&") +
        "title=" + encodeURIComponent("[scan] " + slug) +
        "&repo_url=" + encodeURIComponent("https://github.com/" + slug)
    );
  }

  // Try to open the pre-filled form in a popup, and REPORT WHETHER IT OPENED.
  //
  // WHY THIS RETURNS A HANDLE. This call happens two promise hops inside a
  // .catch(), which is precisely the shape every browser's popup blocker
  // stops: the click that started it is long over, so the open is not a user
  // gesture any more. The old code threw away window.open's return value and
  // returned the URL string, then branched on that string — so the status line
  // said "a pre-filled scan request just opened in a popup" whether or not
  // anything had opened, and structurally could not tell. A blocked user was
  // told to press a button in a window that did not exist.
  //
  // A blocker signals refusal in one of three ways: it returns null, it
  // returns undefined, or it hands back a window it has already closed. All
  // three are checked. Anything else that throws is a refusal too.
  //
  // WHY `noopener` IS NOT IN THE FEATURE STRING. It cannot be. Passing
  // "noopener" makes window.open return null BY SPECIFICATION — the whole
  // point is that no reference to the new window is handed back — so a
  // SUCCESSFUL open is indistinguishable from a blocked one. Measured in real
  // Chrome: with "noopener" the return is null while the popup demonstrably
  // opens (a second tab appears); without it, an object. Keeping it would have
  // replaced "always claims it opened" with "always claims it was blocked",
  // which is the same defect facing the other way.
  // The isolation `noopener` buys is restored on the next line instead:
  // clearing `opener` severs the new window's reference back to this one, so
  // it still cannot navigate or script the page that opened it.
  function openPopup(url) {
    try {
      var w = window.open(url, "_blank", "width=720,height=780");
      if (!w) return false;
      try {
        w.opener = null;
      } catch (e) {
        /* older engines: the window is same-site GitHub either way */
      }
      // Some blockers hand back a window and close it in the same tick.
      try {
        if (w.closed) return false;
      } catch (e) {
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function requestScan() {
    var slug = scan && scan.getAttribute("data-slug");
    if (!slug || !cta) return;
    var api = scan.getAttribute("data-api") || "";
    cta.disabled = true;
    setStatus("Checking " + slug + "…");
    fetch("https://api.github.com/repos/" + slug, { headers: { accept: "application/vnd.github+json" } })
      .then(function (res) {
        if (res.status === 404) throw { user: slug + " doesn't exist on GitHub, or is private. Only public repositories can be scanned." };
        if (!res.ok) throw { user: "GitHub returned " + res.status + " looking up " + slug + ". Try again in a minute." };
        if (!api) throw { unconfigured: true };
        setStatus("Queuing scan for " + slug + "…");
        return fetch(api, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ repo: slug }),
        });
      })
      .then(function (res) {
        if (!res) return;
        if (res.status === 429) throw { user: "The scan queue is full right now — try again later." };
        if (res.status === 503) throw { unconfigured: true };
        return res.json().then(function (data) {
          if (!res.ok) throw { user: (data && data.error) || "The scan service returned " + res.status + "." };
          setStatus(
            data.state === "existing" ? "Already queued — a scan request for " + slug + " is open." : "Scan queued for " + slug + "!",
            data.issue_url,
            "Track progress"
          );
          cta.textContent = data.state === "existing" ? "Already queued" : "Queued ✓";
        });
      })
      .catch(function (err) {
        if (err && err.unconfigured) {
          var url = fallbackUrl(slug);
          if (!url) {
            setStatus("The scan service isn't available right now.");
          } else if (openPopup(url)) {
            // Substantiated: we hold a live window handle.
            setStatus(
              "One more click: a pre-filled scan request just opened in a popup — press “Submit new issue” there. If you can't see it,",
              url,
              "open the form here"
            );
          } else {
            // Blocked. Say so, and give a path that CANNOT be blocked: a link
            // the reader clicks themselves is a user gesture by definition.
            setStatus(
              "Your browser blocked the popup, so nothing opened. Open the pre-filled scan request yourself:",
              url,
              "Open the scan request form"
            );
          }
          cta.disabled = false;
          return;
        }
        setStatus((err && err.user) || "Something went wrong reaching the scan service. Try again, or use the issue form.");
        cta.disabled = false;
      });
  }

  input.addEventListener("input", update);
  if (cta) cta.addEventListener("click", requestScan);
  if (sortSel) {
    sortSel.addEventListener("change", function () {
      applySort();
      update();
    });
  }
  if (onlyIncomplete) onlyIncomplete.addEventListener("change", update);
  if (/[?&]submit=1/.test(location.search)) input.focus();
  update();
})();
