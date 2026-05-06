# MEMORY.md — Long-Term Memory (Curated)

## About Varg (The User)
- Name: Varg
- Contact: Telegram (@Murphys_BOSS, ID: 8754108637)
- Timezone: America/Toronto
- Interests: Business ideas, AI, automation, app development
- Works on side projects with me — dice roller, slot selector, card flip apps

## Active Projects

### 🎲 Dice Roller (`dice-roller/`, ports 3038/3002)
**Repo:** `MurphyLabai/virtual-dice-roller`
**Status:** Work in progress
- **Last fix (May 6):** Stale dice overlap on re-roll — added `await diceRoller.reset()` before `roll()` in handleRoll()
- **Pushed:** commit `4bc6063` — fresh start point
- **Pending:** d100 double-count bug (count=2 rolls 4 physical dice instead of 2) — library bug in open-dice-dnd v1.1.2
- **Pending:** d20 delay after first roll — needs testing after reset() fix
- Mobile FAB and stacked layout already implemented

### 🎰 Slot Selector (`slot-selector/`, port 3044)
**Repo:** `MurphyLabai/slot-selector`
**Status:** Work in progress
- 5-reel slot machine with winner strip
- Min 6 entries enforced
- Winner strip shows CSS animation with name for 3s
- Last work (May 5): rebuilt winner-strip HTML/CSS/JS from scratch, not yet committed
- PNG pictures on slot faces may not be showing (needs verification)

### 🃏 Card Flip (`card-flip/`, port 3041)
**Repo:** `MurphyLabai/card-flip`
**Status:** PAUSED
- Mobile canvas 16:10 aspect ratio fix paused mid-troubleshoot (Apr 28)
- Sidebar z-index layering on mobile not resolved
- User wants to restart fresh — don't revert, pick up where we left off

### 🪙 Coin Toss (`coin-toss/`, port 3040/3003)
**Repo:** `MurphyLabai/virtual-coin-toss`
**Status:** Needs mobile FAB + stacked layout (same pattern as Dice Roller)

### 📦 NameXtractor (port 3001)
**Status:** Running fine. No current issues.

### 🏁 Off to the Races (port 3021)
**Status:** Running fine. No current issues.

## Infrastructure
## Infrastructure
- **GitHub token:** stored in `x-token.env` (not in repo)
- **Dev server ports:** 3021 (Off to the Races), 3038/3002 (Dice Roller), 3040/3003 (Coin Toss), 3041 (Card Flip), 3044 (Slot Selector), 3052 (Website), 3001 (NameXtractor)
- **GitHub repos:** `MurphyLabai/card-flip`, `MurphyLabai/virtual-dice-roller`, `MurphyLabai/virtual-coin-toss`, `MurphyLabai/slot-selector`

## Memory / Cron System
- **Session files:** `C:\Users\ProjectDev\.openclaw\agents\main\sessions\` (raw JSONL)
- **Daily notes:** `C:\Users\ProjectDev\.openclaw\workspace\memory\2026-05-06.md` (and older)
- **Nightly Memory Consolidation cron added May 6** — runs at 2am ET, reads session files and updates daily memory
- **R&D Team Morning cron** — runs 10am ET, analyzes business projects (timeout fixed May 6)
- **Haly Memory Backup** — 8am ET, backs up Haly agent to D: drive (timeout fixed May 6)
- **Health Check cron** — every 30m, working fine
- **Daily Backup to D Drive** — backs up entire workspace to D:\MurphyLab-Backup\
- **Transcript Backup** — every 8h

## Key Decisions
- d100 uses 2 physical dice internally (like a real d100 = two d10s) — this is by design in the library
- open-dice-dnd library v1.1.2 has a bug where d100 creates 4 dice when count=2 on re-rolls (after first settle phase)
- Mobile FAB for Dice Roller and Coin Toss — done already
- Slot Selector winner strip position: between Entries and History on mobile

## Preferences / Style
- User prefers to push to GitHub at natural stopping points, not after every tiny change
- OpenClaw updated around May 4/5 — caused cron timeout issues and user noticed personality/speed changes
- User wants me to be resourceful and come with answers, not just questions
- In group chats, quality over quantity — don't respond to everything
