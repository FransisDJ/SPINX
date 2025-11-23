/* ============================================================
   main.js — SPINX FINAL (TikTok-style live feed)
   Struktur asli dijaga; perbaikan: leaderboard live feed (#4–#8)
============================================================ */

/* ============================================================
   1. ELEMENT & AUDIO SETUP
============================================================ */
const statusEl       = document.getElementById("status");
const connectButton  = document.getElementById("connectButton");
const spinButton     = document.getElementById("spinButton");
const winnerText     = document.getElementById("winner-text");

const canvas = document.getElementById("wheel");
const ctx    = canvas.getContext("2d");

// 🎵 AUDIO SFX
const sfx = {
    spinStart: new Audio("audio/spin-start.wav"),
    win:       new Audio("audio/win.wav"),
    spinLoop:  new Audio("audio/spin-loop.wav")
};

sfx.spinStart.load();
sfx.win.load();
sfx.spinLoop.load();

sfx.spinLoop.loop   = true;
sfx.spinLoop.volume = 0.4;

// Audio panner (left-right movement) — safe guard if audio context blocked
let audioCtx, source, panner;
try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    source   = audioCtx.createMediaElementSource(sfx.spinLoop);
    panner   = audioCtx.createStereoPanner();
    source.connect(panner).connect(audioCtx.destination);
} catch (e) {
    // If AudioContext not available, degrade gracefully
    audioCtx = null;
    panner = { pan: { value: 0 } };
}

/* ============================================================
   2. 🏆 LEADERBOARD LOGIC — storage + live feed (#4–#8)
   Podium (top 3) is handled by leaderboard-podium.js (renderPodiumAndList)
============================================================ */
const leaderboardList = document.getElementById("leaderboard-list");
let leaderboardData   = []; // index 0 = latest winner (global list including podium)

/* ---------- Storage helpers ---------- */
function saveLeaderboard() {
    try {
        localStorage.setItem("leaderboard", JSON.stringify(leaderboardData));
    } catch (e) {
        console.warn("Unable to save leaderboard:", e);
    }
}
function loadLeaderboard() {
    const saved = localStorage.getItem("leaderboard");
    if (saved) {
        try {
            leaderboardData = JSON.parse(saved);
        } catch (e) {
            leaderboardData = [];
        }
    } else {
        leaderboardData = [];
    }
}

/* Ensure dummy rows exist in data model so app has stable indexing.
   Important: we DO NOT render these dummy rows on startup to UI.
*/
function ensureInitialRows() {
    // keep at least 5 items in the data model so index mapping stable,
    // but these dummies will not be rendered to list until real winners come.
    while (leaderboardData.length < 5) {
        leaderboardData.push({
            address: "---",
            prize: "---",
            time: ""
        });
    }
}

/* Add new winner to the data model (persistent) */
function addToLeaderboard(address, prize) {
    leaderboardData.unshift({
        address,
        prize,
        time: new Date().toLocaleTimeString()
    });

    // Keep reasonable history
    if (leaderboardData.length > 200) {
        leaderboardData.pop();
    }

    saveLeaderboard();
}

