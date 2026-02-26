// Update this URL once the block is published to your GitHub repo
const README_URL =
  'https://github.com/YOUR-ORG/YOUR-REPO/blob/main/src/customizations/components/Blocks/GraphBlock/README.md';

// ── View type groups ──────────────────────────────────────────────────────────
// Used to declare which views each field applies to.
// Edit.jsx reads these to strip irrelevant fields before rendering.

export const CHART_VIEWS = [
  'bar',
  'barHorizontal',
  'line',
  'pie',
  'doughnut',
  'pyramid',
  'mixed',
];
export const BAR_VIEWS = ['bar', 'barHorizontal', 'mixed'];
export const AXIS_VIEWS = ['bar', 'barHorizontal', 'line', 'mixed', 'pyramid'];
export const CARD_VIEWS = ['stats', 'rankedCards', 'rankedBars'];
export const MULTI_COLUMN_VIEWS = ['stats', 'rankedCards', 'rankedBars'];

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = () => {
  return {
    title: 'Data Visualisation',

    fieldsets: [
      // ── Step 1: always visible ──────────────────────────────────────────────
      {
        id: 'default',
        title: 'Data source',
        fields: ['csvFile', 'delimiter'],
      },

      // ── Step 2: appears once a file is linked ──────────────────────────────
      {
        id: 'viewType',
        title: 'How to show the data',
        fields: ['chartType'],
        condition: (formData) => !!formData?.csvFile,
      },

      // ── Step 3: appear once a view type is chosen ──────────────────────────
      // Fields within each fieldset are further filtered in Edit.jsx
      // based on each field's `viewTypes` array.
      {
        id: 'display',
        title: 'Display',
        fields: [
          'useNarrow',
          'shuffleColours',
          'cardAlignment',
          'cardBackgroundColor',
          'statColumns',
          'showBarTrack',
          'showBarInCards',
          'rankedCardColumns',
          'mobileCarousel',
        ],
        condition: (formData) => !!formData?.csvFile && !!formData?.chartType,
      },
      {
        id: 'labelsText',
        title: 'Labels & text',
        fields: [
          'showDataLabels',
          'dataLabelPosition',
          'xLabel',
          'yLabel',
          'searchPlaceholder',
        ],
        condition: (formData) => !!formData?.csvFile && !!formData?.chartType,
      },
      {
        id: 'metadata',
        title: 'Title & caption',
        // 'independent' lives here — logically grouped with caption/title
        fields: ['title', 'description', 'independent'],
        condition: (formData) => !!formData?.csvFile && !!formData?.chartType,
      },
      {
        id: 'advanced',
        title: 'Advanced',
        fields: ['reverseX', 'reverseY', 'xPercent', 'yPercent', 'statAnimationMs'],
        condition: (formData) => !!formData?.csvFile && !!formData?.chartType,
      },
    ],

    properties: {
      // ── Data source (always shown) ──────────────────────────────────────────

      csvFile: {
        title: 'CSV data file',
        widget: 'object_browser',
        mode: 'link',
        allowExternals: false,
        upload: true,
        description: `Upload or link a CSV file. Format guide and templates: ${README_URL}`,
      },

      delimiter: {
        title: 'Column separator',
        type: 'string',
        widget: 'select',
        choices: [
          [';', 'Semicolon (;) — default'],
          [',', 'Comma (,)'],
          ['\t', 'Tab'],
          ['|', 'Pipe (|)'],
        ],
        default: ';',
        description: 'Must match the separator used in your CSV file.',
      },

      // ── View type ───────────────────────────────────────────────────────────

      chartType: {
        title: 'View type',
        type: 'string',
        widget: 'select',
        choices: [
          ['bar', 'Bar chart'],
          ['barHorizontal', 'Bar chart (horizontal)'],
          ['line', 'Line chart'],
          ['pie', 'Pie chart'],
          ['doughnut', 'Doughnut chart'],
          ['pyramid', 'Population pyramid'],
          ['mixed', 'Mixed chart (bars + line)'],
          ['table', 'Table'],
          ['searchableTable', 'Table with search'],
          ['stats', 'Statistics cards'],
          ['rankedBars', 'Ranked bar list'],
          ['rankedCards', 'Ranked cards'],
        ],
        default: 'bar',
        description:
          'Choose how to display your data. More options will appear below.',
      },

      // ── Display ─────────────────────────────────────────────────────────────

      useNarrow: {
        title: 'Narrow width',
        type: 'boolean',
        default: false,
        description: 'Display the block at half the normal content width.',
        viewTypes: [...CHART_VIEWS, 'table', 'searchableTable'],
      },

      shuffleColours: {
        title: 'Shuffle colours',
        type: 'boolean',
        default: false,
        description:
          'Use palette colours in a shuffled order rather than the defined sequence.',
        viewTypes: CHART_VIEWS,
      },

      cardAlignment: {
        title: 'Card alignment',
        type: 'string',
        widget: 'select',
        choices: [
          ['left', 'Left'],
          ['center', 'Centre'],
          ['right', 'Right'],
        ],
        default: 'left',
        viewTypes: CARD_VIEWS,
      },

      cardBackgroundColor: {
        title: 'Card background colour',
        type: 'string',
        widget: 'select',
        // DESIGNER: customise choices to match your theme.
        // Format: 'css-value|theme' — theme is 'light' (dark text) or 'dark' (light text).
        choices: [
          ['none', 'None (transparent)'],
          ['#fff|light', 'White'],
          ['var(--blue-base)|dark', 'Blue'],
          ['var(--teal-base)|dark', 'Teal'],
          ['var(--turquoise-base)|dark', 'Turquoise'],
          ['var(--gold-base)|light', 'Gold'],
          ['var(--coral-base)|dark', 'Coral'],
        ],
        default: 'none',
        description:
          'Background colour for cards. Text colour adjusts automatically.',
        viewTypes: CARD_VIEWS,
      },

      statColumns: {
        title: 'Number of columns',
        type: 'string',
        widget: 'select',
        choices: [
          ['2', '2 columns'],
          ['3', '3 columns'],
          ['4', '4 columns'],
          ['5', '5 columns'],
        ],
        default: '3',
        description: 'How many statistic cards to show per row.',
        viewTypes: ['stats'],
      },

      showBarTrack: {
        title: 'Show bar track',
        type: 'boolean',
        default: true,
        description: 'Show a grey background track behind each bar.',
        viewTypes: ['rankedBars'],
      },

      showBarInCards: {
        title: 'Show bar graphic in cards',
        type: 'boolean',
        default: false,
        description:
          'Display a small proportional bar under each item in the card.',
        viewTypes: ['rankedCards'],
      },

      rankedCardColumns: {
        title: 'Number of card columns',
        type: 'string',
        widget: 'select',
        choices: [
          ['2', '2 columns'],
          ['3', '3 columns'],
          ['4', '4 columns'],
        ],
        default: '3',
        viewTypes: ['rankedCards'],
      },

      mobileCarousel: {
        title: 'Swipeable on mobile',
        type: 'boolean',
        default: true,
        description:
          'Show multi-column layouts as a swipeable carousel on small screens.',
        viewTypes: MULTI_COLUMN_VIEWS,
      },

      // ── Labels & text ───────────────────────────────────────────────────────

      showDataLabels: {
        title: 'Show values on chart',
        type: 'boolean',
        default: false,
        description:
          'Display the data value directly on each bar, point, or slice. Always on for pie and doughnut.',
        viewTypes: CHART_VIEWS,
      },

      dataLabelPosition: {
        title: 'Value label position',
        type: 'string',
        widget: 'select',
        choices: [
          ['end', 'Outside (end)'],
          ['center', 'Centre'],
          ['start', 'Inside, near base'],
        ],
        default: 'end',
        description:
          'Where to place the value label on bars. Pie and doughnut labels always appear outside.',
        viewTypes: BAR_VIEWS,
      },

      xLabel: {
        title: 'X-axis label',
        type: 'string',
        description: 'Optional label shown below the horizontal axis.',
        viewTypes: AXIS_VIEWS,
      },

      yLabel: {
        title: 'Y-axis label',
        type: 'string',
        description: 'Optional label shown beside the vertical axis.',
        viewTypes: AXIS_VIEWS,
      },

      searchPlaceholder: {
        title: 'Search box placeholder text',
        type: 'string',
        default: 'Search...',
        description: 'The hint text shown inside the search box when empty.',
        viewTypes: ['searchableTable'],
      },

      // ── Title & caption ─────────────────────────────────────────────────────

      title: {
        title: 'Title',
        type: 'string',
        description: 'Shown above the visualisation.',
        // No viewTypes — always shown once this fieldset is visible
      },

      description: {
        title: 'Caption',
        type: 'text',
        description: 'Shown below the visualisation, e.g. data source or notes.',
      },

      independent: {
        title: 'Exclude from figure numbering',
        type: 'boolean',
        default: false,
        description:
          "Tick this if the figure should not be counted in the page's automatic figure sequence.",
        // No viewTypes — always shown in this fieldset
      },

      // ── Advanced ────────────────────────────────────────────────────────────

      reverseX: {
        title: 'Reverse X axis',
        type: 'boolean',
        default: false,
        viewTypes: CHART_VIEWS,
      },

      reverseY: {
        title: 'Reverse Y axis',
        type: 'boolean',
        default: false,
        viewTypes: CHART_VIEWS,
      },

      xPercent: {
        title: 'Show X axis as percentage',
        type: 'boolean',
        default: false,
        viewTypes: ['barHorizontal', 'pyramid'],
      },

      yPercent: {
        title: 'Show Y axis as percentage',
        type: 'boolean',
        default: false,
        viewTypes: ['bar', 'line', 'mixed'],
      },

      statAnimationMs: {
        title: 'Count-up animation speed (ms)',
        type: 'integer',
        default: 1500,
        description: 'How long the numbers animate on entry. 1500 = 1.5 seconds.',
        viewTypes: ['stats'],
      },
    },

    required: ['csvFile', 'chartType'],
  };
};

export default schema;
