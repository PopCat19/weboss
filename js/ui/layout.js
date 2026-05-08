// layout.js
//
// Purpose: Orchestrate shared chrome injection (game-area, pause-menu, nav, loader, footer)

(function () {
  const W = (window.Weboss = window.Weboss || {});

  W.Layout = {
    init(config) {
      config = config || {};

      W.Layout._injectGameArea();
      W.Nav.init({ active: config.active || "" });
      W.Loader.init();
      W.Footer.init();
    },

    _injectGameArea() {
      var ga = document.createElement("div");
      ga.className = "game-area overflow-hidden h-screen";
      ga.id = "game-area";
      ga.hidden = true;
      document.body.insertBefore(ga, document.body.firstChild);

      var pm = document.createElement("div");
      pm.className = "pause-menu";
      pm.id = "pause-menu";
      pm.hidden = true;
      pm.innerHTML =
        '<div class="paused-title">Paused</div>' +
        '<div class="button-list">' +
        '<div class="pausebutton continue" id="pausebtn-continue"><div class="inner">Continue</div></div>' +
        '<div class="pausebutton retry" id="pausebtn-retry"><div class="inner">Retry</div></div>' +
        '<div class="pausebutton quit" id="pausebtn-quit"><div class="inner">Quit</div></div>' +
        "</div>";
      document.body.insertBefore(pm, ga.nextSibling);
    },
  };
})();