/* ======================================================
   LIVE FEED (#4–#8) — TikTok-style: newest appears on top,
   older items move down one place, bottom removed.
   This ONLY updates the UI list (not the data model).
   Also prevents top-3 podium items from showing here.
====================================================== */
function addBubbleEntry(address, prize) {
    const list = leaderboardList;
    if (!list) return;

    // Determine top-3 from current data model (exclude dummy rows)
    const podiumSorted = leaderboardData
        .filter(d => d.address && d.address !== "---")
        .slice()
        .sort((a, b) => {
            const parse = v => {
                if (!v) return 0;
                if (v.includes("ETH")) return 1000;
                if (v.includes("$")) return parseInt(v) || 0;
                if (v.includes("ZONK")) return 0;
                return 0;
            };
            return parse(b.prize) - parse(a.prize);
        });
    const podium3 = podiumSorted.slice(0, 3);

    // If this new entry is actually inside top3, don't render in live feed.
    if (podium3.some(p => p.address === address && p.prize === prize)) {
        return;
    }

    // Create UI li
    const li = document.createElement("li");
    li.className = "bubble-item";
    li.innerHTML = `
        <span class="icon">💎</span>
        <span class="address">${(address || "Guest").slice(0,6)}...${(address || "Guest").slice(-4)}</span>
        <span class="prize">${prize}</span>
    `;

    // Prepend and animate
    list.prepend(li);
    // Allow CSS transition to pick it up
    requestAnimationFrame(() => li.classList.add("show"));

    // Keep exactly 5 items visible (#4..#8)
    const items = list.querySelectorAll("li");
    if (items.length > 5) {
        // remove last item
        items[items.length - 1].remove();
    }

    // Update numbers (#4, #5, ...)
    [...list.querySelectorAll("li")].forEach((item, idx) => {
        const icon = item.querySelector(".icon");
        if (icon) icon.textContent = `#${idx + 4}`;
    });
}

/* ======================================================
   STARTUP: load storage + ensure model stable (but DO NOT render dummy rows)
====================================================== */
window.addEventListener("DOMContentLoaded", () => {
    loadLeaderboard();
    ensureInitialRows();
    // Intentionally DO NOT auto-render dummy rows.
    // Live feed items will be added only when there's a real winner via addBubbleEntry().
});

/* Expose for debugging or manual calls if needed */
window.addToLeaderboard = addToLeaderboard;
window.addBubbleEntry = addBubbleEntry;

/* ============================================================
   3. 🎰 SPIN LOGIC
============================================================ */
let userAddress = null;
let spinning    = false;
let activeIndex = 0;
let hackMode    = false;

const prizes = ["1 ETH","ZONK","100 $","120 $","1 $","20 $"];

spinButton.addEventListener("click", () => {
    if (spinning) return;
    if (audioCtx) audioCtx.resume();

    // start sounds
    sfx.spinStart.currentTime = 0;
    sfx.spinStart.play();
    sfx.spinLoop.currentTime = 0;
    sfx.spinLoop.volume = 0;
    sfx.spinLoop.play();

    // fade in spin loop
    let vol = 0;
    const fadeIn = setInterval(() => {
        vol += 0.05;
        sfx.spinLoop.volume = Math.min(0.4, vol);
        if (vol >= 0.4) clearInterval(fadeIn);
    }, 350);

    spinning = true;
    spinButton.disabled = true;
    winnerText.classList.remove("show");

    const prizeIndex = Math.floor(Math.random() * prizes.length);
    let currentIndex = 0;
    const totalCycles = prizes.length * 12 + prizeIndex;
    let count = 0;
    let speed = 80;

    function spinStep() {
        activeIndex = currentIndex % prizes.length;
        drawWheel(0);
        currentIndex++;
        count++;

        // panner movement if available
        try { panner.pan.value = Math.sin(Date.now() * 0.003); } catch(e){}

        if (count > totalCycles - 15) speed += 10;

        if (count >= totalCycles) {
            // blink effect then finalize
            let blinkCount = 0;
            const blinkInterval = setInterval(() => {
                drawWheel(0, prizeIndex, blinkCount % 2 === 0);
                blinkCount++;
                if (blinkCount > 6) {
                    clearInterval(blinkInterval);
                    spinning = false;
                    spinButton.disabled = false;

                    const prizeWon = prizes[prizeIndex];
                    winnerText.textContent = `🎯 Congratulations! You won ${prizeWon} 🎉`;
                    winnerText.classList.add("show");

                    // fade out loop
                    let loopVol = sfx.spinLoop.volume;
                    const fadeOut = setInterval(() => {
                        loopVol -= 0.05;
                        sfx.spinLoop.volume = Math.max(0, loopVol);
                        if (loopVol <= 0) {
                            clearInterval(fadeOut);
                            sfx.spinLoop.pause();
                            sfx.spinLoop.currentTime = 0;
                            sfx.spinLoop.volume = 0.4;
                        }
                    }, 50);

                    // jackpot effect
                    if (prizeWon.toLowerCase().includes("1 eth")) {
                        const boom = document.getElementById("glitch-boom");
                        const boomText = boom.querySelector(".boom-text");
                        if (boomText) boomText.setAttribute("data-text", "💥 JACKPOT 💥");
                        if (boom) {
                            boom.style.opacity = "1";
                            boom.style.pointerEvents = "auto";
                        }
                        const boomSfx = new Audio("audio/glitch-boom.wav");
                        boomSfx.play();
                        setTimeout(() => {
                            if (boom) { boom.style.opacity = "0"; boom.style.pointerEvents = "none"; }
                        }, 2500);
                    }

                    // confetti + sfx
                    sfx.win.currentTime = 0;
                    sfx.win.play();
                    startConfetti();
                    sfx.win.onended = () => stopConfetti();

                    // Update data model
                    addToLeaderboard(userAddress || "Guest", prizeWon);

                    // Update podium (top 3) — leaderboard-podium.js must provide this
                    try {
                        if (typeof renderPodiumAndList === "function") {
                            renderPodiumAndList(leaderboardData.filter(d => d.address && d.address !== "---"));
                        }
                    } catch (e) {
                        console.warn("renderPodiumAndList error:", e);
                    }

                    // Update live feed (TikTok-style)
                    addBubbleEntry(userAddress || "Guest", prizeWon);
                }
            }, 200);
            return;
        }

        setTimeout(spinStep, speed);
    }

    spinStep();
});

