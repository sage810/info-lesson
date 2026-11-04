/* 수행평가(시험지) 공용 동작 — 고르기 · 순서 · 그래프 칸 · 논술 칸 · 답 보관 · 붙여넣기 막기 · 나가기 경고 · 채점용 기록 · PDF 저장.
   채점·맞음 표시는 하지 않는다. 이 스크립트에는 답이 들어 있지 않다.
   규칙·구조 약속: docs/rules/exam.md §3. 쓰는 시험지: data-analysis/09 · ai/exam-a · ai/exam-b (2026-11-04 09 안의 코드를 옮겨 옴)

   시험지는 이 파일 앞의 작은 script 에 설정을 둔다(이 주석에 script 닫는 태그를 쓰면 페이지에 넣을 때 스크립트가 끊긴다):
     window.MSI_EXAM = { lesson: 'ai/exam-a', key: 'msi-exam:ai/exam-a', fileTitle: '인공지능 수행평가 A형' };
     그다음 줄에 data-msi-src="shared/partials/exam.js" 표식
     lesson    채점 기록의 차시 이름(시트 "차시" 칸)
     key       이 컴퓨터에 답을 보관하는 localStorage 열쇠
     fileTitle PDF 파일 이름 끝(「학년반번호 이름 <fileTitle>.pdf」)
     keepMin   보관 시간(분, 기본 45)
     pdfFont   PDF 글 상자 글꼴(기본 Maplestory)

   칸 종류(kind) — 채점하는 칸마다 data-unit 하나
     one   [data-unit] 안 button[data-group][data-v]          set  위 + 버튼에 data-multi
     order .order[data-unit] 안 .os 칸 + 옆 .ord-tray 의 .oc  text textarea.blank[data-unit][aria-label]
     graph .pz[data-unit]                                       essay [data-essay][data-unit][aria-label] 안 textarea.blank 하나 이상
     essay 칸이 여럿이면 각 textarea 의 data-part 를 붙여 「[part] 글」 줄로 모은다. 선생님이 직접 채점(graph 처럼). */
