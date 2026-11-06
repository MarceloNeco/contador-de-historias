/* Service worker — faz o site abrir mesmo sem internet e permite instalar
   como app no celular e no computador.
   Ao publicar uma versao nova do seu site, troque o numero de VERSAO
   abaixo (ex.: 'v1' -> 'v2') para o aparelho pegar os arquivos novos. */
var VERSAO = 'v33';
/* O cache leva o nome do app e o activate só apaga os caches DESTE app. Todos os apps e jogos da SolverONE
   moram no mesmo endereço e dividem o espaço de cache: antes (cache "dgo-vN" e "apaga tudo que não é o meu"),
   abrir o Contador apagava o que os jogos do Bolinho de Chuva tinham guardado para funcionar sem internet. */
var PREFIXO = 'dgo-contador-de-historias-';
var CACHE = PREFIXO + VERSAO;
/* Músicas de fundo (v1.28.0): cache próprio, fora do prefixo acima, para não baixar tudo de novo a cada versão.
   Ao ativar, guarda a primeira música de cada momento (para tocar sem internet), uma de cada vez e só fora do 4G e da
   economia de dados; as outras ficam guardadas na primeira vez que tocam. */
var CACHE_MUSICAS = 'dgo-contador-musicas-v1';
var PRIMEIRAS = ['musicas/happy-whistling-ukulele.mp3', 'musicas/spring-chicken.mp3', 'musicas/kalimba-relaxation-music.mp3'];
function guardarPrimeiras() {
  var con = self.navigator && self.navigator.connection;
  if (con && (con.saveData || con.type === 'cellular')) return Promise.resolve();
  return caches.open(CACHE_MUSICAS).then(function (c) {
    return PRIMEIRAS.reduce(function (fila, a) {
      var url = new URL(a, self.registration.scope).href;
      return fila.then(function () { return c.match(url).then(function (r) { return r || fetch(url).then(function (resp) { if (resp.status === 200) return c.put(url, resp); }); }).catch(function () {}); });
    }, Promise.resolve());
  });
}

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) {
    /* v33: também o acervo (historias.json, só texto, ~220 KB), a capa e o fundo da história e os ícones (~330 KB):
       sem eles, sem internet o acervo de um aparelho novo ficava vazio e a capa sumia */
    return c.addAll(['./', './index.html', './janela.js', './cofre.js', './diretrizes.js', './diretrizes-config.js', './app.js', './tarefas.js', './recursos.js', './ajuda-botao.png',
      './historias.json', './capa.jpg', './fundo-historia.jpg', './manifest.json', './icone-180.png', './icone-192.png', './icone-512.png']).catch(function () {});
  }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (nomes) {
    return Promise.all(nomes.map(function (n) { return (n.indexOf(PREFIXO) === 0 && n !== CACHE) ? caches.delete(n) : null; }));
  }).then(function () { return self.clients.claim(); }).then(function () { guardarPrimeiras(); }));   // músicas sem segurar a ativação
});

