
(function () {
  // 이름표(.ca-chip) → 칸(.ca-slot) 끌어 놓기(또는 이름표 누르기 → 칸 누르기). 이름표는 복사돼서 여러 칸에 쓸 수 있다.
  // 묶음: 칸을 [data-ca-group] 안에 두면 그 묶음끼리만 채점하고 결과는 묶음 안 .ca-result 에 쓴다(한 페이지 여러 활동).
  //       묶음이 없으면 예전처럼 묶음 밖 칸 전부를 한 묶음으로 보고 #caResult 에 쓴다(04 · 01).
  // 채점: 묶음에 data-ca-check="button" 이면 .ca-check(✅ 정답 확인)를 눌러야 채점하고, .ca-reset(🔀 다시 섞기)은
  //       칸을 비우고 이름표 순서를 섞는다. 그 밖에는 예전처럼 칸이 다 차는 순간 채점한다.
  var SEL_CHIP = '.ca-chip', SEL_SLOT = '.ca-slot', SEL_GROUP = '[data-ca-group]';
  var selected = null, dragging = null;

  function groupOf(el) { return el && el.closest ? el.closest(SEL_GROUP) : null; }
  function slots(group) {
    var all = Array.prototype.slice.call((group || document).querySelectorAll(SEL_SLOT));
    return group ? all : all.filter(function (s) { return !groupOf(s); });
  }
  function isButtonMode(group) { return !!(group && group.getAttribute('data-ca-check') === 'button'); }
  function resultEl(group) { return group ? group.querySelector('.ca-result') : document.getElementById('caResult'); }
  function say(group, text, ok) {
    var r = resultEl(group);
    if (!r) return;
    r.textContent = text;
    r.style.color = text ? (ok ? '#3d7f6c' : '#a65a86') : '';
  }
  function clearSel() {
    var c = document.querySelector('.ca-chip.is-on');
    if (c) { c.classList.remove('is-on'); c.setAttribute('aria-pressed', 'false'); }
    selected = null;
  }
  function select(chip) {
    clearSel();
    chip.classList.add('is-on'); chip.setAttribute('aria-pressed', 'true');
    selected = chip;
  }
  // check=true: 정답 확인 버튼으로 채점(빈 칸이 있으면 알려만 줌) / false: 예전처럼 놓을 때마다 채점
  function grade(group, check) {
    var ss = slots(group), filled = 0, correct = 0;
    ss.forEach(function (slot) { if (slot.getAttribute('data-filled')) filled++; });
    if (check && filled < ss.length) {
      say(group, '❗ 아직 빈 칸이 ' + (ss.length - filled) + '개 있어요. 모두 채운 뒤 눌러 주세요.', false);
      return;
    }
    ss.forEach(function (slot) {
      var v = slot.getAttribute('data-filled');
      slot.classList.remove('is-correct', 'is-wrong');
      if (!v) return;
      if (v === slot.getAttribute('data-answer')) { slot.classList.add('is-correct'); correct++; }
      else slot.classList.add('is-wrong');
    });
    if (!ss.length || filled < ss.length) { say(group, '', false); return; }
    var ok = correct === ss.length;
    say(group, ok ? ('⭕ ' + (ss.length === 2 ? '두 칸' : ss.length + '칸') + ' 모두 정답이에요!')
      : ('❌ ' + ss.length + '칸 중 ' + correct + '칸 정답 — 다시 놓아 보세요.'), ok);
  }
  function place(slot, value, chip) {
    if (!value) return;
    var group = groupOf(slot);
    if (chip && groupOf(chip) !== group) return;           // 다른 활동의 이름표는 놓지 않는다
    slot.textContent = value;
    slot.setAttribute('data-filled', value);
    slot.classList.add('is-filled');
    clearSel();
    if (isButtonMode(group)) { slot.classList.remove('is-correct', 'is-wrong'); say(group, '', false); }
    else grade(group, false);
  }
  function reset(group) {
    slots(group).forEach(function (slot) {
      slot.textContent = '';
      slot.removeAttribute('data-filled');
      slot.classList.remove('is-filled', 'is-correct', 'is-wrong');
    });
    say(group, '', false);
    clearSel();
    var tray = group && group.querySelector('.ca-tray');
    if (tray) {                                            // 이름표 순서 섞기
      var chips = Array.prototype.slice.call(tray.querySelectorAll(SEL_CHIP));
      for (var i = chips.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = chips[i]; chips[i] = chips[j]; chips[j] = t; }
      chips.forEach(function (c) { tray.appendChild(c); });
    }
  }
  function chipAt(e) { return e.target && e.target.closest ? e.target.closest(SEL_CHIP) : null; }
  function slotAt(e) { return e.target && e.target.closest ? e.target.closest(SEL_SLOT) : null; }

  document.addEventListener('dragstart', function (e) {
    var chip = chipAt(e); if (!chip) return;
    e.dataTransfer.setData('text/plain', chip.getAttribute('data-v') || '');
    e.dataTransfer.effectAllowed = 'copy';
    chip.classList.add('is-dragging');
    dragging = chip;
  });
  document.addEventListener('dragend', function (e) {
    var chip = chipAt(e); if (chip) chip.classList.remove('is-dragging');
    dragging = null;
  });
  document.addEventListener('dragover', function (e) {
    var slot = slotAt(e); if (!slot) return;
    e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; slot.classList.add('is-over');
  });
  document.addEventListener('dragleave', function (e) {
    var slot = slotAt(e); if (slot) slot.classList.remove('is-over');
  });
  document.addEventListener('drop', function (e) {
    var slot = slotAt(e); if (!slot) return;
    e.preventDefault(); slot.classList.remove('is-over');
    place(slot, e.dataTransfer.getData('text/plain'), dragging);
  });

  document.addEventListener('click', function (e) {
    var btn = e.target && e.target.closest ? e.target.closest('.ca-check, .ca-reset') : null;
    if (btn) {
      var g = groupOf(btn);
      if (btn.classList.contains('ca-check')) grade(g, true); else reset(g);
      return;
    }
    var chip = chipAt(e);
    if (chip) { if (chip.classList.contains('is-on')) clearSel(); else select(chip); return; }
    var slot = slotAt(e);
    if (slot && selected) place(slot, selected.getAttribute('data-v'), selected);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { clearSel(); return; }
    if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
    var chip = chipAt(e);
    if (chip) { e.preventDefault(); if (chip.classList.contains('is-on')) clearSel(); else select(chip); return; }
    var slot = slotAt(e);
    if (slot && selected) { e.preventDefault(); place(slot, selected.getAttribute('data-v'), selected); }
  });
})();
