import * as THREE from 'three';
import { createDeck, shuffleShoe, drawCards, cardName } from './cards.js';
import { setupScene, createCardMesh, arrangeFan, animateShuffle, animateFlipIn, makeFaceTex, makeBackTex } from './engine.js';

// -- Audio --------------------------------------------------------------------
let soundEnabled = localStorage.getItem('pp_cardflip_sound') !== 'false';

const spursAudio = new Audio('/spurs-walk.mp3');
spursAudio.loop = false;

const shuffleAudio = new Audio('/cards-shuffle.mp3');
shuffleAudio.loop = false;

const soundToggle = document.getElementById('sound-toggle');
if (soundToggle) {
  soundToggle.checked = soundEnabled;
  soundToggle.addEventListener('change', () => {
    soundEnabled = soundToggle.checked;
    localStorage.setItem('pp_cardflip_sound', soundEnabled);
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
    spursAudio.play().catch(() => {});
    setTimeout(() => { shuffleAudio.currentTime = 0; shuffleAudio.play().catch(() => {}); }, 200);
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
};

init();
