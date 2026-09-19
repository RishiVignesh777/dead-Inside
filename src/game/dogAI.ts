import { Dog, Player, Platform, SteamJet, Box2D, Vector2D } from '../types';
import { checkAABB, hasClearLineOfSight, GRAVITY, TERMINAL_VELOCITY, DOG_CHASE_SPEED } from './physics';
import { soundEngine } from '../audio/soundEngine';

export function updateDogAI(
  dog: Dog,
  player: Player,
  platforms: Platform[],
  steamJets: SteamJet[],
  hidingSpots: Box2D[],
  dt: number
): { caughtPlayer: boolean } {
  let caughtPlayer = false;

  // Gravity
  dog.vy = Math.min(TERMINAL_VELOCITY, dog.vy + GRAVITY);
  dog.y += dog.vy;

  // Platform collision
  for (const plat of platforms) {
    if (plat.type === 'solid' || plat.type === 'metal_grate') {
      if (checkAABB(dog, plat)) {
        if (dog.vy > 0 && dog.y + dog.h - dog.vy <= plat.y + 6) {
          dog.y = plat.y - dog.h;
          dog.vy = 0;
        } else if (plat.type === 'solid') {
          // Wall bump: reverse patrol direction if patrolling
          if (dog.state === 'patrol') {
            dog.patrolDir = (dog.patrolDir * -1) as 1 | -1;
            dog.facing = dog.patrolDir;
          }
          dog.vx = 0;
        }
      }
    }
  }

  // Check if inside active steam jet (blinds and disorients the dog!)
  for (const jet of steamJets) {
    if (jet.active && jet.blindDogs) {
      const jetEndX = jet.x + jet.dx * jet.length;
      const jetEndY = jet.y + jet.dy * jet.length;
      const minX = Math.min(jet.x, jetEndX) - jet.spread;
      const maxX = Math.max(jet.x, jetEndX) + jet.spread;
      const minY = Math.min(jet.y, jetEndY) - jet.spread;
      const maxY = Math.max(jet.y, jetEndY) + jet.spread;

      const dogCenter = { x: dog.x + dog.w / 2, y: dog.y + dog.h / 2 };
      if (dogCenter.x >= minX && dogCenter.x <= maxX && dogCenter.y >= minY && dogCenter.y <= maxY) {
        if (dog.state !== 'blinded') {
          dog.state = 'blinded';
          dog.blindedTimer = 180; // ~3 seconds at 60fps
          dog.eyeColor = 'amber';
          dog.eyeIntensity = 0.3;
          soundEngine.playDogAlert();
        }
      }
    }
  }

  // Timers
  if (dog.barkCooldown > 0) dog.barkCooldown--;
  if (dog.animTimer !== undefined) dog.animTimer += Math.abs(dog.vx) * 0.12 + 0.05;

  // Blinded state
  if (dog.state === 'blinded') {
    dog.vx *= 0.8;
    dog.x += dog.vx;
    dog.blindedTimer--;
    dog.eyeIntensity = 0.2 + Math.sin(Date.now() * 0.02) * 0.15;
    if (dog.blindedTimer <= 0) {
      dog.state = 'search';
      dog.searchTimer = 120;
    }
    return { caughtPlayer: false };
  }

  // Sensory Perception (Vision & Hearing)
  const dogEyePos: Vector2D = {
    x: dog.facing === 1 ? dog.x + dog.w - 4 : dog.x + 4,
    y: dog.y + 14,
  };
  const playerCenter: Vector2D = {
    x: player.x + player.w / 2,
    y: player.y + player.h / 2,
  };

  const dxToPlayer = playerCenter.x - dogEyePos.x;
  const dyToPlayer = playerCenter.y - dogEyePos.y;
  const distToPlayer = Math.hypot(dxToPlayer, dyToPlayer);

  // Is player in dark hiding spot?
  let isHiddenInShadow = false;
  if (player.isCrouching) {
    for (const spot of hidingSpots) {
      if (checkAABB(player, spot)) {
        isHiddenInShadow = true;
        break;
      }
    }
  }

  // Vision cone check
  const facingDir = dog.facing;
  const isFacingPlayer = (dxToPlayer > 0 && facingDir === 1) || (dxToPlayer < 0 && facingDir === -1);
  const angleToPlayer = Math.atan2(dyToPlayer, Math.abs(dxToPlayer)); // elevation
  const withinFov = isFacingPlayer && Math.abs(angleToPlayer) < 0.85; // ~50 deg vertical cone

  let maxVisionDist = 320;
  if (isHiddenInShadow) {
    maxVisionDist = 55; // Extremely difficult to spot when crouching in shadows/steam
  } else if (player.isCrouching) {
    maxVisionDist = 160; // Low profile reduces sight distance
  }

  const hasLoS = hasClearLineOfSight(dogEyePos, playerCenter, platforms, steamJets);
  dog.hasLineOfSight = hasLoS;

  const canSeePlayer =
    !player.isDead &&
    withinFov &&
    distToPlayer <= maxVisionDist &&
    hasLoS;

  // Hearing check: can hear running, jumping, landing
  const hearingRadius = 260 * player.noiseLevel;
  const canHearPlayer = !player.isDead && distToPlayer <= hearingRadius;

  // Dog State Machine
  switch (dog.state) {
    case 'patrol': {
      dog.eyeColor = 'amber';
      dog.eyeIntensity = 0.55;
      dog.targetX = dog.x + dog.patrolDir * 40;

      // Patrol speed
      dog.vx = dog.patrolDir * 1.8;
      dog.facing = dog.patrolDir;

      // Check bounds
      if (dog.patrolDir === 1 && dog.x >= dog.patrolMaxX) {
        dog.patrolDir = -1;
      } else if (dog.patrolDir === -1 && dog.x <= dog.patrolMinX) {
        dog.patrolDir = 1;
      }

      if (canSeePlayer) {
        dog.state = 'alert';
        dog.alertTimer = 25; // momentary reaction wind-up like INSIDE
        dog.eyeColor = 'crimson';
        dog.eyeIntensity = 1.0;
        soundEngine.playDogAlert();
      } else if (canHearPlayer && player.noiseLevel > 0.35) {
        dog.state = 'investigate';
        dog.targetX = playerCenter.x;
        dog.facing = dxToPlayer > 0 ? 1 : -1;
        soundEngine.playDogAlert();
      }
      break;
    }

    case 'investigate': {
      dog.eyeColor = 'amber';
      dog.eyeIntensity = 0.85;
      dog.vx *= 0.8; // pause to listen and scan

      if (canSeePlayer) {
        dog.state = 'alert';
        dog.alertTimer = 18;
        dog.eyeColor = 'crimson';
        dog.eyeIntensity = 1.0;
        soundEngine.playDogAlert();
      } else {
        // Look toward sound
        dog.facing = dog.targetX > dog.x ? 1 : -1;
        // If nothing seen for 80 frames, return to patrol
        if (!dog.searchTimer) dog.searchTimer = 90;
        dog.searchTimer--;
        if (dog.searchTimer <= 0) {
          dog.state = 'patrol';
        }
      }
      break;
    }

    case 'alert': {
      // Freezes for a beat, eyes narrow, tense brass snarl, then full sprint!
      dog.vx *= 0.5;
      dog.eyeColor = 'crimson';
      dog.eyeIntensity = 1.0;
      dog.facing = dxToPlayer > 0 ? 1 : -1;
      dog.alertTimer--;

      if (dog.alertTimer <= 0) {
        dog.state = 'chase';
        if (dog.barkCooldown <= 0) {
          soundEngine.playDogBark();
          dog.barkCooldown = 90;
        }
      }
      break;
    }

    case 'chase': {
      dog.eyeColor = 'crimson';
      dog.eyeIntensity = 1.0;

      // Sprint velocity (fast, relentless!)
      const chaseDir = dxToPlayer > 0 ? 1 : -1;
      dog.facing = chaseDir;
      dog.vx = chaseDir * DOG_CHASE_SPEED;

      // Jump over small obstacles or towards player if player is elevated
      if (Math.abs(dxToPlayer) < 140 && dyToPlayer < -30 && dog.vy === 0) {
        dog.vy = -7.2; // ferocious leap
      }

      // Bark intermittently
      if (dog.barkCooldown <= 0) {
        soundEngine.playDogBark();
        dog.barkCooldown = 75 + Math.floor(Math.random() * 40);
      }

      // If player managed to hide or break line of sight
      if (!canSeePlayer && distToPlayer > 180) {
        dog.state = 'search';
        dog.searchTimer = 160;
        dog.targetX = playerCenter.x;
      }
      break;
    }

    case 'search': {
      dog.eyeColor = 'amber';
      dog.eyeIntensity = 0.7;
      dog.searchTimer--;

      // Move toward last known target
      const toTarget = dog.targetX - dog.x;
      if (Math.abs(toTarget) > 15) {
        dog.facing = toTarget > 0 ? 1 : -1;
        dog.vx = dog.facing * 1.6;
      } else {
        dog.vx *= 0.8;
      }

      if (canSeePlayer) {
        dog.state = 'alert';
        dog.alertTimer = 20;
        dog.eyeColor = 'crimson';
        soundEngine.playDogAlert();
      } else if (dog.searchTimer <= 0) {
        dog.state = 'patrol';
      }
      break;
    }
  }

  dog.x += dog.vx;

  // Check capture collision with boy (if hound pounces boy)
  const catchHitbox: Box2D = {
    x: dog.x + 4,
    y: dog.y + 4,
    w: dog.w - 8,
    h: dog.h - 8,
  };

  if (!player.isDead && checkAABB(catchHitbox, player)) {
    caughtPlayer = true;
    soundEngine.playCaptureSting();
  }

  return { caughtPlayer };
}
