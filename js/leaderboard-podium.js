// ===============================
// SPINX LEADERBOARD SYSTEM (FINAL)
// Podium 1–2–3 (score-based)
// Rank 4–10 = SLOT ONLY (activity handled in main.js)
// ===============================

// ===============================
// STORAGE HELPERS
// ===============================
function getLeaderboardData() {
  const data = JSON.parse(localStorage.getItem("leaderboard")) || [];
  return Array.isArray(data) ? data : [];
}

function saveLeaderboardData(data) {
  localStorage.setItem("leaderboard", JSON.stringify(data));
}

// ===============================
// UPDATE LEADERBOARD (PODIUM ONLY)
// ===============================
function updateLeaderboard(name, score) {
  let players = getLeaderboardData();

  let existing = players.find(p => p.name === name);

  if (existing) {
    if (score > existing.score) {
      existing.score = score;
    }
  } else {
    players.push({ name, score });
  }

  players.sort((a, b) => b.score - a.score);
  saveLeaderboardData(players);
  renderLeaderboard();
}

// ===============================
// RENDER PODIUM + EMPTY SLOTS 4–10
// ===============================
function renderLeaderboard() {
  const players = getLeaderboardData().sort((a, b) => b.score - a.score);

  // ---------- PODIUM 1–2–3 ----------
  const top3 = players.slice(0, 3);

  const p1 = document.getElementById("podium-1");
  const p2 = document.getElementById("podium-2");
  const p3 = document.getElementById("podium-3");

  if (p1) p1.textContent = top3[0]?.name || "-";
  if (p2) p2.textContent = top3[1]?.name || "-";
  if (p3) p3.textContent = top3[2]?.name || "-";

  // ---------- RANK 4–10 ----------
  // IMPORTANT:
  // Rank 4–10 adalah SLOT STATIS dari HTML.
  // Update rank 4–10 dilakukan sepenuhnya oleh main.js
  // JANGAN render / reset DOM di sini.
}


// ==============================
// EXPORT GLOBAL
// ===============================
window.updateLeaderboard = updateLeaderboard;
window.renderLeaderboard = renderLeaderboard;

// ===============================
// INIT
// ===============================
document.addEventListener("DOMContentLoaded", renderLeaderboard);
