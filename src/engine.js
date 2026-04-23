import * as THREE from 'three';
import { SUITS } from './cards.js';

const CARD_W = 2.5;
const CARD_H = 3.3;
const CARD_D = 0.04;

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function makeFaceTex(card) {
  const cvs = document.createElement('canvas');
  cvs.width = 256;
  cvs.height = 360;
  const ctx = cvs.getContext('2d');
  const isJoker = card.suit === 'joker';
  const suit = isJoker ? null : SUITS[card.suit];
  const isRed = suit ? suit.color === '#c41e3a' : false;


  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 256, 360);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 7;
  ctx.strokeRect(2, 2, 252, 356);

  if (isJoker) {
    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'bold 36px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText('JOKER', 12, 50);
    ctx.font = '120px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🃏', 128, 185);
  } else {
    ctx.fillStyle = isRed ? '#c41e3a' : '#1a1a1a';
    ctx.font = 'bold 44px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText(card.rank, 12, 50);
    ctx.font = 'bold 40px serif';
    ctx.fillText(suit.symbol, 14, 86);

    ctx.save();
    ctx.translate(256, 360);
    ctx.rotate(Math.PI);
    ctx.fillStyle = isRed ? '#c41e3a' : '#1a1a1a';
    ctx.font = 'bold 42px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText(card.rank, 14, 48);
    ctx.font = 'bold 38px serif';
    ctx.fillText(suit.symbol, 14, 86);
    ctx.restore();

    ctx.font = '140px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = suit.color;
    ctx.fillText(suit.symbol, 128, 185);
  }

  const tex = new THREE.CanvasTexture(cvs);
  tex.needsUpdate = true;
  return tex;
}

export function makeBackTex() {
  const cvs = document.createElement('canvas');
  cvs.width = 256;
  cvs.height = 360;
  const ctx = cvs.getContext('2d');

  ctx.fillStyle = '#ff0000';
  ctx.fillRect(0, 0, 256, 360);

  ctx.fillStyle = '#888888';
  const step = 18;
  for (let y = 0; y < 360; y += step) {
    for (let x = 0; x < 256; x += step) {
      const ox = (y / step % 2 === 0) ? 0 : step / 2;
      ctx.beginPath();
      ctx.arc(x + ox + step / 2, y + step / 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 248, 352);

  // Black P with white outline, no circle, bigger
  ctx.save();
  ctx.font = 'bold 124px "Mr Dafoe", Arial';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.strokeText('P', 128, 185);
  ctx.fillStyle = '#000000';
  ctx.fillText('P', 128, 185);
  ctx.restore();

  const tex = new THREE.CanvasTexture(cvs);
  tex.needsUpdate = true;
  return tex;
}

export function createCardMesh(cardData, frontTex, backTex) {
  const group = new THREE.Group();
  group.userData = { cardData };

  const frontGeo = new THREE.PlaneGeometry(CARD_W, CARD_H);
  const backGeo  = new THREE.PlaneGeometry(CARD_W, CARD_H);

  const frontMat = new THREE.MeshBasicMaterial({ map: frontTex, side: THREE.FrontSide });
  const backMat  = new THREE.MeshBasicMaterial({ map: backTex,  side: THREE.FrontSide });

  const frontMesh = new THREE.Mesh(frontGeo, frontMat);
  const backMesh  = new THREE.Mesh(backGeo, backMat);

  backMesh.position.z = -CARD_D;
  backMesh.rotation.y = Math.PI;

  group.add(frontMesh);
  group.add(backMesh);
  group.rotation.x = -0.25;
  group.position.y = 1.8;

  console.log('[createCardMesh] created, rotation.x=-0.25, position.y=1.8');
  return group;
}

export async function animateShuffle(cards, scene, deckCount) {
  console.log('[animateShuffle] starting,', cards.length, 'cards, deckCount:', deckCount);
  const duration = 1200;
  const start = performance.now();

  cards.forEach(card => {
    scene.add(card.mesh);
    card.mesh.rotation.y = Math.PI;
  });

  return new Promise(resolve => {
    function step(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = easeInOutCubic(t);

      cards.forEach((card, i) => {
        const frac = i / (cards.length - 1);
        const xSpread = (frac - 0.5) * (cards.length * 1.2);
        card.mesh.position.x = xSpread * eased;
        card.mesh.position.y = 0;
        card.mesh.position.z = -i * CARD_D * 0.8;
        card.mesh.rotation.z = 0;
        card.mesh.rotation.y = Math.PI;
      });

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        cards.forEach((card, i) => {
          const xSpread = (i / (cards.length - 1) - 0.5) * (cards.length * 1.2);
          card.mesh.position.set(xSpread, 0, -i * CARD_D * 0.8);
          card.mesh.rotation.y = Math.PI;
        });
        console.log('[animateShuffle] done');
        resolve();
      }
    }
    requestAnimationFrame(step);
  });
}

export async function animateFlipIn(cards, scene) {
  const flipDuration = 700;
  const staggerDelay = 200;
  const start = performance.now();

  return new Promise(resolve => {
    let completed = 0;

    cards.forEach((card, i) => {
      const cardStart = start + i * staggerDelay;

      function step(now) {
        const cardT = Math.max(0, now - cardStart);
        const t = Math.min(cardT / flipDuration, 1);
        const eased = easeInOutCubic(t);

        const tx = card.targetX, ty = card.targetY, tz = card.targetZ || 0;

        card.mesh.position.x = tx * eased;
        card.mesh.position.y = ty * eased;
        card.mesh.position.z = -0.5 + (tz + 0.5) * eased;

        const overshoot = Math.sin(eased * Math.PI) * 0.08;
        card.mesh.rotation.y = Math.PI * (1 - eased) + overshoot;
        card.mesh.rotation.z = (card.targetRot || 0) * eased;

        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          card.mesh.rotation.y = 0;
          card.mesh.position.set(tx, ty, tz);
          completed++;
          if (completed === cards.length) resolve();
        }
      }

      setTimeout(() => requestAnimationFrame(step), i * staggerDelay);
    });
  });
}

export function arrangeFan(cards, count) {
  // Left-to-right row with gentle wave — right always on top, wave for texture
  const spacing = 1.5;
  const totalWidth = (count - 1) * spacing;
  const startX = -totalWidth / 2;

  cards.forEach((card, i) => {
    card.targetX = startX + i * spacing;
    card.targetY = 4.7 + (i / (count - 1)) * 0.6;
    card.targetZ = 0;
  });
}

export function setupScene(canvas) {
  const container = canvas.parentElement;
  const containerW = container.clientWidth;
  const containerH = container.clientHeight;
  console.log('[setupScene] container dimensions:', containerW, containerH);
  const w = Math.max(containerW, 600);
  const h = Math.max(containerH, 450);
  console.log('[setupScene] canvas pixel dimensions:', w, h);

  canvas.width = w;
  canvas.height = h;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h, false);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.background = null;

  const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 100);
  camera.position.set(0, 7.5, 11.0);
  camera.lookAt(0, 5.5, 0);

  const ambient = new THREE.AmbientLight(0xfff8e8, 1.0);
  scene.add(ambient);

  const dir = new THREE.DirectionalLight(0xffffff, 1.5);
  dir.position.set(2, 5, 4);
  scene.add(dir);

  const point = new THREE.PointLight(0xd4af37, 0.6, 12);
  point.position.set(0, 3, 3);
  scene.add(point);

  function onResize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w > 0 && h > 0) {
      canvas.width = w;
      canvas.height = h;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
  }
  window.addEventListener('resize', onResize);

  return {
    renderer, scene, camera,
    dispose: () => {
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    }
  };
}
