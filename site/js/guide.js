(function () {
  var root = document.documentElement;
  var tab = document.getElementById("guide-blade");
  var blade = document.getElementById("guide-index");
  var shade = document.getElementById("guide-shade");
  var form = document.querySelector(".guide-search");
  var field = document.getElementById("guide-search");
  var status = document.getElementById("guide-search-status");
  var none = document.getElementById("guide-none");
  var articles = document.querySelectorAll(".procedure");
  var mobileQuery = window.matchMedia("(max-width: 800px)");

  function closed() {
    return root.getAttribute("data-guide-blade") === "closed";
  }

  function mobile() {
    return mobileQuery.matches;
  }

  function syncShade() {
    if (!shade) return;
    if (mobile() && !closed()) shade.removeAttribute("hidden");
    else shade.setAttribute("hidden", "");
  }

  function setClosed(next, persist) {
    if (next && blade && blade.contains(document.activeElement) && tab) tab.focus();
    if (next) root.setAttribute("data-guide-blade", "closed");
    else root.removeAttribute("data-guide-blade");
    if (tab) {
      tab.setAttribute("aria-expanded", next ? "false" : "true");
      tab.setAttribute("aria-label", next ? "Show the index" : "Hide the index");
    }
    if (blade) {
      blade.setAttribute("aria-hidden", next ? "true" : "false");
      blade.inert = next;
    }
    if (persist) {
      try {
        localStorage.setItem("autarki-guide-blade", next ? "closed" : "open");
      } catch (e) {}
    }
    syncShade();
  }

  function revealInBlade(link) {
    if (!blade || !link || closed()) return;
    var bladeRect = blade.getBoundingClientRect();
    var linkRect = link.getBoundingClientRect();
    if (linkRect.top < bladeRect.top) blade.scrollTop -= bladeRect.top - linkRect.top;
    else if (linkRect.bottom > bladeRect.bottom) blade.scrollTop += linkRect.bottom - bladeRect.bottom;
  }

  function markCurrent(id) {
    if (!blade) return;
    var links = blade.querySelectorAll("a[href^='#']");
    var current = null;
    for (var i = 0; i < links.length; i++) {
      var on = links[i].getAttribute("href") === "#" + id;
      if (on) {
        links[i].setAttribute("aria-current", "true");
        current = links[i];
      } else links[i].removeAttribute("aria-current");
    }
    revealInBlade(current);
  }

  function applyFilter() {
    var query = field ? field.value.toLowerCase().replace(/\s+/g, " ").trim() : "";
    var words = query ? query.split(" ") : [];
    var shown = 0;
    for (var i = 0; i < articles.length; i++) {
      var article = articles[i];
      var section = article.parentNode;
      var heading = section ? section.querySelector("h2") : null;
      var hay = ((heading ? heading.textContent : "") + " " + article.textContent).toLowerCase();
      var match = true;
      for (var w = 0; w < words.length; w++) {
        if (hay.indexOf(words[w]) === -1) match = false;
      }
      if (match) {
        article.removeAttribute("hidden");
        shown += 1;
      } else article.setAttribute("hidden", "");
      var link = blade ? blade.querySelector("a[href='#" + article.id + "']") : null;
      if (link) {
        if (match) link.removeAttribute("hidden");
        else link.setAttribute("hidden", "");
      }
    }
    if (blade) {
      var groups = blade.querySelectorAll(".guide-group");
      for (var g = 0; g < groups.length; g++) {
        var node = groups[g].nextElementSibling;
        var any = false;
        while (node && !node.classList.contains("guide-group")) {
          if (node.tagName === "A" && !node.hasAttribute("hidden")) any = true;
          node = node.nextElementSibling;
        }
        if (any) groups[g].removeAttribute("hidden");
        else groups[g].setAttribute("hidden", "");
      }
    }
    var sections = document.querySelectorAll(".guide-body .band");
    for (var s = 0; s < sections.length; s++) {
      var visible = sections[s].querySelector(".procedure:not([hidden])");
      if (visible) sections[s].removeAttribute("hidden");
      else sections[s].setAttribute("hidden", "");
    }
    if (none) {
      if (query && shown === 0) none.removeAttribute("hidden");
      else none.setAttribute("hidden", "");
    }
    if (status) {
      if (!query) status.textContent = "";
      else if (shown === 0) status.textContent = "No procedure matches that.";
      else if (shown === 1) status.textContent = "1 procedure.";
      else status.textContent = shown + " procedures.";
    }
  }

  if (tab) {
    tab.addEventListener("click", function () {
      setClosed(!closed(), true);
    });
  }
  if (shade) {
    shade.addEventListener("click", function () {
      setClosed(true, true);
    });
  }
  if (blade) {
    blade.addEventListener("click", function (event) {
      var node = event.target;
      while (node && node !== blade) {
        if (node.tagName === "A") {
          if (mobile()) setClosed(true, true);
          return;
        }
        node = node.parentNode;
      }
    });
  }
  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      applyFilter();
      var first = document.querySelector(".procedure:not([hidden]) h3");
      if (first) first.focus();
    });
  }
  if (field) {
    field.addEventListener("input", applyFilter);
    field.addEventListener("search", applyFilter);
  }
  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    if (field && document.activeElement === field && field.value) {
      field.value = "";
      applyFilter();
      return;
    }
    if (!closed()) setClosed(true, true);
  });

  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      var pick = null;
      for (var i = 0; i < entries.length; i++) {
        if (!entries[i].isIntersecting) continue;
        if (!pick || entries[i].boundingClientRect.top < pick.boundingClientRect.top) pick = entries[i];
      }
      if (pick) markCurrent(pick.target.id);
    }, { rootMargin: "-15% 0px -70% 0px", threshold: 0 });
    for (var n = 0; n < articles.length; n++) observer.observe(articles[n]);
  }

  if (mobileQuery.addEventListener) mobileQuery.addEventListener("change", syncShade);
  setClosed(closed(), false);
  applyFilter();
})();
