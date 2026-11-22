// The loot: the golden idol on its pedestal in the middle of the room, and the glowing
// green getaway door. The door only opens once the idol is grabbed.

import { PLAYER } from './config.js';

export function createLoot(world) {
  return {
    x: world.loot.x,
    y: world.loot.y,
    grabbed: false,
    /** Glow pulse phase, for the renderer's shimmer. */
    pulse: 0,

    reset() {
      this.grabbed = false;
      this.pulse = 0;
    },

    /** True when the thief is close enough to start grabbing. */
    inRange(player) {
      return Math.hypot(player.x - this.x, player.y - this.y) <= PLAYER.grabRadius;
    },

    /** Advance one fixed step: the glow pulse and the grab channel. Returns 'grabbed' when done. */
    step(player, dt) {
      this.pulse += dt;
      if (this.grabbed) return null;
      if (player.grabbing && this.inRange(player)) {
        player.grabProgress += dt;
        if (player.grabProgress >= PLAYER.grabTime) {
          this.grabbed = true;
          player.grabbing = false;
          player.grabProgress = 0;
          return 'grabbed';
        }
      } else {
        player.grabbing = false;
        player.grabProgress = 0;
      }
      return null;
    },

    /** True when the thief is inside the getaway door (only counts after the grab). */
    atExit(player) {
      if (!this.grabbed) return false;
      const e = world.exit;
      return player.x >= e.x - 6 && player.x <= e.x + e.w + 6 && player.y >= e.y - 6 && player.y <= e.y + e.h + 6;
    },
  };
}
