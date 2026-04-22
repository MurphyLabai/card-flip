import * as THREE from 'three';
import { createDeck, shuffleShoe, drawCards, cardName } from './cards.js';
import { setupScene, createCardMesh, arrangeFan, animateShuffle, animateFlipIn, makeFaceTex, makeBackTex } from './engine.js';

// ── State ────────────────────────────────────────────────────────────────────
let state = {
  phase: 'setup',
  deckCount: 1,
  flipCount: 2,
  shoe: [],
  drawnCards: [],
  history: [],
};

let sceneObj = null;

// ── Init ─────────────────────────────────────────────────────────────────────
function init() {
  const canvas = document.getElementById('canvas');
  loadHistory();
  sceneObj = setupScene(canvas);
  buildUI();
  requestAnimationFrame(animateLoop);
}

// ── Render loop ────────────────────────────────────────────────────────────
function animateLoop() {
  requestAnimationFrame(animateLoop);
  if (!sceneObj) return;
  try {
    sceneObj.renderer.render(sceneObj.scene, sceneObj.camera);
  } catch(e) {
    console.error('[render]', e);
  }
}

// ── UI ────────────────────────────────────────────────────────────────────
const deckOptions = [1, 2, 4, 6];
const flipOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function buildUI() {
  const deckBtns = document.getElementById('deck-btns');
  const flipBtns = document.getElementById('flip-btns');
  const histDiv = document.getElementById('history-list');

  deckBtns.innerHTML = '';
  deckOptions.forEach(n => {
    const btn = document.createElement('button');
    btn.className = `pill${n === state.deckCount ? ' active' : ''}`;
    btn.textContent = n + (n === 1 ? ' Deck' : ' Decks');
    btn.onclick = () => {
      state.deckCount = n;
      state.shoe = [];
      state.history = [];
      document.getElementById('flip-count-display').textContent = '';
      document.getElementById('flip-btn').textContent = 'FLIP CARDS';
      document.getElementById('back-btn').style.display = 'none';
      buildUI();
      saveHistory();
    };
    deckBtns.appendChild(btn);
  });

  flipBtns.innerHTML = '';
  flipOptions.forEach(n => {
    const btn = document.createElement('button');
    btn.className = `pill${n === state.flipCount ? ' active' : ''}`;
    btn.textContent = n + (n === 1 ? ' Card' : ' Cards');
    btn.onclick = () => { state.flipCount = n; buildUI(); };
    flipBtns.appendChild(btn);
  });

  if (state.history.length === 0) {
    histDiv.innerHTML = '<div style="color: #555; font-size: 0.8rem; text-align: center; padding: 20px 0;">No flips yet</div>';
  } else {
    histDiv.innerHTML = [...state.history].reverse().map(h =>
      `<div class="history-item">
        <span class="history-time">${h.time}</span>
        <span class="history-cards">${h.cards.join(' · ')}</span>
      </div>`
    ).join('');
  }
}

// ── Flip ──────────────────────────────────────────────────────────────────
document.getElementById('flip-btn').onclick = handleFlip;

async function handleFlip() {
  console.log('[handleFlip] clicked, phase:', state.phase);
  if (state.phase === 'shuffling' || state.phase === 'flipping') return;
  if (!sceneObj) { console.log('[handleFlip] no sceneObj!'); return; }

  if (state.shoe.length === 0) {
    state.shoe = shuffleShoe(createDeck(state.deckCount));
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

  console.log('[handleFlip] calling animateShuffle with', shoeMeshes.length, 'cards');
  await animateShuffle(shoeMeshes, sceneObj.scene, state.deckCount);

  state.drawnCards = drawCards(state.shoe, state.flipCount);
  state.phase = 'flipping';
  flipBtn.textContent = 'Flipping...';

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
  document.getElementById('flip-count-display').textContent =
    `${state.flipCount} Card${state.flipCount > 1 ? 's' : ''} — ${state.shoe.length} left in shoe`;
  document.getElementById('back-btn').style.display = 'block';
  buildUI();
}

// ── Back ──────────────────────────────────────────────────────────────────
document.getElementById('back-btn').onclick = () => {
  state.phase = 'setup';
  state.shoe = [];
  document.getElementById('flip-btn').textContent = 'FLIP CARDS';
  document.getElementById('flip-count-display').textContent = '';
  document.getElementById('back-btn').style.display = 'none';
  clearSceneCards();
  buildUI();
};

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

// ── History ──────────────────────────────────────────────────────────────
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
  saveHistory();
  buildUI();
};

// ── Go ───────────────────────────────────────────────────────────────────
init();
