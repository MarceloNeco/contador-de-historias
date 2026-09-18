# Contador de Histórias — passo a passo

Pacote das diretrizes gerais para **este app**. Tudo o que está aqui é feito para
este repositório: `contador-de-historias`.

O que muda de um app para o outro é só o arquivo `diretrizes-config.js`. O
`diretrizes.js` é idêntico nos três.

---

## 1. O que veio neste zip

**Vão para o GitHub, na raiz deste repositório:**

| Arquivo | O que é |
|---|---|
| `diretrizes.js` | o módulo (igual nos três apps) |
| `diretrizes-config.js` | **os ajustes deste app** — nome, cor, traduções, avisos |
| `sw.js` | faz o site abrir sem internet e permite instalar como app |
| `manifest.json` | já preenchido com "Contador de Histórias" — não precisa editar |
| `icone-192.png` | ícone do app instalado |
| `icone-512.png` | ícone do app instalado |
| `TESTE-contador-de-historias.html` | página de conferência (opcional, mas recomendo subir) |

**Só para você ler:**

| Arquivo | O que é |
|---|---|
| `PASSO-A-PASSO-contador-de-historias.md` | este guia |
| `LEIA-ME-contador-de-historias.txt` | o resumo de uma tela |

---

## 2. Primeiro, teste no seu computador

1. Descompacte o zip numa pasta.
2. Dois cliques em **`TESTE-contador-de-historias.html`**.
3. Confira: o botão **PT / EN** no canto, as datas virando `17/Set/2026`, o
   banner `<ANUNCIE AQUI>` no topo, a tela de acesso.

A seção 8 dessa página mostra o que o navegador está permitindo naquele momento.
Abrindo por dois cliques, quatro coisas ficam desligadas **pelo próprio
navegador**, não por defeito do código: instalar como app, senha protegida,
câmera e notificações. Todas funcionam quando o site está publicado (`https://`).

---

## 3. Subir no GitHub

### 3.1 Os arquivos

1. Abra `https://github.com/MarceloNeco/contador-de-historias`
2. **Add file** → **Upload files**
3. Arraste os 7 arquivos da lista de cima (não arraste o guia nem o LEIA-ME)
4. Desça a página → **Commit changes**

### 3.2 As duas linhas no `index.html`

A única página do seu site é o **`index.html`**.

Em cada uma dessas páginas:

1. Clique no nome do arquivo → no **lápis** (Edit this file)
2. Vá ao fim do arquivo (`Ctrl + End`; no Mac, `Cmd + ↓`)
3. Cole isto **antes** de `</body>` (se não achar `</body>`, cole na última linha):

```html
<script src="diretrizes.js"></script>
<script src="diretrizes-config.js"></script>
```

4. **Commit changes**

São sempre as mesmas duas linhas. É a única edição nas suas páginas, e não
precisa ser repetida nunca mais: quando eu mudar algo, você troca o arquivo
`diretrizes.js` ou `diretrizes-config.js` e pronto.

### 3.3 Conferir

Abra `https://marceloneco.github.io/contador-de-historias/` no celular e no computador.
Se o botão PT/EN aparecer no canto, está ligado.

Para testar câmera e notificações de verdade, abra
`https://marceloneco.github.io/contador-de-historias/TESTE-contador-de-historias.html`.

---

## 4. O que eu já ajustei para este app

Eu abri o seu site e olhei a estrutura dele antes de montar este pacote. O que
achei já veio resolvido dentro do `diretrizes-config.js` — **você não precisa
editar o seu HTML para nada disso**:

| O que achei no seu site | Por que importa |
|---|---|
| `header` | é sticky no topo, com `top: 0` — sem ajuste, ele deslizaria para baixo do banner |
| `.leitor` | é a tela de leitura, fixa e cobrindo tudo (`inset: 0`) — o banner ficaria por cima dela e podia tapar o ✕ de fechar |
| `nav.tabs` | é a sua barra de baixo — não conflita com nada, o botão PT/EN vai para o canto superior esquerdo porque a ⚙ já ocupa o direito |

### O que está protegido do tradutor

