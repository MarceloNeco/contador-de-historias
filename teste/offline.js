/* Teste do uso sem internet (v1.28.1): abre o app uma vez com internet (o service worker se instala), tira a internet e
   recarrega. O acervo tem que aparecer, a história abrir com o texto, a capa carregar e a voz do aparelho ler; nenhum
   pedido ao próprio site pode falhar (anúncios e recados sem internet = "nenhum", sem erro).
   O site é servido em /contador-de-historias/, como no endereço de verdade; /anuncios.json, /solverone-dados/ e /kids/
   não existem aqui (404), como acontece quando o arquivo some do portal. Tudo local. Uso: node teste/offline.js */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { RAIZ, semear, vozDeMentira, vigiar, resolverPin } = require('./comum');

const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg', '.wav': 'audio/wav' };
const PASTA = '/contador-de-historias/';
let falhas = 0;
const conf = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) falhas++; };

function servir() {
  return new Promise((ok) => {
    const s = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p.indexOf(PASTA) !== 0) { res.writeHead(404); res.end('nao'); return; }   // /anuncios.json, /solverone-dados/, /kids/
      p = p.slice(PASTA.length) || 'index.html';
      const arq = path.join(RAIZ, p);
      if (!arq.startsWith(RAIZ) || !fs.existsSync(arq) || fs.statSync(arq).isDirectory()) { res.writeHead(404); res.end('nao'); return; }
      res.writeHead(200, { 'content-type': TIPOS[path.extname(arq)] || 'application/octet-stream' });
      fs.createReadStream(arq).pipe(res);
    });
    s.listen(0, '127.0.0.1', () => ok({ servidor: s, base: 'http://127.0.0.1:' + s.address().port }));
  });
}

const nAcervo = (page) => page.evaluate(() => document.querySelectorAll('#lista-acervo .hist').length);
async function irAoAcervo(page) {
  await page.click('nav.tabs button[data-tela=acervo]');
  await page.waitForFunction(() => document.querySelectorAll('#lista-acervo .hist').length > 0, null, { timeout: 8000 }).catch(() => {});
}

