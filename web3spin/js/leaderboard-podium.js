/* ============================================================
   leaderboard-podium.js — SPINX Project
   Premium Format — FIX: Removed duplicate leaderboardList var
============================================================ */

/* Convert prize text → numerical value for ranking */
function parsePrizeValue(prize) {
    if (!prize) return 0;

    if (prize.includes("ETH")) return 1000;   // highest tier
    if (prize.includes("$"))  return parseInt(prize) || 0;
    if (prize.includes("ZONK")) return 0;

    return 0;
}

function addBubbleEntry(address, prize) {
    const list = document.getElementById("leaderboard-list");
    if (!list) return;

    // Buat item baru
    const li = document.createElement("li");
    li.classList.add("bubble-item");

    li.innerHTML = `
        <span class="icon"></span>
        <span class="address">${address.slice(0, 6)}...${address.slice(-4)}</span>
        <span class="prize">${prize}</span>
    `;

    // Masukkan ke paling atas (rank #4)
    list.prepend(li);

    // Efek bubble
    requestAnimationFrame(() => {
        li.classList.add("show");
    });

    // Update penomoran rank
    const items = list.querySelectorAll("li");
    items.forEach((item, idx) => {
        const num = idx + 4;        // mulai dari #4
        item.querySelector(".icon").textContent = `#${num}`;
    });
}


/* ============================================================
   🥇 Render Podium Winners (Top 3)
============================================================ */
function renderPodiumAndList(data) {
    const sorted = data
        .slice()
        .sort((a, b) => parsePrizeValue(b.prize) - parsePrizeValue(a.prize));

    const podium = [sorted[0], sorted[1], sorted[2]];

    [1, 2, 3].forEach((slot, i) => {
        const entry  = podium[i];
        const nameEl = document.getElementById(`podium-${slot}`);
        const prizeEl = document.getElementById(`prize-${slot}`);

        const placeBox = nameEl?.parentElement?.parentElement;

        if (entry) {
            const formatted = `${entry.address.slice(0, 6)}...${entry.address.slice(-4)}`;

            if (nameEl.textContent !== formatted) {
                placeBox.classList.add("glow");
                setTimeout(() => placeBox.classList.remove("glow"), 1500);
            }

            nameEl.textContent = formatted;
            prizeEl.textContent = entry.prize;
        } else {
            nameEl.textContent = "-";
            prizeEl.textContent = "-";
        }
    });

    // Rank 4+ appended via addBubbleEntry only.
}

/* ============================================================
   🚀 Auto-render when page loads (restore saved leaderboard)
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
    if (window.leaderboardData && leaderboardData.length) {
        renderPodiumAndList(leaderboardData);

        const rest = leaderboardData.slice(3);
        rest.forEach(entry => {
            addBubbleEntry(entry.address, entry.prize);
        });
    }
});

/* Make globally callable */
window.renderPodiumAndList = renderPodiumAndList;
window.addBubbleEntry      = addBubbleEntry;
