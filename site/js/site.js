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

(function () {
  var form = document.querySelector(".request-form");
  if (!form) return;
  var status = form.querySelector(".request-status");
  var button = form.querySelector("button");

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var data = new FormData(form);
    button.disabled = true;
    status.textContent = "";
    fetch(form.getAttribute("action"), {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        email: data.get("email"),
        company: data.get("company")
      })
    }).then(function (response) {
      return response.json().then(function (body) {
        return response.ok && body && body.ok;
      }, function () {
        return false;
      });
    }).then(function (ok) {
      if (ok) {
        form.reset();
        status.textContent = "Request sent.";
      } else {
        status.textContent = "The request did not send. Write to apple@autarki.app with the subject Apple Autarki Tester Request.";
      }
    }).catch(function () {
      status.textContent = "The request did not send. Write to apple@autarki.app with the subject Apple Autarki Tester Request.";
    }).then(function () {
      button.disabled = false;
    });
  });
})();
