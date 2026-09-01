// Directory client-side filter — vanilla, no dependencies.
(function () {
  var input = document.getElementById("dir-filter");
  if (!input) return;
  var rows = Array.prototype.slice.call(document.querySelectorAll("table.directory tbody tr"));
  input.addEventListener("input", function () {
    var q = input.value.trim().toLowerCase();
    rows.forEach(function (tr) {
      var hit = !q || (tr.getAttribute("data-name") || "").indexOf(q) !== -1;
      tr.style.display = hit ? "" : "none";
    });
  });
})();
