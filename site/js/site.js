(function () {
  var root = document.documentElement;
  var buttons = document.querySelectorAll("[data-theme-choice]");
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  var colors = {
    paper: "#f7f4ef",
    ink: "#141210",
    console: "#0b0d0b"
  };

  function apply(theme) {
    root.setAttribute("data-theme", theme);
    if (themeMeta && colors[theme]) {
      themeMeta.setAttribute("content", colors[theme]);
    }
    buttons.forEach(function (button) {
      var on = button.getAttribute("data-theme-choice") === theme;
      button.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      var theme = button.getAttribute("data-theme-choice");
      try {
        localStorage.setItem("autarki-theme", theme);
      } catch (e) {}
      apply(theme);
    });
  });

  apply(root.getAttribute("data-theme") || "paper");
})();
