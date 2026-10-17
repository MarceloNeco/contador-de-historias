/* Teste do cofre no Contador de Histórias (v1.22.0): chaves de IA e nomes das crianças saem do texto aberto.
   Só valores de mentira. Internet e voz simuladas. Uso: node teste/cofre-contador.js */
const fs = require('fs');
const { FALSO, PIN, contexto, semear, vozDeMentira, vigiarCsp, vigiar, resolverPin, iniciar } = require('./comum');

const HISTORIA = { id: 'teste_1', titulo: 'Historia de teste', idade: '6-9', tema: 'lua', personagens: '', serie: '', ordem: 0,
  criadaEm: '2026-10-01T10:00:00.000Z', texto: 'Era uma vez uma estrela pequena. Ela brilhava devagar. A noite ficou calma.' };
const OUTROS = { vel: 1.3, tom: 0.9, fonte: 21, tema: 'claro', motorTexto: 'gemini', motorVoz: 'gemini', saudarAntes: true, geminiVoice: 'Kore' };
const STATS = { leituras: 7, segundos: 900, ultimaNoite: '2026-10-01', sequencia: 3 };
const TEXTOS_SEGREDO = Object.values(FALSO);

const falhas = [], erros = [];
const conferir = (ok, msg) => { if (!ok) { falhas.push(msg); console.log('  ✗ ' + msg); } else console.log('  ✓ ' + msg); };

const agoraNao = (page) => page.locator('#solver-cofre button:has-text("Agora não"), #solver-cofre button:has-text("Not now")').first();
/* v1.23.0: com o cofre criado e trancado, ou chaves em texto aberto, o app pede o PIN logo de cara.
   opc.pin: 'criar' (padrão: cria/digita o PIN se a janela aparecer) · 'recusar' (toca em "Agora não") · 'nenhum' (não mexe) */
async function abrir(browser, base, opc) {
  opc = opc || {};
  const { ctx, ped } = await contexto(browser, base, { largura: opc.largura });
  await vozDeMentira(ctx);
  await vigiarCsp(ctx);
  // só para o teste: o balão do AssistONE aparece com o tempo e cobre os botões
  await ctx.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { const e = document.createElement('style'); e.textContent = '#assist-balao,#assist-dica,#assist-btn{display:none!important}'; document.head.appendChild(e); }); });
  const cfg = Object.assign({}, OUTROS, opc.semSegredos ? {} : FALSO, opc.cfg || {});
  const dados = { ch_config: cfg, ch_historias: [HISTORIA], ch_stats: STATS };
  if (opc.extra) Object.assign(dados, opc.extra);
  if (opc.idioma) dados['dgo:global:idioma'] = JSON.stringify(opc.idioma);
  await semear(ctx, dados);
  const page = await ctx.newPage();
  vigiar(page, erros);
  if (opc.relogio) await page.clock.install();
  await page.goto(base + '/index.html' + (opc.hash || ''));
  await page.waitForSelector('#tela-inicio', { state: 'attached' });
  await page.waitForTimeout(600);
  if (opc.pin === 'recusar') {
    try { await page.locator('#solver-cofre [role=dialog]').waitFor({ state: 'visible', timeout: 3500 }); await agoraNao(page).click(); } catch (e) {}
  } else if (opc.pin !== 'nenhum') { await resolverPin(page, PIN, 2500); }
  await page.waitForTimeout(400);
  return { ctx, page, ped };
}
const cspViolacoes = (page) => page.evaluate(() => window.__csp || []);
const lerCfg = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('ch_config') || 'null'));
const cofreCru = (page) => page.evaluate(() => localStorage.getItem('dgo:global:cofre') || '');
const todoOArmazenamento = (page) => page.evaluate(async () => {
  const o = {};
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o['ls:' + k] = localStorage.getItem(k); }
  for (let i = 0; i < sessionStorage.length; i++) { const k = sessionStorage.key(i); o['ss:' + k] = sessionStorage.getItem(k); }
  return JSON.stringify(o);
});
const irConfig = async (page) => { await page.click('nav.tabs button[data-tela=config]'); await page.waitForTimeout(250); };
const criarPinPelaTela = async (page) => {
  if (await page.evaluate(() => window.SolverCofre && SolverCofre.aberto())) { await irConfig(page); return; }
  await irConfig(page);
  await page.click('#btn-cofre-abrir');
  await resolverPin(page, PIN, 4000);
  await page.waitForFunction(() => window.SolverCofre && SolverCofre.aberto());
  await page.waitForTimeout(500);
};
const trancar = async (page) => { await page.evaluate(() => SolverCofre.trancar()); await page.waitForTimeout(300); };
const novaAba = async (ctx, base) => { const p = await ctx.newPage(); vigiar(p, erros); await p.goto(base + '/index.html'); await p.waitForSelector('#tela-inicio', { state: 'attached' }); await p.waitForTimeout(600); return p; };

