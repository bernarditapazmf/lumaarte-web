# Handoff: Luma Producciones — Landing page (venta de arte)

## Overview
Landing page de una sola vista para **Luma Producciones**, venta de arte original (pintura) inspirado en la naturaleza del sur de Chile / Patagonia, de la artista **B. Mir**. Incluye: hero con imagen de fondo en movimiento, galería de obras con selector de tamaño y de paspartú, sección de inspiración/oficio en collage, sección de **Giftcards** configurables, formulario de colaboración, newsletter, footer y un **carrito lateral** deslizable.

Idioma: **español (Chile)**. Tono: calmo, editorial, natural.

## About the Design Files
Los archivos de `source/` son una **referencia de diseño creada en HTML** — un prototipo que muestra el aspecto y el comportamiento buscados, **no** código de producción para copiar tal cual. La tarea es **recrear este diseño en el entorno del sitio web de destino** (el CMS/stack que ya use la página: WordPress, Shopify, Astro, React, etc.), usando sus patrones y librerías establecidos. Si no existe un entorno aún, elegir el framework más apropiado e implementarlo ahí.

El prototipo está construido como un "Design Component" (`.dc.html`) que corre con un runtime propio (`support.js`). **No se recomienda subir el `.dc.html` tal cual a producción**; sí sirve como fuente de verdad visual y de interacción, y se puede abrir en el navegador para verlo funcionando (ver "Cómo previsualizar").

## Fidelity
**Alta fidelidad (hi-fi).** Colores, tipografías, espaciados e interacciones son los definitivos. Recrear la UI pixel-perfect usando las librerías/patrones del código destino. Las imágenes de obras y fondos son las reales entregadas por la artista.

## Cómo previsualizar el prototipo
Abrir `source/Luma - Portada.dc.html` en un navegador (doble clic o vía Live Server en VS Code). Requiere que estén junto a él: `support.js`, la carpeta `assets/` y `_ds/.../tokens/fonts.css` (todo incluido en este bundle, con la misma estructura de carpetas).

## Estructura / Secciones (orden vertical)
1. **Hero** (`#top` / nav superpuesta)
2. **Pinturas** (`#pinturas`) — galería de obras
3. **Inspiración** (`#sobre`) — collage
4. **El oficio** (`#blog`) — texto sobre foto
5. **Giftcards** (`#giftcards`)
6. **Contacto + Newsletter** (`#contacto`)
7. **Footer**

La barra de navegación superpuesta enlaza: Pinturas · Sobre mí · Blog · Giftcards · Contacto, más el ícono de carrito. El logo (arriba-izquierda) vuelve al inicio.

---

## Detalle por sección

### 1. Hero
- **Layout:** full-viewport (`min-height:100vh`), imagen de fondo a sangre con un zoom lento infinito (`@keyframes lumaDrift`, ~48s). Nav absoluta arriba; bloque de texto abajo-izquierda; indicador "Desliza" centrado abajo.
- **Fondo:** `assets/img/hero.jpg` (foto de paisaje con desenfoque de movimiento). Sobre ella, un velo en degradado oscuro para legibilidad (controlable con la prop `heroOverlay`, 0–80%, default 42%).
- **Nav:** logo `assets/img/luma-logo.png` (invertido a blanco con `filter:brightness(0) invert(1)`), altura ~66px. Ítems de menú en mono, 12px, `letter-spacing:.16em`, mayúsculas, color `#fdfcf8`, subrayado en hover. Ícono carrito (SVG) + contador `(n)`.
- **Copy:**
  - Eyebrow: `PINTURA ORIGINAL — PATAGONIA CHILENA` (mono, tracking .34em, blanco 85%).
  - H1 (Mackinac, 400, 80px, line-height 1.02, `-.02em`, blanco): "El movimiento del Sur, hecho *arte*." ("arte" en cursiva).
  - Subtítulo (CoFo Sans, 300, 18px, blanco 90%): "Cada obra está pensada para acercar la Naturaleza a tus espacios."
  - Botón "VER PINTURAS": pill (`border-radius:60px`), fondo `#FDFCF8`, texto `#211f18` mono 12px tracking .14em, ancla a `#pinturas`.

### 2. Pinturas (galería)
- **Layout:** contenedor `max-width:1300px`, grid de **3 columnas** con `gap:44px 32px`. Encabezado con eyebrow "LA COLECCIÓN" + H2 "Pinturas *originales*" y enlace "VER TODAS →". Fila 1: las 3 verticales; fila 2: Mujer Hortensia (vertical) + Bosque de Arrayanes (horizontal, ocupa 2 columnas).
- **5 obras** (todas con descripción idéntica: *"Técnica mixta. Acuarela, pastel al óleo, hilo sobre papel."*):
  1. **Dúo Lilium y Volcanes I** — vertical — Disponible
  2. **Dúo Lilium y Volcanes II** — vertical — **Vendida** (no comprable)
  3. **Rostro de Chilcos** — vertical — Disponible
  4. **Mujer Hortensia** — vertical — Disponible
  5. **Bosque de Arrayanes** — **horizontal** (ocupa 2 columnas; su marco se reduce ~32px de ancho para que su título quede alineado con el de Mujer Hortensia) — Disponible