O texto das histórias é conteúdo seu, não interface. Sem essa marca, o tradutor mexeria nas histórias das meninas e nas datas dentro delas. Ficaram protegidos: o texto da história, o título, a lista do acervo, os recentes, a janela de capítulos e os chips de tema e personagem.

Isso está na lista `ignorar` do `diretrizes-config.js`. O módulo põe a marca
sozinho, inclusive no conteúdo que aparece depois, enquanto o site roda.

Se um dia você criar uma tela nova com conteúdo seu, acrescente o nome dela nessa
lista — ou, se preferir, ponha `data-dgo-ignorar` direto na etiqueta do HTML. As
duas formas valem.

Já ficam de fora automaticamente, sem precisar de lista: `<textarea>`, `<pre>`,
`<code>`, campos de digitação e áreas editáveis.

---

## 5. Onde mudar cada ajuste

Tudo num lugar só: **`diretrizes-config.js`**. Abra no GitHub, clique no lápis,
mude, **Commit changes**. O que tem lá dentro:

| Quero mudar | Linha |
|---|---|
| a cor do app | `cor:` |
| o idioma que abre por padrão | `idiomaPadrao:` |
| onde fica o botão PT/EN | `posicaoSeletorIdioma:` |
| desligar o anúncio | `anuncios: { ativo: false }` |
| trocar o placeholder por um banner real | `anuncios: { imagem: 'banner.jpg' }` |
| exigir login para usar o app | `login: { exigirNaAbertura: true }` |
| desligar o OCR | `ocr: { ativo: false }` |
| desligar as notificações | `notificacoes: { ativo: false }` |
| o horário silencioso | `horarioSilencioso:` |
| acrescentar palavras ao tradutor | `traducoes:` |
| a barra fixa que o banner não pode cobrir | `seletoresTopoFixo:` |

Uma linha **não** se mexe: `app: 'contador-de-historias'`. É o nome da gaveta onde este app
guarda os dados. Seus sites moram todos em `marceloneco.github.io`, e é isso que
impede o login de um aparecer no outro.

---

## 6. Idioma e datas

Datas escritas como `17/09/2026` ou `2026-09-17` já aparecem no formato do idioma,
sem você fazer nada:

- Português: `17/Set/2026`
- Inglês: `Sep/17/2026`

Para gerar uma data pelo seu código:

```js
DGO.formatarData(new Date());                 // 17/Set/2026  |  Sep/17/2026
DGO.formatarData('2026-12-25');               // 25/Dez/2026  |  Dec/25/2026
DGO.formatarData(new Date(), null, true);     // com hora
```

Para acrescentar palavras ao tradutor, duas formas:

```js
// A) na lista traducoes do diretrizes-config.js
traducoes: { 'Minha frase': 'My sentence' }
```

```html
<!-- B) direto no HTML, frase por frase -->
<h2 data-pt="Minhas músicas" data-en="My songs"></h2>
```

Frase inteira funciona melhor que palavra solta. O que não estiver na lista
continua em português — nada quebra.

---

## 7. Conta: apelido, e-mail e senha

A conta tem três campos: **apelido**, **e-mail** e **senha**. Para entrar, serve o
apelido **ou** o e-mail.

Os três tipos de acesso:

| Tipo | Senha | Dados guardados | Anúncio |
|---|---|---|---|
| Visitante | não pede | nada é guardado | mostra |
| Assinante | pede | guardados | não mostra |
| Anunciante | pede | guardados | painel próprio |

### Esqueci a senha

Quando a conta é criada, aparece **uma única vez** um código como
`4QW6-CWQ2-LN8Z`, com botão de copiar e de baixar num arquivo .txt. Esse código é
o caminho de volta se a senha for esquecida.

Em **Esqueci a senha**, a pessoa digita o apelido (ou e-mail), o código e a senha
nova. Ao usar o código, um código **novo** é gerado e o antigo deixa de valer.

Por que assim, e não um e-mail com link? Porque um site no GitHub Pages não tem
servidor para enviar e-mail. É a seção 8. Quando você ligar um servidor, o
"Esqueci a senha" passa a oferecer o caminho por e-mail **sozinho**, sem você
mexer em nada aqui.

