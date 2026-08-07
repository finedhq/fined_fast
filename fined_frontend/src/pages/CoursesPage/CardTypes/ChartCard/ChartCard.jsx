import { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import "./ChartCard.css";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Helper to replace terms in text with interactive spans
function renderDetailWithGlossary(detailText, glossaryTerms, activeTermIndex, setActiveTermIndex) {
  if (!glossaryTerms || glossaryTerms.length === 0 || typeof detailText !== "string") {
    if (typeof detailText === "string") {
      return <span className="ch-detail-text" dangerouslySetInnerHTML={{ __html: detailText }} />;
    }
    return <span className="ch-detail-text">{detailText}</span>;
  }

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

  // At the very end, map any remaining strings to dangerouslySetInnerHTML
  elements = elements.map((el, i) => {
    if (typeof el === "string") {
      return <span key={`html-${i}`} dangerouslySetInnerHTML={{ __html: el }} />;
    }
    return el;
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

// Helper to parse Key Takeaway and other special blocks
function parseSpecialText(text) {
  if (typeof text !== "string") return { type: "normal", content: text };
  
  if (text.trim().startsWith("**Key Takeaway:**")) {
    return {
      type: "takeaway",
      content: text.replace("**Key Takeaway:**", "").trim()
    };
  }
  return { type: "normal", content: text };
}

function ChartCard({ card, onContinue }) {
  const {
    card_label,
    title = "",
    quote,
    chart_style = "line",
    body_text_top = "",
    chart_data,
    labels = [],
    datasets = [],
    chart_caption,
    stats,
    stat_chips = [],
    body_text_bottom,
    value_prefix = "",
    value_suffix = "",
    highlight_line,
    glossary_terms = [],
    cta_text = "Continue",
  } = card?.card_data || {};

  const [activeTermIndex, setActiveTermIndex] = useState(null);

  const actualLabels = chart_data?.labels || labels || [];
  const actualDatasets = chart_data?.datasets || datasets || [];
  const chartHeight = chart_data?.height || "250px";

  // Build the chart.js data object
  const chartDataObj = {
    labels: actualLabels,
    datasets: actualDatasets.map((ds) => ({
      label: ds.label,
      data: ds.data,
      borderColor: ds.colors || ds.color,
      backgroundColor: ds.colors ? ds.colors.map(c => hexToRgba(c, chart_style === "bar" ? 0.7 : 0.06)) : hexToRgba(ds.color, chart_style === "bar" ? 0.7 : 0.06),
      borderWidth: chart_style === "bar" ? 1.5 : 2.5,
      borderRadius: chart_style === "bar" ? 8 : 0,
      pointRadius: chart_style === "bar" ? 0 : 3,
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
              ": " + value_prefix +
              context.raw.toLocaleString("en-IN", { maximumFractionDigits: 2 }) +
              value_suffix
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
            if (value >= 1e7) return value_prefix + (value / 1e7).toFixed(1) + "Cr" + value_suffix;
            if (value >= 1e5) return value_prefix + (value / 1e5).toFixed(1) + "L" + value_suffix;
            return value_prefix + value.toLocaleString("en-IN") + value_suffix;
          },
        },
      },
    },
  };

  // Determine stats fallback
  const finalStatsLayout = stats?.layout || (stat_chips?.length > 0 ? "grid" : null);
  const finalStatItems = stats?.items || stat_chips || [];

  return (
    <div className="ch-root" onClick={() => setActiveTermIndex(null)}>
      {card_label && <div className="ch-card-label">{card_label}</div>}
      
      <h2 className="ch-title">{title}</h2>
      
      {quote && (
        <div className="ch-quote-box">
          "{quote.text}"
          {quote.author && <cite>— {quote.author}</cite>}
        </div>
      )}

      {body_text_top && (() => {
        const parsed = parseSpecialText(body_text_top);
        if (parsed.type === "takeaway") {
          return (
            <div className="ch-takeaway-box">
              <div className="ch-takeaway-label">Key Takeaway</div>
              <div className="ch-takeaway-content">
                {renderDetailWithGlossary(parsed.content, glossary_terms, activeTermIndex, setActiveTermIndex)}
              </div>
            </div>
          );
        }
        return (
          <p className="ch-body">
            {renderDetailWithGlossary(body_text_top, glossary_terms, activeTermIndex, setActiveTermIndex)}
          </p>
        );
      })()}

      <div className="ch-chart-container" style={{ height: chartHeight }}>
        {chart_style === "bar" ? (
          <Bar data={chartDataObj} options={chartOptions} />
        ) : (
          <Line data={chartDataObj} options={chartOptions} />
        )}
      </div>
      
      {chart_caption && <p className="ch-chart-caption">{chart_caption}</p>}

      {finalStatsLayout === "row" && finalStatItems.length > 0 && (
        <div className="ch-stat-cards-row">
          {finalStatItems.map((item, idx) => {
            const hColor = item.highlight_color || "#00e5a0";
            const highlightStyle = item.is_highlighted ? {
              borderColor: hexToRgba(hColor, 0.3),
              background: hexToRgba(hColor, 0.05)
            } : {};
            return (
              <div key={idx} className="ch-stat-card" style={highlightStyle}>
                {item.emoji && <div className="ch-emoji">{item.emoji}</div>}
                <div className="ch-amount" style={item.is_highlighted ? { fontSize: "1.1rem" } : {}}>
                  {item.value}
                </div>
                <div className="ch-desc">{item.label}</div>
              </div>
            );
          })}
        </div>
      )}

      {finalStatsLayout === "grid" && finalStatItems.length > 0 && (
        <div className="ch-stat-grid">
          {finalStatItems.map((item, idx) => {
            const hColor = item.highlight_color || item.color || "#00e5a0";
            // For backward compatibility: if item.color is provided, use it (old stat_chips logic)
            // But if it's explicitly highlighted, use the highlight colors.
            let highlightStyle = {};
            if (item.is_highlighted) {
              highlightStyle = {
                background: hexToRgba(hColor, 0.06),
                borderColor: hexToRgba(hColor, 0.25)
              };
            } else if (item.color) { // Legacy style
               highlightStyle = {
                background: hexToRgba(item.color, 0.06),
                borderColor: hexToRgba(item.color, 0.25)
               }
            }

            const valColor = item.is_highlighted ? { color: "var(--accent, #111827)" } : (item.color ? { color: item.color } : {});
            if (item.is_highlighted && hColor !== "#00e5a0") {
              valColor.color = hColor;
            }

            return (
              <div key={idx} className="ch-stat-chip" style={highlightStyle}>
                <div className="ch-stat-val" style={valColor}>{item.value}</div>
                <div className="ch-stat-lbl">{item.label}</div>
              </div>
            );
          })}
        </div>
      )}

      {body_text_bottom && (() => {
        const parsed = parseSpecialText(body_text_bottom);
        const mTop = finalStatsLayout === "row" ? "18px" : "0";
        if (parsed.type === "takeaway") {
          return (
            <div className="ch-takeaway-box" style={{ marginTop: mTop }}>
              <div className="ch-takeaway-label">Key Takeaway</div>
              <div className="ch-takeaway-content">
                {renderDetailWithGlossary(parsed.content, glossary_terms, activeTermIndex, setActiveTermIndex)}
              </div>
            </div>
          );
        }
        return (
          <p className="ch-body" style={{ marginTop: mTop }}>
            {renderDetailWithGlossary(body_text_bottom, glossary_terms, activeTermIndex, setActiveTermIndex)}
          </p>
        );
      })()}

      {highlight_line && (() => {
        const parsed = parseSpecialText(highlight_line);
        if (parsed.type === "takeaway") {
          return (
            <div className="ch-takeaway-box" style={{ marginTop: "24px", marginBottom: "0" }}>
              <div className="ch-takeaway-label">Key Takeaway</div>
              <div className="ch-takeaway-content">
                {renderDetailWithGlossary(parsed.content, glossary_terms, activeTermIndex, setActiveTermIndex)}
              </div>
            </div>
          );
        }
        return (
          <div className="ch-highlight-line">
            {renderDetailWithGlossary(highlight_line, glossary_terms, activeTermIndex, setActiveTermIndex)}
          </div>
        );
      })()}

      <button className="ch-btn-primary" onClick={onContinue}>
        {cta_text}
      </button>
    </div>
  );
}

export default ChartCard;
