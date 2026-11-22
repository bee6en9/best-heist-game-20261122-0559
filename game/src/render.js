// Canvas drawing: the night gallery, the cones (raycast so cases and pillars cut them),
// the glowing loot, the thief, and the HUD — alarm meter, lives, tools, level, timer.
// The playfield is a fixed 1280x720 logical area scaled to the window.

import { FIELD, PALETTE, FONT, ALARM, PLAYER } from './config.js';
import { WALL } from './world.js';
import { GUARD } from './config.js';
import { CAMERA } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';
export const SCREEN_LEVEL = 'level';

/** How many rays shape one vision cone: enough to bend around a case. */
const CONE_RAYS = 26;

function conePolygon(world, ox, oy, angle, halfAngle, range) {
  const points = [{ x: ox, y: oy }];
  for (let i = 0; i <= CONE_RAYS; i += 1) {
    const a = angle - halfAngle + (2 * halfAngle * i) / CONE_RAYS;
    const dist = world.rayDistance(ox, oy, a, range);
    points.push({ x: ox + Math.cos(a) * dist, y: oy + Math.sin(a) * dist });
  }
  return points;
}

function drawCone(ctx, world, ox, oy, angle, halfAngle, range, fill, edge) {
  const points = conePolygon(world, ox, oy, angle, halfAngle, range);
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth || FIELD.width;
    const h = canvas.clientHeight || FIELD.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  resize();
  window.addEventListener('resize', resize);

  function drawFloor(state) {
    const { world } = state;
    ctx.fillStyle = PALETTE.floor;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    // Checkerboard tiles, subtly darker in the side corridor.
    const tile = 64;
    for (let y = 0; y < FIELD.height / tile; y += 1) {
      for (let x = 0; x < FIELD.width / tile; x += 1) {
        if ((x + y) % 2 === 0) {
          ctx.fillStyle = PALETTE.floorTile;
          ctx.fillRect(x * tile, y * tile, tile, tile);
        }
      }
    }
    const c = world.corridor;
    ctx.fillStyle = PALETTE.floorDark;
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(c.x, c.y, c.w, c.h);
    // Velvet rope line down the main floor.
    ctx.strokeStyle = PALETTE.rope;
    ctx.lineWidth = 4;
    ctx.setLineDash([18, 10]);
    ctx.beginPath();
    ctx.moveTo(200, 110);
    ctx.lineTo(200, 610);
    ctx.moveTo(1080, 110);
    ctx.lineTo(1080, 610);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = PALETTE.ropePost;
    for (const y of [110, 240, 360, 480, 610]) {
      for (const x of [200, 1080]) {
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Walls.
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(0, 0, FIELD.width, WALL);
    ctx.fillRect(0, FIELD.height - WALL, FIELD.width, WALL);
    ctx.fillRect(0, 0, WALL, FIELD.height);
    ctx.fillRect(FIELD.width - WALL, 0, WALL, FIELD.height);
    ctx.fillStyle = PALETTE.wallTop;
    ctx.fillRect(0, 0, FIELD.width, 6);
    ctx.fillRect(0, FIELD.height - 6, FIELD.width, 6);
    ctx.fillRect(0, 0, 6, FIELD.height);
    ctx.fillRect(FIELD.width - 6, 0, 6, FIELD.height);
  }

  function drawCases(state) {
    const { world } = state;
    for (const rect of world.cases) {
      ctx.fillStyle = PALETTE.caseFrame;
      roundRect(ctx, rect.x - 3, rect.y - 3, rect.w + 6, rect.h + 6, 8);
      ctx.fill();
      ctx.fillStyle = PALETTE.caseGlass;
      roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 6);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      roundRect(ctx, rect.x + 6, rect.y + 6, rect.w - 12, 14, 5);
      ctx.fill();
      // A small exhibit inside the glass.
      ctx.fillStyle = '#8fa3c8';
      ctx.beginPath();
      ctx.arc(rect.x + rect.w / 2, rect.y + rect.h / 2 + 6, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c9a227';
      ctx.fillRect(rect.x + rect.w / 2 - 2, rect.y + rect.h / 2 - 16, 4, 12);
    }
    for (const pillar of world.pillars) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.arc(pillar.x + 4, pillar.y + 5, pillar.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.pillar;
      ctx.beginPath();
      ctx.arc(pillar.x, pillar.y, pillar.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.pillarTop;
      ctx.beginPath();
      ctx.arc(pillar.x, pillar.y, pillar.r - 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawExit(state) {
    const { world, loot } = state;
    const e = world.exit;
    const open = loot.grabbed;
    const glow = 0.35 + 0.2 * Math.sin(performance.now() / 300);
    ctx.fillStyle = open ? `rgba(57,217,138,${glow})` : 'rgba(57,217,138,0.10)';
    ctx.fillRect(e.x - 10, e.y - 10, e.w + 20, e.h + 20);
    ctx.fillStyle = open ? PALETTE.exit : '#2c5a44';
    roundRect(ctx, e.x, e.y, e.w, e.h, 6);
    ctx.fill();
    ctx.fillStyle = '#0a0e1a';
    ctx.font = `bold 13px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(open ? 'EXIT' : 'LOCKED', e.x + e.w / 2, e.y + e.h / 2);
    if (!open) {
      ctx.strokeStyle = 'rgba(238,241,245,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(e.x + e.w / 2, e.y + e.h / 2 - 0, 8, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawLoot(state) {
    const { loot } = state;
    if (loot.grabbed) return;
    const pulse = 0.5 + 0.5 * Math.sin(loot.pulse * 4);
    const glowR = 70 + pulse * 26;
    const grad = ctx.createRadialGradient(loot.x, loot.y, 6, loot.x, loot.y, glowR);
    grad.addColorStop(0, PALETTE.lootGlow);
    grad.addColorStop(1, 'rgba(255,213,74,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(loot.x, loot.y, glowR, 0, Math.PI * 2);
    ctx.fill();
    // Pedestal.
    ctx.fillStyle = '#3a435e';
    ctx.beginPath();
    ctx.ellipse(loot.x, loot.y + 16, 30, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4a5578';
    ctx.fillRect(loot.x - 22, loot.y + 4, 44, 14);
    // The golden idol.
    ctx.fillStyle = PALETTE.loot;
    ctx.beginPath();
    ctx.moveTo(loot.x, loot.y - 22);
    ctx.lineTo(loot.x + 11, loot.y - 2);
    ctx.lineTo(loot.x + 5, loot.y + 8);
    ctx.lineTo(loot.x - 5, loot.y + 8);
    ctx.lineTo(loot.x - 11, loot.y - 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.arc(loot.x - 3, loot.y - 10, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7a5c00';
    ctx.font = `bold 10px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('IDOL', loot.x, loot.y + 34);
  }

  function drawGuards(state) {
    const { guards, world } = state;
    for (const guard of guards.guards) {
      const alerted = guard.state === 'alerted';
      drawCone(ctx, world, guard.x, guard.y, guard.coneAngle, GUARD.sightHalfAngle, GUARD.sightRange,
        alerted ? 'rgba(255,120,40,0.40)' : PALETTE.guardCone,
        alerted ? 'rgba(255,120,40,0.9)' : PALETTE.guardConeEdge);
    }
    for (const guard of guards.guards) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.arc(guard.x + 3, guard.y + 4, GUARD.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = guard.state === 'alerted' ? '#c0392b' : '#2c3e50';
      ctx.beginPath();
      ctx.arc(guard.x, guard.y, GUARD.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#dfe6f2';
      ctx.beginPath();
      ctx.arc(guard.x, guard.y - 3, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2c3e50';
      ctx.beginPath();
      ctx.arc(guard.x - Math.cos(guard.angle) * 4, guard.y - Math.sin(guard.angle) * 4 - 3, 9, 0, Math.PI);
      ctx.fill();
      // State mark: "?" suspicious, "!" alerted.
      if (guard.state !== 'patrol') {
        ctx.fillStyle = guard.state === 'alerted' ? '#ff6b4a' : '#ffd54a';
        ctx.font = `bold 22px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(guard.state === 'alerted' ? '!' : '?', guard.x, guard.y - GUARD.radius - 4);
      }
    }
  }

  function drawCameras(state) {
    const { cameras, world } = state;
    for (const camera of cameras.cameras) {
      if (camera.jammed > 0) {
        drawCone(ctx, world, camera.x, camera.y, camera.angle, CAMERA.sightHalfAngle, CAMERA.sightRange,
          'rgba(150,160,180,0.18)', 'rgba(150,160,180,0.6)');
      } else {
        drawCone(ctx, world, camera.x, camera.y, camera.angle, CAMERA.sightHalfAngle, CAMERA.sightRange,
          PALETTE.cameraCone, PALETTE.cameraConeEdge);
      }
    }
    for (const camera of cameras.cameras) {
      ctx.fillStyle = '#1a1d26';
      ctx.beginPath();
      ctx.arc(camera.x, camera.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = camera.jammed > 0 ? '#8b93a3' : '#ff4040';
      ctx.beginPath();
      ctx.arc(camera.x, camera.y, 4, 0, Math.PI * 2);
      ctx.fill();
      // Little wall mount.
      ctx.strokeStyle = '#5a6b8a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(camera.x, camera.y);
      ctx.lineTo(camera.x + Math.cos(camera.angle + Math.PI) * 8, camera.y + Math.sin(camera.angle + Math.PI) * 8);
      ctx.stroke();
      if (camera.jammed > 0) {
        ctx.fillStyle = '#eef1f5';
        ctx.font = `bold 11px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.fillText('JAMMED', camera.x, camera.y - 16);
      }
    }
  }

  function drawPlayer(state) {
    const { player } = state;
    if (player.smoke.active) {
      const grad = ctx.createRadialGradient(player.smoke.x, player.smoke.y, 10, player.smoke.x, player.smoke.y, player.smoke.radius);
      grad.addColorStop(0, PALETTE.smoke);
      grad.addColorStop(1, 'rgba(190,200,220,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(player.smoke.x, player.smoke.y, player.smoke.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.arc(player.x + 3, player.y + 4, PLAYER.radius, 0, Math.PI * 2);
    ctx.fill();
    // The thief: a small dark figure with a pale scarf trailing behind and a pale
    // face mask showing which way they face.
    ctx.fillStyle = PALETTE.player;
    ctx.beginPath();
    ctx.arc(player.x, player.y, PLAYER.radius, 0, Math.PI * 2);
    ctx.fill();
    // Scarf: a pale arc across the back half.
    ctx.strokeStyle = PALETTE.scarf;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(player.x, player.y, PLAYER.radius - 3, player.facing + Math.PI - 0.9, player.facing + Math.PI + 0.9);
    ctx.stroke();
    // Face mask: a small pale dot at the front edge.
    ctx.fillStyle = PALETTE.scarf;
    ctx.beginPath();
    ctx.arc(player.x + Math.cos(player.facing) * (PLAYER.radius - 5), player.y + Math.sin(player.facing) * (PLAYER.radius - 5), 3.5, 0, Math.PI * 2);
    ctx.fill();
    if (player.sneaking) {
      ctx.fillStyle = '#8b93a3';
      ctx.font = `bold 11px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('SNEAK', player.x, player.y - PLAYER.radius - 6);
    }
    // Grab progress ring while grabbing the idol.
    if (player.grabbing) {
      const frac = player.grabProgress / PLAYER.grabTime;
      ctx.strokeStyle = 'rgba(238,241,245,0.35)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(player.x, player.y, PLAYER.radius + 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = PALETTE.loot;
      ctx.beginPath();
      ctx.arc(player.x, player.y, PLAYER.radius + 10, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = PALETTE.loot;
      ctx.font = `bold 12px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('GRABBING…', player.x, player.y - PLAYER.radius - 16);
    }
  }

  function drawHud(state) {
    const { alarm, player, levelIndex, elapsed, loot } = state;
    // Top bar.
    ctx.fillStyle = 'rgba(5,8,16,0.82)';
    ctx.fillRect(0, 0, FIELD.width, 52);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 20px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('MIDNIGHT VAULT', 20, 27);
    ctx.font = `13px ${FONT}`;
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText(`LEVEL ${levelIndex + 1}/3`, 250, 27);
    // Timer.
    const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const ss = String(Math.floor(elapsed % 60)).padStart(2, '0');
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 16px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(`${mm}:${ss}`, 640, 27);
    // Lives.
    ctx.textAlign = 'left';
    ctx.font = `bold 16px ${FONT}`;
    ctx.fillText('♥'.repeat(Math.max(0, player.lives)) + '♡'.repeat(Math.max(0, 3 - player.lives)), 700, 27);
    // Tools.
    ctx.font = `13px ${FONT}`;
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText(`SMOKE ${player.smokeLeft}× [Space]   JAM ${player.jamLeft}× [J]`, 790, 27);
    // Loot status.
    ctx.fillStyle = loot.grabbed ? PALETTE.loot : PALETTE.muted;
    ctx.font = `bold 13px ${FONT}`;
    ctx.textAlign = 'right';
    ctx.fillText(loot.grabbed ? '★ IDOL SECURED — RUN!' : '○ IDOL NOT TAKEN', 1260, 27);

    // Alarm meter: the big red bar under the top bar.
    const barX = 20;
    const barY = 62;
    const barW = 420;
    const barH = 18;
    const flash = alarm.warning && Math.floor(performance.now() / 250) % 2 === 0;
    ctx.fillStyle = PALETTE.alarmTrack;
    roundRect(ctx, barX, barY, barW, barH, 9);
    ctx.fill();
    const frac = alarm.value / 100;
    ctx.fillStyle = flash ? '#ff8a80' : PALETTE.alarm;
    if (frac > 0) {
      roundRect(ctx, barX, barY, Math.max(18, barW * frac), barH, 9);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(238,241,245,0.5)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, barX, barY, barW, barH, 9);
    ctx.stroke();
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 13px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(`ALARM ${Math.round(alarm.value)}%`, barX + barW + 12, barY + barH / 2);
    if (alarm.lockdown) {
      ctx.fillStyle = '#ff5252';
      ctx.font = `bold 16px ${FONT}`;
      ctx.fillText(`LOCKDOWN — ${Math.ceil(alarm.lockdownTimeLeft)}s TO ESCAPE!`, barX + barW + 150, barY + barH / 2);
    } else if (alarm.warning) {
      ctx.fillStyle = '#ffb74d';
      ctx.font = `bold 13px ${FONT}`;
      ctx.fillText('WARNING — STAY OUT OF SIGHT', barX + barW + 150, barY + barH / 2);
    }
    // "Press E" hint when in grab range (not while already grabbing).
    if (!loot.grabbed && !player.grabbing && state.loot.inRange(player)) {
      ctx.fillStyle = PALETTE.loot;
      ctx.font = `bold 15px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('Press E to grab the idol (2s — you are exposed!)', 640, 100);
    }
  }

  function drawOverlay(title, lines, accent) {
    ctx.fillStyle = 'rgba(5,8,16,0.78)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = accent || PALETTE.loot;
    ctx.font = `bold 54px ${FONT}`;
    ctx.fillText(title, 640, 240);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `20px ${FONT}`;
    lines.forEach((line, i) => ctx.fillText(line, 640, 320 + i * 34));
  }

  return {
    draw(state, screen, best) {
      const scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      drawFloor(state);
      drawCases(state);
      drawExit(state);
      drawLoot(state);
      drawGuards(state);
      drawCameras(state);
      drawPlayer(state);
      drawHud(state);

      if (screen === SCREEN_TITLE) {
        drawOverlay('MIDNIGHT VAULT', [
          'A museum heist. Cross the gallery, dodge the guards',
          'and the sweeping cameras, grab the golden idol,',
          'and reach the green exit before the alarm fills.',
          '',
          'WASD / arrows — move    Shift — sneak    E — grab the idol',
          'Space — smoke bomb (2×)    J — jam cameras (1×)',
          'P — pause    R — restart    M — mute',
          '',
          'Press Enter to begin the heist.',
        ]);
        ctx.fillStyle = PALETTE.muted;
        ctx.font = `14px ${FONT}`;
        ctx.fillText(`Best loot value: $${best.toLocaleString()}`, 640, 648);
      } else if (screen === SCREEN_PAUSED) {
        drawOverlay('PAUSED', ['Press P or Enter to keep stealing.'], PALETTE.text);
      } else if (screen === SCREEN_OVER) {
        drawOverlay('CAUGHT!', [
          `The guards got you. Loot value so far: $${state.lootValue.toLocaleString()}.`,
          '',
          'Press Enter to try the gallery again.',
        ], '#ff6b4a');
      } else if (screen === SCREEN_LEVEL) {
        drawOverlay(`GALLERY ${state.levelIndex + 1} CLEARED`, [
          `Idol secured: $${state.levelValue.toLocaleString()}. Total: $${state.lootValue.toLocaleString()}.`,
          '',
          'Press Enter for the next gallery.',
        ]);
      } else if (screen === SCREEN_WIN) {
        drawOverlay('THE PERFECT HEIST', [
          `All three idols stolen. Total loot: $${state.lootValue.toLocaleString()}.`,
          `Time: ${Math.floor(state.elapsed / 60)}:${String(Math.floor(state.elapsed % 60)).padStart(2, '0')} — the museum never saw you coming.`,
          '',
          'Press Enter to play again.',
        ]);
      }
    },
  };
}
