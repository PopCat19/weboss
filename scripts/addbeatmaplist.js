// Simplified star rating function
function starname(star) {
    if (star == null || star === undefined) return "unknown";
    if (star < 2) return "easy";
    if (star < 2.7) return "normal";
    if (star < 4) return "hard";
    if (star < 5.3) return "insane";
    if (star < 6.5) return "expert";
    return "expert-plus";
}

// Optimized star row creation
function createStarRow(star) {
    const row = document.createElement("div");
    row.className = "star-row";

    for (let i = 0; i < 10; i++) {
        const container = document.createElement("div");
        container.className = "imgcontainer";

        const img = document.createElement("img");
        img.src = "star.png";

        const value = Math.min(Math.max(star - i, 0), 1);
        const size = 8 + value * 10;
        const pad = (1 - value) * 5;

        img.style.cssText = `
            width: ${size}px;
            bottom: ${pad}px;
            left: ${pad}px;
            opacity: ${value === 0 ? 0.4 : 1};
        `;

        container.appendChild(img);
        row.appendChild(container);
    }

    return row;
}

// Simplified difficulty list creation
function createDifficultyList(boxclicked, event) {
    // Remove existing difficulty list
    if (window.currentDifficultyList) {
        window.removeEventListener("click", window.currentDifficultyList.clicklistener);
        window.currentDifficultyList.parentElement.removeChild(window.currentDifficultyList);
        window.currentDifficultyList = null;
    }

    event.stopPropagation();

    // Calculate list position
    const rect = boxclicked.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Create difficulty box
    const difficultyBox = document.createElement("div");
    window.currentDifficultyList = difficultyBox;
    difficultyBox.className = "difficulty-box";
    difficultyBox.style.left = `${x}px`;
    difficultyBox.style.top = `${y}px`;
    boxclicked.appendChild(difficultyBox);

    // Close list function
    const closeDifficultyList = () => {
        boxclicked.removeChild(difficultyBox);
        window.currentDifficultyList = null;
        window.removeEventListener('click', closeDifficultyList, false);
    };

    window.addEventListener("click", closeDifficultyList, false);
    difficultyBox.clicklistener = closeDifficultyList;

    // Populate difficulty list
    boxclicked.data.forEach(item => {
        const difficultyItem = document.createElement("div");
        difficultyItem.className = "difficulty-item";
        difficultyItem.data = item;

        // Create ring icon
        const ringbase = document.createElement("div");
        const ring = document.createElement("div");
        ringbase.className = "bigringbase";
        ring.className = `bigring ${starname(item.star)}`;

        difficultyItem.append(ringbase, ring);

        // Create version and mapper info
        const line = document.createElement("div");
        line.className = "versionline";

        const version = document.createElement("div");
        version.className = "version";
        version.innerText = item.version;

        const mapper = document.createElement("div");
        mapper.className = "mapper";
        mapper.innerText = `mapped by ${item.creator}`;

        line.append(version, mapper);
        difficultyItem.appendChild(line);

        // Add star row
        difficultyItem.appendChild(createStarRow(item.star));

        // Add click handler
        difficultyItem.onclick = function(e) {
            if (!window.scriptReady || !window.soundReady || !window.skinReady || !this.parentElement.parentElement.oszblob) {
                return;
            }
            launchGame(this.parentElement.parentElement.oszblob, this.data.bid, this.data.version);
        };

        difficultyBox.appendChild(difficultyItem);
    });

    difficultyBox.onclick = (e) => e.stopPropagation();
}

