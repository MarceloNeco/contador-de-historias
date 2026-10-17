/* Teste das JANELAS do Contador de Histórias (v1.27.0): tudo pela janela comum (janela.js).
   Tela de celular (390 px). Só valores de mentira. Internet simulada. Uso: node teste/janelas.js
   Cobre: página de trás não rola nem recebe toque; Esc, Voltar e toque fora fecham (arrastar de dentro para fora não);
   "Descartar?" com texto; confirmação POR CIMA da janela; gaveta ☰ com ✕; tour; histórico sem sobra; PIN sem chave. */
const { contexto, semear, vozDeMentira, vigiar, iniciar } = require('./comum');

const HISTORIA = { id: 'teste_1', titulo: 'Historia de teste', idade: '6-9', tema: 'lua', personagens: '', serie: '', ordem: 0,
  criadaEm: '2026-10-01T10:00:00.000Z', texto: 'Era uma vez uma estrela pequena. Ela brilhava devagar. A noite ficou calma.' };
const OUTROS = { motorTexto: 'gemini', motorVoz: 'nativo', saudarAntes: true };

const falhas = [];
const conferir = (ok, msg) => { if (!ok) { falhas.push(msg); console.log('  ✗ ' + msg); } else console.log('  ✓ ' + msg); };

async function abrir(browser, base, opc) {
  opc = opc || {};
  const { ctx } = await contexto(browser, base, { largura: 390, altura: 800 });
  await vozDeMentira(ctx);
  // sem chave nenhuma: o cofre não pergunta nada e nenhuma janela de PIN atrapalha
  await semear(ctx, { ch_config: Object.assign({}, OUTROS, opc.cfg || {}), ch_historias: [HISTORIA], ch_assist: { tour: true, vistas: {} } });
  const page = await ctx.newPage();
  const erros = [];
  vigiar(page, erros);
  await page.goto(base + '/index.html');
  await page.waitForSelector('#tela-inicio', { state: 'attached' });
  await page.waitForTimeout(700);
  return { ctx, page, erros };
}

const abertas = (page) => page.evaluate(() => document.querySelectorAll('dialog.sj[open]').length);
const topoAberto = (page) => page.evaluate(() => { const l = Array.from(document.querySelectorAll('dialog.sj[open]')); return l.length ? (l[l.length - 1].id || l[l.length - 1].className) : ''; });
const tela = (page) => page.evaluate(() => (document.querySelector('nav.tabs button.on') || {}).dataset && document.querySelector('nav.tabs button.on').dataset.tela);
const sobraNoHistorico = (page) => page.evaluate(() => !!(history.state && history.state.sjNivel));
const rolagem = (page) => page.evaluate(() => window.scrollY);

/* toque no ponto (x,y) cai em quê? "pagina" = num elemento de trás da janela; "janela" = na própria janela */
async function ondeCai(page, seletor) {
  return page.evaluate((s) => {
    const el = document.querySelector(s); if (!el) return 'sem-elemento';
    const r = el.getBoundingClientRect();
    const alvo = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    if (!alvo) return 'nada';
    return alvo.closest('dialog.sj') ? 'janela' : (alvo === el || el.contains(alvo) ? 'pagina' : 'outro');
  }, seletor);
}

