// Load beatmap from local storage
localforage.getItem("beatmapfilelist", function(err, names) {
    // Check if there is no error and names is an array
    if (!err && names && typeof names.length !== undefined) {
      // Filter out any empty strings from the names array
      names = names.filter(function(t) { return t; });
      console.log("Local beatmap list:", names);
      // Update the total beatmap counter on the page
      document.getElementById('bm-total-counter').innerText = names.length;
      // Create an array to store temporary beatmap boxes
      var tempbox = [];
      // Loop through each beatmap name and create a temporary box
      for (let i = 0; i < names.length; ++i) {
        let box = document.createElement("div");
        box.className = "beatmapbox";
        // Insert the temporary box into the beatmap list
        pBeatmapList.insertBefore(box, pDragbox);
        tempbox.push(box);
      }
      // Get the loading counter element
      var loadingCounter = document.getElementById('bm-loaded-counter');
      // Initialize the loading counter
      var loadingn = 0;
      // Concatenate the new beatmap names to the existing list
      beatmapFileList = beatmapFileList.concat(names);
      // Loop through each beatmap name and load its blob
      for (let i = 0; i < names.length; ++i) {
        // Load the blob of the beatmap
        localforage.getItem(names[i], function(err, blob) {
          // Check if there is no error and the blob exists
          if (!err && blob) {
            // Create a new file system for the beatmap
            let fs = new zip.fs.FS();
            fs.filename = names[i];
            // Import the blob into the file system
            fs.root.importBlob(blob,
              // Callback function when the import is complete
              function() {
                // Add the beatmap to the page
                addbeatmap(fs, function(box) {
                  // Replace the temporary box with the new beatmap box
                  pBeatmapList.replaceChild(box, tempbox[i]);
                  // Reset the drag box hint
                  pDragboxHint.innerText = pDragboxHint.defaultHint;
                });
                // Increment the loading counter
                loadingCounter.innerText = ++loadingn;
              },
              // Callback function when there is an error
              function(err) {
                // Update the drag box hint to indicate an error
                pDragboxHint.innerText = pDragboxHint.nonValidHint;
              }
            );
          } else {
            // Log an error if the blob cannot be loaded
            console.error("Error while loading beatmap:", names[i], err);
          }
        });
      }
    } else {
      // Log an error if the beatmap list cannot be loaded
      if (!names) {
        console.log("No local beatmap list found.");
      } else {
        console.error("Error while loading beatmap list:", err, names);
      }
    }
  });
  
  // Function to add a beatmap to the page
  function addbeatmap(osz, f) {
    // Verify that the beatmap has all the necessary pieces
    var map = new BeatmapController();
    map.osu = new Osu(osz.root);
    map.filename = osz.filename;
    console.log("Adding beatmap filename:", osz.filename);
  
    // Set up event listeners for the beatmap
    map.osu.ondecoded = function() {
      // Filter and sort the tracks
      map.osu.filterTracks();
      map.osu.sortTracks();
      // Request the star rating of the beatmap
      map.osu.requestStar();
      // Set the osuReady flag to true
      map.osuReady = true;
      // Check if the beatmap has any osu (std) mode tracks
      if (!_.some(map.osu.tracks, function(t) { return t.general.Mode === 0; })) {
        // Update the drag box hint to indicate an error
        pDragboxHint.innerText = pDragboxHint.modeErrHint;
        return;
      }
      // Create the beatmap box and add it to the page
      let pBeatmapBox = map.createBeatmapBox();
      f(pBeatmapBox);
      // Save the beatmap locally
      if (!beatmapFileList.includes(map.filename)) {
        beatmapFileList.push(map.filename);
        localforage.setItem("beatmapfilelist", beatmapFileList, function(err, val) {
          // Log a success message if the beatmap list is saved successfully
          if (!err) {
            console.log("Local beatmap list set to", val);
          } else {
            // Log an error message if the beatmap list cannot be saved
            console.error("Error while saving beatmap list");
          }
        });
      }
    };
    map.osu.onerror = function(error) {
      // Log an error message if there is an error loading the beatmap
      console.error("Osu load error");
    };
    // Load the beatmap
    map.osu.load();
  }
  
  // Function to create a beatmap box
  BeatmapController.prototype.createBeatmapBox = function() {
    let map = this;
    // Create the beatmap box container
    let pBeatmapBox = document.createElement("div");
    // Create the beatmap cover image
    let pBeatmapCover = document.createElement("img");
    // Create the beatmap cover overlay
    let pBeatmapCoverOverlay = document.createElement("div");
    // Create the beatmap title element
    let pBeatmapTitle = document.createElement("div");
    // Create the beatmap author element
    let pBeatmapAuthor = document.createElement("div");
    // Create the beatmap difficulties element
    let pBeatmapRings = document.createElement("div");
    // Set the class names for the elements
    pBeatmapBox.className = "beatmapbox";
    pBeatmapCover.className = "beatmapcover";
    pBeatmapCoverOverlay.className = "beatmapcover-overlay";
    pBeatmapTitle.className = "beatmaptitle";
    pBeatmapAuthor.className = "beatmapauthor";
    pBeatmapRings.className = "beatmap-difficulties";
    // Append the elements to the beatmap box
    pBeatmapBox.appendChild(pBeatmapCover);
    pBeatmapBox.appendChild(pBeatmapCoverOverlay);
    pBeatmapBox.appendChild(pBeatmapTitle);
    pBeatmapBox.appendChild(pBeatmapAuthor);
    pBeatmapBox.appendChild(pBeatmapRings);
    // Set the beatmap title and author text
    var title = map.osu.tracks[0].metadata.Title;
    var artist = map.osu.tracks[0].metadata.Artist;
    var creator = map.osu.tracks[0].metadata.Creator;
    pBeatmapTitle.innerText = title;
    pBeatmapAuthor.innerText = artist + " / " + creator;
    // Set the beatmap cover image source
pBeatmapCover.alt = "beatmap cover";
map.osu.getCoverSrc(pBeatmapCover);
// Display the beatmap length
if (map.osu.tracks[0].length) {
  let pBeatmapLength = document.createElement("div");
  pBeatmapLength.className = "beatmaplength";
  pBeatmapBox.appendChild(pBeatmapLength);
  let length = map.osu.tracks[0].length;
  pBeatmapLength.innerText = Math.floor(length/60) + ":" + (length%60<10?"0":"") + (length%60);
}
// Add an event listener to the beatmap box to show the difficulty selection menu
pBeatmapBox.onclick = function(e) {
  console.log("Clicked");
  createDifficultyList(pBeatmapBox, e);
}
return pBeatmapBox;
}

// Web page elements
var pDragbox = document.getElementById("beatmap-dragbox");
var pDragboxInner = document.getElementById("beatmap-dragbox-inner");
var pDragboxHint = document.getElementById("beatmap-dragbox-hint");
var pBeatmapList = document.getElementById("beatmap-list");
pDragboxHint.defaultHint = window.i18n_dragdrophint || "Drag and drop a beatmap (.osz) file here";
pDragboxHint.modeErrHint = "Only supports osu (std) mode beatmaps. Drop another file.";
pDragboxHint.nonValidHint = "Not a valid osz file. Drop another file.";
pDragboxHint.noTransferHint = "Not receiving any file. Please retry.";
pDragboxHint.nonOszHint = "Not an osz file. Drop another file.";
pDragboxHint.loadingHint = "loading...";
var pGameArea = document.getElementById("game-area");
var pMainPage = document.getElementById("main-page");
var pNav = document.getElementById("main-nav");
var beatmapFileList = [];