var NSaddBeatmapList = {
    addlikeicon: function(box) {
        const icon = document.createElement("div");
        icon.className = "beatmaplike";
        icon.setAttribute("hidden", "");
        box.appendChild(icon);

        box.initlike = function() {
            if (!window.liked_sid_set || !box.sid) {
                return;
            }
            if (window.liked_sid_set.has(box.sid)) {
                icon.classList.add("icon-heart");
                icon.onclick = box.undolike;
            } else {
                icon.classList.add("icon-heart-empty");
                icon.onclick = box.like;
            }
            icon.removeAttribute("hidden");
        };

        box.like = function(e) {
            e.stopPropagation();
            window.liked_sid_set.add(box.sid);
            localforage.setItem("likedsidset", window.liked_sid_set, function(err) {
                if (err) {
                    console.error("Error saving liked beatmap list");
                } else {
                    icon.classList.add("hint-liked");
                }
            });
            icon.onclick = box.undolike;
            icon.classList.remove("icon-heart-empty");
            icon.classList.add("icon-heart");
        };

        box.undolike = function(e) {
            e.stopPropagation();
            window.liked_sid_set.delete(box.sid);
            localforage.setItem("likedsidset", window.liked_sid_set, function(err) {
                if (err) {
                    console.error("Error saving liked beatmap list");
                }
            });
            icon.onclick = box.like;
            icon.classList.remove("icon-heart");
            icon.classList.add("icon-heart-empty");
            icon.classList.remove("hint-liked");
        };

        if (window.liked_sid_set) {
            box.initlike();
        } else {
            if (!window.liked_sid_set_callbacks) {
                window.liked_sid_set_callbacks = [];
            }
            window.liked_sid_set_callbacks.push(box.initlike);
        }
    },

    // Map contains key: sid, title, artist, creator
    addpreviewbox: function(map, list) {
        function approvedText(status) {
            switch (status) {
                case 4: return "LOVED";
                case 3: return "QUALIFIED";
                case 2: return "APPROVED";
                case 1: return "RANKED";
                case 0: return "PENDING";
                case -1: return "WIP";
                case -2: return "GRAVEYARD";
                default: return "UNKNOWN";
            }
        }

        // Create container of beatmap on web page
        const pBeatmapBox = document.createElement("div");
        pBeatmapBox.setdata = map;
        pBeatmapBox.sid = map.sid;

        const pBeatmapCover = document.createElement("img");
        const pBeatmapCoverOverlay = document.createElement("div");
        const pBeatmapTitle = document.createElement("div");
        const pBeatmapArtist = document.createElement("div");
        const pBeatmapCreator = document.createElement("div");
        const pBeatmapApproved = document.createElement("div");

        pBeatmapBox.className = "beatmapbox";
        pBeatmapCover.className = "beatmapcover";
        pBeatmapCoverOverlay.className = "beatmapcover-overlay";
        pBeatmapTitle.className = "beatmaptitle";
        pBeatmapArtist.className = "beatmapartist";
        pBeatmapCreator.className = "beatmapcreator";
        pBeatmapApproved.className = "beatmapapproved";

        pBeatmapBox.appendChild(pBeatmapCover);
        pBeatmapBox.appendChild(pBeatmapCoverOverlay);
        pBeatmapBox.appendChild(pBeatmapTitle);
        pBeatmapBox.appendChild(pBeatmapArtist);
        pBeatmapBox.appendChild(pBeatmapCreator);
        pBeatmapBox.appendChild(pBeatmapApproved);

        NSaddBeatmapList.addlikeicon(pBeatmapBox);

        // Set beatmap title & artist display (prefer ASCII title)
        pBeatmapTitle.innerText = map.title;
        pBeatmapArtist.innerText = map.artist;
        pBeatmapCreator.innerText = "mapped by " + map.creator;
        pBeatmapCover.alt = "cover" + map.sid;
        pBeatmapCover.src = "https://assets.ppy.sh/beatmaps/" + map.sid + "/covers/cover@2x.jpg";

        list.appendChild(pBeatmapBox);
        pBeatmapApproved.innerText = approvedText(map.approved);
        return pBeatmapBox;
    },

    addStarRings: function(box, data) {
        // Get star ratings
        const stars = data.map(item => item.star);

        const row = document.createElement("div");
        row.className = "beatmap-difficulties";
        box.appendChild(row);

        // Show all of them if can be fit in
        if (stars.length <= 13) {
            stars.forEach(star => {
                const difficultyRing = document.createElement("div");
                difficultyRing.className = "difficulty-ring";
                const s = starname(star);
                if (s.length > 0) {
                    difficultyRing.classList.add(s);
                }
                row.appendChild(difficultyRing);
            });
        } else {
            // Show only highest star and count otherwise
            const difficultyRing = document.createElement("div");
            difficultyRing.className = "difficulty-ring";
            const s = starname(stars[stars.length - 1]);
            if (s.length > 0) {
                difficultyRing.classList.add(s);
            }
            row.appendChild(difficultyRing);

            const count = document.createElement("span");
            count.className = "difficulty-count";
            count.innerText = stars.length;
            row.appendChild(count);
        }

        if (data.length === 0) {
            const count = document.createElement("span");
            count.className = "difficulty-count";
            count.innerText = "no std map";
            row.appendChild(count);
        }
    },

    addLength: function(box, data) {
        // Show length & bpm
        let length = 0;
        let bpm = 0;
        data.forEach(item => {
            length = Math.max(length, item.length);
            bpm = Math.max(bpm, item.BPM);
        });

        const pBeatmapLength = document.createElement("div");
        pBeatmapLength.className = "beatmaplength";
        box.appendChild(pBeatmapLength);
        pBeatmapLength.innerText = Math.floor(length / 60) + ":" + (length % 60 < 10 ? "0" : "") + (length % 60);
    },

    addMoreInfo: function(box, data) {
        // Remove all but osu std mode
        data = data.filter(o => o.mode === 0);
        data.sort((a, b) => Math.sign(a.star - b.star));
        box.data = data;
        NSaddBeatmapList.addStarRings(box, data);
        NSaddBeatmapList.addLength(box, data);
    },

    // Async request for more information
    requestMoreInfo: function(box) {
        const url = "https://api.sayobot.cn/beatmapinfo?1=" + box.sid;
        const xhr = new XMLHttpRequest();
        xhr.responseType = 'text';
        xhr.open("GET", url);
        xhr.onload = function() {
            const res = JSON.parse(xhr.response);
            NSaddBeatmapList.addMoreInfo(box, res.data);
        };
        xhr.send();
    }
};