- **Cada tarjeta** (las imágenes ya vienen enmarcadas, con fondo transparente — el card es transparente, sin sombra ni fondo propios):
  - Imagen `object-fit:contain`, `aspect-ratio` 106/150 (vertical) o 150/106 (horizontal).
  - Badge estado arriba-izquierda: pill blanco translúcido, punto (verde `#54582f` si Disponible / gris si Vendida) + texto mono 10px mayúsculas.
  - Título (Mackinac 21px) + descripción (CoFo Sans 12.5px, gris 55%).
  - **Selector de Paspartú** debajo: etiqueta "PASPARTÚ" (mono 9px) + dos botones **Blanco / Negro** (mono 10px mayúsculas). El seleccionado va con fondo `#211f18` / texto `#fdfcf8`; el otro con borde tenue. Cambia la imagen mostrada.
- **Interacciones:**
  - **Hover:** la tarjeta se eleva (`translateY(-5px)`) y la imagen hace **zoom `scale(1.62)`** (recorta marco y paspartú, dejando ver solo la obra). `overflow:hidden` en el marco. Transición transform .8s `cubic-bezier(.16,1,.3,1)`.
  - **Clic sobre obra disponible:** la imagen se difumina (`blur(7px) brightness(.82)` + `scale(1.04)`) y aparece un overlay con:
    - "ELIGE EL TAMAÑO" + 3 opciones apiladas: **30 × 40 cm**, **40 × 50 cm**, **50 × 70 cm** (botones; seleccionado = relleno claro; hover = aclarado sutil, solo si no seleccionado).
    - Botón **"Comprar →"** abajo a la derecha (pill claro).
  - **Comprar** agrega la obra al carrito con la medida elegida (por defecto 30 × 40 si no se elige) y abre el carrito. Segundo clic sobre la obra cierra el overlay.
  - Obra **Vendida**: no abre overlay ni permite compra (cursor normal).
- **Versiones de imagen por obra:** `obraN_white.png` (paspartú blanco, **default**) y `obraN_black.png` (paspartú negro). N = 1..5.

### 3. Inspiración (collage) — `#sobre`
- Fondo oscuro (`#171a10`) con **foto de agua** a sangre (`assets/img/oficio.jpg`) y zoom lento (~64s); velo en degradado para legibilidad. Bordes superior e inferior se **disuelven** con degradados al color del fondo contiguo (arriba a `#FDFCF8`, abajo a `#FDFCF8`) — sin líneas rectas visibles.
- **Collage tipo scrapbook** (posicionamiento absoluto dentro de un "stage" de 1180×620 que se **escala** para caber en el ancho disponible — ver `_fitCollage()`):
  - Foto polaroid grande (`assets/img/sunrays.jpg`) con cinta washi.
  - Foto con cinta (`assets/img/volcan.jpg`).
  - Acento manuscrito (fuente **Caveat**) "lo que nos inspira…" (color `#54582f`). *(Nota: si molesta la tipografía manuscrita, es candidata a revisión — se mantuvo por decisión de la usuaria.)*
  - **Cita central** (Mackinac cursiva ~29px, blanco): "Nos inspira la naturaleza del sur de Chile, la Patagonia y su movimiento… particular, delicado. La bruma sobre el lago, el canto del chucao, la suave brisa del atardecer." — legible sobre el agua.
  - Fotos flotan con animaciones suaves (`lumaFloatA/B/C`).

### 4. El oficio — `#blog`
- Mismo fondo de agua continuo. Grid 2 columnas: texto (izquierda) + dos fotos polaroid (`assets/img/insp2.jpg` lago, `assets/img/insp1.jpg` arrayán) a la derecha.
- Eyebrow "EL OFICIO" (mono, verde claro), H2 Mackinac 44px blanco "Materiales nobles, procesos *lentos*.", párrafo (CoFo Sans 300 16px blanco): "Creemos en lo sostenible como forma de crear. Trabajamos con papeles de algodón, marcos de madera nativa reciclada como mañío, laurel o roble, respetando el tiempo que cada obra necesita." (con `text-shadow` para legibilidad sobre foto).

