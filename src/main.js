const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreValue = document.getElementById('scoreValue');
const flipValue = document.getElementById('flipValue');
const regrabValue = document.getElementById('regrabValue');
const overlay = document.getElementById('overlay');
const settingsPanel = document.getElementById('settingsPanel');
const settingsBtn = document.getElementById('settingsBtn');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const startBtn = document.getElementById('startBtn');
const flipBtn = document.getElementById('flipBtn');
const regrabBtn = document.getElementById('regrabBtn');
const regrabLimitInput = document.getElementById('regrabLimitInput');
const skinSelect = document.getElementById('skinSelect');
const unlockSkinsToggle = document.getElementById('unlockSkinsToggle');
const soundToggle = document.getElementById('soundToggle');
const resetSettingsBtn = document.getElementById('resetSettingsBtn');

const skinCatalog = [
  { id: 'classic', name: 'Classic', color: '#7cf2ff' },
  { id: 'sunset', name: 'Sunset', color: '#ff9b6b' },
  { id: 'neon', name: 'Neon', color: '#be7bff' },
  { id: 'lava', name: 'Lava', color: '#ff5d5d' },
  { id: 'mint', name: 'Mint', color: '#86f7c6' },
  { id: 'gold', name: 'Gold', color: '#ffd166' },
];

const STORAGE_KEY = 'noomiclone_settings';

const defaultSettings = {
  regrabLimit: 25,
  currentSkin: 'classic',
  unlockAllSkins: false,
  soundEnabled: true,
};

const state = {
  settings: loadSettings(),
  running: false,
  score: 0,
  flipCount: 0,
  regrabsUsed: 0,
  soundEnabled: true,
  gameTime: 0,
  barX: 210,
  barY: 130,
  barLength: 116,
  armAngle: 0,
  player: {
    x: 210,
    y: 140,
    vx: 0,
    vy: 0,
    radius: 18,
    angle: 0,
    rotation: 0,
    onBar: true,
    flips: 0,
    airborne: false,
    released: false,
    regrabAvailable: true,
  },
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function loadSettings() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...defaultSettings };

  try {
    const parsed = JSON.parse(raw);
    return {
      ...defaultSettings,
      ...parsed,
      regrabLimit: clamp(Number(parsed.regrabLimit) || defaultSettings.regrabLimit, 0, 100000000000),
    };
  } catch {
    return { ...defaultSettings };
  }
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.settings));
}

function syncSettingsUI() {
  regrabLimitInput.value = String(state.settings.regrabLimit);
  unlockSkinsToggle.checked = state.settings.unlockAllSkins;
  soundToggle.checked = state.settings.soundEnabled;
  renderSkinOptions();
  skinSelect.value = state.settings.currentSkin;
}

function renderSkinOptions() {
  const unlocked = state.settings.unlockAllSkins;
  skinSelect.innerHTML = '';

  skinCatalog.forEach((skin) => {
    const isUnlocked = unlocked || skin.id === state.settings.currentSkin;
    const option = document.createElement('option');
    option.value = skin.id;
    option.textContent = isUnlocked ? skin.name : `${skin.name} (locked)`;
    option.disabled = !isUnlocked && !unlocked;
    skinSelect.appendChild(option);
  });
}

function applySkin() {
  const selected = skinCatalog.find((skin) => skin.id === state.settings.currentSkin) || skinCatalog[0];
  document.documentElement.style.setProperty('--primary', selected.color);
}

function unlockAllSkinsIfEnabled() {
  if (state.settings.unlockAllSkins) {
    state.settings.currentSkin = state.settings.currentSkin || 'classic';
    renderSkinOptions();
    skinSelect.value = state.settings.currentSkin;
  }
}

function updateHud() {
  scoreValue.textContent = Math.floor(state.score).toLocaleString();
  flipValue.textContent = String(state.flipCount);
  const limit = Number(state.settings.regrabLimit);
  const regrabDisplay = Math.min(state.regrabsUsed, limit).toLocaleString();
  regrabValue.textContent = regrabDisplay;
}

function resetRound() {
  state.running = true;
  state.score = 0;
  state.flipCount = 0;
  state.regrabsUsed = 0;
  state.gameTime = 0;
  state.player.x = state.barX;
  state.player.y = state.barY - 40;
  state.player.vx = 0;
  state.player.vy = 0;
  state.player.angle = 0;
  state.player.rotation = 0;
  state.player.onBar = true;
  state.player.airborne = false;
  state.player.released = false;
  overlay.classList.add('hidden');
  updateHud();
}

function launch() {
  if (!state.player.onBar) return;
  state.player.onBar = false;
  state.player.airborne = true;
  state.player.released = true;
  state.player.vy = -10.5;
  state.player.vx = (Math.random() > 0.5 ? 1 : -1) * 1.6;
  state.player.rotation = 0;
}

function flip() {
  if (!state.player.airborne) return;

  state.player.rotation += 1.8;
  state.player.angle += 0.9;
  state.flipCount += 1;
  state.score += 10;
  updateHud();
}

