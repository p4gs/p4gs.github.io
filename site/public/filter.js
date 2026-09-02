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
//   table.directory tbody tr[data-name="owner/repo"] — the rows
(function () {
  var input = document.getElementById("dir-filter");
  if (!input) return;
  var rows = Array.prototype.slice.call(document.querySelectorAll("table.directory tbody tr"));
  var scan = document.getElementById("dir-scan");
  var cta = document.getElementById("dir-scan-cta");
  var status = document.getElementById("dir-scan-status");

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
    rows.forEach(function (tr) {
      var name = (tr.getAttribute("data-name") || "").toLowerCase();
      var hit = !q || name.indexOf(q) !== -1;
      tr.style.display = hit ? "" : "none";
      if (hit) visible++;
    });
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
  if (/[?&]submit=1/.test(location.search)) input.focus();
  update();
})();
