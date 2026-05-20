import Phaser from 'phaser';
import { drawNeonRect } from '../game/drawStreaks.js';
import {
  ARENA_CENTER_X, ARENA_CENTER_Y, ARENA_RADIUS,
  MARBLE_RADIUS, MARBLE_COUNT, MARBLE_MAX_HP,
  DAMAGE_SPEED_FACTOR, DAMAGE_CONE_HALF_ANGLE,
  LAUNCH_SPEED_MIN, LAUNCH_SPEED_MAX,
  BUMPER_POSITIONS, MARBLE_COLORS,
} from '../game/constants.js';

const WALL_SEGMENTS = 64;
const BUMPER_RADIUS = 22;

export class ArenaScene extends Phaser.Scene {
  constructor() {
    super('ArenaScene');
  }

  create() {
    const state = this.registry.get('gameState');
    this.marbleData = state.marbles;
    this.eliminationCount = 0;
    this.raceOver = false;

    this.buildArena();
    this.buildBumpers();
    this.buildPerimeterObstacles();
    this.spawnMarbles();
    this.setupCollisions();
    this.buildHUD(state);

    // Launch marbles after a short delay
    this.raceStartTime = null;
    this.time.delayedCall(800, () => {
      this.launchMarbles();
      this.raceStartTime = this.time.now;
    });
  }

  buildArena() {
    const gfx = this.add.graphics();

    // Arena floor
    gfx.fillStyle(0x0a0a0a, 1);
    gfx.fillCircle(ARENA_CENTER_X, ARENA_CENTER_Y, ARENA_RADIUS);

    // Arena border ring (decorative)
    gfx.lineStyle(6, 0xfc6b23, 1);
    gfx.strokeCircle(ARENA_CENTER_X, ARENA_CENTER_Y, ARENA_RADIUS);
    gfx.lineStyle(2, 0xfb009f, 0.5);
    gfx.strokeCircle(ARENA_CENTER_X, ARENA_CENTER_Y, ARENA_RADIUS - 8);

    // Circular physics wall using many static line segments
    const segments = WALL_SEGMENTS;
    for (let i = 0; i < segments; i++) {
      const a1 = (i / segments) * Math.PI * 2;
      const a2 = ((i + 1) / segments) * Math.PI * 2;
      const x1 = ARENA_CENTER_X + Math.cos(a1) * ARENA_RADIUS;
      const y1 = ARENA_CENTER_Y + Math.sin(a1) * ARENA_RADIUS;
      const x2 = ARENA_CENTER_X + Math.cos(a2) * ARENA_RADIUS;
      const y2 = ARENA_CENTER_Y + Math.sin(a2) * ARENA_RADIUS;

      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const len = Phaser.Math.Distance.Between(x1, y1, x2, y2);
      const angle = Math.atan2(y2 - y1, x2 - x1);

      this.matter.add.rectangle(midX, midY, len, 4, {
        isStatic: true,
        angle,
        friction: 0,
        restitution: 0.85,
        label: 'wall',
        collisionFilter: { category: 0x0001, mask: 0x0002 },
      });
    }
  }

  buildBumpers() {
    const gfx = this.add.graphics();

    for (const pos of BUMPER_POSITIONS) {
      gfx.fillStyle(0x173dff, 1);
      gfx.fillCircle(pos.x, pos.y, BUMPER_RADIUS);
      gfx.lineStyle(3, 0x2afeff, 1);
      gfx.strokeCircle(pos.x, pos.y, BUMPER_RADIUS);

      this.matter.add.circle(pos.x, pos.y, BUMPER_RADIUS, {
        isStatic: true,
        friction: 0,
        restitution: 1.1,
        label: 'bumper',
        collisionFilter: { category: 0x0001, mask: 0x0002 },
      });
    }
  }

