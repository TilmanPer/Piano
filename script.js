const piano = document.getElementById("piano");
const keySlider = document.getElementById("keyAmountSlider");
const instructions = document.querySelector('.instructions');
const volumeInput = document.getElementById('volumeSlider');
let firstKey = 21;
let lastKey = 108;
let pianoLength = lastKey - firstKey + 1;
let volume = 0;
let pianoWidthPx = 0;

const sustainKey = "Space";
const sustainCode = 64;
let isSustain = false;



window.addEventListener('load', function (e) {
    volume = volumeInput.value;
    instructions.classList.add("fadeOut");
});

// Initialize Web MIDI API
navigator.requestMIDIAccess()
    .then(midiAccess => {
        // Get the first MIDI input device (assumes it's the Yamaha P45B)
        input = midiAccess.inputs.values().next().value;

        // Listen for MIDI messages on the input device
        input.onmidimessage = event => {
            // Get the MIDI note number and velocity
            const notenumber = event.data[1];
            const velocity = event.data[2];

            //if (event.data[0] != 248 && event.data[0] != 254)

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
                triggerAttack(key, velocity)
            }// Note released message
            else if (event.data[0] === 144 && velocity == 0 && !isSustain) {
                triggerCutoff(key);
            }// Note released but sustained message
            else if ((event.data[0] === 144 & velocity == 0) && isSustain) {
                triggerRelease(key);
            }
        };

    })
    .catch(error => console.log("Error: " + error));

function triggerAttack(key, velocity) {
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
    "IntlBackslash": 33,
    "KeyA": 34,
    "KeyZ": 35,
    "KeyX": 36,
    "KeyD": 37,
    "KeyC": 38,
    "KeyF": 39,
    "KeyV": 40,
    "KeyB": 41,
    "KeyH": 42,
    "KeyN": 43,
    "KeyJ": 44,
    "KeyM": 45,
    "KeyK": 46,
    "Comma": 47,
    "KeyQ": 48,
    "Digit2": 49,
    "KeyW": 50,
    "Digit3": 51,
    "KeyE": 52,
    "KeyR": 53,
    "Digit5": 54,
    "KeyT": 55,
    "Digit6": 56,
    "KeyY": 57,
    "Digit7": 58,
    "KeyU": 59,
    "KeyI": 60,
    "Digit9": 61,
    "KeyO": 62,
    "Digit0": 63,
    "KeyP": 64,
    "BracketLeft": 65,
    "Equal": 66,
    "BracketRight": 67,
    "KeyL": 68,
    "Semicolon": 69,
    "Quote": 70,
    "Backslash": 71
};


document.addEventListener('keydown', event => {
    if (event.code === sustainKey) {
        if (!isSustain)
            triggerSustain();
        return;
    }
    if (Object.keys(keybinds).includes(event.code)) {
        const key = document.querySelector(`[data-notenumber="${keybinds[event.code]}"]`);
        if (!key.classList.contains("currently-pressed"))
            triggerAttack(key, 127);
    }
});

document.addEventListener('keyup', event => {

    if (isSustain && event.code === sustainKey) {
        releaseSustain();
        return;
    }

    if (Object.keys(keybinds).includes(event.code)) {
        const key = document.querySelector(`[data-notenumber="${keybinds[event.code]}"]`);
        if (isSustain)
            triggerRelease(key);
        else
            triggerCutoff(key);
    }
});

function loadPiano() {
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
                if (!isSustain) {
                    triggerCutoff(key);
                }
                else {
                    triggerRelease(key);
                }
            }, { once: true });
            triggerAttack(key, 127);
        });
        key.addEventListener('mouseup', () => {
            if (!isSustain) {
                triggerCutoff(key);
            }
            else {
                triggerRelease(key);
            }
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

// Set the new context as the default context for Tone.js
Tone.setContext(audioContext);


/*Good Sounds:
GreatAndSoftPiano
HardPiano (is Ok)
Harp
Harpsicord

*/

let soundStyle = "Harpsicord";
let soundPath = localStorage.getItem("soundPath") ? localStorage.getItem("soundPath") : `./sounds/${soundStyle}`;
document.getElementById("soundSelect").addEventListener('change', event => {
    soundStyle = event.target.value;
    soundPath = `./sounds/${soundStyle}`;
    localStorage.setItem('soundPath', soundPath);
    updateSampler();
    updateKeys();
});

function updateSampler() {
    // Define the sample URLs and create the sampler with Tone.js
    const sampleURLs = {};
    const octaveOffset = -1;
    const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

    for (let octave = 0; octave <= 8; octave++) {
        for (let i = 0; i < notes.length; i++) {
            const originalOctave = octave + octaveOffset;
            const noteName = notes[i] + octave;
            const fileName = notes[i].toLowerCase().replace("#", "s") + originalOctave;
            sampleURLs[noteName] = soundPath + `/${fileName}.mp3`;
        }
    }
    console.log(sampleURLs);

    sampler = new Tone.Sampler(sampleURLs, {
        // Envelope
        releaseCurve: "exponential",
        release: 1
    });

    // Mono-Effekt hinzufügen
    const monoEffect = new Tone.Mono().toDestination();
    sampler.connect(monoEffect);
}

const rangeUpdate = function (e) {
    updateKeys();
}

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
});