import { Box2D, Player, Platform, PushableBox, SteamJet, Vector2D } from '../types';

export const GRAVITY = 0.55;
export const TERMINAL_VELOCITY = 14;

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

// Update pushable physics and player pushing
export function updatePushables(
  pushables: PushableBox[],
  player: Player,
  platforms: Platform[],
  isGrabbing: boolean
) {
  for (const box of pushables) {
    // Gravity
    box.vy = Math.min(TERMINAL_VELOCITY, box.vy + GRAVITY);
    box.y += box.vy;

    // Platform ground collision
    for (const plat of platforms) {
      if (plat.type === 'solid' || plat.type === 'metal_grate') {
        if (checkAABB(box, plat)) {
          if (box.vy > 0 && box.y + box.h - box.vy <= plat.y + 4) {
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
    box.x += box.vx;

    // Interaction with player: push or pull
    const isAdjacent =
      Math.abs(player.y + player.h / 2 - (box.y + box.h / 2)) < box.h &&
      Math.abs(player.x + player.w / 2 - (box.x + box.w / 2)) < (player.w + box.w) / 2 + 10;

    if (isAdjacent && isGrabbing) {
      player.grabbedBoxId = box.id;
      // When grabbing, boy pulls or pushes the crate along
      if (Math.abs(player.vx) > 0.1) {
        box.vx = player.vx * 0.75;
      }
    } else if (player.grabbedBoxId === box.id && !isGrabbing) {
      player.grabbedBoxId = null;
    } else if (!isGrabbing && checkAABB(player, box)) {
      // Passive pushing into crate
      if (player.x + player.w / 2 < box.x + box.w / 2 && player.vx > 0) {
        box.vx = Math.min(2.2, player.vx * 0.8);
        player.x = box.x - player.w;
      } else if (player.x + player.w / 2 > box.x + box.w / 2 && player.vx < 0) {
        box.vx = Math.max(-2.2, player.vx * 0.8);
        player.x = box.x + box.w;
      }
    }
  }
}