/* ============================================================
   4. 🦊 METAMASK CONNECTION
============================================================ */
async function checkWalletAndNetwork() {
    if (typeof window.ethereum === "undefined") {
        statusEl.textContent = "❌ MetaMask not detected.";
        connectButton.disabled = true;
        spinButton.disabled = true;
        return;
    }
    connectButton.disabled = false;
    try {
        const accounts = await ethereum.request({ method: "eth_accounts" });
        userAddress = accounts[0] || null;
        const chainId = await ethereum.request({ method: "eth_chainId" });
        updateStatus(userAddress, chainId);
    } catch (err) {
        console.error("checkWalletAndNetwork error:", err);
    }
}

function updateStatus(address, chainId) {
    if (!address) {
        statusEl.textContent = "🔄 Wallet not connected";
        statusEl.classList.remove("connected");
        spinButton.disabled = true;
        return;
    }

    let networkName = "Unknown";
    if (chainId === "0x1") networkName = "Ethereum Mainnet";
    else if (chainId === "0x5") networkName = "Goerli Testnet";
    else if (chainId === "0x89") networkName = "Polygon Mainnet";

    statusEl.textContent = `✅ ${address.slice(0,6)}...${address.slice(-4)} | ${networkName}`;
    statusEl.classList.add("connected");
    spinButton.disabled = false;
}

connectButton.addEventListener("click", async () => {
    try {
        const accounts = await ethereum.request({ method: "eth_requestAccounts" });
        userAddress = accounts[0];
        const chainId = await ethereum.request({ method: "eth_chainId" });
        updateStatus(userAddress, chainId);
    } catch (err) {
        console.error(err);
        statusEl.textContent = "⚠️ Failed to connect MetaMask.";
    }
});

if (window.ethereum) {
    ethereum.on("accountsChanged", (accounts) => {
        userAddress = accounts[0] || null;
        checkWalletAndNetwork();
    });
    ethereum.on("chainChanged", () => checkWalletAndNetwork());
}
checkWalletAndNetwork();