E há um meio-caminho: se você preencher `formularioRecuperacao` no
`diretrizes-config.js`, aparece também a opção **"Pedir ajuda ao responsável"** —
o pedido chega para você e você responde à mão.

### Trocar a senha sabendo a atual

Está em **Configurações → Conta → Trocar a senha**.

### Aviso honesto sobre a senha

Sem servidor, a conferência da senha acontece **dentro do próprio aparelho**. A
senha nunca é guardada em texto puro (usa PBKDF2 com 150 mil voltas), e isso é
bom para separar perfis e proteger a tela. Mas não é o mesmo que um servidor: a
conta vale naquele aparelho, e quem tiver acesso ao computador poderia mexer nos
dados guardados pelo navegador. Para conta de verdade, valendo em qualquer
aparelho, é a seção 8.

---

## 8. Integração com e-mail

Esta é a pergunta que amarra tudo, então vale a explicação por inteiro.

**Por que o site não envia e-mail sozinho:** o GitHub Pages só entrega arquivos.
Não existe nenhum programa rodando do outro lado para pegar uma mensagem e
despachar. Enviar e-mail precisa de alguém no meio.

E há uma regra de ouro: **nunca coloque senha de e-mail nem chave secreta neste
repositório.** Ele é público — qualquer pessoa lê. O que pode ficar no código é
só o que é feito para ser público (endereço de formulário, chave pública).

### Caminho 1 — Formulário (o mais simples, e você já usa)

O navegador manda o conteúdo para um serviço de formulário e o serviço te envia
por e-mail. Você já faz isso nas cifras com o Formspree.

Serve para: contato, pedido de remoção, "esqueci a senha" chegando para você.
Não serve para: e-mail automático **para o usuário**.

```js
// no diretrizes-config.js
email: { formulario: 'https://formspree.io/f/xxxxxxx', deAvisos: 'seu@email.com' },
login: { formularioRecuperacao: 'https://formspree.io/f/xxxxxxx' }
```

```js
// no seu código
DGO.email.enviarFormulario({
  assunto: 'Contato pelo site',
  mensagem: 'texto que a pessoa escreveu',
  responderPara: 'pessoa@email.com'
});
```

O plano gratuito do Formspree costuma dar algo em torno de 50 envios por mês —
confirme no site deles antes de contar com isso.

### Caminho 2 — Abrir o programa de e-mail da pessoa

Zero configuração. A pessoa clica e o e-mail abre pronto, só falta ela enviar.

```js
DGO.email.abrirCliente({ para: 'seu@email.com', assunto: 'Dúvida', mensagem: 'Olá' });
```

### Caminho 3 — Login pronto, com e-mail de verdade (o que eu recomendo)

Se o que você quer é conta valendo em qualquer aparelho e "esqueci a senha" com
link por e-mail, **não escreva servidor**: use um serviço que já traz isso pronto.
O **Supabase** tem plano gratuito e entrega cadastro, confirmação de e-mail e
redefinição de senha sem você programar nada do lado do servidor. O **Firebase**,
do Google, faz o mesmo.

O módulo já tem o encaixe para isso. Você liga assim:

```js
DGO.auth.backend = {
  entrar:            function (ident, senha) { /* devolve Promise com o usuário */ },
  cadastrar:         function (dados)       { /* {apelido, email, senha} */ },
  pedirRedefinicao:  function (email)       { /* dispara o e-mail de redefinição */ }
};
```

No instante em que `pedirRedefinicao` existe, a tela "Esqueci a senha" passa a
oferecer **"Receber um link por e-mail"** automaticamente. Nada mais muda no app.

### Caminho 4 — EmailJS

Envia direto do navegador, sem servidor. Funciona, mas a chave fica visível no
código público e qualquer pessoa pode usar a sua cota. Serve para contato; **não**
use para senha.

### Resumo

| Quero | Caminho |
|---|---|
| a pessoa me escrever | 1 (formulário) ou 2 (mailto) |
| receber pedido de "esqueci a senha" | 1, e você responde à mão |
| link automático de redefinição para o usuário | 3 (Supabase ou Firebase) |
| aviso chegando com o app fechado | servidor de push — seção 10 |

