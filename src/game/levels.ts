import { LevelData } from '../types';

export const LEVELS: LevelData[] = [
  // ----------------------------------------------------
  // CHAPTER 1: The Outskirts & Rusted Scaffolding
  // ----------------------------------------------------
  {
    id: 1,
    title: 'CHAPTER I',
    subtitle: 'THE PERIMETER SCAFFOLDING',
    width: 2400,
    height: 700,
    spawnPoint: { x: 80, y: 380 },
    exitPoint: { x: 2320, y: 340, w: 70, h: 100 },
    ambientFogColor: 'rgba(18, 24, 28, 0.75)',
    platforms: [
      // Starting ground & drop-off
      { id: 'p1', x: 0, y: 500, w: 520, h: 200, type: 'solid' },
      // Low pipe crawl section
      { id: 'p_pipe_overhead', x: 220, y: 440, w: 140, h: 20, type: 'pipe' },

      // Lower pit area where first hound patrols
      { id: 'p2', x: 500, y: 560, w: 850, h: 140, type: 'solid' },
      // Elevated catwalk above patrol
      { id: 'p3', x: 700, y: 420, w: 220, h: 24, type: 'metal_grate' },
      { id: 'p4', x: 1020, y: 390, w: 260, h: 24, type: 'metal_grate' },

      // Middle ruins ground
      { id: 'p5', x: 1320, y: 520, w: 500, h: 180, type: 'solid' },
      // Obstacle block
      { id: 'p_wall', x: 1680, y: 400, w: 40, h: 120, type: 'solid' },
      
      // High gantry & exit gate
      { id: 'p6', x: 1800, y: 440, w: 600, h: 260, type: 'solid' },
    ],
    dogs: [
      // First patrol hound in the lower pit
      {
        id: 'dog_1',
        x: 820,
        y: 515,
        vx: 0,
        vy: 0,
        w: 48,
        h: 28,
        facing: 1,
        state: 'patrol',
        patrolMinX: 580,
        patrolMaxX: 1140,
        patrolDir: 1,
        alertTimer: 0,
        searchTimer: 0,
        blindedTimer: 0,
        targetX: 820,
        targetY: 515,
        headAngle: 0,
        eyeColor: 'amber',
        eyeIntensity: 0.6,
        animTimer: 0,
        barkCooldown: 0,
        snarlVolume: 0,
        hasLineOfSight: false,
      },
      // Second hound near the ruins wall
      {
        id: 'dog_2',
        x: 1480,
        y: 475,
        vx: 0,
        vy: 0,
        w: 48,
        h: 28,
        facing: -1,
        state: 'patrol',
        patrolMinX: 1350,
        patrolMaxX: 1620,
        patrolDir: -1,
        alertTimer: 0,
        searchTimer: 0,
        blindedTimer: 0,
        targetX: 1480,
        targetY: 475,
        headAngle: 0,
        eyeColor: 'amber',
        eyeIntensity: 0.6,
        animTimer: 0,
        barkCooldown: 0,
        snarlVolume: 0,
        hasLineOfSight: false,
      },
    ],
    pushables: [
      // Heavy iron steam crate to drag and climb over the wall
      { id: 'crate_1', x: 1400, y: 460, w: 44, h: 44, vx: 0, vy: 0, mass: 1.2, isClimbable: true, isSteamPowered: false },
    ],
    valves: [
      // Pressure release valve that blasts steam to blind the second dog!
      {
        id: 'valve_1',
        x: 1340,
        y: 500,
        radius: 16,
        isOpen: false,
        rotation: 0,
        targetJetId: 'jet_1',
        interactionPrompt: 'Turn Valve (Steam Screen)',
      },
    ],
    steamJets: [
      // Vertical steam plume cutting across patrol
      {
        id: 'jet_1',
        x: 1520,
        y: 520,
        dx: 0,
        dy: -1,
        length: 140,
        spread: 32,
        active: false,
        pressure: 1.0,
        blindDogs: true,
      },
    ],
    levers: [],
    movingPlatforms: [],
    chains: [
      // Hanging chain to swing over the first dog's pit
      { id: 'chain_1', topX: 970, topY: 200, length: 170, swingAngle: 0, swingVel: 0 },
    ],
    pressurePlates: [],
    checkpoints: [
      { id: 'cp1_1', x: 80, y: 440, reached: true, name: 'Canal Dock' },
      { id: 'cp1_2', x: 440, y: 440, reached: false, name: 'Pit Overlook' },
      { id: 'cp1_3', x: 740, y: 360, reached: false, name: 'High Catwalk' },
      { id: 'cp1_4', x: 1320, y: 460, reached: false, name: 'Ruins Steam Valve' },
      { id: 'cp1_5', x: 1840, y: 380, reached: false, name: 'Upper Bastion' },
    ],
    hidingSpots: [
      // Shadow behind iron rebar
      { x: 380, y: 420, w: 90, h: 80 },
      // Dark under-catwalk alcove
      { x: 740, y: 450, w: 120, h: 100 },
    ],
    backgroundElements: [
      { distance: 0.2, type: 'chimney', x: 180, y: 220, w: 70, h: 320 },
      { distance: 0.3, type: 'ruins', x: 600, y: 260, w: 220, h: 280 },
      { distance: 0.15, type: 'cables', x: 1100, y: 150, w: 340, h: 60 },
      { distance: 0.25, type: 'gear', x: 1700, y: 240, w: 160, h: 160 },
    ],
  },

  // ----------------------------------------------------
  // CHAPTER 2: The Pressure Foundry & Steam Vents
  // ----------------------------------------------------
  {
    id: 2,
    title: 'CHAPTER II',
    subtitle: 'THE PRESSURE FOUNDRY',
    width: 2700,
    height: 720,
    spawnPoint: { x: 90, y: 420 },
    exitPoint: { x: 2620, y: 360, w: 70, h: 100 },
    ambientFogColor: 'rgba(24, 20, 16, 0.78)',
    platforms: [
      // Initial floor
      { id: 'p2_1', x: 0, y: 520, w: 460, h: 200, type: 'solid' },
      // Suspended pipe gantry
      { id: 'p2_2', x: 420, y: 410, w: 200, h: 22, type: 'pipe' },

      // Lower steam pipe trench where hound guards
      { id: 'p2_3', x: 460, y: 570, w: 920, h: 150, type: 'solid' },
      // High iron gantry
      { id: 'p2_4', x: 740, y: 370, w: 320, h: 22, type: 'metal_grate' },
      { id: 'p2_5', x: 1150, y: 420, w: 220, h: 22, type: 'metal_grate' },

      // Center chamber
      { id: 'p2_6', x: 1360, y: 530, w: 720, h: 190, type: 'solid' },
      // High security blast wall
      { id: 'p2_blast', x: 1920, y: 320, w: 36, h: 210, type: 'solid' },

      // Final airlock catwalk
      { id: 'p2_7', x: 1950, y: 460, w: 750, h: 260, type: 'solid' },
    ],
    dogs: [
      // Hound in the steam pipe trench
      {
        id: 'dog_foundry_1',
        x: 640,
        y: 525,
        vx: 0,
        vy: 0,
        w: 50,
        h: 30,
        facing: 1,
        state: 'patrol',
        patrolMinX: 500,
        patrolMaxX: 1100,
        patrolDir: 1,
        alertTimer: 0,
        searchTimer: 0,
        blindedTimer: 0,
        targetX: 640,
        targetY: 525,
        headAngle: 0,
        eyeColor: 'amber',
        eyeIntensity: 0.65,
        animTimer: 0,
        barkCooldown: 0,
        snarlVolume: 0,
        hasLineOfSight: false,
      },
      // Second hound pacing near the blast wall
      {
        id: 'dog_foundry_2',
        x: 1650,
        y: 485,
        vx: 0,
        vy: 0,
        w: 50,
        h: 30,
        facing: -1,
        state: 'patrol',
        patrolMinX: 1420,
        patrolMaxX: 1880,
        patrolDir: -1,
        alertTimer: 0,
        searchTimer: 0,
        blindedTimer: 0,
        targetX: 1650,
        targetY: 485,
        headAngle: 0,
        eyeColor: 'amber',
        eyeIntensity: 0.65,
        animTimer: 0,
        barkCooldown: 0,
        snarlVolume: 0,
        hasLineOfSight: false,
      },
    ],
    pushables: [
      // Wheeled steam battery crate to reach high blast wall ladder/chain
      { id: 'crate_2_1', x: 1520, y: 470, w: 48, h: 48, vx: 0, vy: 0, mass: 1.4, isClimbable: true, isSteamPowered: true },
    ],
    valves: [
      // Valve 1: triggers horizontal high-pressure jet blocking hound's forward vision
      {
        id: 'valve_2_1',
        x: 380,
        y: 500,
        radius: 16,
        isOpen: false,
        rotation: 0,
        targetJetId: 'jet_2_1',
        interactionPrompt: 'Open Steam Conduit',
      },
      // Valve 2: opens vertical updraft steam plume
      {
        id: 'valve_2_2',
        x: 1200,
        y: 400,
        radius: 16,
        isOpen: false,
        rotation: 0,
        targetJetId: 'jet_2_2',
        interactionPrompt: 'Vent Exhaust Plume',
      },
    ],
    steamJets: [
      // Horizontal blinding jet in trench
      {
        id: 'jet_2_1',
        x: 750,
        y: 540,
        dx: 1,
        dy: 0,
        length: 220,
        spread: 38,
        active: false,
        pressure: 1.2,
        blindDogs: true,
      },
      // Massive vertical vent in center chamber
      {
        id: 'jet_2_2',
        x: 1600,
        y: 530,
        dx: 0,
        dy: -1,
        length: 190,
        spread: 44,
        active: false,
        pressure: 1.5,
        blindDogs: true,
        canLiftPlayer: true,
      },
    ],
    levers: [
      // High-pitched acoustic steam whistle to lure hound 2 to the left side
      {
        id: 'lever_whistle_1',
        x: 1390,
        y: 510,
        w: 24,
        h: 30,
        isOn: false,
        connectedTargetId: 'dog_foundry_2',
        type: 'whistle',
      },
    ],
    movingPlatforms: [
      // Steam-driven piston lift to cross over the blast wall
      {
        id: 'piston_lift_1',
        x: 1840,
        y: 500,
        w: 70,
        h: 18,
        startX: 1840,
        startY: 500,
        endX: 1840,
        endY: 340,
        progress: 0,
        speed: 0.02,
        isActive: false,
      },
    ],
    chains: [
      { id: 'chain_2_1', topX: 900, topY: 180, length: 160, swingAngle: 0, swingVel: 0 },
      { id: 'chain_2_2', topX: 2020, topY: 180, length: 150, swingAngle: 0, swingVel: 0 },
    ],
    pressurePlates: [
      // Plate activates the piston lift
      { id: 'plate_foundry', x: 1750, y: 524, w: 54, h: 8, isPressed: false, targetElevatorId: 'piston_lift_1' },
    ],
    checkpoints: [
      { id: 'cp2_1', x: 90, y: 460, reached: true, name: 'Foundry Entry' },
      { id: 'cp2_2', x: 440, y: 350, reached: false, name: 'Trench Overpass' },
      { id: 'cp2_3', x: 1370, y: 470, reached: false, name: 'Piston Chamber' },
      { id: 'cp2_4', x: 1960, y: 400, reached: false, name: 'Blast Gate Catwalk' },
    ],
    hidingSpots: [
      { x: 580, y: 460, w: 100, h: 100 },
      { x: 1440, y: 430, w: 110, h: 90 },
    ],
    backgroundElements: [
      { distance: 0.2, type: 'gear', x: 500, y: 220, w: 180, h: 180 },
      { distance: 0.35, type: 'pipes', x: 1000, y: 190, w: 320, h: 120 },
      { distance: 0.15, type: 'chimney', x: 1600, y: 160, w: 80, h: 360 },
      { distance: 0.25, type: 'ruins', x: 2200, y: 240, w: 260, h: 260 },
    ],
  },

  // ----------------------------------------------------
  // CHAPTER 3: The Crane Yard & Hydraulic Siphon
  // ----------------------------------------------------
  {
    id: 3,
    title: 'CHAPTER III',
    subtitle: 'THE HYDRAULIC SIPHON',
    width: 2900,
    height: 750,
    spawnPoint: { x: 80, y: 430 },
    exitPoint: { x: 2820, y: 380, w: 70, h: 100 },
    ambientFogColor: 'rgba(16, 22, 26, 0.82)',
    platforms: [
      { id: 'p3_1', x: 0, y: 530, w: 500, h: 220, type: 'solid' },
      // High crane support beam
      { id: 'p3_2', x: 480, y: 390, w: 280, h: 24, type: 'metal_grate' },

      // Dog pack pit
      { id: 'p3_3', x: 500, y: 590, w: 980, h: 160, type: 'solid' },
      { id: 'p3_4', x: 920, y: 430, w: 240, h: 22, type: 'metal_grate' },
      { id: 'p3_5', x: 1240, y: 360, w: 200, h: 22, type: 'pipe' },

      // Middle silo basin
      { id: 'p3_6', x: 1480, y: 540, w: 760, h: 210, type: 'solid' },
      // Counterweight chasm gap (water / acid hazard at bottom)
      { id: 'p3_chasm', x: 1780, y: 640, w: 200, h: 110, type: 'water' },

      // Final escape rail platform
      { id: 'p3_7', x: 2240, y: 490, w: 660, h: 260, type: 'solid' },
    ],
    dogs: [
      // Relentless alpha mechanical hound with high-intensity optic beam
      {
        id: 'dog_crane_alpha',
        x: 720,
        y: 545,
        vx: 0,
        vy: 0,
        w: 52,
        h: 32,
        facing: 1,
        state: 'patrol',
        patrolMinX: 520,
        patrolMaxX: 1380,
        patrolDir: 1,
        alertTimer: 0,
        searchTimer: 0,
        blindedTimer: 0,
        targetX: 720,
        targetY: 545,
        headAngle: 0,
        eyeColor: 'amber',
        eyeIntensity: 0.7,
        animTimer: 0,
        barkCooldown: 0,
        snarlVolume: 0,
        hasLineOfSight: false,
      },
      // Second hound guarding the silo basin
      {
        id: 'dog_crane_beta',
        x: 1620,
        y: 495,
        vx: 0,
        vy: 0,
        w: 50,
        h: 30,
        facing: -1,
        state: 'patrol',
        patrolMinX: 1500,
        patrolMaxX: 1760,
        patrolDir: -1,
        alertTimer: 0,
        searchTimer: 0,
        blindedTimer: 0,
        targetX: 1620,
        targetY: 495,
        headAngle: 0,
        eyeColor: 'amber',
        eyeIntensity: 0.65,
        animTimer: 0,
        barkCooldown: 0,
        snarlVolume: 0,
        hasLineOfSight: false,
      },
    ],
    pushables: [
      // Heavy iron steam crate
      { id: 'crate_3_1', x: 1540, y: 480, w: 46, h: 46, vx: 0, vy: 0, mass: 1.5, isClimbable: true, isSteamPowered: true },
    ],
    valves: [
      // Valve to unleash steam wall across the dog's patrol zone
      {
        id: 'valve_3_1',
        x: 460,
        y: 510,
        radius: 16,
        isOpen: false,
        rotation: 0,
        targetJetId: 'jet_3_1',
        interactionPrompt: 'Discharge Overpressure',
      },
      // Valve to power counter-balance bridge
      {
        id: 'valve_3_2',
        x: 1720,
        y: 515,
        radius: 16,
        isOpen: false,
        rotation: 0,
        targetJetId: 'jet_3_2',
        interactionPrompt: 'Direct Steam to Crane',
      },
    ],
    steamJets: [
      {
        id: 'jet_3_1',
        x: 800,
        y: 590,
        dx: 0,
        dy: -1,
        length: 210,
        spread: 46,
        active: false,
        pressure: 1.4,
        blindDogs: true,
      },
      {
        id: 'jet_3_2',
        x: 1880,
        y: 630,
        dx: 0,
        dy: -1,
        length: 160,
        spread: 36,
        active: false,
        pressure: 1.3,
        blindDogs: true,
        canLiftPlayer: true,
      },
    ],
    levers: [
      // Whistle to draw hound away from chasm
      {
        id: 'lever_whistle_3',
        x: 1260,
        y: 340,
        w: 24,
        h: 30,
        isOn: false,
        connectedTargetId: 'dog_crane_alpha',
        type: 'whistle',
      },
    ],
    movingPlatforms: [
      // Counterweight bridge extending over the acid chasm
      {
        id: 'crane_bridge',
        x: 1780,
        y: 540,
        w: 200,
        h: 18,
        startX: 1780,
        startY: 640,
        endX: 1780,
        endY: 540,
        progress: 0,
        speed: 0.015,
        isActive: false,
      },
    ],
    chains: [
      // Two swinging chains over the pit!
      { id: 'chain_3_1', topX: 780, topY: 190, length: 180, swingAngle: 0, swingVel: 0 },
      { id: 'chain_3_2', topX: 1100, topY: 190, length: 180, swingAngle: 0, swingVel: 0 },
      { id: 'chain_3_3', topX: 2120, topY: 180, length: 170, swingAngle: 0, swingVel: 0 },
    ],
    pressurePlates: [
      { id: 'plate_crane', x: 1680, y: 532, w: 56, h: 8, isPressed: false, targetElevatorId: 'crane_bridge' },
    ],
    checkpoints: [
      { id: 'cp3_1', x: 80, y: 470, reached: true, name: 'Siphon Gantry' },
      { id: 'cp3_2', x: 520, y: 330, reached: false, name: 'Crane Girder' },
      { id: 'cp3_3', x: 1480, y: 470, reached: false, name: 'Acid Chasm Basin' },
      { id: 'cp3_4', x: 2060, y: 470, reached: false, name: 'Counterweight Bridge' },
    ],
    hidingSpots: [
      { x: 380, y: 470, w: 90, h: 60 },
      { x: 1560, y: 470, w: 100, h: 70 },
    ],
    backgroundElements: [
      { distance: 0.25, type: 'ruins', x: 350, y: 200, w: 280, h: 320 },
      { distance: 0.15, type: 'gear', x: 950, y: 170, w: 210, h: 210 },
      { distance: 0.35, type: 'pipes', x: 1600, y: 220, w: 340, h: 130 },
      { distance: 0.2, type: 'chimney', x: 2300, y: 150, w: 90, h: 380 },
    ],
  },

  // ----------------------------------------------------
  // CHAPTER 4: The Core Siphon & Final Breakout
  // ----------------------------------------------------
  {
    id: 4,
    title: 'CHAPTER IV',
    subtitle: 'THE CONDUIT BREAKOUT',
    width: 3200,
    height: 750,
    spawnPoint: { x: 90, y: 430 },
    exitPoint: { x: 3100, y: 360, w: 80, h: 100 },
    ambientFogColor: 'rgba(12, 18, 22, 0.86)',
    platforms: [
      { id: 'p4_1', x: 0, y: 530, w: 580, h: 220, type: 'solid' },
      { id: 'p4_2', x: 460, y: 410, w: 240, h: 22, type: 'metal_grate' },

      // High-speed pursuit runway
      { id: 'p4_3', x: 580, y: 560, w: 1300, h: 190, type: 'solid' },
      { id: 'p4_barricade', x: 1120, y: 440, w: 32, h: 120, type: 'solid' },
      { id: 'p4_4', x: 980, y: 420, w: 260, h: 22, type: 'metal_grate' },
      { id: 'p4_5', x: 1380, y: 430, w: 240, h: 22, type: 'metal_grate' },

      // Final escape rail yard
      { id: 'p4_6', x: 1880, y: 520, w: 1320, h: 230, type: 'solid' },
      { id: 'p4_rail_car', x: 2840, y: 460, w: 260, h: 60, type: 'solid' },
    ],
    dogs: [
      // Relentless pursuit hounds that break loose!
      {
        id: 'dog_final_1',
        x: 680,
        y: 515,
        vx: 0,
        vy: 0,
        w: 52,
        h: 32,
        facing: 1,
        state: 'patrol',
        patrolMinX: 590,
        patrolMaxX: 1080,
        patrolDir: 1,
        alertTimer: 0,
        searchTimer: 0,
        blindedTimer: 0,
        targetX: 680,
        targetY: 515,
        headAngle: 0,
        eyeColor: 'amber',
        eyeIntensity: 0.7,
        animTimer: 0,
        barkCooldown: 0,
        snarlVolume: 0,
        hasLineOfSight: false,
      },
      {
        id: 'dog_final_2',
        x: 1550,
        y: 515,
        vx: 0,
        vy: 0,
        w: 52,
        h: 32,
        facing: -1,
        state: 'patrol',
        patrolMinX: 1200,
        patrolMaxX: 1820,
        patrolDir: -1,
        alertTimer: 0,
        searchTimer: 0,
        blindedTimer: 0,
        targetX: 1550,
        targetY: 515,
        headAngle: 0,
        eyeColor: 'amber',
        eyeIntensity: 0.7,
        animTimer: 0,
        barkCooldown: 0,
        snarlVolume: 0,
        hasLineOfSight: false,
      },
    ],
    pushables: [
      { id: 'crate_4_1', x: 1040, y: 500, w: 46, h: 46, vx: 0, vy: 0, mass: 1.4, isClimbable: true, isSteamPowered: true },
      { id: 'crate_4_2', x: 2360, y: 460, w: 50, h: 50, vx: 0, vy: 0, mass: 1.6, isClimbable: true, isSteamPowered: true },
    ],
    valves: [
      // Primary conduit blow-off valve: creates massive curtain of blinding steam!
      {
        id: 'valve_4_1',
        x: 940,
        y: 400,
        radius: 18,
        isOpen: false,
        rotation: 0,
        targetJetId: 'jet_4_curtain',
        interactionPrompt: 'Discharge Steam Barrier',
      },
      // Rail car booster valve: powers the steam engine of the escape rail car!
      {
        id: 'valve_4_rail',
        x: 2720,
        y: 500,
        radius: 18,
        isOpen: false,
        rotation: 0,
        targetJetId: 'jet_4_engine',
        interactionPrompt: 'Ignite Rail Locomotive Boiler',
      },
    ],
    steamJets: [
      {
        id: 'jet_4_curtain',
        x: 1280,
        y: 560,
        dx: 0,
        dy: -1,
        length: 240,
        spread: 52,
        active: false,
        pressure: 1.8,
        blindDogs: true,
      },
      {
        id: 'jet_4_engine',
        x: 2840,
        y: 480,
        dx: -1,
        dy: 0,
        length: 160,
        spread: 38,
        active: false,
        pressure: 2.0,
        blindDogs: false,
      },
    ],
    levers: [
      {
        id: 'lever_final_whistle',
        x: 1420,
        y: 410,
        w: 24,
        h: 30,
        isOn: false,
        connectedTargetId: 'dog_final_2',
        type: 'whistle',
      },
    ],
    movingPlatforms: [
      // Pneumatic blast door / elevator
      {
        id: 'final_gate_lift',
        x: 1840,
        y: 510,
        w: 36,
        h: 120,
        startX: 1840,
        startY: 510,
        endX: 1840,
        endY: 360,
        progress: 0,
        speed: 0.02,
        isActive: false,
      },
    ],
    chains: [
      { id: 'chain_4_1', topX: 840, topY: 180, length: 170, swingAngle: 0, swingVel: 0 },
      { id: 'chain_4_2', topX: 1680, topY: 170, length: 180, swingAngle: 0, swingVel: 0 },
      { id: 'chain_4_3', topX: 2550, topY: 180, length: 170, swingAngle: 0, swingVel: 0 },
    ],
    pressurePlates: [
      { id: 'plate_final', x: 2200, y: 512, w: 60, h: 8, isPressed: false, targetElevatorId: 'final_gate_lift' },
    ],
    checkpoints: [
      { id: 'cp4_1', x: 90, y: 470, reached: true, name: 'Conduit Entry' },
      { id: 'cp4_2', x: 500, y: 470, reached: false, name: 'Runway Approach' },
      { id: 'cp4_3', x: 1040, y: 360, reached: false, name: 'Mid-Runway Gantry' },
      { id: 'cp4_4', x: 1920, y: 460, reached: false, name: 'Rail Yard Threshold' },
      { id: 'cp4_5', x: 2780, y: 450, reached: false, name: 'Rail Car Freight' },
    ],
    hidingSpots: [
      { x: 420, y: 470, w: 90, h: 60 },
      { x: 1980, y: 450, w: 120, h: 70 },
    ],
    backgroundElements: [
      { distance: 0.2, type: 'chimney', x: 400, y: 140, w: 100, h: 420 },
      { distance: 0.35, type: 'gear', x: 1200, y: 180, w: 250, h: 250 },
      { distance: 0.18, type: 'cables', x: 1800, y: 150, w: 480, h: 70 },
      { distance: 0.25, type: 'ruins', x: 2600, y: 200, w: 320, h: 320 },
    ],
  },
];
