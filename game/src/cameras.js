// Security cameras: fixed to a wall, sweeping a RED cone back and forth on a rhythm
// the thief can learn. A camera that sees the thief fills the alarm meter fast. The
// jammer freezes every camera for a few seconds — frozen cameras draw a grey cone.

import { CAMERA } from './config.js';

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** True when the camera at (cx,cy) facing `angle` can see the point (px,py). */
export function cameraCanSee(world, camera, px, py, visibility) {
  const dx = px - camera.x;
  const dy = py - camera.y;
  const dist = Math.hypot(dx, dy);
  const range = CAMERA.sightRange * visibility;
  if (dist > range) return false;
  if (dist < 30) return world.lineOfSight(camera.x, camera.y, px, py);
  const toPlayer = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(toPlayer, camera.angle)) > CAMERA.sightHalfAngle) return false;
  return world.lineOfSight(camera.x, camera.y, px, py);
}

export function createCameras(world, defs) {
  const cameras = defs.map((def, index) => ({
    x: def.x,
    y: def.y,
    from: def.from,
    to: def.to,
    // Stagger the sweep phase so cameras do not all turn together.
    phase: index * 1.7,
    angle: (def.from + def.to) / 2,
    direction: 1,
    jammed: 0,
  }));

  return {
    cameras,

    /** Advance every camera one fixed step (frozen while jammed). */
    step(dt) {
      for (const camera of cameras) {
        if (camera.jammed > 0) {
          camera.jammed = Math.max(0, camera.jammed - dt);
          continue;
        }
        camera.angle += camera.direction * CAMERA.sweepSpeed * dt;
        if (camera.direction > 0 && camera.angle >= camera.to) {
          camera.angle = camera.to;
          camera.direction = -1;
        } else if (camera.direction < 0 && camera.angle <= camera.from) {
          camera.angle = camera.from;
          camera.direction = 1;
        }
      }
    },

    /** True when any live camera cone currently sees the thief (for the alarm meter). */
    anySees(player, smoke) {
      for (const camera of cameras) {
        if (camera.jammed > 0) continue;
        const hidden = smoke && smoke.active && Math.hypot(player.x - smoke.x, player.y - smoke.y) < smoke.radius;
        if (!hidden && cameraCanSee(world, camera, player.x, player.y, player.visibility)) return true;
      }
      return false;
    },

    /** Freeze every camera for `seconds` (the jammer tool). */
    jamAll(seconds) {
      for (const camera of cameras) camera.jammed = seconds;
    },
  };
}
