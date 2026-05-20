import Phaser from 'phaser';
import { MARBLE_COLORS } from '../game/constants.js';
import { drawLightStreaks } from '../game/drawStreaks.js';

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

    this.add.rectangle(0, 0, W, H, 0x000000).setOrigin(0, 0);
    drawLightStreaks(this);

    // Winner announcement
    const winnerDef = results.winnerId >= 0 ? MARBLE_COLORS[results.winnerId] : null;

    this.add.text(W / 2, 100, 'RACE OVER', {
      fontSize: '68px', fontFamily: 'Barlow Condensed', color: '#fc6b23',
      fontStyle: 'bold', letterSpacing: 8,
    }).setOrigin(0.5);

    if (winnerDef) {
      this.add.image(W / 2, 200, winnerDef.key).setDisplaySize(80, 80);
      this.add.text(W / 2, 255, `${winnerDef.name} WINS`, {
        fontSize: '38px', fontFamily: 'Barlow Condensed',
        color: `#${winnerDef.color.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
      }).setOrigin(0.5);
    }

    // Elimination order
    this.add.text(W / 2, 310, 'HOW IT WENT DOWN', {
      fontSize: '16px', fontFamily: 'Barlow Condensed', color: '#fbf4db', letterSpacing: 4,
    }).setOrigin(0.5);

    const order = [...results.eliminationOrder];
    order.forEach((id, i) => {
      const def = MARBLE_COLORS[id];
      const x = W / 2 - ((order.length - 1) * 90) / 2 + i * 90;
      this.add.image(x, 360, def.key).setDisplaySize(36, 36).setAlpha(i === 0 ? 1 : 0.5);
      this.add.text(x, 385, def.name, {
        fontSize: '14px', fontFamily: 'Barlow Condensed', color: i === 0 ? '#f8050e' : '#fbf4db',
      }).setOrigin(0.5);
      if (i === 0) {
        this.add.text(x, 402, '1ST OUT', {
          fontSize: '13px', fontFamily: 'Barlow Condensed', color: '#f8050e',
        }).setOrigin(0.5);
      }
    });

    // Payout
    const netChange = winnings - state.bets.reduce((s, b) => s + b.amount, 0);
    const payoutColor = winnings > 0 ? '#2afeff' : '#f8050e';
    this.add.text(W / 2, 440, winnings > 0 ? `NICE ONE! YOU WON $${winnings}` : 'Better luck next time.', {
      fontSize: '36px', fontFamily: 'Barlow Condensed', color: payoutColor, fontStyle: 'bold',
    }).setOrigin(0.5);

    const changeSign = netChange >= 0 ? '+' : '';
    this.add.text(W / 2, 480, `Net: ${changeSign}$${netChange}`, {
      fontSize: '20px', fontFamily: 'Barlow Condensed', color: netChange >= 0 ? '#2afeff' : '#f8050e',
    }).setOrigin(0.5);

    this.add.text(W / 2, 515, `Wallet: $${state.wallet}`, {
      fontSize: '24px', fontFamily: 'Barlow Condensed', color: '#fbf4db', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Bet breakdown
    this.add.text(W / 2, 558, 'HOW YOUR BETS LANDED', {
      fontSize: '15px', fontFamily: 'Barlow Condensed', color: '#fbf4db', letterSpacing: 3,
    }).setOrigin(0.5);

    state.bets.forEach((bet, i) => {
      const won = isBetWon(bet, results);
      const color = won ? '#2afeff' : '#f8050e';
      const mark = won ? '✓' : '✗';
      this.add.text(W / 2, 580 + i * 24,
        `${mark} ${bet.label}: ${bet.targetName}  $${bet.amount} → $${Math.floor(bet.amount * bet.odds)}`, {
          fontSize: '16px', fontFamily: 'Barlow Condensed', color,
        }).setOrigin(0.5);
    });

    // Play again
    const btnY = H - 60;
    const btn = this.add.rectangle(W / 2, btnY, 240, 54, 0xfc6b23)
      .setInteractive({ useHandCursor: true });
    this.add.text(W / 2, btnY, 'GO AGAIN', {
      fontSize: '22px', fontFamily: 'Barlow Condensed', color: '#000000', fontStyle: 'bold',
    }).setOrigin(0.5);

    btn.on('pointerdown', () => this.scene.start('BettingScene'));
    btn.on('pointerover', () => btn.setFillStyle(0xfb009f));
    btn.on('pointerout', () => btn.setFillStyle(0xfc6b23));
  }
}

function isBetWon(bet, results) {
  switch (bet.type) {
    case 'winner':    return results.winnerId === bet.targetIndex;
    case 'first_out': return results.eliminationOrder[0] === bet.targetIndex;
    default:          return false;
  }
}
