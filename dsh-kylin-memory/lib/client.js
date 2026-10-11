window.__ModuleLoader__.load({ id: "dsh-kylin-memory", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.tsx
var index_exports = {};
__export(index_exports, {
  KylinMemoryConfigCard: () => KylinMemoryConfigCard,
  apply: () => apply,
  inject: () => inject,
  installStyles: () => installStyles
});
module.exports = __toCommonJS(index_exports);
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
var inject = ["slots", "locale", "configForms"];
var SETTINGS_NS = "dsh-kylin-memory";
var LOCALE_NS = "kylinMemory.settings";
var STYLE_ID = "dsh-kylin-memory-settings-styles";
var zh = {
  freshTurnCount: "\u4FDD\u7559\u6700\u8FD1\u8F6E\u6570",
  freshTurnCountHint: "\u6279\u91CF\u5F52\u6863\u89E6\u53D1\u65F6\u4FDD\u7559\u6700\u8FD1\u591A\u5C11\u4E2A\u5B8C\u6574\u95EE\u7B54\u8F6E\uFF08\u7528\u6237\u95EE\u9898 + \u6700\u7EC8\u56DE\u7B54\uFF09\uFF0C\u66F4\u65E9\u7684\u5386\u53F2\u7531\u672C\u63D2\u4EF6\u5F52\u6863\u63A5\u7BA1\u3002",
  archiveThresholdTokens: "\u5F52\u6863\u89E6\u53D1\u9608\u503C\uFF08token\uFF09",
  archiveThresholdTokensHint: "\u6A21\u578B\u8868\u9762\u8D85\u8FC7\u8BE5\u542F\u53D1\u5F0F token \u91CF\u624D\u6279\u91CF\u5F52\u6863\u65E7\u524D\u7F00\uFF1B\u8C03\u5927\u51CF\u5C11\u7F13\u5B58\u5931\u6548\u3001\u8C03\u5C0F\u8868\u9762\u66F4\u7D27\u51D1\u3002",
  maintenanceInterval: "\u7EF4\u62A4\u8282\u594F\uFF08\u8F6E\uFF09",
  maintenanceIntervalHint: "\u6BCF\u5B8C\u6210\u591A\u5C11\u8F6E\u6267\u884C\u4E00\u6B21\u7EF4\u62A4\uFF08\u56FE\u7EF4\u62A4\u4E0E\u6D88\u606F\u4FDD\u7559\u6E05\u7406\uFF09\u3002",
  recallMaxNodes: "\u5355\u6B21\u53EC\u56DE\u4E0A\u9650",
  recallMaxNodesHint: "\u4E00\u6B21\u81EA\u52A8\u53EC\u56DE\u6700\u591A\u8FD4\u56DE\u591A\u5C11\u6761\u5339\u914D\u7684\u8BB0\u5FC6\u8282\u70B9\u3002",
  semanticScoreThreshold: "\u8BED\u4E49\u53EC\u56DE\u9608\u503C",
  semanticScoreThresholdHint: "0 \u5230 1 \u7684\u4F59\u5F26\u76F8\u4F3C\u5EA6\u4E0B\u9650\uFF0C\u4F4E\u4E8E\u8BE5\u503C\u7684\u8BED\u4E49\u7ED3\u679C\u4E0D\u6CE8\u5165\uFF1B\u7559\u7A7A\u4F7F\u7528\u9ED8\u8BA4 0.7\u3002",
  overridden: "\u5DF2\u8986\u76D6",
  reset: "\u6062\u590D\u9ED8\u8BA4",
  loading: "\u52A0\u8F7D\u4E2D\u2026",
  readOnly: "\u672C\u90E8\u7F72\u7684\u8BBE\u7F6E\u4E3A\u53EA\u8BFB\u3002",
  unavailable: "\u8BE5\u63D2\u4EF6\u5F53\u524D\u672A\u52A0\u8F7D\uFF0C\u6682\u65F6\u65E0\u6CD5\u914D\u7F6E\u3002",
  save: "\u4FDD\u5B58",
  saving: "\u4FDD\u5B58\u4E2D\u2026",
  saveFailed: "\u672C\u90E8\u7F72\u6CA1\u6709\u63A5\u53D7\u8FD9\u4E9B\u503C\uFF0C\u5DF2\u4FDD\u7559\u4F9B\u4F60\u4FEE\u6539\u3002",
  invalidNumber: "\u8BF7\u586B\u6570\u5B57\uFF1B\u7559\u7A7A\u8868\u793A\u4F7F\u7528\u9ED8\u8BA4\u503C\u3002"
};
var en = {
  freshTurnCount: "Retained recent turns",
  freshTurnCountHint: "How many newest complete Q/A turns stay native when a batch archive fires; older history is archived by this plugin.",
  archiveThresholdTokens: "Archive trigger (tokens)",
  archiveThresholdTokensHint: "Batch-archive the old surface prefix only after the model surface exceeds this heuristic token budget; higher values fewer cache breaks, lower values a tighter surface.",
  maintenanceInterval: "Maintenance cadence (turns)",
  maintenanceIntervalHint: "Run one maintenance tick (graph maintenance and retention GC) every this many completed turns.",
  recallMaxNodes: "Recall limit",
  recallMaxNodesHint: "Upper bound on matched memory nodes returned by one automatic recall.",
  semanticScoreThreshold: "Semantic recall floor",
  semanticScoreThresholdHint: "Cosine similarity floor between 0 and 1; lower-scoring semantic hits are not injected. Leave blank for the default 0.7.",
  overridden: "Overridden",
  reset: "Reset to default",
  loading: "Loading\u2026",
  readOnly: "This deployment stores settings read-only.",
  unavailable: "This plugin is not loaded, so it cannot be configured right now.",
  save: "Save",
  saving: "Saving\u2026",
  saveFailed: "The deployment did not accept these values; they were left for you to correct.",
  invalidNumber: "Enter a number, or leave blank to use the default."
};
var CARD_CSS = `
.km-form {
  display: flex;
  flex-direction: column;
  max-width: 760px;
}

.km-notice {
  margin: 0 0 12px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--dsw-alias-label-tertiary, #8a94a3);
}

.km-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 0;
}

.km-field + .km-field {
  border-top: 0.5px solid var(--dsw-alias-border-l2, rgba(127, 127, 127, 0.2));
}

.km-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.km-label {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.5;
  color: var(--dsw-alias-label-primary, currentColor);
}

.km-badges {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: none;
}

.km-tag {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 1px 8px;
  font-size: 11px;
  line-height: 17px;
  font-weight: 500;
  white-space: nowrap;
  background: var(--dsw-alias-bg-module-platform, rgba(127, 127, 127, 0.14));
  color: var(--dsw-alias-label-secondary, #5a6472);
}

.km-reset {
  border: none;
  background: none;
  padding: 0;
  font: inherit;
  font-size: 12px;
  line-height: 1.5;
  color: var(--dsw-alias-label-secondary, #5a6472);
  cursor: pointer;
}

.km-reset:hover:not(:disabled) {
  color: var(--dsw-alias-label-primary, currentColor);
}

.km-reset:disabled {
  cursor: default;
  opacity: 0.5;
}

.km-input {
  box-sizing: border-box;
  width: 100%;
  height: 34px;
  padding: 0 12px;
  border: 0.5px solid var(--dsw-alias-border-l4, rgba(127, 127, 127, 0.3));
  border-radius: var(--dsw-radius-md, 12px);
  background: var(--dsw-alias-bg-layer-3, transparent);
  font: inherit;
  font-size: 13px;
  line-height: 1.5;
  color: var(--dsw-alias-label-primary, currentColor);
}

.km-input::placeholder {
  color: var(--dsw-alias-label-dimmed, #c9ced6);
}

.km-input:focus-visible {
  outline: none;
  border-color: var(--dsw-alias-state-business-primary, #4d6bfe);
}

.km-input:disabled {
  color: var(--dsw-alias-label-tertiary, #8a94a3);
  cursor: default;
}

.km-input[aria-invalid='true'] {
  border-color: var(--dsw-alias-state-error-primary, #e5484d);
}

.km-hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--dsw-alias-label-tertiary, #8a94a3);
}

.km-invalid {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--dsw-alias-state-error-primary, #e5484d);
}

.km-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 16px;
}

.km-failed {
  flex: 1;
  min-width: 0;
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--dsw-alias-state-error-primary, #e5484d);
}

.km-save {
  appearance: none;
  border: 1px solid transparent;
  border-radius: var(--dsw-radius-md, 12px);
  padding: 5px 14px;
  font: inherit;
  font-size: 13px;
  line-height: 1.5;
  cursor: pointer;
  background: var(--dsw-alias-label-primary, #1f2329);
  color: var(--dsw-alias-bg-layer-3, #ffffff);
}

.km-save:disabled {
  opacity: 0.4;
  cursor: default;
}

.km-save:focus-visible,
.km-reset:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary, #4d6bfe));
  outline-offset: 1px;
}
`;
function installStyles() {
  if (typeof document === "undefined") return () => {
  };
  if (document.getElementById(STYLE_ID) !== null) return () => {
  };
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CARD_CSS;
  document.head.appendChild(style);
  return () => {
    style.remove();
  };
}
var FIELDS = [
  "freshTurnCount",
  "archiveThresholdTokens",
  "maintenanceInterval",
  "recallMaxNodes",
  "semanticScoreThreshold"
];
var FIELD_COPY = {
  freshTurnCount: { label: "freshTurnCount", hint: "freshTurnCountHint", mode: "numeric" },
  archiveThresholdTokens: { label: "archiveThresholdTokens", hint: "archiveThresholdTokensHint", mode: "numeric" },
  maintenanceInterval: { label: "maintenanceInterval", hint: "maintenanceIntervalHint", mode: "numeric" },
  recallMaxNodes: { label: "recallMaxNodes", hint: "recallMaxNodesHint", mode: "numeric" },
  semanticScoreThreshold: { label: "semanticScoreThreshold", hint: "semanticScoreThresholdHint", mode: "decimal" }
};
function isOverridden(user, field) {
  return typeof user === "object" && user !== null && Object.prototype.hasOwnProperty.call(user, field);
}
function acceptedText(value, field) {
  const raw = value?.[field];
  return typeof raw === "number" || typeof raw === "string" ? String(raw) : "";
}
function isValid(text) {
  return text.trim() === "" || Number.isFinite(Number(text));
}
function ConfigField(props) {
  const id = `plugin-config-kylin-memory-${props.field}`;
  const messageId = `${id}-message`;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "km-field", "data-config-field": props.field, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "km-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { className: "km-label", htmlFor: id, children: props.label }),
      props.overridden ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "km-badges", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "km-tag", children: props.t("overridden") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "km-reset", disabled: props.disabled, onClick: props.onReset, children: props.t("reset") })
      ] }) : null
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "input",
      {
        id,
        className: "km-input",
        type: "text",
        inputMode: props.mode,
        autoComplete: "off",
        "aria-invalid": props.invalid || void 0,
        "aria-describedby": messageId,
        disabled: props.disabled,
        value: props.text,
        onChange: (event) => {
          props.onChange(event.target.value);
        }
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { id: messageId, className: props.invalid ? "km-invalid" : "km-hint", children: props.invalid ? props.t("invalidNumber") : props.hint })
  ] });
}
function KylinMemoryConfigCard(props) {
  const live = props.self;
  const [snapshot, setSnapshot] = (0, import_react.useState)(() => live?.getSnapshot());
  (0, import_react.useEffect)(() => {
    if (live === void 0) return;
    setSnapshot(live.getSnapshot());
    return live.subscribe(() => {
      setSnapshot(live.getSnapshot());
    });
  }, [live]);
  const form = props.form ?? (snapshot === void 0 || live === void 0 ? void 0 : { state: snapshot, mutate: (ops, expectedRevision) => live.mutate(ops, expectedRevision) });
  const [staged, setStaged] = (0, import_react.useState)({});
  const [saving, setSaving] = (0, import_react.useState)(false);
  const [failed, setFailed] = (0, import_react.useState)(false);
  const t = props.t;
  if (props.view === "summary") return null;
  if (form === void 0) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "km-notice", role: "status", children: t(snapshot?.status === "unavailable" ? "unavailable" : "loading") });
  }
  if (form.state.status === "unavailable") {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "km-notice", role: "status", children: t("unavailable") });
  }
  if (form.state.status === "loading") {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "km-notice", role: "status", children: t("loading") });
  }
  const state = form.state;
  const textOf = (field) => staged[field] ?? acceptedText(state.value, field);
  const changed = FIELDS.filter((field) => textOf(field) !== acceptedText(state.value, field));
  const invalid = FIELDS.some((field) => !isValid(textOf(field)));
  const dirty = changed.length > 0;
  const disabled = !state.writable || saving;
  const save = () => {
    const ops = changed.map((field) => {
      const text = textOf(field).trim();
      return text === "" ? { op: "unset", path: [field] } : { op: "set", path: [field], value: Number(text) };
    });
    if (ops.length === 0) return;
    setSaving(true);
    setFailed(false);
    void form.mutate(ops, state.revision).then((accepted) => {
      if (accepted) setStaged({});
      else setFailed(true);
    }, () => {
      setFailed(true);
    }).finally(() => {
      setSaving(false);
    });
  };
  const reset = (field) => {
    setSaving(true);
    setFailed(false);
    void form.mutate([{ op: "unset", path: [field] }], state.revision).then((accepted) => {
      if (accepted) setStaged((current) => {
        const next = { ...current };
        delete next[field];
        return next;
      });
      else setFailed(true);
    }, () => {
      setFailed(true);
    }).finally(() => {
      setSaving(false);
    });
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "km-form", "data-config-namespace": SETTINGS_NS, children: [
    !state.writable ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "km-notice", role: "status", children: t("readOnly") }) : null,
    FIELDS.map((field) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      ConfigField,
      {
        field,
        label: t(FIELD_COPY[field].label),
        hint: t(FIELD_COPY[field].hint),
        mode: FIELD_COPY[field].mode,
        text: textOf(field),
        invalid: !isValid(textOf(field)),
        overridden: isOverridden(state.user, field),
        disabled,
        t,
        onChange: (text) => {
          setStaged((current) => ({ ...current, [field]: text }));
        },
        onReset: () => {
          reset(field);
        }
      },
      field
    )),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "km-footer", children: [
      failed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "km-failed", role: "status", children: t("saveFailed") }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "button",
        {
          type: "button",
          className: "km-save",
          disabled: !dirty || invalid || disabled,
          onClick: save,
          children: t(saving ? "saving" : "save")
        }
      )
    ] })
  ] });
}
function apply(ctx) {
  const selfForm = ctx.configForms.get(SETTINGS_NS);
  ctx.effect(() => installStyles(), "kylin-memory: settings styles");
  ctx.effect(
    () => ctx.locale.register(LOCALE_NS, { zh, en }),
    "kylin-memory: dictionaries"
  );
  ctx.effect(
    () => ctx.slots.inject("plugins.bundle.config", () => ctx.slots.register({
      name: "plugins.bundle.config",
      key: SETTINGS_NS,
      locale: LOCALE_NS,
      inject: () => ({ self: selfForm })
    }, KylinMemoryConfigCard)),
    "kylin-memory: settings page"
  );
}
return module.exports; } });
//# sourceMappingURL=client.js.map
