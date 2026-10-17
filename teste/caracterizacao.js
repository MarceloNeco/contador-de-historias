/* Teste de CARACTERIZAÇÃO do Contador de Histórias.
   Grava (modo "gravar") como cada tela se comporta e, depois da mudança, confere (modo "conferir") que só o
   que foi pedido mudou. Tudo de mentira: internet simulada por rota, voz simulada, chaves e nomes inventados.
   Uso:  node teste/caracterizacao.js gravar     (antes de mexer no app)
         node teste/caracterizacao.js conferir   (depois)
   Se a janela do cofre aparecer, o teste cria o PIN de teste e segue (no app de antes ela não existe). */
const fs = require('fs');
const path = require('path');
const { FALSO, PIN, contexto, semear, vozDeMentira, vigiar, resolverPin, iniciar } = require('./comum');

const MODO = process.argv[2] === 'gravar' ? 'gravar' : 'conferir';
const ARQ = path.join(__dirname, 'base', 'caracterizacao.json');
const SEGREDOS = ['geminiKey', 'openaiKey', 'elevenKey', 'anthropicKey', 'publicoNomes', 'nomesProtegidos'];

const HISTORIA = { id: 'teste_1', titulo: 'Historia de teste', idade: '6-9', tema: 'lua', personagens: '', serie: '', ordem: 0,
  criadaEm: '2026-10-01T10:00:00.000Z', texto: 'Era uma vez uma estrela pequena. Ela brilhava devagar. A noite ficou calma.' };

const CFG_ANTIGA = Object.assign({ motorTexto: 'gemini', motorVoz: 'gemini', saudarAntes: true }, FALSO);

async function abrir(browser, base, opc) {
  opc = opc || {};
  const { ctx, ped } = await contexto(browser, base, opc);
  await vozDeMentira(ctx);
  // só para o teste: o balão do AssistONE aparece com o tempo e cobre os botões; o resto da tela não muda
  await ctx.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { const e = document.createElement('style'); e.textContent = '#assist-balao,#assist-dica,#assist-btn{display:none!important}'; document.head.appendChild(e); }); });
  await semear(ctx, { ch_config: Object.assign({}, CFG_ANTIGA, opc.cfg || {}), ch_historias: [HISTORIA], ch_assist: { tour: true, vistas: {} } });
  const page = await ctx.newPage();
  const erros = [];
  vigiar(page, erros);
  await page.goto(base + '/index.html');
  await page.waitForSelector('#tela-inicio', { state: 'attached' });
  await page.waitForTimeout(700);
  await resolverPin(page, PIN, 1500);   // v1.23.0: com chaves em texto aberto o app pede o PIN logo de cara (antes: nada aparece)
  await page.waitForTimeout(300);
  return { ctx, page, ped, erros };
}

async function idsVisiveis(page, sel) {
  return page.evaluate((s) => Array.from(document.querySelectorAll(s + ' [id]')).filter((e) => e.offsetParent !== null || getComputedStyle(e).position === 'fixed')
    .map((e) => e.id).sort(), sel);
}
async function tituloDe(page, sel) {
  return page.evaluate((s) => Array.from(document.querySelectorAll(s + ' .tit')).map((e) => e.textContent.trim()), sel);
}

async function lerBaixado(download, senha) {
  const arq = await download.path();
  const obj = JSON.parse(fs.readFileSync(arq, 'utf8'));
  const sub = require('crypto').webcrypto.subtle;
  const b = (s) => Buffer.from(s, 'base64');
  const base = await sub.importKey('raw', Buffer.from(senha), 'PBKDF2', false, ['deriveKey']);
  const k = await sub.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: b(obj.senha.sal), iterations: obj.kdf.rodadas }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  const bruta = await sub.decrypt({ name: 'AES-GCM', iv: b(obj.senha.iv) }, k, b(obj.senha.chave));
  const dk = await sub.importKey('raw', bruta, 'AES-GCM', false, ['decrypt']);
  const claro = await sub.decrypt({ name: 'AES-GCM', iv: b(obj.iv) }, dk, b(obj.dados));
  return { obj, conteudo: JSON.parse(Buffer.from(claro).toString('utf8')), texto: fs.readFileSync(arq, 'utf8') };
}

