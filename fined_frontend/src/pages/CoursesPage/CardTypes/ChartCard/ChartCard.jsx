import { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import "./ChartCard.css";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Helper to replace terms in text with interactive spans
function renderDetailWithGlossary(detailText, glossaryTerms, activeTermIndex, setActiveTermIndex) {
  if (!glossaryTerms || glossaryTerms.length === 0) return <span className="ch-detail-text">{detailText}</span>;

  let elements = [detailText];

  glossaryTerms.forEach((gTerm, termIdx) => {
    const newElements = [];
    const termRegex = new RegExp(`\\b(${gTerm.term})\\b`, "i");

    elements.forEach((el) => {
      if (typeof el !== "string") {
        newElements.push(el);
        return;
      }
      const parts = el.split(termRegex);
      parts.forEach((part) => {
        if (part.toLowerCase() === gTerm.term.toLowerCase()) {
          const isActive = activeTermIndex === termIdx;
          newElements.push(
            <span key={`${termIdx}`} className="ch-glossary-wrapper">
              <button
                className={`ch-glossary-term ${isActive ? "active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTermIndex(isActive ? null : termIdx);
                }}
              >
                {part}
              </button>
              {isActive && (
                <div className="ch-glossary-tooltip">
                  <strong>{gTerm.term}</strong>
                  <p>{gTerm.definition}</p>
                  {gTerm.example && <p className="ch-example">e.g., {gTerm.example}</p>}
                </div>
              )}
            </span>
          );
        } else if (part) {
          newElements.push(part);
        }
      });
    });
    elements = newElements;
  });

  return <span className="ch-detail-text">{elements}</span>;
}

// Convert a hex color string (e.g., "#00e5a0") into an rgba string for the background
function hexToRgba(hex, alpha) {
  let c;
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    c = hex.substring(1).split("");
    if (c.length === 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c = "0x" + c.join("");
    return `rgba(${[(c >> 16) & 255, (c >> 8) & 255, c & 255].join(",")},${alpha})`;
  }
  return hex;
}

function ChartCard({ card, onContinue }) {
  const {
    title = "",
    body_text_top = "",
    labels = [],
    datasets = [],
    chart_caption,
    stat_chips = [],
    body_text_bottom,
    glossary_terms = [],
    cta_text = "Continue",
  } = card?.card_data || {};

  const [activeTermIndex, setActiveTermIndex] = useState(null);

  // Build the chart.js data object
  const chartData = {
    labels: labels,
    datasets: datasets.map((ds) => ({
      label: ds.label,
      data: ds.data,
      borderColor: ds.color,
      backgroundColor: hexToRgba(ds.color, 0.06),
      borderWidth: 2.5,
      pointRadius: 3,
      tension: 0.4,
      fill: false,
    })),
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 1200, easing: "easeOutQuart" },
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#111827",
        titleFont: { family: "Syne, sans-serif", size: 13 },
        bodyFont: { family: "DM Sans, sans-serif", size: 13 },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: function (context) {
            return (
              context.dataset.label +
              ": ₹" +
              Math.round(context.raw).toLocaleString("en-IN")
            );
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: "DM Sans, sans-serif", size: 11 }, color: "#6b7280" },
      },
      y: {
        border: { display: false },
        grid: { color: "#f3f4f6" },
        ticks: {
          font: { family: "DM Sans, sans-serif", size: 11 },
          color: "#6b7280",
          callback: function (value) {
            if (value >= 1e7) return "₹" + (value / 1e7).toFixed(1) + "Cr";
            if (value >= 1e5) return "₹" + (value / 1e5).toFixed(1) + "L";
            return "₹" + value.toLocaleString("en-IN");
          },
        },
      },
    },
  };

  return (
    <div className="ch-root" onClick={() => setActiveTermIndex(null)}>
      <h2 className="ch-title">{title}</h2>
      
      {body_text_top && (
        <p className="ch-body">
          {renderDetailWithGlossary(body_text_top, glossary_terms, activeTermIndex, setActiveTermIndex)}
        </p>
      )}

      <div className="ch-chart-container">
        <Line data={chartData} options={chartOptions} />
      </div>
      
      {chart_caption && <p className="ch-chart-caption">{chart_caption}</p>}

      {stat_chips.length > 0 && (
        <div className="ch-stat-grid">
          {stat_chips.map((chip, idx) => (
            <div 
              key={idx} 
              className="ch-stat-chip"
              style={{
                background: hexToRgba(chip.color, 0.06),
                borderColor: hexToRgba(chip.color, 0.25)
              }}
            >
              <div className="ch-stat-val" style={{ color: chip.color }}>{chip.value}</div>
              <div className="ch-stat-lbl">{chip.label}</div>
            </div>
          ))}
        </div>
      )}

      {body_text_bottom && (
        <p className="ch-body">
          {renderDetailWithGlossary(body_text_bottom, glossary_terms, activeTermIndex, setActiveTermIndex)}
        </p>
      )}

      <button className="ch-btn-primary" onClick={onContinue}>
        {cta_text} →
      </button>
    </div>
  );
}

export default ChartCard;
