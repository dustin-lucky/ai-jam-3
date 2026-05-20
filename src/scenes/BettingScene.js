import Phaser from 'phaser';
import { MARBLE_COLORS, STARTING_WALLET } from '../game/constants.js';
import { GameState, makeMarbleData } from '../game/MarbleData.js';
import { drawLightStreaks, drawNeonRect } from '../game/drawStreaks.js';

const BET_TYPES = [
  { type: 'winner',    label: 'Last Marble Standing', odds: 6.0 },
  { type: 'first_out', label: 'First to Shatter',     odds: 6.0 },
];

export class BettingScene extends Phaser.Scene {
  constructor() {
    super('BettingScene');
  }

  preload() {
    for (const def of MARBLE_COLORS) {
      this.load.image(def.key, `/marbles/${def.name.toLowerCase()}.png`);
    }
  }

  create() {
    if (!this.registry.get('gameState')) {
      const state = new GameState();
      state.wallet = STARTING_WALLET;
      this.registry.set('gameState', state);
    }

    const state = this.registry.get('gameState');
    state.reset();
    state.marbles = makeMarbleData();

    this.selectedBetType = BET_TYPES[0];
    this.selectedMarbleIndex = 0;
    this.betAmount = 50;

    this.buildUI(state);
  }

  buildUI(state) {
    const W = this.scale.width;
    const H = this.scale.height;

    this.betSummaryText = null;

    // Background panel
    this.add.rectangle(0, 0, W, H, 0x000000).setOrigin(0, 0);
    drawLightStreaks(this);

    // Title
    this.add.text(W / 2, 36, 'MARBLE MAYHEM', {
      fontSize: '48px', fontFamily: 'Barlow Condensed', color: '#fc6b23',
      fontStyle: 'bold', letterSpacing: 6,
    }).setOrigin(0.5, 0.5);

    this.add.text(W / 2, 72, `Round ${state.roundNumber + 1}`, {
      fontSize: '20px', fontFamily: 'Barlow Condensed', color: '#fbf4db',
    }).setOrigin(0.5, 0.5);

    // Wallet
    this.walletText = this.add.text(W - 20, 20, `$${state.wallet}`, {
      fontSize: '26px', fontFamily: 'Barlow Condensed', color: '#2afeff', fontStyle: 'bold',
    }).setOrigin(1, 0);

    // Marble grid
    this.add.text(W / 2, 96, 'BACK YOUR MARBLE', {
      fontSize: '16px', fontFamily: 'Barlow Condensed', color: '#fbf4db', letterSpacing: 4,
    }).setOrigin(0.5);

    this.marbleButtons = [];
    const cols = 4;
    const colSpacing = 148;
    const rowSpacing = 124;
    const startX = W / 2 - (cols - 1) * colSpacing / 2;
    const startY = 185;

    for (let i = 0; i < MARBLE_COLORS.length; i++) {
      const def = MARBLE_COLORS[i];
      const x = startX + (i % cols) * colSpacing;
      const y = startY + Math.floor(i / cols) * rowSpacing;

      const bg = this.add.rectangle(x, y, 130, 112, 0x111111, 1)
        .setInteractive({ useHandCursor: true });

      const glow = this.add.graphics();
      drawNeonRect(glow, x, y, 130, 112, 0x9500c6, 0.35);

      this.add.image(x, y - 16, def.key).setDisplaySize(72, 72);

      this.add.text(x, y + 38, def.name, {
        fontSize: '15px', fontFamily: 'Barlow Condensed', color: '#fbf4db',
      }).setOrigin(0.5);

      bg.on('pointerdown', () => this.selectMarble(i));
      bg.on('pointerover', () => { if (this.selectedMarbleIndex !== i) bg.setFillStyle(0x1a1a1a); });
      bg.on('pointerout', () => { if (this.selectedMarbleIndex !== i) bg.setFillStyle(0x111111); });

      this.marbleButtons.push({ bg, glow, cx: x, cy: y });
    }

    this.selectMarble(0);

    // Bet type selector
    this.add.text(W / 2, 380, 'YOUR CALL', {
      fontSize: '16px', fontFamily: 'Barlow Condensed', color: '#fbf4db', letterSpacing: 4,
    }).setOrigin(0.5);

    this.betTypeButtons = [];
    BET_TYPES.forEach((bt, i) => {
      const x = W / 2 - 160 + i * 320;
      const y = 415;
      const bg = this.add.rectangle(x, y, 280, 44, 0x111111)
        .setInteractive({ useHandCursor: true });

      const glow = this.add.graphics();
      drawNeonRect(glow, x, y, 280, 44, 0x9500c6, 0.35);

      const txt = this.add.text(x, y, `${bt.label}  (${bt.odds}x)`, {
        fontSize: '17px', fontFamily: 'Barlow Condensed', color: '#fbf4db',
      }).setOrigin(0.5);

      bg.on('pointerdown', () => this.selectBetType(i));
      bg.on('pointerover', () => { if (this.selectedBetType !== bt) bg.setFillStyle(0x1a1a1a); });
      bg.on('pointerout', () => { if (this.selectedBetType !== bt) bg.setFillStyle(0x111111); });

      this.betTypeButtons.push({ bg, glow, txt, bt, cx: x, cy: y });
    });

    this.selectBetType(0);

    // Bet amount
    this.add.text(W / 2, 468, 'YOUR STAKE', {
      fontSize: '16px', fontFamily: 'Barlow Condensed', color: '#fbf4db', letterSpacing: 4,
    }).setOrigin(0.5);

    const amounts = [10, 25, 50, 100, 250, 500];
    this.amountButtons = [];
    amounts.forEach((amt, i) => {
      const x = W / 2 - 275 + i * 110;
      const y = 503;
      const bg = this.add.rectangle(x, y, 95, 38, 0x111111)
        .setInteractive({ useHandCursor: true });

      const glow = this.add.graphics();
      drawNeonRect(glow, x, y, 95, 38, 0x9500c6, 0.35);

      const txt = this.add.text(x, y, `$${amt}`, {
        fontSize: '18px', fontFamily: 'Barlow Condensed', color: '#fbf4db', fontStyle: 'bold',
      }).setOrigin(0.5);

      bg.on('pointerdown', () => this.selectAmount(amt, i));
      bg.on('pointerover', () => { if (this.betAmount !== amt) bg.setFillStyle(0x1a1a1a); });
      bg.on('pointerout', () => { if (this.betAmount !== amt) bg.setFillStyle(0x111111); });

      this.amountButtons.push({ bg, glow, txt, amt, cx: x, cy: y });
    });

    this.selectAmount(50, 2);

    // Bet summary
    this.betSummaryText = this.add.text(W / 2, 548, '', {
      fontSize: '19px', fontFamily: 'Barlow Condensed', color: '#fc6b23', align: 'center',
    }).setOrigin(0.5);

    this.updateBetSummary();

    // Add bet button
    const addBetBg = this.add.rectangle(W / 2 - 100, 583, 180, 46, 0xfc6b23)
      .setInteractive({ useHandCursor: true });
    const addBetGlow = this.add.graphics();
    drawNeonRect(addBetGlow, W / 2 - 100, 583, 180, 46, 0xfb009f, 0.7);
    this.add.text(W / 2 - 100, 583, 'LOCK IT IN', {
      fontSize: '19px', fontFamily: 'Barlow Condensed', color: '#000000', fontStyle: 'bold',
    }).setOrigin(0.5);

    addBetBg.on('pointerdown', () => this.addBet(state));
    addBetBg.on('pointerover', () => addBetBg.setFillStyle(0xfb009f));
    addBetBg.on('pointerout', () => addBetBg.setFillStyle(0xfc6b23));

    // Start race button
    const startBg = this.add.rectangle(W / 2 + 100, 583, 180, 46, 0xf8050e)
      .setInteractive({ useHandCursor: true });
    const startGlow = this.add.graphics();
    drawNeonRect(startGlow, W / 2 + 100, 583, 180, 46, 0xfb009f, 0.7);
    this.add.text(W / 2 + 100, 583, "LET'S GO", {
      fontSize: '19px', fontFamily: 'Barlow Condensed', color: '#fbf4db', fontStyle: 'bold',
    }).setOrigin(0.5);

    startBg.on('pointerdown', () => this.startRace());
    startBg.on('pointerover', () => startBg.setFillStyle(0xfb009f));
    startBg.on('pointerout', () => startBg.setFillStyle(0xf8050e));

    // Active bets list
    this.add.text(W / 2, 643, 'YOUR BETS', {
      fontSize: '15px', fontFamily: 'Barlow Condensed', color: '#fbf4db', letterSpacing: 3,
    }).setOrigin(0.5);

    this.betsListContainer = this.add.container(0, 0);
    this.refreshBetsList(state);
  }

