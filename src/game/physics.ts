import { Box2D, Player, Platform, PushableBox, SteamJet, Vector2D } from '../types';

export const GRAVITY = 0.55;
export const TERMINAL_VELOCITY = 14;
// Boy and Dog speeds are synchronized to be exactly equal
export const DOG_CHASE_SPEED = 4.2;
export const BOY_RUN_SPEED = 4.2;

export function checkAABB(a: Box2D, b: Box2D): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

export function pointInBox(px: number, py: number, box: Box2D): boolean {
  return px >= box.x && px <= box.x + box.w && py >= box.y && py <= box.y + box.h;
}

// Raycast from (x1,y1) to (x2,y2) against platforms and active steam clouds
export function hasClearLineOfSight(
  p1: Vector2D,
  p2: Vector2D,
  platforms: Platform[],
  steamJets: SteamJet[]
): boolean {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return true;

  const steps = Math.ceil(dist / 12);
  const stepX = dx / steps;
  const stepY = dy / steps;

  for (let i = 1; i < steps; i++) {
    const curX = p1.x + stepX * i;
    const curY = p1.y + stepY * i;

    // Check solid platforms
    for (const plat of platforms) {
      if (plat.type === 'solid') {
        if (pointInBox(curX, curY, plat)) {
          return false;
        }
      }
    }

    // Check active steam clouds (steam obscures sightlines!)
    for (const jet of steamJets) {
      if (!jet.active || !jet.blindDogs) continue;
      // Steam plume area
      const jetEndX = jet.x + jet.dx * jet.length;
      const jetEndY = jet.y + jet.dy * jet.length;
      const minX = Math.min(jet.x, jetEndX) - jet.spread;
      const maxX = Math.max(jet.x, jetEndX) + jet.spread;
      const minY = Math.min(jet.y, jetEndY) - jet.spread;
      const maxY = Math.max(jet.y, jetEndY) + jet.spread;

      if (curX >= minX && curX <= maxX && curY >= minY && curY <= maxY) {
        return false; // Blotted out by billowing steam plume
      }
    }
  }

  return true;
}

// Resolve player vs platforms
export function resolvePlayerCollisions(
  player: Player,
  platforms: Platform[],
  pushables: PushableBox[]
): { onGround: boolean; standingOn: Platform | PushableBox | null } {
  let onGround = false;
  let standingOn: Platform | PushableBox | null = null;

  // Check platforms
  for (const plat of platforms) {
    if (plat.type === 'solid' || plat.type === 'metal_grate') {
      // One-way or solid platform check
      if (checkAABB(player, plat)) {
        // Vertical resolution
        const prevY = player.y - player.vy;
        if (prevY + player.h <= plat.y + 4 && player.vy >= 0) {
          player.y = plat.y - player.h;
          player.vy = 0;
          onGround = true;
          standingOn = plat;
        } else if (plat.type === 'solid') {
          // Horizontal or ceiling collision
          if (prevY >= plat.y + plat.h - 4 && player.vy < 0) {
            player.y = plat.y + plat.h;
            player.vy = 0;
          } else {
            // Horizontal bump
            if (player.x + player.w / 2 < plat.x + plat.w / 2) {
              player.x = plat.x - player.w;
            } else {
              player.x = plat.x + plat.w;
            }
            player.vx = 0;
          }
        }
      }
    }
  }

  // Check pushable crates (player can stand on them)
  for (const box of pushables) {
    if (checkAABB(player, box)) {
      const prevY = player.y - player.vy;
      if (prevY + player.h <= box.y + 6 && player.vy >= 0) {
        player.y = box.y - player.h;
        player.vy = 0;
        onGround = true;
        standingOn = box;
      }
    }
  }

  return { onGround, standingOn };
}

// Check if player is close enough to grab a pushable box
export function findAdjacentPushable(player: Player, pushables: PushableBox[]): PushableBox | null {
  for (const box of pushables) {
    // Vertical alignment check: player must be standing alongside the box
    const vertDiff = Math.abs(player.y + player.h / 2 - (box.y + box.h / 2));
    if (vertDiff > box.h * 0.95) continue;

    // Player cannot grab while standing directly on top of the crate
    if (player.y + player.h <= box.y + 4) continue;

    // Horizontal proximity to either side of the crate
    const distToLeftEdge = Math.abs(player.x + player.w - box.x);
    const distToRightEdge = Math.abs(player.x - (box.x + box.w));

    if (distToLeftEdge < 26 || distToRightEdge < 26) {
      return box;
    }
  }
  return null;
}

