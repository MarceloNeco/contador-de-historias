# Amostra da voz premium — Contador de Histórias

O convite da voz premium (Ajustes → Voz → ✨ SolverONE, em cinza com ⓘ) tem o botão **▶️ Ouvir uma amostra**.
Ele toca um arquivo que fica **junto do app**, na raiz do repositório:

| Arquivo | Quando toca |
|---|---|
| `amostra-voz-premium.mp3` | sempre (PT) |
| `amostra-voz-premium-en.mp3` | com o app em inglês (se não existir, toca o de PT) |

Enquanto o arquivo não existir, o botão de ouvir simplesmente não aparece. Nada quebra.

## A frase (é a que aparece escrita no convite — grave exatamente esta)

**Português**

> Era uma vez, lá no alto de uma colina onde o vento sabia assobiar, uma estrelinha que tinha medo do escuro… Toda noite ela se escondia atrás da lua e sussurrava: — Será que alguém vai me encontrar? E sabe quem encontrou? … Você. Agora fecha os olhinhos… que a história vai começar.

**English**

> Once upon a time, high on a hill where the wind knew how to whistle, there lived a little star who was afraid of the dark… Every night she hid behind the moon and whispered: "Will anyone ever find me?" And do you know who found her? … You. Now close your eyes… the story is about to begin.

Por que esta frase: em ~20 segundos mostra tudo o que a voz premium faz melhor que a voz do celular —
narração calma, uma pausa longa (as reticências), um sussurro de personagem, uma pergunta, a virada
("… Você.") falando direto com a criança, e um fim de dormir.

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
8. Renomeie para `amostra-voz-premium.mp3` (e a inglesa para `amostra-voz-premium-en.mp3`).
9. GitHub → repositório `contador-de-historias` → **Add file → Upload files** → arraste o(s) arquivo(s) → **Commit changes**.

Em 1 a 2 minutos o botão **▶️ Ouvir uma amostra** passa a aparecer no convite. Trocou de voz no RootifyONE?
Grave a amostra de novo com a voz nova.
