/* ============================================================
   leaderboard-podium.js — SPINX PROJECT (FINAL STABLE)
   Podium Only — Live Feed (#4–#8) handled fully in main.js
============================================================ */

/* Convert prize → numeric value (for sorting Top 3) */
function parsePrizeValue(prize) {
    if (!prize) return 0;

    if (prize.includes("ETH")) return 1000;   // highest tier
    if (prize.includes("$"))  return parseInt(prize) || 0;
    if (prize.includes("ZONK")) return 0;

    return 0;
}

/* ============================================================
   🥇 RENDER PODIUM ONLY (Top 3)
============================================================ */
function renderPodiumAndList(data) {
    if (!Array.isArray(data)) return;

    // Filter dummy rows (“---”) agar podium tidak rusak
    const cleanData = data.filter(d => d.address && d.address !== "---");

    // Sort by value (descending)
    const sorted = cleanData
        .slice()
        .sort((a, b) => parsePrizeValue(b.prize) - parsePrizeValue(a.prize));

    const podium = [
        sorted[0] || null,
        sorted[1] || null,
        sorted[2] || null
    ];

    // Loop podium 1–3
    [1, 2, 3].forEach((slot, index) => {
        const entry = podium[index];
        const nameEl  = document.getElementById(`podium-${slot}`);
        const prizeEl = document.getElementById(`prize-${slot}`);

        if (!nameEl || !prizeEl) return;

        const box = nameEl.parentElement.parentElement;

        if (entry) {
            const formatted = `${entry.address.slice(0, 6)}...${entry.address.slice(-4)}`;

            // Glow anim kalau berubah
            if (nameEl.textContent !== formatted) {
                box.classList.add("glow");
                setTimeout(() => box.classList.remove("glow"), 1500);
            }

            nameEl.textContent  = formatted;
            prizeEl.textContent = entry.prize;
        } else {
            nameEl.textContent  = "-";
            prizeEl.textContent = "-";
        }
    });
}

/* ============================================================
   ⛔ TIDAK ADA RENDER LIST DI SINI
   Bubble feed (#4–#8) ditangani sepenuhnya oleh main.js
============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    if (window.leaderboardData && leaderboardData.length) {
        renderPodiumAndList(leaderboardData);
    }
});

/* Export Global */
window.renderPodiumAndList = renderPodiumAndList;
