// Ember Pact — the renderer. Builds the table from engine state as plain DOM:
// cards are real elements you can click, hover and read at thumbnail size.
import { ELEMENTS } from './cards.js';
import { foeIntent } from './engine.js';

const app = document.getElementById('app');

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** One card face: cost pip, element art, big power number, name and rules text. */
export function cardElement(card, opts = {}) {
  const node = el('div', `card${opts.playable === false ? ' disabled' : ''}${opts.mini ? ' mini' : ''}${opts.back ? ' back' : ''}`);
  if (opts.back) {
    node.append(el('div', 'card-back-glyph', '✦'));
    node.append(el('div', 'card-back-name', 'EMBER PACT'));
    return node;
  }
  const element = ELEMENTS[card.element];
  const cost = el('div', 'cost', String(card.cost));
  node.append(cost);
  const art = el('div', 'art');
  art.style.background = `radial-gradient(circle at 50% 35%, ${element.color}, ${element.dark} 78%)`;
  art.append(el('span', 'glyph', element.glyph));
  node.append(art);
  node.append(el('div', 'power', String(card.power)));
  node.append(el('div', 'name', card.name));
  node.append(el('div', 'text', card.text));
  node.append(el('div', 'element-tag', element.name.toUpperCase()));
  if (opts.hint) node.append(el('div', 'hint', '★ suggested'));
  return node;
}

function hpBar(fighter, label) {
  const wrap = el('div', 'hp-wrap');
  const pct = Math.max(0, (fighter.hp / fighter.maxHp) * 100);
  wrap.append(el('div', 'hp-label', `${label}  ${fighter.hp} / ${fighter.maxHp} HP`));
  const bar = el('div', 'hp-bar');
  const fill = el('div', 'hp-fill');
  fill.style.width = `${pct}%`;
  fill.style.background = pct > 50 ? '#5da85a' : pct > 25 ? '#e8b93d' : '#e2483d';
  bar.append(fill);
  wrap.append(bar);
  const badges = el('div', 'badges');
  if (fighter.block > 0) badges.append(el('span', 'badge block', `🛡 ${fighter.block} Block`));
  if (fighter.burnTurns > 0) badges.append(el('span', 'badge burn', `🔥 Burn ${fighter.burn} × ${fighter.burnTurns}`));
  if (fighter.thorns > 0) badges.append(el('span', 'badge thorns', `🌵 Thorns ${fighter.thorns}`));
  wrap.append(badges);
  return wrap;
}

function manaPips(fighter) {
  const wrap = el('div', 'mana');
  wrap.append(el('span', 'mana-label', 'MANA'));
  for (let i = 0; i < fighter.maxMana; i += 1) {
    wrap.append(el('span', `pip${i < fighter.mana ? ' on' : ''}`, '◆'));
  }
  wrap.append(el('span', 'mana-num', `${fighter.mana}/${fighter.maxMana}`));
  return wrap;
}

function renderTitle(state) {
  const screen = el('div', 'screen title-screen');
  screen.append(el('div', 'title-glyph', '✦'));
  screen.append(el('h1', 'game-title', 'EMBER PACT'));
  screen.append(el('div', 'subtitle', 'A duel of cards against the keepers of the last flame'));
  const rules = el('div', 'howto');
  rules.innerHTML =
    '<b>How to play</b><br>' +
    '• Click a card to play it — each costs Mana, refilled every turn.<br>' +
    '• Damage breaks Block first. Burn ticks at the start of a turn.<br>' +
    '• Beat all three foes to win. After each win, draft a new card.<br>' +
    '• The keepers’ embers burn hot: their attacks deal +3 damage.<br>' +
    '• Watch the foe’s intent line — it tells you what it plans to do.<br>' +
    '• Keys: <b>1–5</b> play a card, <b>Space</b> ends the turn.';
  screen.append(rules);
  const start = el('button', 'big-btn', '⚔ Begin the Duel');
  start.id = 'start-btn';
  screen.append(start);
  screen.append(el('div', 'foot', 'An original card battler — Ember Pact. No network, no accounts, just the pact.'));
  return screen;
}

