/* 원고지 입력칸 — textarea.wongoji 를 원고지 칸으로 보여 주고, 한 칸에 한 글자씩 그린다(띄어쓰기도 한 칸, 줄바꿈은 다음 줄 첫 칸).
   선생님 결정 2026-11-04(ai/exam): 논술 답 칸을 모두 원고지로.

   만드는 법: 보이는 것은 원고지 칸(.wg-grid), 그 위에 같은 크기의 투명한 textarea 를 겹친다.
   → 한글 조합(IME)·붙여넣기 막기·답 보관·채점 기록은 모두 원래 textarea 그대로(shared/partials/exam.js 가 그대로 씀).
   커서·선택·클릭·↑↓·Home/End 는 원고지 칸 기준으로 이 파일이 맞춘다(투명 textarea 의 줄과 원고지 줄이 달라서).
   - 한 줄 칸 수: 넓이에 맞춰 8~20칸(원고지 20칸), 칸은 정사각형. 줄 수: textarea rows 가 최소, 글이 차면 한 줄씩 늘어남.
   - exam.js 보다 먼저 불러야 한다(글자 수 표시를 원고지 아래에 붙이고, PDF 에서 원고지를 그대로 찍게).
   - 다른 스크립트가 value 를 바꾸면 input 이벤트를 보내거나 window.MSI_WONGOJI.refresh() 를 부른다. */
