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