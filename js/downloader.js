// beatmap downloader
function startpreview(box) {
    let volume = 1;
    if (window.gamesettings) {
        volume =
            (window.gamesettings.mastervolume / 60) *
            (window.gamesettings.musicvolume / 60);
        volume = Math.min(0.4, Math.max(0, volume));
    }
    let audios = document.getElementsByTagName("audio");
    for (let i = 0; i < audios.length; ++i)
        if (audios[i].softstop) audios[i].softstop();
    let a = document.createElement("audio");
    let s = document.createElement("source");
    s.src = `https://catboy.best/preview/audio/${box.sid}?set=1`;
    s.type = "audio/mpeg";
    a.appendChild(s);
    a.volume = 0;
    a.play();
    document.body.appendChild(a);
    let fadeIn = setInterval(function() {
        if (a.volume < volume)
            a.volume = Math.min(volume, a.volume + 0.05 * volume);
        else clearInterval(fadeIn);
    }, 30);
    let fadeOut = setInterval(function() {
        if (a.currentTime > 29.3)
            a.volume = Math.max(0, a.volume - 0.05 * volume);
        if (a.volume == 0) clearInterval(fadeOut);
    }, 30);
    a.softstop = function() {
        let fadeOut = setInterval(function() {
            a.volume = Math.max(0, a.volume - 0.05 * volume);
            if (a.volume == 0) {
                clearInterval(fadeOut);
                a.remove();
            }
        }, 10);
    };
}

function startdownload(box) {
    startpreview(box);
    if (box.downloading) {
        return;
    }
    let url = "https://catboy.best/d/" + box.sid + "n";
    box.downloading = true;
    box.classList.add("downloading");
    let xhr = new XMLHttpRequest();
    xhr.responseType = "arraybuffer";
    xhr.open("GET", url);

    // Create download progress bar
    let container = document.createElement("div");
    let titleContainer = document.createElement("div");
    let title = document.createElement("span");
    let progressText = document.createElement("span");
    let progressBar = document.createElement("div");
    let progressBarFill = document.createElement("div");

    container.className = "mb-4px";
    titleContainer.className = "flex justify-between";
    title.className = "text-12px font-medium text-secondaryCrimson-100 truncate";
    title.style.maxWidth = "calc(100% - 40px)";
    title.innerText = box.setdata.title;
    progressText.className = "text-12px font-medium text-accentCrimson-100";
    progressText.innerText = "0%";
    progressBar.className = "w-full progressbar-empty bg-secondaryCrimson-12 rounded-full h-8px mt-4px";
    progressBarFill.className = "progressbar-fill bg-secondaryCrimson-100 h-8px rounded-full";
    progressBarFill.style.width = "0%";

    titleContainer.appendChild(title);
    titleContainer.appendChild(progressText);
    container.appendChild(titleContainer);
    progressBar.appendChild(progressBarFill);
    container.appendChild(progressBar);

    // Insert so that download list from recent to old
    let statuslines = document.getElementById("statuslines");
    let children = statuslines.children;
    if (children.length > 8) {
        statuslines.appendChild(container);
        for (let i = 0; i < children.length - 8; i++) {
            children[i].querySelector(".progressbar-empty").style.display = "none";
        }
    } else {
        statuslines.appendChild(container);
    }

    // Async part
    let lastProgress = 0;
    let lastUpdateTime = 0;
    xhr.onload = function() {
        box.oszblob = new Blob([xhr.response]);
        box.classList.remove("downloading");
        progressText.innerText = "Done";
        setTimeout(function() {
            progressBar.style.display = "none";
        }, 2000);
    };
    xhr.onprogress = function(e) {
        let progress = (e.loaded / e.total) * 100;
        let currentTime = new Date().getTime();
        if (progress > lastProgress || currentTime - lastUpdateTime > 1000) {
            lastProgress = progress;
            lastUpdateTime = currentTime;
            if (progress < 100) {
                progressText.innerText = `${progress.toFixed(2)}%`;
            } else {
                progressText.innerText = "Done";
            }
            progressBarFill.style.width = `${progress}%`;
        }
    };
    xhr.onerror = function() {
        console.error("Download failed");
        alert(
            "Beatmap download failed. Please retry later. If you live in Asia try a VPN such as ProtonVPN"
        );
        box.downloading = false;
        box.classList.remove("downloading");
        log_to_server("fail " + box.sid);
    };
    xhr.send();
}