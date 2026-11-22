// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s
// steps (several in a slow frame, none in a fast one), and the renderer paints what is
// there. The game moves between six screens: title, play, paused, level-clear, caught
// (game over) and win. Three galleries: grab the idol in each, reach the green exit,
// keep the alarm meter below 100%.
//
// ?seed=N fixes the seed (kept for parity with the starter; the gallery layouts are
// fixed). ?shot=start|play|grab (with &seed=N) stages that scene instead of running
// the loop, paints it twice and sets window.__shotReady for a screenshot.

import { BEST_KEY, LEVELS, LIVES, STEP } from './config.js';
import { createWorld } from './world.js';
import { createGuards } from './guards.js';
import { createCameras } from './cameras.js';
import { createPlayer } from './player.js';
import { createLoot } from './loot.js';
import { createAlarm } from './alarm.js';
import { createAudio } from './audio.js';
import {
  ACTION_CONFIRM, ACTION_GRAB, ACTION_JAM, ACTION_MUTE, ACTION_PAUSE, ACTION_RESTART, ACTION_SMOKE,
  createInput,
} from './input.js';
import {
  createRenderer, SCREEN_LEVEL, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN,
} from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : 1;
void seed;

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const audio = createAudio();

/** A fresh state object for `levelIndex`, carrying the running loot total. */
function buildLevel(levelIndex, lootValue) {
  const level = LEVELS[levelIndex];
  const world = createWorld(level);
  const player = createPlayer(level.playerStart);
  player.lives = LIVES;
  return {
    world,
    guards: createGuards(world, level.guards),
    cameras: createCameras(world, level.cameras),
    player,
    loot: createLoot(world),
    alarm: createAlarm(),
    levelIndex,
    levelValue: level.lootValue,
    lootValue,
    elapsed: 0,
  };
}

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best loot then lasts this visit only.
  }
}

