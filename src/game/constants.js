export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const ARENA_CENTER_X = 520;
export const ARENA_CENTER_Y = 360;
export const ARENA_RADIUS = 350;

export const MARBLE_RADIUS = 14;
export const MARBLE_COUNT = 8;
export const MARBLE_MAX_HP = 1000;

// Damage is: base speed factor * directional multiplier
// Head-on (0 deg offset) = 1.0x, 45 deg offset = 0.0x
export const DAMAGE_SPEED_FACTOR = 0.4;
export const DAMAGE_CONE_HALF_ANGLE = Math.PI / 4; // 45 degrees each side

export const LAUNCH_SPEED_MIN = 200;
export const LAUNCH_SPEED_MAX = 350;

export const MARBLE_COLORS = [
  { name: 'Gravy',   key: 'marble_gravy',   color: 0x173dff, glint: 0x2afeff },
  { name: 'Chuff',   key: 'marble_chuff',   color: 0x4a0080, glint: 0xaa44ff },
  { name: 'Spiggot', key: 'marble_spiggot', color: 0xb8860b, glint: 0xfde054 },
  { name: 'Jeb',     key: 'marble_jeb',     color: 0x220066, glint: 0x9500c6 },
  { name: 'Bunt',    key: 'marble_bunt',    color: 0x1a6e1a, glint: 0x4aff4a },
  { name: 'Goose',   key: 'marble_goose',   color: 0xfde054, glint: 0xffffff },
  { name: 'Mick',    key: 'marble_mick',    color: 0xf8050e, glint: 0xfc6b23 },
  { name: 'Bud',     key: 'marble_bud',     color: 0x445566, glint: 0x99aabb },
];

export const BUMPER_POSITIONS = [
  { x: ARENA_CENTER_X, y: ARENA_CENTER_Y },
];

export const STARTING_WALLET = 1000;
