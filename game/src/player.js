// The thief: movement (walk/sneak), the two tools at a cost (smoke bomb, camera
// jammer), lives, and the 2-second loot grab that leaves the thief exposed.

import { PLAYER, TOOLS } from './config.js';

export function createPlayer(start) {
  return {
    x: start.x,
    y: start.y,
    /** How visible the thief is right now: 1 normally, less while sneaking. */
    visibility: 1,
    sneaking: false,
    moving: false,
    facing: -Math.PI / 2,
    /** Seconds of grab channel completed (0 when not grabbing). */
    grabProgress: 0,
    grabbing: false,
    smokeLeft: TOOLS.smokePerLevel,
    jamLeft: TOOLS.jamPerLevel,
    smoke: { active: false, x: 0, y: 0, radius: TOOLS.smokeRadius, timeLeft: 0 },
    lives: 3,

    reset(startPos) {
      this.x = startPos.x;
      this.y = startPos.y;
      this.visibility = 1;
      this.sneaking = false;
      this.moving = false;
      this.facing = -Math.PI / 2;
      this.grabProgress = 0;
      this.grabbing = false;
      this.smokeLeft = TOOLS.smokePerLevel;
      this.jamLeft = TOOLS.jamPerLevel;
      this.smoke = { active: false, x: 0, y: 0, radius: TOOLS.smokeRadius, timeLeft: 0 };
    },

    /** Advance the thief one fixed step. `dir` is {x, y} from input. */
    step(world, dir, sneaking, dt) {
      this.sneaking = sneaking;
      const speed = sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
      this.visibility = sneaking ? PLAYER.sneakVisibility : 1;
      this.moving = dir.x !== 0 || dir.y !== 0;
      if (this.moving) this.facing = Math.atan2(dir.y, dir.x);
      // Grabbing roots the thief in place: the idol takes both hands.
      if (!this.grabbing) {
        world.moveCircle(this, PLAYER.radius, dir.x * speed * dt, dir.y * speed * dt);
      }
      if (this.smoke.active) {
        this.smoke.timeLeft -= dt;
        if (this.smoke.timeLeft <= 0) this.smoke.active = false;
      }
    },

    /** Spend a smoke bomb: a cloud at the thief's feet that blocks all sight. */
    useSmoke() {
      if (this.smokeLeft <= 0) return false;
      this.smokeLeft -= 1;
      this.smoke = { active: true, x: this.x, y: this.y, radius: TOOLS.smokeRadius, timeLeft: TOOLS.smokeSeconds };
      return true;
    },

    /** Spend the camera jammer: returns true when one was left to spend. */
    useJam() {
      if (this.jamLeft <= 0) return false;
      this.jamLeft -= 1;
      return true;
    },
  };
}
