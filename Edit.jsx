
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
import { SidebarPortal, BlockDataForm } from '@plone/volto/components';
import schema from './schema';
import './style.css';
import { GRAPH_COLOURS, PIE_COLOURS } from './index';

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
  DoughnutController
);

const Edit = ({ data, block, onChangeBlock, selected }) => {
  const [parsedData, setParsedData] = useState(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [figureNumber, setFigureNumber] = useState(null);
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
          if (!blocks[i].classList.contains('independent')) {
            count++;
          }
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
    fetch(url)
      .then((res) => res.text())
      .then((csvText) => {
        const result = Papa.parse(csvText, { header: true });
        console.log('GRAPH DEBUG:', {
          block,
          figureNumber,
          file,
          rows: result.data.length,
        });
        setParsedData(result.data);
      })
      .catch((err) => {
        console.error('CSV load error:', err);
      });
  }, [data.csvFile]);

  let chartData = null;
  let chartOptions = null;

  if (parsedData) {
    const isPieChart = data.chartType === 'pie' || data.chartType === 'doughnut';
    const cleanedData = parsedData.filter(
      (row) => Object.values(row).join('').trim() !== ''
    );

    const columnKeys = Object.keys(cleanedData[0] || {});
    const labelKey = columnKeys[0];
    const datasetKeys = columnKeys.slice(1);

    chartData = {
      labels: cleanedData.map((row) => row[labelKey]),
      datasets: datasetKeys.map((key, i) => ({
        label: key,
        data: cleanedData.map((row) => Number(row[key])),
        backgroundColor: isPieChart ? PIE_COLOURS : GRAPH_COLOURS[i % GRAPH_COLOURS.length],
        borderColor: isPieChart ? PIE_COLOURS : GRAPH_COLOURS[i % GRAPH_COLOURS.length],
        borderWidth: 1,
      })),
    };

    chartOptions = {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: isPieChart || datasetKeys.length > 1,
        },
      },
      scales: isPieChart
        ? {}
        : {
            x: {
              title: {
                display: Boolean(data.xLabel),
                text: data.xLabel || '',
              },
            },
            y: {
              title: {
                display: Boolean(data.yLabel),
                text: data.yLabel || '',
              },
            },
          },
    };
  }

  const wrapperClass = [
    'block',
    'graph-block',
    data.independent ? 'independent' : '',
    data.useNarrow ? 'narrow' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClass} ref={containerRef}>
      <div className="graph-inner">
        {data.title && <h3>{data.title}</h3>}

        {parsedData ? (
          <>
            <div className="chart-container">
              <Chart
                key={windowWidth}
                type={data.chartType || 'bar'}
                data={chartData}
                options={chartOptions}
              />
            </div>
            {data.description && (
              <figcaption className="graph-caption">
                {!data.independent && typeof figureNumber === 'number' ? (
                  <strong>{`Figure ${figureNumber}: `}</strong>
                ) : null}
                {data.description}
              </figcaption>
            )}
          </>
        ) : (
          <div style={{ color: 'red' }}>No graph data loaded</div>
        )}
      </div>
      {selected && (
        <SidebarPortal selected={selected}>
          <BlockDataForm
            schema={schema()}
            title="Graph block"
            onChangeField={(id, value) =>
              onChangeBlock(block, { ...data, [id]: value })
            }
            block={block}
            formData={data}
          />
        </SidebarPortal>
      )}
    </div>
  );
};

export default Edit;
