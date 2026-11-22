// The screenshot scenes behind ?shot=start|play|grab. Each one stages the real game
// state — the same world, guards, cameras, loot and alarm the player sees — at a fixed
// moment, so the same seed always gives the same frame. The play shot is the cover: the
// thief mid-room with a yellow guard cone and a red camera cone sweeping in, the golden
// idol glowing at the centre, and the alarm meter part-filled, all in one frame.

import { LEVELS, PLAYER } from './config.js';
import { createWorld } from './world.js';
import { createGuards } from './guards.js';
import { createCameras } from './cameras.js';
import { createPlayer } from './player.js';
import { createLoot } from './loot.js';
import { createAlarm } from './alarm.js';
import { SCREEN_TITLE, SCREEN_PLAY } from './render.js';

/** A fresh level-1 state, shaped exactly like the live game's state object. */
function freshState() {
  const level = LEVELS[0];
  const world = createWorld(level);
  const player = createPlayer(level.playerStart);
  return {
    world,
    guards: createGuards(world, level.guards),
    cameras: createCameras(world, level.cameras),
    player,
    loot: createLoot(world),
    alarm: createAlarm(),
    levelIndex: 0,
    levelValue: level.lootValue,
    lootValue: 0,
    elapsed: 0,
  };
}

/** Let the guards walk and the cameras sweep for `seconds` of fixed steps. */
function idle(state, seconds) {
  const steps = Math.round(seconds * 60);
  for (let i = 0; i < steps; i += 1) {
    state.guards.step(1 / 60, state.player, null);
    state.cameras.step(1 / 60);
    state.loot.step(state.player, 1 / 60);
  }
}

/**
 * Set `state` to the named scene (start, play or grab; any other name is start) and
 * return the screen to draw over it and the best loot value to show.
 */
export function stageShot(name, state) {
  const fresh = freshState();
  Object.assign(state, fresh);
  state.player.lives = 3;

  if (name === 'play') {
    // Mid-heist, 6 seconds in: the thief has crept to the lower middle of the room.
    idle(state, 6);
    state.elapsed = 96;
    state.player.x = 560;
    state.player.y = 470;
    state.player.facing = Math.atan2(360 - 470, 640 - 560);
    state.player.sneaking = true;
    state.player.visibility = 0.62;
    // Guard one turns its yellow cone toward the thief; camera one sweeps its red
    // cone down across the same spot. Both cones, the loot and the meter in one frame.
    const guard = state.guards.guards[0];
    guard.x = 780;
    guard.y = 380;
    guard.angle = Math.atan2(470 - 380, 560 - 780);
    guard.coneAngle = guard.angle;
    guard.state = 'suspicious';
    const camera = state.cameras.cameras[0];
    camera.angle = Math.atan2(470 - 34, 560 - 640);
    camera.direction = -1;
    // The meter sits at 38%: glimpsed once, not yet lockdown — the tense middle.
    state.alarm.value = 38;
    return { screen: SCREEN_PLAY, best: 0 };
  }

  if (name === 'grab') {
    // The thief at the pedestal, 1.2s into the 2s grab, exposed: a red camera cone
    // sweeps in from the top and a guard has turned suspicious.
    idle(state, 6);
    state.elapsed = 141;
    state.player.x = 640;
    state.player.y = 415;
    state.player.facing = -Math.PI / 2;
    state.player.grabbing = true;
    state.player.grabProgress = 1.2;
    const guard = state.guards.guards[0];
    guard.x = 500;
    guard.y = 300;
    guard.angle = Math.atan2(360 - 300, 640 - 500);
    guard.coneAngle = guard.angle;
    guard.state = 'suspicious';
    const camera = state.cameras.cameras[0];
    camera.angle = Math.atan2(360 - 34, 640 - 640);
    camera.direction = 1;
    state.alarm.value = 55;
    return { screen: SCREEN_PLAY, best: 0 };
  }

  // start (default): the title screen over a living gallery, guards on patrol.
  idle(state, 5);
  state.elapsed = 0;
  return { screen: SCREEN_TITLE, best: 0 };
}
