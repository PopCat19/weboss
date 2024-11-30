// Define a module that returns a function called playerActions
define([], function() {

    // Function to check if a click has been made on a hit object
    var checkClickdown = function checkClickdown(){
        // Get the upcoming hits and the current mouse position
        var upcoming = playback.upcomingHits;
        var click = {
            x: playback.game.mouseX,
            y: playback.game.mouseY,
            time: playback.osu.audio.getPosition() * 1000
        };

        // Find the hit object that the click is closest to
        var hit = upcoming.find(inUpcoming(click));

        // If no hit object is found, try to find one using a predicted mouse position
        if (!hit && game.mouse) {
            let res = game.mouse(new Date().getTime());
            res.time = click.time;
            hit = upcoming.find(inUpcoming_grace(res));
        }

        // If a hit object is found, calculate the score and call the hitSuccess function
        if (hit){
            if (hit.type == "circle" || hit.type == "slider") {
                let points = 50;
                let diff = click.time - hit.time;
                if (Math.abs(diff) < playback.GoodTime) points = 100;
                if (Math.abs(diff) < playback.GreatTime) points = 300;
                playback.hitSuccess(hit, points, click.time);
            }
        }
    };

    // Function to check if a click is within a certain distance of a hit object
    var inUpcoming = function (click){
        return function (hit){
            // Calculate the distance between the click and the hit object
            var dx = click.x - hit.x;
            var dy = click.y - hit.y;

            // Check if the click is within the circle radius of the hit object
            // and if the click time is within the MehTime of the hit object's time
            return ( 
                hit.score < 0
                && dx*dx + dy*dy < playback.circleRadius * playback.circleRadius
                && Math.abs(click.time - hit.time) < playback.MehTime);
            }
    }

    // Function to check if a click is within a certain distance of a hit object,
    // using a predicted mouse position and a larger circle radius
    var inUpcoming_grace = function (predict){
        return function (hit){
            // Calculate the distance between the predicted mouse position and the hit object
            var dx = predict.x - hit.x;
            var dy = predict.y - hit.y;
            var r = predict.r + playback.circleRadius;

            // Check if the predicted mouse position is within the larger circle radius
            // of the hit object and if the click time is within the MehTime of the hit object's time
            let result = hit.score < 0
                && dx*dx + dy*dy < r * r
                && Math.abs(predict.time - hit.time) < playback.MehTime;

            // Log a message if a hit object is found using the predicted mouse position
            if (result)
                console.log("grace hit");

            return result;
        }
    }

    // Function to handle player actions
    var playerActions = function(playback){
        
        // If autoplay is enabled, set up the auto player
        if (playback.autoplay) {
            playback.auto = {
                currentObject: null,
                curid: 0,
                lastx: playback.game.mouseX,
                lasty: playback.game.mouseY,
                lasttime: 0
            }
        }

        // Function to update the player actions
        playback.game.updatePlayerActions = function(time){
            // If autoplay is enabled, update the auto player
            if (playback.autoplay) {
                const spinRadius = 60;
                let cur = playback.auto.currentObject;

                // Move the cursor to the next hit object
                if (playback.game.down && cur) { 
                    if (cur.type == "circle" || time > cur.endTime) {
                        // Release the cursor
                        playback.game.down = false;
                        playback.auto.currentObject = null;
                        playback.auto.lasttime = time;
                        playback.auto.lastx = playback.game.mouseX;
                        playback.auto.lasty = playback.game.mouseY;
                    }
                    else if (cur.type == "slider") { 
                        // Follow the slider ball
                        playback.game.mouseX = cur.ball.x || cur.x;
                        playback.game.mouseY = cur.ball.y || cur.y;
                    }
                    else { 
                        // Spin the cursor around the hit object
                        let currentAngle = Math.atan2(playback.game.mouseY - cur.y, playback.game.mouseX - cur.x);
                        currentAngle += 0.8;
                        playback.game.mouseY = cur.y + spinRadius * Math.sin(currentAngle);
                        playback.game.mouseX = cur.x + spinRadius * Math.cos(currentAngle);
                    }
                }

                // Find the next hit object
                cur = playback.auto.currentObject;
                while (playback.auto.curid < playback.hits.length && playback.hits[playback.auto.curid].time < time) {
                    if (playback.hits[playback.auto.curid].score < 0) {
                        playback.game.mouseX = playback.hits[playback.auto.curid].x;
                        playback.game.mouseY = playback.hits[playback.auto.curid].y;
                        if (playback.hits[playback.auto.curid].type == "spinner")
                            playback.game.mouseY -= spinRadius;
                        playback.game.down = true;
                        checkClickdown();
                    }
                    ++playback.auto.curid;
                }
                if (!cur && playback.auto.curid < playback.hits.length) {
                    cur = playback.hits[playback.auto.curid];
                    playback.auto.currentObject = cur;
                }
                if (!cur || cur.time > time + playback.approachTime) {
                    // No object to click, just rest
                    playback.auto.lasttime = time;
                    return;
                }
                if (!playback.game.down) {
                    // Move the cursor towards the hit object
                    let targX = cur.x;
                    let targY = cur.y;
                    if (cur.type == "spinner")
                        targY -= spinRadius;
                    let t = (time - playback.auto.lasttime) / (cur.time - playback.auto.lasttime);
                    t = Math.max(0, Math.min(1, t));
                    t = 0.5-Math.sin((Math.pow(1-t,1.5)-0.5)*Math.PI)/2; 
                    playback.game.mouseX = t * targX + (1-t) * playback.auto.lastx;
                    playback.game.mouseY = t * targY + (1-t) * playback.auto.lasty;

                    let diff = time - cur.time;
                    if (diff > -8) {
                        // Click the hit object
                        playback.game.down = true;
                        checkClickdown();
                    }
                }
            }
        };

                // Function to predict the mouse position
                var movehistory = [{x:512/2, y:384/2, t: new Date().getTime()}];

                // Function to predict the mouse position
                playback.game.mouse = function(t) {
                    // Realtime mouse position prediction algorithm
                    let m = movehistory;
                    let i = 0;
                    while (i<m.length-1 && m[0].t-m[i].t<40 && t-m[i].t<100) i+=1;
                    let velocity = i==0? {x:0, y:0}: {x: (m[0].x-m[i].x)/(m[0].t-m[i].t), y: (m[0].y-m[i].y)/(m[0].t - m[i].t)};
                    let dt = Math.min(t - m[0].t + window.currentFrameInterval, 40);
                    return {
                        x: m[0].x + velocity.x * dt,
                        y: m[0].y + velocity.y * dt,
                        r: Math.hypot(velocity.x, velocity.y) * Math.max(t-m[0].t, window.currentFrameInterval)
                    }
                }
        
                // Function to handle mouse movement
                var mousemoveCallback = function(e) {
                    // Update the mouse position
                    playback.game.mouseX = (e.clientX - gfx.xoffset) / gfx.width * 512;
                    playback.game.mouseY = (e.clientY - gfx.yoffset) / gfx.height * 384;
                    movehistory.unshift({
                        x: playback.game.mouseX,
                        y: playback.game.mouseY,
                        t: new Date().getTime()
                    });
                    if (movehistory.length>10) movehistory.pop();
                }
        
                // Function to handle mouse down
                var mousedownCallback = function(e) {
                    // Update the mouse position
                    mousemoveCallback(e);
                    if (e.button == 0) {
                        // Left mouse button
                        if (playback.game.M1down) return;
                        playback.game.M1down = true;
                    }
                    else if (e.button == 2) {
                        // Right mouse button
                        if (playback.game.M2down) return;
                        playback.game.M2down = true;
                    }
                    else return;
                    e.preventDefault();
                    e.stopPropagation();
                    playback.game.down = playback.game.K1down || playback.game.K2down
                                      || playback.game.M1down || playback.game.M2down;
                    checkClickdown();
                }
        
                // Function to handle mouse up
                var mouseupCallback = function(e) {
                    // Update the mouse position
                    mousemoveCallback(e);
                    if (e.button == 0) playback.game.M1down = false; else
                    if (e.button == 2) playback.game.M2down = false; else
                    return;
                    e.preventDefault();
                    e.stopPropagation();
                    playback.game.down = playback.game.K1down || playback.game.K2down
                                      || playback.game.M1down || playback.game.M2down;
                }
        
                // Function to handle key down
                var keydownCallback = function(e) {
                    if (e.keyCode == playback.game.K1keycode) {
                        // Key 1
                        if (playback.game.K1down) return;
                        playback.game.K1down = true;
                    }
                    else if (e.keyCode == playback.game.K2keycode) {
                        // Key 2
                        if (playback.game.K2down) return;
                        playback.game.K2down = true;
                    }
                    else return;
                    e.preventDefault();
                    e.stopPropagation();
                    playback.game.down = playback.game.K1down || playback.game.K2down
                                      || playback.game.M1down || playback.game.M2down;
                    checkClickdown();
                }
        
                // Function to handle key up
                var keyupCallback = function(e) {
                    if (e.keyCode == playback.game.K1keycode) playback.game.K1down = false; else
                    if (e.keyCode == playback.game.K2keycode) playback.game.K2down = false; else
                    return;
                    e.preventDefault();
                    e.stopPropagation();
                    playback.game.down = playback.game.K1down || playback.game.K2down
                                      || playback.game.M1down || playback.game.M2down;
                }
        
                // Add event listeners
                if (!playback.autoplay) {
                    playback.game.window.addEventListener("mousemove", mousemoveCallback);
                    // Mouse click handling for gameplay
                    if (playback.game.allowMouseButton) {
                        playback.game.window.addEventListener("mousedown", mousedownCallback);
                        playback.game.window.addEventListener("mouseup", mouseupCallback);
                    }
                    // Keyboard click handling for gameplay
                    playback.game.window.addEventListener("keydown", keydownCallback);
                    playback.game.window.addEventListener("keyup", keyupCallback);
                }
        
                // Function to clean up player actions
                playback.game.cleanupPlayerActions = function() {
                    playback.game.window.removeEventListener("mousemove", mousemoveCallback);
                    playback.game.window.removeEventListener("mousedown", mousedownCallback);
                    playback.game.window.removeEventListener("mouseup", mouseupCallback);
                    playback.game.window.removeEventListener("keydown", keydownCallback);
                    playback.game.window.removeEventListener("keyup", keyupCallback);
                }
        
            }
        
            // Polyfill for Array.prototype.find
            if (!Array.prototype.find) {
                Object.defineProperty(Array.prototype, 'find', {
                    value: function(predicate) {
                        // 1. Let O be ? ToObject(this value).
                        if (this == null) {
                            throw new TypeError('"this" is null or not defined');
                        }
        
                        var o = Object(this);
        
                        // 2. Let len be ? ToLength(? Get(O, "length")).
                        var len = o.length >>> 0;
        
                        // 3. If IsCallable(predicate) is false, throw a TypeError exception.
                        if (typeof predicate !== 'function') {
                            throw new TypeError('predicate must be a function');
                        }
        
                        // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
                        var thisArg = arguments[1];
        
                        // 5. Let k be 0.
                        var k = 0;
        
                        // 6. Repeat, while k < len
                        while (k < len) {
                            // a. Let Pk be ! ToString(k).
                            // b. Let kValue be ? Get(O, Pk).
                            // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
                            // d. If testResult is true, return kValue.
                            var kValue = o[k];
                            if (predicate.call(thisArg, kValue, k, o)) {
                                return kValue;
                            }
                            // e. Increase k by 1.
                            k++;
                        }
        
                        // 7. Return undefined.
                        return undefined;
                    },
                    configurable: true,
                    writable: true
                });
            }
        
            // Return the playerActions function
            return playerActions;
        });