# Data Visualisation Block

A Plone Volto block for rendering CSV data as charts, tables, and data cards.

## Installation

Add files to `customizations/components/Blocks/GraphBlock/` and register in `src/index.js`:

```js
import graphSVG from '@plone/volto/icons/slider.svg';
import { Edit as GraphBlockEdit, View as GraphBlockView } from './components/Blocks/GraphBlock';

const applyConfig = (config) => {
  config.blocks.blocksConfig.graphBlock = {
    id: 'graphBlock',
    title: 'Data Visualisation Block',
    icon: graphSVG,
    group: 'common',
    view: GraphBlockView,
    edit: GraphBlockEdit,
    restricted: false,
    mostUsed: true,
    sidebarTab: 1,
  };
  return config;
};

export default applyConfig;
```

**Dependencies:** `papaparse`, `react-chartjs-2`, `chart.js`, `chartjs-plugin-datalabels`, `embla-carousel-react`

---

## CSV formats by view type

The default field delimiter is **semicolon (`;`)**. You can change this per block in the sidebar (comma, tab, or pipe are also supported).

---

### Bar, Bar (horizontal), Line, Mixed (bars + line)

First column = category labels. Remaining columns = datasets (one per series).

```
Month;Revenue;Expenses
Jan;12000;8000
Feb;15000;9500
Mar;11000;7200
```

For **Mixed**, the last column is rendered as a line overlay; all others are bars.

---

### Pie / Doughnut

First column = slice labels. Second column = values.

```
Category;Value
Programmes;45
Administration;20
Fundraising;35
```

> **Zero values:** Chart.js cannot show a zero slice visually. Include `(0%)` or `(0)` in the label so the data point is still communicated.

---

### Population Pyramid

First column = age group labels. Second column = left side (e.g. Female). Third column = right side (e.g. Male). Values should be positive — the block negates the left side internally.

```
Age group;Female;Male
0–4;1250000;1310000
5–9;1180000;1230000
10–14;1100000;1150000
```

---

### Table / Searchable Table

Any number of columns. First row = headers.

```
Name;Province;Year founded
Greenfields Trust;Gauteng;2008
Ocean Care SA;Western Cape;2014
```

---

### Statistics Cards

First column = card label (shown small, above the number).
Second column = value (shown large). Supports numbers, decimals, percentages (append `%`), and plain text.

```
Label;Value
Desktop visits;2934
Mobile visits;2991
Returning visitor rate;29.4%
Top country;South Africa
```

**With sub-indicators** (comparative values shown below the primary):
Add extra columns — each becomes a sub-indicator with an up/down arrow comparing against the primary value.

```
Label;This month;Last month;3-month avg
Desktop visits;2934;2701;2650
Mobile visits;2991;3102;2890
```

---

### Ranked Bar List

Groups rows into separate cards, each with proportional bars. Each group's bars scale against that group's own maximum.

**Without subtitles** (3 columns):

```
Group;Label;Value
Top pages;/about-us;1847
Top pages;/programmes;1432
Top pages;/news;1205
```

**With subtitles** (4 columns — second header must be exactly `Subtitle`):

```
Group;Subtitle;Label;Value
Top pages;Most visited pages this month.;/about-us;1847
Top pages;Most visited pages this month.;/programmes;1432
```

A single group renders as one card. Multiple groups render as stacked cards.

---

### Ranked Cards

Same CSV format as Ranked Bar List. Each group becomes a card displayed in a grid. Use the **Ranked card columns** setting to control how many fit per row.

**Without subtitles:**

```
Group;Label;Value
Top search terms;greenfields trust;184
Top search terms;environmental volunteering sa;97
Top 5 exit pages;/contact;38%
Top 5 exit pages;/get-involved;31%
```

**With subtitles:**

```
Group;Subtitle;Label;Value
Top landing pages;Where visitors first arrived.;Homepage;2341
Top landing pages;Where visitors first arrived.;/programmes;876
Top exit pages;Pages where visits most often ended.;/contact;38%
Top exit pages;Pages where visits most often ended.;/get-involved;31%
```

---


## Chart colours

Chart colours are defined in `index.js` as two arrays:

- **`GRAPH_COLOURS`** — used for bar, line, mixed, and pyramid charts (one colour per dataset)
- **`PIE_COLOURS`** — used for pie and doughnut charts (one colour per slice)

Edit these arrays to match your project's brand palette:

```js
export const GRAPH_COLOURS = [
  '#1a5276', // --blue-base
  '#0e6655', // --teal-base
  '#b7950b', // --gold-base
];
```

