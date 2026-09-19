import React, { useEffect, useRef, useState } from 'react';
import {
  Dog,
  GameSettings,
  HangingChain,
  LevelData,
  Lever,
  MovingPlatform,
  Particle,
  Platform,
  Player,
  PressurePlate,
  PushableBox,
  SteamJet,
  SteamValve,
} from '../types';
import { soundEngine } from '../audio/soundEngine';
import { checkAABB, pointInBox, resolvePlayerCollisions, updatePushables, findAdjacentPushable, GRAVITY, TERMINAL_VELOCITY } from '../game/physics';
import { updateDogAI } from '../game/dogAI';
import { InsideRenderer } from '../game/renderer';
import { LEVELS } from '../game/levels';

interface GameCanvasProps {
  currentChapterId: number;
  onChapterComplete: (nextChapterId: number) => void;
  onPlayerCaught: () => void;
  onCheckpointReached: (checkpointIndex: number) => void;
  settings: GameSettings;
  isPaused: boolean;
  onInteractPromptChange: (prompt: string | null) => void;
  onStealthStateChange: (noiseLevel: number, isHidden: boolean, dogAlerted: boolean) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  currentChapterId,
  onChapterComplete,
  onPlayerCaught,
  onCheckpointReached,
  settings,
  isPaused,
  onInteractPromptChange,
  onStealthStateChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<InsideRenderer | null>(null);

  // Input states
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const mobileInputRef = useRef<{
    left: boolean;
    right: boolean;
    jump: boolean;
    crouch: boolean;
    interact: boolean;
  }>({ left: false, right: false, jump: false, crouch: false, interact: false });

  // Game state refs
  const currentLevelRef = useRef<LevelData>(LEVELS[0]);
  const playerRef = useRef<Player>({
    x: 100,
    y: 350,
    vx: 0,
    vy: 0,
    w: 22,
    h: 46,
    facing: 1,
    isGrounded: false,
    isCrouching: false,
    isRunning: false,
    isClimbing: false,
    climbTargetId: null,
    grabbedBoxId: null,
    animTimer: 0,
    isDead: false,
    deathTimer: 0,
    noiseLevel: 0,
    headTurnAngle: 0,
    breathRate: 1,
  });

  const dogsRef = useRef<Dog[]>([]);
  const pushablesRef = useRef<PushableBox[]>([]);
  const valvesRef = useRef<SteamValve[]>([]);
  const steamJetsRef = useRef<SteamJet[]>([]);
  const leversRef = useRef<Lever[]>([]);
  const movingPlatformsRef = useRef<MovingPlatform[]>([]);
  const chainsRef = useRef<HangingChain[]>([]);
  const platesRef = useRef<PressurePlate[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const lastActiveCheckpointRef = useRef<{ x: number; y: number }>({ x: 100, y: 350 });
  const animFrameIdRef = useRef<number>(0);
  const prevInteractKeyRef = useRef<boolean>(false);
  const interactPressTimeRef = useRef<number>(0);
  const dragSoundTimerRef = useRef<number>(0);

  // Initialize level
  const loadLevel = (levelId: number) => {
    const lvl = LEVELS.find((l) => l.id === levelId) || LEVELS[0];
    currentLevelRef.current = JSON.parse(JSON.stringify(lvl)); // deep clone

    // Spawn point
    lastActiveCheckpointRef.current = { ...currentLevelRef.current.spawnPoint };
    playerRef.current = {
      x: currentLevelRef.current.spawnPoint.x,
      y: currentLevelRef.current.spawnPoint.y,
      vx: 0,
      vy: 0,
      w: 22,
      h: 46,
      facing: 1,
      isGrounded: false,
      isCrouching: false,
      isRunning: false,
      isClimbing: false,
      climbTargetId: null,
      grabbedBoxId: null,
      animTimer: 0,
      isDead: false,
      deathTimer: 0,
      noiseLevel: 0,
      headTurnAngle: 0,
      breathRate: 1,
    };

    dogsRef.current = currentLevelRef.current.dogs;
    pushablesRef.current = currentLevelRef.current.pushables;
    valvesRef.current = currentLevelRef.current.valves;
    steamJetsRef.current = currentLevelRef.current.steamJets;
    leversRef.current = currentLevelRef.current.levers;
    movingPlatformsRef.current = currentLevelRef.current.movingPlatforms;
    chainsRef.current = currentLevelRef.current.chains;
    platesRef.current = currentLevelRef.current.pressurePlates;
    particlesRef.current = [];
  };

  useEffect(() => {
    loadLevel(currentChapterId);
  }, [currentChapterId]);

  // Respawn at checkpoint
  const respawnAtCheckpoint = () => {
    const cp = lastActiveCheckpointRef.current;
    playerRef.current.x = cp.x;
    playerRef.current.y = cp.y;
    playerRef.current.vx = 0;
    playerRef.current.vy = 0;
    playerRef.current.isDead = false;
    playerRef.current.deathTimer = 0;
    playerRef.current.grabbedBoxId = null;
    playerRef.current.isClimbing = false;

    // Reset dog patrols in the vicinity
    for (const dog of dogsRef.current) {
      dog.state = 'patrol';
      dog.eyeColor = 'amber';
      dog.eyeIntensity = 0.6;
      dog.x = dog.patrolMinX + 20;
      dog.vx = 0;
    }

    if (rendererRef.current) {
      rendererRef.current.triggerShake(4, 8);
    }
  };

  // Setup canvas size and listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    rendererRef.current = new InsideRenderer(canvas, ctx);

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    handleResize();
    const ro = new ResizeObserver(handleResize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    // Keyboard handlers
    const onKeyDown = (e: KeyboardEvent) => {
      // First interaction unlocks Web Audio API
      soundEngine.init();

      keysRef.current[e.code] = true;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      ro.disconnect();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      cancelAnimationFrame(animFrameIdRef.current);
    };
  }, []);

