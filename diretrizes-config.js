/* =====================================================================
   Contador de Histórias  —  configuracao
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
  nome: { pt: 'Contador de Histórias', en: 'Story Teller' },
  versaoApp: '1.14.0',
  cor: '#a78bfa',
  corFundoBarra: '#140b22',

  /* ---------- idioma e datas ---------- */
  idiomaPadrao: 'pt',                    /* 'pt' ou 'en' */
  idiomaCompartilhado: true,             /* o idioma escolhido vale nos seus 3 sites */
  seletorIdiomaVisivel: true,
  posicaoSeletorIdioma: 'topo-esquerda',  /* topo-direita, topo-esquerda,
                                            baixo-direita, baixo-esquerda */
  datasAutomaticas: true,

  /* ---------- anuncio do topo ---------- */
  anuncios: {
    ativo: false,       /* DESLIGADO de proposito: o banner deste modulo (1.0.0) e uma imagem fixa.
                           A faixa em carrossel, igual a dos outros apps, fica no index.html
                           (bloco "anuncios" no script) e le /solverone-dados/anuncios.json. */
    link: 'https://marceloneco.github.io/',
    imagem: '',         /* vazio = placeholder <ANUNCIE AQUI>.
                           Depois troque por 'banner.jpg' */

    /* enquanto uma destas telas estiver aberta o banner some sozinho,
       e volta quando ela fecha */
    esconderCom: ['.leitor', '.modal']
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
    '#chips-personagem'
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
    assuntoPadrao: 'Contador de Histórias'
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
    'Anúncios': 'Ads'
  }

});