---

## 9. Anúncios

- Banner no topo, em todas as telas.
- O **×** fecha só até o fim da sessão; no próximo login ele volta.
- Assinante não vê anúncio nenhum.
- O placeholder `<ANUNCIE AQUI>` aponta para `https://marceloneco.github.io/`.
- Para um anúncio real: `anuncios: { imagem: 'banner.jpg', link: 'https://...' }`.
- O painel do anunciante conta exibições e cliques (neste aparelho) e guarda
  campanhas: **Configurações → Conta → Painel do anunciante**.

---

## 10. Notificações deste app

Os avisos já vêm separados por tipo, e quem usa liga e desliga um por um em
**Configurações → Notificações**:

| Aviso | O que é | Vem ligado? |
|---|---|---|
| **Hora da história** / *Story time* | Lembrete na hora de dormir | sim |
| **Capítulo novo** / *New chapter* | Quando uma saga ganha continuação | sim |
| **Novidades do app** / *App news* | Versões novas e recursos | não |

Horário silencioso configurado: **21:30 às 07:00**. Durante o silêncio o aviso fica
guardado e sai quando o silêncio acaba (a menos que seja marcado como urgente).

### Usar no seu código

```js
DGO.notificacoes.agendar('hora-da-historia', '2026-09-18T20:30:00',
  { titulo: 'Hora da história', texto: 'As meninas estão esperando' }, 'diario');

DGO.notificacoes.pedirPermissao();    // faça num botão, nunca na abertura
DGO.notificacoes.agenda();            // o que está agendado
DGO.notificacoes.abrirPainel();       // as chavinhas
DGO.notificacoes.distintivo(3);       // numerinho no ícone do app
```

`repetir` aceita `'diario'`, `'semanal'` e `'mensal'`.

### Onde funciona

Chrome, Edge, Firefox e Opera no computador; Chrome e Samsung Internet no
Android; Safari no Mac. No iPhone e iPad só depois de instalar o app na Tela de
Início — o painel avisa isso sozinho.

### O que precisa de servidor

Aviso chegando com o app **fechado**. Hoje funciona: mostrar aviso, lembrete com
hora marcada (dispara com o app aberto, ou na próxima abertura se estiver
atrasado), horário silencioso, numerinho no ícone.

Quando quiser o resto: gere um par de chaves VAPID, ponha a pública em
`vapidPublicKey`, o endereço que guarda as inscrições em `endpointInscricao`, e o
mesmo endereço em `var ENDERECO_INSCRICAO` dentro do `sw.js`. O `sw.js` já sabe
receber o aviso, mostrar e tratar o clique — essa parte não precisa ser escrita
depois.

---

## 11. OCR — ler texto de foto

Funciona na câmera do celular e na webcam do notebook, em português e inglês.

Aqui o OCR serve para digitar menos: aponte a câmera para a página de um livro infantil e o texto entra no editor de histórias.

```js
DGO.ocr.abrir({
  aoTexto: function (texto, dados) {
    // dados.valores, dados.maiorValor, dados.datas, dados.cnpj, dados.primeiraLinha
  }
});
```

Na primeira vez o navegador baixa o leitor (alguns megabytes) de um servidor
público; depois fica guardado no aparelho. Se um dia quiser hospedar dentro do
repositório, como você fez com o pdf.js das cifras, preencha
`ocr: { caminhoLocal: '...', caminhos: { worker: '...', core: '...', lang: '...' } }`.

---

## 12. Nuvem, backup e login do Google

**Backup em arquivo funciona desde já**, sem configurar nada:

```js
DGO.nuvem.salvarArquivo(DGO.exportarDados());   // baixa um .json
DGO.nuvem.abrirArquivo();                       // restaura de um .json
```

Para Google Drive e login do Google, uma configuração só, que serve para os três
sites:

1. `https://console.cloud.google.com/` → crie um projeto
2. **APIs e serviços → Tela de consentimento OAuth** → Externo → preencha
3. **Credenciais → Criar credenciais → ID do cliente OAuth → Aplicativo da Web**
4. Em **Origens JavaScript autorizadas**, acrescente `https://marceloneco.github.io`
5. Copie o **ID do cliente** e cole no `diretrizes-config.js`, nos dois lugares:
   `login: { google: { clientId: '...' } }` e `nuvem: { google: { clientId: '...' } }`
6. **APIs e serviços → Biblioteca** → ative a **Google Drive API**

O app pede apenas a permissão `drive.appdata`: ele enxerga **só a pasta privada
que ele mesmo cria**, nunca o resto do seu Drive.

OneDrive segue a mesma ideia pelo `https://portal.azure.com` (aplicativo tipo
SPA, permissão `Files.ReadWrite.AppFolder`), e o ID vai em
`nuvem: { microsoft: { clientId: '...' } }`.

---

## 13. Cola rápida

```js
DGO.trocarIdioma('en');                  // ou 'pt', ou sem nada para alternar
DGO.formatarData('2026-09-17');
DGO.abrirLogin();                        // tela de acesso
DGO.auth.abrirRecuperacao();             // esqueci a senha
DGO.sessao();                            // { tipo, usuario, semAnuncios, guardaDados }
DGO.sair();
DGO.anuncios.mostrar() / .esconder() / .painel();
DGO.notificacoes.pedirPermissao() / .mostrar(tipo, conteudo) / .agendar(...) / .abrirPainel();
DGO.ocr.abrir({ aoTexto: fn });
DGO.email.enviarFormulario({ assunto, mensagem, responderPara });
DGO.compartilhar({ texto: 'Olha isto' });
DGO.nuvem.salvarArquivo(DGO.exportarDados());
DGO.abrirConfiguracoes();
DGO.montarConfiguracoes({ destino: '#area', secoes: ['idioma','conta','notificacoes'] });
DGO.pwa.instalar();
DGO.adicionarTraducoes({ 'Palavra': 'Word' });
```

Eventos que o seu app pode escutar:

```js
document.addEventListener('dgo:pronto',       function (e) {});
document.addEventListener('dgo:idioma',       function (e) { e.detail.idioma; });
document.addEventListener('dgo:entrou',       function (e) { e.detail.tipo; });
document.addEventListener('dgo:saiu',         function (e) {});
document.addEventListener('dgo:ocr',          function (e) { e.detail.texto; });
document.addEventListener('dgo:push',         function (e) { e.detail; });
document.addEventListener('dgo:notificacoes', function (e) { e.detail.tipo; });
```

---

## 14. Quando publicar uma versão nova do site

Abra o `sw.js` no GitHub e troque `var VERSAO = 'v1';` por `'v2'`, depois `'v3'` e
assim por diante. É o que avisa os celulares de que existe conteúdo novo. Se
esquecer, alguém pode continuar vendo a versão antiga por um tempo.

---

## 15. Resumo: o que funciona hoje e o que espera servidor

| Item | Hoje, no GitHub Pages | Com servidor |
|---|---|---|
| Português e inglês, botão sempre visível | funciona | igual |
| Datas no formato de cada idioma | funciona | igual |
| Responsivo (celular, tablet, notebook) | funciona | igual |
| Visitante sem senha, sem guardar dado, com anúncio | funciona | igual |
| Assinante com apelido, e-mail e senha | funciona **neste aparelho** | vale em qualquer aparelho |
| Esqueci a senha | pelo código de recuperação | link por e-mail |
| Biometria | funciona como desbloqueio | vira autenticação de verdade |
| Login com Google | funciona depois da chave (seção 12) | igual |
| Área do anunciante | funciona, contando neste aparelho | métricas de todos somadas |
| Cobrança da assinatura | não existe | entra aqui |
| Banner de anúncio | funciona | igual |
| OCR pela câmera | funciona | igual |
| Notificações e lembretes | funciona com o app aberto | chega com o app fechado |
| Google Drive / OneDrive | funciona depois da chave | igual |
| Backup em arquivo | funciona | igual |
| Instalar como app | funciona | igual |
| Enviar e-mail para o usuário | não | seção 8, caminho 3 |
