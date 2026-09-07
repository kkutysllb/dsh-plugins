/** DSH 插件入口：cordis 风格注册 webServer 路由（effect 生命周期管理）。 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { type DshToolDefinition } from '../tools/handoff.ts';
export declare const name = "dsh-video-generator";
/** cordis 依赖声明：这些服务就绪后才 apply（对齐 super-ppts 的模块级 inject 约定）。 */
export declare const inject: string[];
/** Agent 能力通告：能力 + 三段交接工作流 + JSON 形状简例 + M4 工具面（不重复技能正文，避免上下文膨胀）。 */
export declare const vgenGuidance = "\u672C\u673A\u5DF2\u5B89\u88C5 dsh-video-generator \u63D2\u4EF6\uFF08\u77ED\u89C6\u9891/\u77ED\u5267/\u6F2B\u5267\u751F\u6210\u7BA1\u7EBF\uFF0C\u7AD6\u5C4F 9:16 \u6210\u7247 mp4+SRT\uFF09\u3002\u4E09\u6BB5\u4EA4\u63A5\u5DE5\u4F5C\u6D41\uFF1A\u4F1A\u8BDD\u6A21\u578B\u81EA\u5DF1\u4EA7\u51FA\u7ED3\u6784\u5316 JSON \u5E76\u4F9D\u6B21\u8C03\u7528 vgen_story \u2192 vgen_script \u2192 vgen_storyboard\uFF0C\u4E4B\u540E\u63A5 vgen_generate \u63A8\u8FDB\u975E LLM \u6BB5\u3002\n1) vgen_story \u63D0\u4EA4\u6545\u4E8B JSON \u5F00\u65B0 run\uFF1A{ title, logline, style, characters: [{ id\uFF08^[a-z0-9_-]+$\uFF0C\u226448\uFF09, name, appearance }], chapters: [...] }\uFF1B\n2) vgen_script \u63D0\u4EA4\u5267\u672C JSON\uFF1Ascenes: [{ id, name, description, characters: [id] }]\u3001dialog: [{ sceneId, characterId, line }]\uFF0C\u5F15\u7528\u5FC5\u987B\u5B58\u5728\uFF1B\n3) vgen_storyboard \u63D0\u4EA4\u5206\u955C\u6570\u7EC4\uFF1A\u6BCF\u955C { index\uFF08\u4ECE 1 \u8FDE\u7EED\uFF09, line, prompt, characterIds, sceneId?, camera?, durationSec 2..10, voiceHint? }\uFF0C\u5DE5\u5177\u81EA\u52A8\u6CE8\u5165\u56DB\u5C42\u63D0\u793A\u8BCD\uFF1B\n4) vgen_generate { runId, target: 'assets'|'video'|'final', confirm?, concurrency?, gates?, gateApprovals?, rerunStage? }\uFF1Aassets \u51FA\u89D2\u8272\u4E09\u89C6\u56FE/\u573A\u666F\u4E3B\u56FE/\u9010\u955C\u53C2\u8003\u56FE\uFF0Cvideo \u9010\u955C\u56FE\u751F\u89C6\u9891\uFF0Cfinal \u914D\u97F3\u5E76\u6E32\u67D3\u6210\u7247\u3002\u9996\u6B21\u4E0D\u5E26 confirm\uFF1B\u8FD4\u56DE confirm-required\uFF08error.code\uFF09\u2192 \u5411\u7528\u6237\u8F6C\u8FF0\u6210\u672C\u540E confirm:true \u91CD\u8C03\uFF1Bgate-approval \u2192 \u7528\u6237\u6279\u51C6\u540E gateApprovals:[\"\u6BB5\u540D\"] \u91CD\u8C03\uFF1Bmanual-gate \u2192 \u6536\u7528\u6237\u6587\u4EF6\u8D70 vgen_provide\uFF1B\u91CD\u505A\u67D0\u6BB5 \u2192 rerunStage\uFF08\u5A92\u4F53\u6BB5\u91CD\u7F6E pending\uFF09\uFF1B\n5) vgen_status { runId }\uFF1A\u8FDB\u5EA6 + gates + reviews + \u6700\u8FD1\u4E8B\u4EF6\uFF1B\n6) vgen_review { runId, shot, score?, negativeHint?, confirm? } \u8D28\u91CF\u95ED\u73AF\uFF1A\u4E0D\u5E26 score \u2192 \u8FD4\u56DE\u6210\u7247 25/50/75% \u4E09\u5E27\u8DEF\u5F84\uFF08\u7528\u8BFB\u56FE\u5DE5\u5177\u9010\u5E27\u67E5\u770B\u540E\u8BC4\u5206\uFF09\uFF1B\u5E26 score 1-5 \u2192 \u22653 \u8BB0\u901A\u8FC7\uFF1B\u22642 \u81EA\u52A8\u8FFD\u52A0\u8D1F\u9762\u8BCD\u91CD\u62CD\uFF08\u6BCF\u955C \u22642 \u6B21\uFF0C\u91CD\u62CD\u82B1\u8D39\u540C confirm \u8BED\u4E49\uFF09\uFF0C\u91CD\u62CD\u540E\u8FD4\u56DE\u65B0\u5E27\u7EE7\u7EED\u8BC4\uFF1B\n7) vgen_provide { runId, stage, files: [{ path, shot?, name? }] }\uFF1Amanual gate \u4EA7\u7269\u6CE8\u5165\uFF08master-asset \u6587\u4EF6\u540D char-*/scene-*\uFF1Bshot-assets/video \u9010\u955C shot \u53F7\uFF0Cvideo \u987B\u5168\u955C\u8986\u76D6\u4E14\u65F6\u957F\u22650.5s\uFF1Bfinal-cut \u9996\u6587\u4EF6 .mp4 \u6CE8\u5165\u540E run \u76F4\u63A5 done\uFF09\uFF1B\n8) vgen_channels { action: 'list'|'health'|'spend' }\uFF1A\u901A\u9053\u9762\u677F\uFF08\u8131\u654F\u5217\u8868/\u63A2\u6D4B\u5065\u5EB7+\u4F30\u4EF7/\u7D2F\u8BA1\u6D88\u8017\uFF09\u3002\n\u7528\u6237\u901A\u9053\u5728 Web \u8BBE\u7F6E\u9875\u300C\u89C6\u9891\u5DE5\u574A\u300D\u7BA1\u7406\uFF08\u4E09\u8981\u7D20\u81EA\u914D\uFF0C\u5B98\u65B9/\u4E2D\u8F6C\u7686\u53EF\uFF09\u3002\u6CE8\u610F\uFF1Ahappyhorse \u7B49\u514D\u8D39\u6863\u89C6\u9891\u6A21\u578B\u53EF\u80FD\u5E26\u5E73\u53F0\u6C34\u5370\uFF0C\u4ECB\u610F\u8BF7\u63D0\u9192\u7528\u6237\u6362\u4ED8\u8D39\u6A21\u578B\u3002\u9519\u8BEF\u4FE1\u5C01 { ok: false, error: { code, message } }\uFF1B\u672A\u77E5 runId = not-found\u3002";
interface WebServerFace {
    register(route: {
        kind: 'exact' | 'prefix';
        path: string;
        handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>;
    }): () => void;
}
interface ToolsFace {
    register(def: DshToolDefinition): () => void;
}
interface SystemPromptFace {
    section(spec: {
        name: string;
        order: number;
        text: string;
    }): () => void;
}
/** wire 层收到的 ctx 面（effect 为 cordis ctx 自带；systemPrompt 做软探测防宿主版本差异崩载）。 */
interface HostContext {
    webServer: WebServerFace;
    tools: ToolsFace;
    systemPrompt?: SystemPromptFace;
    effect(fn: () => () => void, name?: string): () => void;
}
export declare function apply(ctx: HostContext): () => void;
export {};
