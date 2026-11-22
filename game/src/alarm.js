// The alarm meter: 0–100%. It fills while any guard cone or camera cone sees the thief
// (faster in the light, slower in shadow, faster still while grabbing), drains while
// hidden, flashes a warning at 75%, and at 100% triggers LOCKDOWN — every guard converges
// and the thief has 10 seconds to reach the exit.

import { ALARM } from './config.js';

export function createAlarm() {
  return {
    value: 0,
    lockdown: false,
    lockdownTimeLeft: 0,
    /** True on the exact step the meter hits 100%. */
    justTriggered: false,

    reset() {
      this.value = 0;
      this.lockdown = false;
      this.lockdownTimeLeft = 0;
      this.justTriggered = false;
    },

    /** Advance one fixed step. `seen` = { guard, camera }, `shadow`, `grabbing`. */
    step(seen, shadow, grabbing, dt) {
      this.justTriggered = false;
      if (this.lockdown) {
        this.lockdownTimeLeft -= dt;
        return;
      }
      let rate = 0;
      if (seen.guard) rate += ALARM.guardRate;
      if (seen.camera) rate += ALARM.cameraRate;
      if (rate > 0) {
        if (shadow) rate *= ALARM.shadowMultiplier;
        if (grabbing) rate *= ALARM.grabMultiplier;
        this.value = Math.min(100, this.value + rate * dt);
      } else {
        this.value = Math.max(0, this.value - ALARM.drainRate * dt);
      }
      if (this.value >= 100) {
        this.lockdown = true;
        this.lockdownTimeLeft = ALARM.lockdownSeconds;
        this.justTriggered = true;
      }
    },

    /** End lockdown early (the thief escaped through the door). */
    clearLockdown() {
      this.lockdown = false;
      this.lockdownTimeLeft = 0;
      this.value = 55;
    },

    get warning() {
      return this.value >= ALARM.warnAt && !this.lockdown;
    },
  };
}
