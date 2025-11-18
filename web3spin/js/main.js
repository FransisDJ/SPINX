/* ============================================================
   main.js — Core Logic (Wheel, MetaMask, Spin, Confetti)
   Struktur dipertahankan 100% — Premium Pro Formatting
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

// Audio panner (left-right movement)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const source   = audioCtx.createMediaElementSource(sfx.spinLoop);
const panner   = audioCtx.createStereoPanner();

source.connect(panner).connect(audioCtx.destination);


/* ============================================================
   2. 🏆 LEADERBOARD LOGIC (Bubble 3 Baris + Save & Load)
============================================================ */
const leaderboardList = document.getElementById("leaderboard-list");
let leaderboardData   = [];

/**
 * Add new winner to leaderboard
 */
function addToLeaderboard(address, prize) {
    const entry = {
        address,
        prize,
        time: new Date().toLocaleTimeString()
    };

    leaderboardData.unshift(entry);

    // Keep only latest 50 entries
    if (leaderboardData.length > 50) {
        leaderboardData.pop();
    }

    renderLeaderboardBubble();
    saveLeaderboard();
}

/**
 * Render last entry as bubble animation (3 lines visible)
 */
function renderLeaderboardBubble() {
    const maxVisible = 3;
    const lastEntry  = leaderboardData[0];
    if (!lastEntry) return;

    const newLi = document.createElement("li");

    newLi.innerHTML = `
        <span class="icon">💎</span>
        <span class="address">${lastEntry.address.slice(0, 6)}...${lastEntry.address.slice(-4)}</span>
        <span class="prize">${lastEntry.prize}</span>
    `;

    // Initial state (below)
    newLi.style.opacity   = 0;
    newLi.style.transform = "translateY(30px) scale(0.95)";

    leaderboardList.prepend(newLi);

    // Animate entry
    requestAnimationFrame(() => newLi.classList.add("show"));

    // Shift other items downward
    const items = leaderboardList.querySelectorAll("li");
    items.forEach((item, index) => {
        if (index > 0) {
            item.style.transition = "transform 0.5s ease, opacity 0.5s ease";
            item.style.transform  = `translateY(${index * 30}px)`;
        }
    });

    // Remove last if more than maxVisible
    if (items.length > maxVisible) {
        const last = items[items.length - 1];
        last.classList.add("bubble-exit");

        setTimeout(() => last.remove(), 500);
    }
}

/**
 * Re-render last 3 entries on page load
 */
function reRenderAllLeaderboard() {
    const visibleData = leaderboardData.slice(0, 3).reverse();

    visibleData.forEach(entry => {
        const li = document.createElement("li");
        li.innerHTML = `
            <span class="icon">💎</span>
            <span class="address">${entry.address.slice(0, 6)}...${entry.address.slice(-4)}</span>
            <span class="prize">${entry.prize}</span>
        `;
        li.classList.add("show");
        leaderboardList.prepend(li);
    });
}

/**
 * Storage Save & Load
 */
function saveLeaderboard() {
    localStorage.setItem("leaderboard", JSON.stringify(leaderboardData));
}

function loadLeaderboard() {
    const saved = localStorage.getItem("leaderboard");

    if (saved) {
        leaderboardData = JSON.parse(saved);
        reRenderAllLeaderboard();
    }
}

/* Load on startup */
window.addEventListener("DOMContentLoaded", () => loadLeaderboard());

/* Expose globally */
window.addToLeaderboard       = addToLeaderboard;
window.renderLeaderboardBubble = renderLeaderboardBubble;


/* ============================================================
   3. 🎰 SPIN LOGIC
============================================================ */
let userAddress = null;
let spinning    = false;

let activeIndex = 0;
let hackMode    = false;

const prizes = ["1 ETH", "ZONK", "100 $", "120 $", "1 $", "20 $"];