function runShot(name) {
  const state = buildLevel(0, 0);
  const scene = stageShot(name, state);
  const renderer = createRenderer(canvas);
  let painted = 0;
  function paint() {
    renderer.draw(state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  const renderer = createRenderer(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let state = buildLevel(0, 0);
  let accumulator = 0;
  let last = performance.now();
  let beepTimer = 0;

  // Screen readers (and anyone watching the page's text) hear the screen changes.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    state = buildLevel(0, 0);
    accumulator = 0;
    screen = SCREEN_PLAY;
    audio.unlock();
    audio.startHum();
    announce(`Playing. ${LIVES} lives. Grab the idol, reach the exit.`);
  }

  function nextLevel() {
    const total = state.lootValue;
    if (state.levelIndex + 1 >= LEVELS.length) {
      screen = SCREEN_WIN;
      state.lootValue = total;
      if (total > best) {
        best = total;
        saveBest(best);
      }
      audio.fanfare();
      announce(`The perfect heist. Total loot $${total}.`);
      return;
    }
    const lives = state.player.lives;
    state = buildLevel(state.levelIndex + 1, total);
    state.player.lives = lives;
    screen = SCREEN_PLAY;
    announce(`Gallery ${state.levelIndex + 1}. Grab the idol.`);
  }

  function loseLife(reason) {
    state.player.lives -= 1;
    audio.caught();
    audio.stopHum();
    if (state.player.lives <= 0) {
      screen = SCREEN_OVER;
      if (state.lootValue > best) {
        best = state.lootValue;
        saveBest(best);
      }
      announce(`Caught. ${reason} Game over.`);
    } else {
      const lives = state.player.lives;
      const total = state.lootValue;
      state = buildLevel(state.levelIndex, total);
      state.player.lives = lives;
      screen = SCREEN_PLAY;
      audio.startHum();
      announce(`Caught. ${reason} ${lives} ${lives === 1 ? 'life' : 'lives'} left. The gallery resets.`);
    }
  }

  function step() {
    if (screen === SCREEN_TITLE) {
      // The gallery lives behind the title: guards patrol, cameras sweep.
      state.guards.step(STEP, state.player, null);
      state.cameras.step(STEP);
      return;
    }
    const actions = input.takeActions();
    if (actions & ACTION_PAUSE) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
      return;
    }
    if (actions & ACTION_RESTART) {
      const lives = state.player.lives;
      const total = state.lootValue;
      state = buildLevel(state.levelIndex, total);
      state.player.lives = lives;
      announce('Gallery restarted.');
      return;
    }
    if (actions & ACTION_MUTE) {
      const muted = audio.toggleMute();
      announce(muted ? 'Muted.' : 'Sound on.');
    }
    if (actions & ACTION_SMOKE) {
      if (state.player.useSmoke()) {
        audio.smoke();
        announce('Smoke bomb!');
      }
    }
    if (actions & ACTION_JAM) {
      if (state.player.useJam()) {
        state.cameras.jamAll(5);
        audio.jam();
        announce('Cameras jammed for 5 seconds.');
      }
    }
    if (actions & ACTION_GRAB) {
      if (!state.loot.grabbed && state.loot.inRange(state.player)) {
        state.player.grabbing = true;
        state.player.grabProgress = 0;
      }
    }

    const dir = input.direction();
    state.player.step(state.world, dir, input.sneaking(), STEP);
    if (state.player.moving && !state.player.sneaking) audio.step();
    const caughtByGuard = state.guards.step(STEP, state.player, state.player.smoke);
    state.cameras.step(STEP);
    const seen = {
      guard: state.guards.anySees(state.player, state.player.smoke),
      camera: state.cameras.anySees(state.player, state.player.smoke),
    };
    const shadow = state.world.inShadow(state.player.x, state.player.y);
    state.alarm.step(seen, shadow, state.player.grabbing, STEP);
    if (state.alarm.justTriggered) {
      state.guards.converge(state.player.x, state.player.y);
      announce('Lockdown! Ten seconds to reach the exit!');
    }
    if (state.alarm.lockdown && state.alarm.lockdownTimeLeft <= 0) {
      loseLife('The lockdown caught you.');
      return;
    }
    beepTimer += STEP;
    if ((seen.guard || seen.camera) && beepTimer > 0.5) {
      beepTimer = 0;
      audio.beep(state.alarm.value);
    }
    const grabbed = state.loot.step(state.player, STEP);
    if (grabbed === 'grabbed') {
      audio.chime();
      announce('Idol secured! Reach the green exit!');
    }
    if (state.loot.atExit(state.player)) {
      state.alarm.clearLockdown();
      state.lootValue += state.levelValue;
      audio.fanfare();
      screen = SCREEN_LEVEL;
      announce(`Gallery ${state.levelIndex + 1} cleared. Press Enter for the next gallery.`);
      return;
    }
    if (caughtByGuard) {
      loseLife('A guard grabbed you.');
      return;
    }
    state.elapsed += STEP;
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      const muted = audio.toggleMute();
      announce(muted ? 'Muted.' : 'Sound on.');
      return;
    }
    if (screen === SCREEN_TITLE && (actions & ACTION_CONFIRM)) startGame();
    else if (screen === SCREEN_OVER && (actions & ACTION_CONFIRM)) startGame();
    else if (screen === SCREEN_WIN && (actions & ACTION_CONFIRM)) startGame();
    else if (screen === SCREEN_LEVEL && (actions & ACTION_CONFIRM)) nextLevel();
    else if (screen === SCREEN_PAUSED && (actions & (ACTION_PAUSE | ACTION_CONFIRM))) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP) {
        step();
        accumulator -= STEP;
        if (screen !== SCREEN_PLAY) {
          accumulator = 0;
          break;
        }
      }
    } else {
      handleActions();
      if (screen === SCREEN_TITLE) step();
      else accumulator = 0;
    }
    renderer.draw(state, screen, best);
  }

  // Leaving the tab pauses a running game rather than letting guards close in unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Midnight Vault. Press Enter to begin the heist.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
