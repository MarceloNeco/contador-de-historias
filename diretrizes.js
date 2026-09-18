/* =====================================================================
   DIRETRIZES GLOBAIS  —  modulo unico para os apps de MarceloNeco
   Versao 1.0.0
   ---------------------------------------------------------------------
   O que este arquivo faz, sozinho, em qualquer pagina onde for incluido:
     1. Idiomas Portugues / Ingles, com botao de troca sempre visivel
     2. Datas automaticas   PT: 17/Set/2026     EN: Sep/17/2026
     3. Varredura automatica do conteudo a cada atualizacao da tela
     4. Layout responsivo (celular, tablet, notebook) + area segura
     5. Tres tipos de acesso: Visitante, Pagante e Anunciante
     6. Banner de anuncio no topo, fechavel, que volta no proximo login
     7. OCR de verdade (le texto de foto) pela camera ou por arquivo
     8. Login social, biometria e senha
     9. Conexao segura com Google Drive / OneDrive + backup em arquivo
    10. Compartilhamento nativo (WhatsApp e afins)
    11. Preparado para virar app instalavel (celular e computador)

   Como usar:  <script src="diretrizes.js"></script>
               <script>DGO.iniciar({ app:'meu-app', nome:'Meu App' });</script>
   ===================================================================== */