// Update pushable physics and player pushing / pulling
export function updatePushables(
  pushables: PushableBox[],
  player: Player,
  platforms: Platform[]
) {
  // 1. Handle Active Grab (Boy & Crate Coupled Movement)
  if (player.grabbedBoxId) {
    const grabbedBox = pushables.find((b) => b.id === player.grabbedBoxId);
    if (!grabbedBox) {
      player.grabbedBoxId = null;
    } else {
      // Check if vertical separation is too great (e.g. falling off a precipice)
      const vertSeparation = Math.abs(player.y + player.h / 2 - (grabbedBox.y + grabbedBox.h / 2));
      if (vertSeparation > grabbedBox.h * 1.4) {
        player.grabbedBoxId = null;
      } else {
        const boyIsOnLeft = player.x + player.w / 2 < grabbedBox.x + grabbedBox.w / 2;
        // Boy always faces toward the crate he is holding
        player.facing = boyIsOnLeft ? 1 : -1;

        // Apply crate gravity & ground support
        grabbedBox.vy = Math.min(TERMINAL_VELOCITY, grabbedBox.vy + GRAVITY);
        grabbedBox.y += grabbedBox.vy;

        for (const plat of platforms) {
          if (plat.type === 'solid' || plat.type === 'metal_grate') {
            if (checkAABB(grabbedBox, plat)) {
              if (grabbedBox.vy >= 0 && (grabbedBox.y + grabbedBox.h - grabbedBox.vy) <= plat.y + 6) {
                grabbedBox.y = plat.y - grabbedBox.h;
                grabbedBox.vy = 0;
              }
            }
          }
        }

        // Horizontal displacement for the coupled boy + crate pair
        const stepX = player.vx;
        if (Math.abs(stepX) > 0.0001) {
          const testPlayerX = player.x + stepX;
          const testBoxX = boyIsOnLeft ? testPlayerX + player.w : testPlayerX - grabbedBox.w;

          // Check if either the boy or the crate collides with a solid platform horizontally
          let blocked = false;
          for (const plat of platforms) {
            if (plat.type !== 'solid') continue;

            const playerBox = { x: testPlayerX, y: player.y + 2, w: player.w, h: player.h - 6 };
            const crateBox = { x: testBoxX, y: grabbedBox.y + 2, w: grabbedBox.w, h: grabbedBox.h - 6 };

            if (checkAABB(playerBox, plat) || checkAABB(crateBox, plat)) {
              blocked = true;
              break;
            }
          }

          if (!blocked) {
            player.x = testPlayerX;
            grabbedBox.x = testBoxX;
            grabbedBox.vx = stepX;
          } else {
            player.vx = 0;
            grabbedBox.vx = 0;
          }
        } else {
          // Stationary: ensure precise zero-gap contact
          grabbedBox.vx = 0;
          if (boyIsOnLeft) {
            grabbedBox.x = player.x + player.w;
          } else {
            grabbedBox.x = player.x - grabbedBox.w;
          }
        }
      }
    }
  }

  // 2. Handle Free Pushables (Gravity, friction, passive shove)
  for (const box of pushables) {
    if (box.id === player.grabbedBoxId) continue;

    // Gravity
    box.vy = Math.min(TERMINAL_VELOCITY, box.vy + GRAVITY);
    box.y += box.vy;

    // Platform ground collision
    for (const plat of platforms) {
      if (plat.type === 'solid' || plat.type === 'metal_grate') {
        if (checkAABB(box, plat)) {
          if (box.vy > 0 && box.y + box.h - box.vy <= plat.y + 6) {
            box.y = plat.y - box.h;
            box.vy = 0;
          } else if (plat.type === 'solid') {
            if (box.x + box.w / 2 < plat.x + plat.w / 2) {
              box.x = plat.x - box.w;
            } else {
              box.x = plat.x + plat.w;
            }
            box.vx = 0;
          }
        }
      }
    }

    // Horizontal friction
    box.vx *= 0.82;
    if (Math.abs(box.vx) < 0.05) box.vx = 0;
    box.x += box.vx;

    // Passive boy pushing into crate without grab key
    if (!player.grabbedBoxId && checkAABB(player, box)) {
      const isStandingOnTop = player.y + player.h <= box.y + 6;
      if (!isStandingOnTop) {
        if (player.x + player.w / 2 < box.x + box.w / 2 && player.vx > 0) {
          box.vx = Math.min(1.8, player.vx * 0.7);
          player.x = box.x - player.w;
        } else if (player.x + player.w / 2 > box.x + box.w / 2 && player.vx < 0) {
          box.vx = Math.max(-1.8, player.vx * 0.7);
          player.x = box.x + box.w;
        }
      }
    }
  }
}
