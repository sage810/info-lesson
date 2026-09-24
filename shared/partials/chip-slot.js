
(function () {
  var SEL_CHIP = '.ca-chip', SEL_SLOT = '.ca-slot';
  var selected = null;

  function slots() { return Array.prototype.slice.call(document.querySelectorAll(SEL_SLOT)); }
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
  function grade() {
    var ss = slots(), filled = 0, correct = 0;
    ss.forEach(function (slot) {
      var v = slot.getAttribute('data-filled');
      slot.classList.remove('is-correct', 'is-wrong');
      if (!v) return;
      filled++;
      if (v === slot.getAttribute('data-answer')) { slot.classList.add('is-correct'); correct++; }
      else slot.classList.add('is-wrong');
    });
    var r = document.getElementById('caResult');
    if (!r) return;
    if (!ss.length || filled < ss.length) { r.textContent = ''; r.style.color = ''; return; }
    var ok = correct === ss.length;
    r.textContent = ok ? '⭕ 두 칸 모두 정답이에요!' : ('❌ ' + ss.length + '칸 중 ' + correct + '칸 정답 — 다시 놓아 보세요.');
    r.style.color = ok ? '#3d7f6c' : '#a65a86';
  }
  function place(slot, value) {
    if (!value) return;
    slot.textContent = value;
    slot.setAttribute('data-filled', value);
    slot.classList.add('is-filled');
    clearSel();
    grade();
  }
  function chipAt(e) { return e.target && e.target.closest ? e.target.closest(SEL_CHIP) : null; }
  function slotAt(e) { return e.target && e.target.closest ? e.target.closest(SEL_SLOT) : null; }

  document.addEventListener('dragstart', function (e) {
    var chip = chipAt(e); if (!chip) return;
    e.dataTransfer.setData('text/plain', chip.getAttribute('data-v') || '');
    e.dataTransfer.effectAllowed = 'copy';
    chip.classList.add('is-dragging');
  });
  document.addEventListener('dragend', function (e) {
    var chip = chipAt(e); if (chip) chip.classList.remove('is-dragging');
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
    place(slot, e.dataTransfer.getData('text/plain'));
  });

  document.addEventListener('click', function (e) {
    var chip = chipAt(e);
    if (chip) { if (chip.classList.contains('is-on')) clearSel(); else select(chip); return; }
    var slot = slotAt(e);
    if (slot && selected) place(slot, selected.getAttribute('data-v'));
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { clearSel(); return; }
    if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
    var chip = chipAt(e);
    if (chip) { e.preventDefault(); if (chip.classList.contains('is-on')) clearSel(); else select(chip); return; }
    var slot = slotAt(e);
    if (slot && selected) { e.preventDefault(); place(slot, selected.getAttribute('data-v')); }
  });
})();
