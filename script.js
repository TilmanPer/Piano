const piano = document.getElementById("piano");
const keySlider = document.getElementById("keyAmountSlider");
const instructions = document.querySelector('.instructions');
const volumeInput = document.getElementById('volumeSlider');
let firstKey = 21;  // A0
let lastKey = 108; // C8
let keyVelocity = 127; // 0-127
let pianoLength = lastKey - firstKey + 1;
let volume = 0;
let pianoWidthPx = 0;

const sustainKey = "Space";
const sustainCode = 64; // MIDI Controller Code for Sustain Pedal
let isSustain = false;

let recordedEvents = [];
let playlist = [];
let isRecording = false;
let isPlaying = false;
let timestamp = 0; // Used to calculate the timing of recorded events
window.addEventListener('load', function (e) {
    volume = volumeInput.value;
    instructions.classList.add("fadeOut");
});

// Initialize Web MIDI API
navigator.requestMIDIAccess()
    .then(midiAccess => {
        // Get the first MIDI input device
        input = midiAccess.inputs.values().next().value;

        // Listen for MIDI messages on the input device
        input.onmidimessage = handleMIDIMessage;

    })
    .catch(error => console.log("Error: " + error));
// 
function handleMIDIMessage(event) {
    if (event.data != 254 && event.data != 248)
        console.log(event.data);
    // Get the MIDI note number and velocity
    const notenumber = event.data[1];
    const velocity = event.data[2];

    // Get the corresponding key element
    const key = document.querySelector(`.key[data-notenumber="${notenumber}"]`);

    // Check for Sustain Pedal MIDI Controller Code
    if (event.data[0] === 176 && event.data[1] === 64) {
        triggerSustain();
        if (event.data[2] === 0) {
            releaseSustain();
        }
    }

    // Note on message
    if (event.data[0] === 144 && velocity != 0) {
        triggerAttack(key, velocity);
    }// Note released message
    else if (event.data[0] === 144 && velocity == 0 && !isSustain) {
        triggerCutoff(key);
    }// Note released but sustained message
    else if ((event.data[0] === 144 & velocity == 0) && isSustain) {
        triggerRelease(key);
    }

    if (isRecording) {
        if (event.data == 254 || event.data == 248) {
            return;
        }
        console.log("Recording Event: " + event.data);
        recordedEvents.push({
            event: event,
            timing: performance.now() - timestamp
        });
    }
}