async function coletar(browser, base) {
  const f = {};

  /* ---------- 1. cada tela abre sem erro ---------- */
  {
    const { ctx, page, erros } = await abrir(browser, base, { cfg: { publicoNomes: '', nomesProtegidos: '' } });
    f.telas = {};
    for (const t of ['inicio', 'acervo', 'nova', 'config']) {
      await page.click('nav.tabs button[data-tela=' + t + ']');
      await page.waitForTimeout(250);
      const ids = (await idsVisiveis(page, '#tela-' + t)).filter((i) => !/^(in-(gemini|openai|eleven|anthropic)-key|in-openai-key2|in-gemini-key-voz|in-publico-nomes|in-nomes-protegidos)$/.test(i));
      f.telas[t] = { ids, tits: await tituloDe(page, '#tela-' + t) };
    }
    f.telas.config.semDeslizeLateral = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    f.corpo = await page.evaluate(() => Array.from(document.body.children).filter((e) => e.tagName !== 'SCRIPT').map((e) => (e.tagName + '#' + e.id + '.' + String(e.className).split(' ')[0])));
    f.errosTelas = erros.slice();
    await ctx.close();
  }

  /* ---------- 2. gerar uma história com a IA de mentira ---------- */
  {
    const { ctx, page, ped, erros } = await abrir(browser, base);
    await page.click('nav.tabs button[data-tela=nova]');
    await page.fill('#in-tema', 'a lua, a Lia e o Tobias');
    await page.click('#btn-gerar');
    await resolverPin(page, PIN);
    await page.waitForSelector('#ap-salvar', { timeout: 15000 });
    const modal = await page.locator('#modal').innerText();
    const pedido = ped.texto[0] || { corpo: '', chave: '' };
    f.gerar = {
      titulo: /A Lua Sorridente/.test(modal),
      nomeVoltouNoTexto: /Tobias/.test(modal) && !/\[NOME\d\]/.test(modal),
      pediuUmaVez: ped.texto.length === 1,
      chaveFoiAEscolhida: pedido.chave === FALSO.geminiKey,
      pedidoSemNomes: !/Lia|Davi|Tobias/.test(pedido.corpo),
      pedidoTemCodigoDeNome: /\[NOME\d\]/.test(pedido.corpo)
    };
    await page.click('#ap-salvar');
    await page.waitForTimeout(300);
    f.gerar.guardouNoAcervo = (await page.locator('#tela-acervo').innerText()).includes('A Lua Sorridente');
    f.errosGerar = erros.slice();
    await ctx.close();
  }

  /* ---------- 3. ouvir: voz do aparelho (simulada) e voz Gemini (simulada) ---------- */
  {
    const { ctx, page, erros } = await abrir(browser, base, { cfg: { motorVoz: 'nativo' } });
    await page.click('nav.tabs button[data-tela=acervo]');
    await page.waitForSelector('.hist[data-id=teste_1]');
    await page.click('.hist[data-id=teste_1]');
    await resolverPin(page, PIN);
    await page.waitForSelector('#btn-play');
    await page.click('#btn-play');
    await resolverPin(page, PIN);
    await page.waitForFunction(() => (window.__falas || []).length >= 2, null, { timeout: 15000 });
    const falas = await page.evaluate(() => window.__falas.slice());
    f.ouvirNativo = { cumprimento: /Olá Lia e Davi, vamos ouvir uma historinha\?/.test(falas[0]), falouAHistoria: /estrela pequena/.test(falas.join(' ')) };
    f.errosOuvirNativo = erros.slice();
    await ctx.close();
  }
  {
    const { ctx, page, ped, erros } = await abrir(browser, base, { cfg: { motorVoz: 'gemini' } });
    await page.click('nav.tabs button[data-tela=acervo]');
    await page.waitForSelector('.hist[data-id=teste_1]');
    await page.click('.hist[data-id=teste_1]');
    await resolverPin(page, PIN);
    await page.waitForSelector('#btn-play');
    await page.click('#btn-play');
    await resolverPin(page, PIN);
    await page.waitForFunction(() => /./.test((document.querySelector('#leitor-status') || {}).textContent || ''), null, { timeout: 15000 });
    await page.waitForTimeout(2500);
    f.ouvirGemini = { pediuVoz: ped.voz.length > 0, chaveFoiAEscolhida: ped.voz.length > 0 && ped.voz.every((v) => v.chave === FALSO.geminiKey) };
    f.errosOuvirGemini = erros.slice();
    await ctx.close();
  }

  /* ---------- 4. Configurações: o que NÃO é segredo continua igual ---------- */
  {
    const { ctx, page } = await abrir(browser, base);
    await page.click('nav.tabs button[data-tela=config]');
    await page.waitForTimeout(300);
    f.config = await page.evaluate((segredos) => {
      const o = {};
      document.querySelectorAll('#tela-config input[id], #tela-config select[id], #tela-config textarea[id]').forEach((e) => {
        if (/^in-(gemini|openai|eleven|anthropic)-key|^in-openai-key2$|^in-publico-nomes$|^in-nomes-protegidos$/.test(e.id)) return;
        o[e.id] = e.type === 'checkbox' ? e.checked : e.value;
      });
      return o;
    }, SEGREDOS);
    f.configCofre = await page.evaluate(() => Array.from(document.querySelectorAll('#cofre-lista .it')).map((e) => e.textContent.replace(/\s+/g, ' ').trim()));
    await ctx.close();
  }

  /* ---------- 5. levar a configuração para outro aparelho ---------- */
  {
    const { ctx, page, erros } = await abrir(browser, base);
    await page.click('nav.tabs button[data-tela=config]');
    await page.click('#btn-transferir');
    await resolverPin(page, PIN);
    await page.waitForSelector('#tr-copiar');
    await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base }).catch(() => {});
    await page.click('#tr-copiar');
    await page.waitForTimeout(400);
    let link = '';
    try { link = await page.evaluate(() => navigator.clipboard.readText()); } catch (e) {}
    if (!link) { link = await page.evaluate(() => { const t = document.querySelector('#modal textarea'); return t ? t.value : ''; }); }
    const m = link.match(/#cfg=(.+)$/);
    const dec = m ? JSON.parse(decodeURIComponent(escape(Buffer.from(m[1], 'base64').toString('binary')))) : {};
    f.link = { temLink: !!m, chavesDoLink: Object.keys(dec).sort(), semSegredoSegue: Object.keys(dec).filter((k) => !['gk', 'ek', 'ok', 'ak'].includes(k)).sort() };
    f.errosLink = erros.slice();
    await ctx.close();
  }

  /* ---------- 6. cópia protegida (backup) ---------- */
  {
    const { ctx, page, erros } = await abrir(browser, base);
    await page.click('nav.tabs button[data-tela=config]');
    await page.click('#btn-exportar');
    await resolverPin(page, PIN);
    await page.fill('#cp-senha', 'senha-de-teste-77');
    await page.fill('#cp-senha2', 'senha-de-teste-77');
    await page.click('#cp-fazer');
    await resolverPin(page, PIN);
    await page.waitForSelector('#cp-anotei', { timeout: 60000 });
    await page.check('#cp-anotei');
    const [baixado] = await Promise.all([page.waitForEvent('download'), page.click('#cp-baixar')]);
    const { conteudo, texto } = await lerBaixado(baixado, 'senha-de-teste-77');
    const cfgDentro = conteudo.cfg || {};
    f.copia = {
      temHistorias: Array.isArray(conteudo.historias) && conteudo.historias.some((h) => h.id === 'teste_1'),
      semChaveDeIA: !Object.keys(cfgDentro).some((k) => /key$/i.test(k)),
      arquivoSemChaveEmClaro: ![FALSO.geminiKey, FALSO.openaiKey, FALSO.elevenKey, FALSO.anthropicKey].some((v) => texto.includes(v)),
      nomesNaCopiaCifrada: cfgDentro.publicoNomes === FALSO.publicoNomes && cfgDentro.nomesProtegidos === FALSO.nomesProtegidos,
      arquivoSemNomeEmClaro: !texto.includes(FALSO.publicoNomes) && !texto.includes('Davi ') && !texto.includes(FALSO.nomesProtegidos)
    };
    f.errosCopia = erros.slice();
    await ctx.close();
  }
  return f;
}

