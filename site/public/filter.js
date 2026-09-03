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
(function () {
  var input = document.getElementById("dir-filter");
  if (!input) return;
  var tbody = document.querySelector("table.directory tbody");
  var rows = Array.prototype.slice.call(document.querySelectorAll("table.directory tbody tr"));
  var scan = document.getElementById("dir-scan");
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

  function setStatus(text, href, linkText) {
    if (!status) return;
    status.textContent = text ? text + " " : "";
    if (href) {
      var a = document.createElement("a");
      a.href = href;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = linkText || href;
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
    if (count) {
      count.textContent =
        visible === rows.length
          ? rows.length + (rows.length === 1 ? " listing" : " listings")
          : visible + " of " + rows.length + " shown";
    }
    var slug = parseSlug(input.value);
    if (slug) {
      rows.forEach(function (tr) {
        if ((tr.getAttribute("data-name") || "").toLowerCase() === slug.toLowerCase()) exact = true;
      });
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

  function fallback(slug) {
    var base = (scan && scan.getAttribute("data-fallback")) || "";
    if (!base) return null;
    var url =
      base +
      (base.indexOf("?") === -1 ? "?" : "&") +
      "title=" + encodeURIComponent("[scan] " + slug) +
      "&repo_url=" + encodeURIComponent("https://github.com/" + slug);
    window.open(url, "_blank", "noopener,width=720,height=780");
    return url;
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
          var url = fallback(slug);
          setStatus(
            url
              ? "One more click: a pre-filled scan request just opened in a popup — press “Submit new issue” there."
              : "The scan service isn't available right now."
          );
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
