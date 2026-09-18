# 📖 Contador de Histórias

Um site simples e bonito para contar histórias de dormir, feito para funcionar no celular.

- **Contador dinâmico**: quantas histórias existem, quantas leituras já aconteceram, quantos minutos ouvidos e quantas noites seguidas.
- **Acervo** com busca, filtro por idade e favoritos.
- **Criar histórias**: sugestões de temas e personagens, escolha da idade (2–5, 6–9, 10+, ou "as duas juntas"), e uma tela de **aprovar antes de guardar**.
- **Leitura em voz alta**, com três opções que você escolhe dentro do próprio site: voz do celular (grátis), ElevenLabs (a mais natural) ou OpenAI.
- **Efeitos sonoros** — chuva, vento, mar, fogueira, floresta, trovão, magia — criados pelo próprio site, sem baixar nenhum arquivo.
- **Nada sai do seu celular**: as histórias ficam salvas no navegador, com botões de exportar e importar backup.

---

## 🚀 Como publicar (passo a passo, do zero)

### 1. Criar o repositório

1. Entre em **github.com** e clique no **+** no canto superior direito → **New repository**.
2. Em **Repository name**, escreva: `contador-de-historias`
3. Em **Choose visibility**, deixe **Public** (o GitHub Pages de graça só funciona em repositório público).
4. Clique em **Create repository**.

### 2. Subir os arquivos

1. Na página do repositório recém-criado, clique em **Add file** → **Upload files**.
2. Arraste os arquivos: `index.html`, `historias.json`, `capa.jpg`, `fundo-historia.jpg` e `README.md`.
3. Lá embaixo, clique no botão verde **Commit changes**.

### 3. Ligar o site (GitHub Pages)

1. Ainda no repositório, clique em **Settings** (a engrenagem, no menu de cima).
2. No menu da esquerda, clique em **Pages**.
3. Em **Source**, escolha **Deploy from a branch**.
4. Em **Branch**, escolha **main** e a pasta **/ (root)**. Clique em **Save**.
5. Espere de 1 a 3 minutos e recarregue a página. Vai aparecer o endereço do site, mais ou menos assim:

```
https://SEU-USUARIO.github.io/contador-de-historias/
```

### 4. Colocar o ícone no celular

Abra esse endereço no celular:

- **Android (Chrome)**: menu **⋮** → *Adicionar à tela inicial*
- **iPhone (Safari)**: botão de compartilhar → *Adicionar à Tela de Início*

Pronto: vira um app com ícone, em tela cheia.

---

## 🖼️ As duas imagens

- **`capa.jpg`** — a capa larga no topo da tela Início, em qualquer aparelho.
- **`fundo-historia.jpg`** — o cenário nas laterais, só em tela de **1080px ou mais** (computador). No celular e no tablet ele nem carrega, para não gastar dados.

Para trocar qualquer uma: suba outra imagem com o mesmo nome por cima. Se o arquivo não existir, o site simplesmente não mostra nada ali — nada quebra.

---

## 👧 Para quem são as histórias

Em **Ajustes**, a primeira seção permite informar os **primeiros nomes** de quem vai ouvir e se é uma menina, um menino, duas ou mais meninas, dois ou mais meninos, ou um grupo misto.

Com isso:

- a saudação do topo passa a ser **"boa noite, Lara e Julia"** (ou "boa noite, meninos", "boa noite, crianças"…);
- a IA escreve fazendo a concordância certa e, se o botão estiver ligado, **abre a história com uma saudação** a quem vai ouvir.

Deixando tudo em branco, o topo mostra apenas **"BOA NOITE! QUE TAL UMA HISTÓRIA?"** e nada de nome aparece em lugar nenhum. Essa informação fica só no aparelho — não vai para o repositório.

**🔈 Ouvir o cumprimento** — o botão fala, com a voz escolhida, a frase *"Olá Lara e Julia, vamos ouvir uma historinha?"*. Sem nomes, usa o coletivo ("Olá meninas…"); sem nada informado, vira *"Olá, vamos ouvir uma historinha?"*.

Com o botão **Falar o cumprimento antes da história** ligado, essa frase é dita antes de cada leitura. O áudio dela é gerado **uma única vez** e reaproveitado em todas as histórias — não consome cota de novo.

---

## 🔊 Escolhendo a voz

Tudo se configura na aba **Ajustes**, dentro do próprio site. Dá para trocar quando quiser.

| Opção | Custo | Qualidade | Precisa de chave? |
|---|---|---|---|
| **Gemini** ⭐ | **grátis** na cota do Google | natural, com entonação de verdade | sim (grátis) |
| **Voz do celular** | grátis | boa, mas robótica | não |
| **ElevenLabs** | pago | a melhor que existe | sim |
| **OpenAI** | barato | muito boa | sim |

**Onde pegar cada chave:**

