const creditOverlay = document.getElementById("creditOverlay");
const creditCloseBtn = document.getElementById("creditCloseBtn");

function startCredits() {
  creditOverlay.style.display = "flex";
  const totalDuration = 50000; // durasi total animasi
  setTimeout(() => closeCredits(), totalDuration);
}

function closeCredits() {
  creditOverlay.classList.add("fade-out");
  setTimeout(() => {
    creditOverlay.style.display = "none";
    creditOverlay.classList.remove("fade-out");
  }, 800);
}

creditOverlay.addEventListener("click", (e) => {
  if (e.target === creditOverlay) {
    closeCredits();
  }
});

creditCloseBtn.addEventListener("click", () => closeCredits());
