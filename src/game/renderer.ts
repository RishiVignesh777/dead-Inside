import {
  Box2D,
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

export class InsideRenderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private cameraX: number = 0;
  private cameraY: number = 0;
  private targetCameraX: number = 0;
  private targetCameraY: number = 0;
  private zoom: number = 1.0;
  private targetZoom: number = 1.0;
  private shakeTime: number = 0;
  private shakeAmount: number = 0;
  private frameCount: number = 0;
  private rainParticles: { x: number; y: number; l: number; s: number }[] = [];

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;

    // Initialize ambient rain particles
    for (let i = 0; i < 90; i++) {
      this.rainParticles.push({
        x: Math.random() * 2000,
        y: Math.random() * 900,
        l: 12 + Math.random() * 16,
        s: 7 + Math.random() * 6,
      });
    }
  }

  public triggerShake(amount: number = 8, duration: number = 15) {
    this.shakeAmount = amount;
    this.shakeTime = duration;
  }

  public render(
    player: Player,
    level: LevelData,
    dogs: Dog[],
    pushables: PushableBox[],
    valves: SteamValve[],
    steamJets: SteamJet[],
    levers: Lever[],
    movingPlatforms: MovingPlatform[],
    chains: HangingChain[],
    plates: PressurePlate[],
    particles: Particle[],
    settings: GameSettings,
    gameTime: number
  ) {
    this.frameCount++;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Camera kinematics: smooth cinematic lag
    const leadX = player.facing * (player.isRunning ? 90 : 40);
    this.targetCameraX = player.x + leadX - w / (2 * this.zoom);
    this.targetCameraY = Math.min(level.height - h / this.zoom, Math.max(0, player.y - h / (2 * this.zoom) + 20));

    // Clamp camera within level bounds
    this.targetCameraX = Math.max(0, Math.min(level.width - w / this.zoom, this.targetCameraX));

    // Smooth Lerp
    this.cameraX += (this.targetCameraX - this.cameraX) * 0.08;
    this.cameraY += (this.targetCameraY - this.cameraY) * 0.08;

    // Dynamic Zoom: zoom in slightly during stealth/crouch, zoom out during sprint
    this.targetZoom = player.isCrouching ? 1.08 : (player.isRunning ? 0.96 : 1.02);
    this.zoom += (this.targetZoom - this.zoom) * 0.04;

    // Camera shake
    let shakeX = 0;
    let shakeY = 0;
    if (this.shakeTime > 0) {
      shakeX = (Math.random() - 0.5) * this.shakeAmount;
      shakeY = (Math.random() - 0.5) * this.shakeAmount;
      this.shakeTime--;
    }

    // 1. Clear & Deep Atmospheric Background
    ctx.save();
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#0c1114'); // murky night overcast
    bgGrad.addColorStop(0.55, '#141d21'); // foggy industrial horizon
    bgGrad.addColorStop(1, '#0e1316'); // rusted floor depth
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Apply World Camera Matrix
    ctx.save();
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.cameraX + shakeX, -this.cameraY + shakeY);

    // 2. Parallax Distant Layer (Monolithic Steampunk Ruins & Smokestacks)
    this.renderParallaxBackground(ctx, level, this.cameraX, this.cameraY, w, h);

    // 3. Ambient Fog & Volumetric Depth
    this.renderAmbientMist(ctx, level, gameTime);

    // 4. Background Pipes, Girders & Steampunk Gears
    this.renderMidgroundGearsAndPipes(ctx, level, gameTime);

    // 5. Hanging Chains (interactive physics swing)
    this.renderChains(ctx, chains, player);

    // 6. Ground Specular Water Puddles (INSIDE wet aesthetic)
    this.renderGroundPuddles(ctx, level);

    // 7. Platforms, Catwalks & Grates
    this.renderPlatforms(ctx, level.platforms);

    // 8. Moving Platforms (Piston Lifts / Crane Bridges)
    this.renderMovingPlatforms(ctx, movingPlatforms);

    // 9. Pressure Plates & Levers
    this.renderMechanisms(ctx, plates, levers);

    // 10. Pushables (Steampunk Iron Batteries / Crates)
    this.renderPushables(ctx, pushables);

    // 11. Steam Valves & Volumetric Steam Jets
    this.renderSteamSystems(ctx, valves, steamJets, gameTime);

    // 12. Particles (Steam plumes, sparks, smoke)
    this.renderParticles(ctx, particles);

    // 13. Boy Character (Playdead INSIDE Iconic Silhouette + Muted Red Tunic)
    this.renderBoy(ctx, player, gameTime);

    // 14. Mechanical Hounds (Silhouette with Volumetric Searchlight Eye Cones)
    this.renderDogs(ctx, dogs, gameTime);

    // 15. Checkpoint & Exit markers
    this.renderExitAndCheckpoints(ctx, level, gameTime);

    // Restore World Camera Matrix
    ctx.restore();

    // 16. Foreground Layer (Depth of field: out-of-focus dark rusted pipes/beams)
    this.renderForegroundOcclusions(ctx, w, h, this.cameraX, this.cameraY);

    // 17. Atmospheric Weather: Ambient rain streaks & dust motes
    this.renderAmbientRainAndDust(ctx, w, h);

    // 18. Film Grain & Vignette & Cinematic Letterbox
    this.renderCinematicPostProcess(ctx, w, h, settings);

    ctx.restore();
  }

  // Multi-plane parallax background
  private renderParallaxBackground(
    ctx: CanvasRenderingContext2D,
    level: LevelData,
    camX: number,
    camY: number,
    w: number,
    h: number
  ) {
    // Distant mountain / factory silhouettes (distance = 0.15)
    ctx.fillStyle = '#11171a';
    for (const elem of level.backgroundElements) {
      const px = elem.x - camX * elem.distance;
      const py = elem.y - camY * (elem.distance * 0.5);

      if (elem.type === 'chimney') {
        // Tapered industrial smokestack
        ctx.beginPath();
        ctx.moveTo(px, py + elem.h);
        ctx.lineTo(px + 10, py);
        ctx.lineTo(px + elem.w - 10, py);
        ctx.lineTo(px + elem.w, py + elem.h);
        ctx.fill();

        // Subtle smoke puff from chimney
        ctx.save();
        ctx.fillStyle = 'rgba(25, 35, 40, 0.4)';
        const smokeTime = this.frameCount * 0.02;
        ctx.beginPath();
        ctx.arc(px + elem.w / 2 + Math.sin(smokeTime) * 15, py - 20, 24, 0, Math.PI * 2);
        ctx.arc(px + elem.w / 2 + Math.cos(smokeTime) * 30 + 15, py - 55, 36, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (elem.type === 'ruins') {
        // Heavy rusted steel truss monolith
        ctx.fillRect(px, py, elem.w, elem.h);
        ctx.fillStyle = '#0e1416';
        ctx.fillRect(px + 20, py + 30, elem.w - 40, elem.h - 60);
        ctx.fillStyle = '#11171a';
      } else if (elem.type === 'cables') {
        // Sagging high-voltage cable spans
        ctx.strokeStyle = '#151f24';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.quadraticCurveTo(px + elem.w / 2, py + 45, px + elem.w, py + 10);
        ctx.stroke();
      }
    }
  }

  // Steampunk clockwork gears rotating in midground
  private renderMidgroundGearsAndPipes(ctx: CanvasRenderingContext2D, level: LevelData, gameTime: number) {
    for (const elem of level.backgroundElements) {
      if (elem.type === 'gear') {
        const radius = elem.w / 2;
        const cx = elem.x + radius;
        const cy = elem.y + radius;
        const angle = (this.frameCount * 0.005 * (elem.distance > 0.2 ? 1 : -1));

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.fillStyle = '#162024';
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        // Gear teeth
        ctx.fillStyle = '#1a272c';
        const teeth = 12;
        for (let i = 0; i < teeth; i++) {
          const a = (i * Math.PI * 2) / teeth;
          const tx = Math.cos(a) * (radius + 8);
          const ty = Math.sin(a) * (radius + 8);
          ctx.fillRect(tx - 6, ty - 6, 12, 12);
        }

        // Inner hollow cutout & copper spoke hub
        ctx.fillStyle = '#0f1518';
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.65, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#2b3d44';
        ctx.lineWidth = 5;
        for (let i = 0; i < 4; i++) {
          const a = (i * Math.PI) / 2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * radius * 0.65, Math.sin(a) * radius * 0.65);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
  }

  // Ambient mist clouds
  private renderAmbientMist(ctx: CanvasRenderingContext2D, level: LevelData, gameTime: number) {
    ctx.save();
    const t = this.frameCount * 0.008;
    const mistGrad = ctx.createLinearGradient(0, level.height - 350, 0, level.height);
    mistGrad.addColorStop(0, 'rgba(20, 28, 32, 0)');
    mistGrad.addColorStop(0.5, 'rgba(24, 34, 38, 0.28)');
    mistGrad.addColorStop(1, 'rgba(16, 22, 25, 0.55)');

    ctx.fillStyle = mistGrad;
    ctx.fillRect(0, level.height - 400, level.width, 400);
    ctx.restore();
  }

  // Solid platforms and industrial grating
  private renderPlatforms(ctx: CanvasRenderingContext2D, platforms: Platform[]) {
    for (const plat of platforms) {
      if (plat.type === 'solid') {
        // High contrast rusted concrete / iron silhouette
        ctx.fillStyle = '#171e21';
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);

        // Weathered top surface rim highlight (Playdead INSIDE signature rim lighting)
        ctx.fillStyle = '#2d3b41';
        ctx.fillRect(plat.x, plat.y, plat.w, 3);

        // Subtle rusted iron rivets along structure
        ctx.fillStyle = '#243035';
        const rivetCount = Math.floor(plat.w / 45);
        for (let i = 1; i < rivetCount; i++) {
          ctx.beginPath();
          ctx.arc(plat.x + i * 45, plat.y + 12, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (plat.type === 'metal_grate') {
        // Slotted see-through catwalk
        ctx.fillStyle = '#1a2327';
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
        ctx.fillStyle = '#34454d';
        ctx.fillRect(plat.x, plat.y, plat.w, 2);

        // Grating ribs
        ctx.strokeStyle = '#0e1416';
        ctx.lineWidth = 2;
        for (let gx = plat.x + 8; gx < plat.x + plat.w; gx += 14) {
          ctx.beginPath();
          ctx.moveTo(gx, plat.y + 3);
          ctx.lineTo(gx, plat.y + plat.h);
          ctx.stroke();
        }
      } else if (plat.type === 'pipe') {
        // Heavy copper steam conduit
        const pipeGrad = ctx.createLinearGradient(0, plat.y, 0, plat.y + plat.h);
        pipeGrad.addColorStop(0, '#4a3324'); // copper highlight
        pipeGrad.addColorStop(0.4, '#6b4832');
        pipeGrad.addColorStop(1, '#201610'); // shadow
        ctx.fillStyle = pipeGrad;
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);

        // Flange rings
        ctx.fillStyle = '#80573e';
        for (let fx = plat.x + 25; fx < plat.x + plat.w; fx += 70) {
          ctx.fillRect(fx - 4, plat.y - 3, 8, plat.h + 6);
        }
      } else if (plat.type === 'water') {
        // Hazardous industrial sump / acid puddle
        ctx.fillStyle = '#0a1a1f';
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
        ctx.fillStyle = '#184249';
        ctx.fillRect(plat.x, plat.y, plat.w, 4);
      }
    }
  }

  // Specular puddles with character reflections
  private renderGroundPuddles(ctx: CanvasRenderingContext2D, level: LevelData) {
    ctx.save();
    // Wet reflective sheen on flat surfaces
    ctx.fillStyle = 'rgba(40, 55, 62, 0.2)';
    ctx.fillRect(100, 498, 300, 4);
    ctx.fillRect(800, 558, 400, 4);
    ctx.fillRect(1400, 518, 300, 4);
    ctx.restore();
  }

  // Moving Platforms (Hydraulic Piston Lifts)
  private renderMovingPlatforms(ctx: CanvasRenderingContext2D, platforms: MovingPlatform[]) {
    for (const plat of platforms) {
      // Platform body
      ctx.fillStyle = '#202b30';
      ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
      ctx.fillStyle = '#3e525c';
      ctx.fillRect(plat.x, plat.y, plat.w, 3);

      // Hydraulic piston shaft underneath
      const shaftX = plat.x + plat.w / 2 - 8;
      const shaftY = plat.y + plat.h;
      const shaftH = Math.max(0, plat.startY - plat.y + 40);

      const shaftGrad = ctx.createLinearGradient(shaftX, 0, shaftX + 16, 0);
      shaftGrad.addColorStop(0, '#554232'); // polished brass/bronze piston
      shaftGrad.addColorStop(0.5, '#b08968');
      shaftGrad.addColorStop(1, '#382a1e');
      ctx.fillStyle = shaftGrad;
      ctx.fillRect(shaftX, shaftY, 16, shaftH);
    }
  }

  // Hanging Chains (climbable / swingable)
  private renderChains(ctx: CanvasRenderingContext2D, chains: HangingChain[], player: Player) {
    for (const chain of chains) {
      ctx.save();
      ctx.translate(chain.topX, chain.topY);
      ctx.rotate(chain.swingAngle);

      // Draw chain links
      const linkLength = 12;
      const numLinks = Math.floor(chain.length / linkLength);

      ctx.lineWidth = 3;
      ctx.strokeStyle = '#4a5b62';

      for (let i = 0; i < numLinks; i++) {
        const ly = i * linkLength;
        ctx.beginPath();
        ctx.ellipse(0, ly + 6, 3, 5, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Heavy iron hook at chain bottom
      ctx.fillStyle = '#2c373c';
      ctx.beginPath();
      ctx.arc(0, chain.length + 8, 8, 0, Math.PI);
      ctx.lineTo(6, chain.length);
      ctx.lineTo(-6, chain.length);
      ctx.fill();

      ctx.restore();
    }
  }

  // Pressure plates and levers
  private renderMechanisms(ctx: CanvasRenderingContext2D, plates: PressurePlate[], levers: Lever[]) {
    // Plates
    for (const plate of plates) {
      ctx.fillStyle = plate.isPressed ? '#b85d19' : '#573d2a'; // copper glow when pressed
      ctx.fillRect(plate.x, plate.y + (plate.isPressed ? 4 : 0), plate.w, plate.h - (plate.isPressed ? 4 : 0));
    }

    // Levers
    for (const lever of levers) {
      // Base pedestal
      ctx.fillStyle = '#1c2529';
      ctx.fillRect(lever.x, lever.y + lever.h - 8, lever.w, 8);

      // Handle arm
      ctx.save();
      ctx.translate(lever.x + lever.w / 2, lever.y + lever.h - 4);
      ctx.rotate(lever.isOn ? 0.6 : -0.6);
      ctx.strokeStyle = '#8c6d48';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -lever.h + 6);
      ctx.stroke();

      // Brass sphere knob
      ctx.fillStyle = lever.isOn ? '#d97724' : '#695138';
      ctx.beginPath();
      ctx.arc(0, -lever.h + 6, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Pushables (Wheeled Steampunk Batteries / Crates)
  private renderPushables(ctx: CanvasRenderingContext2D, pushables: PushableBox[]) {
    for (const box of pushables) {
      // Iron container
      ctx.fillStyle = '#1e262a';
      ctx.fillRect(box.x, box.y, box.w, box.h);
      ctx.fillStyle = '#3b4b53';
      ctx.fillRect(box.x, box.y, box.w, 3);

      // Diagonal cross-brace rivets
      ctx.strokeStyle = '#2d3a40';
      ctx.lineWidth = 3;
      ctx.strokeRect(box.x + 4, box.y + 4, box.w - 8, box.h - 8);

      if (box.isSteamPowered) {
        // Glowing amber vacuum tube / pressure coil
        const pulse = Math.sin(this.frameCount * 0.08) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(224, 122, 38, ${pulse})`;
        ctx.beginPath();
        ctx.arc(box.x + box.w / 2, box.y + box.h / 2, 7, 0, Math.PI * 2);
        ctx.fill();

        // Tiny steam exhaust vent on crate
        ctx.fillStyle = '#111719';
        ctx.fillRect(box.x + box.w / 2 - 3, box.y - 4, 6, 4);
      }

      // Small iron wheels on bottom
      ctx.fillStyle = '#101518';
      ctx.beginPath();
      ctx.arc(box.x + 8, box.y + box.h - 2, 5, 0, Math.PI * 2);
      ctx.arc(box.x + box.w - 8, box.y + box.h - 2, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Steam Valves & Volumetric Steam Jets
  private renderSteamSystems(
    ctx: CanvasRenderingContext2D,
    valves: SteamValve[],
    steamJets: SteamJet[],
    gameTime: number
  ) {
    // Wheel valves
    for (const valve of valves) {
      ctx.save();
      ctx.translate(valve.x, valve.y);
      ctx.rotate(valve.rotation);

      // Brass valve rim
      ctx.strokeStyle = '#a67244';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, valve.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Four spokes
      ctx.beginPath();
      ctx.moveTo(-valve.radius, 0);
      ctx.lineTo(valve.radius, 0);
      ctx.moveTo(0, -valve.radius);
      ctx.lineTo(0, valve.radius);
      ctx.stroke();

      // Central axle nut
      ctx.fillStyle = '#543922';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // Volumetric Steam Jets (plumes that blind dogs and lift player)
    for (const jet of steamJets) {
      if (!jet.active) continue;

      ctx.save();
      const numBillows = 12;
      const endX = jet.x + jet.dx * jet.length;
      const endY = jet.y + jet.dy * jet.length;

      for (let i = 0; i < numBillows; i++) {
        const prog = i / numBillows;
        const bx = jet.x + (endX - jet.x) * prog + Math.sin(this.frameCount * 0.15 + i) * 8;
        const by = jet.y + (endY - jet.y) * prog + Math.cos(this.frameCount * 0.15 + i) * 6;
        const r = 16 + prog * jet.spread;
        const alpha = (1 - prog) * 0.38;

        const steamGrad = ctx.createRadialGradient(bx, by, 2, bx, by, r);
        steamGrad.addColorStop(0, `rgba(215, 230, 235, ${alpha * 1.3})`);
        steamGrad.addColorStop(0.5, `rgba(180, 200, 210, ${alpha * 0.7})`);
        steamGrad.addColorStop(1, 'rgba(180, 200, 210, 0)');

        ctx.fillStyle = steamGrad;
        ctx.beginPath();
        ctx.arc(bx, by, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // Active particles (steam billows, sparks, smoke)
  private renderParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;

      if (p.type === 'steam') {
        const rad = p.size;
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
        grad.addColorStop(0, 'rgba(230, 240, 245, 0.45)');
        grad.addColorStop(1, 'rgba(200, 220, 230, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'spark') {
        ctx.fillStyle = '#ffaa33';
        ctx.fillRect(p.x, p.y, p.size, p.size);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // The Boy Character (Playdead INSIDE Iconic Silhouette + Muted Red Tunic)
  private renderBoy(ctx: CanvasRenderingContext2D, player: Player, gameTime: number) {
    if (player.isDead) {
      // Fallen ragdoll silhouette on ground
      ctx.save();
      ctx.fillStyle = '#0f1416';
      ctx.beginPath();
      ctx.ellipse(player.x + player.w / 2, player.y + player.h - 6, 22, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Red shirt accent visible
      ctx.fillStyle = '#7a2828';
      ctx.beginPath();
      ctx.ellipse(player.x + player.w / 2, player.y + player.h - 8, 12, 6, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    ctx.save();
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h;
    const facing = player.facing;

    ctx.translate(cx, cy);
    ctx.scale(facing, 1);

    // Dynamic ground shadow
    ctx.fillStyle = 'rgba(8, 12, 14, 0.6)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Procedural animation parameters
    const walkCycle = player.animTimer;
    const isMoving = Math.abs(player.vx) > 0.1;
    const legSwing = isMoving ? Math.sin(walkCycle) * 0.5 : 0;
    const bodyBob = isMoving ? Math.abs(Math.sin(walkCycle * 2)) * 2.5 : 0;

    // Crouch offset
    const crouchY = player.isCrouching ? 14 : 0;

    // --- LEGS & SHOES (Dark Charcoal Silhouette) ---
    ctx.strokeStyle = '#12171a';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';

    // Back Leg
    ctx.beginPath();
    ctx.moveTo(-2, -18 + crouchY);
    if (player.isCrouching) {
      ctx.lineTo(-10, -8);
      ctx.lineTo(-4, 0);
    } else if (!player.isGrounded) {
      ctx.lineTo(-6, -8);
      ctx.lineTo(-8, 0);
    } else {
      ctx.lineTo(-2 + Math.sin(walkCycle) * 8, -9);
      ctx.lineTo(-2 + Math.sin(walkCycle) * 12, 0);
    }
    ctx.stroke();

    // Front Leg
    ctx.beginPath();
    ctx.moveTo(2, -18 + crouchY);
    if (player.isCrouching) {
      ctx.lineTo(6, -8);
      ctx.lineTo(2, 0);
    } else if (!player.isGrounded) {
      ctx.lineTo(4, -8);
      ctx.lineTo(6, 0);
    } else {
      ctx.lineTo(2 - Math.sin(walkCycle) * 8, -9);
      ctx.lineTo(2 - Math.sin(walkCycle) * 12, 0);
    }
    ctx.stroke();

    // --- TORSO / RED TUNIC (INSIDE's signature muted red shirt) ---
    const leanForward = player.isRunning ? 0.25 : (player.isCrouching ? 0.35 : 0.05);
    ctx.save();
    ctx.translate(0, -22 + crouchY + bodyBob);
    ctx.rotate(leanForward);

    // Muted deep crimson tunic
    ctx.fillStyle = '#8f3333';
    ctx.beginPath();
    ctx.roundRect(-7, -18, 14, 20, [3, 3, 2, 2]);
    ctx.fill();

    // Tunic rim lighting / fold shadow
    ctx.fillStyle = '#6e2424';
    ctx.fillRect(-7, -4, 14, 4);

    // --- HEAD & HAIR ---
    ctx.save();
    ctx.translate(2, -24);
    // Nervous glance back at threat if hound is alert
    if (player.headTurnAngle !== 0) {
      ctx.rotate(player.headTurnAngle * -0.4);
    }

    // Pale silhouette head
    ctx.fillStyle = '#d5bca7';
    ctx.beginPath();
    ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
    ctx.fill();

    // Dark messy boy haircut (signature Playdead shape)
    ctx.fillStyle = '#101518';
    ctx.beginPath();
    ctx.arc(-0.5, -1.5, 7, Math.PI * 0.8, Math.PI * 2.1);
    ctx.lineTo(4, 2);
    ctx.lineTo(-2, -3);
    ctx.fill();
    ctx.restore();

    // --- ARMS (Dynamic reaching / pumping / dragging) ---
    ctx.strokeStyle = '#12171a';
    ctx.lineWidth = 3.5;

    if (player.grabbedBoxId) {
      // Both hands gripping the crate forward
      ctx.beginPath();
      ctx.moveTo(-2, -14);
      ctx.lineTo(14, -10);
      ctx.stroke();
    } else if (player.isClimbing) {
      // Reaching up to chain
      ctx.beginPath();
      ctx.moveTo(-2, -14);
      ctx.lineTo(4, -28);
      ctx.stroke();
    } else if (!player.isGrounded) {
      // Arms flailing / balancing in air
      ctx.beginPath();
      ctx.moveTo(-2, -14);
      ctx.lineTo(-12, -24);
      ctx.stroke();
    } else if (player.isCrouching) {
      // Cautious low-profile stealth hands
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(8, -6);
      ctx.lineTo(4, -2);
      ctx.stroke();
    } else {
      // Running arm swing
      const armSwing = Math.sin(walkCycle) * 10;
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(-armSwing, -4);
      ctx.stroke();
    }

    ctx.restore();
    ctx.restore();
  }

  // The Dogs (Playdead INSIDE Eerie Minimalist Silhouette + Volumetric Optic Eye)
  private renderDogs(ctx: CanvasRenderingContext2D, dogs: Dog[], gameTime: number) {
    for (const dog of dogs) {
      ctx.save();
      const cx = dog.x + dog.w / 2;
      const cy = dog.y + dog.h;
      const facing = dog.facing;

      ctx.translate(cx, cy);
      ctx.scale(facing, 1);

      // Dynamic ground shadow
      ctx.fillStyle = 'rgba(6, 10, 12, 0.7)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 26, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Dog quadruped animation
      const legTimer = dog.animTimer;
      const isGalloping = dog.state === 'chase';
      const stride = isGalloping ? 14 : 7;
      const f1 = Math.sin(legTimer) * stride;
      const f2 = Math.sin(legTimer + Math.PI) * stride;
      const b1 = Math.sin(legTimer + 0.8) * stride;
      const b2 = Math.sin(legTimer + Math.PI + 0.8) * stride;

      // --- LEGS & METALLIC CLAW SILHOUETTES ---
      ctx.strokeStyle = '#0a0e10';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';

      // Back hind leg
      ctx.beginPath();
      ctx.moveTo(-16, -14);
      ctx.lineTo(-20 + b2, -6);
      ctx.lineTo(-22 + b2, 0);
      ctx.stroke();

      // Front hind leg
      ctx.beginPath();
      ctx.moveTo(14, -14);
      ctx.lineTo(16 + f2, -6);
      ctx.lineTo(18 + f2, 0);
      ctx.stroke();

      // --- PNEUMATIC MECHANICAL HOUND BODY (INSIDE's sleek silhouette + steampunk spine) ---
      ctx.fillStyle = '#0d1214';

      // Ribcage & flank
      ctx.beginPath();
      ctx.moveTo(-18, -16);
      ctx.quadraticCurveTo(0, -22, 16, -18);
      ctx.lineTo(18, -10);
      ctx.quadraticCurveTo(0, -12, -18, -12);
      ctx.closePath();
      ctx.fill();

      // Steampunk spiked hydraulic spine
      ctx.fillStyle = '#222d32';
      for (let s = -14; s <= 12; s += 7) {
        ctx.fillRect(s, -23, 3, 4);
      }

      // Foreleg and near rear leg
      ctx.strokeStyle = '#080b0d';
      ctx.beginPath();
      ctx.moveTo(-14, -14);
      ctx.lineTo(-16 + b1, -6);
      ctx.lineTo(-17 + b1, 0);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(12, -14);
      ctx.lineTo(14 + f1, -6);
      ctx.lineTo(15 + f1, 0);
      ctx.stroke();

      // Whiplike mechanical tail
      ctx.beginPath();
      ctx.moveTo(-18, -16);
      ctx.quadraticCurveTo(-26, -24 + Math.sin(legTimer * 2) * 4, -32, -18);
      ctx.stroke();

      // --- HEAD & SNARLING MECHANICAL JAW ---
      ctx.save();
      ctx.translate(18, -18);
      const headTilt = dog.state === 'chase' ? 0.2 : (dog.state === 'investigate' ? -0.25 : 0);
      ctx.rotate(headTilt);

      // Skull silhouette
      ctx.fillStyle = '#090d0f';
      ctx.beginPath();
      ctx.moveTo(-2, -6);
      ctx.lineTo(14, -2); // snout tip
      ctx.lineTo(12, 5); // lower jaw
      ctx.lineTo(-2, 2);
      ctx.closePath();
      ctx.fill();

      // Pointed robotic acoustic sensor ears
      ctx.beginPath();
      ctx.moveTo(-2, -6);
      ctx.lineTo(-6, -14);
      ctx.lineTo(2, -6);
      ctx.fill();

      // --- GLOWING MECHANICAL OPTIC EYE (Playdead INSIDE Signature Element) ---
      const eyeX = 8;
      const eyeY = -2;
      const isRed = dog.eyeColor === 'crimson';
      const eyeCoreColor = isRed ? '#ff2222' : '#f5a623';
      const eyeGlowColor = isRed ? 'rgba(255, 34, 34, ' : 'rgba(245, 166, 35, ';
      const intensity = dog.eyeIntensity;

      // Volumetric searchlight optic cone cast onto the floor/ruins
      const coneLength = isRed ? 340 : 250;
      const coneSpread = isRed ? 70 : 85;

      const coneGrad = ctx.createRadialGradient(eyeX, eyeY, 4, eyeX + coneLength * 0.7, eyeY, coneSpread * 2);
      coneGrad.addColorStop(0, `${eyeGlowColor}${0.75 * intensity})`);
      coneGrad.addColorStop(0.35, `${eyeGlowColor}${0.32 * intensity})`);
      coneGrad.addColorStop(0.7, `${eyeGlowColor}${0.1 * intensity})`);
      coneGrad.addColorStop(1, `${eyeGlowColor}0)`);

      ctx.save();
      ctx.fillStyle = coneGrad;
      ctx.beginPath();
      ctx.moveTo(eyeX, eyeY);
      ctx.lineTo(eyeX + coneLength, eyeY - coneSpread * 0.5);
      ctx.lineTo(eyeX + coneLength, eyeY + coneSpread * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Eye optic lens flare & corona
      ctx.fillStyle = `${eyeGlowColor}${0.85 * intensity})`;
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, 6.5, 0, Math.PI * 2);
      ctx.fill();

      // Pinpoint core
      ctx.fillStyle = isRed ? '#ffffff' : '#fff4cc';
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore(); // Head
      ctx.restore(); // Dog
    }
  }

  // Checkpoint & Exit visuals
  private renderExitAndCheckpoints(ctx: CanvasRenderingContext2D, level: LevelData, gameTime: number) {
    // Exit Airlock / Drainage Culvert
    const ex = level.exitPoint;
    ctx.save();
    ctx.fillStyle = '#070a0c';
    ctx.fillRect(ex.x, ex.y, ex.w, ex.h);

    // Heavy iron airlock frame
    ctx.strokeStyle = '#28363c';
    ctx.lineWidth = 6;
    ctx.strokeRect(ex.x, ex.y, ex.w, ex.h);

    // Eerie backlighting from passage
    const exitGlow = ctx.createLinearGradient(ex.x + ex.w, ex.y, ex.x, ex.y);
    exitGlow.addColorStop(0, 'rgba(80, 115, 125, 0.45)');
    exitGlow.addColorStop(1, 'rgba(80, 115, 125, 0)');
    ctx.fillStyle = exitGlow;
    ctx.fillRect(ex.x - 40, ex.y, ex.w + 40, ex.h);

    ctx.restore();
  }

  // Out-of-focus foreground silhouettes (depth of field)
  private renderForegroundOcclusions(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    camX: number,
    camY: number
  ) {
    ctx.save();
    ctx.fillStyle = '#050708';

    // Massive overhead rusted pipe crossing in foreground
    const pipeX = -((camX * 1.35) % (w * 1.5));
    ctx.fillRect(pipeX, 0, 140, 50);

    // Hanging broken iron cable in corner
    ctx.strokeStyle = '#060809';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(w - 60, 0);
    ctx.quadraticCurveTo(w - 90, h * 0.4, w - 40, h * 0.7);
    ctx.stroke();

    ctx.restore();
  }

  // Rain streaks & industrial dust motes
  private renderAmbientRainAndDust(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.save();
    ctx.strokeStyle = 'rgba(160, 185, 195, 0.15)';
    ctx.lineWidth = 1.2;

    for (const r of this.rainParticles) {
      r.y += r.s;
      r.x -= r.s * 0.35; // wind slant
      if (r.y > h) {
        r.y = -20;
        r.x = Math.random() * w * 1.3;
      }

      ctx.beginPath();
      ctx.moveTo(r.x, r.y);
      ctx.lineTo(r.x - r.l * 0.35, r.y + r.l);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Film grain, vignette and cinematic letterbox
  private renderCinematicPostProcess(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    settings: GameSettings
  ) {
    // 1. Deep cinematic vignette
    ctx.save();
    const vigGrad = ctx.createRadialGradient(w / 2, h / 2, h * 0.38, w / 2, h / 2, Math.max(w, h) * 0.72);
    vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vigGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.42)');
    vigGrad.addColorStop(1, 'rgba(0, 0, 0, 0.88)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    // 2. Cinematic Film Grain
    if (settings.filmGrain) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
      const grainCount = 350;
      for (let i = 0; i < grainCount; i++) {
        const gx = Math.random() * w;
        const gy = Math.random() * h;
        ctx.fillRect(gx, gy, 1.5, 1.5);
      }
      ctx.restore();
    }

    // 3. Cinematic 2.39:1 Letterbox bars
    if (settings.letterbox) {
      const targetAspect = 2.35;
      const currentAspect = w / h;
      if (currentAspect < targetAspect) {
        const barHeight = Math.floor((h - w / targetAspect) / 2);
        if (barHeight > 4) {
          ctx.fillStyle = '#050708';
          ctx.fillRect(0, 0, w, barHeight);
          ctx.fillRect(0, h - barHeight, w, barHeight);
        }
      }
    }
  }
}