  selectMarble(index) {
    const prev = this.marbleButtons[this.selectedMarbleIndex];
    if (prev) {
      prev.bg.setFillStyle(0x111111);
      prev.glow.clear();
      drawNeonRect(prev.glow, prev.cx, prev.cy, 130, 112, 0x9500c6, 0.35);
    }
    this.selectedMarbleIndex = index;
    const sel = this.marbleButtons[index];
    sel.bg.setFillStyle(0x1a0800);
    sel.glow.clear();
    drawNeonRect(sel.glow, sel.cx, sel.cy, 130, 112, 0xfc6b23, 1.0);
    this.updateBetSummary();
  }

  selectBetType(index) {
    this.betTypeButtons.forEach(b => {
      b.bg.setFillStyle(0x111111);
      b.glow.clear();
      drawNeonRect(b.glow, b.cx, b.cy, 280, 44, 0x9500c6, 0.35);
    });
    this.selectedBetType = BET_TYPES[index];
    const sel = this.betTypeButtons[index];
    sel.bg.setFillStyle(0x1a0800);
    sel.glow.clear();
    drawNeonRect(sel.glow, sel.cx, sel.cy, 280, 44, 0xfc6b23, 1.0);
    this.updateBetSummary();
  }

  selectAmount(amt, index) {
    this.amountButtons.forEach(b => {
      b.bg.setFillStyle(0x111111);
      b.glow.clear();
      drawNeonRect(b.glow, b.cx, b.cy, 95, 38, 0x9500c6, 0.35);
    });
    this.betAmount = amt;
    const sel = this.amountButtons[index];
    sel.bg.setFillStyle(0x1a0800);
    sel.glow.clear();
    drawNeonRect(sel.glow, sel.cx, sel.cy, 95, 38, 0xfc6b23, 1.0);
    this.updateBetSummary();
  }

