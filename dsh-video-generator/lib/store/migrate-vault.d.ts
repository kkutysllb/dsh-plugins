/** vault v1 → v2 一次性迁移（规格 2026-09-28 §7）。
 *
 *  v1 的有效选型只来自 defaultChannelId 通道的 models[]（其余通道的模型在 v1 运行时
 *  根本不会被选中），因此迁移规则：取 defaultChannelId ?? 首个 enabled ?? 首个通道
 *  的 models[]，按 kind 各取第一项填入对应槽位；image.master 与 image.shot 同源；
 *  music.* 留空（新增能力，不猜）。models[]/defaultChannelId 本身不迁移（备份保留）。
 *
 *  幂等：仅当 parsed.version === 1 时被调用（vault.load() 把关）；备份写失败不阻塞
 *  迁移（channels/baseUrl/apiKey 全量保留，仅 models 清单可能丢失，日志明示）。
 */
import type { VaultData } from './vault.ts';
export declare function migrateV1ToV2(file: string, rawV1: string, parsedV1: unknown, save: (d: VaultData) => void): VaultData;
