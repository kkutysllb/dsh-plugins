/** 创作项目持久化（规格 §3）：workspace 内 `.dsh-drama/projects/<projectId>/`。
 *
 * 三条铁律的存储面：
 * - 资产文件存在即权威，缺失视为空资产（revision = 'absent'）；
 * - 版本 = 文件规范化 UTF-8 字节的 SHA-256，写必须携带读到的 revision（乐观并发）；
 * - 写入一律 tmp + rename 原子替换；目录 0700、文件 0600；损坏文件备份 `<name>.broken-<ts>` 后按缺失处理。
 */
export type DramaErrorCode = 'bad-request' | 'not-found' | 'conflict' | 'stale-revision' | 'workspace-unknown' | 'project-exists' | 'proposal-stale' | 'proposal-limit' | 'too-large' | 'internal';
export declare class DramaError extends Error {
    readonly code: DramaErrorCode;
    constructor(code: DramaErrorCode, message: string);
}
export type AssetKind = 'json' | 'markdown';
export interface AssetRef {
    /** 规范引用串（原样回显给调用方） */
    label: string;
    kind: AssetKind;
    /** 项目目录内相对路径（POSIX 风格，白名单生成，无穿越可能） */
    file: string;
}
/** 白名单解析：'premise'…'characters' | 'chapters/<nnnn>/<part>'；其余一律 null（调用方转 bad-request）。 */
export declare function parseAssetRef(ref: unknown): AssetRef | null;
export declare const ABSENT_REVISION = "absent";
export type Revision = string;
/** 章节号 → 4 位目录 id（1 → '0001'）；越界返回 null。 */
export declare function chapterDirId(n: number): string | null;
export type ProjectStrategy = 'balanced' | 'fluency' | 'consistency' | 'deep-planning';
export interface ProjectManifest {
    schemaVersion: 1;
    id: string;
    title: string;
    category: string;
    language: string;
    strategy: ProjectStrategy;
    plannedChapters: number;
    chapterWordTarget: number;
    createdAt: string;
    updatedAt: string;
}
export interface PremiseAsset {
    title: string;
    category: string;
    language: string;
    audience: string;
    logline: string;
    theme: string;
    tone: string;
    plannedChapters: number;
    chapterWordTarget: number;
    strategy: ProjectStrategy;
}
export interface ArchitectureAsset {
    mainConflict: string;
    protagonistGoal: string;
    antagonistForce: string;
    cost: string;
    startingPoint: string;
    midpointTurn: string;
    climax: string;
    ending: string;
    theme: string;
    mainline: string;
    subplots: string[];
    foreshadows: string[];
}
export type WorldCategory = 'rule' | 'geography' | 'organization' | 'era' | 'power' | 'misc';
export interface WorldEntry {
    id: string;
    category: WorldCategory;
    title: string;
    content: string;
    /** 「供正文引用」标记：章节草稿上下文只携带标记条目。 */
    citedInBody: boolean;
}
export interface WorldbuildingAsset {
    entries: WorldEntry[];
}
export interface CharacterRecord {
    id: string;
    name: string;
    identity: string;
    status: string;
    appearanceChapters: number[];
    hasVisualAsset: boolean;
    appearance: string;
    personality: string;
    desire: string;
    fear: string;
    background: string;
    relationships: string[];
    keyEvents: string[];
    /** 漫剧视觉提示词（供 master-asset 用）。 */
    visualPrompt: string;
}
export interface CharactersAsset {
    characters: CharacterRecord[];
}
export type OutlineStatus = 'none' | 'planned' | 'written' | 'reviewed' | 'final';
export interface OutlineRow {
    chapter: number;
    title: string;
    goal: string;
    mainEvents: string;
    characters: string[];
    scenes: string;
    mood: string;
    clueProgress: string;
    endingHook: string;
    status: OutlineStatus;
}
export interface OutlineAsset {
    rows: OutlineRow[];
}
export interface ChapterBlueprint {
    goal: string;
    conflict: string;
    scenes: string;
    characterIds: string[];
    keyEvents: string[];
    factsFromPrev: string[];
    newFacts: string[];
    endingHook: string;
}
export type ReviewCategory = 'continuity' | 'motivation' | 'foreshadow' | 'goal';
export type ReviewProblemStatus = 'resolved' | 'unresolved' | 'needs-verify';
export interface ReviewProblem {
    id: string;
    category: ReviewCategory;
    description: string;
    /** 正文证据（原文摘录）。 */
    evidence: string;
    status: ReviewProblemStatus;
}
export interface ChapterReview {
    problems: ReviewProblem[];
    createdAt: string;
}
export type TaskStatus = 'pending' | 'running' | 'done' | 'failed' | 'canceled';
export interface TaskEvent {
    at: string;
    type: string;
    detail?: Record<string, unknown>;
}
export interface TaskRecord {
    taskId: string;
    projectId: string;
    kind: string;
    status: TaskStatus;
    params: Record<string, unknown>;
    /** Host 组装的完整任务指令（§6.3 模板），会话发送桥原样转发。 */
    instruction: string;
    inputRefs: string[];
    sessionId?: string;
    runId?: string;
    events: TaskEvent[];
    error?: string;
    createdAt: string;
    updatedAt: string;
}
export interface AdaptationParams {
    /** 目标时长档位（如 '60s' / '90s' / '120s'，自由文本档位标签）。 */
    targetDuration: string;
    aspect: '9:16';
    /** 忠实改编 / 紧凑浓缩。 */
    fidelity: 'faithful' | 'condensed';
    narrationLanguage: string;
}
export interface AdaptationRecord {
    adaptationId: string;
    projectId: string;
    chapterId: string;
    params: AdaptationParams;
    runId?: string;
    createdAt: string;
    updatedAt: string;
}
export type ProjectStatus = 'writing' | 'pending-review' | 'adapting' | 'done';
export interface ProjectSummary {
    id: string;
    title: string;
    category: string;
    language: string;
    status: ProjectStatus;
    chaptersFinal: number;
    plannedChapters: number;
    latestTask: {
        kind: string;
        status: TaskStatus;
        at: string;
    } | null;
    latestAdaptation: {
        adaptationId: string;
        runId?: string;
        at: string;
    } | null;
    updatedAt: string;
    createdAt: string;
}
export interface AssetWithRevision {
    assetRef: string;
    kind: AssetKind;
    revision: Revision;
    /** json 资产为 sanitize 后的对象；markdown 为字符串；缺失为 null。 */
    data: unknown;
}
export interface ChapterSummary {
    id: string;
    number: number;
    blueprintRevision: Revision;
    draftRevision: Revision;
    reviewRevision: Revision;
    finalRevision: Revision;
}
export interface ProjectDetail {
    manifest: ProjectManifest;
    premise: AssetWithRevision;
    architecture: AssetWithRevision;
    worldbuilding: AssetWithRevision;
    outline: AssetWithRevision;
    characters: AssetWithRevision;
    chapters: ChapterSummary[];
    tasks: TaskRecord[];
    adaptations: AdaptationRecord[];
}
export interface ProjectCreateInput {
    title: string;
    category: string;
    language: string;
    audience?: string;
    logline: string;
    theme?: string;
    tone?: string;
    plannedChapters?: number;
    chapterWordTarget?: number;
    strategy?: ProjectStrategy;
}
export declare const PREMISE_LOGLINE_MAX = 20000;
/** 按 assetRef 分派的 JSON 资产校验。写入与提案形状校验共用（同一资产同一形状契约）。 */
export declare function sanitizeJsonAsset(assetRef: string, v: unknown): unknown;
/** 供给 ProposalStore 复用的「校验不落盘」。json 资产返回规范对象，markdown 返回字符串。 */
export declare function validateReplacement(assetRef: string, kind: AssetKind, replacement: unknown): unknown;
/** 约束：单进程使用（同步 API 串行化）；跨进程并发写同一项目目录不在保障范围。 */
export declare class ProjectStore {
    /** `.dsh-drama` 根目录（workspace 内）。 */
    readonly rootDir: string;
    private brokenBackedUp;
    constructor(rootDir: string);
    static open(opts: {
        workspaceDir: string;
    }): ProjectStore;
    private projectsDir;
    /** 项目目录（不校验存在）。id 必须先过形状校验，防路径注入。 */
    projectDir(projectId: string): string;
    private stamp;
    private writeFileAtomic;
    private readFileBytes;
    revisionOf(assetRef: AssetRef, projectId: string): Revision;
    /** assetRef.label 缺省时按 file 反查（内部构造的 AssetRef 允许省略 label）。 */
    private labelOf;
    /** 损坏 JSON 备份原字节（0600）；同实例同文件只备份一次。 */
    private backupBroken;
    /** 读 JSON 资产：缺失 → null；损坏/形状不符 → 备份后按缺失。 */
    private readJsonFile;
    list(): ProjectSummary[];
    private readManifest;
    summary(projectId: string): ProjectSummary | null;
    create(input: ProjectCreateInput): ProjectManifest;
    get(projectId: string): ProjectDetail | null;
    requireProject(projectId: string): ProjectDetail;
    touch(projectId: string): void;
    readAsset(projectId: string, assetRef: string): {
        kind: AssetKind;
        revision: Revision;
        data: unknown;
    };
    /** 乐观并发写：baseRevision 与当前不符 → stale-revision，不落盘（验收 6）。 */
    writeAsset(projectId: string, assetRef: string, baseRevision: Revision, replacement: unknown): {
        revision: Revision;
    };
    saveCandidate(projectId: string, chapterNumber: number, content: string): {
        name: string;
    };
    listCandidates(projectId: string, chapterNumber: number): Array<{
        name: string;
        rel: string;
    }>;
    createTask(projectId: string, input: {
        kind: string;
        params?: Record<string, unknown>;
        instruction: string;
        inputRefs: string[];
    }): TaskRecord;
    getTask(projectId: string, taskId: string): TaskRecord | null;
    requireTask(projectId: string, taskId: string): TaskRecord;
    updateTask(projectId: string, taskId: string, patch: {
        status?: TaskStatus;
        sessionId?: string | null;
        runId?: string | null;
        error?: string | null;
        event?: {
            type: string;
            detail?: Record<string, unknown>;
        };
    }): TaskRecord;
    createAdaptation(projectId: string, input: {
        chapterId: string;
        params: AdaptationParams;
    }): AdaptationRecord;
    getAdaptation(projectId: string, adaptationId: string): AdaptationRecord | null;
    requireAdaptation(projectId: string, adaptationId: string): AdaptationRecord;
    /** vgen_story 落 run 后回填 run-link（验收 12）。 */
    linkRun(projectId: string, adaptationId: string, runId: string): AdaptationRecord;
    /** story/script/storyboard 三段产物镜像（§2.6）。 */
    mirrorAdaptationArtifact(projectId: string, adaptationId: string, name: 'script' | 'storyboard' | 'story', data: unknown): void;
}