(async () => {
  const { servidor, base } = await servir();
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const URL_APP = base + PASTA;
  try {
    const ctx = await browser.newContext({ serviceWorkers: 'allow', locale: 'pt-BR', reducedMotion: 'reduce', viewport: { width: 420, height: 860 } });
    await ctx.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, (r) => r.abort());   // internet de fora: nada sai daqui
    await vozDeMentira(ctx);
    await ctx.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { const e = document.createElement('style'); e.textContent = '#assist-balao,#assist-dica,#assist-btn{display:none!important}'; document.head.appendChild(e); }); });
    await semear(ctx, { ch_assist: { tour: true, vistas: {} } });
    const page = await ctx.newPage();
    const erros = []; vigiar(page, erros);
    const falhou = [], ruins = [];
    let offline = false;
    // falhou = sem resposta nenhuma (uma resposta 503 cujo corpo o app não leu aparece como ERR_ABORTED: não é falha)
    page.on('requestfailed', async (r) => {
      if (!offline || r.url().indexOf(base) !== 0 || await r.response().catch(() => null)) return;
      falhou.push(r.url().slice(base.length) + ' (' + (r.failure() || {}).errorText + ')');
    });
    page.on('response', (r) => { if (offline && r.url().indexOf(base) === 0 && r.status() >= 400) ruins.push(r.status() + ' ' + r.url().slice(base.length)); });

    console.log('1. Com internet: abre e o service worker guarda o básico');
    await page.goto(URL_APP);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await resolverPin(page, 'pin-de-teste-9');
    const guardou = await page.evaluate(async () => {
      for (let i = 0; i < 40; i++) {
        const nomes = (await caches.keys()).filter((n) => /^dgo-contador-de-historias-v/.test(n));
        if (nomes.length) {
          const urls = (await (await caches.open(nomes[0])).keys()).map((r) => new URL(r.url).pathname.replace(/^.*\//, ''));
          if (['historias.json', 'capa.jpg'].every((a) => urls.includes(a))) return urls;
        }
        await new Promise((ok) => setTimeout(ok, 250));
      }
      return null;
    });
    conf(!!guardou, 'o cache do app tem historias.json e capa.jpg' + (guardou ? ' (' + guardou.length + ' arquivos)' : ''));
    const comNet = await page.evaluate(() => !!navigator.serviceWorker.controller);
    conf(comNet, 'a página está com o service worker');
    await irAoAcervo(page);
    const n1 = await nAcervo(page);
    conf(n1 > 0, 'com internet: acervo com ' + n1 + ' cartões');

    console.log('2. Sem internet: recarrega');
    offline = true;
    await ctx.setOffline(true);
    await page.reload();
    await resolverPin(page, 'pin-de-teste-9');
    await page.waitForTimeout(1500);
    await irAoAcervo(page);
    const n2 = await nAcervo(page);
    conf(n2 === n1, 'sem internet: o acervo aparece igual (' + n2 + ' cartões)');
    const capa = await page.evaluate(() => { const i = document.getElementById('capa-img'); return i.complete && i.naturalWidth > 0; });
    conf(capa, 'sem internet: a capa (capa.jpg) carrega');
    const json = await page.evaluate(() => fetch('historias.json?t=' + Date.now(), { cache: 'no-store' }).then((r) => r.ok ? r.json() : null).then((j) => j && j.historias.length).catch(() => 0));
    conf(json > 0, 'sem internet: historias.json?t=<hora> vem do aparelho (' + json + ' histórias)');

    console.log('3. Sem internet: abre uma história e ouve com a voz do aparelho');
    await page.locator('#lista-acervo .hist:not(.serie)').first().click();
    await page.waitForSelector('#leitor.on, #leitor.aberto, #leitor[open]', { timeout: 3000 }).catch(() => {});
    const texto = await page.evaluate(() => (document.getElementById('lt-texto').textContent || '').trim().length);
    conf(texto > 200, 'a história abre com o texto (' + texto + ' letras)');
    await page.click('#btn-play');
    await page.waitForFunction(() => window.__falas && window.__falas.length > 0, null, { timeout: 6000 }).catch(() => {});
    const falas = await page.evaluate(() => window.__falas.length);
    conf(falas > 0, 'o play lê em voz alta com a voz do aparelho, sem internet (' + falas + ' trechos)');

    console.log('3b. Sem internet: criar com a IA avisa que precisa de internet');
    await page.click('#btn-fechar-leitor').catch(() => {});
    await page.click('nav.tabs button[data-tela=nova]');
    await page.evaluate(() => document.getElementById('btn-gerar').click());
    const aviso = await page.evaluate(() => document.getElementById('toast').textContent || '');
    conf(/Sem internet agora/.test(aviso), 'aviso claro: "' + aviso.slice(0, 60) + '…"');

    console.log('4. Sem internet e sem nada salvo no aparelho: o acervo vem do cache do service worker');
    await page.evaluate(() => { localStorage.removeItem('ch_historias'); indexedDB.deleteDatabase('ch_dados'); });
    await page.reload();
    await resolverPin(page, 'pin-de-teste-9');
    await page.waitForTimeout(1500);
    await irAoAcervo(page);
    const n3 = await nAcervo(page);
    conf(n3 === n1, 'acervo refeito a partir do historias.json guardado (' + n3 + ' cartões)');

    conf(falhou.length === 0, 'nenhum pedido ao próprio site falhou sem internet' + (falhou.length ? ': ' + falhou.join(', ') : ''));
    const SO_ONLINE = /(^|\/)(anuncios|recados)\.json|\/solverone-dados\/|\/kids\//;
    const fora = ruins.filter((x) => !SO_ONLINE.test(x));
    conf(fora.length === 0, 'só anúncios, recados e dados do portal respondem "sem internet"' + (ruins.length ? ' (' + [...new Set(ruins)].join(', ') + ')' : ''));
    conf(erros.length === 0, 'nenhum erro na página' + (erros.length ? ': ' + erros.join(' | ') : ''));
    await ctx.close();
  } finally { await browser.close(); servidor.close(); }
  console.log(falhas ? '\n' + falhas + ' falha(s).' : '\nTudo certo.');
  process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
