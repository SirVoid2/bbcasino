const balanceEl = document.getElementById("balance");
const modalBalanceEl = document.getElementById("modalBalance");
const resetBalanceBtn = document.getElementById("resetBalance");
const gameModal = document.getElementById("gameModal");
const gameTitle = document.getElementById("gameTitle");
const gameBody = document.getElementById("gameBody");
const closeModal = document.getElementById("closeModal");
const slides = document.querySelectorAll(".hero-slide");
const playButtons = document.querySelectorAll("[data-game]");

const storageKey = "demoBalance";
const defaultBalance = 1000;

const multipliers = [16, 9, 2, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 2, 9, 16, 9, 16];

let activeSlide = 0;
let balance = Number(localStorage.getItem(storageKey)) || defaultBalance;

function formatMoney(value) {
  return `$${value.toFixed(2)}`;
}

function setBalance(value) {
  balance = Math.max(0, Number(value));
  localStorage.setItem(storageKey, balance.toFixed(2));
  balanceEl.textContent = formatMoney(balance);
  modalBalanceEl.textContent = formatMoney(balance);
}

setBalance(balance);

resetBalanceBtn.addEventListener("click", () => {
  setBalance(defaultBalance);
});

function rotateSlides() {
  slides.forEach((slide, index) => {
    slide.classList.toggle("active", index === activeSlide);
  });
  activeSlide = (activeSlide + 1) % slides.length;
}

setInterval(rotateSlides, 5000);
rotateSlides();

function openModal(title, content) {
  gameTitle.textContent = title;
  gameBody.innerHTML = "";
  gameBody.appendChild(content);
  gameModal.classList.add("open");
  gameModal.setAttribute("aria-hidden", "false");
}

function closeGameModal() {
  gameModal.classList.remove("open");
  gameModal.setAttribute("aria-hidden", "true");
}

closeModal.addEventListener("click", closeGameModal);

gameModal.addEventListener("click", (event) => {
  if (event.target === gameModal) {
    closeGameModal();
  }
});

function createInput(labelText, type, value) {
  const wrapper = document.createElement("label");
  const label = document.createElement("span");
  label.textContent = labelText;
  wrapper.appendChild(label);
  const input = document.createElement("input");
  input.type = type;
  input.value = value;
  wrapper.appendChild(input);
  return { wrapper, input };
}

function createSelect(labelText, options, value) {
  const wrapper = document.createElement("label");
  const label = document.createElement("span");
  label.textContent = labelText;
  wrapper.appendChild(label);
  const select = document.createElement("select");
  options.forEach((option) => {
    const optionEl = document.createElement("option");
    optionEl.value = option;
    optionEl.textContent = option;
    if (option === value) {
      optionEl.selected = true;
    }
    select.appendChild(optionEl);
  });
  wrapper.appendChild(select);
  return { wrapper, select };
}

function createResultBox() {
  const result = document.createElement("div");
  result.className = "result-box";
  result.textContent = "Place a bet to see the result.";
  return result;
}

function buildDiceGame() {
  const container = document.createElement("div");
  container.className = "game-body";
  const controls = document.createElement("div");
  controls.className = "game-controls";
  const bet = createInput("Bet Amount", "number", "10");
  const chance = createInput("Win Chance (%)", "number", "50");
  controls.append(bet.wrapper, chance.wrapper);
  const result = createResultBox();
  const play = document.createElement("button");
  play.className = "primary-button";
  play.textContent = "Roll Dice";
  play.addEventListener("click", () => {
    const betValue = Number(bet.input.value);
    const chanceValue = Number(chance.input.value);
    if (betValue <= 0 || betValue > balance) {
      result.textContent = "Invalid bet amount.";
      return;
    }
    const roll = Math.random() * 100;
    const win = roll <= chanceValue;
    const multiplier = win ? (100 / chanceValue) * 0.98 : 0;
    const payout = win ? betValue * multiplier : 0;
    setBalance(balance - betValue + payout);
    result.textContent = win
      ? `Win! Roll ${roll.toFixed(2)} under ${chanceValue}%. Payout ${formatMoney(payout)}.`
      : `Loss. Roll ${roll.toFixed(2)} over ${chanceValue}%.`;
  });
  container.append(controls, play, result);
  return container;
}

