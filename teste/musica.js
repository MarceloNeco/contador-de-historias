/* Teste da música de fundo (v1.28.0): abertura, escolher a história, história baixinha, fim da história, ligar/desligar,
   trocar, escolher a música, sair do app, outro som tocando e o service worker guardando para tocar sem internet.
   Tudo local (internet de mentira, voz do aparelho de mentira). Uso: node teste/musica.js */
const { contexto, semear, vozDeMentira, vigiar, iniciar } = require('./comum');

const HISTORIA = { id: 'teste_1', titulo: 'Historia de teste', idade: '6-9', tema: 'lua', personagens: '', serie: '', ordem: 0,
  criadaEm: '2026-10-01T10:00:00.000Z', texto: 'Era uma vez uma estrela pequena. Ela brilhava devagar. A noite ficou calma.' };
let falhas = 0;
const conf = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) falhas++; };

// espia o <audio> da música e o volume dela (o ganho do WebAudio criado logo antes de ligar o <audio>)
function espiar() {
  const AC = window.AudioContext || window.webkitAudioContext;
  const cg = AC.prototype.createGain;
  AC.prototype.createGain = function () { const g = cg.call(this); this.__ultimo = g; return g; };
  const cm = AC.prototype.createMediaElementSource;
  AC.prototype.createMediaElementSource = function (el) { window.__mus = el; window.__ganho = this.__ultimo; return cm.call(this, el); };
  window.__oculto = false;
  Object.defineProperty(document, 'hidden', { get: () => window.__oculto, configurable: true });
}
async function abrir(browser, base, cfg, opc) {
  const { ctx } = await contexto(browser, base, opc);
  await vozDeMentira(ctx);
  await ctx.addInitScript(espiar);
  await ctx.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { const e = document.createElement('style'); e.textContent = '#assist-balao,#assist-dica,#assist-btn{display:none!important}'; document.head.appendChild(e); }); });
  await semear(ctx, { ch_config: Object.assign({ motorVoz: 'nativo', carregarGithub: false }, cfg || {}), ch_historias: [HISTORIA], ch_assist: { tour: true, vistas: {} } });
  const page = await ctx.newPage();
  const erros = []; vigiar(page, erros);
  await page.goto(base + '/index.html');
  await page.waitForSelector('#tela-inicio', { state: 'attached' });
  await page.waitForTimeout(700);
  return { ctx, page, erros };
}
const estado = (page) => page.evaluate(() => {
  const a = window.__mus;
  return a ? { arq: (a.getAttribute('src') || '').replace(/^.*\//, ''), parada: a.paused, vol: window.__ganho ? Math.round(window.__ganho.gain.value * 1000) / 1000 : null, tempo: a.currentTime } : null;
});
const esperar = async (page, fn, ms) => { const t0 = Date.now(); let e; while (Date.now() - t0 < (ms || 8000)) { e = await estado(page); if (fn(e)) return e; await page.waitForTimeout(150); } return e; };
const perto = (v, alvo) => v !== null && Math.abs(v - alvo) < 0.02;

(async () => {
  const { base, browser, fechar } = await iniciar();
  try {
    console.log('1. Abertura e escolher a história');
    let { ctx, page, erros } = await abrir(browser, base);
    conf(await estado(page) === null, 'antes de tocar na tela: nenhuma música (o navegador não deixaria)');
    await page.mouse.click(200, 300);
    let e = await esperar(page, (x) => x && !x.parada && x.tempo > 0.3 && perto(x.vol, 0.48));
    conf(e && e.arq === 'happy-whistling-ukulele.mp3' && !e.parada, 'primeiro toque: começa a da abertura (Happy Whistling Ukulele), animada');
    conf(e && perto(e.vol, 0.48), 'volume da abertura: 60% × 0,8 = 0,48 (' + (e && e.vol) + ')');
    conf(e && e.tempo > 0.3, 'o MP3 toca de verdade no navegador (' + (e && e.tempo.toFixed(1)) + ' s)');
    await page.click('nav.tabs button[data-tela=acervo]'); await page.waitForTimeout(400);
    conf((await estado(page)).arq === 'happy-whistling-ukulele.mp3', 'trocar de aba no meio da abertura não corta a abertura');
    await page.evaluate(() => window.__mus.dispatchEvent(new Event('ended')));
    e = await esperar(page, (x) => x.arq === 'spring-chicken.mp3' && perto(x.vol, 0.27));
    conf(e.arq === 'spring-chicken.mp3' && perto(e.vol, 0.27), 'acabou a abertura: entra a de escolher a história, mais leve (0,27)');
    await page.evaluate(() => window.__mus.dispatchEvent(new Event('ended')));
    e = await esperar(page, (x) => x.arq === 'my-giant-bunny-friend.mp3');
    conf(e.arq === 'my-giant-bunny-friend.mp3', 'acabou uma: emenda a próxima da lista');

    console.log('2. História: baixinha, mais baixa com a voz, e some no fim');
    await page.click('#lista-acervo .hist[data-id=teste_1]');
    e = await esperar(page, (x) => x.arq === 'kalimba-relaxation-music.mp3' && perto(x.vol, 0.132));
    conf(e.arq === 'kalimba-relaxation-music.mp3' && perto(e.vol, 0.132), 'abriu a história: troca para a calminha (Kalimba), baixinha (0,132)');
    // a voz de mentira demora um pouco em cada frase, para dar tempo de ver o volume com a voz lendo
    await page.evaluate(() => { window.speechSynthesis.speak = (u) => { window.__falas.push(u.text); setTimeout(() => { try { u.onend && u.onend({}); } catch (x) {} }, 900); }; });
    await page.click('#btn-play');
    e = await esperar(page, (x) => perto(x.vol, 0.072), 4000);
    conf(perto(e.vol, 0.072), 'com a voz lendo: mais baixa ainda (0,072)');
    await page.waitForFunction(() => /fim da história/.test((document.querySelector('#leitor-status') || {}).textContent || ''), null, { timeout: 20000 });
    e = await esperar(page, (x) => x.parada, 12000);
    conf(e.parada && e.vol < 0.01, 'fim da história: a música some devagar e para (hora de dormir)');
    await page.click('#btn-fechar-leitor'); await page.waitForTimeout(800);
    conf((await estado(page)).parada, 'fechar a história depois do fim não acorda a música alegre');
    await page.click('nav.tabs button[data-tela=inicio]');
    e = await esperar(page, (x) => !x.parada && x.arq === 'my-giant-bunny-friend.mp3');
    conf(!e.parada && e.arq === 'my-giant-bunny-friend.mp3', 'trocar de aba depois: volta a de escolher a história (a mesma de antes)');

    console.log('3. Outro som do app, sair do app');
    await page.evaluate(() => { const a = new Audio('amostra-voz-premium.wav'); window.__outro = a; a.play().catch(() => {}); });
    e = await esperar(page, (x) => x.vol < 0.01, 4000);
    conf(e.vol < 0.01, 'outro som do app tocando fora da história (amostra da voz): a música abaixa');
    await page.evaluate(() => window.__outro.pause());
    e = await esperar(page, (x) => perto(x.vol, 0.27), 6000);
    conf(perto(e.vol, 0.27), 'o outro som parou: a música volta');
    await page.evaluate(() => { window.__oculto = true; document.dispatchEvent(new Event('visibilitychange')); });
    e = await esperar(page, (x) => x.parada, 3000);
    conf(e.parada, 'saiu do app (fora da história): a música para');
    await page.evaluate(() => { window.__oculto = false; document.dispatchEvent(new Event('visibilitychange')); });
    e = await esperar(page, (x) => !x.parada, 3000);
    conf(!e.parada, 'voltou ao app: a música volta');

    console.log('4. Trocar, escolher, volume, desligar');
    await page.click('nav.tabs button[data-tela=config]'); await page.waitForTimeout(300);
    conf(/Tocando: My Giant Bunny Friend — Bryan Teoh \(domínio público\)/.test(await page.textContent('#mu-tocando')), 'Configurações mostram o que está tocando, o autor e a licença');
    await page.click('#btn-musica-trocar');
    e = await esperar(page, (x) => x.arq === 'inventing-flight.mp3');
    conf(e.arq === 'inventing-flight.mp3', '⏭️ Trocar a música: vai para a próxima');
    await page.selectOption('#mu-sel-navegar', '4');
    e = await esperar(page, (x) => x.arq === 'city-sunshine.mp3');
    conf(e.arq === 'city-sunshine.mp3', 'escolher na lista "Enquanto escolhe a história": toca a escolhida');
    await page.selectOption('#mu-sel-historia', '1');
    await page.fill('#rng-musica', '100'); await page.dispatchEvent('#rng-musica', 'change');
    e = await esperar(page, (x) => perto(x.vol, 0.45), 4000);
    conf(perto(e.vol, 0.45), 'volume da música a 100%: 0,45 enquanto escolhe');
    const c = await page.evaluate(() => JSON.parse(localStorage.getItem('ch_config')));
    conf(c.musicaNavegar === 4 && c.musicaHistoria === 1 && c.volMusica === 100, 'as escolhas e o volume ficam guardados');
    await page.click('#tg-musica');
    e = await esperar(page, (x) => x.parada, 3000);
    conf(e.parada && /desligada/.test(await page.textContent('#mu-tocando')), 'desligar nas Configurações: para');
    await page.click('#btn-perfil-topo'); await page.waitForTimeout(300);
    await page.click('[data-mp=musica]');
    e = await esperar(page, (x) => !x.parada, 3000);
    conf(!e.parada, 'ligar pelo menu 👤 (Música de fundo): volta');
    await page.keyboard.press('Escape').catch(() => {});
    await page.click('nav.tabs button[data-tela=acervo]'); await page.waitForTimeout(300);
    await page.click('#lista-acervo .hist[data-id=teste_1]');
    e = await esperar(page, (x) => x.arq === 'lovely-piano-song.mp3');
    conf(e.arq === 'lovely-piano-song.mp3', 'na história toca a calminha escolhida (Lovely Piano Song)');
    await page.click('#btn-musica-leitor');
    e = await esperar(page, (x) => x.parada, 3000);
    conf(e.parada && (await page.textContent('#btn-musica-leitor')) === '🔇', 'botão 🎶 na história: desliga (vira 🔇)');
    conf(erros.length === 0, 'sem erro de JavaScript' + (erros.length ? ': ' + erros.join(' | ') : ''));
    await ctx.close();

    console.log('5. Desligada fica desligada; economia de dados não começa sozinha');
    ({ ctx, page, erros } = await abrir(browser, base, { musica: false }));
    await page.mouse.click(200, 300); await page.waitForTimeout(1200);
    e = await estado(page);
    conf(e === null || e.parada, 'música desligada: tocar na tela não começa');
    await ctx.close();
    {
      const { ctx: c2 } = await contexto(browser, base);
      await c2.addInitScript(() => { Object.defineProperty(navigator, 'connection', { value: { saveData: true }, configurable: true }); });
      await c2.addInitScript(espiar);
      await semear(c2, { ch_config: { motorVoz: 'nativo', carregarGithub: false }, ch_historias: [HISTORIA], ch_assist: { tour: true, vistas: {} } });
      const p2 = await c2.newPage(); await p2.goto(base + '/index.html'); await p2.waitForTimeout(800);
      await p2.mouse.click(200, 300); await p2.waitForTimeout(1200);
      conf(await estado(p2) === null, 'economia de dados ligada: não começa sozinha');
      await p2.click('nav.tabs button[data-tela=config]'); await p2.click('#btn-musica-trocar');
      e = await esperar(p2, (x) => x && !x.parada, 4000);
      conf(e && !e.parada, '…mas toca quando a pessoa pede (⏭️ Trocar a música)');
      await c2.close();
    }

    console.log('6. Service worker guarda as músicas para tocar sem internet');
    {
      const c3 = await browser.newContext({ serviceWorkers: 'allow' });
      await c3.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, (r) => r.abort());
      const p3 = await c3.newPage();
      await p3.goto(base + '/index.html');
      await p3.evaluate(() => navigator.serviceWorker.ready);
      const lerCache = () => p3.evaluate(() => caches.open('dgo-contador-musicas-v1').then((c) => c.keys()).then((k) => k.map((r) => r.url.replace(/^.*\//, '')).sort()));
      let guardadas = [];
      for (let i = 0; i < 60 && guardadas.length < 3; i++) { await p3.waitForTimeout(500); guardadas = await lerCache(); }
      conf(['happy-whistling-ukulele.mp3', 'kalimba-relaxation-music.mp3', 'spring-chicken.mp3'].every((a) => guardadas.includes(a)), 'ao instalar, guarda a primeira de cada momento (' + guardadas.join(', ') + ')');
      const outras = await p3.evaluate(() => caches.keys());
      conf(outras.some((k) => /^dgo-contador-de-historias-v/.test(k)) && outras.includes('dgo-contador-musicas-v1'), 'as músicas ficam num cache próprio (não somem a cada versão)');
      await c3.setOffline(true);
      const tocou = await p3.evaluate(() => new Promise((ok) => { const a = new Audio('musicas/spring-chicken.mp3'); a.muted = true; a.play().then(() => setTimeout(() => ok(a.currentTime > 0.2), 1200)).catch(() => ok(false)); }));
      conf(tocou, 'sem internet: a música guardada toca');
      await c3.close();
    }
  } finally { await fechar(); }
  console.log(falhas ? '\n' + falhas + ' falha(s).' : '\nTudo certo.');
  process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
