import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  BarController,
  LineController,
  PieController,
  DoughnutController,
} from 'chart.js';
import React, { useEffect, useState, useRef } from 'react';
import { Chart } from 'react-chartjs-2';
import Papa from 'papaparse';
import './style.css';
import { GRAPH_COLOURS, PIE_COLOURS, getPalette } from './index';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import useEmblaCarousel from 'embla-carousel-react';

// Update this URL once the block is published to your GitHub repo
const README_URL = 'https://github.com/juizi-com/volto-GraphBlock/blob/main/README.md';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  BarController,
  LineController,
  PieController,
  DoughnutController,
);

// Strip thousand-separator commas and % signs before parsing
const parseNumber = (val) =>
  Number(String(val).replace(/,/g, '').replace(/%/g, '').trim());


const useIsMobile = () => {
  const [isMobile, setIsMobile] = React.useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener ? mq.addEventListener('change', update) : mq.addListener(update);
    return () =>
      mq.removeEventListener
        ? mq.removeEventListener('change', update)
        : mq.removeListener(update);
  }, []);
  return isMobile;
};

const MobileCarousel = ({ enabled, children }) => {
  const isMobile = useIsMobile();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const slides = React.Children.toArray(children);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    onSelect();
  }, [emblaApi]);

  if (!enabled || !isMobile) return <>{children}</>;

  return (
    <div className="dv-embla">
      <div className="dv-embla__viewport" ref={emblaRef}>
        <div className="dv-embla__container">
          {slides.map((slide, i) => (
            <div className="dv-embla__slide" key={i}>
              {slide}
            </div>
          ))}
        </div>
      </div>
      <div className="dv-embla__dots">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`dv-embla__dot${i === selectedIndex ? ' is-selected' : ''}`}
            onClick={() => emblaApi && emblaApi.scrollTo(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

// Count-up animation component (borrowed from MultiCard block)
const CountUp = ({ end = 0, duration = 1500 }) => {
  const [value, setValue] = useState(0);
  const startRef = useRef(null);
  const endVal = Number(end) || 0;
  const isDecimal = endVal % 1 !== 0;
  const decimalPlaces = isDecimal
    ? (endVal.toString().split('.')[1] || '').length
    : 0;

  useEffect(() => {
    setValue(0);
    startRef.current = null;
    const step = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      setValue(progress * endVal);
      if (progress < 1) requestAnimationFrame(step);
    };
    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [end, duration]);

  const formatted = isDecimal
    ? value.toFixed(decimalPlaces)
    : Math.floor(value).toLocaleString();

  return <span className="dv-stat-value-number">{formatted}</span>;
};


// Build inline style and class string for coloured cards.
// cardBackgroundColor format: 'css-value|theme' e.g. 'var(--blue-base)|dark'
// theme 'dark' = light text on dark bg; 'light' = dark text on light bg.
const buildCardAppearance = (data) => {
  const raw = (data.cardBackgroundColor || '').trim();
  const alignClass = `align-${data.cardAlignment || 'left'}`;

  if (!raw || raw === 'none') {
    return { style: {}, colorClass: '', themeClass: '', alignClass };
  }

  const parts = raw.split('|');
  const bgValue = parts[0].trim();
  const theme = parts[1] ? parts[1].trim() : 'light';

  // Derive a slug for the colour class: strip var(--...) wrapper or # prefix
  const slug = bgValue
    .replace(/^var\(--/, '')
    .replace(/\)$/, '')
    .replace(/^#/, '');
  const colorClass = `color-${slug}`;
  const themeClass = `theme-${theme}`;

  return {
    style: { backgroundColor: bgValue },
    colorClass,
    themeClass,
    alignClass,
  };
};


// Build chartjs-plugin-datalabels config for a given chart type and settings.
// Returns null if labels are disabled. Pass as plugins: [ChartDataLabels]
// on the Chart component when non-null.
const buildDataLabels = (data, chartTypeKey) => {
  if (!data.showDataLabels) return null;

  const position = data.dataLabelPosition || 'end';
  const isPie = chartTypeKey === 'pie' || chartTypeKey === 'doughnut';
  const isPyramid = chartTypeKey === 'pyramid';
  const isHBar = chartTypeKey === 'barHorizontal';
  const isLine = chartTypeKey === 'line';
  const isMixed = chartTypeKey === 'mixed';

  // Pie / doughnut — percentage labels outside slices
  if (isPie) {
    return {
      anchor: 'end',
      align: 'end',
      offset: 8,
      color: (ctx) => ctx.dataset.backgroundColor[ctx.dataIndex] || '#333',
      font: { weight: '600', size: 12 },
      formatter: (value, ctx) => {
        const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
        const pct = total > 0 ? Math.round((value / total) * 100) : 0;
        return pct + '%';
      },
    };
  }

  // Pyramid — show absolute value at bar end, correctly mirrored
  if (isPyramid) {
    return {
      anchor: 'end',
      align: 'end',
      color: '#333',
      font: { weight: '600', size: 11 },
      formatter: (value) => Math.abs(value).toLocaleString(),
    };
  }

  // Line — small labels on each point
  if (isLine) {
    return {
      anchor: 'end',
      align: 'top',
      offset: 4,
      color: (ctx) => ctx.dataset.borderColor || '#333',
      font: { size: 11 },
      formatter: (value) => {
        if (typeof value === 'number') return value.toLocaleString();
        return value;
      },
    };
  }

  // Mixed — labels on bar datasets only, skip the line dataset
  if (isMixed) {
    return {
      anchor: position,
      align: position,
      color: '#333',
      font: { weight: '600', size: 11 },
      display: (ctx) => ctx.dataset.type !== 'line',
      formatter: (value) => {
        if (typeof value === 'number') return value.toLocaleString();
        return value;
      },
    };
  }

  // Bar (vertical and horizontal)
  // For horizontal bars, swap anchor/align axes
  const anchor = position;
  const align = position === 'end' ? 'end'
    : position === 'start' ? 'start'
    : 'center';

  return {
    anchor,
    align,
    // Push end-labels just outside the bar
    offset: position === 'end' ? 4 : 0,
    // For center/start, white text reads better inside the bar
    color: (ctx) => {
      if (position === 'center' || position === 'start') return '#fff';
      return ctx.dataset.backgroundColor || '#333';
    },
    font: { weight: '600', size: 11 },
    formatter: (value) => {
      if (typeof value === 'number') return value.toLocaleString();
      return value;
    },
  };
};

const View = ({ data, block }) => {
  const [parsedData, setParsedData] = useState(null);
  const [csvFields, setCsvFields] = useState(null);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200,
  );
  const [figureNumber, setFigureNumber] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!data.independent) {
      const blocks = Array.from(document.querySelectorAll('.graph-block'));
      const index = blocks.findIndex((el) => el.contains(containerRef.current));
      if (index !== -1) {
        let count = 0;
        for (let i = 0; i <= index; i++) {
          if (!blocks[i].classList.contains('independent')) count++;
        }
        setFigureNumber(count);
      }
    }
  }, [data.independent, windowWidth]);

  useEffect(() => {
    const file = Array.isArray(data.csvFile) ? data.csvFile[0] : data.csvFile;
    if (!file || !file['@id']) return;

    const url = file['@id'].includes('/@@download/file')
      ? file['@id']
      : `${file['@id']}/@@download/file`;
    setIsLoading(true);
    fetch(url)
      .then((res) => res.text())
      .then((csvText) => {
        const delimiter = data.delimiter || ';';
        const result = Papa.parse(csvText, { header: true, delimiter });
        const trimmedFields = result.meta.fields.map((k) => k.trim());
        const normalisedRows = result.data.map((row) => {
          const clean = {};
          result.meta.fields.forEach((origKey, i) => {
            clean[trimmedFields[i]] = row[origKey];
          });
          return clean;
        });
        setParsedData(normalisedRows);
        setCsvFields(trimmedFields);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('CSV load error:', err);
        setIsLoading(false);
      });
  }, [data.csvFile, data.delimiter]);

  const cardAppearance = buildCardAppearance(data);
  const hasFile = !!(Array.isArray(data.csvFile)
    ? data.csvFile[0]
    : data.csvFile);

  let chartData = null;
  let chartOptions = null;
  const isHorizontalBar = data.chartType === 'barHorizontal';
  let chartType =
    data.chartType === 'mixed' || isHorizontalBar
      ? 'bar'
      : data.chartType || 'bar';
  const isTable =
    data.chartType === 'table' || data.chartType === 'searchableTable';
  const dataLabelsConfig = buildDataLabels(data, data.chartType);
  const isStats = data.chartType === 'stats';
  const isRankedBars = data.chartType === 'rankedBars';
  const isRankedCards = data.chartType === 'rankedCards';

  if (parsedData && !isTable && !isStats && !isRankedBars && !isRankedCards) {
    const isPyramid = data.chartType === 'pyramid';
    const isMixed = data.chartType === 'mixed';
    const isPieChart =
      data.chartType === 'pie' || data.chartType === 'doughnut';
    const cleanedData = parsedData.filter(
      (row) => Object.values(row).join('').trim() !== '',
    );

    const columnKeys = csvFields || Object.keys(cleanedData[0] || {});
    const labelKey = columnKeys[0];
    const datasetKeys = columnKeys.slice(1);

    if (isPyramid) {
      chartType = 'bar';
      chartData = {
        labels: cleanedData.map((row) => row[labelKey]),
        datasets: datasetKeys.map((key, i) => ({
          label: key,
          data: cleanedData.map((row) =>
            i === 0
              ? -Math.abs(parseNumber(row[key]))
              : Math.abs(parseNumber(row[key])),
          ),
          backgroundColor: i === 0 ? GRAPH_COLOURS[3] : GRAPH_COLOURS[5],
          borderColor: i === 0 ? GRAPH_COLOURS[3] : GRAPH_COLOURS[5],
          borderWidth: 1,
          minBarLength: 4,
        })),
      };
      chartOptions = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: true },
          ...(dataLabelsConfig ? { datalabels: dataLabelsConfig } : { datalabels: { display: false } }),
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = Math.abs(context.parsed.x);
                return data.xPercent
                  ? `${context.dataset.label}: ${value}%`
                  : `${context.dataset.label}: ${value.toLocaleString()}`;
              },
            },
          },
        },
        scales: {
          x: {
            stacked: false,
            reverse: Boolean(data.reverseX),
            ticks: {
              callback: (value) =>
                data.xPercent
                  ? Math.abs(value) + '%'
                  : Math.abs(value).toLocaleString(),
            },
            title: { display: Boolean(data.xLabel), text: data.xLabel || '' },
          },
          y: {
            stacked: false,
            reverse: Boolean(data.reverseY),
            ticks: data.yPercent ? { callback: (v) => v + '%' } : {},
            title: { display: Boolean(data.yLabel), text: data.yLabel || '' },
          },
        },
      };
    } else {
      const lastIndex = datasetKeys.length - 1;
      const shuffle = !!data.shuffleColours;
      const graphPalette = getPalette(GRAPH_COLOURS, datasetKeys.length, shuffle);
      const piePalette = getPalette(PIE_COLOURS, cleanedData.length, shuffle);
      chartData = {
        labels: cleanedData.map((row) => row[labelKey]),
        datasets: datasetKeys.map((key, i) => {
          const isLineDataset = isMixed && i === lastIndex;
          const colour = isPieChart
            ? piePalette
            : graphPalette[i];
          return {
            label: key,
            type: isLineDataset ? 'line' : undefined,
            order: isLineDataset ? 1 : 2,
            data: cleanedData.map((row) => parseNumber(row[key])),
            backgroundColor: isLineDataset ? 'transparent' : colour,
            borderColor: colour,
            borderWidth: isLineDataset ? 2.5 : 1,
            pointRadius: isLineDataset ? 3 : undefined,
            fill: isLineDataset ? false : undefined,
            tension: isLineDataset ? 0.3 : undefined,
            minBarLength: isLineDataset ? undefined : 4,
          };
        }),
      };
      chartOptions = {
        responsive: true,
        maintainAspectRatio: true,
        ...(isHorizontalBar ? { indexAxis: 'y' } : {}),
        plugins: {
          legend: { display: isPieChart || datasetKeys.length > 1 },
          ...(dataLabelsConfig ? { datalabels: dataLabelsConfig } : { datalabels: { display: false } }),
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed.y ?? context.parsed;
                const suffix = data.yPercent ? '%' : '';
                return `${context.dataset.label}: ${value}${suffix}`;
              },
            },
          },
        },
        scales: isPieChart
          ? {}
          : {
              x: {
                reverse: Boolean(data.reverseX),
                ticks: data.xPercent ? { callback: (v) => v + '%' } : {},
                title: {
                  display: Boolean(data.xLabel),
                  text: data.xLabel || '',
                },
              },
              y: {
                reverse: Boolean(data.reverseY),
                ticks: data.yPercent ? { callback: (v) => v + '%' } : {},
                title: {
                  display: Boolean(data.yLabel),
                  text: data.yLabel || '',
                },
              },
            },
      };
    }
  }


  // Ranked bar list data
  // Ranked bars — same grouping logic as ranked cards.
  // CSV: col0 = Group, col1 = optional Subtitle, col2 = Label, col3 = Value
  //  OR (no grouping): col0 = Label, col1 = Value (single implicit group)
  let rankedBarsData = [];
  if (isRankedBars && parsedData) {
    const cleanedData = parsedData.filter(
      (row) => Object.values(row).join('').trim() !== '',
    );
    const columnKeys = csvFields || Object.keys(cleanedData[0] || {});

    // Detect layout: 4 cols with 'Subtitle' header, 3 cols with group but no
    // subtitle, or 2 cols with just label+value (no grouping).
    const hasSubtitle =
      columnKeys.length >= 4 &&
      columnKeys[1].toLowerCase() === 'subtitle';
    const hasGroup = hasSubtitle
      ? true
      : columnKeys.length >= 3;

    const groupKey    = hasGroup ? columnKeys[0] : null;
    const subtitleKey = hasSubtitle ? columnKeys[1] : null;
    const labelKey    = hasSubtitle ? columnKeys[2] : hasGroup ? columnKeys[1] : columnKeys[0];
    const valueKey    = hasSubtitle ? columnKeys[3] : hasGroup ? columnKeys[2] : columnKeys[1];

    if (!hasGroup) {
      // Single flat list — wrap in one implicit group
      const rows = cleanedData.map((row) => ({
        label: row[labelKey],
        value: parseNumber(row[valueKey]),
        rawValue: row[valueKey],
        isPercent: String(row[valueKey] || '').includes('%'),
      }));
      const max = Math.max(...rows.map((r) => r.value), 1);
      rankedBarsData = [{ title: null, subtitle: null, rows: rows.map((r) => ({ ...r, pct: (r.value / max) * 100 })) }];
    } else {
      const groups = {};
      const groupOrder = [];
      cleanedData.forEach((row) => {
        const group = row[groupKey];
        if (!groups[group]) {
          groups[group] = { title: group, subtitle: subtitleKey ? (row[subtitleKey] || '') : '', rows: [] };
          groupOrder.push(group);
        }
        groups[group].rows.push({
          label: row[labelKey],
          value: parseNumber(row[valueKey]),
          rawValue: row[valueKey],
          isPercent: String(row[valueKey] || '').includes('%'),
        });
      });
      rankedBarsData = groupOrder.map((g) => {
        const card = groups[g];
        const max = Math.max(...card.rows.map((r) => r.value), 1);
        return { ...card, rows: card.rows.map((r) => ({ ...r, pct: (r.value / max) * 100 })) };
      });
    }
  }


  // Ranked cards data
  // CSV: col0 = Group (card title), col1 = optional Subtitle (repeating),
  //      col2 = Label, col3 = Value  — OR without subtitle:
  //      col0 = Group, col1 = Label, col2 = Value
  let rankedCardsData = [];
  if (isRankedCards && parsedData) {
    const cleanedData = parsedData.filter(
      (row) => Object.values(row).join('').trim() !== '',
    );
    const columnKeys = csvFields || Object.keys(cleanedData[0] || {});

    // Detect if second column is 'subtitle' (case-insensitive) or looks like
    // a subtitle (non-numeric values throughout). We check the header name.
    const hasSubtitle =
      columnKeys.length >= 4 &&
      columnKeys[1].toLowerCase() === 'subtitle';

    const groupKey   = columnKeys[0];
    const subtitleKey = hasSubtitle ? columnKeys[1] : null;
    const labelKey   = hasSubtitle ? columnKeys[2] : columnKeys[1];
    const valueKey   = hasSubtitle ? columnKeys[3] : columnKeys[2];

    // Group rows
    const groups = {};
    const groupOrder = [];
    cleanedData.forEach((row) => {
      const group = row[groupKey];
      if (!groups[group]) {
        groups[group] = {
          title: group,
          subtitle: subtitleKey ? (row[subtitleKey] || '') : '',
          rows: [],
        };
        groupOrder.push(group);
      }
      groups[group].rows.push({
        label: row[labelKey],
        value: parseNumber(row[valueKey]),
        rawValue: row[valueKey],
        isPercent: String(row[valueKey] || '').includes('%'),
      });
    });

    // Compute per-card max for proportional bars
    rankedCardsData = groupOrder.map((g) => {
      const card = groups[g];
      const max = Math.max(...card.rows.map((r) => r.value), 1);
      return {
        ...card,
        rows: card.rows.map((r) => ({ ...r, pct: (r.value / max) * 100 })),
      };
    });
  }

  // Table data
  let tableHeaders = [];
  let tableRows = [];
  if (isTable && parsedData) {
    const cleanedData = parsedData.filter(
      (row) => Object.values(row).join('').trim() !== '',
    );
    tableHeaders = csvFields || Object.keys(cleanedData[0] || {});
    const lowerSearch = searchTerm.toLowerCase().trim();
    tableRows =
      data.chartType === 'searchableTable' && lowerSearch
        ? cleanedData.filter((row) =>
            tableHeaders.some((key) =>
              String(row[key] || '').toLowerCase().includes(lowerSearch),
            ),
          )
        : cleanedData;
  }

  // Stats card data
  // CSV format: col0 = card label, col1 = primary value, col2+ = sub-indicators
  let statsCards = [];
  if (isStats && parsedData) {
    const cleanedData = parsedData.filter(
      (row) => Object.values(row).join('').trim() !== '',
    );
    const columnKeys = csvFields || Object.keys(cleanedData[0] || {});
    const labelKey = columnKeys[0];
    const primaryKey = columnKeys[1];
    const subKeys = columnKeys.slice(2);

    statsCards = cleanedData.map((row) => {
      const rawPrimary = String(row[primaryKey] || '').trim();
      const isPercent = rawPrimary.includes('%');
      const numericVal = parseNumber(rawPrimary);
      // Detect text values — if parseNumber returns 0 but the raw value isn't
      // actually zero, treat it as a plain text value (e.g. "South Africa")
      const isText = isNaN(numericVal) || (numericVal === 0 && rawPrimary !== '0' && rawPrimary !== '0%' && !rawPrimary.match(/^-?[\d,. %]+$/));
      const primaryVal = isText ? null : numericVal;
      return {
        label: row[labelKey],
        primaryKey,
        primaryVal,
        primaryText: isText ? rawPrimary : null,
        isPercent,
        isText,
        hasSubColumns: subKeys.length > 0,
        subIndicators: subKeys.map((key) => {
          const val = parseNumber(row[key]);
          const diff = primaryVal !== null ? val - primaryVal : 0;
          return { key, val, diff, isPercent: String(row[key] || '').includes('%') };
        }),
      };
    });
  }

  const wrapperClass = [
    'block',
    'graph-block',
    data.independent ? 'independent' : '',
    data.useNarrow ? 'narrow' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const caption = data.description && (
    <figcaption className="graph-caption">
      {!data.independent && typeof figureNumber === 'number' ? (
        <strong>{`Figure ${figureNumber}: `}</strong>
      ) : null}
      {data.description}
    </figcaption>
  );

  // Loading state — CSV selected but fetch not yet complete
  if (hasFile && isLoading) {
    return (
      <div className={wrapperClass} ref={containerRef}>
        <div className="graph-inner">
          <div className="dv-spinner" role="status" aria-label="Loading data">
            <div className="dv-spinner__ring" />
          </div>
        </div>
      </div>
    );
  }

  // Empty state — no CSV selected yet
  if (!hasFile) {
    return (
      <div className={wrapperClass} ref={containerRef}>
        <div className="graph-inner">
          <div className="dv-empty-state">
            <div className="dv-empty-state__icon">📊</div>
            <p className="dv-empty-state__message">
              Select a CSV in the sidebar to activate your data view.
            </p>
            <a
              className="dv-empty-state__help"
              href={README_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              CSV format guide &rarr;
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={wrapperClass} ref={containerRef}>
      <div className="graph-inner">
        {data.title && <h3>{data.title}</h3>}

        {isStats ? (
          statsCards.length > 0 ? (
            <>
              <div
                className={`dv-stats-grid dv-stats-cols-${data.statColumns || '3'} dv-cards-${cardAppearance.alignClass}`}
              >
                <MobileCarousel enabled={!!data.mobileCarousel}>
                {statsCards.map((card, idx) => (
                  <div
                    key={idx}
                    className={['dv-stat-card', cardAppearance.colorClass, cardAppearance.themeClass].filter(Boolean).join(' ')}
                    style={cardAppearance.style}
                  >
                    <div className="dv-stat-card__label">{card.label}</div>
                    <div className="dv-stat-card__primary">
                      {card.isText ? (
                        <span className="dv-stat-value-number">{card.primaryText}</span>
                      ) : (
                        <CountUp
                          end={card.primaryVal}
                          duration={data.statAnimationMs || 1500}
                        />
                      )}
                      {card.isPercent && !card.isText && (
                        <span className="dv-stat-card__unit">%</span>
                      )}
                    </div>
                    {card.hasSubColumns && (
                      <div className="dv-stat-card__primary-label">
                        {card.primaryKey}
                      </div>
                    )}
                    {card.subIndicators.length > 0 && (
                      <ul className="dv-stat-card__subs">
                        {card.subIndicators.map((sub, si) => {
                          const higher = sub.val > card.primaryVal;
                          const lower = sub.val < card.primaryVal;
                          const arrow = higher ? '▲' : lower ? '▼' : '—';
                          const dirClass = higher
                            ? 'dv-stat-card__sub--up'
                            : lower
                            ? 'dv-stat-card__sub--down'
                            : 'dv-stat-card__sub--neutral';
                          const displayVal = sub.isPercent
                            ? `${sub.val}%`
                            : sub.val.toLocaleString();
                          return (
                            <li key={si} className={`dv-stat-card__sub ${dirClass}`}>
                              <span className="dv-stat-card__sub-arrow">
                                {arrow}
                              </span>
                              <span className="dv-stat-card__sub-label">
                                {sub.key}:
                              </span>
                              <span className="dv-stat-card__sub-val">
                                {displayVal}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                ))}
                </MobileCarousel>
              </div>
              {caption}
            </>
          ) : (
            <div className="dv-load-error">Could not load data — check the CSV file and delimiter setting.</div>
          )
        ) : isRankedCards ? (
          rankedCardsData.length > 0 ? (
            <>
              <div className={`dv-ranked-cards dv-ranked-cards--cols-${data.rankedCardColumns || '3'} dv-cards-${cardAppearance.alignClass}`}>
                <MobileCarousel enabled={!!data.mobileCarousel}>
                {rankedCardsData.map((card, ci) => (
                  <div
                    key={ci}
                    className={['dv-ranked-card', cardAppearance.colorClass, cardAppearance.themeClass].filter(Boolean).join(' ')}
                    style={cardAppearance.style}
                  >
                    <div className="dv-ranked-card__header">
                      <h4 className="dv-ranked-card__title">{card.title}</h4>
                      {card.subtitle && (
                        <p className="dv-ranked-card__subtitle">{card.subtitle}</p>
                      )}
                    </div>
                    <ol className="dv-ranked-card__list">
                      {card.rows.map((row, ri) => {
                        const displayVal = row.isPercent
                          ? `${row.value}%`
                          : row.value.toLocaleString();
                        return (
                          <li key={ri} className="dv-ranked-card__item">
                            {data.showBarInCards && (
                              <div className={`dv-ranked-bar__track${data.showBarTrack !== false ? '' : ' dv-ranked-bar__track--no-bg'}`}>
                                <div
                                  className="dv-ranked-bar__fill"
                                  style={{ width: `${row.pct}%` }}
                                />
                              </div>
                            )}
                            <div className="dv-ranked-card__item-meta">
                              <span className="dv-ranked-card__item-rank">{ri + 1}.</span>
                              <span className="dv-ranked-card__item-label">{row.label}</span>
                              <span className="dv-ranked-card__item-value">{displayVal}</span>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                ))}
                </MobileCarousel>
              </div>
              {caption}
            </>
          ) : (
            <div className="dv-load-error">Could not load data — check the CSV file and delimiter setting.</div>
          )
        ) : isRankedBars ? (
          rankedBarsData.length > 0 ? (
            <>
              <div className={`dv-ranked-bar-groups dv-cards-${cardAppearance.alignClass}`}>
                <MobileCarousel enabled={!!data.mobileCarousel}>
                {rankedBarsData.map((group, gi) => {
                  const showTrack = data.showBarTrack !== false;
                  return (
                    <div
                      key={gi}
                      className={['dv-ranked-bar-group', cardAppearance.colorClass, cardAppearance.themeClass].filter(Boolean).join(' ')}
                      style={cardAppearance.style}
                    >
                      {group.title && (
                        <div className="dv-ranked-bar-group__header">
                          <h4 className="dv-ranked-bar-group__title">{group.title}</h4>
                          {group.subtitle && (
                            <p className="dv-ranked-bar-group__subtitle">{group.subtitle}</p>
                          )}
                        </div>
                      )}
                      <ul className="dv-ranked-bars">
                        {group.rows.map((row, i) => {
                          const displayVal = row.isPercent
                            ? `${row.value}%`
                            : row.value.toLocaleString();
                          return (
                            <li key={i} className="dv-ranked-bar">
                              <div className={`dv-ranked-bar__track${showTrack ? '' : ' dv-ranked-bar__track--no-bg'}`}>
                                <div
                                  className="dv-ranked-bar__fill"
                                  style={{ width: `${row.pct}%` }}
                                />
                              </div>
                              <div className="dv-ranked-bar__meta">
                                <span className="dv-ranked-bar__label">{row.label}</span>
                                <span className="dv-ranked-bar__value">{displayVal}</span>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
                </MobileCarousel>
              </div>
              {caption}
            </>
          ) : (
            <div className="dv-load-error">Could not load data — check the CSV file and delimiter setting.</div>
          )
        ) : isTable ? (
          parsedData ? (
            <>
              {data.chartType === 'searchableTable' && (
                <div className="graph-table-search">
                  <input
                    type="text"
                    className="graph-table-search__input"
                    placeholder={data.searchPlaceholder || 'Search...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    aria-label="Search table"
                  />
                  {searchTerm && (
                    <span className="graph-table-search__count">
                      {tableRows.length} of{' '}
                      {
                        parsedData.filter(
                          (r) => Object.values(r).join('').trim() !== '',
                        ).length
                      }{' '}
                      rows
                    </span>
                  )}
                </div>
              )}
              <div className="graph-table-wrapper">
                <table className="graph-table">
                  <thead>
                    <tr>
                      {tableHeaders.map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.length > 0 ? (
                      tableRows.map((row, i) => (
                        <tr key={i}>
                          {tableHeaders.map((h) => (
                            <td key={h} data-label={h}>
                              {row[h] || ''}
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={tableHeaders.length}
                          className="graph-table__no-results"
                        >
                          No results match your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {caption}
            </>
          ) : (
            <div className="dv-load-error">Could not load data — check the CSV file and delimiter setting.</div>
          )
        ) : parsedData ? (
          <>
            <div className="chart-container">
              <Chart
                key={`${windowWidth}-${chartType}`}
                type={chartType}
                data={chartData}
                options={chartOptions}
                plugins={[ChartDataLabels]}
              />
            </div>
            {caption}
          </>
        ) : (
          <div className="dv-load-error">Could not load data — check the CSV file and delimiter setting.</div>
        )}
      </div>
    </div>
  );
};

export default View;
