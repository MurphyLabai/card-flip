import * as THREE from 'three';
import { createDeck, shuffleShoe, drawCards, cardName } from './cards.js';
import { setupScene, createCardMesh, arrangeFan, animateShuffle, animateFlipIn, makeFaceTex, makeBackTex } from './engine.js';

// -- Audio --------------------------------------------------------------------
let soundEnabled = localStorage.getItem('pp_cardflip_sound') !== 'false';

const spursAudio = new Audio('/spurs-walk.mp3');
spursAudio.loop = false;

const shuffleAudio = new Audio('/cards-shuffle.mp3');
shuffleAudio.loop = false;

let musicVolume = parseFloat(localStorage.getItem('pp_cardflip_music_vol') || '0.35');
let cardSoundVolume = parseFloat(localStorage.getItem('pp_cardflip_sound_vol') || '0.7');

let currentBgMusic = null;
let currentTrackSrc = null;

function stopBgMusic() {
  if (currentBgMusic) {
    currentBgMusic.pause();
    currentBgMusic = null;
  }
}

function playMusicTrack(src) {
  stopBgMusic();
  const audio = new Audio('/' + src);
  audio.loop = true;
  audio.volume = musicVolume;
  audio.play().catch(e => console.warn('Audio play failed:', e.message));
  currentBgMusic = audio;
  currentTrackSrc = src;
  localStorage.setItem('pp_cardflip_last_music', src);
  document.querySelectorAll('.music-track').forEach(t => {
    t.style.borderColor = t.dataset.src === src ? '#d4af37' : 'rgba(255,255,255,0.2)';
    t.style.color = t.dataset.src === src ? '#d4af37' : 'rgba(255,255,255,0.7)';
  });
}

// -- State --------------------------------------------------------------------
let state = {
  phase: 'setup',
  deckCount: 1,
  flipCount: 2,
  excludeJokers: false,
  shoe: [],
  drawnCards: [],
  history: [],
};

let sceneObj = null;

// -- Custom background --------------------------------------------------------
let customBgDataUrl = localStorage.getItem('pp_cardflip_custom_bg') || null;
let selectedBg = localStorage.getItem('pp_cardflip_bg') || 'backdrop.png';

function applyBackground(bg) {
  const container = document.getElementById('canvas-container');
  if (!container) return;
  if (bg === 'custom' || (bg === 'custom' && !customBgDataUrl)) return;
  if (bg === 'none') {
    container.style.background = 'transparent';
    return;
  }
  container.style.background = `url('/${bg}') no-repeat center center`;
  container.style.backgroundSize = 'cover';
}

function applyCustomBg() {
  if (!customBgDataUrl) return;
  selectedBg = 'custom';
  localStorage.setItem('pp_cardflip_bg', 'custom');
  const container = document.getElementById('canvas-container');
  if (container) {
    container.style.background = `url('${customBgDataUrl}') no-repeat center center`;
    container.style.backgroundSize = 'cover';
  }
  document.querySelectorAll('.bg-thumb').forEach(t => t.classList.remove('active'));
  const thumb = document.getElementById('custom-bg-thumb');
  if (thumb) thumb.classList.add('active');
}

function showCustomBgThumb() {
  const container = document.getElementById('custom-bg-thumb');
  const clearBtn = document.getElementById('clear-custom-bg');
  if (!container) return;
  if (customBgDataUrl) {
    container.style.display = 'block';
    container.innerHTML = `<img src="${customBgDataUrl}" style="width:80px;height:45px;object-fit:cover;border-radius:6px;border:2px solid ${selectedBg === 'custom' ? '#d4af37' : 'rgba(255,255,255,0.3)'};cursor:pointer;">`;
    container.onclick = () => applyCustomBg();
    container.className = 'bg-thumb' + (selectedBg === 'custom' ? ' active' : '');
    if (clearBtn) clearBtn.style.display = 'block';
  } else {
    container.style.display = 'none';
    if (clearBtn) clearBtn.style.display = 'none';
  }
}