(function (raiz) {
  'use strict';

  var VERSAO = '1.0.0';
  if (raiz.DGO && raiz.DGO.__carregado) { return; }

  /* ------------------------------------------------------------------
     1. CONFIGURACAO
     ------------------------------------------------------------------ */
  var cfg = {
    app: 'app',                       // identificador curto, sem espacos
    nome: 'App',                      // nome exibido (texto ou {pt:'',en:''})
    versaoApp: '',                    // versao do seu app (aparece em Config.)
    cor: '#0ea5e9',                   // cor de destaque
    corFundoBarra: '#0b1220',

    idiomaPadrao: 'pt',
    idiomaCompartilhado: true,        // mesmo idioma nos seus varios sites
    traducoes: {},                    // { 'Texto em portugues': 'Text in english' }

    datasAutomaticas: true,
    varreduraAutomatica: true,        // re-processa a tela a cada mudanca
    responsivo: true,

    seletorIdiomaVisivel: true,
    posicaoSeletorIdioma: 'topo-direita',

    anuncios: {
      ativo: true,
      imagem: '',                     // deixe vazio para usar o placeholder
      link: 'https://marceloneco.github.io/',
      texto: '<ANUNCIE AQUI>',
      altura: 64,
      /* enquanto uma destas telas estiver aberta, o banner some sozinho
         e volta quando ela fecha (leitor de tela cheia, modal, etc.) */
      esconderCom: []
    },

    /* trechos que o tradutor e o formatador de datas nao podem tocar.
       O modulo marca sozinho, entao nao e preciso editar o index.html. */
    ignorar: [],

    login: {
      ativo: true,
      exigirNaAbertura: false,        // true = tela de login antes de usar
      permitirVisitante: true,
      permitirPagante: true,
      permitirAnunciante: true,
      google: { clientId: '' },       // preencha para ligar o login do Google
      biometria: true,
      exigirApelido: true,           // conta = apelido + e-mail + senha
      /* "esqueci a senha": o caminho muda conforme o que estiver configurado.
         1) se houver servidor (DGO.auth.backend.pedirRedefinicao) -> link por e-mail
         2) senao, se houver formularioRecuperacao -> o pedido chega para voce
         3) senao -> codigo de recuperacao gerado quando a conta e criada     */
      formularioRecuperacao: ''      // ex.: 'https://formspree.io/f/xxxxxxx'
    },

    email: {
      formulario: '',                // endereco do Formspree (ou parecido)
      deAvisos: '',                  // e-mail que voce usa para responder
      assuntoPadrao: ''
    },

    nuvem: {
      google: { clientId: '' },       // OAuth Web client ID
      microsoft: { clientId: '' },    // Azure app (SPA) client ID
      arquivo: 'dados.json'
    },

    ocr: {
      ativo: true,
      idiomas: 'por+eng',
      cdn: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js',
      caminhoLocal: '',               // se um dia hospedar o tesseract.js no repositorio
      caminhos: { worker: '', core: '', lang: '' }   // idem para worker, wasm e idiomas
    },

    pwa: { ativo: true, manifesto: 'manifest.json', serviceWorker: 'sw.js' },

    notificacoes: {
      ativo: true,
      pedirNaAbertura: false,        // true = pede permissao assim que abre (evite)
      icone: 'icone-192.png',
      distintivo: 'icone-192.png',
      vapidPublicKey: '',            // chave publica do servidor de push (quando houver)
      endpointInscricao: '',         // endereco que guarda a inscricao do aparelho
      horarioSilencioso: { ativo: true, inicio: '22:00', fim: '07:00' },
      /* cada app declara os seus tipos de aviso; o usuario liga e desliga um a um */
      tipos: []                      // [{ id, nome:{pt,en}, descricao:{pt,en}, padrao:true }]
    },

    empurrarConteudo: true,
    seletoresTopoFixo: [],            // ex.: ['.minha-barra-fixa']
    aoTrocarIdioma: null,
    aoEntrar: null,
    aoSair: null
  };

  function fundir(alvo, novo) {
    for (var k in novo) {
      if (!Object.prototype.hasOwnProperty.call(novo, k)) continue;
      if (novo[k] && typeof novo[k] === 'object' && !Array.isArray(novo[k]) &&
          alvo[k] && typeof alvo[k] === 'object' && !Array.isArray(alvo[k])) {
        fundir(alvo[k], novo[k]);
      } else { alvo[k] = novo[k]; }
    }
    return alvo;
  }

  /* ------------------------------------------------------------------
     2. UTILIDADES
     ------------------------------------------------------------------ */
  var d = document;
  function el(tag, props, filhos) {
    var n = d.createElement(tag);
    if (props) for (var k in props) {
      if (k === 'style' && typeof props[k] === 'object') { for (var s in props[k]) n.style[s] = props[k][s]; }
      else if (k === 'html') { n.innerHTML = props[k]; }
      else if (k === 'texto') { n.textContent = props[k]; }
      else if (k.slice(0, 2) === 'on' && typeof props[k] === 'function') { n.addEventListener(k.slice(2), props[k]); }
      else if (props[k] !== null && props[k] !== undefined) { n.setAttribute(k, props[k]); }
    }
    if (filhos) (Array.isArray(filhos) ? filhos : [filhos]).forEach(function (f) {
      if (f) n.appendChild(typeof f === 'string' ? d.createTextNode(f) : f);
    });
    return n;
  }
  function $(sel, ctx) { return (ctx || d).querySelector(sel); }
  function texto(v) { return (v === null || v === undefined) ? '' : String(v); }

  /* Armazenamento com nome separado por app (os sites dividem o mesmo
     endereco marceloneco.github.io, entao os dados nao podem se misturar) */
  var Guardar = {
    prefixo: function () { return 'dgo:' + cfg.app + ':'; },
    _alvo: function () { return (Sessao.tipo === 'visitante') ? raiz.sessionStorage : raiz.localStorage; },
    ler: function (chave, padrao, global) {
      try {
        var p = global ? 'dgo:global:' : this.prefixo();
        var v = (global ? raiz.localStorage : this._alvo()).getItem(p + chave);
        return v === null ? padrao : JSON.parse(v);
      } catch (e) { return padrao; }
    },
    gravar: function (chave, valor, global) {
      try {
        var p = global ? 'dgo:global:' : this.prefixo();
        (global ? raiz.localStorage : this._alvo()).setItem(p + chave, JSON.stringify(valor));
        return true;
      } catch (e) { return false; }
    },
    apagar: function (chave, global) {
      try {
        var p = global ? 'dgo:global:' : this.prefixo();
        (global ? raiz.localStorage : this._alvo()).removeItem(p + chave);
      } catch (e) {}
    },
    limparPessoais: function () {
      try {
        [raiz.localStorage, raiz.sessionStorage].forEach(function (loja) {
          var fora = [], i;
          for (i = 0; i < loja.length; i++) {
            var c = loja.key(i);
            if (c && c.indexOf('dgo:' + cfg.app + ':') === 0 && c.indexOf(':conta:') === -1) fora.push(c);
          }
          fora.forEach(function (c) { loja.removeItem(c); });
        });
      } catch (e) {}
    }
  };

  /* ------------------------------------------------------------------
     3. ESTILO (injetado, com prefixo dgo- para nao afetar o seu app)
     ------------------------------------------------------------------ */
  function injetarEstilo() {
    if ($('#dgo-estilo')) return;
    var css = [
      ':root{--dgo-topo:0px;--dgo-cor:' + cfg.cor + ';--dgo-barra:' + cfg.corFundoBarra + ';}',
      '.dgo-oculto{display:none !important;}',
      '.dgo-banner{position:fixed;top:0;left:0;right:0;z-index:2147483000;display:flex;align-items:center;gap:8px;',
      'background:#11182a;border-bottom:1px solid rgba(255,255,255,.12);padding:4px 8px;',
      'padding-top:calc(4px + env(safe-area-inset-top,0px));box-sizing:border-box;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;}',
      '.dgo-banner a{flex:1;display:block;line-height:0;text-decoration:none;overflow:hidden;border-radius:8px;}',
      '.dgo-banner img{width:100%;height:auto;display:block;max-height:' + cfg.anuncios.altura + 'px;object-fit:cover;}',
      '.dgo-banner .dgo-x{flex:0 0 auto;width:30px;height:30px;border-radius:50%;border:0;cursor:pointer;',
      'background:rgba(255,255,255,.14);color:#fff;font-size:17px;line-height:30px;padding:0;}',
      '.dgo-banner .dgo-x:hover{background:rgba(255,255,255,.28);}',
      '.dgo-idioma{position:fixed;z-index:2147483100;display:flex;align-items:center;gap:0;',
      'background:rgba(15,23,42,.92);color:#fff;border-radius:999px;padding:3px;box-shadow:0 4px 14px rgba(0,0,0,.35);',
      'font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:12px;font-weight:700;user-select:none;}',
      '.dgo-idioma button{border:0;background:transparent;color:#cbd5e1;padding:6px 11px;border-radius:999px;cursor:pointer;font:inherit;min-width:40px;min-height:32px;}',
      '.dgo-idioma button.dgo-on{background:var(--dgo-cor);color:#04121f;}',
      '.dgo-idioma.dgo-topo-direita{right:10px;top:calc(var(--dgo-topo) + 10px);}',
      '.dgo-idioma.dgo-topo-esquerda{left:10px;top:calc(var(--dgo-topo) + 10px);}',
      '.dgo-idioma.dgo-baixo-direita{right:10px;bottom:calc(12px + env(safe-area-inset-bottom,0px));}',
      '.dgo-idioma.dgo-baixo-esquerda{left:10px;bottom:calc(12px + env(safe-area-inset-bottom,0px));}',
      '.dgo-modal{position:fixed;inset:0;z-index:2147483200;background:rgba(2,6,23,.72);backdrop-filter:blur(3px);',
      'display:flex;align-items:center;justify-content:center;padding:14px;box-sizing:border-box;',
      'font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;overscroll-behavior:contain;}',
      '.dgo-caixa{background:#0f172a;color:#e2e8f0;border:1px solid rgba(255,255,255,.12);border-radius:16px;',
      'width:100%;max-width:440px;max-height:92vh;overflow:auto;box-shadow:0 24px 60px rgba(0,0,0,.6);',
      'padding:18px;box-sizing:border-box;-webkit-overflow-scrolling:touch;}',
      '.dgo-caixa.dgo-larga{max-width:760px;}',
      '.dgo-caixa h2{margin:0 0 4px;font-size:19px;color:#fff;}',
      '.dgo-caixa h3{margin:18px 0 8px;font-size:14px;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;}',
      '.dgo-caixa p{margin:0 0 12px;font-size:13.5px;line-height:1.5;color:#94a3b8;}',
      '.dgo-abas{display:flex;gap:6px;margin:14px 0;flex-wrap:wrap;}',
      '.dgo-abas button{flex:1;min-width:96px;min-height:40px;padding:9px 8px;border-radius:10px;border:1px solid rgba(255,255,255,.14);',
      'background:transparent;color:#cbd5e1;cursor:pointer;font-size:13px;font-weight:600;}',
      '.dgo-abas button.dgo-on{background:var(--dgo-cor);border-color:var(--dgo-cor);color:#04121f;}',
      '.dgo-campo{display:block;margin:0 0 10px;}',
      '.dgo-campo span{display:block;font-size:12px;color:#94a3b8;margin-bottom:4px;}',
      '.dgo-campo input,.dgo-campo select,.dgo-campo textarea{width:100%;box-sizing:border-box;padding:11px 12px;border-radius:10px;',
      'border:1px solid rgba(255,255,255,.16);background:#0b1220;color:#e2e8f0;font-size:16px;font-family:inherit;}',
      '.dgo-b{display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:46px;padding:12px 14px;',
      'border-radius:11px;border:0;background:var(--dgo-cor);color:#04121f;font-size:14.5px;font-weight:700;cursor:pointer;margin-top:6px;font-family:inherit;}',
      '.dgo-b.dgo-b2{background:transparent;border:1px solid rgba(255,255,255,.2);color:#e2e8f0;}',
      '.dgo-b:disabled{opacity:.5;cursor:not-allowed;}',
      '.dgo-aviso{font-size:12.5px;border-radius:9px;padding:9px 11px;margin:10px 0 0;line-height:1.45;}',
      '.dgo-aviso.erro{background:rgba(239,68,68,.15);color:#fca5a5;}',
      '.dgo-aviso.ok{background:rgba(34,197,94,.15);color:#86efac;}',
      '.dgo-aviso.info{background:rgba(148,163,184,.14);color:#cbd5e1;}',
      '.dgo-linha{display:flex;gap:8px;align-items:center;flex-wrap:wrap;}',
      '.dgo-linha>*{flex:1;min-width:120px;}',
      '.dgo-fechar{position:absolute;top:10px;right:12px;}',
      '.dgo-video,.dgo-foto{width:100%;border-radius:12px;background:#000;display:block;max-height:48vh;object-fit:contain;}',
      '.dgo-barra{height:7px;border-radius:99px;background:rgba(255,255,255,.12);overflow:hidden;margin:10px 0;}',
      '.dgo-barra i{display:block;height:100%;width:0;background:var(--dgo-cor);transition:width .18s;}',
      '.dgo-sep{height:1px;background:rgba(255,255,255,.1);margin:16px 0;}',
      '.dgo-mini{font-size:11.5px;color:#64748b;}',
      '@media (max-width:480px){.dgo-caixa{max-width:100%;border-radius:14px;padding:15px;}.dgo-abas button{min-width:0;}}'
    ].join('');

    var extra = cfg.responsivo ? [
      'html{-webkit-text-size-adjust:100%;text-size-adjust:100%;}',
      'img,video,canvas,svg{max-width:100%;}',
      '@media (max-width:640px){body{overflow-x:hidden;}}'
    ].join('') : '';

    d.head.appendChild(el('style', { id: 'dgo-estilo', html: css + extra }));
  }

  function garantirMeta() {
    if (!$('meta[name="viewport"]')) {
      d.head.appendChild(el('meta', {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1, viewport-fit=cover'
      }));
    } else {
      var m = $('meta[name="viewport"]');
      if ((m.getAttribute('content') || '').indexOf('viewport-fit') === -1) {
        m.setAttribute('content', m.getAttribute('content') + ', viewport-fit=cover');
      }
    }
    if (!$('meta[name="theme-color"]')) {
      d.head.appendChild(el('meta', { name: 'theme-color', content: cfg.corFundoBarra }));
    }
  }

  /* ------------------------------------------------------------------
     4. IDIOMAS
     ------------------------------------------------------------------ */
  var MES = {
    pt: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  };

  /* Textos da propria interface deste modulo */
  var UI = {
    entrar: ['Entrar', 'Sign in'],
    sair: ['Sair', 'Sign out'],
    visitante: ['Visitante', 'Guest'],
    assinante: ['Assinante', 'Subscriber'],
    anunciante: ['Anunciante', 'Advertiser'],
    email: ['E-mail', 'E-mail'],
    senha: ['Senha', 'Password'],
    confirmarSenha: ['Confirmar senha', 'Confirm password'],
    criarConta: ['Criar conta', 'Create account'],
    jaTenhoConta: ['Já tenho conta', 'I already have an account'],
    entrarVisitante: ['Entrar sem senha', 'Continue without a password'],
    avisoVisitante: ['Como visitante nenhum dado pessoal é guardado e são exibidos anúncios.',
                     'As a guest no personal data is kept and ads are displayed.'],
    avisoAssinante: ['Com conta de assinante os dados ficam guardados e não há anúncios.',
                     'With a subscriber account your data is kept and there are no ads.'],
    avisoAnunciante: ['Área para acompanhar campanhas e desempenho dos anúncios.',
                      'Area to follow campaigns and ad performance.'],
    entrarGoogle: ['Entrar com Google', 'Sign in with Google'],
    entrarBiometria: ['Entrar com biometria', 'Sign in with biometrics'],
    ativarBiometria: ['Ativar biometria neste aparelho', 'Enable biometrics on this device'],
    biometriaAtiva: ['Biometria ativada neste aparelho.', 'Biometrics enabled on this device.'],
    configuracoes: ['Configurações', 'Settings'],
    idioma: ['Idioma', 'Language'],
    conta: ['Conta', 'Account'],
    nuvem: ['Nuvem e backup', 'Cloud and backup'],
    conectarDrive: ['Conectar Google Drive', 'Connect Google Drive'],
    conectarOneDrive: ['Conectar OneDrive', 'Connect OneDrive'],
    desconectar: ['Desconectar', 'Disconnect'],
    enviarNuvem: ['Enviar para a nuvem', 'Upload to the cloud'],
    baixarNuvem: ['Trazer da nuvem', 'Download from the cloud'],
    salvarArquivo: ['Salvar backup em arquivo', 'Save backup to a file'],
    abrirArquivo: ['Restaurar de um arquivo', 'Restore from a file'],
    compartilhar: ['Compartilhar', 'Share'],
    copiarLink: ['Copiar link', 'Copy link'],
    copiado: ['Copiado.', 'Copied.'],
    instalarApp: ['Instalar como app', 'Install as an app'],
    appInstalado: ['App ja instalado.', 'App already installed.'],
    escanear: ['Escanear (OCR)', 'Scan (OCR)'],
    usarCamera: ['Usar a câmera', 'Use the camera'],
    escolherImagem: ['Escolher uma imagem', 'Choose an image'],
    tirarFoto: ['Tirar foto', 'Take a photo'],
    outraFoto: ['Outra foto', 'Another photo'],
    lerTexto: ['Ler o texto', 'Read the text'],
    lendo: ['Lendo a imagem...', 'Reading the image...'],
    carregandoMotor: ['Preparando o leitor...', 'Preparing the reader...'],
    textoLido: ['Texto lido', 'Text read'],
    usarTexto: ['Usar este texto', 'Use this text'],
    copiarTexto: ['Copiar texto', 'Copy text'],
    semCamera: ['Não foi possível abrir a câmera neste aparelho.', 'The camera could not be opened on this device.'],
    fechar: ['Fechar', 'Close'],
    cancelar: ['Cancelar', 'Cancel'],
    salvar: ['Salvar', 'Save'],
    anuncio: ['Publicidade', 'Advertisement'],
    fecharAnuncio: ['Fechar anúncio', 'Close ad'],
    anuncieAqui: ['<ANUNCIE AQUI>', '<ADVERTISE HERE>'],
    versao: ['Versão', 'Version'],
    naoConfigurado: ['Ainda não configurado. Veja o passo a passo.', 'Not configured yet. See the step-by-step guide.'],
    senhaCurta: ['A senha precisa de pelo menos 6 caracteres.', 'The password needs at least 6 characters.'],
    senhasDiferentes: ['As duas senhas não são iguais.', 'The two passwords do not match.'],
    contaExiste: ['Já existe uma conta com esse e-mail neste aparelho.', 'An account with that e-mail already exists on this device.'],
    dadosErrados: ['E-mail ou senha incorretos.', 'Wrong e-mail or password.'],
    semConta: ['Nenhuma conta encontrada. Crie uma conta primeiro.', 'No account found. Create an account first.'],
    campanhas: ['Campanhas', 'Campaigns'],
    exibicoes: ['Exibições', 'Impressions'],
    cliques: ['Cliques', 'Clicks'],
    painelAnunciante: ['Painel do anunciante', 'Advertiser panel'],
    semCampanhas: ['Nenhuma campanha cadastrada ainda.', 'No campaigns registered yet.'],
    novaCampanha: ['Nova campanha', 'New campaign'],
    titulo: ['Título', 'Title'],
    linkDestino: ['Link de destino', 'Destination link'],
    imagemUrl: ['Endereço da imagem', 'Image address'],
    periodo: ['Período', 'Period'],
    ate: ['até', 'to'],
    ativa: ['Ativa', 'Active'],
    pausada: ['Pausada', 'Paused'],

    notificacoes: ['Notificações', 'Notifications'],
    ativarNotificacoes: ['Ativar notificações', 'Enable notifications'],
    notifAtivas: ['Notificações ativadas neste aparelho.', 'Notifications enabled on this device.'],
    notifBloqueadas: ['As notificações estão bloqueadas nas configurações do navegador. Libere por lá para voltar a receber.',
                      'Notifications are blocked in the browser settings. Allow them there to receive alerts again.'],
    notifSemSuporte: ['Este navegador não envia notificações.', 'This browser does not send notifications.'],
    notifIOS: ['No iPhone e no iPad é preciso instalar o app na Tela de Início para receber avisos.',
               'On iPhone and iPad the app must be installed on the Home Screen to receive alerts.'],
    avisosDoApp: ['Quais avisos você quer receber', 'Which alerts you want to receive'],
    horarioSilencioso: ['Horário silencioso', 'Quiet hours'],
    testarAviso: ['Enviar um aviso de teste', 'Send a test alert'],
    lembretes: ['Lembretes agendados', 'Scheduled reminders'],
    semLembretes: ['Nenhum lembrete agendado.', 'No reminders scheduled.'],
    remover: ['Remover', 'Remove'],
    comAppFechado: ['Receber avisos com o app fechado', 'Receive alerts with the app closed'],
    inscrito: ['Este aparelho está inscrito para receber avisos.', 'This device is subscribed to receive alerts.'],
    avisoTesteTitulo: ['Aviso de teste', 'Test alert'],
    avisoTesteTexto: ['Se você está lendo isto, as notificações funcionam.',
                      'If you are reading this, notifications are working.'],

    apelido: ['Apelido (nome de usuário)', 'Alias (username)'],
    apelidoOuEmail: ['Apelido ou e-mail', 'Alias or e-mail'],
    esqueciSenha: ['Esqueci a senha', 'I forgot my password'],
    recuperarSenha: ['Recuperar a senha', 'Recover password'],
    codigoRecuperacao: ['Código de recuperação', 'Recovery code'],
    guardeCodigo: ['Guarde este código num lugar seguro. Ele é a única forma de voltar à conta se a senha for esquecida, e não será mostrado outra vez.',
                   'Keep this code somewhere safe. It is the only way back into the account if the password is forgotten, and it will not be shown again.'],
    copiarCodigo: ['Copiar o código', 'Copy the code'],
    baixarCodigo: ['Baixar em arquivo', 'Download as a file'],
    jaGuardei: ['Já guardei, continuar', 'Saved it, continue'],
    novaSenha: ['Nova senha', 'New password'],
    confirmarNovaSenha: ['Confirmar a nova senha', 'Confirm the new password'],
    trocarSenha: ['Trocar a senha', 'Change password'],
    senhaAtual: ['Senha atual', 'Current password'],
    codigoErrado: ['Código de recuperação incorreto.', 'Wrong recovery code.'],
    senhaTrocada: ['Senha trocada. Entre com a senha nova.', 'Password changed. Sign in with the new password.'],
    apelidoEmUso: ['Esse apelido já está em uso neste aparelho.', 'That alias is already in use on this device.'],
    apelidoCurto: ['O apelido precisa de 3 letras ou mais, sem espaços.', 'The alias needs 3 or more characters, no spaces.'],
    emailInvalido: ['Escreva um e-mail válido.', 'Write a valid e-mail address.'],
    comoRecuperar: ['Como você quer recuperar o acesso?', 'How do you want to recover access?'],
    porEmail: ['Receber um link por e-mail', 'Get a link by e-mail'],
    porCodigo: ['Usar o código de recuperação', 'Use the recovery code'],
    pedirAoDono: ['Pedir ajuda ao responsável pelo site', 'Ask the site owner for help'],
    verifiqueEmail: ['Se esse e-mail estiver cadastrado, o link de redefinição já foi enviado.',
                     'If that e-mail is registered, the reset link has been sent.'],
    pedidoEnviado: ['Pedido enviado. A resposta chega no e-mail que você informou.',
                    'Request sent. The reply will arrive at the e-mail you provided.'],
    pedidoFalhou: ['Não foi possível enviar o pedido agora.', 'The request could not be sent right now.'],
    mensagem: ['Mensagem', 'Message'],
    enviarPedido: ['Enviar pedido', 'Send request'],
    semRecuperacaoConfigurada: ['Este app ainda não tem recuperação por e-mail. Use o código de recuperação que apareceu quando a conta foi criada.',
                                'This app has no e-mail recovery yet. Use the recovery code shown when the account was created.'],
    contaCriada: ['Conta criada.', 'Account created.'],
    identificadorVazio: ['Escreva o apelido ou o e-mail da conta.', 'Write the alias or the e-mail of the account.']
  };

  var Idioma = {
    atual: 'pt',
    _regex: null,
    _dic: null,
    _cache: null,

    normalizar: function (s) {
      return texto(s).trim().toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/\s+/g, ' ');
    },

    montarDicionario: function () {
      var dic = {}, k;
      for (k in BASE_PT_EN) if (Object.prototype.hasOwnProperty.call(BASE_PT_EN, k)) dic[Idioma.normalizar(k)] = BASE_PT_EN[k];
      for (k in cfg.traducoes) if (Object.prototype.hasOwnProperty.call(cfg.traducoes, k)) dic[Idioma.normalizar(k)] = cfg.traducoes[k];
      Idioma._dic = dic;
      Idioma._cache = {};
      /* o texto da pagina tem acentos; a busca aceita com e sem acento */
      var grafias = {}, bruto;
      function juntar(lista) {
        for (var i = 0; i < lista.length; i++) {
          bruto = String(lista[i]).trim().replace(/\s+/g, ' ');
          if (!bruto) continue;
          grafias[bruto] = 1;
          var sem = bruto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          if (sem !== bruto) grafias[sem] = 1;
        }
      }
      juntar(Object.keys(BASE_PT_EN));
      juntar(Object.keys(cfg.traducoes || {}));
      var chaves = Object.keys(grafias).sort(function (a, b) { return b.length - a.length; });
      if (!chaves.length) { Idioma._regex = null; return; }
      var partes = chaves.map(function (c) { return c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); });
      try {
        Idioma._regex = new RegExp('(^|[^\\p{L}\\p{N}\\-])(' + partes.join('|') + ')(?![\\p{L}\\p{N}\\-])', 'giu');
      } catch (e) {
        Idioma._regex = new RegExp('(^|[^A-Za-z0-9\\u00C0-\\u024F\\-])(' + partes.join('|') + ')(?![A-Za-z0-9\\u00C0-\\u024F\\-])', 'gi');
      }
    },

    /* aplica o mesmo "formato de caixa" do original na traducao */
    caixa: function (orig, novo) {
      if (!orig) return novo;
      if (orig === orig.toUpperCase() && orig !== orig.toLowerCase()) return novo.toUpperCase();
      var p = orig.charAt(0);
      if (p === p.toUpperCase() && p !== p.toLowerCase()) return novo.charAt(0).toUpperCase() + novo.slice(1);
      return novo;
    },

    traduzir: function (s) {
      if (Idioma.atual !== 'en' || !s) return s;
      if (!Idioma._dic) Idioma.montarDicionario();
      if (Idioma._cache[s] !== undefined) return Idioma._cache[s];
      var saida = s, chave = Idioma.normalizar(s);
      if (Idioma._dic[chave]) {
        saida = s.replace(/^(\s*)([\s\S]*?)(\s*)$/, function (t, a, meio, b) {
          return a + Idioma.caixa(meio, Idioma._dic[chave]) + b;
        });
      } else if (Idioma._regex) {
        Idioma._regex.lastIndex = 0;
        saida = s.replace(Idioma._regex, function (tudo, antes, achado) {
          var v = Idioma._dic[Idioma.normalizar(achado)];
          return v ? antes + Idioma.caixa(achado, v) : tudo;
        });
      }
      Idioma._cache[s] = saida;
      return saida;
    },

    definir: function (novo, silencioso) {
      novo = (novo === 'en') ? 'en' : 'pt';
      if (novo === Idioma.atual && !silencioso) return;
      Idioma.atual = novo;
      Guardar.gravar('idioma', novo, !!cfg.idiomaCompartilhado);
      d.documentElement.setAttribute('lang', novo === 'en' ? 'en' : 'pt-BR');
      d.documentElement.setAttribute('data-dgo-idioma', novo);
      Varredura.tudo(true);
      atualizarSeletorIdioma();
      redesenharInterfaceDGO();
      if (typeof cfg.aoTrocarIdioma === 'function') { try { cfg.aoTrocarIdioma(novo); } catch (e) {} }
      d.dispatchEvent(new CustomEvent('dgo:idioma', { detail: { idioma: novo } }));
    }
  };

  function t(chave) {
    var v = UI[chave];
    if (!v) return chave;
    return Idioma.atual === 'en' ? v[1] : v[0];
  }

  /* ------------------------------------------------------------------
     5. DATAS   PT: 17/Set/2026    EN: Sep/17/2026
     ------------------------------------------------------------------ */
  function paraData(v) {
    if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
    if (typeof v === 'number') { var n = new Date(v); return isNaN(n.getTime()) ? null : n; }
    var s = texto(v).trim();
    var m;
    /* so a data pura vira meia-noite local; com hora junto, deixa o navegador ler */
    if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/))) return new Date(+m[1], +m[2] - 1, +m[3]);
    if ((m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/))) return new Date(+m[3], +m[2] - 1, +m[1]);
    var n2 = new Date(s);
    return isNaN(n2.getTime()) ? null : n2;
  }

  function formatarData(v, idioma, comHora) {
    var dt = paraData(v);
    if (!dt) return texto(v);
    var li = idioma || Idioma.atual;
    var dia = ('0' + dt.getDate()).slice(-2);
    var mes = MES[li === 'en' ? 'en' : 'pt'][dt.getMonth()];
    var ano = dt.getFullYear();
    var base = (li === 'en') ? (mes + '/' + dia + '/' + ano) : (dia + '/' + mes + '/' + ano);
    if (comHora) {
      var hh = ('0' + dt.getHours()).slice(-2), mm = ('0' + dt.getMinutes()).slice(-2);
      base += (li === 'en') ? (' ' + (((dt.getHours() + 11) % 12) + 1) + ':' + mm + (dt.getHours() < 12 ? ' AM' : ' PM'))
                            : (' ' + hh + ':' + mm);
    }
    return base;
  }

  var RE_BARRA = /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g;
  var RE_ISO   = /\b(\d{4})-(\d{2})-(\d{2})\b/g;
  var RE_PRONTA_PT = null, RE_PRONTA_EN = null;
  (function () {
    var pt = MES.pt.join('|'), en = MES.en.join('|');
    RE_PRONTA_PT = new RegExp('\\b(\\d{1,2})/(' + pt + '|' + en + ')/(\\d{4})\\b', 'gi');
    RE_PRONTA_EN = new RegExp('\\b(' + pt + '|' + en + ')/(\\d{1,2})/(\\d{4})\\b', 'gi');
  })();

  function indiceMes(abrev) {
    var a = abrev.toLowerCase(), i;
    for (i = 0; i < 12; i++) {
      if (MES.pt[i].toLowerCase() === a || MES.en[i].toLowerCase() === a) return i;
    }
    return -1;
  }

  function reescreverDatas(s) {
    if (!cfg.datasAutomaticas || !s || s.indexOf('/') === -1 && s.indexOf('-') === -1) return s;
    var li = Idioma.atual;
    var saida = s.replace(RE_BARRA, function (tudo, a, b, ano) {
      var dia = +a, mes = +b;
      if (dia < 1 || dia > 31 || mes < 1 || mes > 12) return tudo;
      return formatarData(new Date(+ano, mes - 1, dia), li);
    });
    saida = saida.replace(RE_ISO, function (tudo, ano, mes, dia) {
      if (+mes < 1 || +mes > 12 || +dia < 1 || +dia > 31) return tudo;
      return formatarData(new Date(+ano, +mes - 1, +dia), li);
    });
    saida = saida.replace(RE_PRONTA_PT, function (tudo, dia, abrev, ano) {
      var im = indiceMes(abrev);
      return im < 0 ? tudo : formatarData(new Date(+ano, im, +dia), li);
    });
    saida = saida.replace(RE_PRONTA_EN, function (tudo, abrev, dia, ano) {
      var im = indiceMes(abrev);
      return im < 0 ? tudo : formatarData(new Date(+ano, im, +dia), li);
    });
    return saida;
  }

  /* ------------------------------------------------------------------
     6. VARREDURA AUTOMATICA DO CONTEUDO
        Percorre a tela, traduz o que reconhece e ajusta as datas.
        Roda de novo sozinha sempre que a tela muda (update).
     ------------------------------------------------------------------ */
  var IGNORAR_TAG = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, CODE: 1, PRE: 1, KBD: 1, SAMP: 1, SVG: 1, CANVAS: 1, IFRAME: 1, OPTION: 0 };
  var ATRIBUTOS = ['placeholder', 'title', 'aria-label', 'alt'];

  function marcarIgnorados() {
    var sels = cfg.ignorar || [];
    if (!sels.length) return;
    sels.forEach(function (sel) {
      try {
        Array.prototype.forEach.call(d.querySelectorAll(sel), function (n) {
          if (!n.hasAttribute('data-dgo-ignorar')) n.setAttribute('data-dgo-ignorar', '');
        });
      } catch (e) {}
    });
  }

  var Varredura = {
    obs: null,
    mapa: (typeof WeakMap === 'function') ? new WeakMap() : null,
    pendente: false,

    ignorado: function (no) {
      var p = no;
      while (p && p !== d.body) {
        if (p.nodeType === 1) {
          var tag = p.tagName;
          if (IGNORAR_TAG[tag]) return true;
          if (p.hasAttribute && (p.hasAttribute('data-dgo-ignorar') || p.hasAttribute('data-dgo-ui'))) return true;
          if (p.isContentEditable) return true;
        }
        p = p.parentNode;
      }
      return false;
    },

    original: function (no, chave, valorAtual) {
      if (!Varredura.mapa) return valorAtual;
      var reg = Varredura.mapa.get(no);
      if (!reg) { reg = {}; Varredura.mapa.set(no, reg); }
      if (reg[chave] === undefined) reg[chave] = valorAtual;
      return reg[chave];
    },

    textoNo: function (no) {
      var atual = no.nodeValue;
      if (!atual || !/\S/.test(atual)) return;
      var orig = Varredura.original(no, '#texto', atual);
      var novo = reescreverDatas(Idioma.traduzir(orig));
      if (novo !== atual) no.nodeValue = novo;
    },

    elemento: function (e) {
      var i, a, atual, orig, novo;
      for (i = 0; i < ATRIBUTOS.length; i++) {
        a = ATRIBUTOS[i];
        if (!e.hasAttribute(a)) continue;
        atual = e.getAttribute(a);
        if (!atual || !/\S/.test(atual)) continue;
        orig = Varredura.original(e, a, atual);
        novo = reescreverDatas(Idioma.traduzir(orig));
        if (novo !== atual) e.setAttribute(a, novo);
      }
      if (e.tagName === 'INPUT' && /^(button|submit|reset)$/i.test(e.type || '') && e.value) {
        orig = Varredura.original(e, '@value', e.value);
        novo = reescreverDatas(Idioma.traduzir(orig));
        if (novo !== e.value) e.value = novo;
      }
      /* <time datetime="2026-09-17"> vira a data no formato do idioma */
      if (e.tagName === 'TIME' && e.getAttribute('datetime')) {
        novo = formatarData(e.getAttribute('datetime'));
        if (e.textContent !== novo) e.textContent = novo;
      }
      /* qualquer elemento com data-data="2026-09-17" */
      if (e.hasAttribute('data-data')) {
        novo = formatarData(e.getAttribute('data-data'), null, e.hasAttribute('data-hora'));
        if (e.textContent !== novo) e.textContent = novo;
      }
      /* traducao dirigida:  data-pt="..." data-en="..." */
      if (e.hasAttribute('data-pt') || e.hasAttribute('data-en')) {
        novo = e.getAttribute('data-' + Idioma.atual);
        if (novo !== null && e.textContent !== novo) e.textContent = novo;
      }
    },

    ramo: function (raizNo) {
      if (!raizNo) return;
      if (raizNo.nodeType === 3) { if (!Varredura.ignorado(raizNo)) Varredura.textoNo(raizNo); return; }
      if (raizNo.nodeType !== 1 && raizNo.nodeType !== 9 && raizNo.nodeType !== 11) return;
      if (raizNo.nodeType === 1 && Varredura.ignorado(raizNo)) return;

      if (raizNo.nodeType === 1) Varredura.elemento(raizNo);
      var caminhador = d.createTreeWalker(raizNo, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
        acceptNode: function (no) {
          if (no.nodeType === 1) {
            if (IGNORAR_TAG[no.tagName] || no.hasAttribute('data-dgo-ignorar') || no.hasAttribute('data-dgo-ui') || no.isContentEditable) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
          return /\S/.test(no.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      });
      var no;
      while ((no = caminhador.nextNode())) {
        if (no.nodeType === 1) Varredura.elemento(no); else Varredura.textoNo(no);
      }
    },

    tudo: function () {
      if (!d.body) return;
      marcarIgnorados();
      try { Varredura.ramo(d.body); } catch (e) {}
      try {
        if (d.title) {
          var orig = Guardar._tituloOriginal || (Guardar._tituloOriginal = d.title);
          var novo = reescreverDatas(Idioma.traduzir(orig));
          if (d.title !== novo) d.title = novo;
        }
      } catch (e) {}
    },

    agendar: function (nos) {
      if (Varredura.pendente) return;
      Varredura.pendente = true;
      raiz.setTimeout(function () {
        Varredura.pendente = false;
        marcarIgnorados();
        if (nos && nos.length) { nos.forEach(function (n) { try { Varredura.ramo(n); } catch (e) {} }); }
        else Varredura.tudo();
      }, 16);
    },

    iniciar: function () {
      Varredura.tudo();
      if (!cfg.varreduraAutomatica || typeof MutationObserver !== 'function') return;
      Varredura.obs = new MutationObserver(function (lista) {
        var novos = [], i, m, j;
        for (i = 0; i < lista.length; i++) {
          m = lista[i];
          if (m.type === 'childList') {
            for (j = 0; j < m.addedNodes.length; j++) novos.push(m.addedNodes[j]);
          } else if (m.type === 'characterData') {
            novos.push(m.target);
          } else if (m.type === 'attributes') {
            novos.push(m.target);
          }
        }
        if (novos.length) Varredura.agendar(novos);
      });
      Varredura.obs.observe(d.body, {
        childList: true, subtree: true, characterData: true,
        attributes: true, attributeFilter: ATRIBUTOS.concat(['data-data', 'data-pt', 'data-en', 'datetime'])
      });
    }
  };

  /* ------------------------------------------------------------------
     7. SELETOR GLOBAL DE IDIOMA (sempre visivel)
     ------------------------------------------------------------------ */
  var seletorEl = null;
  function montarSeletorIdioma() {
    if (!cfg.seletorIdiomaVisivel || seletorEl) return;
    var pos = 'dgo-' + (cfg.posicaoSeletorIdioma || 'topo-direita');
    var bPT = el('button', { type: 'button', 'aria-label': 'Portugues', texto: 'PT', onclick: function () { Idioma.definir('pt'); } });
    var bEN = el('button', { type: 'button', 'aria-label': 'English', texto: 'EN', onclick: function () { Idioma.definir('en'); } });
    seletorEl = el('div', { class: 'dgo-idioma ' + pos, 'data-dgo-ui': '1', role: 'group' }, [bPT, bEN]);
    seletorEl._pt = bPT; seletorEl._en = bEN;
    d.body.appendChild(seletorEl);
    atualizarSeletorIdioma();
  }
  function atualizarSeletorIdioma() {
    if (!seletorEl) return;
    seletorEl._pt.className = Idioma.atual === 'pt' ? 'dgo-on' : '';
    seletorEl._en.className = Idioma.atual === 'en' ? 'dgo-on' : '';
  }

  /* ------------------------------------------------------------------
     8. BANNER DE ANUNCIO NO TOPO
        Fechavel durante a sessao; volta a aparecer no proximo login.
     ------------------------------------------------------------------ */
  var bannerEl = null;

  function imagemPlaceholder() {
    var txt = Idioma.atual === 'en' ? '&lt;ADVERTISE HERE&gt;' : '&lt;ANUNCIE AQUI&gt;';
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="120" viewBox="0 0 1200 120">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#1e293b"/><stop offset="1" stop-color="#0f766e"/></linearGradient></defs>' +
      '<rect width="1200" height="120" fill="url(#g)"/>' +
      '<rect x="6" y="6" width="1188" height="108" fill="none" stroke="#5eead4" stroke-width="2" stroke-dasharray="10 8" rx="10"/>' +
      '<text x="600" y="58" text-anchor="middle" font-family="system-ui,Segoe UI,Roboto,sans-serif" ' +
      'font-size="42" font-weight="700" fill="#f8fafc">' + txt + '</text>' +
      '<text x="600" y="92" text-anchor="middle" font-family="system-ui,Segoe UI,Roboto,sans-serif" ' +
      'font-size="20" fill="#5eead4">marceloneco.github.io</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  /* o anuncio fica fechado so ate o fim da sessao (sessionStorage) */
  var FlagAnuncio = {
    chave: function () { return 'dgo:' + cfg.app + ':anuncio-fechado'; },
    fechado: function () { try { return raiz.sessionStorage.getItem(FlagAnuncio.chave()) === '1'; } catch (e) { return false; } },
    fechar: function () { try { raiz.sessionStorage.setItem(FlagAnuncio.chave(), '1'); } catch (e) {} },
    reabrir: function () { try { raiz.sessionStorage.removeItem(FlagAnuncio.chave()); } catch (e) {} }
  };

  function telaCheiaAberta() {
    var sels = (cfg.anuncios && cfg.anuncios.esconderCom) || [];
    if (!sels.length) return false;
    for (var i = 0; i < sels.length; i++) {
      var nos;
      try { nos = d.querySelectorAll(sels[i]); } catch (e) { continue; }
      for (var j = 0; j < nos.length; j++) {
        var n = nos[j];
        if (!n.getClientRects().length) continue;
        var st = raiz.getComputedStyle(n);
        if (st.display === 'none' || st.visibility === 'hidden' || st.opacity === '0') continue;
        return true;
      }
    }
    return false;
  }

  function vigiarTelaCheia() {
    if (!((cfg.anuncios && cfg.anuncios.esconderCom) || []).length) return;
    var anterior = telaCheiaAberta();
    setInterval(function () {
      if (d.hidden) return;
      var agora = telaCheiaAberta();
      if (agora !== anterior) { anterior = agora; montarBanner(); }
    }, 450);
  }

  function deveMostrarAnuncio() {
    if (telaCheiaAberta()) return false;
    if (!cfg.anuncios.ativo) return false;
    if (Sessao.tipo === 'pagante') return false;        // assinante: sem anuncios
    if (Sessao.tipo === 'anunciante') return false;
    if (FlagAnuncio.fechado()) return false;
    return true;
  }

  function montarBanner() {
    if (bannerEl) { bannerEl.parentNode.removeChild(bannerEl); bannerEl = null; }
    /* uma exibicao por sessao de banner aberto, nao a cada redesenho */
    if (!deveMostrarAnuncio()) { ajustarTopo(0); return; }
    var img = el('img', {
      src: cfg.anuncios.imagem || imagemPlaceholder(),
      alt: t('anuncio') + ' - ' + (cfg.anuncios.texto || t('anuncieAqui')),
      loading: 'eager'
    });
    /* a altura so e conhecida depois que a imagem carrega */
    img.addEventListener('load', function () { ajustarTopo(bannerEl ? bannerEl.offsetHeight : 0); });
    var link = el('a', {
      href: cfg.anuncios.link, target: '_blank', rel: 'noopener noreferrer',
      onclick: function () { Anuncios.registrar('clique'); }
    }, [img]);
    var x = el('button', {
      class: 'dgo-x', type: 'button', 'aria-label': t('fecharAnuncio'), title: t('fecharAnuncio'),
      texto: '×',
      onclick: function () { FlagAnuncio.fechar(); montarBanner(); }
    });
    bannerEl = el('div', { class: 'dgo-banner', 'data-dgo-ui': '1', role: 'complementary', 'aria-label': t('anuncio') }, [link, x]);
    d.body.insertBefore(bannerEl, d.body.firstChild);
    if (!montarBanner._contou) { montarBanner._contou = true; Anuncios.registrar('exibicao'); }
    (raiz.requestAnimationFrame || setTimeout)(function () {
      ajustarTopo(bannerEl ? bannerEl.offsetHeight : 0);
    }, 30);
  }

  function ajustarTopo(altura) {
    d.documentElement.style.setProperty('--dgo-topo', altura + 'px');
    if (cfg.empurrarConteudo && d.body) {
      if (d.body.dataset.dgoPadOriginal === undefined) {
        d.body.dataset.dgoPadOriginal = raiz.getComputedStyle(d.body).paddingTop || '0px';
      }
      var base = parseFloat(d.body.dataset.dgoPadOriginal) || 0;
      d.body.style.paddingTop = (base + altura) + 'px';
    }
    (cfg.seletoresTopoFixo || []).forEach(function (sel) {
      Array.prototype.forEach.call(d.querySelectorAll(sel), function (n) {
        n.style.top = 'calc(' + altura + 'px + ' + (n.dataset.dgoTopoOriginal || '0px') + ')';
      });
    });
  }

  var Anuncios = {
    registrar: function (tipo) {
      try {
        var hoje = new Date().toISOString().slice(0, 10);
        var m = Guardar.ler('metricas-anuncio', {}, true) || {};
        if (!m[hoje]) m[hoje] = { exibicao: 0, clique: 0 };
        m[hoje][tipo] = (m[hoje][tipo] || 0) + 1;
        var dias = Object.keys(m).sort().slice(-60), limpo = {};
        dias.forEach(function (k) { limpo[k] = m[k]; });
        Guardar.gravar('metricas-anuncio', limpo, true);
      } catch (e) {}
    },
    totais: function () {
      var m = Guardar.ler('metricas-anuncio', {}, true) || {}, tot = { exibicao: 0, clique: 0 };
      Object.keys(m).forEach(function (k) {
        tot.exibicao += m[k].exibicao || 0; tot.clique += m[k].clique || 0;
      });
      return tot;
    }
  };

  /* ------------------------------------------------------------------
     9. ACESSO: VISITANTE, ASSINANTE (pagante) E ANUNCIANTE
     ------------------------------------------------------------------
     Visitante  -> sem senha, nada pessoal fica guardado, com anuncios
     Assinante  -> entra com senha, dados guardados, sem anuncios
     Anunciante -> area propria para acompanhar campanhas
     ------------------------------------------------------------------
     Observacao honesta: um site no GitHub Pages nao tem servidor, entao a
     conferencia da senha acontece dentro do proprio aparelho. Isso serve
     para separar perfis e proteger a tela, mas nao substitui um servidor.
     Quando houver um, basta ligar o adaptador:  DGO.auth.backend = {...}
     que todo o resto do app continua igual.
     ------------------------------------------------------------------ */

  function bytesParaB64(buf) {
    var b = new Uint8Array(buf), s = '', i;
    for (i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return raiz.btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64ParaBytes(s) {
    s = String(s).replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    var bin = raiz.atob(s), b = new Uint8Array(bin.length), i;
    for (i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
    return b;
  }
  function aleatorio(n) {
    var b = new Uint8Array(n || 16);
    if (raiz.crypto && raiz.crypto.getRandomValues) raiz.crypto.getRandomValues(b);
    else for (var i = 0; i < b.length; i++) b[i] = Math.floor(Math.random() * 256);
    return b;
  }
  var temCripto = !!(raiz.crypto && raiz.crypto.subtle && raiz.crypto.subtle.importKey);

  function derivarSenha(senha, saltB64) {
    var salt = saltB64 ? b64ParaBytes(saltB64) : aleatorio(16);
    if (!temCripto) {                       // so acontece abrindo o arquivo local (file://)
      var h = 5381, txt = bytesParaB64(salt) + '|' + senha, i;
      for (i = 0; i < txt.length; i++) h = ((h * 33) ^ txt.charCodeAt(i)) >>> 0;
      return Promise.resolve({ salt: bytesParaB64(salt), hash: 'simples:' + h.toString(16) });
    }
    var enc = new TextEncoder();
    return raiz.crypto.subtle.importKey('raw', enc.encode(senha), 'PBKDF2', false, ['deriveBits'])
      .then(function (k) {
        return raiz.crypto.subtle.deriveBits(
          { name: 'PBKDF2', salt: salt, iterations: 150000, hash: 'SHA-256' }, k, 256);
      })
      .then(function (bits) { return { salt: bytesParaB64(salt), hash: bytesParaB64(bits) }; });
  }

  /* alfabeto do codigo de recuperacao: sem 0/O e 1/I, para nao confundir na hora de digitar */
  var ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  function gerarCodigo() {
    var b = aleatorio(12), saida = '', i;
    for (i = 0; i < 12; i++) {
      saida += ALFABETO[b[i] % ALFABETO.length];
      if (i === 3 || i === 7) saida += '-';
    }
    return saida;                       // ex.: ABCD-EF23-GH45
  }
  function emailValido(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || '').trim()); }
  function apelidoValido(a) { return /^[A-Za-z0-9._-]{3,}$/.test(String(a || '').trim()); }

  var Contas = {
    chave: function () { return 'dgo:' + cfg.app + ':conta:lista'; },
    todas: function () {
      try { return JSON.parse(raiz.localStorage.getItem(Contas.chave()) || '{}'); }
      catch (e) { return {}; }
    },
    gravarTodas: function (o) {
      try { raiz.localStorage.setItem(Contas.chave(), JSON.stringify(o)); } catch (e) {}
    },

    /* aceita o e-mail OU o apelido */
    achar: function (identificador) {
      var id = String(identificador || '').trim().toLowerCase();
      if (!id) return null;
      var lista = Contas.todas();
      if (lista[id]) return lista[id];
      var k;
      for (k in lista) {
        if (Object.prototype.hasOwnProperty.call(lista, k) &&
            String(lista[k].apelido || '').toLowerCase() === id) return lista[k];
      }
      return null;
    },

    apelidoLivre: function (apelido) {
      var a = String(apelido || '').trim().toLowerCase(), lista = Contas.todas(), k;
      for (k in lista) {
        if (Object.prototype.hasOwnProperty.call(lista, k) &&
            String(lista[k].apelido || '').toLowerCase() === a) return false;
      }
      return true;
    },

    /* criar({ apelido, email, senha, tipo }) -> { conta, codigo } */
    criar: function (dados) {
      dados = dados || {};
      var email = String(dados.email || '').trim().toLowerCase();
      var apelido = String(dados.apelido || '').trim();
      var lista = Contas.todas();
      if (cfg.login.exigirApelido && !apelidoValido(apelido)) return Promise.reject(new Error('apelido-curto'));
      if (!emailValido(email)) return Promise.reject(new Error('email-invalido'));
      if (lista[email]) return Promise.reject(new Error('existe'));
      if (apelido && !Contas.apelidoLivre(apelido)) return Promise.reject(new Error('apelido-em-uso'));
      if (String(dados.senha || '').length < 6) return Promise.reject(new Error('senha-curta'));

      var codigo = gerarCodigo();
      return derivarSenha(dados.senha).then(function (rs) {
        return derivarSenha(codigo.replace(/-/g, '')).then(function (rc) {
          lista[email] = {
            email: email,
            apelido: apelido || email.split('@')[0],
            nome: apelido || email.split('@')[0],
            tipo: dados.tipo || 'pagante',
            salt: rs.salt, hash: rs.hash,
            recSalt: rc.salt, recHash: rc.hash,
            criadaEm: new Date().toISOString()
          };
          Contas.gravarTodas(lista);
          return { conta: lista[email], codigo: codigo };
        });
      });
    },

    conferir: function (identificador, senha) {
      var c = Contas.achar(identificador);
      if (!c) return Promise.reject(new Error('sem-conta'));
      return derivarSenha(senha, c.salt).then(function (r) {
        if (r.hash !== c.hash) throw new Error('errado');
        return c;
      });
    },

    /* troca a senha sabendo a senha atual */
    trocarSenha: function (identificador, senhaAtual, nova) {
      if (String(nova || '').length < 6) return Promise.reject(new Error('senha-curta'));
      return Contas.conferir(identificador, senhaAtual).then(function (c) {
        return derivarSenha(nova).then(function (r) {
          var lista = Contas.todas();
          lista[c.email].salt = r.salt; lista[c.email].hash = r.hash;
          lista[c.email].senhaTrocadaEm = new Date().toISOString();
          Contas.gravarTodas(lista);
          return lista[c.email];
        });
      });
    },

    /* troca a senha com o codigo de recuperacao (funciona sem servidor) */
    redefinirComCodigo: function (identificador, codigo, nova) {
      var c = Contas.achar(identificador);
      if (!c) return Promise.reject(new Error('sem-conta'));
      if (!c.recHash) return Promise.reject(new Error('sem-codigo'));
      if (String(nova || '').length < 6) return Promise.reject(new Error('senha-curta'));
      var limpo = String(codigo || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      return derivarSenha(limpo, c.recSalt).then(function (r) {
        if (r.hash !== c.recHash) throw new Error('codigo-errado');
        return derivarSenha(nova).then(function (rs) {
          var novoCodigo = gerarCodigo();
          return derivarSenha(novoCodigo.replace(/-/g, '')).then(function (rc) {
            var lista = Contas.todas();
            lista[c.email].salt = rs.salt;   lista[c.email].hash = rs.hash;
            lista[c.email].recSalt = rc.salt; lista[c.email].recHash = rc.hash;
            lista[c.email].senhaTrocadaEm = new Date().toISOString();
            Contas.gravarTodas(lista);
            return { conta: lista[c.email], codigo: novoCodigo };   // codigo novo, o antigo nao vale mais
          });
        });
      });
    },

    apagar: function (identificador) {
      var c = Contas.achar(identificador);
      if (!c) return false;
      var lista = Contas.todas();
      delete lista[c.email];
      Contas.gravarTodas(lista);
      return true;
    }
  };

  /* ---------------- envio de e-mail ----------------
     Um site no GitHub Pages nao envia e-mail sozinho: nao existe servidor
     para isso. Entao ha dois caminhos que funcionam hoje:
       1) um servico de formulario (Formspree e parecidos): o navegador manda
          o conteudo para o servico, e o servico manda o e-mail para voce;
       2) abrir o programa de e-mail da pessoa, com o texto ja escrito.
     Os dois estao aqui. Enviar e-mail automatico para OUTRAS pessoas (como um
     link de redefinicao de senha) precisa de servidor - veja o passo a passo. */
  var Email = {
    configurado: function () { return !!cfg.email.formulario; },

    enviarFormulario: function (dados) {
      dados = dados || {};
      if (!cfg.email.formulario) return Promise.reject(new Error('sem-formulario'));
      var corpo = {
        app: cfg.app,
        assunto: dados.assunto || cfg.email.assuntoPadrao || nomeApp(),
        mensagem: dados.mensagem || '',
        email: dados.responderPara || '',
        idioma: Idioma.atual,
        em: new Date().toISOString()
      };
      if (dados.extra) corpo.extra = dados.extra;
      return fetch(cfg.email.formulario, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(corpo)
      }).then(function (r) {
        if (!r.ok) throw new Error('falha-envio');
        return true;
      });
    },

    abrirCliente: function (dados) {
      dados = dados || {};
      var para = dados.para || cfg.email.deAvisos || '';
      var url = 'mailto:' + encodeURIComponent(para) +
        '?subject=' + encodeURIComponent(dados.assunto || nomeApp()) +
        '&body=' + encodeURIComponent(dados.mensagem || '');
      try { raiz.location.href = url; return true; } catch (e) { return false; }
    }
  };

  var Sessao = {
    tipo: null,          // 'visitante' | 'pagante' | 'anunciante'
    usuario: null,
    backend: null,       // adaptador para quando existir servidor

    carregar: function () {
      var s = null;
      try { s = JSON.parse(raiz.localStorage.getItem('dgo:' + cfg.app + ':sessao') || 'null'); } catch (e) {}
      if (!s) { try { s = JSON.parse(raiz.sessionStorage.getItem('dgo:' + cfg.app + ':sessao') || 'null'); } catch (e) {} }
      if (s && s.tipo) { Sessao.tipo = s.tipo; Sessao.usuario = s.usuario || null; }
      return Sessao;
    },

    gravar: function () {
      var s = JSON.stringify({ tipo: Sessao.tipo, usuario: Sessao.usuario });
      try {
        if (Sessao.tipo === 'visitante') {
          raiz.localStorage.removeItem('dgo:' + cfg.app + ':sessao');
          raiz.sessionStorage.setItem('dgo:' + cfg.app + ':sessao', s);
        } else {
          raiz.sessionStorage.removeItem('dgo:' + cfg.app + ':sessao');
          raiz.localStorage.setItem('dgo:' + cfg.app + ':sessao', s);
        }
      } catch (e) {}
    },

    entrar: function (tipo, usuario) {
      Sessao.tipo = tipo;
      Sessao.usuario = usuario || null;
      Sessao.gravar();
      /* a cada novo login o anuncio volta a aparecer */
      FlagAnuncio.reabrir();
      montarBanner._contou = false;
      montarBanner();
      redesenharInterfaceDGO();
      if (typeof cfg.aoEntrar === 'function') { try { cfg.aoEntrar(Sessao.resumo()); } catch (e) {} }
      d.dispatchEvent(new CustomEvent('dgo:entrou', { detail: Sessao.resumo() }));
      return Sessao.resumo();
    },

    sair: function () {
      var eraVisitante = Sessao.tipo === 'visitante';
      if (eraVisitante) Guardar.limparPessoais();   // visitante nao deixa rastro
      try {
        raiz.localStorage.removeItem('dgo:' + cfg.app + ':sessao');
        raiz.sessionStorage.removeItem('dgo:' + cfg.app + ':sessao');
      } catch (e) {}
      Sessao.tipo = null; Sessao.usuario = null;
      montarBanner();
      redesenharInterfaceDGO();
      if (typeof cfg.aoSair === 'function') { try { cfg.aoSair(); } catch (e) {} }
      d.dispatchEvent(new CustomEvent('dgo:saiu', {}));
    },

    resumo: function () {
      return {
        tipo: Sessao.tipo,
        usuario: Sessao.usuario,
        semAnuncios: Sessao.tipo === 'pagante' || Sessao.tipo === 'anunciante',
        guardaDados: Sessao.tipo !== 'visitante' && Sessao.tipo !== null
      };
    }
  };

  /* ---------------- biometria (WebAuthn) ---------------- */
  var Biometria = {
    _plataforma: null,     // preenchido no arranque: o aparelho tem leitor?
    verificarAparelho: function () {
      if (!raiz.PublicKeyCredential || !raiz.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
        Biometria._plataforma = false; return Promise.resolve(false);
      }
      return raiz.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(function (v) { Biometria._plataforma = !!v; return !!v; })
        .catch(function () { Biometria._plataforma = false; return false; });
    },
    suportada: function () {
      return !!(raiz.PublicKeyCredential && navigator.credentials && navigator.credentials.create) &&
             (raiz.isSecureContext !== false) && Biometria._plataforma !== false;
    },
    registrada: function () { return !!Guardar.ler('biometria-id', null, true); },
    registrar: function (email) {
      if (!Biometria.suportada()) return Promise.reject(new Error('sem-suporte'));
      var nome = String(email || 'usuario');
      return navigator.credentials.create({
        publicKey: {
          challenge: aleatorio(32),
          rp: { name: nomeApp() },
          user: { id: aleatorio(16), name: nome, displayName: nome },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
          authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'preferred' },
          timeout: 60000, attestation: 'none'
        }
      }).then(function (cred) {
        Guardar.gravar('biometria-id', bytesParaB64(cred.rawId), true);
        Guardar.gravar('biometria-email', nome, true);
        return true;
      });
    },
    entrar: function () {
      var id = Guardar.ler('biometria-id', null, true);
      if (!id) return Promise.reject(new Error('sem-registro'));
      return navigator.credentials.get({
        publicKey: {
          challenge: aleatorio(32),
          allowCredentials: [{ type: 'public-key', id: b64ParaBytes(id) }],
          userVerification: 'required', timeout: 60000
        }
      }).then(function () {
        var email = Guardar.ler('biometria-email', '', true);
        var c = Contas.achar(email);
        return Sessao.entrar(c ? c.tipo : 'pagante', { email: email, nome: c ? c.nome : email, via: 'biometria' });
      });
    },
    remover: function () { Guardar.apagar('biometria-id', true); Guardar.apagar('biometria-email', true); }
  };

  /* ---------------- login social (Google) ---------------- */
  var Google = {
    carregado: false,
    carregar: function () {
      if (Google.carregado) return Promise.resolve();
      if (!cfg.login.google.clientId) return Promise.reject(new Error('sem-client-id'));
      return new Promise(function (ok, erro) {
        var s = el('script', { src: 'https://accounts.google.com/gsi/client', async: '', defer: '' });
        s.onload = function () { Google.carregado = true; ok(); };
        s.onerror = function () { erro(new Error('falha-script')); };
        d.head.appendChild(s);
      });
    },
    entrar: function () {
      return Google.carregar().then(function () {
        return new Promise(function (ok, erro) {
          try {
            raiz.google.accounts.id.initialize({
              client_id: cfg.login.google.clientId,
              callback: function (resp) {
                try {
                  var p = JSON.parse(raiz.atob(resp.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
                  ok(Sessao.entrar('pagante', { email: p.email, nome: p.name || p.email, foto: p.picture, via: 'google' }));
                } catch (e) { erro(e); }
              }
            });
            raiz.google.accounts.id.prompt();
          } catch (e) { erro(e); }
        });
      });
    }
  };

  function nomeApp() {
    if (cfg.nome && typeof cfg.nome === 'object') return cfg.nome[Idioma.atual] || cfg.nome.pt || 'App';
    return cfg.nome || 'App';
  }

  /* ------------------------------------------------------------------
     10. OCR — ler texto de uma foto (camera do celular ou do notebook)
     ------------------------------------------------------------------ */
  var OCR = {
    _motor: null, _carregando: null, _stream: null,

    disponivel: function () { return !!cfg.ocr.ativo; },

    carregarBiblioteca: function () {
      if (raiz.Tesseract) return Promise.resolve(raiz.Tesseract);
      if (OCR._carregando) return OCR._carregando;
      var fontes = [];
      if (cfg.ocr.caminhoLocal) fontes.push(cfg.ocr.caminhoLocal);
      fontes.push(cfg.ocr.cdn);
      fontes.push('https://unpkg.com/tesseract.js@5.1.1/dist/tesseract.min.js');
      OCR._carregando = new Promise(function (ok, erro) {
        (function tentar(i) {
          if (i >= fontes.length) { erro(new Error('ocr-indisponivel')); return; }
          var s = el('script', { src: fontes[i] });
          s.onload = function () { raiz.Tesseract ? ok(raiz.Tesseract) : tentar(i + 1); };
          s.onerror = function () { tentar(i + 1); };
          d.head.appendChild(s);
        })(0);
      });
      return OCR._carregando;
    },

    motor: function (aoProgredir) {
      if (OCR._motor) return Promise.resolve(OCR._motor);
      return OCR.carregarBiblioteca().then(function (T) {
        var op = {
          logger: function (m) {
            if (aoProgredir && m && typeof m.progress === 'number') aoProgredir(m.progress, m.status);
          }
        };
        if (cfg.ocr.caminhos.worker) op.workerPath = cfg.ocr.caminhos.worker;
        if (cfg.ocr.caminhos.core) op.corePath = cfg.ocr.caminhos.core;
        if (cfg.ocr.caminhos.lang) { op.langPath = cfg.ocr.caminhos.lang; op.gzip = cfg.ocr.gzip !== false; }
        return T.createWorker(cfg.ocr.idiomas, 1, op);
      }).then(function (w) { OCR._motor = w; return w; });
    },

    /* melhora a foto antes de ler: aumenta, tira a cor e reforca o contraste */
    tratar: function (fonte) {
      var largura = fonte.naturalWidth || fonte.videoWidth || fonte.width;
      var altura = fonte.naturalHeight || fonte.videoHeight || fonte.height;
      if (!largura || !altura) return fonte;
      var escala = Math.min(3, Math.max(1, 1400 / largura));
      var c = d.createElement('canvas');
      c.width = Math.round(largura * escala); c.height = Math.round(altura * escala);
      var ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(fonte, 0, 0, c.width, c.height);
      try {
        var img = ctx.getImageData(0, 0, c.width, c.height), p = img.data, i, v;
        var min = 255, max = 0;
        for (i = 0; i < p.length; i += 4) {
          v = (p[i] * 0.299 + p[i + 1] * 0.587 + p[i + 2] * 0.114) | 0;
          p[i] = p[i + 1] = p[i + 2] = v;
          if (v < min) min = v; if (v > max) max = v;
        }
        var amp = (max - min) || 1;
        for (i = 0; i < p.length; i += 4) {
          v = ((p[i] - min) * 255 / amp) | 0;
          v = v < 0 ? 0 : (v > 255 ? 255 : v);
          p[i] = p[i + 1] = p[i + 2] = v;
        }
        ctx.putImageData(img, 0, 0);
      } catch (e) {}
      return c;
    },

    ler: function (fonte, aoProgredir) {
      return OCR.motor(aoProgredir).then(function (w) {
        return w.recognize(OCR.tratar(fonte));
      }).then(function (r) {
        var dados = r && r.data ? r.data : {};
        return {
          texto: texto(dados.text).replace(/[ \t]+\n/g, '\n').trim(),
          confianca: dados.confidence || 0,
          linhas: (dados.lines || []).map(function (l) { return l.text; })
        };
      });
    },

    lerArquivo: function (arquivo, aoProgredir) {
      return new Promise(function (ok, erro) {
        var img = new Image();
        img.onload = function () { ok(OCR.ler(img, aoProgredir)); };
        img.onerror = function () { erro(new Error('imagem-invalida')); };
        img.src = URL.createObjectURL(arquivo);
      });
    },

    /* utilidades uteis para nota fiscal / recibo */
    extrair: function (txt) {
      txt = texto(txt);
      var valores = (txt.match(/(?:R\$|\bUS\$|\$)\s?-?\d{1,3}(?:[.\s]\d{3})*(?:[,.]\d{2})?/gi) || []);
      var numeros = valores.map(function (v) {
        var n = v.replace(/[^\d,.-]/g, '');
        if (/,\d{2}$/.test(n)) n = n.replace(/\./g, '').replace(',', '.');
        else n = n.replace(/,/g, '');
        return parseFloat(n);
      }).filter(function (n) { return !isNaN(n); });
      var datas = (txt.match(/\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b/g) || []);
      var cnpj = (txt.match(/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g) || []);
      return {
        valores: numeros,
        maiorValor: numeros.length ? Math.max.apply(null, numeros) : null,
        datas: datas.map(function (s) {
          var p = s.split(/[\/.-]/), ano = p[2].length === 2 ? ('20' + p[2]) : p[2];
          return formatarData(new Date(+ano, +p[1] - 1, +p[0]));
        }),
        cnpj: cnpj,
        primeiraLinha: (txt.split('\n').find(function (l) { return l.trim().length > 3; }) || '').trim()
      };
    },

    pararCamera: function () {
      if (OCR._stream) { OCR._stream.getTracks().forEach(function (f) { f.stop(); }); OCR._stream = null; }
    }
  };

  /* ------------------------------------------------------------------
     11. NUVEM — pasta privada do app no Google Drive / OneDrive
         Escopo minimo: o app so enxerga a pasta que ele mesmo cria.
     ------------------------------------------------------------------ */
  function pkceVerificador() {
    var b = aleatorio(32);
    return bytesParaB64(b);
  }
  function pkceDesafio(verificador) {
    if (!temCripto) return Promise.resolve(verificador);
    return raiz.crypto.subtle.digest('SHA-256', new TextEncoder().encode(verificador)).then(bytesParaB64);
  }
  function abrirPopup(url, nome) {
    var l = Math.max(0, (raiz.screen.width - 520) / 2), tp = Math.max(0, (raiz.screen.height - 640) / 2);
    return raiz.open(url, nome || 'dgo-auth', 'width=520,height=640,left=' + l + ',top=' + tp);
  }

  var Nuvem = {
    conectado: function () {
      return Guardar.ler('nuvem-provedor', null) || null;
    },

    google: {
      token: null,
      conectar: function () {
        if (!cfg.nuvem.google.clientId) return Promise.reject(new Error('sem-client-id'));
        return Google.carregar().then(function () {
          return new Promise(function (ok, erro) {
            var cliente = raiz.google.accounts.oauth2.initTokenClient({
              client_id: cfg.nuvem.google.clientId,
              scope: 'https://www.googleapis.com/auth/drive.appdata',
              callback: function (r) {
                if (r && r.access_token) {
                  Nuvem.google.token = r.access_token;
                  Guardar.gravar('nuvem-provedor', 'google');
                  ok(true);
                } else erro(new Error('sem-token'));
              }
            });
            cliente.requestAccessToken();
          });
        });
      },
      _achar: function () {
        return fetch('https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=files(id,name,modifiedTime)&q=' +
          encodeURIComponent("name='" + cfg.nuvem.arquivo + "'"), {
          headers: { Authorization: 'Bearer ' + Nuvem.google.token }
        }).then(function (r) { return r.json(); })
          .then(function (j) { return (j.files && j.files[0]) || null; });
      },
      enviar: function (dados) {
        var corpo = JSON.stringify(dados);
        return Nuvem.google._achar().then(function (arq) {
          var meta = { name: cfg.nuvem.arquivo, mimeType: 'application/json' };
          if (!arq) meta.parents = ['appDataFolder'];
          var limite = '-dgo-' + Date.now();
          var multi = '--' + limite + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' +
            JSON.stringify(meta) + '\r\n--' + limite +
            '\r\nContent-Type: application/json\r\n\r\n' + corpo + '\r\n--' + limite + '--';
          var url = 'https://www.googleapis.com/upload/drive/v3/files' + (arq ? ('/' + arq.id) : '') + '?uploadType=multipart';
          return fetch(url, {
            method: arq ? 'PATCH' : 'POST',
            headers: { Authorization: 'Bearer ' + Nuvem.google.token, 'Content-Type': 'multipart/related; boundary=' + limite },
            body: multi
          }).then(function (r) { if (!r.ok) throw new Error('falha-envio'); return r.json(); });
        });
      },
      baixar: function () {
        return Nuvem.google._achar().then(function (arq) {
          if (!arq) return null;
          return fetch('https://www.googleapis.com/drive/v3/files/' + arq.id + '?alt=media', {
            headers: { Authorization: 'Bearer ' + Nuvem.google.token }
          }).then(function (r) { return r.json(); });
        });
      }
    },

    microsoft: {
      token: null,
      conectar: function () {
        var id = cfg.nuvem.microsoft.clientId;
        if (!id) return Promise.reject(new Error('sem-client-id'));
        var verif = pkceVerificador();
        var redirect = raiz.location.origin + raiz.location.pathname;
        return pkceDesafio(verif).then(function (desafio) {
          var url = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=' + encodeURIComponent(id) +
            '&response_type=code&redirect_uri=' + encodeURIComponent(redirect) +
            '&scope=' + encodeURIComponent('Files.ReadWrite.AppFolder offline_access openid profile') +
            '&code_challenge=' + encodeURIComponent(desafio) + '&code_challenge_method=S256' +
            '&state=dgo&prompt=select_account';
          var win = abrirPopup(url, 'dgo-ms');
          return new Promise(function (ok, erro) {
            var t0 = Date.now();
            var timer = setInterval(function () {
              if (Date.now() - t0 > 180000) { clearInterval(timer); erro(new Error('tempo')); return; }
              var codigo = null;
              try {
                if (win && win.location && win.location.origin === raiz.location.origin) {
                  var q = new URLSearchParams(win.location.search);
                  codigo = q.get('code');
                }
              } catch (e) { /* ainda na Microsoft */ }
              if (codigo) {
                clearInterval(timer); win.close();
                var corpo = new URLSearchParams({
                  client_id: id, grant_type: 'authorization_code', code: codigo,
                  redirect_uri: redirect, code_verifier: verif
                });
                fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
                  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: corpo
                }).then(function (r) { return r.json(); }).then(function (j) {
                  if (!j.access_token) throw new Error('sem-token');
                  Nuvem.microsoft.token = j.access_token;
                  Guardar.gravar('nuvem-provedor', 'microsoft');
                  ok(true);
                }).catch(erro);
              } else if (win && win.closed) { clearInterval(timer); erro(new Error('cancelado')); }
            }, 700);
          });
        });
      },
      enviar: function (dados) {
        return fetch('https://graph.microsoft.com/v1.0/me/drive/special/approot:/' + cfg.nuvem.arquivo + ':/content', {
          method: 'PUT',
          headers: { Authorization: 'Bearer ' + Nuvem.microsoft.token, 'Content-Type': 'application/json' },
          body: JSON.stringify(dados)
        }).then(function (r) { if (!r.ok) throw new Error('falha-envio'); return r.json(); });
      },
      baixar: function () {
        return fetch('https://graph.microsoft.com/v1.0/me/drive/special/approot:/' + cfg.nuvem.arquivo + ':/content', {
          headers: { Authorization: 'Bearer ' + Nuvem.microsoft.token }
        }).then(function (r) { return r.ok ? r.json() : null; });
      }
    },

    /* backup que funciona sempre, sem depender de nuvem nenhuma */
    salvarArquivo: function (dados, nomeArquivo) {
      var blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
      var a = el('a', { href: URL.createObjectURL(blob), download: nomeArquivo || (cfg.app + '-backup.json') });
      d.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    },
    abrirArquivo: function () {
      return new Promise(function (ok, erro) {
        var inp = el('input', { type: 'file', accept: 'application/json,.json', style: { display: 'none' } });
        inp.addEventListener('change', function () {
          var f = inp.files && inp.files[0];
          if (!f) { erro(new Error('cancelado')); return; }
          var fr = new FileReader();
          fr.onload = function () { try { ok(JSON.parse(fr.result)); } catch (e) { erro(e); } };
          fr.onerror = function () { erro(new Error('falha-leitura')); };
          fr.readAsText(f);
          inp.remove();
        });
        d.body.appendChild(inp); inp.click();
      });
    }
  };

  /* ------------------------------------------------------------------
     12. COMPARTILHAMENTO NATIVO (WhatsApp e demais apps do aparelho)
     ------------------------------------------------------------------ */
  function compartilhar(dados) {
    dados = dados || {};
    var d2 = {
      title: dados.titulo || nomeApp(),
      text: dados.texto || '',
      url: dados.url || raiz.location.href
    };
    if (dados.arquivos && navigator.canShare && navigator.canShare({ files: dados.arquivos })) {
      d2.files = dados.arquivos;
    }
    if (navigator.share) {
      return navigator.share(d2).catch(function (e) {
        if (e && e.name === 'AbortError') return;
        return abrirMenuCompartilhar(d2);
      });
    }
    return abrirMenuCompartilhar(d2);
  }

  function abrirMenuCompartilhar(d2) {
    var msg = (d2.text ? d2.text + ' ' : '') + (d2.url || '');
    var opcoes = [
      ['WhatsApp', 'https://wa.me/?text=' + encodeURIComponent(msg)],
      ['Telegram', 'https://t.me/share/url?url=' + encodeURIComponent(d2.url) + '&text=' + encodeURIComponent(d2.text || '')],
      ['E-mail', 'mailto:?subject=' + encodeURIComponent(d2.title) + '&body=' + encodeURIComponent(msg)]
    ];
    var caixa = el('div', { class: 'dgo-caixa', style: { maxWidth: '360px' } }, [
      el('h2', { texto: t('compartilhar') })
    ]);
    opcoes.forEach(function (o) {
      caixa.appendChild(el('a', { class: 'dgo-b dgo-b2', href: o[1], target: '_blank', rel: 'noopener', texto: o[0],
        style: { textDecoration: 'none' } }));
    });
    caixa.appendChild(el('button', {
      class: 'dgo-b', type: 'button', texto: t('copiarLink'),
      onclick: function () {
        (navigator.clipboard ? navigator.clipboard.writeText(msg) : Promise.reject())
          .then(function () { this.textContent = t('copiado'); }.bind(this)).catch(function () {});
      }
    }));
    caixa.appendChild(el('button', { class: 'dgo-b dgo-b2', type: 'button', texto: t('fechar'),
      onclick: function () { fecharModal(); } }));
    return abrirModal(caixa);
  }

  /* ------------------------------------------------------------------
     13. APP INSTALAVEL (celular e computador) — base para o app nativo
     ------------------------------------------------------------------ */
  var PWA = {
    prompt: null,
    instalado: function () {
      return raiz.matchMedia && raiz.matchMedia('(display-mode: standalone)').matches ||
             raiz.navigator.standalone === true;
    },
    preparar: function () {
      if (!cfg.pwa.ativo) return;
      if (cfg.pwa.manifesto && !$('link[rel="manifest"]')) {
        d.head.appendChild(el('link', { rel: 'manifest', href: cfg.pwa.manifesto }));
      }
      raiz.addEventListener('beforeinstallprompt', function (ev) {
        ev.preventDefault(); PWA.prompt = ev; redesenharInterfaceDGO();
      });
      if ('serviceWorker' in navigator && cfg.pwa.serviceWorker && raiz.location.protocol !== 'file:') {
        raiz.addEventListener('load', function () {
          navigator.serviceWorker.register(cfg.pwa.serviceWorker).catch(function () {});
        });
      }
    },
    instalar: function () {
      if (!PWA.prompt) return Promise.resolve(false);
      PWA.prompt.prompt();
      return PWA.prompt.userChoice.then(function (r) { PWA.prompt = null; return r.outcome === 'accepted'; });
    }
  };

  /* ------------------------------------------------------------------
     14. PLATAFORMA — ponte para quando virar app nativo
     ------------------------------------------------------------------ */
  var Plataforma = {
    qual: function () {
      if (raiz.Capacitor) return 'capacitor';
      if (raiz.__TAURI__) return 'tauri';
      if (raiz.process && raiz.process.versions && raiz.process.versions.electron) return 'electron';
      if (PWA.instalado()) return 'pwa';
      return 'web';
    },
    ehCelular: function () {
      return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
             (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform));
    },
    /* pontos de troca: um app nativo substitui so estas tres funcoes */
    adaptadores: { camera: null, armazenamento: null, compartilhar: null }
  };

  /* ------------------------------------------------------------------
     15. JANELAS (modais) DO MODULO
     ------------------------------------------------------------------ */
  var modalEl = null;
  function abrirModal(caixa, recriar) {
    fecharModal();
    modalEl = el('div', { class: 'dgo-modal', 'data-dgo-ui': '1', role: 'dialog', 'aria-modal': 'true' }, [caixa]);
    modalEl._recriar = recriar || null;
    modalEl.addEventListener('click', function (e) { if (e.target === modalEl) fecharModal(); });
    d.addEventListener('keydown', escFecha);
    d.body.appendChild(modalEl);
    var primeiro = modalEl.querySelector('input,button,select,textarea');
    if (primeiro && !Plataforma.ehCelular()) { try { primeiro.focus(); } catch (e) {} }
    return modalEl;
  }
  function escFecha(e) { if (e.key === 'Escape') fecharModal(); }
  function fecharModal() {
    OCR.pararCamera();
    d.removeEventListener('keydown', escFecha);
    if (modalEl && modalEl.parentNode) modalEl.parentNode.removeChild(modalEl);
    modalEl = null;
  }
  function redesenharInterfaceDGO() {
    if (modalEl && typeof modalEl._recriar === 'function') { var f = modalEl._recriar; fecharModal(); f(); }
    if (bannerEl) { /* o texto do placeholder muda com o idioma */
      var img = bannerEl.querySelector('img');
      if (img && !cfg.anuncios.imagem) img.src = imagemPlaceholder();
    }
  }
  function campo(rotulo, props) {
    var i = el('input', props || { type: 'text' });
    var l = el('label', { class: 'dgo-campo' }, [el('span', { texto: rotulo }), i]);
    l._input = i;
    return l;
  }
  function aviso(txt, tipo) { return el('div', { class: 'dgo-aviso ' + (tipo || 'info'), texto: txt }); }

  /* ------------------------------------------------------------------
     16. TELA DE ACESSO
     ------------------------------------------------------------------ */
  function abrirLogin(abaInicial) {
    var aba = abaInicial || 'visitante';
    if (!cfg.login.permitirVisitante && aba === 'visitante') aba = 'pagante';

    function montar() {
      var caixa = el('div', { class: 'dgo-caixa' });
      caixa.appendChild(el('h2', { texto: nomeApp() }));
      caixa.appendChild(el('p', { texto: t('entrar') }));

      var abas = el('div', { class: 'dgo-abas' });
      var lista = [];
      if (cfg.login.permitirVisitante) lista.push(['visitante', t('visitante')]);
      if (cfg.login.permitirPagante) lista.push(['pagante', t('assinante')]);
      if (cfg.login.permitirAnunciante) lista.push(['anunciante', t('anunciante')]);
      lista.forEach(function (par) {
        abas.appendChild(el('button', {
          type: 'button', class: aba === par[0] ? 'dgo-on' : '', texto: par[1],
          onclick: function () { aba = par[0]; abrirModal(montar(), function () { abrirLogin(aba); }); }
        }));
      });
      caixa.appendChild(abas);

      var corpo = el('div');
      caixa.appendChild(corpo);

      if (aba === 'visitante') {
        corpo.appendChild(aviso(t('avisoVisitante'), 'info'));
        corpo.appendChild(el('button', {
          class: 'dgo-b', type: 'button', texto: t('entrarVisitante'),
          onclick: function () { Sessao.entrar('visitante', { nome: t('visitante') }); fecharModal(); }
        }));
      } else {
        var ehAnunciante = (aba === 'anunciante');
        corpo.appendChild(aviso(ehAnunciante ? t('avisoAnunciante') : t('avisoAssinante'), 'info'));

        var modoCriar = { v: false };
        var cApelido = campo(t('apelido'), { type: 'text', autocomplete: 'username',
                                             autocapitalize: 'none', spellcheck: 'false' });
        var cIdent = campo(t('apelidoOuEmail'), { type: 'text', autocomplete: 'username',
                                                  autocapitalize: 'none', spellcheck: 'false' });
        var cEmail = campo(t('email'), { type: 'email', autocomplete: 'email', inputmode: 'email' });
        var cSenha = campo(t('senha'), { type: 'password', autocomplete: 'current-password' });
        var cSenha2 = campo(t('confirmarSenha'), { type: 'password', autocomplete: 'new-password' });

        cApelido.style.display = 'none';
        cEmail.style.display = 'none';
        cSenha2.style.display = 'none';
        corpo.appendChild(cApelido);
        corpo.appendChild(cIdent);
        corpo.appendChild(cEmail);
        corpo.appendChild(cSenha);
        corpo.appendChild(cSenha2);

        var msg = el('div');
        var bPrincipal = el('button', { class: 'dgo-b', type: 'button', texto: t('entrar') });
        var bTrocar = el('button', { class: 'dgo-b dgo-b2', type: 'button', texto: t('criarConta') });

        function mostrar(txt, tipo) { msg.innerHTML = ''; msg.appendChild(aviso(txt, tipo || 'erro')); }

        function aplicarModo() {
          var criando = modoCriar.v;
          cApelido.style.display = (criando && cfg.login.exigirApelido) ? '' : 'none';
          cEmail.style.display = criando ? '' : 'none';
          cIdent.style.display = criando ? 'none' : '';
          cSenha2.style.display = criando ? '' : 'none';
          cSenha._input.setAttribute('autocomplete', criando ? 'new-password' : 'current-password');
          bPrincipal.textContent = criando ? t('criarConta') : t('entrar');
          bTrocar.textContent = criando ? t('jaTenhoConta') : t('criarConta');
          msg.innerHTML = '';
        }
        bTrocar.addEventListener('click', function () { modoCriar.v = !modoCriar.v; aplicarModo(); });

        function erroEmTexto(e) {
          var m = (e && e.message) || '';
          if (m === 'apelido-curto') return t('apelidoCurto');
          if (m === 'apelido-em-uso') return t('apelidoEmUso');
          if (m === 'email-invalido') return t('emailInvalido');
          if (m === 'senha-curta') return t('senhaCurta');
          if (m === 'existe') return t('contaExiste');
          if (m === 'sem-conta') return t('semConta');
          return t('dadosErrados');
        }

        bPrincipal.addEventListener('click', function () {
          var senha = cSenha._input.value;
          bPrincipal.disabled = true;
          var fim = function () { bPrincipal.disabled = false; };

          if (modoCriar.v) {
            var apelido = cApelido._input.value.trim();
            var email = cEmail._input.value.trim();
            if (senha !== cSenha2._input.value) { mostrar(t('senhasDiferentes')); fim(); return; }
            if (Sessao.backend && Sessao.backend.cadastrar) {
              Sessao.backend.cadastrar({ apelido: apelido, email: email, senha: senha, tipo: aba })
                .then(function (u) { Sessao.entrar(aba, u || { email: email, nome: apelido }); fecharModal(); })
                .catch(function (e) { mostrar(erroEmTexto(e)); }).then(fim, fim);
              return;
            }
            Contas.criar({ apelido: apelido, email: email, senha: senha, tipo: aba })
              .then(function (r) {
                Sessao.entrar(aba, { email: r.conta.email, nome: r.conta.apelido, apelido: r.conta.apelido });
                mostrarCodigoRecuperacao(r.codigo, r.conta);
              })
              .catch(function (e) { mostrar(erroEmTexto(e)); }).then(fim, fim);
            return;
          }

          var ident = cIdent._input.value.trim();
          if (!ident) { mostrar(t('identificadorVazio')); fim(); return; }
          if (Sessao.backend && Sessao.backend.entrar) {
            Sessao.backend.entrar(ident, senha, aba)
              .then(function (u) { Sessao.entrar(aba, u || { email: ident }); fecharModal(); })
              .catch(function (e) { mostrar(erroEmTexto(e)); }).then(fim, fim);
            return;
          }
          Contas.conferir(ident, senha).then(function (c) {
            Sessao.entrar(c.tipo || aba, { email: c.email, nome: c.apelido || c.nome, apelido: c.apelido });
            fecharModal();
            if (cfg.login.biometria && Biometria.suportada() && !Biometria.registrada()) perguntarBiometria(c.email);
          }).catch(function (e) { mostrar(erroEmTexto(e)); }).then(fim, fim);
        });

        corpo.appendChild(bPrincipal);
        corpo.appendChild(bTrocar);

        /* esqueci a senha */
        corpo.appendChild(el('button', {
          class: 'dgo-b dgo-b2', type: 'button', texto: t('esqueciSenha'),
          style: { background: 'transparent', border: '0', color: '#7dd3fc', textDecoration: 'underline',
                   minHeight: '38px', fontWeight: '600' },
          onclick: function () { abrirRecuperacao(aba); }
        }));
        corpo.appendChild(msg);

        if (cfg.login.google.clientId) {
          corpo.appendChild(el('button', {
            class: 'dgo-b dgo-b2', type: 'button', texto: t('entrarGoogle'),
            onclick: function () { Google.entrar().then(fecharModal).catch(function () { mostrar(t('naoConfigurado')); }); }
          }));
        }
        if (cfg.login.biometria && Biometria.suportada() && Biometria.registrada()) {
          corpo.appendChild(el('button', {
            class: 'dgo-b dgo-b2', type: 'button', texto: t('entrarBiometria'),
            onclick: function () { Biometria.entrar().then(fecharModal).catch(function () { mostrar(t('dadosErrados')); }); }
          }));
        }
        aplicarModo();
      }
      return caixa;
    }
    return abrirModal(montar(), function () { abrirLogin(aba); });
  }

  /* ---- o codigo de recuperacao, mostrado uma unica vez ---- */
  function mostrarCodigoRecuperacao(codigo, conta, motivo) {
    var caixa = el('div', { class: 'dgo-caixa' });
    caixa.appendChild(el('h2', { texto: t('codigoRecuperacao') }));
    caixa.appendChild(aviso(motivo === 'trocada' ? t('senhaTrocada') : t('contaCriada'), 'ok'));
    caixa.appendChild(el('p', { texto: t('guardeCodigo') }));
    caixa.appendChild(el('div', {
      texto: codigo,
      style: { fontFamily: 'ui-monospace,Menlo,Consolas,monospace', fontSize: '25px', fontWeight: '700',
               letterSpacing: '.09em', textAlign: 'center', color: '#fff', background: '#0b1220',
               border: '1px dashed rgba(94,234,212,.6)', borderRadius: '12px', padding: '16px 8px', margin: '4px 0 6px',
               userSelect: 'all', wordBreak: 'break-all' }
    }));
    var linha = el('div', { class: 'dgo-linha' });
    linha.appendChild(el('button', {
      class: 'dgo-b dgo-b2', type: 'button', texto: t('copiarCodigo'),
      onclick: function () {
        var b = this;
        (navigator.clipboard ? navigator.clipboard.writeText(codigo) : Promise.reject())
          .then(function () { b.textContent = t('copiado'); }).catch(function () {});
      }
    }));
    linha.appendChild(el('button', {
      class: 'dgo-b dgo-b2', type: 'button', texto: t('baixarCodigo'),
      onclick: function () {
        var txt = nomeApp() + '\n' +
          t('apelido') + ': ' + ((conta && conta.apelido) || '') + '\n' +
          t('email') + ': ' + ((conta && conta.email) || '') + '\n' +
          t('codigoRecuperacao') + ': ' + codigo + '\n' +
          formatarData(new Date(), null, true) + '\n';
        var blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
        var a = el('a', { href: URL.createObjectURL(blob), download: cfg.app + '-codigo-de-recuperacao.txt' });
        d.body.appendChild(a); a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
      }
    }));
    caixa.appendChild(linha);
    caixa.appendChild(el('button', {
      class: 'dgo-b', type: 'button', texto: t('jaGuardei'),
      onclick: function () {
        fecharModal();
        if (cfg.login.biometria && Biometria.suportada() && conta) perguntarBiometria(conta.email);
      }
    }));
    return abrirModal(caixa);
  }

  /* ---- esqueci a senha ---- */
  function abrirRecuperacao(aba) {
    var temServidor = !!(Sessao.backend && Sessao.backend.pedirRedefinicao);
    var temFormulario = !!(cfg.login.formularioRecuperacao || cfg.email.formulario);
    var modo = temServidor ? 'email' : 'codigo';

    function montar() {
      var caixa = el('div', { class: 'dgo-caixa' });
      caixa.appendChild(el('h2', { texto: t('recuperarSenha') }));
      var msg = el('div');
      function mostrar(txt, tipo) { msg.innerHTML = ''; msg.appendChild(aviso(txt, tipo || 'erro')); }

      /* escolha do caminho, quando ha mais de um */
      var caminhos = [];
      if (temServidor) caminhos.push(['email', t('porEmail')]);
      caminhos.push(['codigo', t('porCodigo')]);
      if (temFormulario) caminhos.push(['pedido', t('pedirAoDono')]);
      if (caminhos.length > 1) {
        caixa.appendChild(el('p', { texto: t('comoRecuperar') }));
        var abas = el('div', { class: 'dgo-abas' });
        caminhos.forEach(function (c) {
          abas.appendChild(el('button', {
            type: 'button', class: modo === c[0] ? 'dgo-on' : '', texto: c[1],
            onclick: function () { modo = c[0]; abrirModal(montar(), function () { abrirRecuperacao(aba); }); }
          }));
        });
        caixa.appendChild(abas);
      }

      if (modo === 'email') {
        var cE = campo(t('email'), { type: 'email', autocomplete: 'email', inputmode: 'email' });
        caixa.appendChild(cE);
        caixa.appendChild(el('button', {
          class: 'dgo-b', type: 'button', texto: t('enviarPedido'),
          onclick: function () {
            Sessao.backend.pedirRedefinicao(cE._input.value.trim())
              .then(function () { mostrar(t('verifiqueEmail'), 'ok'); })
              .catch(function () { mostrar(t('pedidoFalhou')); });
          }
        }));

      } else if (modo === 'pedido') {
        var cE2 = campo(t('email'), { type: 'email', autocomplete: 'email', inputmode: 'email' });
        var cM = el('label', { class: 'dgo-campo' }, [
          el('span', { texto: t('mensagem') }),
          el('textarea', { rows: 4 })
        ]);
        caixa.appendChild(cE2); caixa.appendChild(cM);
        caixa.appendChild(el('button', {
          class: 'dgo-b', type: 'button', texto: t('enviarPedido'),
          onclick: function () {
            var b = this; b.disabled = true;
            var alvo = cfg.login.formularioRecuperacao || cfg.email.formulario;
            var corpo = {
              app: cfg.app, assunto: t('recuperarSenha') + ' - ' + nomeApp(),
              mensagem: cM.querySelector('textarea').value,
              email: cE2._input.value.trim(), idioma: Idioma.atual, em: new Date().toISOString()
            };
            fetch(alvo, { method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
              body: JSON.stringify(corpo) })
              .then(function (r) { if (!r.ok) throw new Error('x'); mostrar(t('pedidoEnviado'), 'ok'); })
              .catch(function () { mostrar(t('pedidoFalhou')); })
              .then(function () { b.disabled = false; });
          }
        }));

      } else {
        if (!temServidor && !temFormulario) caixa.appendChild(aviso(t('semRecuperacaoConfigurada'), 'info'));
        var cId = campo(t('apelidoOuEmail'), { type: 'text', autocapitalize: 'none', spellcheck: 'false' });
        var cCod = campo(t('codigoRecuperacao'), { type: 'text', placeholder: 'ABCD-EF23-GH45',
                                                   autocapitalize: 'characters', spellcheck: 'false' });
        var cN1 = campo(t('novaSenha'), { type: 'password', autocomplete: 'new-password' });
        var cN2 = campo(t('confirmarNovaSenha'), { type: 'password', autocomplete: 'new-password' });
        [cId, cCod, cN1, cN2].forEach(function (x) { caixa.appendChild(x); });
        caixa.appendChild(el('button', {
          class: 'dgo-b', type: 'button', texto: t('trocarSenha'),
          onclick: function () {
            if (cN1._input.value !== cN2._input.value) { mostrar(t('senhasDiferentes')); return; }
            var b = this; b.disabled = true;
            Contas.redefinirComCodigo(cId._input.value.trim(), cCod._input.value, cN1._input.value)
              .then(function (r) {
                fecharModal();
                mostrarCodigoRecuperacao(r.codigo, r.conta, 'trocada');
              })
              .catch(function (e) {
                var m = (e && e.message) || '';
                mostrar(m === 'codigo-errado' ? t('codigoErrado')
                      : m === 'sem-conta' ? t('semConta')
                      : m === 'senha-curta' ? t('senhaCurta') : t('dadosErrados'));
              })
              .then(function () { b.disabled = false; });
          }
        }));
      }

      caixa.appendChild(msg);
      caixa.appendChild(el('div', { class: 'dgo-sep' }));
      caixa.appendChild(el('button', { class: 'dgo-b dgo-b2', type: 'button', texto: Idioma.atual === 'en' ? 'Back' : 'Voltar',
        onclick: function () { abrirLogin(aba); } }));
      return caixa;
    }
    return abrirModal(montar(), function () { abrirRecuperacao(aba); });
  }

  function perguntarBiometria(email) {
    var caixa = el('div', { class: 'dgo-caixa', style: { maxWidth: '360px' } }, [
      el('h2', { texto: t('ativarBiometria') }),
      el('p', { texto: nomeApp() })
    ]);
    caixa.appendChild(el('button', {
      class: 'dgo-b', type: 'button', texto: t('ativarBiometria'),
      onclick: function () { Biometria.registrar(email).then(fecharModal).catch(fecharModal); }
    }));
    caixa.appendChild(el('button', { class: 'dgo-b dgo-b2', type: 'button', texto: t('cancelar'), onclick: fecharModal }));
    abrirModal(caixa);
  }

  /* ------------------------------------------------------------------
     17. TELA DE OCR
     ------------------------------------------------------------------ */
  function abrirOCR(opcoes) {
    opcoes = opcoes || {};
    var caixa = el('div', { class: 'dgo-caixa dgo-larga' });
    caixa.appendChild(el('h2', { texto: t('escanear') }));
    var area = el('div');
    var barra = el('div', { class: 'dgo-barra', style: { display: 'none' } }, [el('i')]);
    var estado = el('div');
    var saida = el('div');
    caixa.appendChild(area); caixa.appendChild(barra); caixa.appendChild(estado); caixa.appendChild(saida);

    var video = null, fotoCanvas = null;

    function limpar() { area.innerHTML = ''; saida.innerHTML = ''; estado.innerHTML = ''; barra.style.display = 'none'; }

    function progresso(p, st) {
      barra.style.display = '';
      barra.firstChild.style.width = Math.round((p || 0) * 100) + '%';
      estado.innerHTML = '';
      estado.appendChild(aviso(st === 'recognizing text' ? t('lendo') : t('carregandoMotor'), 'info'));
    }

    function mostrarResultado(r) {
      barra.style.display = 'none'; estado.innerHTML = '';
      saida.innerHTML = '';
      saida.appendChild(el('h3', { texto: t('textoLido') }));
      var ta = el('textarea', { rows: 9, style: { width: '100%', boxSizing: 'border-box', padding: '11px',
        borderRadius: '10px', border: '1px solid rgba(255,255,255,.16)', background: '#0b1220', color: '#e2e8f0',
        fontSize: '14px', fontFamily: 'ui-monospace,Menlo,Consolas,monospace' } });
      ta.value = r.texto || '';
      saida.appendChild(ta);
      var extras = OCR.extrair(r.texto);
      if (extras.maiorValor !== null || extras.datas.length) {
        var det = [];
        if (extras.maiorValor !== null) det.push((Idioma.atual === 'en' ? 'Largest amount: ' : 'Maior valor: ') + extras.maiorValor.toFixed(2));
        if (extras.datas.length) det.push((Idioma.atual === 'en' ? 'Date: ' : 'Data: ') + extras.datas[0]);
        saida.appendChild(aviso(det.join('   |   '), 'ok'));
      }
      var linha = el('div', { class: 'dgo-linha' });
      linha.appendChild(el('button', { class: 'dgo-b', type: 'button', texto: t('usarTexto'), onclick: function () {
        if (typeof opcoes.aoTexto === 'function') opcoes.aoTexto(ta.value, extras);
        d.dispatchEvent(new CustomEvent('dgo:ocr', { detail: { texto: ta.value, dados: extras } }));
        fecharModal();
      } }));
      linha.appendChild(el('button', { class: 'dgo-b dgo-b2', type: 'button', texto: t('copiarTexto'), onclick: function () {
        if (navigator.clipboard) navigator.clipboard.writeText(ta.value);
      } }));
      linha.appendChild(el('button', { class: 'dgo-b dgo-b2', type: 'button', texto: t('outraFoto'), onclick: inicio }));
      saida.appendChild(linha);
    }

    function lerFonte(fonte) {
      progresso(0.02, '');
      OCR.ler(fonte, progresso).then(mostrarResultado).catch(function () {
        estado.innerHTML = ''; estado.appendChild(aviso(t('semCamera'), 'erro'));
        barra.style.display = 'none';
      });
    }

    function usarCamera() {
      limpar();
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        area.appendChild(aviso(t('semCamera'), 'erro')); return;
      }
      navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false
      }).then(function (stream) {
        OCR._stream = stream;
        video = el('video', { class: 'dgo-video', autoplay: '', playsinline: '', muted: '' });
        video.srcObject = stream; video.muted = true;
        area.appendChild(video);
        area.appendChild(el('button', { class: 'dgo-b', type: 'button', texto: t('tirarFoto'), onclick: function () {
          fotoCanvas = d.createElement('canvas');
          fotoCanvas.width = video.videoWidth; fotoCanvas.height = video.videoHeight;
          fotoCanvas.getContext('2d').drawImage(video, 0, 0);
          OCR.pararCamera();
          limpar();
          fotoCanvas.className = 'dgo-foto';
          area.appendChild(fotoCanvas);
          var l = el('div', { class: 'dgo-linha' });
          l.appendChild(el('button', { class: 'dgo-b', type: 'button', texto: t('lerTexto'), onclick: function () { lerFonte(fotoCanvas); } }));
          l.appendChild(el('button', { class: 'dgo-b dgo-b2', type: 'button', texto: t('outraFoto'), onclick: usarCamera }));
          area.appendChild(l);
        } }));
        area.appendChild(el('button', { class: 'dgo-b dgo-b2', type: 'button', texto: t('cancelar'), onclick: inicio }));
      }).catch(function () {
        area.appendChild(aviso(t('semCamera'), 'erro'));
        area.appendChild(el('button', { class: 'dgo-b dgo-b2', type: 'button', texto: t('escolherImagem'), onclick: escolher }));
      });
    }

    function escolher() {
      var inp = el('input', { type: 'file', accept: 'image/*', capture: 'environment', style: { display: 'none' } });
      inp.addEventListener('change', function () {
        var f = inp.files && inp.files[0]; inp.remove();
        if (!f) return;
        limpar();
        var img = new Image();
        img.className = 'dgo-foto';
        img.onload = function () { area.appendChild(img); lerFonte(img); };
        img.src = URL.createObjectURL(f);
      });
      d.body.appendChild(inp); inp.click();
    }

    function inicio() {
      OCR.pararCamera(); limpar();
      area.appendChild(el('button', { class: 'dgo-b', type: 'button', texto: t('usarCamera'), onclick: usarCamera }));
      area.appendChild(el('button', { class: 'dgo-b dgo-b2', type: 'button', texto: t('escolherImagem'), onclick: escolher }));
      area.appendChild(el('button', { class: 'dgo-b dgo-b2', type: 'button', texto: t('fechar'), onclick: fecharModal }));
    }

    abrirModal(caixa);
    inicio();
    return modalEl;
  }

  /* ------------------------------------------------------------------
     18. CONFIGURACOES (painel central; cada app mostra so o que usa)
     ------------------------------------------------------------------ */
  var SECOES_PADRAO = ['idioma', 'conta', 'notificacoes', 'nuvem', 'ocr', 'app'];

  function montarConfiguracoes(opcoes) {
    opcoes = opcoes || {};
    var secoes = opcoes.secoes || SECOES_PADRAO;
    var raizEl = el('div', { 'data-dgo-ui': '1' });
    function tem(s) { return secoes.indexOf(s) !== -1; }

    if (tem('idioma')) {
      raizEl.appendChild(el('h3', { texto: t('idioma') }));
      var linhaId = el('div', { class: 'dgo-linha' });
      [['pt', 'Português'], ['en', 'English']].forEach(function (p) {
        linhaId.appendChild(el('button', {
          class: 'dgo-b' + (Idioma.atual === p[0] ? '' : ' dgo-b2'), type: 'button', texto: p[1],
          onclick: function () { Idioma.definir(p[0]); }
        }));
      });
      raizEl.appendChild(linhaId);
      raizEl.appendChild(el('div', { class: 'dgo-mini', texto:
        (Idioma.atual === 'en' ? 'Date format: ' : 'Formato de data: ') + formatarData(new Date()) }));
    }

    if (tem('conta')) {
      raizEl.appendChild(el('h3', { texto: t('conta') }));
      var r = Sessao.resumo();
      var qual = r.tipo === 'pagante' ? t('assinante') : r.tipo === 'anunciante' ? t('anunciante') :
                 r.tipo === 'visitante' ? t('visitante') : '-';
      raizEl.appendChild(aviso(qual + (r.usuario && r.usuario.email ? ('  -  ' + r.usuario.email) : ''), 'info'));
      if (r.tipo) {
        raizEl.appendChild(el('button', { class: 'dgo-b dgo-b2', type: 'button', texto: t('sair'),
          onclick: function () { Sessao.sair(); fecharModal(); } }));
        if (r.tipo !== 'visitante' && r.usuario && r.usuario.email && !Sessao.backend) {
          raizEl.appendChild(el('button', {
            class: 'dgo-b dgo-b2', type: 'button', texto: t('trocarSenha'),
            onclick: function () { abrirTrocaDeSenha(r.usuario.email); }
          }));
        }
        if (cfg.login.biometria && Biometria.suportada() && r.tipo !== 'visitante') {
          raizEl.appendChild(el('button', {
            class: 'dgo-b dgo-b2', type: 'button',
            texto: Biometria.registrada() ? t('biometriaAtiva') : t('ativarBiometria'),
            onclick: function () {
              if (Biometria.registrada()) { Biometria.remover(); abrirConfiguracoes(opcoes); }
              else Biometria.registrar(r.usuario && r.usuario.email).then(function () { abrirConfiguracoes(opcoes); }).catch(function () {});
            }
          }));
        }
      } else {
        raizEl.appendChild(el('button', { class: 'dgo-b', type: 'button', texto: t('entrar'),
          onclick: function () { fecharModal(); abrirLogin(); } }));
      }
      if (r.tipo === 'anunciante') {
        raizEl.appendChild(el('button', { class: 'dgo-b', type: 'button', texto: t('painelAnunciante'),
          onclick: function () { abrirPainelAnunciante(); } }));
      }
    }

    if (tem('notificacoes') && cfg.notificacoes.ativo) {
      raizEl.appendChild(el('h3', { texto: t('notificacoes') }));
      raizEl.appendChild(montarNotificacoes());
    }

    if (tem('nuvem')) {
      raizEl.appendChild(el('h3', { texto: t('nuvem') }));
      var msgN = el('div');
      function nuvemAviso(txt, tipo) { msgN.innerHTML = ''; msgN.appendChild(aviso(txt, tipo)); }
      var dadosApp = function () {
        return (typeof opcoes.dados === 'function') ? opcoes.dados() : (opcoes.dados || API.exportarDados());
      };
      var l1 = el('div', { class: 'dgo-linha' });
      l1.appendChild(el('button', { class: 'dgo-b dgo-b2', type: 'button', texto: t('conectarDrive'), onclick: function () {
        Nuvem.google.conectar().then(function () { nuvemAviso('Google Drive: OK', 'ok'); })
          .catch(function () { nuvemAviso(t('naoConfigurado'), 'erro'); });
      } }));
      l1.appendChild(el('button', { class: 'dgo-b dgo-b2', type: 'button', texto: t('conectarOneDrive'), onclick: function () {
        Nuvem.microsoft.conectar().then(function () { nuvemAviso('OneDrive: OK', 'ok'); })
          .catch(function () { nuvemAviso(t('naoConfigurado'), 'erro'); });
      } }));
      raizEl.appendChild(l1);
      var l2 = el('div', { class: 'dgo-linha' });
      l2.appendChild(el('button', { class: 'dgo-b dgo-b2', type: 'button', texto: t('enviarNuvem'), onclick: function () {
        var p = Nuvem.conectado();
        if (!p) { nuvemAviso(t('naoConfigurado'), 'erro'); return; }
        Nuvem[p === 'google' ? 'google' : 'microsoft'].enviar(dadosApp())
          .then(function () { nuvemAviso('OK  ' + formatarData(new Date(), null, true), 'ok'); })
          .catch(function () { nuvemAviso(t('naoConfigurado'), 'erro'); });
      } }));
      l2.appendChild(el('button', { class: 'dgo-b dgo-b2', type: 'button', texto: t('baixarNuvem'), onclick: function () {
        var p = Nuvem.conectado();
        if (!p) { nuvemAviso(t('naoConfigurado'), 'erro'); return; }
        Nuvem[p === 'google' ? 'google' : 'microsoft'].baixar().then(function (dd) {
          if (dd && typeof opcoes.aoRestaurar === 'function') opcoes.aoRestaurar(dd);
          else if (dd) API.importarDados(dd);
          nuvemAviso('OK', 'ok');
        }).catch(function () { nuvemAviso(t('naoConfigurado'), 'erro'); });
      } }));
      raizEl.appendChild(l2);
      var l3 = el('div', { class: 'dgo-linha' });
      l3.appendChild(el('button', { class: 'dgo-b dgo-b2', type: 'button', texto: t('salvarArquivo'), onclick: function () {
        Nuvem.salvarArquivo(dadosApp(), cfg.app + '-' + new Date().toISOString().slice(0, 10) + '.json');
      } }));
      l3.appendChild(el('button', { class: 'dgo-b dgo-b2', type: 'button', texto: t('abrirArquivo'), onclick: function () {
        Nuvem.abrirArquivo().then(function (dd) {
          if (typeof opcoes.aoRestaurar === 'function') opcoes.aoRestaurar(dd); else API.importarDados(dd);
          nuvemAviso('OK', 'ok');
        }).catch(function () {});
      } }));
      raizEl.appendChild(l3);
      raizEl.appendChild(msgN);
      raizEl.appendChild(el('div', { class: 'dgo-mini', texto: Idioma.atual === 'en'
        ? 'The app only sees its own private folder in your drive.'
        : 'O app so enxerga a pasta privada dele dentro do seu drive.' }));
    }

    if (tem('ocr') && cfg.ocr.ativo) {
      raizEl.appendChild(el('h3', { texto: t('escanear') }));
      raizEl.appendChild(el('button', { class: 'dgo-b', type: 'button', texto: t('usarCamera'),
        onclick: function () { abrirOCR({}); } }));
    }

    if (tem('app')) {
      raizEl.appendChild(el('h3', { texto: nomeApp() }));
      var lApp = el('div', { class: 'dgo-linha' });
      lApp.appendChild(el('button', { class: 'dgo-b dgo-b2', type: 'button', texto: t('compartilhar'),
        onclick: function () { compartilhar({ titulo: nomeApp() }); } }));
      if (PWA.prompt) {
        lApp.appendChild(el('button', { class: 'dgo-b', type: 'button', texto: t('instalarApp'),
          onclick: function () { PWA.instalar(); } }));
      } else if (PWA.instalado()) {
        lApp.appendChild(el('div', { class: 'dgo-mini', texto: t('appInstalado') }));
      }
      raizEl.appendChild(lApp);
      raizEl.appendChild(el('div', { class: 'dgo-mini', texto:
        t('versao') + ' ' + (cfg.versaoApp || '-') + '   |   Diretrizes ' + VERSAO +
        '   |   ' + Plataforma.qual() }));
    }

    if (opcoes.destino) {
      var dest = typeof opcoes.destino === 'string' ? $(opcoes.destino) : opcoes.destino;
      if (dest) { dest.innerHTML = ''; dest.appendChild(raizEl); }
    }
    return raizEl;
  }

  function abrirTrocaDeSenha(identificador) {
    var caixa = el('div', { class: 'dgo-caixa' });
    caixa.appendChild(el('h2', { texto: t('trocarSenha') }));
    var cA = campo(t('senhaAtual'), { type: 'password', autocomplete: 'current-password' });
    var cN1 = campo(t('novaSenha'), { type: 'password', autocomplete: 'new-password' });
    var cN2 = campo(t('confirmarNovaSenha'), { type: 'password', autocomplete: 'new-password' });
    [cA, cN1, cN2].forEach(function (x) { caixa.appendChild(x); });
    var msg = el('div');
    caixa.appendChild(el('button', {
      class: 'dgo-b', type: 'button', texto: t('salvar'),
      onclick: function () {
        msg.innerHTML = '';
        if (cN1._input.value !== cN2._input.value) { msg.appendChild(aviso(t('senhasDiferentes'), 'erro')); return; }
        var b = this; b.disabled = true;
        Contas.trocarSenha(identificador, cA._input.value, cN1._input.value)
          .then(function () { msg.appendChild(aviso(t('senhaTrocada'), 'ok')); })
          .catch(function (e) {
            var m = (e && e.message) || '';
            msg.appendChild(aviso(m === 'senha-curta' ? t('senhaCurta') : t('dadosErrados'), 'erro'));
          })
          .then(function () { b.disabled = false; });
      }
    }));
    caixa.appendChild(msg);
    caixa.appendChild(el('button', { class: 'dgo-b dgo-b2', type: 'button', texto: t('fechar'), onclick: fecharModal }));
    return abrirModal(caixa, function () { abrirTrocaDeSenha(identificador); });
  }

  function abrirConfiguracoes(opcoes) {
    var caixa = el('div', { class: 'dgo-caixa' });
    caixa.appendChild(el('h2', { texto: t('configuracoes') }));
    caixa.appendChild(montarConfiguracoes(opcoes || {}));
    caixa.appendChild(el('div', { class: 'dgo-sep' }));
    caixa.appendChild(el('button', { class: 'dgo-b dgo-b2', type: 'button', texto: t('fechar'), onclick: fecharModal }));
    return abrirModal(caixa, function () { abrirConfiguracoes(opcoes); });
  }

  /* ------------------------------------------------------------------
     19. PAINEL DO ANUNCIANTE
     ------------------------------------------------------------------ */
  function campanhas() { return Guardar.ler('campanhas', [], true) || []; }
  function gravarCampanhas(l) { Guardar.gravar('campanhas', l, true); }

  function abrirPainelAnunciante() {
    function montar() {
      var caixa = el('div', { class: 'dgo-caixa dgo-larga' });
      caixa.appendChild(el('h2', { texto: t('painelAnunciante') }));
      var tot = Anuncios.totais();
      var res = el('div', { class: 'dgo-linha' });
      [[t('exibicoes'), tot.exibicao], [t('cliques'), tot.clique],
       ['CTR', (tot.exibicao ? ((tot.clique / tot.exibicao) * 100).toFixed(1) : '0.0') + '%']].forEach(function (p) {
        res.appendChild(el('div', { style: { background: '#0b1220', border: '1px solid rgba(255,255,255,.12)',
          borderRadius: '12px', padding: '12px' } }, [
          el('div', { class: 'dgo-mini', texto: p[0] }),
          el('div', { style: { fontSize: '22px', fontWeight: '700', color: '#fff' }, texto: String(p[1]) })
        ]));
      });
      caixa.appendChild(res);

      caixa.appendChild(el('h3', { texto: t('campanhas') }));
      var lista = campanhas();
      if (!lista.length) caixa.appendChild(aviso(t('semCampanhas'), 'info'));
      lista.forEach(function (c, i) {
        var linha = el('div', { style: { display: 'flex', gap: '10px', alignItems: 'center',
          padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,.08)' } }, [
          el('div', { style: { flex: '1' } }, [
            el('div', { style: { fontWeight: '600', color: '#e2e8f0' }, texto: c.titulo }),
            el('div', { class: 'dgo-mini', texto: formatarData(c.inicio) + ' ' + t('ate') + ' ' + formatarData(c.fim) })
          ]),
          el('button', { class: 'dgo-b dgo-b2', style: { width: 'auto', minHeight: '34px', marginTop: '0' },
            type: 'button', texto: c.ativa ? t('ativa') : t('pausada'),
            onclick: function () { lista[i].ativa = !lista[i].ativa; gravarCampanhas(lista); redesenhar(); } })
        ]);
        caixa.appendChild(linha);
      });

      caixa.appendChild(el('h3', { texto: t('novaCampanha') }));
      var cT = campo(t('titulo'), { type: 'text' });
      var cL = campo(t('linkDestino'), { type: 'url', placeholder: 'https://' });
      var cI = campo(t('imagemUrl'), { type: 'url', placeholder: 'https://' });
      var cD1 = campo(t('periodo'), { type: 'date' });
      var cD2 = campo(t('ate'), { type: 'date' });
      [cT, cL, cI].forEach(function (x) { caixa.appendChild(x); });
      var lp = el('div', { class: 'dgo-linha' }); lp.appendChild(cD1); lp.appendChild(cD2);
      caixa.appendChild(lp);
      caixa.appendChild(el('button', { class: 'dgo-b', type: 'button', texto: t('salvar'), onclick: function () {
        if (!cT._input.value.trim()) return;
        var l = campanhas();
        l.push({ titulo: cT._input.value.trim(), link: cL._input.value.trim(), imagem: cI._input.value.trim(),
                 inicio: cD1._input.value, fim: cD2._input.value, ativa: true, criada: new Date().toISOString() });
        gravarCampanhas(l); redesenhar();
      } }));
      caixa.appendChild(el('div', { class: 'dgo-sep' }));
      caixa.appendChild(el('button', { class: 'dgo-b dgo-b2', type: 'button', texto: t('fechar'), onclick: fecharModal }));
      return caixa;
    }
    function redesenhar() { abrirModal(montar(), abrirPainelAnunciante); }
    redesenhar();
  }

  /* ------------------------------------------------------------------
     19-B. NOTIFICACOES (push)
     ------------------------------------------------------------------
     Funciona em: Chrome, Edge, Firefox e Opera no computador; Chrome e
     Samsung Internet no Android; Safari no Mac; iPhone e iPad a partir do
     iOS 16.4, desde que o app esteja instalado na Tela de Inicio.
     Dentro de um app nativo ou de uma WebView, basta ligar o adaptador
     Plataforma.adaptadores.notificacoes e tudo passa por ele.

     Sem servidor da-se para: pedir permissao, mostrar avisos e agendar
     lembretes que disparam com o app aberto ou na proxima abertura.
     Com servidor (chave VAPID) o aparelho fica inscrito e recebe avisos
     mesmo com o app fechado.
     ------------------------------------------------------------------ */
  function prefLer(chave, padrao) {
    try {
      var v = raiz.localStorage.getItem('dgo:' + cfg.app + ':pref:' + chave);
      return v === null ? padrao : JSON.parse(v);
    } catch (e) { return padrao; }
  }
  function prefGravar(chave, valor) {
    try { raiz.localStorage.setItem('dgo:' + cfg.app + ':pref:' + chave, JSON.stringify(valor)); } catch (e) {}
  }

  function minutosDoDia(hhmm) {
    var p = String(hhmm || '').split(':');
    return (parseInt(p[0], 10) || 0) * 60 + (parseInt(p[1], 10) || 0);
  }

  function base64ParaUint8(base64) {
    var pad = '='.repeat((4 - base64.length % 4) % 4);
    var b64 = (base64 + pad).replace(/-/g, '+').replace(/_/g, '/');
    var bruto = raiz.atob(b64), saida = new Uint8Array(bruto.length), i;
    for (i = 0; i < bruto.length; i++) saida[i] = bruto.charCodeAt(i);
    return saida;
  }

  var Notif = {
    _relogio: null,

    nativo: function () { return Plataforma.adaptadores.notificacoes || null; },

    suporte: function () { return Notif.nativo() ? true : ('Notification' in raiz); },

    ehApple: function () {
      return /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
             (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform));
    },

    precisaInstalar: function () {
      /* no iPhone e no iPad o aviso so chega com o app na Tela de Inicio */
      return !Notif.nativo() && Notif.ehApple() && !PWA.instalado() && !('Notification' in raiz);
    },

    permissao: function () {
      if (Notif.nativo()) return prefLer('notif-permissao-nativa', 'default');
      if (!('Notification' in raiz)) return 'sem-suporte';
      return Notification.permission;            // 'default' | 'granted' | 'denied'
    },

    estado: function () {
      return {
        suporte: Notif.suporte(),
        permissao: Notif.permissao(),
        precisaInstalar: Notif.precisaInstalar(),
        inscrito: !!prefLer('push-inscrito', false),
        plataforma: Plataforma.qual(),
        emSilencio: Notif.emSilencio(),
        tiposLigados: (cfg.notificacoes.tipos || []).filter(function (tp) { return Notif.ligado(tp.id); })
                        .map(function (tp) { return tp.id; })
      };
    },

    /* ---- tipos de aviso, um a um ---- */
    tipos: function () { return cfg.notificacoes.tipos || []; },
    tipo: function (id) {
      var l = Notif.tipos(), i;
      for (i = 0; i < l.length; i++) if (l[i].id === id) return l[i];
      return null;
    },
    ligado: function (id) {
      if (!id) return true;
      var tp = Notif.tipo(id);
      if (!tp) return true;                       // tipo nao declarado: nao bloqueia
      return prefLer('notif:' + id, tp.padrao !== false);
    },
    ligar: function (id, valor) {
      prefGravar('notif:' + id, !!valor);
      d.dispatchEvent(new CustomEvent('dgo:notificacoes', { detail: { tipo: id, ligado: !!valor } }));
      return !!valor;
    },

    /* ---- horario silencioso ---- */
    silencio: function (novo) {
      if (novo) prefGravar('notif-silencio', novo);
      return prefLer('notif-silencio', cfg.notificacoes.horarioSilencioso);
    },
    emSilencio: function (quando) {
      var h = Notif.silencio();
      if (!h || !h.ativo) return false;
      var agora = quando ? new Date(quando) : new Date();
      var m = agora.getHours() * 60 + agora.getMinutes();
      var i = minutosDoDia(h.inicio), f = minutosDoDia(h.fim);
      return (i <= f) ? (m >= i && m < f) : (m >= i || m < f);   // trata a virada da meia-noite
    },

    /* ---- permissao ---- */
    pedirPermissao: function () {
      var nat = Notif.nativo();
      if (nat && nat.pedirPermissao) {
        return Promise.resolve(nat.pedirPermissao()).then(function (r) {
          prefGravar('notif-permissao-nativa', r ? 'granted' : 'denied');
          return r ? 'granted' : 'denied';
        });
      }
      if (!('Notification' in raiz)) return Promise.resolve('sem-suporte');
      if (Notification.permission !== 'default') return Promise.resolve(Notification.permission);
      try {
        var r = Notification.requestPermission(function () {});
        return (r && r.then ? r : Promise.resolve(Notification.permission)).then(function (p) {
          prefGravar('notif-pedido-em', new Date().toISOString());
          if (p === 'granted' && cfg.notificacoes.vapidPublicKey) Notif.inscrever().catch(function () {});
          return p;
        });
      } catch (e) { return Promise.resolve(Notification.permission); }
    },

    /* ---- mostrar um aviso agora ---- */
    mostrar: function (tipoId, conteudo) {
      conteudo = conteudo || {};
      if (typeof tipoId === 'object') { conteudo = tipoId; tipoId = conteudo.tipo; }
      if (!cfg.notificacoes.ativo) return Promise.resolve(false);
      if (!Notif.ligado(tipoId)) return Promise.resolve(false);
      if (!conteudo.urgente && Notif.emSilencio()) {
        Notif.guardarNaCaixa(tipoId, conteudo);         // guarda para o fim do silencio
        return Promise.resolve(false);
      }
      var nat = Notif.nativo();
      if (nat && nat.mostrar) return Promise.resolve(nat.mostrar(tipoId, conteudo)).then(function () { return true; });
      if (Notif.permissao() !== 'granted') return Promise.resolve(false);

      var tp = Notif.tipo(tipoId) || {};
      var titulo = conteudo.titulo || (tp.nome ? (tp.nome[Idioma.atual] || tp.nome.pt) : nomeApp());
      var opcoes = {
        body: conteudo.texto || '',
        icon: conteudo.icone || cfg.notificacoes.icone,
        badge: conteudo.distintivo || cfg.notificacoes.distintivo,
        tag: conteudo.tag || tipoId || 'dgo',
        renotify: !!conteudo.repetirAviso,
        requireInteraction: !!conteudo.fixar,
        silent: !!conteudo.mudo,
        lang: Idioma.atual === 'en' ? 'en' : 'pt-BR',
        timestamp: Date.now(),
        data: { url: conteudo.url || raiz.location.href, app: cfg.app, tipo: tipoId || null }
      };
      if (conteudo.acoes) opcoes.actions = conteudo.acoes;

      if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
        return navigator.serviceWorker.ready
          .then(function (reg) { return reg.showNotification(titulo, opcoes); })
          .then(function () { return true; })
          .catch(function () { return Notif._simples(titulo, opcoes); });
      }
      return Promise.resolve(Notif._simples(titulo, opcoes));
    },

    _simples: function (titulo, opcoes) {
      try {
        var n = new Notification(titulo, opcoes);
        n.onclick = function () { try { raiz.focus(); } catch (e) {} n.close(); };
        return true;
      } catch (e) { return false; }
    },

    /* avisos segurados durante o horario silencioso */
    guardarNaCaixa: function (tipoId, conteudo) {
      var caixa = prefLer('notif-caixa', []);
      caixa.push({ tipo: tipoId, conteudo: conteudo, em: new Date().toISOString() });
      prefGravar('notif-caixa', caixa.slice(-30));
    },
    esvaziarCaixa: function () {
      if (Notif.emSilencio()) return 0;
      var caixa = prefLer('notif-caixa', []);
      if (!caixa.length) return 0;
      prefGravar('notif-caixa', []);
      caixa.forEach(function (item) { Notif.mostrar(item.tipo, item.conteudo); });
      return caixa.length;
    },

    /* ---- lembretes agendados ---- */
    agenda: function () { return prefLer('notif-agenda', []); },
    agendar: function (tipoId, quando, conteudo, repetir) {
      conteudo = conteudo || {};
      var dt = paraData(quando);
      if (!dt) return null;
      var item = {
        id: 'lem_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        tipo: tipoId || null, quando: dt.toISOString(), repetir: repetir || null,
        titulo: conteudo.titulo || '', texto: conteudo.texto || '', url: conteudo.url || ''
      };
      var l = Notif.agenda(); l.push(item); prefGravar('notif-agenda', l);
      var nat = Notif.nativo();
      if (nat && nat.agendar) { try { nat.agendar(item); } catch (e) {} }
      return item.id;
    },
    cancelar: function (id) {
      var l = Notif.agenda().filter(function (x) { return x.id !== id; });
      prefGravar('notif-agenda', l);
      var nat = Notif.nativo();
      if (nat && nat.cancelar) { try { nat.cancelar(id); } catch (e) {} }
      return true;
    },
    verificarAgenda: function () {
      var l = Notif.agenda(), agora = Date.now(), mudou = false, restantes = [];
      l.forEach(function (item) {
        var t0 = new Date(item.quando).getTime();
        if (t0 <= agora) {
          mudou = true;
          Notif.mostrar(item.tipo, { titulo: item.titulo, texto: item.texto, url: item.url });
          if (item.repetir) {
            var prox = new Date(t0);
            if (item.repetir === 'diario') prox.setDate(prox.getDate() + 1);
            else if (item.repetir === 'semanal') prox.setDate(prox.getDate() + 7);
            else if (item.repetir === 'mensal') prox.setMonth(prox.getMonth() + 1);
            while (prox.getTime() <= agora) {
              if (item.repetir === 'diario') prox.setDate(prox.getDate() + 1);
              else if (item.repetir === 'semanal') prox.setDate(prox.getDate() + 7);
              else prox.setMonth(prox.getMonth() + 1);
            }
            item.quando = prox.toISOString();
            restantes.push(item);
          }
        } else { restantes.push(item); }
      });
      if (mudou) prefGravar('notif-agenda', restantes);
      return mudou;
    },

    /* ---- inscricao para receber com o app fechado (precisa de servidor) ---- */
    inscrito: function () { return !!prefLer('push-inscrito', false); },
    inscrever: function () {
      var nat = Notif.nativo();
      if (nat && nat.inscrever) {
        return Promise.resolve(nat.inscrever()).then(function (r) { prefGravar('push-inscrito', true); return r; });
      }
      if (!cfg.notificacoes.vapidPublicKey) return Promise.reject(new Error('sem-vapid'));
      if (!('serviceWorker' in navigator) || !('PushManager' in raiz)) return Promise.reject(new Error('sem-suporte'));
      return navigator.serviceWorker.ready.then(function (reg) {
        return reg.pushManager.getSubscription().then(function (atual) {
          return atual || reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: base64ParaUint8(cfg.notificacoes.vapidPublicKey)
          });
        });
      }).then(function (inscricao) {
        prefGravar('push-inscrito', true);
        prefGravar('push-inscricao', JSON.parse(JSON.stringify(inscricao)));
        if (!cfg.notificacoes.endpointInscricao) return inscricao;
        return fetch(cfg.notificacoes.endpointInscricao, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            app: cfg.app, idioma: Idioma.atual, plataforma: Plataforma.qual(),
            usuario: (Sessao.usuario && Sessao.usuario.email) || null,
            tipos: Notif.estado().tiposLigados,
            inscricao: inscricao
          })
        }).then(function () { return inscricao; });
      });
    },
    cancelarInscricao: function () {
      prefGravar('push-inscrito', false);
      if (!('serviceWorker' in navigator)) return Promise.resolve(true);
      return navigator.serviceWorker.ready.then(function (reg) {
        return reg.pushManager.getSubscription();
      }).then(function (s) { return s ? s.unsubscribe() : true; }).catch(function () { return true; });
    },

    /* ---- numerinho no icone do app ---- */
    distintivo: function (quantos) {
      try {
        if (!quantos && navigator.clearAppBadge) return navigator.clearAppBadge();
        if (navigator.setAppBadge) return navigator.setAppBadge(quantos);
      } catch (e) {}
      return Promise.resolve();
    },

    /* ---- relogio interno: confere os lembretes enquanto o app esta aberto ---- */
    iniciar: function () {
      if (!cfg.notificacoes.ativo) return;
      Notif.verificarAgenda();
      Notif.esvaziarCaixa();
      if (Notif._relogio) clearInterval(Notif._relogio);
      Notif._relogio = setInterval(function () {
        Notif.verificarAgenda(); Notif.esvaziarCaixa();
      }, 30000);
      d.addEventListener('visibilitychange', function () {
        if (!d.hidden) { Notif.verificarAgenda(); Notif.esvaziarCaixa(); }
      });
      if ('serviceWorker' in navigator && navigator.serviceWorker.addEventListener) {
        navigator.serviceWorker.addEventListener('message', function (ev) {
          if (ev.data && ev.data.dgo === 'push') {
            d.dispatchEvent(new CustomEvent('dgo:push', { detail: ev.data.dados || {} }));
          }
        });
      }
      if (cfg.notificacoes.pedirNaAbertura && Notif.permissao() === 'default') {
        setTimeout(function () { Notif.pedirPermissao(); }, 4000);
      }
      if (Notif.permissao() === 'granted' && cfg.notificacoes.vapidPublicKey && !Notif.inscrito()) {
        Notif.inscrever().catch(function () {});
      }
    }
  };

  /* ---- painel de notificacoes ---- */
  function montarNotificacoes() {
    var caixa = el('div', { 'data-dgo-ui': '1' });
    var est = Notif.estado();

    if (!est.suporte) {
      caixa.appendChild(aviso(t('notifSemSuporte'), 'erro'));
      return caixa;
    }
    if (est.precisaInstalar || (Notif.ehApple() && !PWA.instalado())) {
      caixa.appendChild(aviso(t('notifIOS'), 'info'));
    }
    if (est.permissao === 'denied') {
      caixa.appendChild(aviso(t('notifBloqueadas'), 'erro'));
    } else if (est.permissao === 'granted') {
      caixa.appendChild(aviso(t('notifAtivas'), 'ok'));
    } else {
      caixa.appendChild(el('button', {
        class: 'dgo-b', type: 'button', texto: t('ativarNotificacoes'),
        onclick: function () { Notif.pedirPermissao().then(function () { abrirNotificacoes(); }); }
      }));
    }

    /* tipos de aviso deste app */
    var tipos = Notif.tipos();
    if (tipos.length) {
      caixa.appendChild(el('h3', { texto: t('avisosDoApp') }));
      tipos.forEach(function (tp) {
        var chk = el('input', { type: 'checkbox', style: { width: '20px', height: '20px', accentColor: cfg.cor } });
        chk.checked = Notif.ligado(tp.id);
        chk.addEventListener('change', function () { Notif.ligar(tp.id, chk.checked); });
        var descricao = tp.descricao ? (tp.descricao[Idioma.atual] || tp.descricao.pt) : '';
        caixa.appendChild(el('label', {
          style: { display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '9px 0',
                   borderBottom: '1px solid rgba(255,255,255,.08)', cursor: 'pointer' }
        }, [
          chk,
          el('div', { style: { flex: '1' } }, [
            el('div', { style: { color: '#e2e8f0', fontSize: '14px', fontWeight: '600' },
                        texto: tp.nome ? (tp.nome[Idioma.atual] || tp.nome.pt) : tp.id }),
            descricao ? el('div', { class: 'dgo-mini', texto: descricao }) : null
          ])
        ]));
      });
    }

    /* horario silencioso */
    var h = Notif.silencio();
    caixa.appendChild(el('h3', { texto: t('horarioSilencioso') }));
    var chkS = el('input', { type: 'checkbox', style: { width: '20px', height: '20px', accentColor: cfg.cor } });
    chkS.checked = !!(h && h.ativo);
    var cIni = campo('', { type: 'time', value: (h && h.inicio) || '22:00' });
    var cFim = campo(t('ate'), { type: 'time', value: (h && h.fim) || '07:00' });
    function gravarSilencio() {
      Notif.silencio({ ativo: chkS.checked, inicio: cIni._input.value, fim: cFim._input.value });
    }
    [chkS, cIni._input, cFim._input].forEach(function (x) { x.addEventListener('change', gravarSilencio); });
    caixa.appendChild(el('label', { style: { display: 'flex', gap: '10px', alignItems: 'center', margin: '6px 0 10px', cursor: 'pointer' } },
      [chkS, el('span', { style: { fontSize: '14px', color: '#e2e8f0' }, texto: t('horarioSilencioso') })]));
    var lh = el('div', { class: 'dgo-linha' }); lh.appendChild(cIni); lh.appendChild(cFim);
    caixa.appendChild(lh);

    /* receber com o app fechado */
    if (cfg.notificacoes.vapidPublicKey) {
      caixa.appendChild(el('h3', { texto: t('comAppFechado') }));
      if (Notif.inscrito()) {
        caixa.appendChild(aviso(t('inscrito'), 'ok'));
        caixa.appendChild(el('button', { class: 'dgo-b dgo-b2', type: 'button', texto: t('desconectar'),
          onclick: function () { Notif.cancelarInscricao().then(function () { abrirNotificacoes(); }); } }));
      } else {
        caixa.appendChild(el('button', { class: 'dgo-b dgo-b2', type: 'button', texto: t('comAppFechado'),
          onclick: function () { Notif.inscrever().then(function () { abrirNotificacoes(); }).catch(function () {}); } }));
      }
    }

    /* lembretes agendados */
    var l = Notif.agenda();
    caixa.appendChild(el('h3', { texto: t('lembretes') }));
    if (!l.length) caixa.appendChild(el('div', { class: 'dgo-mini', texto: t('semLembretes') }));
    l.forEach(function (item) {
      caixa.appendChild(el('div', { style: { display: 'flex', gap: '10px', alignItems: 'center', padding: '7px 0',
        borderBottom: '1px solid rgba(255,255,255,.08)' } }, [
        el('div', { style: { flex: '1' } }, [
          el('div', { style: { color: '#e2e8f0', fontSize: '13.5px' }, texto: item.titulo || item.tipo || '-' }),
          el('div', { class: 'dgo-mini', texto: formatarData(item.quando, null, true) + (item.repetir ? ('  ' + item.repetir) : '') })
        ]),
        el('button', { class: 'dgo-b dgo-b2', type: 'button', texto: t('remover'),
          style: { width: 'auto', minHeight: '32px', marginTop: '0', padding: '6px 11px' },
          onclick: function () { Notif.cancelar(item.id); abrirNotificacoes(); } })
      ]));
    });

    /* teste */
    caixa.appendChild(el('button', {
      class: 'dgo-b dgo-b2', type: 'button', texto: t('testarAviso'),
      onclick: function () {
        Notif.pedirPermissao().then(function () {
          Notif.mostrar(null, { titulo: t('avisoTesteTitulo'), texto: t('avisoTesteTexto'), urgente: true });
        });
      }
    }));
    return caixa;
  }

  function abrirNotificacoes() {
    var caixa = el('div', { class: 'dgo-caixa' });
    caixa.appendChild(el('h2', { texto: t('notificacoes') }));
    caixa.appendChild(montarNotificacoes());
    caixa.appendChild(el('div', { class: 'dgo-sep' }));
    caixa.appendChild(el('button', { class: 'dgo-b dgo-b2', type: 'button', texto: t('fechar'), onclick: fecharModal }));
    return abrirModal(caixa, abrirNotificacoes);
  }

  /* ------------------------------------------------------------------
     20. DICIONARIO BASE  Portugues -> Ingles
         Para acrescentar palavras do seu app, use:
         DGO.iniciar({ traducoes: { 'Minha palavra': 'My word' } })
     ------------------------------------------------------------------ */
  var BASE_PT_EN = {
    /* geral */
    'Início': 'Home', 'Inicio': 'Home', 'Página inicial': 'Home page', 'Voltar': 'Back', 'Avançar': 'Next',
    'Próximo': 'Next', 'Anterior': 'Previous', 'Buscar': 'Search', 'Pesquisar': 'Search', 'Procurar': 'Search',
    'Filtrar': 'Filter', 'Filtros': 'Filters', 'Limpar': 'Clear', 'Limpar filtros': 'Clear filters',
    'Salvar': 'Save', 'Salvo': 'Saved', 'Cancelar': 'Cancel', 'Fechar': 'Close', 'Abrir': 'Open',
    'Editar': 'Edit', 'Excluir': 'Delete', 'Apagar': 'Delete', 'Remover': 'Remove', 'Adicionar': 'Add',
    'Novo': 'New', 'Nova': 'New', 'Criar': 'Create', 'Confirmar': 'Confirm', 'Enviar': 'Send',
    'Baixar': 'Download', 'Carregar': 'Upload', 'Importar': 'Import', 'Exportar': 'Export',
    'Atualizar': 'Refresh', 'Recarregar': 'Reload', 'Configurações': 'Settings', 'Ajustes': 'Settings',
    'Opções': 'Options', 'Ajuda': 'Help', 'Sobre': 'About', 'Sair': 'Sign out', 'Entrar': 'Sign in',
    'Menu': 'Menu', 'Voltar ao topo': 'Back to top', 'Ver mais': 'See more', 'Ver menos': 'See less',
    'Mostrar': 'Show', 'Ocultar': 'Hide', 'Todos': 'All', 'Todas': 'All', 'Nenhum': 'None', 'Nenhuma': 'None',
    'Sim': 'Yes', 'Não': 'No', 'Ativo': 'Active', 'Inativo': 'Inactive', 'Ligado': 'On', 'Desligado': 'Off',
    'Data': 'Date', 'Hoje': 'Today', 'Ontem': 'Yesterday', 'Amanhã': 'Tomorrow', 'Hora': 'Time',
    'Dia': 'Day', 'Dias': 'Days', 'Semana': 'Week', 'Mês': 'Month', 'Meses': 'Months', 'Ano': 'Year', 'Anos': 'Years',
    'Nome': 'Name', 'Descrição': 'Description', 'Título': 'Title', 'Tipo': 'Type', 'Categoria': 'Category',
    'Categorias': 'Categories', 'Total': 'Total', 'Subtotal': 'Subtotal', 'Valor': 'Amount', 'Quantidade': 'Quantity',
    'Status': 'Status', 'Observações': 'Notes', 'Detalhes': 'Details', 'Resumo': 'Summary',
    'Carregando': 'Loading', 'Carregando...': 'Loading...', 'Aguarde': 'Please wait',
    'Erro': 'Error', 'Aviso': 'Notice', 'Sucesso': 'Success', 'Atenção': 'Attention',
    'Compartilhar': 'Share', 'Copiar': 'Copy', 'Copiado': 'Copied', 'Imprimir': 'Print',
    'Modo escuro': 'Dark mode', 'Modo claro': 'Light mode', 'Tema': 'Theme', 'Idioma': 'Language',
    'Favoritos': 'Favorites', 'Favorito': 'Favorite', 'Histórico': 'History', 'Recentes': 'Recent',
    'Versão': 'Version', 'Atualizado em': 'Updated on', 'Última atualização': 'Last update',
    'Uso pessoal': 'Personal use', 'Aviso legal': 'Legal notice', 'Privacidade': 'Privacy',
    'Termos de uso': 'Terms of use', 'Contato': 'Contact', 'Rodapé': 'Footer', 'Publicidade': 'Advertisement',
    'Anuncie aqui': 'Advertise here', 'Anúncio': 'Ad', 'Anúncios': 'Ads', 'Visitante': 'Guest',
    'Assinante': 'Subscriber', 'Anunciante': 'Advertiser', 'Conta': 'Account', 'Senha': 'Password',
    'E-mail': 'E-mail', 'Usuário': 'User', 'Perfil': 'Profile', 'Biometria': 'Biometrics',
    'Nuvem': 'Cloud', 'Backup': 'Backup', 'Restaurar': 'Restore', 'Sincronizar': 'Sync',
    'Câmera': 'Camera', 'Foto': 'Photo', 'Imagem': 'Image', 'Escanear': 'Scan', 'Digitalizar': 'Scan',
    'Instalar': 'Install', 'Gráfico': 'Chart', 'Gráficos': 'Charts', 'Relatório': 'Report',
    'Relatórios': 'Reports', 'Painel': 'Dashboard', 'Notícias': 'News', 'Glossário': 'Glossary',
    'Pendente': 'Pending', 'Concluído': 'Done', 'Em andamento': 'In progress',

    /* dinheiro / financas  (MoneyTrio, BudgetONE, InvestifyONE, TaxONE) */
    'Receita': 'Income', 'Receitas': 'Income', 'Renda': 'Income', 'Rendimentos': 'Earnings',
    'Despesa': 'Expense', 'Despesas': 'Expenses', 'Gasto': 'Spending', 'Gastos': 'Spending',
    'Custo': 'Cost', 'Custos': 'Costs', 'Custos fixos': 'Fixed costs', 'Custos recorrentes': 'Recurring costs',
    'Saldo': 'Balance', 'Saldo do mês': 'Month balance', 'Saldo acumulado': 'Accumulated balance',
    'Patrimônio': 'Net worth', 'Carteira': 'Portfolio', 'Investimento': 'Investment',
    'Investimentos': 'Investments', 'Ativo financeiro': 'Asset', 'Ações': 'Stocks', 'Fundos': 'Funds',
    'Renda fixa': 'Fixed income', 'Renda variável': 'Variable income', 'Previdência': 'Pension',
    'Cotação': 'Quote', 'Cotações': 'Quotes', 'Rentabilidade': 'Return', 'Rendimento': 'Yield',
    'Aporte': 'Contribution', 'Meta': 'Goal', 'Metas': 'Goals', 'Projeção': 'Projection',
    'Juros compostos': 'Compound interest', 'Inflação': 'Inflation', 'Câmbio': 'Exchange rate',
    'Dólar': 'Dollar', 'Real': 'Real', 'Corretora': 'Broker', 'Conta corrente': 'Checking account',
    'Cartão de crédito': 'Credit card', 'Crédito': 'Credit', 'Débito': 'Debit', 'Dinheiro': 'Cash',
    'Orçamento': 'Budget', 'Imposto de renda': 'Income tax', 'Imposto': 'Tax', 'Impostos': 'Taxes',
    'Declaração': 'Tax return', 'Dedução': 'Deduction', 'Nota fiscal': 'Receipt', 'Recibo': 'Receipt',
    'Vencimento': 'Due date', 'A vencer': 'Due soon', 'Pago': 'Paid', 'Em aberto': 'Open',
    'Mensal': 'Monthly', 'Anual': 'Yearly', 'Periodicidade': 'Frequency', 'Parcela': 'Installment',
    'Aluguel': 'Rent', 'Salário': 'Salary', 'Moradia': 'Housing', 'Habitação': 'Housing',
    'Lazer': 'Leisure', 'Saúde': 'Health', 'Transporte': 'Transport', 'Veículo': 'Vehicle',
    'Alimentação': 'Food', 'Educação': 'Education', 'Pessoal': 'Personal', 'Dependentes': 'Dependents',
    'Bancários': 'Banking', 'Simulador': 'Simulator', 'Alocação': 'Allocation', 'Risco': 'Risk',

    /* historias (contador de historias) */
    'História': 'Story', 'Histórias': 'Stories', 'Nova história': 'New story', 'Contar história': 'Tell a story',
    'Acervo': 'Library', 'Capítulo': 'Chapter', 'Capítulos': 'Chapters', 'Série': 'Series', 'Séries': 'Series',
    'Personagem': 'Character', 'Personagens': 'Characters', 'Tema': 'Topic', 'Temas': 'Topics',
    'Idade': 'Age', 'Faixa etária': 'Age range', 'Voz': 'Voice', 'Ler em voz alta': 'Read aloud',
    'Ouvir': 'Listen', 'Pausar': 'Pause', 'Continuar': 'Continue', 'Continuar ouvindo': 'Keep listening',
    'Efeitos sonoros': 'Sound effects', 'Narração': 'Narration', 'Aprovar': 'Approve',
    'Gerar história': 'Generate story', 'Sortear': 'Shuffle', 'Boa noite': 'Good night', 'Dormir': 'Sleep',

    /* cifras de violao */
    'Cifra': 'Chord chart', 'Cifras': 'Chord charts', 'Acorde': 'Chord', 'Acordes': 'Chords',
    'Tom': 'Key', 'Mudar o tom': 'Change key', 'Transpor': 'Transpose', 'Capotraste': 'Capo',
    'Afinador': 'Tuner', 'Violão': 'Guitar', 'Música': 'Song', 'Músicas': 'Songs', 'Artista': 'Artist',
    'Letra': 'Lyrics', 'Rolagem automática': 'Auto scroll', 'Velocidade': 'Speed',
    'Tamanho da letra': 'Font size', 'Dicionário de acordes': 'Chord dictionary', 'Repertório': 'Repertoire',
    'Playlist': 'Playlist', 'Tocar': 'Play', 'Parar': 'Stop'
  };

  /* ------------------------------------------------------------------
     21. API PUBLICA
     ------------------------------------------------------------------ */
  var API = {
    __carregado: true,
    versao: VERSAO,
    cfg: cfg,

    iniciar: function (opcoes) {
      fundir(cfg, opcoes || {});
      Idioma.montarDicionario();

      var guardado = Guardar.ler('idioma', null, !!cfg.idiomaCompartilhado);
      var doNavegador = (navigator.language || 'pt').toLowerCase().indexOf('en') === 0 ? 'en' : 'pt';
      Idioma.atual = guardado || cfg.idiomaPadrao || doNavegador;
      d.documentElement.setAttribute('lang', Idioma.atual === 'en' ? 'en' : 'pt-BR');
      d.documentElement.setAttribute('data-dgo-idioma', Idioma.atual);

      function arrancar() {
        injetarEstilo();
        garantirMeta();
        Sessao.carregar();
        (cfg.seletoresTopoFixo || []).forEach(function (sel) {
          Array.prototype.forEach.call(d.querySelectorAll(sel), function (n) {
            if (n.dataset.dgoTopoOriginal === undefined) {
              n.dataset.dgoTopoOriginal = raiz.getComputedStyle(n).top || '0px';
            }
          });
        });
        marcarIgnorados();
        montarBanner();
        vigiarTelaCheia();
        raiz.addEventListener('resize', function () {
          ajustarTopo(bannerEl ? bannerEl.offsetHeight : 0);
        });
        raiz.addEventListener('orientationchange', function () {
          raiz.setTimeout(function () { ajustarTopo(bannerEl ? bannerEl.offsetHeight : 0); }, 250);
        });
        montarSeletorIdioma();
        PWA.preparar();
        if (cfg.login.biometria) Biometria.verificarAparelho();
        Notif.iniciar();
        Varredura.iniciar();
        if (cfg.login.ativo && cfg.login.exigirNaAbertura && !Sessao.tipo) abrirLogin();
        d.dispatchEvent(new CustomEvent('dgo:pronto', { detail: API.sessao() }));
      }

      if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', arrancar);
      else arrancar();
      return API;
    },

    /* idioma e datas */
    idioma: function () { return Idioma.atual; },
    trocarIdioma: function (novo) { Idioma.definir(novo || (Idioma.atual === 'pt' ? 'en' : 'pt')); return Idioma.atual; },
    formatarData: formatarData,
    traduzir: function (s) { return Idioma.traduzir(s); },
    adicionarTraducoes: function (obj) { fundir(cfg.traducoes, obj || {}); Idioma.montarDicionario(); Varredura.tudo(); },
    revarrer: function (no) { marcarIgnorados(); Varredura.ramo(no || d.body); },
    ignorar: function (sel) {
      (Array.isArray(sel) ? sel : [sel]).forEach(function (x) {
        if (cfg.ignorar.indexOf(x) === -1) cfg.ignorar.push(x);
      });
      marcarIgnorados();
    },
    t: t,

    /* acesso */
    abrirLogin: abrirLogin,
    sessao: function () { return Sessao.resumo(); },
    entrarComoVisitante: function () { return Sessao.entrar('visitante', { nome: t('visitante') }); },
    sair: function () { Sessao.sair(); },
    auth: {
      contas: Contas,
      biometria: Biometria,
      google: Google,
      abrirRecuperacao: function (aba) { return abrirRecuperacao(aba || 'pagante'); },
      trocarSenha: function (ident, atual, nova) { return Contas.trocarSenha(ident, atual, nova); },
      redefinirComCodigo: function (ident, codigo, nova) { return Contas.redefinirComCodigo(ident, codigo, nova); },
      set backend(b) { Sessao.backend = b; },
      get backend() { return Sessao.backend; }
    },

    /* anuncios */
    anuncios: {
      mostrar: function () { FlagAnuncio.reabrir(); montarBanner(); },
      esconder: function () { FlagAnuncio.fechar(); montarBanner(); },
      metricas: Anuncios.totais,
      painel: abrirPainelAnunciante
    },

    /* OCR */
    ocr: {
      abrir: abrirOCR,
      ler: OCR.ler,
      lerArquivo: OCR.lerArquivo,
      extrair: OCR.extrair,
      preAquecer: function () { return OCR.motor(function () {}); }
    },

    /* notificacoes */
    notificacoes: {
      estado: function () { return Notif.estado(); },
      pedirPermissao: function () { return Notif.pedirPermissao(); },
      mostrar: function (tipo, conteudo) { return Notif.mostrar(tipo, conteudo); },
      agendar: function (tipo, quando, conteudo, repetir) { return Notif.agendar(tipo, quando, conteudo, repetir); },
      cancelar: function (id) { return Notif.cancelar(id); },
      agenda: function () { return Notif.agenda(); },
      ligado: function (id) { return Notif.ligado(id); },
      ligar: function (id, v) { return Notif.ligar(id, v); },
      silencio: function (novo) { return Notif.silencio(novo); },
      emSilencio: function () { return Notif.emSilencio(); },
      inscrever: function () { return Notif.inscrever(); },
      cancelarInscricao: function () { return Notif.cancelarInscricao(); },
      inscrito: function () { return Notif.inscrito(); },
      distintivo: function (n) { return Notif.distintivo(n); },
      abrirPainel: abrirNotificacoes,
      montarPainel: montarNotificacoes
    },

    /* e-mail */
    email: Email,

    /* nuvem e arquivos */
    nuvem: Nuvem,
    compartilhar: compartilhar,

    /* configuracoes */
    abrirConfiguracoes: abrirConfiguracoes,
    montarConfiguracoes: montarConfiguracoes,

    /* app instalavel / plataforma */
    pwa: PWA,
    plataforma: Plataforma,

    /* dados do app: sobrescreva estes dois se o seu app guardar em outro lugar */
    exportarDados: function () {
      var saida = { app: cfg.app, versao: cfg.versaoApp, em: new Date().toISOString(), dados: {} };
      try {
        var p = 'dgo:' + cfg.app + ':', i, c;
        for (i = 0; i < raiz.localStorage.length; i++) {
          c = raiz.localStorage.key(i);
          if (c && c.indexOf(p) === 0 && c.indexOf(':conta:') === -1) saida.dados[c] = raiz.localStorage.getItem(c);
        }
      } catch (e) {}
      return saida;
    },
    importarDados: function (obj) {
      if (!obj || !obj.dados) return false;
      try {
        Object.keys(obj.dados).forEach(function (c) { raiz.localStorage.setItem(c, obj.dados[c]); });
        return true;
      } catch (e) { return false; }
    },

    /* utilidades internas expostas por conveniencia */
    guardar: Guardar,
    modal: { abrir: abrirModal, fechar: fecharModal, caixa: function (props, filhos) { return el('div', props, filhos); } }
  };

  raiz.DGO = API;
  raiz.Diretrizes = API;

})(typeof window !== 'undefined' ? window : this);
