/**
 * BarChart — dependency-free SVG bar chart (vertical or horizontal).
 * data: [{ label, sub?, value, color }]. Colours are explicit hex so the chart
 * exports cleanly to PNG.
 */
import React from 'react';

const INK = '#0f172a';
const MUTED = '#64748b';
const GRID = '#e6eaf0';

export default function BarChart({ data, horizontal = false, max = 10, unit = '', height }) {
  if (horizontal) {
    const rowH = 26, padL = 132, padR = 44, padT = 8, padB = 8, W = 520;
    const H = padT + padB + data.length * rowH;
    const barW = W - padL - padR;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={height || H} role="img" style={{ fontFamily: 'system-ui, sans-serif' }}>
        {data.map((d, i) => {
          const y = padT + i * rowH;
          const w = Math.max(2, (Math.max(0, d.value ?? 0) / max) * barW);
          return (
            <g key={i}>
              <text x={padL - 8} y={y + rowH / 2 - 3} textAnchor="end" fontSize="12" fontWeight="600" fill={INK}>
                {d.label}
              </text>
              {d.sub && <text x={padL - 8} y={y + rowH / 2 + 9} textAnchor="end" fontSize="10" fill={MUTED}>{d.sub}</text>}
              <rect x={padL} y={y + 5} width={barW} height={rowH - 12} rx="6" fill="#eef2f7" />
              <rect x={padL} y={y + 5} width={w} height={rowH - 12} rx="6" fill={d.color} />
              <text x={padL + barW + 6} y={y + rowH / 2 + 1} fontSize="12" fontWeight="800" fill={d.color}>
                {d.value == null ? '—' : Math.round(d.value * 10) / 10}{unit}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  // vertical
  const W = 520, H = 240, padL = 34, padR = 12, padT = 22, padB = 34;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const n = data.length, band = plotW / n, bw = band * 0.56;
  const ticks = [0, max / 2, max];
  const yOf = (v) => padT + plotH - (Math.max(0, v) / max) * plotH;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={height || H} role="img" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={padL} y1={yOf(t)} x2={W - padR} y2={yOf(t)} stroke={GRID} />
          <text x={padL - 6} y={yOf(t) + 3} textAnchor="end" fontSize="10" fill={MUTED}>{t}</text>
        </g>
      ))}
      {data.map((d, i) => {
        const x = padL + i * band + (band - bw) / 2;
        const y = yOf(d.value ?? 0);
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={padT + plotH - y} rx="5" fill={d.color} />
            <text x={x + bw / 2} y={y - 5} textAnchor="middle" fontSize="12" fontWeight="800" fill={INK}>{d.value}</text>
            <text x={x + bw / 2} y={H - padB + 14} textAnchor="middle" fontSize="10" fill={MUTED}>{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