function setupCustomBgUpload() {
  const input = document.getElementById('custom-bg-input');
  const uploadBtn = document.getElementById('bg-upload-btn');
  if (!input || !uploadBtn) return;
  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      customBgDataUrl = ev.target.result;
      localStorage.setItem('pp_cardflip_custom_bg', customBgDataUrl);
      applyCustomBg();
      showCustomBgThumb();
    };
    reader.readAsDataURL(file);
  });
}

function removeCustomBg() {
  customBgDataUrl = null;
  localStorage.removeItem('pp_cardflip_custom_bg');
  showCustomBgThumb();
  if (selectedBg === 'custom') {
    selectedBg = 'backdrop.png';
    localStorage.setItem('pp_cardflip_bg', 'backdrop.png');
    applyBackground('backdrop.png');
  }
}

const clearCustomBgBtn = document.getElementById('clear-custom-bg');
if (clearCustomBgBtn) clearCustomBgBtn.addEventListener('click', removeCustomBg);

// -- Settings modal -----------------------------------------------------------
const settingsModal = document.getElementById('settings-modal');
const settingsGear = document.getElementById('settings-gear');
const settingsCloseBtn = document.getElementById('settings-close');

function openSettings() {
  if (settingsModal) {
    settingsModal.classList.add('open');
    document.body.classList.add('settings-active');
  }
}
function closeSettings() {
  if (settingsModal) {
    settingsModal.classList.remove('open');
    document.body.classList.remove('settings-active');
  }
}

if (settingsGear) settingsGear.addEventListener('click', openSettings);
if (settingsCloseBtn) settingsCloseBtn.addEventListener('click', closeSettings);
if (settingsModal) {
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) closeSettings();
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (settingsModal && settingsModal.classList.contains('open')) {
      closeSettings();
    }
  }
});

// -- Fullscreen / Mega -------------------------------------------------------
const fullscreenBtn = document.getElementById('fullscreen-btn');
const megaBtn = document.getElementById('mega-btn');
const canvasContainer = document.getElementById('canvas-container');

function enterMegaMode() {
  document.body.classList.add('mega-active');
  document.body.style.overflow = 'hidden';
  const stats = document.getElementById('mega-stats');
  if (stats) stats.classList.add('active');
  if (canvasContainer) {
    canvasContainer.style.background = `url('/${selectedBg === 'custom' ? '' : selectedBg}') no-repeat center center`;
    canvasContainer.style.backgroundSize = 'cover';
    if (selectedBg === 'custom' && customBgDataUrl) {
      canvasContainer.style.backgroundImage = `url('${customBgDataUrl}')`;
    }
  }
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  }
}

function exitMegaMode() {
  document.body.classList.remove('mega-active');
  document.body.style.overflow = '';
  document.body.style.background = '';
  const stats = document.getElementById('mega-stats');
  if (stats) stats.classList.remove('active');
  applyBackground(selectedBg);
}

if (fullscreenBtn) {
  fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });
}

if (megaBtn) {
  megaBtn.addEventListener('click', () => {
    if (document.body.classList.contains('mega-active')) {
      exitMegaMode();
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    } else {
      enterMegaMode();
    }
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (document.body.classList.contains('mega-active')) {
      exitMegaMode();
      setTimeout(() => {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      }, 50);
    }
  }
});

document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement && document.body.classList.contains('mega-active')) {
    exitMegaMode();
  }
});

// Click canvas in mega mode to flip
if (canvasContainer) {
  canvasContainer.addEventListener('click', () => {
    if (document.body.classList.contains('mega-active') && (state.phase === 'results' || state.phase === 'setup')) {
      document.getElementById('flip-btn').click();
    }
  });
}