(function () {
  'use strict';
  var MAX_COLS = 20, MIN_COLS = 8, CELL_MIN = 34;
  var boxes = [];

  function make(ta) {
    var wrap = document.createElement('div'); wrap.className = 'wg';
    var grid = document.createElement('div'); grid.className = 'wg-grid'; grid.setAttribute('aria-hidden', 'true');
    var caret = document.createElement('span'); caret.className = 'wg-caret no-pdf';
    ta.parentNode.insertBefore(wrap, ta);
    wrap.appendChild(grid); wrap.appendChild(ta); wrap.appendChild(caret);
    var st = { ta: ta, wrap: wrap, grid: grid, caret: caret, cols: MAX_COLS, minRows: Math.max(1, parseInt(ta.getAttribute('rows'), 10) || 3), pos: [], last: null, down: false, anchor: 0 };
    ta._wg = st;
    ta.setAttribute('wrap', 'soft');
    ta.addEventListener('input', function () { render(st); });
    ['focus', 'blur', 'keyup', 'select', 'click'].forEach(function (ev) { ta.addEventListener(ev, function () { paintSel(st); }); });
    ta.addEventListener('keydown', function (e) { keys(st, e); });
    ta.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      e.preventDefault(); ta.focus();
      var i = indexAt(st, e.clientX, e.clientY);
      if (e.shiftKey) setSel(st, st.anchor, i); else { st.anchor = i; ta.setSelectionRange(i, i); }
      st.down = true; paintSel(st);
    });
    ta.addEventListener('click', function (e) {   // 손가락(터치)으로 누른 자리
      if (st.down || e.detail === 0) return;
      var i = indexAt(st, e.clientX, e.clientY); st.anchor = i; ta.setSelectionRange(i, i); paintSel(st);
    });
    boxes.push(st);
    fit(st); render(st);
  }

  document.addEventListener('pointermove', function (e) {
    boxes.forEach(function (st) { if (st.down) { setSel(st, st.anchor, indexAt(st, e.clientX, e.clientY)); paintSel(st); } });
  });
  document.addEventListener('pointerup', function () { boxes.forEach(function (st) { if (st.down) setTimeout(function () { st.down = false; }, 0); }); });
  document.addEventListener('selectionchange', function () { var a = document.activeElement; if (a && a._wg) paintSel(a._wg); });

  function setSel(st, a, b) { if (a <= b) st.ta.setSelectionRange(a, b, 'forward'); else st.ta.setSelectionRange(b, a, 'backward'); }

  // 넓이 → 한 줄 칸 수
  function fit(st) {
    var w = st.wrap.clientWidth || st.wrap.getBoundingClientRect().width;
    if (!w) return false;
    var cols = Math.max(MIN_COLS, Math.min(MAX_COLS, Math.floor(w / CELL_MIN)));
    if (cols === st.cols && st.grid.childNodes.length) return false;
    st.cols = cols; st.wrap.style.setProperty('--wg-cols', cols); st.last = null;
    return true;
  }

  // 글 → 칸 자리. pos[i] = 글자 i 앞 커서 자리 {r,c}, cells = [{r,c,ch,i}]
  function layout(st) {
    var v = st.ta.value, cols = st.cols, r = 0, c = 0, wrapped = false, pos = [], cells = [];
    for (var i = 0; i < v.length; i++) {
      pos[i] = { r: r, c: c };
      var ch = v.charAt(i);
      if (ch === '\n') { if (!wrapped) r++; c = 0; wrapped = false; continue; }
      var code = v.charCodeAt(i);
      if (code >= 0xD800 && code <= 0xDBFF && i + 1 < v.length) { ch += v.charAt(i + 1); pos[i + 1] = { r: r, c: c }; cells.push({ r: r, c: c, ch: ch, i: i }); i++; }
      else cells.push({ r: r, c: c, ch: ch, i: i });
      c++; wrapped = false;
      if (c >= cols) { r++; c = 0; wrapped = true; }
    }
    pos[v.length] = { r: r, c: c };
    st.pos = pos; st.cells = cells;
    return Math.max(st.minRows, r + 1);
  }

  function render(st) {
    fit(st);
    var key = st.cols + '|' + st.ta.value;
    if (key !== st.last) {
      st.last = key;
      var rows = layout(st), cols = st.cols, html = [], map = {};
      st.cells.forEach(function (x) { map[x.r * cols + x.c] = x; });
      for (var r = 0; r < rows; r++) {
        html.push('<div class="wg-row">');
        for (var c = 0; c < cols; c++) {
          var x = map[r * cols + c];
          html.push('<span class="wg-c"' + (x ? ' data-i="' + x.i + '"' : '') + '>' + (x && x.ch !== ' ' ? esc(x.ch) : '') + '</span>');
        }
        html.push('</div>');
      }
      st.grid.innerHTML = html.join('');
      st.rows = rows;
    }
    paintSel(st);
  }
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  // 커서(깜박이는 세로 막대)와 고른 칸
  function paintSel(st) {
    var ta = st.ta, on = document.activeElement === ta;
    var a = ta.selectionStart, b = ta.selectionEnd;
    st.wrap.classList.toggle('is-focus', on);
    Array.prototype.forEach.call(st.grid.querySelectorAll('.wg-c.is-sel'), function (el) { el.classList.remove('is-sel'); });
    if (on && a !== b) {
      Array.prototype.forEach.call(st.grid.querySelectorAll('.wg-c[data-i]'), function (el) { var i = +el.getAttribute('data-i'); if (i >= a && i < b) el.classList.add('is-sel'); });
    }
    var p = st.pos[ta.selectionDirection === 'backward' ? a : b] || { r: 0, c: 0 };
    var row = st.grid.children[p.r];
    if (!on || a !== b || !row) { st.caret.style.display = 'none'; return; }
    var cell = row.children[Math.min(p.c, st.cols - 1)];
    st.caret.style.display = 'block';
    st.caret.style.left = (cell.offsetLeft + row.offsetLeft + 4) + 'px';
    st.caret.style.top = (row.offsetTop + cell.offsetTop + Math.round(cell.offsetHeight * 0.18)) + 'px';
    st.caret.style.height = Math.round(cell.offsetHeight * 0.64) + 'px';
    st.caret.classList.remove('blink'); void st.caret.offsetWidth; st.caret.classList.add('blink');
  }

  // 화면의 점 → 글자 자리(그 줄에서 누른 칸보다 앞이거나 같은 마지막 자리)
  function indexFromCell(st, r, c) {
    var pos = st.pos, best = -1;
    for (var i = 0; i < pos.length; i++) {
      var p = pos[i]; if (!p) continue;
      if (p.r === r && p.c <= c) best = i;
      else if (p.r > r) break;
    }
    if (best < 0) {   // 그 줄에 글이 없음 — 위쪽 줄이면 그 줄 끝, 글보다 아래면 맨 끝
      var lastR = pos[pos.length - 1].r;
      if (r > lastR) return pos.length - 1;
      for (var j = 0; j < pos.length; j++) if (pos[j] && pos[j].r > r) return Math.max(0, j - 1);
      return pos.length - 1;
    }
    return best;
  }
  function indexAt(st, x, y) {
    var g = st.grid.getBoundingClientRect(), rows = st.grid.children;
    if (!rows.length) return 0;
    var rh = g.height / rows.length, cw = g.width / st.cols;
    var r = Math.max(0, Math.min(rows.length - 1, Math.floor((y - g.top) / rh)));
    var c = Math.max(0, Math.min(st.cols, Math.floor((x - g.left) / cw + 0.5)));   // 칸의 오른쪽 반을 누르면 그 글자 뒤
    return indexFromCell(st, r, c);
  }

  // ↑↓ · Home/End 는 원고지 줄 기준(투명 textarea 의 줄과 다르므로)
  function keys(st, e) {
    if (e.isComposing || e.keyCode === 229) return;
    var k = e.key; if (k !== 'ArrowUp' && k !== 'ArrowDown' && k !== 'Home' && k !== 'End') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var ta = st.ta, back = ta.selectionDirection === 'backward';
    var anchor = e.shiftKey ? (back ? ta.selectionEnd : ta.selectionStart) : null;
    var from = e.shiftKey ? (back ? ta.selectionStart : ta.selectionEnd) : (k === 'ArrowUp' || k === 'Home' ? ta.selectionStart : ta.selectionEnd);
    var p = st.pos[from] || { r: 0, c: 0 }, to;
    if (k === 'ArrowUp') to = p.r === 0 ? 0 : indexFromCell(st, p.r - 1, p.c);
    else if (k === 'ArrowDown') { var lastR = st.pos[st.pos.length - 1].r; to = p.r >= lastR ? ta.value.length : indexFromCell(st, p.r + 1, p.c); }
    else if (k === 'Home') to = indexFromCell(st, p.r, 0);
    else to = indexFromCell(st, p.r, st.cols);
    e.preventDefault();
    if (anchor === null) ta.setSelectionRange(to, to); else setSel(st, anchor, to);
    paintSel(st);
  }

  function refresh() { boxes.forEach(function (st) { st.last = null; render(st); }); }
  window.MSI_WONGOJI = { refresh: refresh };

  Array.prototype.forEach.call(document.querySelectorAll('textarea.wongoji'), make);
  var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(function () { boxes.forEach(function (st) { if (fit(st)) render(st); }); }, 80); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  window.addEventListener('load', refresh);
})();