  buildPerimeterObstacles() {
    const COUNT = 4;
    const SIZE  = 26;
    // Marble spawns are at angles (i/8)*2π — offset by half a gap (π/8) to avoid overlap.
    // Centers sit exactly on the arena edge so they're half-in, half-out.
    const ANGLE_OFFSET = Math.PI / 8;

    this.perimeterObstacles = [];
    this.obstacleGraphics = this.add.graphics();

    for (let i = 0; i < COUNT; i++) {
      const angle = ANGLE_OFFSET + (i / COUNT) * Math.PI * 2;
      const x = ARENA_CENTER_X + Math.cos(angle) * ARENA_RADIUS;
      const y = ARENA_CENTER_Y + Math.sin(angle) * ARENA_RADIUS;

      const body = this.matter.add.rectangle(x, y, SIZE, SIZE, {
        isStatic: true,
        friction: 0.1,
        restitution: 0.9,
        label: 'perim_obstacle',
        collisionFilter: { category: 0x0001, mask: 0x0002 },
      });

      // Alternate CW / CCW, vary speed slightly per obstacle
      const dir = i % 2 === 0 ? 1 : -1;
      const rotSpeed = dir * (0.012 + (i % 3) * 0.005);

      this.perimeterObstacles.push({ body, rotSpeed });
    }
  }

  updatePerimeterObstacles() {
    const hw = 13;  // half of SIZE=26

    this.obstacleGraphics.clear();

    for (const obs of this.perimeterObstacles) {
      const newAngle = obs.body.angle + obs.rotSpeed;
      Phaser.Physics.Matter.Matter.Body.setAngle(obs.body, newAngle);

      // Draw rotated square
      const { x, y } = obs.body.position;
      const cos = Math.cos(newAngle);
      const sin = Math.sin(newAngle);

      const corners = [
        { x: x + (-hw * cos - -hw * sin), y: y + (-hw * sin + -hw * cos) },
        { x: x + ( hw * cos - -hw * sin), y: y + ( hw * sin + -hw * cos) },
        { x: x + ( hw * cos -  hw * sin), y: y + ( hw * sin +  hw * cos) },
        { x: x + (-hw * cos -  hw * sin), y: y + (-hw * sin +  hw * cos) },
      ];

      this.obstacleGraphics.fillStyle(0xf8050e, 1);
      this.obstacleGraphics.fillPoints(corners, true);
      this.obstacleGraphics.lineStyle(2, 0xfb009f, 1);
      this.obstacleGraphics.strokePoints(corners, true);
    }
  }


  spawnMarbles() {
    this.marbles = [];
    this.shadowGraphics = this.add.graphics();
    this.marbleSprites = [];

    for (let i = 0; i < MARBLE_COUNT; i++) {
      const angle = (i / MARBLE_COUNT) * Math.PI * 2;
      const spawnRadius = ARENA_RADIUS - MARBLE_RADIUS - 10;
      const x = ARENA_CENTER_X + Math.cos(angle) * spawnRadius;
      const y = ARENA_CENTER_Y + Math.sin(angle) * spawnRadius;

      const body = this.matter.add.circle(x, y, MARBLE_RADIUS, {
        friction: 0,
        frictionAir: 0.005,
        restitution: 0.9,
        density: 0.002,
        label: `marble_${i}`,
        collisionFilter: { category: 0x0002, mask: 0x0001 | 0x0002 },
      });

      const sprite = this.add.image(x, y, MARBLE_COLORS[i].key)
        .setDisplaySize(MARBLE_RADIUS * 2, MARBLE_RADIUS * 2);
      this.marbleSprites.push(sprite);

      this.marbles.push({ body, id: i, data: this.marbleData[i], visualAngle: 0, angularVel: 0 });
    }

    this.renderMarbles();
  }

  launchMarbles() {
    for (const marble of this.marbles) {
      if (!marble.data.alive) continue;
      const angle = Math.atan2(
        marble.body.position.y - ARENA_CENTER_Y,
        marble.body.position.x - ARENA_CENTER_X,
      );
      // Clockwise tangent in screen space is (-sin, cos)
      const speed = Phaser.Math.FloatBetween(LAUNCH_SPEED_MIN, LAUNCH_SPEED_MAX);
      this.matter.body.setVelocity(marble.body, {
        x: -Math.sin(angle) * speed / 60,
        y:  Math.cos(angle) * speed / 60,
      });
    }
  }

  setupCollisions() {
    this.matter.world.on('collisionstart', (event) => {
      for (const pair of event.pairs) {
        const { bodyA, bodyB } = pair;
        this.handleCollision(bodyA, bodyB, pair);
      }
    });
  }