  updateBetSummary() {
    const state = this.registry.get('gameState');
    const marble = MARBLE_COLORS[this.selectedMarbleIndex];
    const payout = Math.floor(this.betAmount * this.selectedBetType.odds);
    const canAfford = state.wallet >= this.betAmount;
    this.betSummaryText?.setText(
      `${this.selectedBetType.label}: ${marble.name}  |  $${this.betAmount} → $${payout}  ${canAfford ? '' : '— not enough chips'}`
    );
  }

  addBet(state) {
    if (state.wallet < this.betAmount) return;
    state.placeBet({
      type: this.selectedBetType.type,
      label: this.selectedBetType.label,
      targetIndex: this.selectedMarbleIndex,
      targetName: MARBLE_COLORS[this.selectedMarbleIndex].name,
      amount: this.betAmount,
      odds: this.selectedBetType.odds,
    });
    this.walletText.setText(`$${state.wallet}`);
    this.updateBetSummary();
    this.refreshBetsList(state);
  }

  refreshBetsList(state) {
    this.betsListContainer.removeAll(true);
    const W = this.scale.width;
    state.bets.forEach((bet, i) => {
      const txt = this.add.text(W / 2, 663 + i * 22,
        `${bet.label}: ${bet.targetName}  $${bet.amount} → $${Math.floor(bet.amount * bet.odds)}`, {
          fontSize: '16px', fontFamily: 'Barlow Condensed', color: '#fbf4db',
        }).setOrigin(0.5);
      this.betsListContainer.add(txt);
    });
  }

  startRace() {
    this.scene.start('ArenaScene');
  }
}
