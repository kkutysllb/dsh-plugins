/**
 * dsh-kylin-toon 宿主入口（Cordis 插件）。
 *
 * 同一份产物被 DSH 与麒麟（QiLin）两个通道加载：package.json 的 dsh.bundle.patch
 * 与 qilin.bundle.patch 指向同一份 cordis.patch.yml。
 *
 * 边界：
 * - 作品 = 工作区里的普通文件；插件只做读取、版本化保存、投影与确定性计算；
 * - 会话、模型、审批、文件工具全部用宿主原生能力；
 * - 媒体生成 = 用户另装的多媒体网关插件（media_*），插件不保存任何密钥。
 */
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerRoutes } from './lib/routes.js';
import { createTools } from './lib/tools.js';
import { installSkills } from './lib/skills.js';
import { VERSION } from './lib/version.js';

export const name = 'dsh-kylin-toon';
// skills 必须列进 inject：cordis 的隔离上下文里，未 inject 的服务读不到，技能会静默不注册。
export const inject = ['skills', 'tools', 'webServer'];
export { VERSION };

const ROOT = dirname(fileURLToPath(import.meta.url));
const FIELDS = ['welcomeGuide', 'maxFileBytes', 'maxWorkspaceFiles', 'trustedHosts'];

function pickConfig(raw) {
  const value = typeof raw === 'object' && raw !== null && !Array.isArray(raw) ? raw : {};
  const picked = {};
  for (const field of FIELDS) if (value[field] !== undefined) picked[field] = value[field];
  return picked;
}

export function apply(ctx, rawConfig) {
  const config = {
    welcomeGuide: true,
    maxFileBytes: 2 * 1024 * 1024,
    maxWorkspaceFiles: 1500,
    trustedHosts: [],
    ...pickConfig(rawConfig)
  };
  const logger = typeof ctx.logger === 'function' ? ctx.logger('kylin-toon') : console;
  const workingDirectory = (() => { try { return ctx.get('workingDirectory'); } catch { return undefined; } })();
  const options = {
    version: VERSION,
    maxFileBytes: Number(config.maxFileBytes) > 0 ? Number(config.maxFileBytes) : 2 * 1024 * 1024,
    maxWorkspaceFiles: Number(config.maxWorkspaceFiles) > 0 ? Number(config.maxWorkspaceFiles) : 1500,
    trustedHosts: Array.isArray(config.trustedHosts) ? config.trustedHosts : [],
    welcomeGuide: () => config.welcomeGuide === true,
    logger
  };
  const mount = () => {
    const disposers = [];
    const disposeRoutes = registerRoutes(ctx, options);
    if (typeof disposeRoutes === 'function') disposers.push(disposeRoutes);
    for (const tool of createTools({ workingDirectory, version: VERSION })) {
      const dispose = ctx.tools?.register(tool);
      if (typeof dispose === 'function') disposers.push(dispose);
    }
    for (const dispose of installSkills(ctx, ROOT, logger)) disposers.push(dispose);
    return () => {
      for (const dispose of disposers.reverse()) {
        try { dispose(); } catch { /* 卸载期异常忽略 */ }
      }
      disposers.length = 0;
    };
  };
  if (typeof ctx.effect === 'function') ctx.effect(mount, name + ': mount');
  else mount();
  logger.log?.('[dsh-kylin-toon] 已激活 v' + VERSION + '：/kylin-toon 工作台 API');
}
