export type DogState = 'patrol' | 'investigate' | 'alert' | 'chase' | 'search' | 'blinded';

export interface Vector2D {
  x: number;
  y: number;
}

export interface Box2D {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  facing: 1 | -1;
  isGrounded: boolean;
  isCrouching: boolean;
  isRunning: boolean;
  isClimbing: boolean;
  climbTargetId: string | null;
  grabbedBoxId: string | null;
  animTimer: number;
  isDead: boolean;
  deathTimer: number;
  noiseLevel: number; // 0 to 1
  headTurnAngle: number; // angle looking back at threat
  breathRate: number;
}

export interface Dog {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  facing: 1 | -1;
  state: DogState;
  patrolMinX: number;
  patrolMaxX: number;
  patrolDir: 1 | -1;
  alertTimer: number;
  searchTimer: number;
  blindedTimer: number;
  targetX: number;
  targetY: number;
  headAngle: number;
  eyeColor: string; // 'amber' | 'crimson'
  eyeIntensity: number; // 0 to 1
  animTimer: number;
  barkCooldown: number;
  snarlVolume: number;
  hasLineOfSight: boolean;
}

export interface Platform extends Box2D {
  id: string;
  type: 'solid' | 'metal_grate' | 'pipe' | 'ladder' | 'water' | 'crush_zone';
  color?: string;
  friction?: number;
}

export interface PushableBox extends Box2D {
  id: string;
  vx: number;
  vy: number;
  mass: number;
  isClimbable: boolean;
  isSteamPowered?: boolean;
}

export interface SteamValve {
  id: string;
  x: number;
  y: number;
  radius: number;
  isOpen: boolean;
  rotation: number;
  targetJetId: string;
  interactionPrompt: string;
}

export interface SteamJet {
  id: string;
  x: number;
  y: number;
  dx: number; // direction vector x
  dy: number; // direction vector y
  length: number;
  spread: number;
  active: boolean;
  pressure: number;
  blindDogs: boolean;
  canLiftPlayer?: boolean;
}

export interface Lever {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  isOn: boolean;
  connectedTargetId: string;
  type: 'piston_door' | 'whistle' | 'elevator';
}

export interface MovingPlatform extends Box2D {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  progress: number;
  speed: number;
  isActive: boolean;
}

export interface HangingChain {
  id: string;
  topX: number;
  topY: number;
  length: number;
  swingAngle: number;
  swingVel: number;
}

export interface PressurePlate extends Box2D {
  id: string;
  isPressed: boolean;
  targetElevatorId: string;
}

export interface Checkpoint {
  id: string;
  x: number;
  y: number;
  reached: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  color: string;
  type: 'steam' | 'spark' | 'smoke' | 'rain' | 'dust';
}

export interface LevelData {
  id: number;
  title: string;
  subtitle: string;
  width: number;
  height: number;
  spawnPoint: Vector2D;
  exitPoint: Box2D;
  platforms: Platform[];
  dogs: Dog[];
  pushables: PushableBox[];
  valves: SteamValve[];
  steamJets: SteamJet[];
  levers: Lever[];
  movingPlatforms: MovingPlatform[];
  chains: HangingChain[];
  pressurePlates: PressurePlate[];
  checkpoints: Checkpoint[];
  hidingSpots: Box2D[]; // areas where boy is occluded in dark/steam
  ambientFogColor: string;
  backgroundElements: {
    distance: number; // 0.1 (far) to 0.7 (near)
    type: 'chimney' | 'gear' | 'pipes' | 'ruins' | 'cables';
    x: number;
    y: number;
    w: number;
    h: number;
  }[];
}

export interface GameSettings {
  soundEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
  letterbox: boolean;
  filmGrain: boolean;
}