### 5. Giftcards — `#giftcards`
- Fondo papel `#FDFCF8`. Encabezado centrado: eyebrow "GIFTCARDS", H2 "Regala un pedazo *del Sur*", bajada.
- **Grid 2 columnas:**
  - **Izquierda — vista previa + selectores:**
    - Tarjeta rectangular `aspect-ratio:8/5`, `border-radius:20px`, `overflow:hidden`, con **imagen de fondo seleccionable** + velo diagonal para legibilidad. Encima: logo + "TARJETA DE REGALO"; monto grande centrado (Mackinac); "PARA {nombre}", dedicatoria (Mackinac cursiva), "DE {nombre}" — **todo en vivo** según el formulario.
    - **Selector de diseño:** `<select>` estilizado con 6 fondos: Dunas de tela (`gc1`), Cascada de bruma (`gc2`), Follaje en viento (`gc3`), Vuelo de cisnes (`gc4`), Pradera al viento (`gc5`), Manos de luz (`gc6`). Cambia el fondo de la tarjeta.
    - **Selector de monto:** control segmentado de 4 — **$35.000**, **$50.000**, **$100.000**, **Otro**. "Otro" muestra un input para escribir el monto libre (formateado CLP en la tarjeta).
  - **Derecha — formulario:** De parte de, Para, Correo de quien recibe, Mensaje. Botón **"AGREGAR GIFTCARD AL CARRITO →"**.
    - **Validación:** el botón queda **deshabilitado** (gris, `not-allowed`) hasta que estén completos: de, para, correo **válido** (regex), mensaje y monto > 0. Un texto guía indica qué falta (en color de alerta `#9a4a2a`). Al completarse, el botón se habilita (`#54582f`) y agrega la giftcard al carrito con diseño y monto.

### 6. Contacto + Newsletter — `#contacto`
- Fondo `#F3F0E9`. Grid 2 columnas (los eyebrows "COLABOREMOS" y "NEWSLETTER" quedan **alineados en la misma línea superior**).
  - **Colaboremos:** H2 "¿Trabajamos *juntos*?" + bajada + campos (Tu nombre, Tu correo, Cuéntanos tu idea) con inputs de línea, botón "ENVIAR MENSAJE" (pill oscuro `#211f18`).
  - **Newsletter:** (columna con borde izquierdo hairline) H3 "Cartas desde el Sur" + texto: "Un correo pausado: nuevas obras, aquello que nos inspira, y artículos sobre cómo el arte sana — sus beneficios para el alma y para el cuerpo — junto a panoramas de arte y cultura de la Región de Los Lagos." + input correo + "SUSCRIBIRME →".

### 7. Footer
- Fondo `#211f18`, texto `#f3f0e9`. Logo (blanco) + descripción "Arte original inspirado en la naturaleza del sur de Chile. Por B. Mir." · Columna **Contacto**: `contacto@lumaproducciones.cl` (mailto) + dirección "San Francisco 1070, Puerto Varas". · Columna **Síguenos**: Instagram → `https://www.instagram.com/lumaartechile` (abre en pestaña nueva), con ícono. · Línea legal: "© 2026 Luma Producciones · Todas las obras son originales de B. Mir."

### Carrito (drawer lateral)
- **Fijo al viewport** (`position:fixed`), pega al borde derecho, alto completo (`100vh`), ancho 360px (`max-width:92vw`), entra deslizando (`transform:translateX` con transición .6s). Scrim oscuro detrás (clic para cerrar).
- Encabezado "Tu carrito (n)" + cerrar. Lista de ítems (imagen + título + detalle + "Quitar"). Estado **vacío** con mensaje. Pie **fijo abajo** con botón **"IR A PAGAR →"** (siempre visible sin scroll) + nota "Pago seguro · Webpay / transferencia".
- Ítems de obra: detalle "Técnica mixta · {medida}". Ítems giftcard: "Envío digital · {monto}".

---

## Interacciones & comportamiento (resumen)
- Scroll suave (`html{scroll-behavior:smooth}`); nav ancla a secciones.
- Movimiento "brisa": zoom lento en hero y foto de agua; flotación suave de polaroids. **Respetar `prefers-reduced-motion`** (todas las animaciones se desactivan).
- Hover de obras: elevación + zoom que recorta el marco.
- Clic de obra: difuminado + selector de tamaño + comprar.
- Toggle de paspartú por obra (blanco default / negro).
- Giftcard: preview en vivo, selector de diseño y monto, validación, agregar al carrito.
- Carrito deslizable con agregar/quitar y contador dinámico.

## State management (si se recrea en framework con estado)
- `cartOpen: boolean` — visibilidad del drawer.
- `cart: Array<{ title, img, detail, key }>` — ítems (obras y giftcards).
- `activeObra: number|null` — obra con overlay de compra abierto.
- `sizes: { [i]: '30 × 40 cm' | '40 × 50 cm' | '50 × 70 cm' }` — medida elegida por obra.
- `mat: { [i]: 'white' | 'black' }` — paspartú por obra (default 'white').
- `gift: { design:0..5, de, para, mail, mensaje, amount: 35000|50000|100000|'otro'|null, other:string }`.

