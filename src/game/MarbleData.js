import { MARBLE_COLORS, MARBLE_MAX_HP } from './constants.js';

// Shared state passed between scenes
export class GameState {
  constructor() {
    this.wallet = 1000;
    this.bets = [];      // [{ type, targetIndex, amount, odds }]
    this.results = null; // set after a race
    this.roundNumber = 0;
  }

  reset() {
    this.bets = [];
    this.results = null;
    this.roundNumber++;
  }

  placeBet(bet) {
    this.bets.push(bet);
    this.wallet -= bet.amount;
  }

  settleBets(results) {
    let winnings = 0;
    for (const bet of this.bets) {
      if (isBetWon(bet, results)) {
        winnings += Math.floor(bet.amount * bet.odds);
      }
    }
    this.wallet += winnings;
    return winnings;
  }
}

function isBetWon(bet, results) {
  switch (bet.type) {
    case 'winner':
      return results.winnerId === bet.targetIndex;
    case 'first_out':
      return results.eliminationOrder[0] === bet.targetIndex;
    default:
      return false;
  }
}

export function makeMarbleData() {
  return MARBLE_COLORS.map((def, i) => ({
    id: i,
    name: def.name,
    color: def.color,
    glint: def.glint,
    hp: MARBLE_MAX_HP,
    alive: true,
    eliminatedAt: null, // round order of elimination (1 = first out)
  }));
}