(async () => {
  const { browser, base, fechar } = await iniciar();
  let f;
  try { f = await coletar(browser, base); } finally { await fechar(); }
  if (MODO === 'gravar') {
    fs.mkdirSync(path.dirname(ARQ), { recursive: true });
    fs.writeFileSync(ARQ, JSON.stringify(f, null, 2) + '\n');
    console.log('Gravado em teste/base/caracterizacao.json');
    console.log(JSON.stringify(f, null, 2));
    return;
  }
  const antes = JSON.parse(fs.readFileSync(ARQ, 'utf8'));
  /* o que PODE mudar, por pedido do dono: o link novo não leva chaves; os campos de segredo e a lista do cofre
     passam a mostrar o cofre; a cópia protegida segue levando os nomes só cifrados */
  const falhas = [];
  const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const comparar = (nome, a, b) => { if (!igual(a, b)) falhas.push(nome + '\n   antes:  ' + JSON.stringify(a) + '\n   agora:  ' + JSON.stringify(b)); else console.log('  ✓ ' + nome); };
  for (const t of Object.keys(antes.telas)) {
    const novo = f.telas[t];
    const extras = novo.ids.filter((i) => !antes.telas[t].ids.includes(i));
    const faltam = antes.telas[t].ids.filter((i) => !novo.ids.includes(i));
    comparar('tela ' + t + ': nenhum elemento sumiu', faltam, []);
    comparar('tela ' + t + ': títulos iguais', antes.telas[t].tits, novo.tits);
    if (extras.length) console.log('    (novos, esperados do cofre: ' + extras.join(', ') + ')');
  }
  comparar('corpo da página: mesmos blocos de nível alto', antes.corpo, f.corpo);
  comparar('config: sem rolagem lateral', antes.telas.config.semDeslizeLateral, f.telas.config.semDeslizeLateral);
  comparar('sem erros nas telas', antes.errosTelas, f.errosTelas);
  comparar('gerar história', antes.gerar, f.gerar);
  comparar('gerar: sem erros', antes.errosGerar, f.errosGerar);
  comparar('ouvir (voz do aparelho)', antes.ouvirNativo, f.ouvirNativo);
  comparar('ouvir (Gemini)', antes.ouvirGemini, f.ouvirGemini);
  comparar('ouvir: sem erros', [antes.errosOuvirNativo, antes.errosOuvirGemini], [f.errosOuvirNativo, f.errosOuvirGemini]);
  comparar('configurações (campos que não são segredo)', antes.config, f.config);
  comparar('link: o que não é segredo continua igual', antes.link.semSegredoSegue, f.link.semSegredoSegue);
  comparar('link: sem erros', antes.errosLink, f.errosLink);
  comparar('cópia protegida', antes.copia, f.copia);
  comparar('cópia: sem erros', antes.errosCopia, f.errosCopia);
  if (falhas.length) { console.log('\nFALHAS:\n' + falhas.join('\n')); process.exit(1); }
  console.log('\nCaracterização conferida.');
})().catch((e) => { console.error(e); process.exit(1); });
