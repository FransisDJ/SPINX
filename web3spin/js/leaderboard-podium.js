// ===============================
// SPINX LEADERBOARD SYSTEM (NEW)
// Podium 1–2–3 + Ranking 4–10
// ===============================

// Ambil data leaderboard dari localStorage
function getLeaderboardData() {
    const data = JSON.parse(localStorage.getItem("leaderboard")) || [];
    return Array.isArray(data) ? data : [];
}

// Simpan data kembali ke localStorage
function saveLeaderboardData(data) {
    localStorage.setItem("leaderboard", JSON.stringify(data));
}

// Update leaderboard (dipanggil setiap selesai spin)
function updateLeaderboard(name, score) {
    let players = getLeaderboardData();

    // Cari player
    let existing = players.find(p => p.name === name);

    if (existing) {
        // Update skor jika lebih tinggi
        if (score > existing.score) {
            existing.score = score;
        }
    } else {
        // Tambah pemain baru
        players.push({ name, score });
    }

    // Sort skor tertinggi → teratas
    players.sort((a, b) => b.score - a.score);

    saveLeaderboardData(players);
    renderLeaderboard();
}

// Render tampilan podium + ranking 4–10
function renderLeaderboard() {
    let players = getLeaderboardData();
    players.sort((a, b) => b.score - a.score);

    // =====================
    // TAMPILKAN PODIUM 1–2–3
    // =====================
    const top3 = players.slice(0, 3);

    document.getElementById("podium-1").textContent = top3[0]?.name || "-";
    document.getElementById("podium-2").textContent = top3[1]?.name || "-";
    document.getElementById("podium-3").textContent = top3[2]?.name || "-";

    // =====================
    // TAMPILKAN RANKING 4–10
    // =====================
    const listContainer = document.getElementById("leaderboard-list");
    if (!listContainer) return; // kalau user belum tambahkan di HTML

    listContainer.innerHTML = ""; // hapus isi lama

    players.slice(3, 10).forEach((p, index) => {
        const rank = index + 4; // 4,5,6,7,8,9,10

        const row = document.createElement("div");
        row.className = "rank-row";  

        row.innerHTML = `
            <span class="rank-number">${rank}.</span>
            <span class="rank-name">${p.name}</span>
            <span class="rank-score">${p.score}</span>
        `;

        listContainer.appendChild(row);
    });
}

// Export fungsi supaya bisa dipanggil file lain
window.updateLeaderboard = updateLeaderboard;
window.renderLeaderboard = renderLeaderboard;

// Jalankan saat halaman load
document.addEventListener("DOMContentLoaded", renderLeaderboard);