// Async function to add symbols of these beatmap packs to webpage
// listurl: URL of API request that returns a list of beatmap packs
// list: DOM element to insert beatmaps into
// filter, maxsize: doesn't apply if not specified
// Note that some beatmaps may not contain std mode, so we request more maps than we need
function addBeatmapList(listurl, list, filter, maxsize) {
    if (!list) list = document.getElementById("beatmap-list");

    // Request beatmap pack list
    const xhr = new XMLHttpRequest();
    xhr.responseType = 'text';
    xhr.open("GET", listurl);

    // Async part 1
    xhr.onload = function() {
        const res = JSON.parse(xhr.response);
        if (typeof(res.endid) !== "undefined") {
            window.list_endid = res.endid;
        } else {
            window.list_endid = 0;
            return;
        }

        let box = [];
        if (filter && res.data) {
            res.data = res.data.filter(filter);
        }
        if (maxsize && res.data) {
            res.data = res.data.slice(0, maxsize);
        }

        // Add widget to webpage as soon as list is fetched
        res.data.forEach(dataItem => {
            box.push(NSaddBeatmapList.addpreviewbox(dataItem, list));
        });

        // Async add more info
        box.forEach((item, index) => {
            item.sid = res.data[index].sid;
            NSaddBeatmapList.requestMoreInfo(item);
            item.onclick = function(e) {
                // This is effective only when box.data is available
                createDifficultyList(item, e);
                startdownload(item);
            };
        });

        if (window.beatmaplistLoadedCallback) {
            window.beatmaplistLoadedCallback();
            window.beatmaplistLoadedCallback = null; // To make sure it's called only once
        }
    };
    xhr.send();
}

function addBeatmapSid(sid, list) {
    if (!list) list = document.getElementById("beatmap-list");
    const url = "https://api.sayobot.cn/v2/beatmapinfo?0=" + sid;
    const xhr = new XMLHttpRequest();
    xhr.responseType = 'text';
    xhr.open("GET", url);
    xhr.onload = function() {
        const res = JSON.parse(xhr.response);
        if (res.status === -1) {
            alert("Beatmap not found with specified sid");
            return;
        }

        // Use data of first track as set data
        const box = NSaddBeatmapList.addpreviewbox(res.data, list);
        box.sid = res.data.sid;
        NSaddBeatmapList.requestMoreInfo(box);
        box.onclick = function(e) {
            // This is effective only when box.data is available
            createDifficultyList(box, e);
            startdownload(box);
        };

        if (window.beatmaplistLoadedCallback) {
            window.beatmaplistLoadedCallback();
            window.beatmaplistLoadedCallback = null; // To make sure it's called only once
        }
    };
    xhr.send();
}

