// Ember Pact — the rules engine. Pure game logic, no DOM: the renderer reads
// this state, and the screenshot scenes drive it headlessly through the same calls.
import { CARDS, FOES, startingDeck } from './cards.js';
import { drawCards, makeRng, shuffle, draftOptions } from './deck.js';
import { chooseFoeCard } from './ai.js';

export const HAND_SIZE = 5;
export const PLAYER_MAX_HP = 30;
export const TOTAL_ROUNDS = 3;
/** The keepers' embers burn hot: every foe attack deals +2 damage. */
export const FOE_DAMAGE_BONUS = 3;

/** A fresh fighter (player or foe) from a list of card ids. */
export function makeFighter(hp, deckIds, rng) {
  const deck = deckIds.map((id) => ({ ...CARDS[id] }));
  return {
    hp, maxHp: hp, block: 0, burn: 0, burnTurns: 0, thorns: 0, turns: 0,
    mana: 0, maxMana: 3, deck, drawPile: shuffle(deck.slice(), rng),
    discard: [], hand: [],
  };
}

export function newCampaign(seed) {
  const rng = makeRng(seed);
  const state = {
    rng, seed,
    screen: 'title',
    round: 1,
    score: 0,
    damageDealt: 0,
    cardsPlayed: 0,
    turn: 'player',
    turnCount: 0,
    log: [],
    lastPlayed: { player: null, foe: null },
    draftChoices: [],
    message: '',
    player: makeFighter(PLAYER_MAX_HP, startingDeck().map((c) => c.id), rng),
    foe: null,
    foeDef: null,
  };
  return state;
}

/** Begin a round against the foe of this round number. */
export function startRound(state) {
  const def = FOES[state.round - 1];
  state.foeDef = def;
  state.foe = makeFighter(def.hp, def.deck, state.rng);
  state.player.block = 0; state.player.burn = 0; state.player.burnTurns = 0; state.player.thorns = 0;
  state.player.discard = [];
  state.player.hand = [];
  state.player.drawPile = shuffle(state.player.deck.slice(), state.rng);
  state.screen = 'battle';
  state.turn = 'player';
  state.turnCount = 1;
  state.lastPlayed = { player: null, foe: null };
  state.log = [`Round ${state.round} — ${def.name}, ${def.title}, ${def.hp} HP.`];
  beginTurn(state, state.player, true);
}

function log(state, text) {
  state.log.unshift(text);
  if (state.log.length > 6) state.log.length = 6;
}

/** Start a fighter's turn: burn ticks, block fades, mana refills, hand drawn up. */
export function beginTurn(state, fighter, isPlayer) {
  fighter.block = 0;
  fighter.thorns = 0;
  if (fighter.burnTurns > 0) {
    const burn = fighter.burn;
    fighter.hp -= burn;
    fighter.burnTurns -= 1;
    if (fighter.burnTurns === 0) fighter.burn = 0;
    log(state, `${isPlayer ? 'You take' : `${state.foeDef.name} takes`} ${burn} Burn damage.`);
  }
  // Mana grows one a turn; the foe, keeper of the flame, runs one ahead
  // from its second turn on — but never out-mana's the player on turn one.
  fighter.maxMana = Math.min(10, 3 + fighter.turns + (isPlayer || fighter.turns === 0 ? 0 : 1));
  fighter.turns += 1;
  fighter.mana = fighter.maxMana;
  // The foe draws one card more each turn: more options, more pressure.
  drawCards(fighter, (isPlayer ? HAND_SIZE : HAND_SIZE + 1) - fighter.hand.length, state.rng);
}

/** Damage after Block, with Thorns reflected back at the attacker. */
export function dealDamage(state, attacker, defender, amount, isPlayerAttacker) {
  let remaining = amount;
  if (defender.block > 0) {
    const absorbed = Math.min(defender.block, remaining);
    defender.block -= absorbed;
    remaining -= absorbed;
  }
  if (remaining > 0) defender.hp -= remaining;
  if (isPlayerAttacker) state.damageDealt += amount;
  if (remaining > 0 && defender.thorns > 0) {
    attacker.hp -= defender.thorns;
    log(state, `Thorns reflect ${defender.thorns} damage!`);
  }
  return remaining;
}

