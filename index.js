import Edit from './Edit';
import View from './View';

// ── Colour palettes ───────────────────────────────────────────────────────────
// DESIGNER: Edit these arrays to match your project's brand palette.
// Add as many or as few colours as you like — the block will generate
// additional colours procedurally if a chart needs more than you've defined.

export const GRAPH_COLOURS = [
  '#0D7FA1', // --blue-base
  '#064C3F', // --teal-base
  '#00C9A7', // --turquoise-base
  '#F5B942', // --gold-base
  '#D84055', // --coral-base
  '#8c564b', // brown
];

export const PIE_COLOURS = [
  '#36a2eb', // blue
  '#ff6384', // pink/red
  '#4bc0c0', // teal
  '#ffcd56', // yellow
  '#9966ff', // purple
  '#c9cbcf', // grey
];

// ── Palette utilities ─────────────────────────────────────────────────────────

// Simple deterministic hash so "extra" colours are stable per-index
// and don't change on every re-render.
const hashIndex = (i) => {
  let h = (i + 1) * 2654435761;
  h = ((h >>> 16) ^ h) >>> 0;
  return h;
};

// Generate an additional colour for index i when the palette runs out.
// Uses HSL with golden-ratio hue steps for perceptual spread.
const generateColour = (i) => {
  const hue = Math.round((hashIndex(i) * 137.508) % 360);
  return `hsl(${hue}, 60%, 48%)`;
};

/**
 * Returns a palette array of `count` colours drawn from `base`.
 * If `shuffle` is true the palette is shuffled (seeded, not random per render).
 * Extra colours beyond base.length are generated procedurally.
 *
 * @param {string[]} base    - GRAPH_COLOURS or PIE_COLOURS
 * @param {number}   count   - How many colours are needed
 * @param {boolean}  shuffle - Whether to shuffle the order
 */
export const getPalette = (base, count, shuffle = false) => {
  // Extend palette with generated colours if needed
  const extended = [...base];
  while (extended.length < count) {
    extended.push(generateColour(extended.length));
  }

  if (shuffle) {
    // Seeded Fisher-Yates — stable order per palette, not random per render
    const arr = [...extended.slice(0, count)];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = hashIndex(i) % (i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  return extended.slice(0, count);
};

export { Edit, View };
