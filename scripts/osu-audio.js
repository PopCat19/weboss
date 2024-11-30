// Define a module that returns the OsuAudio class
define([], function() {
    // Function to synchronize an audio stream by finding the first valid frame
    function syncStream(node) {
        // Create a Uint8Array from the node's buffer
        var buf8 = new Uint8Array(node.buf);
        
        // Add the indexOf method to the Uint8Array
        buf8.indexOf = Array.prototype.indexOf;
        
        // Initialize variables for the sync process
        var i = node.sync, b = buf8;
        
        // Loop until a valid frame is found or the end of the buffer is reached
        while (1) {
            // Increment the retry count
            node.retry++;
            
            // Find the next frame header (0xFF)
            i = b.indexOf(0xFF, i);
            
            // If no frame header is found or the next byte is not a valid frame header, break the loop
            if (i == -1 || (b[i+1] & 0xE0 == 0xE0)) {
                break;
            }
            
            // Increment the index to point to the next byte
            i++;
        }
        
        // If a valid frame was found, update the node's buffer and sync position
        if (i != -1) {
            var tmp = node.buf.slice(i);
            delete(node.buf);
            node.buf = null;
            node.buf = tmp;
            node.sync = i;
            return true;
        }
        
        // If no valid frame was found, return false
        return false;
    }

    // Function to predict the offset of an MP3 file based on its tags
    function offset_predict_mp3(tags) {
        // Default offset value
        let default_offset = 22;
        
        // If no tags are provided, return the default offset
        if (!tags || !tags.length) {
            console.warn("mp3 offset predictor: mp3 tag missing");
            return default_offset;
        }
        
        // Get the last frame tag
        let frametag = tags[tags.length-1];
        
        // If the frame tag's sample length is not 1152, return the default offset
        if (frametag._section.sampleLength != 1152) {
            console.warn("mp3 offset predictor: unexpected sample length");
            return default_offset;
        }
        
        // Find the Xing tag
        let vbr_tag = null;
        for (let i=0; i<tags.length; ++i) {
            if (tags[i]._section.type == "Xing") {
                vbr_tag = tags[i];
            }
        }
        
        // If no Xing tag is found, return the default offset
        if (!vbr_tag) {
            return default_offset;
        }
        
        // If the Xing tag's identifier is missing, return the default offset
        if (!vbr_tag.identifier) {
            console.warn("mp3 offset predictor: vbr tag identifier missing");
            return default_offset;
        }
        
        // If the Xing tag's ENC_DELAY value is not 576, return the default offset
        if (vbr_tag.vbrinfo.ENC_DELAY != 576) {
            console.warn("mp3 offset predictor: vbr ENC_DELAY value unexpected");
            return default_offset;
        }
        
        // Calculate the offset based on the sample rate
        let sampleRate = vbr_tag.header.samplingRate;
        if (sampleRate == 32000) return 89 - 1152000/sampleRate;
        if (sampleRate == 44100) return 68 - 1152000/sampleRate;
        if (sampleRate == 48000) return 68 - 1152000/sampleRate;
        
        // If the sample rate is not recognized, return the default offset
        console.warn("mp3 offset predictor: sampleRate unexpected");
        return default_offset;
    }

    // Function to preprocess audio data based on the file type
    function preprocAudio(filename, buffer) {
        // Get the file suffix
        let suffix = filename.substr(-3);
        
        // If the file is not an MP3, return a default start offset
        if (suffix != "mp3") {
            console.log("preproc audio: ogg", suffix);
            return {startoffset:19};
        }
        
        // Read the MP3 tags
        mp3Parser.readTagsNew = readTagsNew;
        let tags = mp3Parser.readTagsNew(new DataView(buffer));
        
        // If the tags indicate a "dumb" MP3 file, remove the Xing tag
        if (tags.length == 3 && tags[1]._section.type == "Xing") {
            console.log("dumbifing", filename);
            let arr = new Uint8Array(buffer.byteLength - tags[1]._section.byteLength);
            arr.set(new Uint8Array(buffer, 0, tags[1]._section.offset), 0);
            let offsetAfter = tags[1]._section.offset + tags[1]._section.byteLength;
            arr.set(new Uint8Array(buffer, offsetAfter, buffer.byteLength - offsetAfter), tags[0]._section.offset);
            buffer = arr.buffer;
            return {startoffset:offset_predict_mp3(tags), newbuffer:arr.buffer};
        }
        
        // Return the predicted start offset
        return {startoffset:offset_predict_mp3(tags)};
    }
    
    // Function to read MP3 tags (bug fix for mp3Parser)
    function readTagsNew(view, offset) {
        // Initialize variables
        offset || (offset = 0);
        var sections = [];
        var section = null;
        var isFirstFrameFound = false;
        var bufferLength = view.byteLength;
        var readers = [mp3Parser.readId3v2Tag, mp3Parser.readXingTag, mp3Parser.readFrame];
        var numOfReaders = readers.length;
        
        // Loop through the buffer to find tags
        for (; offset < bufferLength && !isFirstFrameFound; ++offset) {
            for (var i = 0; i < numOfReaders; ++i) {
                section = readers[i](view, offset);
                
                // If a tag is found, add it to the sections array and update the offset
                if (section && section._section.byteLength) {
                    sections.push(section);
                    offset += section._section.byteLength;
                    if (section._section.type === "frame") {
                        isFirstFrameFound = true;
                        break;
                    }
                    i = -1;
                }
            }
        }
        
        // Return the sections array
        return sections;
    }

    // OsuAudio class
function OsuAudio(filename, buffer, callback) {
    // Initialize variables
    var self = this;
    this.decoded = null;
    this.source = null;
    this.started = 0;
    this.position = 0;
    this.playing = false;
    this.audio = new AudioContext();
    this.gain = this.audio.createGain();
    this.gain.connect(this.audio.destination);
    this.playbackRate = 1.0;
    this.posoffset = 0;

    // Preprocess the audio data
    let t = preprocAudio(filename, buffer);
    if (t.startoffset) this.posoffset = t.startoffset;
    if (t.newbuffer) buffer = t.newbuffer;
    console.log("set start offset to", this.posoffset, "ms");
    console.log("you've set global offset to", game.globalOffset || 0, "ms");
    this.posoffset += game.globalOffset || 0;

    // Decode the audio data
    function decode(node) {
        self.audio.decodeAudioData(node.buf, function(decoded) {
            self.decoded = decoded;
            console.log("Song decoded");
            if (typeof callback !== "undefined") {
                callback(self);
            }
        }, function (err) {
            console.log("Error");
            alert("Audio decode failed. Please report by filing an issue on Github");
            if (syncStream(node)) {
                console.log("Attempting again");
                decode(node);
            }
        });
    }
    decode({ buf: buffer, sync: 0, retry: 0 });

    // Define a function to get the current position of the audio
    this.getPosition = function() {
        return this._getPosition() - this.posoffset/1000;
    }

    // Define a function to get the current position of the audio (internal)
    this._getPosition = function _getPosition() {
        if (!self.playing) {
            return self.position;
        } else {
            return self.position + (self.audio.currentTime - self.started) * self.playbackRate;
        }
    };

    // Define a function to play the audio
    this.play = function play(wait = 0) {
        if (self.audio.state == "suspended") {
            window.alert("Audio can't play. Please use Chrome or Firefox.")
        }
        self.source = self.audio.createBufferSource();
        self.source.playbackRate.value = self.playbackRate;
        self.source.buffer = self.decoded;
        self.source.connect(self.gain);
        self.started = self.audio.currentTime;
        if (wait > 0) {
            self.position = -wait/1000;
            self.source.start(self.audio.currentTime + wait/1000 / self.playbackRate, 0);
        }
        else {
            self.source.start(0, self.position);
        }
        self.playing = true;
    };

    // Define a function to pause the audio
    this.pause = function pause() {
        if (!self.playing || self._getPosition()<=0) return false;
        self.position += (self.audio.currentTime - self.started) * self.playbackRate;
        self.source.stop();
        self.playing = false;
        return true;
    };

    // Define a function to seek forward in the audio
    this.seekforward = function seekforward(time) {
        let offSet = time;
        if (offSet > self.audio.currentTime - self.started) {
            self.position = offSet;
            self.source.stop();
            self.source = self.audio.createBufferSource();
            self.source.playbackRate.value = self.playbackRate;
            self.source.buffer = self.decoded;
            self.source.connect(self.gain);
            self.source.start(0, self.position);
            self.started = self.audio.currentTime;
            return true;
        } else {
            return false;
        }
    }
}

// Return the OsuAudio class
return OsuAudio;
});