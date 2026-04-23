// Card definitions and deck generation

export const SUITS = {
  hearts: { symbol: '♥', color: '#c41e3a', name: 'Hearts' },
  diamonds: { symbol: '♦', color: '#c41e3a', name: 'Diamonds' },
  clubs: { symbol: '♣', color: '#1a1a1a', name: 'Clubs' },
  spades: { symbol: '♠', color: '#1a1a1a', name: 'Spades' },
};

export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const JOKERS = [
  { rank: 'JOKER', suit: 'joker', id: 'joker-0' },
  { rank: 'JOKER', suit: 'joker', id: 'joker-1' },
];

export function createDeck(count = 1, includeJokers = false) {
  const shoe = [];
  for (let d = 0; d < count; d++) {
    for (const suit of Object.keys(SUITS)) {
      for (const rank of RANKS) {
        shoe.push({ suit, rank, id: `${suit}-${rank}-d${d}` });
      }
    }
    if (includeJokers) {
      for (const joker of JOKERS) {
        shoe.push({ suit: 'joker', rank: 'JOKER', id: `${joker.id}-d${d}` });
      }
    }
  }
  return shoe;
}

export function shuffleShoe(shoe) {
  // Fisher-Yates shuffle
  const a = [...shoe];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function drawCards(shoe, count) {
  return shoe.slice(0, Math.min(count, shoe.length));
}

export function cardName(card) {
  if (card.suit === 'joker') return 'JOKER';
  return `${card.rank}${SUITS[card.suit].symbol}`;
}

export function cardShortName(card) {
  return `${card.rank}${SUITS[card.suit].symbol}`;
}

// Generate card face texture as canvas data URL
export function cardFaceTexture(card) {
  const cvs = document.createElement('canvas');
  cvs.width = 250;
  cvs.height = 350;
  const ctx = cvs.getContext('2d');
  const suit = SUITS[card.suit];
  const isRed = suit.color === '#c41e3a';

  // Card background
  ctx.fillStyle = '#f5f5f0';
  ctx.fillRect(0, 0, 250, 350);

  // Rounded corners
  ctx.fillStyle = '#f5f5f0';
  ctx.beginPath();
  ctx.roundRect(5, 5, 240, 340, 12);
  ctx.fill();

  // Border
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(5, 5, 240, 340, 12);
  ctx.stroke();

  // Corner rank + suit (top-left)
  ctx.fillStyle = isRed ? '#c41e3a' : '#1a1a1a';
  ctx.font = 'bold 28px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(card.rank, 14, 38);
  ctx.font = '26px serif';
  ctx.fillText(suit.symbol, 14, 66);

  // Corner rank + suit (bottom-right, rotated)
  ctx.save();
  ctx.translate(250, 350);
  ctx.rotate(Math.PI);
  ctx.fillStyle = isRed ? '#c41e3a' : '#1a1a1a';
  ctx.font = 'bold 28px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(card.rank, 14, 38);
  ctx.font = '26px serif';
  ctx.fillText(suit.symbol, 14, 66);
  ctx.restore();

  // Large center suit symbol
  ctx.font = '110px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = suit.color;
  ctx.globalAlpha = 0.9;
  ctx.fillText(suit.symbol, 125, 175);
  ctx.globalAlpha = 1;

  return cvs.toDataURL();
}

// Generate card back texture
export function cardBackTexture() {
  const cvs = document.createElement('canvas');
  cvs.width = 250;
  cvs.height = 350;
  const ctx = cvs.getContext('2d');

  // Base crimson
  ctx.fillStyle = '#c41e3a';
  ctx.fillRect(0, 0, 250, 350);

  // Diamond pattern
  ctx.fillStyle = '#a01830';
  const step = 20;
  for (let y = 0; y < 350; y += step) {
    for (let x = 0; x < 250; x += step) {
      const offset = (y / step) % 2 === 0 ? 0 : step / 2;
      ctx.beginPath();
      ctx.moveTo(x + offset, y);
      ctx.lineTo(x + offset + step / 2, y + step / 2);
      ctx.lineTo(x + offset, y + step);
      ctx.lineTo(x + offset - step / 2, y + step / 2);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Center emblem circle
  ctx.fillStyle = '#d4af37';
  ctx.beginPath();
  ctx.arc(125, 175, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c41e3a';
  ctx.beginPath();
  ctx.arc(125, 175, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d4af37';
  ctx.font = 'bold 36px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('P', 125, 180);

  // Border
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 242, 342);

  return cvs.toDataURL();
}
