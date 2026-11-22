// Ember Pact — small deterministic random helpers and deck operations.
import { CARDS } from './cards.js';

/** Mulberry32: a tiny seeded PRNG so screenshot scenes replay identically. */
export function makeRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates shuffle, in place, using the given rng. */
export function shuffle(array, rng) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/** Draw `count` cards from a fighter's draw pile into its hand, reshuffling the discard pile when empty. */
export function drawCards(fighter, count, rng) {
  for (let n = 0; n < count; n += 1) {
    if (fighter.drawPile.length === 0) {
      if (fighter.discard.length === 0) return;
      fighter.drawPile = shuffle(fighter.discard.splice(0), rng);
    }
    fighter.hand.push(fighter.drawPile.pop());
  }
}

/** Pick `count` distinct random card ids from the catalogue. */
export function draftOptions(rng, count, excludeIds) {
  const pool = Object.keys(CARDS).filter((id) => !excludeIds.includes(id));
  shuffle(pool, rng);
  return pool.slice(0, count);
}