- **Gemini** (recomendado) → `aistudio.google.com/apikey` → *Create API key* → *Create project*. As chaves novas começam com `AQ.` (as antigas começavam com `AIza`); as duas funcionam. **A mesma chave serve para a voz e para escrever as histórias.** São 30 vozes, e no campo *"Como ela deve ler"* você escreve em português o que quiser — tipo *"sussurre nas partes de suspense"*.
- **ElevenLabs** → `elevenlabs.io` → conta → *Profile* → *API Key*. Depois, no site, toque em **Carregar minhas vozes** e escolha a que preferir.
- **OpenAI** → `platform.openai.com` → adicione créditos → *API keys* → *Create new secret key*.

> As chaves ficam salvas **só no navegador do seu celular**. Elas **não** vão para o GitHub e ninguém mais as vê. Como o repositório é público, nunca escreva uma chave dentro dos arquivos.

**Dica:** com a voz do celular, se a tela apagar o Android às vezes interrompe a leitura. Com ElevenLabs ou OpenAI é áudio de verdade, então continua tocando normalmente.

---

## ✨ Escolhendo quem escreve as histórias

Também na aba **Ajustes**:

- **Só eu escrevo** — nenhuma chave, funciona até sem internet.
- **Gemini** — tem cota **gratuita** por dia. Chave em `aistudio.google.com/apikey`.
- **Claude** — chave em `console.anthropic.com`. Pago por uso, centavos por história.
- **OpenAI** — usa a mesma chave da voz.

A aba **Criar** tem estas entradas, todas com sugestões sorteáveis:

| Entrada | O que faz |
|---|---|
| **Para quem é** | 2–5, 6–9, 10+ ou "as duas juntas" — muda vocabulário e complexidade |
| **Tamanho** | Curtinha (~3 min), Média (~6 min) ou Longa (~10 min) |
| **Tema** | O enredo em uma frase |
| **Personagens** | Quem aparece na história |
| **Onde acontece** | O cenário |
| **Clima** | Engraçada, misteriosa, emocionante, com reviravolta, calminha… |
| **Parecida com…** | Inspiração: pega o espírito de uma obra conhecida, sem copiar nada dela |
| **No estilo de uma história que já temos** | A IA lê uma das suas histórias e imita o **jeito de contar** — ritmo, humor, tamanho das frases — com enredo novo |
| **Pedido especial** | Qualquer instrução livre |

A IA escreve e aparece a tela de **aprovar / ouvir antes / editar / pedir outra**. Só o que você aprovar é guardado.

---

## ⚡ Por que a voz demora (e como não demorar)

Vozes de IA geram o áudio **antes** de tocar — quanto maior o trecho, mais demora. O site resolve isso em três camadas:

1. **Começo curtinho.** O primeiro trecho tem só uma ou duas frases, então a leitura começa em segundos. Os trechos seguintes vão ficando maiores.
2. **Esteira em segundo plano.** Enquanto um trecho toca, o site já está gerando os próximos dois. Na prática, o áudio corre na frente da leitura.
3. **Fica guardado.** Todo áudio gerado é salvo **neste aparelho**. Da segunda vez, a mesma história toca **na hora** — e até sem internet.

**O botão que resolve tudo:** abra a história e toque em **⬇️ Baixar a voz desta história**, logo abaixo dos controles. Ele gera a história inteira com barra de progresso e guarda no aparelho. A partir daí:

- começa na hora, sem espera;
- voltar um trecho, repetir ou ouvir de novo amanhã **não gasta a cota de novo**;
- funciona **sem internet**.

O botão mostra o estado: *"Baixar a voz (9 trechos)"*, *"Continuar baixando (5 de 9 prontos)"* ou *"✅ Áudio guardado"*. Se parar no meio (cota, internet), o que já baixou fica salvo e o botão continua de onde parou.

No acervo, as histórias com áudio guardado aparecem com o selo **⚡ áudio pronto**.

Em **Ajustes → Velocidade da voz** você vê quanto está guardado e pode apagar.

---

## 🆓 Voz natural sem chave nenhuma

No **computador**, abra o site pelo **Microsoft Edge** e escolha a voz do celular: o Edge traz vozes brasileiras neurais (**Francisca**, **Thalita**, **Antonio** — aparecem com ⭐ na lista), grátis, sem chave e **sem espera nenhuma**. É a melhor relação qualidade/velocidade para ouvir no PC.

No **Android**: Configurações → Acessibilidade → **Saída de texto para voz** → engine do Google → baixe a voz em português de maior qualidade. Ajuda bastante, mas ainda perde para o Gemini.

---

## 📺 Séries com capítulos

Histórias longas, contadas capítulo por capítulo, ficam agrupadas: no acervo aparece **um cartão só** com o nome da série e quantos capítulos tem. Ao tocar, abre a lista em ordem, com ✓ nos que já foram ouvidos e um botão **Continuar do capítulo X**.

- Ao terminar um capítulo, o leitor mostra **➡️ Próximo capítulo**.
- Nos controles, **⏪** e **⏩** pulam capítulo inteiro; **⏮** e **⏭** pulam trecho.
- A tela Início sugere sozinha o próximo capítulo de qualquer série que esteja no meio.
- Para escrever a continuação: aba **Criar** → **Continuar uma série** → escolha a série. A IA lê o capítulo anterior inteiro e continua de onde parou, respeitando nomes e enredo.
- Escrevendo à mão, é só preencher o campo **Série** com o mesmo nome.

