// js/oracle.js
// =====================
// Oracle UI that respects Hack Mode terminal area
// Replace the entire file with this code.

// --- helper: get or create floating oracle (left-bottom) ---
function ensureFloatingOracle() {
  let oracleText = document.getElementById('oracle-text');
  if (!oracleText) {
    oracleText = document.createElement('div');
    oracleText.id = 'oracle-text';
    oracleText.style.position = 'fixed';
    oracleText.style.bottom = '40px';
    oracleText.style.left = '40px'; // left-bottom position for normal mode
    oracleText.style.color = '#00ff88';
    oracleText.style.fontFamily = 'Orbitron, monospace';
    oracleText.style.fontSize = '13px';
    oracleText.style.textShadow = '0 0 10px #00ff88';
    oracleText.style.opacity = '0';
    oracleText.style.transition = 'opacity 0.4s ease';
    oracleText.style.zIndex = '3000';
    oracleText.style.pointerEvents = 'none';
    document.body.appendChild(oracleText);
  }
  return oracleText;
}

// --- show normal-mode oracle (floating) ---
function showNormalOraclePrediction() {
  const oracleText = ensureFloatingOracle();
  const predictions = [
    "🔮 Oracle: Calculating fate...",
    "☠️ Fate anomaly detected.",
    "✨ Small reward probability: 72.8%",
    "⚡ Jackpot probability: 0.00012%",
    "👁️ Your spin is already decided...",
    "🧠 Oracle: The wheel knows."
  ];
  const text = predictions[Math.floor(Math.random() * predictions.length)];
  oracleText.textContent = text;
  oracleText.style.opacity = '1';

  // auto-hide after 4s
  clearTimeout(oracleText._hideTimer);
  oracleText._hideTimer = setTimeout(() => {
    oracleText.style.opacity = '0';
    // remove element after transition to keep DOM clean
    setTimeout(() => {
      if (oracleText && oracleText.parentNode) oracleText.remove();
    }, 450);
  }, 4000);
}

// --- show hacker-mode oracle: write to glitch-terminal (protocol area) ---
function showHackerOraclePrediction() {
  const terminal = document.getElementById('glitch-terminal');
  // fallback: if terminal not present, fall back to floating oracle
  if (!terminal) {
    showHackerOraclePrediction_fallback();
    return;
  }

  // build a "prediction" that looks like a protocol line
  const prizes = ["1 ETH","ZONK","100 $","120 $","1 $","20 $"];
  const randomPrize = prizes[Math.floor(Math.random() * prizes.length)];

  // format message similar to other terminal lines
  const message = `> 🤖 Oracle Hack Mode: I predict... ${randomPrize}`;

  // show message in terminal (replace current content temporarily)
  const prev = terminal.textContent;
  terminal.textContent = message;

  // optionally add a visual pulse class (requires CSS) — we'll add inline glow via style to be safe
  terminal.style.opacity = '1'; // ensure visible
  terminal.style.transition = 'opacity 0.25s ease';

  // clear after a few seconds and restore previous text (if any)
  clearTimeout(terminal._oracleTimer);
  terminal._oracleTimer = setTimeout(() => {
    // restore previous content — if terminal is used by other scripts that cycle messages,
    // we simply clear so those other intervals can refill it.
    terminal.textContent = prev || "";
  }, 4200);
}

// fallback if glitch-terminal missing
function showHackerOraclePrediction_fallback() {
  // show prediction as floating if terminal not found
  const oracleText = ensureFloatingOracle();
  const prizes = ["1 ETH","ZONK","100 $","120 $","1 $","20 $"];
  const randomPrize = prizes[Math.floor(Math.random() * prizes.length)];
  oracleText.textContent = `🤖 Oracle Hack Mode: I predict... ${randomPrize}`;
  oracleText.style.opacity = '1';
  clearTimeout(oracleText._hideTimer);
  oracleText._hideTimer = setTimeout(() => {
    oracleText.style.opacity = '0';
    setTimeout(() => { if (oracleText && oracleText.parentNode) oracleText.remove(); }, 450);
  }, 4200);
}

// --- main keyboard handler: O behaves differently depending on hack mode ---
document.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() !== 'o') return;

  // if hack mode active -> hacker prediction goes to terminal
  if (document.body.classList.contains('hack')) {
    showHackerOraclePrediction();
  } else {
    // normal mode -> floating text predictions
    showNormalOraclePrediction();
  }
});