// Simplified star rating function
// Returns a string representing the difficulty level of a beatmap based on its star rating
function starname(star) {
    // If star rating is null or undefined, return "unknown"
    if (star == null || star === undefined) return "unknown";
    // If star rating is less than 2, return "easy"
    if (star < 2) return "easy";
    // If star rating is less than 2.7, return "normal"
    if (star < 2.7) return "normal";
    // If star rating is less than 4, return "hard"
    if (star < 4) return "hard";
    // If star rating is less than 5.3, return "insane"
    if (star < 5.3) return "insane";
    // If star rating is less than 6.5, return "expert"
    if (star < 6.5) return "expert";
    // Otherwise, return "expert-plus"
    return "expert-plus";
}

// Optimized star row creation
// Creates a div element representing a star row for a beatmap
function createStarRow(star) {
    // Create a new div element with class "star-row"
    const row = document.createElement("div");
    row.className = "star-row";

    // Loop 10 times to create 10 star images
    for (let i = 0; i < 10; i++) {
        // Create a new div element with class "imgcontainer"
        const container = document.createElement("div");
        container.className = "imgcontainer";

        // Create a new img element with src "star.png"
        const img = document.createElement("img");
        img.src = "star.png";

        // Calculate the size and padding of the star image based on the star rating
        const value = Math.min(Math.max(star - i, 0), 1);
        const size = 8 + value * 10;
        const pad = (1 - value) * 5;

        // Set the CSS styles for the star image
        img.style.cssText = `
            width: ${size}px;
            bottom: ${pad}px;
            left: ${pad}px;
            opacity: ${value === 0 ? 0.4 : 1};
        `;

        // Append the star image to the container
        container.appendChild(img);
        // Append the container to the row
        row.appendChild(container);
    }

    // Return the star row element
    return row;
}

// Simplified difficulty list creation
// Creates a difficulty list for a beatmap and appends it to the page
function createDifficultyList(boxclicked, event) {
    // Remove any existing difficulty list
    if (window.currentDifficultyList) {
        window.removeEventListener("click", window.currentDifficultyList.clicklistener);
        window.currentDifficultyList.parentElement.removeChild(window.currentDifficultyList);
        window.currentDifficultyList = null;
    }

    // Stop the event from propagating
    event.stopPropagation();

    // Calculate the position of the difficulty list
    const rect = boxclicked.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Create a new div element with class "difficulty-box"
    const difficultyBox = document.createElement("div");
    window.currentDifficultyList = difficultyBox;
    difficultyBox.className = "difficulty-box";
    difficultyBox.style.left = `${x}px`;
    difficultyBox.style.top = `${y}px`;
    boxclicked.appendChild(difficultyBox);

    // Create a function to close the difficulty list
    const closeDifficultyList = () => {
        boxclicked.removeChild(difficultyBox);
        window.currentDifficultyList = null;
        window.removeEventListener('click', closeDifficultyList, false);
    };

    // Add an event listener to close the difficulty list when the page is clicked
    window.addEventListener("click", closeDifficultyList, false);
    difficultyBox.clicklistener = closeDifficultyList;

    // Populate the difficulty list with data from the beatmap
    boxclicked.data.forEach(item => {
        // Create a new div element with class "difficulty-item"
        const difficultyItem = document.createElement("div");
        difficultyItem.className = "difficulty-item";
        difficultyItem.data = item;

        // Create a ring icon for the difficulty item
        const ringbase = document.createElement("div");
        const ring = document.createElement("div");
        ringbase.className = "bigringbase";
        ring.className = `bigring ${starname(item.star)}`;

        // Append the ring icon to the difficulty item
        difficultyItem.append(ringbase, ring);

        // Create a version and mapper info element
        const line = document.createElement("div");
        line.className = "versionline";

        const version = document.createElement("div");
        version.className = "version";
        version.innerText = item.version;

        const mapper = document.createElement("div");
        mapper.className = "mapper";
        mapper.innerText = `mapped by ${item.creator}`;

        // Append the version and mapper info to the line element
        line.append(version, mapper);
        // Append the line element to the difficulty item
        difficultyItem.appendChild(line);

        // Add a star row to the difficulty item
        difficultyItem.appendChild(createStarRow(item.star));

        // Add a click handler to the difficulty item
        difficultyItem.onclick = function(e) {
            // Check if the game is ready to launch
            if (!window.scriptReady || !window.soundReady || !window.skinReady || !this.parentElement.parentElement.oszblob) {
                return;
            }
            // Launch the game with the selected difficulty
            launchGame(this.parentElement.parentElement.oszblob, this.data.bid, this.data.version);
        };

        // Append the difficulty item to the difficulty box
        difficultyBox.appendChild(difficultyItem);
    });

    // Add an event listener to stop the event from propagating when the difficulty box is clicked
    difficultyBox.onclick = (e) => e.stopPropagation();
}

