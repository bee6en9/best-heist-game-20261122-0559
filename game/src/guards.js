// Guards: patrol waypoints they walk in a loop, a warm-yellow vision cone, and three
// states — patrol, suspicious ("?", walks to investigate a glimpse), alerted ("!", chases
// the thief). A guard that touches the thief while alerted catches them.

import { GUARD } from './config.js';

export const GUARD_PATROL = 'patrol';
export const GUARD_SUSPICIOUS = 'suspicious';
export const GUARD_ALERTED = 'alerted';

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** True when the guard at (gx,gy) facing `angle` can see the point (px,py). */
export function guardCanSee(world, guard, px, py, visibility) {
  const dx = px - guard.x;
  const dy = py - guard.y;
  const dist = Math.hypot(dx, dy);
  const range = GUARD.sightRange * visibility;
  if (dist > range) return false;
  if (dist < 30) return world.lineOfSight(guard.x, guard.y, px, py);
  const toPlayer = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(toPlayer, guard.angle)) > GUARD.sightHalfAngle) return false;
  return world.lineOfSight(guard.x, guard.y, px, py);
}

export function createGuards(world, defs) {
  const guards = defs.map((def) => ({
    x: def.x,
    y: def.y,
    waypoints: def.waypoints.map(([x, y]) => ({ x, y })),
    waypointIndex: 1 % def.waypoints.length,
    angle: Math.atan2(def.waypoints[1][1] - def.y, def.waypoints[1][0] - def.x),
    state: GUARD_PATROL,
    suspicion: 0,
    calm: 0,
    investigate: null,
    // Cone sweep for the shot scenes: the rendered cone angle is this, not the walk angle.
    coneAngle: 0,
  }));
  for (const guard of guards) guard.coneAngle = guard.angle;

  function moveToward(guard, tx, ty, speed, dt) {
    const dx = tx - guard.x;
    const dy = ty - guard.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return true;
    const step = Math.min(dist, speed * dt);
    const nx = guard.x + (dx / dist) * step;
    const ny = guard.y + (dy / dist) * step;
    if (!world.blocked(nx, ny, GUARD.radius)) {
      guard.x = nx;
      guard.y = ny;
    }
    guard.angle = Math.atan2(dy, dx);
    return dist <= step + 0.5;
  }

  return {
    guards,

    /** Advance every guard one fixed step. Returns true when any guard catches the thief. */
    step(dt, player, smoke) {
      let caught = false;
      for (const guard of guards) {
        const hidden = smoke && smoke.active && Math.hypot(player.x - smoke.x, player.y - smoke.y) < smoke.radius;
        const sees = !hidden && guardCanSee(world, guard, player.x, player.y, player.visibility);
        if (sees) {
          guard.suspicion += dt;
          guard.calm = 0;
          guard.investigate = { x: player.x, y: player.y };
          if (guard.suspicion >= GUARD.suspicionTime) guard.state = GUARD_ALERTED;
          else if (guard.state === GUARD_PATROL) guard.state = GUARD_SUSPICIOUS;
        } else {
          guard.suspicion = Math.max(0, guard.suspicion - dt * 0.6);
          if (guard.state !== GUARD_PATROL) {
            guard.calm += dt;
            if (guard.calm >= GUARD.calmTime) {
              guard.state = GUARD_PATROL;
              guard.calm = 0;
              guard.investigate = null;
            }
          }
        }

        if (guard.state === GUARD_ALERTED) {
          moveToward(guard, player.x, player.y, GUARD.chaseSpeed, dt);
        } else if (guard.state === GUARD_SUSPICIOUS && guard.investigate) {
          if (moveToward(guard, guard.investigate.x, guard.investigate.y, GUARD.patrolSpeed * 1.15, dt)) {
            guard.investigate = null;
            guard.state = GUARD_PATROL;
          }
        } else {
          const target = guard.waypoints[guard.waypointIndex];
          if (moveToward(guard, target.x, target.y, GUARD.patrolSpeed, dt)) {
            guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
          }
        }
        // The drawn cone lags the walk angle a little, so a sweep reads as motion.
        guard.coneAngle += angleDiff(guard.angle, guard.coneAngle) * Math.min(1, dt * 6);

        const d = Math.hypot(player.x - guard.x, player.y - guard.y);
        if (d < GUARD.catchRadius && guard.state === GUARD_ALERTED) caught = true;
      }
      return caught;
    },

    /** True when any guard cone currently sees the thief (for the alarm meter). */
    anySees(player, smoke) {
      for (const guard of this.guards) {
        const hidden = smoke && smoke.active && Math.hypot(player.x - smoke.x, player.y - smoke.y) < smoke.radius;
        if (!hidden && guardCanSee(world, guard, player.x, player.y, player.visibility)) return true;
      }
      return false;
    },

    /** All guards converge on (x,y): lockdown. */
    converge(x, y) {
      for (const guard of this.guards) {
        guard.state = GUARD_ALERTED;
        guard.suspicion = GUARD.suspicionTime;
        guard.investigate = { x, y };
      }
    },
  };
}