  handleCollision(bodyA, bodyB, pair) {
    const aIsMarble = bodyA.label?.startsWith('marble_');
    const bIsMarble = bodyB.label?.startsWith('marble_');

    if (!aIsMarble || !bIsMarble) return;

    const idA = parseInt(bodyA.label.split('_')[1]);
    const idB = parseInt(bodyB.label.split('_')[1]);
    const marbleA = this.marbles[idA];
    const marbleB = this.marbles[idB];

    if (!marbleA?.data.alive || !marbleB?.data.alive) return;

    const vA = bodyA.velocity;
    const vB = bodyB.velocity;

    // Relative velocity of A toward B
    const relVx = vA.x - vB.x;
    const relVy = vA.y - vB.y;
    const relSpeed = Math.sqrt(relVx * relVx + relVy * relVy);

    if (relSpeed < 0.5) return; // ignore micro-collisions

    // Direction from A to B (collision normal approximation)
    const dx = bodyB.position.x - bodyA.position.x;
    const dy = bodyB.position.y - bodyA.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = dx / dist;
    const ny = dy / dist;

    // Dot velocity of A with the collision direction → how head-on is A hitting B
    const speedA = Math.sqrt(vA.x * vA.x + vA.y * vA.y);
    const speedB = Math.sqrt(vB.x * vB.x + vB.y * vB.y);

    const damageToB = this.calcDamage(vA, speedA, nx, ny);
    const damageToA = this.calcDamage(vB, speedB, -nx, -ny);

    const dirA = Math.atan2(vA.y, vA.x);
    const dirB = Math.atan2(vB.y, vB.x);
    // Impact point = victim surface facing the attacker
    const hitBx = bodyB.position.x - nx * MARBLE_RADIUS;
    const hitBy = bodyB.position.y - ny * MARBLE_RADIUS;
    const hitAx = bodyA.position.x + nx * MARBLE_RADIUS;
    const hitAy = bodyA.position.y + ny * MARBLE_RADIUS;

    this.applyDamage(marbleB, damageToB, hitBx, hitBy, dirA);
    this.applyDamage(marbleA, damageToA, hitAx, hitAy, dirB);

    // Tangential spin kick from collision
    const tanX = -ny, tanY = nx;
    const relVTan = (vA.x - vB.x) * tanX + (vA.y - vB.y) * tanY;
    marbleA.angularVel += relVTan * 0.06;
    marbleB.angularVel -= relVTan * 0.06;
  }

  calcDamage(vel, speed, nx, ny) {
    if (speed < 0.1) return 0;
    // Dot product of normalised velocity with collision direction
    const dot = (vel.x / speed) * nx + (vel.y / speed) * ny;
    // dot = 1 → perfectly head-on, dot < cos(cone) → outside cone
    const cosThreshold = Math.cos(DAMAGE_CONE_HALF_ANGLE);
    if (dot < cosThreshold) return 0;
    // Scale from threshold→1 mapped to 0→1
    const directionalFactor = (dot - cosThreshold) / (1 - cosThreshold);
    return speed * directionalFactor * DAMAGE_SPEED_FACTOR * 100;
  }

  applyDamage(marble, amount, hitX, hitY, dirAngle) {
    if (amount <= 0 || !marble.data.alive) return;
    marble.data.hp = Math.max(0, marble.data.hp - amount);
    this.damageParticles(marble.data.color, marble.data.glint, hitX, hitY, dirAngle, amount);
    if (marble.data.hp <= 0) {
      this.eliminateMarble(marble);
    }
  }

