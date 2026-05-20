import Phaser from 'phaser';
import { MARBLE_COLORS } from '../game/constants.js';

export class ResultsScene extends Phaser.Scene {
  constructor() {
    super('ResultsScene');
  }

  create(data) {
    const state = this.registry.get('gameState');
    const { results } = state;
    const winnings = data?.winnings ?? 0;

    const W = this.scale.width;
    const H = this.scale.height;

    this.add.rectangle(0, 0, W, H, 0x0a0a0f).setOrigin(0, 0);

    // Winner announcement
    const winnerDef = results.winnerId >= 0 ? MARBLE_COLORS[results.winnerId] : null;

    this.add.text(W / 2, 100, 'RACE OVER', {
      fontSize: '48px', fontFamily: 'Segoe UI', color: '#f0c040',
      fontStyle: 'bold', letterSpacing: 8,
    }).setOrigin(0.5);

    if (winnerDef) {
      this.add.circle(W / 2, 200, 40, winnerDef.color);
      this.add.circle(W / 2 - 14, 186, 12, winnerDef.glint, 0.7);
      this.add.text(W / 2, 255, `${winnerDef.name} WINS`, {
        fontSize: '28px', fontFamily: 'Segoe UI',
        color: `#${winnerDef.color.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
      }).setOrigin(0.5);
    }

    // Elimination order
    this.add.text(W / 2, 310, 'ELIMINATION ORDER', {
      fontSize: '13px', fontFamily: 'Segoe UI', color: '#888', letterSpacing: 4,
    }).setOrigin(0.5);

    const order = [...results.eliminationOrder];
    order.forEach((id, i) => {
      const def = MARBLE_COLORS[id];
      const x = W / 2 - ((order.length - 1) * 90) / 2 + i * 90;
      this.add.circle(x, 360, 18, def.color, i === 0 ? 1 : 0.5);
      this.add.text(x, 385, def.name, {
        fontSize: '11px', fontFamily: 'Segoe UI', color: i === 0 ? '#ff6b6b' : '#888',
      }).setOrigin(0.5);
      if (i === 0) {
        this.add.text(x, 400, '1ST OUT', {
          fontSize: '10px', fontFamily: 'Segoe UI', color: '#ff6b6b',
        }).setOrigin(0.5);
      }
    });

    // Payout
    const netChange = winnings - state.bets.reduce((s, b) => s + b.amount, 0);
    const payoutColor = winnings > 0 ? '#2ecc71' : '#e74c3c';
    this.add.text(W / 2, 440, winnings > 0 ? `YOU WON $${winnings}!` : 'No winning bets', {
      fontSize: '26px', fontFamily: 'Segoe UI', color: payoutColor, fontStyle: 'bold',
    }).setOrigin(0.5);

    const changeSign = netChange >= 0 ? '+' : '';
    this.add.text(W / 2, 475, `Net: ${changeSign}$${netChange}`, {
      fontSize: '16px', fontFamily: 'Segoe UI', color: netChange >= 0 ? '#2ecc71' : '#e74c3c',
    }).setOrigin(0.5);

    this.add.text(W / 2, 510, `Wallet: $${state.wallet}`, {
      fontSize: '20px', fontFamily: 'Segoe UI', color: '#fff', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Bet breakdown
    this.add.text(W / 2, 555, 'BET BREAKDOWN', {
      fontSize: '12px', fontFamily: 'Segoe UI', color: '#666', letterSpacing: 3,
    }).setOrigin(0.5);

    state.bets.forEach((bet, i) => {
      const won = isBetWon(bet, results);
      const color = won ? '#2ecc71' : '#e74c3c';
      const mark = won ? '✓' : '✗';
      this.add.text(W / 2, 575 + i * 22,
        `${mark} ${bet.label}: ${bet.targetName}  $${bet.amount} → $${Math.floor(bet.amount * bet.odds)}`, {
          fontSize: '13px', fontFamily: 'Segoe UI', color,
        }).setOrigin(0.5);
    });

    // Play again
    const btnY = H - 60;
    const btn = this.add.rectangle(W / 2, btnY, 220, 50, 0x27ae60)
      .setInteractive({ useHandCursor: true });
    this.add.text(W / 2, btnY, 'NEXT ROUND', {
      fontSize: '18px', fontFamily: 'Segoe UI', color: '#fff', fontStyle: 'bold',
    }).setOrigin(0.5);

    btn.on('pointerdown', () => this.scene.start('BettingScene'));
    btn.on('pointerover', () => btn.setFillStyle(0x2ecc71));
    btn.on('pointerout', () => btn.setFillStyle(0x27ae60));
  }
}

function isBetWon(bet, results) {
  switch (bet.type) {
    case 'winner':    return results.winnerId === bet.targetIndex;
    case 'first_out': return results.eliminationOrder[0] === bet.targetIndex;
    default:          return false;
  }
}
