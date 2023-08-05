let recordedEvents = [];
let playlist = [];
let isRecording = false;
let timestamp = 0; // Used to calculate the timing of recorded events
let isPlaying = false;
let currentTimeouts = []; // Used to keep track of timeouts
let elapsedTime = 0; // Keeps track of the elapsed time
let currentIndex = 0; // Keeps track of the current song index
let currentSong = []; // Keeps track of the remaining song events
const playPauseBtn = document.getElementById("playPauseBtn");

function startRecording() {
    console.log("Recording Started");
    isRecording = true;
    recordedEvents = [];
    timestamp = performance.now();
}

function stopRecording() {
    console.log("Recording Stopped");
    playlist.push(recordedEvents);
    updateLocalPLaylist();
    /*const deleteButton = document.createElement("button");
    deleteButton.innerHTML = "⛔";
    deleteButton.addEventListener("click", function () {
        playlist.splice(playlist.length, 1);
        songSelect.remove(playlist.length);
        songSelect.selectedIndex
    --;
        songSelect.selectedIndex--;
    });
*/ //TODO: Add delete button functionality
    songSelect.innerHTML += "<option>Song " + playlist.length + "</option>";
    songSelect.selectedIndex = playlist.length - 1;
    isRecording = false;
}

function updateLocalPLaylist() {
    localStorage.setItem("playlist", JSON.stringify(playlist));
}

function loadLocalPlaylist() {
    playlist = JSON.parse(localStorage.getItem("playlist"));
    let index = 1;
    playlist.forEach(song => {
        songSelect.innerHTML += "<option>Song " + index + "</option>";
        index++;
    });
}

function stopSong() {
    currentTimeouts.forEach(clearTimeout); // Clear any existing timeouts
    currentTimeouts = []; // Reset the timeouts array
}

function playSong(index) {
    if (!playlist[index]) {
        console.log("No song at index " + index);
        return;
    }
    stopSong(); // Stop any currently playing song
    if (!isRecording && playlist.length > 0) {
        isPlaying = true;
        playPauseBtn.innerHTML = "⏸︎";
        console.log("Playing Song " + index);
        currentIndex = index; // Update the current song index p
        elapsedTime = 0; // Reset the elapsed time
        currentSong = [...playlist[index]]; // Copy the song events
        scheduleEvents();
    }
}

function scheduleEvents() {
    while (currentSong.length > 0 && currentSong[0].timing <= elapsedTime) {
        const recordedEvent = currentSong.shift();
        console.log("Playing Event: " + recordedEvent.event.data);
        handleMIDIMessage(recordedEvent.event);
    }
    if (currentSong.length > 0) {
        const timeoutId = setTimeout(() => {
            elapsedTime += 100; // Increase the elapsed time by the timeout interval
            scheduleEvents(); // Schedule the next events
        }, 100); // Timeout interval
        currentTimeouts.push(timeoutId); // Add the timeout to the array
    } else {
        console.log("Song " + currentIndex + " finished playing");
        isPlaying = false;
        playPauseBtn.innerHTML = "▶";
    }
}

function playPause() {
    if (isPlaying) {
        stopSong();
        isPlaying = false;
        playPauseBtn.innerHTML = "▶";
    } else if (!isPlaying && currentSong.length === 0) {
        playSong(currentIndex);
    } else {
        isPlaying = true;
        playPauseBtn.innerHTML = "⏸︎";
        scheduleEvents();
    }
}

function nextSong() {
    stopSong();
    currentIndex = (currentIndex + 1) % playlist.length;
    songSelect.selectedIndex = currentIndex;
    playPause();
}

function deleteCurrentSong() {
    let songIndex = songSelect.selectedIndex;
    if (songIndex >= 0 && songIndex < playlist.length) {
        // Remove the song from the playlist and the dropdown
        playlist.splice(songIndex, 1);
        songSelect.remove(songIndex);

        // Update the dropdown to reflect the new indices of the remaining songs
        for (let i = 0; i < songSelect.length; i++) {
            songSelect.options[i].text = "Song " + (i + 1);
        }

        // Update the local storage
        updateLocalPLaylist();

        // Handle the case when the last song in the list was deleted
        if (songIndex == playlist.length) {
            songIndex--;
        }

        // Update the current song index and select it in the dropdown
        currentIndex = songIndex;
        songSelect.selectedIndex = songIndex;

        console.log("Deleted song. New playlist:", playlist);
    } else {
        console.log("Invalid song index. Cannot delete song.");
    }
}


songSelect = document.getElementById("songSelect");
songSelect.addEventListener("change", function () {
    currentIndex = songSelect.selectedIndex;
});

checkbox = document.getElementById('toggleRecording')
checkbox.addEventListener('keydown', event => {
    if (event.code === 'Space') {
        event.preventDefault();
    }
    if (event.code === 'Space' && isPlaying || currentSong.length === 0) {
        playPause();
    }
});

checkbox.checked = false;