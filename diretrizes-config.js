/* =====================================================================
   UM Contador de Histórias  —  configuracao
   ---------------------------------------------------------------------
   ESTE e o unico arquivo diferente entre os seus apps.
   O diretrizes.js e identico nos tres; aqui ficam o nome, a cor, as
   traducoes e os avisos deste app. Para mudar qualquer ajuste, mude AQUI
   e suba este arquivo de novo. O seu index.html nao precisa ser tocado.
   ===================================================================== */
DGO.iniciar({

  /* ---------- identidade ---------- */
  app: 'contador-de-historias',            /* NAO TROQUE. E o nome da gaveta onde este app
                                guarda os dados. Seus sites moram todos em
                                marceloneco.github.io, e e isto que impede os
                                dados de um vazarem para o outro. */
  nome: { pt: 'UM Contador de Histórias', en: 'ONE Storyteller' },
  versaoApp: '1.22.0',
  cor: '#a78bfa',
  corFundoBarra: '#140b22',

  /* ---------- idioma e datas ---------- */
  idiomaPadrao: 'pt',                    /* 'pt' ou 'en' */
  idiomaCompartilhado: true,             /* o idioma escolhido vale nos seus 3 sites */
  seletorIdiomaVisivel: true,
  posicaoSeletorIdioma: 'topo-esquerda',  /* topo-direita, topo-esquerda, baixo-direita, baixo-esquerda.
                                            Neste app o index.html move o seletor para dentro de
                                            Configurações → Idioma (diretriz do topo: sem PT|EN no topo). */
  datasAutomaticas: true,

  /* ---------- anuncio do topo ---------- */
  anuncios: {
    ativo: false,       /* DESLIGADO de proposito: o banner deste modulo (1.0.0) e uma imagem fixa.
                           A faixa em carrossel, igual a dos outros apps, fica no index.html
                           (bloco "anuncios" no script) e le /solverone-dados/anuncios.json. */
    popup: { ativo: false },   /* o pop-up do modulo novo (1.10.0) tambem fica desligado */
    link: 'https://marceloneco.github.io/',
    imagem: '',         /* vazio = placeholder <ANUNCIE AQUI>.
                           Depois troque por 'banner.jpg' */

    /* enquanto uma destas telas estiver aberta o banner some sozinho,
       e volta quando ela fecha */
    esconderCom: ['.leitor', '.modal']
  },

  /* ---------- partes do modulo 1.10.0 que o Contador ja faz por conta propria (ou nao tinha): desligadas ----------
     O app salta do modulo 1.0.2 para o 1.10.0 so para ganhar o cofre comum de chaves (cofre.js).
     Nada do que o modulo novo traz de tela entra sem o dono pedir. */
  ia: { ativo: false, botaoNaFaixa: false },                 /* a IA do Contador e a dele mesmo (chamarIA); sem botao de IA do modulo */
  niveis: { ativo: false, arquivo: '' },                     /* acesso por plano: o Contador usa Plataforma/servicos_plataforma_app */
  compat: { bloqueio: false, aviso: false },                 /* sem faixa nem bloqueio de "navegador antigo" que o app nao tinha */
  feedback: { ativo: false, perguntaDiaria: false },         /* 💬 e pergunta do dia: ficam como sugestao no PENDENCIAS.md (nao foram pedidos) */

  /* ---------- cofre comum de chaves (cofre.js, SolverCofre 1.0.0) ----------
     Onde o Contador guardava segredos em texto aberto (ch_config). Na primeira vez que o cofre abre (ao criar o PIN),
     so estes campos vao para o cofre e saem do ch_config; o resto do ch_config, as historias e as estatisticas ficam.
     COPIA TEMPORARIA (autorizada pelo dono em 16/Out/2026): o Eleicoes (planos-candidatos-2026) le de proposito
     geminiKey, openaiKey e elevenKey em ch_config (index.html dele, funcao chaveContador). Esses tres ficam COPIADOS
     (manter: true) ate o Eleicoes passar a ler pelo cofre (proximo app da Fase 3); depois, tirar o manter.
     anthropicKey e os nomes das criancas nao sao lidos por ninguem de fora: saem na hora. */
  cofre: {
    fontes: [
      { chave: 'ch_config', caminho: '', manter: true,
        mapa: { geminiKey: 'ia:gemini', openaiKey: 'ia:openai', elevenKey: 'ia:elevenlabs' } },
      { chave: 'ch_config', caminho: '',
        mapa: { anthropicKey: 'ia:anthropic', publicoNomes: 'contador:publicoNomes', nomesProtegidos: 'contador:nomesProtegidos' } }
    ]
  },

  /* ---------- trechos que o tradutor nao pode tocar ----------
     O modulo poe a marca sozinho nestes trechos; voce NAO precisa
     editar o index.html para isso. Para proteger mais alguma coisa,
     e so acrescentar o nome aqui. */
  ignorar: [
    '#lt-texto',
    '#leitor-titulo',
    '#lt-h2',
    '#lt-sub',
    '#lista-acervo',
    '#lista-recentes',
    '#modal-conteudo',
    '#sugestao-conteudo',
    '#chips-tema',
    '#chips-personagem',
    '[data-motor="solverone"]',  /* botões da SolverONE: o app escreve o texto em PT/EN (muda com o plano) */
    '#sv-conta',                 /* cartão da conta SolverONE: o app escreve em PT/EN (muda ao entrar e sair) */
    '#nv-conta', '#nv-selo',     /* nuvem (v1.20.0): o app escreve em PT/EN */
    '#cofre-painel', '#aviso-voz-arquivo',  /* cofre (v1.22.0): o app escreve em PT/EN */
    /* campos de chave e de nomes: o app troca o placeholder (aviso "guardado no cofre"); o tradutor guardaria o texto
       velho e o poria de volta */
    '#in-gemini-key', '#in-gemini-key-voz', '#in-openai-key', '#in-openai-key2', '#in-eleven-key', '#in-anthropic-key',
    '#in-publico-nomes', '#in-nomes-protegidos',
    '#assist-admin'              /* aviso "Desligado pela administração": o app escreve em PT/EN */
  ],

  /* ---------- barras que ficam grudadas no topo ----------
     O banner empurra estas barras para baixo em vez de cobri-las. */
  seletoresTopoFixo: ['header'],

  /* ---------- acesso ---------- */
  login: {
    ativo: true,
    exigirNaAbertura: false,    /* true = pede login antes de usar o app */
    permitirVisitante: true,
    permitirPagante: true,
    permitirAnunciante: true,
    exigirApelido: true,        /* conta = apelido + e-mail + senha */
    biometria: true,
    google: { clientId: '' },  /* preencha para ligar o login do Google */

    /* "esqueci a senha": enquanto nao houver servidor, funciona pelo codigo
       de recuperacao que aparece quando a conta e criada. Se voce criar um
       formulario (Formspree), o pedido tambem pode chegar para voce: */
    formularioRecuperacao: ''
  },

  /* ---------- e-mail ---------- */
  email: {
    formulario: '',      /* ex.: 'https://formspree.io/f/xxxxxxx' */
    deAvisos: '',        /* o e-mail que voce usa para responder */
    assuntoPadrao: 'UM Contador de Histórias'
  },

  /* ---------- nuvem ---------- */
  nuvem: {
    google: { clientId: '' },      /* mesma chave do login do Google */
    microsoft: { clientId: '' },   /* OneDrive, se um dia quiser */
    arquivo: 'contador-de-historias.json'
  },

  /* ---------- OCR (ler texto de foto) ---------- */
  ocr: { ativo: true, idiomas: 'por+eng' },

  /* ---------- notificacoes ---------- */
  notificacoes: {
    ativo: true,
    pedirNaAbertura: false,     /* melhor pedir num botao, nao na abertura */
    horarioSilencioso: { ativo: true, inicio: '21:30', fim: '07:00' },
    vapidPublicKey: '',         /* so quando houver servidor de push */
    endpointInscricao: '',
    tipos: [
      { id: 'hora-da-historia',
        nome: { pt: 'Hora da história', en: 'Story time' },
        descricao: { pt: 'Lembrete na hora de dormir', en: 'Bedtime reminder' },
        padrao: true },
      { id: 'capitulo-novo',
        nome: { pt: 'Capítulo novo', en: 'New chapter' },
        descricao: { pt: 'Quando uma saga ganha continuação', en: 'When a saga gets a new part' },
        padrao: true },
      { id: 'novidades',
        nome: { pt: 'Novidades do app', en: 'App news' },
        descricao: { pt: 'Versões novas e recursos', en: 'New versions and features' },
        padrao: false }
    ]
  },

  /* ---------- palavras deste app para o tradutor ---------- */
  traducoes: {
    '✨ Conta SolverONE': '✨ SolverONE account',
    '☁️ Minhas histórias na conta': '☁️ My stories in the account',
    'Trazer as histórias que vêm com o app': 'Bring the stories that come with the app',
    'Ao abrir, buscar as histórias novas do acervo do app.': 'On opening, fetch new stories from the app\'s library.',
    'A cópia sai protegida por uma senha sua e por um código para anotar num papel. Para trazer de volta, aqui ou em outro aparelho, use Trazer uma cópia: nada se repete.': 'The copy comes out protected by your password and by a code to write down on paper. To bring it back, here or on another device, use Restore a copy: nothing is repeated.',
    '🔒 Guardar uma cópia': '🔒 Save a copy',
    '💾 Histórias e cópia de segurança': '💾 Stories and safety copy',
    '📂 Trazer uma cópia': '📂 Restore a copy',
    'Nova história': 'New story',
    'Contar história': 'Tell a story',
    'Acervo': 'Library',
    'Continuar ouvindo': 'Keep listening',
    'Efeitos sonoros': 'Sound effects',
    'Faixa etária': 'Age range',
    'Aprovar': 'Approve',
    'Gerar história': 'Generate story',
    'Motor de voz': 'Voice engine',
    'Quem escreve': 'Who writes',
    'Sortear tema': 'Shuffle topic',
    'Saiba mais': 'Learn more',
    'Testar a chave': 'Test the key',
    'Chaves salvas': 'Saved keys',
    'AssistONE ativado': 'AssistONE on',
    'O ajudante do canto: ajuda da tela, tour rápido e busca.': 'The corner helper: screen help, quick tour and search.',
    'Abrir o AssistONE': 'Open AssistONE',
    'Recomeçar dicas': 'Restart tips',
    'Fechar anúncios': 'Close ads',
    'Fila de voz': 'Voice queue',
    'Baixa a voz de várias histórias, uma por vez, e tenta de novo sozinha quando a cota acaba.': 'Downloads the voice of several stories, one at a time, and retries on its own when the quota runs out.',
    'Escolher histórias': 'Choose stories',
    'Esvaziar a fila': 'Empty the queue',
    'Guardar num arquivo': 'Save to a file',
    'Trazer de um arquivo': 'Bring from a file',
    'Pôr na fila de voz': 'Add to the voice queue',
    'Anúncios': 'Ads',
    'Idioma e aparência': 'Language and appearance',
    'Idioma': 'Language',
    'Português ou inglês, em todo o app.': 'Portuguese or English, across the app.',
    'Tema claro': 'Light theme',
    'Fundo claro para o dia. O escuro é o padrão, feito para a hora de dormir.': 'Light background for daytime. Dark is the default, made for bedtime.',
    'Reduzir animações': 'Reduce animations',
    'Para o balanço do AssistONE e as transições do app.': 'Stops the AssistONE bounce and the app transitions.',
    'Notificações, instalação e nuvem': 'Notifications, install and cloud',
    'Menu': 'Menu',
    'Buscar': 'Search',
    'Mensagens': 'Messages',
    'Perfil': 'Profile',
    'Comando de voz': 'Voice command',
    'Ir para o Início': 'Go Home',
    'Início': 'Home',
    'Criar': 'Create',
    'Configurações': 'Settings'
  }

});
