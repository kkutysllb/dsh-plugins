#!/usr/bin/env node
/** 把插件包内 presets/ 链接到用户预设根（幂等）。 */
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const source = resolve(here, '..', 'presets')
const targetRoot = process.env.KSRW_PRESETS_DIR
  || join(process.env.QILIN_HOME || join(homedir(), '.qilin'), '.agent-presets')

if (!existsSync(source)) {
  console.error('找不到插件内 presets/：' + source)
  process.exit(1)
}
mkdirSync(targetRoot, { recursive: true })
for (const entry of ['ksrw-lead', 'ksrw-topic', 'ksrw-proposal', 'ksrw-literature', 'ksrw-experiment', 'ksrw-paper', 'ksrw-patent', 'ksrw-ailab']) {
  const from = join(source, entry)
  if (!existsSync(from)) continue
  const to = join(targetRoot, entry)
  rmSync(to, { recursive: true, force: true })
  cpSync(from, to, { recursive: true })
}
console.log('KSRW 预设已写入：' + targetRoot + '（引擎用户预设根）')