function renderBattle(state, onPlay, onEndTurn) {
  const screen = el('div', 'screen battle-screen');
  // Top bar
  const top = el('div', 'topbar');
  top.append(el('div', 'round', `ROUND ${state.round} / 3`));
  top.append(el('div', 'score', `SCORE ${state.score}  •  Damage dealt ${state.damageDealt}`));
  const mute = el('button', 'mute-btn', '♪ Sound: on');
  mute.id = 'mute-btn';
  top.append(mute);
  screen.append(top);

  // Foe row
  const foeRow = el('div', 'foe-row');
  const portrait = el('div', 'portrait');
  portrait.style.borderColor = state.foeDef.color;
  portrait.append(el('div', 'portrait-glyph', '👁'));
  portrait.append(el('div', 'portrait-name', state.foeDef.name));
  portrait.append(el('div', 'portrait-title', state.foeDef.title));
  foeRow.append(portrait);
  const foeInfo = el('div', 'foe-info');
  foeInfo.append(hpBar(state.foe, state.foeDef.name));
  foeInfo.append(el('div', 'intent', foeIntent(state)));
  const foeHand = el('div', 'foe-hand');
  for (let i = 0; i < state.foe.hand.length; i += 1) foeHand.append(cardElement(null, { mini: true, back: true }));
  foeInfo.append(foeHand);
  foeInfo.append(el('div', 'deck-counts', `Foe deck ${state.foe.drawPile.length} • discard ${state.foe.discard.length}`));
  foeRow.append(foeInfo);
  screen.append(foeRow);

  // Middle: log + played cards + end turn
  const mid = el('div', 'mid-row');
  const logBox = el('div', 'log');
  state.log.forEach((line) => logBox.append(el('div', 'log-line', line)));
  mid.append(logBox);
  const played = el('div', 'played');
  const pCard = state.lastPlayed.player;
  const fCard = state.lastPlayed.foe;
  played.append(el('div', 'played-label', 'LAST PLAYED'));
  const pair = el('div', 'played-pair');
  pair.append(pCard ? cardElement(pCard, { mini: true }) : el('div', 'played-empty', '— you —'));
  pair.append(el('div', 'vs', 'VS'));
  pair.append(fCard ? cardElement(fCard, { mini: true }) : el('div', 'played-empty', '— foe —'));
  played.append(pair);
  mid.append(played);
  const endBox = el('div', 'end-box');
  const endBtn = el('button', 'big-btn end-turn', 'End Turn ⏎');
  endBtn.id = 'end-turn-btn';
  endBtn.disabled = state.turn !== 'player';
  endBox.append(endBtn);
  endBox.append(el('div', 'turn-label', state.turn === 'player' ? 'Your turn — play cards!' : 'The foe is thinking…'));
  mid.append(endBox);
  screen.append(mid);

  // Player row
  const playerRow = el('div', 'player-row');
  const playerInfo = el('div', 'player-info');
  playerInfo.append(hpBar(state.player, 'You'));
  playerInfo.append(manaPips(state.player));
  playerInfo.append(el('div', 'deck-counts', `Deck ${state.player.drawPile.length} • discard ${state.player.discard.length} • hand ${state.player.hand.length}`));
  playerRow.append(playerInfo);
  const hand = el('div', 'hand');
  state.player.hand.forEach((card, i) => {
    const node = cardElement(card, { playable: state.turn === 'player' && card.cost <= state.player.mana, hint: state.hintIndex === i });
    node.dataset.index = String(i);
    node.addEventListener('click', () => onPlay(i));
    hand.append(node);
  });
  playerRow.append(hand);
  screen.append(playerRow);
  return screen;
}

function renderDraft(state, onPick) {
  const screen = el('div', 'screen draft-screen');
  screen.append(el('h2', 'draft-title', '✦ Choose a card ✦'));
  screen.append(el('div', 'draft-sub', state.message));
  const row = el('div', 'draft-row');
  state.draftChoices.forEach((card, i) => {
    const node = cardElement(card);
    node.classList.add('draft-card');
    node.addEventListener('click', () => onPick(i));
    row.append(node);
  });
  screen.append(row);
  screen.append(el('div', 'foot', 'The card joins your deck for the next round.'));
  return screen;
}

function renderEnd(state, won, onAgain) {
  const screen = el('div', `screen end-screen ${won ? 'win' : 'loss'}`);
  screen.append(el('div', 'end-glyph', won ? '👑' : '💀'));
  screen.append(el('h1', 'end-title', won ? 'VICTORY' : 'DEFEAT'));
  screen.append(el('div', 'end-msg', state.message));
  const stats = el('div', 'stats');
  stats.append(el('div', 'stat', `Score: ${state.score}`));
  stats.append(el('div', 'stat', `Damage dealt: ${state.damageDealt}`));
  stats.append(el('div', 'stat', `Cards played: ${state.cardsPlayed}`));
  stats.append(el('div', 'stat', `Rounds reached: ${state.round} / 3`));
  screen.append(stats);
  const again = el('button', 'big-btn', won ? '↻ Play Again' : '↻ Try Again');
  again.id = 'again-btn';
  screen.append(again);
  screen.append(el('div', 'foot', won ? 'The last flame is yours. The pact is kept.' : 'The pact endures. Shuffle up and try again.'));
  return screen;
}

/** Rebuild the whole table from state. Callbacks wire the buttons. */
export function render(state, handlers) {
  app.innerHTML = '';
  let screen;
  if (state.screen === 'title') screen = renderTitle(state);
  else if (state.screen === 'battle') screen = renderBattle(state, handlers.onPlay, handlers.onEndTurn);
  else if (state.screen === 'draft') screen = renderDraft(state, handlers.onPick);
  else screen = renderEnd(state, state.screen === 'win', handlers.onAgain);
  app.append(screen);
  const startBtn = document.getElementById('start-btn');
  if (startBtn) startBtn.addEventListener('click', handlers.onStart);
  const endBtn = document.getElementById('end-turn-btn');
  if (endBtn) endBtn.addEventListener('click', handlers.onEndTurn);
  const muteBtn = document.getElementById('mute-btn');
  if (muteBtn) muteBtn.addEventListener('click', handlers.onMute);
  const againBtn = document.getElementById('again-btn');
  if (againBtn) againBtn.addEventListener('click', handlers.onAgain);
}

/** Flash a fighter's HP bar after a hit. */
export function flashHp(side) {
  const bars = document.querySelectorAll('.hp-bar');
  const bar = side === 'foe' ? bars[0] : bars[1];
  if (!bar) return;
  bar.classList.remove('flash');
  void bar.offsetWidth;
  bar.classList.add('flash');
}
