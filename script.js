const piano = document.getElementById("piano");
const keySlider = document.getElementById("keyAmountSlider");
const volumeInput = document.getElementById('volumeSlider');

const instructions = document.querySelector('.instructions');
const startScreen = document.querySelector('.startScreen');
let firstKey = 21;  // A0
let lastKey = 108; // C8
let keyVelocity = 127; // 0-127
let pianoLength = lastKey - firstKey + 1;
let volume = 0;
let pianoWidthPx = 0;

const sustainKey = "Space";
const sustainCode = 64; // MIDI Controller Code for Sustain Pedal
let isSustain = false;

window.addEventListener('load', function (e) {
    volume = volumeInput.value;
});

startScreen.addEventListener("click", function (e) {
    this.style.opacity = '0';
    setTimeout(() => {
        this.style.display = 'none';
        instructions.classList.add('fadeOut');
    }, 1000);
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
 
function handleMIDIMessage(event) {
    // if (event.data != 254 && event.data != 248)
    //     console.log(event.data);

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

document.getElementById('openAdvancedSettings').addEventListener('click', toggleCurveEditorDisplay);


window.addEventListener('load', () => {
    if (localStorage.getItem('playlist'))
        loadLocalPlaylist();
});
