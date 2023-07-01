let recordedEvents = [];
let playlist = [];
let isRecording = false;
let timestamp = 0; // Used to calculate the timing of recorded events
let isPlaying = false;

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

function playSong(index) {
    if (!playlist[index]) {
        console.log("No song at index " + index);
        return;
    }
    if (!isRecording && playlist.length > 0) {
        isPlaying = true;
        playPauseBtn.innerHTML = "⏸︎";
        console.log("Playing Song " + index);
        playlist[index].forEach(recordedEvent => {
            setTimeout(() => {
                console.log("Playing Event: " + recordedEvent.event.data);
                handleMIDIMessage(recordedEvent.event);
            }, recordedEvent.timing);
        });
        // After the playback has finished, set the isPlaying flag to false
        setTimeout(() => {
            console.log("Song " + index + " finished playing");
            isPlaying = false;
            playPauseBtn.innerHTML = "▶";
        }, playlist[index][playlist[index].length - 1].timing);
    }
}

songSelect = document.getElementById("songSelect");
songSelect.addEventListener("change", function () {
    songSelect.selectedIndex
        = songSelect.selectedIndex;
});

checkbox = document.getElementById('toggleRecording')
checkbox.addEventListener('keydown', event => {
    if (event.code === 'Space') {
        event.preventDefault();
    }
});

checkbox.checked = false;