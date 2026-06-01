import React from 'react';
import { View, Text } from 'react-native';
import Svg, { G, Rect, Line, Text as SvgText, Circle, Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const gold = '#F59E0B';
const gold2 = '#D97706';
const blu = '#3B82F6';
const grn = '#10B981';
const pur = '#8B5CF6';
const txt2 = '#94A3B8';
const brd = '#1E293B';

// ── مخطط الأعمدة ──────────────────────────────────────────────────
export function BarChart({ bars, width = 320, height = 180 }) {
  const PL = 10, PT = 30, PB = 36, PR = 10;
  const chartW = width - PL - PR;
  const chartH = height - PT - PB;
  const maxV = Math.max(...bars.map(b => b.val), 1);
  const bW = Math.min(48, (chartW / bars.length) * 0.6);
  const gap = (chartW - bW * bars.length) / (bars.length + 1);
  const bh = v => Math.max(4, (v / maxV) * chartH);
  const by = v => PT + chartH - bh(v);
  const bx = i => PL + gap + i * (bW + gap);

  return (
    <Svg width={width} height={height}>
      <Defs>
        {bars.map((b, i) => (
          <LinearGradient key={i} id={`barGrad${i}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={b.clr} stopOpacity="1" />
            <Stop offset="1" stopColor={b.clr} stopOpacity="0.5" />
          </LinearGradient>
        ))}
      </Defs>
      {[0.33, 0.67, 1].map((r, i) => (
        <Line key={i} x1={PL} y1={PT + chartH - r * chartH} x2={width - PR} y2={PT + chartH - r * chartH} stroke={brd} strokeWidth="0.5" strokeDasharray="4,4" />
      ))}
      {bars.map((b, i) => {
        const x = bx(i), h = bh(b.val), y = by(b.val);
        const fmtV = v => v >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(v);
        return (
          <G key={i}>
            <Rect x={x + 2} y={y + 2} width={bW} height={h} rx={6} fill="rgba(0,0,0,0.2)" />
            <Rect x={x} y={y} width={bW} height={h} rx={6} fill={`url(#barGrad${i})`} />
            <SvgText x={x + bW / 2} y={y - 7} textAnchor="middle" fontSize="9" fontWeight="700" fill={b.clr} fontFamily="System">
              {fmtV(b.val)}
            </SvgText>
            <SvgText x={x + bW / 2} y={height - 12} textAnchor="middle" fontSize="8.5" fill={txt2} fontFamily="System">
              {b.lb}
            </SvgText>
          </G>
        );
      })}
      <Line x1={PL} y1={PT + chartH} x2={width - PR} y2={PT + chartH} stroke={brd} strokeWidth="1" />
    </Svg>
  );
}

// ── مخطط الدائرة (progress arc) ──────────────────────────────────
export function ArcProgress({ pct, size = 140, color = gold, label = '', sublabel = '' }) {
  const cx = size / 2, cy = size / 2;
  const r = (size / 2) - 14;
  const strokeW = 10;
  const circumference = 2 * Math.PI * r;
  const maxAngle = 220;
  const startAngle = -110;
  const progressAngle = maxAngle * Math.min(pct, 1);

  const toRad = deg => (deg * Math.PI) / 180;
  const arcPath = (startDeg, endDeg, rx, ry, cxv, cyv) => {
    const s = toRad(startDeg);
    const e = toRad(endDeg);
    const x1 = cxv + rx * Math.cos(s), y1 = cyv + ry * Math.sin(s);
    const x2 = cxv + rx * Math.cos(e), y2 = cyv + ry * Math.sin(e);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${rx} ${ry} 0 ${large} 1 ${x2} ${y2}`;
  };

  const bgPath = arcPath(startAngle, startAngle + maxAngle, r, r, cx, cy);
  const fgPath = progressAngle > 0 ? arcPath(startAngle, startAngle + progressAngle, r, r, cx, cy) : null;

  return (
    <Svg width={size} height={size}>
      <Path d={bgPath} stroke="#1E293B" strokeWidth={strokeW} fill="none" strokeLinecap="round" />
      {fgPath && (
        <Path d={fgPath} stroke={color} strokeWidth={strokeW} fill="none" strokeLinecap="round" />
      )}
      <SvgText x={cx} y={cy - 4} textAnchor="middle" fontSize="22" fontWeight="900" fill={color} fontFamily="System">
        {label}
      </SvgText>
      <SvgText x={cx} y={cy + 14} textAnchor="middle" fontSize="9" fill={txt2} fontFamily="System">
        {sublabel}
      </SvgText>
    </Svg>
  );
}

// ── مخطط التوزيع (donut) ─────────────────────────────────────────
export function DonutChart({ segments, size = 160, label = '', sublabel = '' }) {
  const cx = size / 2, cy = size / 2;
  const r = (size / 2) - 18;
  const total = segments.reduce((s, x) => s + x.val, 0);
  if (!total) return null;

  let currentAngle = -90;
  const paths = segments.filter(s => s.val > 0).map(seg => {
    const angle = (seg.val / total) * 360;
    const startRad = (currentAngle * Math.PI) / 180;
    const endRad = ((currentAngle + angle) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad), y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad), y2 = cy + r * Math.sin(endRad);
    const large = angle > 180 ? 1 : 0;
    const d = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
    currentAngle += angle;
    return { d, color: seg.clr, strokeW: 12 };
  });

  return (
    <Svg width={size} height={size}>
      <Circle cx={cx} cy={cy} r={r} stroke="#1E293B" strokeWidth="12" fill="none" />
      {paths.map((p, i) => (
        <Path key={i} d={p.d} stroke={p.color} strokeWidth={p.strokeW} fill="none" strokeLinecap="butt" />
      ))}
      <SvgText x={cx} y={cy - 4} textAnchor="middle" fontSize="18" fontWeight="900" fill={gold} fontFamily="System">
        {label}
      </SvgText>
      <SvgText x={cx} y={cy + 14} textAnchor="middle" fontSize="9" fill={txt2} fontFamily="System">
        {sublabel}
      </SvgText>
    </Svg>
  );
}
