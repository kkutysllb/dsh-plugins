function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function str(value) {
    if (typeof value !== 'string')
        return undefined;
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
}
function strList(value) {
    if (!Array.isArray(value))
        return undefined;
    const out = value.filter((item) => typeof item === 'string' && item.trim() !== '');
    return out.length === 0 ? undefined : out;
}
/** 解析分镜：容错但严格校验必填项（页码顺序由数组顺序决定）。 */
export function parseStoryboard(raw) {
    const errors = [];
    const root = isRecord(raw) ? raw : undefined;
    const rawPages = root === undefined ? undefined : root['pages'];
    if (rawPages === undefined && Array.isArray(raw)) {
        return parseStoryboard({ pages: raw });
    }
    if (!Array.isArray(rawPages)) {
        return { ok: false, errors: ['storyboard.pages 必须是数组'], value: { pages: [] } };
    }
    if (rawPages.length === 0)
        errors.push('storyboard.pages 不能为空');
    if (rawPages.length > 40)
        errors.push('单篇漫画最多 40 页（当前 ' + String(rawPages.length) + '）');
    const pages = [];
    rawPages.forEach((item, index) => {
        const path = 'pages[' + String(index) + ']';
        if (!isRecord(item)) {
            errors.push(path + ' 必须是对象');
            return;
        }
        const title = str(item['title']);
        if (title === undefined) {
            errors.push(path + '.title 必填');
            return;
        }
        const page = { title };
        const core = str(item['core']);
        if (core !== undefined)
            page.core = core;
        const scene = str(item['scene']);
        if (scene !== undefined)
            page.scene = scene;
        const characters = strList(item['characters']);
        if (characters !== undefined)
            page.characters = characters;
        const layout = str(item['layout']);
        if (layout !== undefined)
            page.layout = layout;
        const shot = str(item['shot']);
        if (shot !== undefined)
            page.shot = shot;
        const panels = strList(item['panels']);
        if (panels !== undefined)
            page.panels = panels;
        const focus = str(item['focus']);
        if (focus !== undefined)
            page.focus = focus;
        const narration = str(item['narration']);
        if (narration !== undefined)
            page.narration = narration;
        const dialogueRaw = item['dialogue'];
        if (Array.isArray(dialogueRaw)) {
            const dialogue = [];
            for (const entry of dialogueRaw) {
                if (!isRecord(entry))
                    continue;
                const text = str(entry['text']);
                if (text === undefined)
                    continue;
                const line = { text };
                const speaker = str(entry['speaker']);
                if (speaker !== undefined)
                    line.speaker = speaker;
                dialogue.push(line);
            }
            if (dialogue.length > 0)
                page.dialogue = dialogue;
        }
        else if (dialogueRaw !== undefined) {
            errors.push(path + '.dialogue 必须是数组');
        }
        pages.push(page);
    });
    return { ok: errors.length === 0, errors, value: { pages } };
}
export function parseCharacters(raw) {
    const errors = [];
    const list = Array.isArray(raw) ? raw : isRecord(raw) && Array.isArray(raw['characters']) ? raw['characters'] : undefined;
    if (list === undefined)
        return { ok: false, errors: ['characters 必须是数组或 { characters: [...] }'], value: [] };
    const characters = [];
    list.forEach((item, index) => {
        if (!isRecord(item)) {
            errors.push('characters[' + String(index) + '] 必须是对象');
            return;
        }
        const name = str(item['name']);
        const sheet = str(item['sheet']);
        if (name === undefined) {
            errors.push('characters[' + String(index) + '].name 必填');
            return;
        }
        if (sheet === undefined) {
            errors.push('characters[' + String(index) + '].sheet 必填（跨页一致性靠它）');
            return;
        }
        characters.push({ name, sheet });
    });
    if (characters.length > 8)
        errors.push('主要角色最多 8 个（当前 ' + String(characters.length) + '）');
    return { ok: errors.length === 0, errors, value: characters };
}
/** 全篇同一句风格前言：风格锁的可测锚点。 */
export function stylePreambleOf(plan) {
    return 'Keep one consistent art style, palette and line weight across every page of this comic: '
        + plan.artStyle + ' art style with a ' + plan.tone + ' tone; never switch to another visual style.';
}
/** 把一页分镜编译成 ImagePrompt v1。纯函数，可 golden 测试。 */
export function buildPagePrompt(input) {
    const { page, index, plan } = input;
    const isCover = index === 0;
    const subjectParts = [];
    if (isCover)
        subjectParts.push('封面：' + page.title);
    else if (page.core !== undefined)
        subjectParts.push(page.core);
    if (page.scene !== undefined)
        subjectParts.push('场景：' + page.scene);
    if (subjectParts.length === 0)
        subjectParts.push(page.title);
    const text = [];
    if (page.narration !== undefined) {
        text.push({ content: page.narration, kind: 'narration', mustRenderExactly: true });
    }
    for (const line of page.dialogue ?? []) {
        const block = { content: line.text, kind: 'speech-bubble', mustRenderExactly: true };
        if (line.speaker !== undefined)
            block.speaker = line.speaker;
        text.push(block);
    }
    // 只注入本页显式列出的角色：不列就不注入（避免把整个卡司硬塞进每一格）。
    // 跨页观感一致由「图像锁」（角色三视图作参考图）与逐字一致的 sheet 描述共同保证。
    const inPage = new Set(page.characters ?? []);
    const characters = input.characters
        .filter((character) => inPage.has(character.name))
        .map((character) => ({ name: character.name, sheet: character.sheet }));
    const prompt = {
        schemaVersion: 1,
        id: input.projectId + '/page-' + String(index).padStart(2, '0'),
        intent: isCover ? 'single-image' : 'comic-page',
        subject: subjectParts.join('；'),
        composition: {
            layout: page.layout ?? plan.layout,
            ...(page.shot === undefined ? {} : { shot: page.shot }),
            ...(page.panels === undefined ? {} : { panels: page.panels }),
            ...(page.focus === undefined ? {} : { hierarchy: [page.focus] }),
        },
        style: { artStyle: plan.artStyle, tone: plan.tone, tags: ['Illustration'] },
        technical: {
            aspectRatio: input.aspectRatio ?? plan.aspectRatio,
            resolution: '2k',
            format: 'png',
        },
        constraints: {
            must: [stylePreambleOf(plan)],
            avoid: ['photorealistic photo', '3D render', 'inconsistent character design', 'garbled text'],
        },
        meta: { source: 'comic:' + input.projectId + '#' + String(index) },
    };
    if (characters.length > 0)
        prompt.characters = characters;
    if (text.length > 0)
        prompt.text = text;
    if (input.language !== undefined)
        prompt.language = input.language;
    return prompt;
}
/** 项目视觉方案 → 一句话说明（给 status / 卡片用）。 */
export function describePlan(plan) {
    return plan.artStyle + ' / ' + plan.tone + ' / ' + plan.layout + ' / ' + plan.aspectRatio;
}