(async () => {
  const { browser, base, fechar } = await iniciar();
  try {
    /* ============ 1. criar o PIN: chaves e nomes vão para o cofre ============ */
    console.log('\n1. Migração ao criar o PIN');
    {
      const { ctx, page } = await abrir(browser, base, { pin: 'recusar' });
      const antes = await lerCfg(page);
      conferir(TEXTOS_SEGREDO.every((v) => JSON.stringify(antes).includes(v)), 'antes do PIN: os valores de mentira estão no ch_config (ponto de partida)');
      await irConfig(page);
      const painel = await page.locator('#cofre-painel').innerText();
      conferir(/sem proteção/.test(painel), 'antes do PIN: a tela avisa que as chaves estão sem proteção e oferece criar o PIN');
      await criarPinPelaTela(page);
      const depois = await lerCfg(page);
      conferir(!('anthropicKey' in depois) && !('publicoNomes' in depois) && !('nomesProtegidos' in depois), 'saíram do ch_config na hora: chave da Anthropic e os dois campos de nomes');
      conferir(!('geminiKey' in depois) && !('openaiKey' in depois) && !('elevenKey' in depois), 'as chaves do Gemini, da OpenAI e da ElevenLabs também saíram na hora (sem cópia temporária: o Eleições lê pelo cofre)');
      const resto = Object.keys(OUTROS).every((k) => depois[k] === OUTROS[k]);
      conferir(resto, 'o resto do ch_config ficou como estava (voz, tema, fonte, motor…)');
      const stats = await page.evaluate(() => JSON.parse(localStorage.getItem('ch_stats')));
      conferir(JSON.stringify(stats) === JSON.stringify(STATS), 'as estatísticas ficaram intactas');
      await page.click('nav.tabs button[data-tela=acervo]');
      conferir(await page.locator('.hist[data-id=teste_1]').count() === 1, 'as histórias ficaram intactas');
      const cru = await cofreCru(page);
      conferir(TEXTOS_SEGREDO.every((v) => !cru.includes(v)), 'o cofre guardado no navegador não tem nenhum valor em claro');
      const nomes = await page.evaluate(() => SolverCofre.nomes());
      conferir(['ia:gemini', 'ia:openai', 'ia:elevenlabs', 'ia:anthropic', 'contador:publicoNomes', 'contador:nomesProtegidos'].every((n) => nomes.includes(n)), 'o cofre tem os seis nomes: ' + nomes.join(', '));
      const vals = await page.evaluate(() => ({ g: SolverCofre.lerAgora('ia:gemini'), n: SolverCofre.lerAgora('contador:publicoNomes'), a: SolverCofre.lerAgora('ia:anthropic') }));
      conferir(vals.g === FALSO.geminiKey && vals.n === FALSO.publicoNomes && vals.a === FALSO.anthropicKey, 'os valores no cofre são os de antes');
      const saudacao = await page.evaluate(() => document.querySelector('#sub-hd').textContent);
      conferir(/Lia e Davi/.test(saudacao), 'cofre aberto: a saudação do topo mostra os nomes');
      const tela = await page.evaluate(() => ({ g: document.querySelector('#in-gemini-key').value, ph: document.querySelector('#in-gemini-key').placeholder, n: document.querySelector('#in-publico-nomes').value }));
      conferir(tela.g === '' && /••••/.test(tela.ph) && tela.n === FALSO.publicoNomes, 'cofre aberto: a chave aparece só como "••••••••" e os nomes aparecem');
      /* fechar o app e abrir de novo (aba nova = cofre trancado) */
      await trancar(page);
      const trancada = await page.evaluate(() => ({ g: document.querySelector('#in-gemini-key').value, ph: document.querySelector('#in-gemini-key').placeholder, ro: document.querySelector('#in-gemini-key').readOnly,
        n: document.querySelector('#in-publico-nomes').value, phn: document.querySelector('#in-publico-nomes').placeholder, btn: !!document.querySelector('#btn-cofre-abrir'), sub: document.querySelector('#sub-hd').textContent }));
      conferir(trancada.g === '' && trancada.n === '' && trancada.ro, 'cofre trancado: os campos não mostram nada e não deixam digitar');
      conferir(/Guardado no cofre — abrir para ver ou mudar/.test(trancada.ph) && /Guardado no cofre/.test(trancada.phn), 'cofre trancado: os campos dizem "🔐 Guardado no cofre — abrir para ver ou mudar"');
      conferir(!/Lia|Davi/.test(trancada.sub), 'cofre trancado: a saudação do topo não mostra os nomes');
      conferir(trancada.btn, 'cofre trancado: há o botão "Abrir o cofre"');
      /* tocar no campo pede o PIN e mostra o valor */
      await irConfig(page);
      await page.click('#in-gemini-key');
      const pediu = await resolverPin(page, PIN, 3000);
      await page.waitForTimeout(400);
      conferir(pediu, 'tocar num campo trancado abre a janela do PIN');
      const aberto = await page.evaluate(() => ({ v: document.querySelector('#in-gemini-key').value, ph: document.querySelector('#in-gemini-key').placeholder }));
      conferir(aberto.v === '' && /••••/.test(aberto.ph), 'depois do PIN a chave continua escondida (só "Mostrar" com o PIN de novo)');
      conferir(await page.locator('#btn-cofre-trancar').isVisible(), 'há o botão "🔒 Trancar o cofre agora"');
      await page.click('#btn-cofre-trancar'); await page.waitForTimeout(400);
      conferir(!(await page.evaluate(() => SolverCofre.aberto())), '"Trancar o cofre agora" tranca');
      await ctx.close();
    }

    /* ============ 2. gerar história usa a chave e os nomes do cofre ============ */
    console.log('\n2. Gerar história com o cofre');
    {
      const { ctx, page, ped } = await abrir(browser, base);
      await criarPinPelaTela(page);
      await page.click('nav.tabs button[data-tela=nova]');
      await page.fill('#in-tema', 'a lua, a Lia e o Tobias');
      await page.click('#btn-gerar');
      await page.waitForSelector('#ap-salvar', { timeout: 15000 });
      const modal = await page.locator('#modal').innerText();
      const pedido = ped.texto[0] || { corpo: '', chave: '' };
      conferir(pedido.chave === FALSO.geminiKey, 'a chave que foi para o provedor é a do cofre');
      conferir(!/Lia|Davi|Tobias/.test(pedido.corpo) && /\[NOME\d\]/.test(pedido.corpo), 'os nomes (do cofre) foram trocados por códigos antes de sair');
      conferir(/Tobias/.test(modal) && !/\[NOME\d\]/.test(modal), 'os nomes voltaram no texto da história');
      await page.click('#ap-descartar');
      /* cofre trancado → pede o PIN → segue */
      await trancar(page);
      await page.click('nav.tabs button[data-tela=nova]');
      await page.fill('#in-tema', 'a lua, a Lia e o Tobias');
      const antesN = ped.texto.length;
      await page.click('#btn-gerar');
      const pediuPin = await resolverPin(page, PIN, 4000);
      await page.waitForSelector('#ap-salvar', { timeout: 15000 });
      conferir(pediuPin && ped.texto.length === antesN + 1, 'trancado: a ação pediu o PIN e continuou sozinha depois');
      conferir(ped.texto[ped.texto.length - 1].chave === FALSO.geminiKey, 'e usou a chave do cofre');
      await page.click('#ap-descartar');
      /* cofre trancado → "Agora não": NADA sai (nem o nome da criança) */
      await trancar(page);
      await page.click('nav.tabs button[data-tela=nova]');
      await page.fill('#in-tema', 'a lua, a Lia e o Tobias');
      const antes2 = ped.texto.length;
      await page.click('#btn-gerar');
      await page.locator('#solver-cofre [role=dialog]').waitFor({ state: 'visible', timeout: 4000 });
      await page.locator('#solver-cofre button:has-text("Agora não")').click();
      await page.waitForSelector('#mfechar', { timeout: 8000 });
      const msg = await page.locator('#modal').innerText();
      conferir(ped.texto.length === antes2, 'trancado e recusou o PIN: nenhum pedido saiu para o provedor');
      conferir(/cofre de chaves está trancado/.test(msg), 'e a tela explica que o cofre está trancado');
      await page.click('#mfechar');
      await ctx.close();
    }

    /* ============ 3. salvar em Configurações grava só no cofre ============ */
    console.log('\n3. Salvar em Configurações');
    {
      const { ctx, page } = await abrir(browser, base);
      await criarPinPelaTela(page);
      await page.fill('#in-gemini-key', 'AQ.outra-chave-de-mentira-999');
      const espelhoNaHora = await page.evaluate(() => document.querySelector('#in-gemini-key-voz').value);
      await page.fill('#in-publico-nomes', 'Maia e Teo');
      await page.fill('#in-nomes-protegidos', 'Bento');
      await page.click('#sel-motor-texto button[data-motor=gemini]');   // tira o foco: grava
      await page.waitForTimeout(900);
      const v = await page.evaluate(() => ({ g: SolverCofre.lerAgora('ia:gemini'), n: SolverCofre.lerAgora('contador:publicoNomes'), p: SolverCofre.lerAgora('contador:nomesProtegidos'), espelho: '' }));
      conferir(v.g === 'AQ.outra-chave-de-mentira-999' && v.n === 'Maia e Teo' && v.p === 'Bento', 'chave e nomes novos foram para o cofre');
      conferir(espelhoNaHora === 'AQ.outra-chave-de-mentira-999', 'a chave do Gemini digitada aparece igual nos dois lugares da tela');
      const c = await lerCfg(page);
      conferir(!('publicoNomes' in c) && !('nomesProtegidos' in c) && !('anthropicKey' in c) && !('geminiKey' in c), 'nada voltou para o ch_config (a cópia antiga da chave trocada também saiu)');
      conferir(!('openaiKey' in c) && !('elevenKey' in c), 'as outras chaves também não têm mais cópia aberta no ch_config');
      await page.click('#sel-motor-voz button[data-motor=elevenlabs]');
      // apagar uma chave também pede o PIN: "Mostrar" (PIN de novo) e então limpar o campo
      await page.click('[data-mostrar=elevenKey]');
      await resolverPin(page, PIN, 3000);
      await page.waitForTimeout(400);
      await page.fill('#in-eleven-key', '');
      await page.click('#sel-motor-texto button[data-motor=gemini]'); await page.waitForTimeout(700);
      const c2 = await lerCfg(page);
      conferir(!('elevenKey' in c2) && !(await page.evaluate(() => SolverCofre.tem('ia:elevenlabs'))), 'apagar uma chave tira do cofre e da cópia (não ressuscita)');
      await page.reload(); await page.waitForTimeout(900);
      const pediuNoF5 = await resolverPin(page, PIN, 3000);
      await page.waitForTimeout(500);
      const c3 = await lerCfg(page);
      conferir(pediuNoF5, 'recarregar a página (F5) conta como sair do app: o cofre tranca e o PIN é pedido de novo');
      conferir(!('elevenKey' in c3) && (await page.evaluate(() => SolverCofre.aberto())) && !(await page.evaluate(() => SolverCofre.tem('ia:elevenlabs'))), 'depois do PIN: a chave apagada não voltou');
      const tudo = await todoOArmazenamento(page);
      conferir(!['AQ.outra-chave-de-mentira-999', 'Maia e Teo', 'Bento', FALSO.anthropicKey, FALSO.publicoNomes, FALSO.nomesProtegidos, FALSO.geminiKey].some((x) => tudo.includes(x)), 'nenhum valor secreto novo ou antigo em claro no localStorage/sessionStorage');
      await ctx.close();
    }

    /* ============ 4. link novo sem chaves; link antigo com chaves ============ */
    console.log('\n4. Link para outro aparelho');
    {
      const { ctx, page } = await abrir(browser, base);
      await criarPinPelaTela(page);
      await page.click('#btn-transferir');
      await page.waitForSelector('#tr-copiar');
      const textoModal = await page.locator('#modal').innerText();
      conferir(/não viajam/.test(textoModal) && !/contém suas chaves/.test(textoModal), 'a tela do link diz que chaves e nomes não viajam');
      await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base }).catch(() => {});
      await page.click('#tr-copiar'); await page.waitForTimeout(300);
      let link = ''; try { link = await page.evaluate(() => navigator.clipboard.readText()); } catch (e) {}
      if (!link) link = await page.evaluate(() => { const t = document.querySelector('#modal textarea'); return t ? t.value : ''; });
      const m = link.match(/#cfg=(.+)$/);
      const dec = m ? JSON.parse(decodeURIComponent(escape(Buffer.from(m[1], 'base64').toString('binary')))) : {};
      conferir(m && !['gk', 'ek', 'ok', 'ak'].some((k) => k in dec), 'o link novo não tem gk, ek, ok nem ak');
      conferir(m && ![...TEXTOS_SEGREDO, 'Lia', 'Davi', 'Tobias'].some((v) => link.includes(v) || JSON.stringify(dec).includes(v)), 'e não tem nenhuma chave nem nome');
      conferir(dec.mv === 'gemini' && dec.gv === 'Kore', 'mas leva a voz e o modelo');
      await ctx.close();
    }
    {
      /* link antigo: abre num aparelho NOVO (sem nada) */
      const antigo = { mv: 'gemini', gk: 'AQ.chave-antiga-do-link-555', ok: 'sk-antiga-do-link-666', gv: 'Puck' };
      const b64 = Buffer.from(unescape(encodeURIComponent(JSON.stringify(antigo))), 'binary').toString('base64');
      const { ctx, page } = await abrir(browser, base, { semSegredos: true, cfg: {} });
      await page.goto(base + '/index.html#cfg=' + b64);
      await page.reload();
      await page.waitForSelector('#cfg-sim', { timeout: 6000 });
      const aviso = await page.locator('#modal').innerText();
      conferir(/tipo antigo/.test(aviso) && /não é mais gerado/.test(aviso), 'link antigo: aviso de que esse tipo de link não é mais gerado');
      const url = page.url();
      conferir(!url.includes('#cfg='), 'o endereço foi limpo na hora');
      await page.click('#cfg-sim');
      await resolverPin(page, PIN, 4000);
      await page.waitForTimeout(800);
      const v = await page.evaluate(() => ({ g: SolverCofre.lerAgora('ia:gemini'), o: SolverCofre.lerAgora('ia:openai') }));
      conferir(v.g === antigo.gk && v.o === antigo.ok, 'link antigo: as chaves foram para o cofre (depois do PIN)');
      const tudo = await todoOArmazenamento(page);
      conferir(!tudo.includes(antigo.gk) && !tudo.includes(antigo.ok), 'link antigo: as chaves não foram para o ch_config nem para outro lugar em claro');
      const c = await lerCfg(page);
      conferir(c.geminiVoice === 'Puck', 'link antigo: a voz foi aplicada');
      await ctx.close();
    }

    /* ============ 5. cópia protegida e restauração ============ */
    console.log('\n5. Cópia protegida');
    let arquivoCopia = null;
    {
      const { ctx, page } = await abrir(browser, base);
      await criarPinPelaTela(page);
      await trancar(page);                                  // trancado: a cópia pede o PIN antes de começar
      await irConfig(page);
      await page.click('#btn-exportar');
      await page.fill('#cp-senha', 'senha-de-teste-77'); await page.fill('#cp-senha2', 'senha-de-teste-77');
      await page.click('#cp-fazer');
      const pediu = await resolverPin(page, PIN, 4000);
      await page.waitForSelector('#cp-anotei', { timeout: 60000 });
      conferir(pediu, 'cofre trancado: a cópia pede o PIN para levar os nomes');
      await page.check('#cp-anotei');
      const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#cp-baixar')]);
      const crua = fs.readFileSync(await dl.path(), 'utf8');
      arquivoCopia = crua;
      const sub = require('crypto').webcrypto.subtle, b = (s) => Buffer.from(s, 'base64'), obj = JSON.parse(crua);
      const base0 = await sub.importKey('raw', Buffer.from('senha-de-teste-77'), 'PBKDF2', false, ['deriveKey']);
      const k = await sub.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: b(obj.senha.sal), iterations: obj.kdf.rodadas }, base0, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
      const bruta = await sub.decrypt({ name: 'AES-GCM', iv: b(obj.senha.iv) }, k, b(obj.senha.chave));
      const dk = await sub.importKey('raw', bruta, 'AES-GCM', false, ['decrypt']);
      const dentro = JSON.parse(Buffer.from(await sub.decrypt({ name: 'AES-GCM', iv: b(obj.iv) }, dk, b(obj.dados))).toString('utf8'));
      conferir(![FALSO.geminiKey, FALSO.openaiKey, FALSO.elevenKey, FALSO.anthropicKey].some((v) => crua.includes(v) || JSON.stringify(dentro).includes(v)), 'a cópia não leva nenhuma chave (nem cifrada)');
      conferir(dentro.cfg.publicoNomes === FALSO.publicoNomes && dentro.cfg.nomesProtegidos === FALSO.nomesProtegidos, 'os nomes vão, só dentro da parte embaralhada');
      conferir(!crua.includes(FALSO.publicoNomes) && !crua.includes(FALSO.nomesProtegidos), 'o arquivo em si não tem nome nenhum em claro');
      conferir(dentro.cfg.vel === OUTROS.vel && dentro.historias.some((h) => h.id === 'teste_1'), 'e leva as histórias e os outros ajustes');
      await ctx.close();
    }
    {
      /* aparelho novo, sem nada: trazer a cópia manda os nomes para o cofre (cria o PIN) e não para o ch_config */
      const { ctx, page } = await abrir(browser, base, { semSegredos: true, cfg: { vel: 0.95 } });
      await irConfig(page);
      const arq = '/tmp/copia-de-teste.json'; fs.writeFileSync(arq, arquivoCopia);
      await page.setInputFiles('#file-importar', arq);
      await page.fill('#cp-abrir', 'senha-de-teste-77');
      await page.click('#cp-trazer');
      const pediu = await resolverPin(page, PIN, 15000);
      await page.waitForSelector('#cp-ok', { timeout: 30000 });
      const resumo = await page.locator('#modal').innerText();
      conferir(pediu, 'trazer a cópia num aparelho novo pede para criar o PIN (os nomes vão para o cofre)');
      conferir(/nomes das crianças foram para o cofre/.test(resumo), 'e o resumo avisa que os nomes foram para o cofre');
      const n = await page.evaluate(() => SolverCofre.lerAgora('contador:publicoNomes'));
      const c = await lerCfg(page);
      conferir(n === FALSO.publicoNomes && !('publicoNomes' in (c || {})), 'os nomes estão no cofre e não no ch_config');
      fs.unlinkSync(arq);
      await ctx.close();
    }

    /* ============ 6. arquivo de voz (sem senha) não leva o cumprimento com nomes ============ */
    console.log('\n6. Arquivo de voz');
    {
      const { ctx, page, ped } = await abrir(browser, base);
      await criarPinPelaTela(page);
      await page.click('nav.tabs button[data-tela=acervo]');
      await page.click('.hist[data-id=teste_1]');
      await page.waitForSelector('#btn-play'); await page.click('#btn-play');
      await page.waitForFunction(() => document.querySelector('#leitor-status') && /./.test(document.querySelector('#leitor-status').textContent), null, { timeout: 15000 });
      await page.waitForTimeout(3000);
      const guardados = await page.evaluate(() => new Promise((ok) => {
        const rq = indexedDB.open('ch_audio');
        rq.onsuccess = () => { const g = rq.result.transaction('audio', 'readonly').objectStore('audio').getAllKeys(); g.onsuccess = () => ok(g.result.map(String)); g.onerror = () => ok([]); };
        rq.onerror = () => ok([]);
      }));
      conferir(!guardados.some((k) => /^saudacao\|/.test(k)) && guardados.length > 0, 'o cumprimento (que fala os nomes) não ficou guardado no aparelho; o resto da voz sim');
      conferir(ped.voz.length > 0 && ped.voz.some((v) => /Lia e Davi/.test(v.corpo)), 'o cumprimento é gerado na hora, com os nomes só dentro do pedido ao Google');
      await page.evaluate(() => { document.querySelector('#leitor').classList.remove('on'); });
      await irConfig(page);
      const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#btn-voz-exportar')]);
      const buf = fs.readFileSync(await dl.path());
      const tam = buf.readUInt32LE(6), indice = buf.slice(10, 10 + tam).toString('utf8');
      conferir(!/saudacao\|/.test(indice) && !/Lia|Davi/.test(indice), 'o arquivo .chvoz não tem o cumprimento nem nome de criança');
      await ctx.close();
    }

    /* ============ 7. Apagar tudo: os nomes saem do cofre; as chaves ficam ============ */
    console.log('\n7. Apagar tudo');
    {
      const { ctx, page } = await abrir(browser, base);
      await criarPinPelaTela(page);
      const toque = (sel) => page.evaluate((x) => document.querySelector(x).click(), sel);
      await toque('#btn-apagar-tudo');
      await page.waitForSelector('#ap-ja'); await toque('#ap-ja');
      await page.waitForSelector('#ap-sim');
      await Promise.all([page.waitForNavigation({ timeout: 15000 }).catch(() => {}), toque('#ap-sim')]);
      await page.waitForTimeout(1200);
      await page.evaluate(() => SolverCofre.pronto);
      const r = await page.evaluate(() => ({ n: SolverCofre.tem('contador:publicoNomes') || SolverCofre.tem('contador:nomesProtegidos'), g: SolverCofre.tem('ia:gemini') }));
      conferir(!r.n, 'apagar tudo tirou os nomes das crianças do cofre');
      conferir(r.g, 'e deixou as chaves de IA (valem para os outros apps)');
      await ctx.close();
    }

    /* ============ 8. fila de voz com o cofre trancado ============ */
    console.log('\n8. Fila de voz');
    {
      const { ctx, page, ped } = await abrir(browser, base);
      await criarPinPelaTela(page);
      await trancar(page);
      await page.evaluate(() => localStorage.setItem('ch_fila_voz', JSON.stringify({ ids: ['teste_1'], ligada: true, feitas: 0, parou: '' })));
      const p2 = await novaAba(ctx, base);
      await p2.locator('#solver-cofre [role=dialog]').waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
      const apareceu = await p2.locator('#solver-cofre [role=dialog]').isVisible();
      conferir(apareceu, 'a fila de voz, ao abrir o app com o cofre trancado, pede o PIN');
      if (apareceu) {
        // a abertura pede o PIN e a fila pode pedir de novo: recusa todas até a fila pausar (no máximo ~12 s)
        for (let k = 0; k < 24; k++) {
          if (await p2.locator('#solver-cofre [role=dialog]').isVisible()) await agoraNao(p2).click();
          const lig = await p2.evaluate(() => JSON.parse(localStorage.getItem('ch_fila_voz')).ligada);
          if (!lig) break;
          await p2.waitForTimeout(500);
        }
        const fila = await p2.evaluate(() => JSON.parse(localStorage.getItem('ch_fila_voz')));
        conferir(fila.ligada === false && ped.voz.length === 0, 'recusou o PIN: a fila pausou e nenhuma voz foi pedida (ligada=' + fila.ligada + ', parou="' + (fila.parou || '').slice(0, 60) + '", vozes pedidas=' + ped.voz.length + ')');
      }
      await ctx.close();
    }

    /* ============ 9. inglês e 320 px ============ */
    console.log('\n9. Inglês e tela pequena');
    {
      const { ctx, page } = await abrir(browser, base, { idioma: 'en', largura: 320, pin: 'recusar' });
      await irConfig(page);
      const painelEn = await page.locator('#cofre-painel').innerText();
      conferir(/unprotected|Create the PIN/.test(painelEn), 'em inglês: o aviso do cofre está em inglês');
      await criarPinPelaTela(page);
      await trancar(page);
      const en = await page.evaluate(() => ({ ph: document.querySelector('#in-gemini-key').placeholder, p: document.querySelector('#cofre-painel').textContent }));
      conferir(/Saved in the vault/.test(en.ph) && /Vault locked/.test(en.p), 'em inglês: campos e painel trancados dizem "Saved in the vault" / "Vault locked"');
      const rolagem = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      conferir(rolagem <= 1, '320 px: Configurações sem rolagem lateral (sobra ' + rolagem + ' px)');
      await page.click('#in-gemini-key');
      await page.locator('#solver-cofre [role=dialog]').waitFor({ state: 'visible', timeout: 3000 });
      const jan = await page.evaluate(() => { const c = document.querySelector('#solver-cofre .sc-caixa').getBoundingClientRect(); return { l: c.left, r: c.right, w: window.innerWidth }; });
      conferir(jan.l >= 0 && jan.r <= jan.w + 1, '320 px: a janela do PIN cabe na tela');
      await page.locator('#solver-cofre button:has-text("Not now")').click();
      for (const t of ['inicio', 'acervo', 'nova']) {
        await page.click('nav.tabs button[data-tela=' + t + ']'); await page.waitForTimeout(200);
        const r = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        conferir(r <= 1, '320 px: tela ' + t + ' sem rolagem lateral');
      }
      await ctx.close();
    }

    /* ============ 10. abertura: PIN logo de cara, nada de nome antes dele, janela do PIN endurecida ============ */
    console.log('\n10. Abertura e janela do PIN');
    {
      const { ctx, page } = await abrir(browser, base, { pin: 'nenhum' });
      const jan = page.locator('#solver-cofre [role=dialog]');
      await jan.waitFor({ state: 'visible', timeout: 4000 });
      conferir(await jan.isVisible(), 'chaves em texto aberto: o app abre já pedindo para criar o PIN');
      const antes = await page.evaluate(() => ({ topo: document.querySelector('#sub-hd').textContent, corpo: document.body.innerText + ' ' + Array.from(document.querySelectorAll('input,textarea')).map((e) => e.value).join(' ') }));
      conferir(!/Lia|Davi|Tobias/.test(antes.topo), 'antes do PIN o cabeçalho não mostra nome: "' + antes.topo.trim() + '"');
      conferir(!/Lia|Davi|Tobias/.test(antes.corpo), 'antes do PIN nenhum nome de criança aparece em lugar nenhum da tela');
      const marcaLembrar = await page.evaluate(() => { const l = document.querySelector('#solver-cofre .sc-marca'); return l ? getComputedStyle(l).display : 'sem'; });
      conferir(marcaLembrar === 'none' || marcaLembrar === 'sem', '"Lembrar neste aparelho" não aparece');
      const campos = await page.evaluate(() => Array.from(document.querySelectorAll('#solver-cofre input[type=password]')).map((i) => ({ t: i.type, ac: i.autocomplete, sp: i.spellcheck, im: i.inputMode })));
      conferir(campos.length === 2 && campos.every((c) => c.t === 'password' && c.ac === 'off' && c.sp === false), 'os campos do PIN são de senha (pontinhos), sem autocompletar e sem corretor');
      const copia = await page.evaluate(() => { const i = document.querySelector('#solver-cofre input[type=password]'); const ev = new Event('copy', { cancelable: true, bubbles: true }); i.dispatchEvent(ev); const ev2 = new Event('cut', { cancelable: true, bubbles: true }); i.dispatchEvent(ev2); return ev.defaultPrevented && ev2.defaultPrevented; });
      conferir(copia, 'não dá para copiar nem recortar o PIN');
      /* mesmo marcando "lembrar" à força, nada é gravado no aparelho */
      await page.evaluate(() => { const l = document.querySelector('#sc-lembrar'); if (l) l.checked = true; });
      const campos2 = page.locator('#solver-cofre input[type=password]');
      await campos2.nth(0).fill(PIN); await campos2.nth(1).fill(PIN);
      await page.locator('#solver-cofre button[type=submit]').click();
      await jan.waitFor({ state: 'hidden', timeout: 8000 });
      await page.waitForTimeout(500);
      const lem = await page.evaluate(() => new Promise((ok) => {
        const rq = indexedDB.open('solverone-cofre');
        rq.onsuccess = () => { try { const g = rq.result.transaction('chaves', 'readonly').objectStore('chaves').get('aparelho'); g.onsuccess = () => ok({ lembrado: SolverCofre.lembrado(), chaveNoIdb: !!g.result }); g.onerror = () => ok({ lembrado: SolverCofre.lembrado(), chaveNoIdb: false }); } catch (e) { ok({ lembrado: SolverCofre.lembrado(), chaveNoIdb: false }); } };
        rq.onerror = () => ok({ lembrado: SolverCofre.lembrado(), chaveNoIdb: false });
      }));
      conferir(!lem.lembrado && !lem.chaveNoIdb, 'mesmo forçando "lembrar", nenhuma chave de aparelho é gravada (cofre sem a opção)');
      const depois = await page.evaluate(() => document.querySelector('#sub-hd').textContent);
      conferir(/Lia e Davi/.test(depois), 'depois do PIN os nomes aparecem no cabeçalho');
      await ctx.close();
    }
    {
      /* cofre.js 1.1.0 não tem mais "Lembrar neste aparelho": mesmo pedindo, nada é lembrado e a abertura seguinte pede o PIN
         (o caso de quem já tinha a chave do aparelho da 1.0.0 é testado no teste do próprio cofre.js, no rootify-one) */
      const { ctx, page } = await abrir(browser, base, { semSegredos: true, pin: 'nenhum' });
      await page.evaluate(async (pin) => { await SolverCofre.criar(pin); }, PIN);
      await page.evaluate(async () => { await SolverCofre.gravar('contador:publicoNomes', 'Lia e Davi'); await SolverCofre.gravar('ia:gemini', 'AQ.chave-de-mentira-legado'); });
      const lembrou = await page.evaluate(async () => { const r = await SolverCofre.lembrarAparelho(); return { r, lembrado: SolverCofre.lembrado() }; });
      conferir(lembrou.r === false && !lembrou.lembrado, 'pedir "lembrar neste aparelho" não faz nada (cofre 1.1.0)');
      await page.close();
      const nova = await ctx.newPage(); vigiar(nova, erros);
      await nova.goto(base + '/index.html'); await nova.waitForSelector('#tela-inicio', { state: 'attached' }); await nova.waitForTimeout(1500);
      const estado = await nova.evaluate(() => ({ aberto: SolverCofre.aberto(), lembrado: SolverCofre.lembrado(), topo: document.querySelector('#sub-hd').textContent, dialogo: !!document.querySelector('#solver-cofre [role=dialog]') }));
      conferir(!estado.aberto && !estado.lembrado && estado.dialogo, 'aba nova: o cofre está trancado e o app pede o PIN');
      conferir(!/Lia|Davi/.test(estado.topo), 'sem entrar com o PIN, o cabeçalho não mostra nome');
      await resolverPin(nova, PIN, 3000); await nova.waitForTimeout(500);
      conferir(/Lia e Davi/.test(await nova.evaluate(() => document.querySelector('#sub-hd').textContent)), 'com o PIN, os nomes voltam');
      await ctx.close();
    }

    /* ============ 11. chaves mascaradas e "Mostrar" pede o PIN de novo ============ */
    console.log('\n11. Chaves mascaradas');
    {
      const { ctx, page } = await abrir(browser, base, { relogio: true });
      await irConfig(page);
      const campo = () => page.evaluate(() => ({ v: document.querySelector('#in-gemini-key').value, ph: document.querySelector('#in-gemini-key').placeholder, t: document.querySelector('#in-gemini-key').type, ac: document.querySelector('#in-gemini-key').autocomplete }));
      let c = await campo();
      conferir(c.v === '' && /••••/.test(c.ph) && c.t === 'password' && c.ac === 'off', 'com o cofre aberto a chave aparece como "••••••••" (campo de senha, sem autocompletar)');
      const tudo = await page.evaluate(() => document.body.innerText + JSON.stringify(Array.from(document.querySelectorAll('input')).map((i) => i.value + i.placeholder)));
      conferir(!tudo.includes(FALSO.geminiKey) && !tudo.includes(FALSO.openaiKey) && !tudo.includes(FALSO.elevenKey) && !tudo.includes(FALSO.anthropicKey), 'nenhuma chave inteira aparece na tela');
      conferir(await page.locator('#cfg-txt-gemini [data-mostrar=geminiKey]').isVisible(), 'há o botão "Mostrar a chave (pede o PIN)"');
      const copiou = await page.evaluate(() => { const i = document.querySelector('#in-gemini-key'); const e = new Event('copy', { cancelable: true, bubbles: true }); i.dispatchEvent(e); return e.defaultPrevented; });
      conferir(copiou, 'o campo da chave não deixa copiar');
      await page.click('#cfg-txt-gemini [data-mostrar=geminiKey]');
      const pediu = await resolverPin(page, PIN, 3000); await page.waitForTimeout(400);
      c = await campo();
      conferir(pediu && c.v === FALSO.geminiKey, '"Mostrar" tranca e pede o PIN de novo; com o PIN a chave aparece');
      await page.clock.fastForward(31000); await page.waitForTimeout(300);
      c = await campo();
      conferir(c.v === '' && /••••/.test(c.ph), 'depois de 30 segundos a chave volta a ficar escondida');
      await ctx.close();
    }

    /* ============ 12. trancar sozinho ============ */
    console.log('\n12. Bloqueio automático');
    {
      const { ctx, page } = await abrir(browser, base, { relogio: true });
      const aberto = () => page.evaluate(() => SolverCofre.aberto());
      conferir(await aberto(), 'ponto de partida: cofre aberto');
      await page.clock.fastForward(4 * 60 * 1000); await page.waitForTimeout(200);
      conferir(await aberto(), 'com 4 minutos sem uso ainda está aberto');
      await page.evaluate(() => document.dispatchEvent(new Event('pointerdown', { bubbles: true })));
      await page.clock.fastForward(4 * 60 * 1000); await page.waitForTimeout(200);
      conferir(await aberto(), 'mexer no app zera a contagem (4 + 4 minutos, com um toque no meio, continua aberto)');
      await page.clock.fastForward(60 * 1000 + 20000); await page.waitForTimeout(300);
      conferir(!(await aberto()), 'passados 5 minutos sem uso o cofre tranca sozinho');
      conferir(!/Lia|Davi/.test(await page.evaluate(() => document.querySelector('#sub-hd').textContent)), 'e os nomes somem do cabeçalho');
      await ctx.close();
    }
    {
      /* v1.25.0: escondido por mais de 1 minuto tranca; menos de 1 minuto, não; ao voltar, pede o PIN */
      const { ctx, page } = await abrir(browser, base, { relogio: true });
      const esconder = () => page.evaluate(() => { Object.defineProperty(document, 'hidden', { get: () => true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
      const mostrar = () => page.evaluate(() => { Object.defineProperty(document, 'hidden', { get: () => false, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
      await esconder();
      await page.clock.fastForward(30 * 1000); await page.waitForTimeout(200);
      conferir(await page.evaluate(() => SolverCofre.aberto()), 'escondido por 30 segundos: o cofre ainda está aberto');
      await page.clock.fastForward(40 * 1000); await page.waitForTimeout(300);
      conferir(!(await page.evaluate(() => SolverCofre.aberto())), 'escondido por mais de 1 minuto: o cofre tranca');
      await mostrar();
      await page.locator('#solver-cofre [role=dialog]').waitFor({ state: 'visible', timeout: 4000 });
      conferir(true, 'ao voltar para o app, o PIN é pedido de novo');
      await ctx.close();
    }
    {
      /* voltar depois de muito tempo (o navegador pode ter congelado os relógios): a conferência roda ao voltar, antes de mostrar qualquer coisa */
      const { ctx, page } = await abrir(browser, base, { relogio: true });
      await page.evaluate(() => { Object.defineProperty(document, 'hidden', { get: () => true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
      await page.clock.runFor(1000);
      await page.clock.setFixedTime(Date.now() + 90 * 60 * 1000);                      // 1 hora e meia depois, sem os relógios terem rodado
      await page.evaluate(() => { Object.defineProperty(document, 'hidden', { get: () => false, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
      await page.waitForTimeout(300);
      conferir(!(await page.evaluate(() => SolverCofre.aberto())) && !/Lia|Davi/.test(await page.evaluate(() => document.querySelector('#sub-hd').textContent)), 'voltar depois de 1h30: o cofre já está trancado e o cabeçalho sem nomes');
      await ctx.close();
    }
    {
      /* áudio tocando adia tudo; terminou, tranca. Leitor aberto e PARADO não segura mais nada */
      const { ctx, page } = await abrir(browser, base, { relogio: true });
      await page.evaluate(() => { document.body.classList.add('com-leitor'); document.querySelector('#btn-play').textContent = '⏸'; });     // áudio tocando
      await page.clock.fastForward(6 * 60 * 1000); await page.waitForTimeout(300);
      conferir(await page.evaluate(() => SolverCofre.aberto()), 'áudio tocando: passam 6 minutos e o cofre NÃO tranca');
      await page.evaluate(() => { Object.defineProperty(document, 'hidden', { get: () => true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
      await page.clock.fastForward(2 * 60 * 1000); await page.waitForTimeout(300);
      conferir(await page.evaluate(() => SolverCofre.aberto()), 'áudio tocando: nem escondido por 2 minutos');
      await page.evaluate(() => { document.querySelector('#btn-play').textContent = '▶'; });                                                   // o áudio parou
      await page.clock.fastForward(20000); await page.waitForTimeout(300);
      conferir(!(await page.evaluate(() => SolverCofre.aberto())), 'o áudio parou: o cofre tranca logo');
      await ctx.close();
    }
    {
      const { ctx, page } = await abrir(browser, base, { relogio: true });
      await page.evaluate(() => { document.body.classList.add('com-leitor'); document.querySelector('#btn-play').textContent = '▶'; });     // leitor aberto, PARADO
      await page.clock.fastForward(5 * 60 * 1000 + 20000); await page.waitForTimeout(300);
      conferir(!(await page.evaluate(() => SolverCofre.aberto())), 'leitor aberto mas parado não segura o cofre: tranca em 5 minutos');
      await ctx.close();
    }
    {
      /* "ocupado" (geração de história) só adia o relógio de 5 minutos; escondido por 1 minuto tranca mesmo assim; o console diz o que adiou */
      const { ctx, page } = await abrir(browser, base, { relogio: true });
      const avisos = []; page.on('console', (m) => { if (m.type() === 'info' && /\[cofre\]/.test(m.text())) avisos.push(m.text()); });
      await page.evaluate(() => { document.querySelector('#btn-gerar').disabled = true; });                                                   // geração em andamento
      await page.clock.fastForward(6 * 60 * 1000); await page.waitForTimeout(300);
      conferir(await page.evaluate(() => SolverCofre.aberto()), '"ocupado" (gerando história): 6 minutos parado e o cofre não tranca');
      conferir(avisos.some((m) => /adiado.*gerando-historia/.test(m)), 'o console diz qual condição adiou: ' + (avisos[0] || '(nada)'));
      conferir(!avisos.some((m) => /AQ\.|sk-|Lia|Davi|Tobias/.test(m)), 'e a mensagem não tem segredo nenhum');
      await page.evaluate(() => { Object.defineProperty(document, 'hidden', { get: () => true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
      await page.clock.fastForward(70 * 1000); await page.waitForTimeout(300);
      conferir(!(await page.evaluate(() => SolverCofre.aberto())), '"ocupado" não segura o app escondido por mais de 1 minuto: tranca');
      await ctx.close();
    }
    {
      /* pagehide tranca (a não ser que um áudio esteja tocando) */
      const { ctx, page } = await abrir(browser, base, { relogio: true });
      await page.evaluate(() => { document.body.classList.add('com-leitor'); document.querySelector('#btn-play').textContent = '⏸'; window.dispatchEvent(new Event('pagehide')); });
      await page.waitForTimeout(300);
      conferir(await page.evaluate(() => SolverCofre.aberto()), 'pagehide com áudio tocando: não tranca');
      await page.evaluate(() => { document.querySelector('#btn-play').textContent = '▶'; window.dispatchEvent(new Event('pagehide')); });
      await page.waitForTimeout(300);
      conferir(!(await page.evaluate(() => SolverCofre.aberto())), 'pagehide sem áudio tocando: tranca');
      await ctx.close();
    }
    {
      /* recarregar SEMPRE pede o PIN, mesmo com trabalho rodando e o cofre aberto */
      const { ctx, page } = await abrir(browser, base);
      await page.evaluate(() => { document.querySelector('#btn-gerar').disabled = true; });
      conferir(await page.evaluate(() => SolverCofre.aberto()), 'ponto de partida: cofre aberto');
      await page.reload();
      await page.waitForSelector('#tela-inicio', { state: 'attached' });
      await page.locator('#solver-cofre [role=dialog]').waitFor({ state: 'visible', timeout: 5000 });
      const r = await page.evaluate(() => ({ aberto: SolverCofre.aberto(), topo: document.querySelector('#sub-hd').textContent, corpo: document.body.innerText + Array.from(document.querySelectorAll('input')).map((i) => i.value).join(' ') }));
      conferir(!r.aberto, 'recarregar a página: o cofre abre trancado e o PIN é pedido');
      conferir(!/Lia|Davi|Tobias/.test(r.topo) && !/Lia|Davi|Tobias/.test(r.corpo), 'e antes do PIN nenhum nome aparece (cabeçalho e telas)');
      await ctx.close();
    }
    {
      /* recarregar de novo com o cofre aberto e sem nenhum trabalho: o mesmo */
      const { ctx, page } = await abrir(browser, base);
      await page.reload();
      await page.locator('#solver-cofre [role=dialog]').waitFor({ state: 'visible', timeout: 5000 });
      conferir(!(await page.evaluate(() => SolverCofre.aberto())), 'recarregar (sem trabalho): também pede o PIN');
      await ctx.close();
    }

    /* ============ 13. CSP e saudação ============ */
    console.log('\n13. CSP e cumprimento');
    {
      const { ctx, page } = await abrir(browser, base);
      conferir(await page.evaluate(() => !!document.querySelector('meta[http-equiv="Content-Security-Policy"]')), 'a página tem a Content-Security-Policy');
      for (const t of ['acervo', 'nova', 'config', 'inicio']) { await page.click('nav.tabs button[data-tela=' + t + ']'); await page.waitForTimeout(250); }
      const v1 = await cspViolacoes(page);
      conferir(v1.length === 0, 'nenhuma tela quebrou por causa da CSP (violações: ' + (v1.join(' | ') || 'zero') + ')');
      const inline = await page.evaluate(() => { const e = document.createElement('script'); e.textContent = 'window.__x=1'; document.head.appendChild(e); return window.__x === 1; });
      conferir(!inline, 'script escrito dentro da página é bloqueado');
      const fora = await page.evaluate(() => fetch('https://exemplo-nao-liberado.test/').then(() => 'passou', () => 'bloqueou'));
      const v2 = await cspViolacoes(page);
      conferir(fora === 'bloqueou' && v2.some((x) => /connect-src/.test(x)), 'pedido para uma origem fora da lista é bloqueado (connect-src)');
      /* cumprimentos antigos (com nomes na chave) são apagados na abertura */
      await page.evaluate(() => new Promise((ok) => { const rq = indexedDB.open('ch_audio'); rq.onsuccess = () => { const t = rq.result.transaction('audio', 'readwrite'); t.objectStore('audio').put(new Blob(['x']), 'saudacao|gemini|Sulafat|x|Olá Lia e Davi, vamos ouvir uma historinha?'); t.oncomplete = () => ok(); }; }));
      await page.reload(); await page.waitForTimeout(1200); await resolverPin(page, PIN, 2500); await page.waitForTimeout(800);
      const restou = await page.evaluate(() => new Promise((ok) => { const rq = indexedDB.open('ch_audio'); rq.onsuccess = () => { const g = rq.result.transaction('audio', 'readonly').objectStore('audio').getAllKeys(); g.onsuccess = () => ok(g.result.map(String).filter((k) => /^saudacao\|/.test(k)).length); }; }));
      conferir(restou === 0, 'os cumprimentos antigos que estavam guardados foram apagados na abertura');
      await ctx.close();
    }

    /* ============ 14. indicador, "Mostrar" que mostra, digitar com sinal de que guardou, texto de ajuda ============ */
    console.log('\n14. Indicador, Mostrar, guardado e ajuda');
    {
      const { ctx, page } = await abrir(browser, base, { largura: 320 });
      const ind = () => page.evaluate(() => { const b = document.querySelector('#btn-cofre'); return { visivel: !b.hidden && getComputedStyle(b).display !== 'none', txt: b.textContent, rotulo: b.getAttribute('aria-label') }; });
      let i = await ind();
      conferir(i.visivel && i.txt === '🔓' && /aberto/.test(i.rotulo), 'cabeçalho: com o cofre aberto aparece 🔓 "Cofre aberto — toque para trancar agora"');
      conferir(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth) <= 1, 'cabeçalho com o indicador cabe em 320 px (sem rolagem lateral)');
      await page.click('#btn-cofre'); await page.waitForTimeout(400);
      i = await ind();
      conferir(!(await page.evaluate(() => SolverCofre.aberto())) && i.txt === '🔒' && /trancado/.test(i.rotulo), 'tocar no 🔓 tranca na hora e o indicador vira 🔒');
      conferir(!/Lia|Davi/.test(await page.evaluate(() => document.querySelector('#sub-hd').textContent)), 'trancado: cabeçalho e saudação neutros');
      await page.click('#btn-cofre');
      await resolverPin(page, PIN, 3000); await page.waitForTimeout(400);
      i = await ind();
      conferir((await page.evaluate(() => SolverCofre.aberto())) && i.txt === '🔓', 'tocar no 🔒 pede o PIN e o indicador volta a 🔓');
      await ctx.close();
    }
    {
      const { ctx, page } = await abrir(browser, base, { semSegredos: true, pin: 'nenhum' });
      conferir(!(await page.locator('#btn-cofre').isVisible()), 'sem cofre e sem nada guardado: o indicador não aparece');
      await ctx.close();
    }
    {
      const { ctx, page } = await abrir(browser, base, { relogio: true });
      await irConfig(page);
      const tipo = () => page.evaluate(() => ({ t: document.querySelector('#in-gemini-key').type, v: document.querySelector('#in-gemini-key').value }));
      let c = await tipo();
      conferir(c.t === 'password' && c.v === '', 'chave escondida: campo de senha e vazio');
      await page.click('#cfg-txt-gemini [data-mostrar=geminiKey]');
      await resolverPin(page, PIN, 3000); await page.waitForTimeout(400);
      c = await tipo();
      conferir(c.t === 'text' && c.v === FALSO.geminiKey, '"Mostrar a chave": o campo vira texto e mostra a chave de verdade');
      conferir(await page.locator('#cfg-txt-gemini [data-olho=geminiKey]').isHidden(), 'v1.25.2: com a chave mostrada não aparece o 👁 (só "Esconder a chave")');
      await page.clock.fastForward(31000); await page.waitForTimeout(300);
      c = await tipo();
      conferir(c.t === 'password' && c.v === '', 'passados 30 segundos o campo volta a ser de senha, escondido');
      await page.click('#cfg-txt-gemini [data-mostrar=geminiKey]');
      await resolverPin(page, PIN, 3000); await page.waitForTimeout(400);
      await page.click('#cfg-txt-gemini [data-mostrar=geminiKey]'); await page.waitForTimeout(300);
      c = await tipo();
      conferir(c.t === 'password' && c.v === '', '"Esconder a chave" também volta para senha na hora');
      await ctx.close();
    }
    {
      const { ctx, page } = await abrir(browser, base);
      await irConfig(page);
      await page.fill('#in-gemini-key', 'abc');
      await page.evaluate(() => { document.activeElement.blur(); });
      await page.waitForTimeout(9500);   // passada a folga de 8 s o campo volta a esconder e o 👁 some junto
      const e = await page.evaluate(() => { const i = document.querySelector('#in-gemini-key'), o = document.querySelector('#cfg-txt-gemini [data-olho=geminiKey]'); return { v: i.value, h: o.hidden }; });
      conferir(e.v === '' && e.h === true, 'v1.25.1: campo escondido (vazio) = botão 👁 também escondido');
      await ctx.close();
    }
    {
      const { ctx, page } = await abrir(browser, base);
      await irConfig(page);
      const dialogos0 = await page.locator('#solver-cofre [role=dialog]').count();
      await page.fill('#in-gemini-key', 'abc');
      const olho = page.locator('#cfg-txt-gemini [data-olho=geminiKey]');
      conferir(await olho.isVisible(), 'ao digitar uma chave aparece o botão 👁');
      conferir((await page.evaluate(() => document.querySelector('#in-gemini-key').type)) === 'password', 'o que se digita aparece em pontinhos');
      await olho.click();
      const v = await page.evaluate(() => ({ t: document.querySelector('#in-gemini-key').type, v: document.querySelector('#in-gemini-key').value }));
      conferir(v.t === 'text' && v.v === 'abc', '👁 mostra o que está sendo digitado, sem pedir PIN ("abc")');
      await page.waitForTimeout(900);
      conferir((await page.evaluate(() => SolverCofre.lerAgora('ia:gemini'))) === 'abc', 'o valor guardado é exatamente o digitado ("abc" digitado, "abc" lido do cofre)');
      const fb = await page.evaluate(() => { const g = document.querySelector('#cfg-txt-gemini [data-guardado=geminiKey]'); return { vis: !g.hidden && getComputedStyle(g).display !== 'none', txt: g.textContent, toast: document.querySelector('#toast').textContent }; });
      conferir(fb.vis && /guardado/.test(fb.txt), 'aparece "✓ guardado" ao lado do campo');
      conferir(/Guardado no cofre/.test(fb.toast), 'e o aviso "✓ Guardado no cofre"');
      conferir((await page.locator('#solver-cofre [role=dialog]').count()) === dialogos0, 'digitar com o cofre aberto não pediu PIN');
      await olho.click();
      conferir((await page.evaluate(() => document.querySelector('#in-gemini-key').type)) === 'password', '🙈 volta a esconder o que se digita');
      /* a máscara nunca vira valor */
      await page.fill('#in-gemini-key', '••••••••'); await page.click('#sel-motor-texto button[data-motor=gemini]'); await page.waitForTimeout(900);
      conferir((await page.evaluate(() => SolverCofre.lerAgora('ia:gemini'))) === 'abc', 'a máscara "••••••••" nunca é guardada como chave (continua "abc")');
      /* nomes: mesmo sinal e valor exato */
      await page.fill('#in-publico-nomes', 'Maia e Teo'); await page.waitForTimeout(900);
      const nm = await page.evaluate(() => { const g = document.querySelector('[data-guardado=publicoNomes]'); return { v: SolverCofre.lerAgora('contador:publicoNomes'), vis: !g.hidden, txt: g.textContent }; });
      conferir(nm.v === 'Maia e Teo' && nm.vis && /guardado/.test(nm.txt), 'nomes: guardados exatamente como digitados, com "✓ guardado" ao lado');
      await ctx.close();
    }
    {
      for (const [idioma, esperado] of [[null, ['Pede o PIN', 'Não pede o PIN', 'Tranca sozinho']], ['en', ['Asks for the PIN', 'Does not ask for the PIN', 'Locks by itself']]]) {
        const { ctx, page } = await abrir(browser, base, idioma ? { idioma } : {});
        await irConfig(page);
        const txt = await page.evaluate(() => document.querySelector('#cofre-painel details').textContent);
        conferir(esperado.every((e) => txt.includes(e)), (idioma ? 'EN' : 'PT') + ': o "Saiba mais" do cofre explica quando o PIN é pedido, quando não é e quando tranca sozinho');
        await ctx.close();
      }
    }

    /* 15. digital no lugar do PIN (v1.26.0): digital virtual do Chromium */
    {
      // aparelho sem digital cadastrada: o painel explica e o PIN segue
      {
        const { ctx, page } = await abrir(browser, base);
        await irConfig(page);
        await page.waitForFunction(() => /cadastre uma digital/.test((document.querySelector('#cofre-digital') || {}).textContent || ''), null, { timeout: 5000 })
          .then(() => true, () => false).then((ok) => conferir(ok, 'sem digital no aparelho: o painel diz para cadastrar uma digital no celular, sem botão de ligar'));
        conferir((await page.locator('#btn-cofre-digital-ligar').count()) === 0, 'sem digital no aparelho: não há botão "Ligar a digital"');
        await ctx.close();
      }
      // WebAuthn não aceita endereço de IP: este trecho roda em http://localhost (mesmo servidor)
      const baseLocal = base.replace('127.0.0.1', 'localhost');
      const { ctx, page } = await abrir(browser, baseLocal);
      const cdp = await ctx.newCDPSession(page);
      await cdp.send('WebAuthn.enable');
      await cdp.send('WebAuthn.addVirtualAuthenticator', { options: { protocol: 'ctap2', transport: 'internal', hasResidentKey: true, hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true } });
      await page.reload(); await page.waitForTimeout(600); await resolverPin(page, PIN, 2500); await page.waitForTimeout(400);
      await irConfig(page);
      await page.waitForSelector('#btn-cofre-digital-ligar', { timeout: 5000 });
      conferir(true, 'com digital no aparelho e cofre aberto pelo PIN: o painel oferece "Ligar a digital"');
      await page.click('#btn-cofre-digital-ligar');
      await page.waitForSelector('#btn-cofre-digital-tirar', { timeout: 8000 });
      conferir(await page.evaluate(() => SolverCofre.digitalAtiva()), 'tocar em "Ligar a digital" liga a digital (e o painel passa a oferecer "Tirar a digital")');
      conferir(!(await cofreCru(page)).includes(FALSO.geminiKey) && !(await cofreCru(page)).includes(PIN), 'o cofre continua sem chave nem PIN em claro com a digital ligada');
      // recarregar: pede o cofre (sempre), mas agora com o botão da digital
      await page.reload(); await page.waitForTimeout(800);
      const j = page.locator('#solver-cofre [role=dialog]');
      await j.waitFor({ state: 'visible', timeout: 5000 });
      const tj = await j.textContent();
      conferir(/Abrir com a digital/.test(tj) && /ou digite o PIN/.test(tj), 'ao recarregar o app, a janela do cofre oferece "Abrir com a digital" e o PIN');
      conferir((await page.evaluate(() => document.querySelector('header, .topo, body').textContent)).indexOf(FALSO.publicoNomes.split(' ')[0]) === -1, 'antes de abrir (digital ou PIN) nenhum nome aparece');
      await page.click('#solver-cofre [data-sc=digital]');
      await j.waitFor({ state: 'hidden', timeout: 8000 });
      await page.waitForTimeout(500);
      conferir(await page.evaluate(() => SolverCofre.aberto()) && (await page.locator('#btn-cofre').textContent()).includes('🔓'), 'tocar na digital abre o cofre (sem PIN) e o indicador vira 🔓');
      // "Mostrar a chave" também aceita a digital
      await irConfig(page);
      await page.click('#cfg-txt-gemini [data-mostrar=geminiKey]');
      await j.waitFor({ state: 'visible', timeout: 5000 });
      conferir(/Abrir com a digital/.test(await j.textContent()), '"Mostrar a chave" também oferece a digital');
      await page.click('#solver-cofre [data-sc=digital]');
      await j.waitFor({ state: 'hidden', timeout: 8000 }); await page.waitForTimeout(500);
      const mo = await page.evaluate(() => ({ t: document.querySelector('#in-gemini-key').type, v: document.querySelector('#in-gemini-key').value }));
      conferir(mo.t === 'text' && mo.v === FALSO.geminiKey, '"Mostrar a chave" com a digital mostra a chave de verdade');
      // tirar a digital volta ao PIN
      await page.waitForSelector('#btn-cofre-digital-tirar', { timeout: 5000 });
      await page.click('#btn-cofre-digital-tirar'); await page.waitForTimeout(500);
      conferir(!(await page.evaluate(() => SolverCofre.digitalAtiva())) && (await page.locator('#btn-cofre-digital-ligar').count()) === 1, '"Tirar a digital" desliga e volta a oferecer "Ligar a digital"');
      await ctx.close();
    }

    // as 3 mensagens da CSP que o próprio teste 13 provoca de propósito (script de dentro da página e origem fora da lista) não contam;
    // violações de verdade da CSP já foram conferidas ali (zero, antes das provocações)
    const reais = erros.filter((e) => !/exemplo-nao-liberado|Refused to execute inline script/.test(e));
    conferir(reais.length === 0, 'nenhuma tela com erro (pageerror/console): ' + (reais.slice(0, 3).join(' | ') || 'zero'));
  } finally { await fechar(); }
  if (falhas.length) { console.log('\nFALHAS (' + falhas.length + '):\n - ' + falhas.join('\n - ')); process.exit(1); }
  console.log('\nTudo certo.');
})().catch((e) => { console.error(e); process.exit(1); });