// -- Mega stats update --------------------------------------------------------
function updateMegaStats() {
  const stats = document.getElementById('mega-stats');
  if (!stats) return;
  const total = state.history.length;
  const remaining = state.shoe.length;
  const lastFlip = state.history.length > 0 ? state.history[state.history.length - 1].cards.length : 0;
  stats.innerHTML = `<span style="color:#ffffff;font-size:0.85rem;">Total Flips: ${total} &nbsp;|&nbsp; Last: ${lastFlip} Removed &nbsp;|&nbsp; ${remaining} Left</span>`;
}

// -- Volume sliders (legacy sidebar - kept for compatibility) ---------------
const cardSoundSlider = document.getElementById('card-sound-volume');
const musicSlider = document.getElementById('music-volume');
const cardSoundVal = document.getElementById('card-sound-val');
const musicVal = document.getElementById('music-val');

if (cardSoundSlider) {
  cardSoundSlider.value = Math.round(cardSoundVolume * 100);
  if (cardSoundVal) cardSoundVal.textContent = Math.round(cardSoundVolume * 100) + '%';
  cardSoundSlider.addEventListener('input', () => {
    cardSoundVolume = parseInt(cardSoundSlider.value) / 100;
    localStorage.setItem('pp_cardflip_sound_vol', cardSoundVolume);
    if (cardSoundVal) cardSoundVal.textContent = cardSoundSlider.value + '%';
    spursAudio.volume = cardSoundVolume;
    shuffleAudio.volume = cardSoundVolume;
  });
  spursAudio.volume = cardSoundVolume;
  shuffleAudio.volume = cardSoundVolume;
}

if (musicSlider) {
  musicSlider.value = Math.round(musicVolume * 100);
  if (musicVal) musicVal.textContent = Math.round(musicVolume * 100) + '%';
  musicSlider.addEventListener('input', () => {
    musicVolume = parseInt(musicSlider.value) / 100;
    localStorage.setItem('pp_cardflip_music_vol', musicVolume);
    if (musicVal) musicVal.textContent = musicSlider.value + '%';
    if (currentBgMusic) currentBgMusic.volume = musicVolume;
  });
}

// -- Modal settings controls ------------------------------------------
const modalCardSoundToggle = document.getElementById('modal-card-sound-toggle');
const modalMusicToggle = document.getElementById('modal-music-toggle');
const modalMusicTrack = document.getElementById('modal-music-track');
const modalMusicVolume = document.getElementById('modal-music-volume');

if (modalCardSoundToggle) {
  modalCardSoundToggle.checked = soundEnabled;
  modalCardSoundToggle.addEventListener('change', () => {
    soundEnabled = modalCardSoundToggle.checked;
    localStorage.setItem('pp_cardflip_sound', soundEnabled);
  });
}

if (modalMusicToggle) {
  modalMusicToggle.addEventListener('change', () => {
    if (modalMusicToggle.checked) {
      if (!currentBgMusic && modalMusicTrack.value) playMusicTrack(modalMusicTrack.value);
    } else {
      stopBgMusic();
      currentTrackSrc = null;
    }
  });
}

if (modalMusicTrack) {
  modalMusicTrack.addEventListener('change', () => {
    if (modalMusicToggle.checked) playMusicTrack(modalMusicTrack.value);
  });
}

if (modalMusicVolume) {
  modalMusicVolume.value = Math.round(musicVolume * 100);
  modalMusicVolume.addEventListener('input', () => {
    musicVolume = parseInt(modalMusicVolume.value) / 100;
    localStorage.setItem('pp_cardflip_music_vol', musicVolume);
    if (currentBgMusic) currentBgMusic.volume = musicVolume;
  });
}

// -- Background grid ----------------------------------------------------------
const bgGrid = document.getElementById('bg-grid');
if (bgGrid) {
  bgGrid.addEventListener('click', (e) => {
    const thumb = e.target.closest('.bg-thumb');
    if (!thumb) return;
    const bg = thumb.dataset.bg;
    if (!bg) return;
    selectedBg = bg;
    localStorage.setItem('pp_cardflip_bg', bg);
    if (bg === 'custom') {
      applyCustomBg();
    } else {
      applyBackground(bg);
    }
    document.querySelectorAll('.bg-thumb').forEach(t => t.classList.remove('active'));
    thumb.classList.add('active');
  });
}

