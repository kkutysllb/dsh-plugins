#!/usr/bin/env python3
"""Template conformance gate for dsh-super-ppts.

Checks every text element of a .pptx against a materialized template contract:
- role comes from shape.name prefix "sp:" first, then placeholder type;
- declared levels are strict (font/size/line-spacing/color);
- observed-only roles are advisory but must stay inside the observed font/size set;
- untagged text is UNVERIFIED and fails the gate;
- "sp:decoration" is exempt (counted and ratio-warned).

Exit code: 0 = no FAIL/UNVERIFIED, 1 = gate failed, 2 = bad input.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import zipfile
import xml.etree.ElementTree as ET

from pptx import Presentation
from pptx.enum.shapes import PP_PLACEHOLDER
from pptx.oxml.ns import qn

A_NS = 'http://schemas.openxmlformats.org/drawingml/2006/main'
NS = {'a': A_NS}

FONT_ALIASES = {
    '雅黑': '微软雅黑',
    '微软雅黑': '微软雅黑',
    'microsoft yahei': '微软雅黑',
    'msyh': '微软雅黑',
    '宋体': '宋体',
    'simsun': '宋体',
    'arial': 'Arial',
    'calibri': 'Calibri',
    '等线': '等线',
    'dengxian': '等线',
}

PLACEHOLDER_ROLES = {
    PP_PLACEHOLDER.TITLE: 'title',
    PP_PLACEHOLDER.CENTER_TITLE: 'title',
    PP_PLACEHOLDER.SUBTITLE: 'subtitle',
    PP_PLACEHOLDER.BODY: 'body',
    PP_PLACEHOLDER.OBJECT: 'body',
    PP_PLACEHOLDER.VERTICAL_BODY: 'body',
    PP_PLACEHOLDER.VERTICAL_TITLE: 'title',
    PP_PLACEHOLDER.FOOTER: 'footnote',
    PP_PLACEHOLDER.DATE: 'footnote',
    PP_PLACEHOLDER.SLIDE_NUMBER: 'page-number',
}


def normalize_font(name):
    if not name:
        return name
    key = str(name).strip()
    alias = FONT_ALIASES.get(key) or FONT_ALIASES.get(key.lower())
    return alias or key


def normalize_color(value):
    if not value:
        return None
    text = str(value).strip().lstrip('#').upper()
    return text if re.fullmatch(r'[0-9A-F]{6}', text) else None


def _sz_from(el):
    if el is None:
        return None
    raw = el.get('sz')
    if raw is None:
        return None
    try:
        return int(raw) / 100.0
    except (TypeError, ValueError):
        return None


def _find_sz(el):
    if el is None:
        return None
    for tag in (qn('a:defRPr'), qn('a:rPr')):
        for found in el.iter(tag):
            size = _sz_from(found)
            if size is not None:
                return size
    return None


def _layout_placeholder(shape):
    try:
        slide = shape.part.slide
        layout = slide.slide_layout
        idx = shape.placeholder_format.idx
        for ph in layout.placeholders:
            if ph.placeholder_format.idx == idx:
                return ph
    except Exception:
        pass
    return None


def _master_style_size(shape):
    try:
        master = shape.part.slide.slide_layout.slide_master
        tx = master.element.find(qn('p:txStyles'))
        if tx is None:
            return None
        ph_type = shape.placeholder_format.type
        style_name = 'p:titleStyle' if ph_type in (PP_PLACEHOLDER.TITLE, PP_PLACEHOLDER.CENTER_TITLE) else 'p:bodyStyle'
        style = tx.find(qn(style_name))
        if style is None:
            return None
        lvl = style.find(qn('a:lvl1pPr'))
        if lvl is None:
            return None
        return _sz_from(lvl.find(qn('a:defRPr')))
    except Exception:
        return None


def effective_size(shape, paragraph, run):
    for candidate in (run, paragraph):
        if candidate is None:
            continue
        try:
            size = candidate.font.size
            if size is not None:
                return float(size.pt)
        except Exception:
            pass
    if run is not None:
        rPr = run._r.find(qn('a:rPr'))
        size = _sz_from(rPr)
        if size is not None:
            return size
    if paragraph is not None:
        pPr = paragraph._p.find(qn('a:pPr'))
        size = _sz_from(pPr.find(qn('a:defRPr'))) if pPr is not None else None
        if size is not None:
            return size
    if shape.is_placeholder:
        ph = _layout_placeholder(shape)
        if ph is not None:
            size = _find_sz(ph.element)
            if size is not None:
                return size
        size = _master_style_size(shape)
        if size is not None:
            return size
    return None


def _theme_fonts(deck_path):
    fonts = {'major': {}, 'minor': {}}
    try:
        with zipfile.ZipFile(deck_path) as zf:
            xml = zf.read('ppt/theme/theme1.xml')
        root = ET.fromstring(xml)
        for kind, tag in (('major', 'a:majorFont'), ('minor', 'a:minorFont')):
            node = root.find('.//' + tag, NS)
            if node is None:
                continue
            for slot in ('latin', 'ea', 'cs'):
                child = node.find('a:' + slot, NS)
                if child is not None and child.get('typeface'):
                    fonts[kind][slot] = child.get('typeface')
    except Exception:
        pass
    return fonts


def resolve_theme_font(code, theme):
    if not code or not str(code).startswith('+'):
        return code
    kind = 'major' if 'mj' in code else 'minor'
    slot = code.rsplit('-', 1)[-1]
    return theme.get(kind, {}).get(slot) or theme.get(kind, {}).get('latin')


def effective_font(shape, paragraph, run, theme):
    candidates = []
    if run is not None:
        try:
            candidates.append(run.font.name)
        except Exception:
            pass
    if paragraph is not None:
        try:
            candidates.append(paragraph.font.name)
        except Exception:
            pass
    if run is not None:
        rPr = run._r.find(qn('a:rPr'))
        if rPr is not None:
            latin = rPr.find(qn('a:latin'))
            if latin is not None:
                candidates.append(latin.get('typeface'))
    for candidate in candidates:
        if not candidate:
            continue
        resolved = resolve_theme_font(candidate, theme)
        if resolved:
            return resolved
    return None


def effective_color(run):
    if run is None:
        return None
    try:
        rgb = run.font.color.rgb
        if rgb is not None:
            return str(rgb)
    except Exception:
        pass
    rPr = run._r.find(qn('a:rPr'))
    if rPr is not None:
        srgb = rPr.find('.//' + qn('a:srgbClr'))
        if srgb is not None:
            return srgb.get('val')
    return None


def role_of(shape):
    name = str(getattr(shape, 'name', '') or '')
    if name.startswith('sp:'):
        return name[3:].strip()
    if shape.is_placeholder:
        try:
            return PLACEHOLDER_ROLES.get(shape.placeholder_format.type, '')
        except Exception:
            return ''
    return ''


class Report:
    def __init__(self):
        self.items = []

    def add(self, status, page, shape, role, check, expected=None, actual=None, detail=''):
        self.items.append({
            'page': page,
            'shape': shape,
            'role': role,
            'check': check,
            'expected': expected,
            'actual': actual,
            'status': status,
            'detail': detail,
        })

    def counts(self):
        out = {'pass': 0, 'fail': 0, 'unverified': 0, 'exempt': 0, 'warn': 0}
        for item in self.items:
            key = item['status'].lower()
            if key in out:
                out[key] += 1
        return out


def check(deck_path, contract):
    levels = {str(level.get('role')): level for level in contract.get('levels') or [] if level.get('role')}
    observed = contract.get('observed') or {}
    observed_sizes = [float(x) for x in observed.get('sizesPt') or []]
    observed_fonts = {normalize_font(x).lower() for x in observed.get('fonts') or [] if x}
    tolerances = contract.get('tolerances') or {}
    size_tol = float(tolerances.get('sizePt', 0.5))
    enforcement = contract.get('enforcement') or {}
    ratio_warn = float(enforcement.get('exemptRatioWarn', 0.15))

    theme = _theme_fonts(deck_path)
    prs = Presentation(deck_path)
    report = Report()
    total_text = 0
    exempt_text = 0

    for page_index, slide in enumerate(prs.slides, start=1):
        for shape in slide.shapes:
            if not getattr(shape, 'has_text_frame', False):
                continue
            text = (shape.text_frame.text or '').strip()
            if not text:
                continue
            role = role_of(shape)
            if role == 'decoration':
                exempt_text += 1
                total_text += 1
                report.add('EXEMPT', page_index, shape.name, role, 'decoration', detail='装饰文本，跳过')
                continue
            for paragraph in shape.text_frame.paragraphs:
                runs = list(paragraph.runs)
                if not runs and paragraph.text.strip():
                    runs = [None]
                for run in runs:
                    if run is not None and not run.text.strip():
                        continue
                    total_text += 1
                    actual_size = effective_size(shape, paragraph, run)
                    actual_font = effective_font(shape, paragraph, run, theme)
                    actual_color = effective_color(run)
                    level = levels.get(role)
                    if role and level is not None and level.get('enforced', True):
                        expected_size = level.get('sizePt')
                        if expected_size is not None:
                            if actual_size is None:
                                report.add('UNVERIFIED', page_index, shape.name, role, 'sizePt', expected_size, None, '字号无法解析（run/段落/占位符/母版均未给出）')
                            elif abs(float(actual_size) - float(expected_size)) > size_tol:
                                report.add('FAIL', page_index, shape.name, role, 'sizePt', expected_size, actual_size, '字号与模板规范不一致')
                            else:
                                report.add('PASS', page_index, shape.name, role, 'sizePt', expected_size, actual_size)
                        expected_font = level.get('font')
                        if expected_font:
                            if actual_font is None:
                                report.add('UNVERIFIED', page_index, shape.name, role, 'font', expected_font, None, '字体无法解析')
                            elif normalize_font(actual_font).lower() != normalize_font(expected_font).lower():
                                report.add('FAIL', page_index, shape.name, role, 'font', expected_font, actual_font, '字体与模板规范不一致')
                            else:
                                report.add('PASS', page_index, shape.name, role, 'font', expected_font, actual_font)
                        expected_color = normalize_color(level.get('color'))
                        if expected_color and actual_color:
                            actual_hex = normalize_color(actual_color)
                            if actual_hex is None:
                                report.add('UNVERIFIED', page_index, shape.name, role, 'color', expected_color, actual_color, '颜色无法归一化')
                            elif actual_hex != expected_color:
                                report.add('FAIL', page_index, shape.name, role, 'color', expected_color, actual_color, '颜色与模板规范不一致')
                            else:
                                report.add('PASS', page_index, shape.name, role, 'color', expected_color, actual_color)
                        expected_spacing = level.get('lineSpacing')
                        if expected_spacing is not None:
                            try:
                                actual_spacing = paragraph.line_spacing
                            except Exception:
                                actual_spacing = None
                            if isinstance(actual_spacing, float):
                                if abs(actual_spacing - float(expected_spacing)) > float(tolerances.get('lineSpacing', 0.05)):
                                    report.add('FAIL', page_index, shape.name, role, 'lineSpacing', expected_spacing, actual_spacing, '行距与模板规范不一致')
                                else:
                                    report.add('PASS', page_index, shape.name, role, 'lineSpacing', expected_spacing, actual_spacing)
                    elif role and level is not None:
                        # observed/advisory role
                        if actual_size is not None and observed_sizes and not any(abs(actual_size - s) <= size_tol for s in observed_sizes):
                            report.add('UNVERIFIED', page_index, shape.name, role, 'sizePt', observed_sizes, actual_size, '非强制层级的字号不在模板观察集内')
                        elif actual_size is not None:
                            report.add('PASS', page_index, shape.name, role, 'sizePt', level.get('sizePt'), actual_size, '观察级（advisory）')
                        if actual_font is not None and observed_fonts and normalize_font(actual_font).lower() not in observed_fonts:
                            report.add('UNVERIFIED', page_index, shape.name, role, 'font', sorted(observed_fonts), actual_font, '非强制层级的字体不在模板观察集内')
                    else:
                        report.add('UNVERIFIED', page_index, shape.name, role or '', 'role', '', role or None, '文本元素未打 sp:<role> 标签，无法判定层级')

    counts = report.counts()
    if total_text > 0 and (exempt_text / total_text) > ratio_warn:
        report.add('WARN', 0, '', '', 'exemptRatio', ratio_warn, round(exempt_text / total_text, 3), '豁免文本占比超过阈值，请复核')
        counts = report.counts()
    ok = counts['fail'] == 0 and counts['unverified'] == 0
    return {'ok': ok, 'contractHash': contract.get('sourceHash'), 'items': report.items, 'summary': counts}


def main() -> int:
    parser = argparse.ArgumentParser(description='Check a PPTX against a dsh-super-ppts template contract.')
    parser.add_argument('deck')
    parser.add_argument('--contract', required=True)
    parser.add_argument('--json', action='store_true', dest='as_json')
    args = parser.parse_args()

    try:
        with open(args.contract, 'r', encoding='utf-8') as fh:
            contract = json.load(fh)
    except Exception as error:
        print(json.dumps({'ok': False, 'error': 'contract-unreadable: ' + str(error)}, ensure_ascii=False))
        return 2
    if contract.get('status') != 'parsed':
        print(json.dumps({'ok': False, 'error': 'contract-status: ' + str(contract.get('status'))}, ensure_ascii=False))
        return 2
    if not os.path.isfile(args.deck):
        print(json.dumps({'ok': False, 'error': 'deck-not-found: ' + args.deck}, ensure_ascii=False))
        return 2

    try:
        result = check(args.deck, contract)
    except Exception as error:
        print(json.dumps({'ok': False, 'error': 'check-failed: ' + str(error)}, ensure_ascii=False))
        return 2

    if args.as_json:
        print(json.dumps(result, ensure_ascii=False))
    else:
        for item in result['items']:
            if item['status'] in ('FAIL', 'UNVERIFIED'):
                print(f"[{item['status']}] p{item['page']} {item['shape']} role={item['role']} {item['check']}: expected={item['expected']} actual={item['actual']} {item['detail']}")
        print('summary:', json.dumps(result['summary'], ensure_ascii=False))
        print('PASS' if result['ok'] else 'FAIL')
    return 0 if result['ok'] else 1


if __name__ == '__main__':
    sys.exit(main())