// Object containing functions to add beatmap list elements to the page
var NSaddBeatmapList = {
    // Add a like icon to a beatmap box
    addlikeicon: function(box) {
        // Create a new div element with class "beatmaplike"
        const icon = document.createElement("div");
        icon.className = "beatmaplike";
        icon.setAttribute("hidden", "");
        box.appendChild(icon);

        // Create functions to handle liking and unliking the beatmap
        box.initlike = function() {
            // Check if the liked sid set is available
            if (!window.liked_sid_set || !box.sid) {
                return;
            }
            // Check if the beatmap is already liked
            if (window.liked_sid_set.has(box.sid)) {
                icon.classList.add("icon-heart");
                icon.onclick = box.undolike;
            } else {
                icon.classList.add("icon-heart-empty");
                icon.onclick = box.like;
            }
            // Remove the hidden attribute from the icon
            icon.removeAttribute("hidden");
        };

        // Function to like the beatmap
        box.like = function(e) {
            // Stop the event from propagating
            e.stopPropagation();
            // Add the beatmap's sid to the liked sid set
            window.liked_sid_set.add(box.sid);
            // Save the liked sid set to local storage
            localforage.setItem("likedsidset", window.liked_sid_set, function(err) {
                if (err) {
                    console.error("Error saving liked beatmap list");
                } else {
                    // Add a hint class to the icon to indicate that the beatmap is liked
                    icon.classList.add("hint-liked");
                }
            });
            // Update the icon's class and click handler
            icon.onclick = box.undolike;
            icon.classList.remove("icon-heart-empty");
            icon.classList.add("icon-heart");
        };
        
        // Function to unlike the beatmap
        box.undolike = function(e) {
            // Stop the event from propagating
            e.stopPropagation();
            // Remove the beatmap's sid from the liked sid set
            window.liked_sid_set.delete(box.sid);
            // Save the liked sid set to local storage
            localforage.setItem("likedsidset", window.liked_sid_set, function(err) {
                if (err) {
                    console.error("Error saving liked beatmap list");
                }
            });
            // Update the icon's class and click handler
            icon.onclick = box.like;
            icon.classList.remove("icon-heart");
            icon.classList.add("icon-heart-empty");
            icon.classList.remove("hint-liked");
        };
        
        // Check if the liked sid set is available and initialize the like icon if so
        if (window.liked_sid_set) {
            box.initlike();
        } else {
            // If not, add the initialization function to a callback list
            if (!window.liked_sid_set_callbacks) {
                window.liked_sid_set_callbacks = [];
            }
            window.liked_sid_set_callbacks.push(box.initlike);
        }
        },
        
        // Add a preview box for a beatmap to the page
        addpreviewbox: function(map, list) {
            // Function to get the approved text for a beatmap
            function approvedText(status) {
                switch (status) {
                    case 4: return "LOVED";
                    case 3: return "QUALIFIED";
                    case 2: return "APPROVED";
                    case 1: return "RANKED";
                    case 0: return "PENDING";
                    case -1: return "WIP";
                    case -2: return "GRAVEYARD";
                    default: return "UNKNOWN";
                }
            }
        
            // Create a new div element for the beatmap box
            const pBeatmapBox = document.createElement("div");
            pBeatmapBox.setdata = map;
            pBeatmapBox.sid = map.sid;
        
            // Create elements for the beatmap cover, title, artist, creator, and approved text
            const pBeatmapCover = document.createElement("img");
            const pBeatmapCoverOverlay = document.createElement("div");
            const pBeatmapTitle = document.createElement("div");
            const pBeatmapArtist = document.createElement("div");
            const pBeatmapCreator = document.createElement("div");
            const pBeatmapApproved = document.createElement("div");
        
            // Set the classes for the elements
            pBeatmapBox.className = "beatmapbox";
            pBeatmapCover.className = "beatmapcover";
            pBeatmapCoverOverlay.className = "beatmapcover-overlay";
            pBeatmapTitle.className = "beatmaptitle";
            pBeatmapArtist.className = "beatmapartist";
            pBeatmapCreator.className = "beatmapcreator";
            pBeatmapApproved.className = "beatmapapproved";
        
            // Append the elements to the beatmap box
            pBeatmapBox.appendChild(pBeatmapCover);
            pBeatmapBox.appendChild(pBeatmapCoverOverlay);
            pBeatmapBox.appendChild(pBeatmapTitle);
            pBeatmapBox.appendChild(pBeatmapArtist);
            pBeatmapBox.appendChild(pBeatmapCreator);
            pBeatmapBox.appendChild(pBeatmapApproved);
        
            // Add a like icon to the beatmap box
            NSaddBeatmapList.addlikeicon(pBeatmapBox);
        
            // Set the text and image for the beatmap cover, title, artist, creator, and approved text
            pBeatmapTitle.innerText = map.title;
            pBeatmapArtist.innerText = map.artist;
            pBeatmapCreator.innerText = "mapped by " + map.creator;
            pBeatmapCover.alt = "cover" + map.sid;
            pBeatmapCover.src = "https://assets.ppy.sh/beatmaps/" + map.sid + "/covers/cover@2x.jpg";
        
            // Append the beatmap box to the list
            list.appendChild(pBeatmapBox);
            pBeatmapApproved.innerText = approvedText(map.approved);
            return pBeatmapBox;
        },
        
        // Add star rings to a beatmap box
        addStarRings: function(box, data) {
            // Get the star ratings for the beatmap
            const stars = data.map(item => item.star);
        
            // Create a new div element for the star rings
            const row = document.createElement("div");
            row.className = "beatmap-difficulties";
            box.appendChild(row);
        
            // Check if there are more than 13 star ratings
            if (stars.length <= 13) {
                // If not, create a star ring for each rating
                stars.forEach(star => {
                    const difficultyRing = document.createElement("div");
                    difficultyRing.className = "difficulty-ring";
                    const s = starname(star);
                    if (s.length > 0) {
                        difficultyRing.classList.add(s);
                    }
                    row.appendChild(difficultyRing);
                });
            } else {
                // If so, create a star ring for the highest rating and a count of the remaining ratings
                const difficultyRing = document.createElement("div");
                difficultyRing.className = "difficulty-ring";
                const s = starname(stars[stars.length - 1]);
                if (s.length > 0) {
                    difficultyRing.classList.add(s);
                }
                row.appendChild(difficultyRing);
        
                const count = document.createElement("span");
                count.className = "difficulty-count";
                count.innerText = stars.length;
                row.appendChild(count);
            }
        
            // Check if there are no standard maps for the beatmap
            if (data.length === 0) {
                const count = document.createElement("span");
                count.className = "difficulty-count";
                count.innerText = "no std map";
                row.appendChild(count);
            }
        },
        
        // Add the length and BPM of a beatmap to the page
addLength: function(box, data) {
    // Get the length and BPM of the beatmap
    let length = 0;
    let bpm = 0;
    data.forEach(item => {
        length = Math.max(length, item.length);
        bpm = Math.max(bpm, item.BPM);
    });

    // Create a new div element for the length and BPM
    const pBeatmapLength = document.createElement("div");
    pBeatmapLength.className = "beatmaplength";
    box.appendChild(pBeatmapLength);
    // Set the text for the length and BPM
    pBeatmapLength.innerText = Math.floor(length / 60) + ":" + (length % 60 < 10 ? "0" : "") + (length % 60);
},

// Add more information to a beatmap box
addMoreInfo: function(box, data) {
    // Remove all but osu std mode from the data
    data = data.filter(o => o.mode === 0);
    // Sort the data by star rating
    data.sort((a, b) => Math.sign(a.star - b.star));
    // Set the data for the beatmap box
    box.data = data;
    // Add star rings to the beatmap box
    NSaddBeatmapList.addStarRings(box, data);
    // Add the length and BPM to the beatmap box
    NSaddBeatmapList.addLength(box, data);
},

// Request more information for a beatmap
requestMoreInfo: function(box) {
    // Create a URL for the API request
    const url = "https://api.sayobot.cn/beatmapinfo?1=" + box.sid;
    // Create a new XMLHttpRequest object
    const xhr = new XMLHttpRequest();
    // Set the response type to text
    xhr.responseType = 'text';
    // Open the request
    xhr.open("GET", url);
    // Set the onload event handler
    xhr.onload = function() {
        // Parse the response as JSON
        const res = JSON.parse(xhr.response);
        // Add more information to the beatmap box
        NSaddBeatmapList.addMoreInfo(box, res.data);
    };
    // Send the request
    xhr.send();
}
};

