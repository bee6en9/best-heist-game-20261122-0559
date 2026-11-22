// Every tuning number, colour and level layout in one place. The gallery is a fixed
// 1280x720 logical area; the renderer scales it to the window, so no rule below depends
// on the screen size. Top-down museum at night: deep blue floor, gold loot, yellow guard
// cones, red camera cones, green getaway door.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

export const PLAYER = {
  radius: 13,
  walkSpeed: 205,
  sneakSpeed: 105,
  /** Detection range multiplier while sneaking: a sneaking thief is harder to spot. */
  sneakVisibility: 0.62,
  grabTime: 2.0,
  grabRadius: 58,
};

export const LIVES = 3;

export const GUARD = {
  radius: 14,
  patrolSpeed: 78,
  chaseSpeed: 165,
  /** How far a guard can see, in pixels. */
  sightRange: 250,
  /** Half-angle of the vision cone, in radians. */
  sightHalfAngle: 0.52,
  /** Seconds of continuous sight before a guard goes from suspicious to alerted. */
  suspicionTime: 0.9,
  /** Seconds after losing sight before a guard calms back to patrol. */
  calmTime: 3.0,
  catchRadius: 26,
};

export const CAMERA = {
  /** How far a camera can see, in pixels. */
  sightRange: 300,
  sightHalfAngle: 0.38,
  /** Radians per second of the sweep. */
  sweepSpeed: 0.55,
};

export const ALARM = {
  /** Alarm % gained per second while a guard cone sees the thief. */
  guardRate: 26,
  /** Alarm % gained per second while a camera cone sees the thief. */
  cameraRate: 42,
  /** Multiplier while the thief is grabbing the idol (exposed). */
  grabMultiplier: 1.6,
  /** Multiplier while the thief is in the dark side corridor (shadow). */
  shadowMultiplier: 0.45,
  /** Alarm % drained per second while nobody sees the thief. */
  drainRate: 9,
  /** The meter flashes a warning at and above this %. */
  warnAt: 75,
  /** Seconds of lockdown escape time once the meter hits 100%. */
  lockdownSeconds: 10,
};

export const TOOLS = {
  smokePerLevel: 2,
  smokeSeconds: 4,
  smokeRadius: 110,
  jamPerLevel: 1,
  jamSeconds: 5,
};