(function () {
  'use strict';
  var CFG = window.MSI_EXAM || {};
  var KEY = CFG.key || 'msi-exam:' + (CFG.lesson || location.pathname);
  var KEEP_MS = (CFG.keepMin || 45) * 60 * 1000;   // 첫 입력부터 45분이 지나면 보관한 답을 지운다 — 공용 PC 의 다음 반 학생에게 앞 학생 답이 안 보이게(2026-10-03)
  var startedAt = 0;              // 이 답을 처음 입력한 시각(보관 데이터의 t)
  var root = document.getElementById('sheetPrintArea');
  var $ = function (sel, el) { return (el || root).querySelector(sel); };
  var $$ = function (sel, el) { return Array.prototype.slice.call((el || root).querySelectorAll(sel)); };
  var EMPTY_PZ = '<span>이 칸을 클릭한 뒤 <b>Ctrl + V</b>로 캡처한 그래프를 붙여넣어요<br><small>그림 파일을 끌어다 놓거나 아래 ‘파일로 넣기’를 눌러도 돼요</small></span>';
  var restoring = false, savedSinceChange = false, warnedBig = false;

  var toastEl = document.getElementById('toast'), toastT;
  function toast(msg) { if (!toastEl) return; toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 2200); }

  // ── 고르기 ──
  function setOn(b, on) { b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); }
  function pick(b) {
    var g = b.getAttribute('data-group');
    if (b.hasAttribute('data-multi')) setOn(b, !b.classList.contains('is-on'));
    else $$('[data-group="' + g + '"]').forEach(function (x) { setOn(x, x === b); });
    changed();
  }

  // ── 순서 — (a)~(d)를 차례로 누르면 앞 칸부터. 이름표 줄(.ord-tray)은 순서 칸(.order)과 같은 부모 안 ──
  var slots = $$('.os');   // 모든 순서 칸(문서 순서) — 보관 형식 o 와 같은 순서
  function orderOf(el) { var p = el.closest('.ord-tray'); p = p ? p.parentNode : el.parentNode; return p.querySelector('.order'); }
  function traysOf(order) { return $$('.oc', order.parentNode); }
  function slotSet(s, v) {
    s.setAttribute('data-v', v || '');
    s.textContent = v ? '(' + v + ')' : '';
    s.classList.toggle('is-filled', !!v);
    var order = s.closest('.order'), own = $$('.os', order);
    traysOf(order).forEach(function (c) { c.disabled = own.some(function (x) { return x.getAttribute('data-v') === c.getAttribute('data-v'); }); });
  }
  function orderPut(order, v) { var s = $$('.os', order).filter(function (x) { return !x.getAttribute('data-v'); })[0]; if (s) { slotSet(s, v); changed(); } }

  root.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target : e.target.parentElement;
    var b = t.closest('[data-group]'); if (b) { pick(b); return; }
    var oc = t.closest('.oc'); if (oc) { if (!oc.disabled) orderPut(orderOf(oc), oc.getAttribute('data-v')); return; }
    var os = t.closest('.os'); if (os) { if (os.getAttribute('data-v')) { slotSet(os, ''); changed(); } return; }
    var rs = t.closest('[data-order-reset]'); if (rs) { $$('.os', orderOf(rs)).forEach(function (s) { slotSet(s, ''); }); changed(); return; }
    var f = t.closest('[data-pz-file]'); if (f) { $('[data-pz-input="' + f.getAttribute('data-pz-file') + '"]').click(); return; }
    var c = t.closest('[data-pz-clear]'); if (c) { pzClear(document.getElementById(c.getAttribute('data-pz-clear'))); changed(); return; }
  });

  // ── 그래프 칸 ──
  var zones = $$('.pz');
  function pzClear(z) { z.innerHTML = EMPTY_PZ; z.classList.remove('is-filled'); z._img = null; z._keep = null; }
  function shrink(url, cb, max) {      // 작은 사본(JPEG) — 보관용 가로 1600 이하(브라우저 보관 용량), 제출용은 900
    var im = new Image();
    im.onload = function () {
      try {
        var s = Math.min(1, (max || 1600) / (im.naturalWidth || 1)), cv = document.createElement('canvas');
        cv.width = Math.max(1, Math.round(im.naturalWidth * s)); cv.height = Math.max(1, Math.round(im.naturalHeight * s));
        var x = cv.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, cv.width, cv.height); x.drawImage(im, 0, 0, cv.width, cv.height);
        cb(cv.toDataURL('image/jpeg', 0.85));
      } catch (err) { cb(null); }
    };
    im.onerror = function () { cb(null); };
    im.src = url;
  }
  function pzFill(z, url, keep) {
    z.innerHTML = '';
    var im = document.createElement('img'); im.alt = '붙여넣은 그래프'; im.src = url; z.appendChild(im);
    z.classList.add('is-filled'); z.classList.remove('is-over'); z._img = url; z._keep = keep || null;
    if (!keep) shrink(url, function (k) { if (z._img === url) { z._keep = k; store(); } });
  }
  function readFile(file, z) {
    if (!file || !/^image\//.test(file.type)) { toast('그림 파일만 넣을 수 있어요.'); return; }
    var r = new FileReader(); r.onload = function () { pzFill(z, r.result); changed(); }; r.readAsDataURL(file);
  }
  zones.forEach(function (z) {
    pzClear(z);
    z.addEventListener('click', function () { z.focus(); });
    z.addEventListener('keydown', function (e) { if ((e.key === 'Delete' || e.key === 'Backspace') && z._img) { e.preventDefault(); pzClear(z); changed(); } });
    z.addEventListener('dragover', function (e) { e.preventDefault(); z.classList.add('is-over'); });
    z.addEventListener('dragleave', function () { z.classList.remove('is-over'); });
    z.addEventListener('drop', function (e) { e.preventDefault(); z.classList.remove('is-over'); var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; readFile(f, z); });
  });
  $$('[data-pz-input]').forEach(function (inp) {
    inp.addEventListener('change', function () { readFile(inp.files && inp.files[0], document.getElementById(inp.getAttribute('data-pz-input'))); inp.value = ''; });
  });

  // ── 논술 칸 글자 수 — 칸 아래 「N자」(공백 포함). 막지 않고 보여 주기만(선생님 결정 2026-11-04) ──
  var essayBoxes = $$('[data-essay] textarea.blank');
  essayBoxes.forEach(function (t) {
    var c = document.createElement('span'); c.className = 'cnt no-pdf'; c.setAttribute('aria-hidden', 'true');
    var at = t.closest('.wg') || t;   // 원고지 칸(shared/partials/wongoji.js)이면 원고지 아래에
    at.parentNode.insertBefore(c, at.nextSibling); t._cnt = c;
  });
  function countAll() { essayBoxes.forEach(function (t) { t._cnt.textContent = t.value.trim().length + '자'; }); }

  // ── 붙여넣기: 답 글자 칸은 막고, 그래프 칸은 그림만 ──
  function isAnswerField(el) { return !!(el && el.closest && el.closest('.q') && el.matches && el.matches('textarea.blank')); }
  document.addEventListener('paste', function (e) {
    var t = e.target && e.target.nodeType === 1 ? e.target : document.activeElement;
    if (isAnswerField(t)) { e.preventDefault(); toast('답 칸에는 붙여넣기를 할 수 없어요. 직접 입력해 주세요.'); return; }
    var z = t && t.closest ? t.closest('.pz') : null;
    if (!z) return;
    e.preventDefault();
    var items = (e.clipboardData && e.clipboardData.items) || [];
    for (var i = 0; i < items.length; i++) if (items[i].type.indexOf('image/') === 0) { readFile(items[i].getAsFile(), z); return; }
    toast('그래프 칸에는 캡처한 그림만 붙여넣을 수 있어요.');
  }, true);
  document.addEventListener('beforeinput', function (e) {
    if (/^insertFrom(Paste|Drop|PasteAsQuotation)$/.test(e.inputType || '') && isAnswerField(e.target)) { e.preventDefault(); toast('답 칸에는 붙여넣기를 할 수 없어요. 직접 입력해 주세요.'); }
  }, true);
  document.addEventListener('drop', function (e) { if (isAnswerField(e.target)) { e.preventDefault(); toast('답 칸에는 끌어다 놓을 수 없어요. 직접 입력해 주세요.'); } }, true);

  // ── 칸 종류와 답 ──
  var units = $$('[data-unit]');
  function unitKind(u) {
    if (u.matches('textarea')) return 'text';
    if (u.hasAttribute('data-essay')) return 'essay';
    if (u.classList.contains('order')) return 'order';
    if (u.classList.contains('pz')) return 'graph';
    return u.querySelector('[data-multi]') ? 'set' : 'one';
  }
  // 답한 문항 세기(맞았는지는 세지 않음) — 논술 칸이 여럿이면 모두 써야 답한 것
  function answered(u) {
    var k = unitKind(u);
    if (k === 'text') return !!u.value.trim();
    if (k === 'essay') { var ts = $$('textarea.blank', u); return ts.length > 0 && ts.every(function (t) { return !!t.value.trim(); }); }
    if (k === 'order') return $$('.os', u).every(function (s) { return !!s.getAttribute('data-v'); });
    if (k === 'graph') return !!u._img;
    return !!u.querySelector('.is-on');
  }
  function anything() { return units.some(function (u) {
    if (unitKind(u) === 'essay') return $$('textarea.blank', u).some(function (t) { return !!t.value.trim(); });
    if (unitKind(u) === 'order') return $$('.os', u).some(function (s) { return !!s.getAttribute('data-v'); });
    return answered(u);
  }); }

  // ── 이 컴퓨터에 답 보관(localStorage) ──
  function collect(withImages) {
    var d = { v: 1, t: startedAt, f: {}, p: {}, o: slots.map(function (s) { return s.getAttribute('data-v') || ''; }), z: {} };
    $$('textarea.blank[aria-label]').forEach(function (t) { if (t.value) d.f[t.getAttribute('aria-label')] = t.value; });
    $$('[data-group].is-on').forEach(function (b) { var g = b.getAttribute('data-group'); (d.p[g] = d.p[g] || []).push(b.getAttribute('data-v')); });
    if (withImages) zones.forEach(function (z) { if (z._keep || z._img) d.z[z.id] = z._keep || z._img; });
    return d;
  }
  function store() {
    if (restoring) return;
    if (!startedAt) startedAt = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(collect(true))); }
    catch (e) {
      try { localStorage.setItem(KEY, JSON.stringify(collect(false))); } catch (e2) { return; }
      if (!warnedBig) { warnedBig = true; toast('그래프는 용량이 커서 자동 보관하지 못했어요. 저장하기 전에 창을 닫지 마세요.'); }
    }
  }
  function forget() { startedAt = 0; try { localStorage.removeItem(KEY); } catch (e) {} }
  function restore() {
    var d = null;
    try { d = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { d = null; }
    if (!d || d.v !== 1) return false;
    if (!d.t || Date.now() - d.t > KEEP_MS) { forget(); return false; }   // 45분 지난 답(또는 시각 없는 옛 형식)은 지우고 빈 시험지로
    startedAt = d.t;
    restoring = true;
    $$('textarea.blank[aria-label]').forEach(function (t) { var v = d.f && d.f[t.getAttribute('aria-label')]; if (v != null) t.value = v; });
    Object.keys(d.p || {}).forEach(function (g) { (d.p[g] || []).forEach(function (v) { var b = $('[data-group="' + g + '"][data-v="' + String(v).replace(/"/g, '') + '"]'); if (b) setOn(b, true); }); });
    (d.o || []).forEach(function (v, i) { if (slots[i] && v) slotSet(slots[i], v); });
    Object.keys(d.z || {}).forEach(function (id) { var z = document.getElementById(id); if (z && d.z[id]) pzFill(z, d.z[id], d.z[id]); });
    restoring = false;
    return anything();
  }
  function changed() { savedSinceChange = false; store(); }
  root.addEventListener('input', function (e) { if (e.target.matches && e.target.matches('textarea.blank')) { changed(); if (e.target._cnt) e.target._cnt.textContent = e.target.value.trim().length + '자'; } });

  // ── 안내 버튼(왼쪽 카드) → NOTICE 카드를 보이고 그리로 옮겨 가 그 안내만 펼침(평소엔 카드 숨김) ──
  //    닫으면 열기 전 스크롤 위치와 누른 버튼으로 돌아간다(시험 도중 위로 올라갔다 다시 내려가지 않게). 카드가 없는 시험지는 건너뜀.
  var guideCard = document.querySelector('.guide-card'), notice = $('.notice');
  if (guideCard && notice) {
    var guideBtns = Array.prototype.slice.call(guideCard.querySelectorAll('[data-guide]'));
    var guideBack = null;   // { y: 열기 전 스크롤, btn: 누른 버튼 }
    var guideOpen = function (id, btn) {
      if (id && !guideBack) guideBack = { y: window.scrollY, btn: btn };
      guideBtns.forEach(function (g) {
        var on = g.getAttribute('data-guide') === id;
        document.getElementById(g.getAttribute('data-guide')).hidden = !on; g.setAttribute('aria-expanded', on ? 'true' : 'false');
      });
      notice.hidden = !id;
      if (!id) {
        if (guideBack) { window.scrollTo(0, guideBack.y); if (guideBack.btn) guideBack.btn.focus({ preventScroll: true }); guideBack = null; }
        return;
      }
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      notice.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      document.getElementById(id).focus({ preventScroll: true });
    };
    guideCard.addEventListener('click', function (e) {
      var g = e.target.closest('[data-guide]');
      if (g) guideOpen(g.getAttribute('aria-expanded') === 'true' ? '' : g.getAttribute('data-guide'), g);
    });
    notice.addEventListener('click', function (e) { if (e.target.closest('[data-guide-close]')) guideOpen(''); });
  }

  // 나가기 전 경고 — 답이 있고, 마지막으로 바꾼 뒤 PDF 로 저장하지 않았으면
  var sending = false;   // 선생님께 보내는 중
  window.addEventListener('beforeunload', function (e) { if ((anything() && !savedSinceChange) || sending) { e.preventDefault(); e.returnValue = ''; } });

  // ── 채점용 답 기록 — 자동 제출(msi-hook, A)과 PDF 속 숨은 데이터(B)가 같은 기록을 쓴다(exam.md §4) ──
  //    칸마다 data-unit 이름으로 답 하나: 고르기는 data-v(여러 개는 쉼표), 순서는 a,b,c,d, 글자는 그대로, 그래프는 넣었으면 '그래프',
  //    논술은 글 그대로(칸이 여럿이면 「[part] 글」 줄)
  function unitValue(u) {
    var k = unitKind(u);
    if (k === 'text') return u.value.trim();
    if (k === 'graph') return u._img ? '그래프' : '';
    if (k === 'essay') {
      var ts = $$('textarea.blank', u);
      if (ts.length === 1) return ts[0].value.trim();
      if (!ts.some(function (t) { return !!t.value.trim(); })) return '';
      return ts.map(function (t) { return '[' + (t.getAttribute('data-part') || t.getAttribute('aria-label')) + '] ' + t.value.trim(); }).join('\n');
    }
    if (k === 'order') { var o = $$('.os', u).map(function (x) { return x.getAttribute('data-v') || ''; }); return o.some(Boolean) ? o.join(',') : ''; }
    return $$('[data-group].is-on', u).map(function (b) { return b.getAttribute('data-v'); }).join(',');
  }
  var info = function (label) { var t = $('textarea[aria-label="' + label + '"]'); return t ? t.value.trim() : ''; };
  function record() {
    var a = {};
    units.forEach(function (u) { a[u.getAttribute('data-unit')] = unitValue(u); });
    return { v: 1, lesson: CFG.lesson || '', savedAt: new Date().toISOString(),
      student: { grade: info('학년'), cls: info('반'), no: info('번호'), name: info('이름') }, answers: a };
  }
  function submitOn() { return !!(window.MSI_CONFIG && window.MSI_CONFIG.submit); }   // 설정은 이 스크립트 뒤에 붙으므로 그때그때 본다
  window.MSI_SUBMIT = {
    lastRecord: null,   // PDF 에 넣은 기록 — 보내는 기록과 저장 시각까지 같게
    collect: function () {
      var rec = this.lastRecord || record();
      return Promise.all(zones.map(function (z) { return z._img ? new Promise(function (r) { shrink(z._img, r, 900); }) : null; }))
        .then(function (list) { var g = {}; zones.forEach(function (z, i) { if (list[i]) g[z.getAttribute('data-unit')] = list[i]; }); return { record: rec, graphs: g }; });
    },
    onResult: function (state, retry) {
      var st = document.getElementById('submitStatus');
      sending = state === 'sending';
      st.textContent = '';
      st.className = 'save-status' + (state === 'ok' ? ' ok' : state === 'fail' ? ' fail' : '');
      if (state === 'sending') st.textContent = '⏳ 선생님께 보내는 중이에요… 창을 닫지 마세요.';
      else if (state === 'ok') st.textContent = '✔ 선생님께 제출됐어요.';
      else {
        st.appendChild(document.createTextNode('선생님께 보내지 못했어요.'));
        var b = document.createElement('button'); b.type = 'button'; b.className = 'link-btn'; b.textContent = '다시 보내기';
        b.addEventListener('click', function () { if (retry) retry(); });
        st.appendChild(b);
        st.appendChild(document.createTextNode('그래도 안 되면 저장된 PDF 파일을 USB로 선생님께 내 주세요.'));
      }
    },
    describe: function () {   // 정답 표 만들 때(npm run exam-key)만 쓴다
      return units.map(function (u) { return { unit: u.getAttribute('data-unit'), kind: unitKind(u), label: u.getAttribute('aria-label') || '' }; });
    }
  };

  // ── PDF 저장 ──
  function unitLabel(u) { var k = u.getAttribute('data-unit'); return /^\d+$/.test(k) ? k + '번' : k + (u.classList.contains('pz') ? ' 그래프' : ''); }
  document.getElementById('pdfBtn').addEventListener('click', function () {
    var name = info('이름');
    if (!name) { window.alert('이름을 적어 주세요.'); $('textarea[aria-label="이름"]').focus(); return; }
    var missInfo = ['학년', '반', '번호'].filter(function (k) { return !info(k); });
    var left = units.filter(function (u) { return !answered(u); });
    if ((left.length || missInfo.length) && !window.__MSI_ANSWER_SHEET) {
      var msg = [];
      if (missInfo.length) msg.push(missInfo.join('·') + ' 칸이 비어 있어요.');
      if (left.length) msg.push('아직 답하지 않은 문항이 ' + left.length + '개 있어요.\n(' + left.map(unitLabel).join(', ') + ')');
      if (!window.confirm(msg.join('\n') + '\n\n그래도 PDF로 저장할까요?')) {
        var first = missInfo.length ? $('textarea[aria-label="' + missInfo[0] + '"]') : left[0];
        if (first && unitKind(first) === 'essay') first = $$('textarea.blank', first).filter(function (t) { return !t.value.trim(); })[0] || first;
        if (first) { first.scrollIntoView({ block: 'center' }); if (first.focus) first.focus(); }
        return;
      }
    }
    var dig = function (v) { return String(v || '').replace(/[^0-9]/g, ''); };
    var pad2 = function (v) { var d = dig(v); return d ? ('0' + d).slice(-Math.max(2, d.length)) : ''; };
    var code = dig(info('학년')) + pad2(info('반')) + pad2(info('번호'));
    var fname = ((code ? code + ' ' : '') + name + ' ' + (CFG.fileTitle || '수행평가')).trim();
    makePdf(fname + '.pdf');
  });

  function finished(fname, how) {
    forget(); savedSinceChange = true;
    var st = document.getElementById('saveStatus');
    st.className = 'save-status ok';
    st.textContent = how === 'print'
      ? '인쇄 창에서 ‘PDF로 저장’을 골라 저장해요. 파일 이름: ' + fname + ' · 이 컴퓨터에 보관한 답은 지웠어요.'
      : '✔ ‘' + fname + '’ 파일로 저장했어요.' + (submitOn() ? '' : ' 이 파일을 제출하세요.') + ' (이 컴퓨터에 보관한 답은 지웠어요)';
  }

  function makePdf(fname) {
    var H2C = window.html2canvas, JSPDF = window.jspdf && window.jspdf.jsPDF;
    if (typeof H2C !== 'function' || typeof JSPDF !== 'function') {
      var prev = document.title; document.title = fname.replace(/\.pdf$/i, '');
      setTimeout(function () { window.print(); document.title = prev; finished(fname, 'print'); }, 60);
      return;
    }
    var btn = document.getElementById('pdfBtn'), label = btn.textContent;
    btn.textContent = '⏳ PDF 만드는 중…'; btn.setAttribute('aria-busy', 'true');

    var holder = document.createElement('div');
    holder.setAttribute('style', 'position:fixed;left:-10000px;top:0;width:820px;padding:24px;background:#ffffff;z-index:-1;');
    var clone = root.cloneNode(true);
    $$('.no-pdf', clone).forEach(function (el) { el.parentNode.removeChild(el); });
    // 글자 칸 → 글 상자(html2canvas 는 textarea 의 여러 줄을 못 그림). 모양은 화면 칸의 계산 스타일 그대로
    var live = $$('textarea.blank'), copies = $$('textarea.blank', clone), boxes = [];
    copies.forEach(function (ta, i) {
      if (ta.closest('.wg')) { ta.parentNode.removeChild(ta); return; }   // 원고지 칸은 그려 둔 칸(.wg-grid)을 그대로 찍는다
      var src = live[i], cs = src ? getComputedStyle(src) : null;
      var box = document.createElement('div');
      box.textContent = src ? src.value : '';
      box.setAttribute('style', 'display:block;width:100%;min-height:40px;box-sizing:border-box;white-space:pre-wrap;overflow-wrap:break-word;word-break:break-word;'
        + (cs ? 'padding:' + cs.padding + ';border:' + cs.borderTopWidth + ' solid ' + cs.borderTopColor + ';border-radius:' + cs.borderTopLeftRadius + ';color:' + cs.color
          + ';font-size:' + cs.fontSize + ';line-height:' + cs.lineHeight + ';' : 'padding:8px 11px;border:2px solid #4b3b6b;border-radius:9px;color:#4b3b6b;font-size:15px;line-height:1.6;')
        + 'background:#fff;font-family:' + (CFG.pdfFont || "'Maplestory'") + ",'Apple SD Gothic Neo','Malgun Gothic',sans-serif;");
      ta.parentNode.replaceChild(box, ta); boxes.push(box);
    });
    $$('.pz', clone).forEach(function (z) { if (!z.querySelector('img')) z.innerHTML = '<span>(붙여넣은 그래프 없음)</span>'; z.style.minHeight = '70px'; });
    $$('[id]', clone).forEach(function (el) { el.removeAttribute('id'); });
    clone.removeAttribute('id');
    clone.classList.add('msi-pdf-clone');
    holder.appendChild(clone); document.body.appendChild(holder);
    boxes.forEach(function (b) { b.style.height = 'auto'; var h = b.scrollHeight; if (h > 0) b.style.height = (h + 4) + 'px'; });

    // 쪽 나눔은 문항·카드 사이에서 — 한 문항이 두 쪽으로 잘리지 않게.
    // 한 쪽보다 긴 논술 답은 글 줄 사이에서도 나눌 수 있게 줄 경계를 후보로 더한다(글자가 반으로 잘리지 않게, 2026-11-04)
    var top0 = clone.getBoundingClientRect().top;
    var cuts = $$('.q, .subq, .card, .part-head, .row-cut, .wg-row', clone).map(function (el) { return el.getBoundingClientRect().top - top0; });
    boxes.forEach(function (b) {
      var cs = getComputedStyle(b), lh = parseFloat(cs.lineHeight), r = b.getBoundingClientRect();
      if (!(lh > 0) || r.height < lh * 3) return;
      var y0 = r.top - top0 + parseFloat(cs.borderTopWidth) + parseFloat(cs.paddingTop);
      for (var y = y0 + lh; y < r.bottom - top0 - lh / 2; y += lh) cuts.push(y);
    });

    var done = function () { if (holder.parentNode) holder.parentNode.removeChild(holder); btn.textContent = label; btn.removeAttribute('aria-busy'); };
    var fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.race([fonts, new Promise(function (r) { setTimeout(r, 1500); })])
      .then(function () { return new Promise(function (r) { setTimeout(r, 80); }); })
      .then(function () { return H2C(clone, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false }); })
      .then(function (canvas) {
        var pdf = new JSPDF('p', 'pt', 'a4');
        var pw = pdf.internal.pageSize.getWidth(), ph = pdf.internal.pageSize.getHeight();
        var k = canvas.width / clone.offsetWidth;
        var breaks = cuts.map(function (y) { return Math.round(y * k); }).filter(function (y) { return y > 0; }).sort(function (a, b) { return a - b; });
        var pageH = Math.floor(canvas.width * ph / pw), y = 0, page = 0;
        while (y < canvas.height - 1) {
          var end = Math.min(y + pageH, canvas.height);
          if (end < canvas.height) {
            var ok = breaks.filter(function (b) { return b > y + pageH * 0.35 && b <= end; });
            if (ok.length) end = ok[ok.length - 1];
          }
          var part = document.createElement('canvas'); part.width = canvas.width; part.height = end - y;
          var ctx = part.getContext('2d'); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, part.width, part.height);
          ctx.drawImage(canvas, 0, y, canvas.width, end - y, 0, 0, canvas.width, end - y);
          if (page > 0) pdf.addPage();
          pdf.addImage(part.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, pw, (end - y) * pw / canvas.width);
          y = end; page++;
        }
        var rec = record();
        window.MSI_SUBMIT.lastRecord = rec;
        try { pdf.setProperties({ subject: 'msi-answers', keywords: 'msi-answers:v1:' + btoa(unescape(encodeURIComponent(JSON.stringify(rec)))) }); } catch (e) { /* 못 넣어도 PDF 는 저장 */ }
        pdf.save(fname);
        finished(fname, 'pdf');
      })
      .catch(function (err) { console.error('[savePdf]', err); window.alert('PDF를 만드는 중 문제가 생겼어요. 잠시 후 다시 눌러 주세요.'); })
      .then(done, done);
  }

  // 시작 — 보관된 답이 있으면 불러온다
  if (restore()) toast('이 컴퓨터에 보관된 답을 불러왔어요.');
  if (window.MSI_WONGOJI) window.MSI_WONGOJI.refresh();   // 불러온 답을 원고지 칸에 다시 그림
  countAll();
})();
