// Ember Pact — bootstrap, input and the headless self-test (?selftest=1 runs
// 30 full campaigns through the real engine and reports wins/losses/errors).
import { newCampaign, startRound, playCard, endPlayerTurn, pickDraftCard } from './engine.js';
import { render, flashHp } from './render.js';
import { sfx, toggleMute } from './audio.js';
import { suggestPlayerCard } from './ai.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || 20261122);

let state;
let foeAnimating = false;

if (params.get('selftest')) {
  runSelfTest();
} else if (shotName) {
  state = stageShot(shotName, seed);
  document.title = `Ember Pact — ${shotName} (seed ${seed})`;
  render(state, {});
  document.body.classList.add('shot');
} else {
  state = newCampaign((Date.now() % 2147483647) || 1);
  bindGame();
}

function bindGame() {
  render(state, {
    onStart() {
      sfx.draft();
      startRound(state);
      render(state, handlers());
    },
    onPlay(index) { playPlayerCard(index); },
    onEndTurn() { endTurnAnimated(); },
    onPick(index) {
      sfx.draft();
      pickDraftCard(state, index);
      render(state, handlers());
    },
    onAgain() {
      state = newCampaign((Date.now() % 2147483647) || 1);
      render(state, handlers());
    },
    onMute(event) {
      const muted = toggleMute();
      event.target.textContent = muted ? '♪ Sound: off' : '♪ Sound: on';
    },
  });
  document.addEventListener('keydown', onKey);
}

function handlers() {
  return {
    onStart() { sfx.draft(); startRound(state); render(state, handlers()); },
    onPlay(index) { playPlayerCard(index); },
    onEndTurn() { endTurnAnimated(); },
    onPick(index) { sfx.draft(); pickDraftCard(state, index); render(state, handlers()); },
    onAgain() {
      state = newCampaign((Date.now() % 2147483647) || 1);
      render(state, handlers());
    },
    onMute(event) {
      const muted = toggleMute();
      event.target.textContent = muted ? '♪ Sound: off' : '♪ Sound: on';
    },
  };
}

function playPlayerCard(index) {
  if (state.screen !== 'battle' || state.turn !== 'player' || foeAnimating) return;
  const card = state.player.hand[index];
  if (!card || card.cost > state.player.mana) return;
  const hadDmg = card.effect.dmg > 0;
  const hadHeal = card.effect.heal > 0;
  playCard(state, 'player', index);
  if (hadDmg) { sfx.hit(); flashHp('foe'); }
  else if (hadHeal) sfx.heal();
  else sfx.playCard();
  state.hintIndex = suggestPlayerCard(state);
  render(state, handlers());
}

function endTurnAnimated() {
  if (state.screen !== 'battle' || state.turn !== 'player' || foeAnimating) return;
  foeAnimating = true;
  sfx.turn();
  render(state, handlers());
  // The foe's turn, one card at a time so the table reads like a real duel.
  const plays = endPlayerTurn(state);
  let i = 0;
  const step = () => {
    if (i < plays.length) {
      const card = plays[i];
      i += 1;
      if (card.effect.dmg) { sfx.hit(); flashHp('player'); }
      else if (card.effect.heal) sfx.heal();
      else sfx.playCard();
      render(state, handlers());
      setTimeout(step, 650);
    } else {
      foeAnimating = false;
      sfx.draw();
      state.hintIndex = suggestPlayerCard(state);
      render(state, handlers());
      if (state.screen === 'win') sfx.win();
      if (state.screen === 'loss') sfx.lose();
    }
  };
  setTimeout(step, 450);
}

function onKey(event) {
  if (state.screen === 'title' && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    sfx.draft();
    startRound(state);
    render(state, handlers());
    return;
  }
  if (state.screen === 'battle' && state.turn === 'player' && !foeAnimating) {
    if (event.key >= '1' && event.key <= '5') {
      playPlayerCard(Number(event.key) - 1);
    } else if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      endTurnAnimated();
    }
  }
  if ((state.screen === 'win' || state.screen === 'loss') && event.key === 'Enter') {
    state = newCampaign((Date.now() % 2147483647) || 1);
    render(state, handlers());
  }
}

/** Headless self-test: 30 full campaigns, autopilot vs the foe brain. */
function runSelfTest() {
  const results = { wins: 0, losses: 0, errors: [] };
  for (let game = 0; game < 30; game += 1) {
    try {
      const test = newCampaign(1000 + game);
      startRound(test);
      let turns = 0;
      while (turns < 500) {
        turns += 1;
        if (test.screen === 'win') { results.wins += 1; break; }
        if (test.screen === 'loss') { results.losses += 1; break; }
        if (test.screen === 'draft') {
          pickDraftCard(test, game % test.draftChoices.length);
          continue;
        }
        if (test.screen !== 'battle') { results.errors.push(`game ${game}: stuck on ${test.screen}`); break; }
        // Greedy autopilot: play the highest-value affordable card.
        let guard = 0;
        while (guard < 12 && test.screen === 'battle') {
          guard += 1;
          let best = -1;
          let bestValue = 0.5;
          for (let i = 0; i < test.player.hand.length; i += 1) {
            const card = test.player.hand[i];
            if (card.cost > test.player.mana) continue;
            const v = (card.effect.dmg || 0) * 1.15
              + (card.effect.block || 0) * (test.player.hp < 13 ? 1.3 : 0.75) * Math.min(1.5, 0.6 + test.foe.hand.reduce((s, c) => s + (c.effect.dmg || 0), 0) / 25)
              + (card.effect.heal || 0) * (test.player.hp < 15 ? 1.1 : 0.35) + (card.effect.draw || 0) * 1.6
              + (card.effect.mana || 0) * 2.2 - card.cost * 1.5;
            if (v > bestValue) { bestValue = v; best = i; }
          }
          if (best === -1) break;
          playCard(test, 'player', best);
        }
        if (test.screen === 'battle') endPlayerTurn(test);
      }
      if (turns >= 500) results.errors.push(`game ${game}: turn limit hit`);
    } catch (err) {
      results.errors.push(`game ${game}: ${err.message}`);
    }
  }
  const summary = `SELFTEST wins=${results.wins} losses=${results.losses} errors=${results.errors.length} ${results.errors.join(' | ')}`;
  document.title = summary;
  document.body.innerHTML = `<pre id="selftest">${summary}</pre>`;
  console.log(summary);
}
