import { measureDownload, measureUpload, measurePing } from './speedtest.js';
import { formatMbps } from './utils.js';

const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-test');
const app = document.getElementById('app');
const speedometerCanvas = document.getElementById('speedometer');
const uploadSizeSelect = document.getElementById('upload-size');

const resultsEl = document.getElementById('results');
const downloadEl = document.querySelector('#download-speed span');
const uploadEl = document.querySelector('#upload-speed span');
const pingEl = document.querySelector('#ping span');
const notesEl = document.getElementById('notes');
const downloadDisplay = document.getElementById('download-display');
const dlMini = document.getElementById('dl-mini');
const ulMini = document.getElementById('ul-mini');

let ctx = speedometerCanvas.getContext('2d');
const gaugeMax = 300;
let currentNeedle = 0;

/* --- gauge drawing & animation (kept same as before) --- */
function drawGauge(needleValue = 0) {
    const w = speedometerCanvas.width;
    const h = speedometerCanvas.height;
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h * 0.9;
    const radius = Math.min(w / 2 - 18, h * 0.9);

    ctx.lineWidth = 14;
    ctx.strokeStyle = 'rgba(20,40,30,0.6)';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, Math.PI, 0, false);
    ctx.stroke();

    const grad = ctx.createLinearGradient(cx - radius, 0, cx + radius, 0);
    grad.addColorStop(0, '#054a2f');
    grad.addColorStop(0.5, '#0bb06a');
    grad.addColorStop(1, '#56ffb1');

    ctx.lineWidth = 12;
    ctx.strokeStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, Math.PI, 0, false);
    ctx.stroke();

    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(150,220,180,0.6)';
    ctx.fillStyle = '#bfffdc';
    ctx.font = '11px sans-serif';
    for (let i = 0; i <= 10; i++) {
        const theta = Math.PI + (i / 10) * Math.PI;
        const x1 = cx + Math.cos(theta) * (radius - 8);
        const y1 = cy + Math.sin(theta) * (radius - 8);
        const x2 = cx + Math.cos(theta) * (radius + 8);
        const y2 = cy + Math.sin(theta) * (radius + 8);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        const val = Math.round((i / 10) * gaugeMax);
        const lx = cx + Math.cos(theta) * (radius + 28);
        const ly = cy + Math.sin(theta) * (radius + 28) + 4;
        ctx.fillText(val, lx - 12, ly);
    }

    const clamped = Math.max(0, Math.min(needleValue, gaugeMax));
    const angle = Math.PI + (clamped / gaugeMax) * Math.PI;
    const nx = cx + Math.cos(angle) * (radius - 24);
    const ny = cy + Math.sin(angle) * (radius - 24);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#001b10';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(nx, ny);
    ctx.stroke();

    ctx.fillStyle = '#001b10';
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fill();
}

function animateNeedle(to, duration = 300) {
    const from = currentNeedle;
    const start = performance.now();
    function step(now) {
        const t = Math.min(1, (now - start) / duration);
        const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        currentNeedle = from + (to - from) * eased;
        drawGauge(currentNeedle);
        if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

function setDownloadDisplay(mbps) {
    downloadDisplay.textContent = formatMbps(mbps);
    dlMini.textContent = formatMbps(mbps);
}

function setUploadMini(mbps) {
    ulMini.textContent = formatMbps(mbps);
}

/* --- test flow: executes the speed tests and updates UI realtime --- */
async function runSpeedTest() {
    startBtn.disabled = true;
    resultsEl.classList.add('hidden');
    notesEl.textContent = '';
    downloadEl && (downloadEl.textContent = 'Testing...');
    uploadEl && (uploadEl.textContent = 'Testing...');
    pingEl && (pingEl.textContent = '--');
    setDownloadDisplay(0);
    setUploadMini(0);
    animateNeedle(0);

    const downloadUrl = '/test-files/10MB.bin';
    const pingUrl = '/test-files/ping.txt';
    const uploadUrl = '/upload';

    try {
        const pingMs = await measurePing(pingUrl, 3);
        pingEl.textContent = Math.round(pingMs) + ' ms';

        const dlResult = await measureDownload(downloadUrl, 8 * 1024 * 1024, ({ instantMbps, avgMbps }) => {
            setDownloadDisplay(instantMbps);
            animateNeedle(Math.min(instantMbps, gaugeMax));
        });
        downloadEl && (downloadEl.textContent = formatMbps(dlResult.mbps));

        await new Promise(r => setTimeout(r, 600));

        const uploadSizeMb = parseInt(uploadSizeSelect.value, 10);
        const ulResult = await measureUpload(uploadUrl, uploadSizeMb, ({ instantMbps }) => {
            setUploadMini(instantMbps);
            animateNeedle(Math.min(instantMbps, gaugeMax));
        });
        uploadEl && (uploadEl.textContent = formatMbps(ulResult.mbps));

        // finalize
        setTimeout(() => {
            animateNeedle(Math.min(dlResult.mbps, gaugeMax));
            setDownloadDisplay(dlResult.mbps);
        }, 400);

        resultsEl.classList.remove('hidden');
    } catch (err) {
        resultsEl.classList.remove('hidden');
        downloadEl && (downloadEl.textContent = '--');
        uploadEl && (uploadEl.textContent = '--');
        notesEl.textContent = 'Test failed: ' + (err && err.message ? err.message : err);
    } finally {
        startBtn.disabled = false;
    }
}

/* --- start sequence: animate button to top, reveal container, pop-in gauge, then run tests --- */
startBtn.addEventListener('click', (e) => {
    // 1) animate button moving to top
    startScreen.classList.add('start-clicked');
    startBtn.disabled = true;

    // 2) after move animation, reveal app container
    const MOVE_DURATION = 800; // matches CSS transform duration
    setTimeout(() => {
        // hide start-screen visually but keep button position for continuity
        startScreen.classList.add('hidden');

        // reveal app container and pop-in gauge
        app.classList.remove('hidden');
        // force reflow then mark visible to trigger transition
        void app.offsetWidth;
        app.classList.add('visible');

        // add pop-in class to screen wrapper so canvas scales in
        const screenWrap = document.querySelector('.speedometer-wrap');
        screenWrap.classList.add('pop-in');

        // start the test shortly after reveal to allow animations to complete
        setTimeout(() => {
            runSpeedTest();
        }, 400);
    }, MOVE_DURATION + 80);
});

// initial draw
drawGauge(0);