/* Base comum dos testes do Contador de Histórias (Playwright + Chromium).
   Servidor estático local, internet de mentira (nada sai daqui) e só valores de mentira:
   nenhuma chave, senha ou nome real. Uso: veja teste/rodar.js. */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const RAIZ = path.join(__dirname, '..');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.wav': 'audio/wav', '.md': 'text/plain; charset=utf-8', '.css': 'text/css' };

/* valores de mentira */
const FALSO = {
  geminiKey: 'AQ.chave-de-mentira-gemini-111',
  openaiKey: 'sk-de-mentira-openai-222',
  elevenKey: 'xi-de-mentira-eleven-333',
  anthropicKey: 'sk-ant-de-mentira-444',
  publicoNomes: 'Lia e Davi',
  nomesProtegidos: 'Tobias'
};
const PIN = 'pin-de-teste-9';

function servir(porta) {
  return new Promise((ok) => {
    const s = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p === '/') p = '/index.html';
      const arq = path.join(RAIZ, p);
      if (!arq.startsWith(RAIZ) || !fs.existsSync(arq) || fs.statSync(arq).isDirectory()) { res.writeHead(404); res.end('nao'); return; }
      res.writeHead(200, { 'content-type': TIPOS[path.extname(arq)] || 'application/octet-stream' });
      fs.createReadStream(arq).pipe(res);
    });
    s.listen(porta || 0, '127.0.0.1', () => ok({ servidor: s, base: 'http://127.0.0.1:' + s.address().port }));
  });
}

/* áudio de mentira (WAV/PCM em silêncio, em base64) */
const AUDIO_B64 = Buffer.alloc(4800, 0).toString('base64');

/* contexto do navegador com a internet de mentira. `ped` junta o que o app pediu ao "Google". */
async function contexto(browser, base, opc) {
  opc = opc || {};
  const ctx = await browser.newContext({
    serviceWorkers: 'block', acceptDownloads: true, locale: 'pt-BR', reducedMotion: 'reduce', colorScheme: 'dark',
    viewport: { width: opc.largura || 420, height: opc.altura || 860 }
  });
  const ped = { texto: [], voz: [], outros: [] };
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, (route) => {
    const u = route.request().url();
    if (/generativelanguage\.googleapis\.com/.test(u)) {
      const corpo = route.request().postData() || '';
      const cab = route.request().headers();
      if (/responseModalities|interactions/.test(u + corpo)) {
        ped.voz.push({ url: u, chave: cab['x-goog-api-key'], corpo });
        return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' },
          body: JSON.stringify({ candidates: [{ content: { parts: [{ inlineData: { mimeType: 'audio/L16;rate=24000', data: AUDIO_B64 } }] } }], data: AUDIO_B64 }) });
      }
      ped.texto.push({ url: u, chave: cab['x-goog-api-key'], corpo });
      const texto = 'A Lua Sorridente\nEra uma vez uma lua que sorria para [NOME1] todas as noites. Quando [NOME1] dormia, a lua contava segredos ao vento. ' +
        'Depois, bem devagar, a lua se escondeu atrás de uma nuvem e todos dormiram em paz. Fim.';
      return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' },
        body: JSON.stringify({ candidates: [{ content: { parts: [{ text: texto }] } }] }) });
    }
    ped.outros.push(u);
    route.abort();
  });
  return { ctx, ped };
}

/* grava os valores de mentira no armazenamento ANTES do app abrir (uma vez por contexto: outras abas e recargas não semeiam de novo) */
async function semear(ctx, dados) {
  await ctx.addInitScript((d) => {
    try {
      if (localStorage.getItem('__semeado')) return;
      localStorage.setItem('__semeado', '1');
      Object.keys(d).forEach((k) => localStorage.setItem(k, typeof d[k] === 'string' ? d[k] : JSON.stringify(d[k])));
    } catch (e) {}
  }, dados);
}

/* voz do aparelho de mentira: guarda o que foi "falado" em window.__falas */
async function vozDeMentira(ctx) {
  await ctx.addInitScript(() => {
    window.__falas = [];
    function Fala(t) { this.text = t; }
    window.SpeechSynthesisUtterance = Fala;
    const ss = { speaking: false, pending: false, paused: false, onvoiceschanged: null,
      speak(u) { window.__falas.push(u.text); setTimeout(() => { try { u.onend && u.onend({}); } catch (e) {} }, 20); },
      cancel() {}, pause() {}, resume() {}, getVoices() { return []; }, addEventListener() {}, removeEventListener() {} };
    Object.defineProperty(window, 'speechSynthesis', { value: ss, configurable: true });
  });
}

/* guarda toda violação da CSP (o navegador também avisa no console) */
async function vigiarCsp(ctx) {
  await ctx.addInitScript(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(e.violatedDirective + ' ' + e.blockedURI));
  });
}

function vigiar(page, lista) {
  page.on('pageerror', (e) => lista.push('pageerror: ' + e.message));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (/Failed to load resource|net::ERR/i.test(t)) return;
    lista.push('console: ' + t);
  });
}

/* se a janela do cofre aparecer, cria o PIN (ou abre com ele) e segue; sem janela, não faz nada. true = apareceu */
async function resolverPin(page, pin, esperaMs) {
  const j = page.locator('#solver-cofre [role=dialog]');
  try { await j.waitFor({ state: 'visible', timeout: esperaMs == null ? 1500 : esperaMs }); } catch (e) { return false; }
  const campos = j.locator('input[type=password]');
  const n = await campos.count();
  await campos.nth(0).fill(pin);
  if (n > 1) await campos.nth(1).fill(pin);
  await j.locator('button[type=submit]').click();
  await j.waitFor({ state: 'hidden', timeout: 8000 });
  return true;
}

async function iniciar(opc) {
  opc = opc || {};
  const { servidor, base } = await servir(0);
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  return { servidor, base, browser, fechar: async () => { await browser.close(); servidor.close(); } };
}

module.exports = { FALSO, PIN, AUDIO_B64, servir, contexto, semear, vozDeMentira, vigiarCsp, vigiar, resolverPin, iniciar, RAIZ };
