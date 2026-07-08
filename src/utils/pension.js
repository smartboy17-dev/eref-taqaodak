// ── محرك حسابات التقاعد (GOSI) ────────────────────────────────────
// يطبق المنهجية الرسمية الكاملة لإعداد التسويات

// ── احتساب الأشهر (ميلادي) ──────────────────────────────────────────
const GOSI_CUT = new Date('2022-02-01');
const _gldG = d => { const dt = new Date(d); return new Date(dt.getFullYear(), dt.getMonth() + 1, 0).getDate() === dt.getDate() };
const _oldG = (s, e) => { const sd = new Date(s), ed = new Date(e); if (sd.getFullYear() === ed.getFullYear() && sd.getMonth() === ed.getMonth()) return 1; return (ed.getFullYear() - sd.getFullYear()) * 12 + (ed.getMonth() - sd.getMonth()) + (_gldG(e) ? 1 : 0) };
const _newG = (s, e) => { const sd = new Date(s), ed = new Date(e); let tot = 0, cur = new Date(sd.getFullYear(), sd.getMonth(), 1); while (cur <= ed) { const nxt = new Date(cur.getFullYear(), cur.getMonth() + 1, 1); const dim = Math.round((nxt - cur) / 864e5); const rs = sd > cur ? sd : cur; const re = ed < new Date(nxt - 864e5) ? ed : new Date(nxt - 864e5); if (re >= rs) tot += (Math.round((re - rs) / 864e5) + 1) / dim; cur = nxt } return tot };
const mdf = (s, e) => { if (!s || !e) return { m: 0, d: 0, t: 0 }; const a = new Date(s), b = new Date(e); if (isNaN(a) || isNaN(b) || b < a) return { m: 0, d: 0, t: 0 }; const tot = b < GOSI_CUT ? _oldG(s, e) : a >= GOSI_CUT ? _newG(s, e) : _oldG(s, new Date(+GOSI_CUT - 864e5).toISOString().split('T')[0]) + _newG('2022-02-01', e); const m = Math.floor(tot); return { m, d: Math.round((tot - m) * 30), t: tot } };

