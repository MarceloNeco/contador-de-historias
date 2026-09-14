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
2. Arraste os arquivos: `index.html`, `historias.json`, `capa.jpg` e `README.md`.
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

## 🔊 Escolhendo a voz

Tudo se configura na aba **Ajustes**, dentro do próprio site. Dá para trocar quando quiser.

| Opção | Custo | Qualidade | Precisa de chave? |
|---|---|---|---|
| **Gemini** ⭐ | **grátis** na cota do Google | natural, com entonação de verdade | sim (grátis) |
| **Voz do celular** | grátis | boa, mas robótica | não |
| **ElevenLabs** | pago | a melhor que existe | sim |
| **OpenAI** | barato | muito boa | sim |

**Onde pegar cada chave:**

- **Gemini** (recomendado) → `aistudio.google.com/apikey` → *Create API key* → *Create project*. A chave começa com `AIza`. **A mesma chave serve para a voz e para escrever as histórias.** São 30 vozes, e no campo *"Como ela deve ler"* você escreve em português o que quiser — tipo *"sussurre nas partes de suspense"*.
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

Você escolhe idade, tamanho, tema e personagens (com sugestões sorteadas), a IA escreve, e aí aparece a tela de **aprovar / ouvir antes / editar / pedir outra**. Só o que você aprovar é guardado.

---

## 📺 Séries com capítulos

Histórias longas, contadas capítulo por capítulo, ficam agrupadas: no acervo aparece **um cartão só** com o nome da série e quantos capítulos tem. Ao tocar, abre a lista em ordem, com ✓ nos que já foram ouvidos e um botão **Continuar do capítulo X**.

- Ao terminar um capítulo, o leitor mostra **➡️ Próximo capítulo**.
- A tela Início sugere sozinha o próximo capítulo de qualquer série que esteja no meio.
- Para escrever a continuação: aba **Criar** → **Continuar uma série** → escolha a série. A IA lê o capítulo anterior inteiro e continua de onde parou, respeitando nomes e enredo.
- Escrevendo à mão, é só preencher o campo **Série** com o mesmo nome.

---

## 🎵 Efeitos sonoros

Dentro do texto da história, um marcador sozinho numa linha aciona o som:

```
[som:chuva]
```

Disponíveis: `chuva`, `vento`, `mar`, `floresta`, `fogueira`, `noite`, `trovao`, `magia`, `sino`, `passos`, `coracao` e `fim` (desliga tudo).

Os seis primeiros são ambientes — ficam tocando baixinho ao fundo até outro entrar. Os outros tocam uma vez só. A IA já coloca esses marcadores sozinha nas histórias que gera.

---

## 💾 Backup e sincronizar entre celulares

As histórias ficam no navegador do aparelho. Para levar para outro:

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
| `capa.jpg` | A imagem grande da tela Início. Troque quando quiser, mantendo o nome. |
| `README.md` | Este guia. |

---

Feito com carinho, para duas leitoras de 4 e 8 anos. 💜
