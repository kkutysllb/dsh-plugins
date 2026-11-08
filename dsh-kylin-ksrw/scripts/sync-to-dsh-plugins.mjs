#!/usr/bin/env node
/** 把 packages/dsh-kylin-ksrw 同步到镜像仓 ~/kk_Projects/dsh-plugins/dsh-kylin-ksrw。
 *
 * 镜像仓只是 GitHub 上的汇总记录，不做发布：内容与真源保持**逐字节一致**，
 * 包括依赖里的 `workspace:*`——发布只从真源（KSRW 工作区）用 pnpm publish 进行。
 *
 * 用法：node packages/dsh-kylin-ksrw/scripts/sync-to-dsh-plugins.mjs [--mirror <dir>]
 */
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const source = resolve(here, '..')

const mirrorFlag = process.argv.indexOf('--mirror')
const mirror = mirrorFlag > 0
  ? resolve(process.argv[mirrorFlag + 1])
  : resolve(process.env.HOME ?? '~', 'kk_Projects/dsh-plugins/dsh-kylin-ksrw')

if (!existsSync(mirror)) {
  console.error('[sync] 镜像目录不存在：' + mirror)
  process.exit(1)
}

execFileSync('rsync', ['-a', '--delete', '--exclude', 'node_modules', source + '/', mirror + '/'], { stdio: 'inherit' })
console.log('[sync] ' + source + ' → ' + mirror + '（原样落盘，镜像仓仅作记录）')
