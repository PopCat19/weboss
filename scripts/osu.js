// Define the dependencies required by the module
define(["underscore", "osu-audio", "curves/LinearBezier", "curves/CircumscribedCircle"],
    function(_, OsuAudio, LinearBezier, CircumscribedCircle) {
    
        // Define constants for hit object types
        var HIT_TYPE_CIRCLE = 1,
            HIT_TYPE_SLIDER = 2,
            HIT_TYPE_NEWCOMBO = 4,
            HIT_TYPE_SPINNER = 8;
    
        // Define the Track class
        function Track(zip, track) {
            var self = this;
    
            // Initialize properties
            this.track = track;
            this.zip = zip;
            this.ondecoded = null;
    
            // Initialize objects to store data
            this.general = {};
            this.metadata = {};
            this.difficulty = {};
            this.colors = [];
            this.events = [];
            this.timingPoints = [];
            this.hitObjects = [];
        }
            // Bind the decode function to the Track instance
            this.decode = _.bind(function decode() {
                // Decode a .osu file
                var lines = self.track.replace("\r", "").split("\n");
    
                // Check the file format version
                if (lines[0] != "osu file format v14") {
                    // TODO: Handle different file formats
                }
    
                // Initialize variables for parsing
                var section = null;
                var combo = 0, index = 0;
                var forceNewCombo = false;
    
                // Iterate through the lines in the file
                for (var i = 0; i < lines.length; i++) {
                    var line = lines[i].trim();
    
                    // Skip empty lines and comments
                    if (line === "" || line.indexOf("//") === 0) continue;
    
                    // Check for section headers
                    if (line.indexOf("[") === 0) {
                        section = line;
                        continue;
                    }
    
                    // Parse the line based on the current section
                    switch (section) {
                        case "[General]":
                            // Parse general settings
                            var key = line.substr(0, line.indexOf(":"));
                            var value = line.substr(line.indexOf(":") + 1).trim();
                            if (isNaN(value)) {
                                self.general[key] = value;
                            } else {
                                self.general[key] = (+value);
                            }
                            break;
                        case "[Metadata]":
                            // Parse metadata
                            var key = line.substr(0, line.indexOf(":"));
                            var value = line.substr(line.indexOf(":") + 1).trim();
                            self.metadata[key] = value;
                            break;
                        case "[Events]":
                            // Parse events
                            self.events.push(line.split(","));
                            break;
                        case "[Difficulty]":
                            // Parse difficulty settings
                            var parts = line.split(":");
                            var value = parts[1].trim();
                            if (isNaN(value)) {
                                self.difficulty[parts[0]] = value;
                            } else {
                                self.difficulty[parts[0]] = (+value);
                            }
                            break;
                        case "[TimingPoints]":
                            // Parse timing points
                            var parts = line.split(",");
                            var t = {
                                offset: +parts[0],
                                millisecondsPerBeat: +parts[1],
                                meter: +parts[2],
                                sampleSet: +parts[3],
                                sampleIndex: +parts[4],
                                volume: +parts[5],
                                uninherited: +parts[6],
                                kaiMode: +parts[7]
                            };
    
                            // Fallback to default sample set if invalid
                            if (t.sampleSet > 3) t.sampleSet = 0;
    
                            // Check for invalid milliseconds per beat
                            if (t.millisecondsPerBeat < 0) {
                                t.uninherited = 0;
                            }
    
                            this.timingPoints.push(t);
                            break;
                        case "[Colours]":
                            // Parse colors
                            var parts = line.split(":");
                            var key = parts[0].trim();
                            var value = parts[1].trim();
                            if (key == "SliderTrackOverride")
                                self.colors.SliderTrackOverride = value.split(',');
                            else if (key == "SliderBorder")
                                self.colors.SliderBorder = value.split(',');
                            else self.colors.push(value.split(','));
                            break;
                        case "[HitObjects]":
                            // Parse hit objects
                            var parts = line.split(",");
                            var hit = {
                                x: +parts[0],
                                y: +parts[1],
                                time: +parts[2],
                                type: +parts[3],
                                hitSound: +parts[4]
                            };
    
                            // Handle combos
                            if ((hit.type & HIT_TYPE_NEWCOMBO) > 0 || forceNewCombo) {
                                combo++;
                                combo += (hit.type >> 4) & 7; // combo skip
                                index = 0;
                            }
                            forceNewCombo = false;
                            hit.combo = combo;
                            hit.index = index++;
    
                            // Decode specific hit object type
if ((hit.type & HIT_TYPE_CIRCLE) > 0) {
    hit.type = "circle";
    // Parse hit sample
    const hitSample = (parts.length > 5 ? parts[5] : '0:0:0:0:').split(":");
    hit.hitSample = {
        normalSet: +hitSample[0],
        additionSet: +hitSample[1],
        index: +hitSample[2],
        volume: +hitSample[3],
        filename: hitSample[4]
    };
} else if ((hit.type & HIT_TYPE_SLIDER) > 0) {
    hit.type = "slider";
    var sliderKeys = parts[5].split("|");
    hit.sliderType = sliderKeys[0];
    hit.keyframes = [];
    for (var j = 1; j < sliderKeys.length; j++) {
        var p = sliderKeys[j].split(":");
        hit.keyframes.push({ x: +p[0], y: +p[1] });
    }
    hit.repeat = +parts[6];
    hit.pixelLength = +parts[7];

    if (parts.length > 8) {
        hit.edgeHitsounds = parts[8].split("|").map(Number);
    } else {
        hit.edgeHitsounds = new Array();
        for (var wdnmd = 0; wdnmd < hit.repeat + 1; wdnmd++)
            hit.edgeHitsounds.push(0);
    }

    hit.edgeSets = new Array();
    for (var wdnmd = 0; wdnmd < hit.repeat + 1; wdnmd++)
        hit.edgeSets.push({
            normalSet: 0,
            additionSet: 0
        });
    if (parts.length > 9) {
        var additions = parts[9].split("|");
        for (var wdnmd = 0; wdnmd < additions.length; wdnmd++) {
            var sets = additions[wdnmd].split(":");
            hit.edgeSets[wdnmd].normalSet = +sets[0];
            hit.edgeSets[wdnmd].additionSet = +sets[1]
        }
    }
    // Parse hit sample
    const hitSample = (parts.length > 10 ? parts[10] : '0:0:0:0:').split(":");
    hit.hitSample = {
        normalSet: +hitSample[0],
        additionSet: +hitSample[1],
        index: +hitSample[2],
        volume: +hitSample[3],
        filename: hitSample[4]
    };
} else if ((hit.type & HIT_TYPE_SPINNER) > 0) {
    if (hit.type & HIT_TYPE_NEWCOMBO)
        combo--;
    hit.combo = combo - ((hit.type >> 4) & 7); // force in same combo
    forceNewCombo = true; // force next object in new combo
    hit.type = "spinner";
    hit.endTime = +parts[5];
    if (hit.endTime < hit.time)
        hit.endTime = hit.time + 1;
    // Parse hit sample
    const hitSample = (parts.length > 6 ? parts[6] : '0:0:0:0:').split(":");
    hit.hitSample = {
        normalSet: +hitSample[0],
        additionSet: +hitSample[1],
        index: +hitSample[2],
        volume: +hitSample[3],
        filename: hitSample[4]
    };
} else {
    console.log("Attempted to decode unknown hit object type " + hit.type + ": " + line);
}
// Fallback to default sample set if invalid
if (hit.hitSample && hit.hitSample.normalSet > 3)
    hit.hitSample.normalSet = 0;
if (hit.hitSample && hit.hitSample.additionSet > 3)
    hit.hitSample.additionSet = 0;
self.hitObjects.push(hit);
break;
}

// Define the stack hit objects function
function stackHitObjects(track) {
    // Stack coinciding objects to make them easier to see.
    // Stacked objects form chains (probably not with consecutive index)
    const AR = track.difficulty.ApproachRate;
    const approachTime = AR < 5 ? 1800 - 120 * AR : 1950 - 150 * AR;
    const stackDistance = 3;
    const stackThreshold = approachTime * track.general.StackLeniency;

    // Time interval between hitobject A and hitobject B
    // (it's guaranteed that A and B are not spinners)
    function getintv(A, B) {
        let endTime = A.time;
        if (A.type == "slider") {
            // Add slider duration
            endTime += A.repeat * A.timing.millisecondsPerBeat * (A.pixelLength / track.difficulty.SliderMultiplier) / 100;
        }
        return B.time - endTime;
    }

    // Distance (in osu pixels) between hitobject A and hitobject B
    // (it's guaranteed that A and B are not spinners)
    function getdist(A, B) {
        let x = A.x;
        let y = A.y;
        if (A.type == "slider" && (A.repeat % 2 == 1)) {
            x = A.curve.curve[A.curve.curve.length - 1].x;
            y = A.curve.curve[A.curve.curve.length - 1].y;
        }
        return Math.hypot(x - B.x, y - B.y);
    }

    let chains = new Array(); // Array of chains represented by array of index
    let stacked = new Array(track.hitObjects.length); // Whether a hitobject has been added to chains
    stacked.fill(false);
    for (let i = 0; i < track.hitObjects.length; ++i) {
        if (stacked[i]) continue;
        let hitI = track.hitObjects[i];
        if (hitI.type == "spinner") continue;
        // Start a new chain
        stacked[i] = true;
        let newchain = [hitI];
        // Finding chain starting from hitI
        for (let j = i + 1; j < track.hitObjects.length; ++j) {
            let hitJ = track.hitObjects[j];
            if (hitJ.type == "spinner") break;
            if (getintv(newchain[newchain.length - 1], hitJ) > stackThreshold) break;
            // Append hitJ to the chain if it's close in space & time
            if (getdist(newchain[newchain.length - 1], hitJ) <= stackDistance) {
                // First check if hitJ is already stacked
                if (stacked[j]) {
                    // Intersecting with a previous chain.
                    // This shouldn't happen in a usual beatmap.
                    console.warn("[preproc]", track.metadata.BeatmapID || track.metadata.Title + '/' + track.metadata.Version, "object stacks intersecting", i, j);
                    // Quit stacking
                    break;
                }
                stacked[j] = true;
                newchain.push(hitJ);
            }
        }
        if (newchain.length > 1) { // Just ignoring one-element chains
            chains.push(newchain);
        }
    }
    // Stack offset
    const stackScale = (1.0 - 0.7 * (track.difficulty.CircleSize - 5) / 5) / 2;
    const scaleX = stackScale * 6.4;
    const scaleY = stackScale * 6.4;
    function movehit(hit, dep) {
        hit.x += scaleX * dep;
        hit.y += scaleY * dep;
        if (hit.type == "slider") {
            for (let j = 0; j < hit.keyframes.length; ++j) {
                hit.keyframes[j].x += scaleX * dep;
                hit.keyframes[j].y += scaleY * dep;
            }
            for (let j = 0; j < hit.curve.curve.length; ++j) {
                hit.curve.curve[j].x += scaleX * dep;
                hit.curve.curve[j].y += scaleY * dep;
            }
        }
    }
    for (let i = 0; i < chains.length; ++i) {
        if (chains[i][0].type == "slider") {
            // Fix this slider and move objects below
            for (let j = 0, dep = 0; j < chains[i].length; ++j) {
                movehit(chains[i][j], dep);
                if (chains[i][j].type != "slider" || chains[i][j].repeat % 2 == 0)
                    dep++;
            }
        } else {
            // Fix object at bottom
            for (let j = 0, dep = 0; j < chains[i].length; ++j) {
                let cur = chains[i].length - 1 - j;
                if (j > 0 && (chains[i][cur].type == "slider" && chains[i][cur].repeat % 2 == 1))
                    dep--;
                movehit(chains[i][cur], -dep);
                dep++;
                }
            }
        }
    }
}})})