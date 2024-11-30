// Load required modules using RequireJS
require(["osu", "underscore", "sound", "playback"],
    function(Osu, _, sound, Playback) {
        // Check if WebGL is supported in the browser
        if (!PIXI || !PIXI.utils.isWebGLSupported()) {
            // If not, display an alert message
            alert("此网站使用WebGL绘图。您的浏览器不支持WebGL，请更换浏览器。")
        }
    
        // Make Osu and Playback modules available globally
        window.Osu = Osu;
        window.Playback = Playback;
    
        // Set up a compatible AudioContext
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
    
        // Initialize global game variables
        var game = {
            // Game window and stage
            window: window,
            stage: null,
            scene: null,
            updatePlayerActions: null,
    
            // Display settings (will be overwritten by gamesettings)
            backgroundDimRate: 0.7,
            backgroundBlurRate: 0.0,
            cursorSize: 1.0,
            showhwmouse: false,
            snakein: true,
            snakeout: true,
    
            // Audio settings
            masterVolume: 0.7,
            effectVolume: 1.0,
            musicVolume: 1.0,
            beatmapHitsound: true,
            globalOffset: 0,
    
            // Input settings
            allowMouseButton: false,
            allowMouseScroll: true,
            K1keycode: 90,
            K2keycode: 88,
            ESCkeycode: 27,
            ESC2keycode: 27,
    
            // Mod settings
            autoplay: false,
            nightcore: false,
            daycore: false,
            hardrock: false,
            easy: false,
            hidden: false,
    
            // Skin mod settings
            hideNumbers: false,
            hideGreat: false,
            hideFollowPoints: false,
    
            // Cursor info
            mouseX: 0, // in osu pixel, probably negative or exceeding 512
            mouseY: 0,
            mouse: null, // return {x,y,r} in osu pixel, probably negative or exceeding 512
            K1down: false,
            K2down: false,
            M1down: false,
            M2down: false,
            down: false,
    
            // Game state
            finished: false,
            sample: [{}, {}, {}, {}],
            sampleSet: 1
        };
    
        // Set the current frame interval
        window.currentFrameInterval = 16;
    
        // Make the game object available globally
        window.game = game;
    
        // Load game settings if available
        if (window.gamesettings) {
            window.gamesettings.loadToGame();
        }
    
        // Initialize skin and sound readiness flags
        window.skinReady = false;
        window.soundReady = false;
        window.scriptReady = false;
    
        // Create a new PIXI stage
        game.stage = new PIXI.Container();
    
        // Create a new game cursor
        game.cursor = null;
    
        // Load skin and game cursor
        PIXI.Loader.shared
            .add('fonts/venera.fnt')
            .add("sprites.json")
            .load(function(loader, resources) {
                // Set skin readiness flag to true
                window.skinReady = true;
    
                // Update skin progress indicator
                document.getElementById("skin-progress").classList.add("finished");
                document.body.classList.add("skin-ready");
    
                // Store skin resources
                Skin = PIXI.Loader.shared.resources["sprites.json"].textures;
            });
    
        // Load sounds
        var sample = [
            'hitsounds/normal-hitnormal.ogg',
            'hitsounds/normal-hitwhistle.ogg',
            'hitsounds/normal-hitfinish.ogg',
            'hitsounds/normal-hitclap.ogg',
            'hitsounds/normal-slidertick.ogg',
            'hitsounds/soft-hitnormal.ogg',
            'hitsounds/soft-hitwhistle.ogg',
            'hitsounds/soft-hitfinish.ogg',
            'hitsounds/soft-hitclap.ogg',
            'hitsounds/soft-slidertick.ogg',
            'hitsounds/drum-hitnormal.ogg',
            'hitsounds/drum-hitwhistle.ogg',
            'hitsounds/drum-hitfinish.ogg',
            'hitsounds/drum-hitclap.ogg',
            'hitsounds/drum-slidertick.ogg',
            'hitsounds/combobreak.ogg',
        ];
    
        // Set up sound loading callback
        sounds.whenLoaded = function() {
            // Assign sound resources to game object
            game.sample[1].hitnormal = sounds['hitsounds/normal-hitnormal.ogg'];
            game.sample[1].hitwhistle = sounds['hitsounds/normal-hitwhistle.ogg'];
            game.sample[1].hitfinish = sounds['hitsounds/normal-hitfinish.ogg'];
            game.sample[1].hitclap = sounds['hitsounds/normal-hitclap.ogg'];
            game.sample[1].slidertick = sounds['hitsounds/normal-slidertick.ogg'];
            game.sample[2].hitnormal = sounds['hitsounds/soft-hitnormal.ogg'];
            game.sample[2].hitwhistle = sounds['hitsounds/soft-hitwhistle.ogg'];
            game.sample[2].hitfinish = sounds['hitsounds/soft-hitfinish.ogg'];
            game.sample[2].hitclap = sounds['hitsounds/soft-hitclap.ogg'];
            game.sample[2].slidertick = sounds['hitsounds/soft-slidertick.ogg'];
            game.sample[3].hitnormal = sounds['hitsounds/drum-hitnormal.ogg'];
            game.sample[3].hitwhistle = sounds['hitsounds/drum-hitwhistle.ogg'];
            game.sample[3].hitfinish = sounds['hitsounds/drum-hitfinish.ogg'];
            game.sample[3].hitclap = sounds['hitsounds/drum-hitclap.ogg'];
            game.sample[3].slidertick = sounds['hitsounds/drum-slidertick.ogg'];
            game.sampleComboBreak = sounds['hitsounds/combobreak.ogg'];
    
            // Set sound readiness flag to true
            window.soundReady = true;
    
            // Update sound progress indicator
            document.getElementById("sound-progress").classList.add("finished");
            document.body.classList.add("sound-ready");
        };
    
        // Load sounds
        sounds.load(sample);
    
        // Add a bringToFront method to PIXI Sprite
        PIXI.Sprite.prototype.bringToFront = function() {
            if (this.parent) {
                var parent = this.parent;
                parent.removeChild(this);
                parent.addChild(this);
            }
        }
    
        // Set script readiness flag to true
        window.scriptReady = true;
    
        // Update script progress indicator
        document.getElementById("script-progress").classList.add("finished");
        document.body.classList.add("script-ready");
    
        // Load play history if available
        if (window.localforage) {
            localforage.getItem("playhistory1000", function(err, item) {
                if (!err && item && item.length) {
                    window.playHistory1000 = item;
                }
            })
        }

        // Prevent all drag-related events
        window.addEventListener("drag", function(e){e=e||window.event; e.preventDefault(); e.stopPropagation();});
        window.addEventListener("dragend", function(e){e=e||window.event; e.preventDefault(); e.stopPropagation();});
        window.addEventListener("dragenter", function(e){e=e||window.event; e.preventDefault(); e.stopPropagation();});
        window.addEventListener("dragexit", function(e){e=e||window.event; e.preventDefault(); e.stopPropagation();});
        window.addEventListener("dragleave", function(e){e=e||window.event; e.preventDefault(); e.stopPropagation();});
        window.addEventListener("dragover", function(e){e=e||window.event; e.preventDefault(); e.stopPropagation();});
        window.addEventListener("dragstart", function(e){e=e||window.event; e.preventDefault(); e.stopPropagation();});
        window.addEventListener("drop", function(e){e=e||window.event; e.preventDefault(); e.stopPropagation();});
});