If a chart needs more colours than the palette defines, extras are generated automatically using a golden-ratio hue spread — so they're always visually distinct and won't clash.

### CSS custom properties

Chart.js requires resolved hex or RGB values, so CSS custom properties can't be passed directly. The recommended approach is to keep hex values in `index.js` that match your CSS variables, with a comment linking them:

```js
// Keep in sync with variables.css custom properties
export const GRAPH_COLOURS = [
  '#1a5276', // --blue-base
  '#0e6655', // --teal-base
];
```

To resolve CSS variables at runtime instead (browser-only, no SSR):

```js
const resolveCSSVar = (varName, fallback) => {
  if (typeof document === 'undefined') return fallback;
  return getComputedStyle(document.documentElement)
    .getPropertyValue(varName).trim() || fallback;
};

export const GRAPH_COLOURS = [
  resolveCSSVar('--blue-base', '#1a5276'),
  resolveCSSVar('--teal-base', '#0e6655'),
];
```

### Shuffle colours

Editors can toggle **Shuffle chart colours** in the Display tab to randomise the palette order per block. The shuffle is seeded and deterministic — it won't change on every page load.

## Background colours

Colour choices are defined in `schema.js` using the format `css-value|theme`:

```js
['var(--blue-base)|dark', 'Blue'],   // dark = light text on dark background
['var(--gold-base)|light', 'Gold'],  // light = dark text on light background
```

Each card also receives a colour slug class (e.g. `color-blue-base`) for further stylesheet targeting.

---

## Card alignment

Alignment applies to:
- **Statistics cards:** label, primary value, and column header label
- **Ranked cards / bar groups:** card title and subtitle only

Sub-indicators and ranked lists always remain left-aligned for readability.

---

## Data labels

Editors can enable **Show data labels** in the View Type tab to display values directly on chart elements. Applies to all chart types:

- **Bar / horizontal bar** — value at the chosen position (End, Center, or Start). End labels use the bar's colour; Center and Start use white text inside the bar.
- **Line** — small labels above each data point in the line's colour.
- **Mixed** — labels on bar datasets only; the line overlay is skipped.
- **Pie / doughnut** — percentage labels outside each slice. Position setting is ignored; outside always reads best. Slices under 3% are unlabelled to avoid clutter.
- **Population pyramid** — absolute values at the end of each bar, always shown as positive.

Requires `chartjs-plugin-datalabels`:

```bash
npm install chartjs-plugin-datalabels --save
```

---

## Axis controls

Available for bar, line, mixed, and pyramid charts in the **Axes** sidebar tab:

- **X / Y axis label** — adds a text label along the axis
- **Reverse X / Y axis** — flips the axis direction
- **Format X / Y axis as percentage** — appends `%` to axis tick labels and tooltip values

---

## Figure numbering

The block supports automatic figure numbering for use in reports and long-form pages. Each block on a page is counted in document order and prefixed to the caption (e.g. **Figure 3: Annual population growth**).

To exclude a specific block from the count — for example a decorative or supplementary chart — enable **Independent (exclude from figure numbering)** in the Metadata tab. Independent blocks still show their caption, just without the figure prefix.

---

## Narrow width

The **Use narrow width** toggle (Display tab) constrains the block's inner content to 50% of the container width, centred. Falls back to full width on mobile. Useful for charts or cards that don't need the full page width — a pie chart or a single stat card for example.

---

## Mobile carousel

The **Mobile carousel** toggle (Display tab) applies to multi-column views: Statistics Cards, Ranked Cards, and Ranked Bar Groups. On screens wider than 768px the layout is unchanged. On mobile each item becomes a full-width swipeable slide with dot navigation.

Requires `embla-carousel-react` (no autoplay variant needed — the carousel is manual swipe only):

```bash
npm install embla-carousel-react --save
```

---

## Delimiter guide

The default delimiter is **semicolon** — a safe choice since commas often appear inside values (e.g. `1,847`) and would break comma-delimited parsing. Change per block in the Data tab if your CSV uses a different separator.

| Delimiter | Use when |
|-----------|----------|
| `;` Semicolon | Default. Safe for numeric values with thousand separators. |
| `,` Comma | Standard CSV exports from Excel / Google Sheets (if no commas in values). |
| `\t` Tab | TSV exports. Copy-paste from spreadsheets often produces tab-separated data. |
| `\|` Pipe | Rarely needed — useful if values contain both commas and semicolons. |

Numbers with thousand-separator commas (e.g. `2,790,128`) are handled automatically regardless of delimiter.
