/**
 * Studio 双语层：官方 Hyperframes Studio 只有英文，这里在反代返回的 HTML 里注入
 * 一个默认中文、可切英文的界面翻译层。只改作者界面，不改 composition 源文件。
 */
export const STUDIO_LOCALE_SCRIPT = String.raw`<script id="ktoon-studio-i18n">(function () {
  var dict = {
    'Compositions': '合成',
    'Assets': '素材',
    'Code': '代码',
    'Catalog': '目录',
    'Preview': '预览',
    'Design': '设计',
    'Layers': '图层',
    'Renders': '渲染',
    'Variables': '变量',
    'Blur': '模糊',
    'Timeline': '时间线',
    'Export': '导出',
    'Share': '分享',
    'Capture': '捕获',
    'Inspector': '检查器',
    'Window': '窗口',
    'Install the desktop app': '安装桌面版',
    'Nothing selected': '未选择',
    'Click any element on the canvas to edit it, or drag to select several.': '点击画布元素编辑，或拖拽多选。',
    'Record a gesture': '录制手势',
    'Describe a change to the agent': '描述改动给 Agent',
    'Lint': '检查',
    'Drop media here': '拖入素材',
    'Fit': '适应',
    'Play': '播放',
    'Pause': '暂停',
    'Add': '添加',
    'Undo': '撤销',
    'Redo': '重做',
    'Save': '保存',
    'Cancel': '取消',
    'Delete': '删除',
    'Duplicate': '复制',
    'Settings': '设置',
    'Help': '帮助',
    'Render': '渲染',
    'Project': '项目',
    'Projects': '项目',
    'Close': '关闭',
    'Open': '打开',
    'New': '新建',
    'Preview frame': '预览帧',
    'Composition': '合成',
    'Master': '主合成',
    'Scrim': '遮罩',
    'Stage': '舞台',
    'Bar': '装饰条',
    'Title': '标题',
    'Line': '台词',
    'Shift + drag/click to edit range': 'Shift + 拖拽/点击选择范围',
    'Select': '选择',
    'Text': '文字',
    'Image': '图片',
    'Video': '视频',
    'Audio': '音频',
    'Volume': '音量',
    'Speed': '速度',
    'Duration': '时长',
    'Start': '开始',
    'End': '结束',
    'Background': '背景',
    'Color': '颜色',
    'Font': '字体',
    'Size': '字号',
    'Opacity': '不透明度',
    'Align': '对齐',
    'Left': '左',
    'Center': '中',
    'Right': '右',
    'Visible': '可见',
    'Hidden': '隐藏',
    'Locked': '锁定',
    'Muted': '静音',
    'Loop': '循环',
    'Name': '名称',
    'Source': '源',
    'Media': '媒体',
    'Properties': '属性',
    'Animation': '动画',
    'Ease': '缓动',
    'Keyframe': '关键帧',
    'Crop': '裁切',
    'Rotate': '旋转',
    'Scale': '缩放',
    'Position': '位置',
    'X': 'X',
    'Y': 'Y'
  };
  var attrs = ['placeholder', 'title', 'aria-label'];
  var textMap = new WeakMap();
  var attrMap = new WeakMap();
  var seenText = new WeakSet();
  var seenAttr = new WeakSet();
  var texts = [];
  var attrRecords = [];
  var locale = 'zh';
  try { locale = localStorage.getItem('ktoon.studio.locale') || 'zh'; } catch (error) {}
  var button;

  function skip(node) {
    var el = node.nodeType === 3 ? node.parentElement : node;
    if (!el || !el.closest) return true;
    return el.closest('script,style,code,pre,input,textarea,select,[contenteditable="true"],[data-hf-no-i18n]') !== null;
  }

  function keyOf(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function translateNode(node) {
    if (!node || node.nodeType !== 3 || skip(node)) return;
    var raw = node.nodeValue || '';
    var key = keyOf(raw);
    if (key === '' || dict[key] === undefined) return;
    if (!seenText.has(node)) {
      textMap.set(node, raw);
      seenText.add(node);
      texts.push(node);
    }
    var lead = (raw.match(/^\s*/) || [''])[0];
    var trail = (raw.match(/\s*$/) || [''])[0];
    var next = lead + dict[key] + trail;
    if (node.nodeValue !== next) node.nodeValue = next;
  }

  function translateAttrs(el) {
    if (!el || el.nodeType !== 1 || skip(el)) return;
    var store = attrMap.get(el);
    if (!store) { store = {}; attrMap.set(el, store); }
    attrs.forEach(function (name) {
      if (!el.hasAttribute(name)) return;
      var raw = el.getAttribute(name);
      var key = keyOf(raw);
      if (key === '' || dict[key] === undefined) return;
      if (store[name] === undefined) {
        store[name] = raw;
        if (!seenAttr.has(el)) { seenAttr.add(el); attrRecords.push(el); }
      }
      el.setAttribute(name, dict[key]);
    });
  }

  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { translateNode(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9) return;
    if (root.nodeType === 1) translateAttrs(root);
    var children = root.childNodes || [];
    for (var i = 0; i < children.length; i += 1) walk(children[i]);
  }

  function translateAll() {
    if (locale !== 'zh') return;
    walk(document.body);
    if (document.title) document.title = 'KToon Studio';
  }

  function restoreAll() {
    texts.forEach(function (node) { if (textMap.has(node)) node.nodeValue = textMap.get(node); });
    attrRecords.forEach(function (el) {
      var store = attrMap.get(el);
      if (!store) return;
      attrs.forEach(function (name) { if (store[name] !== undefined) el.setAttribute(name, store[name]); });
    });
    if (document.title) document.title = 'Hyperframes Studio';
  }

  function decorate() {
    var logo = document.querySelector('svg[aria-label="Hyperframes"]');
    if (logo !== null && document.getElementById('ktoon-brand') === null) {
      var brand = document.createElement('span');
      brand.id = 'ktoon-brand';
      brand.textContent = 'dsh-kylin-toon';
      brand.style.cssText = 'font:600 13px/1 system-ui,sans-serif;color:inherit;opacity:1;white-space:nowrap;letter-spacing:-.01em;';
      logo.replaceWith(brand);
    }
    var currentBrand = document.getElementById('ktoon-brand');
    if (currentBrand !== null && currentBrand.parentElement !== null) {
      var siblings = currentBrand.parentElement.children;
      for (var j = siblings.length - 1; j >= 0; j -= 1) {
        if (siblings[j] !== currentBrand) siblings[j].remove();
      }
    }
    var install = document.querySelectorAll('.hf-framey-trigger, button, a');
    for (var i = 0; i < install.length; i += 1) {
      var el = install[i];
      var text = keyOf(el.textContent);
      if (el.classList.contains('hf-framey-trigger') || text === '安装桌面版' || text === 'Install the desktop app') el.remove();
    }
  }

  function renderButton() {
    if (!button) return;
    button.textContent = locale === 'zh' ? 'EN' : '中文';
    button.title = locale === 'zh' ? 'Switch to English' : '切换到中文';
  }

  function setLocale(next) {
    locale = next === 'en' ? 'en' : 'zh';
    try { localStorage.setItem('ktoon.studio.locale', locale); } catch (error) {}
    decorate();
    if (locale === 'zh') translateAll(); else restoreAll();
    renderButton();
  }

  function mount() {
    if (document.getElementById('ktoon-studio-locale')) return;
    button = document.createElement('button');
    button.id = 'ktoon-studio-locale';
    button.type = 'button';
    button.setAttribute('aria-label', '切换 Studio 界面语言');
    button.style.cssText = 'position:fixed;right:14px;bottom:14px;z-index:2147483647;height:28px;padding:0 10px;border:1px solid rgba(255,255,255,.22);border-radius:7px;background:rgba(15,17,22,.82);color:#f4f1ea;font:600 11px/1 system-ui,sans-serif;cursor:pointer;backdrop-filter:blur(6px);';
    button.addEventListener('click', function () { setLocale(locale === 'zh' ? 'en' : 'zh'); });
    var style = document.createElement('style');
    style.id = 'ktoon-studio-chrome';
    style.textContent = '.hf-framey-trigger{display:none!important}svg[aria-label="Hyperframes"]{display:none!important}';
    document.head.appendChild(style);
    document.body.appendChild(button);
    decorate();
    renderButton();
    translateAll();
    var timer;
    var observer = new MutationObserver(function () {
      if (locale !== 'zh') return;
      clearTimeout(timer);
      timer = setTimeout(function () { decorate(); translateAll(); }, 40);
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();</script>`;
