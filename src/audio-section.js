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
