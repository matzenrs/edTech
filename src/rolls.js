// The 10 rolls that build a person. Each roll says how many dice to throw,
// and turns the dice total into a trait. The 3D builder (character.js) reads
// the trait `value`s; the page shows the `label`s.

export const ROLLS = [
  {
    key: 'hairColor',
    title: 'Hair Color',
    emoji: '🎨',
    dice: 1,
    outcomes: [
      { label: 'Midnight Black', value: '#2b2233' },
      { label: 'Chocolate Brown', value: '#6b3e22' },
      { label: 'Sunny Blonde', value: '#f2c94c' },
      { label: 'Ginger Red', value: '#d4572a' },
      { label: 'Bubblegum Pink', value: '#ff7eb6' },
      { label: 'Galaxy Purple', value: '#7b5cff' },
    ],
  },
  {
    key: 'hairStyle',
    title: 'Hair Style',
    emoji: '💇',
    dice: 1,
    outcomes: [
      { label: 'Bald & Shiny', value: 'bald' },
      { label: 'Spiky', value: 'spiky' },
      { label: 'Curly Puff', value: 'curly' },
      { label: 'Ponytail', value: 'ponytail' },
      { label: 'Bob Cut', value: 'bob' },
      { label: 'Mohawk', value: 'mohawk' },
    ],
  },
  {
    key: 'skin',
    title: 'Skin Tone',
    emoji: '🖐️',
    dice: 1,
    outcomes: [
      { label: 'Porcelain', value: '#fde3cf' },
      { label: 'Peach', value: '#f5c9a4' },
      { label: 'Honey', value: '#e0a878' },
      { label: 'Caramel', value: '#c48552' },
      { label: 'Cocoa', value: '#8d5a36' },
      { label: 'Espresso', value: '#5c3a24' },
    ],
  },
  {
    key: 'eyes',
    title: 'Eye Color',
    emoji: '👀',
    dice: 1,
    outcomes: [
      { label: 'Warm Brown', value: '#6b4226' },
      { label: 'Sky Blue', value: '#3d9bff' },
      { label: 'Forest Green', value: '#2f9e5b' },
      { label: 'Hazel', value: '#a07a3c' },
      { label: 'Stormy Gray', value: '#7a8894' },
      { label: 'Golden Amber', value: '#e8a317' },
    ],
  },
  {
    key: 'expression',
    title: 'Expression',
    emoji: '😄',
    dice: 1,
    outcomes: [
      { label: 'Big Smile', value: 'smile' },
      { label: 'Toothy Grin', value: 'grin' },
      { label: 'Totally Surprised', value: 'surprised' },
      { label: 'Sly Smirk', value: 'smirk' },
      { label: 'Silly Tongue', value: 'tongue' },
      { label: 'Calm & Cool', value: 'calm' },
    ],
  },
  {
    key: 'height',
    title: 'Height',
    emoji: '📏',
    dice: 2, // Two dice! Totals near 7 happen most often.
    outcomes: [
      { min: 2, max: 3, label: 'Teeny Tiny', value: 0.72 },
      { min: 4, max: 5, label: 'Short & Sweet', value: 0.86 },
      { min: 6, max: 8, label: 'Right in the Middle', value: 1.0 },
      { min: 9, max: 10, label: 'Tall', value: 1.14 },
      { min: 11, max: 12, label: 'Super Tall', value: 1.28 },
    ],
  },
  {
    key: 'outfit',
    title: 'Outfit',
    emoji: '👕',
    dice: 1,
    outcomes: [
      { label: 'Tomato Tee & Jeans', value: { shirt: '#ff5a4e', pants: '#3b5ba5' } },
      { label: 'Lime Hoodie & Grays', value: { shirt: '#9be15d', pants: '#5d6670' } },
      { label: 'Sunshine Tee & Shorts', value: { shirt: '#ffd23f', pants: '#2a9d8f' } },
      { label: 'Ocean Sweater & Khakis', value: { shirt: '#2ec4f1', pants: '#c8a978' } },
      { label: 'Grape Jacket & Black Jeans', value: { shirt: '#8e44ad', pants: '#2d2d3a' } },
      { label: 'Superhero Suit & Cape', value: { shirt: '#e63946', pants: '#1d3557', cape: '#ffb703' } },
    ],
  },
  {
    key: 'accessory',
    title: 'Accessory',
    emoji: '🎩',
    dice: 1,
    outcomes: [
      { label: 'Nothing (keeping it simple)', value: 'none' },
      { label: 'Baseball Cap', value: 'cap' },
      { label: 'Round Glasses', value: 'glasses' },
      { label: 'Golden Crown', value: 'crown' },
      { label: 'Wizard Hat', value: 'wizard' },
      { label: 'Headphones', value: 'headphones' },
    ],
  },
  {
    key: 'pet',
    title: 'Sidekick Pet',
    emoji: '🐾',
    dice: 1,
    outcomes: [
      { label: 'A Pet Rock (very loyal)', value: 'rock' },
      { label: 'Kitty Cat', value: 'cat' },
      { label: 'Puppy', value: 'dog' },
      { label: 'Little Bird', value: 'bird' },
      { label: 'Bouncy Slime', value: 'slime' },
      { label: 'Baby Dragon', value: 'dragon' },
    ],
  },
  {
    key: 'name',
    title: 'Name',
    emoji: '📛',
    dice: 1,
    // The roll picks which part of the world the name API borrows a name from.
    outcomes: [
      { label: 'from the USA & Canada', value: 'us,ca' },
      { label: 'from the UK & Ireland', value: 'gb,ie' },
      { label: 'from France & Spain', value: 'fr,es' },
      { label: 'from Brazil & Mexico', value: 'br,mx' },
      { label: 'from India & Turkey', value: 'in,tr' },
      { label: 'from Norway & Finland', value: 'no,fi' },
    ],
  },
];

/** Turn a dice total into the matching outcome for a roll. */
export function outcomeFor(roll, total) {
  if (roll.dice === 1) return roll.outcomes[total - 1];
  return roll.outcomes.find((o) => total >= o.min && total <= o.max);
}

/** Build the trait object the 3D builder needs from a list of dice totals. */
export function traitsFromTotals(totals) {
  const traits = {};
  ROLLS.forEach((roll, i) => {
    if (totals[i] == null) return;
    traits[roll.key] = outcomeFor(roll, totals[i]).value;
  });
  return traits;
}