/* resposta de "sem internet" para o que não está guardado (em vez de um pedido quebrado) */
function semInternet() { return new Response('', { status: 503, statusText: 'Offline' }); }

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // nao mexe em API externa

  /* músicas: o <audio> pede pedaços (Range → 206), que o cache não aceita; guarda uma cópia inteira (200) pela URL */
  if (/\/musicas\/[^/]+\.mp3$/i.test(url.pathname)) {
    e.respondWith(caches.open(CACHE_MUSICAS).then(function (c) {
      return c.match(url.href).then(function (r) {
        return r || fetch(new Request(url.href)).then(function (resp) {
          if (resp.status === 200) { var copia = resp.clone(); c.put(url.href, copia).catch(function () {}); }
          return resp;
        });
      });
    }));
    return;
  }

  /* paginas: tenta a rede primeiro (conteudo sempre atual), cache como reserva */
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function (r) {
        var copia = r.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copia); });
        return r;
      }).catch(function () {
        return caches.match(req).then(function (r) { return r || caches.match('./index.html'); });
      })
    );
    return;
  }

  /* listas .json (o acervo historias.json?t=<hora>, anúncios, recados, interruptores do RootifyONE): rede primeiro, a
     última cópia boa como reserva. A cópia fica guardada pelo endereço SEM o "?t=…" (o app põe a hora para não pegar
     cópia velha; com ela no nome, a reserva nunca era achada). Sem internet e sem cópia: "sem internet" (503), que o app
     já entende como "nada novo" (sem anúncio, sem recado) — nunca um pedido quebrado. */
  if (/\.json$/i.test(url.pathname)) {
    var chave = url.origin + url.pathname;
    e.respondWith(
      fetch(req).then(function (r) {
        if (r && r.status === 200) { var copia = r.clone(); caches.open(CACHE).then(function (c) { c.put(chave, copia); }); }
        return r;
      }).catch(function () {
        return caches.open(CACHE).then(function (c) { return c.match(chave, { ignoreSearch: true }); }).then(function (r) { return r || semInternet(); });
      })
    );
    return;
  }

  /* demais arquivos: cache primeiro, atualizando em segundo plano */
  e.respondWith(
    caches.match(req).then(function (cacheado) {
      var rede = fetch(req).then(function (r) {
        if (r && r.status === 200) {
          var copia = r.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copia); });
        }
        return r;
      }).catch(function () { return cacheado || semInternet(); });
      return cacheado || rede;
    })
  );
});

/* ====================================================================
   NOTIFICACOES
   Esta parte recebe os avisos enviados pelo servidor (push), mostra o
   aviso na tela e leva a pessoa para o lugar certo quando ela toca nele.
   Funciona mesmo com o site fechado, desde que o aparelho tenha
   permissao e o servidor esteja configurado com a chave VAPID.
   ==================================================================== */

self.addEventListener('push', function (e) {
  var dados = {};
  try { dados = e.data ? e.data.json() : {}; }
  catch (err) { dados = { titulo: 'Aviso', texto: e.data ? e.data.text() : '' }; }

  var titulo = dados.titulo || dados.title || 'Aviso';
  var opcoes = {
    body: dados.texto || dados.body || '',
    icon: dados.icone || dados.icon || 'icone-192.png',
    badge: dados.distintivo || dados.badge || 'icone-192.png',
    tag: dados.tag || dados.tipo || 'dgo',
    renotify: !!dados.repetirAviso,
    requireInteraction: !!dados.fixar,
    data: { url: dados.url || './', tipo: dados.tipo || null },
    actions: dados.acoes || dados.actions || undefined
  };

  e.waitUntil(
    self.registration.showNotification(titulo, opcoes).then(function () {
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    }).then(function (lista) {
      lista.forEach(function (c) { c.postMessage({ dgo: 'push', dados: dados }); });
    })
  );
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var destino = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (lista) {
      for (var i = 0; i < lista.length; i++) {
        var c = lista[i];
        if (c.url.indexOf(self.location.origin) === 0 && 'focus' in c) {
          c.postMessage({ dgo: 'notificacao-clicada', url: destino, acao: e.action || null });
          return c.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(destino);
    })
  );
});

self.addEventListener('notificationclose', function (e) {
  /* ponto de encaixe para contar avisos ignorados, quando houver servidor */
});

/* Se um dia a inscricao do aparelho for renovada pelo navegador, o
   servidor precisa saber. Preencha o endereco abaixo quando existir. */
var ENDERECO_INSCRICAO = '';
self.addEventListener('pushsubscriptionchange', function (e) {
  if (!ENDERECO_INSCRICAO) return;
  e.waitUntil(
    self.registration.pushManager.subscribe(e.oldSubscription.options).then(function (nova) {
      return fetch(ENDERECO_INSCRICAO, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ renovacao: true, inscricao: nova })
      });
    }).catch(function () {})
  );
});