  // Main Game Loop
  useEffect(() => {
    let lastStepTime = performance.now();
    let stepCycle = 0;

    const loop = (time: number) => {
      const dt = Math.min(32, time - lastStepTime);
      lastStepTime = time;

      if (!isPaused && canvasRef.current && rendererRef.current) {
        const player = playerRef.current;
        const level = currentLevelRef.current;
        const keys = keysRef.current;
        const mobile = mobileInputRef.current;

        // Death state handle
        if (player.isDead) {
          player.deathTimer++;
          if (player.deathTimer > 75) {
            respawnAtCheckpoint();
          }
        } else {
          // --- CONTROLS ---
          const moveLeft = Boolean(keys['KeyA'] || keys['ArrowLeft'] || mobile.left);
          const moveRight = Boolean(keys['KeyD'] || keys['ArrowRight'] || mobile.right);
          const jumpKey = Boolean(keys['KeyW'] || keys['ArrowUp'] || keys['Space'] || mobile.jump);
          const crouchKey = Boolean(keys['KeyS'] || keys['ArrowDown'] || keys['KeyC'] || keys['ControlLeft'] || mobile.crouch);
          const sprintKey = Boolean(keys['ShiftLeft'] || keys['ShiftRight']);
          const interactKey = Boolean(keys['KeyE'] || keys['KeyF'] || keys['Enter'] || mobile.interact);

          const justPressedInteract = interactKey && !prevInteractKeyRef.current;
          const justReleasedInteract = !interactKey && prevInteractKeyRef.current;
          if (justPressedInteract) {
            interactPressTimeRef.current = performance.now();
          }

          // 1. Grab State Machine (Initiation, Hold/Toggle, and Release)
          if (player.grabbedBoxId) {
            player.isCrouching = false;
            player.isRunning = false;

            if (justPressedInteract) {
              // Pressing E again releases the crate
              player.grabbedBoxId = null;
              soundEngine.playFootstep(false, 'metal');
            } else if (justReleasedInteract) {
              // Releasing E after a deliberate hold (> 280ms) lets go of the crate
              const holdDuration = performance.now() - interactPressTimeRef.current;
              if (holdDuration > 280) {
                player.grabbedBoxId = null;
              }
            } else if (jumpKey) {
              // Jump releases crate and leaps
              player.grabbedBoxId = null;
              player.vy = -10.6;
              player.isGrounded = false;
              soundEngine.playJump();
            } else if (crouchKey) {
              // Crouch lets go of crate
              player.grabbedBoxId = null;
            }
          } else {
            // Check if player presses or holds E to grab an adjacent crate
            if ((justPressedInteract || interactKey) && !player.isClimbing) {
              const adjacentBox = findAdjacentPushable(player, pushablesRef.current);
              if (adjacentBox) {
                player.grabbedBoxId = adjacentBox.id;
                const boyIsOnLeft = player.x + player.w / 2 < adjacentBox.x + adjacentBox.w / 2;
                player.facing = boyIsOnLeft ? 1 : -1;
                if (boyIsOnLeft) {
                  player.x = adjacentBox.x - player.w;
                } else {
                  player.x = adjacentBox.x + adjacentBox.w;
                }
                player.vx = 0;
                soundEngine.playCrateDrag();
              }
            }
          }
          prevInteractKeyRef.current = interactKey;

          // 2. Locomotion & Physics
          if (player.grabbedBoxId) {
            // Dedicated heavy dragging locomotion
            const dragSpeed = 1.7;
            const dragAccel = 0.28;

            if (moveLeft) {
              player.vx = Math.max(-dragSpeed, player.vx - dragAccel);
            } else if (moveRight) {
              player.vx = Math.min(dragSpeed, player.vx + dragAccel);
            } else {
              player.vx *= 0.55;
              if (Math.abs(player.vx) < 0.05) player.vx = 0;
            }

            // Dragging footsteps & crate scraping audio
            if (Math.abs(player.vx) > 0.1) {
              player.noiseLevel = Math.max(player.noiseLevel, 0.45);
              player.animTimer += Math.abs(player.vx) * 0.08;
              stepCycle += Math.abs(player.vx);
              if (stepCycle > 26) {
                stepCycle = 0;
                soundEngine.playFootstep(false, 'metal');
              }

              dragSoundTimerRef.current += dt;
              if (dragSoundTimerRef.current > 170) {
                dragSoundTimerRef.current = 0;
                soundEngine.playCrateDrag();
              }
            } else {
              player.noiseLevel = 0.02;
            }

            // Gravity for player
            player.vy = Math.min(TERMINAL_VELOCITY, player.vy + GRAVITY);

            // Vertical displacement for player
            player.y += player.vy;

            // Resolve player vertical collisions
            const { onGround } = resolvePlayerCollisions(player, level.platforms, pushablesRef.current);
            player.isGrounded = onGround;

            // updatePushables handles horizontal displacement of both boy and crate as a locked unit
            updatePushables(pushablesRef.current, player, level.platforms);
          } else {
            // Normal crouching / running logic
            player.isCrouching = crouchKey && player.isGrounded && !player.isClimbing;
            player.isRunning = !player.isCrouching && (sprintKey || Math.abs(player.vx) > 3.6);

            // Calculate noise emitted by boy
            if (!player.isGrounded) {
              player.noiseLevel = 0.15;
            } else if (player.isCrouching) {
              player.noiseLevel = Math.abs(player.vx) > 0.1 ? 0.06 : 0.01;
            } else if (player.isRunning) {
              player.noiseLevel = 0.75;
            } else if (Math.abs(player.vx) > 0.1) {
              player.noiseLevel = 0.3;
            } else {
              player.noiseLevel = 0.02;
            }

            // Chain Climbing Check
            let nearChain: HangingChain | null = null;
            for (const chain of chainsRef.current) {
              const chainBottomY = chain.topY + chain.length;
              if (
                Math.abs(player.x + player.w / 2 - chain.topX) < 28 &&
                player.y >= chain.topY - 20 &&
                player.y <= chainBottomY + 20
              ) {
                nearChain = chain;
                break;
              }
            }

            if (nearChain && (jumpKey || crouchKey) && !player.isGrounded) {
              player.isClimbing = true;
              player.climbTargetId = nearChain.id;
            }

            if (player.isClimbing && nearChain) {
              player.vx = 0;
              player.vy = 0;
              player.x = nearChain.topX - player.w / 2;

              if (jumpKey) {
                player.y -= 2.8;
                if (player.y < nearChain.topY) player.y = nearChain.topY;
              } else if (crouchKey) {
                player.y += 2.8;
                if (player.y > nearChain.topY + nearChain.length - 10) {
                  player.isClimbing = false;
                }
              }

              // Swing chain with left/right
              if (moveLeft) nearChain.swingVel -= 0.003;
              if (moveRight) nearChain.swingVel += 0.003;

              // Dismount leap
              if (keys['Space']) {
                player.isClimbing = false;
                player.vy = -7.5;
                player.vx = (moveRight ? 5.5 : (moveLeft ? -5.5 : 0));
                soundEngine.playJump();
              }
            } else {
              // Normal Horizontal Locomotion
              const targetSpeed = player.isCrouching ? 1.7 : (player.isRunning ? 4.8 : 3.0);
              const accel = player.isGrounded ? 0.35 : 0.18;

              if (moveLeft) {
                player.vx = Math.max(-targetSpeed, player.vx - accel);
                player.facing = -1;
              } else if (moveRight) {
                player.vx = Math.min(targetSpeed, player.vx + accel);
                player.facing = 1;
              } else {
                // Friction
                player.vx *= player.isGrounded ? 0.72 : 0.94;
              }

              // Jump
              if (jumpKey && player.isGrounded && !player.isCrouching) {
                player.vy = -10.6;
                player.isGrounded = false;
                soundEngine.playJump();
              }

              // Gravity
              player.vy = Math.min(TERMINAL_VELOCITY, player.vy + GRAVITY);
            }

            // Apply displacement
            player.x += player.vx;
            player.y += player.vy;

            // Resolve collisions with platforms & pushables
            const { onGround } = resolvePlayerCollisions(player, level.platforms, pushablesRef.current);
            const wasGrounded = player.isGrounded;
            player.isGrounded = onGround;

            // Landing audio
            if (!wasGrounded && onGround) {
              soundEngine.playLand(player.vy > 8);
            }

            // Footstep audio on walk cycle
            if (player.isGrounded && Math.abs(player.vx) > 0.4) {
              player.animTimer += Math.abs(player.vx) * 0.08;
              stepCycle += Math.abs(player.vx);
              if (stepCycle > 26) {
                stepCycle = 0;
                soundEngine.playFootstep(player.isCrouching, 'metal');
              }
            }

            // Pushable boxes physics & interaction
            updatePushables(pushablesRef.current, player, level.platforms);
          }

          // Interaction prompts & handlers
          let prompt: string | null = null;

          // 1. Check Steam Valves
          for (const valve of valvesRef.current) {
            const dist = Math.hypot(player.x + player.w / 2 - valve.x, player.y + player.h / 2 - valve.y);
            if (dist < 44) {
              prompt = valve.isOpen ? 'Valve Open' : valve.interactionPrompt;
              if (interactKey) {
                valve.rotation += 0.15;
                if (!valve.isOpen) {
                  valve.isOpen = true;
                  soundEngine.playValveTurn();
                  soundEngine.playSteamBurst(2.5);
                  rendererRef.current.triggerShake(5, 12);

                  // Activate connected steam jet
                  const targetJet = steamJetsRef.current.find((j) => j.id === valve.targetJetId);
                  if (targetJet) {
                    targetJet.active = true;
                  }
                }
              }
            }
          }

          // 2. Check Levers (Steam Whistle, etc.)
          for (const lever of leversRef.current) {
            const dist = Math.hypot(player.x + player.w / 2 - (lever.x + lever.w / 2), player.y + player.h / 2 - (lever.y + lever.h / 2));
            if (dist < 44) {
              prompt = lever.isOn ? 'Whistle Active' : 'Pull Whistle (Distract Hounds)';
              if (interactKey && !lever.isOn) {
                lever.isOn = true;
                soundEngine.playSteamWhistle();
                rendererRef.current.triggerShake(3, 8);

                // Alert target hound to investigate whistle position!
                const targetDog = dogsRef.current.find((d) => d.id === lever.connectedTargetId);
                if (targetDog) {
                  targetDog.state = 'investigate';
                  targetDog.targetX = lever.x;
                  targetDog.searchTimer = 220;
                }
              }
            }
          }

          // 3. Check Pushable Crate Grab Prompt
          const adjacentBox = findAdjacentPushable(player, pushablesRef.current);
          if (player.grabbedBoxId) {
            prompt = 'Grabbed Steam Crate — [A/D] Drag  •  [E] Let Go  •  [Space] Climb';
          } else if (adjacentBox && !prompt) {
            prompt = 'Press [E] to Grab Steam Crate';
          }

          onInteractPromptChange(prompt);

          // Moving platforms (Piston Lifts)
          for (const mp of movingPlatformsRef.current) {
            // Check if activated by pressure plate
            const linkedPlate = platesRef.current.find((p) => p.targetElevatorId === mp.id);
            if (linkedPlate && linkedPlate.isPressed) {
              mp.isActive = true;
            }

            if (mp.isActive) {
              mp.progress = Math.min(1, mp.progress + mp.speed);
              const prevY = mp.y;
              mp.y = mp.startY + (mp.endY - mp.startY) * mp.progress;
              const deltaY = mp.y - prevY;

              // Carry player if standing on it
              if (
                player.x + player.w > mp.x &&
                player.x < mp.x + mp.w &&
                Math.abs(player.y + player.h - mp.y) < 8
              ) {
                player.y += deltaY;
              }
            }
          }

          // Pressure Plates Check
          for (const plate of platesRef.current) {
            let pressed = false;
            // Player on plate
            if (
              player.x + player.w > plate.x &&
              player.x < plate.x + plate.w &&
              Math.abs(player.y + player.h - plate.y) < 8
            ) {
              pressed = true;
            }
            // Box on plate
            for (const box of pushablesRef.current) {
              if (
                box.x + box.w > plate.x &&
                box.x < plate.x + plate.w &&
                Math.abs(box.y + box.h - plate.y) < 8
              ) {
                pressed = true;
              }
            }

            if (pressed && !plate.isPressed) {
              plate.isPressed = true;
              soundEngine.playValveTurn();
            } else if (!pressed && plate.isPressed) {
              plate.isPressed = false;
            }
          }

          // Steam Jet Updraft Lift
          for (const jet of steamJetsRef.current) {
            if (jet.active && jet.canLiftPlayer) {
              if (
                player.x + player.w > jet.x - jet.spread &&
                player.x < jet.x + jet.spread &&
                player.y + player.h > jet.y - jet.length &&
                player.y < jet.y
              ) {
                player.vy = -6.5; // Updraft thrust
                // Emit steam particles
                if (Math.random() < 0.4) {
                  particlesRef.current.push({
                    x: player.x + Math.random() * player.w,
                    y: player.y + player.h,
                    vx: (Math.random() - 0.5) * 2,
                    vy: -4 - Math.random() * 3,
                    size: 8 + Math.random() * 10,
                    alpha: 0.6,
                    life: 0,
                    maxLife: 30,
                    color: '#eef',
                    type: 'steam',
                  });
                }
              }
            }
          }

          // Hanging Chains physics swing
          for (const chain of chainsRef.current) {
            chain.swingAngle += chain.swingVel;
            chain.swingVel *= 0.985; // damping
            chain.swingVel -= Math.sin(chain.swingAngle) * 0.002; // pendulum gravity
          }

          // Update Dogs AI
          let anyDogAlerted = false;
          let nearestDogDist = 9999;
          let nearestDogDir = 1;

          for (const dog of dogsRef.current) {
            const { caughtPlayer } = updateDogAI(
              dog,
              player,
              level.platforms,
              steamJetsRef.current,
              level.hidingSpots,
              dt
            );

            if (caughtPlayer) {
              player.isDead = true;
              player.deathTimer = 0;
              rendererRef.current.triggerShake(14, 30);
              onPlayerCaught();
              break;
            }

            if (dog.state === 'alert' || dog.state === 'chase') {
              anyDogAlerted = true;
            }

            const dist = Math.hypot(player.x - dog.x, player.y - dog.y);
            if (dist < nearestDogDist) {
              nearestDogDist = dist;
              nearestDogDir = dog.x > player.x ? 1 : -1;
            }
          }

          // Dynamic boy head-turning reaction
          if (nearestDogDist < 260 && anyDogAlerted) {
            player.headTurnAngle = nearestDogDir === player.facing ? 0 : 0.8;
          } else {
            player.headTurnAngle = 0;
          }

          // Modulate dynamic tension drone
          const tensionProximity = Math.max(0, 1 - nearestDogDist / 420);
          soundEngine.setTension(anyDogAlerted ? 1.0 : tensionProximity * 0.7);

          // Checkpoints
          for (let i = 0; i < level.checkpoints.length; i++) {
            const cp = level.checkpoints[i];
            if (!cp.reached && Math.abs(player.x - cp.x) < 50 && Math.abs(player.y - cp.y) < 90) {
              cp.reached = true;
              lastActiveCheckpointRef.current = { x: cp.x, y: cp.y };
              soundEngine.playCheckpointChord();
              onCheckpointReached(i + 1);
            }
          }

          // Level Exit Check
          if (checkAABB(player, level.exitPoint)) {
            soundEngine.playCheckpointChord();
            onChapterComplete(currentChapterId + 1);
          }

          // Fall death / Hazard
          if (player.y > level.height + 40) {
            player.isDead = true;
            player.deathTimer = 0;
            soundEngine.playCaptureSting();
            onPlayerCaught();
          }

          // Update stealth UI state
          let isPlayerHidden = false;
          if (player.isCrouching) {
            for (const spot of level.hidingSpots) {
              if (checkAABB(player, spot)) {
                isPlayerHidden = true;
                break;
              }
            }
          }
          onStealthStateChange(player.noiseLevel, isPlayerHidden, anyDogAlerted);
        }

        // Update active particles
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const p = particlesRef.current[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life++;
          p.alpha = 1 - p.life / p.maxLife;
          if (p.life >= p.maxLife) {
            particlesRef.current.splice(i, 1);
          }
        }

        // Render Frame
        rendererRef.current.render(
          player,
          level,
          dogsRef.current,
          pushablesRef.current,
          valvesRef.current,
          steamJetsRef.current,
          leversRef.current,
          movingPlatformsRef.current,
          chainsRef.current,
          platesRef.current,
          particlesRef.current,
          settings,
          time
        );
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameIdRef.current);
  }, [isPaused, onChapterComplete, onPlayerCaught, onCheckpointReached, onInteractPromptChange, onStealthStateChange, settings]);

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-[#0a0f12]">
      <canvas ref={canvasRef} className="block w-full h-full cursor-default" />

      {/* On-screen Touch Controls (for mobile/tablets or quick touch test) */}
      <div className="absolute inset-x-0 bottom-4 px-6 flex justify-between items-end pointer-events-none md:hidden z-20">
        {/* Left/Right D-Pad */}
        <div className="flex gap-3 pointer-events-auto">
          <button
            id="mobile-btn-left"
            className="w-14 h-14 rounded-xl bg-black/60 border border-white/20 text-white/80 active:bg-white/20 flex items-center justify-center font-mono text-xl backdrop-blur-sm"
            onTouchStart={() => {
              soundEngine.init();
              mobileInputRef.current.left = true;
            }}
            onTouchEnd={() => (mobileInputRef.current.left = false)}
          >
            ←
          </button>
          <button
            id="mobile-btn-right"
            className="w-14 h-14 rounded-xl bg-black/60 border border-white/20 text-white/80 active:bg-white/20 flex items-center justify-center font-mono text-xl backdrop-blur-sm"
            onTouchStart={() => {
              soundEngine.init();
              mobileInputRef.current.right = true;
            }}
            onTouchEnd={() => (mobileInputRef.current.right = false)}
          >
            →
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pointer-events-auto">
          <button
            id="mobile-btn-crouch"
            className="w-14 h-14 rounded-xl bg-black/60 border border-white/20 text-white/80 active:bg-white/20 flex items-center justify-center font-mono text-xs backdrop-blur-sm"
            onTouchStart={() => {
              soundEngine.init();
              mobileInputRef.current.crouch = !mobileInputRef.current.crouch;
            }}
          >
            SNEAK
          </button>
          <button
            id="mobile-btn-interact"
            className="w-14 h-14 rounded-xl bg-black/60 border border-white/20 text-white/80 active:bg-white/20 flex items-center justify-center font-mono text-xs backdrop-blur-sm"
            onTouchStart={() => {
              soundEngine.init();
              mobileInputRef.current.interact = true;
            }}
            onTouchEnd={() => (mobileInputRef.current.interact = false)}
          >
            GRAB
          </button>
          <button
            id="mobile-btn-jump"
            className="w-14 h-14 rounded-xl bg-black/60 border border-white/20 text-white/80 active:bg-white/20 flex items-center justify-center font-mono text-xs backdrop-blur-sm"
            onTouchStart={() => {
              soundEngine.init();
              mobileInputRef.current.jump = true;
            }}
            onTouchEnd={() => (mobileInputRef.current.jump = false)}
          >
            JUMP
          </button>
        </div>
      </div>
    </div>
  );
};