function simulateNote(status, noteNumber, velocity) {
    // Note on message
    const message = {
        data: [status, noteNumber, velocity]
    };
    handleMIDIMessage(message);
}

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
    songSelect.selectedIndex = playlist.length-1;
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
    console.log("Playing Song " + index);
    console.log(playlist[index]);
    if (!playlist[index]) {
        console.log("No song at index " + index);
        return;
    }
    if (!isRecording && playlist.length > 0) {
        isPlaying = true;
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

function triggerAttack(key, velocity) {
    if (piano.classList.contains("not-ready"))
        return;
    sampler.volume.value = volume;
    const note = key.dataset.notenumber;
    // Add the key-pressed class to the key element
    key.classList.add('key-pressed');
    key.classList.add('currently-pressed');
    // Convert the MIDI note number to a frequency using Tone.js
    const frequency = Tone.Frequency(note, "midi");
    velocity = applyMidiCurve(velocity);
    // Trigger the sample for the note with the given velocity using Tone.js
    console.log("Attack Note: " + key.dataset.note + " Velocity: " + velocity);
    sampler.triggerAttack(frequency, undefined, velocity / 127);
}

function triggerRelease(key) {
    console.log("Release Note: " + key.dataset.note);
    key.classList.remove('currently-pressed');
    key.classList.add('sustained');
}

function triggerCutoff(key) {
    console.log("Stop Note: " + key.dataset.note);
    const note = key.dataset.notenumber;
    // Remove the key-pressed class from the key element
    key.classList.remove('currently-pressed');
    key.classList.remove('key-pressed');
    key.classList.remove('sustained');
    // Get the MIDI note number and convert it to a frequency using Tone.js
    const frequency = Tone.Frequency(note, "midi");
    // Release the sample for the note using Tone.js
    sampler.triggerRelease(frequency);
}

function triggerSustain() {
    console.log("Sustain on");
    document.getElementById("sustainIndicator").classList.add("sustainActive");
    isSustain = true;
}

function releaseSustain() {
    console.log("Sustain off");
    // Release all currently held notes, except for those currently pressed
    const pressedKeys = document.querySelectorAll('.key-pressed');
    pressedKeys.forEach((key) => {
        const note = key.dataset.notenumber;
        // Only release the note if it is not currently pressed
        if (!key.classList.contains('currently-pressed')) {

            triggerCutoff(key);
        }
    });

    document.getElementById("sustainIndicator").classList.remove("sustainActive");
    isSustain = false;
}

document.getElementById("sustainIndicator").addEventListener('click', function () {
    if (isSustain) {
        releaseSustain();
    }
    else {
        triggerSustain();
    }
})

//Keybinds for Keyboard
let keybinds = {
    "IntlBackslash": 0,
    "KeyA": 0,
    "KeyZ": 0,
    "KeyX": 0,
    "KeyD": 0,
    "KeyC": 0,
    "KeyF": 0,
    "KeyV": 0,
    "KeyB": 0,
    "KeyH": 0,
    "KeyN": 0,
    "KeyJ": 0,
    "KeyM": 0,
    "KeyK": 0,
    "Comma": 0,
    "KeyQ": 0,
    "Digit2": 0,
    "KeyW": 0,
    "Digit3": 0,
    "KeyE": 0,
    "KeyR": 0,
    "Digit5": 0,
    "KeyT": 0,
    "Digit6": 0,
    "KeyY": 0,
    "Digit7": 0,
    "KeyU": 0,
    "KeyI": 0,
    "Digit9": 0,
    "KeyO": 0,
    "Digit0": 0,
    "KeyP": 0,
    "BracketLeft": 0,
    "Equal": 0,
    "BracketRight": 0,
    "KeyL": 0,
    "Semicolon": 0,
    "Quote": 0,
    "Backslash": 0
};


let startOctave = 2;
let startPoint = 21 + 12 * startOctave;
let index = 0;
for (const bind in keybinds) {
    keybinds[bind] = startPoint + index;
    index++;
}


document.addEventListener('keydown', event => {
    if (piano.classList.contains("not-ready"))
        return;
    if (event.code === sustainKey) {
        if (!isSustain)
            simulateNote(176, 64, 127);
        return;
    }
    if (Object.keys(keybinds).includes(event.code)) {
        const key = document.querySelector(`[data-notenumber="${keybinds[event.code]}"]`);
        if (!key.classList.contains("currently-pressed"))
            simulateNote(144, keybinds[event.code], keyVelocity);
    }
});

document.addEventListener('keyup', event => {
    if (piano.classList.contains("not-ready"))
        return;
    if (isSustain && event.code === sustainKey) {
        simulateNote(176, 64, 0);
        return;
    }

    if (Object.keys(keybinds).includes(event.code)) {
        const key = document.querySelector(`[data-notenumber="${keybinds[event.code]}"]`);
        if (key.classList.contains("key-pressed"))
            simulateNote(144, keybinds[event.code], 0);
    }
});

async function loadPiano() {
    await updateSampler();
    for (let i = firstKey; i <= lastKey; i++) {
        const key = document.createElement("div");
        key.className = "key";
        if (i % 12 === 1 || i % 12 === 3 || i % 12 === 6 || i % 12 === 8 || i % 12 === 10) {
            key.classList.add("black");
        }
        else
            key.classList.add("white");

        if (i % 12 === 2 || i % 12 === 4 || i % 12 === 7 || i % 12 === 9 || i % 12 === 11) {
            if (i !== firstKey) {
                key.style.marginLeft = "-" + document.querySelector('.black').offsetWidth + "px";

            }
        }

        switch (i % 12) {
            case 0:
                key.classList.add("c");
                break;
            case 1:
                key.classList.add("cs");
                break;
            case 2:
                key.classList.add("d");
                break;
            case 3:
                key.classList.add("ds");
                break;
            case 4:
                key.classList.add("e");
                break;
            case 5:
                key.classList.add("f");
                break;
            case 6:
                key.classList.add("fs");
                break;
            case 7:
                key.classList.add("g");
                break;
            case 8:
                key.classList.add("gs");
                break;
            case 9:
                key.classList.add("a");
                break;
            case 10:
                key.classList.add("as");
                break;
            case 11:
                key.classList.add("b");
                break;
            default:
                key.classList.add("unknown");
        }


        let octave = (Math.ceil(i / 11.99)) - 2
        key.dataset.note = key.classList[2] + octave;

        key.classList.add("_" + octave);
        key.dataset.notenumber = i;

        const keyText = document.createElement("p");
        keyText.innerHTML = key.dataset.note;
        keyText.className = "keyText";
        key.appendChild(keyText);

        key.addEventListener('mousedown', () => {
            key.addEventListener('mouseout', () => {
                if (!key.classList.contains("currently-pressed")) return;
                simulateNote(144, key.dataset.notenumber, 0);
            }, { once: true });

            key.addEventListener('mouseup', () => {
                simulateNote(144, key.dataset.notenumber, 0);
            });
            simulateNote(144, key.dataset.notenumber, keyVelocity);
        });

        piano.appendChild(key);
    }

    piano.offsetWidth;
    console.log(piano.offsetWidth);

    document.querySelector('.controlsContainer').style.offsetWidth = piano.offsetWidth;
}

function updateKeys() {
    firstKey = 21 + parseInt(keySlider.value);
    lastKey = 108 - keySlider.value;
    if (keySlider.value == 36) {
        firstKey = 48;
        lastKey = 72;
    }

    pianoLength = lastKey - firstKey + 1;
    document.getElementById("keyAmount").innerHTML = pianoLength + " Keys";
    document.querySelectorAll('.key').forEach(function (element) {
        element.remove();
    });
    loadPiano();
}

const audioContext = new Tone.Context({
    latencyHint: "interactive",
    lookAhead: 0.01, // Adjust this value to a smaller number (in seconds) to reduce the buffer size
});

Tone.setContext(audioContext);

let soundStyle = "Steinway_Grand";
let soundPath = `./sounds/${soundStyle}`;
if (localStorage.getItem("soundPath")) {
    soundPath = localStorage.getItem("soundPath");
    soundStyle = soundPath.split("/").pop();
    console.log(soundStyle);
}
let soundSelect = document.getElementById("soundSelect");
soundSelect.addEventListener('change', event => {
    piano.classList.add("not-ready");
    soundStyle = event.target.value;
    soundPath = `./sounds/${soundStyle}`;
    localStorage.setItem('soundPath', soundPath);
    updateSampler();
    updateKeys();
});
soundSelect.value = soundStyle;

async function updateSampler() {
    // Define the sample URLs and create the sampler with Tone.js
    const sampleURLs = {};
    const octaveOffset = -1;
    const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

    for (let octave = 0; octave <= 8; octave++) {
        for (let i = 0; i < notes.length; i++) {
            const trueOctave = octave + octaveOffset;

            if (trueOctave === -1 && i < 9) {
                continue;
            }
            if (trueOctave === 7 && i > 0) {
                continue;
            }

            const noteName = notes[i] + octave;
            const fileName = notes[i].toLowerCase().replace("#", "s") + trueOctave;
            sampleURLs[noteName] = soundPath + `/${fileName}.mp3`;
        }
    }


    try {
        sampler = new Tone.Sampler(sampleURLs, {
            // Envelope
            releaseCurve: "exponential",
            release: 1,
            onload: () => {

                piano.classList.remove("not-ready"); //not working properly. Is called before the sound is loaded.
                console.log('Sampler loaded successfully');
            },
            onerror: () => {
            }
        });

        // Mono-Effekt hinzufügen
        const monoEffect = new Tone.Mono().toDestination();
        sampler.connect(monoEffect);

    } catch (error) {
        console.error('There was an error with the sampler');
    }
}

const rangeUpdate = function (e) {
    updateKeys();
}

piano.classList.add("not-ready");
updateSampler();
updateKeys();


//MIDI CURVE XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

function applyMidiCurve(velocity) {
    const inputRange = 127;
    const outputRange = canvas.height;
    const inputX = (velocity / inputRange) * canvas.width;
    let outputY;

    const points = Array.from(document.getElementsByClassName('point')).map(point => ({
        x: point.getBoundingClientRect().left - canvas.getBoundingClientRect().left + 5,
        y: point.getBoundingClientRect().top - canvas.getBoundingClientRect().top + 5
    }));

    points.sort((a, b) => a.x - b.x);

    for (let i = 0; i < points.length - 1; i++) {
        if (inputX >= points[i].x && inputX <= points[i + 1].x) {
            const progress = (inputX - points[i].x) / (points[i + 1].x - points[i].x);
            outputY = points[i].y + progress * (points[i + 1].y - points[i].y);
            break;
        }
    }

    return Math.round(((outputRange - outputY) / outputRange) * inputRange);
}

function createPoint(x, y, restrictMovement) {
    const point = document.createElement('div');
    point.classList.add('point');
    point.style.left = x + 'px';
    point.style.top = y + 'px';

    // Drag and Drop functionality
    point.onmousedown = function (event) {
        event.preventDefault();
        event.stopPropagation(); // Verhindert das Erstellen eines weiteren Punktes beim Loslassen

        let shiftX = event.clientX - point.getBoundingClientRect().left;
        let shiftY = event.clientY - point.getBoundingClientRect().top;

        function onMouseMove(event) {
            let newX = event.clientX - shiftX - canvas.getBoundingClientRect().left;
            let newY = event.clientY - shiftY - canvas.getBoundingClientRect().top;

            // Verhindert, dass Punkte außerhalb des Canvas verschoben werden
            newX = Math.min(Math.max(newX, 0), canvas.width);
            newY = Math.min(Math.max(newY, 0), canvas.height);

            if (!restrictMovement) {
                point.style.left = newX + 'px';
            }
            point.style.top = newY + 'px';
            updateCanvas();
        }

        document.addEventListener('mousemove', onMouseMove);

        document.addEventListener('mouseup', () => {
            document.removeEventListener('mousemove', onMouseMove);
        }, { once: true });
    };

    // Remove point on right click
    point.addEventListener('contextmenu', event => {
        event.preventDefault();
        point.remove();
        updateCanvas();

        // Punkte im Local Storage aktualisieren
        const updatedPoints = getPointsFromLocalStorage().filter(p => p.x !== parseInt(point.style.left.slice(0, -2)) || p.y !== parseInt(point.style.top.slice(0, -2)));
        savePointsToLocalStorage(updatedPoints);
    });

    // Punkte im Local Storage speichern
    if (!restrictMovement) {
        savePointsToLocalStorage([...getPointsFromLocalStorage(), { x: x, y: y }]);
    }

    return point;
}

function initializeEditor() {
    const editor = document.getElementById('velocity-curve-editor');
    editor.addEventListener('dblclick', event => {
        if (event.button === 0) {
            const x = event.clientX - editor.getBoundingClientRect().left;
            const y = event.clientY - editor.getBoundingClientRect().top;
            const point = createPoint(x, y);
            editor.appendChild(point);
            updateCanvas();
        }
    });
}

const canvas = document.getElementById('velocityCurveCanvas');
const ctx = canvas.getContext('2d');

function updateCanvas() {
    const points = Array.from(document.getElementsByClassName('point')).map(point => ({
        x: point.getBoundingClientRect().left - canvas.getBoundingClientRect().left + 5,
        y: point.getBoundingClientRect().top - canvas.getBoundingClientRect().top + 5
    }));

    points.sort((a, b) => a.x - b.x);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    ctx.quadraticCurveTo(points[points.length - 1].x, points[points.length - 1].y, points[points.length - 1].x, points[points.length - 1].y);

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'red';
    points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
        ctx.fill();
    });
    // Punkte im Local Storage speichern
    savePointsToLocalStorage(points);
}

