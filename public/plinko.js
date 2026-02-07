const canvas = document.getElementById("plinkoCanvas");
const ctx = canvas.getContext("2d");
const seedLabel = document.getElementById("seedLabel");

const config = {
  rows: 16,
  pegRadius: 2.5,
  pegSpacingX: 48,
  pegSpacingY: 46,
  topMargin: 60,
  bottomMargin: 40,
  gravity: 0.95,
  gravityRamp: 0.0025,
  deflection: 1.2,
  bounce: 0.92,
  ballRadius: 5,
  ballColor: "#f6c343"
};

const pegs = [];
const balls = [];
let shake = 0;
let audioContext = null;

function buildPegs() {
  pegs.length = 0;
  const centerX = canvas.width / 2;

  for (let row = 0; row < config.rows; row += 1) {
    const pegsInRow = row + 1;
    const rowWidth = (pegsInRow - 1) * config.pegSpacingX;
    const offset = row % 2 === 1 ? config.pegSpacingX / 2 : 0;
    const startX = centerX - rowWidth / 2 - offset;
    const y = config.topMargin + row * config.pegSpacingY;

    for (let i = 0; i < pegsInRow; i += 1) {
      const x = startX + i * config.pegSpacingX + offset;
      pegs.push({ x, y });
    }
  }
}

function mulberry32(seed) {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let result = Math.imul(t ^ (t >>> 15), 1 | t);
    result ^= result + Math.imul(result ^ (result >>> 7), 61 | result);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function createSeed() {
  return Math.floor(Math.random() * 2 ** 32);
}

function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playSound(type) {
  if (!audioContext) {
    return;
  }
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = type === "peg" ? 420 : 220;
  gain.gain.setValueAtTime(0.05, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.08);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.09);
}

function spawnBall() {
  const seed = createSeed();
  const rng = mulberry32(seed);
  if (seedLabel) {
    seedLabel.textContent = `Seed: ${seed.toString(16).padStart(8, "0")}`;
  }
  balls.push({
    x: canvas.width / 2,
    y: config.topMargin - 20,
    vx: 0,
    vy: 0,
    gravity: config.gravity,
    rng
  });
}

function updateBalls() {
  for (const ball of balls) {
    ball.vy += ball.gravity;
    ball.gravity += config.gravityRamp;
    ball.x += ball.vx;
    ball.y += ball.vy;

    for (const peg of pegs) {
      const dx = ball.x - peg.x;
      const dy = ball.y - peg.y;
      const distance = Math.hypot(dx, dy);
      if (distance < config.ballRadius + config.pegRadius) {
        const nx = dx / (distance || 1);
        const ny = dy / (distance || 1);
        const impulse = (ball.rng() * 2 - 1) * config.deflection;
        ball.vx = (ball.vx + nx * 0.6 + impulse) * config.bounce;
        ball.vy = Math.abs(ball.vy) * config.bounce + ny * 0.6;
        ball.x = peg.x + nx * (config.ballRadius + config.pegRadius + 0.2);
        ball.y = peg.y + ny * (config.ballRadius + config.pegRadius + 0.2);
        shake = Math.min(2, shake + 0.6);
        playSound("peg");
      }
    }
  }

  for (let i = balls.length - 1; i >= 0; i -= 1) {
    if (balls[i].y > canvas.height - config.bottomMargin) {
      const binIndex = Math.min(
        16,
        Math.max(0, Math.floor((balls[i].x / canvas.width) * 17))
      );
      const bin = document.querySelectorAll(".bin")[binIndex];
      if (bin) {
        bin.classList.remove("hit");
        void bin.offsetWidth;
        bin.classList.add("hit");
      }
      playSound("bin");
      balls.splice(i, 1);
    }
  }
}

function drawPegs() {
  ctx.fillStyle = "#ffffff";
  for (const peg of pegs) {
    ctx.beginPath();
    ctx.arc(peg.x, peg.y, config.pegRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBalls() {
  ctx.fillStyle = config.ballColor;
  ctx.shadowColor = "rgba(246,195,67,0.7)";
  ctx.shadowBlur = 6;
  for (const ball of balls) {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, config.ballRadius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (shake > 0.1) {
    const jitterX = (Math.random() - 0.5) * shake;
    const jitterY = (Math.random() - 0.5) * shake;
    ctx.save();
    ctx.translate(jitterX, jitterY);
  } else {
    ctx.save();
  }
  drawPegs();
  drawBalls();
  updateBalls();
  ctx.restore();
  shake *= 0.9;
  requestAnimationFrame(render);
}

buildPegs();
document.addEventListener("click", initAudio, { once: true });
spawnBall();
spawnBall();
spawnBall();

function scheduleSpawn() {
  const delay = 240 + Math.random() * 120;
  setTimeout(() => {
    spawnBall();
    scheduleSpawn();
  }, delay);
}

scheduleSpawn();
render();
