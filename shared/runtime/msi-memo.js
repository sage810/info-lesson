/* 수정 요청 메모 — 선생님 전용 (A안: 저장소 없이 복사·붙여넣기).
 * 활동지 화면에서 글을 선택하고 요청을 적어 목록에 담은 뒤, "전체 복사"로 Claude 에게 붙여넣는다.
 * 켜기: 주소 끝에 ?memo=1 (그 브라우저에 기억됨) / 끄기: ?memo=0.  켜지 않으면 아무것도 하지 않는다 → 학생 화면에는 안 보임.
 * GitHub Pages 배포본(pages)에만 붙는다(render.mjs). 구글 사이트용(embed)·정답지 PDF 에는 들어가지 않는다.
 * 메모 목록은 이 브라우저(localStorage)에만 있고 서버로 가지 않는다. */
(function () {
  'use strict';
  var FLAG = 'msi-memo-on';
  var q = '';
  try { q = new URLSearchParams(location.search).get('memo') || ''; } catch (e) {}
  try { if (q === '1') localStorage.setItem(FLAG, '1'); else if (q === '0') localStorage.removeItem(FLAG); } catch (e) {}
  var on = q === '1';
  try { if (q !== '0' && localStorage.getItem(FLAG) === '1') on = true; } catch (e) {}
  if (!on) return;

  // ── 이 페이지가 어느 차시인지 ──
  var m = location.pathname.match(/\/([a-z][a-z-]*)\/(\d{2})\/(?:[^/]*)$/);
  var lessonId = m ? m[1] + '/' + m[2] : location.pathname;
  var lessonTitle = String((window.MSI_CONFIG && window.MSI_CONFIG.title) || document.title || '').replace(/\s+/g, ' ').trim();
  var STORE = 'msi-memo-items:' + lessonId;

  var items = [];
  try { items = JSON.parse(localStorage.getItem(STORE) || '[]') || []; } catch (e) { items = []; }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(items)); } catch (e) {} }

  var root, btn, panel, quoteBox, noteBox, listBox, toastEl, last = null;

  function visible(el) { return !!(el && el.getClientRects && el.getClientRects().length); }
  function clean(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }
  function plain(s) { return clean(s).replace(/^[^0-9A-Za-z가-힣]+/, ''); }   // 앞의 이모지·기호 떼기

  // ── 선택한 글 붙잡기(칸 안 글·일반 글 모두). 폰에서는 버튼을 눌러도 선택이 풀릴 수 있어 마지막 선택을 기억한다 ──
  function grab() {
    var ae = document.activeElement;
    if (ae && (ae.tagName === 'TEXTAREA' || ae.tagName === 'INPUT') && !(root && root.contains(ae))
        && typeof ae.selectionStart === 'number' && ae.selectionStart !== ae.selectionEnd) {
      var t0 = clean(ae.value.slice(ae.selectionStart, ae.selectionEnd));
      if (t0) return { text: t0, el: ae };
    }
    var s = window.getSelection && window.getSelection();
    if (!s || s.isCollapsed || !s.rangeCount) return null;
    var t = clean(s.toString());
    if (!t) return null;
    var n = s.anchorNode, el = n && (n.nodeType === 1 ? n : n.parentElement);
    if (!el || (root && root.contains(el))) return null;
    return { text: t, el: el };
  }
  function remember() { var g = grab(); if (g) { last = g; if (panel && panel.style.display !== 'none') showQuote(); } }
  document.addEventListener('selectionchange', remember);
  document.addEventListener('select', remember, true);

  // ── 위치 알아내기: 탭 › 앞쪽에서 가장 가까운 MISSION_n 같은 구역 표시 › 가장 가까운 소제목 · 칸 이름 ──
  var SEC_RE = /^(MISSION[_ ]?\d+|ACTIVITY[_ ]?\d+|WORKSHEET[_ ]?\d+|TODAY_TOPIC|TODAY_GOALS|MY_INFO|PREVIOUSLY|RECAP)\b/;
  function lastBefore(list, el, test) {
    var hit = null;
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (c === el || c.contains(el)) continue;
      if (!(el.compareDocumentPosition(c) & 2)) break;      // c 가 el 보다 뒤 → 그만
      if (test(c)) hit = c;
    }
    return hit;
  }
  function locate(el) {
    var parts = [];
    var tab = Array.prototype.filter.call(document.querySelectorAll('.tab-chip[aria-selected="true"]'), visible)[0];
    if (tab && plain(tab.textContent)) parts.push(plain(tab.textContent));
    var all = document.querySelectorAll('body *');
    var sec = lastBefore(all, el, function (c) { return c.children.length === 0 && visible(c) && SEC_RE.test(clean(c.textContent)); });
    if (sec) parts.push(clean(sec.textContent));
    var head = lastBefore(document.querySelectorAll('.m-title, .m-hd2, .c-lbl, h1, h2, h3'), el, function (c) { return visible(c) && plain(c.textContent); });
    if (head) parts.push(plain(head.textContent).slice(0, 60));
    var lab = el.closest && el.closest('[aria-label]');
    var field = lab && !(root && root.contains(lab)) ? clean(lab.getAttribute('aria-label')) : '';
    return { where: parts.join(' › '), field: field };
  }

  // ── 화면 ──
  var CSS =
    '#msi-memo{position:fixed;right:14px;bottom:14px;z-index:2147483000;font-family:"Maplestory","Apple SD Gothic Neo","Malgun Gothic",sans-serif;color:#4b3b6b;font-size:14px;line-height:1.5}' +
    '#msi-memo *{box-sizing:border-box}' +
    '#msi-memo .mm-fab{display:block;margin-left:auto;cursor:pointer;padding:8px 13px;border:3px solid #4b3b6b;border-radius:9px;background:#d6c4f5;color:#4b3b6b;box-shadow:3px 3px 0 rgba(75,59,107,.25);' +
      'font-family:"CookieRun","Maplestory",sans-serif;font-weight:700;font-size:14px;white-space:nowrap}' +
    '#msi-memo .mm-fab:hover{background:#fbe6a2}' +
    '#msi-memo .mm-panel{display:none;width:min(360px,calc(100vw - 28px));max-height:min(75vh,640px);overflow:auto;margin-bottom:8px;padding:12px;border:3px solid #4b3b6b;border-radius:12px;background:#fffdf7;box-shadow:5px 5px 0 rgba(75,59,107,.22)}' +
    '#msi-memo .mm-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;font-family:"CookieRun","Maplestory",sans-serif;font-weight:700;font-size:15px}' +
    '#msi-memo .mm-x{cursor:pointer;border:2px solid #4b3b6b;border-radius:7px;background:#fffdf7;color:#4b3b6b;padding:0 8px;font-size:15px;line-height:1.4}' +
    '#msi-memo .mm-quote{margin:0 0 8px;padding:8px 10px;border:2px dashed #b3a8cc;border-radius:9px;background:#f4f8fe;font-size:13px;word-break:keep-all}' +
    '#msi-memo .mm-quote.empty{color:#8b7cb8}' +
    '#msi-memo textarea{display:block;width:100%;min-height:64px;margin:0 0 8px;padding:8px 10px;border:3px solid #4b3b6b;border-radius:9px;background:#fdf6fa;color:#4b3b6b;font:inherit;resize:vertical}' +
    '#msi-memo textarea:focus{outline:none;border-color:#ee9dbf;background:#fff}' +
    '#msi-memo .mm-btn{cursor:pointer;padding:6px 11px;border:3px solid #4b3b6b;border-radius:9px;background:#9db2f2;color:#26224a;font-family:"CookieRun","Maplestory",sans-serif;font-weight:700;font-size:13px;box-shadow:2px 2px 0 rgba(75,59,107,.25)}' +
    '#msi-memo .mm-btn.ghost{background:#fffdf7;color:#4b3b6b}' +
    '#msi-memo .mm-row{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}' +
    '#msi-memo .mm-list{margin:0 0 8px;padding:0;list-style:none;display:flex;flex-direction:column;gap:6px}' +
    '#msi-memo .mm-item{padding:7px 9px;border:2px solid #4b3b6b;border-radius:9px;background:#fff;font-size:13px;word-break:keep-all}' +
    '#msi-memo .mm-item .mm-w{color:#8b7cb8;font-size:12px}' +
    '#msi-memo .mm-item .mm-del{float:right;cursor:pointer;border:0;background:none;color:#a65a86;font-size:13px}' +
    '#msi-memo .mm-hint{margin:0;color:#8b7cb8;font-size:12px}' +
    '#msi-memo .mm-toast{position:absolute;left:0;right:0;bottom:48px;text-align:center;pointer-events:none;opacity:0;transition:opacity .2s}' +
    '#msi-memo .mm-toast span{display:inline-block;padding:5px 11px;border:3px solid #4b3b6b;border-radius:9px;background:#d8f0c4;font-family:"CookieRun","Maplestory",sans-serif;font-weight:700;font-size:13px}' +
    '@media print{#msi-memo{display:none!important}}';

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  function showQuote() {
    if (last && last.text) { quoteBox.className = 'mm-quote'; quoteBox.textContent = '“' + (last.text.length > 160 ? last.text.slice(0, 160) + '…' : last.text) + '”'; }
    else { quoteBox.className = 'mm-quote empty'; quoteBox.textContent = '고치고 싶은 글을 드래그해서 선택해 보세요. (선택 없이 적어도 돼요)'; }
  }
  function renderList() {
    listBox.textContent = '';
    items.forEach(function (it, i) {
      var li = el('li', 'mm-item');
      var del = el('button', 'mm-del', '✕'); del.type = 'button'; del.setAttribute('aria-label', (i + 1) + '번 메모 지우기');
      del.onclick = function () { items.splice(i, 1); save(); renderList(); };
      li.appendChild(del);
      li.appendChild(el('div', '', (i + 1) + '. ' + it.note));
      if (it.text) li.appendChild(el('div', 'mm-w', '“' + (it.text.length > 70 ? it.text.slice(0, 70) + '…' : it.text) + '”'));
      listBox.appendChild(li);
    });
    btn.textContent = '📝 메모' + (items.length ? ' (' + items.length + ')' : '');
  }
  function toast(msg) {
    toastEl.firstChild.textContent = msg; toastEl.style.opacity = '1';
    clearTimeout(toast._t); toast._t = setTimeout(function () { toastEl.style.opacity = '0'; }, 1600);
  }
  function add() {
    var note = noteBox.value.trim();
    if (!note) { toast('요청을 적어 주세요'); noteBox.focus(); return; }
    var it = { note: note, text: '', where: '', field: '' };
    if (last && last.text) { it.text = last.text; var w = locate(last.el); it.where = w.where; it.field = w.field; }
    items.push(it); save();
    noteBox.value = ''; last = null; showQuote(); renderList(); toast('목록에 담았어요');
  }
  function format() {
    var out = ['[수정 요청] ' + lessonId + (lessonTitle ? ' 「' + lessonTitle + '」' : ''), ''];
    items.forEach(function (it, i) {
      out.push((i + 1) + '. ' + it.note);
      if (it.where) out.push('   위치: ' + it.where + (it.field ? ' (칸: ' + it.field + ')' : ''));
      else if (it.field) out.push('   칸: ' + it.field);
      if (it.text) out.push('   선택한 글: “' + it.text + '”');
    });
    return out.join('\n');
  }
  function copy() {
    if (!items.length) { toast('담은 메모가 없어요'); return; }
    var text = format();
    function fallback() {
      var ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;left:-9999px;top:0';
      document.body.appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta); toast(ok ? '복사됐어요. Claude 에 붙여넣으세요' : '복사하지 못했어요');
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { toast('복사됐어요. Claude 에 붙여넣으세요'); }, fallback);
    else fallback();
  }

  function build() {
    var st = document.createElement('style'); st.id = 'msi-memo-style'; st.textContent = CSS; document.head.appendChild(st);
    root = el('div'); root.id = 'msi-memo'; root.setAttribute('data-msi-memo', '');

    panel = el('div', 'mm-panel'); panel.style.display = 'none'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', '수정 요청 메모');
    var head = el('div', 'mm-head'); head.appendChild(el('span', '', '✏️ 수정 요청 메모'));
    var x = el('button', 'mm-x', '✕'); x.type = 'button'; x.setAttribute('aria-label', '메모 창 닫기'); x.onclick = function () { panel.style.display = 'none'; };
    head.appendChild(x); panel.appendChild(head);

    quoteBox = el('p', 'mm-quote empty'); panel.appendChild(quoteBox);
    noteBox = el('textarea'); noteBox.setAttribute('aria-label', '수정 요청 내용'); noteBox.placeholder = '어떻게 고치면 좋을지 적어요'; panel.appendChild(noteBox);

    var row1 = el('div', 'mm-row');
    var addB = el('button', 'mm-btn', '➕ 목록에 담기'); addB.type = 'button'; addB.onclick = add; row1.appendChild(addB);
    panel.appendChild(row1);

    listBox = el('ul', 'mm-list'); panel.appendChild(listBox);
    var row2 = el('div', 'mm-row');
    var cpB = el('button', 'mm-btn', '📋 전체 복사'); cpB.type = 'button'; cpB.onclick = copy;
    var clB = el('button', 'mm-btn ghost', '🗑 모두 지우기'); clB.type = 'button';
    clB.onclick = function () { if (!items.length || confirm('담은 메모를 모두 지울까요?')) { items = []; save(); renderList(); } };
    row2.appendChild(cpB); row2.appendChild(clB); panel.appendChild(row2);
    panel.appendChild(el('p', 'mm-hint', '복사한 글을 Claude 대화에 붙여넣으세요. 이 메모는 이 브라우저에만 있어요. 끄려면 주소 끝에 ?memo=0'));

    btn = el('button', 'mm-fab', '📝 메모'); btn.type = 'button';
    btn.addEventListener('mousedown', function (e) { e.preventDefault(); });   // 데스크톱: 글 선택이 풀리지 않게
    btn.onclick = function () {
      var open = panel.style.display === 'none' || !panel.style.display;
      panel.style.display = open ? 'block' : 'none';
      if (open) { remember(); showQuote(); }
    };
    toastEl = el('div', 'mm-toast'); toastEl.appendChild(el('span', '', ''));
    root.appendChild(panel); root.appendChild(toastEl); root.appendChild(btn);
    document.body.appendChild(root);
    renderList(); showQuote();
  }
  if (document.body) build(); else document.addEventListener('DOMContentLoaded', build);
})();
