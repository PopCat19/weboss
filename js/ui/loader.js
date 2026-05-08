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
      el.innerHTML =
        '<div class="bg-secondaryCrimson-12 backdrop-blur-lg p-16px rounded-12px space-y-2">' +
        '<div class="text-center text-primaryCrimson-100 text-14px font-bold mb-2">Status - Download</div>' +
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
        "</div>";
      document.body.appendChild(el);

      W.Loader._initStates();
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
