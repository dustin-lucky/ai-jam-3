import Phaser from 'phaser';
import { MARBLE_COLORS, STARTING_WALLET } from '../game/constants.js';
import { GameState, makeMarbleData } from '../game/MarbleData.js';

const BET_TYPES = [
  { type: 'winner',    label: 'Last Marble Standing', odds: 6.0 },
  { type: 'first_out', label: 'First to Shatter',     odds: 6.0 },
];

export class BettingScene extends Phaser.Scene {
  constructor() {
    super('BettingScene');
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
    this.add.rectangle(0, 0, W, H, 0x0a0a0f).setOrigin(0, 0);

    // Title
    this.add.text(W / 2, 36, 'MARBLE MAYHEM', {
      fontSize: '36px', fontFamily: 'Segoe UI', color: '#f0c040',
      fontStyle: 'bold', letterSpacing: 6,
    }).setOrigin(0.5, 0.5);

    this.add.text(W / 2, 70, `Round ${state.roundNumber + 1}`, {
      fontSize: '16px', fontFamily: 'Segoe UI', color: '#888',
    }).setOrigin(0.5, 0.5);

    // Wallet
    this.walletText = this.add.text(W - 20, 20, `$${state.wallet}`, {
      fontSize: '22px', fontFamily: 'Segoe UI', color: '#2ecc71', fontStyle: 'bold',
    }).setOrigin(1, 0);

    // Marble grid
    this.add.text(W / 2, 110, 'SELECT MARBLE', {
      fontSize: '13px', fontFamily: 'Segoe UI', color: '#aaa', letterSpacing: 4,
    }).setOrigin(0.5);

    this.marbleButtons = [];
    const cols = 8;
    const startX = W / 2 - ((cols - 1) * 110) / 2;

    for (let i = 0; i < MARBLE_COLORS.length; i++) {
      const def = MARBLE_COLORS[i];
      const x = startX + i * 110;
      const y = 175;

      const bg = this.add.rectangle(x, y, 95, 90, 0x1a1a2e, 1)
        .setInteractive({ useHandCursor: true })
        .setStrokeStyle(2, 0x333355);

      const circle = this.add.circle(x, y - 12, 22, def.color);
      this.add.circle(x - 8, y - 18, 6, def.glint, 0.6);

      const label = this.add.text(x, y + 24, def.name, {
        fontSize: '12px', fontFamily: 'Segoe UI', color: '#ccc',
      }).setOrigin(0.5);

      const odds = this.add.text(x, y + 38, `${BET_TYPES[0].odds}x`, {
        fontSize: '11px', fontFamily: 'Segoe UI', color: '#f0c040',
      }).setOrigin(0.5);

      bg.on('pointerdown', () => this.selectMarble(i));
      bg.on('pointerover', () => { if (this.selectedMarbleIndex !== i) bg.setFillStyle(0x252545); });
      bg.on('pointerout', () => { if (this.selectedMarbleIndex !== i) bg.setFillStyle(0x1a1a2e); });

      this.marbleButtons.push({ bg, circle, label, odds });
    }

    this.selectMarble(0);

    // Bet type selector
    this.add.text(W / 2, 275, 'BET TYPE', {
      fontSize: '13px', fontFamily: 'Segoe UI', color: '#aaa', letterSpacing: 4,
    }).setOrigin(0.5);

    this.betTypeButtons = [];
    BET_TYPES.forEach((bt, i) => {
      const x = W / 2 - 160 + i * 320;
      const y = 315;
      const bg = this.add.rectangle(x, y, 280, 44, 0x1a1a2e)
        .setInteractive({ useHandCursor: true })
        .setStrokeStyle(2, 0x333355);
      const txt = this.add.text(x, y, `${bt.label}  (${bt.odds}x)`, {
        fontSize: '14px', fontFamily: 'Segoe UI', color: '#ccc',
      }).setOrigin(0.5);

      bg.on('pointerdown', () => this.selectBetType(i));
      bg.on('pointerover', () => { if (this.selectedBetType !== bt) bg.setFillStyle(0x252545); });
      bg.on('pointerout', () => { if (this.selectedBetType !== bt) bg.setFillStyle(0x1a1a2e); });

      this.betTypeButtons.push({ bg, txt, bt });
    });

    this.selectBetType(0);

    // Bet amount
    this.add.text(W / 2, 375, 'BET AMOUNT', {
      fontSize: '13px', fontFamily: 'Segoe UI', color: '#aaa', letterSpacing: 4,
    }).setOrigin(0.5);

    const amounts = [10, 25, 50, 100, 250, 500];
    this.amountButtons = [];
    amounts.forEach((amt, i) => {
      const x = W / 2 - 275 + i * 110;
      const y = 415;
      const bg = this.add.rectangle(x, y, 95, 38, 0x1a1a2e)
        .setInteractive({ useHandCursor: true })
        .setStrokeStyle(2, 0x333355);
      const txt = this.add.text(x, y, `$${amt}`, {
        fontSize: '15px', fontFamily: 'Segoe UI', color: '#ccc', fontStyle: 'bold',
      }).setOrigin(0.5);

      bg.on('pointerdown', () => this.selectAmount(amt, i));
      bg.on('pointerover', () => { if (this.betAmount !== amt) bg.setFillStyle(0x252545); });
      bg.on('pointerout', () => { if (this.betAmount !== amt) bg.setFillStyle(0x1a1a2e); });

      this.amountButtons.push({ bg, txt, amt });
    });

    this.selectAmount(50, 2);

    // Bet summary
    this.betSummaryText = this.add.text(W / 2, 470, '', {
      fontSize: '16px', fontFamily: 'Segoe UI', color: '#f0c040', align: 'center',
    }).setOrigin(0.5);

    this.updateBetSummary();

    // Add bet button
    const addBetBg = this.add.rectangle(W / 2 - 100, 515, 180, 46, 0x27ae60)
      .setInteractive({ useHandCursor: true });
    this.add.text(W / 2 - 100, 515, '+ ADD BET', {
      fontSize: '16px', fontFamily: 'Segoe UI', color: '#fff', fontStyle: 'bold',
    }).setOrigin(0.5);

    addBetBg.on('pointerdown', () => this.addBet(state));
    addBetBg.on('pointerover', () => addBetBg.setFillStyle(0x2ecc71));
    addBetBg.on('pointerout', () => addBetBg.setFillStyle(0x27ae60));

    // Start race button
    const startBg = this.add.rectangle(W / 2 + 100, 515, 180, 46, 0xc0392b)
      .setInteractive({ useHandCursor: true });
    this.add.text(W / 2 + 100, 515, 'START RACE', {
      fontSize: '16px', fontFamily: 'Segoe UI', color: '#fff', fontStyle: 'bold',
    }).setOrigin(0.5);

    startBg.on('pointerdown', () => this.startRace());
    startBg.on('pointerover', () => startBg.setFillStyle(0xe74c3c));
    startBg.on('pointerout', () => startBg.setFillStyle(0xc0392b));

    // Active bets list
    this.add.text(W / 2, 570, 'YOUR BETS THIS ROUND', {
      fontSize: '12px', fontFamily: 'Segoe UI', color: '#666', letterSpacing: 3,
    }).setOrigin(0.5);

    this.betsListContainer = this.add.container(0, 0);
    this.refreshBetsList(state);
  }

