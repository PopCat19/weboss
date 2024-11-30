// delayed js loader

/**
 * Loads a script from a given URL and executes a callback function when the script is loaded.
 * 
 * @param {string} url - The URL of the script to load.
 * @param {function} callback - The callback function to execute when the script is loaded.
 * @param {object} aux - An object containing additional attributes to set on the script element.
 */
function loadScript(url, callback, aux) {
    // Create a new script element
    let script = document.createElement("script");
    
    // Add the script element to the head of the document
    document.head.appendChild(script);
    
    // If a callback function is provided, set it as the onload event handler for the script element
    if (callback) {
        script.onload = callback;
    }
    
    // If additional attributes are provided, set them on the script element
    if (aux) {
        for (let key in aux) {
            script.setAttribute(key, aux[key]);
        }
    }
    
    // Set the src attribute of the script element to the provided URL
    script.src = url;
}

/**
 * A callback function that is executed when the beatmap list has been loaded.
 */
window.beatmaplistLoadedCallback = function () {
    // Delay the execution of the callback function by 0 milliseconds (i.e., execute it as soon as possible)
    window.setTimeout(function(){
        // Load the zip.js script and execute a callback function when it is loaded
        loadScript("scripts/lib/zip.js", function(){
            // Set the workerScriptsPath property of the zip object to the provided value
            window.zip.workerScriptsPath = 'scripts/lib/';
            
            // Load the zip-fs.js script and execute the checkdep function when it is loaded
            loadScript("scripts/lib/zip-fs.js", checkdep);
        });
        
        // Load the pixi.min.js script and execute the checkdep function when it is loaded
        loadScript("scripts/lib/pixi.min.js", checkdep);
        
        // Load the mp3parse.min.js script and execute the checkdep function when it is loaded
        loadScript("scripts/lib/mp3parse.min.js", checkdep);
        
        // Load the localforage.min.js script and execute the checkdep function when it is loaded
        loadScript("scripts/lib/localforage.min.js", checkdep);
        
        /**
         * A function that checks if all dependencies have been loaded.
         */
        function checkdep() {
            // If the window.aaaaa property does not exist, create it and initialize it to 0
            if (!window.aaaaa) window.aaaaa = 0;
            
            // Increment the window.aaaaa property by 1
            window.aaaaa += 1;
            
            // If all dependencies have been loaded (i.e., window.aaaaa is equal to 4)
            if (window.aaaaa == 4) {
                // Load the require.js script and execute a callback function when it is loaded
                loadScript("scripts/lib/require.js", function() {
                    // Configure the require.js library
                    require.config({
                        paths: {
                            underscore: 'lib/underscore',
                            sound: 'lib/sound'
                        },
                        shim: {
                            "underscore": {
                                exports: "_"
                            }
                        },
                        // urlArgs: "bust=" +  (new Date()).getTime()
                    });
                }, {"data-main":"scripts/initgame"});
                
                // Load the Liked list from local storage
                if (window.localforage) {
                    localforage.getItem("likedsidset", function(err, item) {
                        if (!err) {
                            // If the Liked list exists, set it as the window.liked_sid_set property
                            if (item && item.size)
                                window.liked_sid_set = item;
                            else
                                window.liked_sid_set = new Set();
                            
                            // Execute all callback functions in the window.liked_sid_set_callbacks array
                            for (let i=0; i<window.liked_sid_set_callbacks.length; ++i)
                                window.liked_sid_set_callbacks[i]();
                            
                            // Clear the window.liked_sid_set_callbacks array
                            window.liked_sid_set_callbacks = [];
                        }
                        else {
                            // Log an error message if the Liked list cannot be loaded
                            console.error("failed loading liked list");
                        }
                    });
                }
            }
        }
    }, 0);
}