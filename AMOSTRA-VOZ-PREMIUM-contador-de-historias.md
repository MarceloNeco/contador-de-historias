# Amostra da voz premium — Contador de Histórias

O convite da voz premium (Ajustes → Voz → ✨ SolverONE, em cinza com ⓘ) **toca a amostra sozinho ao abrir**
e para ao fechar; o botão **⏸ Parar / ▶️ Ouvir uma amostra** fica junto. O áudio é um arquivo que fica
**junto do app**, na raiz do repositório — em **MP3 ou WAV**, tanto faz:

| Arquivo | Quando toca |
|---|---|
| `amostra-voz-premium.mp3` ou `amostra-voz-premium.wav` | sempre (PT) |
| `amostra-voz-premium-en.mp3` ou `amostra-voz-premium-en.wav` | com o app em inglês (se não existir, toca o de PT) |

Enquanto o arquivo não existir, a amostra não toca e o botão de ouvir não aparece. Nada quebra.

## A frase (é a que aparece escrita no convite — grave exatamente esta)

**Português**

> Era uma vez, lá no alto de uma colina onde o vento sabia assobiar, uma estrelinha que tinha medo do escuro… Toda noite ela se escondia atrás da lua e sussurrava: — Será que alguém vai me encontrar? E sabe quem encontrou? … Você. Agora fecha os olhinhos… que a história vai começar.

**English**

> Once upon a time, high on a hill where the wind knew how to whistle, there lived a little star who was afraid of the dark… Every night she hid behind the moon and whispered: "Will anyone ever find me?" And do you know who found her? … You. Now close your eyes… the story is about to begin.

Por que esta frase: em ~20 segundos mostra tudo o que a voz premium faz melhor que a voz do celular —
narração calma, uma pausa longa (as reticências), um sussurro de personagem, uma pergunta, a virada
("… Você.") falando direto com a criança, e um fim de dormir.

## Jeito mais fácil (grátis): 3 toques

1. No mesmo navegador em que você usa o Contador, abra:
   **https://marceloneco.github.io/contador-de-historias/GERAR-AMOSTRA-contador-de-historias.html**
   Ela já começa a gerar e toca sozinha. Não gostou? Troque a voz na lista (gera de novo sozinha).
2. Toque em **⬇️ 1. Baixar**.
3. Toque em **📤 2. Enviar para o app**, arraste o arquivo baixado e toque no botão verde **Commit changes**.

Pronto: em 1 a 2 minutos a amostra toca sozinha quando alguém toca no ⓘ da voz premium.

## Caminho grátis: Google AI Studio (qualidade muito boa, sem contratar nada)

Se o AI Studio abrir no **Antigravity Agent Preview** (o agente que pede chave), ignore: para voz é preciso
escolher um modelo com **TTS** no nome (no seletor de modelo, à direita) ou abrir a geração de fala.

Só precisa de uma conta Google. É a mesma família de vozes do Gemini que o Contador já usa.

1. Abra **aistudio.google.com** e entre com a sua conta Google.
2. No menu da esquerda, abra a geração de fala (**Generate speech** / **Speech generation**, ícone de alto-falante).
3. Escolha **Single-speaker audio** e o modelo **Pro** de voz (TTS), se aparecer; senão, o **Flash**.
4. **Voice**: experimente **Sulafat** (calorosa), **Achernar** (suave) e **Vindemiatrix** (gentil).
5. No campo de estilo (**Style instructions**), cole:

   > Leia como uma contadora de histórias brasileira na hora de dormir: voz calorosa e calma, ritmo lento, pausas longas nas reticências. Sussurre a pergunta da estrelinha, faça uma pausa antes de "Você" e termine bem baixinho.

6. No texto, cole a frase em português lá de cima e clique em **Run**. Gere 3 ou 4 vezes e fique com a melhor.
7. Baixe (ícone de download): vem em **WAV**. Renomeie para `amostra-voz-premium.wav`.
8. GitHub → repositório `contador-de-historias` → **Add file → Upload files** → arraste o arquivo → **Commit changes**.

**Seja honesto com quem ouve:** a amostra tem de ser a voz que a pessoa vai receber. Se a amostra sair do
Gemini, ponha a voz premium como Gemini no RootifyONE (Voz e IA da plataforma → voz-premium: Provedor
**Google Gemini**, Modelo o mesmo TTS que você usou, e em **Voz no provedor** o nome da voz, ex. `Sulafat`).
Para vender em escala, use a chave do Gemini com faturamento ligado no Google Cloud (a cota grátis é pequena).

## E a ElevenLabs de graça?

Dá para testar no plano grátis, mas ele **não permite uso comercial** (e exige citar a ElevenLabs), e a amostra
dentro de um app que vende plano é uso comercial. O plano mais barato pago (**Starter**) libera o uso comercial:
dá para assinar um mês só para gravar. Confira os termos atuais antes.

## Como gravar com MUITA qualidade (ElevenLabs)

Use **a mesma voz e o mesmo modelo** que estão ligados no RootifyONE (Voz e IA da plataforma → voz-premium):
a amostra tem de ser honesta com o que a pessoa vai ouvir depois. E use a conta **paga** da SolverONE
(a grátis não permite uso comercial).

1. elevenlabs.io → **Text to Speech**.
2. **Voice**: a mesma do RootifyONE. Se ainda não escolheu, em **Voices → Voice Library** filtre
   *Portuguese* e *Narrative & Story* e ouça 3 ou 4; prefira uma voz calma, grave-média, com "sorriso" na fala.
3. **Model**: Eleven Multilingual v2 (o padrão do RootifyONE).
4. **Settings**: Stability **35–45%** (mais emoção), Similarity **80%**, Style **30–40%**, Speaker boost **ligado**.
5. Cole a frase em português (com as reticências e o travessão, do jeito que está acima).
6. Gere **3 ou 4 vezes** e fique com a melhor: o sussurro tem de soar sussurrado, e o "… Você." precisa da pausa antes.
7. **Download** em MP3 (128 kbps basta; o arquivo fica com uns 300 KB).
8. Renomeie para `amostra-voz-premium.mp3` (e a inglesa para `amostra-voz-premium-en.mp3`). WAV também serve.
9. GitHub → repositório `contador-de-historias` → **Add file → Upload files** → arraste o(s) arquivo(s) → **Commit changes**.

Em 1 a 2 minutos a amostra passa a tocar sozinha no convite. Trocou de voz no RootifyONE?
Grave a amostra de novo com a voz nova.
