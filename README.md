# Data Visualisation Block

A Plone Volto block for rendering CSV data as charts, tables, and data cards. Supports bar, line, pie, doughnut, population pyramid, mixed, table, searchable table, statistics cards, ranked bar list, and ranked cards views.

---

## Installation

Add the files to `customizations/components/Blocks/GraphBlock/` and register the block in `src/index.js`:

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

**Dependencies:** `papaparse`, `react-chartjs-2`, `chart.js`, `embla-carousel-react`

---

## How the sidebar works

The sidebar uses progressive disclosure — options appear in stages as you configure the block, so you're never shown settings that don't apply yet.

**Stage 1 — Data source** is always visible. Link or upload your CSV file and confirm the column separator.

**Stage 2 — How to show the data** appears once a file is linked. Choose your view type here. More options will appear below once you do.

**Stage 3 — Display, Labels & text, Title & caption, and Advanced** appear once a view type is chosen. Only the options relevant to your chosen view are shown — for example, axis labels won't appear for a statistics cards view, and count-up animation speed only appears for statistics cards.

---

## Column separator

The default column separator is **semicolon (`;`)**. You can change this per block in the sidebar. Comma, tab, and pipe are also supported. The separator you choose must match the one used in your CSV file.

---

## CSV formats by view type

Each view type expects a specific CSV structure. The first row is always the header row. Examples below use the default semicolon separator.

---

### Bar chart / Bar chart (horizontal) / Line chart

First column = category labels (the X axis). Each additional column = one data series.

```
Month;Revenue;Expenses
Jan;12000;8000
Feb;15000;9500
Mar;11000;7200
Apr;13500;8800
```

A single extra column produces one series. Multiple extra columns produce a grouped or multi-line chart.

---

### Mixed chart (bars + line)

Same structure as bar/line. The **last** column is rendered as a line overlay; all other columns are rendered as bars.

```
Quarter;Donations;Volunteers;Avg donation
Q1;48000;34;1412
Q2;61000;41;1488
Q3;53000;38;1395
Q4;72000;49;1469
```

In this example, *Avg donation* becomes the line and *Donations* and *Volunteers* become bars.

---

### Pie chart / Doughnut chart

First column = slice labels. Second column = values (numeric).

```
Funding source;Amount
Government grants;420000
Corporate donors;185000
Individual giving;97000
Events;43000
```

> **Zero values:** Chart.js cannot render a zero-value slice visually. If a category has a zero value, include `(0%)` or `(0)` in its label so the information is still communicated to the reader.

---

### Population pyramid

First column = age group labels. Second column = left-side values (typically female). Third column = right-side values (typically male). Values should be **positive** — the block negates the left side automatically.

```
Age group;Female;Male
0–4;1250000;1310000
5–9;1180000;1230000
10–14;1100000;1150000
15–19;1060000;1090000
20–24;980000;1010000
25–29;920000;940000
```

Column headers are used as the legend labels, so name them accordingly.

---

### Table / Table with search

Any number of columns. The first row is used as table headers.

```
Organisation;Province;Sector;Year founded
Greenfields Trust;Gauteng;Environment;2008
Ocean Care SA;Western Cape;Conservation;2014
Literacy Now;KwaZulu-Natal;Education;2011
Ubuntu Skills Centre;Eastern Cape;Livelihoods;2016
```

The **Table with search** view adds a live search box above the table. Use the *Search box placeholder text* field in the sidebar to customise the hint text inside the box.

---

### Statistics cards

First column = card label (shown small, above the number). Second column = the primary value (shown large).

Values can be:
- Plain numbers: `2934`
- Decimals: `29.4`
- Percentages: `29.4%` (append the `%` sign)
- Plain text: `South Africa`

```
Label;Value
Desktop visits;2934
Mobile visits;2991
Returning visitor rate;29.4%
Avg session duration;2m 14s
Top country;South Africa
```

**With sub-indicators** — add extra columns to show comparative values below the primary number. Each extra column header becomes the sub-indicator label, and an up/down arrow is shown based on whether the value is higher or lower than the primary.

```
Label;This month;Last month;3-month avg
Desktop visits;2934;2701;2650
Mobile visits;2991;3102;2890
New visitors;1847;1654;1720
```

---

### Ranked bar list

Rows are grouped into cards, each showing a ranked list with proportional bars. Each group's bars scale against that group's own maximum value, not a global maximum.

**Without subtitles** — 3 columns: Group, Label, Value.

```
Group;Label;Value
Top pages;/about-us;1847
Top pages;/programmes;1432
Top pages;/news;1205
Top pages;/contact;988
Top pages;/get-involved;754
```

**With subtitles** — 4 columns. The second column header must be exactly `Subtitle`. The subtitle is shown once per group, below the group title.

```
Group;Subtitle;Label;Value
Top pages;Most visited pages this month.;/about-us;1847
Top pages;Most visited pages this month.;/programmes;1432
Top pages;Most visited pages this month.;/news;1205
Top search terms;What visitors searched for on-site.;annual report;312
Top search terms;What visitors searched for on-site.;volunteer;287
Top search terms;What visitors searched for on-site.;donate;241
```

A single group renders as one card. Multiple groups render as stacked cards.

---

### Ranked cards

Uses the same CSV format as Ranked Bar List. Each group becomes a card displayed in a grid. Use the *Number of card columns* setting to control how many cards appear per row.

**Without subtitles:**

```
Group;Label;Value
Top search terms;greenfields trust;184
Top search terms;environmental volunteering sa;97
Top search terms;conservation jobs;63
Top 5 exit pages;/contact;38%
Top 5 exit pages;/get-involved;31%
Top 5 exit pages;/news;18%
```

**With subtitles:**

```
Group;Subtitle;Label;Value
Top landing pages;Where visitors first arrived.;Homepage;2341
Top landing pages;Where visitors first arrived.;/programmes;876
Top landing pages;Where visitors first arrived.;/news;543
Top exit pages;Pages where visits most often ended.;/contact;38%
Top exit pages;Pages where visits most often ended.;/get-involved;31%
Top exit pages;Pages where visits most often ended.;/news;18%
```

---

## Customising colours

### Chart colours

The colour palette used for charts is defined in `index.js` in the `GRAPH_COLOURS` array (bar, line, mixed, pyramid) and `PIE_COLOURS` array (pie, doughnut). Edit these arrays to match your project's brand palette. If a chart needs more colours than you've defined, additional colours are generated automatically.

### Card background colours

Card background colour choices are defined in `schema.js`. Each choice uses the format `css-value|theme`:

```js
['var(--blue-base)|dark', 'Blue'],   // dark = white text on a dark background
['var(--gold-base)|light', 'Gold'],  // light = dark text on a light background
```

The `theme` value controls whether the card uses light or dark text automatically. Each card also receives a colour slug class (e.g. `color-blue-base`) for further stylesheet targeting if needed.

---

## Card alignment

The *Card alignment* setting controls text alignment for card headers and stat labels only — not for the ranked lists and sub-indicators inside each card, which stay left-aligned for readability.

Specifically, alignment applies to:
- **Statistics cards:** label, primary value, and column header label
- **Ranked cards / bar groups:** card title and subtitle only

---

## Figure numbering

If your site automatically numbers figures, the *Exclude from figure numbering* option (in the Title & caption tab) lets you mark a specific block as decorative or supplementary so it is skipped in the count.
