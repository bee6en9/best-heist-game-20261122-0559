// The room: walls, display cases, pillars, the dark side corridor, and the geometry
// helpers every other module uses — movement collision and line-of-sight. A case or a
// pillar blocks both feet and eyes; the corridor only dims the light (shadow).

import { FIELD } from './config.js';

/** The wall ring thickness, in pixels. */
export const WALL = 26;

/** Segment (ax,ay)-(bx,by) against an axis-aligned rect; true when they touch. */
export function segmentHitsRect(ax, ay, bx, by, rect) {
  const dx = bx - ax;
  const dy = by - ay;
  let tMin = 0;
  let tMax = 1;
  if (dx === 0) {
    if (ax < rect.x || ax > rect.x + rect.w) return false;
  } else {
    let t1 = (rect.x - ax) / dx;
    let t2 = (rect.x + rect.w - ax) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  if (dy === 0) {
    if (ay < rect.y || ay > rect.y + rect.h) return false;
  } else {
    let t1 = (rect.y - ay) / dy;
    let t2 = (rect.y + rect.h - ay) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  return true;
}

/** Segment against a circle (pillar); true when they touch. */
export function segmentHitsCircle(ax, ay, bx, by, circle) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((circle.x - ax) * dx + (circle.y - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + dx * t;
  const cy = ay + dy * t;
  const ddx = cx - circle.x;
  const ddy = cy - circle.y;
  return ddx * ddx + ddy * ddy <= circle.r * circle.r;
}

/**
 * Ray (ox,oy) in direction `angle` against one rect: the distance to the first hit,
 * or Infinity. Slab method, same math as segmentHitsRect.
 */
function rayRect(ox, oy, dx, dy, rect) {
  let tMin = 0;
  let tMax = Infinity;
  if (dx === 0) {
    if (ox < rect.x || ox > rect.x + rect.w) return Infinity;
  } else {
    let t1 = (rect.x - ox) / dx;
    let t2 = (rect.x + rect.w - ox) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return Infinity;
  }
  if (dy === 0) {
    if (oy < rect.y || oy > rect.y + rect.h) return Infinity;
  } else {
    let t1 = (rect.y - oy) / dy;
    let t2 = (rect.y + rect.h - oy) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return Infinity;
  }
  return tMin;
}

/** Ray against one circle: the distance to the first hit, or Infinity. */
function rayCircle(ox, oy, dx, dy, circle) {
  const ocx = ox - circle.x;
  const ocy = oy - circle.y;
  const b = ocx * dx + ocy * dy;
  const c = ocx * ocx + ocy * ocy - circle.r * circle.r;
  const disc = b * b - c;
  if (disc < 0) return Infinity;
  const t = -b - Math.sqrt(disc);
  return t >= 0 ? t : Infinity;
}

export function createWorld(level) {
  const walls = [
    { x: 0, y: 0, w: FIELD.width, h: WALL },
    { x: 0, y: FIELD.height - WALL, w: FIELD.width, h: WALL },
    { x: 0, y: 0, w: WALL, h: FIELD.height },
    { x: FIELD.width - WALL, y: 0, w: WALL, h: FIELD.height },
  ];
  const obstacles = [...walls, ...level.cases];
  const pillars = level.pillars;

  function blockedByRect(x, y, radius) {
    for (const rect of obstacles) {
      const nx = Math.max(rect.x, Math.min(x, rect.x + rect.w));
      const ny = Math.max(rect.y, Math.min(y, rect.y + rect.h));
      const dx = x - nx;
      const dy = y - ny;
      if (dx * dx + dy * dy < radius * radius) return true;
    }
    return false;
  }

  function blockedByPillar(x, y, radius) {
    for (const pillar of pillars) {
      const dx = x - pillar.x;
      const dy = y - pillar.y;
      const min = radius + pillar.r;
      if (dx * dx + dy * dy < min * min) return true;
    }
    return false;
  }

  return {
    level,
    walls,
    cases: level.cases,
    pillars,
    corridor: level.corridor,
    loot: { ...level.loot },
    exit: { ...level.exit },

    /** True when a circle of `radius` at (x,y) overlaps a wall, case or pillar. */
    blocked(x, y, radius) {
      return blockedByRect(x, y, radius) || blockedByPillar(x, y, radius);
    },

    /** Move a circle by (dx,dy), sliding along obstacles axis by axis. */
    moveCircle(pos, radius, dx, dy) {
      if (dx !== 0 && !this.blocked(pos.x + dx, pos.y, radius)) pos.x += dx;
      if (dy !== 0 && !this.blocked(pos.x, pos.y + dy, radius)) pos.y += dy;
    },

    /** True when the segment (ax,ay)-(bx,by) has a clear line of sight. */
    lineOfSight(ax, ay, bx, by) {
      for (const rect of obstacles) {
        if (segmentHitsRect(ax, ay, bx, by, rect)) return false;
      }
      for (const pillar of pillars) {
        if (segmentHitsCircle(ax, ay, bx, by, pillar)) return false;
      }
      return true;
    },

    /** Distance from (ox,oy) along `angle` to the first wall/case/pillar, capped at `max`. */
    rayDistance(ox, oy, angle, max) {
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      let best = max;
      for (const rect of obstacles) {
        const t = rayRect(ox, oy, dx, dy, rect);
        if (t < best) best = t;
      }
      for (const pillar of pillars) {
        const t = rayCircle(ox, oy, dx, dy, pillar);
        if (t < best) best = t;
      }
      return best;
    },

    /** True when (x,y) is inside the dark side corridor (shadow: slower alarm fill). */
    inShadow(x, y) {
      const c = level.corridor;
      return x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h;
    },
  };
}
