
(function () {
  'use strict';

  var STEP_TEXT = {
    step1: '문제 정하기',
    step2: '데이터 수집·특성 파악',
    step3: '데이터 분석하기',
    step4: '결과 해석·공유'
  };
  var SLOT_BASE_LABEL = {
    seqSlotPrev1: '순서 1번 자리 (가장 먼저 하는 단계)',
    seqSlotPrev2: '순서 2번 자리',
    seqSlotPrev3: '순서 3번 자리',
    seqSlotPrev4: '순서 4번 자리 (가장 마지막 단계)'
  };
  var SLOT_NUM = { seqSlotPrev1: '①', seqSlotPrev2: '②', seqSlotPrev3: '③', seqSlotPrev4: '④' };
  var ANSWER = ['step1', 'step2', 'step3', 'step4']; // 유일 정답 순서 (spec §3)
  var FEEDBACK = {
    allCorrect: '정확해요! 데이터로 문제를 해결할 때는 ① 문제 정하기 → ② 데이터 수집·특성 파악 → ③ 데이터 분석하기 → ④ 결과 해석·공유 순서로 나아가요. 오늘은 이 흐름을 따라 활동해요.',
    partial: "거의 왔어요! 4칸 중 {n}칸이 제자리예요. '무엇을 알아볼지(문제)'를 먼저 정하고, 그 다음에 데이터를 모아요. 분석은 데이터를 모은 뒤에, 해석·공유는 맨 마지막이에요. 초록색이 아닌 칸을 다시 옮겨 봐요.",
    none: "순서를 다시 생각해 봐요. 가장 먼저 할 일은 '어떤 문제를 풀지 정하는 것'이고, 결과 해석·공유는 가장 마지막이에요.",
    incomplete: "빈 칸이 있어요. 4칸을 모두 채운 뒤 '순서 확인'을 눌러요."
  };

  var selected = null;  // 터치/키보드로 선택된 칩
  var dragChip = null;  // 마우스 드래그 중인 칩

  function inSeq(e, sel) { return (e.target && e.target.closest) ? e.target.closest(sel) : null; }
  function trayOf(act) { return act.querySelector('#seqTrayPrev'); }
  function slotsOf(act) { return Array.prototype.slice.call(act.querySelectorAll('.seq-slot')); }
  function chipsOf(act) { return Array.prototype.slice.call(act.querySelectorAll('.seq-chip')); }
  function resultOf(act) { return act.querySelector('#seqResultPrev'); }

  function clearSelection() {
    if (selected) { selected.classList.remove('is-on'); selected.setAttribute('aria-pressed', 'false'); }
    selected = null;
  }

  function refreshTrayEmpty(act) {
    var tray = trayOf(act);
    if (tray) tray.classList.toggle('is-empty', !tray.querySelector('.seq-chip'));
  }

  function clearGrading(act) {
    slotsOf(act).forEach(function (slot) {
      slot.classList.remove('is-correct', 'is-wrong');
      var m = slot.querySelector('.seq-mark');
      if (m) m.parentNode.removeChild(m);
    });
    var r = resultOf(act);
    if (r) r.textContent = '';
  }

  function slotAria(slot) {
    var id = slot.getAttribute('data-slot');
    var chip = slot.querySelector('.seq-chip');
    slot.setAttribute('aria-label', chip
      ? SLOT_NUM[id] + ' 자리: ' + STEP_TEXT[chip.getAttribute('data-answer-key')]
      : SLOT_BASE_LABEL[id]);
  }

  function placeChip(act, slot, chip) {
    clearGrading(act);
    var from = chip.parentElement;
    var current = slot.querySelector('.seq-chip');
    if (current && current !== chip) {
      if (from && from.classList.contains('seq-slot')) {
        from.appendChild(current);            // 두 슬롯 간 스왑
        from.classList.add('is-filled');
        slotAria(from);
      } else {
        trayOf(act).appendChild(current);     // 트레이에서 온 칩 → 기존 칩은 트레이로
      }
    }
    slot.appendChild(chip);
    slot.classList.add('is-filled');
    slotAria(slot);
    if (from && from.classList.contains('seq-slot') && from !== slot && !from.querySelector('.seq-chip')) {
      from.classList.remove('is-filled');
      slotAria(from);
    }
    refreshTrayEmpty(act);
  }

  function returnChip(act, chip) {
    clearGrading(act);
    var from = chip.parentElement;
    trayOf(act).appendChild(chip);
    if (from && from.classList.contains('seq-slot') && !from.querySelector('.seq-chip')) {
      from.classList.remove('is-filled');
      slotAria(from);
    }
    refreshTrayEmpty(act);
  }

  function fisherYates(src) {
    var a = src.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function shuffledOrder() {
    var o;
    do { o = fisherYates(ANSWER); } while (o.join(',') === ANSWER.join(','));
    return o;
  }

  function reshuffle(act) {
    clearSelection();
    clearGrading(act);
    slotsOf(act).forEach(function (slot) {
      slot.classList.remove('is-filled', 'is-over');
      slotAria(slot);
    });
    var tray = trayOf(act);
    var byKey = {};
    chipsOf(act).forEach(function (c) { byKey[c.getAttribute('data-answer-key')] = c; });
    shuffledOrder().forEach(function (key) {
      var c = byKey[key];
      c.classList.remove('is-on', 'is-dragging');
      c.setAttribute('aria-pressed', 'false');
      tray.appendChild(c);
    });
    refreshTrayEmpty(act);
  }

  function grade(act) {
    var slots = slotsOf(act);
    var res = resultOf(act);
    var filled = slots.filter(function (s) { return s.querySelector('.seq-chip'); });
    if (filled.length < 4) {
      clearGrading(act);
      res.textContent = FEEDBACK.incomplete;
      return;
    }
    var n = 0;
    slots.forEach(function (slot) {
      var chip = slot.querySelector('.seq-chip');
      var ok = slot.getAttribute('data-answer') === chip.getAttribute('data-answer-key');
      slot.classList.remove('is-correct', 'is-wrong');
      var old = slot.querySelector('.seq-mark');
      if (old) old.parentNode.removeChild(old);
      var mark = document.createElement('span');
      mark.className = 'seq-mark';
      mark.setAttribute('aria-hidden', 'true');
      if (ok) { slot.classList.add('is-correct'); mark.textContent = '✓'; n++; }
      else { slot.classList.add('is-wrong'); mark.textContent = '✗'; }
      slot.insertBefore(mark, slot.firstChild);
    });
    if (n === 4) res.textContent = '4칸 모두 정답! ' + FEEDBACK.allCorrect;
    else if (n === 0) res.textContent = '4칸 중 0칸 정답. ' + FEEDBACK.none;
    else res.textContent = '4칸 중 ' + n + '칸 정답. ' + FEEDBACK.partial.replace('{n}', n);
  }

  function initActivity(act) {
    if (act.getAttribute('data-seq-init') === '1') return;
    act.setAttribute('data-seq-init', '1');
    slotsOf(act).forEach(slotAria);
    refreshTrayEmpty(act);
  }
  function scan() {
    Array.prototype.forEach.call(document.querySelectorAll('.seq-activity'), initActivity);
  }

  /* ---- 클릭 / 탭 (터치·마우스 공통 대체 경로) ---- */
  document.addEventListener('click', function (e) {
    var act = inSeq(e, '.seq-activity');
    if (!act) { clearSelection(); return; }

    if (inSeq(e, '.seq-check-btn')) { grade(act); return; }
    if (inSeq(e, '.seq-reset-btn')) { reshuffle(act); return; }

    var chip = inSeq(e, '.seq-chip');
    if (chip) {
      if (selected === chip) { clearSelection(); return; }
      clearSelection();
      selected = chip;
      chip.classList.add('is-on');
      chip.setAttribute('aria-pressed', 'true');
      return;
    }

    var slot = inSeq(e, '.seq-slot');
    if (slot) {
      if (selected) { var c = selected; clearSelection(); placeChip(act, slot, c); }
      else { var ins = slot.querySelector('.seq-chip'); if (ins) returnChip(act, ins); }
      return;
    }

    var tray = inSeq(e, '.seq-tray');
    if (tray && selected) { var s = selected; clearSelection(); returnChip(act, s); }
  });

  /* ---- 키보드 (칩은 네이티브 button click, 슬롯은 role=button 수동 처리) ---- */
  document.addEventListener('keydown', function (e) {
    var t = e.target;
    var act = (t && t.closest) ? t.closest('.seq-activity') : null;
    if (!act) return;
    if (e.key === 'Escape' || e.key === 'Esc') { clearSelection(); return; }
    var slot = t.closest('.seq-slot');
    if (slot && (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar')) {
      e.preventDefault();
      if (selected) { var c = selected; clearSelection(); placeChip(act, slot, c); }
      else { var ins = slot.querySelector('.seq-chip'); if (ins) returnChip(act, ins); }
    }
  });

  /* ---- 마우스 HTML5 드래그 (zoom:1.1 → 좌표 산술 없이 이벤트 타깃만 사용) ---- */
  document.addEventListener('dragstart', function (e) {
    var chip = inSeq(e, '.seq-activity .seq-chip');
    if (!chip) return;
    dragChip = chip;
    chip.classList.add('is-dragging');
    try {
      e.dataTransfer.setData('text/plain', chip.getAttribute('data-value'));
      e.dataTransfer.effectAllowed = 'move';
    } catch (err) {}
  });
  document.addEventListener('dragend', function () {
    if (dragChip) dragChip.classList.remove('is-dragging');
    dragChip = null;
    Array.prototype.forEach.call(document.querySelectorAll('.seq-slot.is-over, .seq-tray.is-over'),
      function (n) { n.classList.remove('is-over'); });
  });
  document.addEventListener('dragover', function (e) {
    if (!dragChip) return;
    if (inSeq(e, '.seq-activity .seq-slot, .seq-activity .seq-tray')) {
      e.preventDefault();
      try { e.dataTransfer.dropEffect = 'move'; } catch (err) {}
    }
  });
  document.addEventListener('dragenter', function (e) {
    if (!dragChip) return;
    var zone = inSeq(e, '.seq-activity .seq-slot, .seq-activity .seq-tray');
    if (zone) zone.classList.add('is-over');
  });
  document.addEventListener('dragleave', function (e) {
    if (!dragChip) return;
    var zone = inSeq(e, '.seq-activity .seq-slot, .seq-activity .seq-tray');
    if (zone && !zone.contains(e.relatedTarget)) zone.classList.remove('is-over');
  });
  document.addEventListener('drop', function (e) {
    if (!dragChip) return;
    var act = inSeq(e, '.seq-activity');
    if (!act) return;
    e.preventDefault();
    var chip = dragChip;
    var slot = inSeq(e, '.seq-activity .seq-slot');
    if (slot) placeChip(act, slot, chip);
    else if (inSeq(e, '.seq-activity .seq-tray')) returnChip(act, chip);
    chip.classList.remove('is-dragging');
    Array.prototype.forEach.call(document.querySelectorAll('.seq-slot.is-over, .seq-tray.is-over'),
      function (n) { n.classList.remove('is-over'); });
    dragChip = null;
  });

  /* ---- 마운트 감지: sc-if 로 활동지 탭이 늦게/다시 렌더될 때마다 재초기화 ---- */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan);
  else scan();
  if (typeof MutationObserver === 'function') {
    new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
  }
})();