// -- Helpers -------------------------------------------------------------------
function getCardColor(card) {
  if (card === 'JOKER') return 'joker-text';
  const last = card[card.length - 1];
  if (last === '\u2665' || last === '\u2666') return 'red-card-text';
  return 'black-card-text';
}

// -- Init ---------------------------------------------------------------------
function init() {
  console.log('[init] starting');
  const canvas = document.getElementById('canvas');
  loadHistory();
  sceneObj = setupScene(canvas);
  buildUI();
  requestAnimationFrame(animateLoop);

  document.getElementById('joker-toggle').addEventListener('change', e => {
    state.excludeJokers = e.target.checked;
    state.shoe = [];
    state.history = [];
    state.phase = 'setup';
    clearSceneCards();
    try { sessionStorage.setItem('pp_card_history', JSON.stringify([])); } catch(er) {}
    document.getElementById('flip-count-display').textContent = '';
    document.getElementById('flip-btn').textContent = 'FLIP CARDS';
    document.getElementById('history-list').innerHTML = '<div style="color: #555; font-size: 0.8rem; text-align: center; padding: 20px 0;">No flips yet</div>';
  });

  setupCustomBgUpload();
  showCustomBgThumb();
  applyBackground(selectedBg);
  updateMegaStats();
}

// -- Render loop ---------------------------------------------------------------
function animateLoop() {
  requestAnimationFrame(animateLoop);
  if (!sceneObj) return;
  try {
    sceneObj.renderer.render(sceneObj.scene, sceneObj.camera);
  } catch(e) {
    console.error('[render]', e);
  }
}

// -- UI -----------------------------------------------------------------------
const deckOptions = [1, 2, 4, 6, 8, 10];
const flipOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function buildUI() {

  const deckBtns = document.getElementById('deck-btns');
  const flipBtns = document.getElementById('flip-btns');
  const histDiv = document.getElementById('history-list');

  deckBtns.innerHTML = '';
  deckOptions.forEach(n => {
    const btn = document.createElement('button');
    btn.className = 'pill' + (n === state.deckCount ? ' active' : '');
    btn.textContent = n + (n === 1 ? ' Deck' : ' Decks');
    btn.onclick = () => {
      state.deckCount = n;
      state.shoe = [];
      state.history = [];
      state.phase = 'setup';
      clearSceneCards();
      try { sessionStorage.setItem('pp_card_history', JSON.stringify([])); } catch(e) {}
      document.getElementById('flip-count-display').textContent = '';
      document.getElementById('flip-btn').textContent = 'FLIP CARDS';
      document.getElementById('history-list').innerHTML = '<div style="color: #555; font-size: 0.8rem; text-align: center; padding: 20px 0;">No flips yet</div>';
      buildUI();
    };
    deckBtns.appendChild(btn);
  });

  flipBtns.innerHTML = '';
  flipOptions.forEach(n => {
    const btn = document.createElement('button');
    btn.className = 'pill' + (n === state.flipCount ? ' active' : '');
    btn.textContent = n + (n === 1 ? ' Card' : ' Cards');
    btn.onclick = () => { state.flipCount = n; buildUI(); };
    flipBtns.appendChild(btn);
  });

  if (state.history.length === 0) {
    histDiv.innerHTML = '<div style="color: #555; font-size: 0.8rem; text-align: center; padding: 20px 0;">No flips yet</div>';
  } else {
    histDiv.innerHTML = [...state.history].reverse().map(h =>
      '<div class="history-item">' +
        '<span class="history-time">' + h.time + ' \u2713</span>' +
        '<span class="history-sep">|</span>' +
        '<span class="history-cards">' + h.cards.map((c, i) => '<span class="' + getCardColor(c) + '">' + c + '</span>' + (i < h.cards.length - 1 ? '<span class="history-dash"> - </span>' : '')).join('') + '</span>' +
      '</div>'
    ).join('');
  }
}

