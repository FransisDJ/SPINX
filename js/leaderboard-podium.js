// ===============================
// SPINX LEADERBOARD SYSTEM (FINAL)
// FIXED PODIUM BY PRIZE
// ===============================

// ===============================
// PODIUM CONFIG (FIXED ORDER)
// ===============================
const PODIUM_ORDER = ["1 ETH", "120 $", "100 $"];
const PODIUM_STORAGE_KEY = "podiumSlots";

// ===============================
// 🔧 ADDRESS MASK (UI ONLY)
// ===============================
function maskAddress(addr) {
  if (!addr || typeof addr !== "string") return "-";
  if (addr.length <= 12) return addr;
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

// ===============================
// STORAGE HELPERS (PODIUM ONLY)
// ===============================
function getPodiumSlots() {
  return JSON.parse(localStorage.getItem(PODIUM_STORAGE_KEY)) || {};
}

function savePodiumSlots(data) {
  localStorage.setItem(PODIUM_STORAGE_KEY, JSON.stringify(data));
}

// ===============================
// UPDATE PODIUM (LOCKED BY PRIZE)
// ===============================
function updateLeaderboard(name, score, prize) {
  // ❌ ignore zonk / invalid
  if (!prize || !name) return;

  // ❌ only podium prizes allowed
  if (!PODIUM_ORDER.includes(prize)) return;

  const slots = getPodiumSlots();

  // 🔒 slot already taken → DO NOTHING
  if (slots[prize]) return;

  // ✅ lock podium slot
  slots[prize] = {
    name: name,
    prize: prize,
    time: Date.now()
  };

  savePodiumSlots(slots);
  renderLeaderboard();
}

// ===============================
// PODIUM CHANGE TRACKER (GLOW)
// ===============================
let lastPodium = { 1: null, 2: null, 3: null };

// ===============================
// RENDER PODIUM (FIXED PRIZE)
// ===============================
function renderLeaderboard() {
  const slots = getPodiumSlots();

  const podiumData = PODIUM_ORDER.map(p => slots[p] || null);

  const p1 = document.getElementById("podium-1");
  const p2 = document.getElementById("podium-2");
  const p3 = document.getElementById("podium-3");

  const pr1 = document.getElementById("prize-1");
  const pr2 = document.getElementById("prize-2");
  const pr3 = document.getElementById("prize-3");

  // NAME (MASKED)
  if (p1) p1.textContent = podiumData[0] ? maskAddress(podiumData[0].name) : "-";
  if (p2) p2.textContent = podiumData[1] ? maskAddress(podiumData[1].name) : "-";
  if (p3) p3.textContent = podiumData[2] ? maskAddress(podiumData[2].name) : "-";

  // PRIZE (FIXED)
  if (pr1) pr1.textContent = podiumData[0]?.prize || "-";
  if (pr2) pr2.textContent = podiumData[1]?.prize || "-";
  if (pr3) pr3.textContent = podiumData[2]?.prize || "-";

  // ===============================
  // GLOW ON CHANGE
  // ===============================
  const podiumMap = [
    { pos: 1, el: p1, wrap: document.querySelector(".podium-place.first") },
    { pos: 2, el: p2, wrap: document.querySelector(".podium-place.second") },
    { pos: 3, el: p3, wrap: document.querySelector(".podium-place.third") }
  ];

  podiumMap.forEach(({ pos, el, wrap }) => {
    const current = el?.textContent || null;
    if (current && lastPodium[pos] && current !== lastPodium[pos]) {
      wrap?.classList.add("glow");
      setTimeout(() => wrap?.classList.remove("glow"), 600);
    }
    lastPodium[pos] = current;
  });
}

// ==============================
// EXPORT GLOBAL
// ===============================
window.updateLeaderboard = updateLeaderboard;
window.renderLeaderboard = renderLeaderboard;