export const PALETTE = {
  backdrop: '#0a0e1a',
  floor: '#141a2e',
  floorTile: '#182036',
  floorDark: '#0e1424',
  rope: '#7a1f2b',
  ropePost: '#c9a227',
  wall: '#232c47',
  wallTop: '#2e3a5c',
  caseGlass: '#3d5a80',
  caseFrame: '#5a6b8a',
  pillar: '#1c2438',
  pillarTop: '#2a3552',
  guardCone: 'rgba(255, 196, 66, 0.34)',
  guardConeEdge: 'rgba(255, 196, 66, 0.85)',
  cameraCone: 'rgba(255, 64, 64, 0.30)',
  cameraConeEdge: 'rgba(255, 80, 80, 0.9)',
  loot: '#ffd54a',
  lootGlow: 'rgba(255, 213, 74, 0.45)',
  exit: '#39d98a',
  exitGlow: 'rgba(57, 217, 138, 0.4)',
  player: '#1a1d26',
  scarf: '#e8e4d8',
  smoke: 'rgba(190, 200, 220, 0.55)',
  text: '#eef1f5',
  muted: '#8b93a3',
  alarm: '#ff5252',
  alarmTrack: '#2a1218',
  gold: '#c9a227',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best loot value is kept between visits (this browser only). */
export const BEST_KEY = 'midnight-vault.best';

// ---------------------------------------------------------------------------
// Levels. One gallery per level. Coordinates are in the 1280x720 field.
// Walls ring the field (thickness 26). `cases` and `pillars` block movement and
// sight. `corridor` is the dark side corridor (shadow: slower alarm fill).
// Guards patrol `waypoints`. Cameras sit on a wall point and sweep `from`..`to`
// angles (radians, 0 = east, positive = clockwise/downwards on screen).
// ---------------------------------------------------------------------------

function level1() {
  return {
    name: 'GALLERY I — THE GOLDEN IDOL',
    lootValue: 5000,
    cases: [
      { x: 300, y: 150, w: 150, h: 70 },
      { x: 830, y: 150, w: 150, h: 70 },
      { x: 300, y: 500, w: 150, h: 70 },
      { x: 830, y: 500, w: 150, h: 70 },
    ],
    pillars: [
      { x: 560, y: 130, r: 26 },
      { x: 694, y: 130, r: 26 },
      { x: 560, y: 564, r: 26 },
      { x: 694, y: 564, r: 26 },
    ],
    corridor: { x: 26, y: 26, w: 120, h: 668 },
    guards: [
      { x: 640, y: 300, waypoints: [[640, 300], [640, 430], [420, 430], [420, 300]] },
      { x: 950, y: 420, waypoints: [[950, 420], [950, 250], [1080, 250], [1080, 420]] },
    ],
    cameras: [
      { x: 640, y: 34, from: 0.35, to: Math.PI - 0.35 },
      { x: 1246, y: 360, from: Math.PI * 0.62, to: Math.PI * 1.38 },
    ],
    playerStart: { x: 90, y: 640 },
    exit: { x: 1190, y: 640, w: 64, h: 56 },
    loot: { x: 640, y: 360 },
  };
}

function level2() {
  return {
    name: 'GALLERY II — HALL OF KINGS',
    lootValue: 12000,
    cases: [
      { x: 240, y: 130, w: 140, h: 70 },
      { x: 560, y: 130, w: 160, h: 70 },
      { x: 880, y: 130, w: 140, h: 70 },
      { x: 240, y: 520, w: 140, h: 70 },
      { x: 560, y: 520, w: 160, h: 70 },
      { x: 880, y: 520, w: 140, h: 70 },
    ],
    pillars: [
      { x: 420, y: 360, r: 24 },
      { x: 860, y: 360, r: 24 },
      { x: 640, y: 130, r: 22 },
      { x: 640, y: 590, r: 22 },
    ],
    corridor: { x: 26, y: 26, w: 110, h: 668 },
    guards: [
      { x: 480, y: 300, waypoints: [[480, 300], [480, 450], [800, 450], [800, 300]] },
      { x: 1000, y: 300, waypoints: [[1000, 300], [1000, 500], [1150, 500], [1150, 300]] },
      { x: 320, y: 430, waypoints: [[320, 430], [320, 240], [180, 240], [180, 430]] },
    ],
    cameras: [
      { x: 640, y: 34, from: 0.3, to: Math.PI - 0.3 },
      { x: 1246, y: 200, from: Math.PI * 0.55, to: Math.PI * 1.45 },
      { x: 1246, y: 520, from: Math.PI * 0.55, to: Math.PI * 1.45 },
    ],
    playerStart: { x: 85, y: 640 },
    exit: { x: 1190, y: 640, w: 64, h: 56 },
    loot: { x: 640, y: 360 },
  };
}

function level3() {
  return {
    name: 'GALLERY III — THE VAULT',
    lootValue: 25000,
    cases: [
      { x: 220, y: 120, w: 130, h: 64 },
      { x: 520, y: 120, w: 130, h: 64 },
      { x: 830, y: 120, w: 130, h: 64 },
      { x: 220, y: 536, w: 130, h: 64 },
      { x: 520, y: 536, w: 130, h: 64 },
      { x: 830, y: 536, w: 130, h: 64 },
      { x: 1080, y: 330, w: 120, h: 64 },
    ],
    pillars: [
      { x: 380, y: 360, r: 24 },
      { x: 640, y: 220, r: 24 },
      { x: 640, y: 500, r: 24 },
      { x: 900, y: 360, r: 24 },
    ],
    corridor: { x: 26, y: 26, w: 100, h: 668 },
    guards: [
      { x: 480, y: 280, waypoints: [[480, 280], [480, 440], [760, 440], [760, 280]] },
      { x: 1020, y: 280, waypoints: [[1020, 280], [1020, 460], [1160, 460], [1160, 280]] },
      { x: 300, y: 440, waypoints: [[300, 440], [300, 220], [170, 220], [170, 440]] },
    ],
    cameras: [
      { x: 640, y: 34, from: 0.25, to: Math.PI - 0.25 },
      { x: 34, y: 360, from: -Math.PI * 0.45, to: Math.PI * 0.45 },
      { x: 1246, y: 200, from: Math.PI * 0.55, to: Math.PI * 1.45 },
      { x: 1246, y: 520, from: Math.PI * 0.55, to: Math.PI * 1.45 },
    ],
    playerStart: { x: 80, y: 640 },
    exit: { x: 1190, y: 640, w: 64, h: 56 },
    loot: { x: 640, y: 360 },
  };
}

export const LEVELS = [level1(), level2(), level3()];