function savePointsToLocalStorage(points) {
    localStorage.setItem('velocityCurvePoints', JSON.stringify(points));
}

function getPointsFromLocalStorage() {
    const storedPoints = localStorage.getItem('velocityCurvePoints');
    return storedPoints ? JSON.parse(storedPoints) : [];
}

function loadPointsFromLocalStorage() {
    const storedPoints = getPointsFromLocalStorage();
    const editor = document.getElementById('velocity-curve-editor');

    if (storedPoints.length === 0) {
        // Start- und Endpunkte hinzufügen, wenn sie nicht im Local Storage sind
        const startPoint = createPoint(0, canvas.height, true);
        const endPoint = createPoint(canvas.width, 0, true);
        editor.appendChild(startPoint);
        editor.appendChild(endPoint);
    } else {
        storedPoints.forEach((point, index) => {
            const restrictMovement = (index === 0 || index === storedPoints.length - 1);
            const createdPoint = createPoint(point.x, point.y, restrictMovement);
            editor.appendChild(createdPoint);
        });
    }
}

document.getElementById('openAdvancedSettings').addEventListener('click', toggleCurveEditorDisplay);

function toggleCurveEditorDisplay() {
    const curveEditor = document.getElementById('velocity-curve-editor');
    if (curveEditor.style.visibility === "hidden") {
        curveEditor.style.visibility = "visible";
    } else {
        curveEditor.style.visibility = "hidden";
    }
}


window.addEventListener('load', () => {
    initializeEditor();
    loadPointsFromLocalStorage();
    updateCanvas();
    toggleCurveEditorDisplay();
    if (localStorage.getItem('playlist'))
        loadLocalPlaylist();
});