/** Apply one card's effect. Returns false when the card cannot be played. */
export function playCard(state, side, handIndex) {
  const me = side === 'player' ? state.player : state.foe;
  const other = side === 'player' ? state.foe : state.player;
  const card = me.hand[handIndex];
  if (!card || me.mana < card.cost) return false;
  me.mana -= card.cost;
  me.hand.splice(handIndex, 1);
  me.discard.push(card);
  const e = card.effect;
  if (e.dmg) dealDamage(state, me, other, e.dmg + (side === 'foe' ? FOE_DAMAGE_BONUS : 0), side === 'player');
  if (e.block) me.block += e.block;
  if (e.heal) me.hp = Math.min(me.maxHp, me.hp + e.heal);
  if (e.draw) drawCards(me, e.draw, state.rng);
  if (e.mana) me.mana = Math.min(10, me.mana + e.mana);
  if (e.burn) { other.burn = e.burn.amount; other.burnTurns = e.burn.turns; }
  if (e.thorns) me.thorns = e.thorns;
  if (e.chill) other.block = 0;
  if (side === 'player') state.cardsPlayed += 1;
  state.lastPlayed[side] = card;
  const dmgShown = e.dmg ? e.dmg + (side === 'foe' ? FOE_DAMAGE_BONUS : 0) : 0;
  log(state, `${side === 'player' ? 'You play' : `${state.foeDef.name} plays`} ${card.name}${e.dmg ? ` for ${dmgShown}` : ''}${e.block ? `, +${e.block} Block` : ''}${e.heal ? `, heal ${e.heal}` : ''}.`);
  checkEnd(state);
  return true;
}

/** End the player's turn and let the foe act; returns the foe's played cards in order. */
export function endPlayerTurn(state) {
  state.turn = 'foe';
  state.turnCount += 1;
  const plays = [];
  beginTurn(state, state.foe, false);
  let guard = 0;
  while (guard < 12) {
    guard += 1;
    const idx = chooseFoeCard(state);
    if (idx === -1) break;
    const card = state.foe.hand[idx];
    playCard(state, 'foe', idx);
    plays.push(card);
    if (state.screen !== 'battle') break;
  }
  if (state.screen === 'battle') {
    state.turn = 'player';
    state.turnCount += 1;
    beginTurn(state, state.player, true);
  }
  return plays;
}

export function checkEnd(state) {
  if (state.screen !== 'battle') return;
  if (state.foe.hp <= 0) {
    state.foe.hp = 0;
    state.score += 150;
    if (state.round >= TOTAL_ROUNDS) {
      state.screen = 'win';
      state.message = `The Ember Queen falls. The last flame is yours — ${state.score} points.`;
      log(state, 'VICTORY! The campaign is won.');
    } else {
      state.screen = 'draft';
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + 6);
      state.draftChoices = draftOptions(state.rng, 3, []).map((id) => CARDS[id]);
      state.message = `${state.foeDef.name} is beaten! Heal 6, then choose a card to add to your deck.`;
      log(state, `${state.foeDef.name} defeated! +150 points.`);
    }
  } else if (state.player.hp <= 0) {
    state.player.hp = 0;
    state.screen = 'loss';
    state.message = `The flame gutters out in round ${state.round}, with ${state.score} points scored. The pact endures — try again.`;
    log(state, 'DEFEAT. Your flame goes out.');
  }
}

/** Add a drafted card to the deck and start the next round. */
export function pickDraftCard(state, index) {
  const card = state.draftChoices[index];
  if (!card) return false;
  state.player.deck.push({ ...card });
  state.round += 1;
  startRound(state);
  return true;
}

/** What the foe is about to do, readable from its hand — so the player can counter it. */
export function foeIntent(state) {
  if (!state.foe) return '';
  const hand = state.foe.hand;
  const dmg = hand.reduce((sum, c) => sum + (c.effect.dmg || 0), 0);
  const block = hand.reduce((sum, c) => sum + (c.effect.block || 0), 0);
  if (dmg >= state.player.hp && dmg > 0) return '⚠ Lethal strike brewing — guard or finish it!';
  if (dmg >= block + 4) return 'Gathering embers — plans to attack.';
  if (block > dmg) return 'Raising guard — plans to defend.';
  return 'Weighing the flames — unreadable.';
}