  damageParticles(color, glint, x, y, dirAngle, amount) {
    const t      = Phaser.Math.Clamp(amount / (MARBLE_MAX_HP * 0.25), 0, 1); // 0→1 over 0–25% HP
    const count  = Math.round(Phaser.Math.Linear(6, 22, t));
    const spread = Phaser.Math.Linear(Math.PI / 7, Math.PI / 5, t); // narrow spray even on big hits

    for (let i = 0; i < count; i++) {
      const isGlint = Math.random() < t * 0.4; // more glints on big hits
      const angle   = dirAngle + Phaser.Math.FloatBetween(-spread, spread);
      const dist    = Phaser.Math.FloatBetween(
        Phaser.Math.Linear(30,  80,  t),
        Phaser.Math.Linear(90,  280, t),
      );
      const size    = Phaser.Math.FloatBetween(
        Phaser.Math.Linear(2, 4, t),
        Phaser.Math.Linear(5, 13, t),
      );
      const dur     = Phaser.Math.Between(
        Math.round(Phaser.Math.Linear(180, 300, t)),
        Math.round(Phaser.Math.Linear(350, 650, t)),
      );

      const dot = this.add.circle(x, y, size, isGlint ? glint : color);
      this.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scaleX: 0.15,
        scaleY: 0.15,
        duration: dur,
        ease: 'Cubic.Out',
        onComplete: () => dot.destroy(),
      });
    }

    // Shockwave ring on significant hits
    if (t > 0.25) {
      const ring = this.add.circle(x, y, MARBLE_RADIUS * 0.5, color, 0);
      ring.setStrokeStyle(1.5, glint);
      this.tweens.add({
        targets: ring,
        scaleX: Phaser.Math.Linear(2, 5, t),
        scaleY: Phaser.Math.Linear(2, 5, t),
        alpha: 0,
        duration: Phaser.Math.Linear(200, 450, t),
        ease: 'Cubic.Out',
        onComplete: () => ring.destroy(),
      });
    }
  }

  eliminateMarble(marble) {
    marble.data.alive = false;
    marble.data.eliminatedAt = ++this.eliminationCount;

    this.marbleSprites[marble.id].setVisible(false);
    this.matter.world.remove(marble.body);

    // Shatter effect
    this.shatterEffect(marble.body.position.x, marble.body.position.y, marble.data.color);

    const alive = this.marbles.filter(m => m.data.alive);
    if (alive.length <= 1) {
      this.time.delayedCall(1200, () => this.endRace(alive[0]));
    }
  }

  shatterEffect(x, y, color) {
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = Phaser.Math.FloatBetween(80, 200);
      const shard = this.add.circle(x, y, Phaser.Math.FloatBetween(3, 7), color);
      this.tweens.add({
        targets: shard,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        duration: 600,
        ease: 'Cubic.Out',
        onComplete: () => shard.destroy(),
      });
    }
  }

  renderMarbles() {
    this.shadowGraphics.clear();

    for (const marble of this.marbles) {
      const sprite = this.marbleSprites[marble.id];
      if (!marble.data.alive) {
        sprite.setVisible(false);
        continue;
      }
      const { x, y } = marble.body.position;
      const hpFrac = marble.data.hp / MARBLE_MAX_HP;

      // Shadow
      this.shadowGraphics.fillStyle(0x000000, 0.3);
      this.shadowGraphics.fillCircle(x + 3, y + 3, MARBLE_RADIUS);

      // Position sprite, spin, and darken tint as HP drops
      sprite.setPosition(x, y);
      const v = marble.body.velocity;
      const speed = Math.sqrt(v.x * v.x + v.y * v.y);
      marble.angularVel = marble.angularVel * 0.995 + (speed / MARBLE_RADIUS) * 0.003;
      marble.visualAngle += marble.angularVel;
      sprite.setRotation(marble.visualAngle);
      // const brightness = Math.floor(60 + hpFrac * 195);
      // sprite.setTint(Phaser.Display.Color.GetColor(brightness, brightness, brightness));
    }
  }

  buildHUD(state) {
    const hudX = 920;
    this.add.rectangle(hudX, ARENA_CENTER_Y, 320, 620, 0x0d0d0d, 0.95).setOrigin(0, 0.5);
    const hudGlow = this.add.graphics();
    drawNeonRect(hudGlow, hudX + 160, ARENA_CENTER_Y, 320, 620, 0x9500c6, 0.6);
    this.add.text(hudX + 160, ARENA_CENTER_Y - 290, 'MARBLES', {
      fontSize: '16px', fontFamily: 'Barlow Condensed', color: '#fbf4db', letterSpacing: 4,
    }).setOrigin(0.5);

    this.hpBars = [];
    for (let i = 0; i < MARBLE_COUNT; i++) {
      const def = MARBLE_COLORS[i];
      const rowY = ARENA_CENTER_Y - 260 + i * 68;

      this.add.image(hudX + 32, rowY, def.key).setDisplaySize(38, 38);
      this.add.text(hudX + 58, rowY - 16, def.name, {
        fontSize: '15px', fontFamily: 'Barlow Condensed', color: '#fbf4db',
      });

      // HP bar background
      this.add.rectangle(hudX + 58, rowY + 14, 216, 10, 0x222222).setOrigin(0, 0.5);
      const bar = this.add.rectangle(hudX + 58, rowY + 14, 216, 10, def.color).setOrigin(0, 0.5);
      this.hpBars.push(bar);
    }

    // Wallet display
    this.add.text(hudX + 160, ARENA_CENTER_Y + 255, 'WALLET', {
      fontSize: '15px', fontFamily: 'Barlow Condensed', color: '#fbf4db', letterSpacing: 3,
    }).setOrigin(0.5);
    this.hudWalletText = this.add.text(hudX + 160, ARENA_CENTER_Y + 278, `$${state.wallet}`, {
      fontSize: '28px', fontFamily: 'Barlow Condensed', color: '#2afeff', fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  updateHUD() {
    for (let i = 0; i < MARBLE_COUNT; i++) {
      const md = this.marbleData[i];
      const bar = this.hpBars[i];
      if (!bar) continue;
      const frac = Math.max(0, md.hp / MARBLE_MAX_HP);
      bar.setScale(frac, 1);
      if (!md.alive) bar.setAlpha(0.2);
    }
  }

  endRace(winner) {
    if (this.raceOver) return;
    this.raceOver = true;

    const state = this.registry.get('gameState');
    state.results = {
      winnerId: winner?.data.id ?? -1,
      winnerName: winner?.data.name ?? 'None',
      eliminationOrder: this.marbleData
        .filter(m => m.eliminatedAt !== null)
        .sort((a, b) => a.eliminatedAt - b.eliminatedAt)
        .map(m => m.id),
    };

    const winnings = state.settleBets(state.results);

    this.time.delayedCall(500, () => {
      this.scene.start('ResultsScene', { winnings });
    });
  }

  sustainMarbleSpeed() {
    if (!this.raceStartTime) return;

    // Minimum speed ramps from START → END over RAMP_DURATION milliseconds
    const MIN_SPEED_START  = 8.0;
    const MIN_SPEED_END    = 16.0;
    const RAMP_DURATION_MS = 90_000; // 90 seconds

    const elapsed = this.time.now - this.raceStartTime;
    const t = Math.min(elapsed / RAMP_DURATION_MS, 1);
    const minSpeed = MIN_SPEED_START + (MIN_SPEED_END - MIN_SPEED_START) * t;

    for (const marble of this.marbles) {
      if (!marble.data.alive) continue;
      const { x: vx, y: vy } = marble.body.velocity;
      const speed = Math.sqrt(vx * vx + vy * vy);

      if (speed >= minSpeed) continue; // already fast enough

      if (speed < 0.001) {
        // Completely stopped — random kick up to minSpeed
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        this.matter.body.setVelocity(marble.body, {
          x: Math.cos(angle) * minSpeed,
          y: Math.sin(angle) * minSpeed,
        });
      } else {
        // Scale velocity up to minSpeed, preserving direction
        const scale = minSpeed / speed;
        this.matter.body.setVelocity(marble.body, {
          x: vx * scale,
          y: vy * scale,
        });
      }
    }
  }

  accelerateWallMarbles() {
    // A marble is "on the wall" when its center is within MARBLE_RADIUS of the boundary
    const CONTACT_DEPTH = MARBLE_RADIUS + 4;
    const BOOST = 1.018; // speed multiplier per frame while in contact

    for (const marble of this.marbles) {
      if (!marble.data.alive) continue;
      const dx = marble.body.position.x - ARENA_CENTER_X;
      const dy = marble.body.position.y - ARENA_CENTER_Y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < ARENA_RADIUS - CONTACT_DEPTH) continue;

      const { x: vx, y: vy } = marble.body.velocity;
      this.matter.body.setVelocity(marble.body, {
        x: vx * BOOST,
        y: vy * BOOST,
      });
    }
  }

  checkKillzone() {
    const killRadius = ARENA_RADIUS + MARBLE_RADIUS + 20;
    for (const marble of this.marbles) {
      if (!marble.data.alive) continue;
      const dx = marble.body.position.x - ARENA_CENTER_X;
      const dy = marble.body.position.y - ARENA_CENTER_Y;
      if (dx * dx + dy * dy > killRadius * killRadius) {
        this.eliminateMarble(marble);
      }
    }
  }

  update() {
    if (this.raceOver) return;
    this.sustainMarbleSpeed();
    this.accelerateWallMarbles();
    this.checkKillzone();
    this.updatePerimeterObstacles();
    this.renderMarbles();
    this.updateHUD();
  }
}
