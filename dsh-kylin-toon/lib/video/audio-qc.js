/**
 * 配音表演质检（KToon 保留项）：用逐段语速变异判断「念课文」，并核对表演风格是否接线。
 *
 * 只做 warning，不阻断交付；阻断项只有时间轴重叠这类确定性错误。
 */

const PUNCTUATION = /[\s，。！？；：、,.!?;:'"“”‘’（）()【】\[\]—…·~～]/g;

export function spokenUnits(text) {
  const clean = String(text ?? '').replace(PUNCTUATION, '');
  const cjk = (clean.match(/[\u3400-\u9fff]/g) ?? []).length;
  const words = (clean.replace(/[\u3400-\u9fff]/g, ' ').match(/[A-Za-z0-9]+/g) ?? []).length;
  return cjk + words;
}

function mean(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function stddev(values) {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance = values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/** 逐段语速与停顿分析；输入是成片时间轴上的解说段。 */
export function analyzeSegments(segments) {
  const warnings = [];
  const blockers = [];
  const rows = [];
  let previousEnd = 0;
  for (let index = 0; index < segments.length; index++) {
    const segment = segments[index];
    const start = Number(segment.startSec ?? 0);
    const end = Number(segment.endSec ?? 0);
    const duration = Math.max(0, end - start);
    const units = spokenUnits(segment.text);
    const rate = duration > 0 ? units / duration : 0;
    if (end <= start) warnings.push({ code: 'segment-duration-missing', index, message: '第 ' + String(index + 1) + ' 段时间轴无效（end <= start）' });
    if (start + 0.05 < previousEnd) blockers.push({ code: 'segment-overlap', index, message: '第 ' + String(index + 1) + ' 段与上一段时间重叠' });
    if (start - previousEnd > 1.8 && index > 0) warnings.push({ code: 'segment-long-gap', index, message: '第 ' + String(index + 1) + ' 段前有 ' + (start - previousEnd).toFixed(1) + 's 停顿，确认是否是留白' });
    if (rate > 0 && rate < 2.2) warnings.push({ code: 'segment-slow', index, message: '第 ' + String(index + 1) + ' 段语速过慢（' + rate.toFixed(2) + ' 字/秒）' });
    if (rate > 7.2) warnings.push({ code: 'segment-fast', index, message: '第 ' + String(index + 1) + ' 段语速过快（' + rate.toFixed(2) + ' 字/秒）' });
    if (segment.style !== undefined && segment.style !== '' && segment.styleSource === undefined) {
      warnings.push({ code: 'style-unwired', index, message: '第 ' + String(index + 1) + ' 段写了表演风格，但没有记录它是否真的传给 TTS（styleSource 缺失）' });
    }
    rows.push({ index, startSec: start, endSec: end, units, rate: Math.round(rate * 100) / 100, text: String(segment.text ?? '').slice(0, 40) });
    previousEnd = Math.max(previousEnd, end);
  }
  const rates = rows.filter((row) => row.rate > 0).map((row) => row.rate);
  const avg = mean(rates);
  const sd = stddev(rates);
  const cv = avg > 0 ? sd / avg : 0;
  // 「念课文」判据：段数足够而语速几乎没有变化（KToon audio-qc 同一阈值 0.18）。
  if (rates.length >= 3 && cv < 0.18) {
    warnings.push({
      code: 'flat-pacing',
      message: '语速变异系数只有 ' + cv.toFixed(2) + '（< 0.18），听感接近念课文；给情绪段加停顿、重音或语速差'
    });
  }
  return {
    segments: rows,
    metrics: {
      count: rows.length,
      meanRate: Math.round(avg * 100) / 100,
      rateStddev: Math.round(sd * 100) / 100,
      rateCv: Math.round(cv * 100) / 100,
      totalDurationSec: Math.round(Math.max(previousEnd, 0) * 100) / 100
    },
    warnings,
    blockers,
    ok: blockers.length === 0
  };
}

/** 校验 SRT/VTT 文本并与逐段语速一起报告。 */
export function parseSubtitle(text) {
  const segments = [];
  const blocks = String(text ?? '').replace(/\r/g, '').split(/\n{2,}/);
  const stamp = /(\d{1,2}:\d{2}:\d{2}[.,]\d{3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[.,]\d{3})/;
  const seconds = (value) => {
    const parts = value.replace(',', '.').split(':').map(Number);
    return (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0);
  };
  for (const block of blocks) {
    const lines = block.split('\n').filter((line) => line.trim() !== '');
    const index = lines.findIndex((line) => stamp.test(line));
    if (index < 0) continue;
    const match = stamp.exec(lines[index]);
    const content = lines.slice(index + 1).join(' ').trim();
    segments.push({ startSec: seconds(match[1]), endSec: seconds(match[2]), text: content });
  }
  return segments;
}
