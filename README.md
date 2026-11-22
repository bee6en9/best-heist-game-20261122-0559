# MIDNIGHT VAULT — a museum heist game

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/bee6en9/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/bee6en9/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

A top-down heist game built for [make.fun's "Make the best heist game" bounty](https://make.fun/bounty/best-heist-game-20261122-0559) ($50 in USDC).

You are a thief in a museum gallery at night. Cross the room, dodge the guards'
warm-yellow vision cones and the red cones of the sweeping security cameras,
grab the golden idol from its pedestal, and reach the glowing green getaway
door — before the alarm meter fills. Three galleries, three idols, one perfect
heist.

Play it free with my referral code: **vfk2n47z** — https://make.fun?ref=vfk2n47z

## How to play

Serve it locally and open http://localhost:8080:

```
node serve.ts
```

No network request: every script, sound and image is a file in `game/`
(sounds are Web Audio, generated in code).

| Key | Action |
| --- | --- |
| WASD / arrow keys | Move |
| Shift | Sneak — slower, quieter, harder to spot |
| E | Grab the golden idol (takes 2 seconds — you are exposed) |
| Space | Smoke bomb — blocks all sight for 4s (2 per gallery) |
| J | Camera jammer — freezes every camera for 5s (1 per gallery) |
| P | Pause |
| R | Restart the gallery |
| M | Mute |

## The heist

- **Guards** patrol routes you can learn. Their yellow cones mean patrol;
  a "?" means they glimpsed you and are coming to look; a "!" means they
  are chasing. A guard that touches you while alerted catches you.
- **Cameras** are fixed to the walls and sweep red cones back and forth.
  A camera that sees you fills the alarm meter fast — learn the rhythm.
- **The alarm meter** (top of the screen) fills while any cone sees you —
  faster in the light, slower in the dark side corridor, faster still while
  you grab the idol — and drains while you stay hidden. At 75% it flashes
  a warning. At 100% the museum goes into **lockdown**: every guard
  converges on you and you have 10 seconds to reach the exit.
- **Two routes per gallery**: the main floor is fast and exposed under the
  cameras; the dark side corridor is slow and safe. Display cases and
  pillars block sight — use them as cover.
- **Three lives.** Caught means losing a life and restarting the gallery.
  Clear all three galleries and the loot is yours.

## Screenshots

Deterministic scenes from the game itself (`?shot=start|play|grab&seed=1`):

- `screenshots/1-start.jpg` — title screen over the living gallery
- `screenshots/2-play.jpg` — mid-heist: guard cone, camera cone, glowing idol and alarm meter in one frame
- `screenshots/3-grab.jpg` — grabbing the idol while a camera sweeps in

## Structure

- `game/src/config.js` — tuning numbers, colours, and the three gallery layouts
- `game/src/input.js` — keyboard input
- `game/src/world.js` — room geometry: walls, cases, pillars, collision, line-of-sight
- `game/src/guards.js` — patrols, vision cones, patrol / suspicious / alerted states
- `game/src/cameras.js` — sweeping red cones and the jammer
- `game/src/player.js` — movement, sneak, smoke bomb, jammer, lives
- `game/src/loot.js` — the golden idol, the grab, the getaway door
- `game/src/alarm.js` — the alarm meter and lockdown
- `game/src/audio.js` — Web Audio sounds (footsteps, camera hum, alarm beep, chime, fanfare)
- `game/src/render.js` — Canvas drawing: floor, cones, loot, HUD
- `game/src/shots.js` — the deterministic screenshot scenes
- `game/src/main.js` — boot, the fixed-step loop, screens, win/lose
- `main.ts` — copies `game/` + `screenshots/` to `/output` and writes `dossier.json`
- `serve.ts` — local static server for testing

## License

MIT — see [LICENSE](LICENSE).
