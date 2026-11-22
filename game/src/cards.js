// Ember Pact — the card catalogue.
// Every card is an original design: four elements (Ember, Tide, Stone, Gale),
// each told apart by colour AND shape, never by text alone.
export const ELEMENTS = {
  ember: { name: 'Ember', color: '#e2483d', dark: '#7a1d16', glyph: '◆', glow: 'rgba(226,72,61,.55)' },
  tide: { name: 'Tide', color: '#3d8fe2', dark: '#173f6e', glyph: '●', glow: 'rgba(61,143,226,.55)' },
  stone: { name: 'Stone', color: '#5da85a', dark: '#245c22', glyph: '■', glow: 'rgba(93,168,90,.55)' },
  gale: { name: 'Gale', color: '#e8b93d', dark: '#7a5c10', glyph: '▲', glow: 'rgba(232,185,61,.55)' },
};

// effect: dmg (damage to the enemy), block, heal, draw, mana,
// burn {amount, turns}, thorns (reflect), chill (wipe enemy block).
export const CARDS = {
  'ember-strike': { id: 'ember-strike', name: 'Ember Strike', element: 'ember', cost: 1, power: 7, text: 'Deal 7 damage.', effect: { dmg: 7 } },
  'cinder-slash': { id: 'cinder-slash', name: 'Cinder Slash', element: 'ember', cost: 2, power: 11, text: 'Deal 11 damage.', effect: { dmg: 11 } },
  wildfire: { id: 'wildfire', name: 'Wildfire', element: 'ember', cost: 3, power: 16, text: 'Deal 16 damage.', effect: { dmg: 16 } },
  'meteor-fall': { id: 'meteor-fall', name: 'Meteor Fall', element: 'ember', cost: 5, power: 26, text: 'Deal 26 damage.', effect: { dmg: 26 } },
  'ember-nova': { id: 'ember-nova', name: 'Ember Nova', element: 'ember', cost: 4, power: 12, text: 'Deal 12 damage. Draw 1 card.', effect: { dmg: 12, draw: 1 } },
  ignite: { id: 'ignite', name: 'Ignite', element: 'ember', cost: 2, power: 4, text: 'Deal 4 damage. Burn 3 for 2 turns.', effect: { dmg: 4, burn: { amount: 3, turns: 2 } } },
  'leech-fang': { id: 'leech-fang', name: 'Leech Fang', element: 'ember', cost: 2, power: 7, text: 'Deal 7 damage. Heal 5.', effect: { dmg: 7, heal: 5 } },
  stonewall: { id: 'stonewall', name: 'Stonewall', element: 'stone', cost: 1, power: 8, text: 'Gain 8 Block.', effect: { block: 8 } },
  bulwark: { id: 'bulwark', name: 'Bulwark', element: 'stone', cost: 2, power: 14, text: 'Gain 14 Block.', effect: { block: 14 } },
  'rally-cry': { id: 'rally-cry', name: 'Rally Cry', element: 'stone', cost: 1, power: 4, text: 'Gain 4 Block. Draw 1 card.', effect: { block: 4, draw: 1 } },
  thornmail: { id: 'thornmail', name: 'Thornmail', element: 'stone', cost: 1, power: 5, text: 'Gain 5 Block. Thorns 4: attackers take 4.', effect: { block: 5, thorns: 4 } },
  'quake-slam': { id: 'quake-slam', name: 'Quake Slam', element: 'stone', cost: 3, power: 10, text: 'Deal 10 damage. Gain 6 Block.', effect: { dmg: 10, block: 6 } },
  'tide-mend': { id: 'tide-mend', name: 'Tide Mend', element: 'tide', cost: 2, power: 6, text: 'Heal 6.', effect: { heal: 6 } },
  'second-wind': { id: 'second-wind', name: 'Second Wind', element: 'tide', cost: 0, power: 3, text: 'Heal 3. Draw 1 card.', effect: { heal: 3, draw: 1 } },
  surge: { id: 'surge', name: 'Surge', element: 'tide', cost: 1, power: 0, text: 'Draw 2 cards.', effect: { draw: 2 } },
  frostbind: { id: 'frostbind', name: 'Frostbind', element: 'tide', cost: 2, power: 5, text: 'Deal 5 damage. Shatter the enemy Block.', effect: { dmg: 5, chill: true } },
  'gale-step': { id: 'gale-step', name: 'Gale Step', element: 'gale', cost: 0, power: 0, text: 'Draw 1 card. Gain 1 Mana.', effect: { draw: 1, mana: 1 } },
  overcharge: { id: 'overcharge', name: 'Overcharge', element: 'gale', cost: 2, power: 0, text: 'Gain 3 Mana this turn.', effect: { mana: 3 } },
};

export const CARD_IDS = Object.keys(CARDS);

/** The starting deck: 20 cards, a mix of damage, block and draw. */
export function startingDeck() {
  const list = [
    'ember-strike', 'ember-strike', 'ember-strike',
    'cinder-slash', 'cinder-slash',
    'stonewall', 'stonewall',
    'rally-cry', 'rally-cry',
    'surge', 'tide-mend', 'gale-step', 'ignite', 'leech-fang',
    'bulwark', 'second-wind', 'thornmail', 'wildfire', 'quake-slam', 'overcharge',
  ];
  return list.map((id) => ({ ...CARDS[id] }));
}

/** The three foes of the campaign, each with its own deck flavour. */
export const FOES = [
  {
    name: 'Cinder Whelp', title: 'Spark of the Deep', hp: 24, aggression: 1.0,
    deck: ['ember-strike', 'ember-strike', 'ember-strike', 'ember-strike', 'cinder-slash', 'cinder-slash', 'ignite', 'wildfire', 'leech-fang', 'stonewall', 'rally-cry', 'surge'],
    color: '#e2483d',
  },
  {
    name: 'Ashen Warden', title: 'Keeper of the Gate', hp: 32, aggression: 1.15,
    deck: ['ember-strike', 'ember-strike', 'cinder-slash', 'cinder-slash', 'wildfire', 'wildfire', 'ignite', 'leech-fang', 'quake-slam', 'frostbind', 'stonewall', 'bulwark', 'tide-mend', 'overcharge'],
    color: '#e8b93d',
  },
  {
    name: 'The Ember Queen', title: 'The Last Flame', hp: 40, aggression: 1.4,
    deck: ['cinder-slash', 'cinder-slash', 'wildfire', 'wildfire', 'meteor-fall', 'ember-nova', 'ignite', 'leech-fang', 'bulwark', 'bulwark', 'tide-mend', 'frostbind', 'overcharge', 'quake-slam', 'ember-strike', 'thornmail'],
    color: '#c94fd6',
  },
];