function buildLimboGame() {
  const container = document.createElement("div");
  container.className = "game-body";
  const controls = document.createElement("div");
  controls.className = "game-controls";
  const bet = createInput("Bet Amount", "number", "10");
  const target = createInput("Target Multiplier", "number", "2.0");
  controls.append(bet.wrapper, target.wrapper);
  const result = createResultBox();
  const play = document.createElement("button");
  play.className = "primary-button";
  play.textContent = "Launch";
  play.addEventListener("click", () => {
    const betValue = Number(bet.input.value);
    const targetValue = Math.max(1.1, Number(target.input.value));
    if (betValue <= 0 || betValue > balance) {
      result.textContent = "Invalid bet amount.";
      return;
    }
    const roll = (1 / (Math.random() + 0.02)).toFixed(2);
    const win = Number(roll) >= targetValue;
    const payout = win ? betValue * targetValue : 0;
    setBalance(balance - betValue + payout);
    result.textContent = win
      ? `Win! Multiplier hit ${roll}x. Payout ${formatMoney(payout)}.`
      : `Crashed at ${roll}x. Try again.`;
  });
  container.append(controls, play, result);
  return container;
}

function buildPlinkoGame() {
  const container = document.createElement("div");
  container.className = "game-body";
  const controls = document.createElement("div");
  controls.className = "game-controls";
  const bet = createInput("Bet Amount", "number", "10");
  const rowsSelect = createSelect("Rows", ["8", "12", "16"], "16");
  controls.append(bet.wrapper, rowsSelect.wrapper);
  const canvas = document.createElement("canvas");
  canvas.className = "plinko-canvas";
  canvas.width = 640;
  canvas.height = 420;
  const result = createResultBox();
  const play = document.createElement("button");
  play.className = "primary-button";
  play.textContent = "Drop Ball";

  const ctx = canvas.getContext("2d");
  const pegSpacing = 36;
  const ball = { x: canvas.width / 2, y: 20, vx: 0, vy: 0, active: false };

  function drawBoard(rows) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    for (let row = 0; row < rows; row += 1) {
      const y = 60 + row * 28;
      for (let col = 0; col <= row; col += 1) {
        const x = canvas.width / 2 + (col - row / 2) * pegSpacing;
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function step(rows) {
    drawBoard(rows);
    if (ball.active) {
      ball.vy += 0.4;
      ball.x += ball.vx;
      ball.y += ball.vy;
      ctx.fillStyle = "#f6c343";
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, 5, 0, Math.PI * 2);
      ctx.fill();
      if (ball.y > canvas.height - 30) {
        ball.active = false;
      }
    }
    requestAnimationFrame(() => step(rows));
  }

  play.addEventListener("click", () => {
    const betValue = Number(bet.input.value);
    const rows = Number(rowsSelect.select.value);
    if (betValue <= 0 || betValue > balance) {
      result.textContent = "Invalid bet amount.";
      return;
    }
    const steps = Array.from({ length: rows }, () => (Math.random() > 0.5 ? 1 : -1));
    const index = steps.reduce((acc, step) => acc + (step > 0 ? 1 : 0), 0);
    const multiplier = multipliers[index] || 1;
    const payout = betValue * multiplier;
    setBalance(balance - betValue + payout);
    result.textContent = `Landed ${multiplier}x. Payout ${formatMoney(payout)}.`;
    ball.x = canvas.width / 2;
    ball.y = 20;
    ball.vx = steps.reduce((acc, step) => acc + step, 0) * 0.3;
    ball.vy = 0;
    ball.active = true;
    step(rows);
  });

  step(16);
  container.append(controls, play, canvas, result);
  return container;
}

const gameBuilders = {
  dice: buildDiceGame,
  limbo: buildLimboGame,
  plinko: buildPlinkoGame
};

playButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const game = button.dataset.game;
    const builder = gameBuilders[game];
    if (builder) {
      openModal(button.parentElement.querySelector("h3").textContent, builder());
      setBalance(balance);
    }
  });
});
