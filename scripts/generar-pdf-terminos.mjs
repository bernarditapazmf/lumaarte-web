// Genera public/docs/terminos-retiro-de-mujeres-2027.pdf a partir de src/lib/terminosRetiro.js.
// Uso: node scripts/generar-pdf-terminos.mjs   (requiere Google Chrome instalado en macOS)
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { TERMINOS_TITULO, TERMINOS_SUBTITULO, TERMINOS_VERSION, TABLA_CANCELACION, SECCIONES_TERMINOS } from '../src/lib/terminosRetiro.js';

const raiz = resolve(fileURLToPath(new URL('..', import.meta.url)));
const fuentes = pathToFileURL(join(raiz, 'public/fonts')).href;
const salida = join(raiz, 'public/docs/terminos-retiro-de-mujeres-2027.pdf');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const tabla = `<table><thead><tr><th>Si cancelas…</th><th>Te devolvemos</th></tr></thead><tbody>${
  TABLA_CANCELACION.map(f => `<tr><td>${f.plazo}</td><td>${f.devolucion}</td></tr>`).join('')}</tbody></table>`;

const secciones = SECCIONES_TERMINOS.map(s => `
  <section><h2>${s.titulo}</h2>
  ${s.parrafos.map(p => `<p>${p}</p>`).join('')}
  ${s.tabla ? tabla : ''}
  ${(s.parrafosDespues || []).map(p => `<p>${p}</p>`).join('')}
  </section>`).join('');

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>
@font-face{font-family:'Mackinac';src:url('${fuentes}/Mackinac-Book.otf')}
@font-face{font-family:'Mackinac';font-style:italic;src:url('${fuentes}/Mackinac-BookItalic.otf')}
@font-face{font-family:'CoFo Sans';font-weight:300;src:url('${fuentes}/CoFoSans-Light.otf')}
@font-face{font-family:'CoFo Sans';font-weight:500;src:url('${fuentes}/CoFoSans-Medium.otf')}
@page{size:A4;margin:22mm 20mm}
body{font-family:'CoFo Sans',sans-serif;font-weight:300;color:#211f18;font-size:10.5pt;line-height:1.6}
.eyebrow{font-weight:500;font-size:8pt;letter-spacing:.25em;text-transform:uppercase;color:#54582f;margin:0 0 10px}
h1{font-family:'Mackinac',serif;font-weight:400;font-size:24pt;line-height:1.15;margin:0 0 6px}
.sub{color:rgba(33,31,24,.6);margin:0 0 4px}.ver{color:rgba(33,31,24,.45);font-size:8.5pt;margin:0 0 26px}
h2{font-family:'Mackinac',serif;font-weight:400;font-size:14pt;margin:22px 0 8px}
h2{break-after:avoid}table{break-inside:avoid}
p{margin:0 0 8px}
table{width:100%;border-collapse:collapse;margin:10px 0 12px;font-size:9.5pt}
th{text-align:left;font-weight:500;background:#f3f0e9;padding:8px 10px;border-bottom:1px solid rgba(33,31,24,.2)}
td{padding:8px 10px;border-bottom:.5px solid rgba(33,31,24,.15);vertical-align:top}
td:last-child{font-weight:500;width:42%}
</style></head><body>
<p class="eyebrow">Luma Arte · Experiencias</p>
<h1>${TERMINOS_TITULO}</h1>
<p class="sub">${TERMINOS_SUBTITULO}</p>
<p class="ver">${TERMINOS_VERSION}</p>
${secciones}
</body></html>`;

const dir = mkdtempSync(join(tmpdir(), 'terminos-'));
const htmlPath = join(dir, 'terminos.html');
writeFileSync(htmlPath, html);
execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', '--allow-file-access-from-files',
  `--print-to-pdf=${salida}`, pathToFileURL(htmlPath).href], { stdio: 'ignore' });
console.log('PDF generado:', salida);