function useRegrab() {
  const limit = Number(state.settings.regrabLimit);
  if (state.regrabsUsed >= limit) return;
  if (!state.player.airborne && !state.player.onBar) {
    state.player.onBar = true;
    state.player.airborne = false;
    state.player.released = false;
    state.player.x = state.barX;
    state.player.y = state.barY - 20;
    state.player.vx = 0;
    state.player.vy = 0;
    state.regrabsUsed += 1;
    state.score += 15;
    updateHud();
  }
}

function updatePhysics() {
  const { player } = state;

  if (player.onBar) {
    player.x = state.barX;
    player.y = state.barY - 55;
    player.vx = 0;
    player.vy = 0;
    player.angle = 0;
    return;
  }

  player.vy += 0.22;
  player.x += player.vx;
  player.y += player.vy;
  player.rotation += 0.12;

  state.barX += Math.sin(state.gameTime / 22) * 0.35;

  if (player.y > canvas.height - 90) {
    player.y = canvas.height - 90;
    player.vy *= -0.22;
    player.vx *= 0.7;
    if (Math.abs(player.vy) < 1.2) {
      player.onBar = true;
      player.airborne = false;
      player.released = false;
      player.x = state.barX;
      player.y = state.barY - 20;
      player.angle = 0;
      player.rotation = 0;
      state.score += 25;
      updateHud();
    }
  }

  if (player.x < 30 || player.x > canvas.width - 30) {
    player.vx *= -0.75;
    player.x = clamp(player.x, 30, canvas.width - 30);
  }
}

function drawBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#1e2b43');
  gradient.addColorStop(1, '#090d14');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  for (let i = 0; i < 12; i += 1) {
    const x = (i / 12) * canvas.width;
    ctx.fillRect(x, 0, 1, canvas.height);
  }
}

function drawBar() {
  ctx.save();
  ctx.translate(state.barX, state.barY);

  ctx.fillStyle = '#d9e3ff';
  ctx.fillRect(-state.barLength / 2, -10, state.barLength, 12);

  ctx.fillStyle = '#7cf2ff';
  ctx.fillRect(-state.barLength / 2 + 8, -10, 12, 12);
  ctx.fillRect(state.barLength / 2 - 20, -10, 12, 12);
  ctx.restore();
}

function drawPlayer() {
  const skin = skinCatalog.find((s) => s.id === state.settings.currentSkin) || skinCatalog[0];
  const { player } = state;

  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.rotation);

  ctx.fillStyle = skin.color;
  ctx.beginPath();
  ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#f5f7ff';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 18);
  ctx.lineTo(0, 42);
  ctx.moveTo(-12, 28);
  ctx.lineTo(-26, 44);
  ctx.moveTo(12, 28);
  ctx.lineTo(26, 44);
  ctx.moveTo(-8, 42);
  ctx.lineTo(-18, 68);
  ctx.moveTo(8, 42);
  ctx.lineTo(18, 68);
  ctx.stroke();

  ctx.restore();
}

function draw() {
  drawBackground();
  drawBar();
  drawPlayer();
}

function tick() {
  state.gameTime += 1;
  updatePhysics();
  draw();
  requestAnimationFrame(tick);
}

function bindEvents() {
  settingsBtn.addEventListener('click', () => settingsPanel.classList.remove('hidden'));
  closeSettingsBtn.addEventListener('click', () => settingsPanel.classList.add('hidden'));
  startBtn.addEventListener('click', () => resetRound());
  flipBtn.addEventListener('click', () => flip());
  regrabBtn.addEventListener('click', () => useRegrab());

  regrabLimitInput.addEventListener('input', (event) => {
    const value = clamp(Number(event.target.value) || 0, 0, 100000000000);
    state.settings.regrabLimit = value;
    saveSettings();
    updateHud();
  });

  skinSelect.addEventListener('change', (event) => {
    state.settings.currentSkin = event.target.value;
    applySkin();
    saveSettings();
  });

  unlockSkinsToggle.addEventListener('change', (event) => {
    state.settings.unlockAllSkins = event.target.checked;
    renderSkinOptions();
    if (event.target.checked) {
      state.settings.currentSkin = state.settings.currentSkin || 'classic';
      skinSelect.value = state.settings.currentSkin;
    }
    saveSettings();
  });

  soundToggle.addEventListener('change', (event) => {
    state.settings.soundEnabled = event.target.checked;
    saveSettings();
  });

  resetSettingsBtn.addEventListener('click', () => {
    state.settings = { ...defaultSettings };
    saveSettings();
    syncSettingsUI();
    applySkin();
    updateHud();
  });

  canvas.addEventListener('pointerdown', () => {
    if (!state.running) resetRound();
    if (state.player.onBar) launch();
    else flip();
  });

  window.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
      event.preventDefault();
      if (!state.running) resetRound();
      if (state.player.onBar) launch();
      else flip();
    }

    if (event.key.toLowerCase() === 'r') useRegrab();
  });
}

function init() {
  syncSettingsUI();
  applySkin();
  updateHud();
  bindEvents();
  requestAnimationFrame(tick);
}

init();
