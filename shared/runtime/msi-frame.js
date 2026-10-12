/* 구글 사이트 같은 "삽입 화면(iframe)" 안에서 열렸을 때만 작은 안내를 띄운다.
   이유: 삽입 화면은 보호 상자(sandbox) 안이라 PDF 파일 다운로드와 안내 창(alert)이 막힐 수 있다 —
   그러면 "PDF로 저장하기"가 눌러도 아무 일이 없어 보인다. 새 탭(주소 직접 열기)에서는 정상이다.
   삽입이 아닌 평소 화면에서는 아무것도 하지 않는다(2026-10-12). */
(function () {
  'use strict';
  var C = window.MSI_FRAME;
  if (!C || !C.url) return;
  var inFrame;
  try { inFrame = window.self !== window.top; } catch (e) { inFrame = true; }   // 위쪽 창이 다른 출처면 접근 오류 = 삽입 화면
  if (!inFrame) return;
  try { if (sessionStorage.getItem('msi-frame-closed') === '1') return; } catch (e) { /* 보관소가 막혀도 안내는 보여 준다 */ }

  function build() {
    if (document.getElementById('msi-frame-note') || !document.body) return;
    var bar = document.createElement('div');
    bar.id = 'msi-frame-note'; bar.setAttribute('role', 'note');
    bar.setAttribute('style', 'position:fixed;left:50%;bottom:12px;transform:translateX(-50%);z-index:2147483000;box-sizing:border-box;'
      + 'width:min(560px,calc(100vw - 16px));padding:10px 12px;border:3px solid #4b3b6b;border-radius:12px;background:#fffdf7;color:#4b3b6b;'
      + "font:700 13px/1.5 'Maplestory','Apple SD Gothic Neo','Malgun Gothic',sans-serif;box-shadow:4px 4px 0 rgba(75,59,107,.25);");
    var msg = document.createElement('div');
    msg.textContent = '이 화면(삽입된 창)에서는 PDF 저장이 안 될 수 있어요. 새 탭에서 열어서 풀고 저장해 주세요.';
    var row = document.createElement('div');
    row.setAttribute('style', 'display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:6px');
    var a = document.createElement('a');
    a.href = C.url; a.target = '_blank'; a.rel = 'noopener';
    a.textContent = '↗ 새 탭에서 열기';
    a.setAttribute('style', 'padding:4px 12px;border:2px solid #4b3b6b;border-radius:8px;background:#c4cce8;color:#4b3b6b;text-decoration:none');
    var url = document.createElement('input');
    url.type = 'text'; url.readOnly = true; url.value = C.url; url.setAttribute('aria-label', '새 탭에 붙여넣을 주소');
    url.setAttribute('style', 'flex:1 1 180px;min-width:0;padding:3px 8px;border:2px solid #b9b0d3;border-radius:8px;background:#fff;color:#4b3b6b;font:12px/1.4 sans-serif');
    url.addEventListener('focus', function () { url.select(); });
    var x = document.createElement('button');
    x.type = 'button'; x.textContent = '×'; x.setAttribute('aria-label', '안내 닫기');
    x.setAttribute('style', 'padding:0 10px;border:2px solid #4b3b6b;border-radius:8px;background:#fff;color:#4b3b6b;font:700 16px/1.4 sans-serif;cursor:pointer');
    x.addEventListener('click', function () {
      try { sessionStorage.setItem('msi-frame-closed', '1'); } catch (e) { /* 무시 */ }
      bar.parentNode && bar.parentNode.removeChild(bar);
    });
    row.appendChild(a); row.appendChild(url); row.appendChild(x);
    bar.appendChild(msg); bar.appendChild(row);
    document.body.appendChild(bar);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
