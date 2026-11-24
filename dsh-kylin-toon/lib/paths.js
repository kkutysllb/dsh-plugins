/**
 * 创作目录约定（与参考项目 oh-story-dsh 对齐）：
 * - 小说：正文/ 大纲/ 设定/ 追踪/ 对标/ 参考资料/，或根文件 正文.md 设定.md 小节大纲.md
 * - 短剧漫剧：剧集/<EP>/ 下最多五份创作文档 + 制作成果/，或根目录 short-drama.json
 * - 互动游戏：game-adaptations/<project>/
 * - 视频解说：video-recaps/<project>/
 */

export const NOVEL_DIRECTORIES = ['正文', '大纲', '设定', '追踪', '章节', '对标', '参考资料'];
export const NOVEL_ROOT_FILES = ['灵感.md', '故事架构.md', '设定.md', '人物.md', '大纲.md', '小节大纲.md', '正文.md', '追踪.md', '发布资料.md', '改编计划.md'];
export const DRAMA_DIRECTORY = '剧集';
export const DRAMA_FILES = ['剧本.md', '视觉设定.md', '分镜.md', 'MOTION.md', '图片提示词.md', '视频提示词.md', '剪辑单.md'];
export const DRAMA_METADATA = 'short-drama.json';
export const GAME_DIRECTORY = 'game-adaptations';
export const VIDEO_DIRECTORY = 'video-recaps';
export const STATE_DIRECTORY = '.kylin-toon';

export const TEXT_EXTENSIONS = new Set(['.md', '.txt', '.json', '.jsonl', '.srt', '.ass', '.vtt', '.csv']);
export const MEDIA_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.svg',
  '.mp4', '.webm', '.mov', '.mkv', '.m4v',
  '.mp3', '.wav', '.m4a', '.aac', '.flac', '.ogg'
]);
export const EDITABLE_EXTENSIONS = new Set([...TEXT_EXTENSIONS]);

const HIDDEN_SKIP = new Set(['node_modules', '.git', '.kylin-toon', '.DS_Store']);

export function pathExtension(path) {
  const name = path.slice(path.lastIndexOf('/') + 1);
  const index = name.lastIndexOf('.');
  return index <= 0 ? '' : name.slice(index).toLowerCase();
}

/** 相对路径必须是工作区内的普通路径；不做 URL 解码，不接受绝对路径或上跳。 */
export function safeRelativePath(value) {
  if (typeof value !== 'string' || value === '') return undefined;
  if (value.startsWith('/') || value.includes('\\')) return undefined;
  const parts = value.split('/');
  if (parts.some((part) => part === '' || part === '.' || part === '..')) return undefined;
  return value;
}

export function isCreativePath(path) {
  const head = path.split('/', 1)[0];
  if (head === GAME_DIRECTORY || head === VIDEO_DIRECTORY || head === DRAMA_DIRECTORY) return true;
  if (NOVEL_ROOT_FILES.includes(path)) return true;
  if (NOVEL_DIRECTORIES.includes(head)) return true;
  if (path === DRAMA_METADATA) return true;
  return false;
}

/** 根目录文档名：已在用的 MV/连续剧工程把剧本、分镜、设定放在项目根，不会叫固定文件名。 */
const ROOT_DOCUMENT = /集|剧本|分镜|设定|大纲|镜头表|故事|分析|风格|提示词|剪辑|踩坑|全剧|台词|PROGRESS|README|正文|小节/i;
/** 创作工程里的文本侧车目录（字幕、分析、交付清单等）。 */
const CREATIVE_TEXT_DIRECTORIES = /^(成片|设定图|配音|剧照|shots|deliveries|delivery|制作成果|work|analysis|subs)\//;

export function isEditablePath(path) {
  if (!EDITABLE_EXTENSIONS.has(pathExtension(path))) return false;
  if (isCreativePath(path)) return true;
  if (!path.includes('/')) {
    // 根目录的 Markdown/字幕是创作文档；工程说明文件与 JSON 配置不放行。
    const extension = pathExtension(path);
    if (extension === '.md' || extension === '.txt' || extension === '.srt' || extension === '.ass' || extension === '.vtt') {
      return !/^(README|CHANGELOG|CONTRIBUTING|LICENSE|SECURITY|AGENTS|CLAUDE)\.md$/i.test(path);
    }
    return ROOT_DOCUMENT.test(path);
  }
  return CREATIVE_TEXT_DIRECTORIES.test(path);
}

export function isMediaPath(path) {
  return MEDIA_EXTENSIONS.has(pathExtension(path));
}

export function isSkippedName(name) {
  return HIDDEN_SKIP.has(name) || name.startsWith('.');
}

export function mediaMimeType(path) {
  switch (pathExtension(path)) {
    case '.png': return 'image/png';
    case '.jpg': case '.jpeg': return 'image/jpeg';
    case '.webp': return 'image/webp';
    case '.gif': return 'image/gif';
    case '.avif': return 'image/avif';
    case '.svg': return 'image/svg+xml';
    case '.mp4': return 'video/mp4';
    case '.m4v': return 'video/mp4';
    case '.webm': return 'video/webm';
    case '.mov': return 'video/quicktime';
    case '.mkv': return 'video/x-matroska';
    case '.mp3': return 'audio/mpeg';
    case '.wav': return 'audio/wav';
    case '.m4a': return 'audio/mp4';
    case '.aac': return 'audio/aac';
    case '.flac': return 'audio/flac';
    case '.ogg': return 'audio/ogg';
    case '.srt': return 'text/plain; charset=utf-8';
    case '.vtt': return 'text/vtt; charset=utf-8';
    default: return 'application/octet-stream';
  }
}

export function dramaDocKind(path) {
  const name = path.slice(path.lastIndexOf('/') + 1);
  return DRAMA_FILES.includes(name) ? name : undefined;
}

export function episodeDirectoryOf(path) {
  const parts = path.split('/');
  if (parts.length >= 3 && parts[0] === DRAMA_DIRECTORY) return parts[0] + '/' + parts[1];
  return undefined;
}