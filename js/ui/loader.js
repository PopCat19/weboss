// loader.js
//
// Purpose: Inject the download progress indicator and LoaderStates utility

(function () {
  const W = (window.Weboss = window.Weboss || {});

  W.Loader = {
    init() {
      const el = document.createElement("div");
      el.id = "loader-progress";
      el.className =
        "fixed bottom-0 left-0 z-50 ml-16px mb-16px bg-baseCrimson-64 rounded-12px w-256px";
      var collapsed = localStorage.getItem("status-collapsed") === "true";

      el.innerHTML =
        '<div class="bg-secondaryCrimson-12 backdrop-blur-lg p-16px rounded-12px">' +
        // Title bar (always visible)
        '<div class="flex items-center justify-between cursor-pointer" id="status-toggle">' +
        '<span class="text-primaryCrimson-100 text-14px font-bold">Status - Download</span>' +
        '<span class="text-secondaryCrimson-100 text-12px transition-transform duration-200" id="status-arrow" style="transform: rotate(' + (collapsed ? '180' : '0') + 'deg);">&#9660;</span>' +
        "</div>" +
        // Collapsable body
        '<div id="status-body" style="' + (collapsed ? 'display:none' : '') + '" class="space-y-2">' +
        '<div class="mt-2"></div>' +
        // Scripts
        '<div class="flex justify-between items-center space-x-2 text-secondaryCrimson-100" id="script-progress">' +
        '<span class="font-medium text-12px">Scripts</span>' +
        '<div class="circle animate-pulse rounded-full size-4 bg-secondaryCrimson-12"></div>' +
        "</div>" +
        // Skin
        '<div class="flex justify-between items-center space-x-2 text-secondaryCrimson-100" id="skin-progress">' +
        '<span class="font-medium text-12px">Skin</span>' +
        '<div class="circle animate-pulse rounded-full size-4 bg-secondaryCrimson-12"></div>' +
        "</div>" +
        // Hitsounds
        '<div class="flex justify-between items-center space-x-2 text-secondaryCrimson-100" id="sound-progress">' +
        '<span class="font-medium text-12px">Hitsounds</span>' +
        '<div class="circle animate-pulse rounded-full size-4 bg-secondaryCrimson-12"></div>' +
        "</div>" +
        '<div class="mt-2">' +
        '<div id="statuslines" class="max-h-80px overflow-y-auto"></div>' +
        "</div>" +
        "</div>" +
        "</div>";
      document.body.appendChild(el);

      var self = this;
      document.getElementById("status-toggle").addEventListener("click", function () {
        var body = document.getElementById("status-body");
        var arrow = document.getElementById("status-arrow");
        var isCollapsed = body.style.display === "none";
        if (isCollapsed) {
          body.style.display = "";
          arrow.style.transform = "rotate(0deg)";
          localStorage.setItem("status-collapsed", "false");
        } else {
          body.style.display = "none";
          arrow.style.transform = "rotate(180deg)";
          localStorage.setItem("status-collapsed", "true");
        }
      });

      // Auto-expand when a download starts
      self._autoExpandOnDownload();

      W.Loader._initStates();
    },

    _autoExpandOnDownload() {
      var observer = new MutationObserver(function (mutations) {
        var body = document.getElementById("status-body");
        var arrow = document.getElementById("status-arrow");
        if (body && body.style.display === "none") {
          body.style.display = "";
          arrow.style.transform = "rotate(0deg)";
          localStorage.setItem("status-collapsed", "false");
        }
      });
      var statuslines = document.getElementById("statuslines");
      if (statuslines) {
        observer.observe(statuslines, { childList: true });
      } else {
        // statuslines might not exist yet; retry
        var retry = setInterval(function () {
          var sl = document.getElementById("statuslines");
          if (sl) {
            clearInterval(retry);
            observer.observe(sl, { childList: true });
          }
        }, 200);
      }
    },

    _initStates() {
      var markAsFinished = function (elementId, isSuccess) {
        if (isSuccess === undefined) isSuccess = true;
        var item = document.getElementById(elementId);
        if (!item) return;
        var circle = item.querySelector(".circle");
        if (!circle) return;
        circle.classList.remove("animate-pulse", "bg-secondaryCrimson-12", "size-4");
        if (isSuccess) {
          circle.classList.add("bg-secondaryCrimson-100", "size-4");
        } else {
          circle.classList.add("bg-accentCrimson-100", "size-4");
        }
      };

      window.markAsFinished = markAsFinished;

      var update = function () {
        var classes = document.body.classList;
        if (classes.contains("script-ready")) markAsFinished("script-progress");
        if (classes.contains("skin-ready")) markAsFinished("skin-progress");
        if (classes.contains("sound-ready")) markAsFinished("sound-progress");
      };

      new MutationObserver(function (mutations) {
        for (var i = 0; i < mutations.length; i++) {
          if (mutations[i].type === "attributes" && mutations[i].attributeName === "class") {
            update();
          }
        }
      }).observe(document.body, { attributes: true, attributeFilter: ["class"] });

      document.addEventListener("DOMContentLoaded", update);

      window.addEventListener("error", function (event) {
        var file = event.filename || "";
        if (file.indexOf("initgame.js") !== -1 || file.indexOf("jsloader.js") !== -1) {
          markAsFinished("script-progress", false);
          markAsFinished("skin-progress", false);
          markAsFinished("sound-progress", false);
        }
      });
    },
  };
})();
