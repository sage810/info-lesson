/* msi-hook.js — 빌드할 때 모든 활동지 맨 끝에 자동으로 붙는 작은 스크립트.
 *
 *  site.config.json 의 apiUrl(배포한 Apps Script 웹앱 주소)이 비어 있으면 아무 일도 하지 않는다.
 *  → 지금까지의 활동지 동작은 그대로. Apps Script 를 배포하고 주소를 넣었을 때만 켜진다.
 *
 *  켜지면 하는 일
 *   1) 제출(submit: true): 학생이 "PDF로 저장하기"를 누르면, 내 컴퓨터에 PDF 가 저장되는 것과 동시에
 *      같은 PDF + 빈칸 답을 Apps Script 로 보내 선생님 드라이브/시트에 모은다. (교사용 페이지에서는 꺼짐)
 *   2) NEIS 프록시(neisProxy: true): 시간표·급식 실시간 조회를 Apps Script 경유로 바꿔,
 *      인증키를 브라우저에 두지 않고도 한 번에 전체 데이터를 받는다.
 */
(function () {
  'use strict';
  var C = window.MSI_CONFIG || {};
  if (!C.apiUrl) return;

  function toast(msg, ok) {
    try {
      var t = document.createElement('div');
      t.textContent = msg;
      t.setAttribute('role', 'status');
      t.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:99999;'
        + 'padding:10px 16px;border:3px solid #4b3b6b;border-radius:12px;font:600 14px/1.4 sans-serif;'
        + 'box-shadow:4px 4px 0 rgba(75,59,107,.2);background:' + (ok ? '#eaf8f2' : '#fdf3f0') + ';color:#4b3b6b';
      document.body.appendChild(t);
      setTimeout(function () { t.remove(); }, 4500);
    } catch (e) { /* 안내가 실패해도 제출에는 영향 없음 */ }
  }

  function post(payload, tries) {
    return fetch(C.apiUrl, { method: 'POST', body: JSON.stringify(payload) }) // text/plain → CORS 사전요청 없음
      .then(function (r) { return r.json(); })
      .then(function (j) { if (!j || !j.ok) throw new Error((j && j.error) || '응답 오류'); return j; })
      .catch(function (e) {
        if (tries > 1) return new Promise(function (res) { setTimeout(res, 800 + Math.random() * 1500); })
          .then(function () { return post(payload, tries - 1); });
        throw e;
      });
  }

  function collectAnswers() {
    var out = {};
    var list = document.querySelectorAll('textarea.blank[aria-label], input[aria-label]');
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (el.closest && el.closest('[hidden]')) continue;
      var v = (el.value || '').trim();
      if (v) out[el.getAttribute('aria-label')] = v;
    }
    return out;
  }

  // ---- 1) 제출 ----------------------------------------------------------------
  if (C.submit && !C.teacher) {
    var wrapJsPDF = function () {
      var ns = window.jspdf;
      if (!ns || !ns.jsPDF || ns.jsPDF.__msiWrapped) return;
      var Orig = ns.jsPDF;
      var Wrapped = function () {
        var args = [null].concat(Array.prototype.slice.call(arguments));
        var doc = new (Function.prototype.bind.apply(Orig, args))();
        var save = doc.save;
        doc.save = function (filename) {
          var result = save.apply(doc, arguments);
          try {
            var dataUri = doc.output('datauristring');
            var payload = {
              action: 'submit',
              lesson: C.lesson, title: C.title,
              filename: String(filename || '활동지.pdf'),
              pdf: dataUri.slice(dataUri.indexOf(',') + 1),
              answers: collectAnswers(),
              page: location.href,
              token: C.token || ''
            };
            toast('선생님께 제출하는 중이에요…', true);
            post(payload, 3).then(function () { toast('✓ 선생님께 제출됐어요', true); })
              .catch(function () { toast('제출은 실패했어요. PDF 파일은 내 컴퓨터에 저장됐으니 선생님께 알려 주세요.', false); });
          } catch (e) { /* PDF 저장 자체는 이미 끝났다 */ }
          return result;
        };
        return doc;
      };
      for (var k in Orig) { if (Object.prototype.hasOwnProperty.call(Orig, k)) Wrapped[k] = Orig[k]; }
      Wrapped.API = Orig.API; Wrapped.prototype = Orig.prototype; Wrapped.__msiWrapped = true;
      ns.jsPDF = Wrapped;
    };
    wrapJsPDF();
    document.addEventListener('DOMContentLoaded', wrapJsPDF);
    document.addEventListener('click', wrapJsPDF, true); // 라이브러리가 늦게 붙는 경우 대비
  }

  // ---- 2) NEIS 프록시 ---------------------------------------------------------
  if (C.neisProxy && window.fetch) {
    var NEIS = 'https://open.neis.go.kr/hub/';
    var origFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      if (url.indexOf(NEIS) === 0) {
        try {
          var u = new URL(url);
          u.searchParams.delete('KEY');
          var q = new URLSearchParams(u.search);
          q.set('action', 'neis');
          q.set('endpoint', u.pathname.split('/').pop());
          return origFetch(C.apiUrl + (C.apiUrl.indexOf('?') >= 0 ? '&' : '?') + q.toString(), init)
            .catch(function () { return origFetch(input, init); }); // 프록시가 안 되면 원래대로
        } catch (e) { /* 아래 원래 요청으로 */ }
      }
      return origFetch(input, init);
    };
  }
})();
