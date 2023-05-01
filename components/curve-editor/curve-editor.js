
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