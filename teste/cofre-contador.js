/* Teste do cofre no Contador de Histórias (v1.22.0): chaves de IA e nomes das crianças saem do texto aberto.
   Só valores de mentira. Internet e voz simuladas. Uso: node teste/cofre-contador.js */
const fs = require('fs');
const { FALSO, PIN, contexto, semear, vozDeMentira, vigiar, resolverPin, iniciar } = require('./comum');

const HISTORIA = { id: 'teste_1', titulo: 'Historia de teste', idade: '6-9', tema: 'lua', personagens: '', serie: '', ordem: 0,
  criadaEm: '2026-10-01T10:00:00.000Z', texto: 'Era uma vez uma estrela pequena. Ela brilhava devagar. A noite ficou calma.' };
const OUTROS = { vel: 1.3, tom: 0.9, fonte: 21, tema: 'claro', motorTexto: 'gemini', motorVoz: 'gemini', saudarAntes: true, geminiVoice: 'Kore' };
const STATS = { leituras: 7, segundos: 900, ultimaNoite: '2026-10-01', sequencia: 3 };
const TEXTOS_SEGREDO = Object.values(FALSO);

const falhas = [], erros = [];
const conferir = (ok, msg) => { if (!ok) { falhas.push(msg); console.log('  ✗ ' + msg); } else console.log('  ✓ ' + msg); };

async function abrir(browser, base, opc) {
  opc = opc || {};
  const { ctx, ped } = await contexto(browser, base, { largura: opc.largura });
  await vozDeMentira(ctx);
  const cfg = Object.assign({}, OUTROS, opc.semSegredos ? {} : FALSO, opc.cfg || {});
  const dados = { ch_config: cfg, ch_historias: [HISTORIA], ch_stats: STATS };
  if (opc.extra) Object.assign(dados, opc.extra);
  if (opc.idioma) dados['dgo:global:idioma'] = JSON.stringify(opc.idioma);
  await semear(ctx, dados);
  const page = await ctx.newPage();
  vigiar(page, erros);
  await page.goto(base + '/index.html');
  await page.waitForSelector('#tela-inicio', { state: 'attached' });
  await page.waitForTimeout(600);
  return { ctx, page, ped };
}
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
      const { ctx, page } = await abrir(browser, base);
      const antes = await lerCfg(page);
      conferir(TEXTOS_SEGREDO.every((v) => JSON.stringify(antes).includes(v)), 'antes do PIN: os valores de mentira estão no ch_config (ponto de partida)');
      await irConfig(page);
      const painel = await page.locator('#cofre-painel').innerText();
      conferir(/sem proteção/.test(painel), 'antes do PIN: a tela avisa que as chaves estão sem proteção e oferece criar o PIN');
      await criarPinPelaTela(page);
      const depois = await lerCfg(page);
      conferir(!('anthropicKey' in depois) && !('publicoNomes' in depois) && !('nomesProtegidos' in depois), 'saíram do ch_config na hora: chave da Anthropic e os dois campos de nomes');
      conferir(depois.geminiKey === FALSO.geminiKey && depois.openaiKey === FALSO.openaiKey && depois.elevenKey === FALSO.elevenKey, 'ficaram COPIADAS (cópia temporária do Eleições): só as chaves do Gemini, da OpenAI e da ElevenLabs');
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
      const tela = await page.evaluate(() => ({ g: document.querySelector('#in-gemini-key').value, n: document.querySelector('#in-publico-nomes').value }));
      conferir(tela.g === FALSO.geminiKey && tela.n === FALSO.publicoNomes, 'cofre aberto: os campos mostram os valores do cofre');
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
      const aberto = await page.evaluate(() => document.querySelector('#in-gemini-key').value);
      conferir(aberto === FALSO.geminiKey, 'depois do PIN o campo mostra a chave');
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
      await page.fill('#in-publico-nomes', 'Maia e Teo');
      await page.fill('#in-nomes-protegidos', 'Bento');
      await page.click('#sel-motor-texto button[data-motor=gemini]');   // tira o foco: grava
      await page.waitForTimeout(900);
      const v = await page.evaluate(() => ({ g: SolverCofre.lerAgora('ia:gemini'), n: SolverCofre.lerAgora('contador:publicoNomes'), p: SolverCofre.lerAgora('contador:nomesProtegidos'), espelho: document.querySelector('#in-gemini-key-voz').value }));
      conferir(v.g === 'AQ.outra-chave-de-mentira-999' && v.n === 'Maia e Teo' && v.p === 'Bento', 'chave e nomes novos foram para o cofre');
      conferir(v.espelho === 'AQ.outra-chave-de-mentira-999', 'a chave do Gemini aparece igual nos dois lugares da tela');
      const c = await lerCfg(page);
      conferir(!('publicoNomes' in c) && !('nomesProtegidos' in c) && !('anthropicKey' in c) && !('geminiKey' in c), 'nada voltou para o ch_config (a cópia antiga da chave trocada também saiu)');
      conferir(c.openaiKey === FALSO.openaiKey && c.elevenKey === FALSO.elevenKey, 'as cópias das chaves que não mudaram continuam para o Eleições');
      await page.click('#sel-motor-voz button[data-motor=elevenlabs]');
      await page.fill('#in-eleven-key', '');
      await page.click('#sel-motor-texto button[data-motor=gemini]'); await page.waitForTimeout(700);
      const c2 = await lerCfg(page);
      conferir(!('elevenKey' in c2) && !(await page.evaluate(() => SolverCofre.tem('ia:elevenlabs'))), 'apagar uma chave tira do cofre e da cópia (não ressuscita)');
      await page.reload(); await page.waitForTimeout(900);
      const c3 = await lerCfg(page);
      conferir(!('elevenKey' in c3) && (await page.evaluate(() => SolverCofre.aberto())), 'depois de recarregar (F5): o cofre continua aberto e a chave apagada não voltou');
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
      conferir(guardados.some((k) => /^saudacao\|/.test(k)), 'o cumprimento com nomes ficou guardado no aparelho (ponto de partida)');
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
      const { ctx, page, ped } = await abrir(browser, base, { extra: { ch_fila_voz: { ids: ['teste_1'], ligada: true, feitas: 0, parou: '' } } });
      await criarPinPelaTela(page);
      await trancar(page);
      const p2 = await novaAba(ctx, base);
      await p2.locator('#solver-cofre [role=dialog]').waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
      const apareceu = await p2.locator('#solver-cofre [role=dialog]').isVisible();
      conferir(apareceu, 'a fila de voz, ao abrir o app com o cofre trancado, pede o PIN');
      if (apareceu) {
        await p2.locator('#solver-cofre button:has-text("Agora não")').click();
        await p2.waitForTimeout(1500);
        const fila = await p2.evaluate(() => JSON.parse(localStorage.getItem('ch_fila_voz')));
        conferir(fila.ligada === false && ped.voz.length === 0, 'recusou o PIN: a fila pausou e nenhuma voz foi pedida');
      }
      await ctx.close();
    }

    /* ============ 9. inglês e 320 px ============ */
    console.log('\n9. Inglês e tela pequena');
    {
      const { ctx, page } = await abrir(browser, base, { idioma: 'en', largura: 320 });
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

    conferir(erros.length === 0, 'nenhuma tela com erro (pageerror/console): ' + (erros.slice(0, 3).join(' | ') || 'zero'));
  } finally { await fechar(); }
  if (falhas.length) { console.log('\nFALHAS (' + falhas.length + '):\n - ' + falhas.join('\n - ')); process.exit(1); }
  console.log('\nTudo certo.');
})().catch((e) => { console.error(e); process.exit(1); });