/* ============================================================
   5. 🎡 DRAW WHEEL
============================================================ */
function getThemeColors() {
    const s = getComputedStyle(document.body);
    return [
        s.getPropertyValue("--wheel-color-1").trim() || "#FFD700",
        s.getPropertyValue("--wheel-color-2").trim() || "#00FFFF",
        s.getPropertyValue("--wheel-color-3").trim() || "#A8FF00",
        s.getPropertyValue("--wheel-color-4").trim() || "#B966FF",
        s.getPropertyValue("--wheel-color-5").trim() || "#FF3DFF",
        s.getPropertyValue("--wheel-color-6").trim() || "#00FFB7"
    ];
}

function drawWheel(rotation = 0, winnerIndex = null, fastPulse = false) {
    const palette  = getThemeColors();
    const segAngle = (2 * Math.PI) / prizes.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rotation);

    for (let i = 0; i < prizes.length; i++) {
        const start = i * segAngle;
        const end   = start + segAngle;

        ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.arc(0,0, canvas.width/2 - 5, start, end);

        if (i === activeIndex && winnerIndex === null) {
            ctx.fillStyle = "rgba(255,255,255,0.4)";
            ctx.shadowColor = palette[i % palette.length];
            ctx.shadowBlur = 35;
        } else if (i === winnerIndex) {
            const pulse = 0.5 + Math.sin(Date.now() * (fastPulse ? 0.02 : 0.005)) * 0.5;
            ctx.fillStyle = `rgba(255,255,255,${0.3 + pulse * 0.5})`;
            ctx.shadowColor = palette[i % palette.length];
            ctx.shadowBlur = 40 + pulse * 30;
        } else {
            ctx.fillStyle = palette[i % palette.length];
            ctx.shadowBlur = 0;
        }

        ctx.fill();
        ctx.strokeStyle = "#111";
        ctx.lineWidth = 2;
        ctx.stroke();

        // text
        ctx.save();
        ctx.rotate(start + segAngle/2);
        ctx.translate(canvas.width / 2.6, 0);
        ctx.rotate(Math.PI / 2);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 18px Orbitron";
        ctx.textAlign = "center";
        ctx.fillText(prizes[i], 0, 5);
        ctx.restore();
    }

    // center gradient
    const radius = canvas.width / 2;
    const gradient = ctx.createRadialGradient(0,0, radius * 0.3, 0,0, radius);
    gradient.addColorStop(0, "rgba(255,255,255,0.15)");
    gradient.addColorStop(0.6, "rgba(0,0,0,0)");
    gradient.addColorStop(1, "rgba(0,0,0,0.25)");
    ctx.beginPath();
    ctx.arc(0,0, radius - 5, 0, Math.PI*2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.restore();
}

document.fonts.ready.then(() => {
    drawWheel(0);
});

/* ============================================================
   6. 🎊 CONFETTI ENGINE
============================================================ */
let confettiInterval = null;
function startConfetti() {
    stopConfetti();
    confettiInterval = setInterval(() => {
        const confettiCount = 50;
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement("div");
            confetti.classList.add("confetti");
            confetti.style.backgroundColor = `hsl(${Math.random()*360},100%,50%)`;
            confetti.style.left = `${Math.random() * window.innerWidth}px`;
            confetti.style.top = `-20px`;
            document.body.appendChild(confetti);
            const fallDuration = 2000 + Math.random() * 2000;
            const horizontalMove = (Math.random()-0.5) * 200;
            confetti.animate([
                { transform: `translate(0,0) rotate(0deg)`, opacity: 1 },
                { transform: `translate(${horizontalMove}px, ${window.innerHeight + 50}px) rotate(${Math.random()*720}deg)`, opacity: 0 }
            ], { duration: fallDuration, easing: "linear" });
            setTimeout(() => confetti.remove(), fallDuration);
        }
    }, 400);
}
function stopConfetti() {
    if (confettiInterval) {
        clearInterval(confettiInterval);
        confettiInterval = null;
    }
}

/* ============================================================
   END OF FILE
============================================================ */
