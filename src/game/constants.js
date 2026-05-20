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
  { name: 'Ruby',     color: 0xe74c3c, glint: 0xff8a80 },
  { name: 'Sapphire', color: 0x3498db, glint: 0x82cfff },
  { name: 'Emerald',  color: 0x2ecc71, glint: 0x80ffb2 },
  { name: 'Amber',    color: 0xf39c12, glint: 0xffd580 },
  { name: 'Amethyst', color: 0x9b59b6, glint: 0xd7a8f0 },
  { name: 'Obsidian', color: 0x2c3e50, glint: 0x7f8c8d },
  { name: 'Pearl',    color: 0xecf0f1, glint: 0xffffff },
  { name: 'Onyx',     color: 0xe67e22, glint: 0xffa040 },
];

export const BUMPER_POSITIONS = [
  { x: ARENA_CENTER_X, y: ARENA_CENTER_Y },
];

export const STARTING_WALLET = 1000;