## Design tokens
**Colores**
- Papeles/claros: `#FDFCF8` (papel principal), `#F3F0E9` (papel alterno).
- Tinta / texto: `#211f18`.
- Acento musgo/oliva: `#54582f` (links, dots, botones), hover `#3c3f21`.
- Fondos oscuros: `#20241a` (hero base), `#171a10` (inspiración).
- Blancos sobre oscuro: `#fdfcf8` / `#f3f0e9` / verde claro `#eef0e2` / `#cdd3ae`.
- Alerta (hint giftcard): `#9a4a2a`.
- Enlaces: color `#54582f`, hover `#3c3f21` (definido para `a` / `a:hover`).

**Tipografías** (ver `Assets`)
- **P22 Mackinac Pro** (serif) — títulos, citas, montos. Pesos 400/500/700 + cursivas. En el prototipo cargada como `'Mackinac'` vía `@font-face` (archivos `.otf` en `assets/fonts/`).
- **CoFo Sans** — cuerpo y campos. Pesos 300/400/500 + cursiva. `@font-face` con `.otf`.
- **CoFo Sans Mono → sustituida por `Spline Sans Mono`** (Google Fonts, vía `_ds/.../tokens/fonts.css`) — TODAS las mayúsculas/eyebrows/nav/botones/labels. Aspecto "científico/mono". *Si la marca tiene la CoFo Sans Mono real, reemplazar.*
- **Caveat** (Google Fonts) — único acento manuscrito en el collage de inspiración.
- Regla de casing: mayúsculas = mono; títulos y cuerpo = Mackinac / CoFo Sans en caja normal.

**Escala tipográfica** (px): H1 hero 80 · H2 sección 46–48 · H3 27 · cita inspiración 29 · cuerpo 15–18 · labels/eyebrows mono 9–12.

**Radios:** pills `60px` (botones/badges), tarjetas giftcard `20px`, obras `4px`, botones de tamaño/monto `8–12px`, dots `50%`.

**Espaciado:** padding de sección ~100–110px vertical, 52px horizontal; contenedores `max-width` 1180–1300px centrados; gutters de grilla 32–64px.

**Sombras:** suaves y en capas, cálidas y de baja opacidad (p. ej. polaroids `0 4px 12px … , 0 24px 54px rgba(8,10,4,.3–.42)`; drawer `-16px 0 50px rgba(30,26,15,.18)`).

**Motion:** ease-out, 250–800ms, sin rebote. `cubic-bezier(.16,1,.3,1)` para zoom/drawer.

## Assets (todos incluidos en `source/assets/`)
- **Logo:** `assets/img/luma-logo.png` (se invierte a blanco con filtro CSS sobre fondos oscuros).
- **Hero:** `assets/img/hero.jpg`. **Inspiración/oficio:** `oficio.jpg`, `sunrays.jpg`, `volcan.jpg`, `insp1.jpg` (arrayán), `insp2.jpg` (lago).
- **Obras** (PNG con fondo transparente, ya enmarcadas): `obra1_white.png`/`obra1_black.png` … `obra5_white.png`/`obra5_black.png` (1 = Dúo Lilium y Volcanes I, 2 = II, 3 = Rostro de Chilcos, 4 = Mujer Hortensia, 5 = Bosque de Arrayanes horizontal). *(Existen también `obra1..5.png` sueltos, versiones antiguas no usadas; ignorar.)*
- **Giftcards fondos:** `gc1.jpg` … `gc6.jpg`.
- **Tipografías:** `assets/fonts/*.otf` (Mackinac ×5, CoFo Sans ×4). Mono y Caveat se cargan por Google Fonts (ver `_ds/.../tokens/fonts.css` y los `<link>` del `<head>` del prototipo).
- Los `.jpg`/`.mp4` de ambiente que no estén referenciados arriba pueden ignorarse.

**Licencias de fuentes:** verificar licencia de P22 Mackinac Pro y CoFo Sans antes de producción; la versión de CoFo entregada es "Trial". Sustituir por licencias válidas o webfonts equivalentes.

## Contacto y enlaces reales
- Email: `contacto@lumaproducciones.cl`
- Instagram: `https://www.instagram.com/lumaartechile`
- Dirección: San Francisco 1070, Puerto Varas
- Pasarela sugerida: Webpay / transferencia (el botón "Ir a pagar" es el punto de integración del checkout).

## Archivos en este bundle
- `source/Luma - Portada.dc.html` — prototipo (fuente de verdad visual y de interacción).
- `source/support.js` — runtime del prototipo (no portar a producción).
- `source/assets/` — imágenes, fondos, obras y fuentes.
- `source/_ds/.../tokens/fonts.css` — carga de webfonts (incluye la sustitución mono).