async function main() {
  const { servidor, base, browser, fechar } = await iniciar();
  try {
    /* ---------- 1. janela do app (modal): a Busca ---------- */
    console.log('\n1. Janela do app (Busca) em 390 px');
    {
      const { ctx, page, erros } = await abrir(browser, base);
      await page.click('nav.tabs button[data-tela=config]');
      await page.waitForTimeout(300);
      const antes = { tela: await tela(page), y: await rolagem(page) };
      await page.click('#btn-busca-topo');
      await page.waitForTimeout(300);
      conferir((await abertas(page)) === 1 && (await topoAberto(page)) === 'modal', 'a Busca abre como janela comum (<dialog> aberto)');
      conferir(await page.evaluate(() => getComputedStyle(document.documentElement).overflow === 'hidden' && getComputedStyle(document.body).overflow === 'hidden'), 'a página de trás fica sem rolagem (html e body com overflow hidden)');
      await page.mouse.move(195, 30); await page.mouse.wheel(0, 900); await page.waitForTimeout(250);
      conferir((await rolagem(page)) === antes.y, 'girar a roda fora da caixa não rola a página de trás');
      conferir((await ondeCai(page, 'nav.tabs button[data-tela=acervo]')) === 'janela', 'o botão de trás (aba Acervo) não recebe toque: quem recebe é a janela');
      conferir((await ondeCai(page, '#btn-menu')) === 'janela', 'o ☰ de trás não recebe toque');
      conferir(await page.evaluate(() => { const b = document.querySelector('nav.tabs button[data-tela=acervo]'); return b.closest('[inert]') !== null || document.querySelector('dialog.sj[open]').matches(':modal'); }), 'a janela é modal (o navegador deixa o resto inerte)');

      // Esc
      await page.keyboard.press('Escape'); await page.waitForTimeout(300);
      conferir((await abertas(page)) === 0, 'Esc fecha a janela');
      conferir(!(await sobraNoHistorico(page)) && (await tela(page)) === 'config' && (await rolagem(page)) === antes.y, 'ao fechar, a página volta onde estava (mesma tela e mesma rolagem)');

      // Voltar
      await page.click('#btn-busca-topo'); await page.waitForTimeout(300);
      await page.goBack(); await page.waitForTimeout(350);
      conferir((await abertas(page)) === 0 && (await tela(page)) === 'config', 'o Voltar do celular fecha só a janela (continua em Configurações)');
      // toque fora
      await page.click('#btn-busca-topo'); await page.waitForTimeout(300);
      await page.mouse.click(195, 25); await page.waitForTimeout(300);
      conferir((await abertas(page)) === 0, 'tocar na parte escura fora da caixa fecha (= cancelar)');
      // arrastar de dentro para fora não fecha
      await page.click('#btn-busca-topo'); await page.waitForTimeout(300);
      const caixa = await page.locator('#modal .box').boundingBox();
      await page.mouse.move(caixa.x + caixa.width / 2, caixa.y + 40); await page.mouse.down();
      await page.mouse.move(195, 20, { steps: 6 }); await page.mouse.up(); await page.waitForTimeout(300);
      conferir((await abertas(page)) === 1, 'arrastar de dentro da caixa e soltar na parte escura NÃO fecha');
      // busca não pergunta "Descartar?" (o que se procura não é texto a perder)
      await page.fill('#busca-geral', 'lua'); await page.waitForTimeout(150);
      await page.keyboard.press('Escape'); await page.waitForTimeout(300);
      conferir((await abertas(page)) === 0, 'busca com texto digitado fecha sem perguntar "Descartar?"');

      // histórico sem sobra: depois de abrir e fechar de todos os jeitos, UM Voltar volta ao Início (e só isso)
      await page.goBack(); await page.waitForTimeout(400);
      conferir((await tela(page)) === 'inicio' && /index\.html$/.test(page.url()), 'histórico sem sobra: depois de 5 aberturas, um Voltar leva ao Início, sem entrada de janela escondida');
      conferir((await abertas(page)) === 0, 'nenhuma janela reapareceu');
      conferir(erros.length === 0, 'sem erros no console (' + erros.length + ')'); if (erros.length) console.log(erros.slice(0, 4));
      await ctx.close();
    }

    /* ---------- 2. texto digitado e não salvo ---------- */
    console.log('\n2. Texto digitado: "Descartar?"');
    {
      const { ctx, page } = await abrir(browser, base);
      await page.click('#btn-perfil-topo'); await page.waitForTimeout(200);
      await page.click('[data-mp=entrar-nuvem]'); await page.waitForTimeout(350);
      conferir((await abertas(page)) === 1 && (await page.locator('#sv-email').count()) === 1, 'o login da conta abre como janela comum');
      await page.fill('#sv-email', 'alguem@exemplo.invalid');
      await page.keyboard.press('Escape'); await page.waitForTimeout(300);
      conferir((await abertas(page)) === 2 && (await page.locator('dialog.sj-pergunta[open]').count()) === 1, 'Esc com e-mail digitado pergunta "Descartar o que você digitou?" por cima');
      conferir((await page.inputValue('#sv-email')) === 'alguem@exemplo.invalid', 'a pergunta não apaga o que foi digitado');
      await page.click('dialog.sj-pergunta [data-sj=continuar]'); await page.waitForTimeout(300);
      conferir((await abertas(page)) === 1 && (await page.inputValue('#sv-email')) === 'alguem@exemplo.invalid', '"Continuar" volta ao formulário com o texto');
      await page.goBack(); await page.waitForTimeout(350);
      conferir((await page.locator('dialog.sj-pergunta[open]').count()) === 1, 'o Voltar do celular também pergunta "Descartar?"');
      await page.click('dialog.sj-pergunta [data-sj=descartar]'); await page.waitForTimeout(450);
      conferir((await abertas(page)) === 0, '"Descartar" fecha tudo');
      // senha digitada não pergunta
      await page.click('#btn-perfil-topo'); await page.waitForTimeout(200);
      await page.click('[data-mp=entrar-nuvem]'); await page.waitForTimeout(350);
      await page.fill('#sv-senha', 'senha-de-mentira-1');
      await page.keyboard.press('Escape'); await page.waitForTimeout(300);
      conferir((await abertas(page)) === 0, 'só senha digitada: fecha sem perguntar (senha não conta)');
      await ctx.close();
    }

    /* ---------- 3. confirmação curta (os confirm() de antes) ---------- */
    console.log('\n3. Confirmação por cima da janela');
    {
      const { ctx, page } = await abrir(browser, base);
      // 3a. sem janela aberta: Configurações → apagar toda a voz guardada
      await page.click('nav.tabs button[data-tela=config]'); await page.waitForTimeout(300);
      await page.evaluate(() => document.querySelector('#btn-limpar-audio').scrollIntoView({ block: 'center' }));
      await page.click('#btn-limpar-audio'); await page.waitForTimeout(300);
      conferir((await abertas(page)) === 1 && (await page.locator('dialog[role=alertdialog][open]').count()) === 1, 'Apagar toda a voz: a confirmação é uma janela comum (alertdialog), não o confirm() do navegador');
      conferir(!(await page.locator('dialog.sj-pergunta').count()), 'a confirmação não tem "Descartar?"');
      await page.keyboard.press('Escape'); await page.waitForTimeout(300);
      conferir((await abertas(page)) === 0, 'Esc na confirmação = não: fecha');

      // 3b. por cima de uma janela: história → ⋯ → Apagar
      await page.click('nav.tabs button[data-tela=acervo]'); await page.waitForTimeout(300);
      await page.click('#lista-acervo .hist'); await page.waitForTimeout(500);
      await page.click('#btn-menu-hist'); await page.waitForTimeout(350);
      conferir((await topoAberto(page)) === 'modal', 'o menu ⋯ da história abre como janela do app');
      // a gente "digita" no formulário de baixo: acrescenta um campo de texto à janela para provar que ele é guardado
      await page.evaluate(() => { const i = document.createElement('input'); i.type = 'text'; i.id = 'teste-campo'; document.querySelector('#modal .box').appendChild(i); });
      await page.fill('#teste-campo', 'texto-de-mentira');
      await page.click('#mh-apagar'); await page.waitForTimeout(350);
      conferir((await abertas(page)) === 2 && (await page.locator('dialog[role=alertdialog][open]').count()) === 1, 'Apagar história: a confirmação abre POR CIMA da janela (duas abertas)');
      conferir((await page.locator('#modal').evaluate((e) => e.open)) === true, 'a janela de baixo continua aberta, escurecida');
      // Esc: fecha só a confirmação
      await page.keyboard.press('Escape'); await page.waitForTimeout(350);
      conferir((await abertas(page)) === 1 && (await page.inputValue('#teste-campo')) === 'texto-de-mentira', 'Esc fecha só a confirmação; o formulário guarda o texto');
      // Voltar
      await page.click('#mh-apagar'); await page.waitForTimeout(350);
      await page.goBack(); await page.waitForTimeout(400);
      conferir((await abertas(page)) === 1 && (await page.inputValue('#teste-campo')) === 'texto-de-mentira', 'o Voltar fecha só a confirmação');
      // toque fora
      await page.click('#mh-apagar'); await page.waitForTimeout(350);
      await page.mouse.click(195, 20); await page.waitForTimeout(350);
      conferir((await abertas(page)) === 1 && (await page.inputValue('#teste-campo')) === 'texto-de-mentira', 'tocar fora fecha só a confirmação');
      // Cancelar
      await page.click('#mh-apagar'); await page.waitForTimeout(350);
      await page.click('dialog[role=alertdialog] [data-cf=nao]'); await page.waitForTimeout(350);
      conferir((await abertas(page)) === 1, 'Cancelar fecha só a confirmação');
      // fechar a janela de baixo fecha a confirmação junto (o navegador fechando o <dialog> de baixo)
      await page.click('#mh-apagar'); await page.waitForTimeout(350);
      await page.evaluate(() => document.getElementById('modal').dispatchEvent(new Event('close')));
      await page.waitForTimeout(450);
      conferir((await abertas(page)) === 0, 'fechar a janela de baixo fecha a confirmação junto');
      // Apagar de verdade: a história some e as janelas fecham
      await page.click('#btn-menu-hist'); await page.waitForTimeout(350);
      await page.click('#mh-apagar'); await page.waitForTimeout(350);
      await page.click('dialog[role=alertdialog] [data-cf=sim]'); await page.waitForTimeout(600);
      const restam = await page.evaluate(() => JSON.parse(localStorage.getItem('ch_historias') || '[]').length);
      conferir((await abertas(page)) === 0 && restam === 0, '"Apagar" na confirmação apaga a história e fecha as duas janelas');
      await ctx.close();
    }

    /* ---------- 4. gaveta ☰ ---------- */
    console.log('\n4. Gaveta ☰');
    {
      const { ctx, page } = await abrir(browser, base);
      const ondeFicaNav = () => page.evaluate(() => document.getElementById('menu-lateral').parentElement.tagName);
      conferir((await ondeFicaNav()) === 'BODY', 'fechada, a gaveta mora no <body>');
      await page.click('#btn-menu'); await page.waitForTimeout(400);
      conferir((await page.locator('dialog.gaveta-janela[open] #menu-lateral').count()) === 1, 'o ☰ abre a gaveta como janela comum');
      conferir((await page.locator('#btn-menu').getAttribute('aria-expanded')) === 'true', 'aria-expanded = true no ☰');
      conferir((await page.locator('#menu-lateral [data-gv=fechar]').isVisible()), 'a gaveta tem o ✕ próprio');
      conferir((await ondeCai(page, 'nav.tabs button[data-tela=acervo]')) === 'janela', 'a barra de baixo não recebe toque com a gaveta aberta');
      await page.click('#menu-lateral [data-gv=fechar]'); await page.waitForTimeout(400);
      conferir((await abertas(page)) === 0 && (await ondeFicaNav()) === 'BODY' && (await page.locator('#btn-menu').getAttribute('aria-expanded')) === 'false', '✕ fecha; a gaveta volta ao lugar dela');
      conferir(await page.evaluate(() => document.activeElement && document.activeElement.id === 'btn-menu'), 'o foco volta ao ☰');
      await page.click('#btn-menu'); await page.waitForTimeout(400);
      await page.keyboard.press('Escape'); await page.waitForTimeout(350);
      conferir((await abertas(page)) === 0, 'Esc fecha a gaveta');
      await page.click('#btn-menu'); await page.waitForTimeout(400);
      await page.goBack(); await page.waitForTimeout(400);
      conferir((await abertas(page)) === 0 && (await tela(page)) === 'inicio', 'Voltar fecha a gaveta (e o app continua onde estava)');
      await page.click('#btn-menu'); await page.waitForTimeout(400);
      await page.mouse.click(375, 400); await page.waitForTimeout(350);
      conferir((await abertas(page)) === 0, 'tocar na parte escura fecha a gaveta');
      await page.click('#btn-menu'); await page.waitForTimeout(400);
      await page.click('#menu-lateral [data-tela=acervo]'); await page.waitForTimeout(600);
      conferir((await abertas(page)) === 0 && (await tela(page)) === 'acervo', 'escolher um destino fecha a gaveta e troca de tela');
      await page.goBack(); await page.waitForTimeout(450);
      conferir((await tela(page)) === 'inicio' && !(await sobraNoHistorico(page)), 'histórico sem sobra: um Voltar do Acervo leva ao Início');
      // o menu 👤 (não é janela) fecha com Esc e com toque fora
      await page.click('#btn-perfil-topo'); await page.waitForTimeout(250);
      await page.keyboard.press('Escape'); await page.waitForTimeout(250);
      conferir(!(await page.locator('#menu-perfil.on').count()), 'menu 👤 fecha com Esc');
      await page.click('#btn-perfil-topo'); await page.waitForTimeout(250);
      await page.mouse.click(200, 700); await page.waitForTimeout(250);
      conferir(!(await page.locator('#menu-perfil.on').count()), 'menu 👤 fecha com toque fora');
      await ctx.close();
    }

    /* ---------- 5. tour do AssistONE ---------- */
    console.log('\n5. Tour do AssistONE');
    {
      const { ctx, page } = await abrir(browser, base);
      await page.click('#assist-btn'); await page.waitForTimeout(300);
      const balaoFecha = async () => { await page.keyboard.press('Escape'); await page.waitForTimeout(250); };
      conferir(await page.locator('#assist-balao:not([hidden])').count() === 1, 'o balão do AssistONE abre (não é janela)');
      await balaoFecha();
      conferir(await page.locator('#assist-balao:not([hidden])').count() === 0, 'o balão fecha com Esc');
      await page.click('#assist-btn'); await page.waitForTimeout(300);
      await page.mouse.click(30, 120); await page.waitForTimeout(250);
      conferir(await page.locator('#assist-balao:not([hidden])').count() === 0, 'o balão fecha com toque fora');
      for (const como of ['Sair', 'Esc', 'Voltar', 'fora']) {
        await page.click('#assist-btn'); await page.waitForTimeout(300);
        await page.click('#assist-balao [data-op=tour]'); await page.waitForTimeout(450);
        if (como === 'Sair') conferir((await page.locator('dialog.tour-janela[open]').count()) === 1 && (await page.locator('.tour-alvo').count()) === 1, 'o tour abre como janela comum, com um destaque na página');
        if (como === 'Sair') conferir((await ondeCai(page, 'nav.tabs button[data-tela=acervo]')) === 'janela', 'durante o tour a página de trás não recebe toque');
        if (como === 'Sair') await page.click('dialog.tour-janela [data-t=sair]');
        if (como === 'Esc') await page.keyboard.press('Escape');
        if (como === 'Voltar') await page.goBack();
        if (como === 'fora') await page.mouse.click(5, 5);
        await page.waitForTimeout(450);
        conferir((await abertas(page)) === 0 && (await page.locator('.tour-alvo').count()) === 0, 'tour: ' + como + ' encerra e tira o destaque');
      }
      await page.click('#assist-btn'); await page.waitForTimeout(300);
      await page.click('#assist-balao [data-op=tour]'); await page.waitForTimeout(450);
      for (let i = 0; i < 12 && (await abertas(page)); i++) { await page.click('dialog.tour-janela [data-t=prox]').catch(() => {}); await page.waitForTimeout(250); }
      conferir((await abertas(page)) === 0, 'passando todos os passos, o tour termina e a janela fecha');
      conferir(!(await sobraNoHistorico(page)), 'histórico sem sobra depois do tour');
      await ctx.close();
    }

    /* ---------- 6. PIN: sem chave não pede ---------- */
    console.log('\n6. PIN do cofre');
    {
      const { ctx, page } = await abrir(browser, base);
      await page.waitForTimeout(800);
      conferir((await page.locator('#solver-cofre').count()) === 0, 'sem chave nem nome guardado, o app não pede PIN');
      conferir(await page.evaluate(() => !!(window.SolverCofre && SolverCofre.versao) && SolverCofre.versao === '1.4.0'), 'o cofre é o comum 1.4.0');
      await ctx.close();
    }
  } finally { await fechar(); }

  console.log(falhas.length ? '\nFALHAS (' + falhas.length + '):\n - ' + falhas.join('\n - ') : '\nTudo certo.');
  process.exit(falhas.length ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
