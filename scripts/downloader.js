/**
 * Beatmap Downloader
 *
 * This script provides functionality for downloading beatmaps from osu.direct.
 */

/**
 * Starts a preview of the beatmap.
 *
 * @param {object} box - The beatmap box element.
 */
function startpreview(box) {
    // Get the volume settings from the game settings, if available.
    let volume = 1;
    if (window.gamesettings) {
        volume = (window.gamesettings.mastervolume / 100) * (window.gamesettings.musicvolume / 100);
        volume = Math.min(1, Math.max(0, volume));
    }

    // Stop any currently playing audio.
    let audios = document.getElementsByTagName("audio");
    for (let i = 0; i < audios.length; ++i) {
        if (audios[i].softstop) {
            audios[i].softstop();
        }
    }

    // Create a new audio element for the preview.
    let a = document.createElement("audio");
    let s = document.createElement("source");
    // Use the osu.direct media preview URL.
    s.src = `https://osu.direct/api/media/preview/${box.sid}`;
    s.type = "audio/mpeg";
    a.appendChild(s);
    a.volume = 0;
    a.play();

    // Add the audio element to the page.
    document.body.appendChild(a);

    // Fade in the audio over 30ms intervals.
    let fadeIn = setInterval(function () {
        if (a.volume < volume) {
            a.volume = Math.min(volume, a.volume + 0.05 * volume);
        } else {
            clearInterval(fadeIn);
        }
    }, 30);

    // Fade out the audio after 9.3 seconds (assuming a 10s long preview).
    let fadeOut = setInterval(function () {
        if (a.currentTime > 9.3) {
            a.volume = Math.max(0, a.volume - 0.05 * volume);
        }
        if (a.volume == 0) {
            clearInterval(fadeOut);
        }
    }, 30);

    // Define a softstop function to stop the audio and remove it from the page.
    a.softstop = function () {
        let fadeOut = setInterval(function () {
            a.volume = Math.max(0, a.volume - 0.05 * volume);
            if (a.volume == 0) {
                clearInterval(fadeOut);
                a.remove();
            }
        }, 10);
    }
}

/**
 * Logs a message to the server.
 *
 * @param {string} message - The message to log.
 */
function log_to_server(message) {
    let url = "http://api.osugame.online/log/?msg=" + message;
    let xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.send();
}

/**
 * Starts a download of the beatmap.
 *
 * @param {object} box - The beatmap box element.
 */
function startdownload(box) {
    // Start a preview of the beatmap.
    startpreview(box);

    // Check if the beatmap is already being downloaded.
    if (box.downloading) {
        return;
    }

    // Use the osu.direct download URL for the beatmap set.
    let url = `https://osu.direct/api/d/${box.sid}`;

    // Set the downloading flag and add a downloading class to the box.
    box.downloading = true;
    box.classList.add("downloading");

    // Create an XMLHttpRequest to download the beatmap.
    let xhr = new XMLHttpRequest();
    xhr.responseType = 'arraybuffer';
    xhr.open("GET", url);

    // Create a download progress bar.
    let container = document.createElement("div");
    let title = document.createElement("div");
    let bar = document.createElement("progress");
    container.className = "download-progress";
    title.className = "title";
    title.innerText = box.setdata.title;
    container.appendChild(title);
    container.appendChild(bar);

    // Insert the progress bar into the page.
    let statuslines = document.getElementById("statuslines");
    statuslines.insertBefore(container, statuslines.children[3]);

    // Set the maximum value of the progress bar.
    bar.max = 1;
    bar.value = 0;

    // Define the onload event handler.
    xhr.onload = function () {
        // Create a blob from the response data.
        box.oszblob = new Blob([xhr.response]);

        // Update the progress bar and remove the downloading class.
        bar.className = "finished";
        box.classList.remove("downloading");

        // Log the download completion to the server.
        log_to_server("got " + box.sid + " in " + (new Date().getTime() - (box.download_starttime || 0)));
    }

    // Define the onprogress event handler.
    xhr.onprogress = function (e) {
        // Update the progress bar value.
        bar.value = e.loaded / e.total;
    }

    // Define the onerror event handler.
    xhr.onerror = function () {
        // Log the download failure to the server.
        log_to_server("fail " + box.sid);

        // Remove the downloading class and display an error message.
        box.downloading = false;
        box.classList.remove("downloading");
        alert("Beatmap download failed. Please retry later.");
    }

    // Send the XMLHttpRequest.
    xhr.send();

    // Set the download start time for logging.
    box.download_starttime = new Date().getTime();
}

/**
 * Optional helper functions using other endpoints.
 */

/**
 * Gets beatmap information from the osu.direct API.
 *
 * @param {number} mapId - The ID of the beatmap.
 * @returns {Promise<object>} A promise resolving to the beatmap information.
 */
function getBeatmapInfo(mapId) {
    return fetch(`https://osu.direct/api/osu/${mapId}`)
        .then(response => response.json());
}

/**
 * Gets the PP (Performance Points) of a beatmap from the osu.direct API.
 *
 * @param {number} mapId - The ID of the beatmap.
 * @returns {Promise<object>} A promise resolving to the PP information.
 */
function getMapPP(mapId) {
    return fetch(`https://osu.direct/api/pp/${mapId}`)
        .then(response => response.json());
}

/**
 * Gets the background image URL of a beatmap from the osu.direct API.
 *
 * @param {number} mapId - The ID of the beatmap.
 * @returns {string} The background image URL.
 */
function getMapBackground(mapId) {
    return `https://osu.direct/api/media/background/${mapId}`;
}