// Async function to add a beatmap list to the page
function addBeatmapList(listurl, list, filter, maxsize) {
    // Check if the list element is provided
    if (!list) list = document.getElementById("beatmap-list");

    // Create a new XMLHttpRequest object
    const xhr = new XMLHttpRequest();
    // Set the response type to text
    xhr.responseType = 'text';
    // Open the request
    xhr.open("GET", listurl);

    // Set the onload event handler
    xhr.onload = function() {
        // Parse the response as JSON
        const res = JSON.parse(xhr.response);
        // Check if the endid is provided
        if (typeof(res.endid) !== "undefined") {
            // Set the endid for the list
            window.list_endid = res.endid;
        } else {
            // If not, set the endid to 0
            window.list_endid = 0;
            return;
        }

        // Create an array to store the beatmap boxes
        let box = [];
        // Check if a filter is provided
        if (filter && res.data) {
            // Filter the data
            res.data = res.data.filter(filter);
        }
        // Check if a maxsize is provided
        if (maxsize && res.data) {
            // Slice the data to the maxsize
            res.data = res.data.slice(0, maxsize);
        }

        // Create a beatmap box for each item in the data
        res.data.forEach(dataItem => {
            // Create a new beatmap box
            box.push(NSaddBeatmapList.addpreviewbox(dataItem, list));
        });

        // Request more information for each beatmap box
        box.forEach((item, index) => {
            // Set the sid for the beatmap box
            item.sid = res.data[index].sid;
            // Request more information for the beatmap box
            NSaddBeatmapList.requestMoreInfo(item);
            // Set the onclick event handler for the beatmap box
            item.onclick = function(e) {
                // Check if the data is available
                if (!this.data) return;
                // Create a difficulty list for the beatmap box
                createDifficultyList(this, e);
                // Start the download for the beatmap box
                startdownload(this);
            };
        });

        // Check if a callback is provided
        if (window.beatmaplistLoadedCallback) {
            // Call the callback
            window.beatmaplistLoadedCallback();
            // Set the callback to null
            window.beatmaplistLoadedCallback = null;
        }
    };
    // Send the request
    xhr.send();
}

