// nav.js
//
// Purpose: Inject the fixed nav bar with active-state highlighting and username persistence

(function () {
  const W = (window.Weboss = window.Weboss || {});

  W.Nav = {
    init(config) {
      config = config || {};
      const active = config.active || "";

      const nav = document.createElement("nav");
      nav.id = "main-nav";
      nav.className =
        "fixed top-0 left-0 right-0 z-50 bg-baseCrimson-64 backdrop-blur-lg";
      nav.innerHTML =
        '<div class="bg-secondaryCrimson-12">' +
        '<div class="flex items-center justify-between px-16px py-8px">' +
        // Left group
        '<div class="flex items-center space-x-4">' +
        '<a href="index.html" class="text-24px font-bold text-primaryCrimson-100 mr-2">weboss!</a>' +
        W.Nav._link("new.html", "New", active === "new") +
        W.Nav._link("hot.html", "Popular", active === "hot") +
        W.Nav._link("browse.html", "Browse", active === "browse") +
        "</div>" +
        // Center: search
        '<div class="flex items-center flex-1 mx-16px">' +
        '<form action="search.html" class="flex items-center flex-1">' +
        '<input type="text" name="q" placeholder="Search or enter ID" ' +
        'class="flex-grow h-10 px-3 text-12px border-none bg-baseCrimson-100 text-primaryCrimson-100 font-medium placeholder-secondaryCrimson-32 rounded-l-12px focus:outline-none focus:ring-0" />' +
        '<button type="submit" class="h-10 w-10 border-none bg-secondaryCrimson-12 hover:bg-secondaryCrimson-32 text-secondaryCrimson-100 font-bold px-3 rounded-r-12px flex items-center justify-center">' +
        '<img src="/img/search.svg" alt="Search" class="w-5 h-5 text-secondaryCrimson-100" />' +
        "</button>" +
        "</form>" +
        "</div>" +
        // Right group
        '<div class="flex items-center space-x-4">' +
        W.Nav._link("liked.html", "Favorites", active === "liked") +
        W.Nav._link("faq.html", "FAQ", active === "faq") +
        W.Nav._link("settings.html", "Settings", active === "settings") +
        "</div>" +
        "</div>" +
        "</div>";

      document.body.insertBefore(nav, document.body.firstChild);
      W.Nav._bindUsername();
    },

    _link(href, text, isActive) {
      const base =
        "font-bold py-8px px-16px rounded-12px";
      const color = isActive
        ? "bg-secondaryCrimson-32 text-white-100"
        : "bg-secondaryCrimson-12 hover:text-white-100 text-secondaryCrimson-100";
      return '<a href="' + href + '" class="' + base + " " + color + '">' + text + "</a>";
    },

    _bindUsername() {
      // Deferred: some pages add #userreg later; poll once
      const tryBind = function () {
        const input = document.getElementById("userreg");
        if (!input) {
          setTimeout(tryBind, 100);
          return;
        }
        const saved = window.localStorage.getItem("username");
        if (saved) input.value = saved;
        input.addEventListener("keypress", function (e) {
          if (e.key === "Enter") {
            e.preventDefault();
            const val = input.value.trim();
            if (val) {
              window.localStorage.setItem("username", val);
              document.cookie = "username=" + val;
            }
          }
        });
      };
      tryBind();
    },
  };
})();