spinButton.addEventListener("click", () => {
    if (spinning) return;

    audioCtx.resume();

    // 🔊 Start SFX
    sfx.spinStart.currentTime = 0;
    sfx.spinStart.play();

    sfx.spinLoop.currentTime = 0;
    sfx.spinLoop.volume      = 0;
    sfx.spinLoop.play();

    // Fade in loop sound
    let vol = 0;
    const fadeIn = setInterval(() => {
        vol += 0.05;
        sfx.spinLoop.volume = vol;

        if (vol >= 0.4) {
            clearInterval(fadeIn);
        }
    }, 350);

    spinning = true;
    spinButton.disabled = true;
    winnerText.classList.remove("show");

    const prizeIndex = Math.floor(Math.random() * prizes.length);

    let currentIndex = 0;
    const totalCycles = prizes.length * 12 + prizeIndex;

    let count = 0;
    let speed = 80;

    /* --------------------------------------------
       Spin Animation Loop
    -------------------------------------------- */
    function spinStep() {
        activeIndex = currentIndex % prizes.length;
        drawWheel(0);
        currentIndex++;
        count++;

        // Stereo movement
        panner.pan.value = Math.sin(Date.now() * 0.003);

        if (count > totalCycles - 15) {
            speed += 10;
        }

        // STOP CONDITION
        if (count >= totalCycles) {
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

                    /* Fade out spinLoop */
                    let loopVol = sfx.spinLoop.volume;
                    const fadeOut = setInterval(() => {
                        loopVol -= 0.05;

                        if (loopVol <= 0) {
                            loopVol = 0;
                            clearInterval(fadeOut);

                            sfx.spinLoop.pause();
                            sfx.spinLoop.currentTime = 0;
                            sfx.spinLoop.volume      = 0.4;
                        }

                        sfx.spinLoop.volume = loopVol;
                    }, 50);

                    /* =======================================
                       💥 JACKPOT EFFECT
                    ======================================= */
                    if (prizeWon.toLowerCase().includes("1 eth")) {
                        const boom     = document.getElementById("glitch-boom");
                        const boomText = boom.querySelector(".boom-text");

                        boomText.setAttribute("data-text", "💥 JACKPOT 💥");

                        boom.style.opacity       = "1";
                        boom.style.pointerEvents = "auto";

                        const boomSfx = new Audio("audio/glitch-boom.wav");
                        boomSfx.play();

                        setTimeout(() => {
                            boom.style.opacity       = "0";
                            boom.style.pointerEvents = "none";
                        }, 2500);
                    }

                    /* =======================================
                       🎉 CONFETTI EFFECT
                    ======================================= */
                    sfx.win.currentTime = 0;
                    sfx.win.play();

                    startConfetti();
                    sfx.win.onended = () => stopConfetti();

                    /* =======================================
                       🏆 UPDATE LEADERBOARD + PODIUM
                    ======================================= */
                    addToLeaderboard(userAddress || "Guest", prizeWon);

                    if (typeof renderPodiumAndList === "function") {
                        renderPodiumAndList(leaderboardData);
                        addBubbleEntry(userAddress || "Guest", prizeWon);
                    }
                }
            }, 200);

            return;
        }

        setTimeout(spinStep, speed);
    }

    spinStep();
});

/* STOP — END OF PART 1 */
/* Lanjut ke PART 2 untuk:
      - MetaMask Logic
      - Draw Wheel Function
      - Confetti Engine
============================================================ */
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

    if (chainId === "0x1")      networkName = "Ethereum Mainnet";
    else if (chainId === "0x5") networkName = "Goerli Testnet";
    else if (chainId === "0x89") networkName = "Polygon Mainnet";

    statusEl.textContent = `✅ ${address.slice(0, 6)}...${address.slice(-4)} | ${networkName}`;
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

    const colors = [
        s.getPropertyValue("--wheel-color-1").trim(),
        s.getPropertyValue("--wheel-color-2").trim(),
        s.getPropertyValue("--wheel-color-3").trim(),
        s.getPropertyValue("--wheel-color-4").trim(),
        s.getPropertyValue("--wheel-color-5").trim(),
        s.getPropertyValue("--wheel-color-6").trim()
    ];

    return colors.map(c => c || "#00ffcc");
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
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, canvas.width / 2 - 5, start, end);

        /* Highlight active segment */
        if (i === activeIndex && winnerIndex === null) {
            ctx.fillStyle  = "rgba(255,255,255,0.4)";
            ctx.shadowColor = palette[i];
            ctx.shadowBlur  = 35;
        }
        else if (i === winnerIndex) {
            const pulse = 0.5 + Math.sin(Date.now() * (fastPulse ? 0.02 : 0.005)) * 0.5;

            ctx.fillStyle  = `rgba(255,255,255,${0.3 + pulse * 0.5})`;
            ctx.shadowColor = palette[i];
            ctx.shadowBlur  = 40 + pulse * 30;
        }
        else {
            ctx.fillStyle = palette[i];
            ctx.shadowBlur = 0;
        }

        ctx.fill();

        ctx.strokeStyle = "#111";
        ctx.lineWidth   = 2;
        ctx.stroke();

        /* Text */
        ctx.save();
        ctx.rotate(start + segAngle / 2);
        ctx.translate(canvas.width / 2.6, 0);
        ctx.rotate(Math.PI / 2);

        ctx.fillStyle = "#fff";
        ctx.font = "bold 18px Orbitron";
        ctx.textAlign = "center";
        ctx.fillText(prizes[i], 0, 5);

        ctx.restore();
    }

    /* Center glow */
    const radius   = canvas.width / 2;
    const gradient = ctx.createRadialGradient(0, 0, radius * 0.3, 0, 0, radius);

    gradient.addColorStop(0,   "rgba(255,255,255,0.15)");
    gradient.addColorStop(0.6, "rgba(0,0,0,0)");
    gradient.addColorStop(1,   "rgba(0,0,0,0.25)");

    ctx.beginPath();
    ctx.arc(0, 0, radius - 5, 0, 2 * Math.PI);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.restore();
}

/* ============================================================
   ❗ FIX PENTING: TUNGGU FONT LOAD SEBELUM DRAW WHEEL
============================================================ */

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

            confetti.style.backgroundColor = `hsl(${Math.random() * 360},100%,50%)`;
            confetti.style.left = `${Math.random() * window.innerWidth}px`;
            confetti.style.top  = `-20px`;

            document.body.appendChild(confetti);

            const fallDuration   = 2000 + Math.random() * 2000;
            const horizontalMove = (Math.random() - 0.5) * 200;

            confetti.animate(
                [
                    { transform: `translate(0,0) rotate(0deg)`, opacity: 1 },
                    {
                        transform: `translate(${horizontalMove}px, ${window.innerHeight + 50}px) rotate(${Math.random() * 720}deg)`,
                        opacity: 0
                    }
                ],
                {
                    duration: fallDuration,
                    easing: "linear"
                }
            );

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
   END OF FILE — main.js
============================================================ */
