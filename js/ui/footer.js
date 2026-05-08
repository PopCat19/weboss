// footer.js
//
// Purpose: Inject the shared page footer

(function () {
  const W = (window.Weboss = window.Weboss || {});

  W.Footer = {
    init() {
      const el = document.createElement("footer");
      el.className = "bg-secondaryCrimson-12 pb-40px p-16px";
      el.innerHTML =
        '<div class="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4 text-center">' +
        '<span class="text-secondaryCrimson-100">' +
        'Beatmap Mirror <a href="https://catboy.best/" class="text-accentCrimson-100 hover:text-accentCrimson-80 hover:underline">Mino</a>' +
        "</span>" +
        '<span class="text-secondaryCrimson-100">' +
        'Source code: <a href="https://github.com/PopCat19/weboss" class="text-accentCrimson-100 hover:text-accentCrimson-80 hover:underline">Github</a>' +
        "</span>" +
        "</div>";
      document.body.appendChild(el);
    },
  };
})();
