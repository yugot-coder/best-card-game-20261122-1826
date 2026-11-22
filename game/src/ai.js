// Ember Pact — the opponent's brain. A heuristic player: it values lethal
// above all, then damage, then survival, and it reads the player's threat.
import { FOES } from './cards.js';

/** Value one card in the foe's hand, in the current position. Higher is better. */
export function scoreFoeCard(state, card) {
  const foe = state.foe;
  const player = state.player;
  const def = state.foeDef;
  const e = card.effect;
  const aggr = def ? def.aggression : 1;
  let value = 0;
  if (e.dmg) {
    value += e.dmg * 1.15 * aggr;
    if (e.dmg >= player.hp + player.block) value += 1000; // lethal
    if (player.hp <= 10) value += e.dmg * 0.4; // smell blood
  }
  if (e.block) {
    // Block matters most when the foe is fragile or the player hits hard.
    // A healthy foe races: block is worth little while it can still win the race.
    const playerThreat = player.hand.reduce((s, c) => s + (c.effect.dmg || 0), 0);
    const urgency = foe.hp < foe.maxHp * 0.4 ? 1.25 : foe.hp < foe.maxHp * 0.65 ? 0.8 : 0.3;
    value += e.block * urgency * Math.min(1.4, 0.5 + playerThreat / 20);
  }
  if (e.heal) value += e.heal * (foe.hp < foe.maxHp * 0.5 ? 1.15 : 0.35);
  if (e.draw) value += e.draw * 1.6;
  if (e.mana) value += e.mana * 2.2;
  if (e.burn) value += e.burn.amount * e.burn.turns * 0.9;
  if (e.thorns) value += e.thorns * 0.8 + (e.block || 0) * 0.3;
  if (e.chill) value += 4 + player.block * 0.5;
  // Efficiency: a cheap card that does the same work is worth more.
  value -= card.cost * 1.5;
  return value;
}

/** Index of the best affordable card in the foe's hand, or -1 to end the turn. */
export function chooseFoeCard(state) {
  const foe = state.foe;
  let best = -1;
  let bestValue = 0.5; // a card must be worth playing
  for (let i = 0; i < foe.hand.length; i += 1) {
    const card = foe.hand[i];
    if (card.cost > foe.mana) continue;
    const value = scoreFoeCard(state, card);
    if (value > bestValue) {
      bestValue = value;
      best = i;
    }
  }
  return best;
}

/** The same brain, offered to a human player as a "suggested play" hint. */
export function suggestPlayerCard(state) {
  const player = state.player;
  const foe = state.foe;
  let best = -1;
  let bestValue = 0.5;
  for (let i = 0; i < player.hand.length; i += 1) {
    const card = player.hand[i];
    if (card.cost > player.mana) continue;
    const fake = { ...state, foe: player, player: foe, foeDef: { aggression: 1 } };
    const value = scoreFoeCard(fake, card);
    if (value > bestValue) {
      bestValue = value;
      best = i;
    }
  }
  return best;
}

export { FOES };
