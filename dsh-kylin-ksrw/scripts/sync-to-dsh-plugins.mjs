#!/usr/bin/env node
/** 把 packages/dsh-kylin-ksrw 同步到镜像仓 ~/kk_Projects/dsh-plugins/dsh-kylin-ksrw。
 *
 * 镜像仓是独立分发仓（不是 workspace），npm 不认 `workspace:*` 协议，
 * 因此落盘时把内部依赖改写成具体版本（`^x.y.z`），否则 npm publish 会失败。
 *
 * 用法：node packages/dsh-kylin-ksrw/scripts/sync-to-dsh-plugins.mjs [--mirror <dir>]
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const source = resolve(here, '..')
const version = JSON.parse(readFileSync(join(source, 'package.json'), 'utf8')).version

const mirrorFlag = process.argv.indexOf('--mirror')
const mirror = mirrorFlag > 0
  ? resolve(process.argv[mirrorFlag + 1])
  : resolve(process.env.HOME ?? '~', 'kk_Projects/dsh-plugins/dsh-kylin-ksrw')

if (!existsSync(mirror)) {
  console.error('[sync] 镜像目录不存在：' + mirror)
  process.exit(1)
}

execFileSync('rsync', ['-a', '--delete', '--exclude', 'node_modules', source + '/', mirror + '/'], { stdio: 'inherit' })

// 独立分发仓不能带 workspace 协议：全部改写成 ^<version>
const manifestPath = join(mirror, 'package.json')
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
let rewritten = 0
for (const field of ['dependencies', 'optionalDependencies', 'peerDependencies']) {
  const table = manifest[field]
  if (table === undefined) continue
  for (const [name, range] of Object.entries(table)) {
    if (typeof range === 'string' && range.startsWith('workspace:')) {
      table[name] = '^' + version
      rewritten += 1
    }
  }
}
writeFileSync(manifestPath, JSON.stringify(manifest, undefined, 2) + '\n', 'utf8')
console.log('[sync] ' + source + ' → ' + mirror + '（依赖改写 ' + String(rewritten) + ' 处 → ^' + version + '）')
