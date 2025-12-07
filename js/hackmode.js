/* ==========================
   hackmode.js - Easter Egg, Matrix rain, Glitch Terminal
   Load this AFTER main.js
========================== */

/* Konami-like code sequence (your original) */
const hackCode = ["ArrowUp","ArrowUp","ArrowLeft","ArrowRight","ArrowUp","ArrowDown"];
let hackIndex = 0;

const matrixCanvas = document.getElementById('matrix-canvas');
const mtx = matrixCanvas.getContext('2d');

function resizeMatrixCanvas() {
  matrixCanvas.width = window.innerWidth;
  matrixCanvas.height = window.innerHeight;
}
resizeMatrixCanvas();

const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&";
const fontSize = 14;
let columns = Math.floor(matrixCanvas.width / fontSize);
let drops = Array(columns).fill(1);

function drawMatrix() {
  // faint clear to create trail effect
  mtx.fillStyle = "rgba(0, 0, 0, 0.08)";
  mtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
  mtx.fillStyle = "#00ff88";
  mtx.font = fontSize + "px monospace";
  for (let i = 0; i < drops.length; i++) {
    const text = chars.charAt(Math.floor(Math.random() * chars.length));
    mtx.fillText(text, i * fontSize, drops[i] * fontSize);
    if (drops[i] * fontSize > matrixCanvas.height && Math.random() > 0.975) {
      drops[i] = 0;
    }
    drops[i]++;
  }
}

let matrixInterval = null;
function startMatrixRain() {
  if (!matrixInterval) matrixInterval = setInterval(drawMatrix, 40);
}
function stopMatrixRain() {
  clearInterval(matrixInterval);
  matrixInterval = null;
  if (mtx) mtx.clearRect(0, 0, matrixCanvas.width, matrixCanvas.height);
}

/* Glitch terminal messages */
const glitchTerminal = document.getElementById('glitch-terminal');
const messages = [
  "Accessing mainframe...",
  "Injecting payload...",
  "Decrypting chain...",
  "0x91A3...E7F2: Permission granted",
  "Bypassing firewalls...",
  "Protocol accepted.",
  "Ghost node active.",
  "Darknet handshake complete."
];

let glitchInterval = null;
function startGlitchTerminal() {
  if (glitchInterval) clearInterval(glitchInterval);
  glitchInterval = setInterval(() => {
    const msg = messages[Math.floor(Math.random() * messages.length)];
    glitchTerminal.textContent = `> ${msg}`;
  }, 1200);
}
function stopGlitchTerminal() {
  clearInterval(glitchInterval);
  glitchInterval = null;
  glitchTerminal.textContent = "";
}

/* toggleHackMode: global function used by oracle.js and main.js may read hackMode flag */
function toggleHackMode(force) {
  // If a boolean is passed, set to that; else toggle
  hackMode = (typeof force === 'boolean') ? force : !hackMode;
  document.body.classList.toggle('hack', hackMode);

  // When enabling/disabling, start/stop matrix and terminal
  if (hackMode) {
    startMatrixRain();
    startGlitchTerminal();
  } else {
    stopMatrixRain();
    stopGlitchTerminal();
  }

  // redraw wheel so visuals update (drawWheel defined in main.js)
  try { drawWheel(); } catch (e) { /* ignore if drawWheel not available */ }

  // update status text briefly
  const statusEl = document.getElementById('status');
  statusEl.textContent = hackMode ? "🟢 HACK MODE ENABLED — MATRIX PROTOCOL" : "🔵 HACK MODE DISABLED";
  // re-check wallet/status after animation
  setTimeout(()=> {
    if (typeof checkWalletAndNetwork === 'function') checkWalletAndNetwork();
  }, 900);
}

/* Make a few things accessible globally so other files can read/use them */
window.glitchTerminal = glitchTerminal;
window.matrixCanvas = matrixCanvas;
window.toggleHackMode = toggleHackMode;

/* listen for konami-like code and keys for skins */
function handleHackCode(e) {
  const key = e.key;
  const expected = hackCode[hackIndex];
  if (key === expected) {
    hackIndex++;
    if (hackIndex === hackCode.length) {
      hackIndex = 0;
      toggleHackMode();
    }
  } else {
    hackIndex = 0;
    if (e.key === "Escape" && hackMode) {
      toggleHackMode(false);
    }
  }
}

document.addEventListener('keydown', (e) => {
  // Theme quick keys
  if (e.key === '1') {
    document.body.classList.remove('theme-hacker','theme-glitch');
  } else if (e.key === '2') {
    document.body.classList.add('theme-hacker');
    document.body.classList.remove('theme-glitch');
  } else if (e.key === '3') {
    document.body.classList.add('theme-glitch');
    document.body.classList.remove('theme-hacker');
  }
  handleHackCode(e);
  // redraw wheel so theme changes are immediate (drawWheel from main.js)
  try { drawWheel(); } catch (err) {}
});

/* resize handler for matrix */
window.addEventListener('resize', () => {
  resizeMatrixCanvas();
  columns = Math.floor(matrixCanvas.width / fontSize);
  drops = Array(columns).fill(1);
});
