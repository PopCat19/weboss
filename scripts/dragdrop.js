/**
 * Handles the drag and drop event for importing beatmaps.
 * 
 * @param {Event} e - The drag and drop event.
 */
var handleDragDrop = function(e) {
    // Prevent the default behavior of the event to allow custom handling.
    e.stopPropagation();
    e.preventDefault();

    // Update the dragbox hint to indicate that the file is being processed.
    pDragboxHint.innerText = pDragboxHint.loadingHint;

    // Iterate over the files dropped in the dragbox.
    for (let i = 0; i < e.dataTransfer.files.length; ++i) {
        let raw_file = e.dataTransfer.files[i];

        // Log the file being imported.
        console.log("importing file", raw_file.name);

        // Check if the file is valid.
        if (!raw_file) {
            // If the file is invalid, update the dragbox hint and exit.
            pDragboxHint.innerText = pDragboxHint.noTransferHint;
            return;
        }

        // Check if the file has the correct suffix (.osz).
        if (raw_file.name.indexOf(".osz") === raw_file.name.length - 4) {
            // Create a new file system for the beatmap.
            let fs = new zip.fs.FS();
            fs.filename = raw_file.name;

            // Save the file to local storage.
            localforage.setItem(raw_file.name, raw_file, function(err, val) {
                if (err) {
                    // Log any errors that occur during saving.
                    console.error("Error while saving beatmap", fs.filename);
                }
            });

            // Log the file system.
            console.log(fs);

            // Import the beatmap from the file.
            fs.root.importBlob(raw_file,
                function() {
                    // Add the beatmap to the list after importing.
                    addbeatmap(fs, function(box) {
                        // Insert the beatmap box before the dragbox.
                        pBeatmapList.insertBefore(box, pDragbox);

                        // Update the dragbox hint to its default state.
                        pDragboxHint.innerText = pDragboxHint.defaultHint;
                    });
                },
                function(err) {
                    // Update the dragbox hint if the file is not a valid beatmap.
                    pDragboxHint.innerText = pDragboxHint.nonValidHint;
                });
        } else {
            // Update the dragbox hint if the file does not have the correct suffix.
            pDragboxHint.innerText = pDragboxHint.nonOszHint;
        }
    }
};

// Set the handleDragDrop function as the event handler for the dragbox.
pDragbox.ondrop = handleDragDrop;

// Prevent the default behavior of the dragover and drop events on the window.
window.addEventListener('dragover', function(e) {
    (e || event).preventDefault();
}, false);
window.addEventListener('drop', function(e) {
    (e || event).preventDefault();
}, false);