// ── احتساب الأشهر (هجري) ────────────────────────────────────────────
export const dateToHijriParts = d => { if (!d) return null; try { const p = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric', month: 'numeric', year: 'numeric' }).formatToParts(new Date(d)); const r = {}; for (const x of p) { if (x.type === 'year') r.hy = +x.value; else if (x.type === 'month') r.hm = +x.value; else if (x.type === 'day') r.hd = +x.value } return r.hy ? r : null } catch { return null } };
export const isoToHijriStr = iso => { if (!iso) return ''; const h = dateToHijriParts(iso); return h ? `${h.hy}/${String(h.hm).padStart(2, '0')}/${String(h.hd).padStart(2, '0')}` : '' };
export const hijriStrToIso = str => { if (!str) return ''; const m = str.replace(/\//g, '-').match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/); if (!m) return ''; const hy = +m[1], hm = +m[2], hd = +m[3]; if (hy < 1300 || hy > 1500 || hm < 1 || hm > 12 || hd < 1 || hd > 30) return ''; const est = new Date(Date.UTC(622, 6, 16) + ((hy - 1) * 354.367 + (hm - 1) * 29.53 + hd - 1) * 864e5); for (let o = -5; o <= 5; o++) { const d = new Date(est.getTime() + o * 864e5); const h = dateToHijriParts(d); if (h && h.hy === hy && h.hm === hm && h.hd === hd) return d.toISOString().split('T')[0] } return est.toISOString().split('T')[0] };
const hijriToDate = (hy, hm, hd) => { const iso = hijriStrToIso(`${hy}/${String(hm).padStart(2, '0')}/${String(hd).padStart(2, '0')}`); return iso ? new Date(iso) : null };
const hijriMonthDays = (hy, hm) => { const d1 = hijriToDate(hy, hm, 1); const nm = hm === 12 ? 1 : hm + 1, ny = hm === 12 ? hy + 1 : hy; const d2 = hijriToDate(ny, nm, 1); if (!d1 || !d2) return 30; return Math.round((d2 - d1) / 864e5) };
const _gldH = iso => { const h = dateToHijriParts(iso); return h ? h.hd === hijriMonthDays(h.hy, h.hm) : false };
const _oldH = (s, e) => { const a = dateToHijriParts(s), b = dateToHijriParts(e); if (!a || !b) return 0; if (a.hy === b.hy && a.hm === b.hm) return 1; return (b.hy - a.hy) * 12 + (b.hm - a.hm) + (_gldH(e) ? 1 : 0) };
const _newH = (s, e) => { const a = dateToHijriParts(s), b = dateToHijriParts(e); if (!a || !b) return 0; let tot = 0, hy = a.hy, hm = a.hm; const sd = new Date(s), ed = new Date(e); while (hy < b.hy || (hy === b.hy && hm <= b.hm)) { const mS = hijriToDate(hy, hm, 1); if (!mS) break; const nhy = hm === 12 ? hy + 1 : hy, nhm = hm === 12 ? 1 : hm + 1; const mEN = hijriToDate(nhy, nhm, 1); if (!mEN) break; const mE = new Date(mEN.getTime() - 864e5); const dim = Math.round((mE - mS) / 864e5) + 1; const rs = sd > mS ? sd : mS; const re = ed < mE ? ed : mE; if (re >= rs) tot += (Math.round((re - rs) / 864e5) + 1) / dim; if (hm === 12) { hy++; hm = 1 } else hm++ } return tot };
const mdfH = (s, e) => { if (!s || !e) return { m: 0, d: 0, t: 0 }; const a = new Date(s), b = new Date(e); if (isNaN(a) || isNaN(b) || b < a) return { m: 0, d: 0, t: 0 }; const tot = b < GOSI_CUT ? _oldH(s, e) : a >= GOSI_CUT ? _newH(s, e) : _oldH(s, new Date(+GOSI_CUT - 864e5).toISOString().split('T')[0]) + _newH('2022-02-01', e); const m = Math.floor(tot); return { m, d: Math.round((tot - m) * 30), t: tot } };
export const mdfCal = (s, e, cal) => cal === 'h' ? mdfH(s, e) : mdf(s, e);

// ── الفجوة الهجرية ──────────────────────────────────────────────────
export const hijriGap = (dA, dB) => {
  const a = dateToHijriParts(dA), b = dateToHijriParts(dB);
  if (!a || !b) { const ce = new Date(dA), re = new Date(dB); let dY = re.getFullYear() - ce.getFullYear(), dM = re.getMonth() - ce.getMonth(), dD = re.getDate() - ce.getDate(); if (dD < 0) { dM--; dD += new Date(re.getFullYear(), re.getMonth(), 0).getDate() } if (dM < 0) { dY--; dM += 12 } return { dY: Math.max(0, dY), dM: Math.max(0, dM), dD: Math.max(0, dD) } }
  let dD = b.hd - a.hd, dM = b.hm - a.hm, dY = b.hy - a.hy;
  if (dD < 0) { dM--; dD += 30 } if (dM < 0) { dY--; dM += 12 }
  return { dY: Math.max(0, dY), dM: Math.max(0, dM), dD: Math.max(0, dD) };
};

// ── العمر ──────────────────────────────────────────────────────────
export const ageAt = (bd, td) => { if (!bd || !td) return { g: 0, h: 0 }; const g = (new Date(td) - new Date(bd)) / (365.25 * 864e5); return { g: +(g).toFixed(1), h: +(g * 1.03069).toFixed(1) } };
export const ageNow = (bd) => { if (!bd) return { g: 0, h: 0 }; const g = (Date.now() - new Date(bd)) / (365.25 * 864e5); return { g: +(g).toFixed(1), h: +(g * 1.03069).toFixed(1) } };

// ── الجدول الاكتواري رقم 5 (م/53) ────────────────────────────────────
const AT = { 1: 1.04, 2: 1.0816, 3: 1.12486, 4: 1.16986, 5: 1.21665, 6: 1.26532, 7: 1.31593, 8: 1.36857, 9: 1.42331, 10: 1.48024, 11: 1.53945, 12: 1.60103, 13: 1.66507, 14: 1.73168, 15: 1.80094, 16: 1.87298, 17: 1.9479, 18: 2.02582, 19: 2.10685, 20: 2.19112, 21: 2.27877, 22: 2.30992, 23: 2.46472, 24: 2.5633, 25: 2.66584, 26: 2.77247, 27: 2.88337, 28: 2.9987, 29: 3.11865, 30: 3.2434, 31: 3.37313, 32: 3.50806, 33: 3.64838, 34: 3.79432, 35: 3.94609, 36: 4.10393, 37: 4.26809, 38: 4.43881, 39: 4.61637, 40: 4.80102 };
export const actCalc = (y, m, d) => { if (y <= 0 && m <= 0) return { aM: 0, base: 1, next: 1, diff: 0, final: 1 }; const aM = d >= 15 ? m + 1 : m, cy = Math.min(Math.max(y, 1), 40); const base = AT[cy], next = y >= 40 ? AT[40] : AT[Math.min(cy + 1, 40)]; const diff = +(next - base).toFixed(5), final = +(base + (diff * aM / 12)).toFixed(5); return { aM, base, next, diff, final } };

// ── جداول سن التقاعد والاشتراط المبكر ────────────────────────────────
const RA = [
  { mn: 48.5, rY: 58, rM: 0 }, { mn: 48, mx: 48.5, rY: 58, rM: 4 }, { mn: 47, mx: 48, rY: 58, rM: 8 },
  { mn: 46, mx: 47, rY: 59, rM: 0 }, { mn: 45, mx: 46, rY: 59, rM: 4 }, { mn: 44, mx: 45, rY: 59, rM: 8 },
  { mn: 43, mx: 44, rY: 60, rM: 0 }, { mn: 42, mx: 43, rY: 60, rM: 4 }, { mn: 41, mx: 42, rY: 60, rM: 8 },
  { mn: 40, mx: 41, rY: 61, rM: 0 }, { mn: 39, mx: 40, rY: 61, rM: 4 }, { mn: 38, mx: 39, rY: 61, rM: 8 },
  { mn: 37, mx: 38, rY: 62, rM: 0 }, { mn: 36, mx: 37, rY: 62, rM: 4 }, { mn: 35, mx: 36, rY: 62, rM: 8 },
  { mn: 34, mx: 35, rY: 63, rM: 0 }, { mn: 33, mx: 34, rY: 63, rM: 4 }, { mn: 32, mx: 33, rY: 63, rM: 8 },
  { mn: 31, mx: 32, rY: 64, rM: 0 }, { mn: 30, mx: 31, rY: 64, rM: 4 }, { mn: 29, mx: 30, rY: 64, rM: 8 },
  { mn: 0, mx: 29, rY: 65, rM: 0 },
];
const ET = [
  { mnM: 228, req: 300, y: 25 }, { mnM: 216, mxM: 227, req: 312, y: 26 },
  { mnM: 204, mxM: 215, req: 324, y: 27 }, { mnM: 192, mxM: 203, req: 336, y: 28 },
  { mnM: 180, mxM: 191, req: 348, y: 29 }, { mnM: 0, mxM: 179, req: 360, y: 30 },
];

export const retInfo = (bd, mRAtRF) => {
  if (!bd) return { rY: 60, rM: 0, lb: '60 سنة', dt: null, ex: false, eR: 300, eY: 25 };
  const bdH = dateToHijriParts(bd), rfH = dateToHijriParts('2024-07-03');
  let aHYrs = rfH && bdH ? rfH.hy - bdH.hy : 0, aHMths = rfH && bdH ? rfH.hm - bdH.hm : 0, aHDays = rfH && bdH ? rfH.hd - bdH.hd : 0;
  if (aHDays < 0) { aHMths--; aHDays += 30 } if (aHMths < 0) { aHYrs--; aHMths += 12 }
  const aH = Math.max(0, aHYrs + aHMths / 12);
  const ex = aH >= 48.5 || mRAtRF >= 240;
  let rY = 60, rM = 0;
  if (!ex) for (const r of RA) { if (aH >= r.mn && (!r.mx || aH < r.mx)) { rY = r.rY; rM = r.rM; break } }
  let dt = null;
  if (bdH) {
    const bTM = (bdH.hy - 1) * 12 + (bdH.hm - 1), rTM = bTM + rY * 12 + rM;
    const retHy = Math.floor(rTM / 12) + 1, retHm = (rTM % 12) + 1;
    const retHd = Math.min(bdH.hd, hijriMonthDays(retHy, retHm) || 29);
    const iso = hijriStrToIso(`${retHy}/${String(retHm).padStart(2, '0')}/${String(retHd).padStart(2, '0')}`);
    dt = iso ? new Date(iso) : new Date(new Date(bd).getFullYear() + rY, new Date(bd).getMonth() + rM, new Date(bd).getDate());
  } else dt = new Date(new Date(bd).getFullYear() + rY, new Date(bd).getMonth() + rM, new Date(bd).getDate());
  let eR = 300, eY = 25;
  if (!ex) for (const r of ET) { if (mRAtRF >= r.mnM && (!r.mxM || mRAtRF <= r.mxM)) { eR = r.req; eY = r.y; break } }
  return { rY, rM, lb: `${rY} سنة هجرية${rM > 0 ? ` و ${rM} شهراً` : ''}`, dt, ex, eR, eY, aR: +aH.toFixed(1) };
};

// ── ملخص المدد ──────────────────────────────────────────────────────
export const psSummary = (periods, aEnd) => {
  let oM = 0, nM = 0, vM = 0, cM = 0, wM = 0, lS = 0;
  const sd = [...periods].sort((a, b) => new Date(a.sd) - new Date(b.sd));
  sd.forEach(p => {
    if (p.st === 'مستبعد') return;
    const e = p.ac ? aEnd : p.ed;
    if (!e) return;
    const c = mdfCal(p.sd, e, p.cal || 'g');
    const m = c.t;
    if (p.sy === 'تقاعد مدني') cM += m;
    else if (p.sy === 'تقاعد عسكري') wM += m;
    else if (p.sy === 'اشتراك اختياري') vM += m;
    else { new Date(p.sd) < new Date('2001-04-25') ? oM += m : nM += m }
    if (p.sl > 0) lS = p.sl;
  });
  return { oM, nM, vM, cM, wM, tM: oM + nM + vM + cM + wM, lS };
};

// ── بناء تاريخ الرواتب الشهري ───────────────────────────────────────
// من مدد الاشتراك → مصفوفة شهور مرتبة من الأقدم إلى الأحدث
// { key, date, salary, isOld }
export const buildSalaryTimeline = (periods, aEnd) => {
  const OLD_CUT = new Date('2001-04-25');
  const relevant = [...periods]
    .filter(p => p.st !== 'مستبعد' && p.sl > 0 &&
      p.sy !== 'تقاعد مدني' && p.sy !== 'تقاعد عسكري')
    .sort((a, b) => new Date(a.sd) - new Date(b.sd));

  const seen = new Set();
  const timeline = [];

  for (const p of relevant) {
    const end = p.ac ? aEnd : p.ed;
    if (!end) continue;
    const sd = new Date(p.sd), ed = new Date(end);
    if (isNaN(sd) || isNaN(ed) || ed < sd) continue;

    let cur = new Date(sd.getFullYear(), sd.getMonth(), 1);
    const endMo = new Date(ed.getFullYear(), ed.getMonth(), 1);

    while (cur <= endMo) {
      const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`;
      if (!seen.has(key)) {
        seen.add(key);
        timeline.push({
          key,
          date: new Date(cur),
          salary: Math.min(p.sl, 45000),
          isOld: cur < OLD_CUT,
        });
      }
      cur.setMonth(cur.getMonth() + 1);
    }
  }

  return timeline.sort((a, b) => a.date - b.date);
};

// ── المتوسط المعتمد لمجموعة شهور (خطوات 1-3 من المنهجية الرسمية) ──────
// خطوة 1: متوسط آخر 24 شهراً
// خطوة 2: راتب الشهر رقم 60 من النهاية × 150%
// خطوة 3: الأقل من الخطوتين = المتوسط المعتمد
const calcTierAvgDetailed = (months) => {
  if (!months.length) return { avg: 0, rawAvg24: 0, refSal: 0, capApplied: false, sal150: 0 };
  const n = months.length;
  const last24 = months.slice(Math.max(0, n - 24));
  const rawAvg24 = last24.reduce((s, m) => s + m.salary, 0) / last24.length;
  const idx60 = n >= 60 ? n - 60 : 0;
  const refSal = months[idx60].salary;
  const sal150 = refSal * 1.5;
  const capApplied = rawAvg24 > sal150;
  return { avg: +Math.min(rawAvg24, sal150).toFixed(2), rawAvg24: +rawAvg24.toFixed(2), refSal, sal150: +sal150.toFixed(2), capApplied };
};
const calcTierAvg = (months) => calcTierAvgDetailed(months).avg;

// ── الاحتساب الكامل: شرائح + فروقات (المنهجية الرسمية GOSI م/33 المادة 38) ──
// يُعيد: { approvedAvg, tiers[], hasTwoTiers, diffDetails[], diffPension, hasDiffs,
//          depAllowance, total, final }
export const calcFullPension = (periods, aEnd, deps = 0) => {
  const tl = buildSalaryTimeline(periods, aEnd);
  if (!tl.length) return null;
  const n = tl.length;

  // المتوسط المعتمد للكتلة الكاملة
  const capInfo = calcTierAvgDetailed(tl);
  const approvedAvg = capInfo.avg;
  const threshold = approvedAvg * 1.1;

  // خطوة 5: البحث من الشهر 25 من النهاية نحو الأسفل
  let splitIdx = -1;
  for (let i = Math.max(0, n - 25); i >= 0; i--) {
    if (tl[i].salary > threshold) {
      splitIdx = i;
      break;
    }
  }

  let tiers = [];

  // شروط الشريحتين: كل منهما ≥ 24 شهراً، والقديمة > الحديثة × 110%
  if (splitIdx >= 23 && (n - splitIdx - 1) >= 24) {
    const oldMonths = tl.slice(0, splitIdx + 1);
    const newMonths = tl.slice(splitIdx + 1);
    const oldAvg = calcTierAvg(oldMonths);
    const newAvg = calcTierAvg(newMonths);

    if (oldAvg > newAvg * 1.1) {
      // قاعدة 2022: خذ الأفضل للمشترك بين شريحة واحدة وشريحتين
      const singleTotal =
        (tl.filter(m => m.isOld).length * approvedAvg) / 600 +
        (tl.filter(m => !m.isOld).length * approvedAvg) / 480;
      const twoTotal =
        (oldMonths.filter(m => m.isOld).length * oldAvg) / 600 +
        (oldMonths.filter(m => !m.isOld).length * oldAvg) / 480 +
        (newMonths.filter(m => m.isOld).length * newAvg) / 600 +
        (newMonths.filter(m => !m.isOld).length * newAvg) / 480;

      if (twoTotal >= singleTotal) {
        tiers = [
          { months: newMonths, avg: newAvg, label: 'الشريحة الثانية' },
          { months: oldMonths, avg: oldAvg, label: 'الشريحة الأولى' },
        ];
      }
    }
  }

  if (!tiers.length) {
    tiers = [{ months: tl, avg: approvedAvg, label: 'الشريحة الأساسية' }];
  }

  // احتساب معاش كل شريحة
  const tierResults = tiers.map(t => {
    const oM = t.months.filter(m => m.isOld).length;
    const nM = t.months.filter(m => !m.isOld).length;
    const pO = (oM * t.avg) / 600;
    const pN = (nM * t.avg) / 480;
    return { ...t, oM, nM, pO: +pO.toFixed(2), pN: +pN.toFixed(2), sub: +(pO + pN).toFixed(2) };
  });

  const mainTierPension = tierResults.reduce((s, t) => s + t.sub, 0);

  // بدل معالين: على المكون القديم من الشريحة الأحدث فقط (م/38)
  const dr = deps >= 3 ? 0.2 : deps === 2 ? 0.15 : deps === 1 ? 0.1 : 0;
  const mainTier = tierResults[0];
  const depAllowance = mainTier ? +((mainTier.oM * mainTier.avg / 600) * dr).toFixed(2) : 0;

  // الفروقات: أشهر تجاوز راتبها 110% من متوسط شريحتها
  let diffPension = 0;
  const diffDetails = [];

  tierResults.forEach(t => {
    const tThresh = t.avg * 1.1;
    const qualMonths = t.months.filter(m => m.salary > tThresh);
    if (!qualMonths.length) return;
    const diffAmounts = qualMonths.map(m => m.salary - t.avg);
    const diffAvg = diffAmounts.reduce((s, v) => s + v, 0) / diffAmounts.length;
    const dOldM = qualMonths.filter(m => m.isOld).length;
    const dNewM = qualMonths.filter(m => !m.isOld).length;
    const dp = (dOldM * diffAvg) / 600 + (dNewM * diffAvg) / 480;
    diffPension += dp;
    diffDetails.push({ tierLabel: t.label, count: qualMonths.length, diffAvg: +diffAvg.toFixed(2), dOldM, dNewM, dp: +dp.toFixed(2) });
  });

  const total = +(mainTierPension + depAllowance + diffPension).toFixed(2);
  const final = total > 0 && total < 1983.75 ? 1983.75 : total;

  return {
    approvedAvg: +approvedAvg.toFixed(2),
    rawAvg24: capInfo.rawAvg24,
    refSal: capInfo.refSal,
    sal150: capInfo.sal150,
    capApplied: capInfo.capApplied,
    capLoss: capInfo.capApplied ? +(capInfo.rawAvg24 - capInfo.sal150).toFixed(2) : 0,
    tiers: tierResults,
    hasTwoTiers: tierResults.length > 1,
    diffDetails,
    diffPension: +diffPension.toFixed(2),
    hasDiffs: diffDetails.length > 0,
    depAllowance,
    total,
    final,
  };
};

// ── احتساب المعاش المبسط (للتوافق العكسي وسيناريوهات التحسين) ──────────
export const penCalc = (ps, salary, deps = 0) => {
  const a = Math.min(salary, 45000);
  const pO = (ps.oM * a) / 600;
  const pN = (ps.nM * a) / 480;
  const pV = (ps.vM * a) / 480;
  const dr = deps >= 3 ? 0.2 : deps === 2 ? 0.15 : deps === 1 ? 0.1 : 0;
  const dA = pO * dr;
  const t = pO + pN + pV + dA;
  const f = t > 0 && t < 1983.75 ? 1983.75 : +t.toFixed(2);
  return { pO: +pO.toFixed(2), pN: +pN.toFixed(2), pV: +pV.toFixed(2), dA: +dA.toFixed(2), t: +t.toFixed(2), f, a };
};

// ── عجز غير مهني (م/37): الأعلى من المعاش الطبيعي أو 50% من المتوسط ──
export const calcNonOccDisability = (periods, aEnd, deps = 0) => {
  const full = calcFullPension(periods, aEnd, deps);
  if (!full) return null;
  const halfAvg = full.approvedAvg * 0.5;
  const nonOccPension = +Math.max(full.final, halfAvg, 1983.75).toFixed(2);
  return { ...full, nonOccPension };
};

// ── عجز مهني (سعودي) ──────────────────────────────────────────────
// average: متوسط آخر 3 أشهر قبل شهر الإصابة | pct: 1-100 | ageAtInjury: العمر
export const calcOccDisabilitySaudi = (average, pct, ageAtInjury) => {
  const avg = Math.min(average, 45000);
  if (pct === 100) return { type: 'monthly', amount: +avg.toFixed(2) };
  if (pct >= 50) return { type: 'monthly', amount: +(avg * pct / 100).toFixed(2) };
  let mult = 60;
  if (ageAtInjury > 40) mult = Math.max(36, 60 - (ageAtInjury - 40));
  return { type: 'lumpSum', amount: +Math.min(avg * (pct / 100) * mult, 165000).toFixed(2) };
};

// ── عجز مهني (غير سعودي) ──────────────────────────────────────────
export const calcOccDisabilityNonSaudi = (average, pct, ageAtInjury) => {
  const avg = Math.min(average, 45000);
  if (pct === 100) return { type: 'lumpSum', amount: +Math.min(avg * 84, 330000).toFixed(2) };
  let mult = 60;
  if (ageAtInjury > 40) mult = Math.max(36, 60 - (ageAtInjury - 40));
  return { type: 'lumpSum', amount: +Math.min(avg * (pct / 100) * mult, 165000).toFixed(2) };
};

// ── المدة الاعتبارية ────────────────────────────────────────────────
// المتوسط النهائي = معاش الشرائح + الفروقات / مجموع معاملات المدد
// تكلفة الاشتراك = 18% × سنوات × المتوسط النهائي
export const calcNotionalPeriod = (fullPensionResult, notionalYears) => {
  if (!fullPensionResult || notionalYears <= 0) return null;
  const { tiers, diffPension } = fullPensionResult;
  let totalCoeff = 0;
  tiers.forEach(t => { totalCoeff += t.oM / 600 + t.nM / 480; });
  const pensionNoDep = tiers.reduce((s, t) => s + t.sub, 0) + diffPension;
  const finalAvg = totalCoeff > 0 ? pensionNoDep / totalCoeff : fullPensionResult.approvedAvg;
  return {
    finalAvg: +finalAvg.toFixed(2),
    notionalYears,
    notionalCost: +(0.18 * notionalYears * finalAvg).toFixed(2),
    notionalPension: +(finalAvg * notionalYears * 12 / 480).toFixed(2),
  };
};

// ── احتساب المدة في تاريخ محدد ─────────────────────────────────────
export const psAtDate = (periods, targetDate) => {
  let oM = 0, nM = 0, vM = 0;
  [...periods].sort((a, b) => new Date(a.sd) - new Date(b.sd)).forEach(p => {
    if (p.st === 'مستبعد' || !p.sd || new Date(p.sd) >= new Date(targetDate)) return;
    const eEnd = (p.ac || !p.ed) ? targetDate : (p.ed > targetDate ? targetDate : p.ed);
    const c = mdfCal(p.sd, eEnd, p.cal || 'g'); const m = c.t;
    if (p.sy === 'اشتراك اختياري') vM += m;
    else { new Date(p.sd) < new Date('2001-04-25') ? oM += m : nM += m }
  });
  return { oM, nM, vM, tM: oM + nM + vM };
};

// ── سيناريوهات التحسين ─────────────────────────────────────────────
export const calcScenarios = (ps, currentSalary, basePension, deps = 0) => {
  const scenarios = [];

  // سيناريوهات إضافة أشهر خدمة (9% حصة الموظف)
  [6, 12, 18, 24, 36, 48, 60, 84, 120].forEach(addM => {
    const newPs = { ...ps, nM: ps.nM + addM, tM: ps.tM + addM };
    const newPen = penCalc(newPs, currentSalary, deps);
    const delta = Math.round(newPen.f - basePension);
    if (delta > 0) {
      const monthlyCost = Math.round(currentSalary * 0.09);
      scenarios.push({
        type: 'months', addM, addY: +(addM / 12).toFixed(1),
        newPension: Math.round(newPen.f), delta,
        monthlyCost, totalCost: monthlyCost * addM,
        annualGain: delta * 12,
        breakEvenMonths: Math.ceil((monthlyCost * addM) / delta),
      });
    }
  });

  // سيناريوهات الاشتراك الاختياري (18% كامل — حصة الموظف + المنشأة)
  [6, 12, 24, 36, 60, 84, 120].forEach(addM => {
    const newPs = { ...ps, vM: (ps.vM || 0) + addM, tM: ps.tM + addM };
    const newPen = penCalc(newPs, currentSalary, deps);
    const delta = Math.round(newPen.f - basePension);
    if (delta > 0) {
      const monthlyCost = Math.round(currentSalary * 0.18);
      scenarios.push({
        type: 'voluntary', addM, addY: +(addM / 12).toFixed(1),
        newPension: Math.round(newPen.f), delta,
        monthlyCost, totalCost: monthlyCost * addM,
        annualGain: delta * 12,
        breakEvenMonths: Math.ceil((monthlyCost * addM) / delta),
      });
    }
  });

  // سيناريوهات زيادة الراتب
  [500, 1000, 2000, 3000, 5000].forEach(bump => {
    const newSalary = Math.min(currentSalary + bump, 45000);
    if (newSalary <= currentSalary) return;
    const newPen = penCalc(ps, newSalary, deps);
    const delta = Math.round(newPen.f - basePension);
    if (delta > 0) scenarios.push({ type: 'salary', salaryBump: bump, newSalary, newPension: Math.round(newPen.f), delta });
  });

  return scenarios;
};

// ── مسار نمو المعاش (للرسم البياني) ──────────────────────────────────
export const calcTimeline = (ps, salary, deps = 0, yearsAhead = 10) => {
  const yrs = Math.min(Math.max(Math.round(yearsAhead), 1), 35);
  const pts = [];
  for (let y = 0; y <= yrs; y++) {
    const addM = y * 12;
    const sim = { ...ps, nM: ps.nM + addM, tM: ps.tM + addM };
    const p = penCalc(sim, salary, deps);
    pts.push({ year: y, months: Math.round(ps.tM + addM), pension: Math.round(p.f) });
  }
  return pts;
};

// ── تنسيق الأرقام ──────────────────────────────────────────────────
export const fmt = n => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n);
export const fI = n => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
export const fMD = t => { const m = Math.floor(t); const d = Math.round((t - m) * 30); return d > 0 ? m + ' شهر و ' + d + ' يوم' : m + ' شهر' };

export const SYS_OPTS = ['قطاع خاص | أنظمة العمل', 'قطاع عام | أنظمة التقاعد المدني', 'اشتراك اختياري'];