---

## ▶️ Continuar ouvindo

Se uma história ficou pela metade, ela aparece numa seção **Continuar ouvindo** no topo da tela Início, com barrinha de progresso e a porcentagem. Toque e o play retoma exatamente do ponto — mesmo que você tenha trocado de voz no meio do caminho.

Mais abaixo, **Ouvidas recentemente** lista as que já foram até o fim.

---

## ✓ Já lida e retomar de onde parou

- Todo cartão do acervo tem um **quadradinho ✓** à direita: marque a história como **já lida**.
- Os filtros do acervo incluem **⭘ Não lidas**, **✓ Já lidas** e **★ Favoritas**.
- Se você pausar no meio, o site **guarda o ponto**. Ao reabrir, aparece *"⏸ você parou em 45%"* e o play continua dali — ou toque em **⟲ começar do início**.
- Em séries, o capítulo em que vocês pararam aparece na lista e na tela Início.

Tudo isso fica salvo neste aparelho, junto com as histórias.

---

## 🎵 Efeitos sonoros

Dentro do texto da história, um marcador sozinho numa linha aciona o som:

```
[som:chuva]
```

**Ambientes** (tocam ao fundo e somem devagar): `chuva`, `vento`, `mar`, `floresta`, `fogueira`, `noite`.

**Momentos** (tocam uma vez): `trovao`, `magia`, `sino`, `passos`, `coracao`, `explosao`, `tiro`, `galope`.

**Bichos** (tocam uma vez): `latido` (cachorro), `miado` (gato), `mugido` (vaca), `rugido` (leão), `chiado` (cobra), `coruja`, `galo`, `sapo`, `elefante`.

E `fim`, que desliga tudo.

Todos são **criados pelo próprio site**, com síntese de som — não existe nenhum arquivo de áudio no repositório. Por isso os bichos soam estilizados, meio de desenho animado, e não como gravação real. Em **Ajustes → Efeitos sonoros** dá para ouvir os 24 antes de usar.

Os seis primeiros são ambientes — ficam tocando baixinho ao fundo até outro entrar. Os outros tocam uma vez só. A IA já coloca esses marcadores sozinha nas histórias que gera.

---

## 💾 Backup e sincronizar entre celulares

As histórias ficam no navegador do aparelho. Para levar para outro:

### Levar as chaves para outro aparelho

As chaves ficam guardadas **em cada aparelho separadamente** — é exatamente isso que impede que elas vazem pelo GitHub. Então, num celular novo, elas não aparecem sozinhas.

Para não digitar tudo de novo: **Ajustes → 📱 Levar minha configuração para outro aparelho** → **Copiar o link**. Abra esse link uma vez no outro aparelho, confirme, e pronto. O link carrega as chaves, então mande só para você mesmo (o mais prático é o menu do Chrome → *Enviar para seus dispositivos*). O token do GitHub nunca vai junto.

---

**Jeito simples (recomendado)**

1. Ajustes → **Exportar**. Baixa o arquivo `historias.json`.
2. No GitHub, abra o repositório → clique em `historias.json` → ícone do **lápis** → apague o conteúdo → cole o conteúdo novo → **Commit changes**.
   *(Ou: Add file → Upload files → arraste o arquivo novo por cima.)*
3. Qualquer celular que abrir o site pega as histórias automaticamente.

**Jeito automático (avançado)**

Ajustes → **Sincronizar direto com o GitHub**. Você cola o nome do repositório e um token *fine-grained* com permissão **Contents: Read and write** só nesse repositório, e aí um botão envia o acervo direto. O token fica salvo apenas no seu celular.

---

## 📁 Arquivos

| Arquivo | O que é |
|---|---|
| `index.html` | O site inteiro — tudo está aqui dentro. |
| `historias.json` | As histórias que aparecem para todo mundo que abre o site. |
| `capa.jpg` | A imagem grande da tela Início (aparece em todos os aparelhos). |
| `fundo-historia.jpg` | O cenário que preenche as laterais **no computador**. Ignorado no celular. |
| `README.md` | Este guia. |

---

## ℹ️ Versão e aviso de uso

Em **Ajustes → Sobre** ficam:

- o **número da versão** instalada no aparelho (útil para conferir se o arquivo novo já chegou — o navegador às vezes guarda o antigo; nesse caso, recarregue com Ctrl+Shift+R no computador ou puxando a tela para baixo no celular);
- **🆕 Novidades**, com o histórico de todas as versões e o que mudou em cada uma;
- **📄 Aviso de uso**, com o texto sobre privacidade, dados, chaves de terceiros e direitos autorais.

O site é um projeto pessoal, sem finalidade econômica, sem coleta de dados e sem publicidade. Está marcado com `noindex`, ou seja, pedindo aos buscadores que não o incluam em resultados de pesquisa.

---

Feito com carinho, para duas leitoras de 4 e 8 anos. 💜