  selectMarble(index) {
    if (this.marbleButtons[this.selectedMarbleIndex]) {
      this.marbleButtons[this.selectedMarbleIndex].bg.setFillStyle(0x1a1a2e).setStrokeStyle(2, 0x333355);
    }
    this.selectedMarbleIndex = index;
    this.marbleButtons[index].bg.setFillStyle(0x2a2a5e).setStrokeStyle(2, 0xf0c040);
    this.updateBetSummary();
  }

  selectBetType(index) {
    this.betTypeButtons.forEach(b => b.bg.setFillStyle(0x1a1a2e).setStrokeStyle(2, 0x333355));
    this.selectedBetType = BET_TYPES[index];
    this.betTypeButtons[index].bg.setFillStyle(0x2a2a5e).setStrokeStyle(2, 0xf0c040);
    this.updateBetSummary();
  }

  selectAmount(amt, index) {
    this.amountButtons.forEach(b => b.bg.setFillStyle(0x1a1a2e).setStrokeStyle(2, 0x333355));
    this.betAmount = amt;
    this.amountButtons[index].bg.setFillStyle(0x2a2a5e).setStrokeStyle(2, 0xf0c040);
    this.updateBetSummary();
  }

  updateBetSummary() {
    const state = this.registry.get('gameState');
    const marble = MARBLE_COLORS[this.selectedMarbleIndex];
    const payout = Math.floor(this.betAmount * this.selectedBetType.odds);
    const canAfford = state.wallet >= this.betAmount;
    this.betSummaryText?.setText(
      `${this.selectedBetType.label}: ${marble.name}  |  $${this.betAmount} → $${payout}  ${canAfford ? '' : '(insufficient funds)'}`
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
      const txt = this.add.text(W / 2, 592 + i * 22,
        `${bet.label}: ${bet.targetName}  $${bet.amount} → $${Math.floor(bet.amount * bet.odds)}`, {
          fontSize: '13px', fontFamily: 'Segoe UI', color: '#aaa',
        }).setOrigin(0.5);
      this.betsListContainer.add(txt);
    });
  }

  startRace() {
    this.scene.start('ArenaScene');
  }
}
