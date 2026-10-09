/* SolverONE — tarefas longas (DIRETRIZ-TAREFAS-LONGAS.md, RootifyONE) — v1.0.0
 * Cópia avulsa, igual em todos os apps que não carregam o módulo comum 1.4.0 (ou que carregam uma linhagem antiga).
 * Mesma API do módulo: DGO.tarefa.iniciar({ id, titulo, executar(andamento), aindaNaTela, aoAbrir }) → Promise,
 * DGO.tarefa.andamento(id, fracao, texto), .cancelar(id), .ativas(), .interrompida().
 * - mantém a tela acesa (Wake Lock) enquanto roda; avisa se a pessoa tentar fechar/recarregar a aba
 * - pílula flutuante "⏳ título — não feche o app"; a pessoa pode navegar nas outras telas, a tarefa continua
 * - ao terminar: "✅ título · toque para ver" → aoAbrir(resultado); erro: pílula vermelha, toque fecha
 * - sessionStorage: se a página fechar no meio, interrompida() devolve {id, titulo} na próxima abertura
 * Idioma: <html lang="en…"> → inglês; senão português. Nada da tarefa sai do aparelho. */
(function (raiz) {
  var d = raiz.document;
  var DGO = raiz.DGO = raiz.DGO || {};
  if (DGO.tarefa) return; // o módulo comum 1.4.0+ já traz; esta cópia só completa quando falta
  var TXT = {
    naoFeche: ['Não feche o app nem apague a tela. Pode usar outras telas.', 'Do not close the app or turn the screen off. You can use other screens.'],
    pronta: ['Pronto · toque para ver', 'Done · tap to see'],
    erro: ['Não deu certo · toque para fechar', 'Failed · tap to close'],
    processando: ['Processando…', 'Processing…'],
    sair: ['Uma leitura ainda está em andamento. Se sair agora, ela é perdida.', 'A reading is still in progress. If you leave now, it is lost.']
  };
  function en() { try { if (typeof DGO.tarefaIdioma === 'function') return DGO.tarefaIdioma() === 'en'; } catch (e) {} return String(d.documentElement.lang || '').toLowerCase().indexOf('en') === 0; }
  function t(k) { return TXT[k][en() ? 1 : 0]; }
  function css() {
    if (d.getElementById('dgo-tarefas-css')) return;
    var s = d.createElement('style'); s.id = 'dgo-tarefas-css';
    s.textContent = '.dgo-tarefas{position:fixed;left:.6rem;right:.6rem;bottom:calc(5.4rem + env(safe-area-inset-bottom));z-index:2147483000;display:flex;flex-direction:column;gap:.4rem;pointer-events:none;max-width:30rem;margin:0 auto;}' +
      '.dgo-tarefa{pointer-events:auto;display:flex;align-items:center;gap:.6rem;padding:.6rem .8rem;border-radius:14px;background:#0f172a;color:#f8fafc;border:1px solid rgba(255,255,255,.18);box-shadow:0 8px 24px rgba(0,0,0,.35);font:600 .9rem/1.3 system-ui,sans-serif;cursor:default;}' +
      '.dgo-tarefa i{font-style:normal;font-size:1.3rem;line-height:1;}.dgo-tarefa small{display:block;font-weight:500;opacity:.85;font-size:.78rem;}.dgo-tarefa b{display:block;}' +
      '.dgo-tarefa .dgo-tarefa-barra{height:4px;border-radius:2px;background:rgba(255,255,255,.15);margin-top:.35rem;overflow:hidden;}.dgo-tarefa .dgo-tarefa-barra span{display:block;height:100%;width:0;background:#10b981;transition:width .3s;}' +
      '.dgo-tarefa.pronta{background:#bbf7d0;color:#052e16;border-color:#4ade80;cursor:pointer;}.dgo-tarefa.erro{background:#fecaca;color:#450a0a;border-color:#f87171;cursor:pointer;}' +
      '@media (prefers-reduced-motion:reduce){.dgo-tarefa .dgo-tarefa-barra span{transition:none;}}';
    d.head.appendChild(s);
  }
  function el(tag, cls, texto) { var e = d.createElement(tag); if (cls) e.className = cls; if (texto != null) e.textContent = texto; return e; }
  var ativas = {}, wake = null, caixa = null, interrompidaAntes = null, CHAVE = 'dgo:tarefa:ativa';
  try { var m = raiz.sessionStorage.getItem(CHAVE); if (m) { interrompidaAntes = JSON.parse(m); raiz.sessionStorage.removeItem(CHAVE); } } catch (e) {}
  function marcar() { try { var ids = Object.keys(ativas); if (ids.length) raiz.sessionStorage.setItem(CHAVE, JSON.stringify({ id: ids[0], titulo: ativas[ids[0]].titulo, quando: Date.now() })); else raiz.sessionStorage.removeItem(CHAVE); } catch (e) {} }
  function container() { css(); if (!caixa || !caixa.parentNode) { caixa = el('div', 'dgo-tarefas'); caixa.setAttribute('data-dgo-ui', '1'); caixa.setAttribute('aria-live', 'polite'); d.body.appendChild(caixa); } return caixa; }
  function aoSair(e) { e.preventDefault(); e.returnValue = t('sair'); return e.returnValue; }
  function acordar() {
    if (!('wakeLock' in navigator) || wake || d.visibilityState !== 'visible') return;
    try { navigator.wakeLock.request('screen').then(function (w) { wake = w; w.addEventListener('release', function () { wake = null; }); }).catch(function () {}); } catch (e) {}
  }
  function soltar() { if (wake) { try { wake.release(); } catch (e) {} wake = null; } }
  d.addEventListener('visibilitychange', function () { if (Object.keys(ativas).length && d.visibilityState === 'visible') acordar(); });
  function ligar() { if (Object.keys(ativas).length === 1) { raiz.addEventListener('beforeunload', aoSair); acordar(); } marcar(); }
  function desligar(id) { delete ativas[id]; marcar(); if (!Object.keys(ativas).length) { raiz.removeEventListener('beforeunload', aoSair); soltar(); } }
  function pilula(titulo) {
    var p = el('div', 'dgo-tarefa'); p.setAttribute('role', 'status');
    var ic = el('i', null, '⏳'); p.appendChild(ic);
    var txt = el('div'); txt.style.flex = '1'; txt.style.minWidth = '0';
    var b = el('b', null, titulo), sub = el('small', null, t('naoFeche')), barra = el('div', 'dgo-tarefa-barra'), sp = el('span');
    barra.appendChild(sp); txt.appendChild(b); txt.appendChild(sub); txt.appendChild(barra); p.appendChild(txt);
    container().appendChild(p);
    return { el: p, icone: ic, sub: sub, barra: sp };
  }
  DGO.tarefa = {
    iniciar: function (o) {
      o = o || {}; var id = o.id || ('t' + Date.now());
      if (ativas[id]) return ativas[id].promessa;
      var ui = pilula(o.titulo || t('processando'));
      var andamento = function (fracao, texto) { if (fracao != null) ui.barra.style.width = Math.round(Math.max(0, Math.min(1, fracao)) * 100) + '%'; if (texto) ui.sub.textContent = texto; };
      var promessa = new Promise(function (ok, falha) { try { Promise.resolve(o.executar(andamento)).then(ok, falha); } catch (e) { falha(e); } });
      ativas[id] = { titulo: o.titulo || '', promessa: promessa, ui: ui };
      ligar();
      promessa.then(function (r) {
        if (!ativas[id]) return; // cancelada
        desligar(id); ui.barra.style.width = '100%'; ui.el.classList.add('pronta'); ui.icone.textContent = '✅'; ui.sub.textContent = t('pronta'); ui.el.setAttribute('role', 'button'); ui.el.tabIndex = 0;
        try { if (navigator.vibrate) navigator.vibrate([40, 60, 40]); } catch (e) {}
        var abrir = function () { ui.el.remove(); if (typeof o.aoAbrir === 'function') o.aoAbrir(r); };
        ui.el.addEventListener('click', abrir); ui.el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); } });
        if (o.abrirSozinho !== false && !d.hidden && (typeof o.aindaNaTela !== 'function' || o.aindaNaTela())) abrir();
      }, function (e) {
        if (!ativas[id]) return;
        desligar(id); ui.el.classList.add('erro'); ui.icone.textContent = '⚠️'; ui.sub.textContent = (e && e.message && e.message.length < 80 ? e.message + ' · ' : '') + t('erro'); ui.el.setAttribute('role', 'button'); ui.el.tabIndex = 0;
        ui.el.addEventListener('click', function () { ui.el.remove(); });
      });
      return promessa;
    },
    andamento: function (id, fracao, texto) { var tf = ativas[id]; if (!tf) return; if (fracao != null) tf.ui.barra.style.width = Math.round(Math.max(0, Math.min(1, fracao)) * 100) + '%'; if (texto) tf.ui.sub.textContent = texto; },
    cancelar: function (id) { var tf = ativas[id]; if (!tf) return; tf.ui.el.remove(); desligar(id); },
    ativas: function () { return Object.keys(ativas); },
    interrompida: function () { var r = interrompidaAntes; interrompidaAntes = null; return r; }
  };
})(window);
