# Manual — Formula 1 API PWA

**Proyecto:** `~/Projects/formula1api/`
**Stack:** Vanilla JS (ES modules), CSS3, OpenF1 API, Anime.js, PWA (SW + Manifest)
**Autor:** Juan Ignacio Peralta Bello — DWM3AP AWP 2026

---

## Índice

1. [index.html — Estructura](#1-indexhtml--estructura)
2. [js/main.js — Lógica principal](#2-jsmainjs--lógica-principal)
3. [js/favs.js — Favoritos](#3-jsfavsjs--favoritos)
4. [js/sw-register.js — Service Worker + PWA](#4-jssw-registerjs--service-worker--pwa)
5. [sw.js — Service Worker (cache)](#5-swjs--service-worker)
6. [Data Flow General](#6-data-flow-general)

---

## 1. `index.html` — Estructura

### Import Map
```json
{
    "imports": {
        "animejs": "https://unpkg.com/animejs@4.5.0/dist/modules/index.js"
    }
}
```
Resuelve `import { animate, svg } from 'animejs'` en `main.js` vía CDN de unpkg.

### Elementos DOM clave

| ID / Selector | Tipo | Propósito |
|---|---|---|
| `#add-alert` | `div` | Banner online/offline |
| `#yearSelector` | `select` | Selector de año (2023–2026) |
| `#toFavs` | `button` | Navegar a favoritos |
| `#share` | `button.d-none` | Compartir / A2HS |
| `#circuit-gallery` | `div` | Galería de circuitos |
| `#circuit-hero` | `div.d-none` | Hero SVG del circuito seleccionado |
| `#race-layout` | `div` | Layout: hero + cards de pilotos |
| `.container` | `div` | Cards de pilotos |
| `#noConection` | `div.d-none` | Pantalla de error de conexión |
| `#btnRetry` | `button` | Reintentar tras error |
| `.loader` | `div` | Spinner de carga |

### Scripts (orden de carga)
1. `js/sw-register.js` (defer) — SW, notificaciones, A2HS, Web Share
2. `js/main.js` (type="module") — App principal, importa animejs

---

## 2. `js/main.js` — Lógica principal

### Import
```js
import { animate, svg } from 'animejs';
```

### Clase `driver`

| Propiedad | Tipo | Detalle |
|---|---|---|
| `name` | `string` | Apellido del piloto |
| `#number` | `number` (private) | Número de piloto |
| `scuderia` | `string` | Equipo (normalizado) |
| `points` | `number` | Puntos |
| `color` | `string` | Color del equipo (hex) |
| `picture` | `string` | URL de foto |

**Métodos:** `set setNum(num)` / `get getNum()` — accessor para `#number`.

### Constantes globales

| Nombre | Valor |
|---|---|
| `overallAPI` | `'https://api.openf1.org/v1/championship_drivers?'` |
| `LS_DRIVERS_KEY` | `'driversData'` |
| `LS_SESSIONS_KEY` | `'sessionsCache_v2'` |

### Funciones

#### `saveToLocalStorage()`
Serializa `drivers[]` y `scuderias[]` en `localStorage[LS_DRIVERS_KEY]`.

#### `loadFromLocalStorage()`
Reconstruye objetos `driver` desde localStorage. Retorna `true` si había datos, `false` si no.

#### `feedbackManager(target, turnOn)`
Muestra/oculta un elemento toggleando la clase `.d-none`.

| Parámetro | Tipo | Descripción |
|---|---|---|
| `target` | `Element` | Elemento DOM |
| `turnOn` | `boolean` | `true` = mostrar, `false` = ocultar |

#### `async fetchData(urlApi)`
Fetch con manejo de rate-limit 429 (reintenta tras 10s).

#### `async fetchSessions(year)`
Busca en localStorage (`sessionsCache_v2_{year}`). Si no hay cache, fetchea `GET /v1/sessions?year={year}`, filtra `Race`, ordena por fecha, guarda en localStorage y retorna.

**Retorna:** `Array<{ meeting_key, country_name, circuit_short_name, location, session_key, date_start, is_cancelled }>`

#### `async loadCircuits()`
Fetchea `assets/circuits.json` → `circuitsData` (global). Paths SVG keyeados por `circuit_short_name`.

#### `renderCircuitGallery(sessions)`
Renderiza cards de GP en `#circuit-gallery`. Por cada sesión:
- Crea `div.gp-card` con SVG (base-path, draw-path, car circle)
- Si es futura/cancelada → clase `.disabled`
- Si es activa → mouseenter inicia animaciones animejs (3s loop, linear), mouseleave pausa, click selecciona y abre hero

#### `clearCircuitHero()`
Limpia hero: desconecta observer, cancela animaciones, resetea DOM y variables.

#### `showCircuitHero(circuitName)`
Crea hero SVG con animaciones animejs (draw + motion path, 5500ms). Agrega `IntersectionObserver` para efecto `hero-dimmed`.

#### `async getSessionKey(meetingKey)`
Busca session_key en localStorage o la fetchea de `GET /v1/sessions?meeting_key={key}&session_type=Race`.

#### `async getChampionshipInfo()`
Obtiene session_key, fetchea `GET /v1/drivers?session_key={key}`, crea objetos `driver`, llama a `instanciarDrivers()` y `instanciarScuderias()`.

**Normalización de escuderías:** `"Red Bull Racing"` → `"redbull"`, `"Racing Bulls"` → `"visa"`, `"Aston Martin"` → `"astonmartin"`, `"Haas F1 Team"` → `"haas"`, `"Alfa Romeo"` → `"alfaromeo"`, default → lowercase.

#### `instanciarDrivers(scuderia)`
Renderiza cards de pilotos en `.container`. Cada card tiene:
- `h2` con nombre
- `figure > img` con foto
- `button.fav` — toggle favorito
- `button.info` — al click fetchea puntos/posición vía `getInfo()` y los muestra

#### `instanciarScuderias()`
Renderiza lista de escuderías en `.teams` como `li.team` con click → `filterDrivers()`.

#### `filterDrivers(scuderia)`
Muestra/oculta cards por escudería usando clase `.hide`.

#### `async getInfo(num, mod)`
Fetchea `GET /v1/championship_drivers?session_key={key}&driver_number={num}`. Retorna `data[0][mod]` (points_current o position_current).

#### `gestionarFavoritos(nombre)`
Toggle del nombre en `localStorage['driversFavoritos']`. Invalida `favsData`. Actualiza icono estrella en DOM.

#### `defineStyle(name)`
Retorna HTML `<i>` con `fa-solid` (favorito) o `fa-regular` (no favorito).

#### `updateOnlineStatus()`
Actualiza `#add-alert` según `navigator.onLine`.

#### `inArray(array, name)`
`array.includes(name)`

### IIFE — Inicialización
```js
(async () => {
    await loadCircuits();
    const sessions = await fetchSessions(year.value);
    renderCircuitGallery(sessions);
    feedbackManager(loader, false);
    if (loadFromLocalStorage()) {
        instanciarDrivers();
        instanciarScuderias();
    }
})();
```

### Event Listeners

| Elemento | Evento | Acción |
|---|---|---|
| `.gp-back-btn` | `click` | Colapsa hero, muestra galería |
| `#yearSelector` | `change` | Recarga sesiones + galería + limpia DOM |
| `#toFavs` | `click` | `location.href = 'pages/favourites.html'` |
| `#btnRetry` | `click` | `location.reload()` |
| `window` | `online` / `offline` | `updateOnlineStatus()` |

---

## 3. `js/favs.js` — Favoritos

### Clase `driver` (versión extendida)

| Propiedad | Tipo | Detalle |
|---|---|---|
| `name` | `string` | Apellido |
| `#number` | `number` (private) | Número |
| `scuderias` | `Array` | Equipos en los que corrió |
| `country` | `string` | Código de país (3 letras) |
| `races` | `Array` | Meeting keys de carreras |
| `picture` | `string` | URL de foto |

### Constantes

| Nombre | Valor |
|---|---|
| `overallAPI` | `'https://api.openf1.org/v1/championship_drivers?'` |
| `driversApi` | `'https://api.openf1.org/v1/drivers?'` |
| `flagApi` | `"https://flagcdn.com/16x12/"` |
| `LS_FAVS_KEY` | `'favsData'` |

### `flagCode` — Mapeo país → flagcdn

```
ARG→ar, ESP→es, NED→nl, FRA→fr, USA→us, GBR→gb_eng, MEX→mx,
MON→mc, DEN→dk, JPN→jp, CHN→cn, GER→de, AUS→au, THA→th,
CAN→ca, FIN→fi, ITA→it, NZL→nz, BRA→br
```

### Funciones

#### `saveFavsToLocalStorage(groupedDrivers)`
Guarda snapshot de `favourites[]` + datos de cada driver en `localStorage[LS_FAVS_KEY]`.

#### `loadFavsFromLocalStorage()`
Carga cache. Compara snapshot guardado vs lista actual. Si hay cambios marca `changed: true`. Retorna `{ drivers, changed }` o `null`.

#### `renderFavs(groupedDrivers)`
Renderiza cards en `#favSection`. Cada card tiene: nombre, foto, bandera (flagcdn), país, equipos, cantidad de carreras, botón favorito.

#### `async callFavourites()`
Fetchea `GET /v1/drivers?last_name={name1}&last_name={name2}...` para cada favorito. Agrupa drivers por nombre (mergea equipos y carreras). Llama a `renderFavs()` y `saveFavsToLocalStorage()`.

#### `feedbackManager(target, turnOn)` / `gestionarFavoritos(nombre)` / `defineStyle(name)` / `inArray(array, name)`
Idénticas a las de `main.js`.

#### `Redirect()`
`window.location.href = '../index.html'`

### IIFE — Inicialización (con cache inteligente)
```js
(function init() {
    const cache = loadFavsFromLocalStorage();
    if (cache) {
        renderFavs(cache.drivers);
        if (cache.changed) callFavourites(); // background refresh
    } else {
        callFavourites();
    }
})();
```

### Event Listeners

| Elemento | Evento | Acción |
|---|---|---|
| `#toHome` | `click` | `Redirect()` → `../index.html` |
| `#btnRedirect` | `click` | `Redirect()` |

---

## 4. `js/sw-register.js` — Service Worker + PWA

### Service Worker Registration
```js
navigator.serviceWorker.register('sw.js')
```
Se registra en el evento `load` de `window`.

### Notification API
```js
Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
        new Notification("¡Bienvenido a la parrilla!", {
            body: "Explorá pilotos, circuitos y resultados de F1",
            icon: 'favicon.ico',
        });
    }
});
```

### IIFE 1 — Add to Home Screen (beforeinstallprompt)

| Variable/Función | Descripción |
|---|---|
| `notice` | Almacena el evento `beforeinstallprompt` |
| `showAddToHomeScreen()` | Muestra `#share` si no está en standalone |
| `addToHomeScreen()` | Ejecuta `notice.prompt()` para instalar la PWA |

**Listener:** `window` → `beforeinstallprompt` → previene default, guarda evento, muestra botón.

### IIFE 2 — Web Share API

**Listener:** `#share` → `click` → `navigator.share({ title, text, url })`.

---

## 5. `sw.js` — Service Worker

### Constantes

| Nombre | Valor | Propósito |
|---|---|---|
| `cacheName` | `'cache-v3'` | Cache del app shell |
| `cacheDynamic` | `'cache2-v3'` | Cache dinámico (API + assets) |

### `appShell` (precacheados en install)
```
index.html, pages/favourites.html, style.css, favicon.ico,
manifest.json, js/main.js, js/favs.js, js/sw-register.js,
assets/Formula1-Bold_web.ttf
```

### Estrategias de cache (`fetch` event)

| Tipo de request | Estrategia | Comportamiento |
|---|---|---|
| `mode === 'navigate'` | **Cache First** | Cache → fallback a network |
| `api.openf1.org` | **Network First** | Red → guarda en cache → fallback a cache → 503 |
| Otros assets | **Cache First** | Cache → fallback a network → guarda en cache |

### Lifecycle

| Evento | Acción |
|---|---|
| `install` | `skipWaiting()`, precachea `appShell` |
| `activate` | Limpia caches viejos, `clients.claim()` |
| `fetch` | Estrategias según tipo de request (ver arriba) |

---

## 6. Data Flow General

```
                     index.html
                    /           \
           sw-register.js     main.js (import animejs)
           (SW + notif)       + assets/circuits.json
                |             + api.openf1.org
                v                     |
              sw.js                  v
         (cache strategies)    localStorage
                                ├── driversData
                                ├── sessionsCache_v2_{year}
                                ├── driversFavoritos[]
                                └── favsData (favs page)
                                       |
                                       v
                              pages/favourites.html
                              + js/favs.js
```

### Favoritos (bidireccional)
1. `main.js` escribe `driversFavoritos[]` en localStorage (toggle estrella)
2. `favs.js` lee `driversFavoritos[]` y fetchea detalles desde API
3. `favs.js` cachea detalles en `favsData` con snapshot para detectar cambios
4. Al cambiar la lista → invalida `favsData` y refetchea

### Cache Invalidation
- `gestionarFavoritos()` en ambos JS remueve `favsData`
- `loadFavsFromLocalStorage()` compara snapshot vs lista actual
- SW limpia caches viejos en `activate`
