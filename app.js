/* =======================================================================
   CONTADOR DE HISTÓRIAS — tudo em um arquivo só.
   Nada aqui envia dados para lugar nenhum: as histórias ficam no seu
   celular e, se você quiser, no seu próprio repositório do GitHub.
   ======================================================================= */
(function(){
"use strict";

/* ----------------------------- utilidades ----------------------------- */
const $  = (s,r)=> (r||document).querySelector(s);
const $$ = (s,r)=> Array.from((r||document).querySelectorAll(s));
const hoje = ()=> new Date().toISOString().slice(0,10);
const uid  = ()=> 'h' + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
const esc  = t => String(t==null?'':t).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sleep= ms => new Promise(r=>setTimeout(r,ms));
let toastTimer=null;
function toast(msg, ms){
  const t=$('#toast'); t.textContent=msg; t.classList.add('on');
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove('on'), ms||2600);
}
// texto curto nos dois idiomas, seguindo o PT | EN do módulo de diretrizes (para textos montados na hora)
function idiomaEN(){ try{ return !!(window.DGO && DGO.idioma && DGO.idioma()==='en'); }catch(e){ return false; } }
function T(pt, en){ return idiomaEN() ? en : pt; }
// interruptores do RootifyONE (recursos.js). Sem o arquivo, vale o padrão do código: tudo ligado.
const Rec = window.SolverRecursos || { ligado:(id,p)=>p!==false, valor:(id,p)=>p, aoMudar:()=>{} };
/* ---------- botão Voltar do celular: navega dentro do app ----------
   Cada camada aberta (outra aba, o leitor, uma janela) ganha uma entrada no histórico do
   navegador. O Voltar fecha a camada de cima; só sai do app quando já está no Início sem
   nada aberto. As idas e voltas no histórico são assíncronas, por isso a fila. */
const Nav = (function(){
  const pilha = [];                 // o que empurramos, em ordem: 'tela' | 'leitor' | 'modal'
  let ignorar = 0, fila = [], pend = 0, agendado = false;
  const ocupado = ()=> ignorar>0 || agendado;
  function rodarFila(){ const f = fila; fila = []; f.forEach(x=>x()); }
  function livre(fn){ if(ocupado()) fila.push(fn); else fn(); }
  function empurrar(tipo){
    livre(()=>{ pilha.push(tipo); try{ history.pushState({ch:tipo, n:pilha.length}, ''); }catch(e){} });
  }
  // tira do histórico a camada "tipo" e tudo o que estiver em cima dela (sem mexer na tela)
  function tirar(tipo){
    const i = pilha.lastIndexOf(tipo); if(i<0) return;
    pend += pilha.length - i; pilha.length = i;
    if(agendado) return;
    agendado = true;
    setTimeout(()=>{
      const executar = ()=>{
        agendado = false; const n = pend; pend = 0;
        if(!n){ rodarFila(); return; }
        ignorar++;
        try{ history.go(-n); }catch(e){ ignorar--; rodarFila(); }
      };
      if(ignorar>0) fila.unshift(executar); else executar();
    }, 0);
  }
  window.addEventListener('popstate', ()=>{
    if(ignorar>0){ ignorar--; if(!ocupado()) rodarFila(); return; }
    const tipo = pilha.pop();       // o usuário apertou Voltar
    if(tipo==='modal') fecharModal(true);
    else if(tipo==='menu'){ if(typeof Topo!=='undefined') Topo.fecharGaveta(true); }
    else if(tipo==='leitor'){ if(typeof Leitor!=='undefined') Leitor.fechar(true); }
    else if(tipo==='tela') irTela('inicio', true);
  });
  try{ history.replaceState({ch:'base'}, ''); }catch(e){}
  return { empurrar, tirar, tem: t=>pilha.includes(t) };
})();
function modal(html){
  const jaAberto = $('#modal').classList.contains('on');
  $('#modal-conteudo').innerHTML=html; $('#modal').classList.add('on');
  document.body.classList.add('com-modal');
  if(!jaAberto) Nav.empurrar('modal');
}
function fecharModal(semHistorico){
  const estava = $('#modal').classList.contains('on');
  $('#modal').classList.remove('on'); document.body.classList.remove('com-modal');
  if(estava && semHistorico!==true) Nav.tirar('modal');
}
$('#modal').addEventListener('click', e=>{ if(e.target.id==='modal') fecharModal(); });

/* ----------------------------- estado ----------------------------- */
const CHAVE_H='ch_historias', CHAVE_C='ch_config', CHAVE_S='ch_stats';
/* Segredos (v1.22.0): as chaves de IA e os nomes das crianças NÃO ficam em cfg nem no ch_config; moram só no cofre
   comum (cofre.js, SolverCofre), trancado por PIN. Campo do app → nome no cofre. Veja o módulo Seg logo abaixo. */
const SEGREDOS = {
  geminiKey:'ia:gemini', openaiKey:'ia:openai', elevenKey:'ia:elevenlabs', anthropicKey:'ia:anthropic',
  publicoNomes:'contador:publicoNomes', nomesProtegidos:'contador:nomesProtegidos'
};

const configPadrao = {
  publicoTipo:'', publicoNaHistoria:true, saudarAntes:true,
  motorVoz:'nativo', vozNativa:'', vel:0.95, tom:1.05,
  elevenVoice:'', elevenModel:'eleven_multilingual_v2', elevenEstab:0.45,
  openaiVoice:'nova', openaiModel:'gpt-4o-mini-tts',
  openaiInstr:'Leia como um pai contando história de dormir: voz calma, carinhosa, pausas naturais e emoção nas falas dos personagens.',
  geminiVoice:'Sulafat', geminiModelTts:'gemini-3.1-flash-tts-preview',
  geminiInstr:'Leia esta história de dormir em português do Brasil como um pai contando para as filhas: voz calma e carinhosa, ritmo tranquilo, pausas naturais, e emoção diferente na fala de cada personagem. Não comente nada, apenas leia o texto.',
  assistOne:true,
  solveroneVoz:'', solveroneModeloVoz:'',
  motorTexto:'gemini', geminiModel:'gemini-3.6-flash',
  anthropicModel:'claude-sonnet-4-5', openaiModelTxt:'gpt-4o-mini',
  efeitos:true, volEfeitos:35, durEfeitos:'medio', adiantar:true,
  carregarGithub:true,
  fonte:19, telaAcesa:true, destaque:true, usarVozGuardada:true,
  protegerNomes:true, comandosVoz:false, comandosIA:false,
  tema:'escuro', reduzirAnimacoes:false
};
const statsPadrao = { leituras:0, segundos:0, ultimaNoite:'', sequencia:0 };

function ler(chave, padrao){
  try{ const v=localStorage.getItem(chave); return v? Object.assign({},padrao,JSON.parse(v)) : Object.assign({},padrao); }
  catch(e){ return Object.assign({},padrao); }
}
function salvar(chave,valor){
  if(chave===CHAVE_C) valor = semSegredos(valor);
  try{ localStorage.setItem(chave, JSON.stringify(valor)); }catch(e){ toast('Sem espaço para salvar 😕'); }
}
// o ch_config nunca recebe segredo de volta. O que AINDA estiver lá em texto aberto (esperando o PIN criar o cofre,
// ou a que o cofre ainda não tirou) fica como está: só o cofre.js e o Seg mexem nisso.
function semSegredos(valor){
  const o = Object.assign({}, valor); let antigo = {};
  try{ antigo = JSON.parse(localStorage.getItem(CHAVE_C)||'{}') || {}; }catch(e){}
  Object.keys(SEGREDOS).forEach(c=>{ delete o[c]; if(typeof antigo[c]==='string' && antigo[c]) o[c] = antigo[c]; });
  return o;
}

let cfg = ler(CHAVE_C, configPadrao);
Object.keys(SEGREDOS).forEach(c=>{ delete cfg[c]; });   // o que veio em texto aberto vai para o cofre pelo cofre.js, não fica em cfg
// modelos que o Google tirou do ar para novas chaves: troca e grava
if(/^gemini-(1\.|2\.0|2\.5-flash$|2\.5-pro$|2\.5-flash-lite$)/.test(cfg.geminiModel||'')){
  cfg.geminiModel = 'gemini-3.6-flash';
  salvar(CHAVE_C, cfg);
}
// o envio do acervo para o GitHub saiu (v1.18.0: publicava as histórias da família num arquivo público);
// o token que tinha ficado guardado aqui sai junto — é uma senha e não serve mais para nada
if('ghToken' in cfg || 'ghRepo' in cfg){
  delete cfg.ghToken; delete cfg.ghRepo;
  salvar(CHAVE_C, cfg);
}
let stats = ler(CHAVE_S, statsPadrao);
let historias = [];
try{ historias = JSON.parse(localStorage.getItem(CHAVE_H)||'[]'); }catch(e){ historias=[]; }
if(!Array.isArray(historias)) historias=[];

// toda mudança daqui avisa a nuvem (v1.20.0), que sobe junto daqui a pouco; antes de a nuvem existir, não faz nada
function avisarNuvem(){ try{ Nuvem.mudou(); }catch(e){} }
const salvarCfg = ()=>{ salvar(CHAVE_C,cfg); avisarNuvem(); };
const salvarStats = ()=>{ salvar(CHAVE_S,stats); avisarNuvem(); };

/* ---------- Seg: chaves e nomes no cofre comum (v1.22.0) ----------
   Ler sem esperar:   Seg.agora(campo)  → '' se o cofre está trancado (a tela mostra o aviso do cofre)
   Ler e continuar:   await Seg.ler(campo) → trancado: a janela do PIN abre e a ação segue depois; "Agora não" = erro
   Saber sem abrir:   Seg.tem(campo)
   Gravar:            Seg.gravar(campo, valor) → só no cofre (depois de gravar, tira a cópia antiga do ch_config, se houver)
   Nada daqui volta para o ch_config. Quem digita rápido grava com um pequeno atraso (agendar/descarregar). */
const Seg = (function(){
  const MOTIVO = {pt:'O Contador quer usar as chaves e os nomes das crianças guardados no cofre.', en:'Storyteller wants to use the keys and children\'s names saved in the vault.'};
  const C = ()=> window.SolverCofre || null;
  const nome = c => SEGREDOS[c];
  let pend = Promise.resolve(), recusou = false, ouvintes = [];
  // enquanto a abertura não terminou de conferir o cofre (iniciarCofre), nada de nome nem de "aberto" na tela
  let prontoFlag = false, resolverPronto; const prontoP = new Promise(r=>{ resolverPronto = r; });
  const ocupadoFns = [];                // [{rotulo, fn}]
  const agendados = {}; let relogio = 0;
  const trancadoErro = ()=>{
    const e = new Error(T('O cofre de chaves está trancado. Digite o PIN para usar as chaves guardadas.','The key vault is locked. Type the PIN to use the saved keys.'));
    e.cofreTrancado = true; return e;
  };
  const semCofre = ()=> new Error(T('O cofre de chaves não carregou. Atualize a página.','The key vault did not load. Reload the page.'));
  const tem = c => { const k=C(); return !!(k && k.tem(nome(c))); };
  const agora = c => { const k=C(); return (prontoFlag && k) ? String(k.lerAgora(nome(c))||'') : ''; };
  const aberto = ()=>{ const k=C(); return !!(prontoFlag && k && k.aberto()); };
  const existe = ()=>{ const k=C(); return !!(k && (k.existe() || k.pendentes().length>0)); };
  const pendentes = ()=>{ const k=C(); return k ? k.pendentes().length : 0; };
  // a cópia em texto aberto do ch_config (a que ainda não migrou) sai quando o valor muda ou é apagado
  function tirarCopia(c){
    try{
      const o = JSON.parse(localStorage.getItem(CHAVE_C)||'null');
      if(o && typeof o==='object' && c in o){ delete o[c]; localStorage.setItem(CHAVE_C, JSON.stringify(o)); }
    }catch(e){}
  }
  function descarregar(){
    clearTimeout(relogio);
    Object.keys(agendados).forEach(c=>{ const v = agendados[c]; delete agendados[c]; gravar(c, v).then(()=>avisarOuvintes('digitado', c), ()=>{}); });
  }
  async function ler(c, motivo){
    descarregar();
    await prontoP;
    await pend;
    const k = C(); if(!k) return '';
    try{ return String(await k.ler(nome(c), {motivo: motivo||MOTIVO}) || ''); }
    catch(e){ if(e && e.message==='cofre-trancado'){ recusou = true; throw trancadoErro(); } throw e; }
  }
  // só abre o cofre (se houver o que abrir); o valor lido não interessa
  const abrir = async motivo => { await ler('geminiKey', motivo); };
  // o leitor e a fila de voz perguntam o PIN uma vez; recusou = não insistir até a pessoa pedir algo que precise do cofre
  const precisaPerguntar = ()=> !recusou && !aberto() && existe();
  function gravar(c, valor){
    valor = String(valor==null ? '' : valor).trim();
    // a máscara "••••••••" é só desenho do campo: nunca pode virar o valor guardado
    if(/^[•·●*]{3,}$/.test(valor)) return Promise.reject(new Error(T('Isso é só a máscara da chave. Cole a chave de verdade.','That is just the key mask. Paste the real key.')));
    const p = pend.then(()=>{
      const k = C(); if(!k) throw semCofre();
      return valor ? k.gravar(nome(c), valor, {motivo:MOTIVO}) : k.apagar(nome(c), {motivo:MOTIVO});
    }).then(()=>{ tirarCopia(c); recusou = false; });
    pend = p.catch(()=>{});
    return p.catch(e=>{ if(e && e.message==='cofre-trancado') throw trancadoErro(); throw e; });
  }
  function agendar(c, valor){
    agendados[c] = valor; clearTimeout(relogio); relogio = setTimeout(descarregar, 450);
  }
  const emEspera = ()=> Object.keys(agendados).length > 0;
  const aoMudar = fn => { ouvintes.push(fn); };
  const avisarOuvintes = (ev, extra) => ouvintes.slice().forEach(fn=>{ try{ fn(ev, extra); }catch(e){} });
  // a abertura terminou de conferir o cofre: agora a tela pode mostrar o que o cofre tem
  const liberar = ()=>{ prontoFlag = true; resolverPronto(); avisarOuvintes('pronto'); };
  // trabalho rodando (fila de voz, geração, cópia, áudio tocando…): só adia o relógio de 5 minutos do trancar sozinho.
  // fn() devolve false, true ou um texto que diz qual (ex.: 'tarefa:copia'); ocupado() devolve a lista dos rótulos que estão valendo.
  const ocupadoSe = (rotulo, fn) => { ocupadoFns.push({rotulo, fn}); };
  const ocupado = ()=> ocupadoFns.map(o=>{ try{ const r = o.fn(); return r ? (typeof r==='string' ? r : o.rotulo) : ''; }catch(e){ return ''; } }).filter(Boolean);
  // "mostrar": tranca e pede o PIN de novo (quem pegou o celular aberto não vê a chave sem o PIN)
  async function reautenticar(motivo){
    const k = C(); if(!k) return false;
    await k.trancar();
    return k.pedir({motivo: motivo||MOTIVO});
  }
  ['cofre:aberto','cofre:trancado','cofre:mudou','cofre:migrado'].forEach(ev=>{
    document.addEventListener(ev, ()=>{ if(ev==='cofre:trancado') recusou = false; avisarOuvintes(ev); });
  });
  document.addEventListener('visibilitychange', ()=>{ if(document.hidden) descarregar(); });
  window.addEventListener('pagehide', descarregar);
  return { tem, agora, ler, abrir, gravar, agendar, descarregar, aberto, existe, pendentes, precisaPerguntar, emEspera, aoMudar, MOTIVO,
           liberar, ocupadoSe, ocupado, reautenticar,
           pedir: motivo=>{ const k=C(); return k ? k.pedir({motivo: motivo||MOTIVO}) : Promise.resolve(false); },
           trancar: ()=>{ const k=C(); return k ? k.trancar() : Promise.resolve(true); } };
})();
/* ---------- onde ficam as histórias (v1.19.0) ----------
   Antes: localStorage (uns 5 MB; com muitas histórias o app parava de salvar). Agora: IndexedDB (banco ch_dados, loja
   kv, chave 'historias', o mesmo JSON de antes). Na primeira abertura COPIA, CONFERE e só então apaga a lista antiga do
   localStorage. Sem IndexedDB (navegador antigo ou janela anônima que bloqueia), continua no localStorage como antes.
   O id das histórias nunca muda aqui: é ele que liga cada história à voz guardada. */
const Dados = (function(){
  let db = null, carregado = false, pendente = false, usaIDB = false;
  const esperando = [];
  const abrir = ()=> new Promise((ok, falha)=>{
    if(!('indexedDB' in window)) return falha(new Error('sem IndexedDB'));
    let r; try{ r = indexedDB.open('ch_dados', 1); }catch(e){ return falha(e); }
    r.onupgradeneeded = ()=>{ r.result.createObjectStore('kv'); };
    r.onsuccess = ()=>ok(r.result); r.onerror = ()=>falha(r.error); r.onblocked = ()=>falha(new Error('bloqueado'));
  });
  const ler = k => new Promise((ok, falha)=>{ const q = db.transaction('kv','readonly').objectStore('kv').get(k); q.onsuccess = ()=>ok(q.result); q.onerror = ()=>falha(q.error); });
  const gravar = (k, v) => new Promise((ok, falha)=>{ const tx = db.transaction('kv','readwrite'); tx.objectStore('kv').put(v, k); tx.oncomplete = ()=>ok(); tx.onerror = ()=>falha(tx.error); tx.onabort = ()=>falha(tx.error); });
  const lista = txt => { try{ const v = JSON.parse(txt||'[]'); return Array.isArray(v) ? v : []; }catch(e){ return []; } };
  // junta duas listas sem repetir (pelo id); em caso de id igual, vale a primeira
  const juntar = (a, b) => { const ids = new Set(a.map(h=>h && h.id)); return a.concat(b.filter(h=>h && !ids.has(h.id))); };
  function pronto(){ carregado = true; while(esperando.length) esperando.shift()(); if(pendente){ pendente = false; salvar(); } }
  async function iniciar(){
    try{ db = await abrir(); usaIDB = true; }catch(e){ usaIDB = false; pronto(); return; }
    try{
      let guardadas = lista(await ler('historias'));
      const antiga = localStorage.getItem(CHAVE_H);
      if(antiga !== null){
        const juntas = juntar(guardadas, lista(antiga));
        const txt = JSON.stringify(juntas);
        await gravar('historias', txt);
        if((await ler('historias')) === txt) localStorage.removeItem(CHAVE_H);   // conferido: só agora a antiga sai
        guardadas = juntas;
      }
      historias = juntar(historias, guardadas);   // o que mudou na memória enquanto carregava vence
    }catch(e){ usaIDB = false; }                 // deu errado no meio: continua no localStorage, que ainda está lá
    pronto();
  }
  function salvar(){
    if(!carregado){ pendente = true; return; }
    const txt = JSON.stringify(historias);
    if(!usaIDB){ try{ localStorage.setItem(CHAVE_H, txt); }catch(e){ toast(T('Sem espaço no celular 😕','No space left on the phone 😕')); } return; }
    gravar('historias', txt).catch(()=>toast(T('Sem espaço no aparelho para salvar 😕','No space on the device to save 😕')));
  }
  async function apagar(){
    try{ localStorage.removeItem(CHAVE_H); }catch(e){}
    if(usaIDB) await gravar('historias', '[]').catch(()=>{});
  }
  // outras coisas deste aparelho na mesma loja (a nuvem guarda aqui a chave e o que já subiu); só com IndexedDB
  const lerKV = k => usaIDB ? ler(k) : Promise.resolve(undefined);
  const gravarKV = (k, v) => usaIDB ? gravar(k, v) : Promise.reject(new Error('sem IndexedDB'));
  const apagarKV = k => !usaIDB ? Promise.resolve() : new Promise((ok, falha)=>{ const tx = db.transaction('kv','readwrite'); tx.objectStore('kv').delete(k); tx.oncomplete = ()=>ok(); tx.onerror = ()=>falha(tx.error); });
  return { iniciar, salvar, apagar, lerKV, gravarKV, apagarKV, carregou: ()=>carregado, esperar: ()=> carregado ? Promise.resolve() : new Promise(r=>esperando.push(r)), noIndexedDB: ()=>usaIDB };
})();
const salvarHistorias = ()=>{ Dados.salvar(); avisarNuvem(); };

/* ----------------------------- texto / marcadores ----------------------------- */
// quanto tempo cada ambiente fica tocando antes de sumir devagar
const DURACAO_SOM = { chuva:13, vento:9, mar:13, floresta:11, fogueira:11, noite:10 };
const MULT_DURACAO = { curto:0.55, medio:1, longo:1.7 };
const SONS = {
  chuva:{e:'🌧️',n:'Chuva'}, vento:{e:'🌬️',n:'Vento'}, mar:{e:'🌊',n:'Mar'},
  floresta:{e:'🌳',n:'Floresta'}, fogueira:{e:'🔥',n:'Fogueira'}, noite:{e:'🌙',n:'Noite'},
  trovao:{e:'⛈️',n:'Trovão'}, magia:{e:'✨',n:'Magia'}, sino:{e:'🔔',n:'Sino'},
  passos:{e:'👣',n:'Passos'}, coracao:{e:'💗',n:'Coração'},
  explosao:{e:'💥',n:'Explosão'}, tiro:{e:'🎯',n:'Tiro'}, galope:{e:'🐎',n:'Galope'},
  latido:{e:'🐶',n:'Cachorro'}, miado:{e:'🐱',n:'Gato'}, mugido:{e:'🐄',n:'Vaca'},
  rugido:{e:'🦁',n:'Leão'}, chiado:{e:'🐍',n:'Cobra'}, coruja:{e:'🦉',n:'Coruja'},
  galo:{e:'🐓',n:'Galo'}, sapo:{e:'🐸',n:'Sapo'}, elefante:{e:'🐘',n:'Elefante'},
  fim:{e:'🤫',n:'Silêncio'}
};
const RE_SOM = /\[som:\s*([a-zà-ú]+)\s*\]/gi;

// quebra o texto em "pedaços": frases para ler + marcadores de som
function analisar(texto){
  const partes=[];
  const linhas = String(texto||'').split(/\n+/);
  linhas.forEach((linha, li)=>{
    let resto = linha, m;
    RE_SOM.lastIndex = 0;
    let ultimo = 0;
    const achados=[];
    while((m = RE_SOM.exec(linha))!==null) achados.push({i:m.index, len:m[0].length, som:m[1].toLowerCase()});
    if(achados.length===0){ empurrarFrases(partes, linha, li); return; }
    achados.forEach(a=>{
      empurrarFrases(partes, linha.slice(ultimo,a.i), li);
      partes.push({tipo:'som', som:a.som});
      ultimo = a.i + a.len;
    });
    empurrarFrases(partes, linha.slice(ultimo), li);
  });
  return partes;
}
function empurrarFrases(partes, trecho, paragrafo){
  const t = String(trecho||'').trim();
  if(!t) return;
  // divide em frases mantendo a pontuação
  const frases = t.match(/[^.!?…]+[.!?…]+["'”’)\]]*|\S[^.!?…]*$/g) || [t];
  frases.forEach(f=>{
    const s=f.trim();
    if(s) partes.push({tipo:'frase', texto:s, p:paragrafo});
  });
}
const semMarcadores = t => String(t||'').replace(RE_SOM,' ').replace(/[ \t]{2,}/g,' ').trim();
const contarPalavras = t => semMarcadores(t).split(/\s+/).filter(Boolean).length;
const minutosDe = t => Math.max(1, Math.round(contarPalavras(t)/140));

/* ----------------------------- efeitos sonoros (Web Audio) ----------------------------- */
const Som = (function(){
  let ctx=null, master=null, atual=null, ativos=[];
  function iniciar(){
    if(ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if(!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = cfg.volEfeitos/100;
    master.connect(ctx.destination);
    return ctx;
  }
  function volume(v){ if(master) master.gain.setTargetAtTime(v, ctx.currentTime, .2); }
  function ruido(tipo){
    const len = ctx.sampleRate*2;
    const buf = ctx.createBuffer(1,len,ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last=0;
    for(let i=0;i<len;i++){
      const w = Math.random()*2-1;
      if(tipo==='marrom'){ last=(last+0.02*w)/1.02; d[i]=last*3.5; }
      else d[i]=w;
    }
    const src = ctx.createBufferSource(); src.buffer=buf; src.loop=true; return src;
  }
  function fade(g, para, t){ g.gain.setTargetAtTime(para, ctx.currentTime, t||.6); }
  function registrar(nos, ganho, segundos){
    const item = {nos, ganho, fim:null};
    ativos.push(item);
    if(segundos>0){
      item.fim = setTimeout(()=>{
        try{
          fade(item.ganho, 0, .9);                       // some devagar, sem corte seco
          setTimeout(()=>{
            item.nos.forEach(n=>{ try{ n.stop&&n.stop(); n.disconnect&&n.disconnect(); }catch(e){} });
            ativos = ativos.filter(x=>x!==item);
            if(atual && ativos.length===0) atual=null;
          }, 3000);
        }catch(e){}
      }, segundos*1000);
    }
  }

  function pararTudo(rapido){
    ativos.forEach(a=>{
      try{
        if(a.fim) clearTimeout(a.fim);
        fade(a.ganho, 0, rapido?.15:.9);
        setTimeout(()=>{ a.nos.forEach(n=>{ try{ n.stop&&n.stop(); n.disconnect&&n.disconnect(); }catch(e){} }); }, rapido?400:1600);
      }catch(e){}
    });
    ativos=[]; atual=null;
  }

  const receitas = {
    chuva(){ const s=ruido('branco'), f=ctx.createBiquadFilter(), g=ctx.createGain();
      f.type='bandpass'; f.frequency.value=1300; f.Q.value=.5; g.gain.value=0;
      s.connect(f); f.connect(g); g.connect(master); s.start(); fade(g,.22,1.2); return {nos:[s],ganho:g}; },
    vento(){ const s=ruido('marrom'), f=ctx.createBiquadFilter(), g=ctx.createGain(),
        lfo=ctx.createOscillator(), lg=ctx.createGain();
      f.type='lowpass'; f.frequency.value=520; g.gain.value=0;
      lfo.frequency.value=.08; lg.gain.value=260; lfo.connect(lg); lg.connect(f.frequency); lfo.start();
      s.connect(f); f.connect(g); g.connect(master); s.start(); fade(g,.3,1.4); return {nos:[s,lfo],ganho:g}; },
    mar(){ const s=ruido('marrom'), f=ctx.createBiquadFilter(), g=ctx.createGain(),
        lfo=ctx.createOscillator(), lg=ctx.createGain();
      f.type='lowpass'; f.frequency.value=900; g.gain.value=.05;
      lfo.frequency.value=.11; lg.gain.value=.16; lfo.connect(lg); lg.connect(g.gain); lfo.start();
      s.connect(f); f.connect(g); g.connect(master); s.start(); return {nos:[s,lfo],ganho:g}; },
    fogueira(){ const s=ruido('marrom'), f=ctx.createBiquadFilter(), g=ctx.createGain();
      f.type='lowpass'; f.frequency.value=800; g.gain.value=0;
      s.connect(f); f.connect(g); g.connect(master); s.start(); fade(g,.26,1);
      const t=setInterval(()=>{ if(!ctx) return; estalo(g); }, 260);
      return {nos:[s,{stop:()=>clearInterval(t),disconnect:()=>{}}],ganho:g}; },
    floresta(){ const s=ruido('branco'), f=ctx.createBiquadFilter(), g=ctx.createGain();
      f.type='highpass'; f.frequency.value=2600; g.gain.value=0;
      s.connect(f); f.connect(g); g.connect(master); s.start(); fade(g,.06,1);
      const t=setInterval(()=>{ if(Math.random()<.6) passaro(); }, 1500);
      return {nos:[s,{stop:()=>clearInterval(t),disconnect:()=>{}}],ganho:g}; },
    noite(){ const g=ctx.createGain(); g.gain.value=.5; g.connect(master);
      const t=setInterval(()=>{ grilo(g); }, 900);
      return {nos:[{stop:()=>clearInterval(t),disconnect:()=>{}}],ganho:g}; }
  };
  function estalo(dest){
    const o=ctx.createOscillator(), g=ctx.createGain();
    o.type='square'; o.frequency.value=90+Math.random()*380;
    g.gain.setValueAtTime(.0001,ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(.05+Math.random()*.05, ctx.currentTime+.004);
    g.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime+.09);
    o.connect(g); g.connect(dest); o.start(); o.stop(ctx.currentTime+.12);
  }
  function passaro(){
    const o=ctx.createOscillator(), g=ctx.createGain(), t=ctx.currentTime;
    o.type='sine'; const base=1800+Math.random()*1400;
    o.frequency.setValueAtTime(base,t);
    o.frequency.exponentialRampToValueAtTime(base*(1.3+Math.random()*.5), t+.07);
    o.frequency.exponentialRampToValueAtTime(base*.85, t+.16);
    g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.07,t+.03);
    g.gain.exponentialRampToValueAtTime(.0001,t+.2);
    o.connect(g); g.connect(master); o.start(t); o.stop(t+.25);
  }
  function grilo(dest){
    const t=ctx.currentTime;
    for(let k=0;k<3;k++){
      const o=ctx.createOscillator(), g=ctx.createGain(), s=t+k*.055;
      o.type='triangle'; o.frequency.value=4400;
      g.gain.setValueAtTime(.0001,s); g.gain.exponentialRampToValueAtTime(.04,s+.005);
      g.gain.exponentialRampToValueAtTime(.0001,s+.035);
      o.connect(g); g.connect(dest); o.start(s); o.stop(s+.05);
    }
  }
  const pontuais = {
    explosao(){
      const t=ctx.currentTime;
      const s=ruido('branco'), f=ctx.createBiquadFilter(), g=ctx.createGain();
      f.type='lowpass'; f.frequency.setValueAtTime(1600,t); f.frequency.exponentialRampToValueAtTime(70,t+1.9);
      g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.85,t+.012);
      g.gain.exponentialRampToValueAtTime(.0001,t+2);
      s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t+2.1);
      const o=ctx.createOscillator(), og=ctx.createGain();
      o.type='sine'; o.frequency.setValueAtTime(90,t); o.frequency.exponentialRampToValueAtTime(28,t+.9);
      og.gain.setValueAtTime(.0001,t); og.gain.exponentialRampToValueAtTime(.6,t+.02);
      og.gain.exponentialRampToValueAtTime(.0001,t+1.2);
      o.connect(og); og.connect(master); o.start(t); o.stop(t+1.3);
    },
    tiro(){
      const t=ctx.currentTime;
      const s=ruido('branco'), f=ctx.createBiquadFilter(), g=ctx.createGain();
      f.type='highpass'; f.frequency.value=900;
      g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.7,t+.004);
      g.gain.exponentialRampToValueAtTime(.0001,t+.18);
      s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t+.2);
      const o=ctx.createOscillator(), og=ctx.createGain();
      o.type='sine'; o.frequency.setValueAtTime(160,t); o.frequency.exponentialRampToValueAtTime(45,t+.22);
      og.gain.setValueAtTime(.0001,t); og.gain.exponentialRampToValueAtTime(.45,t+.01);
      og.gain.exponentialRampToValueAtTime(.0001,t+.3);
      o.connect(og); og.connect(master); o.start(t); o.stop(t+.35);
    },
    galope(){
      const t=ctx.currentTime;
      const casco=(q,forte)=>{
        const s=ruido('marrom'), f=ctx.createBiquadFilter(), g=ctx.createGain();
        f.type='bandpass'; f.frequency.value=forte?170:240; f.Q.value=2.2;
        g.gain.setValueAtTime(.0001,q); g.gain.exponentialRampToValueAtTime(forte?.5:.32,q+.006);
        g.gain.exponentialRampToValueAtTime(.0001,q+.11);
        s.connect(f); f.connect(g); g.connect(master); s.start(q); s.stop(q+.15);
      };
      // dois compassos de galope: ta-ta-TUM
      [0,.11,.25, .58,.69,.83, 1.16,1.27,1.41].forEach((d,i)=>casco(t+d, i%3===2));
    },
    latido(){
      const t=ctx.currentTime;
      const au=(q)=>{
        const o=ctx.createOscillator(), f=ctx.createBiquadFilter(), g=ctx.createGain();
        o.type='sawtooth';
        o.frequency.setValueAtTime(420,q); o.frequency.exponentialRampToValueAtTime(170,q+.16);
        f.type='bandpass'; f.frequency.setValueAtTime(1100,q); f.frequency.exponentialRampToValueAtTime(700,q+.16); f.Q.value=3;
        g.gain.setValueAtTime(.0001,q); g.gain.exponentialRampToValueAtTime(.4,q+.012);
        g.gain.exponentialRampToValueAtTime(.0001,q+.2);
        o.connect(f); f.connect(g); g.connect(master); o.start(q); o.stop(q+.24);
        const s=ruido('branco'), nf=ctx.createBiquadFilter(), ng=ctx.createGain();
        nf.type='bandpass'; nf.frequency.value=1800; nf.Q.value=1.2;
        ng.gain.setValueAtTime(.0001,q); ng.gain.exponentialRampToValueAtTime(.1,q+.01);
        ng.gain.exponentialRampToValueAtTime(.0001,q+.14);
        s.connect(nf); nf.connect(ng); ng.connect(master); s.start(q); s.stop(q+.18);
      };
      au(t); au(t+.34);
    },
    miado(){
      const t=ctx.currentTime;
      const o=ctx.createOscillator(), f=ctx.createBiquadFilter(), g=ctx.createGain(),
            lfo=ctx.createOscillator(), lg=ctx.createGain();
      o.type='sawtooth';
      o.frequency.setValueAtTime(520,t);
      o.frequency.linearRampToValueAtTime(880,t+.28);
      o.frequency.linearRampToValueAtTime(430,t+.95);
      lfo.frequency.value=6.5; lg.gain.value=22; lfo.connect(lg); lg.connect(o.frequency); lfo.start(t);
      f.type='bandpass'; f.frequency.setValueAtTime(1300,t);
      f.frequency.linearRampToValueAtTime(850,t+.95); f.Q.value=3.5;
      g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.34,t+.1);
      g.gain.setValueAtTime(.34,t+.6); g.gain.exponentialRampToValueAtTime(.0001,t+1.05);
      o.connect(f); f.connect(g); g.connect(master);
      o.start(t); o.stop(t+1.1); lfo.stop(t+1.1);
    },
    mugido(){
      const t=ctx.currentTime;
      const o=ctx.createOscillator(), f=ctx.createBiquadFilter(), g=ctx.createGain();
      o.type='sawtooth';
      o.frequency.setValueAtTime(155,t);
      o.frequency.linearRampToValueAtTime(128,t+.5);
      o.frequency.linearRampToValueAtTime(96,t+1.5);
      f.type='lowpass'; f.frequency.setValueAtTime(700,t); f.frequency.linearRampToValueAtTime(420,t+1.5); f.Q.value=1.4;
      g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.42,t+.25);
      g.gain.setValueAtTime(.42,t+.9); g.gain.exponentialRampToValueAtTime(.0001,t+1.7);
      o.connect(f); f.connect(g); g.connect(master); o.start(t); o.stop(t+1.8);
    },
    rugido(){
      const t=ctx.currentTime;
      const s=ruido('marrom'), f=ctx.createBiquadFilter(), g=ctx.createGain(),
            o=ctx.createOscillator(), og=ctx.createGain(),
            am=ctx.createOscillator(), ag=ctx.createGain();
      f.type='lowpass'; f.frequency.setValueAtTime(320,t);
      f.frequency.linearRampToValueAtTime(640,t+.6); f.frequency.linearRampToValueAtTime(220,t+1.8);
      g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.55,t+.35);
      g.gain.setValueAtTime(.55,t+1.1); g.gain.exponentialRampToValueAtTime(.0001,t+2);
      am.frequency.value=27; ag.gain.value=.3; am.connect(ag); ag.connect(g.gain); am.start(t);
      s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t+2.1);
      o.type='sawtooth'; o.frequency.setValueAtTime(78,t); o.frequency.linearRampToValueAtTime(58,t+1.8);
      og.gain.setValueAtTime(.0001,t); og.gain.exponentialRampToValueAtTime(.3,t+.35);
      og.gain.exponentialRampToValueAtTime(.0001,t+2);
      o.connect(og); og.connect(master); o.start(t); o.stop(t+2.1); am.stop(t+2.1);
    },
    chiado(){
      const t=ctx.currentTime;
      const s=ruido('branco'), f=ctx.createBiquadFilter(), g=ctx.createGain(),
            lfo=ctx.createOscillator(), lg=ctx.createGain();
      f.type='bandpass'; f.frequency.value=5200; f.Q.value=1.1;
      g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.22,t+.15);
      g.gain.setValueAtTime(.22,t+1.1); g.gain.exponentialRampToValueAtTime(.0001,t+1.6);
      lfo.frequency.value=9; lg.gain.value=.05; lfo.connect(lg); lg.connect(g.gain); lfo.start(t);
      s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t+1.7); lfo.stop(t+1.7);
    },
    coruja(){
      const t=ctx.currentTime;
      const piu=(q,dur)=>{
        const o=ctx.createOscillator(), g=ctx.createGain(), lfo=ctx.createOscillator(), lg=ctx.createGain();
        o.type='sine'; o.frequency.setValueAtTime(430,q);
        o.frequency.linearRampToValueAtTime(390,q+dur);
        lfo.frequency.value=5.5; lg.gain.value=9; lfo.connect(lg); lg.connect(o.frequency); lfo.start(q);
        g.gain.setValueAtTime(.0001,q); g.gain.exponentialRampToValueAtTime(.28,q+.08);
        g.gain.exponentialRampToValueAtTime(.0001,q+dur);
        o.connect(g); g.connect(master); o.start(q); o.stop(q+dur+.05); lfo.stop(q+dur+.05);
      };
      piu(t,.32); piu(t+.55,.5);
    },
    galo(){
      const t=ctx.currentTime;
      const nota=(q,fq,dur,vol)=>{
        const o=ctx.createOscillator(), f=ctx.createBiquadFilter(), g=ctx.createGain();
        o.type='sawtooth'; o.frequency.setValueAtTime(fq,q);
        o.frequency.linearRampToValueAtTime(fq*.92,q+dur);
        f.type='bandpass'; f.frequency.value=fq*2.1; f.Q.value=2.5;
        g.gain.setValueAtTime(.0001,q); g.gain.exponentialRampToValueAtTime(vol,q+.03);
        g.gain.exponentialRampToValueAtTime(.0001,q+dur);
        o.connect(f); f.connect(g); g.connect(master); o.start(q); o.stop(q+dur+.04);
      };
      nota(t,720,.2,.3); nota(t+.24,930,.18,.32); nota(t+.45,1180,.3,.34); nota(t+.8,620,.45,.28);
    },
    sapo(){
      const t=ctx.currentTime;
      const croac=(q)=>{
        const o=ctx.createOscillator(), f=ctx.createBiquadFilter(), g=ctx.createGain(),
              am=ctx.createOscillator(), ag=ctx.createGain();
        o.type='sawtooth'; o.frequency.value=185;
        f.type='lowpass'; f.frequency.value=900;
        g.gain.setValueAtTime(.0001,q); g.gain.exponentialRampToValueAtTime(.3,q+.03);
        g.gain.exponentialRampToValueAtTime(.0001,q+.3);
        am.frequency.value=32; ag.gain.value=.22; am.connect(ag); ag.connect(g.gain); am.start(q);
        o.connect(f); f.connect(g); g.connect(master); o.start(q); o.stop(q+.34); am.stop(q+.34);
      };
      croac(t); croac(t+.5); croac(t+.92);
    },
    elefante(){
      const t=ctx.currentTime;
      const o=ctx.createOscillator(), f=ctx.createBiquadFilter(), g=ctx.createGain(),
            lfo=ctx.createOscillator(), lg=ctx.createGain();
      o.type='sawtooth';
      o.frequency.setValueAtTime(210,t);
      o.frequency.linearRampToValueAtTime(520,t+.35);
      o.frequency.linearRampToValueAtTime(430,t+1.1);
      lfo.frequency.value=7; lg.gain.value=26; lfo.connect(lg); lg.connect(o.frequency); lfo.start(t);
      f.type='bandpass'; f.frequency.value=900; f.Q.value=1.6;
      g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.4,t+.12);
      g.gain.setValueAtTime(.4,t+.8); g.gain.exponentialRampToValueAtTime(.0001,t+1.35);
      o.connect(f); f.connect(g); g.connect(master); o.start(t); o.stop(t+1.4); lfo.stop(t+1.4);
    },
    trovao(){ const s=ruido('marrom'), f=ctx.createBiquadFilter(), g=ctx.createGain(), t=ctx.currentTime;
      f.type='lowpass'; f.frequency.setValueAtTime(420,t); f.frequency.exponentialRampToValueAtTime(90,t+2.4);
      g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.55,t+.12);
      g.gain.exponentialRampToValueAtTime(.0001,t+2.6);
      s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t+2.8); },
    magia(){ const t=ctx.currentTime; [0,1,2,3,4,5].forEach((k)=>{
        const o=ctx.createOscillator(), g=ctx.createGain(), s=t+k*.07;
        o.type='sine'; o.frequency.setValueAtTime(700*Math.pow(1.26,k),s);
        o.frequency.exponentialRampToValueAtTime(700*Math.pow(1.26,k)*2,s+.3);
        g.gain.setValueAtTime(.0001,s); g.gain.exponentialRampToValueAtTime(.1,s+.02);
        g.gain.exponentialRampToValueAtTime(.0001,s+.4);
        o.connect(g); g.connect(master); o.start(s); o.stop(s+.45); }); },
    sino(){ const t=ctx.currentTime; [523.25,659.25,783.99].forEach((fq,k)=>{
        const o=ctx.createOscillator(), g=ctx.createGain(), s=t+k*.012;
        o.type='sine'; o.frequency.value=fq;
        g.gain.setValueAtTime(.0001,s); g.gain.exponentialRampToValueAtTime(.16,s+.01);
        g.gain.exponentialRampToValueAtTime(.0001,s+2.2);
        o.connect(g); g.connect(master); o.start(s); o.stop(s+2.4); }); },
    passos(){ const t=ctx.currentTime; for(let k=0;k<4;k++){
        const s=ruido('marrom'), f=ctx.createBiquadFilter(), g=ctx.createGain(), q=t+k*.38;
        f.type='lowpass'; f.frequency.value=220;
        g.gain.setValueAtTime(.0001,q); g.gain.exponentialRampToValueAtTime(.3,q+.01);
        g.gain.exponentialRampToValueAtTime(.0001,q+.14);
        s.connect(f); f.connect(g); g.connect(master); s.start(q); s.stop(q+.2); } },
    coracao(){ const t=ctx.currentTime; for(let k=0;k<6;k++){
        const o=ctx.createOscillator(), g=ctx.createGain(), q=t+Math.floor(k/2)*.85+(k%2)*.22;
        o.type='sine'; o.frequency.setValueAtTime(70,q); o.frequency.exponentialRampToValueAtTime(42,q+.14);
        g.gain.setValueAtTime(.0001,q); g.gain.exponentialRampToValueAtTime(.35,q+.02);
        g.gain.exponentialRampToValueAtTime(.0001,q+.22);
        o.connect(g); g.connect(master); o.start(q); o.stop(q+.3); } }
  };

  return {
    ligar(){ if(!ctx) iniciar(); if(ctx && ctx.state==='suspended') ctx.resume(); },
    volume(v){ if(!ctx) return; volume(v); },
    tocar(nome){
      if(!cfg.efeitos) return;
      if(!iniciar()) return;
      if(ctx.state==='suspended') ctx.resume();
      nome = String(nome||'').toLowerCase();
      if(nome==='fim'||nome==='parar'||nome==='silencio'){ pararTudo(); return; }
      if(pontuais[nome]){ try{ pontuais[nome](); }catch(e){} return; }
      if(receitas[nome]){
        if(atual===nome && ativos.length) return;
        pararTudo();
        const mult = MULT_DURACAO[cfg.durEfeitos] || 1;
        const segundos = Math.round((DURACAO_SOM[nome]||10) * mult);
        try{ const r=receitas[nome](); registrar(r.nos, r.ganho, segundos); atual=nome; }catch(e){}
      }
    },
    parar(rapido){ if(ctx) pararTudo(rapido); }
  };
})();

/* ----------------------------- vozes / leitura ----------------------------- */
/* ----------------------------- voz do aparelho (Web Speech API) -----------------------------
   Regras que valem em qualquer aparelho (Android, iPhone, Windows, Mac):
   - só dá para usar as vozes que o navegador devolve em getVoices(); não dá para forçar outra;
   - a lista chega atrasada e muda (evento voiceschanged) — por isso recarregamos várias vezes;
   - no Android o navegador só enxerga o MECANISMO PADRÃO escolhido nas Configurações
     (Google, Samsung, SherpaTTS, Acapela…) e guarda a lista até ser fechado de vez;
   - "Padrão do aparelho" = não escolher voz nenhuma e só pedir pt-BR: o Android usa
     o mecanismo padrão, seja ele qual for. É o caminho mais seguro com SherpaTTS/Acapela.
   ---------------------------------------------------------------------------------------- */
let vozesNativas=[];
const VOZ_PADRAO_APARELHO = '__padrao__';

function langNorm(l){ return String(l||'').replace('_','-').toLowerCase(); }
function ehPortugues(v){ const l=langNorm(v.lang); return l.startsWith('pt') || l.startsWith('por'); }
function ehPtBr(v){ const l=langNorm(v.lang); return l==='pt-br' || l==='por-bra' || l==='pt-br-x-multi'; }
function pareceNatural(v){ return /natural|online|neural|enhanced|premium|wavenet|piper|sherpa|coqui|vits|acapela|kokoro|woheller|ttsengine|-(low|medium|high)\b/i.test(v.name+' '+v.voiceURI); }
function nomeMotor(v){
  const s=(v.name+' '+v.voiceURI).toLowerCase();
  if(/sherpa|piper|coqui|vits|woheller|ttsengine|-(low|medium|high)\b/.test(s)) return 'SherpaTTS';
  if(/acapela/.test(s)) return 'Acapela';
  if(/samsung|smt/.test(s)) return 'Samsung';
  if(/google|gsm|com\.google/.test(s)) return 'Google';
  if(/microsoft/.test(s)) return 'Microsoft';
  if(/apple|com\.apple/.test(s)) return 'Apple';
  return '';
}

function carregarVozesNativas(){
  if(!('speechSynthesis' in window)) return;
  vozesNativas = speechSynthesis.getVoices()||[];
  const sel=$('#sel-voz-nativa'); if(!sel) return;
  const nota = v => (ehPtBr(v)?3:(ehPortugues(v)?2:0)) + (pareceNatural(v)?1:0);
  const lista = vozesNativas.slice().sort((a,b)=> nota(b)-nota(a) || a.name.localeCompare(b.name));
  const pt = lista.filter(ehPortugues);
  sel.innerHTML =
    `<option value="${VOZ_PADRAO_APARELHO}">🔧 Padrão do aparelho (o mecanismo escolhido nas Configurações)</option>` +
    lista.map(v=>`<option value="${esc(v.voiceURI)}">${pareceNatural(v)?'⭐ ':''}${esc(v.name)} — ${esc(v.lang)}${ehPortugues(v)?' ✅':''}</option>`).join('');
  if(cfg.vozNativa===VOZ_PADRAO_APARELHO || (cfg.vozNativa && lista.some(v=>v.voiceURI===cfg.vozNativa))) sel.value=cfg.vozNativa;
  else if(pt[0]){ sel.value=pt[0].voiceURI; cfg.vozNativa=pt[0].voiceURI; salvarCfg(); }
  else { sel.value=VOZ_PADRAO_APARELHO; cfg.vozNativa=VOZ_PADRAO_APARELHO; salvarCfg(); }

  // diagnóstico: o que o navegador está enxergando agora
  const d=$('#diag-vozes');
  if(d){
    const motores = Array.from(new Set(lista.map(nomeMotor).filter(Boolean)));
    d.innerHTML = lista.length
      ? `O navegador enxerga <b>${lista.length}</b> voz(es), <b>${pt.length}</b> em português` +
        (motores.length? ` · mecanismos: <b>${esc(motores.join(', '))}</b>` : '') + '.'
      : 'O navegador ainda não devolveu nenhuma voz. Toque em <b>Recarregar</b>; se continuar vazio, feche o navegador de vez e abra de novo.';
  }
  const av=$('#aviso-natural');
  if(av) av.classList.toggle('oculto', lista.some(v=>pareceNatural(v) && ehPortugues(v)));
}
if('speechSynthesis' in window){
  speechSynthesis.onvoiceschanged = carregarVozesNativas;
  [120, 900, 3000].forEach(ms=>setTimeout(carregarVozesNativas, ms));
  // voltando das Configurações do Android, a lista pode ter mudado
  document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) setTimeout(carregarVozesNativas, 400); });
}

function falarNativo(texto){
  return new Promise((resolve,reject)=>{
    if(!('speechSynthesis' in window)){ reject(new Error('Este navegador não tem voz embutida.')); return; }
    const u = new SpeechSynthesisUtterance(semMarcadores(texto));
    const escolhida = cfg.vozNativa && cfg.vozNativa!==VOZ_PADRAO_APARELHO
      ? vozesNativas.find(x=>x.voiceURI===cfg.vozNativa) : null;
    if(escolhida) u.voice = escolhida;
    // pt-BR sempre: com "padrão do aparelho" é isso que faz o Android usar o mecanismo escolhido lá
    u.lang = (escolhida && !ehPortugues(escolhida)) ? escolhida.lang : 'pt-BR';
    u.rate = cfg.vel; u.pitch = cfg.tom; u.volume = 1;
    let pronto=false, vigia=null, manter=null;
    const terminar = ()=>{ if(pronto) return; pronto=true; clearTimeout(vigia); clearInterval(manter); resolve(); };
    u.onend = terminar;
    u.onerror = terminar;
    // se a voz travar (acontece no Android), seguimos em frente depois do tempo estimado
    const palavras = semMarcadores(texto).split(/\s+/).filter(Boolean).length;
    const limite = Math.max(6000, (palavras/(2.4*Math.max(.5,cfg.vel)))*1000 + 6000);
    vigia = setTimeout(terminar, limite);
    // o Chrome do Android para sozinho depois de ~15s; isso o mantém acordado
    manter = setInterval(()=>{ try{ if(speechSynthesis.speaking) speechSynthesis.resume(); }catch(e){} }, 9000);
    // limpa fila velha antes de falar (fila presa é a causa mais comum de "não fala nada")
    const falar = ()=>{ try{ speechSynthesis.speak(u); }catch(e){ terminar(); } };
    if(speechSynthesis.speaking || speechSynthesis.pending){ speechSynthesis.cancel(); setTimeout(falar, 60); }
    else falar();
  });
}

/* ---------------- guarda-áudio (IndexedDB): gera uma vez, toca para sempre ------------- */
const Guarda = (function(){
  let db=null, falhou=false;
  // chaves já guardadas de cada história (só os nomes, sem o áudio): servem para achar um trecho pelo texto
  const chavesPorId = new Map();
  function chavesDe(id){
    if(chavesPorId.has(id)) return Promise.resolve(chavesPorId.get(id));
    if(!window.IDBKeyRange) return Promise.resolve([]);
    return op('readonly', s=> s.getAllKeys ? s.getAllKeys(IDBKeyRange.bound(id+'|', id+'|\uffff')) : null)
      .then(r=>{ const l = Array.isArray(r) ? r.map(String) : []; chavesPorId.set(id, l); return l; });
  }
  // Pede ao navegador para não apagar a voz sozinho quando faltar espaço (armazenamento permanente).
  let pediu=false;
  function pedirPersistencia(){
    if(pediu) return; pediu=true;
    try{
      if(navigator.storage && navigator.storage.persist && navigator.storage.persisted)
        navigator.storage.persisted().then(p=>{ if(!p) return navigator.storage.persist(); }).catch(()=>{});
    }catch(e){}
  }
  function abrir(){
    if(db) return Promise.resolve(db);
    if(falhou || !window.indexedDB) return Promise.resolve(null);
    return new Promise(res=>{
      let p;
      try{ p = indexedDB.open('ch_audio', 1); }catch(e){ falhou=true; return res(null); }
      p.onupgradeneeded = ()=>{ try{ p.result.createObjectStore('audio'); }catch(e){} };
      p.onsuccess = ()=>{ db=p.result; res(db); };
      p.onerror = ()=>{ falhou=true; res(null); };
    });
  }
  function op(modo, fn){
    return abrir().then(d=>{ if(!d) return null;
      return new Promise(res=>{
        let t;
        try{ t = d.transaction('audio', modo); }catch(e){ return res(null); }
        const s = t.objectStore('audio');
        const r = fn(s);
        if(r){ r.onsuccess = ()=>res(r.result); r.onerror = ()=>res(null); }
        else { t.oncomplete = ()=>res(true); t.onerror = ()=>res(null); }
      });
    });
  }
  return {
    marca(){
      return cfg.motorVoz==='gemini' ? ('gemini|'+cfg.geminiVoice+'|'+cfg.geminiModelTts)
           : cfg.motorVoz==='elevenlabs' ? ('eleven|'+cfg.elevenVoice+'|'+cfg.elevenModel)
           : cfg.motorVoz==='openai' ? ('openai|'+cfg.openaiVoice+'|'+cfg.openaiModel)
           // SolverONE: o código da voz é estável (definido no RootifyONE); o modelo fica gravado para funcionar sem internet
           : cfg.motorVoz==='solverone' ? ('solverone|'+(cfg.solveroneVoz||'padrao')+'|'+(cfg.solveroneModeloVoz||'padrao')) : 'nativo';
    },
    // chave = id | índice | motor | voz | modelo | hash do texto.
    // "marca" opcional: permite ler a voz guardada de outro motor (ex.: Gemini guardado, celular escolhido).
    hashTexto(txt){ let h=0; for(let k=0;k<txt.length;k++){ h=((h<<5)-h+txt.charCodeAt(k))|0; } return h; },
    chave(idHistoria, i, txt, marca){
      return idHistoria+'|'+i+'|'+(marca||this.marca())+'|'+this.hashTexto(txt);
    },
    // o cumprimento ("Olá <nomes das crianças>…") nunca fica guardado no aparelho (v1.23.0): a chave levava o nome em claro
    pegar(k){ if(/^saudacao\|/.test(String(k))) return Promise.resolve(null); return op('readonly', s=>s.get(k)); },
    existe(k){ if(/^saudacao\|/.test(String(k))) return Promise.resolve(false); return op('readonly', s=>s.getKey(k)).then(r=>!!r); },
    // apaga os cumprimentos que as versões antigas deixaram guardados (a chave de cada um tem o nome das crianças)
    apagarSaudacoes(){ chavesPorId.clear(); return op('readwrite', s=>{ s.delete(IDBKeyRange.bound('saudacao|', 'saudacao|\uffff')); return null; }); },
    guardar(k, blob){
      if(/^saudacao\|/.test(String(k))) return Promise.resolve();
      const id = String(k).split('|')[0];
      if(chavesPorId.has(id) && !chavesPorId.get(id).includes(String(k))) chavesPorId.get(id).push(String(k));
      pedirPersistencia();
      return op('readwrite', s=>s.put(blob,k));
    },
    /* Acha o trecho guardado mesmo que a posição dele tenha mudado (cumprimento ligado ou desligado,
       por exemplo) ou que o modelo da MESMA voz tenha mudado. Quem manda é o texto do trecho.
       Devolve a chave encontrada, ou null. Nunca mistura vozes diferentes. */
    async acharFlex(id, i, txt, marca){
      const exata = this.chave(id, i, txt, marca);
      if(await this.existe(exata)) return exata;
      const h = String(this.hashTexto(txt)), [mot, voz] = String(marca).split('|');
      let parecida = null;
      for(const k of await chavesDe(id)){
        const p = k.split('|'); if(p[p.length-1]!==h) continue;
        const m = p.slice(2,-1);
        if(m.join('|')===marca) return k;
        if(!parecida && m[0]===mot && m[1]===voz) parecida = k;
      }
      return parecida;
    },
    async pegarFlex(id, i, txt, marca){ const k = await this.acharFlex(id, i, txt, marca); return k ? this.pegar(k) : null; },
    pedirPersistencia,
    // true = o navegador não apaga sozinho; false = pode apagar se faltar espaço; null = não dá para saber
    protegida(){
      try{ return navigator.storage && navigator.storage.persisted ? navigator.storage.persisted().catch(()=>null) : Promise.resolve(null); }
      catch(e){ return Promise.resolve(null); }
    },
    // toda a voz guardada: lista de {k, t, n} e os áudios na mesma ordem
    async tudo(){
      const d = await abrir(); const itens=[], blobs=[];
      if(!d) return {itens, blobs};
      await new Promise(res=>{
        let cur; try{ cur = d.transaction('audio','readonly').objectStore('audio').openCursor(); }catch(e){ return res(); }
        cur.onsuccess = e=>{ const c=e.target.result; if(!c) return res();
          if(c.value && c.value.size){ itens.push({k:String(c.key), t:c.value.type||'', n:c.value.size}); blobs.push(c.value); }
          c.continue(); };
        cur.onerror = ()=>res();
      });
      return {itens, blobs};
    },
    // arquivo: "CHVOZ1" + tamanho do índice (4 bytes) + índice em JSON + os áudios, um atrás do outro
    async importar(arquivo, aviso){
      const cab = new Uint8Array(await arquivo.slice(0,10).arrayBuffer());
      if(String.fromCharCode.apply(null, cab.slice(0,6))!=='CHVOZ1') throw new Error(T('Este arquivo não é uma voz guardada do UM Contador de Histórias.','This file is not a ONE Storyteller saved voice.'));
      const tam = new DataView(cab.buffer).getUint32(6, true);
      const indice = JSON.parse(await arquivo.slice(10, 10+tam).text());
      let pos = 10+tam, novos=0, iguais=0;
      const itens = Array.isArray(indice.itens) ? indice.itens : [];
      for(let j=0; j<itens.length; j++){
        const it = itens[j], b = arquivo.slice(pos, pos+it.n, it.t||'audio/mpeg'); pos += it.n;
        if(/^saudacao\|/.test(String(it.k))){ continue; }        // arquivo de versão antiga: o cumprimento não entra
        if(await this.existe(it.k)){ iguais++; continue; }       // o que já existe aqui não é trocado
        await op('readwrite', s=>s.put(b, it.k)); novos++;
        if(aviso && (j%15===0)) aviso(j+1, itens.length);
      }
      chavesPorId.clear(); pedirPersistencia();
      return {novos, iguais, completos: indice.completos || {}};
    },
    async quanto(){
      const d = await abrir(); if(!d) return {n:0, bytes:0};
      return new Promise(res=>{
        let n=0, bytes=0;
        const t=d.transaction('audio','readonly').objectStore('audio').openCursor();
        t.onsuccess = e=>{ const c=e.target.result;
          if(c){ n++; bytes += (c.value && c.value.size) || 0; c.continue(); }
          else res({n,bytes});
        };
        t.onerror = ()=>res({n:0,bytes:0});
      });
    },
    limpar(){ chavesPorId.clear(); return op('readwrite', s=>{ s.clear(); return null; }); },
    // apaga só a voz de uma história (todas as vozes/motores dela)
    limparHistoria(id){
      if(!id || !window.IDBKeyRange) return Promise.resolve(null);
      chavesPorId.delete(id);
      return op('readwrite', s=>s.delete(IDBKeyRange.bound(id+'|', id+'|\uffff')));
    },
    // resumo por história: quantos trechos, quantos bytes e de quais vozes
    async resumo(){
      const vazio = {porHistoria:new Map(), total:{n:0,bytes:0}};
      const d = await abrir(); if(!d) return vazio;
      return new Promise(res=>{
        const m = new Map(), total={n:0,bytes:0};
        let cur;
        try{ cur = d.transaction('audio','readonly').objectStore('audio').openCursor(); }catch(e){ return res(vazio); }
        cur.onsuccess = e=>{
          const c = e.target.result;
          if(!c) return res({porHistoria:m, total});
          const k = String(c.key), b = (c.value && c.value.size) || 0;
          total.n++; total.bytes += b;
          const p = k.split('|');
          let id, marca;
          if(p[0]==='saudacao'){ id='__saudacao__'; marca=p.slice(1,4).join('|'); }
          else { id=p[0]; marca=p.slice(2,-1).join('|'); }
          if(!m.has(id)) m.set(id, {n:0, bytes:0, marcas:{}});
          const r = m.get(id); r.n++; r.bytes += b; r.marcas[marca] = (r.marcas[marca]||0)+1;
          c.continue();
        };
        cur.onerror = ()=>res(vazio);
      });
    }
  };
})();

// nome legível de uma "marca" de voz guardada
function nomeMarca(m){
  const p = String(m||'').split('|');
  if(p[0]==='gemini') return 'Gemini · '+(p[1]||'');
  if(p[0]==='eleven') return 'ElevenLabs';
  if(p[0]==='openai') return 'OpenAI · '+(p[1]||'');
  if(p[0]==='solverone') return 'SolverONE · '+((typeof Plataforma!=='undefined' && Plataforma.nomeVoz(p[1])) || p[1] || '');
  return 'voz do celular';
}
function fmtBytes(b){
  b = b||0;
  if(b < 1024*1024) return Math.max(b?1:0, Math.round(b/1024))+' KB';
  return (b/1048576).toFixed(1).replace('.',',')+' MB';
}
// Mapa id → {n, bytes, marcas}. Atualizado em segundo plano; os cartões leem daqui.
let VOZ_GUARDADA = new Map();
let vozGuardadaTotal = {n:0, bytes:0};
function atualizarVozGuardada(repintar){
  return Guarda.resumo().then(r=>{
    VOZ_GUARDADA = r.porHistoria; vozGuardadaTotal = r.total;
    if(repintar){ try{ pintarAcervo(); pintarInicio(); }catch(e){} }
    return r;
  });
}
// marcas (vozes) em que esta história está inteira no aparelho — vale qualquer que seja a voz escolhida agora
function vozesCompletas(h){
  const r = VOZ_GUARDADA.get(h.id); if(!r) return [];
  const comp = Object.assign({}, h.audioCompleto||{});
  if(h.audioPronto && h.audioMarca && h.audioMarca!=='nativo' && !comp[h.audioMarca]) comp[h.audioMarca] = 1; // versões antigas
  return Object.keys(comp).filter(m=>(r.marcas[m]||0) >= Number(comp[m]||1));
}

/* ---------------------------- motores de voz (devolvem Blob) ---------------------------- */
async function audioElevenlabs(texto){
  const chave = await Seg.ler('elevenKey');
  if(!chave) throw new Error('Cole sua chave da ElevenLabs em Configurações.');
  if(!cfg.elevenVoice) throw new Error('Escolha uma voz da ElevenLabs em Configurações.');
  const r = await fetch('https://api.elevenlabs.io/v1/text-to-speech/'+encodeURIComponent(cfg.elevenVoice), {
    method:'POST',
    headers:{'xi-api-key':chave,'Content-Type':'application/json','Accept':'audio/mpeg'},
    body: JSON.stringify({
      text: semMarcadores(texto),
      model_id: cfg.elevenModel,
      voice_settings:{ stability:Number(cfg.elevenEstab), similarity_boost:0.8, style:0.35, use_speaker_boost:true }
    })
  });
  if(!r.ok) throw new Error('ElevenLabs: '+ r.status +' — '+ (await r.text()).slice(0,180));
  return await r.blob();
}

async function audioOpenai(texto){
  const chave = await Seg.ler('openaiKey');
  if(!chave) throw new Error('Cole sua chave da OpenAI em Configurações.');
  const corpo = { model:cfg.openaiModel, voice:cfg.openaiVoice, input:semMarcadores(texto), response_format:'mp3' };
  if(cfg.openaiModel==='gpt-4o-mini-tts' && cfg.openaiInstr) corpo.instructions = cfg.openaiInstr;
  const r = await fetch('https://api.openai.com/v1/audio/speech', {
    method:'POST',
    headers:{'Authorization':'Bearer '+chave,'Content-Type':'application/json'},
    body: JSON.stringify(corpo)
  });
  if(!r.ok) throw new Error('OpenAI: '+ r.status +' — '+ (await r.text()).slice(0,180));
  return await r.blob();
}

const VOZES_GEMINI = [
 ['Sulafat','calorosa'],['Vindemiatrix','gentil'],['Achernar','suave'],['Leda','jovem'],
 ['Callirrhoe','tranquila'],['Umbriel','tranquila'],['Aoede','leve'],['Enceladus','sussurrada'],
 ['Algieba','macia'],['Despina','macia'],['Achird','amigável'],['Zubenelgenubi','descontraída'],
 ['Erinome','clara'],['Iapetus','clara'],['Autonoe','brilhante'],['Zephyr','brilhante'],
 ['Laomedeia','animada'],['Puck','animada'],['Sadachbia','vivaz'],['Fenrir','empolgada'],
 ['Kore','firme'],['Orus','firme'],['Alnilam','firme'],['Schedar','equilibrada'],
 ['Charon','narradora'],['Rasalgethi','narradora'],['Sadaltager','sábia'],['Gacrux','madura'],
 ['Algenib','rouca'],['Pulcherrima','marcante']
];

// o Gemini devolve PCM cru; aqui vira um arquivo WAV que o navegador toca
function pcmParaWavBlob(base64, taxa){
  const bin = atob(base64), n = bin.length;
  const buf = new ArrayBuffer(44+n), v = new DataView(buf);
  const txt = (p,t)=>{ for(let i=0;i<t.length;i++) v.setUint8(p+i, t.charCodeAt(i)); };
  txt(0,'RIFF'); v.setUint32(4, 36+n, true); txt(8,'WAVE'); txt(12,'fmt ');
  v.setUint32(16,16,true); v.setUint16(20,1,true); v.setUint16(22,1,true);
  v.setUint32(24,taxa,true); v.setUint32(28,taxa*2,true); v.setUint16(32,2,true); v.setUint16(34,16,true);
  txt(36,'data'); v.setUint32(40,n,true);
  const u = new Uint8Array(buf);
  for(let i=0;i<n;i++) u[44+i] = bin.charCodeAt(i);
  return new Blob([buf],{type:'audio/wav'});
}
function acharAudio(o, prof){
  prof = prof||0;
  if(!o || typeof o!=='object' || prof>7) return null;
  if(o.inlineData && typeof o.inlineData.data==='string') return o.inlineData.data;
  if(o.inline_data && typeof o.inline_data.data==='string') return o.inline_data.data;
  if(typeof o.data==='string' && o.data.length>500) return o.data;
  for(const k in o){ const r = acharAudio(o[k], prof+1); if(r) return r; }
  return null;
}
function erroGemini(status, corpo){
  let msg = 'Gemini voz: '+status+' — '+corpo;
  if(status===401 || status===403) msg = 'O Google não aceitou a chave. Confira se copiou ela inteira (as novas começam com "AQ.", as antigas com "AIza").';
  if(status===429) msg = 'A cota grátis bateu no limite por agora. Espere alguns minutos, ou use a voz do celular nesta noite.';
  const e = new Error(msg); e.status=status; return e;
}

// dois caminhos: o endpoint novo e o clássico. O que funcionar fica marcado e é usado sempre.
let caminhoGemini = null;   // 'interactions' | 'generate'
const MODELO_CLASSICO = m => /^gemini-3/.test(m||'') ? 'gemini-2.5-flash-preview-tts' : (m || 'gemini-2.5-flash-preview-tts');

async function geminiInteractions(texto, chave){
  const r = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions',{
    method:'POST',
    headers:{'Content-Type':'application/json','x-goog-api-key':chave},
    body: JSON.stringify({
      model: cfg.geminiModelTts,
      input: (cfg.geminiInstr||'') + '\n\n' + semMarcadores(texto),
      response_format:{ type:'audio' },
      generation_config:{ speech_config:[{ voice: cfg.geminiVoice || 'Sulafat' }] }
    })
  });
  if(!r.ok) throw erroGemini(r.status, (await r.text()).slice(0,200));
  const b64 = acharAudio(await r.json());
  if(!b64) throw new Error('O Gemini não devolveu áudio. Tente de novo.');
  return pcmParaWavBlob(b64, 24000);
}

async function geminiGenerate(texto, chave){
  const modelo = MODELO_CLASSICO(cfg.geminiModelTts);
  const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(modelo)+':generateContent',{
    method:'POST',
    headers:{'Content-Type':'application/json','x-goog-api-key':chave},
    body: JSON.stringify({
      contents:[{ parts:[{ text: (cfg.geminiInstr||'') + '\n\n' + semMarcadores(texto) }] }],
      generationConfig:{
        responseModalities:['AUDIO'],
        speechConfig:{ voiceConfig:{ prebuiltVoiceConfig:{ voiceName: cfg.geminiVoice || 'Sulafat' } } }
      }
    })
  });
  if(!r.ok) throw erroGemini(r.status, (await r.text()).slice(0,200));
  const b64 = acharAudio(await r.json());
  if(!b64) throw new Error('O Gemini não devolveu áudio. Tente de novo.');
  return pcmParaWavBlob(b64, 24000);
}

async function audioGemini(texto){
  const chave = await Seg.ler('geminiKey');
  if(!chave) throw new Error('Cole sua chave do Gemini em Configurações.');
  const ordem = caminhoGemini==='generate' ? [['generate',geminiGenerate],['interactions',geminiInteractions]]
                                           : [['interactions',geminiInteractions],['generate',geminiGenerate]];
  let ultimo=null;
  for(const [nome, fn] of ordem){
    try{
      const b = await fn(texto, chave);
      caminhoGemini = nome;
      return b;
    }catch(e){
      ultimo = e;
      // erro de chave ou de cota não melhora trocando de caminho
      if(e.status===401 || e.status===403 || e.status===429) throw e;
    }
  }
  if(ultimo && /failed to fetch|networkerror|load failed/i.test(ultimo.message||'')){
    throw new Error('O navegador não conseguiu nem chegar no servidor do Google. Quase sempre é uma extensão bloqueando (bloqueador de anúncios, antivírus, VPN ou firewall). Teste numa janela anônima com as extensões desligadas, ou use outro navegador.');
  }
  throw ultimo || new Error('Não consegui falar com o Gemini.');
}

function gerarAudio(texto){
  if(cfg.motorVoz==='solverone') return Plataforma.voz(texto);
  if(cfg.motorVoz==='elevenlabs') return audioElevenlabs(texto);
  if(cfg.motorVoz==='gemini') return audioGemini(texto);
  return audioOpenai(texto);
}

/* ----------------------------- o leitor ----------------------------- */
const Leitor = (function(){
  let hist=null, partes=[], fila=[], pos=0, tocando=false;
  let audio=null, urlAtual=null, memoria=new Map(), wake=null;
  let inicioLeitura=0, contou=false, execucaoId=0;
  let emVoo=0, proximoBaixar=0, esteiraLigada=false;
  // Quando a voz escolhida é a do celular mas a história já tem voz de internet guardada,
  // "marcaUso" aponta para essa voz: toca o que está no aparelho e nunca gera nada novo.
  let marcaUso=null;
  const MOTOR_DA_MARCA = {gemini:'gemini', eleven:'elevenlabs', openai:'openai', solverone:'solverone'};
  const motor = ()=> marcaUso ? (MOTOR_DA_MARCA[marcaUso.split('|')[0]]||'nativo') : cfg.motorVoz;
  const marcaAt = ()=> marcaUso || Guarda.marca();

  const MAX_PARALELO = 2;

  // Pedaços pequenos no começo (a voz sai rápido) e maiores depois (menos pedidos).
  function tetoDoPedaco(n, m){
    m = m || motor();
    if(m==='gemini')     return [180, 400, 800, 1400][n] || 1900;
    if(m==='elevenlabs') return [200, 450, 700][n] || 900;
    if(m==='openai')     return [200, 450, 700][n] || 900;
    if(m==='solverone')  return [200, 450, 800, 1400][n] || 1800;
    return 0;
  }

  // A divisão em trechos é a mesma no leitor e na fila de voz: é ela que dá o texto (e a chave) de cada trecho.
  function filaDe(pts, m){
    const f=[];
    if(cfg.saudarAntes){
      const s = fraseCumprimento();
      if(s) f.push({tipo:'fala', texto:s, ids:[], saudacao:true});
    }
    const porApi = m!=='nativo';
    let buffer=[], ids=[], nFalas=0;
    const descarregar = ()=>{
      if(!buffer.length) return;
      f.push({tipo:'fala', texto:buffer.join(' '), ids:ids.slice()});
      buffer=[]; ids=[]; nFalas++;
    };
    pts.forEach((p,i)=>{
      if(p.tipo==='som'){ descarregar(); f.push({tipo:'som', som:p.som}); return; }
      buffer.push(p.texto); ids.push(i);
      if(!porApi || buffer.join(' ').length > tetoDoPedaco(nFalas, m)) descarregar();
    });
    descarregar();
    return f;
  }
  function montarFila(){ fila = filaDe(partes, motor()); }

  function render(){
    const paras=[]; let atual=null;
    partes.forEach((p,i)=>{
      if(p.tipo!=='frase') return;
      if(!atual || p.p!==atual.p){ atual={p:p.p, spans:[]}; paras.push(atual); }
      atual.spans.push(`<span class="fr" data-i="${i}">${esc(p.texto)}</span>`);
    });
    const html = paras.map(x=>'<p>'+x.spans.join(' ')+'</p>').join('');
    $('#lt-texto').innerHTML = html || '<p style="color:var(--dim2)">(história vazia)</p>';
    $$('#lt-texto .fr').forEach(el=>{
      el.addEventListener('click', ()=>{
        const alvo = Number(el.dataset.i);
        const k = fila.findIndex(f=>f.tipo==='fala' && f.ids.includes(alvo));
        if(k>=0) irPara(k);
      });
    });
  }

  function destacar(step){
    $$('#lt-texto .fr.now').forEach(e=>e.classList.remove('now'));
    if(!cfg.destaque || !step || step.tipo!=='fala') return;
    let primeiro=null;
    step.ids.forEach(i=>{
      const el=$(`#lt-texto .fr[data-i="${i}"]`);
      if(el){ el.classList.add('now'); if(!primeiro) primeiro=el; }
    });
    if(primeiro){
      const c=$('#leitor-corpo'), r=primeiro.getBoundingClientRect(), rc=c.getBoundingClientRect();
      if(r.top < rc.top+70 || r.bottom > rc.bottom-70)
        c.scrollBy({ top: r.top - rc.top - c.clientHeight*0.34, behavior:'smooth' });
    }
  }

  const barra = ()=>{ $('#pg-barra').style.width = Math.min(100,(pos/(fila.length||1))*100)+'%'; };
  const status = t => { $('#leitor-status').textContent = t; };
  const iconePlay = p => { $('#btn-play').textContent = p ? '⏸' : '▶'; };

  /* ---------- cache + esteira de download ---------- */
  let paralelo = 2, gerados = 0, cancelarPreparo = false;

  async function pegarAudio(i, aviso){
    if(memoria.has(i)) return memoria.get(i);
    const txt = fila[i].texto;
    const ch = fila[i].saudacao ? ('saudacao|'+marcaAt()+'|'+txt) : Guarda.chave(hist.id, i, txt, marcaAt());
    // já pago uma vez, nunca mais — e acha o trecho pelo texto, mesmo se a posição ou o modelo mudou
    const salvo = fila[i].saudacao ? await Guarda.pegar(ch) : await Guarda.pegarFlex(hist.id, i, txt, marcaAt());
    if(salvo){ memoria.set(i, salvo); return salvo; }
    if(marcaUso){                                                // voz guardada: nunca gera de novo
      if(fila[i].saudacao) return null;                          // cumprimento cai para a voz do celular
      const e = new Error('Este trecho não está entre a voz guardada ('+nomeMarca(marcaUso)+').'); e.faltando = true; throw e;
    }
    if(fila[i].saudacao){                                        // cumprimento: gerado na hora, nunca guardado; falhou, cai para a voz do celular
      try{ const b = await gerarAudio(txt); memoria.set(i, b); return b; }catch(e){ return null; }
    }
    const esperas = [8000, 20000, 45000];
    let ultimo=null;
    for(let t=0; t<=esperas.length; t++){
      try{
        const blob = await gerarAudio(txt);
        gerados++;
        memoria.set(i, blob);
        await Guarda.guardar(ch, blob);
        return blob;
      }catch(e){
        ultimo=e;
        const limite = e.status===429;
        if(limite) paralelo = 1;
        if(!limite || t===esperas.length) throw e;
        const seg = Math.round(esperas[t]/1000);
        if(aviso) aviso('cota cheia — esperando '+seg+'s e tentando de novo…');
        else status('cota cheia — esperando '+seg+'s…');
        await sleep(esperas[t]);
      }
    }
    throw ultimo;
  }

  function proximaFalaFaltando(desde){
    for(let k=desde; k<fila.length; k++) if(fila[k].tipo==='fala' && !memoria.has(k)) return k;
    return -1;
  }
  // vai baixando os próximos pedaços em segundo plano enquanto a história toca
  function esteira(){
    if(motor()==='nativo') return;
    while(emVoo < paralelo){
      const k = proximaFalaFaltando(Math.max(proximoBaixar, pos));
      if(k<0) return;
      proximoBaixar = k+1;
      emVoo++;
      pegarAudio(k)
        .catch(()=>{})
        .then(()=>{ emVoo--; atualizarPreparo(); if(esteiraLigada) esteira(); });
    }
  }
  function contarProntos(){
    let total=0, prontos=0;
    fila.forEach((f,i)=>{ if(f.tipo==='fala'){ total++; if(memoria.has(i)) prontos++; } });
    return {total, prontos};
  }
  function marcarAudio(){
    if(!hist) return;
    const {total,prontos} = contarProntos();
    hist.audioMarca = marcaAt();
    hist.audioPronto = (total>0 && prontos>=total);
    hist.audioParcial = prontos;
    hist.audioTotal = total;
    registrarCompleto(hist.audioPronto);
    salvarHistorias();
    atualizarVozGuardada();
  }
  // guarda, por voz, quantos trechos da história (sem o cumprimento) formam o áudio completo
  function registrarCompleto(completo){
    if(!hist) return;
    const n = fila.filter(f=>f.tipo==='fala' && !f.saudacao).length;
    hist.audioCompleto = hist.audioCompleto || {};
    if(completo && n) hist.audioCompleto[marcaAt()] = n;
    else delete hist.audioCompleto[marcaAt()];
  }
  function atualizarPreparo(){
    const el = $('#prep-barra'); if(!el) return;
    const {total,prontos} = contarProntos();
    el.style.width = total? (prontos/total*100)+'%' : '0%';
    const t = $('#prep-txt');
    if(t) t.textContent = prontos>=total ? '✅ Tudo pronto — pode tocar sem esperar'
                                         : `${prontos} de ${total} trechos prontos`;
  }

  // Botão "baixar o áudio": vai um por vez, com aviso de verdade e sem gastar de novo o que já existe.
  async function prepararTudo(){
    if(motor()==='nativo'){
      modal(`<h3>Não precisa preparar</h3><p class="hint">A voz do celular é gerada no próprio aparelho, na hora. O preparo só faz sentido nas vozes de internet (Gemini, ElevenLabs, OpenAI).</p>
        <div style="height:14px"></div><button class="btn" id="pp-f">Entendi</button>`);
      $('#pp-f').onclick=fecharModal; return;
    }
    esteiraLigada = false; cancelarPreparo = false;
    const falas = [];
    fila.forEach((f,i)=>{ if(f.tipo==='fala') falas.push(i); });
    const gerados0 = gerados;

    modal(`<h3>⬇️ Baixando a voz</h3>
      <p class="hint">Gerando o áudio de <b>${esc(hist.titulo)}</b> e guardando neste aparelho. Depois disso a história toca na hora, quantas vezes vocês quiserem, sem gastar a cota de novo — e até sem internet.</p>
      <div class="prep"><i id="prep-barra"></i></div>
      <div class="hint" id="prep-txt" style="text-align:center;margin-top:8px">começando…</div>
      <div class="hint" id="prep-aviso" style="text-align:center;color:var(--gold)"></div>
      <div style="height:16px"></div>
      <button class="btn sm ghost" id="prep-parar">Parar por aqui</button>
      <div style="height:8px"></div>
      <div class="hint" style="text-align:center">Pode fechar esta janela: o download continua.</div>`);
    $('#prep-parar').onclick=()=>{ cancelarPreparo = true; fecharModal(); toast('Parei. O que já baixou fica guardado.'); };
    const aviso = t => { const e=$('#prep-aviso'); if(e) e.textContent = t||''; };
    atualizarPreparo();

    for(const i of falas){
      if(cancelarPreparo) break;
      if(memoria.has(i)) continue;
      try{
        await pegarAudio(i, aviso);
        aviso('');
        atualizarPreparo();
      }catch(e){
        marcarAudio();
        modal(`<h3>Parei no meio 🙁</h3>
          <p class="hint">${esc(e.message||e)}</p>
          <div class="ok" style="margin-top:12px">Os trechos que já baixaram <b>ficaram guardados</b>. É só tocar em baixar de novo mais tarde que ele continua de onde parou — sem gastar o que já foi gerado.</div>
          <div style="height:14px"></div><button class="btn" id="pe-f">Fechar</button>`);
        $('#pe-f').onclick=fecharModal;
        pintarAcervo();
        return;
      }
    }
    marcarAudio();
    atualizarPreparo();
    atualizarBotaoBaixar();
    const {total,prontos} = contarProntos();
    if(prontos>=total && !cancelarPreparo){
      aviso('');
      const novos = gerados - gerados0;
      modal(`<h3>✅ Pronto!</h3>
        <p class="hint"><b>${esc(hist.titulo)}</b> está inteira guardada neste aparelho${novos<total? ' ('+(total-novos)+' trecho(s) já estavam prontos e não gastaram nada)' : ''}.</p>
        <div class="ok" style="margin-top:12px">Agora é só dar play: começa na hora, dá para voltar e repetir à vontade, e funciona mesmo sem internet.</div>
        <div style="height:14px"></div><button class="btn ok" id="pf-tocar">▶️ Tocar agora</button>
        <div style="height:10px"></div><button class="btn sm ghost" id="pf-f">Fechar</button>`);
      $('#pf-tocar').onclick=()=>{ fecharModal(); play(); };
      $('#pf-f').onclick=fecharModal;
    }
    pintarAcervo();
  }

  // tela de bloqueio / notificação do celular: mostra o nome da história e os botões
  function midia(estado){
    if(!('mediaSession' in navigator) || !hist) return;
    try{
      if(estado){ navigator.mediaSession.playbackState = estado; return; }
      navigator.mediaSession.metadata = new MediaMetadata({ title: hist.titulo, artist: 'UM Contador de Histórias',
        album: hist.serie||'', artwork:[{src:'icone-180.png', sizes:'180x180', type:'image/png'}] });
      navigator.mediaSession.setActionHandler('play', ()=>{ if(!tocando) playConferindo(); });
      navigator.mediaSession.setActionHandler('pause', ()=>{ if(tocando) pausar(); });
      navigator.mediaSession.setActionHandler('previoustrack', ()=>passo(-1));
      navigator.mediaSession.setActionHandler('nexttrack', ()=>passo(1));
    }catch(e){}
  }
  function tocarBlob(blob){
    midia();
    return new Promise((resolve,reject)=>{
      if(urlAtual) URL.revokeObjectURL(urlAtual);
      urlAtual = URL.createObjectURL(blob);
      audio = new Audio(urlAtual);
      audio.playbackRate = Math.min(1.4, Math.max(.7, cfg.vel));
      audio.onended = resolve;
      audio.onerror = ()=>reject(new Error('Não consegui tocar o áudio.'));
      audio.play().catch(reject);
    });
  }

  async function executar(){
    const meu = ++execucaoId;
    inicioLeitura = Date.now();
    esteiraLigada = true; proximoBaixar = pos; esteira();
    while(tocando && pos < fila.length && meu===execucaoId){
      const step = fila[pos];
      barra(); salvarPosicao();
      if(step.tipo==='som'){ Som.tocar(step.som); pos++; continue; }
      destacar(step);
      try{
        if(motor()==='nativo'){
          status('lendo…');
          await falarNativo(step.texto);
        }else{
          if(!memoria.has(pos)) status(marcaUso ? 'abrindo a voz guardada…' : 'preparando a voz…');
          const blob = await pegarAudio(pos);
          if(!tocando || meu!==execucaoId) return;
          status(marcaUso ? 'lendo (voz guardada)…' : 'lendo…');
          esteira();
          if(blob) await tocarBlob(blob); else await falarNativo(step.texto);
        }
      }catch(e){
        if(meu!==execucaoId) return;
        tocando=false; esteiraLigada=false; iconePlay(false); Som.parar(true);
        status('deu erro');
        modal(`<h3>A leitura parou 🙁</h3><p class="hint">${esc(e.message||e)}</p>
          <div class="ok" style="margin-top:12px">Tudo o que já tinha baixado <b>continua guardado</b>. Seu lugar na história também foi salvo — dá para voltar depois e continuar daqui.</div>
          <div style="height:14px"></div>
          <button class="btn ok" id="err-nativo">📱 Continuar agora com a voz do celular</button>
          <div style="height:10px"></div>
          <button class="btn sm ghost" id="err-fechar">Fechar e voltar depois</button>`);
        $('#err-nativo').onclick=()=>{
          const frase = fraseDoPasso(pos);
          marcaUso = null;
          cfg.motorVoz='nativo'; salvarCfg(); aplicarCfgNaTela();
          fecharModal(); memoria=new Map(); montarFila();
          pos = passoDaFrase(frase); barra(); atualizarBotaoBaixar(); play();
        };
        $('#err-fechar').onclick=fecharModal;
        return;
      }
      if(!tocando || meu!==execucaoId) return;
      pos++;
      if(!contou && pos > fila.length*0.5){ contou=true; registrarLeitura(); }
    }
    if(meu!==execucaoId) return;
    if(pos>=fila.length && tocando){
      tocando=false; esteiraLigada=false; iconePlay(false); barra();
      Som.tocar('fim'); destacar(null);
      status('fim da história 💜');
      if(!contou){ contou=true; registrarLeitura(); }
      somarTempo();
      if(hist){ hist.lida = true; hist.posicao = 0; hist.posFrase = 0;
                hist.ouvidaEm = new Date().toISOString(); salvarHistorias(); marcarCheck(); }
      const prox = proximoCapitulo(hist);
      const btn = $('#btn-proximo-cap');
      if(prox){
        btn.textContent = '➡️ Próximo: ' + prox.titulo;
        btn.classList.remove('oculto');
        btn.onclick = ()=>{ btn.classList.add('oculto'); Leitor.abrir(prox); };
      }
    }
  }

  function totalFrases(){ return partes.filter(p=>p.tipo==='frase').length; }
  function fraseDoPasso(k){
    for(let i=k;i>=0;i--){
      if(fila[i] && fila[i].tipo==='fala' && fila[i].ids && fila[i].ids.length) return fila[i].ids[0];
    }
    return 0;
  }
  function passoDaFrase(idFrase){
    const k = fila.findIndex(f=>f.tipo==='fala' && f.ids.indexOf(idFrase)>=0);
    if(k>=0) return k;
    // se não achar exata, vai para a fala mais próxima depois dela
    for(let i=0;i<fila.length;i++) if(fila[i].tipo==='fala' && fila[i].ids[0]>=idFrase) return i;
    return 0;
  }
  function salvarPosicao(){
    if(!hist) return;
    const meio = pos>0 && pos < fila.length-1;
    hist.posFrase = meio ? fraseDoPasso(pos) : 0;
    hist.frasesTotal = totalFrases();
    hist.posicao = hist.posFrase;                 // compatibilidade
    hist.ouvidaEm = meio ? new Date().toISOString() : hist.ouvidaEm;
    salvarHistorias();
  }
  function somarTempo(){
    if(!inicioLeitura) return;
    stats.segundos += Math.round((Date.now()-inicioLeitura)/1000);
    inicioLeitura=0; salvarStats(); pintarStats();
  }
  function registrarLeitura(){
    if(!hist) return;
    hist.leituras = (hist.leituras||0)+1;
    hist.ultimaLeitura = new Date().toISOString();
    stats.leituras++;
    const d=hoje();
    if(stats.ultimaNoite!==d){
      const ontem = new Date(Date.now()-864e5).toISOString().slice(0,10);
      stats.sequencia = (stats.ultimaNoite===ontem) ? (stats.sequencia||0)+1 : 1;
      stats.ultimaNoite=d;
    }
    salvarHistorias(); salvarStats(); pintarStats(); pintarInicio();
  }
  async function manterTela(ligar){
    try{
      if(ligar && cfg.telaAcesa && 'wakeLock' in navigator){ wake = await navigator.wakeLock.request('screen'); }
      else if(!ligar && wake){ await wake.release(); wake=null; }
    }catch(e){}
  }

  function pausar(){
    tocando=false; esteiraLigada=false; execucaoId++;
    if('speechSynthesis' in window) speechSynthesis.cancel();
    if(audio){ try{ audio.pause(); }catch(e){} }
    Som.parar(true);
    iconePlay(false); status('pausado'); manterTela(false); somarTempo(); salvarPosicao(); midia('paused');
  }
  function play(){
    if(!fila.length) return;
    Som.ligar();
    $('#barra-retomar').classList.add('oculto');
    tocando=true; iconePlay(true); manterTela(true);
    executar();
  }
  // antes de dar play, avisa se o áudio ainda não está todo baixado
  async function playConferindo(){
    if(motor()==='nativo' || marcaUso){ play(); return; }
    const {total, prontos} = await contarNoDisco();
    atualizarBotaoBaixar();
    if(total>0 && prontos>=total){ play(); return; }
    modal(`<h3>${prontos? '🟡 Áudio pela metade' : '🔴 Áudio ainda não baixado'}</h3>
      <p class="hint">${prontos? `Só <b>${prontos} de ${total}</b> trechos estão guardados.` : `Nenhum dos <b>${total}</b> trechos foi gerado ainda.`}
      Se você tocar agora, o site vai gerando durante a leitura — e <b>se a cota do Google acabar no meio, a história para</b>, como aconteceu no seu teste.</p>
      <div class="ok" style="margin-top:12px">O jeito certo é baixar tudo antes. O que já estiver guardado não é gerado de novo.</div>
      <div style="height:16px"></div>
      <button class="btn ok" id="pl-baixar">⬇️ Baixar tudo agora (recomendado)</button>
      <div style="height:10px"></div>
      <button class="btn sm" id="pl-nativo">📱 Ler com a voz do celular (sem cota, sem espera)</button>
      <div style="height:10px"></div>
      <button class="btn sm ghost" id="pl-assim">▶️ Tocar assim mesmo</button>`);
    $('#pl-baixar').onclick=()=>{ fecharModal(); prepararTudo(); };
    $('#pl-assim').onclick=()=>{ fecharModal(); play(); };
    $('#pl-nativo').onclick=()=>{
      marcaUso = null;
      cfg.motorVoz='nativo'; salvarCfg(); aplicarCfgNaTela();
      fecharModal(); memoria=new Map(); montarFila(); barra(); atualizarBotaoBaixar(); play();
    };
  }
  function irPara(k){
    const rodando = tocando;
    if(rodando) pausar();
    pos = Math.max(0, Math.min(k, fila.length-1));
    proximoBaixar = pos;
    barra(); destacar(fila[pos]); salvarPosicao();
    if(rodando) setTimeout(play, 140); else status('toque no play para começar');
  }
  function passo(dir){
    let k = pos + dir;
    while(k>=0 && k<fila.length && fila[k].tipo!=='fala') k+=dir;
    if(k<0) k=0; if(k>=fila.length) k=fila.length-1;
    irPara(k);
  }
  let prontosCache = {total:0, prontos:0};
  async function contarNoDisco(){
    let total=0, prontos=0;
    for(let i=0;i<fila.length;i++){
      if(fila[i].tipo!=='fala' || fila[i].saudacao) continue;   // o cumprimento não fica guardado: não conta
      total++;
      const k = fila[i].saudacao ? ('saudacao|'+marcaAt()+'|'+fila[i].texto)
                                  : Guarda.chave(hist.id,i,fila[i].texto,marcaAt());
      if(memoria.has(i) || await Guarda.existe(k)) prontos++;
    }
    prontosCache = {total, prontos};
    if(hist && !marcaUso){
      hist.audioPronto = (total>0 && prontos>=total);
      hist.audioParcial = prontos; hist.audioTotal = total; hist.audioMarca = Guarda.marca();
      registrarCompleto(hist.audioPronto);
      salvarHistorias();
    }
    return prontosCache;
  }
  async function atualizarBotaoBaixar(){
    const b = $('#btn-baixar-voz');
    if(!b || !hist) return;
    pintarApagarVoz();
    if(marcaUso){
      b.className = 'faixa verde';
      b.textContent = '🟢 Voz guardada ('+nomeMarca(marcaUso)+') — não gasta cota · toque para usar a voz do celular';
      return;
    }
    if(cfg.motorVoz==='nativo'){
      const tem = vozesCompletas(hist);
      if(tem.length){
        b.className = 'faixa amarela';
        b.textContent = '🎙️ Esta história tem voz guardada ('+nomeMarca(tem[0])+') — toque para ouvir com ela';
      }else{
        b.className = 'faixa neutra';
        b.textContent = '📱 Voz do celular — não precisa baixar nada';
      }
      return;
    }
    b.className = 'faixa'; b.textContent = 'conferindo o áudio já guardado…';
    const {total, prontos} = await contarNoDisco();
    if(total>0 && prontos>=total){
      b.className = 'faixa verde';
      b.textContent = '🟢 Áudio completo — pode tocar tranquilo, não gasta cota';
    }else if(prontos>0){
      b.className = 'faixa amarela';
      b.textContent = `🟡 Só ${prontos} de ${total} trechos baixados — toque para completar`;
    }else{
      b.className = 'faixa vermelha';
      b.textContent = `🔴 Áudio ainda não baixado (${total} trechos) — toque aqui para baixar antes`;
    }
  }
  // troca entre a voz guardada e a voz do celular sem perder o lugar na história
  function trocarMarca(nova){
    const frase = fraseDoPasso(pos), rodando = tocando;
    if(rodando) pausar();
    marcaUso = nova; memoria = new Map(); emVoo = 0;
    montarFila(); pos = frase>0 ? passoDaFrase(frase) : 0; proximoBaixar = pos;
    barra(); destacar(fila[pos]); atualizarBotaoBaixar();
    if(rodando) setTimeout(play, 140);
  }
  function cliqueFaixa(){
    if(marcaUso){ trocarMarca(null); toast('Agora com a voz do celular. A voz guardada continua no aparelho.'); return; }
    if(cfg.motorVoz==='nativo'){
      const tem = vozesCompletas(hist);
      if(tem.length){ trocarMarca(tem[0]); toast('Tocando com a voz guardada — sem gastar cota'); return; }
    }
    prepararTudo();
  }
  function pintarApagarVoz(){
    const el = $('#btn-apagar-voz-hist'); if(!el || !hist) return;
    const r = VOZ_GUARDADA.get(hist.id);
    el.classList.toggle('oculto', !(r && r.n));
    if(r && r.n) el.textContent = '🗑️ apagar a voz guardada desta história ('+fmtBytes(r.bytes)+')';
  }
  async function apagarVozDaHistoria(){
    if(!hist) return;
    const r = VOZ_GUARDADA.get(hist.id);
    if(!confirm('Apagar a voz guardada de "'+hist.titulo+'"'+(r? ' ('+fmtBytes(r.bytes)+')':'')+'? O texto fica; só a voz vai precisar ser gerada de novo.')) return;
    if(tocando) pausar();
    await Guarda.limparHistoria(hist.id);
    hist.audioCompleto = {}; hist.audioPronto = false; hist.audioParcial = 0;
    salvarHistorias();
    marcaUso = null; memoria = new Map(); montarFila();
    await atualizarVozGuardada();
    atualizarBotaoBaixar(); toast('Voz desta história apagada');
  }
  function marcarCheck(){
    const b=$('#chk-lida');
    if(b && hist) b.classList.toggle('on', !!hist.lida);
  }

  return {
    abrir(h, jaPediu){
      // os nomes das crianças (cumprimento) e as chaves estão no cofre: trancado, pede o PIN uma vez antes de montar a fila
      if(!jaPediu && Seg.precisaPerguntar()){ Seg.abrir().catch(()=>{}).then(()=>Leitor.abrir(h, true)); return; }
      if(!$('#leitor').classList.contains('on')) Nav.empurrar('leitor');
      document.body.classList.add('com-leitor');
      hist=h; contou=false;
      memoria=new Map(); partes = analisar(h.texto);
      // voz do celular escolhida + voz de internet guardada → usa a guardada (se o ajuste permitir)
      marcaUso = null;
      if(cfg.motorVoz==='nativo' && cfg.usarVozGuardada!==false){
        const tem = vozesCompletas(h); if(tem.length) marcaUso = tem[0];
      }
      montarFila(); render();
      const caps = h.serie ? (listaSeries().get(h.serie)||[]) : [];
      const iCap = caps.findIndex(c=>c.id===h.id);
      $('#btn-cap-ant').classList.toggle('oculto', !(iCap>0));
      $('#btn-cap-prox').classList.toggle('oculto', !(iCap>=0 && iCap+1<caps.length));
      $('#leitor-titulo').textContent = h.titulo;
      $('#lt-h2').textContent = h.titulo;
      const pref = h.serie ? `${h.serie} · capítulo ${Math.max(1,iCap+1)} de ${caps.length} · ` : '';
      $('#lt-sub').textContent = pref + `${rotuloIdade(h.idade)} · ${minutosDe(h.texto)} min de leitura · ${h.leituras||0}× lida`;
      $('#lt-texto').style.fontSize = cfg.fonte+'px';
      $('#leitor-corpo').scrollTop=0;
      $('#btn-fav').textContent = h.favorita ? '★' : '☆';
      $('#btn-proximo-cap').classList.add('oculto');
      Som.parar(true);
      if(typeof limparTeste==='function') limparTeste();
      $('#leitor').classList.add('on');
      document.body.style.overflow='hidden';
      marcarCheck();
      atualizarBotaoBaixar();
      // retoma de onde parou (guardado por frase, então vale mesmo se trocar de voz)
      const frase = h.posFrase || 0;
      pos = frase>0 ? passoDaFrase(frase) : 0;
      barra(); iconePlay(false);
      if(pos>0){
        $('#barra-retomar').classList.remove('oculto');
        $('#txt-retomar').textContent = '⏸ você parou em ' + Math.round(frase/(totalFrases()||1)*100) + '%';
        destacar(fila[pos]);
        setTimeout(()=>{ const el=$(`#lt-texto .fr[data-i="${frase}"]`);
          if(el) el.scrollIntoView({block:'center'}); }, 120);
        status('toque no play para continuar');
      }else{
        $('#barra-retomar').classList.add('oculto');
        status('toque no play para começar');
      }
      // já vai adiantando os primeiros pedaços
      if((cfg.motorVoz!=='nativo' || marcaUso) && cfg.adiantar){ esteiraLigada=true; proximoBaixar=pos; esteira(); }
    },
    fechar(semHistorico){
      const estava = $('#leitor').classList.contains('on');
      document.body.classList.remove('com-leitor');
      if(estava && semHistorico!==true) Nav.tirar('leitor');
      pausar(); Som.parar(true); esteiraLigada=false;
      if(urlAtual){ URL.revokeObjectURL(urlAtual); urlAtual=null; }
      memoria=new Map(); marcaUso=null;
      $('#leitor').classList.remove('on');
      document.body.style.overflow='';
      pintarAcervo(); pintarInicio();
    },
    alternar(){ tocando ? pausar() : playConferindo(); },
    doInicio(){ irPara(0); $('#barra-retomar').classList.add('oculto'); },
    passo, prepararTudo, atualizarBotaoBaixar, cliqueFaixa, apagarVozDaHistoria,
    // trechos da história como o leitor os montaria com esta voz (a fila de voz usa isto)
    trechos(h, m){ return filaDe(analisar(h.texto), m || cfg.motorVoz); },
    estaTocando(){ return tocando; },
    capitulo(dir){
      if(!hist || !hist.serie) return;
      const caps = listaSeries().get(hist.serie)||[];
      const i = caps.findIndex(c=>c.id===hist.id);
      const alvo = caps[i+dir];
      if(alvo) Leitor.abrir(alvo); else toast(dir>0?'Esse é o último capítulo':'Esse é o primeiro capítulo');
    },
    marcarCheck,
    atual(){ return hist; }
  };
})();

/* ----------------------------- sugestões ----------------------------- */
const TEMAS = ["uma viagem ao fundo do mar","a estrela que caiu no quintal","o dia em que os brinquedos falaram",
"uma corrida de tartarugas na lua","o segredo da casa da árvore","a biblioteca dos livros que fogem",
"o trem que atravessa as nuvens","a fábrica de sonhos coloridos","o dragão que tinha medo do escuro",
"uma amizade entre a chuva e o sol","o mapa escondido no pote de biscoitos","a cidade dentro do guarda-roupa",
"o vaga-lume que perdeu a luz","uma festa no fundo do jardim","o gato que colecionava palavras",
"a ponte feita de arco-íris","o relógio que voltava no tempo","a ilha onde tudo era ao contrário",
"o vento que aprendeu a assobiar","a menina que plantou uma nuvem","o circo que chegou de balão",
"o bolo que ninguém conseguia cortar","uma carta que demorou cem anos","o bicho-preguiça mais rápido do mundo",
"a lua que queria tirar férias","o sapato que escolhia o caminho","a floresta que só existia de noite",
"o robô que aprendeu a fazer cócegas","o navio pirata cheio de patos","a escada que levava a qualquer lugar"];

const AMBIENTES = ["uma floresta cheia de vaga-lumes","o fundo do mar","um castelo com mil escadas",
"o sítio da vovó","uma nave espacial velhinha","uma vila no alto da montanha","um circo itinerante",
"uma ilha que aparece só na maré baixa","a feira da cidade de madrugada","um farol no meio da tempestade",
"uma biblioteca gigante","o quintal depois da chuva","um trem que atravessa o país","uma caverna de cristais",
"um mercado flutuante","a escola durante as férias","um deserto com um oásis escondido","um lago congelado",
"uma padaria que abre às 4 da manhã","o telhado de um prédio antigo"];

const TONS = ["engraçada","misteriosa","emocionante","cheia de aventura","calminha para dormir",
"com uma reviravolta","de fazer rir alto","com um pouquinho de suspense"];

const INSPIRACOES = ["Procurando Nemo","O Mágico de Oz","Zootopia","Madagascar","Shrek","Toy Story",
"Como Treinar o Seu Dragão","Divertidamente","Detona Ralph","A Bela e a Fera","O Pequeno Príncipe",
"As aventuras de Pinóquio","Sítio do Picapau Amarelo","Peter Pan","Alice no País das Maravilhas",
"uma fábula de Esopo","um causo de pescador","As Crônicas de Nárnia"];

const PERSONAGENS = ["uma coruja professora","um dragão tímido","a sereia engraçada","um robô desastrado",
"o urso que faz bolo","duas irmãs aventureiras","um sapo cantor","a girafa astronauta","o elefante invisível",
"um pinguim explorador","a bruxa boazinha","o cavalo de circo","um peixe falante","a raposa curiosa",
"o vagalume corajoso","a joaninha detetive","um gigante gentil","o gato de botas modernas","a formiga levantadora de peso",
"o unicórnio que espirra glitter","a tartaruga viajante","o macaco inventor","a abelha arquiteta","o lobo vegetariano",
"a estrela cadente falante","o polvo chef de cozinha","a nuvem resmungona","um pintinho valente","a avó contadora de causos",
"o guarda-chuva mágico"];

function sortear(lista,n){
  const c=lista.slice(); const out=[];
  while(out.length<n && c.length) out.push(c.splice(Math.floor(Math.random()*c.length),1)[0]);
  return out;
}
function pintarChips(alvo, lista, inputId){
  $(alvo).innerHTML = lista.map(t=>`<button class="chip" type="button">${esc(t)}</button>`).join('');
  $$(alvo+' .chip').forEach(b=>b.addEventListener('click',()=>{
    const inp=$(inputId), v=b.textContent;
    if(b.classList.contains('on')){
      b.classList.remove('on');
      inp.value = inp.value.split(/\s*,\s*/).filter(x=>x && x!==v).join(', ');
    }else{
      b.classList.add('on');
      inp.value = inp.value.trim() ? inp.value.replace(/,\s*$/,'') + ', ' + v : v;
    }
  }));
}
const novosTemas = ()=> pintarChips('#chips-tema', sortear(TEMAS,6), '#in-tema');
const novosPersonagens = ()=> pintarChips('#chips-personagem', sortear(PERSONAGENS,6), '#in-personagens');
const novosAmbientes = ()=> pintarChips('#chips-ambiente', sortear(AMBIENTES,5), '#in-ambiente');
const novasInspiracoes = ()=> pintarChips('#chips-inspiracao', sortear(INSPIRACOES,5), '#in-inspiracao');

// o clima aceita mais de uma escolha
let tonsEscolhidos = [];
function pintarTons(){
  $('#chips-tom').innerHTML = TONS.map(t=>`<button class="chip" type="button">${esc(t)}</button>`).join('');
  $$('#chips-tom .chip').forEach(b=>b.addEventListener('click',()=>{
    b.classList.toggle('on');
    tonsEscolhidos = $$('#chips-tom .chip.on').map(x=>x.textContent);
  }));
}
const tomPorExtenso = ()=> tonsEscolhidos.length
  ? (tonsEscolhidos.length===1 ? tonsEscolhidos[0]
     : tonsEscolhidos.slice(0,-1).join(', ') + ' e ' + tonsEscolhidos[tonsEscolhidos.length-1])
  : '';
function pintarInspiracaoAcervo(){
  const sel = $('#sel-inspiracao-acervo'); if(!sel) return;
  const antes = sel.value;
  const lista = historias.slice().sort((a,b)=>a.titulo.localeCompare(b.titulo));
  sel.innerHTML = '<option value="">— nenhuma —</option>' +
    lista.map(h=>`<option value="${esc(h.id)}">${esc(h.titulo)}${h.serie?' ('+esc(h.serie)+')':''}</option>`).join('');
  if(antes) sel.value = antes;
}

/* ----------------------------- geração com IA ----------------------------- */
const PERFIS = {
  '2-5':{rotulo:'2 a 5 anos', guia:'Frases muito curtas e simples. Muita repetição e ritmo, sons de bichos e onomatopeias. Vocabulário do dia a dia. Nada assustador. Final calminho, de dormir.'},
  '6-9':{rotulo:'6 a 9 anos', guia:'Aventura com começo, meio e fim claros. Diálogos vivos, um probleminha a resolver e uma pequena lição sem moralismo. Pode ter suspense leve, nunca medo de verdade.'},
  '10+':{rotulo:'10 anos ou mais', guia:'Enredo mais elaborado, com uma reviravolta e personagens com sentimentos ambíguos. Vocabulário mais rico. Pode ter um toque de mistério.'},
  'mista':{rotulo:'para as duas juntas', guia:'Precisa funcionar ao mesmo tempo para uma criança de 4 e uma de 8 anos: enredo simples e sonoro o bastante para a menor acompanhar, mas com uma camada de humor e um pequeno mistério que prendam a maior. Dê algo para cada uma: um bicho engraçado e repetitivo para a pequena, e uma pista a desvendar para a grande.'}
};
const TAMANHOS = { curta:350, media:750, longa:1300 };
function palavrasDe(o){
  const n = o.tam==='custom' ? Math.round((o.minutos||6)*140) : (TAMANHOS[o.tam]||750);
  return `cerca de ${n} palavras (${Math.max(1,Math.round(n/140))} minutos de leitura em voz alta)`;
}
const DESFECHOS = {
  feliz:'termine com um final feliz e calminho, próprio para dormir logo em seguida',
  reviravolta:'termine com uma reviravolta surpreendente, que faça repensar o que veio antes',
  licao:'termine deixando uma pequena lição implícita — mostre, nunca explique a moral',
  engracado:'termine com uma cena engraçada, de fazer rir alto',
  circular:'termine retomando a primeira cena da história, fechando em círculo',
  reencontro:'termine com todos os personagens se reencontrando',
  revelacao:'guarde a revelação principal para a última frase',
  aberto:'termine com um gancho gostoso, deixando a história em aberto para continuar depois'
};
function linhaDesfecho(o){
  const partes = [];
  if(o.capTotal && o.capTotal>1){
    partes.push(`Este é o capítulo ${o.capIndice} de ${o.capTotal}.`);
    if(o.capIndice < o.capTotal) partes.push('Termine este capítulo num gancho gostoso, sem resolver a história.');
    else partes.push('Este é o ÚLTIMO capítulo: feche a história por completo.');
  }
  if(DESFECHOS[o.desfecho] && (!o.capTotal || o.capIndice===o.capTotal || o.capTotal===1))
    partes.push('DESFECHO: ' + DESFECHOS[o.desfecho] + '.');
  return partes.join(' ');
}

function montarPromptSerie(o, anterior){
  const trecho = anterior.texto.length>6000 ? anterior.texto.slice(-6000) : anterior.texto;
  return `Você é um contador de histórias brasileiro. Um pai vem contando para as filhas, capítulo por capítulo, uma série chamada "${o.serie}". Escreva o PRÓXIMO capítulo.

O capítulo anterior chamava-se "${anterior.titulo}" e dizia:

===== CAPÍTULO ANTERIOR =====
${trecho}
===== FIM DO CAPÍTULO ANTERIOR =====

PÚBLICO: ${PERFIS[o.idade].rotulo}. ${PERFIS[o.idade].guia}
${linhaPublicoParaIA()}
TAMANHO: ${palavrasDe(o)}.
${linhaDesfecho(o)}
${o.tema ? 'O QUE O PAI QUER QUE ACONTEÇA: '+o.tema : ''}
${o.personagens ? 'PERSONAGENS A INCLUIR: '+o.personagens : ''}
${o.extra ? 'PEDIDO ESPECIAL: '+o.extra : ''}

REGRAS:
- Continue exatamente de onde o capítulo anterior parou, respeitando os nomes, o tom e tudo o que já aconteceu. Não recomece nem resuma o anterior.
- Português do Brasil, com frases que soem bem faladas em voz alta.
- Termine este capítulo num gancho gostoso, mas num tom calmo, porque é hora de dormir.
- Nada de violência, morte ou medo pesado.
- Use de 4 a 8 efeitos sonoros, sozinhos em uma linha, no formato exato [som:nome], apenas com estes nomes: chuva, vento, mar, floresta, fogueira, noite, trovao, magia, sino, passos, coracao, explosao, tiro, galope, latido, miado, mugido, rugido, chiado, coruja, galo, sapo, elefante. Termine com [som:fim].
- Separe os parágrafos com uma linha em branco.

FORMATO DA RESPOSTA (siga exatamente):
Linha 1: apenas o título deste capítulo, sem aspas e sem a palavra "Capítulo".
Linha 2: em branco.
Depois: o capítulo.
Não escreva mais nada.`;
}

function montarPrompt(o){
  return `Você é um contador de histórias brasileiro, escrevendo uma história de dormir em português do Brasil para um pai ler (ou o celular ler em voz alta) para as filhas dele.

PÚBLICO: ${PERFIS[o.idade].rotulo}. ${PERFIS[o.idade].guia}
${linhaPublicoParaIA()}
TAMANHO: ${palavrasDe(o)}.
${linhaDesfecho(o)}
TEMA: ${o.tema || 'escolha um tema encantador e original'}
PERSONAGENS: ${o.personagens || 'crie personagens cativantes'}
${o.ambiente ? 'ONDE ACONTECE: '+o.ambiente : ''}
${o.tom ? 'CLIMA: a história deve ser '+o.tom : ''}
${o.inspiracao ? 'INSPIRAÇÃO: com o sabor de "'+o.inspiracao+'". Pegue emprestado o espírito, o ritmo e o tipo de aventura — nunca copie enredo, cenas, nomes próprios ou falas, e não use personagens dessa obra. A história tem de ser original.' : ''}
${o.estiloTexto ? 'IMITE O JEITO DE CONTAR do trecho abaixo (ritmo, tamanho das frases, humor, forma de descrever), mas com história, personagens e enredo completamente novos:\n---\n'+o.estiloTexto+'\n---' : ''}
${o.extra ? 'PEDIDO ESPECIAL: '+o.extra : ''}

REGRAS:
- Escreva em português do Brasil, com sabor brasileiro (frutas, bichos, ruas, comidas daqui).
- A história vai ser LIDA EM VOZ ALTA: use frases que soem bem faladas, com ritmo e pausas naturais.
- Nada de violência, morte, medo pesado ou tristeza sem saída. Termine sempre num tom quente e tranquilo, bom para dormir.
- Use EFEITOS SONOROS espalhados pelo texto, sozinhos em uma linha, no formato exato [som:nome]. Use de 4 a 8 deles, nos momentos certos. Nomes permitidos, apenas estes: chuva, vento, mar, floresta, fogueira, noite, trovao, magia, sino, passos, coracao, explosao, tiro, galope, latido, miado, mugido, rugido, chiado, coruja, galo, sapo, elefante, fim. Termine a história com [som:fim].
- Separe os parágrafos com uma linha em branco.

FORMATO DA RESPOSTA (siga exatamente):
Linha 1: apenas o título, sem aspas e sem a palavra "Título".
Linha 2: em branco.
Depois: a história.
Não escreva mais nada além disso — sem comentários, sem explicações, sem markdown.`;
}

// um pedido ao Gemini, sem insistir
async function geminiTexto(prompt, modelo, chave){
  const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(modelo)+':generateContent',{
    method:'POST',
    headers:{'Content-Type':'application/json','x-goog-api-key':chave},
    body: JSON.stringify({ contents:[{parts:[{text:prompt}]}], generationConfig:{temperature:1.0, maxOutputTokens:4096} })
  });
  if(!r.ok){
    const corpo = (await r.text()).slice(0,300);
    const e = new Error('Gemini: '+r.status+' — '+corpo.slice(0,200));
    e.status = r.status;
    if(r.status===404 && /no longer available|not found|is not supported/i.test(corpo)){
      e.message = 'O modelo "'+modelo+'" saiu de linha no Google. Em Configurações → IA que escreve as histórias, toque em "Ver os modelos que a minha chave aceita" e escolha outro da lista.';
      e.modeloVelho = true;
    }
    if(r.status===503 || /high demand|overloaded|UNAVAILABLE/i.test(corpo)) e.sobrecarga = true;
    if(r.status===429) e.cota = true;
    if(r.status===401 || r.status===403 || (r.status===400 && /API key|API_KEY/i.test(corpo))) e.chave = true;
    throw e;
  }
  const j = await r.json();
  const t = (((j.candidates||[])[0]||{}).content||{}).parts||[];
  const saida = t.map(p=>p.text||'').join('').trim();
  if(!saida) throw new Error('O Gemini não devolveu texto. Tente de novo.');
  return saida;
}
// modelo reserva para quando o principal está lotado
function modeloReserva(m){
  if(/lite/.test(m)) return 'gemini-3.6-flash';
  return 'gemini-3.5-flash-lite';
}

// aviso(texto) atualiza a tela enquanto a IA pensa
/* ---------- proteção dos nomes das crianças (LGPD, art. 14: dado de criança pede cuidado extra) ----------
   Os nomes configurados viram códigos antes de sair do aparelho e voltam depois.
   A IA escreve "[NOME1]" e o site troca pelo nome certo aqui dentro. */
async function nomesParaProteger(){
  if(!cfg.protegerNomes) return [];
  // os nomes moram no cofre: trancado, pede o PIN; sem eles o pedido NÃO sai (melhor falhar do que mandar o nome da criança)
  const extra = (await Seg.ler('nomesProtegidos')).split(/\s*,\s*/).map(x=>x.trim()).filter(Boolean);
  const todos = nomesDoPublico(await Seg.ler('publicoNomes')).concat(extra).filter(n=>n.length>=2);
  return [...new Set(todos)].sort((a,b)=>b.length-a.length);   // o mais longo primeiro ("Ana Clara" antes de "Ana")
}
function escRe(t){ return t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }
function mascararNomes(texto, nomes){
  const mapa = [];
  if(!cfg.protegerNomes) return {texto, mapa};
  nomes.forEach((n,i)=>{
    const cod = '[NOME'+(i+1)+']';
    const re = new RegExp('(^|[^\\p{L}])('+escRe(n)+')(?![\\p{L}])','giu');
    if(re.test(texto)){ texto = texto.replace(re, (m0,a)=>a+cod); mapa.push([cod,n]); }
  });
  if(mapa.length) texto += '\n\nIMPORTANTE: os códigos entre colchetes ('+mapa.map(x=>x[0]).join(', ')+') são nomes próprios de pessoas. Escreva-os exatamente assim, com os colchetes, sempre que o nome aparecer. Não invente outro nome no lugar.';
  return {texto, mapa};
}
function desmascararNomes(texto, mapa){
  if(!texto || !mapa || !mapa.length) return texto;
  mapa.forEach(([cod,n])=>{
    const num = cod.slice(5,-1);
    texto = texto.replace(new RegExp('\\[\\s*NOME\\s*'+num+'\\s*\\]','gi'), n);
  });
  return texto;
}
async function chamarIA(promptOriginal, aviso, opcoes){
  const {texto, mapa} = mascararNomes(promptOriginal, await nomesParaProteger());
  const r = await chamarIASemFiltro(texto, aviso, opcoes);
  return typeof r==='string' ? desmascararNomes(r, mapa) : r;
}
/* ---------- troca de IA sozinho ----------
   Se a IA escolhida falha por cota, crédito ou chave, o pedido vai para a próxima que tem chave,
   na ordem da lista de Configurações, com aviso na tela. Vale só para este pedido: a escolha não muda. */
const ORDEM_IA = ['gemini','anthropic','openai','solverone'];
const NOME_IA  = {gemini:'Gemini', anthropic:'Claude', openai:'OpenAI', solverone:'SolverONE'};
const CHAVE_IA = {gemini:'geminiKey', anthropic:'anthropicKey', openai:'openaiKey'};
// a IA da SolverONE não tem chave: vale quando a conta tem o plano e ainda há saldo no mês
const temChaveIA = m => m==='solverone' ? Plataforma.disponivel('texto') : Seg.tem(CHAVE_IA[m]);
function semChave(msg){ const e = new Error(msg); e.semChave = true; return e; }
// erro de um provedor com marcas do que aconteceu: cota (429), crédito (402 ou saldo zerado) ou chave recusada (401/403)
function erroDoProvedor(nome, status, corpo){
  const e = new Error(nome+': '+status+' — '+corpo.slice(0,200));
  e.status = status;
  if(status===429 && /insufficient_quota|billing|credit/i.test(corpo)) e.credito = true;
  else if(status===429) e.cota = true;
  if(status===402 || /credit balance|insufficient credits/i.test(corpo)) e.credito = true;
  if(status===401 || status===403) e.chave = true;
  return e;
}
function motivoTroca(e){
  if(e.semChave) return 'semchave';
  if(e.cota) return 'cota';
  if(e.credito) return 'credito';
  if(e.chave) return 'chave';
  return null;
}
function avisoTroca(de, para, motivo){
  const pt = {cota:' está sem cota agora', credito:' está sem crédito agora', chave:' recusou a chave', semchave:' está sem chave'};
  const en = {cota:' is out of quota right now', credito:' is out of credit right now', chave:' refused the key', semchave:' has no key'};
  return '🔁 '+NOME_IA[de]+T(pt[motivo], en[motivo])+' — '+T('usando ','using ')+NOME_IA[para];
}
async function chamarIASemFiltro(prompt, aviso, opcoes){
  aviso = aviso || function(){};
  opcoes = opcoes || {};
  const m = cfg.motorTexto;
  if(!NOME_IA[m]) throw new Error('Escolha uma IA em Configurações, ou use o modo "Eu escrevo".');
  // a escolhida primeiro; depois as outras que têm chave, na ordem da lista
  // (semPlataforma: pedidos pequenos, como os comandos de voz, não gastam o saldo pago da SolverONE)
  const fila = [m].concat(ORDEM_IA.filter(x=>x!==m && temChaveIA(x))).filter(x=>!(opcoes.semPlataforma && x==='solverone'));
  if(!fila.length) throw semChave('Sem IA disponível para este pedido.');
  for(let i=0; i<fila.length; i++){
    const proxima = fila[i+1];
    try{ return await chamarMotor(fila[i], prompt, aviso, !!proxima); }
    catch(e){
      const motivo = motivoTroca(e);
      if(!motivo || !proxima) throw e;
      const msg = avisoTroca(fila[i], proxima, motivo);
      toast(msg, 4000); aviso(msg);
      await sleep(3000);
    }
  }
}
// um pedido a um motor só; temReserva = existe outra IA pronta para assumir se esta ficar sem cota
async function chamarMotor(m, prompt, aviso, temReserva){
  if(m==='solverone') return Plataforma.texto(prompt, aviso);
  if(m==='gemini'){
    const chave = await Seg.ler('geminiKey');
    if(!chave) throw semChave('Cole sua chave do Gemini em Configurações → IA que escreve.');
    const esperas = [6000, 15000, 30000];
    let ultimo = null;
    for(let t=0; t<=esperas.length; t++){
      try{
        // na última tentativa, se o problema for lotação, muda para o modelo reserva
        const modelo = (t===esperas.length && ultimo && ultimo.sobrecarga) ? modeloReserva(cfg.geminiModel) : cfg.geminiModel;
        if(modelo!==cfg.geminiModel) aviso('o '+cfg.geminiModel+' está lotado — tentando com o '+modelo+'…');
        return await geminiTexto(prompt, modelo, chave);
      }catch(e){
        ultimo = e;
        if(e.modeloVelho) throw e;
        // sem cota e com outra IA à espera, não vale esperar: a troca é mais rápida
        const passageiro = e.sobrecarga || (e.cota && !temReserva) || /failed to fetch|networkerror/i.test(e.message||'');
        if(!passageiro || t===esperas.length){
          if(e.sobrecarga) e.message = 'O Google está lotado neste momento (não é nada seu, nem da chave, nem da cota). Espere um minutinho e toque em gerar de novo.';
          if(e.cota) e.message = 'A cota gratuita bateu no limite por agora. Espere alguns minutos e tente de novo.';
          throw e;
        }
        const seg = Math.round(esperas[t]/1000);
        aviso((e.sobrecarga ? 'o Google está lotado' : e.cota ? 'cota cheia' : 'sem resposta') + ' — esperando '+seg+'s e tentando de novo… ('+(t+1)+' de '+esperas.length+')');
        await sleep(esperas[t]);
      }
    }
    throw ultimo;
  }
  if(m==='anthropic'){
    const chave = await Seg.ler('anthropicKey');
    if(!chave) throw semChave('Cole sua chave da Anthropic em Configurações → IA que escreve.');
    const r = await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'Content-Type':'application/json','x-api-key':chave,
               'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
      body: JSON.stringify({ model:cfg.anthropicModel, max_tokens:4096, temperature:1,
                             messages:[{role:'user', content:prompt}] })
    });
    if(!r.ok) throw erroDoProvedor('Claude', r.status, (await r.text()).slice(0,300));
    const j = await r.json();
    return (j.content||[]).map(b=>b.text||'').join('').trim();
  }
  if(m==='openai'){
    const chave = await Seg.ler('openaiKey');
    if(!chave) throw semChave('Cole sua chave da OpenAI em Configurações.');
    const r = await fetch('https://api.openai.com/v1/chat/completions',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+chave},
      body: JSON.stringify({ model:cfg.openaiModelTxt, temperature:1,
                             messages:[{role:'user', content:prompt}] })
    });
    if(!r.ok) throw erroDoProvedor('OpenAI', r.status, (await r.text()).slice(0,300));
    const j = await r.json();
    return (((j.choices||[])[0]||{}).message||{}).content || '';
  }
  throw new Error('Escolha uma IA em Configurações, ou use o modo "Eu escrevo".');
}

function separarTitulo(saida){
  const linhas = String(saida||'').trim().split('\n');
  let titulo = (linhas.shift()||'').replace(/^[#*\s"'“”]+|[*"'“”\s]+$/g,'').replace(/^t[íi]tulo:\s*/i,'').trim();
  const texto = linhas.join('\n').replace(/^\s+/,'').trim();
  if(!titulo || titulo.length>90){ return {titulo:'História sem nome', texto:(titulo?titulo+'\n'+texto:texto)}; }
  return {titulo, texto};
}

let rascunho=null, rascunhoSerie=null, parcial=null;

function dadosDoFormulario(){
  const o = {
    idade: $('#sel-idade .on').dataset.idade,
    tam: $('#sel-tam .on').dataset.tam,
    minutos: Math.max(2, Math.min(25, Number($('#in-minutos').value)||6)),
    capitulos: Math.max(1, Math.min(8, Number($('#sel-capitulos').value)||1)),
    desfecho: $('#sel-desfecho').value,
    tema: $('#in-tema').value.trim(),
    personagens: $('#in-personagens').value.trim(),
    ambiente: $('#in-ambiente').value.trim(),
    tom: tomPorExtenso(),
    inspiracao: $('#in-inspiracao').value.trim(),
    extra: $('#in-extra').value.trim(),
    serie: $('#sel-continuar').value,
    nomeSerie: $('#in-nome-serie').value.trim()
  };
  const refId = $('#sel-inspiracao-acervo').value;
  if(refId){
    const ref = historias.find(h=>h.id===refId);
    if(ref) o.estiloTexto = semMarcadores(ref.texto).slice(0, 2500);
  }
  return o;
}

function novaHistoria(o, titulo, texto, serie, ordem){
  return { id:uid(), titulo, texto, idade:o.idade, tema:o.tema, personagens:o.personagens,
           ambiente:o.ambiente||'', tom:o.tom||'', inspiracao:o.inspiracao||'',
           serie:serie||'', ordem:ordem||0,
           criadaEm:new Date().toISOString(), origem:'ia', leituras:0, favorita:false };
}

function avisoGeracao(texto, sub){
  modal(`<h3>${esc(texto)}</h3>
    <div class="prep"><i id="ger-barra"></i></div>
    <div class="hint" id="ger-txt" style="text-align:center;margin-top:10px">${esc(sub||'')}</div>
    <div style="height:14px"></div>
    <div class="hint" style="text-align:center">Não feche esta janela até terminar.</div>`);
}
function avisoGeracaoPasso(k, n, txt){
  const b=$('#ger-barra'); if(b) b.style.width = Math.round((k-1)/n*100)+'%';
  const t=$('#ger-txt'); if(t) t.textContent = txt;
}

async function gerarHistoria(){
  if(!Rec.ligado('criar-com-ia', true)){ toast(T('Criar com IA foi desligado pela administração da SolverONE.','Create with AI was turned off by the SolverONE administration.'), 4000); return; }
  const o = dadosDoFormulario();
  let anterior = null;
  if(o.serie){
    const caps = listaSeries().get(o.serie)||[];
    anterior = caps[caps.length-1];
    if(!anterior){ toast('Não achei os capítulos dessa série'); return; }
  }
  const btn=$('#btn-gerar');
  const rotulo = btn.innerHTML;
  btn.disabled=true; btn.innerHTML='<span class="load"></span> escrevendo…';
  const avisoBtn = t => { btn.innerHTML = '<span class="load"></span> '+esc(t); };

  try{
    // ---- continuação de uma série que já existe: um capítulo só ----
    if(anterior){
      const saida = await chamarIA(montarPromptSerie(o, anterior), avisoBtn);
      const {titulo,texto} = separarTitulo(saida);
      if(!texto) throw new Error('Veio vazio. Tente de novo.');
      rascunhoSerie = null;
      rascunho = novaHistoria(o, titulo, texto, o.serie, proximaOrdem(o.serie));
      mostrarAprovacao();
      return;
    }

    // ---- história única ----
    if(o.capitulos <= 1){
      const saida = await chamarIA(montarPrompt(o), avisoBtn);
      const {titulo,texto} = separarTitulo(saida);
      if(!texto) throw new Error('Veio vazio. Tente de novo.');
      rascunhoSerie = null;
      rascunho = novaHistoria(o, titulo, texto, '', 0);
      mostrarAprovacao();
      return;
    }

    // ---- série nova, capítulo por capítulo (retoma de onde parou, se der erro no meio) ----
    const n = o.capitulos;
    const mesmaSerie = parcial && parcial.assinatura === JSON.stringify(o);
    const caps = mesmaSerie ? parcial.caps.slice() : [];
    parcial = { assinatura: JSON.stringify(o), caps };
    avisoGeracao(`Escrevendo ${n} capítulos`, 'capítulo '+(caps.length+1)+' de '+n+'…');
    const avisoModal = t => { const el=$('#ger-txt'); if(el) el.textContent = t; };
    for(let k=caps.length+1; k<=n; k++){
      avisoGeracaoPasso(k, n, `escrevendo o capítulo ${k} de ${n}…`);
      const oc = Object.assign({}, o, {capIndice:k, capTotal:n});
      const saida = await chamarIA(k===1 ? montarPrompt(oc) : montarPromptSerie(oc, caps[k-2]), avisoModal);
      const {titulo,texto} = separarTitulo(saida);
      if(!texto) throw new Error('O capítulo '+k+' veio vazio. Tente de novo.');
      caps.push({titulo, texto});
    }
    avisoGeracaoPasso(n+1, n, 'pronto!');
    const nomeSerie = o.nomeSerie || caps[0].titulo;
    rascunho = null; parcial = null;
    rascunhoSerie = caps.map((c,i)=> novaHistoria(o, c.titulo, c.texto, nomeSerie, i+1));
    fecharModal();
    mostrarAprovacaoSerie(nomeSerie);

  }catch(e){
    const velho = !!e.modeloVelho;
    const feitos = parcial ? parcial.caps.length : 0;
    modal(`<h3>${e.sobrecarga ? 'O Google está lotado agora 🙁' : 'Não deu certo 🙁'}</h3><p class="hint">${esc(e.message||e)}</p>
      ${feitos ? `<div class="ok" style="margin-top:12px">Os <b>${feitos}</b> capítulo(s) que já ficaram prontos estão guardados. Ao tocar em gerar de novo, com os mesmos campos, ele continua do capítulo ${feitos+1} — sem gastar cota com o que já saiu.</div>` : ''}
      ${(velho||e.sobrecarga||e.cota||feitos) ? '' : '<div class="info" style="margin-top:12px">Confira a chave em <b>Configurações → IA que escreve as histórias</b>. Se a chave estiver certa e mesmo assim não funcionar, pode ser cota esgotada do dia.</div>'}
      <div style="height:14px"></div>
      ${velho ? '<button class="btn ok" id="m-ajustes">Ir para as Configurações</button><div style="height:10px"></div>' : ''}
      ${(e.sobrecarga||(e.cota && !e.fimDoMes)||feitos) ? '<button class="btn ok" id="m-denovo">🔄 Tentar de novo</button><div style="height:10px"></div>' : ''}
      <button class="btn sm ghost" id="mfechar">Fechar</button>`);
    $('#mfechar').onclick=fecharModal;
    const dn=$('#m-denovo'); if(dn) dn.onclick=()=>{ fecharModal(); gerarHistoria(); };
    if(velho) $('#m-ajustes').onclick=()=>{ fecharModal(); irTela('config');
      setTimeout(()=>{ const el=$('#btn-modelos-gemini'); if(el) el.scrollIntoView({block:'center'}); },300); };
  }finally{
    btn.disabled=false; btn.innerHTML = rotulo;
  }
}

function mostrarAprovacaoSerie(nome){
  const caps = rascunhoSerie || [];
  const min = caps.reduce((a,c)=>a+minutosDe(c.texto),0);
  modal(`
    <h3>${esc(nome)}</h3>
    <div class="hint">${caps.length} capítulos · ${min} min no total · ${rotuloIdade(caps[0].idade)}</div>
    <div style="height:14px"></div>
    ${caps.map((c,i)=>`
      <div class="cap-item" data-i="${i}">
        <div class="num">${i+1}</div>
        <div class="t"><b>${esc(c.titulo)}</b><span>${minutosDe(c.texto)} min · ${contarPalavras(c.texto)} palavras</span></div>
        <div style="color:var(--dim2)">👁️</div>
      </div>`).join('')}
    <div style="height:14px"></div>
    <button class="btn ok" id="as-salvar">💾 Aprovar e guardar os ${caps.length} capítulos</button>
    <div style="height:10px"></div>
    <button class="btn sm ghost" id="as-descartar" style="color:var(--vermelho)">Descartar tudo</button>`);
  $$('#modal .cap-item').forEach(el=>el.onclick=()=>{
    const c = caps[Number(el.dataset.i)];
    modal(`<h3>${esc(c.titulo)}</h3>
      <div class="hint">capítulo ${Number(el.dataset.i)+1} de ${caps.length}</div>
      <div style="height:12px"></div>
      <div style="max-height:46vh;overflow-y:auto;background:var(--card);border:1px solid var(--line);
        border-radius:14px;padding:14px;line-height:1.75;font-size:15px;white-space:pre-wrap">${esc(c.texto)}</div>
      <div style="height:14px"></div>
      <button class="btn sm" id="av-voltar">‹ Voltar para a lista</button>`);
    $('#av-voltar').onclick=()=>mostrarAprovacaoSerie(nome);
  });
  $('#as-salvar').onclick=()=>{
    caps.slice().reverse().forEach(c=>historias.unshift(c));
    salvarHistorias(); rascunhoSerie=null; fecharModal();
    toast(caps.length+' capítulos guardados 💜');
    pintarTudo(); irTela('acervo');
  };
  $('#as-descartar').onclick=()=>{ rascunhoSerie=null; fecharModal(); };
}

function mostrarAprovacao(){
  const h=rascunho;
  modal(`
    <h3>${esc(h.titulo)}</h3>
    <div class="hint">${h.serie? esc(h.serie)+' · capítulo '+h.ordem+' · ' : ''}${rotuloIdade(h.idade)} · ${minutosDe(h.texto)} min · ${contarPalavras(h.texto)} palavras</div>
    <div style="height:12px"></div>
    <div style="max-height:38vh;overflow-y:auto;background:var(--card);border:1px solid var(--line);
      border-radius:14px;padding:14px;line-height:1.75;font-size:15px;white-space:pre-wrap">${esc(h.texto)}</div>
    <div style="height:14px"></div>
    <button class="btn ok" id="ap-salvar">💾 Aprovar e guardar no acervo</button>
    <div style="height:10px"></div>
    <div class="linha">
      <button class="btn sm" id="ap-ouvir">▶️ Ouvir antes</button>
      <button class="btn sm" id="ap-editar">✏️ Editar</button>
      <button class="btn sm" id="ap-outra">🔄 Outra</button>
    </div>
    <div style="height:10px"></div>
    <button class="btn sm ghost" id="ap-descartar" style="color:var(--vermelho)">Descartar</button>
  `);
  $('#ap-salvar').onclick=()=>{ historias.unshift(rascunho); salvarHistorias(); fecharModal();
    toast('Guardada no acervo 💜'); rascunho=null; pintarTudo(); irTela('acervo'); };
  $('#ap-ouvir').onclick=()=>{ fecharModal(); Leitor.abrir(rascunho); };
  $('#ap-editar').onclick=()=>{ fecharModal(); irTela('nova');
    $$('#modo-nova button').forEach(b=>b.classList.toggle('on', b.dataset.modo==='manual'));
    $('#bloco-ia').classList.add('oculto'); $('#bloco-manual').classList.remove('oculto');
    $('#man-titulo').value=rascunho.titulo; $('#man-texto').value=rascunho.texto;
    $('#man-serie').value=rascunho.serie||'';
    $$('#man-idade button').forEach(b=>b.classList.toggle('on', b.dataset.idade===rascunho.idade));
    toast('Edite à vontade e salve'); };
  $('#ap-outra').onclick=()=>{ fecharModal(); gerarHistoria(); };
  $('#ap-descartar').onclick=()=>{ rascunho=null; fecharModal(); };
}

/* ------------------------- para quem são as histórias ------------------------- */
function nomesDoPublico(texto){
  return (texto===undefined ? Seg.agora('publicoNomes') : texto).split(/\s*,\s*|\s+e\s+/i).map(x=>x.trim()).filter(Boolean);
}
function nomesPorExtenso(){
  const n = nomesDoPublico();
  if(n.length===0) return '';
  if(n.length===1) return n[0];
  return n.slice(0,-1).join(', ') + ' e ' + n[n.length-1];
}
// como chamar quem ouve, quando não há nomes: só faz sentido no plural
const COLETIVO = { meninas:'meninas', meninos:'meninos', misto:'crianças' };
function vocativo(){
  const nomes = nomesPorExtenso();
  if(nomes) return nomes;
  if(Seg.tem('publicoNomes')) return '';        // há nomes guardados, mas o cofre está trancado: texto neutro, sem nome e sem pista
  return COLETIVO[cfg.publicoTipo] || '';
}
function periodoDoDia(){
  const h = new Date().getHours();
  return h<12 ? 'bom dia' : (h<18 ? 'boa tarde' : 'boa noite');
}
function saudacao(){
  const v = vocativo();
  return v ? `${periodoDoDia()}, ${v}` : `${periodoDoDia()}! que tal uma história?`;
}
// o que a voz fala antes da história
function fraseCumprimento(){
  const v = vocativo();
  return v ? `Olá ${v}, vamos ouvir uma historinha?` : 'Olá, vamos ouvir uma historinha?';
}
function atualizarSaudacao(){
  const t = saudacao();
  const el = $('#sub-hd'); if(el) el.textContent = t;
  const pv = $('#previa-saudacao'); if(pv) pv.textContent = t.toUpperCase();
  const pf = $('#previa-fala'); if(pf) pf.textContent = fraseCumprimento();
}
// como a IA deve se dirigir a quem ouve
function linhaPublicoParaIA(){
  const nomes = nomesPorExtenso();
  const tipo = cfg.publicoTipo;
  if(!nomes && !tipo) return '';
  const quem = {menina:'uma menina', meninas:'duas ou mais meninas', menino:'um menino',
                meninos:'dois ou mais meninos', misto:'meninas e meninos'}[tipo] || '';
  let l = 'QUEM VAI OUVIR: ';
  if(nomes) l += nomes + (quem? ' ('+quem+')' : '');
  else l += quem;
  if(cfg.publicoNaHistoria && (nomes || quem)){
    l += '. Comece com uma saudação curta e carinhosa dirigida' +
         (nomes? ' a '+nomes : ' a quem vai ouvir') +
         ', em uma linha só, antes de começar a narrativa. Use a concordância certa de gênero e número. Depois disso, não cite mais quem está ouvindo — a história segue normalmente.';
  }else{
    l += '. Não cite quem está ouvindo dentro da história; a informação serve apenas para acertar a concordância e o tom.';
  }
  return l;
}

/* ----------------------------- telas e listas ----------------------------- */
const ICONES = ['🦉','🐉','🌊','🚀','🐻','🦊','🌟','🐢','🎈','🦋','🐰','🌙','🍄','🐳','🎪','🧸','🦄','🐝'];
const iconeDe = h => ICONES[ (String(h.id).split('').reduce((a,c)=>a+c.charCodeAt(0),0)) % ICONES.length ];
const rotuloIdade = i => ({'2-5':'2 a 5 anos','6-9':'6 a 9 anos','10+':'10 anos +','mista':'para as duas'}[i] || 'todas as idades');

let telaAtual = 'inicio';
function irTela(nome, semHistorico){
  if(typeof pararSonsDeTeste==='function') pararSonsDeTeste();
  // abas: Início é a base; qualquer outra aba fica UMA camada acima dele (Voltar → Início)
  if(semHistorico!==true){
    if(nome!=='inicio' && !Nav.tem('tela')) Nav.empurrar('tela');
    if(nome==='inicio' && Nav.tem('tela')) Nav.tirar('tela');
  }
  telaAtual = nome;
  if(typeof Topo!=='undefined') Topo.aoTrocarTela(nome);
  $$('section.tela').forEach(s=>s.classList.toggle('on', s.id==='tela-'+nome));
  $$('nav.tabs button').forEach(b=>b.classList.toggle('on', b.dataset.tela===nome));
  document.body.classList.toggle('larga', nome==='acervo');   // lista usa a tela toda; texto não
  window.scrollTo({top:0,behavior:'instant'});
  if(Assist) Assist.aoTrocarTela(nome);
}
$$('nav.tabs button').forEach(b=>b.addEventListener('click',()=>{
  irTela(b.dataset.tela);
  if(b.dataset.tela==='config' && typeof mostrarGuarda==='function') mostrarGuarda();
  if(b.dataset.tela==='config' && typeof carregarVozesNativas==='function') carregarVozesNativas();
}));
// tocar no nome do app (com o ícone) leva ao Início, de qualquer aba
['#hd-marca'].forEach(sel=>{
  const el=$(sel); if(!el) return;
  el.addEventListener('click',()=>irTela('inicio'));
  el.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); irTela('inicio'); } });
});
// o módulo de diretrizes cria o PT|EN solto na tela; aqui ele entra em Configurações → Idioma (diretriz do topo)
(function moverIdioma(t){
  const el = document.querySelector('.dgo-idioma'), alvo = $('#cfg-idioma');
  if(el && alvo){ if(el.parentNode!==alvo) alvo.appendChild(el); return; }
  if(t<40) setTimeout(()=>moverIdioma(t+1), 150);
})(0);
$('#btn-ir-nova').addEventListener('click',()=>irTela('nova'));
$('#btn-ir-acervo').addEventListener('click',()=>irTela('acervo'));

function proximaOrdem(nome){
  const caps = listaSeries().get(nome)||[];
  return caps.reduce((a,c)=>Math.max(a, c.ordem||0), 0) + 1;
}
function pintarSeries(){
  const mapa = listaSeries();
  const nomes = Array.from(mapa.keys()).sort();
  $('#lista-series').innerHTML = nomes.map(n=>'<option value="'+esc(n)+'">').join('');
  const sel = $('#sel-continuar'), antes = sel.value;
  sel.innerHTML = '<option value="">Nao|historia nova e avulsa</option>'.replace('Nao|','Não — ') +
    nomes.map(n=>'<option value="'+esc(n)+'">'+esc(n)+' — escrever o capítulo '+((mapa.get(n)||[]).length+1)+'</option>').join('');
  if(antes && nomes.indexOf(antes)>=0) sel.value = antes;
  atualizarHintContinuar();
}
function atualizarHintContinuar(){
  const n = $('#sel-continuar').value;
  $('#hint-continuar').textContent = n
    ? 'A IA vai ler o último capítulo de "'+n+'" e continuar de onde parou.'
    : '';
  $('#in-tema').placeholder = n ? 'opcional — o que você quer que aconteça nesse capítulo'
                                : 'Ex.: uma viagem ao fundo do mar';
}
function pintarStats(){
  $('#s-total').textContent = historias.length;
  // com a nuvem ligada, somam os outros aparelhos da conta
  let o = {leituras:0, segundos:0, sequencia:0}; try{ o = Nuvem.outros(); }catch(e){}
  $('#s-leituras').textContent = (stats.leituras||0) + o.leituras;
  $('#s-minutos').textContent = Math.round(((stats.segundos||0) + o.segundos)/60);
  $('#s-noites').textContent = Math.max(stats.sequencia||0, o.sequencia);
}

function pctDe(h){
  if(!h.posFrase || !h.frasesTotal) return 0;
  return Math.max(1, Math.min(99, Math.round(h.posFrase/h.frasesTotal*100)));
}
// selo do cartão: vale para qualquer voz guardada, mesmo que agora a escolhida seja a do celular
function temAudio(h){ return vozesCompletas(h).length>0; }
function temAudioParcial(h){ const r=VOZ_GUARDADA.get(h.id); return !!(r && r.n) && !temAudio(h); }
function cartaoHistoria(h, opc){
  opc = opc||{};
  const pct = pctDe(h);
  const tags = [];
  if(h.serie) tags.push(`<span class="tag">${esc(h.serie)}</span>`);
  else tags.push(`<span class="tag">${rotuloIdade(h.idade)}</span>`);
  tags.push(`<span>${minutosDe(h.texto)} min</span>`);
  if(pct) tags.push(`<span>⏸ parou em ${pct}%</span>`);
  else if(h.leituras) tags.push(`<span>${h.leituras}× ouvida</span>`);
  if(temAudio(h)) tags.push(`<span class="selo" title="${esc(vozesCompletas(h).map(nomeMarca).join(', '))}">⚡ voz guardada</span>`);
  else if(temAudioParcial(h)) tags.push(`<span class="selo meio" title="parte da voz já está no aparelho">◐ voz em parte</span>`);
  return `<div class="hist" data-id="${esc(h.id)}">
    <div class="cap">${h.favorita?'⭐':iconeDe(h)}</div>
    <div class="info"><b>${esc(h.titulo)}</b><div class="meta">${tags.join('')}</div>
      ${pct?`<div class="pbar"><i style="width:${pct}%"></i></div>`:''}
    </div>
    ${opc.semCheck?'<div style="align-self:center;color:var(--gold);font-size:20px">▶</div>'
      :`<div class="chk ${h.lida?'on':''}" data-chk="${esc(h.id)}" title="marcar como já lida">✓</div>`}
  </div>`;
}
function ligarChecks(sel){
  $$(sel+' .chk').forEach(el=>el.addEventListener('click', e=>{
    e.stopPropagation();
    const h = historias.find(x=>x.id===el.dataset.chk);
    if(!h) return;
    h.lida = !h.lida;
    if(h.lida && !h.leituras) h.leituras = 1;
    if(!h.lida) { h.posicao = 0; h.posFrase = 0; }
    salvarHistorias(); el.classList.toggle('on', h.lida);
    pintarInicio();
  }));
}
function ligarCartoes(sel){
  $$(sel+' .hist:not(.serie)').forEach(el=>el.addEventListener('click',()=>{
    const h = historias.find(x=>x.id===el.dataset.id);
    if(h) Leitor.abrir(h);
  }));
  ligarChecks(sel);
}

/* ------------------------- séries ------------------------- */
function listaSeries(){
  const m = new Map();
  historias.forEach(h=>{ if(h.serie){ if(!m.has(h.serie)) m.set(h.serie,[]); m.get(h.serie).push(h); } });
  m.forEach(v=>v.sort((a,b)=>(a.ordem||0)-(b.ordem||0)));
  return m;
}
function proximoDaSerie(nome){
  const caps = (listaSeries().get(nome)||[]);
  return caps.find(c=>!(c.lida||c.leituras)) || null;
}
function proximoCapitulo(h){
  if(!h || !h.serie) return null;
  const caps = listaSeries().get(h.serie)||[];
  const i = caps.findIndex(c=>c.id===h.id);
  return (i>=0 && i+1<caps.length) ? caps[i+1] : null;
}
function cartaoSerie(nome, caps){
  const lidos = caps.filter(c=>c.lida||c.leituras).length;
  const prox = caps.find(c=>!(c.lida||c.leituras));
  const min = caps.reduce((a,c)=>a+minutosDe(c.texto),0);
  return `<div class="hist serie" data-serie="${esc(nome)}">
    <div class="cap" data-n="${caps.length}">📺</div>
    <div class="info"><b>${esc(nome)}</b><div class="meta">
      <span class="tag">série</span>
      <span>${caps.length} capítulos · ${min} min</span>
      <span>${lidos? (lidos===caps.length? '✅ tudo ouvido' : 'no capítulo '+(lidos+1)) : 'ainda não começou'}</span>
    </div></div>
    <div style="align-self:center;color:var(--dim2);font-size:20px">›</div>
  </div>`;
}
function abrirSerie(nome){
  const caps = listaSeries().get(nome)||[];
  const prox = caps.find(c=>!(c.lida||c.leituras));
  modal(`<h3>${esc(nome)}</h3>
    <div class="hint">${caps.length} capítulos · ${caps.reduce((a,c)=>a+minutosDe(c.texto),0)} min no total</div>
    <div style="height:14px"></div>
    ${caps.map((c,i)=>`<div class="cap-item ${c.leituras?'lido':''} ${prox&&prox.id===c.id?'proximo':''}" data-id="${esc(c.id)}">
      <div class="num">${(c.lida||c.leituras)?'✓':(i+1)}</div>
      <div class="t"><b>${esc(c.titulo)}</b><span>${minutosDe(c.texto)} min${(c.lida||c.leituras)?' · já ouvido':''}${pctDe(c)?' · parou em '+pctDe(c)+'%':''}${temAudio(c)?' · ⚡':''}</span></div>
      <div style="color:var(--dim2)">▶</div></div>`).join('')}
    ${prox?`<div style="height:8px"></div><button class="btn pri" id="sr-continuar">▶️ Continuar do capítulo ${caps.indexOf(prox)+1}</button>`:''}`);
  $$('#modal .cap-item').forEach(el=>el.onclick=()=>{
    const h = historias.find(x=>x.id===el.dataset.id);
    fecharModal(); if(h) Leitor.abrir(h);
  });
  if(prox) $('#sr-continuar').onclick=()=>{ fecharModal(); Leitor.abrir(prox); };
}

let filtroIdade='todas', filtroEstado='tudo';
function pintarAcervo(){
  const q = $('#busca').value.trim().toLowerCase();
  let lista = historias.slice();
  if(filtroIdade!=='todas') lista = lista.filter(h=>h.idade===filtroIdade);
  if(filtroEstado==='fav')   lista = lista.filter(h=>h.favorita);
  if(filtroEstado==='lidas') lista = lista.filter(h=>h.lida);
  if(filtroEstado==='novas') lista = lista.filter(h=>!h.lida);
  if(q) lista = lista.filter(h=> (h.titulo+' '+h.texto+' '+(h.tema||'')+' '+(h.serie||'')+' '+(h.personagens||'')).toLowerCase().includes(q));

  // agrupa séries num cartão só (a não ser que esteja buscando algo)
  let html='';
  if(q || filtroEstado!=='tudo' || filtroIdade!=='todas'){
    html = lista.map(cartaoHistoria).join('');
  }else{
    const series = new Map(), soltas = [];
    lista.forEach(h=>{
      if(h.serie){ if(!series.has(h.serie)) series.set(h.serie,[]); series.get(h.serie).push(h); }
      else soltas.push(h);
    });
    series.forEach(v=>v.sort((a,b)=>(a.ordem||0)-(b.ordem||0)));
    const blocos = [];
    series.forEach((caps,nome)=> blocos.push({tipo:'s', nome, caps, data:caps[0].criadaEm||''}));
    soltas.forEach(h=> blocos.push({tipo:'h', h, data:h.criadaEm||''}));
    blocos.sort((a,b)=> (b.data||'').localeCompare(a.data||''));
    html = blocos.map(b=> b.tipo==='s' ? cartaoSerie(b.nome,b.caps) : cartaoHistoria(b.h)).join('');
  }
  $('#lista-acervo').innerHTML = html ||
    `<div class="vazio"><span class="em">📭</span>${historias.length? 'Nada encontrado com esse filtro.' : 'Seu acervo está vazinho.<br>Vá em <b>Criar</b> e faça a primeira história.'}</div>`;
  ligarCartoes('#lista-acervo');
  $$('#lista-acervo .hist.serie').forEach(el=>el.addEventListener('click', e=>{
    e.stopPropagation(); abrirSerie(el.dataset.serie);
  }));
}
$('#busca').addEventListener('input', pintarAcervo);
$$('#filtro-idade button').forEach(b=>b.addEventListener('click',()=>{
  $$('#filtro-idade button').forEach(x=>x.classList.remove('on'));
  b.classList.add('on'); filtroIdade=b.dataset.idade; pintarAcervo();
}));
$$('#filtro-estado button').forEach(b=>b.addEventListener('click',()=>{
  $$('#filtro-estado button').forEach(x=>x.classList.remove('on'));
  b.classList.add('on'); filtroEstado=b.dataset.estado; pintarAcervo();
}));

function pintarInicio(){
  // 1º: série já começada e não terminada. 2º: história menos lida.
  let s=null, aviso='';
  listaSeries().forEach((caps,nome)=>{
    if(s) return;
    const lidos = caps.filter(c=>c.lida||c.leituras).length;
    if(lidos>0 && lidos<caps.length){ s = caps.find(c=>!c.leituras); aviso = nome+' · capítulo '+(lidos+1); }
  });
  if(!s){
    const cand = historias.filter(h=>!h.posFrase)
      .sort((a,b)=>(a.lida?1:0)-(b.lida?1:0) || (a.leituras||0)-(b.leituras||0) || Math.random()-0.5);
    s = cand[0];
  }
  $('#sugestao-conteudo').innerHTML = s
    ? `<div style="display:flex;gap:12px;align-items:center;margin-bottom:14px">
         <div class="cap" style="width:54px;height:54px;font-size:26px;border-radius:15px;display:flex;align-items:center;justify-content:center;background:linear-gradient(140deg,#4a3a78,#2e2450)">${iconeDe(s)}</div>
         <div style="flex:1;min-width:0"><b style="font-size:17px;display:block">${esc(s.titulo)}</b>
         <span class="hint">${aviso? esc(aviso)+' · ' : ''}${rotuloIdade(s.idade)} · ${minutosDe(s.texto)} min · ${(s.leituras||0)===0?'ainda não foi lida':'lida '+s.leituras+'×'}</span></div>
       </div>
       <div class="linha"><button class="btn pri" id="btn-ler-sug">▶️ Ler agora</button>
       <button class="btn sm" id="btn-outra-sug" style="flex:0 0 56px">🎲</button></div>`
    : `<div class="vazio" style="padding:16px"><span class="em">🌙</span>Nenhuma história ainda.<br>Crie a primeira na aba <b>Criar</b>.</div>`;
  if(s){
    $('#btn-ler-sug').onclick=()=>Leitor.abrir(s);
    $('#btn-outra-sug').onclick=()=>{ const r=historias[Math.floor(Math.random()*historias.length)]; if(r) Leitor.abrir(r); };
  }
  // fila de "continuar ouvindo": tudo que ficou pela metade, mais recente primeiro
  const emAndamento = historias.filter(h=>h.posFrase>0)
    .sort((a,b)=> (b.ouvidaEm||'').localeCompare(a.ouvidaEm||''));
  $('#tit-continuar').classList.toggle('oculto', emAndamento.length===0);
  $('#lista-continuar').innerHTML = emAndamento.slice(0,4).map(h=>cartaoHistoria(h,{semCheck:true})).join('');
  ligarCartoes('#lista-continuar');

  const recentes = historias.filter(h=>h.ultimaLeitura||h.ouvidaEm)
    .sort((a,b)=> ((b.ultimaLeitura||b.ouvidaEm)||'').localeCompare((a.ultimaLeitura||a.ouvidaEm)||''))
    .filter(h=>!h.posFrase).slice(0,4);
  $('#lista-recentes').innerHTML = recentes.length ? recentes.map(h=>cartaoHistoria(h,{semCheck:true})).join('')
    : `<div class="hint" style="text-align:center;padding:10px">Quando vocês terminarem uma história, ela aparece aqui.</div>`;
  ligarCartoes('#lista-recentes');
  atualizarSaudacao();
}
const pintarTudo = ()=>{ pintarStats(); pintarSeries(); pintarInspiracaoAcervo(); pintarAcervo(); pintarInicio(); };

/* ----------------------------- leitor: botões ----------------------------- */
$('#btn-play').addEventListener('click',()=>Leitor.alternar());
$('#btn-avancar-fr').addEventListener('click',()=>Leitor.passo(1));
$('#btn-voltar-fr').addEventListener('click',()=>Leitor.passo(-1));
$('#btn-cap-prox').addEventListener('click',()=>Leitor.capitulo(1));
$('#btn-cap-ant').addEventListener('click',()=>Leitor.capitulo(-1));
$('#btn-do-inicio').addEventListener('click',()=>Leitor.doInicio());
$('#btn-baixar-voz').addEventListener('click',()=>Leitor.cliqueFaixa());
$('#btn-apagar-voz-hist').addEventListener('click',()=>Leitor.apagarVozDaHistoria());
$('#chk-lida').addEventListener('click',()=>{
  const h=Leitor.atual(); if(!h) return;
  h.lida = !h.lida;
  if(h.lida && !h.leituras) h.leituras = 1;
  if(!h.lida) { h.posicao = 0; h.posFrase = 0; }
  salvarHistorias(); Leitor.marcarCheck(); pintarInicio();
  toast(h.lida ? 'Marcada como já lida ✓' : 'Marcada como não lida');
});
$('#btn-fechar-leitor').addEventListener('click',()=>Leitor.fechar());
$('#btn-inicio-leitor').addEventListener('click',()=>{ Leitor.fechar(); irTela('inicio'); });
$('#btn-fav').addEventListener('click',()=>{
  const h=Leitor.atual(); if(!h) return;
  h.favorita=!h.favorita; salvarHistorias();
  $('#btn-fav').textContent = h.favorita?'★':'☆';
  toast(h.favorita?'Marcada como favorita ⭐':'Tirada dos favoritos');
});
$('#btn-menu-hist').addEventListener('click',()=>{
  const h=Leitor.atual(); if(!h) return;
  modal(`<h3>${esc(h.titulo)}</h3>
    <div class="hint">${rotuloIdade(h.idade)} · ${contarPalavras(h.texto)} palavras · criada em ${new Date(h.criadaEm).toLocaleDateString('pt-BR')}</div>
    <div style="height:16px"></div>
    <button class="btn sm ok" id="mh-preparar">⬇️ Baixar a voz desta história</button><div style="height:10px"></div>
    <button class="btn sm" id="mh-fila">📥 Pôr na fila de voz</button><div style="height:10px"></div>
    ${(VOZ_GUARDADA.get(h.id)||{}).n ? `<button class="btn sm ghost" id="mh-apagar-voz">🗑️ Apagar só a voz guardada (${fmtBytes(VOZ_GUARDADA.get(h.id).bytes)})</button><div style="height:10px"></div>` : ''}
    <button class="btn sm" id="mh-editar">✏️ Editar o texto</button><div style="height:10px"></div>
    <button class="btn sm" id="mh-copiar">📋 Copiar a história</button><div style="height:10px"></div>
    <button class="btn sm ghost" id="mh-apagar" style="color:var(--vermelho)">🗑️ Apagar do acervo</button>`);
  $('#mh-preparar').onclick=()=>{ Leitor.prepararTudo(); };
  $('#mh-fila').onclick=()=>{ fecharModal(); FilaVoz.adicionar([h.id]); };
  if($('#mh-apagar-voz')) $('#mh-apagar-voz').onclick=()=>{ fecharModal(); Leitor.apagarVozDaHistoria(); };
  $('#mh-editar').onclick=()=>{
    fecharModal(); Leitor.fechar(); irTela('nova');
    $$('#modo-nova button').forEach(b=>b.classList.toggle('on', b.dataset.modo==='manual'));
    $('#bloco-ia').classList.add('oculto'); $('#bloco-manual').classList.remove('oculto');
    $('#man-titulo').value=h.titulo; $('#man-texto').value=h.texto;
    $('#man-serie').value=h.serie||'';
    $$('#man-idade button').forEach(b=>b.classList.toggle('on', b.dataset.idade===h.idade));
    editandoId = h.id; $('#btn-salvar-manual').textContent='💾 Salvar alterações';
  };
  $('#mh-copiar').onclick=()=>{ navigator.clipboard.writeText(h.titulo+'\n\n'+h.texto).then(()=>toast('Copiado!')); fecharModal(); };
  $('#mh-apagar').onclick=()=>{
    if(!confirm('Apagar "'+h.titulo+'" deste celular?')) return;
    historias = historias.filter(x=>x.id!==h.id); salvarHistorias();
    Guarda.limparHistoria(h.id).then(()=>atualizarVozGuardada(true));   // a voz dela vai junto
    fecharModal(); Leitor.fechar(); pintarTudo(); toast('Apagada');
  };
});

/* ----------------------------- criar: modo e salvar manual ----------------------------- */
let editandoId=null;
$$('#modo-nova button').forEach(b=>b.addEventListener('click',()=>{
  $$('#modo-nova button').forEach(x=>x.classList.remove('on')); b.classList.add('on');
  const ia = b.dataset.modo==='ia';
  $('#bloco-ia').classList.toggle('oculto', !ia);
  $('#bloco-manual').classList.toggle('oculto', ia);
}));
function segmento(sel, cb){
  $$(sel+' button').forEach(b=>b.addEventListener('click',()=>{
    $$(sel+' button').forEach(x=>x.classList.remove('on')); b.classList.add('on'); cb&&cb(b);
  }));
}
segmento('#sel-idade', b=>{ $('#hint-idade').textContent = PERFIS[b.dataset.idade].guia; });
segmento('#sel-tam', ()=>atualizarCriar());
$('#sel-capitulos').addEventListener('change', atualizarCriar);
$('#in-minutos').addEventListener('input',()=>{ $('#lbl-minutos').textContent = $('#in-minutos').value; });

function atualizarCriar(){
  const n = Number($('#sel-capitulos').value)||1;
  const continuando = !!$('#sel-continuar').value;
  const tam = ($('#sel-tam .on')||{dataset:{}}).dataset.tam;
  $('#bloco-minutos').classList.toggle('oculto', tam!=='custom');
  $('#bloco-nome-serie').classList.toggle('oculto', !(n>1 && !continuando));
  $('#lbl-tamanho').textContent = (n>1 && !continuando) ? 'Duração de cada capítulo' : 'Duração da história';
  $('#hint-capitulos').textContent = continuando
    ? 'Continuando uma série: a IA escreve o próximo capítulo.'
    : (n>1 ? `A IA vai escrever ${n} capítulos em sequência, um lendo o anterior. Leva alguns minutos e usa ${n} pedidos da cota.`
           : '');
  $('#btn-gerar').innerHTML = continuando ? '✨ Gerar próximo capítulo'
                            : (n>1 ? `✨ Gerar os ${n} capítulos` : '✨ Gerar história');
}
segmento('#man-idade');
// "A IA escreve" desligado no RootifyONE: a tela Criar fica no "Eu escrevo"
function criarSemIA(){
  if(Rec.ligado('criar-com-ia', true) || $('#bloco-ia').classList.contains('oculto')) return;
  $('#modo-nova [data-modo=manual]').click();
}
criarSemIA();
$('#btn-mais-temas').addEventListener('click', novosTemas);
$('#btn-mais-personagens').addEventListener('click', novosPersonagens);
$('#btn-mais-ambientes').addEventListener('click', novosAmbientes);
$('#btn-gerar').addEventListener('click', gerarHistoria);
$('#sel-continuar').addEventListener('change', ()=>{
  atualizarHintContinuar();
  atualizarCriar();
});

$('#btn-salvar-manual').addEventListener('click',()=>{
  const titulo=$('#man-titulo').value.trim(), texto=$('#man-texto').value.trim();
  if(!titulo){ toast('Dê um título 🙂'); return; }
  if(!texto){ toast('Escreva a história 🙂'); return; }
  const idade=$('#man-idade .on').dataset.idade;
  const serie=$('#man-serie').value.trim();
  if(editandoId){
    const h=historias.find(x=>x.id===editandoId);
    if(h){ h.titulo=titulo; h.texto=texto; h.idade=idade;
           if(serie!==h.serie){ h.serie=serie; h.ordem = serie ? proximaOrdem(serie) : 0; } }
    editandoId=null; $('#btn-salvar-manual').textContent='💾 Salvar no acervo';
    toast('Alterações salvas ✅');
  }else{
    historias.unshift({id:uid(), titulo, texto, idade, serie, ordem: serie?proximaOrdem(serie):0,
      criadaEm:new Date().toISOString(), origem:'manual', leituras:0, favorita:false});
    toast('Guardada no acervo 💜');
  }
  salvarHistorias(); $('#man-titulo').value=''; $('#man-texto').value=''; $('#man-serie').value='';
  pintarTudo(); irTela('acervo');
});
$('#btn-ver-sons').addEventListener('click',()=>{
  modal(`<h3>Marcadores de som</h3>
    <p class="hint">Escreva o marcador sozinho numa linha, no ponto da história em que o som deve entrar. Ex.: <b>[som:chuva]</b></p>
    <div style="height:14px"></div>
    ${Object.entries(SONS).map(([k,v])=>`<div style="display:flex;gap:10px;align-items:center;padding:9px 0;border-bottom:1px solid var(--line)">
      <span style="font-size:20px">${v.e}</span><b style="flex:1">[som:${k}]</b>
      <button class="btn sm" style="width:auto;padding:7px 14px" data-som="${k}">ouvir</button></div>`).join('')}
    <div class="hint" style="margin-top:12px">Os ambientes (chuva, vento, mar, floresta, fogueira, noite) ficam tocando baixinho até outro som entrar. <b>[som:fim]</b> desliga tudo.</div>
    <div style="height:14px"></div><button class="btn" id="msfechar">Fechar</button>`);
  $$('#modal [data-som]').forEach(b=>b.onclick=()=>{
    Som.ligar(); Som.parar(true);
    if(b.dataset.som!=='fim') setTimeout(()=>Som.tocar(b.dataset.som), 70);
  });
  $('#msfechar').onclick=()=>{ Som.parar(true); fecharModal(); };
});

/* ----------------------------- ajustes ----------------------------- */
function mostrarBlocosVoz(){
  ['nativo','elevenlabs','gemini','openai','solverone'].forEach(m=>$('#cfg-'+m).classList.toggle('oculto', cfg.motorVoz!==m));
}
function mostrarBlocosTexto(){
  ['manual','gemini','anthropic','openai','solverone'].forEach(m=>$('#cfg-txt-'+m).classList.toggle('oculto', cfg.motorTexto!==m));
  const nomes={manual:'você mesmo escreve as histórias',gemini:'usando o Gemini',anthropic:'usando o Claude',openai:'usando a OpenAI',solverone:'usando a IA da SolverONE'};
  $('#hint-motor-texto').textContent = 'Agora: '+nomes[cfg.motorTexto];
  $('#btn-gerar').disabled = cfg.motorTexto==='manual';
}
// o cofre: quem já tem chave aparece primeiro, com o selo
const COFRE = [['gemini','Gemini','geminiKey'],['anthropic','Claude (Anthropic)','anthropicKey'],['openai','OpenAI','openaiKey'],['elevenlabs','ElevenLabs','elevenKey']];
function pintarCofre(){
  const el = $('#cofre-lista'); if(!el) return;
  const itens = COFRE.map(([id,nome,campo])=>({nome, tem:Seg.tem(campo)}));
  itens.sort((a,b)=>(b.tem?1:0)-(a.tem?1:0));     // sort é estável: dentro de cada grupo, a ordem da lista
  const sv = (typeof Plataforma!=='undefined') ? Plataforma.resumoCofre() : '';
  el.innerHTML = sv + itens.map(i=>`<div class="it${i.tem?'':' sem'}"><span>${i.tem?'🔑':'◦'} ${esc(i.nome)}</span>${
    i.tem ? '<span class="selo">✓ '+T('chave salva','key saved')+'</span>' : '<span class="tag">'+T('sem chave','no key')+'</span>'}</div>`).join('');
}
document.addEventListener('dgo:idioma', pintarCofre);
segmento('#sel-motor-voz', b=>{ cfg.motorVoz=b.dataset.motor; salvarCfg(); mostrarBlocosVoz(); });
segmento('#sel-dur-som', b=>{ cfg.durEfeitos=b.dataset.dur; salvarCfg(); });
segmento('#sel-motor-texto', b=>{ cfg.motorTexto=b.dataset.motor; salvarCfg(); mostrarBlocosTexto(); });

function campo(sel, chave, tipo){
  const el=$(sel); if(!el) return;
  if(tipo==='num') el.value = cfg[chave];
  else el.value = cfg[chave]==null?'':cfg[chave];
  el.addEventListener('input',()=>{
    cfg[chave] = tipo==='num' ? Number(el.value) : el.value.trim();
    salvarCfg();
    if(/Key$/.test(chave)) pintarCofre();
    if(chave==='volEfeitos'){ $('#lbl-vol').textContent=cfg.volEfeitos; Som.volume(cfg.volEfeitos/100); }
    if(chave==='vel') $('#lbl-vel').textContent=Number(cfg.vel).toFixed(2);
    if(chave==='tom') $('#lbl-tom').textContent=Number(cfg.tom).toFixed(2);
    if(chave==='elevenEstab') $('#lbl-estab').textContent=Number(cfg.elevenEstab).toFixed(2);
    if(chave==='fonte'){ $('#lbl-fonte').textContent=cfg.fonte; $('#lt-texto').style.fontSize=cfg.fonte+'px'; }
  });
}
campo('#in-gemini-instr','geminiInstr');
$('#sel-publico-tipo').addEventListener('change',()=>{
  cfg.publicoTipo = $('#sel-publico-tipo').value; salvarCfg(); atualizarSaudacao();
});
campo('#in-openai-instr','openaiInstr');
campo('#rng-vel','vel','num'); campo('#rng-tom','tom','num'); campo('#rng-vol','volEfeitos','num');
campo('#rng-estab','elevenEstab','num'); campo('#rng-fonte','fonte','num');


function selecao(sel, chave){
  const el=$(sel); if(!el) return;
  if(cfg[chave]) el.value=cfg[chave];
  el.addEventListener('change',()=>{ cfg[chave]=el.value; salvarCfg(); });
}
selecao('#sel-voz-nativa','vozNativa'); selecao('#sel-modelo-eleven','elevenModel');
selecao('#sel-voz-eleven','elevenVoice'); selecao('#sel-voz-openai','openaiVoice');
selecao('#sel-modelo-openai','openaiModel'); selecao('#sel-modelo-gemini','geminiModel');
selecao('#sel-modelo-anthropic','anthropicModel'); selecao('#sel-modelo-openai-txt','openaiModelTxt');
$('#sel-voz-gemini').innerHTML = VOZES_GEMINI.map(v=>`<option value="${v[0]}">${v[0]} — ${v[1]}</option>`).join('');
selecao('#sel-voz-gemini','geminiVoice'); selecao('#sel-modelo-gemini-tts','geminiModelTts');


function chave(sel, campoCfg, depois){
  const el=$(sel);
  el.classList.toggle('on', !!cfg[campoCfg]);
  // o interruptor é um <div>: aqui ele ganha papel, estado e teclado (Tab, Enter, Espaço)
  el.setAttribute('role','switch'); el.setAttribute('tabindex','0'); el.setAttribute('aria-checked', String(!!cfg[campoCfg]));
  const rot = el.closest('.sw') && el.closest('.sw').querySelector('.txt b'); if(rot && !el.getAttribute('aria-label')) el.setAttribute('aria-label', rot.textContent.trim());
  el.addEventListener('click',()=>{
    cfg[campoCfg]=!cfg[campoCfg]; el.classList.toggle('on', cfg[campoCfg]); el.setAttribute('aria-checked', String(!!cfg[campoCfg])); salvarCfg(); depois&&depois();
  });
  el.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); el.click(); } });
}
// tema: o estado vem de cfg.tema ('escuro' | 'claro'); o desenho do interruptor é feito por Topo.aplicarTema()
(function(){ const el=$('#tg-tema'); el.setAttribute('role','switch'); el.setAttribute('tabindex','0'); el.setAttribute('aria-label','Tema claro');
  el.addEventListener('click', ()=>Topo.alternarTema()); el.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); el.click(); } }); })();
chave('#tg-reduzir','reduzirAnimacoes', ()=>Topo.aplicarTema());
chave('#tg-efeitos','efeitos', ()=>{ if(!cfg.efeitos) Som.parar(true); });
chave('#tg-adiantar','adiantar');
chave('#tg-usar-guardada','usarVozGuardada');
chave('#tg-publico-historia','publicoNaHistoria');
chave('#tg-saudar-antes','saudarAntes');
chave('#tg-proteger-nomes','protegerNomes');
/* ---------- chaves e nomes no cofre (v1.22.0) ----------
   Os seis campos abaixo não ficam em cfg: cada um lê e grava no cofre comum (Seg). A chave do Gemini e a da OpenAI
   aparecem em dois lugares da tela; as duas telas mostram sempre o mesmo valor. Com o cofre trancado, o campo
   não mostra nada: avisa que está guardado e, ao tocar, pede o PIN. */
const CAMPOS_TELA = {
  geminiKey:['#in-gemini-key','#in-gemini-key-voz'], openaiKey:['#in-openai-key','#in-openai-key2'],
  elevenKey:['#in-eleven-key'], anthropicKey:['#in-anthropic-key'],
  publicoNomes:['#in-publico-nomes'], nomesProtegidos:['#in-nomes-protegidos']
};
/* v1.23.0: as CHAVES de IA nunca aparecem inteiras sem o PIN. Com o cofre aberto o campo mostra só "••••••••";
   o botão "Mostrar" tranca o cofre e pede o PIN de novo, mostra a chave por 30 s e volta a esconder. Digitar num
   campo escondido TROCA a chave. Os nomes das crianças aparecem com o cofre aberto (a pessoa pode ver o que escreveu). */
const CHAVES_DE_IA = ['geminiKey','openaiKey','elevenKey','anthropicKey'];
const reveladas = {};                                          // campo → relógio (30 s) da chave mostrada com o PIN
const veDigitado = {};                                         // campo → true: o 👁 do campo mostra o que está sendo digitado (o cofre já está aberto)
const editando = {};                                           // campo → quando a pessoa mexeu por último (8 s de folga antes de esconder o que ela digitou)
const CTRL = new Map();                                        // <input> → {guardado, olho, mostrar} (os botões e o aviso "guardado" ao lado do campo)
function pintarSegredos(){
  const aviso = T('🔐 Guardado no cofre — abrir para ver ou mudar','🔐 Saved in the vault — open to see or change');
  const mascara = T('•••••••• (chave guardada)','•••••••• (key saved)');
  Object.keys(CAMPOS_TELA).forEach(c=>{
    const ehChave = CHAVES_DE_IA.includes(c);
    const trancado = !Seg.aberto() && Seg.tem(c);
    const escondida = ehChave && Seg.aberto() && Seg.tem(c) && !reveladas[c] && !veDigitado[c];
    CAMPOS_TELA[c].forEach(sel=>{
      const el = $(sel); if(!el) return;
      if(el.dataset.ph===undefined) el.dataset.ph = el.getAttribute('placeholder')||'';
      const ctl = CTRL.get(el) || {};
      // v1.25.0: chave mostrada (com o PIN) ou "ver o que digito" (cofre aberto) = campo de texto; senão, de senha
      if(ehChave) el.type = (Seg.aberto() && (reveladas[c] || veDigitado[c])) ? 'text' : 'password';
      if(ctl.olho){
        ctl.olho.hidden = !(Seg.aberto() && el.value);
        ctl.olho.textContent = veDigitado[c] ? '🙈' : '👁';
        const t = veDigitado[c] ? T('Esconder o que estou digitando','Hide what I am typing') : T('Ver o que estou digitando','See what I am typing');
        ctl.olho.title = t; ctl.olho.setAttribute('aria-label', t);
      }
      if(ctl.mostrar){
        ctl.mostrar.hidden = !Seg.tem(c);
        ctl.mostrar.textContent = reveladas[c] ? T('🙈 Esconder a chave','🙈 Hide the key') : T('👁 Mostrar a chave (pede o PIN)','👁 Show the key (asks for the PIN)');
      }
      if(Seg.emEspera()) return;                               // a pessoa está digitando: não mexe no valor
      if(trancado){ el.value = ''; el.placeholder = aviso; el.readOnly = true; el.dataset.cofre = '1'; }
      else if(document.activeElement===el || (ctl.olho && document.activeElement===ctl.olho) || Date.now()-(editando[c]||0) < 8000) return;   // digitando ou tocando no 👁 do campo (o foco muda no meio do toque): não esconde agora
      else if(escondida){ el.value = ''; el.placeholder = mascara; el.readOnly = false; delete el.dataset.cofre; }
      else { el.readOnly = false; delete el.dataset.cofre; el.placeholder = el.dataset.ph; el.value = Seg.agora(c); }
    });
  });
}
// v1.25.0: sinal de que guardou (toast + "✓ guardado" ao lado do campo)
let ultimoToastGuardado = 0;
function mostrarGuardado(c){
  const vazio = !Seg.agora(c);
  CAMPOS_TELA[c].forEach(sel=>{
    const el = $(sel), g = el && CTRL.get(el) && CTRL.get(el).guardado; if(!g) return;
    g.hidden = false; g.textContent = vazio ? T('✓ apagado do cofre','✓ removed from the vault') : T('✓ guardado','✓ saved');
    clearTimeout(g._t); g._t = setTimeout(()=>{ g.hidden = true; }, 3500);
  });
  if(Date.now()-ultimoToastGuardado > 4000){ ultimoToastGuardado = Date.now(); toast(vazio ? T('✓ Apagado do cofre','✓ Removed from the vault') : T('✓ Guardado no cofre','✓ Saved in the vault'), 2500); }
}
function salvarSegredo(c, valor){
  return Seg.gravar(c, valor).then(()=>{ pintarCofre(); mostrarGuardado(c); }, e=>{
    toast((e && e.message) || T('Não deu para guardar no cofre.','Could not save to the vault.'), 5000);
    pintarSegredos();
  });
}
Object.keys(CAMPOS_TELA).forEach(c=>{
  const els = CAMPOS_TELA[c].map(sel=>$(sel)).filter(Boolean);
  els.forEach(el=>{
    const ctl = {};
    // aviso pequeno "✓ guardado" ao lado do campo (aparece quando grava)
    ctl.guardado = document.createElement('small');
    ctl.guardado.setAttribute('data-dgo-ignorar',''); ctl.guardado.setAttribute('data-guardado', c); ctl.guardado.hidden = true; ctl.guardado.setAttribute('role','status');
    if(CHAVES_DE_IA.includes(c)){
      // chave de IA: sem autocompletar, sem maiúscula automática, sem corretor, sem copiar nem recortar; o valor nunca vai para log
      el.setAttribute('autocomplete','off'); el.setAttribute('autocapitalize','none'); el.setAttribute('spellcheck','false');
      el.setAttribute('data-lpignore','true'); el.setAttribute('data-1p-ignore','');
      ['copy','cut'].forEach(ev=>el.addEventListener(ev, e=>e.preventDefault()));
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'btn sm ghost'; b.dataset.mostrar = c; b.setAttribute('data-dgo-ignorar',''); b.hidden = true; b.style.marginTop = '8px';
      b.addEventListener('click', async ()=>{
        if(reveladas[c]){ clearTimeout(reveladas[c]); delete reveladas[c]; pintarSegredos(); return; }
        const ok = await Seg.reautenticar(T('Digite o PIN para ver a chave.','Type the PIN to see the key.')).catch(()=>false);
        if(!ok) return;
        reveladas[c] = setTimeout(()=>{ delete reveladas[c]; pintarSegredos(); }, 30000);
        pintarSegredos();
      });
      // 👁/🙈: ver o que está sendo digitado, sem PIN (o cofre já está aberto)
      const o = document.createElement('button');
      o.type = 'button'; o.className = 'btn sm ghost'; o.dataset.olho = c; o.setAttribute('data-dgo-ignorar',''); o.hidden = true; o.style.cssText = 'margin:8px 8px 0 0;min-width:44px';
      o.addEventListener('click', ()=>{ veDigitado[c] = !veDigitado[c]; pintarSegredos(); });
      ctl.mostrar = b; ctl.olho = o;
      el.insertAdjacentElement('afterend', b); el.insertAdjacentElement('afterend', o);
      // saiu do campo (e não foi para o 👁 dele): volta a esconder o que estava sendo digitado
      const aoSair = ()=>setTimeout(()=>{ const a = document.activeElement; if(a!==el && a!==o) veDigitado[c] = false; pintarSegredos(); }, 700);
      el.addEventListener('blur', aoSair); o.addEventListener('blur', aoSair);
    }
    (ctl.mostrar || el).insertAdjacentElement('afterend', ctl.guardado);   // depois dos botões: o aviso aparecendo não empurra o 👁 no meio do toque
    CTRL.set(el, ctl);
    el.addEventListener('input', ()=>{
      if(el.dataset.cofre) return;
      els.forEach(o=>{ if(o!==el) o.value = el.value; });      // as duas telas da mesma chave ficam iguais
      if(Seg.aberto()) Seg.agendar(c, el.value);               // cofre aberto: grava sozinho, sem janela
      editando[c] = Date.now(); setTimeout(pintarSegredos, 8100);   // passada a folga, o campo volta a esconder a chave
      pintarSegredos();                                        // mostra/esconde o 👁 conforme há texto
    });
    el.addEventListener('change', ()=>{                        // cofre fechado: o PIN é pedido aqui (cria ou abre) e a ação segue
      if(el.dataset.cofre) return;
      if(Seg.aberto()) Seg.descarregar(); else salvarSegredo(c, el.value);
    });
  });
});
// campo trancado: tocar nele pede o PIN
['click','focusin'].forEach(ev=>document.addEventListener(ev, e=>{
  const el = e.target && e.target.closest ? e.target.closest('input[data-cofre="1"]') : null;
  if(el) Seg.abrir().catch(()=>{});
}));

function pintarPainelCofre(){
  const el = $('#cofre-painel'); if(!el) return;
  const K = window.SolverCofre;
  let h;
  if(!K) h = `<div class="aviso">${T('O cofre de chaves não carregou. Atualize a página.','The key vault did not load. Reload the page.')}</div>`;
  else if(Seg.aberto()) h = `<div>🔓 ${T('Cofre aberto neste aparelho.','Vault open on this device.')}</div>
    <div style="height:8px"></div><button class="btn sm" id="btn-cofre-trancar">🔒 ${T('Trancar o cofre agora','Lock the vault now')}</button>`;
  else if(!K.existe() && Seg.pendentes()>0) h = `<div class="aviso">⚠️ ${T('Suas chaves e os nomes das crianças ainda estão sem proteção neste aparelho. Crie um PIN para trancar tudo no cofre.','Your keys and the children\'s names are still unprotected on this device. Create a PIN to lock everything in the vault.')}</div>
    <div style="height:8px"></div><button class="btn sm pri" id="btn-cofre-abrir">🔐 ${T('Criar o PIN agora','Create the PIN now')}</button>`;
  else if(K.existe()) h = `<div>🔐 ${T('Cofre trancado. As chaves e os nomes das crianças só aparecem com o PIN.','Vault locked. The keys and the children\'s names only show with the PIN.')}</div>
    <div style="height:8px"></div><button class="btn sm" id="btn-cofre-abrir">🔓 ${T('Abrir o cofre','Open the vault')}</button>`;
  else h = `<div>🔐 ${T('Ao colar uma chave ou escrever o nome das crianças, o app pede para criar um PIN e tranca tudo num cofre neste aparelho.','When you paste a key or write the children\'s names, the app asks you to create a PIN and locks everything in a vault on this device.')}</div>`;
  // v1.25.0: quando o PIN é pedido e quando não é (3 linhas; a caixa lembra se estava aberta)
  if(K){
    const estavaAberta = !!el.querySelector('details[open]');
    h += `<details class="saiba" data-dgo-ignorar${estavaAberta?' open':''}><summary>${T('Saiba mais · quando o PIN é pedido','Learn more · when the PIN is asked')}</summary>
      <div>${T('<b>Pede o PIN:</b> ao abrir ou recarregar o app; ao voltar depois de 5 minutos parado ou de sair do app; e ao tocar em “Mostrar a chave”.','<b>Asks for the PIN:</b> when you open or reload the app; when you come back after 5 idle minutes or after leaving the app; and when you tap “Show the key”.')}</div>
      <div>${T('<b>Não pede o PIN:</b> ao digitar ou colar chaves e nomes com o cofre aberto (aparece “✓ guardado” ao lado do campo).','<b>Does not ask for the PIN:</b> when you type or paste keys and names with the vault open (“✓ saved” shows next to the field).')}</div>
      <div>${T('<b>Tranca sozinho:</b> depois de 5 minutos sem mexer (espera se um trabalho estiver rodando) e depois de 1 minuto fora do app (espera só se um áudio estiver tocando).','<b>Locks by itself:</b> after 5 minutes without touching (waits if a job is running) and after 1 minute outside the app (waits only if audio is playing).')}</div>
    </details>`;
  }
  el.innerHTML = h;
  const t = $('#btn-cofre-trancar'); if(t) t.onclick = ()=>{ Seg.trancar().then(()=>toast(T('🔒 Cofre trancado','🔒 Vault locked'))); };
  const a = $('#btn-cofre-abrir'); if(a) a.onclick = ()=>{ Seg.abrir().catch(()=>{}); };
}
/* v1.25.0: indicador no cabeçalho — 🔓 cofre aberto / 🔒 trancado; tocar no 🔓 tranca na hora, tocar no 🔒 pede o PIN.
   Só aparece quando existe um cofre. */
function pintarIndicadorCofre(){
  const b = $('#btn-cofre'); if(!b) return;
  const K = window.SolverCofre;
  const existe = !!(K && K.existe());
  b.hidden = !existe;
  if(!existe) return;
  const aberto = Seg.aberto();
  b.textContent = aberto ? '🔓' : '🔒';
  const t = aberto ? T('Cofre aberto — toque para trancar agora','Vault open — tap to lock now') : T('Cofre trancado — toque para abrir com o PIN','Vault locked — tap to open with the PIN');
  b.title = t; b.setAttribute('aria-label', t);
}
const btnCofre = $('#btn-cofre');
if(btnCofre) btnCofre.addEventListener('click', ()=>{
  if(Seg.aberto()) Seg.trancar().then(()=>toast(T('🔒 Cofre trancado','🔒 Vault locked'), 2500));
  else Seg.abrir().catch(()=>{});
});
Seg.aoMudar((ev, c)=>{
  if(ev==='digitado'){ mostrarGuardado(c); return; }           // gravou o que a pessoa digitou (cofre aberto)
  pintarSegredos(); pintarPainelCofre(); pintarCofre(); atualizarSaudacao(); pintarIndicadorCofre();
});
document.addEventListener('dgo:idioma', ()=>{ pintarSegredos(); pintarPainelCofre(); pintarIndicadorCofre(); });
pintarSegredos(); pintarPainelCofre(); pintarIndicadorCofre();

/* ---------- trancar sozinho (v1.25.0) ----------
   Três relógios:
   • 5 minutos sem tocar, digitar ou rolar → tranca, MAS "ocupado" adia (fila de voz, tarefa do DGO, geração de história,
     áudio tocando). Ocupado segura SÓ este relógio.
   • App escondido por mais de 1 minuto → tranca de qualquer jeito, a não ser que um áudio esteja tocando neste exato momento.
   • Fechar ou recarregar a página (pagehide) → tranca, a não ser que um áudio esteja tocando.
   Ao voltar para o app a conferência roda ANTES de mostrar qualquer coisa (o navegador pode ter congelado os relógios).
   Quando algo adia o trancamento, o console diz o quê (só o nome da condição, nunca segredo). */
const audioTocando = ()=> document.body.classList.contains('com-leitor') && ($('#btn-play')||{}).textContent==='⏸';
Seg.ocupadoSe('fila-de-voz', ()=>FilaVoz.rodando());
Seg.ocupadoSe('tarefa', ()=>{ const t = window.DGO && DGO.tarefa && DGO.tarefa.ativas && DGO.tarefa.ativas(); return (t && t.length) ? 'tarefa:'+t.join('+') : false; });
Seg.ocupadoSe('gerando-historia', ()=>{ const b = $('#btn-gerar'); return !!(b && b.disabled && cfg.motorTexto!=='manual'); });
Seg.ocupadoSe('audio-tocando', ()=>audioTocando());
(function(){
  const LIMITE = 5*60*1000, FORA = 60*1000;
  let ultima = Date.now(), saiuEm = document.hidden ? Date.now() : 0, ultimoAviso = '';
  const marca = ()=>{ ultima = Date.now(); };
  ['pointerdown','keydown','touchstart','wheel'].forEach(ev=>document.addEventListener(ev, marca, {passive:true, capture:true}));
  function adiou(por){ const m = '[cofre] trancamento adiado: '+por.join(', '); if(m!==ultimoAviso){ ultimoAviso = m; console.info(m); } }
  function trancarPor(motivo){
    ultimoAviso = ''; console.info('[cofre] trancado: '+motivo);
    return Seg.trancar().then(()=>{ if(motivo==='ocioso' && !document.hidden) toast(T('🔒 Cofre trancado (sem uso)','🔒 Vault locked (idle)'), 3500); });
  }
  // devolve a promessa do trancamento (ou null se nada foi trancado)
  function conferir(origem){
    if(!Seg.aberto()) return null;
    const agora = Date.now();
    const foraDoApp = !!saiuEm && agora-saiuEm >= FORA;
    if(origem==='pagehide' || foraDoApp){
      if(audioTocando()){ adiou(['audio-tocando']); return null; }
      return trancarPor(origem==='pagehide' ? 'pagehide' : 'fora-do-app');
    }
    if(agora-ultima >= LIMITE){
      const por = Seg.ocupado();
      if(por.length){ adiou(por); return null; }
      return trancarPor('ocioso');
    }
    return null;
  }
  setInterval(()=>conferir('relogio'), 15000);
  document.addEventListener('visibilitychange', ()=>{
    if(document.hidden){ saiuEm = Date.now(); return; }
    const p = conferir('voltou');                                                  // voltou ao app: confere antes de mostrar qualquer coisa
    saiuEm = 0; marca();
    const pedir = ()=>{ if(Seg.precisaPerguntar()) Seg.abrir(T('Digite o PIN para abrir o Contador.','Type the PIN to open Storyteller.')).catch(()=>{}); };
    if(p) p.then(pedir); else pedir();
  });
  window.addEventListener('pagehide', ()=>conferir('pagehide'));
  window.addEventListener('pageshow', e=>{ if(e.persisted){ saiuEm = 0; marca(); pintarSegredos(); pintarPainelCofre(); pintarCofre(); atualizarSaudacao(); pintarIndicadorCofre(); } });
})();

/* ---------- abertura (v1.25.0): SEMPRE tranca antes de perguntar ----------
   O cofre.js deixa a aba reabrir o cofre sozinha depois de recarregar (a sessão fica na aba). O Contador NÃO aproveita isso:
   ao abrir ou recarregar, tranca de novo e pede o PIN. Antes de "pronto" a tela não mostra nome de criança nem chave.
   Cofre criado e trancado, ou chaves/nomes ainda em texto aberto: abre a janela do PIN (criar ou digitar);
   "Agora não" deixa o app abrir, mas sem nomes (texto neutro) até o PIN. */
(async function iniciarCofre(){
  const K = window.SolverCofre;
  if(K){
    try{ await K.pronto; }catch(e){}
    if(K.aberto()){ try{ await K.trancar(); }catch(e){} }                          // recarregar = pede o PIN
  }
  Seg.liberar();
  Guarda.apagarSaudacoes().catch(()=>{});                                          // cumprimentos antigos (tinham nomes na chave)
  if(Seg.precisaPerguntar()) Seg.abrir(T('Digite o PIN para abrir o Contador.','Type the PIN to open Storyteller.')).catch(()=>{});
})();

// Configurações → Voz guardada: total em MB e a lista por história, cada uma com a sua lixeira
function mostrarGuarda(){
  atualizarVozGuardada().then(async r=>{
    const q = r.total;
    let cota = '';
    try{
      if(navigator.storage && navigator.storage.estimate){
        const e = await navigator.storage.estimate();
        if(e && e.quota) cota = ` O navegador libera até cerca de ${fmtBytes(e.quota)} para este site.`;
      }
    }catch(e){}
    Guarda.protegida().then(p=>{
      const el = $('#txt-protecao'); if(!el) return;
      el.innerHTML = p===true ? T('🔒 Protegida: o navegador não apaga a voz sozinho. Atualizar o app também não apaga.','🔒 Protected: the browser will not delete the voice on its own. Updating the app does not delete it either.')
        : p===false ? T('⚠️ Se o aparelho ficar sem espaço, o navegador pode apagar a voz. Instalar o app na tela inicial ajuda; para garantir, guarde num arquivo.','⚠️ If the device runs out of space, the browser may delete the voice. Installing the app on the home screen helps; to be safe, save it to a file.')
        : T('Atualizar o app não apaga a voz. Para trocar de aparelho ou de endereço, guarde num arquivo.','Updating the app does not delete the voice. To change device or address, save it to a file.');
    });
    $('#txt-guarda').innerHTML = q.n
      ? `Voz guardada ocupando <b>${fmtBytes(q.bytes)}</b> neste aparelho (${q.n} trechos).${cota}`
      : 'Nenhuma voz guardada ainda. Assim que uma história for ouvida (ou baixada) com uma voz de internet, ela fica pronta para a próxima vez.';
    const linhas = [], orfaos = [];
    [...r.porHistoria.entries()].sort((a,b)=>b[1].bytes-a[1].bytes).forEach(([id,info])=>{
      const vozes = Object.keys(info.marcas).map(nomeMarca).join(', ');
      if(id==='__saudacao__'){
        linhas.push(`<div class="lg"><div class="t"><b>👋 Cumprimento</b><span>${esc(vozes)}</span></div><div class="mb">${fmtBytes(info.bytes)}</div></div>`);
        return;
      }
      const h = historias.find(x=>x.id===id);
      if(!h){ orfaos.push(id); return; }
      const inteira = vozesCompletas(h).length ? '✅ inteira' : '◐ em parte';
      linhas.push(`<div class="lg"><div class="t"><b>${esc(h.titulo)}</b><span>${inteira} · ${esc(vozes)}</span></div>
        <div class="mb">${fmtBytes(info.bytes)}</div>
        <button data-apagar-voz="${esc(id)}" aria-label="Apagar a voz guardada de ${esc(h.titulo)}" title="apagar a voz desta história">🗑️</button></div>`);
    });
    $('#lista-guarda').innerHTML = linhas.join('');
    $$('#lista-guarda [data-apagar-voz]').forEach(b=>b.addEventListener('click',()=>{
      const h = historias.find(x=>x.id===b.dataset.apagarVoz);
      if(!confirm('Apagar a voz guardada de "'+(h?h.titulo:'esta história')+'"?')) return;
      Guarda.limparHistoria(b.dataset.apagarVoz).then(()=>{
        if(h){ h.audioCompleto={}; h.audioPronto=false; h.audioParcial=0; salvarHistorias(); }
        toast('Voz apagada'); mostrarGuarda(); pintarAcervo(); pintarInicio();
      });
    }));
    const bo = $('#btn-limpar-orfaos');
    bo.style.display = orfaos.length ? '' : 'none';
    bo.onclick = async ()=>{
      for(const id of orfaos) await Guarda.limparHistoria(id);
      toast('Limpeza feita'); mostrarGuarda();
    };
  });
}
$('#btn-limpar-audio').addEventListener('click',()=>{
  if(!confirm('Apagar TODA a voz guardada? As histórias continuam aqui; só a voz vai precisar ser gerada de novo.')) return;
  Guarda.limpar().then(()=>{
    historias.forEach(h=>{ h.audioCompleto={}; h.audioPronto=false; h.audioParcial=0; });
    salvarHistorias(); toast('Voz guardada apagada'); mostrarGuarda(); pintarAcervo(); pintarInicio();
  });
});
chave('#tg-github','carregarGithub');
chave('#tg-tela','telaAcesa');
chave('#tg-destaque','destaque');

$('#btn-recarregar-vozes').addEventListener('click',()=>{
  carregarVozesNativas();
  setTimeout(carregarVozesNativas, 700);
  toast('Lista de vozes atualizada');
});
$('#btn-ajuda-vozes').addEventListener('click',()=>{
  modal(`<h3>Voz instalada e o site não vê</h3>
    <div style="font-size:13.5px;line-height:1.65;color:var(--dim)">
      <p>O site só consegue usar as vozes que o <b>navegador</b> entrega. No Android, o navegador só enxerga o <b>mecanismo padrão</b> escolhido nas Configurações — e guarda essa lista até ser fechado de vez.</p>
      <p><b>1.</b> Configurações → 🔍 “conversão de texto em voz” (na Samsung pode aparecer como <i>Configurações de Leitura de texto Samsung</i>; não é o TalkBack).</p>
      <p><b>2.</b> Em <b>Mecanismo preferido</b>, escolha o motor novo (SherpaTTS, Google, Samsung ou Acapela). Toque em <b>Reproduzir</b> e confira que a amostra sai com a voz nova.</p>
      <p><b>3.</b> <b>Feche o navegador de vez:</b> Configurações → Aplicativos → Chrome (ou Edge) → <b>Forçar parada</b>. Só recarregar a página não basta.</p>
      <p><b>4.</b> Abra o site de novo → Configurações → toque em <b>🔄 Recarregar vozes</b>.</p>
      <p><b>5.</b> Se a voz nova aparecer na lista, escolha-a. Se <b>não</b> aparecer, deixe em <b>🔧 Padrão do aparelho</b>: o site pede “português do Brasil” sem escolher voz, e o Android responde com o mecanismo padrão — que agora é o novo.</p>
      <p><b>6.</b> Toque em <b>▶️ Testar a voz</b>. Se ainda sair a voz antiga, reinicie o celular uma vez.</p>
      <p style="opacity:.8;margin-top:10px">As vozes “Naturais” do Edge de computador não existem no Android — a Microsoft não as libera para sites no celular. O caminho no Android é o mecanismo do sistema.</p>
    </div>
    <div style="height:14px"></div><button class="btn sm" id="av-f">Fechar</button>`);
  $('#av-f').onclick=fecharModal;
});

$('#btn-ouvir-cumprimento').addEventListener('click', async ()=>{
  const b=$('#btn-ouvir-cumprimento'), rotulo='🔈 Ouvir o cumprimento';
  b.disabled=true; b.innerHTML='<span class="load"></span> preparando a voz…';
  try{
    await Seg.abrir().catch(()=>{});     // os nomes das crianças estão no cofre; recusando o PIN, o cumprimento sai sem nomes
    const frase = fraseCumprimento();
    if(cfg.motorVoz==='nativo'){
      if('speechSynthesis' in window) speechSynthesis.cancel();
      await falarNativo(frase);
    }else{
      const ch = 'saudacao|'+Guarda.marca()+'|'+frase;
      let blob = await Guarda.pegar(ch);
      if(!blob){ blob = await gerarAudio(frase); Guarda.guardar(ch, blob); }
      const u = URL.createObjectURL(blob);
      const a = new Audio(u); await a.play();
      a.onended = ()=>URL.revokeObjectURL(u);
    }
  }catch(e){
    modal(`<h3>Não consegui falar 🙁</h3><p class="hint">${esc(e.message||e)}</p>
      <div style="height:14px"></div><button class="btn" id="oc-f">Fechar</button>`);
    $('#oc-f').onclick=fecharModal;
  }finally{ b.disabled=false; b.innerHTML=rotulo; }
});

$('#btn-testar-voz').addEventListener('click', async ()=>{
  const b=$('#btn-testar-voz'); b.disabled=true; b.innerHTML='<span class="load"></span> preparando…';
  const frase='Era uma vez, numa noite bem quietinha, duas meninas que adoravam ouvir histórias antes de dormir.';
  try{
    if(cfg.motorVoz==='nativo'){ if('speechSynthesis' in window) speechSynthesis.cancel(); await falarNativo(frase); }
    else { const url=await gerarAudio(frase); const a=new Audio(url); await a.play(); }
    toast('Era pra ter falado agora 🔊');
  }catch(e){ modal(`<h3>Falhou 🙁</h3><p class="hint">${esc(e.message||e)}</p>
    ${/failed to fetch|networkerror|load failed/i.test(e.message||'') ? '<div class="aviso" style="margin-top:12px">Esse erro vem de fora do site: alguma extensão do navegador (bloqueador, antivírus, VPN) está barrando a conexão com o Google. Tente numa janela anônima.</div>' : ''}
    <div style="height:14px"></div>
    <button class="btn" id="tv-fechar">Fechar</button>`); $('#tv-fechar').onclick=fecharModal; }
  finally{ b.disabled=false; b.innerHTML='▶️ Testar a voz'; }
});

$('#btn-modelos-gemini').addEventListener('click', async ()=>{
  const b=$('#btn-modelos-gemini'), rot='🔄 Ver os modelos que a minha chave aceita';
  let chave=''; try{ chave = await Seg.ler('geminiKey'); }catch(e){ toast(e.message, 5000); return; }
  if(!chave){ toast('Cole a chave do Gemini primeiro'); return; }
  b.disabled=true; b.innerHTML='<span class="load"></span> consultando o Google…';
  try{
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models',
                          {headers:{'x-goog-api-key':chave}});
    if(!r.ok) throw new Error('Google: '+r.status+' — '+(await r.text()).slice(0,160));
    const j = await r.json();
    const bons = (j.models||[])
      .filter(m=>(m.supportedGenerationMethods||[]).indexOf('generateContent')>=0)
      .map(m=>String(m.name||'').replace(/^models\//,''))
      .filter(n=>/^gemini/.test(n) && !/tts|embedding|image|vision|aqa/i.test(n))
      .sort();
    if(!bons.length) throw new Error('A lista veio vazia.');
    const sel = $('#sel-modelo-gemini');
    sel.innerHTML = bons.map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('');
    if(bons.indexOf(cfg.geminiModel)>=0) sel.value = cfg.geminiModel;
    else { cfg.geminiModel = bons.find(n=>/3\.\d-flash$/.test(n)) || bons[0]; sel.value = cfg.geminiModel; salvarCfg(); }
    toast(bons.length+' modelos disponíveis');
  }catch(e){
    modal(`<h3>Não consegui listar</h3><p class="hint">${esc(e.message||e)}</p>
      <div style="height:14px"></div><button class="btn" id="lm-f">Fechar</button>`);
    $('#lm-f').onclick=fecharModal;
  }finally{ b.disabled=false; b.innerHTML=rot; }
});

/* ---------- testar a chave ----------
   Um pedido barato ao provedor. "Falta permissão" (ElevenLabs com chave restrita, por exemplo)
   quer dizer que a chave é válida: só não pode listar. Serve para gerar, então é aceita. */
const TESTE_CHAVE = {
  gemini:     k=>fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1',{headers:{'x-goog-api-key':k}}),
  anthropic:  k=>fetch('https://api.anthropic.com/v1/models?limit=1',{headers:{'x-api-key':k,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'}}),
  openai:     k=>fetch('https://api.openai.com/v1/models',{headers:{'Authorization':'Bearer '+k}}),
  elevenlabs: k=>fetch('https://api.elevenlabs.io/v1/user',{headers:{'xi-api-key':k}})
};
function faltaPermissao(status, corpo){ return (status===401 || status===403) && /missing_permissions|permission/i.test(corpo||''); }
async function testarChave(id, btn){
  const campo = {gemini:'geminiKey',anthropic:'anthropicKey',openai:'openaiKey',elevenlabs:'elevenKey'}[id];
  let chave=''; try{ chave = await Seg.ler(campo); }catch(e){ toast(e.message, 5000); return; }
  if(!chave){ toast(T('Cole a chave primeiro','Paste the key first')); return; }
  const rot = btn.innerHTML; btn.disabled=true; btn.innerHTML='<span class="load"></span> '+T('testando…','testing…');
  try{
    const r = await TESTE_CHAVE[id](chave);
    const corpo = r.ok ? '' : (await r.text()).slice(0,300);
    if(r.ok) toast(T('✓ Chave válida','✓ Key is valid'));
    else if(faltaPermissao(r.status, corpo)) toast(T('✓ Chave válida — sem permissão para este teste, mas serve para gerar','✓ Key is valid — no permission for this test, but it works for generating'), 5000);
    else if(r.status===401 || r.status===403 || r.status===400) toast(T('Chave recusada — copie inteira ou crie outra','Key refused — copy it whole or create a new one'), 4000);
    else toast(T('O provedor respondeu ','The provider answered ')+r.status);
  }catch(e){ toast(T('Sem resposta (rede ou bloqueio do navegador). A chave ficou salva — tente usar.','No answer (network or browser block). The key is saved — try using it.'), 5000); }
  finally{ btn.disabled=false; btn.innerHTML=rot; }
}
[['gemini','#btn-testar-gemini'],['anthropic','#btn-testar-anthropic'],['openai','#btn-testar-openai'],['elevenlabs','#btn-testar-eleven']]
  .forEach(([id,sel])=>{ const b=$(sel); if(b) b.addEventListener('click',()=>testarChave(id,b)); });

$('#btn-carregar-vozes').addEventListener('click', async ()=>{
  const b=$('#btn-carregar-vozes'); b.disabled=true; b.innerHTML='<span class="load"></span> buscando…';
  try{
    const r = await fetch('https://api.elevenlabs.io/v1/voices',{headers:{'xi-api-key':await Seg.ler('elevenKey')}});
    if(!r.ok){
      const corpo = (await r.text()).slice(0,300);
      throw new Error(faltaPermissao(r.status, corpo)
        ? T('A chave é válida, mas não tem a permissão voices_read para listar as vozes. Crie a chave com essa permissão.','The key is valid but lacks the voices_read permission to list voices. Create the key with that permission.')
        : 'ElevenLabs: '+r.status);
    }
    const j = await r.json();
    const vs = j.voices||[];
    $('#sel-voz-eleven').innerHTML = vs.map(v=>`<option value="${esc(v.voice_id)}">${esc(v.name)}${v.labels&&v.labels.description?' — '+esc(v.labels.description):''}</option>`).join('');
    if(cfg.elevenVoice && vs.some(v=>v.voice_id===cfg.elevenVoice)) $('#sel-voz-eleven').value=cfg.elevenVoice;
    else if(vs[0]){ cfg.elevenVoice=vs[0].voice_id; salvarCfg(); }
    toast(vs.length+' vozes carregadas');
  }catch(e){ toast('Não consegui: '+(e.message||e)); }
  finally{ b.disabled=false; b.innerHTML='🔄 Carregar minhas vozes'; }
});

// grade de teste dos sons
$('#sons-teste').innerHTML = Object.entries(SONS).map(([k,v])=>
  `<button data-som="${k}"><span class="e">${v.e}</span>${v.n}</button>`).join('');
// Na tela de teste vale um som por vez: tocar outro (ou o mesmo) interrompe o anterior.
// Dentro das histórias nada muda — lá ambiente e voz seguem em paralelo, como sempre.
function limparTeste(){
  $$('#sons-teste button').forEach(x=>{ x.classList.remove('on'); if(x._t){ clearTimeout(x._t); x._t=null; } });
}
function pararSonsDeTeste(){
  if($('#leitor').classList.contains('on')) return;   // história tocando: não mexe
  Som.parar(true);
  limparTeste();
}
$$('#sons-teste button').forEach(b=>b.addEventListener('click',()=>{
  const som = b.dataset.som;
  const eraLigado = b.classList.contains('on');
  const ambiente = !!DURACAO_SOM[som];
  Som.ligar();
  Som.parar(true);          // qualquer toque corta o que estiver tocando
  limparTeste();
  if(eraLigado && ambiente) return;                   // segundo toque no mesmo: desliga
  if(som==='fim') return;                             // "silêncio" só para tudo
  setTimeout(()=>Som.tocar(som), 70);
  b.classList.add('on');
  const seg = ambiente ? (DURACAO_SOM[som]||10)*(MULT_DURACAO[cfg.durEfeitos]||1)+3 : 1.8;
  b._t = setTimeout(()=>{ b.classList.remove('on'); b._t=null; }, seg*1000);
}));

/* ----------------------------- cópia (backup) ----------------------------- */
/* ---------- cópia protegida (v1.19.0; diretriz "Cópia (backup) e restauração sem duplicar") ----------
   O conteúdo sai embaralhado (AES-GCM 256) com uma chave aleatória, guardada duas vezes: pela SENHA da cópia e por um
   CÓDIGO de recuperação mostrado uma vez só (PBKDF2-SHA256, 600 mil rodadas). Em claro, só o app, a versão e a data.
   As chaves de IA nunca entram. Restaurar JUNTA sem repetir: mesmo id ou mesmo título + texto = a mesma história, e a
   do aparelho vence; ajustes só preenchem o que está vazio aqui. Embaralhar e abrir vão pela pílula (tarefas.js). */
const Copia = (function(){
  const FORMATO = 'contador-copia-protegida', RODADAS = 600000, ALFA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const b64 = u8 => { let x = ''; for(let i=0; i<u8.length; i+=0x8000) x += String.fromCharCode.apply(null, u8.subarray(i, i+0x8000)); return btoa(x); };
  const deB64 = x => Uint8Array.from(atob(x), c=>c.charCodeAt(0));
  const aleatorio = n => crypto.getRandomValues(new Uint8Array(n));
  // 20 letras/números sem os que confundem (0/O, 1/I/L): ~99 bits; sorteio sem viés
  function codigoNovo(){
    let c = '';
    while(c.length < 20){ for(const b of aleatorio(32)){ if(b < 248 && c.length < 20) c += ALFA[b % 31]; } }
    return c.match(/.{5}/g).join('-');
  }
  const soCodigo = x => String(x||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  const segredo = k => /key$|token$/i.test(k) || k==='ghRepo' || k in SEGREDOS;   // chaves e nomes não passam pelo cfg: os nomes entram à parte, só dentro da parte embaralhada
  async function chaveDe(texto, sal, rodadas){
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(texto), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({name:'PBKDF2', hash:'SHA-256', salt:sal, iterations:rodadas}, base, {name:'AES-GCM', length:256}, false, ['encrypt','decrypt']);
  }
  async function fechar(bytes, texto){
    const sal = aleatorio(16), iv = aleatorio(12);
    const k = await chaveDe(texto, sal, RODADAS);
    return { sal:b64(sal), iv:b64(iv), chave:b64(new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM', iv}, k, bytes))) };
  }
  async function abrirEmbrulho(e, texto, rodadas){
    const k = await chaveDe(texto, deB64(e.sal), rodadas);
    return new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM', iv:deB64(e.iv)}, k, deB64(e.chave)));
  }
  async function criar(senha, andamento, nomes){
    const ajustes = {}; Object.keys(cfg).forEach(k=>{ if(!segredo(k)) ajustes[k] = cfg[k]; });
    Object.assign(ajustes, nomes || {});     // os nomes das crianças só vão aqui, dentro do conteúdo embaralhado
    const conteudo = new TextEncoder().encode(JSON.stringify({ app:'contador-de-historias', versao:VERSAO, em:new Date().toISOString(), historias, cfg:ajustes, stats }));
    const bruta = aleatorio(32), codigo = codigoNovo(), iv = aleatorio(12);
    const chave = await crypto.subtle.importKey('raw', bruta, 'AES-GCM', false, ['encrypt']);
    const dados = b64(new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM', iv}, chave, conteudo)));
    if(andamento) andamento(0.3, T('protegendo com a senha…','protecting with the password…'));
    const pelaSenha = await fechar(bruta, senha);
    if(andamento) andamento(0.65, T('protegendo com o código…','protecting with the code…'));
    const peloCodigo = await fechar(bruta, soCodigo(codigo));
    bruta.fill(0);
    const arquivo = JSON.stringify({ formato:FORMATO, v:1, app:'contador-de-historias', versao:VERSAO, criadaEm:new Date().toISOString(),
      kdf:{ nome:'PBKDF2-SHA256', rodadas:RODADAS }, senha:pelaSenha, codigo:peloCodigo, iv:b64(iv), dados });
    return { arquivo, codigo };
  }
  async function abrir(obj, texto){
    const rodadas = Number(obj.kdf && obj.kdf.rodadas) || RODADAS;
    let bruta = null;
    try{ bruta = await abrirEmbrulho(obj.senha, texto, rodadas); }
    catch(e){ try{ bruta = await abrirEmbrulho(obj.codigo, soCodigo(texto), rodadas); }catch(e2){ throw new Error('senha'); } }
    const chave = await crypto.subtle.importKey('raw', bruta, 'AES-GCM', false, ['decrypt']); bruta.fill(0);
    return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM', iv:deB64(obj.iv)}, chave, deB64(obj.dados))));
  }
  function baixar(arquivo){
    const nome = 'UM-Contador-copia-protegida-' + new Date().toISOString().slice(0,10) + '.json';
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([arquivo], {type:'application/json'})); a.download = nome;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href), 4000);
    return nome;
  }
  // 1) senha → 2) pílula enquanto embaralha → 3) o código para anotar → 4) baixar
  function fazer(depois){
    modal(`<h3>🔒 ${T('Guardar uma cópia protegida','Save a protected copy')}</h3>
      <p class="hint">${T('A cópia leva as suas histórias, onde você parou e os ajustes (as chaves de IA não vão: ficam no cofre). Os nomes das crianças vão, mas só dentro da parte embaralhada. Ela só abre com a senha que você escolher agora ou com um código que vou mostrar para você anotar.','The copy takes your stories, where you stopped and your settings (AI keys are left out: they stay in the vault). The children\'s names go, but only inside the scrambled part. It only opens with the password you choose now or with a code I will show you to write down.')}</p>
      <label class="f" for="cp-senha">${T('Senha da cópia (pelo menos 6 letras ou números; 8 ou mais é melhor)','Copy password (at least 6 letters or numbers; 8 or more is better)')}</label>
      <input type="password" id="cp-senha" autocomplete="new-password" placeholder="${T('Ex.: estrela-do-mar-27','E.g.: starfish-27')}">
      <label class="f" for="cp-senha2">${T('Repita a senha','Repeat the password')}</label>
      <input type="password" id="cp-senha2" autocomplete="new-password">
      <div class="aviso oculto" id="cp-erro" style="margin-top:10px"></div>
      <div style="height:12px"></div><button class="btn pri" id="cp-fazer">${T('Fazer a cópia','Make the copy')}</button>
      <div style="height:10px"></div><button class="btn sm ghost" id="cp-nao">${T('Cancelar','Cancel')}</button>`);
    $('#cp-nao').onclick = fecharModal;
    $('#cp-fazer').onclick = async ()=>{
      const a = $('#cp-senha').value, b = $('#cp-senha2').value, erro = $('#cp-erro');
      const mostrar = t=>{ erro.textContent = t; erro.classList.remove('oculto'); };
      if(a.length < 6) return mostrar(T('A senha precisa ter pelo menos 6 letras ou números.','The password needs at least 6 letters or numbers.'));
      if(a !== b) return mostrar(T('As duas senhas não são iguais. Digite de novo.','The two passwords are not the same. Type them again.'));
      fecharModal();
      // os nomes das crianças estão no cofre: trancado, pede o PIN antes de a pílula começar; sem o PIN, a cópia sai sem os nomes
      const nomes = {}; let semNomes = false;
      for(const c of ['publicoNomes','nomesProtegidos']){
        try{ const v = await Seg.ler(c); if(v) nomes[c] = v; }catch(e){ semNomes = true; break; }
      }
      if(semNomes) Object.keys(nomes).forEach(k=>delete nomes[k]);
      DGO.tarefa.iniciar({ id:'copia-fazer', titulo:T('Fazendo a cópia protegida','Making the protected copy'),
        executar: andamento => criar(a, andamento, nomes).then(r=>Object.assign(r, {semNomes})), aoAbrir: r => mostrarCodigo(r, depois) })
        .catch(()=>toast(T('Não deu para fazer a cópia agora. Tente de novo.','Could not make the copy now. Try again.'), 5000));
    };
  }
  function mostrarCodigo(r, depois){
    modal(`<h3>📝 ${T('Anote este código num papel','Write this code down on paper')}</h3>
      <p class="hint">${T('Se esquecer a senha, é com este código que a cópia abre. Ele aparece só agora: guarde o papel junto com os documentos da casa (não deixe salvo no celular).','If you forget the password, this code opens the copy. It shows up only now: keep the paper with the household documents (do not leave it saved on the phone).')}</p>
      <div class="cp-codigo" id="cp-codigo" style="font:700 1.15rem/1.6 ui-monospace,monospace;letter-spacing:.06em;text-align:center;padding:14px;border-radius:12px;border:1px dashed var(--borda,#555);margin:12px 0;word-break:break-all">${esc(r.codigo)}</div>
      ${r.semNomes ? `<div class="aviso" style="margin-bottom:10px">${T('Os nomes das crianças ficaram de fora desta cópia, porque o cofre continuou trancado. Eles seguem guardados no cofre deste aparelho.','The children\'s names were left out of this copy because the vault stayed locked. They remain saved in this device\'s vault.')}</div>` : ''}
      <button class="btn sm" id="cp-copiar">📋 ${T('Copiar o código','Copy the code')}</button>
      <label style="display:flex;gap:10px;align-items:center;margin:14px 0 6px"><input type="checkbox" id="cp-anotei" style="width:auto"> ${T('Anotei o código num papel','I wrote the code down on paper')}</label>
      <button class="btn pri" id="cp-baixar" disabled>⬇️ ${T('Baixar a cópia','Download the copy')}</button>`);
    $('#cp-copiar').onclick = ()=>{ try{ navigator.clipboard.writeText(r.codigo).then(()=>toast(T('Código copiado. Anote no papel também.','Code copied. Write it on paper too.'))); }catch(e){} };
    $('#cp-anotei').onchange = e=>{ $('#cp-baixar').disabled = !e.target.checked; };
    $('#cp-baixar').onclick = ()=>{
      const nome = baixar(r.arquivo); r.arquivo = null;
      fecharModal(); toast(T('Cópia guardada: ','Copy saved: ')+nome, 5000);
      if(typeof depois === 'function') setTimeout(depois, 400);
    };
  }
  // junta a cópia com o que já está aqui, sem repetir; o aparelho vence
  function aplicar(c){
    const lista = (c && Array.isArray(c.historias)) ? c.historias : [];
    const validas = lista.filter(h=>h && h.texto).length;
    const novas = mesclar(lista);
    let ajustes = 0;
    if(c && c.cfg) Object.keys(c.cfg).forEach(k=>{ if(!segredo(k) && (cfg[k]===undefined || cfg[k]==='') && c.cfg[k]!=='' && c.cfg[k]!==undefined){ cfg[k] = c.cfg[k]; ajustes++; } });
    if(c && c.stats){
      ['leituras','segundos','sequencia'].forEach(k=>{ stats[k] = Math.max(Number(stats[k])||0, Number(c.stats[k])||0); });
      if(String(c.stats.ultimaNoite||'') > String(stats.ultimaNoite||'')) stats.ultimaNoite = c.stats.ultimaNoite;
    }
    salvarHistorias(); salvarCfg(); salvarStats(); aplicarCfgNaTela(); pintarTudo(); atualizarVozGuardada(true);
    return { novas, jaEstavam: Math.max(0, validas - novas), ajustes };
  }
  // os nomes da cópia vão para o cofre (só onde ainda estão vazios); trancado e sem PIN, ficam de fora e a pessoa é avisada
  async function trazerNomes(c){
    const r = {preenchidos:0, trancado:false};
    const vindos = {};
    ['publicoNomes','nomesProtegidos'].forEach(k=>{ const v = c && c.cfg && c.cfg[k]; if(typeof v==='string' && v.trim()) vindos[k] = v.trim(); });
    for(const k of Object.keys(vindos)){
      try{
        if(await Seg.ler(k)) continue;           // o aparelho vence: só preenche o que está vazio
        await Seg.gravar(k, vindos[k]); r.preenchidos++;
      }catch(e){ r.trancado = true; break; }
    }
    return r;
  }
  function resumo(r){
    const nm = r.nomes || {};
    modal(`<h3>✅ ${T('Cópia trazida','Copy restored')}</h3>
      <p class="hint" style="font-size:15px">${r.novas} ${T('história(s) nova(s) entraram.','new story(ies) came in.')}<br>
      ${r.jaEstavam} ${T('já estavam aqui e não foram repetidas.','were already here and were not repeated.')}${r.ajustes ? '<br>'+r.ajustes+' '+T('ajuste(s) que estavam vazios foram preenchidos.','empty setting(s) were filled in.') : ''}${nm.preenchidos ? '<br>'+T('Os nomes das crianças foram para o cofre.','The children\'s names went into the vault.') : ''}${nm.trancado ? '<br>⚠️ '+T('Os nomes das crianças que vinham na cópia NÃO foram trazidos: o cofre continuou trancado. Traga a cópia de novo e digite o PIN.','The children\'s names in the copy were NOT restored: the vault stayed locked. Restore the copy again and type the PIN.') : ''}</p>
      <div style="height:12px"></div><button class="btn sm" id="cp-ok">${T('Entendi','Got it')}</button>`);
    $('#cp-ok').onclick = fecharModal;
  }
  function restaurar(obj){
    modal(`<h3>🔓 ${T('Trazer uma cópia protegida','Restore a protected copy')}</h3>
      <p class="hint">${T('Digite a senha desta cópia ou o código anotado no papel. Nada do que já está aqui se repete nem se perde.','Type this copy\'s password or the code written on paper. Nothing already here is repeated or lost.')}</p>
      <input type="password" id="cp-abrir" autocomplete="off" placeholder="${T('Senha ou código (ex.: ABCDE-…)','Password or code (e.g. ABCDE-…)')}" aria-label="${T('Senha ou código','Password or code')}">
      <div class="aviso oculto" id="cp-erro2" style="margin-top:10px"></div>
      <div style="height:12px"></div><button class="btn pri" id="cp-trazer">${T('Abrir e trazer','Open and restore')}</button>
      <div style="height:10px"></div><button class="btn sm ghost" id="cp-nao2">${T('Cancelar','Cancel')}</button>`);
    $('#cp-nao2').onclick = fecharModal;
    $('#cp-trazer').onclick = ()=>{
      const texto = $('#cp-abrir').value; if(!texto) return;
      fecharModal();
      // senha errada não é "erro" da tarefa: volta como resposta, para a pílula sumir e a janela mostrar o aviso
      DGO.tarefa.iniciar({ id:'copia-abrir', titulo:T('Abrindo a cópia protegida','Opening the protected copy'),
        executar: ()=>abrir(obj, texto).then(async c=>{ const ok = aplicar(c); ok.nomes = await trazerNomes(c); return { ok }; }, e=>({ erro: e && e.message==='senha' ? 'senha' : 'arquivo' })),
        aoAbrir: r=>{
          if(r.ok) return resumo(r.ok);
          restaurar(obj);
          const x = $('#cp-erro2');
          x.textContent = r.erro==='senha' ? T('A senha ou o código não confere. Confira as letras e tente de novo.','The password or code does not match. Check the letters and try again.')
                                           : T('Não deu para abrir este arquivo. Ele pode estar incompleto.','Could not open this file. It may be incomplete.');
          x.classList.remove('oculto');
        } });
    };
  }
  return { fazer, restaurar, aplicar, FORMATO, util:{ b64, deB64, aleatorio, codigoNovo, soCodigo } };
})();
$('#btn-exportar').addEventListener('click', ()=>Copia.fazer());
$('#btn-importar').addEventListener('click',()=>$('#file-importar').click());
$('#file-importar').addEventListener('change', e=>{
  const f=e.target.files[0]; if(!f) return;
  const fr=new FileReader();
  fr.onload=()=>{
    try{
      const j=JSON.parse(fr.result);
      if(j && j.formato===Copia.FORMATO){ Copia.restaurar(j); e.target.value=''; return; }
      // arquivo antigo, sem proteção (historias.json): continua aceito, juntando sem repetir
      const r = Copia.aplicar({ historias: Array.isArray(j)? j : (j.historias||[]) });
      toast(r.novas ? r.novas+T(' história(s) novas · ',' new story(ies) · ')+r.jaEstavam+T(' já estavam',' already here') : T('Nada novo: tudo já estava aqui','Nothing new: everything was already here'), 4500);
    }catch(err){ toast('Arquivo inválido 😕'); }
    e.target.value='';
  };
  fr.readAsText(f);
});
function mesclar(lista){
  let n=0;
  (lista||[]).forEach(h=>{
    if(!h || !h.texto) return;
    if(!h.id) h.id=uid();
    const j = historias.find(x=>x.id===h.id || (x.titulo===h.titulo && x.texto===h.texto));
    if(j){ j.leituras = Math.max(j.leituras||0, h.leituras||0); return; }
    historias.push({ id:h.id, titulo:h.titulo||'Sem título', texto:h.texto, idade:h.idade||'6-9',
      tema:h.tema||'', personagens:h.personagens||'', serie:h.serie||'', ordem:h.ordem||0,
      criadaEm:h.criadaEm||new Date().toISOString(),
      origem:h.origem||'manual', leituras:h.leituras||0, favorita:!!h.favorita,
      lida:!!h.lida, posFrase:h.posFrase||0, frasesTotal:h.frasesTotal||0, ouvidaEm:h.ouvidaEm||'' });
    n++;
  });
  if(n) historias.sort((a,b)=> (b.criadaEm||'').localeCompare(a.criadaEm||''));
  return n;
}

$('#btn-transferir').addEventListener('click', telaTransferencia);
// diretriz: antes de apagar qualquer dado do navegador, oferecer a cópia protegida
$('#btn-apagar-tudo').addEventListener('click', ()=>{
  modal(`<h3>🗑️ ${T('Apagar tudo deste aparelho','Erase everything on this device')}</h3>
    <p class="hint">${T('Apaga as histórias, os ajustes, os nomes das crianças e as contas de leitura deste aparelho. Não dá para desfazer. As chaves de IA ficam no cofre (valem também para os outros apps da SolverONE); para tirá-las, use o cofre.','Erases the stories, settings, the children\'s names and reading counts on this device. It cannot be undone. The AI keys stay in the vault (they also serve the other SolverONE apps); to remove them, use the vault.')}</p>
    <div class="aviso" style="margin-top:10px">${T('Antes, guarde uma cópia protegida: com ela você traz tudo de volta, aqui ou em outro aparelho.','First, save a protected copy: with it you bring everything back, here or on another device.')}</div>
    <div style="height:12px"></div><button class="btn pri" id="ap-copia">🔒 ${T('Guardar a cópia agora','Save the copy now')}</button>
    <div style="height:10px"></div><button class="btn sm ghost" id="ap-ja">${T('Já tenho uma cópia · continuar','I already have a copy · continue')}</button>
    <div style="height:6px"></div><button class="btn sm ghost" id="ap-nao">${T('Cancelar','Cancel')}</button>`);
  $('#ap-nao').onclick = fecharModal;
  $('#ap-copia').onclick = ()=>Copia.fazer(apagarPasso2);
  $('#ap-ja').onclick = apagarPasso2;
});
async function apagarPasso2(){
  let mb = 0; try{ mb = ((await Guarda.resumo()).total.bytes||0)/1048576; }catch(e){}
  modal(`<h3>🗑️ ${T('Última confirmação','Last confirmation')}</h3>
    <p class="hint">${T('Vai sair deste aparelho: todas as histórias, os ajustes e as contas de leitura.','This will leave this device: all stories, settings and reading counts.')}</p>
    <label style="display:flex;gap:10px;align-items:center;margin:12px 0"><input type="checkbox" id="ap-vozes" style="width:auto"> ${T('Apagar também as vozes guardadas','Also erase the saved voices')} (${mb.toFixed(1).replace('.', idiomaEN() ? '.' : ',')} MB)</label>
    <p class="hint">${T('A conta SolverONE continua conectada (para sair, use o cartão Conta SolverONE). As histórias guardadas na conta continuam lá.','The SolverONE account stays connected (to sign out, use the SolverONE account card). The stories kept in the account stay there.')}</p>
    <div style="height:12px"></div><button class="btn" id="ap-sim" style="color:var(--vermelho)">${T('Apagar tudo','Erase everything')}</button>
    <div style="height:10px"></div><button class="btn sm ghost" id="ap-nao2">${T('Cancelar','Cancel')}</button>`);
  $('#ap-nao2').onclick = fecharModal;
  $('#ap-sim').onclick = async ()=>{
    const vozes = $('#ap-vozes').checked;
    // os nomes das crianças moram no cofre: apagar tudo também os apaga (trancado, pede o PIN; sem ele, nada é apagado)
    if(Seg.tem('publicoNomes') || Seg.tem('nomesProtegidos')){
      try{ await Seg.gravar('publicoNomes',''); await Seg.gravar('nomesProtegidos',''); }
      catch(e){ toast(T('Não apaguei nada: abra o cofre (PIN) para apagar também os nomes das crianças.','I erased nothing: open the vault (PIN) to erase the children\'s names too.'), 6000); return; }
    }
    await Nuvem.desligarAqui();   // antes: senão a próxima ida e volta apagaria as histórias da conta também
    await Dados.apagar();
    if(vozes){ try{ await Guarda.limpar(); }catch(e){} }
    localStorage.removeItem(CHAVE_C); localStorage.removeItem(CHAVE_S);
    location.reload();
  };
}

/* ---------- levar a configuração para outro aparelho ---------- */
// Viaja só a voz e o modelo (v1.22.0): chaves e nomes das crianças NUNCA vão no endereço.
const CAMPOS_TRANSF = {
  mv:'motorVoz', mt:'motorTexto',
  gv:'geminiVoice', gmt:'geminiModelTts', gmx:'geminiModel',
  ev:'elevenVoice', em:'elevenModel',
  ov:'openaiVoice', om:'openaiModel',
  am:'anthropicModel'
};
// links ANTIGOS (até a 1.21.0) levavam as chaves no endereço. Não são mais gerados; se alguém abrir um, as chaves
// vão para o cofre (depois do PIN), nunca para o ch_config.
const CHAVES_DE_LINK_ANTIGO = { gk:'geminiKey', ek:'elevenKey', ok:'openaiKey', ak:'anthropicKey' };
function linkDeConfig(){
  const c = {};
  Object.keys(CAMPOS_TRANSF).forEach(k=>{ const v = cfg[CAMPOS_TRANSF[k]]; if(v) c[k]=v; });
  const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(c))));
  return location.origin + location.pathname + '#cfg=' + b64;
}
function aplicarConfigDaUrl(){
  const m = (location.hash||'').match(/^#cfg=(.+)$/);
  if(!m) return;
  // limpa a URL na hora, antes de qualquer coisa
  try{ history.replaceState(null,'',location.pathname+location.search); }catch(e){ location.hash=''; }
  let c;
  try{ c = JSON.parse(decodeURIComponent(escape(atob(m[1])))); }catch(e){ toast('Link de configuração inválido'); return; }
  if(!c || typeof c!=='object') return;
  const chavesNoLink = Object.keys(CHAVES_DE_LINK_ANTIGO).filter(k=>typeof c[k]==='string' && c[k]);
  const quantas = Object.keys(c).filter(k=>CAMPOS_TRANSF[k] || CHAVES_DE_LINK_ANTIGO[k]).length;
  if(!quantas) return;
  setTimeout(()=>{
    modal(`<h3>${T('Configurar este aparelho?','Set up this device?')}</h3>
      <p class="hint">${T('Você abriu um link que traz as configurações de voz e de IA de outro aparelho seu','You opened a link that brings the voice and AI settings of another device of yours')} (${quantas} ${T('itens','items')}${chavesNoLink.length ? T(', incluindo as chaves',', including the keys') : ''}).</p>
      ${chavesNoLink.length ? `<div class="aviso" style="margin-top:12px">${T('Este é um link do tipo antigo: ele traz chaves de IA no endereço, e esse tipo de link não é mais gerado (o endereço pode ficar salvo em conversas e no histórico). As chaves vão para o cofre deste aparelho — vai pedir o PIN. Depois, apague a mensagem que tinha o link e, se alguém mais pode ter visto, troque as chaves no site de cada provedor.','This is an old-style link: it carries AI keys in the address, and that kind of link is no longer generated (the address can stay saved in chats and history). The keys go to this device\'s vault — it will ask for the PIN. Afterwards, delete the message that had the link and, if anyone else may have seen it, replace the keys on each provider\'s site.')}</div>` : ''}
      <div class="aviso" style="margin-top:12px">${T('Só aceite se foi você mesmo que gerou esse link. Ele não mexe nas suas histórias.','Only accept if you generated this link yourself. It does not touch your stories.')}</div>
      <div style="height:14px"></div>
      <button class="btn ok" id="cfg-sim">✅ ${T('Configurar este aparelho','Set up this device')}</button>
      <div style="height:10px"></div>
      <button class="btn sm ghost" id="cfg-nao">${T('Agora não','Not now')}</button>`);
    $('#cfg-sim').onclick=async ()=>{
      Object.keys(CAMPOS_TRANSF).forEach(k=>{ if(c[k]) cfg[CAMPOS_TRANSF[k]] = c[k]; });
      salvarCfg(); aplicarCfgNaTela(); fecharModal();
      let falhou = false;
      for(const k of chavesNoLink){ try{ await Seg.gravar(CHAVES_DE_LINK_ANTIGO[k], c[k]); }catch(e){ falhou = true; break; } }
      toast(falhou ? T('Configurado, mas as chaves NÃO foram guardadas: o cofre continuou trancado. Abra o link de novo e digite o PIN.','Set up, but the keys were NOT saved: the vault stayed locked. Open the link again and type the PIN.')
                   : T('Pronto! Este aparelho já está configurado 💜','Done! This device is set up 💜'), falhou ? 6000 : 3500);
    };
    $('#cfg-nao').onclick=fecharModal;
  }, 400);
}
function telaTransferencia(){
  const link = linkDeConfig();
  modal(`<h3>${T('Levar a configuração para o celular','Take the settings to your phone')}</h3>
    <p class="hint">${T('As chaves de IA e os nomes das crianças ficam trancados no cofre de cada aparelho e <b>não viajam</b> neste link. Ele leva só a voz e os modelos escolhidos, para você não precisar escolher tudo de novo.','The AI keys and the children\'s names stay locked in each device\'s vault and <b>do not travel</b> in this link. It only carries the chosen voice and models, so you do not have to pick everything again.')}</p>
    <div class="info" style="margin-top:12px">${T('No outro aparelho, depois de abrir o link, cole as chaves uma vez em Configurações: o app pede um PIN para trancá-las no cofre dele.','On the other device, after opening the link, paste the keys once in Settings: the app asks for a PIN to lock them in its vault.')}</div>
    <div style="height:14px"></div>
    <button class="btn pri" id="tr-copiar">📋 Copiar o link</button>
    <div style="height:10px"></div>
    <div class="info">${T('No outro aparelho, é só abrir esse link uma vez: o site pergunta se pode configurar.','On the other device, just open this link once: the site asks whether it can set things up.')}</div>
    <div style="height:14px"></div>
    <button class="btn sm ghost" id="tr-fechar">Fechar</button>`);
  $('#tr-copiar').onclick=()=>{
    navigator.clipboard.writeText(link)
      .then(()=>toast('Link copiado — mande só para você'))
      .catch(()=>{
        modal(`<h3>Copie à mão</h3><p class="hint">Seu navegador não deixou copiar sozinho. Selecione tudo abaixo e copie:</p>
          <textarea readonly style="min-height:140px;font-size:12px">${esc(link)}</textarea>
          <div style="height:12px"></div><button class="btn sm" id="tr-f2">Fechar</button>`);
        $('#tr-f2').onclick=fecharModal;
      });
  };
  $('#tr-fechar').onclick=fecharModal;
}

/* ----------------------------- versão e avisos ----------------------------- */
const HISTORICO = [
  ['1.25.0','17/10/2026', [
    'Recarregar a página (F5) agora SEMPRE tranca o cofre e pede o PIN. Antes, em alguns casos o app reabria sozinho e mostrava os nomes das crianças sem PIN',
    'Sair do app (aba escondida por mais de 1 minuto, ou fechar/recarregar) tranca o cofre mesmo com trabalho rodando. A única exceção é uma voz ou história sendo ouvida naquele instante. Trabalho rodando só adia o relógio dos 5 minutos de sem uso',
    'Novo indicador no cabeçalho: 🔓 cofre aberto / 🔒 trancado. Tocar no 🔓 tranca na hora. Trancado, o cabeçalho e a saudação ficam neutros',
    '"Mostrar a chave" agora mostra de verdade (o campo vira texto por 30 segundos). Novo botão 👁 para ver o que você está digitando, sem pedir PIN',
    'Ao digitar uma chave ou os nomes com o cofre aberto aparece "✓ guardado" ao lado do campo e o aviso "✓ Guardado no cofre"',
    'Texto novo ao lado do cofre e em "Saiba mais": quando o PIN é pedido e quando não é'
  ]],
  ['1.24.0','17/10/2026', [
    'As chaves de voz (Gemini, OpenAI e ElevenLabs) não ficam mais copiadas em texto aberto: o Eleições 2026 agora usa o mesmo cofre, então a cópia temporária saiu na hora, como as outras chaves',
    'O cofre foi atualizado (versão 1.1.0): a janela do PIN já vem sem "Lembrar neste aparelho" e com o campo do PIN protegido (sem salvar, copiar ou recortar). Nada muda para você: o PIN continua sendo pedido ao abrir',
    'Por baixo: saíram os remendos que o app fazia por cima da janela do PIN'
  ]],
  ['1.23.0','17/10/2026', [
    'O app agora pede o PIN logo ao abrir (ou ao voltar para ele). Com o cofre trancado, nenhum nome de criança aparece: o cabeçalho e a saudação ficam neutros',
    'A opção "Lembrar neste aparelho" saiu: ela abria o cofre sem PIN. Quem tinha marcado, passa a digitar o PIN',
    'O cofre tranca sozinho depois de 5 minutos sem uso e quando você sai do app (menos enquanto uma voz ou uma história está sendo preparada)',
    'As chaves de IA aparecem só como "••••••••". Para ver uma chave, toque em "Mostrar": o app pede o PIN de novo e esconde de novo em 30 segundos',
    'A saudação falada ("Olá, <nomes>…") não fica mais guardada no aparelho; as que já estavam guardadas foram apagadas',
    'Proteção extra do app: só roda código do próprio site e só fala com os serviços que ele usa (Gemini, OpenAI, ElevenLabs, Claude e a conta SolverONE)'
  ]],
  ['1.22.0','16/10/2026', [
    'Cofre de chaves: as chaves de IA (Gemini, OpenAI, ElevenLabs, Claude) e os nomes das crianças saíram do texto aberto do navegador e ficam trancados num cofre com um PIN seu, o mesmo cofre dos outros apps da SolverONE',
    'Com o cofre trancado, o app pede o PIN na hora de usar uma chave ou os nomes e continua sozinho; em Configurações há "🔒 Trancar o cofre agora"',
    'O link "Levar minha configuração para outro aparelho" não leva mais chaves nem nomes: só a voz e o modelo. Links antigos que ainda tragam chaves guardam as chaves no cofre, depois do PIN',
    'A cópia protegida continua levando os nomes das crianças, só dentro da parte embaralhada; o arquivo de voz (sem senha) deixa o cumprimento com os nomes de fora',
    'Por baixo: módulo de diretrizes 1.10.0 e cofre.js'
  ]],
  ['1.21.0','10/10/2026', [
    'Obedece aos interruptores do RootifyONE → Controle dos apps (arquivo recursos.js): o dono da SolverONE pode desligar o AssistONE, as dicas do AssistONE, a faixa de anúncios e o "A IA escreve" (criar com IA); o que for desligado some do app. Sem internet, vale a última escolha recebida (ou tudo ligado)'
  ]],
  ['1.20.0','10/10/2026', [
    'Minhas histórias na conta: com a conta SolverONE, as suas histórias, onde parou, as favoritas e os ajustes vão para a conta e aparecem nos seus outros aparelhos',
    'Tudo sai embaralhado do aparelho (nem a equipe da SolverONE lê) e só abre num aparelho seu ou com o código de recuperação que você anota',
    'Sem internet continua funcionando: o que mudar fica guardado e sobe quando a internet voltar',
    'Se a mesma história mudar em dois aparelhos, o app junta o que dá e pergunta qual fica no que mudou dos dois lados',
    'Ainda em preparação: aparece ligada assim que a SolverONE liberar na sua conta'
  ]],
  ['1.19.0','10/10/2026', [
    'Cópia protegida: a cópia das histórias sai embaralhada, com uma senha sua e um código para anotar num papel',
    'Trazer uma cópia junta sem repetir: história que já está aqui não entra de novo, e nada se perde',
    'Apagar tudo agora oferece guardar a cópia antes e deixa escolher se as vozes guardadas saem junto',
    'As histórias passaram para um espaço maior do aparelho: com muitas histórias, o app não para mais de salvar'
  ]],
  ['1.18.1','09/10/2026', [
    'Leitura de foto (Usar a câmera) que não some: a tela fica acesa, uma pílula embaixo avisa "não feche o app" com progresso, dá para usar outras telas e, ao terminar, "✅ Pronto · toque para ver" reabre a leitura (diretriz SolverONE de tarefas longas, arquivo tarefas.js)'
  ]],
  ['1.18.0','09/10/2026', [
    'Conta SolverONE igual nos outros apps: entrou num, vale em todos neste aparelho (sem pedir login de novo)',
    'Sair da conta SolverONE desconecta só este aparelho; os outros continuam conectados',
    'Link de entrada que este aparelho não pediu agora pergunta antes: "Foi você?"',
    'Novo cartão Conta SolverONE nas Configurações, com Encerrar minha conta / pedir exclusão dos meus dados',
    'Saiu o envio das histórias para o GitHub (deixava as histórias da família públicas)'
  ]],
  ['1.17.1','09/10/2026', [
    'Câmera sem foto embaçada no "Usar a câmera": em celular com várias câmeras atrás, o app abre a lente principal (antes podia abrir a grande-angular, que não foca de perto), liga o foco automático e tocar na imagem foca naquele ponto'
  ]],
  ['1.17.0','02/10/2026', [
    'AssistONE com o personagem oficial (ajuda-botao.png): botão redondo, fundo escuro, anel dourado, balançando de leve — igual em todos os apps',
    'Topo novo, igual nos outros apps: ☰ menu, nome do app (tocar = Início), 🔍 busca, 📥 mensagens e 👤 perfil; saíram o ⚙️ e o PT|EN do topo',
    'Menu do 👤: quem está conectado (conta deste aparelho e conta SolverONE), Configurações, tema claro/escuro, efeitos sonoros, AssistONE e Sair',
    '📥 Mensagens: avisos do app e da SolverONE numa caixa só, com contador, marcar como lida e arquivar',
    '🔍 Busca do topo acha histórias, telas e funções',
    'A aba passa a se chamar Configurações (o nome padrão em todos os apps): idioma PT/EN, tema claro e "Reduzir animações" ganharam o primeiro bloco; os interruptores funcionam com o teclado',
    'Tema claro, para quem lê de dia'
  ]],
  ['1.16.2','27/09/2026', [
    'O app agora se chama UM Contador de Histórias',
    'A amostra da voz premium já vem com o app'
  ]],
  ['1.16.1','27/09/2026', [
    'A amostra da voz premium toca sozinha ao abrir o convite e para ao fechar',
    'A amostra pode ser MP3 ou WAV (o arquivo que o Google AI Studio entrega)'
  ]],
  ['1.16.0','27/09/2026', [
    'A voz premium e a IA de histórias da SolverONE aparecem sempre nas Configurações; quem ainda não tem acesso vê a opção em cinza com ⓘ',
    'Tocar nela abre o convite: o que é, a situação da sua conta e uma amostra da voz para ouvir'
  ]],
  ['1.15.0','27/09/2026', [
    'Voz premium da SolverONE: com a conta SolverONE e o plano certo, a voz de qualidade vem da plataforma, sem precisar de chave própria; o áudio continua guardado no aparelho',
    'IA de histórias da SolverONE: a plataforma escreve as histórias com uma IA mais robusta, também sem chave própria, dentro do saldo do seu plano',
    'Entrar, criar conta e trocar a senha da conta SolverONE direto nas Configurações (e-mail e senha ou Google)',
    'As Configurações mostram o plano e quanto do saldo do mês já foi usado'
  ]],
  ['1.14.0','26/09/2026', [
    'Fila de voz: escolha várias histórias e o app baixa a voz de uma por vez, tentando de novo sozinho quando a cota acaba (sem limite); a fila continua depois de fechar e abrir o app',
    'A voz guardada é achada pelo texto do trecho: ligar ou desligar o cumprimento, ou o Google trocar o modelo da mesma voz, não faz mais o app gerar tudo de novo',
    'O app pede ao navegador para não apagar a voz guardada quando faltar espaço, e mostra se ela está protegida',
    'Guardar a voz num arquivo e trazer de volta, para trocar de aparelho ou de endereço sem perder nada',
    '"Pôr na fila de voz" no menu ⋯ de cada história'
  ]],
  ['1.13.0','26/09/2026', [
    'Anúncios no topo em carrossel, iguais aos dos outros apps: andam para a esquerda sem parar, param ao tocar, e o × fecha a faixa até o próximo login',
    'A lista de anúncios vem do arquivo central (solverone-dados); sem internet, usa uma lista guardada no próprio app'
  ]],
  ['1.12.0','26/09/2026', [
    'Troca de IA sozinho: se a IA escolhida está sem cota, sem crédito ou com a chave recusada, o pedido vai para a próxima que tem chave, com aviso na tela',
    'Cofre de chaves: no topo da seção de IA, a lista mostra quem já tem chave (✓ chave salva / sem chave), com as que têm chave primeiro',
    'Botão "Testar a chave" em cada IA; resposta de "falta permissão" (como na ElevenLabs) conta como chave válida',
    'AssistONE: o ajudante do canto, com a ajuda da tela atual, tour rápido, busca e uma dica por tela (liga e desliga em Configurações)',
    'Visual mais limpo no celular: cantos mais suaves, aba ativa em pílula, janelas que sobem com movimento curto',
    'Menos texto nas Configurações: as explicações longas ficam recolhidas em "Saiba mais"'
  ]],
  ['1.11.1','24/09/2026', [
    'O botão Voltar do celular agora navega dentro do app: fecha a janela aberta, depois a história, depois volta ao Início — só sai do app a partir do Início',
    'Botão 🏠 Início no leitor; tocar no ícone ou no nome do app, no topo, também leva ao Início',
    'O seletor PT | EN foi para dentro do topo e não cobre mais o leitor nem as janelas',
    'Com voz de internet, a tela de bloqueio e a notificação do celular mostram o nome da história, com play, pausa e trecho anterior/próximo'
  ]],
  ['1.11.0','24/09/2026', [
    'Voz guardada por história: selo ⚡ voz guardada (ou ◐ em parte) vale para qualquer voz, mesmo com a voz do celular escolhida',
    'Com a voz do celular, a história que já tem voz de internet guardada toca com ela, sem gastar cota; trocar de voz não apaga nada',
    'As Configurações mostram quantos MB a voz guardada ocupa, história por história, com lixeira em cada uma, limpeza de sobras e botão para apagar tudo',
    'Proteção dos nomes das crianças: antes de ir para a IA, os nomes viram códigos e voltam ao normal no aparelho',
    'Comandos de voz (experimental, desligado de fábrica): 🎤 para tocar, pausar, voltar, pular, abrir história pelo nome e mais',
    'No computador, o acervo usa a tela toda em 2 ou 3 colunas; o texto da história continua na coluna de leitura',
    'Ícone novo, desenhado em alta resolução, em bege e âmbar'
  ]],
  ['1.10.0','18/09/2026', [
    'Voz do aparelho refeita: opção "Padrão do aparelho" que usa o mecanismo escolhido no Android (SherpaTTS, Acapela, Google, Samsung)',
    'Botão Recarregar vozes, diagnóstico do que o navegador enxerga e passo a passo para voz instalada que não aparece',
    'Reconhece vozes Piper/Sherpa/Coqui/Acapela como naturais e aceita idiomas escritos como pt_BR ou por-BRA'
  ]],
  ['1.9.1','18/09/2026', [
    'Quando o Google está lotado (erro 503), o site espera e tenta de novo sozinho, até 3 vezes, e depois usa um modelo reserva',
    'Gerando vários capítulos, um erro no meio não perde os que já saíram: "Tentar de novo" continua de onde parou',
    'Mensagens de erro explicando o que é passageiro e o que precisa de ação'
  ]],
  ['1.9.0','18/09/2026', [
    'Modelos do Gemini atualizados, com botão para listar os que a chave aceita',
    'Gerar de 1 a 6 capítulos de uma vez, cada um lendo o anterior',
    'Duração escolhida em minutos, por capítulo ou pela história inteira',
    'Escolha do tipo de desfecho',
    'Clima da história aceita mais de uma marcação ao mesmo tempo'
  ]],
  ['1.8.1','18/09/2026', [
    'Botão para ouvir o cumprimento nas Configurações, com a voz escolhida',
    'Opção de falar o cumprimento em voz alta antes de cada história'
  ]],
  ['1.8.0','18/09/2026', [
    '12 efeitos novos: explosão, tiro, galope, cachorro, gato, vaca, leão, cobra, coruja, galo, sapo e elefante',
    'Teste de sons: um som por vez, com destaque em todos os botões, e silêncio ao sair da tela',
    'Ajuste "Para quem são as histórias": nomes e composição de quem vai ouvir',
    'Saudação do topo adaptada (ou neutra, quando nada é informado)',
    'A IA passa a cumprimentar quem vai ouvir na abertura da história'
  ]],
  ['1.7.0','18/09/2026', [
    'Criação de histórias com mais entradas: onde acontece, clima e "parecida com…"',
    'Opção de pedir uma história nova no estilo de outra que já está no acervo',
    'Preparado para o módulo de diretrizes globais (idioma e datas)'
  ]],
  ['1.6.0','15/09/2026', [
    'Faixa 🔴🟡🟢 mostrando se o áudio da história já está baixado, antes de tocar',
    'Aviso ao dar play sem o áudio pronto, com opção de baixar ou trocar para a voz do celular',
    'Efeitos de ambiente com duração limitada e desaparecimento suave, ajustável em Configurações',
    'Número de versão, histórico de mudanças e aviso de uso e privacidade'
  ]],
  ['1.5.0','15/09/2026', [
    'Botão de baixar a voz da história inteira, com progresso e retomada',
    'Áudio guardado no aparelho: repetir ou voltar não gasta a cota de novo',
    'Seção "Continuar ouvindo" na tela Início',
    'Cenário nas laterais no computador (fundo-historia.jpg)'
  ]],
  ['1.4.0','14/09/2026', [
    'Marcador "já lida" e filtros por não lidas, lidas e favoritas',
    'Retomar de onde parou, guardado por frase',
    'Botões de capítulo anterior e próximo no leitor'
  ]],
  ['1.3.0','14/09/2026', [
    '36 histórias recuperadas de conversas antigas',
    'Séries em capítulos, com lista e continuação',
    'Geração do próximo capítulo lendo o capítulo anterior',
    'Levar a configuração para outro aparelho por link'
  ]],
  ['1.2.0','14/09/2026', [
    'Voz do Gemini (natural e gratuita na cota do Google)',
    'Capa na tela Início'
  ]],
  ['1.1.0','14/09/2026', [
    'Efeitos sonoros criados pelo próprio site',
    'Escolha de voz, velocidade e tamanho da letra'
  ]],
  ['1.0.0','14/09/2026', ['Primeira versão: acervo, contador, criação de histórias e leitura em voz alta']]
];
const VERSAO = HISTORICO[0][0];
const DATA_VERSAO = HISTORICO[0][1];

function telaNovidades(){
  modal(`<h3>Histórico de versões</h3>
    <p class="hint">Versão instalada neste aparelho: <b>${VERSAO}</b> (${DATA_VERSAO}).</p>
    <div style="height:14px"></div>
    ${HISTORICO.map((v,k)=>`
      <div style="margin-bottom:16px">
        <div style="font-weight:800;color:${k===0?'var(--gold)':'var(--dim)'};font-size:14px">
          ${v[0]} ${k===0?'· atual':''} <span style="font-weight:500;color:var(--dim2)">— ${v[1]}</span></div>
        <ul style="margin:6px 0 0;padding-left:18px;color:var(--dim);font-size:13.5px;line-height:1.6">
          ${v[2].map(x=>`<li>${esc(x)}</li>`).join('')}
        </ul>
      </div>`).join('')}
    <button class="btn sm" id="nv-f">Fechar</button>`);
  $('#nv-f').onclick=fecharModal;
}

function telaAviso(){
  modal(`<h3>Aviso de uso e privacidade</h3>
    <div style="font-size:13.5px;line-height:1.7;color:var(--dim)">

      <p><b style="color:var(--txt)">Natureza do projeto.</b> Este site constitui projeto pessoal e experimental,
      mantido por pessoa natural, destinado exclusivamente à narração de histórias no âmbito familiar e ao
      estudo e pesquisa sobre síntese de voz e geração de texto por inteligência artificial. Não se trata de
      produto, serviço ou oferta ao público, não possui finalidade econômica, não veicula publicidade e não
      se encontra disponível para uso comercial.</p>

      <p><b style="color:var(--txt)">Dados pessoais.</b> Não há cadastro, autenticação, formulário de contato
      ou qualquer coleta de dados pessoais. Não são empregadas ferramentas de análise de audiência,
      rastreamento, criação de perfis ou cookies de terceiros. As informações produzidas durante o uso —
      histórias, preferências, progresso de leitura e arquivos de áudio — permanecem gravadas unicamente no
      armazenamento local do navegador do próprio dispositivo, não sendo transmitidas a este site, a quem o
      mantém ou a terceiros. A exclusão pode ser feita a qualquer momento pela opção “Apagar tudo deste
      celular”, nesta mesma tela, ou pela limpeza dos dados do navegador.</p>

      <p>Por se tratar de tratamento realizado por pessoa natural para fins exclusivamente particulares e não
      econômicos, incide a hipótese de não aplicação prevista no <b>art. 4º, inciso I, da Lei nº 13.709/2018
      (Lei Geral de Proteção de Dados Pessoais)</b>.</p>

      <p><b style="color:var(--txt)">Crianças.</b> O conteúdo destina-se a ser ouvido por crianças,
      sempre por iniciativa e sob supervisão de adulto responsável. Nenhuma funcionalidade solicita dado de
      criança. Nomes eventualmente informados nas configurações, para personalizar cumprimentos, ficam apenas
      no dispositivo e, por padrão, são substituídos por códigos antes de qualquer envio a serviço de
      inteligência artificial, sendo restaurados localmente. Os serviços de voz pela internet, quando
      escolhidos, recebem o texto a ser lido, o que pode incluir nomes; a voz do próprio aparelho não envia
      texto algum. Recomenda-se não inserir sobrenome, escola, endereço, imagem ou qualquer outro elemento que
      identifique criança, nem publicar no repositório histórias que contenham nomes reais. Adotam-se como
      referência o melhor interesse da criança e o cuidado previsto no <b>art. 14 da Lei nº 13.709/2018</b>.</p>

      <p><b style="color:var(--txt)">Comandos de voz.</b> O recurso de comandos falados vem desligado. Quando
      ligado, o reconhecimento de fala do navegador pode enviar o áudio captado ao fornecedor do navegador
      para transcrição; o microfone só é aberto por toque no botão correspondente.</p>

      <p><b style="color:var(--txt)">Chaves de serviços de terceiros.</b> Eventuais chaves de acesso a
      interfaces de programação informadas nas configurações ficam gravadas apenas no armazenamento local do
      navegador em que foram inseridas. Não integram o código-fonte publicado, não são enviadas a este site e
      não são compartilhadas. A utilização desses serviços sujeita-se aos termos de cada fornecedor, cabendo a
      responsabilidade a quem realiza a configuração.</p>

      <p><b style="color:var(--txt)">Conteúdo e direitos de terceiros.</b> As narrativas reunidas destinam-se
      à leitura doméstica, em contexto familiar e sem qualquer exploração econômica, distribuição organizada
      ou uso promocional. Eventuais menções a personagens, obras, marcas ou títulos de terceiros possuem
      caráter meramente referencial e lúdico, não implicando vínculo, patrocínio ou endosso por parte dos
      respectivos titulares, a quem pertencem integralmente os direitos correspondentes. Solicitações de
      remoção apresentadas por titulares de direitos serão atendidas de imediato, pelos canais do repositório
      em que o material se encontra hospedado.</p>

      <p><b style="color:var(--txt)">Ausência de garantias.</b> O material é disponibilizado no estado em que
      se encontra, sem garantia de disponibilidade, exatidão, continuidade ou adequação a qualquer finalidade
      específica. O funcionamento depende de serviços de terceiros, sujeitos a alteração ou interrupção sem
      aviso prévio.</p>

      <p><b style="color:var(--txt)">Indexação.</b> Este endereço não se destina à divulgação pública e está
      sinalizado para não ser indexado por mecanismos de busca.</p>

      <p style="opacity:.75;font-size:12.5px;margin-top:16px">Texto de caráter informativo, que não substitui
      orientação jurídica específica. Última revisão: ${DATA_VERSAO}.</p>
    </div>
    <div style="height:14px"></div>
    <button class="btn sm" id="av-f">Fechar</button>`);
  $('#av-f').onclick=fecharModal;
}

/* ----------------------------- início ----------------------------- */
async function carregarDoGithub(){
  if(!cfg.carregarGithub) return;
  try{
    const r = await fetch('historias.json?t='+Date.now(), {cache:'no-store'});
    if(!r.ok) return;
    const j = await r.json();
    const lista = Array.isArray(j)? j : (j.historias||[]);
    const n = mesclar(lista);
    if(n){ salvarHistorias(); pintarTudo(); toast(n+' história(s) do repositório'); }
  }catch(e){}
}

function aplicarCfgNaTela(){
  $$('#sel-motor-voz button').forEach(b=>b.classList.toggle('on', b.dataset.motor===cfg.motorVoz));
  $$('#sel-motor-texto button').forEach(b=>b.classList.toggle('on', b.dataset.motor===cfg.motorTexto));
  $$('#sel-dur-som button').forEach(b=>b.classList.toggle('on', b.dataset.dur===cfg.durEfeitos));
  mostrarBlocosVoz(); mostrarBlocosTexto();
  $('#lbl-vel').textContent=Number(cfg.vel).toFixed(2);
  $('#lbl-tom').textContent=Number(cfg.tom).toFixed(2);
  $('#lbl-vol').textContent=cfg.volEfeitos;
  $('#lbl-estab').textContent=Number(cfg.elevenEstab).toFixed(2);
  $('#lbl-fonte').textContent=cfg.fonte;
  $('#in-gemini-instr').value=cfg.geminiInstr||'';
  $('#sel-publico-tipo').value=cfg.publicoTipo||'';
  atualizarSaudacao();
  pintarSegredos();
  pintarCofre();
  $('#hint-idade').textContent=PERFIS['6-9'].guia;
}

// se capa.jpg não estiver no repositório, o bloco simplesmente some
(function(){
  const img=$('#capa-img');
  img.addEventListener('error', ()=>$('#capa').classList.add('semimg'));
  if(img.complete && img.naturalWidth===0) $('#capa').classList.add('semimg');
})();

$('#txt-versao').textContent = VERSAO;
$('#txt-data-versao').textContent = DATA_VERSAO;
$('#btn-novidades').addEventListener('click', telaNovidades);
$('#btn-aviso').addEventListener('click', telaAviso);
// avisa quando o arquivo novo realmente chegou (ajuda quando o navegador guarda a versão velha)
try{
  const antes = localStorage.getItem('ch_versao');
  if(antes && antes!==VERSAO) setTimeout(()=>toast('Site atualizado para a versão '+VERSAO),1200);
  localStorage.setItem('ch_versao', VERSAO);
}catch(e){}

novosTemas(); novosPersonagens(); novosAmbientes(); novasInspiracoes(); pintarTons(); atualizarCriar();
/* ============================ comandos de voz (STS) ============================
   Fala → texto (reconhecimento do navegador) → comando fixo. Se nenhum comando fixo servir
   e a opção estiver ligada, pergunta à IA qual comando a frase quer dizer (mesma chave de
   texto; nomes protegidos pelo chamarIA). Tudo começa só com toque no 🎤 — o microfone
   nunca abre sozinho. No Chrome, o áudio vai ao Google para virar texto: por isso vem desligado.
   Para trocar o reconhecimento por outro (Whisper, Gemini Live…), basta mudar ouvirUmaVez(). */
const Comandos = (function(){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let ouvindo = false, rec = null;
  const suportado = ()=> !!SR;

  const tirarAcento = t => t.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();

  // lista fixa: [padrão, ação, descrição (aparece na ajuda)]
  const FIXOS = [
    [/\b(pausa|pausar|pare|parar|espera|silencio)\b/, 'pausar', '"pausar" / "parar"'],
    [/\b(proximo capitulo|capitulo seguinte)\b/, 'capProx', '"próximo capítulo"'],
    [/\b(capitulo anterior)\b/, 'capAnt', '"capítulo anterior"'],
    [/\b(do inicio|comecar de novo|desde o comeco|recomecar)\b/, 'inicio', '"do início"'],
    [/\b(volta|voltar|repete|repetir|de novo)\b/, 'voltar', '"voltar" / "repetir"'],
    [/\b(pula|pular|avanca|avancar|proximo trecho|adiante)\b/, 'avancar', '"avançar" / "pular"'],
    [/\b(mais rapido|acelera)\b/, 'rapido', '"mais rápido"'],
    [/\b(mais devagar|devagar|mais lento)\b/, 'devagar', '"mais devagar"'],
    [/\b(favorita|favoritar)\b/, 'favorita', '"favorita"'],
    [/\b(ja lida|ja li|marcar como lida)\b/, 'lida', '"já lida"'],
    [/\b(fechar|sair|fecha)\b/, 'fechar', '"fechar"'],
    [/\b(criar|inventar|nova historia)\b(?:\s+(?:uma\s+)?(?:historia\s+)?(?:sobre|de|com)\s+(.+))?/, 'criar', '"criar história sobre …"'],
    [/\b(historia da noite|sugestao|qualquer historia|uma historia)\b/, 'sugestao', '"história da noite"'],
    [/\b(acervo|todas as historias|lista)\b/, 'acervo', '"acervo"'],
    [/\b(?:ler|abrir|abre|conta|contar|toca|tocar)\s+(?:a\s+)?(?:historia\s+)?(?:do|da|de|dos|das|o|a)?\s*(.{3,})$/, 'abrirTitulo', '"ler <título>"'],
    [/\b(toca|tocar|play|continua|continuar|comeca|comecar|ler|le|pode ler|conta|contar)\b/, 'tocar', '"tocar" / "continuar"'],
  ];

  function acharHistoria(pedaco){
    const q = tirarAcento(pedaco).replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(w=>w.length>2);
    if(!q.length) return null;
    let melhor=null, nota=0;
    historias.forEach(h=>{
      const alvo = tirarAcento(h.titulo+' '+(h.serie||''));
      const n = q.filter(w=>alvo.includes(w)).length / q.length;
      if(n>nota){ nota=n; melhor=h; }
    });
    return nota>=0.5 ? melhor : null;
  }

  function interpretar(frase){
    const t = tirarAcento(frase).replace(/[.,!?]/g,'').trim();
    for(const [re, acao] of FIXOS){
      const m = t.match(re);
      if(!m) continue;
      if(acao==='abrirTitulo'){ const h = acharHistoria(m[1]||''); if(h) return {acao, h}; continue; }
      if(acao==='criar') return {acao, tema: (frase.match(/(?:sobre|de|com)\s+(.+)$/i)||[])[1] || ''};
      return {acao};
    }
    return null;
  }

  // Preparado para o futuro: a IA traduz uma frase livre num dos comandos da lista.
  async function interpretarComIA(frase){
    if(!cfg.comandosIA || cfg.motorTexto==='manual') return null;
    const acoes = ['tocar','pausar','voltar','avancar','capProx','capAnt','inicio','rapido','devagar','favorita','lida','fechar','sugestao','acervo','criar','abrirTitulo','nenhum'];
    const prompt = 'Você traduz pedidos falados por uma família num app de histórias infantis em UM comando.\n' +
      'Comandos possíveis: '+acoes.join(', ')+'.\n' +
      'Títulos disponíveis: '+historias.slice(0,80).map(h=>h.titulo).join(' | ')+'\n' +
      'Pedido: "'+frase+'"\n' +
      'Responda só com JSON, sem comentários: {"acao":"...","titulo":"(se abrirTitulo)","tema":"(se criar)"}';
    try{
      const r = await chamarIA(prompt, null, {semPlataforma:true});
      const j = JSON.parse(String(r).replace(/^[^{]*/,'').replace(/[^}]*$/,''));
      if(!j || !acoes.includes(j.acao) || j.acao==='nenhum') return null;
      if(j.acao==='abrirTitulo'){ const h = acharHistoria(j.titulo||''); return h ? {acao:j.acao, h} : null; }
      return {acao:j.acao, tema:j.tema||''};
    }catch(e){ return null; }
  }

  function executar(c){
    const L = Leitor, aberto = !!L.atual() && $('#leitor').classList.contains('on');
    switch(c.acao){
      case 'tocar':    if(aberto){ if(!L.estaTocando()) L.alternar(); } else if(L.atual()) L.abrir(L.atual()); else irTela('inicio'); break;
      case 'pausar':   if(aberto && L.estaTocando()) L.alternar(); break;
      case 'voltar':   if(aberto) L.passo(-1); break;
      case 'avancar':  if(aberto) L.passo(1); break;
      case 'capProx':  if(aberto) L.capitulo(1); break;
      case 'capAnt':   if(aberto) L.capitulo(-1); break;
      case 'inicio':   if(aberto) L.doInicio(); break;
      case 'rapido':   cfg.vel = Math.min(1.4, +(cfg.vel+0.1).toFixed(2)); salvarCfg(); toast('Velocidade '+cfg.vel); break;
      case 'devagar':  cfg.vel = Math.max(0.7, +(cfg.vel-0.1).toFixed(2)); salvarCfg(); toast('Velocidade '+cfg.vel); break;
      case 'favorita': if(aberto) $('#btn-fav').click(); break;
      case 'lida':     if(aberto) $('#chk-lida').click(); break;
      case 'fechar':   if(aberto) L.fechar(); break;
      case 'sugestao': if(aberto) L.fechar(); irTela('inicio'); { const b=$('#btn-ler-sug'); if(b) b.click(); } break;
      case 'acervo':   if(aberto) L.fechar(); irTela('acervo'); break;
      case 'criar':    if(aberto) L.fechar(); irTela('nova'); if(c.tema){ const i=$('#in-tema'); if(i) i.value=c.tema; } toast('Confira o tema e toque em Gerar'); break;
      case 'abrirTitulo': L.abrir(c.h); setTimeout(()=>L.alternar(), 300); break;
    }
  }

  function ouvirUmaVez(){
    return new Promise((res, rej)=>{
      rec = new SR();
      rec.lang = 'pt-BR'; rec.interimResults = false; rec.maxAlternatives = 3; rec.continuous = false;
      let achou = false;
      rec.onresult = e=>{ achou = true; res([...e.results[0]].map(a=>a.transcript)); };
      rec.onerror = e=>rej(new Error(e.error==='not-allowed' ? 'O microfone foi bloqueado. Libere nas permissões do site.'
                                   : e.error==='no-speech' ? 'Não ouvi nada. Tente de novo, mais perto do celular.'
                                   : e.error==='network' ? 'O reconhecimento de fala precisa de internet.' : 'Não entendi ('+e.error+').'));
      rec.onend = ()=>{ if(!achou) rej(new Error('Não ouvi nada.')); };
      rec.start();
    });
  }

  async function ouvir(){
    if(!suportado()){ toast('Este navegador não reconhece fala. No Android, use o Chrome.'); return; }
    if(ouvindo){ try{ rec && rec.stop(); }catch(e){} return; }
    // pausa a leitura para o microfone não ouvir a própria história
    const estavaTocando = Leitor.estaTocando && Leitor.estaTocando();
    if(estavaTocando) Leitor.alternar();
    ouvindo = true; $$('.btn-mic').forEach(b=>b.classList.add('ouvindo'));
    toast('🎤 Pode falar…');
    try{
      const alternativas = await ouvirUmaVez();
      let c = null;
      for(const a of alternativas){ c = interpretar(a); if(c) break; }
      if(!c) c = await interpretarComIA(alternativas[0]);
      if(!c){ toast('Ouvi: "'+alternativas[0]+'" — não sei fazer isso ainda'); if(estavaTocando) Leitor.alternar(); return; }
      toast('🎤 '+alternativas[0]);
      // se era para continuar tocando (ex.: "mais devagar"), volta a tocar
      const mexeNaLeitura = ['pausar','fechar','sugestao','acervo','criar','abrirTitulo','tocar','capProx','capAnt'].includes(c.acao);
      executar(c);
      if(estavaTocando && !mexeNaLeitura && !Leitor.estaTocando()) setTimeout(()=>Leitor.alternar(), 200);
    }catch(e){
      toast(e.message||'Não entendi'); if(estavaTocando) Leitor.alternar();
    }finally{
      ouvindo = false; $$('.btn-mic').forEach(b=>b.classList.remove('ouvindo'));
    }
  }

  function mostrarBotoes(){
    const ver = !!cfg.comandosVoz && suportado();
    $$('.btn-mic').forEach(b=>b.classList.toggle('oculto', !ver));
    const av = $('#txt-mic-suporte');
    if(av) av.textContent = suportado() ? 'Este navegador reconhece fala ✅' : 'Este navegador não reconhece fala ❌ (no Android, use o Chrome; no iPhone, o Safari)';
  }
  const ajuda = ()=> FIXOS.map(x=>x[2]).join(' · ');
  return { ouvir, mostrarBotoes, suportado, ajuda, interpretar };
})();
$$('.btn-mic').forEach(b=>b.addEventListener('click', Comandos.ouvir));
chave('#tg-comandos-voz','comandosVoz', Comandos.mostrarBotoes);
chave('#tg-comandos-ia','comandosIA');
$('#txt-mic-ajuda').textContent = Comandos.ajuda();
Comandos.mostrarBotoes();

/* ---------- SolverONE: voz premium e IA da plataforma, com a chave corporativa ----------
   A pessoa entra com a conta SolverONE (Supabase). O app pergunta ao banco que serviços pagos existem
   e se o plano dela dá acesso (servicos_plataforma_app). A voz e a história saem da função do servidor
   `solverone-ia`, que confere o plano de novo e usa a chave do dono (nunca vem para o aparelho).
   O áudio gerado fica guardado aqui, como qualquer outra voz: repetir não gasta o saldo do mês.
   Tudo o que muda (provedor, vozes, limites, quem usa) é configurado no RootifyONE. */
var Plataforma = (function(){   // var: outros trechos perguntam typeof Plataforma antes de ele existir
  // valores PÚBLICOS do projeto (os mesmos do SolverONE Lab); a proteção é o banco, não esconder isto
  const SB = 'https://qvdvkqydhnadhewcidia.supabase.co', CHAVE = 'sb_publishable_oRJmeUwlBbOP_HoOXf0xLw_4O8v43EA';
  const APP = 'contador-de-historias', CH_SERV = 'ch_solverone_servicos';
  /* UM LOGIN PARA TODOS (diretriz "Conta SolverONE"): a sessão fica na chave COMUM da plataforma, a mesma do
     OmniLifeONE e dos outros apps deste endereço, e é lida de novo antes de cada renovação (outro app ou outra aba
     pode ter renovado). A chave antiga do Contador (ch_solverone_sessao) é aproveitada e, enquanto existir, fica
     igual à comum: se cada um renovasse com o mesmo token, o servidor derrubaria os dois. */
  const K_SESSAO = 'solverone.sessao.v1', K_ANTIGA = 'ch_solverone_sessao';
  const K_PEDIDO = 'ch_conta_pedido', K_ACESSOS = 'ch_acessos_pendentes', K_ABERTO = 'ch_conta_acesso';
  const PRIV = 'privacidade@solverone.com.br';
  const PLANOS = {membro:['Membro','Member'], premium:['Premium','Premium'], familia:['Família','Family'], profissional:['Profissional','Professional']};
  const lerJSON = k => { try{ return JSON.parse(localStorage.getItem(k)||'null'); }catch(e){ return null; } };
  function lerSessao(){
    const s = lerJSON(K_SESSAO); if(s && s.refresh_token) return s;
    const a = lerJSON(K_ANTIGA);
    if(a && a.refresh_token && a.access_token){ try{ localStorage.setItem(K_SESSAO, JSON.stringify(a)); }catch(e){} return a; }
    return null;
  }
  let sessao = lerSessao(), servicos = [], ultimoErro = '';
  try{ servicos = JSON.parse(localStorage.getItem(CH_SERV)||'[]') || []; }catch(e){ servicos = []; }
  function gravarSessao(nova, antiga){
    try{
      if(nova) localStorage.setItem(K_SESSAO, JSON.stringify(nova)); else localStorage.removeItem(K_SESSAO);
      const a = lerJSON(K_ANTIGA);   // a antiga só acompanha se ainda era a mesma sessão
      if(a && (!nova || !antiga || a.refresh_token===antiga.refresh_token)){ if(nova) localStorage.setItem(K_ANTIGA, JSON.stringify(nova)); else localStorage.removeItem(K_ANTIGA); }
    }catch(e){}
    sessao = nova || null;
  }
  const voltarPara = ()=> location.origin + location.pathname;
  const nomePlano = p => p ? T((PLANOS[p]||[p,p])[0], (PLANOS[p]||[p,p])[1]) : '';
  const txt = v => v && typeof v==='object' ? (idiomaEN() ? (v.en||v.pt) : (v.pt||v.en)) || '' : (v||'');
  const servico = tipo => servicos.find(s=>s.tipo===tipo) || null;
  const fmtN = n => Number(n||0).toLocaleString(idiomaEN()?'en-US':'pt-BR');
  // data no padrão das diretrizes (14/Nov/2023 · Nov/14/2023), pelo módulo comum
  const dataCurta = ms => { const d = new Date(ms); try{ return (window.DGO && DGO.formatarData) ? DGO.formatarData(d) : d.toISOString().slice(0,10); }catch(e){ return d.toISOString().slice(0,10); } };

  // ---------- conta ----------
  async function auth(caminho, corpo, metodo, token){
    const cab = {apikey:CHAVE, 'Content-Type':'application/json'};
    if(token) cab.Authorization = 'Bearer '+token;
    const r = await fetch(SB+'/auth/v1/'+caminho, {method:metodo||'POST', headers:cab, body: corpo ? JSON.stringify(corpo) : undefined});
    let j = null; try{ j = await r.json(); }catch(e){}
    if(!r.ok){ const e = new Error((j && (j.msg || j.error_description || j.message || j.error)) || ('HTTP '+r.status)); e.status = r.status; e.codigo = j && (j.error_code || j.error); throw e; }
    return j;
  }
  function dadosToken(t){
    try{ const b = atob(String(t).split('.')[1].replace(/-/g,'+').replace(/_/g,'/')); return JSON.parse(new TextDecoder().decode(Uint8Array.from(b, c=>c.charCodeAt(0)))); }
    catch(e){ return {}; }
  }
  // formato comum da sessão: {access_token, refresh_token, expira, em, email, nome, desde}
  function guardarTokens(j){
    const antiga = lerSessao(), d = dadosToken(j.access_token);
    const meta = (j.user && j.user.user_metadata) || d.user_metadata || {};
    const email = (j.user && j.user.email) || d.email || '';
    const mesma = !!(antiga && antiga.email===email);
    gravarSessao({ access_token:j.access_token, refresh_token:j.refresh_token, expira: Date.now() + (Number(j.expires_in)||3600)*1000, em: Date.now(), email,
                   nome: meta.full_name || meta.name || (mesma && antiga.nome) || '',
                   desde: (mesma && antiga.desde) || Date.now() }, antiga);   // "conectado desde": a renovação do token não zera
  }
  /* token válido (renova perto de vencer; forcar = renova já, para o servidor conferir a conta). Uma renovação por vez.
     Sessão recusada: confere antes se outro app já renovou (aí vale a nova); senão sai da conta neste aparelho. */
  let renovando = null;
  async function token(forcar){
    const s = lerSessao(); sessao = s;
    if(!s) return null;
    if(!forcar && Date.now() < s.expira - 60000) return s.access_token;
    if(!renovando) renovando = auth('token?grant_type=refresh_token', {refresh_token:s.refresh_token})
      .then(j=>{ guardarTokens(j); return sessao && sessao.access_token; })
      .catch(e=>{
        if([400,401,403].includes(e.status)){
          const agora = lerSessao();
          if(agora && agora.refresh_token!==s.refresh_token){ sessao = agora; return agora.access_token; }
          if(/banned/i.test((e.codigo||'')+' '+(e.message||''))) setTimeout(()=>toast('⛔ '+T('Esta conta SolverONE está bloqueada.','This SolverONE account is blocked.'), 6000), 300);
          gravarSessao(null, s); mudou();
        }
        return null;
      })
      .finally(()=>{ renovando = null; });
    return renovando;
  }
  // tabelas e funções do banco (PostgREST). Erro sem "status" = sem internet ou sem conta: quem chama tenta depois
  async function rpc(nome, args){
    const t = await token(); if(!t) throw new Error(T('Entre na sua conta SolverONE.','Sign in to your SolverONE account.'));
    const r = await fetch(SB+'/rest/v1/rpc/'+nome, {method:'POST', headers:{apikey:CHAVE, Authorization:'Bearer '+t, 'Content-Type':'application/json'}, body:JSON.stringify(args||{})});
    const txt = await r.text(); let j = null; try{ j = txt ? JSON.parse(txt) : null; }catch(e){}
    if(!r.ok){ const e = new Error((j && (j.message||j.msg)) || ('HTTP '+r.status)); e.status = r.status; e.codigo = j && j.code; throw e; }
    return j;
  }
  // tabelas (PostgREST): o RLS do banco só deixa ler e gravar as linhas da própria pessoa
  async function rest(metodo, caminho, corpo, prefer){
    const t = await token(); if(!t){ const e = new Error(T('Entre na sua conta SolverONE.','Sign in to your SolverONE account.')); e.semConta = true; throw e; }
    const cab = {apikey:CHAVE, Authorization:'Bearer '+t, 'Content-Type':'application/json'};
    if(prefer) cab.Prefer = prefer;
    const r = await fetch(SB+'/rest/v1/'+caminho, {method:metodo, headers:cab, body: corpo===undefined ? undefined : JSON.stringify(corpo)});
    const txt = await r.text(); let j = null; try{ j = txt ? JSON.parse(txt) : null; }catch(e){}
    if(!r.ok){ const e = new Error((j && (j.message||j.msg)) || ('HTTP '+r.status)); e.status = r.status; e.codigo = j && j.code; throw e; }
    return j;
  }
  /* Edge Function da plataforma (registro de acessos com o IP visto pelo servidor). keepalive: a chamada termina mesmo
     se a página trocar ou fechar no meio. Navegador que recusa keepalive com pré-verificação (CORS) recusa NA HORA:
     só nesse caso vai de novo sem keepalive (e avisa por semKeepalive). */
  async function chamarAdmin(t, corpo, semKeepalive){
    const url = SB+'/functions/v1/solverone-admin';
    const op = {method:'POST', headers:{apikey:CHAVE, Authorization:'Bearer '+t, 'Content-Type':'application/json'}, body:JSON.stringify(corpo)};
    const t0 = Date.now();
    try{ return await fetch(url, Object.assign({keepalive:true}, op)); }
    catch(e){ if(Date.now()-t0 > 150) throw e; if(semKeepalive) semKeepalive(); return fetch(url, op); }
  }

  /* ---------- registro de acesso (C9) que não se perde e não duplica ----------
     Cada evento entra numa fila do aparelho ANTES de sair. Respondeu → sai da fila. Falhou com a página aberta →
     tenta de novo (ao abrir, ao voltar a internet, em 1 min; até 6 vezes em 2 dias). A página fechou no meio: com
     keepalive o navegador termina sozinho, então não manda de novo; sem keepalive, manda. */
  const PAGINA = Date.now().toString(36) + Math.random().toString(36).slice(2,7);
  let enviandoAcessos = false, saindo = false, tAcessos = 0, registrado = null, revalidando = false;
  const uid = ()=>{ const s = lerSessao(); return (s && dadosToken(s.access_token).sub) || ''; };
  const filaAcessos = ()=>{ const f = lerJSON(K_ACESSOS); return Array.isArray(f) ? f : []; };
  const guardarAcessos = f=>{ try{ f.length ? localStorage.setItem(K_ACESSOS, JSON.stringify(f.slice(-10))) : localStorage.removeItem(K_ACESSOS); }catch(e){} };
  const mudarAcesso = x=>{ const g = filaAcessos(), i = g.findIndex(y=>y.id===x.id); if(i>=0){ g[i] = x; guardarAcessos(g); } };
  function registrarAcesso(evento){
    const u = uid(); if(!u) return Promise.resolve();
    const f = filaAcessos(); f.push({ id: Date.now().toString(36)+Math.random().toString(36).slice(2,6), uid:u, evento, t:Date.now(), n:0, estado:'novo' });
    guardarAcessos(f); return retomarAcessos();
  }
  async function retomarAcessos(){
    if(enviandoAcessos) return; enviandoAcessos = true;
    const falhouAgora = new Set();
    try{
      for(;;){
        let f = filaAcessos();
        f = f.filter(x=>!(x.estado==='enviando' && x.pg!==PAGINA && x.ka) && x.n < 6 && Date.now()-x.t < 2*864e5);
        f.forEach(x=>{ if(x.estado==='enviando' && x.pg!==PAGINA) x.estado = 'falhou'; });
        guardarAcessos(f);
        const x = f.find(y=>(y.estado==='novo' || y.estado==='falhou') && y.uid===uid() && !falhouAgora.has(y.id));
        if(!x || !navigator.onLine) break;
        const t = await token(); if(!t) break;
        Object.assign(x, {estado:'enviando', pg:PAGINA, ka:true}); mudarAcesso(x);
        let r = null;
        try{ r = await chamarAdmin(t, {acao:'registrar-acesso', evento:x.evento, app:APP}, ()=>{ x.ka = false; mudarAcesso(x); }); }catch(e){}
        // a página está saindo: o keepalive entrega o pedido; marcar como falha aqui faria reenviar e duplicar
        if(saindo) return;
        if(r && (r.ok || (r.status>=400 && r.status<500 && ![401,408,429].includes(r.status)))) guardarAcessos(filaAcessos().filter(y=>y.id!==x.id));
        else { Object.assign(x, {estado:'falhou', n:x.n+1}); mudarAcesso(x); falhouAgora.add(x.id); }
      }
    }finally{ enviandoAcessos = false; }
    if(falhouAgora.size){ clearTimeout(tAcessos); tAcessos = setTimeout(retomarAcessos, 60000); }
  }
  /* ao abrir e quando a internet volta: o servidor confere a sessão (conta bloqueada falha na renovação) e se a
     conta foi encerrada. Sessão que o servidor acabou de dar (menos de 30 s) já foi conferida: não renova de novo. */
  async function revalidar(){
    if(!lerSessao() || !navigator.onLine || revalidando) return;
    revalidando = true;
    try{
      const s = lerSessao(), recente = s && s.em && Date.now()-s.em < 30000;
      const t = await token(!recente); if(!t) return;
      if((await rpc('minha_conta_encerrada')) === true) encerrada();
    }catch(e){} finally{ revalidando = false; }
  }
  /* ao entrar e ao abrir já conectado: conta encerrada? uso (C4) e acesso (C9) — uma vez por abertura e por conta.
     Recarregar a aba não conta de novo; entrar conta sempre. */
  async function aoAbrir(evento){
    const u = uid(); if(!u) return;
    if(registrado===u && evento!=='login') return;
    registrado = u;
    let aberto = ''; try{ aberto = sessionStorage.getItem(K_ABERTO)||''; }catch(e){}
    if(evento!=='login' && aberto===u) return;
    try{ sessionStorage.setItem(K_ABERTO, u); }catch(e){}
    registrarAcesso(evento);   // entra na fila já: não depende das outras chamadas nem de a página continuar aberta
    await revalidar(); if(!lerSessao()) return;
    rpc('sol_registrar_uso', {p_app:APP}).catch(()=>{});
  }
  // a conta mudou (entrou, saiu, sessão vencida): topo, menus e serviços se atualizam
  function mudou(){ document.dispatchEvent(new CustomEvent('ch:conta')); atualizar(); }
  // marca que ESTE aparelho pediu a volta (Google, confirmação de e-mail, nova senha): só essa entra sem perguntar
  const marcarPedido = ()=>{ try{ localStorage.setItem(K_PEDIDO, String(Date.now())); }catch(e){} };
  function explicarAuth(e){
    const m = String(e && (e.codigo||'')+' '+(e.message||''));
    if(/invalid_credentials|invalid login/i.test(m)) return T('E-mail ou senha incorretos.','Wrong e-mail or password.');
    if(/email_not_confirmed|not confirmed/i.test(m)) return T('Confirme o e-mail primeiro (veja a caixa de entrada).','Confirm your e-mail first (check your inbox).');
    if(/already registered|user_already_exists/i.test(m)) return T('Este e-mail já tem conta. É só entrar.','This e-mail already has an account. Just sign in.');
    if(/weak_password|password should/i.test(m)) return T('Senha fraca: use pelo menos 8 caracteres.','Weak password: use at least 8 characters.');
    if(/failed to fetch|networkerror|load failed/i.test(m)) return T('Sem internet agora.','No internet right now.');
    return T('Não deu certo: ','That did not work: ')+(e && e.message || '');
  }
  function janelaEntrar(){
    modal(`<h3>✨ ${T('Conta SolverONE','SolverONE account')}</h3>
      <p class="hint">${T('A mesma conta vale em todos os apps da SolverONE. A voz premium e a IA de histórias dependem do seu plano.','The same account works in every SolverONE app. The premium voice and story AI depend on your plan.')}</p>
      <div class="sv-login" style="margin-top:12px">
        <input type="text" id="sv-email" inputmode="email" autocomplete="username" placeholder="${T('E-mail','E-mail')}" aria-label="E-mail">
        <input type="password" id="sv-senha" autocomplete="current-password" placeholder="${T('Senha','Password')}" aria-label="${T('Senha','Password')}">
      </div>
      <div class="aviso oculto" id="sv-erro"></div>
      <div class="ok oculto" id="sv-ok"></div>
      <div style="height:10px"></div>
      <button class="btn pri" id="sv-entrar">${T('Entrar','Sign in')}</button>
      <div style="height:10px"></div>
      <button class="btn" id="sv-google">${T('Entrar com Google','Sign in with Google')}</button>
      <div class="linha" style="margin-top:10px">
        <button class="btn sm ghost" id="sv-criar">${T('Criar conta','Create account')}</button>
        <button class="btn sm ghost" id="sv-esqueci">${T('Esqueci a senha','Forgot password')}</button>
      </div>`);
    const erro = t=>{ const e=$('#sv-erro'); e.textContent=t; e.classList.toggle('oculto', !t); $('#sv-ok').classList.add('oculto'); };
    const ok = t=>{ const e=$('#sv-ok'); e.textContent=t; e.classList.remove('oculto'); $('#sv-erro').classList.add('oculto'); };
    const dados = ()=>({ email:$('#sv-email').value.trim().toLowerCase(), senha:$('#sv-senha').value });
    const ocupar = async (b, fn)=>{ const r=b.innerHTML; b.disabled=true; b.innerHTML='<span class="load"></span>'; try{ await fn(); }catch(e){ erro(explicarAuth(e)); } finally{ if(document.body.contains(b)){ b.disabled=false; b.innerHTML=r; } } };
    $('#sv-entrar').onclick = ()=>ocupar($('#sv-entrar'), async ()=>{
      const d = dados(); if(!d.email || !d.senha) return erro(T('Preencha e-mail e senha.','Fill in e-mail and password.'));
      guardarTokens(await auth('token?grant_type=password', {email:d.email, password:d.senha}));
      fecharModal(); toast(T('✨ Conta SolverONE conectada','✨ SolverONE account connected')); aoAbrir('login'); mudou();
    });
    $('#sv-google').onclick = ()=>{ marcarPedido(); location.href = SB+'/auth/v1/authorize?provider=google&redirect_to='+encodeURIComponent(voltarPara()); };
    $('#sv-criar').onclick = ()=>ocupar($('#sv-criar'), async ()=>{
      const d = dados(); if(!d.email || d.senha.length < 8) return erro(T('Para criar a conta: e-mail e uma senha de pelo menos 8 caracteres.','To create the account: e-mail and a password of at least 8 characters.'));
      marcarPedido();
      const j = await auth('signup?redirect_to='+encodeURIComponent(voltarPara()), {email:d.email, password:d.senha});
      if(j && j.access_token){ guardarTokens(j); fecharModal(); toast(T('✨ Conta criada','✨ Account created')); aoAbrir('login'); mudou(); }
      else ok(T('Enviamos um e-mail de confirmação para ','We sent a confirmation e-mail to ')+d.email+T('. Abra o link nele neste mesmo aparelho.','. Open its link on this same device.'));
    });
    $('#sv-esqueci').onclick = ()=>ocupar($('#sv-esqueci'), async ()=>{
      const d = dados(); if(!d.email) return erro(T('Escreva o seu e-mail.','Write your e-mail.'));
      marcarPedido();
      await auth('recover?redirect_to='+encodeURIComponent(voltarPara()), {email:d.email});
      ok(T('Se houver conta com este e-mail, chegou um link para criar uma senha nova.','If there is an account with this e-mail, a link to set a new password has arrived.'));
    });
  }
  // só desconecta a conta NESTE aparelho (scope=local): os outros aparelhos e apps continuam conectados
  async function sair(quieto){
    const s = lerSessao();
    if(s){
      const t = await token();
      if(t){
        try{ await chamarAdmin(t, {acao:'registrar-acesso', evento:'logout', app:APP}); }catch(e){}
        auth('logout?scope=local', null, 'POST', t).catch(()=>{});
      }
    }
    gravarSessao(null, s);
    try{ localStorage.removeItem(K_ANTIGA); sessionStorage.removeItem(K_ABERTO); }catch(e){}
    registrado = null;
    if(!quieto) toast(T('Conta SolverONE desconectada neste aparelho','SolverONE account disconnected on this device'));
    mudou();
  }
  /* LGPD, como no Lab e no OmniLifeONE: encerra a conta na hora e abre o pedido de exclusão dos dados pessoais.
     As histórias e as vozes guardadas só neste aparelho continuam aqui até a pessoa apagar. */
  function encerrar(){
    if(!lerSessao()) return;
    modal(`<h3>${T('Encerrar minha conta SolverONE','Close my SolverONE account')}</h3>
      <p class="hint">${T('Você perde o acesso na hora, em todos os apps da SolverONE, e pede a exclusão dos seus dados pessoais.','You lose access right away, in every SolverONE app, and ask for your personal data to be erased.')}</p>
      <label class="f" for="sv-motivo">${T('Quer contar o motivo? (opcional)','Would you like to tell us why? (optional)')}</label>
      <textarea id="sv-motivo" maxlength="500" style="min-height:70px"></textarea>
      <div class="aviso" style="margin-top:12px">${T('As histórias e as vozes guardadas neste aparelho continuam aqui. Para apagar: Configurações → Zona de perigo → Apagar tudo deste celular.','The stories and saved voices on this device stay here. To erase them: Settings → Danger zone → Erase everything on this phone.')}</div>
      <div style="height:12px"></div>
      <button class="btn" id="sv-enc-1" style="color:var(--vermelho)">${T('Continuar','Continue')}</button>
      <div style="height:10px"></div><button class="btn sm ghost" id="sv-enc-nao">${T('Cancelar','Cancel')}</button>`);
    $('#sv-enc-nao').onclick = fecharModal;
    $('#sv-enc-1').onclick = ()=>{
      const motivo = ($('#sv-motivo').value||'').trim();
      modal(`<h3>${T('Última confirmação','Last confirmation')}</h3>
        <p class="hint">${T('Seus dados pessoais serão anonimizados em até 15 dias e isso não dá para desfazer.','Your personal data will be anonymised within 15 days and this cannot be undone.')}</p>
        <div class="aviso oculto" id="sv-enc-erro" style="margin-top:10px"></div>
        <div style="height:12px"></div>
        <button class="btn" id="sv-enc-2" style="color:var(--vermelho)">${T('Encerrar minha conta','Close my account')}</button>
        <div style="height:10px"></div><button class="btn sm ghost" id="sv-enc-nao2">${T('Cancelar','Cancel')}</button>`);
      $('#sv-enc-nao2').onclick = fecharModal;
      $('#sv-enc-2').onclick = async ()=>{
        const b = $('#sv-enc-2'); b.disabled = true;
        try{ await rpc('minha_solicitacao_exclusao', {p_motivo: motivo || null}); encerrada(); }
        catch(e){ b.disabled = false; const x = $('#sv-enc-erro'); x.innerHTML = esc(T('Não deu para registrar o pedido: ','Could not register the request: ')+(e.message||''))+'<br>'+T('Escreva para ','Write to ')+`<a href="mailto:${PRIV}">${PRIV}</a>.`; x.classList.remove('oculto'); }
      };
    };
  }
  function encerrada(){
    modal(`<h3>${T('Sua conta SolverONE foi encerrada','Your SolverONE account has been closed')}</h3>
      <p class="hint">${T('Ela não foi excluída: fica encerrada para auditoria e obrigações legais, e os seus dados pessoais são anonimizados quando você pede a exclusão.','It was not deleted: it stays closed for audit and legal duties, and your personal data is anonymised when you request erasure.')}</p>
      <p class="hint">${T('As histórias e as vozes deste aparelho continuam aqui.','The stories and voices on this device stay here.')} ${T('Dúvidas ou reativação: ','Questions or reactivation: ')}<a href="mailto:${PRIV}">${PRIV}</a>.</p>
      <div style="height:12px"></div><button class="btn sm" id="sv-enc-ok">${T('Entendi','Got it')}</button>`);
    $('#sv-enc-ok').onclick = fecharModal;
    sair(true);
  }
  // volta do Google, da confirmação de e-mail ou do "esqueci a senha": os tokens chegam no endereço (#access_token=…)
  function lerRetorno(){
    const h = location.hash || '';
    if(!/access_token=|error_description=/.test(h)) return;
    const p = new URLSearchParams(h.slice(1));
    try{ history.replaceState(history.state, '', location.pathname + location.search); }catch(e){}   // mantém o marcador do Voltar
    if(p.get('error_description')){ setTimeout(()=>toast(T('Não deu para entrar: ','Could not sign in: ')+p.get('error_description'), 5000), 800); return; }
    const tok = { access_token:p.get('access_token'), refresh_token:p.get('refresh_token'), expires_in:p.get('expires_in') }, tipo = p.get('type') || 'login';
    const pedido = Number(localStorage.getItem(K_PEDIDO)||0); try{ localStorage.removeItem(K_PEDIDO); }catch(e){}
    if(pedido && Date.now()-pedido < 2*864e5){ entrarComRetorno(tok, tipo); return 'login'; }
    // link que este aparelho não pediu (pode ser alguém tentando conectar a conta DELE aqui): pergunta antes
    setTimeout(()=>{
      const email = dadosToken(tok.access_token).email || '?';
      modal(`<h3>✨ ${T('Conectar uma conta?','Connect an account?')}</h3>
        <p class="hint">${T('Este link quer conectar a conta SolverONE','This link wants to connect the SolverONE account')} <b>${esc(email)}</b> ${T('neste aparelho (vale para todos os apps da SolverONE). Foi você que pediu?','on this device (it applies to every SolverONE app). Did you request it?')}</p>
        <div style="height:12px"></div><button class="btn pri" id="sv-ret-sim">${T('Sim, sou eu','Yes, it\'s me')}</button>
        <div style="height:10px"></div><button class="btn sm ghost" id="sv-ret-nao">${T('Não fui eu','It wasn\'t me')}</button>`);
      $('#sv-ret-sim').onclick = ()=>{ fecharModal(); entrarComRetorno(tok, tipo); aoAbrir('login'); };
      $('#sv-ret-nao').onclick = ()=>{ fecharModal(); toast(T('Tudo bem: nenhuma conta foi conectada.','OK: no account was connected.'), 3500); };
    }, 700);
    return 'confirmar';
  }
  function entrarComRetorno(tok, tipo){
    guardarTokens(tok); mudou();
    if(tipo==='recovery') setTimeout(janelaNovaSenha, 900);
    else setTimeout(()=>toast(T('✨ Conta SolverONE conectada','✨ SolverONE account connected')), 900);
  }
  function janelaNovaSenha(){
    modal(`<h3>${T('Nova senha','New password')}</h3>
      <input type="password" id="sv-nova" autocomplete="new-password" placeholder="${T('Pelo menos 8 caracteres','At least 8 characters')}" aria-label="${T('Nova senha','New password')}">
      <div class="aviso oculto" id="sv-erro" style="margin-top:10px"></div>
      <div style="height:12px"></div><button class="btn pri" id="sv-salvar-senha">${T('Salvar a senha','Save password')}</button>`);
    $('#sv-salvar-senha').onclick = async ()=>{
      const v = $('#sv-nova').value;
      const erro = t=>{ const e=$('#sv-erro'); e.textContent=t; e.classList.remove('oculto'); };
      if(v.length < 8) return erro(T('Use pelo menos 8 caracteres.','Use at least 8 characters.'));
      try{ await auth('user', {password:v}, 'PUT', await token()); fecharModal(); toast(T('Senha trocada ✓','Password changed ✓')); }
      catch(e){ erro(explicarAuth(e)); }
    };
  }

  // ---------- que serviços existem e se posso usar ----------
  async function atualizar(){
    try{
      const t = await token();
      const cab = {apikey:CHAVE, 'Content-Type':'application/json'};
      if(t) cab.Authorization = 'Bearer '+t;
      const r = await fetch(SB+'/rest/v1/rpc/servicos_plataforma_app', {method:'POST', headers:cab, body:JSON.stringify({p_app:APP})});
      if(r.status===401 && t){ const v = await token(true); if(!v) return; return atualizar(); }   // renova uma vez; recusou = já saiu
      // sem o SQL rodado (404) ou sem internet: nada aparece, o app segue como antes
      servicos = r.ok ? ((await r.json()) || []) : [];
      ultimoErro = '';
      try{ localStorage.setItem(CH_SERV, JSON.stringify(servicos)); }catch(e){}
      document.dispatchEvent(new CustomEvent('ch:conta'));
      const v = servico('voz');
      if(v){
        const ids = (v.vozes||[]).map(x=>x.id);
        let mudou = false;
        if(ids.length && !ids.includes(cfg.solveroneVoz)){ cfg.solveroneVoz = ids[0]; mudou = true; }
        if(v.modelo && cfg.solveroneModeloVoz!==v.modelo){ cfg.solveroneModeloVoz = v.modelo; mudou = true; }
        if(mudou) salvarCfg();
      }
    }catch(e){ ultimoErro = T('Sem conexão com a SolverONE agora.','No connection to SolverONE right now.'); }
    pintar();
  }
  function disponivel(tipo){ const s = servico(tipo); return !!(s && s.disponivel && sessao); }
  // Sempre aparece como convite (mesmo antes de ligar: "em breve"). Só some se o RootifyONE marcar "escondido"
  // e a pessoa, já conectada, não tiver acesso.
  function aparece(s){ return !s || s.disponivel || s.motivo==='entrar' || s.visivel_sem_acesso!=='oculto'; }
  const podeUsar = tipo => disponivel(tipo);

  // ---------- telas ----------
  function statusHTML(s){
    if(!s) return T('A SolverONE ainda não oferece este serviço aqui.','SolverONE does not offer this service here yet.');
    const conta = sessao ? `${T('Conectado como','Signed in as')} <b>${esc(sessao.email||'')}</b>${s.plano ? ' · '+T('plano','plan')+' <b>'+esc(nomePlano(s.plano))+'</b>' : ''}` : '';
    const unid = s.unidade==='historias' ? T(' histórias',' stories') : T(' caracteres',' characters');
    const minutos = s.unidade==='caracteres' ? ` (≈ ${Math.max(1, Math.round((s.limite||0)/900))} ${T('min de história','min of story')})` : '';
    let corpo;
    if(!sessao || s.motivo==='entrar') corpo = `${T('Voz e histórias com a qualidade da SolverONE, sem precisar de chave. Entre com a sua conta para usar.','SolverONE-quality voice and stories, no key needed. Sign in with your account to use them.')}<div style="height:10px"></div><button class="btn sm pri" data-sv="entrar">${T('Entrar com a conta SolverONE','Sign in with a SolverONE account')}</button>`;
    else if(s.motivo==='aguardando') corpo = `${conta}<br>${T('A sua conta ainda não está liberada.','Your account is not approved yet.')}`;
    else if(s.motivo==='plano') corpo = `${conta}<br>${esc(txt(s.mensagem) || T('Disponível nos planos pagos da SolverONE.','Available on SolverONE paid plans.'))}`;
    else if(s.motivo==='limite') corpo = `${conta}<br>${T('Você usou todo o saldo deste mês','You used all of this month\'s allowance')} (${fmtN(s.usado)} ${T('de','of')} ${fmtN(s.limite)}${unid}). ${T('Renova no dia 1.','It renews on the 1st.')}`;
    else if(Number(s.limite)===-1) corpo = `${conta}<br>${T('Sem limite no seu plano','No limit on your plan')} · ${T('usado este mês','used this month')}: ${fmtN(s.usado)}${unid}`;
    else corpo = `${conta}<br>${T('Usado este mês','Used this month')}: <b>${fmtN(s.usado)}</b> ${T('de','of')} ${fmtN(s.limite)}${unid}${minutos}
      <div class="sv-uso"><i style="width:${Math.min(100, (s.usado||0)/(s.limite||1)*100)}%"></i></div>`;
    const rodape = '';   // sair e encerrar ficam no cartão "Conta SolverONE" das Configurações
    return (ultimoErro ? `<div class="hint" style="color:var(--vermelho)">${esc(ultimoErro)}</div>` : '') + corpo + rodape;
  }
  function pintar(){
    const v = servico('voz'), x = servico('texto');
    [['#sel-motor-voz','voz',v,cfg.motorVoz],['#sel-motor-texto','texto',x,cfg.motorTexto]].forEach(([sel,tipo,s,atual])=>{
      $$(sel+' [data-motor="solverone"]').forEach(b=>{
        const livre = podeUsar(tipo);
        b.classList.toggle('oculto', !aparece(s) && atual!=='solverone');
        b.classList.toggle('sv-bloq', !livre);               // em cinza com ⓘ: tocar abre o convite em vez de trocar
        // o texto do botão é escrito aqui (PT/EN): o tradutor do módulo comum não mexe nele (lista ignorar do config)
        b.innerHTML = '✨ SolverONE' + (livre ? '' : '<span class="sv-i" aria-hidden="true">i</span>')
          + '<br><span style="font-weight:500;font-size:11px">' + T('premium, sem chave','premium, no key') + '</span>';
        b.setAttribute('aria-label', livre ? (tipo==='voz' ? T('Voz premium SolverONE','SolverONE premium voice') : T('IA de histórias SolverONE','SolverONE story AI'))
                                           : (tipo==='voz' ? T('Voz premium SolverONE — saiba mais','SolverONE premium voice — learn more') : T('IA de histórias SolverONE — saiba mais','SolverONE story AI — learn more')));
      });
    });
    const sv = $('#sv-voz-status'); if(sv) sv.innerHTML = statusHTML(v);
    const st = $('#sv-txt-status'); if(st) st.innerHTML = statusHTML(x);
    const sel = $('#sel-voz-solverone'), vozes = (v && v.vozes) || [];
    if(sel){
      sel.innerHTML = vozes.map(o=>`<option value="${esc(o.id)}">${esc(txt(o.nome) || o.id)}</option>`).join('');
      sel.value = cfg.solveroneVoz || '';
      $('#sv-voz-escolha').classList.toggle('oculto', !(vozes.length > 1 && v && v.disponivel));
    }
    const cc = $('#sv-conta');
    if(cc) cc.innerHTML = sessao
      ? `<p class="hint" style="margin:0">${T('Conectado como','Signed in as')} <b>${esc(sessao.email||'')}</b>${sessao.desde ? ' · '+T('desde','since')+' '+esc(dataCurta(sessao.desde)) : ''}</p>
         <p class="hint">${T('Vale em todos os apps da SolverONE neste aparelho (OmniLifeONE, MoneyTRIO…).','Works in every SolverONE app on this device (OmniLifeONE, MoneyTRIO…).')}</p>
         <div class="linha"><button class="btn sm" data-sv="sair">${T('Sair da conta neste aparelho','Sign out on this device')}</button></div>
         <div style="height:10px"></div><button class="linkzinho" style="margin:0" data-sv="encerrar">${T('Encerrar minha conta / pedir exclusão dos meus dados','Close my account / ask to erase my data')}</button>`
      : `<p class="hint" style="margin:0">${T('A mesma conta de todos os apps da SolverONE. Dá a voz premium e a IA da plataforma, conforme o seu plano. Sem conta, tudo continua só neste aparelho.','The same account for every SolverONE app. It gives the premium voice and the platform AI, depending on your plan. Without an account, everything stays on this device only.')}</p>
         <div style="height:10px"></div><button class="btn sm pri" data-sv="entrar">${T('Entrar ou criar conta','Sign in or create account')}</button>`;
    $$('[data-sv="entrar"]').forEach(b=>b.onclick = janelaEntrar);
    $$('[data-sv="sair"]').forEach(b=>b.onclick = ()=>sair());
    $$('[data-sv="encerrar"]').forEach(b=>b.onclick = encerrar);
    if(typeof pintarCofre==='function') pintarCofre();
  }
  /* ---------- convite: o que é, como está para mim, amostra ----------
     A amostra é um arquivo que vem com o app (amostra-voz-premium.mp3; em inglês, amostra-voz-premium-en.mp3),
     gravado com a MESMA voz configurada no RootifyONE. Sem o arquivo, o botão de ouvir não aparece. */
  // aceita MP3 ou WAV (o Google AI Studio entrega WAV; não precisa converter)
  const AMOSTRA = { pt:['amostra-voz-premium.mp3','amostra-voz-premium.wav'], en:['amostra-voz-premium-en.mp3','amostra-voz-premium-en.wav'] };
  const FRASE_AMOSTRA = {
    pt:'Era uma vez, lá no alto de uma colina onde o vento sabia assobiar, uma estrelinha que tinha medo do escuro… Toda noite ela se escondia atrás da lua e sussurrava: — Será que alguém vai me encontrar? E sabe quem encontrou? … Você. Agora fecha os olhinhos… que a história vai começar.',
    en:'Once upon a time, high on a hill where the wind knew how to whistle, there lived a little star who was afraid of the dark… Every night she hid behind the moon and whispered: "Will anyone ever find me?" And do you know who found her? … You. Now close your eyes… the story is about to begin.'
  };
  const existeArquivo = new Map();
  async function acharAmostra(){
    for(const nome of idiomaEN() ? AMOSTRA.en.concat(AMOSTRA.pt) : AMOSTRA.pt){
      if(!existeArquivo.has(nome)){
        try{ const r = await fetch(nome, {method:'HEAD', cache:'no-cache'}); existeArquivo.set(nome, r.ok); }
        catch(e){ existeArquivo.set(nome, true); }            // sem internet: tenta tocar (pode estar guardado)
      }
      if(existeArquivo.get(nome)) return nome;
    }
    return null;
  }
  let audioAmostra = null;
  function pararAmostra(){ if(audioAmostra){ audioAmostra.pause(); audioAmostra = null; } const b=$('#sv-amostra'); if(b) b.textContent = T('▶️ Ouvir uma amostra','▶️ Hear a sample'); }
  function situacao(tipo){
    const s = servico(tipo);
    if(!s) return T('Chega em breve nos planos pagos da SolverONE.','Coming soon to SolverONE paid plans.');
    if(!sessao || s.motivo==='entrar') return T('Faz parte dos planos pagos da SolverONE. Já é assinante? Entre com a sua conta.','Part of SolverONE paid plans. Already a subscriber? Sign in with your account.');
    if(s.motivo==='aguardando') return T('A sua conta SolverONE ainda não está liberada.','Your SolverONE account is not approved yet.');
    if(s.motivo==='plano') return txt(s.mensagem) || T('Faz parte dos planos pagos da SolverONE.','Part of SolverONE paid plans.');
    if(s.motivo==='limite') return T('Você já usou todo o saldo deste mês. Renova no dia 1.','You have used all of this month\'s allowance. It renews on the 1st.');
    return '';
  }
  async function convite(tipo){
    const voz = tipo==='voz', s = servico(tipo);
    const pontos = voz
      ? [['🎭', T('Emoção, pausas e sussurros de contador de histórias de verdade','Emotion, pauses and whispers like a real storyteller')],
         ['🔑', T('Sem chave e sem configurar nada','No key and nothing to set up')],
         ['📱', T('Fica guardada no aparelho: ouvir de novo não gasta nada e funciona sem internet','Stays on the device: listening again costs nothing and works offline')]]
      : [['🖋️', T('Enredo, ritmo e final de dormir mais caprichados','Richer plots, rhythm and bedtime endings')],
         ['🔑', T('Sem chave e sem configurar nada','No key and nothing to set up')],
         ['🛡️', T('Os nomes das crianças continuam protegidos','Children\'s names stay protected')]];
    const amostra = voz ? await acharAmostra() : null;
    const mostrarEntrar = !!s && !sessao;
    modal(`<h3>✨ ${voz ? T('Voz premium SolverONE','SolverONE premium voice') : T('IA de histórias SolverONE','SolverONE story AI')}</h3>
      <p class="hint" style="font-size:14px">${voz ? T('Uma voz que conta a história como gente: calma, expressiva, do jeito que se conta na hora de dormir.','A voice that tells the story like a person: calm, expressive, the way stories are told at bedtime.')
                                               : T('A IA da SolverONE escreve as histórias por você, com mais capricho, dentro do seu plano.','SolverONE AI writes the stories for you, with more care, within your plan.')}</p>
      <ul class="sv-pontos">${pontos.map(p=>`<li>${p[0]} ${esc(p[1])}</li>`).join('')}</ul>
      ${amostra ? `<button class="btn" id="sv-amostra">${T('▶️ Ouvir uma amostra','▶️ Hear a sample')}</button><p class="sv-frase">“${esc(AMOSTRA.en.includes(amostra) ? FRASE_AMOSTRA.en : FRASE_AMOSTRA.pt)}”</p>` : ''}
      ${situacao(tipo) ? `<div class="info" style="margin-top:12px">${esc(situacao(tipo))}</div>` : ''}
      <div style="height:12px"></div>
      ${mostrarEntrar ? `<button class="btn pri" id="sv-conv-entrar">${T('Entrar com a conta SolverONE','Sign in with a SolverONE account')}</button><div style="height:10px"></div>` : ''}
      <button class="btn sm ghost" id="sv-conv-ok">${T('Entendi','Got it')}</button>`);
    const b = $('#sv-amostra');
    const tocar = ()=>{
      audioAmostra = new Audio(amostra);
      audioAmostra.onended = pararAmostra;
      audioAmostra.onerror = ()=>{ pararAmostra(); toast(T('A amostra não abriu agora.','The sample could not play right now.')); };
      audioAmostra.play().then(()=>{ b.textContent = T('⏸ Parar','⏸ Stop'); }).catch(()=>pararAmostra());
    };
    if(b){
      b.onclick = ()=>{ if(audioAmostra) pararAmostra(); else tocar(); };
      // toca sozinha ao abrir o convite (o toque que abriu vale como permissão; se o navegador barrar, fica o botão)
      tocar();
    }
    $('#sv-conv-ok').onclick = ()=>{ pararAmostra(); fecharModal(); };
    const e = $('#sv-conv-entrar'); if(e) e.onclick = ()=>{ pararAmostra(); janelaEntrar(); };
  }

  function resumoCofre(){
    if(!servicos.length) return '';
    const s = servicos.find(x=>x.disponivel) || servicos[0];
    return sessao
      ? `<div class="it"><span>✨ SolverONE · ${esc(sessao.email||'')}</span><span class="selo">✓ ${esc(nomePlano(s.plano) || T('conectado','connected'))}</span></div>`
      : `<div class="it sem"><span>✨ SolverONE</span><span class="tag">${T('não conectado','not connected')}</span></div>`;
  }

  // ---------- chamar a função do servidor ----------
  function erroDaPlataforma(status, j){
    const e = new Error(({
      entrar: T('Entre com a sua conta SolverONE em Configurações.','Sign in with your SolverONE account in Settings.'),
      aguardando: T('A sua conta SolverONE ainda não está liberada.','Your SolverONE account is not approved yet.'),
      plano: T('Este serviço não faz parte do seu plano SolverONE.','This service is not part of your SolverONE plan.'),
      limite: T('Acabou o saldo deste mês na SolverONE (renova no dia 1).','This month\'s SolverONE allowance is used up (renews on the 1st).'),
      desligado: T('A SolverONE desligou este serviço por agora.','SolverONE switched this service off for now.'),
      grande: T('Trecho grande demais para a SolverONE.','Chunk too large for SolverONE.'),
      recusou: T('A IA não aceitou escrever este pedido. Mude o tema e tente de novo.','The AI would not write this request. Change the topic and try again.'),
      ocupado: T('A SolverONE está ocupada agora. Tentando de novo…','SolverONE is busy right now. Retrying…'),
      'chave-plataforma': T('A SolverONE está com um problema na voz/IA. Já estamos vendo.','SolverONE has a voice/AI problem. We are on it.'),
      ritmo: T('Muitos pedidos seguidos. Espere um minuto.','Too many requests in a row. Wait a minute.')
    })[j && j.erro] || (j && j.mensagem) || ('SolverONE: '+status));
    e.plataforma = true; e.codigo = j && j.erro;
    e.passageiro = status===503 || status===502 || status===429 || status===0;   // lotado, falha passageira, rede
    e.status = status===503 || status===429 ? 429 : status;                        // 429: o leitor espera e tenta de novo
    if(e.codigo==='limite' || e.codigo==='ocupado') e.cota = true;               // para a troca de IA
    if(e.codigo==='limite') e.fimDoMes = true;                                   // tentar de novo não adianta até o dia 1
    if(['entrar','aguardando','plano','desligado'].includes(e.codigo)) e.semChave = true;
    if(e.codigo==='chave-plataforma') e.chave = true;
    return e;
  }
  async function chamar(corpo){
    const t = await token();
    if(!t) throw erroDaPlataforma(401, {erro:'entrar'});
    let r;
    try{ r = await fetch(SB+'/functions/v1/solverone-ia', {method:'POST', headers:{apikey:CHAVE, Authorization:'Bearer '+t, 'Content-Type':'application/json'}, body:JSON.stringify(Object.assign({app:APP}, corpo))}); }
    catch(e){ const x = erroDaPlataforma(0, {mensagem:T('Sem internet agora.','No internet right now.')}); x.passageiro = true; throw x; }
    // o saldo do mês vem junto de cada resposta: a tela de Configurações acompanha sem perguntar de novo
    const usado = r.headers.get('x-uso'), s = servico(corpo.acao==='voz' ? 'voz' : 'texto');
    if(r.ok && usado!==null && usado!=='' && s){ s.usado = Number(usado); if(s.limite!==-1 && s.usado>=s.limite){ s.disponivel=false; s.motivo='limite'; } pintar(); }
    if(!r.ok){
      let j = null; try{ j = await r.json(); }catch(e){}
      if(j && ['limite','plano','aguardando','desligado'].includes(j.erro)) atualizar();
      throw erroDaPlataforma(r.status, j);
    }
    return r;
  }
  async function voz(texto){
    const s = servico('voz');
    const r = await chamar({acao:'voz', servico: s ? s.id : 'voz-premium', texto: semMarcadores(texto), voz: cfg.solveroneVoz});
    return await r.blob();
  }
  async function texto(prompt, aviso){
    const s = servico('texto');
    if(aviso) aviso(T('a IA da SolverONE está escrevendo…','SolverONE AI is writing…'));
    const r = await chamar({acao:'texto', servico: s ? s.id : 'historia-ia', prompt});
    const j = await r.json();
    return String(j.texto || '');
  }
  function nomeVoz(id){ const v = servico('voz'); const o = v && (v.vozes||[]).find(x=>x.id===id); return o ? txt(o.nome) : ''; }

  function iniciar(){
    const retorno = lerRetorno();
    // tocar no botão em cinza abre o convite em vez de trocar o motor (a escolha antiga continua como estava)
    [['#sel-motor-voz','voz'],['#sel-motor-texto','texto']].forEach(([sel,tipo])=>{
      const b = $(sel+' [data-motor="solverone"]'); if(!b) return;
      b.addEventListener('click', e=>{ if(podeUsar(tipo)) return; e.stopImmediatePropagation(); e.preventDefault(); convite(tipo); }, true);
    });
    // a amostra para quando o convite fecha de qualquer jeito: Entendi, toque fora, Voltar do celular ou trocar de app
    document.addEventListener('visibilitychange', ()=>{ if(document.hidden) pararAmostra(); });
    $('#modal').addEventListener('click', e=>{ if(e.target.id==='modal') pararAmostra(); });
    window.addEventListener('popstate', pararAmostra);
    const sel = $('#sel-voz-solverone');
    if(sel) sel.addEventListener('change', ()=>{ cfg.solveroneVoz = sel.value; salvarCfg(); });
    document.addEventListener('dgo:idioma', pintar);
    window.addEventListener('online', ()=>{ atualizar(); retomarAcessos(); revalidar(); });
    window.addEventListener('pagehide', ()=>{ saindo = true; });
    window.addEventListener('pageshow', ()=>{ saindo = false; });
    // outro app ou outra aba entrou, saiu ou renovou: a tela acompanha
    window.addEventListener('storage', e=>{ if(e.key===K_SESSAO || e.key===null){ const antes = sessao && sessao.email; sessao = lerSessao(); if((sessao && sessao.email)!==antes) mudou(); } });
    pintar();
    atualizar();
    if(retorno==='login') aoAbrir('login');
    else if(retorno!=='confirmar' && sessao) aoAbrir('refresh');
    setTimeout(retomarAcessos, 3000);
  }
  // resumo da conta para o topo e o menu do 👤 (identidade conectada)
  function conta(){
    if(!sessao) return null;
    const s = servicos.find(x=>x && x.plano) || {};
    return { email: sessao.email||'', plano: s.plano||'', planoNome: nomePlano(s.plano||''), desde: sessao.desde||0 };
  }
  return { iniciar, atualizar, disponivel, voz, texto, nomeVoz, resumoCofre, convite, entrar: janelaEntrar, sair, encerrar, conectado:()=>!!lerSessao(), conta, rpc, rest, uid };
})();
Plataforma.iniciar();

/* ---------- minhas histórias na conta (v1.20.0, Etapa 2c do plano da nuvem) ----------
   As histórias da pessoa (não as do acervo do app, que já vêm no site), onde parou, favoritas, ajustes (sem chaves de
   IA nem escolhas deste aparelho) e as contas de leitura sobem para a conta SolverONE e aparecem nos outros aparelhos.
   TUDO sai cifrado daqui (AES-GCM 256): nem o banco nem a equipe leem. A chave nasce neste aparelho e vai para a conta
   embrulhada pelo código de recuperação (20 letras, PBKDF2 600 mil rodadas) que a pessoa anota no papel: aparelho novo
   só abre com o código. A cópia do aparelho continua sendo a principal (funciona sem internet); a nuvem é o espelho.
   Como sabe o que mudou: guarda (IndexedDB, por conta) a última versão de cada história que subiu ou desceu e compara.
   Mudou dos dois lados: junta campo a campo; o MESMO campo mudado nos dois lados → a pessoa escolhe. Trava otimista
   pela coluna versao do banco (PATCH ... versao=eq.N). O id da história não muda nunca (é ele que liga à voz guardada).
   Enquanto o SQL do Contador não estiver no banco, o cartão diz "em preparação" e nada é chamado de novo. */
const Nuvem = (function(){
  const CAMPOS = ['titulo','texto','idade','tema','personagens','serie','ordem','criadaEm','origem'];
  // ajustes que valem para a pessoa em qualquer aparelho (motor, voz, modelo e chaves são de cada aparelho)
  const PREFS = ['publicoNomes','publicoTipo','publicoNaHistoria','saudarAntes','vel','tom','openaiInstr','geminiInstr',
    'efeitos','volEfeitos','durEfeitos','adiantar','fonte','telaAcesa','destaque','usarVozGuardada','protegerNomes',
    'nomesProtegidos','tema','reduzirAnimacoes'];
  const RODADAS = 600000, CONSENTIMENTO = 'v1-2026-10', ID_OK = /^[A-Za-z0-9_.:@-]{1,80}$/, PAGINA = 500;
  const {b64, deB64, aleatorio, codigoNovo, soCodigo} = Copia.util;
  const enc = new TextEncoder(), dec = new TextDecoder();
  const igual = (a, b) => JSON.stringify(a)===JSON.stringify(b);
  const q = encodeURIComponent;
  const iso = x => { const d = new Date(x); return isNaN(d) ? '' : d.toISOString(); };
  const doAcervo = h => /^h_/.test(h.id);          // as do acervo do app (historias.json) já estão no site para todos
  const nid = h => h.nuvemId || h.id;               // id na conta (o do aparelho, salvo quando o banco não aceita)
  const cont = h => ({ titulo:h.titulo||'', texto:h.texto||'', idade:h.idade||'', tema:h.tema||'', personagens:h.personagens||'',
    serie:h.serie||'', ordem:Number(h.ordem)||0, criadaEm:h.criadaEm||'', origem:h.origem||'' });
  const prog = h => ({ favorita:!!h.favorita, lida:!!h.lida, posFrase:Math.min(100000, Number(h.posFrase)||0),
    frasesTotal:Math.min(100000, Number(h.frasesTotal)||0), leituras:Math.min(1000000, Number(h.leituras)||0), ouvidaEm: h.ouvidaEm ? iso(h.ouvidaEm) : '' });
  // os nomes das crianças moram no cofre (v1.22.0). Cofre aberto: vai o valor dele. Trancado: nunca pede PIN em segundo plano
  // e não apaga o da conta (repete o último valor conhecido de lá).
  const prefs = ()=>{ const o = {}; PREFS.forEach(k=>{
    if(k in SEGREDOS) o[k] = Seg.aberto() ? Seg.agora(k) : ((st && st.pref && st.pref.c && st.pref.c[k]!==undefined) ? st.pref.c[k] : null);
    else o[k] = cfg[k]===undefined ? null : cfg[k];
  }); return o; };
  let APARELHO = ''; try{ APARELHO = localStorage.getItem('ch_aparelho') || ''; if(!/^[A-Za-z0-9_-]{8,64}$/.test(APARELHO)){ APARELHO = 'a'+Date.now().toString(36)+Math.random().toString(36).slice(2,10); localStorage.setItem('ch_aparelho', APARELHO); } }catch(e){ APARELHO = 'a'+Date.now().toString(36)+'semlocal'; }

  // estado: sem-conta · indisponivel (motivo: preparo | desligado | navegador) · sem-internet · nova · trancada · ligada
  let estado = 'sem-conta', motivo = '', U = '', chaves = null, st = null;
  let rodando = null, tEspera = 0, erro = '', mostrarSelo = 0, segurando = [], aplicando = false;
  // grava as histórias sem contar como "mudou aqui" (senão cada ida e volta chamaria outra)
  const salvarAqui = ()=>{ aplicando = true; try{ salvarHistorias(); }finally{ aplicando = false; } };
  const rest = (m, c, b, p) => Plataforma.rest(m, c, b, p);
  const guardar = ()=> st && U ? Dados.gravarKV('nuvem|'+U, st).catch(()=>{}) : Promise.resolve();
  const estadoNovo = ()=>({ h:{}, p:{}, fora:{}, conflitos:{}, dup:{}, desdeH:'', desdeP:'', pref:null, s:null, outros:null, liberado:[] });

  // ---------- chaves ----------
  async function chaveDoCodigo(codigo, sal, rodadas){
    const base = await crypto.subtle.importKey('raw', enc.encode(soCodigo(codigo)), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({name:'PBKDF2', hash:'SHA-256', salt:sal, iterations:rodadas||RODADAS}, base, {name:'AES-GCM', length:256}, false, ['encrypt','decrypt']);
  }
  // da chave-mestra saem duas, que ficam guardadas neste aparelho sem poder ser copiadas (não exportáveis)
  async function derivar(bruta){
    const mestra = await crypto.subtle.importKey('raw', bruta, 'HKDF', false, ['deriveKey']);
    const de = info => ({name:'HKDF', hash:'SHA-256', salt:new Uint8Array(32), info:enc.encode(info)});
    return { aes: await crypto.subtle.deriveKey(de('contador/historias/cifra'), mestra, {name:'AES-GCM', length:256}, false, ['encrypt','decrypt']),
             hmac: await crypto.subtle.deriveKey(de('contador/historias/marca'), mestra, {name:'HMAC', hash:'SHA-256', length:256}, false, ['sign']) };
  }
  // o conteúdo fica preso ao dono e ao id (additionalData): trocar de linha no banco não abre
  async function cifrar(obj, onde){
    const iv = aleatorio(12);
    const c = await crypto.subtle.encrypt({name:'AES-GCM', iv, additionalData:enc.encode(U+'|'+onde)}, chaves.aes, enc.encode(JSON.stringify(obj)));
    return b64(iv)+'.'+b64(new Uint8Array(c));
  }
  async function decifrar(txt, onde){
    const [iv, c] = String(txt||'').split('.');
    return JSON.parse(dec.decode(await crypto.subtle.decrypt({name:'AES-GCM', iv:deB64(iv), additionalData:enc.encode(U+'|'+onde)}, chaves.aes, deB64(c))));
  }
  // impressão digital (o banco recusa a mesma história duas vezes sem conseguir ler o texto)
  async function marcar(c){
    const m = new Uint8Array(await crypto.subtle.sign('HMAC', chaves.hmac, enc.encode(c.titulo+'\n'+c.texto)));
    return Array.from(m, b=>b.toString(16).padStart(2,'0')).join('');
  }
  async function guardarChaves(bruta){
    chaves = await derivar(bruta); bruta.fill(0);
    await Dados.gravarKV('nuvemchave|'+U, chaves);
    st = estadoNovo(); await guardar();
  }

  // ---------- como está ----------
  async function avaliar(){
    if(rodando) await rodando.catch(()=>{});     // termina a ida e volta em andamento antes de trocar de conta
    U = Plataforma.uid(); chaves = null; st = null; segurando = []; erro = '';
    if(!U){ estado = 'sem-conta'; pintar(); return; }
    await Dados.esperar();
    if(!Dados.noIndexedDB()){ estado = 'indisponivel'; motivo = 'navegador'; pintar(); return; }
    const eu = U;
    try{ chaves = (await Dados.lerKV('nuvemchave|'+U)) || null; st = (await Dados.lerKV('nuvem|'+U)) || null; }catch(e){}
    if(chaves && !st) st = estadoNovo();
    if(chaves && st){ st = Object.assign(estadoNovo(), st); estado = 'ligada'; pintar(); }
    try{
      const pode = await Plataforma.rpc('conta_posso', {p_regra:'nuvem'});
      if(eu!==U) return;
      if(pode!==true){ estado = 'indisponivel'; motivo = 'desligado'; pintar(); return; }
      if(estado==='ligada'){ sincronizar(); return; }
      const l = await rest('GET', 'conta_chave?select=versao&user_id=eq.'+U+'&limit=1');
      estado = l && l.length ? 'trancada' : 'nova';
    }catch(e){
      if(eu!==U) return;
      if(e.status===404 || /^(PGRST20[25]|42P01|42883)$/.test(e.codigo||'')){ estado = 'indisponivel'; motivo = 'preparo'; }   // o SQL ainda não rodou
      else if(estado!=='ligada') estado = 'sem-internet';
    }
    pintar();
  }

  // ---------- ligar (primeiro aparelho) e destrancar (aparelho novo, com o código) ----------
  async function ligar(codigo, andamento){
    const bruta = aleatorio(32), sal = aleatorio(16), iv = aleatorio(12);
    andamento(0.05, T('protegendo a chave com o código…','protecting the key with the code…'));
    const k = await chaveDoCodigo(codigo, sal);
    const emb = new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM', iv, additionalData:enc.encode('conta_chave|'+U+'|1')}, k, bruta));
    try{ await rest('POST', 'conta_chave', {versao:1, iteracoes:RODADAS, sal:b64(sal), chave_embrulhada:b64(iv)+'.'+b64(emb)}, 'return=minimal'); }
    catch(e){ if(e.status===409 || e.codigo==='23505'){ estado = 'trancada'; pintar(); return {erro:'outro'}; } throw e; }
    await guardarChaves(bruta);
    // consentimento do responsável (LGPD art. 14 §1º): fica registrado na conta com a data e a versão do texto
    await rest('POST', 'conta_preferencias?on_conflict=user_id', {user_id:U, consentimento_em:new Date().toISOString(), consentimento_versao:CONSENTIMENTO}, 'resolution=merge-duplicates,return=minimal');
    estado = 'ligada';
    await sincronizar(andamento, true);
    return {ok:true};
  }
  async function destrancar(codigo, andamento){
    andamento(0.05, T('conferindo o código…','checking the code…'));
    const linhas = await rest('GET', 'conta_chave?select=versao,iteracoes,sal,chave_embrulhada&user_id=eq.'+U+'&order=versao.desc') || [];
    let bruta = null;
    for(const l of linhas){
      try{
        const k = await chaveDoCodigo(codigo, deB64(l.sal), l.iteracoes);
        const [iv, c] = l.chave_embrulhada.split('.');
        bruta = new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM', iv:deB64(iv), additionalData:enc.encode('conta_chave|'+U+'|'+l.versao)}, k, deB64(c)));
        break;
      }catch(e){}
    }
    if(!bruta) return {erro:'codigo'};
    await guardarChaves(bruta);
    estado = 'ligada';
    await sincronizar(andamento, true);
    return {ok:true};
  }

  // ---------- trazer da conta ----------
  async function paginas(tabela, campos, ordem, desde, cada){
    let pulo = 0, maior = desde;
    // 2 minutos de folga: uma gravação que terminou depois de eu ler não escapa (o que já tenho é pulado pela versão)
    const filtro = desde ? '&atualizado_em=gt.'+q(new Date(Date.parse(desde)-120000).toISOString()) : '';
    for(;;){
      const l = await rest('GET', tabela+'?select='+campos+'&user_id=eq.'+U+filtro+'&order=atualizado_em.asc,'+ordem+'.asc&limit='+PAGINA+'&offset='+pulo) || [];
      for(const x of l){ await cada(x); if(!maior || Date.parse(x.atualizado_em) > Date.parse(maior)) maior = x.atualizado_em; }
      if(l.length < PAGINA) return maior;
      pulo += l.length;
    }
  }
  // história que chega da conta (ou volta): já com o onde parei que a conta tem, para não subir zerada por cima
  const novaDe = (id, c) => Object.assign({ id, leituras:0, favorita:false, lida:false, posFrase:0, frasesTotal:0, ouvidaEm:'' },
    (st.p[id] && st.p[id].c) || {}, c, { idade:c.idade||'6-9', titulo:c.titulo||T('Sem título','Untitled') });
  async function puxarHistorias(mudou){
    st.desdeH = await paginas('conta_historias', 'id,versao,dados_cifrado,apagado_em,atualizado_em', 'id', st.desdeH, async x=>{
      const k = st.h[x.id];
      if(k && k.v >= x.versao) return;
      const L = historias.find(h=>nid(h)===x.id);
      if(x.apagado_em){
        // apagada em outro aparelho: sai daqui também, a não ser que tenha mudado aqui depois (aí fica e sobe de novo)
        if(L && k && k.c && igual(cont(L), k.c)){
          historias = historias.filter(h=>h!==L); Guarda.limparHistoria(L.id).catch(()=>{}); mudou.n++;
          st.h[x.id] = {v:x.versao, apagada:true};
        } else st.h[x.id] = L ? {v:x.versao} : {v:x.versao, apagada:true};
        delete st.conflitos[x.id];
        return;
      }
      let R; try{ R = Object.assign(cont({}), await decifrar(x.dados_cifrado, x.id)); }catch(e){ return; }   // não abriu: fica para depois
      if(!L){ historias.push(novaDe(x.id, R)); st.h[x.id] = {v:x.versao, c:R}; mudou.n++; return; }
      // junta campo a campo: o que só mudou de um lado fica; o mesmo campo mudado dos dois lados → a pessoa escolhe
      const local = cont(L), base = k && k.c, junto = {}, briga = [];
      CAMPOS.forEach(f=>{
        if(igual(local[f], R[f]) || (base && igual(local[f], base[f]))) junto[f] = R[f];
        else if(base && igual(R[f], base[f])) junto[f] = local[f];
        else briga.push(f);
      });
      if(briga.length){ st.conflitos[x.id] = {v:x.versao, c:R}; return; }
      if(!igual(local, junto)){ Object.assign(L, junto); mudou.n++; }
      st.h[x.id] = {v:x.versao, c:R};          // o que mudou só aqui continua diferente da conta: sobe em seguida
      delete st.conflitos[x.id];
    });
    if(mudou.n) historias.sort((a,b)=> (b.criadaEm||'').localeCompare(a.criadaEm||''));
  }
  function aplicarProg(L, R, base){
    const local = prog(L);
    if(base && igual(local, base)){ Object.assign(L, R); return; }
    if(!base){   // primeira vez neste aparelho: soma os dois (nada se perde)
      L.favorita = local.favorita || R.favorita; L.lida = local.lida || R.lida;
      // onde parei: o mais recente; empate (ou sem data) e aqui ainda no começo → o de lá
      if(R.ouvidaEm > local.ouvidaEm || (R.ouvidaEm===local.ouvidaEm && !local.posFrase)){ L.posFrase = R.posFrase; L.frasesTotal = R.frasesTotal; L.ouvidaEm = R.ouvidaEm; }
    }
    // mudou aqui também: fica a daqui (sobe em seguida); as leituras ficam com a maior conta
    L.leituras = Math.max(local.leituras, R.leituras);
  }
  async function puxarProgresso(mudou){
    st.desdeP = await paginas('conta_progresso', 'historia_id,versao,favorita,lida,pos_frase,frases_total,leituras,ouvida_em,atualizado_em', 'historia_id', st.desdeP, async x=>{
      const k = st.p[x.historia_id];
      if(k && k.v >= x.versao) return;
      const R = { favorita:!!x.favorita, lida:!!x.lida, posFrase:x.pos_frase||0, frasesTotal:x.frases_total||0, leituras:x.leituras||0, ouvidaEm: x.ouvida_em ? iso(x.ouvida_em) : '' };
      const L = historias.find(h=>nid(h)===x.historia_id);
      if(!L){ st.fora[x.historia_id] = {v:x.versao, c:R}; return; }   // a história ainda não chegou aqui (ex.: acervo baixando)
      const antes = prog(L); aplicarProg(L, R, k && k.c); if(!igual(antes, prog(L))) mudou.n++;
      st.p[x.historia_id] = {v:x.versao, c:R};
    });
    Object.keys(st.fora).forEach(id=>{
      const L = historias.find(h=>nid(h)===id); if(!L) return;
      const f = st.fora[id]; delete st.fora[id];
      if(st.p[id] && st.p[id].v >= f.v) return;
      aplicarProg(L, f.c, st.p[id] && st.p[id].c); st.p[id] = f; mudou.n++;
    });
  }
  async function puxarPreferencias(){
    const x = (await rest('GET', 'conta_preferencias?select=versao,dados_cifrado&user_id=eq.'+U) || [])[0];
    if(!x || !x.dados_cifrado || (st.pref && st.pref.v >= x.versao)) return;
    let R; try{ R = await decifrar(x.dados_cifrado, 'preferencias'); }catch(e){ return; }
    const local = prefs(), base = st.pref && st.pref.c; let mudou = false, adiado = false;
    PREFS.forEach(k=>{
      if(!(k in R) || igual(local[k], R[k])) return;
      if(!base || igual(local[k], base[k])){
        if(k in SEGREDOS){ if(Seg.aberto()){ Seg.gravar(k, R[k]); } else adiado = true; return; }   // cofre trancado: tenta de novo na próxima volta
        cfg[k] = R[k]; mudou = true;
      }
    });
    if(!adiado) st.pref = {v:x.versao, c:R};
    if(mudou){ salvar(CHAVE_C, cfg); aplicarCfgNaTela(); if(typeof Topo!=='undefined') Topo.aplicarTema(); }
  }
  async function puxarEstatisticas(){
    const l = await rest('GET', 'conta_estatisticas?select=leituras,segundos,sequencia&user_id=eq.'+U+'&aparelho=neq.'+q(APARELHO)) || [];
    st.outros = l.reduce((a, x)=>({ leituras:a.leituras+(x.leituras||0), segundos:a.segundos+Number(x.segundos||0), sequencia:Math.max(a.sequencia, x.sequencia||0) }), {leituras:0, segundos:0, sequencia:0});
  }

  // ---------- levar para a conta ----------
  const pendentesHist = ()=> historias.filter(h=>!doAcervo(h) && h.texto && !st.conflitos[nid(h)]
    && !(st.h[nid(h)] && st.h[nid(h)].c && igual(st.h[nid(h)].c, cont(h))) && st.dup[nid(h)]!==JSON.stringify(cont(h)));
  const sumidas = ()=>{ const aqui = new Set(historias.map(nid)); return Object.keys(st.h).filter(id=>!st.h[id].apagada && !aqui.has(id) && !st.conflitos[id]); };
  function quantasPendentes(){
    if(estado!=='ligada' || !st) return 0;
    return pendentesHist().length + sumidas().length - segurando.length;
  }
  const existe = async id => ((await rest('GET', 'conta_historias?select=versao&user_id=eq.'+U+'&id=eq.'+q(id))) || []).length > 0;
  async function levarHistorias(passo, de){
    let trocou = false;
    historias.forEach(h=>{ if(!doAcervo(h) && !ID_OK.test(nid(h))){ h.nuvemId = uid(); trocou = true; } });
    if(trocou) salvarAqui();
    const fila = pendentesHist(), sumiram = sumidas();
    // muitas saíram de uma vez: pergunta antes de apagar da conta (pode ter sido engano)
    const vivas = Object.keys(st.h).filter(id=>!st.h[id].apagada).length;
    const liberadas = sumiram.every(id=>st.liberado.includes(id));
    segurando = (sumiram.length > 3 && sumiram.length > vivas*0.3 && !liberadas) ? sumiram : [];
    const apagar = segurando.length ? [] : sumiram;
    let feitas = 0, denovo = false; const total = fila.length + apagar.length;
    for(const h of fila){
      passo(de + (0.95-de)*(feitas++/Math.max(1,total)), T('levando as histórias','taking the stories')+` (${feitas}/${total})`);
      const id = nid(h), c = cont(h), k = st.h[id];
      const corpo = { chave_versao:1, dados_cifrado: await cifrar(c, id), marca: await marcar(c), apagado_em:null };
      try{
        let l = null;
        if(k) l = await rest('PATCH', 'conta_historias?user_id=eq.'+U+'&id=eq.'+q(id)+'&versao=eq.'+k.v, corpo, 'return=representation');
        if(k && !(l && l.length)){
          if(await existe(id)){ denovo = true; continue; }    // mudou em outro aparelho: traz primeiro e tenta de novo
          delete st.h[id];
        }
        if(!st.h[id]) l = await rest('POST', 'conta_historias', Object.assign({id}, corpo), 'return=representation');
        st.h[id] = {v:l[0].versao, c};
      }catch(e){
        if(e.codigo==='23505' && /marca|sem_repetir/.test(e.message||'')){
          // a mesma história (título e texto) já está na conta com outro id: passa a usar aquela; repetida aqui fica só aqui
          const o = (await rest('GET', 'conta_historias?select=id,versao&user_id=eq.'+U+'&marca=eq.'+corpo.marca+'&apagado_em=is.null') || [])[0];
          if(!k && o && !historias.some(x=>nid(x)===o.id)){ h.nuvemId = o.id; st.h[o.id] = {v:o.versao, c}; salvarAqui(); }
          else st.dup[id] = JSON.stringify(c);
          continue;
        }
        if(e.codigo==='23505' || e.status===409){ denovo = true; continue; }   // outro aparelho criou antes: traz primeiro
        throw e;
      }
    }
    for(const id of apagar){
      passo(de + (0.95-de)*(feitas++/Math.max(1,total)), T('tirando da conta as que você apagou','removing the ones you deleted'));
      const l = await rest('PATCH', 'conta_historias?user_id=eq.'+U+'&id=eq.'+q(id)+'&versao=eq.'+st.h[id].v, {apagado_em:new Date().toISOString()}, 'return=representation');
      if(l && l.length) st.h[id] = {v:l[0].versao, apagada:true};
      else if(await existe(id)) denovo = true;      // mudou em outro aparelho depois: volta para cá em vez de sumir
      else delete st.h[id];
    }
    if(!segurando.length) st.liberado = [];
    return denovo;
  }
  async function levarProgresso(){
    const linhas = [], valores = {};
    historias.forEach(h=>{
      const id = nid(h); if(!ID_OK.test(id) || st.conflitos[id]) return;
      const p = prog(h), k = st.p[id];
      if(k ? igual(k.c, p) : igual(p, prog({}))) return;
      valores[id] = p;
      linhas.push({ user_id:U, historia_id:id, favorita:p.favorita, lida:p.lida, pos_frase:p.posFrase, frases_total:p.frasesTotal, leituras:p.leituras, ouvida_em:p.ouvidaEm||null });
    });
    for(let i=0; i<linhas.length; i+=200){
      const r = await rest('POST', 'conta_progresso?on_conflict=user_id,historia_id', linhas.slice(i, i+200), 'resolution=merge-duplicates,return=representation') || [];
      r.forEach(x=>{ if(valores[x.historia_id]) st.p[x.historia_id] = {v:x.versao, c:valores[x.historia_id]}; });
    }
  }
  async function levarPreferencias(){
    const p = prefs(); if(st.pref && igual(st.pref.c, p)) return;
    const r = await rest('POST', 'conta_preferencias?on_conflict=user_id', {user_id:U, dados_cifrado: await cifrar(p, 'preferencias'), chave_versao:1}, 'resolution=merge-duplicates,return=representation') || [];
    if(r[0]) st.pref = {v:r[0].versao, c:p};
  }
  async function levarEstatisticas(){
    const s = { leituras:stats.leituras||0, segundos:stats.segundos||0, ultima_noite: /^\d{4}-\d\d-\d\d$/.test(stats.ultimaNoite||'') ? stats.ultimaNoite : null, sequencia:stats.sequencia||0 };
    if(igual(st.s, s)) return;
    await rest('POST', 'conta_estatisticas?on_conflict=user_id,aparelho', Object.assign({user_id:U, aparelho:APARELHO}, s), 'resolution=merge-duplicates,return=minimal');
    st.s = s;
  }

  // ---------- uma ida e volta completa ----------
  async function rodada(andamento){
    const passo = andamento || (()=>{});
    const mudou = {n:0};
    let denovo = false, vez = 0;
    do{
      passo(0.15, T('trazendo o que já está na conta…','bringing what is already in the account…'));
      await puxarHistorias(mudou); await puxarProgresso(mudou); await puxarPreferencias(); await puxarEstatisticas();
      if(mudou.n){ salvarAqui(); pintarTudo(); mudou.n = 0; }
      await guardar();
      denovo = await levarHistorias(passo, 0.35);
      await guardar();
      await levarProgresso(); await levarPreferencias(); await levarEstatisticas();
      await guardar();
    }while(denovo && ++vez < 3);
    pintarStats();
  }
  function sincronizar(andamento, avisarErro){
    if(estado!=='ligada' || !chaves || !st) return Promise.resolve();
    if(rodando){ if(!andamento) return rodando; return rodando.then(()=>sincronizar(andamento, avisarErro)); }
    clearTimeout(tEspera); tEspera = 0;
    const eu = U, antes = quantasPendentes();
    rodando = rodada(andamento)
      .then(()=>{ erro = ''; if(antes && !quantasPendentes() && !andamento) mostrarSelo = Date.now(); })
      .catch(e=>{
        if(eu!==U) return;
        erro = e.semConta ? '' : (e.status ? T('A conta não aceitou agora','The account did not accept it now')+' ('+(e.codigo||e.status)+')' : T('Sem internet: guardo quando voltar.','No internet: I will save when it is back.'));
        if(e.status===404 || /^(PGRST20[25]|42P01)$/.test(e.codigo||'')){ estado = 'indisponivel'; motivo = 'preparo'; }
        if(avisarErro) throw e;
      })
      .finally(()=>{ rodando = null; pintar(); });
    return rodando;
  }
  // algo mudou neste aparelho: sobe daqui a pouco (junta várias mudanças seguidas numa ida só)
  function mudou(){
    if(aplicando || estado!=='ligada' || tEspera) return;
    tEspera = setTimeout(()=>{ tEspera = 0; sincronizar(); }, 15000);
    pintarSelo();
  }

  // ---------- telas ----------
  function primeiraVez(){
    const passos = [
      ['☁️', T('O que vai para a conta','What goes to the account'),
        T('As histórias que você criou ou trouxe, onde parou em cada uma, as favoritas, os seus ajustes de leitura e as contas de leitura. As do acervo do app não sobem: elas já vêm com o app. As chaves de IA e as vozes guardadas ficam só neste aparelho.',
          'The stories you created or brought in, where you stopped in each one, favorites, your reading settings and reading counts. The app\'s own stories do not go up: they already come with the app. AI keys and saved voices stay on this device only.')],
      ['🔒', T('Quem consegue ler','Who can read it'),
        T('Tudo sai embaralhado deste aparelho, inclusive os nomes das crianças. Nem a equipe da SolverONE consegue ler. Só abre num aparelho seu: neste, ou num novo com o código que vou mostrar agora.',
          'Everything leaves this device scrambled, including the children\'s names. Not even the SolverONE team can read it. It only opens on a device of yours: this one, or a new one with the code I will show you now.')]
    ];
    const codigo = codigoNovo();
    let i = 0;
    const mostrar = ()=>{
      if(i < passos.length){
        const [ic, tit, txt] = passos[i];
        modal(`<p class="hint" style="margin:0">${T('Passo','Step')} ${i+1} ${T('de','of')} 4</p><h3>${ic} ${tit}</h3><p class="hint" style="font-size:14px">${txt}</p>
          <div style="height:12px"></div><button class="btn pri" id="nv-seguir">${T('Continuar','Continue')}</button>
          <div style="height:10px"></div><button class="btn sm ghost" id="nv-nao">${T('Agora não','Not now')}</button>`);
        $('#nv-seguir').onclick = ()=>{ i++; mostrar(); };
      } else if(i===2){
        modal(`<p class="hint" style="margin:0">${T('Passo','Step')} 3 ${T('de','of')} 4</p><h3>📝 ${T('Anote o código de recuperação','Write down the recovery code')}</h3>
          <p class="hint">${T('Escreva num papel e guarde junto com os seus documentos. Num aparelho novo, as histórias só abrem com ele. Se perder o código e este aparelho, nem a SolverONE consegue abrir.','Write it on paper and keep it with your documents. On a new device, the stories only open with it. If you lose the code and this device, not even SolverONE can open them.')}</p>
          <div class="codigo-rec" style="font:700 20px/1.5 ui-monospace,monospace;letter-spacing:1px;text-align:center;padding:14px;border-radius:12px;background:rgba(255,255,255,.06);user-select:all">${esc(codigo)}</div>
          <label style="display:flex;gap:10px;align-items:center;margin:12px 0"><input type="checkbox" id="nv-anotei" style="width:auto"> ${T('Anotei o código num papel','I wrote the code on paper')}</label>
          <button class="btn pri" id="nv-seguir" disabled>${T('Continuar','Continue')}</button>
          <div style="height:10px"></div><button class="btn sm ghost" id="nv-nao">${T('Agora não','Not now')}</button>`);
        $('#nv-anotei').onchange = e=>{ $('#nv-seguir').disabled = !e.target.checked; };
        $('#nv-seguir').onclick = ()=>{ i++; mostrar(); };
      } else {
        const n = historias.filter(h=>!doAcervo(h) && h.texto).length;
        modal(`<p class="hint" style="margin:0">${T('Passo','Step')} 4 ${T('de','of')} 4</p><h3>👨‍👩‍👧 ${T('Autorização do responsável','Guardian\'s permission')}</h3>
          <p class="hint">${T('As histórias podem ter o nome e o jeito das crianças. Pela lei (LGPD), quem autoriza guardar isso na conta é o pai, a mãe ou o responsável.','Stories may have the children\'s names and traits. By law (LGPD), the parent or guardian is who allows keeping this in the account.')}</p>
          <label style="display:flex;gap:10px;align-items:flex-start;margin:12px 0"><input type="checkbox" id="nv-autorizo" style="width:auto;margin-top:3px"> <span>${T('Sou o responsável pelas crianças das histórias e autorizo guardar estas histórias, cifradas, na minha conta SolverONE. Posso desligar ou pedir a exclusão quando quiser.','I am the guardian of the children in the stories and I allow these stories to be kept, encrypted, in my SolverONE account. I can switch it off or ask for erasure whenever I want.')}</span></label>
          <p class="hint">${T('Dúvidas sobre os seus dados:','Questions about your data:')} privacidade@solverone.com.br</p>
          <p class="hint">${n ? T(`Vão para a conta ${n} história(s) deste aparelho.`, `${n} story(ies) from this device will go to the account.`) : T('Ainda não há histórias suas neste aparelho; as próximas vão sozinhas.','There are no stories of yours on this device yet; the next ones go automatically.')}</p>
          <button class="btn pri" id="nv-seguir" disabled>☁️ ${T('Ligar e levar as histórias','Switch on and take the stories')}</button>
          <div style="height:10px"></div><button class="btn sm ghost" id="nv-nao">${T('Agora não','Not now')}</button>`);
        $('#nv-autorizo').onchange = e=>{ $('#nv-seguir').disabled = !e.target.checked; };
        $('#nv-seguir').onclick = ()=>{ fecharModal(); emTarefa(T('Levando suas histórias para a conta','Taking your stories to the account'), a=>ligar(codigo, a)); };
      }
      $('#nv-nao').onclick = fecharModal;
    };
    mostrar();
  }
  function pedirCodigo(){
    modal(`<h3>🔑 ${T('Abrir as histórias da conta neste aparelho','Open the account stories on this device')}</h3>
      <p class="hint">${T('A sua conta já guarda histórias. Para abrir aqui, digite o código de recuperação que você anotou quando ligou no primeiro aparelho.','Your account already keeps stories. To open them here, type the recovery code you wrote down when you switched it on on the first device.')}</p>
      <label class="f" for="nv-codigo">${T('Código de recuperação','Recovery code')}</label>
      <input id="nv-codigo" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABCDE-FGHJK-MNPQR-STUVW">
      <div class="aviso oculto" id="nv-erro" style="margin-top:10px"></div>
      <div style="height:12px"></div><button class="btn pri" id="nv-abrir">${T('Abrir e trazer as histórias','Open and bring the stories')}</button>
      <div style="height:10px"></div><button class="btn sm ghost" id="nv-nao">${T('Agora não','Not now')}</button>`);
    $('#nv-nao').onclick = fecharModal;
    $('#nv-abrir').onclick = ()=>{
      const c = $('#nv-codigo').value;
      if(soCodigo(c).length !== 20){ const e = $('#nv-erro'); e.textContent = T('O código tem 20 letras e números (os tracinhos não contam).','The code has 20 letters and numbers (dashes do not count).'); e.classList.remove('oculto'); return; }
      fecharModal();
      emTarefa(T('Trazendo as histórias da conta','Bringing the account stories'), a=>destrancar(c, a));
    };
  }
  function emTarefa(titulo, fazer){
    DGO.tarefa.iniciar({ id:'nuvem', titulo, executar: fazer,
      aoAbrir: r=>{
        if(r && r.erro==='codigo'){ pedirCodigo(); const e = $('#nv-erro'); if(e){ e.textContent = T('Esse código não abriu. Confira as letras e tente de novo.','That code did not open it. Check the letters and try again.'); e.classList.remove('oculto'); } return; }
        if(r && r.erro==='outro'){ toast(T('Outro aparelho seu acabou de ligar: use o código que apareceu nele.','Another device of yours just switched it on: use the code shown there.'), 6000); pedirCodigo(); return; }
        toast('✓ '+T('Tudo salvo na sua conta','Everything saved in your account'), 4000);
        if(Object.keys(st.conflitos).length) escolher();
      } })
      .catch(()=>toast(T('Não deu agora. Confira a internet e tente de novo.','It did not work now. Check the internet and try again.'), 5000));
  }
  // a mesma história mudou nos dois aparelhos: a pessoa escolhe (ou fica com as duas)
  function escolher(){
    const id = Object.keys(st.conflitos)[0]; if(!id) return;
    const R = st.conflitos[id].c, v = st.conflitos[id].v, L = historias.find(h=>nid(h)===id);
    const fim = ()=>{ delete st.conflitos[id]; salvarAqui(); pintarTudo(); guardar().then(()=>{ fecharModal(); if(Object.keys(st.conflitos).length) escolher(); else sincronizar(); }); };
    if(!L){ st.h[id] = {v, c:R}; historias.push(novaDe(id, R)); return fim(); }
    const resumo = h => esc((h.titulo||'')+' — '+String(h.texto||'').slice(0, 110))+'…';
    modal(`<h3>✋ ${T('Esta história mudou em dois aparelhos','This story changed on two devices')}</h3>
      <p class="hint">${T('Qual fica?','Which one stays?')}</p>
      <div class="info" style="margin-top:8px"><b>${T('Deste aparelho','This device')}:</b> ${resumo(L)}</div>
      <div class="info" style="margin-top:8px"><b>${T('Do outro aparelho','Other device')}:</b> ${resumo(R)}</div>
      <div style="height:12px"></div><button class="btn" id="nv-deste">${T('A deste aparelho','This device\'s')}</button>
      <div style="height:8px"></div><button class="btn" id="nv-outro">${T('A do outro aparelho','The other device\'s')}</button>
      <div style="height:8px"></div><button class="btn" id="nv-duas">${T('Ficar com as duas','Keep both')}</button>
      <div style="height:10px"></div><button class="btn sm ghost" id="nv-depois">${T('Escolher depois','Choose later')}</button>`);
    $('#nv-depois').onclick = fecharModal;
    $('#nv-deste').onclick = ()=>{ st.h[id] = {v, c:R}; fim(); };
    $('#nv-outro').onclick = ()=>{ Object.assign(L, R); st.h[id] = {v, c:R}; fim(); };
    $('#nv-duas').onclick = ()=>{ historias.push(novaDe(uid(), Object.assign({}, R, {titulo:(R.titulo||'')+' '+T('(outro aparelho)','(other device)')}))); st.h[id] = {v, c:R}; fim(); };
  }
  function desligarAqui(confirmar){
    const fazer = async ()=>{
      if(rodando) await rodando.catch(()=>{});   // senão a ida e volta em andamento gravaria o estado de novo
      const u = U; clearTimeout(tEspera); tEspera = 0; estado = 'sem-conta';
      try{ await Dados.apagarKV('nuvemchave|'+u); await Dados.apagarKV('nuvem|'+u); }catch(e){}
      chaves = null; st = null; await avaliar();
    };
    if(!confirmar) return fazer();
    modal(`<h3>☁️ ${T('Desligar neste aparelho?','Switch off on this device?')}</h3>
      <p class="hint">${T('As histórias continuam neste aparelho e na conta; só param de ir e vir por aqui. Para ligar de novo, vai pedir o código de recuperação.','The stories stay on this device and in the account; they just stop syncing here. To switch on again, it will ask for the recovery code.')}</p>
      <div style="height:12px"></div><button class="btn" id="nv-sim">${T('Desligar neste aparelho','Switch off on this device')}</button>
      <div style="height:10px"></div><button class="btn sm ghost" id="nv-nao">${T('Cancelar','Cancel')}</button>`);
    $('#nv-nao').onclick = fecharModal;
    $('#nv-sim').onclick = ()=>{ fecharModal(); fazer(); };
  }
  // selo no canto de baixo: "⏳ N aguardando" sem internet, "✓ Tudo salvo" por 5 s, "✋ escolher" (toque abre a escolha)
  function pintarSelo(){
    let s = $('#nv-selo');
    if(!s){ s = document.createElement('button'); s.id = 'nv-selo'; s.type = 'button'; s.setAttribute('aria-live','polite'); s.style.cssText = 'position:fixed;left:12px;bottom:calc(86px + env(safe-area-inset-bottom));z-index:60;padding:6px 12px;border-radius:999px;font-weight:600;font-size:12px;line-height:1.2;background:rgba(20,15,34,.94);color:#e8e1ff;border:1px solid rgba(155,123,255,.4)'; s.onclick = ()=>{ if(st && Object.keys(st.conflitos).length) escolher(); }; document.body.appendChild(s); }
    const n = quantasPendentes(), nc = estado==='ligada' && st ? Object.keys(st.conflitos).length : 0, recente = Date.now() - mostrarSelo < 5000;
    s.hidden = !(estado==='ligada' && (nc || (n && (erro || !navigator.onLine)) || (!n && recente)));
    s.style.pointerEvents = nc ? 'auto' : 'none';
    s.textContent = nc ? '✋ '+nc+' '+T('para escolher qual fica','to choose which stays')
      : n ? '⏳ '+n+' '+T('aguardando a internet','waiting for internet') : '✓ '+T('Tudo salvo na sua conta','Everything saved in your account');
    if(recente) setTimeout(pintarSelo, 5200);
  }
  function pintar(){
    pintarSelo();
    const c = $('#nv-conta'); if(!c) return;
    let h;
    if(estado==='sem-conta') h = `<p class="hint" style="margin:0">${T('Entre na conta SolverONE (cartão acima) para guardar as suas histórias na conta e ver nos outros aparelhos.','Sign in to your SolverONE account (card above) to keep your stories in the account and see them on your other devices.')}</p>`;
    else if(estado==='indisponivel') h = `<p class="hint" style="margin:0">${motivo==='navegador' ? T('Este navegador não deixa guardar a chave com segurança (janela anônima?). Abra o app normalmente para usar.','This browser does not let the key be stored safely (private window?). Open the app normally to use it.')
        : motivo==='desligado' ? T('A SolverONE desligou isto por agora. As suas histórias continuam neste aparelho.','SolverONE switched this off for now. Your stories stay on this device.')
        : T('Em preparação: em breve as suas histórias vão poder ir para a conta, cifradas. Por enquanto, ficam neste aparelho (use a cópia protegida para levar).','Coming soon: your stories will be able to go to the account, encrypted. For now, they stay on this device (use the protected copy to move them).')}</p>`;
    else if(estado==='sem-internet') h = `<p class="hint" style="margin:0">${T('Sem internet agora. Quando voltar, este cartão mostra as opções.','No internet right now. When it is back, this card shows the options.')}</p>`;
    else if(estado==='nova') h = `<p class="hint" style="margin:0">${T('Guarde as suas histórias, onde parou e os ajustes na conta, cifrados, e veja tudo nos outros aparelhos. Continua funcionando sem internet.','Keep your stories, where you stopped and settings in the account, encrypted, and see everything on your other devices. It still works offline.')}</p>
        <div style="height:10px"></div><button class="btn sm pri" id="nv-ligar">☁️ ${T('Ligar (4 passos)','Switch on (4 steps)')}</button>`;
    else if(estado==='trancada') h = `<p class="hint" style="margin:0">${T('A sua conta já guarda histórias de outro aparelho. Para trazer para cá, digite o código de recuperação.','Your account already keeps stories from another device. To bring them here, type the recovery code.')}</p>
        <div style="height:10px"></div><button class="btn sm pri" id="nv-codigo-btn">🔑 ${T('Digitar o código','Type the code')}</button>`;
    else {
      const n = quantasPendentes(), nc = Object.keys(st.conflitos).length;
      const minhas = historias.filter(x=>!doAcervo(x)).length;
      h = `<p class="hint" style="margin:0">${rodando ? '⏳ '+T('Conferindo com a conta…','Checking with the account…')
          : nc ? '✋ '+T('Falta escolher qual fica','Still need to choose which stays')
          : n ? '⏳ '+n+' '+T('mudança(s) aguardando para subir','change(s) waiting to go up')
          : '✓ '+T('Tudo salvo na sua conta','Everything saved in your account')} · ${minhas} ${T('história(s) suas','story(ies) of yours')}</p>
        ${erro ? `<p class="hint" style="color:var(--vermelho)">${esc(erro)}</p>` : ''}
        ${nc ? `<div class="aviso" style="margin-top:10px">✋ ${nc} ${T('história(s) mudaram em dois aparelhos','story(ies) changed on two devices')} <button class="btn sm" id="nv-escolher" style="margin-top:8px">${T('Escolher qual fica','Choose which stays')}</button></div>` : ''}
        ${segurando.length ? `<div class="aviso" style="margin-top:10px">${segurando.length} ${T('histórias saíram deste aparelho de uma vez. Tirar também da conta (e dos outros aparelhos)?','stories left this device at once. Remove them from the account (and other devices) too?')}
          <div class="linha" style="margin-top:8px"><button class="btn sm" id="nv-apagar-sim">${T('Tirar da conta','Remove from account')}</button><button class="btn sm" id="nv-apagar-nao">${T('Trazer de volta','Bring them back')}</button></div></div>` : ''}
        <div class="linha" style="margin-top:10px"><button class="btn sm" id="nv-agora">🔄 ${T('Conferir agora','Check now')}</button></div>
        <div style="height:10px"></div><button class="linkzinho" style="margin:0" id="nv-desligar">${T('Desligar neste aparelho','Switch off on this device')}</button>`;
    }
    c.innerHTML = h;
    const b = (sel, fn)=>{ const e = $(sel); if(e) e.onclick = fn; };
    b('#nv-ligar', primeiraVez); b('#nv-codigo-btn', pedirCodigo); b('#nv-escolher', escolher);
    b('#nv-agora', ()=>sincronizar(null, true).catch(()=>{})); b('#nv-desligar', ()=>desligarAqui(true));
    b('#nv-apagar-sim', ()=>{ st.liberado = segurando.slice(); segurando = []; sincronizar(); });
    b('#nv-apagar-nao', ()=>{ segurando.forEach(id=>{ const k = st.h[id]; if(k && k.c){ historias.push(novaDe(id, k.c)); } }); segurando = []; salvarAqui(); pintarTudo(); sincronizar(); });
  }
  const outros = ()=> (estado==='ligada' && st && st.outros) || {leituras:0, segundos:0, sequencia:0};

  function iniciar(){
    document.addEventListener('ch:conta', ()=>{ if(Plataforma.uid()!==U) avaliar(); });   // entrou, saiu ou trocou de conta
    document.addEventListener('dgo:idioma', pintar);
    window.addEventListener('online', ()=>{ if(estado==='ligada') sincronizar(); else if(estado==='sem-internet') avaliar(); });
    window.addEventListener('offline', pintarSelo);
    // ao sair do app, sobe o que estiver pendente; ao voltar, traz o que mudou nos outros aparelhos
    document.addEventListener('visibilitychange', ()=>{ if(estado==='ligada' && (!document.hidden || quantasPendentes())) sincronizar(); });
    setInterval(()=>{ if(estado==='ligada' && !document.hidden) sincronizar(); }, 120000);
    return avaliar();
  }
  return { iniciar, mudou, sincronizar, desligarAqui, outros, estado: ()=>estado, pendentes: quantasPendentes };
})();

/* ---------- guardar a voz num arquivo e trazer de volta ----------
   Para levar a voz para outro aparelho, para o endereço novo (solverone.com.br) ou para ter uma cópia.
   Um arquivo só, sem conversão (o áudio vai do jeito que está guardado), então pesa o mesmo que a voz. */
(function(){ const e=$('#aviso-voz-arquivo'); const p=()=>{ e.textContent = T('Este arquivo não tem senha: o cumprimento com os nomes das crianças não vai nele (os nomes só saem na cópia protegida).','This file has no password: the greeting with the children\'s names is not in it (names only leave in the protected copy).'); }; p(); document.addEventListener('dgo:idioma', p); })();
$('#btn-voz-exportar').addEventListener('click', async ()=>{
  const b = $('#btn-voz-exportar'), rot = b.innerHTML;
  b.disabled = true; b.innerHTML = '<span class="load"></span>';
  try{
    const todos = await Guarda.tudo(), itens = [], blobs = []; let cumprimentos = 0;
    // o cumprimento ("Olá <nomes das crianças>…") não vai neste arquivo, que não tem senha: o nome ficaria em claro nele
    todos.itens.forEach((it,i)=>{ if(/^saudacao\|/.test(it.k)){ cumprimentos++; return; } itens.push(it); blobs.push(todos.blobs[i]); });
    if(!itens.length){ toast(T('Ainda não há voz guardada','No saved voice yet')); return; }
    const completos = {};
    historias.forEach(h=>{ if(h.audioCompleto && Object.keys(h.audioCompleto).length) completos[h.id] = h.audioCompleto; });
    const indice = new TextEncoder().encode(JSON.stringify({v:1, app:'contador-de-historias', em:new Date().toISOString(), itens, completos}));
    const cab = new Uint8Array(10); 'CHVOZ1'.split('').forEach((c,i)=>cab[i]=c.charCodeAt(0));
    new DataView(cab.buffer).setUint32(6, indice.length, true);
    const arq = new Blob([cab, indice].concat(blobs), {type:'application/octet-stream'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(arq);
    a.download = 'contador-voz-'+new Date().toISOString().slice(0,10)+'.chvoz';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href), 60000);
    toast(T('Arquivo com ','File with ')+fmtBytes(arq.size)+T(' pronto — guarde num lugar seguro',' ready — keep it somewhere safe')+(cumprimentos ? T(' (o cumprimento com os nomes das crianças não vai neste arquivo)',' (the greeting with the children\'s names is not in this file)') : ''), 6000);
  }catch(e){ toast(T('Não consegui: ','Could not: ')+(e.message||e)); }
  finally{ b.disabled = false; b.innerHTML = rot; }
});
$('#btn-voz-importar').addEventListener('click', ()=>$('#file-voz').click());
$('#file-voz').addEventListener('change', async e=>{
  const f = e.target.files && e.target.files[0]; e.target.value = '';
  if(!f) return;
  const b = $('#btn-voz-importar'), rot = b.innerHTML; b.disabled = true;
  try{
    const r = await Guarda.importar(f, (j,n)=>{ b.innerHTML = '<span class="load"></span> '+j+'/'+n; });
    // devolve às histórias a marca de "voz inteira" que veio no arquivo
    let marcou = 0;
    Object.keys(r.completos).forEach(id=>{
      const h = historias.find(x=>x.id===id); if(!h) return;
      h.audioCompleto = Object.assign({}, r.completos[id], h.audioCompleto||{}); marcou++;
    });
    if(marcou) salvarHistorias();
    await atualizarVozGuardada(true); mostrarGuarda();
    toast('✅ '+r.novos+T(' trechos trazidos',' clips brought in')+(r.iguais ? ' · '+r.iguais+T(' já estavam aqui',' were already here') : ''), 4500);
  }catch(err){ toast(T('Não consegui: ','Could not: ')+(err.message||err), 5000); }
  finally{ b.disabled = false; b.innerHTML = rot; }
});

/* ---------- fila de voz: baixa a voz de uma lista de histórias, uma por vez, e insiste ----------
   A lista fica guardada (ch_fila_voz): fechar ou atualizar o app não perde a fila, e ao abrir de novo
   ela continua sozinha. Cota cheia, rede caindo ou servidor lotado: espera e tenta de novo (30 s, 1, 2
   e 5 min, depois a cada 10 min), sem limite. Só para quando insistir não adianta (sem chave, chave
   recusada, sem voz escolhida) ou quando a pessoa pausa. Com uma história aberta no leitor, a fila
   espera, para os dois não disputarem a cota. Trecho que já existe não é gerado de novo. */
const FilaVoz = (function(){
  const CH = 'ch_fila_voz';
  const ESPERAS = [30, 60, 120, 300, 600];
  let st = {ids:[], ligada:false, feitas:0, parou:''};
  try{ st = Object.assign(st, JSON.parse(localStorage.getItem(CH)||'{}')||{}); }catch(e){}
  if(!Array.isArray(st.ids)) st.ids = [];
  let rodando=false, agora='', acordar=null, trava=null, tentativa=0, trecho={feitos:0, total:0, id:''};
  const gravar = ()=>{ try{ localStorage.setItem(CH, JSON.stringify(st)); }catch(e){} };

  // espera que pode ser cortada (pausar, internet voltando)
  function esperar(seg){
    return new Promise(res=>{ const t = setTimeout(fim, seg*1000); function fim(){ clearTimeout(t); acordar=null; res(); } acordar = fim; });
  }
  function acordarJa(){ if(acordar) acordar(); }
  // a tela fica acesa enquanto a fila trabalha (com a tela apagada o celular congela o site)
  async function segurarTela(){
    try{
      if(!trava && rodando && 'wakeLock' in navigator && document.visibilityState==='visible'){
        trava = await navigator.wakeLock.request('screen');
        trava.addEventListener('release', ()=>{ trava = null; });
      }
    }catch(e){}
  }
  function soltarTela(){ try{ if(trava) trava.release(); }catch(e){} trava = null; }

  const statusDe = e => (e && e.status) || Number((String(e && e.message || '').match(/\b([1-5]\d\d)\b/)||[])[1]) || 0;
  function naoAdiantaInsistir(e){
    const msg = String(e && e.message || ''), s = statusDe(e);
    if(e && e.plataforma) return !e.passageiro;   // SolverONE: sem login, sem plano ou fim do saldo do mês não passam esperando
    if(e && e.cofreTrancado) return true;          // cofre trancado e PIN recusado: pausa e avisa
    if(/Cole sua chave|Escolha uma voz/i.test(msg)) return true;
    if(/quota|cota/i.test(msg)) return false;      // sem cota ou sem caracteres (ElevenLabs): espera e tenta de novo
    return s===400 || s===401 || s===403 || s===404;
  }
  // o motivo da pausa em linguagem de gente (o texto técnico do provedor não ajuda ninguém)
  function motivoClaro(e){
    if(e && e.plataforma) return e.message;
    const s = statusDe(e), msg = String(e && e.message || '');
    if(e && e.cofreTrancado) return msg;
    if(/Cole sua chave|Escolha uma voz/i.test(msg)) return msg;
    if(s===401 || s===403) return T('a chave de voz foi recusada (erro '+s+'). Confira ou troque a chave em Configurações → Voz e toque em Continuar.','the voice key was refused (error '+s+'). Check or replace the key in Settings → Voice and tap Resume.');
    if(s===400 || s===404) return T('o provedor não aceitou o pedido (erro '+s+'). Confira a voz e o modelo em Configurações → Voz e toque em Continuar.','the provider rejected the request (error '+s+'). Check the voice and model in Settings → Voice and tap Resume.');
    return msg;
  }
  const leitorAberto = ()=> document.body.classList.contains('com-leitor');

  async function trabalhar(){
    if(rodando) return;
    rodando = true; tentativa = 0; segurarTela(); pintar();
    try{
      if(Seg.precisaPerguntar()){
        try{ await Seg.abrir(T('A fila de voz precisa das chaves e dos nomes guardados no cofre.','The voice queue needs the keys and names saved in the vault.')); }
        catch(e){ parar(e.message); return; }
      }
      while(st.ligada && st.ids.length){
        if(cfg.motorVoz==='nativo'){ parar(T('Escolha uma voz de internet (Gemini, ElevenLabs ou OpenAI) em Configurações → Voz.','Choose an internet voice (Gemini, ElevenLabs or OpenAI) in Settings → Voice.')); break; }
        if(leitorAberto()){ agora = T('esperando você fechar a história aberta…','waiting for you to close the open story…'); pintar(); await esperar(5); continue; }
        if(navigator.onLine===false){ agora = T('sem internet — continuo quando voltar','offline — resuming when it is back'); pintar(); await esperar(60); continue; }
        const id = st.ids[0], h = historias.find(x=>x.id===id);
        if(!h){ if(!Dados.carregou()){ await Dados.esperar(); continue; } st.ids.shift(); gravar(); continue; }
        if(await umaHistoria(h)){
          st.ids.shift(); st.feitas = (st.feitas||0)+1; gravar();
          toast('✅ '+T('Voz pronta: ','Voice ready: ')+h.titulo, 3500);
          atualizarVozGuardada(true);
          if(telaAtual==='config') mostrarGuarda();
        }
      }
      if(st.ligada && !st.ids.length){ st.ligada = false; gravar(); toast(T('🎉 Fila de voz terminada','🎉 Voice queue finished'), 4500); }
    }finally{ rodando = false; agora = ''; soltarTela(); pintar(); }
  }

  // uma história: gera só os trechos que faltam. true = ficou inteira.
  async function umaHistoria(h){
    const marca = Guarda.marca();
    const f = Leitor.trechos(h, cfg.motorVoz);
    const falas = []; f.forEach((x,i)=>{ if(x.tipo==='fala' && !x.saudacao) falas.push(i); });   // sem o cumprimento: ele não fica guardado
    trecho = {feitos:0, total:falas.length, id:h.id};
    for(let n=0; n<falas.length; n++){
      if(!st.ligada || leitorAberto() || Guarda.marca()!==marca) return false;
      const i = falas[n], x = f[i];
      const ch = x.saudacao ? ('saudacao|'+marca+'|'+x.texto) : Guarda.chave(h.id, i, x.texto, marca);
      const tem = x.saudacao ? await Guarda.existe(ch) : await Guarda.acharFlex(h.id, i, x.texto, marca);
      if(!tem){
        agora = T('gerando o trecho ','generating clip ')+(n+1)+T(' de ',' of ')+falas.length; pintar();
        try{
          const blob = await gerarAudio(x.texto);
          await Guarda.guardar(ch, blob);
          tentativa = 0;
        }catch(e){
          if(naoAdiantaInsistir(e)){ parar(motivoClaro(e)); return false; }
          const seg = ESPERAS[Math.min(tentativa, ESPERAS.length-1)]; tentativa++;
          const hora = new Date(Date.now()+seg*1000).toLocaleTimeString(idiomaEN()?'en-US':'pt-BR', {hour:'2-digit', minute:'2-digit'});
          const oque = (statusDe(e)===429 || /quota|cota/i.test(e.message||'')) ? T('cota cheia','quota full') : T('não respondeu','no answer');
          agora = oque+' — '+T('tento de novo às ','retrying at ')+hora+' ('+T('tentativa ','attempt ')+tentativa+')';
          pintar();
          await esperar(seg);
          n--; continue;                                         // o mesmo trecho, de novo
        }
      }
      trecho.feitos = n+1; pintar();
    }
    // inteira nesta voz: é o que acende o selo ⚡ e a faixa 🟢 no leitor
    const semSaudacao = f.filter(x=>x.tipo==='fala' && !x.saudacao).length;
    h.audioCompleto = Object.assign({}, h.audioCompleto||{}, {[marca]: semSaudacao});
    h.audioMarca = marca; h.audioPronto = true; h.audioParcial = falas.length; h.audioTotal = falas.length;
    salvarHistorias();
    return true;
  }

  function parar(msg){
    st.ligada = false; st.parou = msg || ''; gravar(); acordarJa();
    if(msg) toast(T('Fila de voz pausada: ','Voice queue paused: ')+msg, 6000);
    pintar();
  }
  function continuar(){
    if(!st.ids.length) return;
    if(cfg.motorVoz==='nativo'){ toast(T('Escolha antes uma voz de internet em Configurações → Voz','First choose an internet voice in Settings → Voice'), 4000); return; }
    st.ligada = true; st.parou = ''; gravar(); pintar(); trabalhar();
  }
  function adicionar(ids){
    let n = 0;
    ids.forEach(id=>{ if(!st.ids.includes(id)){ st.ids.push(id); n++; } });
    gravar();
    toast(n ? n+T(' história(s) na fila de voz',' story(ies) added to the voice queue') : T('Já estava na fila','Already in the queue'));
    continuar();
  }
  function esvaziar(){
    if(!st.ids.length) return;
    if(!confirm(T('Tirar todas as histórias da fila? A voz que já foi baixada continua guardada.','Remove every story from the queue? Voice already downloaded stays saved.'))) return;
    st.ids = []; st.ligada = false; st.parou = ''; gravar(); acordarJa(); pintar();
  }

  // escolher as histórias: as que faltam já vêm fáceis de marcar
  function escolher(){
    if(cfg.motorVoz==='nativo'){ toast(T('Escolha antes uma voz de internet em Configurações → Voz','First choose an internet voice in Settings → Voice'), 4000); return; }
    const marca = Guarda.marca();
    const estado = h=>{
      if(st.ids.includes(h.id)) return ['fila', T('📥 na fila','📥 queued')];
      if(vozesCompletas(h).includes(marca)) return ['inteira', T('✅ inteira','✅ complete')];
      const r = VOZ_GUARDADA.get(h.id);
      return (r && r.marcas[marca]) ? ['parte', T('◐ em parte','◐ partial')] : ['nada', T('○ sem voz','○ no voice')];
    };
    const itens = historias.map(h=>({h, e:estado(h)}));
    modal(`<h3>📥 ${T('Fila de voz','Voice queue')}</h3>
      <p class="hint">${T('Voz','Voice')}: <b>${esc(nomeMarca(marca))}</b>. ${T('Marque as histórias. A fila baixa uma por vez e insiste sozinha quando a cota acaba.','Tick the stories. The queue downloads one at a time and keeps retrying when the quota runs out.')}</p>
      <div class="linha" style="margin-top:10px">
        <button class="btn sm" id="fv-faltam">${T('Marcar as que faltam','Tick the missing ones')}</button>
        <button class="btn sm ghost" id="fv-nenhuma">${T('Desmarcar','Untick all')}</button>
      </div>
      <div class="fv-lista">${itens.map(({h,e})=>`<label class="fv-it${e[0]==='fila'?' fila':''}"><input type="checkbox" value="${esc(h.id)}" data-estado="${e[0]}"${e[0]==='fila'?' disabled checked':''}><span class="t">${esc(h.titulo)}</span><small>${e[1]}</small></label>`).join('')}</div>
      <button class="btn ok" id="fv-ok">📥 ${T('Pôr na fila','Add to queue')}: <span id="fv-n">0</span></button>
      <div style="height:10px"></div><button class="btn sm ghost" id="fv-f">${T('Cancelar','Cancel')}</button>`);
    const caixas = ()=>$$('.fv-lista input:not([disabled])');
    const contar = ()=>{ $('#fv-n').textContent = caixas().filter(c=>c.checked).length; };
    caixas().forEach(c=>c.addEventListener('change', contar));
    $('#fv-faltam').onclick = ()=>{ caixas().forEach(c=>{ c.checked = c.dataset.estado!=='inteira'; }); contar(); };
    $('#fv-nenhuma').onclick = ()=>{ caixas().forEach(c=>{ c.checked = false; }); contar(); };
    $('#fv-f').onclick = fecharModal;
    $('#fv-ok').onclick = ()=>{
      const ids = caixas().filter(c=>c.checked).map(c=>c.value);
      if(!ids.length){ toast(T('Marque pelo menos uma história','Tick at least one story')); return; }
      fecharModal(); adicionar(ids);
    };
  }

  function pintar(){
    const n = st.ids.length, h = n ? historias.find(x=>x.id===st.ids[0]) : null;
    const andamento = (h && trecho.id===h.id && trecho.total) ? ' · '+trecho.feitos+'/'+trecho.total : '';
    const el = $('#fila-voz-status');
    if(el){
      if(!n) el.innerHTML = T('Nenhuma história na fila.','No stories in the queue.');
      else if(st.ligada) el.innerHTML = `<b>${n}</b> ${T('na fila','queued')} · ${esc(h ? h.titulo : '')}${andamento}<br>${esc(agora || T('trabalhando…','working…'))}`;
      else el.innerHTML = `<b>${n}</b> ${T('na fila, pausada','queued, paused')}${st.parou ? '<br><span style="color:var(--vermelho)">'+esc(st.parou)+'</span>' : ''}`;
    }
    const alt = $('#btn-fila-alternar');
    if(alt){ alt.textContent = st.ligada ? T('⏸ Pausar','⏸ Pause') : T('▶️ Continuar','▶️ Resume'); alt.disabled = !n; }
    const lim = $('#btn-fila-limpar'); if(lim) lim.classList.toggle('oculto', !n);
    const prep = $('#fila-voz-prep'); if(prep) prep.classList.toggle('oculto', !(st.ligada && n));
    const bar = $('#fila-voz-barra'); if(bar) bar.style.width = (trecho.total && h && trecho.id===h.id ? trecho.feitos/trecho.total*100 : 0)+'%';
    // no Início, uma linha discreta enquanto ela trabalha
    const ini = $('#inicio-fila');
    if(ini){
      ini.classList.toggle('oculto', !(st.ligada && n));
      if(st.ligada && n) ini.textContent = '📥 '+T('Baixando vozes','Downloading voices')+': '+n+' '+T('na fila','queued')+andamento+' · '+(agora || T('trabalhando…','working…'));
    }
  }

  function iniciar(){
    $('#btn-fila-escolher').addEventListener('click', escolher);
    $('#btn-fila-alternar').addEventListener('click', ()=>{ st.ligada ? parar('') : continuar(); });
    $('#btn-fila-limpar').addEventListener('click', esvaziar);
    $('#inicio-fila').addEventListener('click', ()=>{ irTela('config'); setTimeout(()=>{ const e=$('#fila-voz-status'); if(e) e.scrollIntoView({block:'center', behavior:'smooth'}); }, 250); });
    window.addEventListener('online', acordarJa);
    document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='visible'){ segurarTela(); acordarJa(); } });
    document.addEventListener('dgo:idioma', pintar);
    pintar();
    // a fila que ficou ligada continua sozinha ao abrir o app
    if(st.ligada && st.ids.length) setTimeout(()=>{ toast(T('📥 Continuando a fila de voz…','📥 Resuming the voice queue…')); trabalhar(); }, 4000);
  }
  return { iniciar, adicionar, escolher, continuar, pausar:()=>parar(''), estado:()=>JSON.parse(JSON.stringify(st)), acordar:acordarJa, rodando:()=>rodando };
})();
FilaVoz.iniciar();

/* ---------- anúncios: faixa em carrossel no topo, igual aos outros apps ----------
   A lista vem de um arquivo, na ordem: anuncios.json deste repositório (se um dia existir, para
   uma lista só deste app) → lista central do RootifyONE (/solverone-dados/anuncios.json) →
   anuncios.json do portal → a lista de reserva abaixo (sem internet e sem nada guardado).
   O app nunca anuncia a si mesmo. Assinante e anunciante não veem anúncio. */
const Anuncios = (function(){
  const SITE_BASE = location.origin + '/';
  const FONTES = ['anuncios.json', '/solverone-dados/anuncios.json', '/anuncios.json'];
  const CH_FECHADO = 'ch_anuncio_fechado', CH_CONTA = 'ch_anuncios_contagem';
  const RESERVA = [
    { id:'moneytrio', nome:'MoneyTRIO', cor:'#d6a076', glifo:'💰', link:SITE_BASE+'investify-me/',
      frase:{pt:'Você sabe quanto gastou este mês? A resposta costuma surpreender.', en:'Do you know what you spent this month? The answer usually surprises.'} },
    { id:'rise-one', nome:'RiseONE', cor:'#beb0ec', glifo:'🏃', link:SITE_BASE+'rise-one/',
      frase:{pt:'O treino que você não registra é o treino que você esquece.', en:"The workout you don't log is the workout you forget."} },
    { id:'omnilife-one', nome:'OmniLifeONE', cor:'#e4a460', glifo:'🧩', link:SITE_BASE+'omnilife-one/',
      frase:{pt:'A casa, a agenda e os documentos da família num lugar só.', en:'Home, calendar and family papers in one place.'} },
    { id:'planos-candidatos-2026', nome:{pt:'Eleições 2026', en:'Elections 2026'}, cor:'#a4c4a6', glifo:'🗳️', link:SITE_BASE+'planos-candidatos-2026/',
      frase:{pt:'Antes de decidir o seu voto, leia o que eles escreveram.', en:'Before deciding your vote, read what they actually wrote.'} },
    { id:'cifras-violao', nome:{pt:'Cifras e Acordes', en:'Chords'}, cor:'#eaa4b8', glifo:'🎸', link:SITE_BASE+'cifras-violao/',
      frase:{pt:'Aquela música que você sempre quis tocar está a um tom de distância.', en:'That song you always wanted to play is one key away.'} }
  ];
  const DOMINIOS = ['marceloneco.github.io','solverone.com.br','www.solverone.com.br'];
  let lista = null, cfgAd = { velocidade:40 }, chave = '', contouExibicao = false;

  // texto em PT/EN: aceita "texto" ou {pt, en}
  const txt = v => v && typeof v==='object' ? (idiomaEN() ? (v.en||v.pt) : (v.pt||v.en)) || '' : (v||'');
  // link de outro app da família: fica no endereço atual (solverone.com.br ou github.io), sem trocar de origem
  function linkDe(a){
    try{
      const u = new URL(a.link || SITE_BASE, location.href);
      if(DOMINIOS.includes(u.hostname) && DOMINIOS.includes(location.hostname)) return location.origin + u.pathname + u.search + u.hash;
      return u.href;
    }catch(e){ return SITE_BASE; }
  }
  function ehEsteApp(a){ return String(a.id||'').toLowerCase()==='contador-de-historias' || /\/contador-de-historias\/?(\?|#|$)/.test(a.link||''); }
  function daFaixa(){
    return (lista || RESERVA).filter(a=>a && a.ativo!==false && !ehEsteApp(a) && (!a.onde || a.onde.includes('faixa')));
  }
  function fechado(){ try{ return sessionStorage.getItem(CH_FECHADO)==='1'; }catch(e){ return false; } }
  function semAnuncio(){ try{ return !!(window.DGO && DGO.sessao && DGO.sessao().semAnuncios); }catch(e){ return false; } }
  function contar(id, k){
    try{
      const s = JSON.parse(localStorage.getItem(CH_CONTA)||'{}') || {};
      s[id] = s[id] || {v:0, c:0}; s[id][k]++;
      localStorage.setItem(CH_CONTA, JSON.stringify(s));
    }catch(e){}
  }
  function icone(a){
    const g = esc(a.glifo || a.emoji || '✨'), cor = /^#[0-9a-f]{3,8}$/i.test(a.cor||'') ? a.cor : '';
    if(a.imagem) return `<img class="ad-ico" src="${esc(a.imagem)}" alt="" loading="lazy">`;
    return `<span class="ad-ico" aria-hidden="true"${cor ? ` style="background:${cor}"` : ''}>${g}</span>`;
  }
  function pintar(){
    const faixa = $('#ad-faixa'); if(!faixa) return;
    const ads = daFaixa();
    const mostrar = ads.length && !fechado() && !semAnuncio() && Rec.ligado('anuncios', true);
    faixa.hidden = !mostrar;
    $('#ad-tag').textContent = T('ANÚNCIO','AD');
    $('#ad-fechar').setAttribute('aria-label', T('Fechar anúncios','Close ads'));
    $('#ad-fechar').title = T('Fechar anúncios','Close ads');
    faixa.setAttribute('aria-label', T('Anúncios','Ads'));
    if(!mostrar) return;
    const k = (idiomaEN()?'en':'pt') + ads.map(a=>a.id).join();
    if(k===chave) return; chave = k;
    const um = ads.map(a=>`<a class="ad-item" href="${esc(linkDe(a))}" target="_blank" rel="noopener" data-ad="${esc(a.id||'')}">${icone(a)}<b>${esc(txt(a.nome||a.titulo))}</b><span class="ad-frase">${esc(txt(a.frase||a.texto))}</span></a>`).join('');
    // a lista vai duas vezes: quando a primeira sai pela esquerda, a cópia já está no lugar (laço sem costura)
    const tr = $('#ad-trilho');
    tr.innerHTML = um + um.replace(/class="ad-item"/g, 'class="ad-item" aria-hidden="true" tabindex="-1"');
    tr.style.setProperty('--ad-seg', Math.max(15, ads.length * (400/(cfgAd.velocidade||40)) * 2) + 's');
    if(!contouExibicao){ contouExibicao = true; ads.forEach(a=>contar(a.id,'v')); }
  }
  async function carregar(){
    for(const u of FONTES){
      try{
        const r = await fetch(u, {cache:'no-cache'});
        if(!r.ok) continue;
        const j = await r.json();
        if(j && Array.isArray(j.anuncios) && j.anuncios.length){ lista = j.anuncios; Object.assign(cfgAd, j.config||{}); break; }
      }catch(e){}
    }
    chave = ''; pintar();
  }
  function iniciar(){
    $('#ad-fechar').addEventListener('click', ()=>{ try{ sessionStorage.setItem(CH_FECHADO,'1'); }catch(e){} pintar(); });
    $('#ad-trilho').addEventListener('click', e=>{ const a = e.target.closest('[data-ad]'); if(a) contar(a.dataset.ad,'c'); });
    // no celular, um toque fora dos links pausa o carrossel e outro solta
    $('#ad-janela').addEventListener('touchstart', e=>{ if(!e.target.closest('a')) $('#ad-janela').classList.toggle('parado'); }, {passive:true});
    // imagem de anúncio que não carrega vira o glifo
    $('#ad-trilho').addEventListener('error', e=>{ const i=e.target; if(i.tagName==='IMG'){ const s=document.createElement('span'); s.className='ad-ico'; s.textContent='✨'; i.replaceWith(s); } }, true);
    document.addEventListener('dgo:idioma', ()=>{ chave=''; pintar(); });
    document.addEventListener('dgo:pronto', pintar);
    document.addEventListener('dgo:saiu', ()=>{ chave=''; pintar(); });
    // a faixa fechada volta no próximo login
    document.addEventListener('dgo:entrou', ()=>{ try{ sessionStorage.removeItem(CH_FECHADO); }catch(e){} chave=''; pintar(); });
    pintar();
    carregar();
  }
  return { iniciar, pintar };
})();
Anuncios.iniciar();

/* ---------- menos texto nas Configurações ----------
   Explicações longas ficam recolhidas num "Saiba mais". Nada some: só espera o toque. */
(function(){
  $$('#tela-config .info, #tela-config .ok, #tela-config .hint').forEach(el=>{
    if(el.id || el.closest('.lista-guarda') || (el.textContent||'').trim().length < 90) return;
    const d = document.createElement('details'); d.className='saiba';
    d.innerHTML = '<summary>Saiba mais</summary>';
    el.parentNode.insertBefore(d, el); d.appendChild(el);
  });
})();

/* ---------- AssistONE: ajuda no mesmo lugar em todas as telas ----------
   Personagem no canto, balão com a ajuda da tela atual, tour rápido, busca e uma dica por tela.
   O balão não entra no histórico: o Voltar do celular continua fechando as telas. */
var Assist = (function(){
  const CH = 'ch_assist';
  let mem = {}; try{ mem = JSON.parse(localStorage.getItem(CH)||'{}')||{}; }catch(e){ mem = {}; }
  mem.dicas = mem.dicas || {};
  const gravar = ()=>{ try{ localStorage.setItem(CH, JSON.stringify(mem)); }catch(e){} };
  const btn = $('#assist-btn'), balao = $('#assist-balao'), dica = $('#assist-dica');
  let tour = -1, dicaTimer = null;

  // o que dá para fazer em cada tela: título, frase, atalhos que já executam e a ajuda completa
  const TELAS = {
    inicio: { t:['Início','Home'], s:'home principal',
      f:['A história da noite, o que estava ouvindo e os atalhos.','Tonight\'s story, what you were listening to and the shortcuts.'],
      a:[ ['✨ Criar história','✨ Create a story', ()=>irTela('nova')], ['📚 Acervo','📚 Library', ()=>irTela('acervo')] ],
      d:['Toque numa história para ouvir. "Continuar ouvindo" retoma de onde parou. O 🎲 sorteia outra sugestão.',
         'Tap a story to listen. "Keep listening" resumes where you stopped. The 🎲 picks another suggestion.'] },
    acervo: { t:['Acervo','Library'], s:'histórias biblioteca buscar favoritas lidas',
      f:['Todas as histórias, com busca e filtros por idade e estado.','Every story, with search and filters by age and state.'],
      a:[ ['🔎 Buscar','🔎 Search', ()=>{ const b=$('#busca'); if(b){ b.focus(); } }], ['★ Favoritas','★ Favourites', ()=>{ const b=$('#filtro-estado [data-estado=fav]'); if(b) b.click(); }] ],
      d:['Os filtros de cima combinam entre si. O selo ⚡ mostra quem já tem voz guardada; a ↓ baixa a voz para ouvir sem internet.',
         'The top filters combine. The ⚡ badge shows stories with saved voice; ↓ downloads the voice to listen offline.'] },
    nova: { t:['Criar','Create'], s:'nova história ia escrever gerar',
      f:['A IA escreve a partir dos seus pedidos, ou você mesmo escreve.','The AI writes from your requests, or you write it yourself.'],
      a:[ ['🎲 Sortear tema','🎲 Shuffle topic', ()=>{ const b=$('#btn-mais-temas'); if(b) b.click(); }], ['✍️ Eu escrevo','✍️ I write', ()=>{ const b=$('#modo-nova [data-modo=manual]'); if(b) b.click(); }] ],
      d:['Só o tema é obrigatório: o resto pode ficar em branco. Para gerar, é preciso uma chave de IA em Configurações.',
         'Only the topic is required: the rest can stay blank. Generating needs an AI key in Settings.'] },
    config: { t:['Configurações','Settings'], s:'configurações chave voz ia backup',
      f:['Voz, IA, chaves, backup e o que mais o app precisa.','Voice, AI, keys, backup and whatever else the app needs.'],
      a:[ ['🔑 Chaves de IA','🔑 AI keys', ()=>rolarAte('#cofre-lista')], ['🔊 Motor de voz','🔊 Voice engine', ()=>rolarAte('#sel-motor-voz')], ['📥 Fila de voz','📥 Voice queue', ()=>rolarAte('#fila-voz-status')], ['🆕 Novidades','🆕 What\'s new', ()=>{ const b=$('#btn-novidades'); if(b) b.click(); }] ],
      d:['Cada seção tem um "Saiba mais" com a explicação completa. As chaves ficam só neste aparelho.',
         'Each section has a "Learn more" with the full explanation. Keys stay on this device only.'] }
  };
  const TOUR = [
    ['#hd-marca', 'Toque no nome do app para voltar ao Início, de qualquer lugar.', 'Tap the app name to go back Home from anywhere.'],
    ['nav.tabs', 'A barra de baixo leva ao Início, ao Acervo, a Criar e às Configurações.', 'The bottom bar takes you Home, to the Library, Create and Settings.'],
    ['#btn-menu', 'O ☰ abre o menu com todas as telas, a busca e as mensagens.', 'The ☰ opens the menu with every screen, search and messages.'],
    ['#btn-perfil-topo', 'O perfil mostra quem está conectado e abre Configurações, tema, som e Sair.', 'The profile shows who is signed in and opens Settings, theme, sound and Sign out.'],
    ['#assist-btn', 'Eu fico sempre aqui. Toque quando precisar de ajuda.', 'I\'m always here. Tap whenever you need help.']
  ];
  const i = k => T(k[0], k[1]);
  function rolarAte(sel){
    const el = $(sel); if(!el) return;
    el.scrollIntoView({block:'center', behavior:'smooth'});
    el.classList.add('tour-alvo'); setTimeout(()=>el.classList.remove('tour-alvo'), 1800);
  }
  const norm = s => String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function distancia(a, b){
    const m=a.length, n=b.length; if(!m) return n; if(!n) return m;
    let ant = Array.from({length:n+1}, (_,j)=>j);
    for(let x=1; x<=m; x++){
      const cur=[x];
      for(let y=1; y<=n; y++) cur[y] = Math.min(ant[y]+1, cur[y-1]+1, ant[y-1] + (a[x-1]===b[y-1] ? 0 : 1));
      ant = cur;
    }
    return ant[n];
  }
  // índice da busca: as telas e os títulos das seções das Configurações
  function indice(){
    const it = [];
    Object.keys(TELAS).forEach(k=>it.push({r:i(TELAS[k].t), s:TELAS[k].s, ir:()=>irTela(k)}));
    $$('#tela-config .tit').forEach(el=>{
      const r = el.textContent.trim();
      it.push({r, s:'configurações settings', ir:()=>{ irTela('config'); setTimeout(()=>rolarAte('#'+(el.id || (el.id='tit-'+it.length))), 250); }});
    });
    return it;
  }
  function buscar(q){
    q = norm(q).trim(); const todos = indice();
    if(!q) return {lista:[], parecidos:[]};
    const lista = todos.filter(x=>norm(x.r+' '+x.s).includes(q));
    if(lista.length) return {lista, parecidos:[]};
    const parecidos = todos.map(x=>({x, d:Math.min(...norm(x.r+' '+x.s).split(/\s+/).map(w=>distancia(q, w)))}))
      .sort((a,b)=>a.d-b.d).slice(0,3).filter(p=>p.d <= Math.max(2, Math.floor(q.length/2))).map(p=>p.x);
    return {lista:[], parecidos};
  }

  function aberto(){ return !balao.hidden; }
  const ativo = ()=>cfg.assistOne && Rec.ligado('assistone', true);
  function abrir(modo){
    if(!ativo()) return;
    esconderDica();
    const tela = TELAS[telaAtual] || TELAS.inicio;
    const boasVindas = modo==='boasvindas';
    balao.innerHTML = `
      <h4>${boasVindas ? T('Olá! Eu sou o AssistONE 👋','Hi! I\'m AssistONE 👋') : 'AssistONE'}</h4>
      <div class="onde"><b>📍 ${T('Você está em','You are in')} ${i(tela.t)}</b><p>${i(tela.f)}</p>
        ${tela.a.map((a,k)=>`<button data-atalho="${k}">${T(a[0],a[1])}</button>`).join('')}</div>
      <div class="opc">
        <button data-op="tour">🧭 ${T('Tour rápido','Quick tour')}</button>
        <button data-op="busca">🔍 ${T('Procurar algo','Find something')}</button>
        <button data-op="ajuda">❓ ${T('Ajuda desta tela','Help for this screen')}</button>
      </div>
      <div id="assist-busca" hidden><input type="text" placeholder="${T('O que você procura?','What are you looking for?')}" aria-label="${T('Procurar','Search')}"><div class="res"></div></div>
      <div class="rodape"><button data-op="fechar">${T('Agora não','Not now')}</button><button data-op="desligar">${T('Desligar o AssistONE','Turn AssistONE off')}</button></div>`;
    balao.hidden = false; btn.setAttribute('aria-expanded','true');
    $$('#assist-balao [data-atalho]').forEach(b=>b.addEventListener('click',()=>{ fechar(); tela.a[Number(b.dataset.atalho)][2](); }));
    $$('#assist-balao [data-op]').forEach(b=>b.addEventListener('click',()=>{
      const op = b.dataset.op;
      if(op==='fechar') fechar();
      if(op==='desligar'){ fechar(); cfg.assistOne=false; salvarCfg(); aplicar(); const tg=$('#tg-assist'); if(tg) tg.classList.remove('on'); toast(T('AssistONE desligado. Religue em Configurações → AssistONE.','AssistONE off. Turn it back on in Settings → AssistONE.'), 4000); }
      if(op==='tour'){ fechar(); iniciarTour(); }
      if(op==='ajuda'){ fechar(); modal(`<h3>${i(tela.t)}</h3><p class="hint" style="font-size:14px">${i(tela.d)}</p><div style="height:14px"></div><button class="btn sm ghost" id="mfechar">${T('Fechar','Close')}</button>`); $('#mfechar').onclick=fecharModal; }
      if(op==='busca'){ const bx=$('#assist-busca'); bx.hidden=false; bx.querySelector('input').focus(); }
    }));
    const inp = $('#assist-busca input'), res = $('#assist-busca .res');
    function pintarBusca(){
      const {lista, parecidos} = buscar(inp.value);
      const mostrar = lista.length ? lista : parecidos;
      res.innerHTML = (lista.length ? '' : (inp.value.trim() ? `<div class="nada">${T('Não achei.','Nothing found.')}${parecidos.length ? ' '+T('Você quis dizer…','Did you mean…') : ''}</div>` : ''))
        + mostrar.map((x,k)=>`<button class="btn sm ghost" data-res="${k}">${esc(x.r)}</button>`).join('');
      $$('#assist-busca [data-res]').forEach(b=>b.addEventListener('click',()=>{ fechar(); mostrar[Number(b.dataset.res)].ir(); }));
    }
    inp.addEventListener('input', pintarBusca);
    inp.addEventListener('keydown', e=>{ if(e.key==='Enter'){ const b=$('#assist-busca [data-res]'); if(b) b.click(); } });
  }
  function fechar(){
    if(!aberto()) return;
    balao.hidden = true; btn.setAttribute('aria-expanded','false');
    if(!mem.visto){ mem.visto = 1; gravar(); }
  }

  // tour: destaca um elemento por vez, com o texto no balão
  function iniciarTour(){ tour = -1; passoTour(); }
  function passoTour(){
    $$('.tour-alvo').forEach(x=>x.classList.remove('tour-alvo'));
    tour++;
    while(tour < TOUR.length){ const el=$(TOUR[tour][0]); if(el && el.offsetParent!==null) break; tour++; }
    if(tour >= TOUR.length){ tour=-1; balao.hidden=true; btn.setAttribute('aria-expanded','false'); toast(T('Fim do tour ✨','Tour done ✨')); return; }
    const p = TOUR[tour], el = $(p[0]);
    el.classList.add('tour-alvo'); el.scrollIntoView({block:'center', behavior:'smooth'});
    balao.innerHTML = `<h4>🧭 ${T('Tour rápido','Quick tour')} · ${tour+1}/${TOUR.length}</h4><p style="margin:6px 0 10px;font-size:14px">${T(p[1],p[2])}</p>
      <div class="rodape"><button data-t="sair">${T('Sair','Exit')}</button><button data-t="prox" style="color:var(--gold);font-weight:700;text-decoration:none">${T('Próximo ›','Next ›')}</button></div>`;
    balao.hidden = false; btn.setAttribute('aria-expanded','true');
    balao.querySelector('[data-t=prox]').onclick = passoTour;
    balao.querySelector('[data-t=sair]').onclick = ()=>{ $$('.tour-alvo').forEach(x=>x.classList.remove('tour-alvo')); tour=-1; fechar(); };
  }

  // uma dica curta por tela, uma vez só, alguns segundos depois de entrar
  function esconderDica(){ dica.hidden = true; clearTimeout(dicaTimer); }
  function aoTrocarTela(nome){
    esconderDica();
    if(!ativo() || Rec.valor('assistone.dicas', true)===false || aberto() || mem.dicas[nome] || !TELAS[nome]) return;
    dicaTimer = setTimeout(()=>{
      if(aberto() || document.body.classList.contains('com-modal') || document.body.classList.contains('com-leitor') || telaAtual!==nome) return;
      mem.dicas[nome] = 1; gravar();
      dica.innerHTML = `💡 ${i(TELAS[nome].f)}<br><button data-d="ok">${T('Entendi','Got it')}</button><button data-d="mais">${T('Mais ajuda','More help')}</button>`;
      dica.hidden = false;
      dica.querySelector('[data-d=ok]').onclick = esconderDica;
      dica.querySelector('[data-d=mais]').onclick = ()=>{ esconderDica(); abrir(); };
      dicaTimer = setTimeout(esconderDica, 9000);
    }, 2500);
  }

  function aplicar(){
    document.body.classList.toggle('sem-assist', !ativo()); if(!ativo()){ fechar(); esconderDica(); }
    const adm = $('#assist-admin');
    if(adm){ adm.hidden = Rec.ligado('assistone', true); adm.textContent = T('Desligado pela administração da SolverONE.','Turned off by the SolverONE administration.'); }
  }
  function recomecar(){ mem = {dicas:{}}; gravar(); toast(T('Dicas e passo a passo recomeçados','Tips and tour reset')); abrir('boasvindas'); }
  function iniciar(){
    aplicar();
    btn.addEventListener('click', ()=>{ if(aberto()) fechar(); else abrir(); });
    document.addEventListener('click', e=>{ if(aberto() && tour<0 && !balao.contains(e.target) && !btn.contains(e.target)) fechar(); });
    document.addEventListener('keydown', e=>{ if(e.key==='Escape' && aberto()){ $$('.tour-alvo').forEach(x=>x.classList.remove('tour-alvo')); tour=-1; fechar(); } });
    document.addEventListener('dgo:idioma', ()=>{ aplicar(); if(aberto() && tour<0) abrir(); });
    // primeira visita: apresenta-se, mas só quando nenhuma janela estiver aberta
    if(ativo() && !mem.visto){
      let tentativas = 0;
      const tentar = ()=>{ if(document.body.classList.contains('com-modal') || document.body.classList.contains('com-leitor')){ if(++tentativas<12) setTimeout(tentar, 2000); return; } abrir('boasvindas'); };
      setTimeout(tentar, 1500);
    }
  }
  return { iniciar, abrir, fechar, aplicar, recomecar, aoTrocarTela, buscar };
})();
chave('#tg-assist','assistOne', Assist.aplicar);
$('#btn-assist-abrir').addEventListener('click', ()=>{ if(!cfg.assistOne){ toast(T('Ligue o AssistONE primeiro','Turn AssistONE on first')); return; } Assist.abrir(); });
$('#btn-assist-reset').addEventListener('click', Assist.recomecar);

/* ---------- 📥 Mensagens (inbox) ----------
   Uma caixa só para: avisos do administrador (recados.json deste repositório e /solverone-dados/recados.json,
   publicados pelo RootifyONE, com início, fim e app de destino) e avisos do app (a versão nova).
   Funciona sem servidor. Marcar como lida e arquivar ficam em ch_inbox; nada é apagado sozinho. */
var Inbox = (function(){
  const CH = 'ch_inbox', APP = 'contador-de-historias';
  let st = {lidos:{}, arq:{}};
  try{ st = Object.assign(st, JSON.parse(localStorage.getItem(CH)||'{}')||{}); }catch(e){}
  const gravar = ()=>{ try{ localStorage.setItem(CH, JSON.stringify(st)); }catch(e){} };
  let externos = [];
  const txt = v => v && typeof v==='object' ? (idiomaEN() ? (v.en||v.pt) : (v.pt||v.en)) || '' : String(v||'');
  const iso = d => { const m = String(d||'').match(/^(\d{2})\/(\d{2})\/(\d{4})/); return m ? m[3]+'-'+m[2]+'-'+m[1] : String(d||'').slice(0,10); };
  function valido(r){
    if(!r || !r.id || r.ativo===false) return false;
    if(r.app && r.app!=='*' && r.app!==APP) return false;
    const h = hoje();
    if(r.inicio && iso(r.inicio) > h) return false;
    if(r.fim && iso(r.fim) < h) return false;
    return true;
  }
  async function buscarLista(url){
    try{
      const r = await fetch(url, {cache:'no-cache'}); if(!r.ok) return [];
      const j = await r.json(); const l = Array.isArray(j) ? j : (j && Array.isArray(j.recados) ? j.recados : []);
      return l.filter(valido).map(r=>({ id:'r:'+r.id, bruto:r, quando: iso(r.inicio||''), tipo:'admin' }));
    }catch(e){ return []; }
  }
  function doApp(){
    const v = HISTORICO[0];
    return [{ id:'v:'+v[0], titulo:T('Novidades da versão ','What\'s new in version ')+v[0], texto:v[2].slice(0,3).join(' · '), quando: iso(v[1]), tipo:'app', abrir: telaNovidades }];
  }
  function lista(){
    const m = new Map();
    externos.forEach(x=>m.set(x.id, Object.assign({}, x, {titulo: txt(x.bruto.titulo), texto: txt(x.bruto.texto)})));
    doApp().forEach(x=>m.set(x.id, x));
    return [...m.values()].sort((a,b)=>String(b.quando).localeCompare(String(a.quando)));
  }
  const naoLidos = ()=> lista().filter(x=>!st.lidos[x.id] && !st.arq[x.id]).length;
  const dataBonita = d => { try{ return (window.DGO && DGO.formatarData) ? DGO.formatarData(d) : d; }catch(e){ return d; } };
  function pintarBadge(){
    const n = naoLidos(), b = $('#inbox-badge');
    b.hidden = !n; b.textContent = n>99 ? '99+' : n;
    $('#btn-inbox-topo').setAttribute('aria-label', T('Mensagens','Messages') + (n ? ' — '+n+' '+T('não lidas','unread') : ''));
    $('#inbox-vivo').textContent = n ? n+' '+T('mensagens novas','new messages') : '';
    try{ if(navigator.setAppBadge){ n ? navigator.setAppBadge(n) : navigator.clearAppBadge(); } }catch(e){}
  }
  async function carregar(){
    const [a, b] = await Promise.all([buscarLista('recados.json'), buscarLista('/solverone-dados/recados.json')]);
    externos = [...a, ...b]; pintarBadge();
  }
  function abrir(aba){
    aba = aba || 'caixa';
    const its = lista().filter(x=> aba==='arq' ? st.arq[x.id] : !st.arq[x.id]);
    modal(`<h3>📥 ${T('Mensagens','Messages')}</h3>
      <div class="seg" style="margin-bottom:12px"><button class="${aba==='caixa'?'on':''}" data-ib-aba="caixa">${T('Caixa de entrada','Inbox')}</button><button class="${aba==='arq'?'on':''}" data-ib-aba="arq">${T('Arquivadas','Archived')}</button></div>
      ${its.length ? its.map(x=>`<div class="card" style="margin-bottom:10px;padding:14px">
          <b>${st.lidos[x.id] ? '' : '● '}${esc(x.titulo)}</b>
          <div class="hint" style="margin-top:4px;font-size:13px;color:var(--dim)">${esc(x.texto)}</div>
          <div class="hint">${x.tipo==='admin' ? T('Aviso da SolverONE','SolverONE notice') : T('Aviso do app','App notice')} · ${esc(dataBonita(x.quando))}</div>
          <div class="linha" style="margin-top:10px">
            ${x.abrir ? `<button class="btn sm" data-ib-ver="${x.id}">${T('Ver','Open')}</button>` : ''}
            ${st.lidos[x.id] ? '' : `<button class="btn sm ghost" data-ib-lido="${x.id}">${T('Marcar como lida','Mark as read')}</button>`}
            <button class="btn sm ghost" data-ib-arq="${x.id}">${aba==='arq' ? T('Desarquivar','Unarchive') : T('Arquivar','Archive')}</button>
          </div></div>`).join('') : `<p class="hint" style="font-size:14px">${T('Nada por aqui. Os avisos do app e da SolverONE chegam nesta caixa.','Nothing here. App and SolverONE notices arrive in this box.')}</p>`}
      <div style="height:8px"></div><button class="btn sm ghost" id="ib-f">${T('Fechar','Close')}</button>`);
    const marcar = id => { st.lidos[id] = Date.now(); gravar(); pintarBadge(); };
    $$('#modal [data-ib-aba]').forEach(b=>b.onclick=()=>abrir(b.dataset.ibAba));
    $$('#modal [data-ib-lido]').forEach(b=>b.onclick=()=>{ marcar(b.dataset.ibLido); abrir(aba); });
    $$('#modal [data-ib-arq]').forEach(b=>b.onclick=()=>{ const id=b.dataset.ibArq; if(st.arq[id]) delete st.arq[id]; else st.arq[id]=Date.now(); marcar(id); abrir(aba); });
    $$('#modal [data-ib-ver]').forEach(b=>b.onclick=()=>{ const id=b.dataset.ibVer; marcar(id); const it=lista().find(x=>x.id===id); fecharModal(); if(it && it.abrir) it.abrir(); });
    $('#ib-f').onclick = fecharModal;
  }
  function iniciar(){ pintarBadge(); carregar(); document.addEventListener('dgo:idioma', pintarBadge); }
  return { abrir, iniciar, naoLidos };
})();

/* ---------- 🔍 Busca do topo: histórias + telas e funções (índice do AssistONE) ---------- */
function abrirBusca(){
  modal(`<h3>🔍 ${T('Buscar','Search')}</h3>
    <input type="text" id="busca-geral" placeholder="${T('História, tela ou função','Story, screen or function')}" aria-label="${T('Buscar','Search')}" autocomplete="off">
    <div id="busca-geral-res" style="margin-top:10px;display:flex;flex-direction:column;gap:6px" aria-live="polite"></div>
    <div style="height:10px"></div><button class="btn sm ghost" id="bg-f">${T('Fechar','Close')}</button>`);
  const inp = $('#busca-geral'), res = $('#busca-geral-res');
  const norm = s => String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
  function pintar(){
    const q = inp.value.trim(); if(!q){ res.innerHTML=''; return; }
    const nq = norm(q);
    const hs = historias.filter(h=>norm(h.titulo+' '+(h.tema||'')+' '+(h.personagens||'')+' '+(h.serie||'')).includes(nq)).slice(0,8);
    const fn = Assist.buscar(q), fns = fn.lista.length ? fn.lista : fn.parecidos;
    res.innerHTML = (hs.length ? `<div class="tit" style="margin:4px 0">${T('Histórias','Stories')}</div>` : '')
      + hs.map((h,k)=>`<button class="btn sm ghost" data-bh="${k}" style="justify-content:flex-start">📖 ${esc(h.titulo)}</button>`).join('')
      + (fns.length ? `<div class="tit" style="margin:8px 0 4px">${T('Telas e funções','Screens and functions')}${fn.lista.length ? '' : ' · '+T('você quis dizer…','did you mean…')}</div>` : '')
      + fns.map((x,k)=>`<button class="btn sm ghost" data-bf="${k}" style="justify-content:flex-start">${esc(x.r)}</button>`).join('')
      + (!hs.length && !fns.length ? `<p class="hint" style="font-size:14px">${T('Não achei nada com esse nome.','Nothing found with that name.')}</p>` : '');
    $$('[data-bh]', res).forEach(b=>b.onclick=()=>{ fecharModal(); Leitor.abrir(hs[Number(b.dataset.bh)]); });
    $$('[data-bf]', res).forEach(b=>b.onclick=()=>{ fecharModal(); fns[Number(b.dataset.bf)].ir(); });
  }
  inp.addEventListener('input', pintar);
  inp.addEventListener('keydown', e=>{ if(e.key==='Enter'){ const b=res.querySelector('button'); if(b) b.click(); } });
  $('#bg-f').onclick = fecharModal;
  setTimeout(()=>inp.focus(), 60);
}

/* ---------- Topo padrão: ☰ gaveta, 👤 perfil (identidade conectada, Configurações, Tema, Som, Sair), tema ----------
   Diretriz "AssistONE igual em todo lugar + topo e menus padronizados" (02/Out/2026). */
var Topo = (function(){
  const gav = $('#menu-lateral'), fundo = $('#gaveta-fundo'), btnMenu = $('#btn-menu');
  const mp = $('#menu-perfil'), btnPerfil = $('#btn-perfil-topo');
  let desdeLocal = 0; try{ desdeLocal = Number(localStorage.getItem('ch_topo_desde'))||0; }catch(e){}

  // ---- tema e animações ----
  function aplicarTema(){
    const claro = cfg.tema==='claro';
    document.body.classList.toggle('tema-claro', claro);
    document.body.classList.toggle('sem-animacao', !!cfg.reduzirAnimacoes);
    $$('meta[name=theme-color]').forEach(m=>m.setAttribute('content', claro ? '#f6f2ff' : '#140f22'));
    const tg = $('#tg-tema'); if(tg){ tg.classList.toggle('on', claro); tg.setAttribute('aria-checked', String(claro)); }
    const tr = $('#tg-reduzir'); if(tr){ tr.classList.toggle('on', !!cfg.reduzirAnimacoes); tr.setAttribute('aria-checked', String(!!cfg.reduzirAnimacoes)); }
  }
  function alternarTema(){ cfg.tema = cfg.tema==='claro' ? 'escuro' : 'claro'; salvarCfg(); aplicarTema(); }

  // ---- identidade conectada (conta deste aparelho = módulo DGO; conta SolverONE = Plataforma) ----
  function identidade(){
    let s = null; try{ s = (window.DGO && DGO.sessao) ? DGO.sessao() : null; }catch(e){}
    const local = (s && s.tipo && s.tipo!=='visitante') ? Object.assign({tipo:s.tipo}, s.usuario||{}) : null;
    const nuvem = (typeof Plataforma!=='undefined' && Plataforma.conta) ? Plataforma.conta() : null;
    const nome = local ? (local.apelido || local.nome || local.email || '') : (nuvem ? String(nuvem.email||'').split('@')[0] : '');
    return { local, nuvem, nome, visitante: !local && !nuvem, foto: local && local.foto };
  }
  const iniciais = n => (String(n||'').trim().split(/[\s._@-]+/).filter(Boolean).slice(0,2).map(p=>p[0].toUpperCase()).join('')) || '👤';
  const tipoRot = t => ({pagante:T('Membro','Member'), anunciante:T('Anunciante','Advertiser'), visitante:T('Visitante','Guest')})[t] || t || '';
  const viaRot = v => ({senha:T('senha','password'), biometria:T('digital','fingerprint'), google:'Google'})[v] || v || T('senha','password');
  const dataDe = ms => ms ? new Date(ms).toISOString().slice(0,10) : '';
  function pintarTopo(){
    const id = identidade();
    btnPerfil.classList.toggle('com-nome', !id.visitante);
    btnPerfil.innerHTML = id.foto ? `<img src="${esc(id.foto)}" alt="">` : (id.visitante ? '👤' : esc(iniciais(id.nome)));
    const rot = id.visitante ? T('Visitante','Guest') : id.nome;
    const partes = [];
    if(id.local) partes.push(T('conta neste aparelho: ','account on this device: ')+(id.local.email||id.local.apelido||'')+' · '+tipoRot(id.local.tipo));
    if(id.nuvem) partes.push('SolverONE: '+id.nuvem.email+(id.nuvem.planoNome ? ' · '+id.nuvem.planoNome : ''));
    btnPerfil.setAttribute('aria-label', T('Perfil — ','Profile — ')+rot+(partes.length ? ' ('+partes.join('; ')+')' : ''));
    $('#perfil-nome').textContent = rot;
  }

  // ---- gaveta do ☰ ----
  const TELAS_MENU = ()=>[ ['inicio','🌙',T('Início','Home')], ['acervo','📚',T('Acervo','Library')], ['nova','✨',T('Criar','Create')], ['config','⚙️',T('Configurações','Settings')] ];
  function pintarGaveta(){
    gav.innerHTML = `<div class="gv-topo"><b>${T('UM Contador de Histórias','ONE Storyteller')}</b><button class="icobtn" type="button" data-gv="fechar" aria-label="${T('Fechar o menu','Close the menu')}">✕</button></div>`
      + TELAS_MENU().map(x=>`<button class="gv${telaAtual===x[0]?' on':''}" type="button" data-tela="${x[0]}"${telaAtual===x[0]?' aria-current="page"':''}><span class="i">${x[1]}</span>${x[2]}</button>`).join('')
      + `<hr>
         <button class="gv" type="button" data-gv="busca"><span class="i">🔍</span>${T('Buscar','Search')}</button>
         <button class="gv" type="button" data-gv="inbox"><span class="i">📥</span>${T('Mensagens','Messages')}${Inbox.naoLidos() ? ' <span class="badge" style="position:static;margin-left:auto">'+Inbox.naoLidos()+'</span>' : ''}</button>
         <button class="gv" type="button" data-gv="assist"><span class="i">💬</span>AssistONE</button>
         <button class="gv" type="button" data-gv="novidades"><span class="i">🆕</span>${T('Novidades','What\'s new')}</button>
         <button class="gv" type="button" data-gv="aviso"><span class="i">📄</span>${T('Aviso de uso','Terms of use')}</button>
         <div class="gv-rodape">${T('versão','version')} ${VERSAO}</div>`;
    $$('[data-tela]', gav).forEach(b=>b.onclick=()=>{ fecharGaveta(); const t=$('nav.tabs button[data-tela="'+b.dataset.tela+'"]'); if(t) t.click(); else irTela(b.dataset.tela); });
    $$('[data-gv]', gav).forEach(b=>b.onclick=()=>{
      const op = b.dataset.gv; fecharGaveta();
      if(op==='busca') abrirBusca();
      if(op==='inbox') Inbox.abrir();
      if(op==='assist'){ if(!cfg.assistOne){ toast(T('Ligue o AssistONE em Configurações','Turn AssistONE on in Settings')); } else setTimeout(()=>Assist.abrir(), 250); }
      if(op==='novidades') telaNovidades();
      if(op==='aviso') telaAviso();
    });
  }
  const gavetaAberta = ()=> document.body.classList.contains('com-menu');
  function abrirGaveta(){
    if(gavetaAberta()) return;
    fecharPerfil(); pintarGaveta();
    document.body.classList.add('com-menu'); btnMenu.setAttribute('aria-expanded','true'); gav.setAttribute('aria-hidden','false');
    Nav.empurrar('menu');
    const f = gav.querySelector('button.gv'); if(f) setTimeout(()=>f.focus(), 60);
  }
  function fecharGaveta(semHistorico){
    if(!gavetaAberta()) return;
    document.body.classList.remove('com-menu'); btnMenu.setAttribute('aria-expanded','false'); gav.setAttribute('aria-hidden','true');
    if(semHistorico!==true) Nav.tirar('menu');
    if(gav.contains(document.activeElement)) btnMenu.focus();
  }

  // ---- menu do 👤 ----
  const perfilAberto = ()=> mp.classList.contains('on');
  function pintarPerfil(){
    const id = identidade(), l = id.local, n = id.nuvem;
    const av = id.foto ? `<img src="${esc(id.foto)}" alt="">` : (id.visitante ? '👤' : esc(iniciais(id.nome)));
    const detalhe = id.visitante ? T('Sem conta: nada sai deste aparelho.','No account: nothing leaves this device.')
      : [l && (l.email||''), l && tipoRot(l.tipo), n && !l && n.email, n && n.planoNome].filter(Boolean).join(' · ');
    mp.innerHTML = `
      <div class="quem"><div class="av" aria-hidden="true">${av}</div><div style="min-width:0"><b>${esc(id.visitante ? T('Visitante','Guest') : id.nome)}</b><span>${esc(detalhe)}</span></div></div>
      ${l ? `<div class="ident"><span>📱 ${T('Conta neste aparelho','Account on this device')}: ${esc(l.email||l.apelido||'')} · ${esc(tipoRot(l.tipo))} · ${T('via','via')} ${esc(viaRot(l.via))}${desdeLocal ? ' · '+T('desde','since')+' '+dataDe(desdeLocal) : ''}</span><button type="button" data-mp="sair-local">${T('Sair','Sign out')}</button></div>`
          : `<div class="ident"><span>📱 ${T('Conta neste aparelho: nenhuma','Account on this device: none')}</span><button type="button" data-mp="entrar-local">${T('Entrar','Sign in')}</button></div>`}
      ${n ? `<div class="ident"><span>☁️ SolverONE: ${esc(n.email)}${n.planoNome ? ' · '+esc(n.planoNome) : ''}${n.desde ? ' · '+T('desde','since')+' '+dataDe(n.desde) : ''}</span><button type="button" data-mp="sair-nuvem">${T('Sair','Sign out')}</button></div>`
          : `<div class="ident"><span>☁️ SolverONE: ${T('não conectado','not signed in')}</span><button type="button" data-mp="entrar-nuvem">${T('Entrar','Sign in')}</button></div>`}
      <p class="nota">${T('São duas contas diferentes: a deste aparelho guarda histórias e chaves só aqui; a SolverONE dá a voz premium e a IA da plataforma.','They are two different accounts: this device\'s one keeps stories and keys here only; SolverONE gives the premium voice and the platform AI.')}</p>
      <hr>
      <button class="mp" type="button" role="menuitem" data-mp="config"><span class="i">⚙️</span>${T('Configurações','Settings')}</button>
      <button class="mp" type="button" role="menuitemcheckbox" aria-checked="${cfg.tema==='claro'}" data-mp="tema"><span class="i">🌓</span>${T('Tema claro','Light theme')}<span class="toggle${cfg.tema==='claro'?' on':''}" aria-hidden="true"></span></button>
      <button class="mp" type="button" role="menuitemcheckbox" aria-checked="${!!cfg.efeitos}" data-mp="som"><span class="i">🔊</span>${T('Efeitos sonoros','Sound effects')}<span class="toggle${cfg.efeitos?' on':''}" aria-hidden="true"></span></button>
      <button class="mp" type="button" role="menuitemcheckbox" aria-checked="${!!cfg.assistOne}" data-mp="assist"><span class="i">💬</span>AssistONE<span class="toggle${cfg.assistOne?' on':''}" aria-hidden="true"></span></button>
      ${id.visitante ? '' : `<hr><button class="mp sair" type="button" role="menuitem" data-mp="sair"><span class="i">🚪</span>${T('Sair','Sign out')}</button>`}`;
    $$('[data-mp]', mp).forEach(b=>b.onclick=()=>{
      const op = b.dataset.mp;
      if(op==='config'){ fecharPerfil(); const t=$('nav.tabs button[data-tela=config]'); if(t) t.click(); }
      if(op==='tema'){ alternarTema(); pintarPerfil(); }
      if(op==='som'){ $('#tg-efeitos').click(); pintarPerfil(); }
      if(op==='assist'){ $('#tg-assist').click(); pintarPerfil(); }
      if(op==='entrar-local'){ fecharPerfil(); try{ DGO.abrirLogin(); }catch(e){ toast(T('Login indisponível agora','Login unavailable now')); } }
      if(op==='entrar-nuvem'){ fecharPerfil(); Plataforma.entrar(); }
      if(op==='sair-local'){ try{ DGO.sair(); }catch(e){} toast(T('Você saiu da conta deste aparelho','Signed out of this device\'s account')); pintarPerfil(); pintarTopo(); }
      if(op==='sair-nuvem'){ Plataforma.sair(); pintarPerfil(); pintarTopo(); }
      if(op==='sair'){ fecharPerfil(); if(id.local){ try{ DGO.sair(); }catch(e){} } if(id.nuvem) Plataforma.sair(); toast(T('Você saiu','Signed out')); pintarTopo(); }
    });
  }
  function abrirPerfil(){
    if(perfilAberto()) return;
    fecharGaveta(); pintarPerfil();
    const r = document.querySelector('header').getBoundingClientRect();
    mp.style.top = Math.round(r.bottom + 6) + 'px';
    mp.classList.add('on'); btnPerfil.setAttribute('aria-expanded','true');
    const f = mp.querySelector('button'); if(f) setTimeout(()=>f.focus(), 60);
  }
  function fecharPerfil(){
    if(!perfilAberto()) return;
    mp.classList.remove('on'); btnPerfil.setAttribute('aria-expanded','false');
    if(mp.contains(document.activeElement)) btnPerfil.focus();
  }

  function aoTrocarTela(){ fecharPerfil(); if(gavetaAberta()) pintarGaveta(); }
  function iniciar(){
    aplicarTema(); pintarTopo();
    btnMenu.addEventListener('click', ()=> gavetaAberta() ? fecharGaveta() : abrirGaveta());
    fundo.addEventListener('click', ()=>fecharGaveta());
    btnPerfil.addEventListener('click', ()=> perfilAberto() ? fecharPerfil() : abrirPerfil());
    $('#btn-busca-topo').addEventListener('click', ()=>{ fecharPerfil(); abrirBusca(); });
    $('#btn-inbox-topo').addEventListener('click', ()=>{ fecharPerfil(); Inbox.abrir(); });
    document.addEventListener('click', e=>{ if(perfilAberto() && !mp.contains(e.target) && !btnPerfil.contains(e.target)) fecharPerfil(); });
    document.addEventListener('keydown', e=>{ if(e.key==='Escape'){ if(gavetaAberta()) fecharGaveta(); else if(perfilAberto()) fecharPerfil(); } });
    ['dgo:pronto','dgo:saiu','ch:conta','dgo:idioma'].forEach(ev=>document.addEventListener(ev, ()=>{ pintarTopo(); if(perfilAberto()) pintarPerfil(); if(gavetaAberta()) pintarGaveta(); }));
    document.addEventListener('dgo:entrou', ()=>{ desdeLocal = Date.now(); try{ localStorage.setItem('ch_topo_desde', String(desdeLocal)); }catch(e){} pintarTopo(); if(perfilAberto()) pintarPerfil(); });
    window.addEventListener('resize', ()=>{ if(perfilAberto()){ const r=document.querySelector('header').getBoundingClientRect(); mp.style.top=Math.round(r.bottom+6)+'px'; } });
    $('#btn-dgo-config').addEventListener('click', ()=>{ try{ DGO.abrirConfiguracoes(); }catch(e){ toast(T('Painel indisponível agora','Panel unavailable now')); } });
  }
  return { iniciar, aplicarTema, alternarTema, abrirGaveta, fecharGaveta, abrirPerfil, fecharPerfil, aoTrocarTela, pintarTopo };
})();
Topo.iniciar();
Inbox.iniciar();

aplicarCfgNaTela(); pintarTudo();
aplicarConfigDaUrl();
// as histórias vêm do IndexedDB (rápido, mas não é na hora): depois de carregar, a tela e os selos se atualizam
Dados.iniciar().then(()=>{ pintarTudo(); atualizarVozGuardada(true); carregarDoGithub().finally(()=>Nuvem.iniciar()); });
Assist.iniciar();
// chegou arquivo novo do RootifyONE: redesenha o que depende dos interruptores
Rec.aoMudar(()=>{ Assist.aplicar(); Anuncios.pintar(); criarSemIA(); });

// desbloqueia o áudio no primeiro toque (regra dos celulares)
['touchend','click'].forEach(ev=>document.addEventListener(ev, function um(){
  Som.ligar(); document.removeEventListener(ev, um);
}, {once:true}));

window.addEventListener('beforeunload', ()=>{ if('speechSynthesis' in window) speechSynthesis.cancel(); });
document.addEventListener('visibilitychange', ()=>{ if(document.hidden) Som.parar(true); });

})();
