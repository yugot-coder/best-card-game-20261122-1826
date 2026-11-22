// Ember Pact — deterministic screenshot scenes. Each one plays the real rules
// forward from a fresh campaign with a fixed seed, steered by a simple autopilot
// (play the highest-value affordable card, like the foe brain does), so every
// frame is what a real game looks like and the same seed always gives it.
//   ?shot=title  — the title screen
//   ?shot=battle — mid-duel in round 2, both hands on the table
//   ?shot=win    — the victory screen after beating the Ember Queen
//   ?shot=loss   — the defeat screen, outplayed in round 1
import { newCampaign, startRound, playCard, endPlayerTurn, pickDraftCard, checkEnd } from './engine.js';
import { chooseFoeCard } from './ai.js';
import { makeRng } from './deck.js';

/** Greedy autopilot: play the best affordable card until none is worth it. */
function autopilotTurn(state) {
  let guard = 0;
  while (guard < 12 && state.screen === 'battle') {
    guard += 1;
    let best = -1;
    let bestValue = 0.5;
    for (let i = 0; i < state.player.hand.length; i += 1) {
      const card = state.player.hand[i];
      if (card.cost > state.player.mana) continue;
      const fake = { ...state, foe: state.player, player: state.foe, foeDef: { aggression: 1 } };
      const value = scoreOf(fake, card);
      if (value > bestValue) { bestValue = value; best = i; }
    }
    if (best === -1) break;
    playCard(state, 'player', best);
  }
}

function scoreOf(state, card) {
  // Reuse the foe brain with the sides swapped: damage and block score the same.
  const e = card.effect;
  const foeThreat = state.foe.hand.reduce((s, c) => s + (c.effect.dmg || 0), 0);
  let value = 0;
  if (e.dmg) value += e.dmg * 1.15;
  if (e.block) value += e.block * (state.player.hp < 13 ? 1.3 : 0.75) * Math.min(1.5, 0.6 + foeThreat / 25);
  if (e.heal) value += e.heal * (state.player.hp < 15 ? 1.1 : 0.35);
  if (e.draw) value += e.draw * 1.6;
  if (e.mana) value += e.mana * 2.2;
  if (e.burn) value += e.burn.amount * e.burn.turns * 0.9;
  if (e.thorns) value += e.thorns * 0.8;
  if (e.chill) value += 4;
  value -= card.cost * 1.5;
  return value;
}

/** Play forward until the campaign reaches `wanted` ('win' | 'loss' | 'battle'). */
function playForward(state, wanted) {
  const rng = makeRng(state.seed + 7);
  startRound(state);
  let turns = 0;
  while (turns < 400) {
    turns += 1;
    if (wanted === 'battle' && state.round === 2 && state.screen === 'battle' && state.turnCount >= 3) return state;
    if (wanted === 'win' && state.screen === 'win') return state;
    if (wanted === 'loss' && state.screen === 'loss') return state;
    if (state.screen === 'draft') {
      // Draft the strongest offered card.
      let pick = 0;
      let bestPower = -1;
      state.draftChoices.forEach((c, i) => { if (c.power > bestPower) { bestPower = c.power; pick = i; } });
      pickDraftCard(state, pick);
      continue;
    }
    if (state.screen !== 'battle') return state;
    if (wanted === 'loss') {
      // A careless player: never play a card, just end the turn.
      endPlayerTurn(state);
      continue;
    }
    autopilotTurn(state);
    if (state.screen !== 'battle') continue;
    endPlayerTurn(state);
    void rng;
  }
  return state;
}

/** Stage the named scene on a fresh campaign and return the state to render. */
export function stageShot(name, seed) {
  const state = newCampaign(seed);
  if (name === 'title') return state;
  if (name === 'battle') return playForward(state, 'battle');
  if (name === 'win') return playForward(state, 'win');
  if (name === 'loss') return playForward(state, 'loss');
  return state;
}

export { chooseFoeCard };