// -- Flip --------------------------------------------------------------------
document.getElementById('flip-btn').onclick = handleFlip;

async function handleFlip() {

  if (state.phase === 'shuffling' || state.phase === 'flipping') return;
  if (!sceneObj) { console.log('[handleFlip] no sceneObj!'); return; }

  if (state.shoe.length === 0) {
    state.shoe = shuffleShoe(createDeck(state.deckCount, !state.excludeJokers));
  }

  state.phase = 'shuffling';
  const flipBtn = document.getElementById('flip-btn');
  flipBtn.disabled = true;
  flipBtn.textContent = 'Shuffling...';

  clearSceneCards();

  const shoeMeshes = [];
  const backTex = makeBackTex();

  for (let i = 0; i < state.shoe.length; i++) {
    const frontTex = makeFaceTex(state.shoe[i]);
    const mesh = createCardMesh(state.shoe[i], frontTex, backTex);
    shoeMeshes.push({ mesh, card: state.shoe[i] });
  }

  await animateShuffle(shoeMeshes, sceneObj.scene, state.deckCount);

  state.drawnCards = drawCards(state.shoe, state.flipCount);
  state.phase = 'flipping';
  flipBtn.textContent = 'Flipping...';
  if (soundEnabled) {
    spursAudio.currentTime = 0;
    spursAudio.volume = cardSoundVolume;
    spursAudio.play().catch(() => {});
    setTimeout(() => {
      shuffleAudio.currentTime = 0;
      shuffleAudio.volume = cardSoundVolume;
      shuffleAudio.play().catch(() => {});
    }, 200);
  }

  const flipMeshes = shoeMeshes.slice(0, state.flipCount);
  arrangeFan(flipMeshes, flipMeshes.length);
  await animateFlipIn(flipMeshes, sceneObj.scene);

  state.phase = 'results';
  state.shoe = state.shoe.slice(state.flipCount);

  const cardNames = state.drawnCards.map(cardName);
  state.history.push({ time: new Date().toLocaleTimeString(), cards: cardNames });
  saveHistory();

  flipBtn.disabled = false;
  flipBtn.textContent = 'Flip Again';
  spursAudio.pause();
  shuffleAudio.pause();
  document.getElementById('flip-count-display').textContent = state.flipCount + ' Cards Removed - ' + state.shoe.length + ' left in shoe';
  buildUI();
  updateMegaStats();
}

// -- Clear / Restart -----------------------------------------------------------
function clearSceneCards() {
  if (!sceneObj) return;
  const scene = sceneObj.scene;
  const toRemove = [];
  scene.children.forEach(obj => { if (obj.userData && obj.userData.cardData) toRemove.push(obj); });
  toRemove.forEach(obj => {
    scene.remove(obj);
    obj.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
        else child.material.dispose();
      }
    });
  });
}

// -- History ----------------------------------------------------------------
function saveHistory() {
  try { sessionStorage.setItem('pp_card_history', JSON.stringify(state.history)); } catch(e) {}
}
function loadHistory() {
  try {
    const s = sessionStorage.getItem('pp_card_history');
    if (s) state.history = JSON.parse(s);
  } catch(e) {}
}

document.getElementById('clear-btn').onclick = () => {
  state.history = [];
  state.shoe = [];
  state.phase = 'setup';
  try { sessionStorage.setItem('pp_card_history', JSON.stringify([])); } catch(e) {}
  clearSceneCards();
  const histDiv = document.getElementById('history-list');
  histDiv.innerHTML = '<div style="color: #555; font-size: 0.8rem; text-align: center; padding: 20px 0;">No flips yet</div>';
  document.getElementById('flip-btn').textContent = 'FLIP CARDS';
  document.getElementById('flip-count-display').textContent = '';
  updateMegaStats();
};

init();