
(function () {
  function grow(el) {
    if (!el || el.tagName !== 'TEXTAREA') return;
    el.style.height = 'auto';
    var h = el.scrollHeight + (el.offsetHeight - el.clientHeight);
    if (h > 0) el.style.height = h + 'px';
  }
  function growAll() {
    var list = document.querySelectorAll('textarea.blank');
    for (var i = 0; i < list.length; i++) grow(list[i]);
  }
  document.addEventListener('input', function (e) {
    if (e.target && e.target.classList && e.target.classList.contains('blank')) grow(e.target);
  }, true);
  document.addEventListener('focusin', function (e) {
    if (e.target && e.target.classList && e.target.classList.contains('blank')) grow(e.target);
  });
  window.addEventListener('load', growAll);
  window.addEventListener('resize', growAll);
  document.addEventListener('click', function () { setTimeout(growAll, 50); });
  var n = 0, iv = setInterval(function () { growAll(); if (++n > 24) clearInterval(iv); }, 250);
})();
