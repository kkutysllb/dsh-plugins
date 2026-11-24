/**
 * 生产意图：工具把「聚焦哪个镜头 / 设成什么顺序 / 跟踪哪个任务」写到内存，
 * 客户端轮询读取后只做投影，不碰文件、不生成媒体、不替代确认。
 */
const sessions = new Map();

export function pushIntent(sessionId, intent) {
  const key = typeof sessionId === 'string' && sessionId !== '' ? sessionId : 'local';
  const list = sessions.get(key) ?? [];
  const entry = { id: list.length + 1, at: Date.now(), ...intent };
  list.push(entry);
  if (list.length > 200) list.splice(0, list.length - 200);
  sessions.set(key, list);
  return entry;
}

export function listIntents(sessionId, since = 0) {
  const key = typeof sessionId === 'string' && sessionId !== '' ? sessionId : 'local';
  return (sessions.get(key) ?? []).filter((entry) => entry.id > since);
}
