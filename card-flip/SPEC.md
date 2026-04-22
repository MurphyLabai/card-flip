# Card Flip — PromoPlay

## Concept & Vision

A premium 3D playing card flipper. User selects how many decks to use and how many cards to flip per round, clicks Flip, watches a satisfying deck shuffle animation, then sees cards flip in one-by-one with full 3D animation. Running history persists until cleared. Feels like a Vegas card table — dark, sleek, tactile.

## Design Language

- **Aesthetic:** Dark casino felt — deep greens, golds, crisp white card faces
- **Colors:**
  - `--bg: #0d1a0d` — deep dark green background
  - `--felt: #1a3d1a` — casino felt green
  - `--gold: #d4af37` — gold accents
  - `--white: #ffffff`
  - `--card-face: #f5f5f0` — off-white card face
  - `--card-back: #c41e3a` — classic crimson red card back
  - `--red-suit: #c41e3a`
  - `--black-suit: #1a1a1a`
- **Typography:** Audiowide for titles, clean sans-serif for body
- **Motion:** Full 3D flip animation using Three.js. Shuffle uses procedural deck riffling. Cards fan out in 3D space before flipping.

## Deck & Card System

- **Deck count options:** 1, 2, 4, or 6 decks
- **Card flip count:** 1–10 cards per round
- **Shuffle animation:** Cards visually riffle shuffle based on deck count (more decks = longer shuffle)
- **Card data:** Standard 52-card deck. Suits ♠♥♦♣ with Unicode symbols. Ranks A,2-10,J,Q,K.
- **Random draw:** Cards drawn randomly without replacement from combined shoe

## Features

1. **Setup page**
   - Deck count selector (1, 2, 4, 6) — pill buttons
   - Cards per flip selector (1–10) — pill buttons  
   - Large "Flip Cards" button
   - PromoPlay branding

2. **Shuffle animation**
   - Cards stack up in 3D
   - Riffle shuffle animation — cards interleaving from top and bottom of deck
   - Duration scales with deck count: ~1s per deck

3. **Card flip animation**
   - Cards fly out from deck one-by-one
   - Each card performs a full 3D flip (Y-axis rotation) to reveal face
   - Cards arrange in a fan on the table
   - Slight random rotation for natural table feel

4. **Results display**
   - Card faces shown in 3D space
   - Suit + rank clearly visible
   - Red for hearts/diamonds, black for clubs/spades

5. **History**
   - Running list of all flips (timestamp + cards drawn)
   - Shows card count and card names
   - "Clear History" button
   - Persists in sessionStorage

6. **Back button** from flip back to setup (keeps settings)

## Technical Approach

- **Three.js** for all 3D rendering (card meshes, flip animation, shuffle animation)
- **Single page** — same HTML, state managed in JS (no routing needed)
- Cards as `THREE.Mesh` with `BoxGeometry` — front/back are separate materials
- Shuffle: procedural card interleaving using requestAnimationFrame + Three.js
- Flip: `easeInOutCubic` rotation on Y-axis over ~0.8s
- No backend needed — all random via Fisher-Yates shuffle of combined shoe array

## Card Visual Spec

- Card size: 2.5:3.5 aspect ratio (standard playing card)
- Card back: crimson with subtle diamond/heart pattern (canvas-drawn)
- Card face: off-white with large centered suit symbol + rank in corners
- Face cards (J/Q/K): slightly different face layout with large rank in center
