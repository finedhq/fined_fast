import React from "react";

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(x, y, radius, startAngle, endAngle) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);

  const largeArcFlag = endAngle - startAngle > 180 ? "1" : "0";

  return [
    "M", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
  ].join(" ");
}

const FinScoreChart = ({ score = 0, max = 1000 }) => {
  const radius = 130;
  const strokeWidth = 40;
  const center = radius + strokeWidth / 2;

  const clampedScore = Math.max(0, Math.min(Number(score) || 0, max));
  const angle = (clampedScore / max) * 180;

  return (
    <svg width="300" height="170">
      <g transform={`rotate(-90 ${center} ${center})`}>
        {/* Background arc */}
        <path
          d={describeArc(center, center, radius, 0, 180)}
          fill="none"
          stroke="#e6d9fd"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Foreground arc */}
        <path
          d={describeArc(center, center, radius, 0, angle)}
          fill="none"
          stroke="#3a00b7"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      </g>

      {/* score text */}
      <text
        x="50%"
        y="135"
        textAnchor="middle"
        fontSize="32"
        fill="#000"
        fontWeight="bold"
      >
        {clampedScore}
      </text>
    </svg>
  );
};

export default FinScoreChart;
