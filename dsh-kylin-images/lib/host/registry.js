/**
 * 运行时容器：把插件需要的服务（vault / provider 注册表 / 记账目录）收在一处，
 * 便于工具面与 HTTP 路由共用，也便于测试直接构造（不依赖宿主）。
 */
import { MockProvider } from "../provider/mock.js";
import { OpenAiImagesProvider } from "../provider/openai-images.js";
import { OpenAiResponsesProvider } from "../provider/openai-responses.js";
import { TaskImagesProvider } from "../provider/task-images.js";
import { ResultCache } from "../store/cache.js";
import { effectiveSizeStyle } from "../provider/catalog.js";
import { resolvePluginHome } from "../store/home.js";
import { Vault } from "../store/vault.js";
export function createRuntime(home = resolvePluginHome()) {
    const vault = new Vault(home);
    const providers = new Map();
    providers.set('mock', new MockProvider());
    providers.set('openai-images', new OpenAiImagesProvider());
    providers.set('openai-responses', new OpenAiResponsesProvider());
    providers.set('task-images', new TaskImagesProvider());
    const cache = new ResultCache(home);
    return {
        home,
        vault,
        cache,
        providers,
        providerFor(channel) {
            const provider = providers.get(channel.kind);
            if (provider === undefined) {
                throw new Error('通道类型 ' + channel.kind + ' 没有可用适配器（可选：mock / openai-images / openai-responses / task-images）');
            }
            return provider;
        },
        sizeStyleFor(channel, model) {
            return effectiveSizeStyle(channel.sizeStyle, channel.kind, model ?? channel.models[0]);
        },
        decoratesRequest(channel, request) {
            return request;
        },
    };
}
