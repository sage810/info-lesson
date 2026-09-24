
(function () {
  'use strict';
  var EMPTY = '<div class="paste-empty"><span class="pz-caret" aria-hidden="true"></span>📷 이 칸을 <span class="kbd">클릭</span>한 뒤 <span class="kbd">Ctrl + V</span> 로 캡처한 그래프를 붙여넣어요<br><span class="sm">(그림 파일을 이 칸으로 끌어다 놓아도 돼요 · 지우기: 아래 🗑 버튼 또는 Delete 키)</span></div>';
  var lastZone = null;

  function zoneFromEvent(e) {
    var n = e.target;
    return (n && n.closest) ? n.closest('.paste-zone') : null;
  }

  // 클릭한 버튼과 같은 묶음(같은 렌더 복제본) 안의 .paste-zone 을 찾는다.
  // (문서 전역 querySelector 는 숨겨진 raw 템플릿 복제본을 먼저 잡아 눈에 보이는 칸을 못 지우던 버그 방지)
  function siblingZone(btn) {
    var el = btn.parentElement;                 // .pz-controls
    var z = el ? el.previousElementSibling : null;
    while (z && !(z.classList && z.classList.contains('paste-zone'))) z = z.previousElementSibling;
    return z;
  }

  function fillZone(zone, dataUrl) {
    if (!zone || !dataUrl) return;
    while (zone.firstChild) zone.removeChild(zone.firstChild);
    var img = document.createElement('img');
    img.alt = '붙여넣은 그래프';
    img.src = dataUrl;
    zone.appendChild(img);
    zone.classList.add('is-filled');
    zone.classList.remove('is-over');
    zone._imgData = dataUrl;
  }

  function clearZone(zone) {
    if (!zone) return;
    zone.innerHTML = EMPTY;
    zone.classList.remove('is-filled');
    zone._imgData = null;
  }

  function readImageFile(file, zone) {
    if (!file || file.type.indexOf('image') !== 0) return false;
    var fr = new FileReader();
    fr.onload = function () { fillZone(zone, fr.result); };
    fr.readAsDataURL(file);
    return true;
  }

  function dataUrlToBlob(u) {
    var parts = u.split(',');
    var mime = (parts[0].match(/:(.*?);/) || [])[1] || 'image/png';
    var bin = atob(parts[1]);
    var arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }

  function flash(btn, msg) {
    if (btn._t) { clearTimeout(btn._t); }
    if (btn._orig == null) btn._orig = btn.textContent;
    btn.textContent = msg;
    btn.disabled = true;
    btn._t = setTimeout(function () { btn.textContent = btn._orig; btn.disabled = false; }, 1500);
  }

  // 클릭/포커스 → 붙여넣기 대상 기억
  document.addEventListener('mousedown', function (e) {
    var z = zoneFromEvent(e);
    if (z) lastZone = z;
  }, true);
  document.addEventListener('focusin', function (e) {
    var z = zoneFromEvent(e);
    if (z) lastZone = z;
  });

  // Ctrl+V 이미지 붙여넣기 (칸에 이미 그림이 있으면 교체)
  document.addEventListener('paste', function (e) {
    var active = document.activeElement;
    var zone = (active && active.closest ? active.closest('.paste-zone') : null) || lastZone;
    if (!zone) return;
    var dt = e.clipboardData || window.clipboardData;
    if (!dt) return;
    var file = null;
    if (dt.items) {
      for (var i = 0; i < dt.items.length; i++) {
        if (dt.items[i].type && dt.items[i].type.indexOf('image') === 0) { file = dt.items[i].getAsFile(); break; }
      }
    }
    if (!file && dt.files && dt.files.length) {
      for (var j = 0; j < dt.files.length; j++) {
        if (dt.files[j].type && dt.files[j].type.indexOf('image') === 0) { file = dt.files[j]; break; }
      }
    }
    if (file) { e.preventDefault(); readImageFile(file, zone); }
  }, true);

  // 그림 파일 드래그 & 드롭
  document.addEventListener('dragover', function (e) {
    var z = zoneFromEvent(e);
    if (z) { e.preventDefault(); z.classList.add('is-over'); }
  });
  document.addEventListener('dragleave', function (e) {
    var z = zoneFromEvent(e);
    if (z) z.classList.remove('is-over');
  });
  document.addEventListener('drop', function (e) {
    var z = zoneFromEvent(e);
    if (!z) return;
    e.preventDefault();
    z.classList.remove('is-over');
    var files = e.dataTransfer && e.dataTransfer.files;
    if (files && files.length) readImageFile(files[0], z);
  });

  // 칸에 포커스가 있을 때 Delete / Backspace 로 지우기
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Delete' && e.key !== 'Backspace') return;
    var z = e.target && e.target.closest ? e.target.closest('.paste-zone') : null;
    if (z && z.classList.contains('is-filled')) { e.preventDefault(); clearZone(z); z.focus(); }
  });

  // 복사 / 지우기 버튼
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;

    var clr = t.closest('.pz-clear');
    if (clr) {
      var zc = siblingZone(clr);
      if (zc) { clearZone(zc); lastZone = zc; zc.focus(); }
      return;
    }

    var cp = t.closest('.pz-copy');
    if (cp) {
      var zz = siblingZone(cp);
      if (!zz || !zz._imgData) { flash(cp, '붙여넣은 그림이 없어요'); return; }
      try {
        var blob = dataUrlToBlob(zz._imgData);
        if (navigator.clipboard && window.ClipboardItem) {
          navigator.clipboard.write([new window.ClipboardItem({ 'image/png': blob })])
            .then(function () { flash(cp, '✅ 복사됨'); })
            .catch(function () { flash(cp, '실패 — 그림 우클릭 후 복사'); });
        } else {
          flash(cp, '그림을 우클릭 → 복사하세요');
        }
      } catch (err) { flash(cp, '복사 실패'); }
    }
  });
})();
