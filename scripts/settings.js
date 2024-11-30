/**
 * Sets up the option panel for the game.
 */
function setOptionPanel() {
	/**
	 * Loads the game settings from local storage.
	 */
	function loadFromLocal() {
	  let str = window.localStorage.getItem("osugamesettings");
	  if (str) {
		let s = JSON.parse(str);
		if (s) Object.assign(gamesettings, s);
	  }
	}
  
	/**
	 * Saves the game settings to local storage.
	 */
	function saveToLocal() {
	  window.localStorage.setItem("osugamesettings", JSON.stringify(window.gamesettings));
	}
  
	// Initialize game settings with default values
	let defaultsettings = {
	  // Gameplay settings
	  dim: 60,
	  blur: 0,
	  cursorsize: 1.0,
	  showhwmouse: false,
	  snakein: true,
	  snakeout: true,
	  autofullscreen: false,
	  sysdpi: true,
	  dpiscale: 1.0,
  
	  // Input settings
	  disableWheel: false,
	  disableButton: false,
	  K1name: 'Z',
	  K2name: 'X',
	  Kpausename: 'SPACE',
	  Kpause2name: 'ESC',
	  Kskipname: 'CTRL',
	  K1keycode: 90,
	  K2keycode: 88,
	  Kpausekeycode: 32,
	  Kpause2keycode: 27,
	  Kskipkeycode: 17,
  
	  // Audio settings
	  mastervolume: 60,
	  effectvolume: 100,
	  musicvolume: 100,
	  audiooffset: 0,
	  beatmapHitsound: true,
  
	  // Mods
	  easy: false,
	  daycore: false,
	  hardrock: false,
	  nightcore: false,
	  hidden: false,
	  autoplay: false,
  
	  // Skin
	  hideNumbers: false,
	  hideGreat: false,
	  hideFollowPoints: false,
	};
  
	// Initialize game settings object
	window.gamesettings = {};
	Object.assign(gamesettings, defaultsettings);
  
	// Load game settings from local storage
	gamesettings.refresh = loadFromLocal;
	loadFromLocal();
  
	/**
	 * Loads the game settings into the game.
	 */
	window.gamesettings.loadToGame = function() {
	  if (window.game) {
		// Gameplay settings
		window.game.backgroundDimRate = this.dim / 100;
		window.game.backgroundBlurRate = this.blur / 100;
		window.game.cursorSize = parseFloat(this.cursorsize);
		window.game.showhwmouse = this.showhwmouse;
		window.game.snakein = this.snakein;
		window.game.snakeout = this.snakeout;
		window.game.autofullscreen = this.autofullscreen;
		window.game.overridedpi = !this.sysdpi;
		window.game.dpiscale = this.dpiscale;
  
		// Input settings
		window.game.allowMouseScroll = !this.disableWheel;
		window.game.allowMouseButton = !this.disableButton;
		window.game.K1keycode = this.K1keycode;
		window.game.K2keycode = this.K2keycode;
		window.game.ESCkeycode = this.Kpausekeycode;
		window.game.ESC2keycode = this.Kpause2keycode;
		window.game.CTRLkeycode = this.Kskipkeycode;
  
		// Audio settings
		window.game.masterVolume = this.mastervolume / 100;
		window.game.effectVolume = this.effectvolume / 100;
		window.game.musicVolume = this.musicvolume / 100;
		window.game.beatmapHitsound = this.beatmapHitsound;
		window.game.globalOffset = parseFloat(this.audiooffset);
  
		// Mods
		window.game.easy = this.easy;
		window.game.daycore = this.daycore;
		window.game.hardrock = this.hardrock;
		window.game.nightcore = this.nightcore;
		window.game.hidden = this.hidden;
		window.game.autoplay = this.autoplay;
  
		// Skin
		window.game.hideNumbers = this.hideNumbers;
		window.game.hideGreat = this.hideGreat;
		window.game.hideFollowPoints = this.hideFollowPoints;
	  }
	}
  
	// Load game settings into the game
	gamesettings.loadToGame();
  
	// Check if the settings panel exists
	if (!document.getElementById("settings-panel")) return;
  
	// Array of callbacks to restore default settings
	gamesettings.restoreCallbacks = [];
  
	/**
	 * Checks if a setting is at its default value.
	 * @param {HTMLElement} element The element to check.
	 * @param {string} item The setting to check.
	 */
	function checkdefault(element, item) {
	  if (gamesettings[item] == defaultsettings[item])
		element.parentElement.parentElement.parentElement.classList.remove("non-default");
	  else
		element.parentElement.parentElement.parentElement.classList.add("non-default");
	}
  
	/**
	 * Binds a checkbox to a setting.
	 * @param {string} id The ID of the checkbox.
	 * @param {string} item The setting to bind.
	 */
	function bindcheck(id, item) {
	  let c = document.getElementById(id);
	  c.checked = gamesettings[item];
	  gamesettings.restoreCallbacks.push(function(){
		c.checked = gamesettings[item];
		checkdefault(c, item);
	  });
	  checkdefault(c, item);
	  c.onclick = function() {
		gamesettings[item] = c.checked;
		checkdefault(c, item);
		gamesettings.loadToGame();
		saveToLocal();
	  }
	}
  
	  /**
   * Binds a range input to a setting.
   * @param {string} id The ID of the range input.
   * @param {string} item The setting to bind.
   * @param {function} feedback A function that returns a string to display as feedback.
   */
	  function bindrange(id, item, feedback) {
		let range = document.getElementById(id);
		let indicator = document.getElementById(id + "-indicator");
		range.onmousedown = function() {
		  indicator.removeAttribute("hidden");
		}
		range.onmouseup = function() {
		  indicator.setAttribute("hidden", "");
		};
		range.oninput = function() {
		  let min = parseFloat(range.min);
		  let max = parseFloat(range.max);
		  let val = parseFloat(range.value);
		  let pos = (val-min) / (max-min);
		  let length = range.clientWidth - 20;
		  indicator.style.left = (pos * length + 13) + "px";
		  indicator.innerText = feedback(val);
		  gamesettings[item] = range.value;
		  checkdefault(range, item);
		}
		range.value = gamesettings[item];
		gamesettings.restoreCallbacks.push(function(){
		  range.value = gamesettings[item];
		  checkdefault(range, item);
		});
		range.oninput();
		range.onchange = function() {
		  gamesettings[item] = range.value;
		  gamesettings.loadToGame();
		  saveToLocal();
		  checkdefault(range, item);
		}
	  }
	
	  /**
	   * Binds a key selector to a setting.
	   * @param {string} id The ID of the key selector.
	   * @param {string} keynameitem The setting for the key name.
	   * @param {string} keycodeitem The setting for the key code.
	   */
	  function bindkeyselector(id, keynameitem, keycodeitem) {
		let btn = document.getElementById(id);
		let activate = function() {
		  let t_onkeydown = window.onkeydown;
		  window.onkeydown = null;
		  let deactivate = function() {
			window.onkeydown = t_onkeydown;
			btn.onclick = activate;
			btn.classList.remove("using");
			document.removeEventListener("keydown", listenkey);
			checkdefault(btn, keynameitem);
		  }
		  let listenkey = function(e) {
			e = e || window.event;
			e.stopPropagation();
			gamesettings[keycodeitem] = e.keyCode;
			gamesettings[keynameitem] = e.key.toUpperCase();
			if (gamesettings[keynameitem] == " ")
			  gamesettings[keynameitem] = "SPACE";
			if (gamesettings[keynameitem] == "ESCAPE")
			  gamesettings[keynameitem] = "ESC";
			if (gamesettings[keynameitem] == "CONTROL")
			  gamesettings[keynameitem] = "CTRL";
			btn.value = gamesettings[keynameitem];
			gamesettings.loadToGame();
			saveToLocal();
			deactivate();
		  }
		  btn.classList.add("using");
		  document.addEventListener("keydown", listenkey);
		  btn.onclick = deactivate;
		}
		checkdefault(btn, keynameitem);
		btn.onclick = activate;
		btn.value = gamesettings[keynameitem];
		gamesettings.restoreCallbacks.push(function(){
		  btn.value = gamesettings[keynameitem];
		  checkdefault(btn, keynameitem);
		});
	  }
	
	  // Bind gameplay settings
	  bindrange("dim-range", "dim", function(v){return v+"%"});
	  bindrange("blur-range", "blur", function(v){return v+"%"});
	  bindrange("cursorsize-range", "cursorsize", function(v){return v.toFixed(2)+"x"});
	  bindcheck("showhwmouse-check", "showhwmouse");
	  bindcheck("snakein-check", "snakein");
	  bindcheck("snakeout-check", "snakeout");
	  bindcheck("autofullscreen-check", "autofullscreen");
	  bindcheck("sysdpi-check", "sysdpi");
	  bindrange("dpi-range", "dpiscale", function(v){return v.toFixed(2)+"x"});
	
	  // Bind input settings
	  bindcheck("disable-wheel-check", "disableWheel");
	  bindcheck("disable-button-check", "disableButton");
	  bindkeyselector("lbutton1select", "K1name", "K1keycode");
	  bindkeyselector("rbutton1select", "K2name", "K2keycode");
	  bindkeyselector("pausebutton2select", "Kpause2name", "Kpause2keycode");
	  bindkeyselector("pausebuttonselect", "Kpausename", "Kpausekeycode");
	  bindkeyselector("skipbuttonselect", "Kskipname", "Kskipkeycode");
	
	  // Bind audio settings
	  bindrange("mastervolume-range", "mastervolume", function(v){return v+"%"});
	  bindrange("effectvolume-range", "effectvolume", function(v){return v+"%"});
	  bindrange("musicvolume-range", "musicvolume", function(v){return v+"%"});
	  bindrange("audiooffset-range", "audiooffset", function(v){return v+"ms"});
	  bindcheck("beatmap-hitsound-check", "beatmapHitsound");
	
	  // Bind mods
	  bindExclusiveCheck("easy-check", "easy", "hardrock-check", "hardrock");
	  bindExclusiveCheck("daycore-check", "daycore", "nightcore-check", "nightcore");
	  bindcheck("hidden-check", "hidden");
	  bindcheck("autoplay-check", "autoplay");
	
	  // Bind skin
	  bindcheck("hidenumbers-check", "hideNumbers");
	  bindcheck("hidegreat-check", "hideGreat");
	  bindcheck("hidefollowpoints-check", "hideFollowPoints");
	
	  // Bind restore default button
	  document.getElementById("restoredefault-btn").onclick = function() {
		Object.assign(gamesettings, defaultsettings);
		for (let i=0; i<gamesettings.restoreCallbacks.length; ++i)
		  gamesettings.restoreCallbacks[i]();
		gamesettings.loadToGame();
		saveToLocal();
	  }
	}
	
	// Add event listener to set up option panel when document is loaded
	window.addEventListener('DOMContentLoaded', setOptionPanel);
	
	// Press any key to search
	window.onkeydown = function(e) {
	  if (e.ctrlKey || e.altKey || e.metaKey)
		return;
	  if (e.key.length == 1 && e.key != " ") {
		let textinput = document.getElementsByTagName("input")[0];
		textinput.focus();
	  }
	}