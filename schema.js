const schema = () => {
  return {
    title: 'Graph Block',
    fieldsets: [
      {
        id: 'default',
        title: 'Default',
        fields: [
          'title',
          'csvFile',
          'chartType',
          'xLabel',
          'yLabel',
          'useNarrow',
          'description',
          'independent',
        ],
      },
    ],
    properties: {
      title: {
        title: 'Graph title',
        type: 'string',
      },
      csvFile: {
        title: 'Upload CSV file',
        widget: 'object_browser',
        mode: 'link',
        allowExternals: false,
        upload: true,
      },
      chartType: {
        title: 'Chart type',
        type: 'string',
        widget: 'select',
        choices: [
          ['bar', 'Bar'],
          ['line', 'Line'],
          ['pie', 'Pie'],
          ['doughnut', 'Doughnut'],
        ],
        default: 'bar',
      },
      xLabel: {
        title: 'X-axis label',
        type: 'string',
      },
      yLabel: {
        title: 'Y-axis label',
        type: 'string',
      },
      useNarrow: {
        title: 'Use narrow width',
        type: 'boolean',
        default: false,
      },
      description: {
        title: 'Graph description',
        type: 'text',
      },
      independent: {
        title: 'Independent graph (do not count in figure numbering)',
        type: 'boolean',
        default: false,
      },
    },
    required: ['csvFile', 'chartType'],
  };
};

export default schema;