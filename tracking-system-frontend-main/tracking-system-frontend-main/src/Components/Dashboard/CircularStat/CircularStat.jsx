import './CircularStat.scss';

const SIZES = {
  lg: { dimension: 108, stroke: 8, fontSize: '1.25rem' },
  md: { dimension: 90, stroke: 7, fontSize: '1.05rem' },
  sm: { dimension: 72, stroke: 6, fontSize: '0.9rem' },
};

export default function CircularStat({
  value = 0,
  max = 100,
  label,
  sublabel,
  color = '#73ded6',
  size = 'lg',
  showPercent = true,
}) {
  const config = SIZES[size] || SIZES.lg;
  const { dimension, stroke, fontSize } = config;
  const radius = (dimension - stroke) / 2 - 4;
  const circumference = 2 * Math.PI * radius;
  const safeMax = max > 0 ? max : 1;
  const percent = Math.min(Math.round((value / safeMax) * 100), 100);
  const offset = circumference - (percent / 100) * circumference;
  const center = dimension / 2;

  return (
    <div className={`circular-stat circular-stat--${size}`}>
      <div className="circular-stat__ring-wrap">
        <svg
          className="circular-stat__svg"
          width={dimension}
          height={dimension}
          viewBox={`0 0 ${dimension} ${dimension}`}
          aria-hidden
        >
          <circle
            className="circular-stat__track"
            cx={center}
            cy={center}
            r={radius}
            strokeWidth={stroke}
          />
          <circle
            className="circular-stat__progress"
            cx={center}
            cy={center}
            r={radius}
            strokeWidth={stroke}
            stroke={color}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${center} ${center})`}
          />
        </svg>
        <div className="circular-stat__center">
          <span className="circular-stat__value" style={{ fontSize }}>
            {showPercent ? `${percent}%` : value}
          </span>
          {!showPercent && sublabel && (
            <span className="circular-stat__mini">{sublabel}</span>
          )}
        </div>
      </div>

      <div className="circular-stat__meta">
        <p className="circular-stat__label">{label}</p>
        <p className="circular-stat__count">
          <strong>{value}</strong>
          {max > 0 && showPercent && (
            <span className="circular-stat__of"> / {max}</span>
          )}
        </p>
        {sublabel && showPercent && (
          <p className="circular-stat__sublabel">{sublabel}</p>
        )}
      </div>
    </div>
  );
}
