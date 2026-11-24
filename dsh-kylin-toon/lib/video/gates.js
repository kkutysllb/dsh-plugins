/**
 * 交付闸门（KToon 保留项）：把「能不能进入下一步」变成可核对的文件证据。
 *
 * G0 立项/版权 → G1 分镜 → G2 关键帧 → G3 样片 → G4 成片。
 * 只读取项目文件，不代签审批、不生成媒体。
 */

import { referenceReadiness } from '../reference.js';

function findMedia(media, pattern) {
  return media.filter((path) => pattern.test(path));
}

function shotIdOfMedia(path) {
  const match = /([A-Za-z]{0,4}[-_]?\d{1,3}[a-zA-Z]?)(?:[._-]\d{1,3}[a-zA-Z]?){0,2}/.exec(path.split('/').pop() ?? '');
  return match === null ? undefined : match[1];
}

export function evaluateGates(projection, documents, reference) {
  const media = projection.media ?? [];
  const outputs = projection.outputs ?? [];
  const script = documents.get('剧本.md') ?? '';
  const hasCopyright = /版权|授权|原创声明|copyright/i.test(script);
  const shots = projection.shots ?? [];
  const continuityBlockers = (projection.diagnostics ?? []).filter((item) => item.code === 'shot-state-discontinuous');
  const motionBlockers = (projection.motion?.diagnostics ?? []).filter((item) => item.severity === 'blocker');
  const imageByShot = new Set(media.filter((path) => /\.(png|jpe?g|webp|gif)$/i.test(path)).map(shotIdOfMedia).filter(Boolean));
  const videoByShot = new Set(media.filter((path) => /\.(mp4|webm|mov)$/i.test(path)).map(shotIdOfMedia).filter(Boolean));
  const hasCover = media.some((path) => /cover/i.test(path));
  const hasEndcard = media.some((path) => /endcard/i.test(path));
  const requiredShots = shots.filter((shot) => !((shot.id === 'S00' && hasCover) || (shot.id === 'S45' && hasEndcard)));
  const missingFrames = requiredShots.filter((shot) => shot.id !== undefined && !imageByShot.has(shot.id));
  const missingClips = requiredShots.filter((shot) => shot.id !== undefined && !videoByShot.has(shot.id));
  const sample = outputs.find((path) => /样片|sample|review|share|1080p|成片|final|delivery/i.test(path));
  const final = outputs.find((path) => /成片|final|delivery|master|1080p/i.test(path));

  const gates = [
    {
      id: 'G0',
      label: '立项与版权',
      status: script === '' ? 'blocked' : hasCopyright ? 'pass' : 'pending',
      evidence: script === '' ? [] : ['剧本.md'],
      reasons: script === '' ? ['还没有剧本.md'] : hasCopyright ? [] : ['剧本里没有版权/授权声明；自制可以确认后继续，拍同款必须先确认版权']
    },
    {
      id: 'G1',
      label: '分镜完整',
      status: shots.length === 0 ? 'pending' : continuityBlockers.length === 0 && motionBlockers.length === 0 ? 'pass' : 'blocked',
      evidence: ['分镜.md', ...(projection.motion?.present === true ? ['MOTION.md'] : [])],
      reasons: shots.length === 0 ? ['分镜.md 里没有识别到镜头'] : [...continuityBlockers.map((item) => item.message), ...motionBlockers.map((item) => 'Motion：' + item.message)]
    },
    {
      id: 'G2',
      label: '关键帧齐备',
      status: shots.length === 0 ? 'pending' : missingFrames.length === 0 ? 'pass' : 'pending',
      evidence: media.filter((path) => /\.(png|jpe?g|webp)$/i.test(path)),
      reasons: missingFrames.length === 0 ? [] : [String(missingFrames.length) + ' 个镜头还没有图片：' + missingFrames.slice(0, 5).map((shot) => shot.id ?? '?').join('、')]
    },
    {
      id: 'G3',
      label: '样片可审',
      status: sample === undefined ? 'pending' : 'pass',
      evidence: sample === undefined ? [] : [sample],
      reasons: sample === undefined ? ['还没有样片；至少装配一版可审片段'] : []
    },
    {
      id: 'G4',
      label: '成片交付',
      status: final === undefined ? 'pending' : missingClips.length > 0 ? 'pending' : 'pass',
      evidence: final === undefined ? [] : [final],
      reasons: final === undefined ? ['还没有成片'] : missingClips.length > 0 ? [String(missingClips.length) + ' 个镜头还没有视频片段'] : []
    }
  ];
  // 有参考片时，G0 还要过参考就绪：分析、2–3 张方案、创作者选定、版权确认。
  const readiness = referenceReadiness(reference);
  if (reference !== undefined && !readiness.ready) {
    const g0 = gates.find((gate) => gate.id === 'G0');
    if (g0 !== undefined) {
      g0.status = 'blocked';
      g0.reasons = [...g0.reasons, ...readiness.blockers.map((reason) => '参考片：' + reason)];
      if (reference.source?.path !== undefined) g0.evidence = [...g0.evidence, reference.source.path];
    }
  }
  const blocking = gates.filter((gate) => gate.status === 'blocked');
  return { gates, ok: blocking.length === 0, nextGate: gates.find((gate) => gate.status !== 'pass')?.id ?? null };
}