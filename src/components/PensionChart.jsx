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

// ── مقياس الاستعداد التقاعدي (gauge) ─────────────────────────────
export function GaugeMeter({ pct, size = 180, currentM = 0, targetM = 0 }) {
  const cx = size / 2, cy = size / 2;
  const r = (size / 2) - 16;
  const strokeW = 13;
  const maxAngle = 220;
  const startAngle = -110;
  const toRad = d => d * Math.PI / 180;
  const arcPath = (sDeg, eDeg) => {
    const sr = toRad(sDeg), er = toRad(eDeg);
    const x1 = cx + r * Math.cos(sr), y1 = cy + r * Math.sin(sr);
    const x2 = cx + r * Math.cos(er), y2 = cy + r * Math.sin(er);
    return `M ${x1} ${y1} A ${r} ${r} 0 ${(eDeg - sDeg) > 180 ? 1 : 0} 1 ${x2} ${y2}`;
  };
  const clamp = Math.min(Math.max(pct, 0), 1);
  const progAngle = maxAngle * clamp;
  const color = pct < 0.5 ? '#EF4444' : pct < 0.8 ? '#F59E0B' : '#10B981';
  const pctNum = Math.round(Math.min(pct, 9.99) * 100);

  return (
    <Svg width={size} height={size}>
      <Path d={arcPath(startAngle, startAngle + maxAngle)} stroke="#1E293B" strokeWidth={strokeW} fill="none" strokeLinecap="round" />
      {progAngle > 1 && (
        <Path d={arcPath(startAngle, startAngle + progAngle)} stroke={color} strokeWidth={strokeW} fill="none" strokeLinecap="round" />
      )}
      <SvgText x={cx} y={cy - 8} textAnchor="middle" fontSize={size * 0.17} fontWeight="900" fill={color} fontFamily="System">
        {pctNum}%
      </SvgText>
      <SvgText x={cx} y={cy + 13} textAnchor="middle" fontSize={size * 0.072} fill={txt2} fontFamily="System">
        استعداد تقاعدي
      </SvgText>
      {currentM > 0 && targetM > 0 && (
        <SvgText x={cx} y={cy + 30} textAnchor="middle" fontSize={size * 0.063} fill="#475569" fontFamily="System">
          {Math.round(currentM)} / {targetM} شهر
        </SvgText>
      )}
    </Svg>
  );
}

// ── مخطط المسار الزمني (area) ──────────────────────────────────────
const fK = n => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(Math.round(n));

export function AreaChart({ points, width = 320, height = 160, color = gold, target = 0 }) {
  if (!points || points.length < 2) return null;
  const PL = 44, PT = 14, PB = 26, PR = 22;
  const cW = width - PL - PR;
  const cH = height - PT - PB;
  const pensions = points.map(p => p.pension);
  const minV = Math.min(...pensions);
  const maxV = Math.max(...pensions, target ? target * 1.08 : 0);
  const rng = maxV - minV || 1;
  const px = i => PL + (i / (points.length - 1)) * cW;
  const py = v => PT + cH - ((v - minV) / rng) * cH;
  const base = PT + cH;

  const linePts = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${px(i).toFixed(1)},${py(p.pension).toFixed(1)}`).join(' ');
  const areaPath = `${linePts} L${px(points.length - 1).toFixed(1)},${base} L${px(0).toFixed(1)},${base} Z`;

  const step = Math.max(1, Math.ceil((points.length - 1) / 4));
  const xIdxs = [...new Set([0, step, step * 2, step * 3, points.length - 1])].filter(i => i < points.length);
  const yVals = [minV, Math.round((minV + maxV) / 2), maxV];

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="aG" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.35" />
          <Stop offset="1" stopColor={color} stopOpacity="0.02" />
        </LinearGradient>
      </Defs>
      {[0.33, 0.67, 1].map((r, i) => (
        <Line key={i} x1={PL} y1={PT + cH * (1 - r)} x2={width - PR} y2={PT + cH * (1 - r)} stroke="#1E293B" strokeWidth="0.6" strokeDasharray="4,3" />
      ))}
      <Path d={areaPath} fill="url(#aG)" />
      <Path d={linePts} stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {yVals.map((v, i) => (
        <SvgText key={i} x={PL - 4} y={py(v) + 4} textAnchor="end" fontSize="8" fill={txt2} fontFamily="System">
          {fK(v)}
        </SvgText>
      ))}
      {xIdxs.map(i => (
        <SvgText key={i} x={px(i)} y={height - 5} textAnchor="middle" fontSize="8" fill={txt2} fontFamily="System">
          {i === 0 ? 'الآن' : i === points.length - 1 ? 'التقاعد' : `+${points[i].year}س`}
        </SvgText>
      ))}
      {target > 0 && target >= minV && target <= maxV && (
        <>
          <Line x1={PL} y1={py(target)} x2={width - PR} y2={py(target)} stroke="#10B98170" strokeWidth="1.5" strokeDasharray="5,3" />
          <SvgText x={width - PR + 2} y={py(target) + 4} fontSize="8" fill="#10B981" fontFamily="System">70%</SvgText>
        </>
      )}
      <Circle cx={px(0)} cy={py(points[0].pension)} r="4" fill="#475569" />
      <Circle cx={px(points.length - 1)} cy={py(points[points.length - 1].pension)} r="5" fill={color} />
      <SvgText x={px(points.length - 1) - 2} y={py(points[points.length - 1].pension) - 9} textAnchor="end" fontSize="9.5" fontWeight="700" fill={color} fontFamily="System">
        {fK(points[points.length - 1].pension)}
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