// Function to add a beatmap to the page by sid
function addBeatmapSid(sid, list) {
    // Check if the list element is provided
    if (!list) list = document.getElementById("beatmap-list");
    // Create a URL for the API request
    const url = "https://api.sayobot.cn/v2/beatmapinfo?0=" + sid;
    // Create a new XMLHttpRequest object
    const xhr = new XMLHttpRequest();
    // Set the response type to text
    xhr.responseType = 'text';
    // Open the request
    xhr.open("GET", url);
    // Set the onload event handler
    xhr.onload = function() {
        // Parse the response as JSON
        const res = JSON.parse(xhr.response);
        // Check if the beatmap is found
        if (res.status === -1) {
            // Alert the user that the beatmap is not found
            alert("Beatmap not found with specified sid");
            return;
        }

        // Create a new beatmap box
        const box = NSaddBeatmapList.addpreviewbox(res.data, list);
        // Set the sid for the beatmap box
        box.sid = res.data.sid;
        // Request more information for the beatmap box
        NSaddBeatmapList.requestMoreInfo(box);
        // Set the onclick event handler for the beatmap box
        box.onclick = function(e) {
            // Check if the data is available
            if (!this.data) return;
            // Create a difficulty list for the beatmap box
            createDifficultyList(this, e);
            // Start the download for the beatmap box
            startdownload(this);
        };

        // Check if a callback is provided
        if (window.beatmaplistLoadedCallback) {
            // Call the callback
            window.beatmaplistLoadedCallback();
            // Set the callback to null
            window.beatmaplistLoadedCallback = null;
        }
    };
    // Send the request
    xhr.send();
}