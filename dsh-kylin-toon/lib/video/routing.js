/**
 * 媒体模型择优（KToon 保留项）：
 * auto = 候选池按成功率/延迟打分择优并给出理由；pin = 作者指定，不被自动覆盖。
 * 插件本身不调用供应商；候选池来自多媒体网关插件的 media_models。
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

function readJson(file, fallback) {
  try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return fallback; }
}

function writeJson(file, value) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

export function stateFile(cwd, name) {
  return join(cwd, '.kylin-toon', name);
}

export function readRouting(cwd) {
  return readJson(stateFile(cwd, 'routing.json'), {});
}

export function readStats(cwd) {
  return readJson(stateFile(cwd, 'model-stats.json'), {});
}

export function scoreCandidate(candidate, stats) {
  const stat = stats[candidate.id] ?? { success: 0, failure: 0, totalMs: 0 };
  const total = stat.success + stat.failure;
  const successRate = total === 0 ? 0.5 : stat.success / total;
  const samples = Math.min(1, total / 4);
  const latencySec = stat.success === 0 ? 0 : (stat.totalMs / stat.success) / 1000;
  const speedScore = latencySec === 0 ? 0.5 : Math.max(0, 1 - Math.min(1, latencySec / 240));
  const availability = candidate.available === false ? -100 : 0;
  const tierBonus = candidate.tier === 'quality' ? 0.06 : candidate.tier === 'fast' ? 0.04 : 0;
  const score = successRate * 0.62 + speedScore * 0.28 + samples * 0.04 + tierBonus + availability;
  return {
    score: Math.round(score * 1000) / 1000,
    successRate: Math.round(successRate * 100) / 100,
    samples: total,
    latencySec: Math.round(latencySec * 10) / 10,
    available: candidate.available !== false
  };
}

/** 给一个槽位选出模型并解释理由。 */
export function planSlot(cwd, slot, candidates) {
  const routing = readRouting(cwd);
  const stats = readStats(cwd);
  const pin = routing[slot]?.mode === 'pin' ? routing[slot]?.model : undefined;
  const pool = candidates.filter((candidate) => candidate.available !== false);
  if (pin !== undefined && pin !== '') {
    return { slot, mode: 'pin', model: pin, reason: '作者在路由面板指定了 ' + pin, candidates: [] };
  }
  if (pool.length === 0) {
    return { slot, mode: 'auto', model: undefined, reason: '网关没有可用候选，先在「设置 → 多媒体网关」补齐模型', candidates: [] };
  }
  const scored = pool.map((candidate) => ({ id: candidate.id, label: candidate.label ?? candidate.id, ...scoreCandidate(candidate, stats), tier: candidate.tier }))
    .sort((a, b) => b.score - a.score);
  const best = scored[0];
  const reason = best.samples === 0
    ? '候选池还没有实测记录，按可用性与档位先选 ' + best.id
    : best.id + ' 成功率 ' + (best.successRate * 100).toFixed(0) + '%，实测 ' + String(best.samples) + ' 次，平均 ' + String(best.latencySec) + 's';
  return { slot, mode: 'auto', model: best.id, reason, candidates: scored.slice(0, 6) };
}

export function setPin(cwd, slot, mode, model) {
  const routing = readRouting(cwd);
  routing[slot] = mode === 'pin' ? { mode: 'pin', model } : { mode: 'auto' };
  writeJson(stateFile(cwd, 'routing.json'), routing);
  return routing[slot];
}

export function recordOutcome(cwd, model, outcome) {
  const stats = readStats(cwd);
  const current = stats[model] ?? { success: 0, failure: 0, totalMs: 0 };
  const succeeded = outcome === 'success' || (outcome !== null && typeof outcome === 'object' && outcome.outcome === 'success');
  if (succeeded) current.success += 1;
  else current.failure += 1;
  const elapsedMs = outcome !== null && typeof outcome === 'object' ? Number(outcome.elapsedMs) : Number.NaN;
  if (Number.isFinite(elapsedMs) && elapsedMs > 0) current.totalMs += elapsedMs;
  stats[model] = current;
  writeJson(stateFile(cwd, 'model-stats.json'), stats);
  return current;
}
