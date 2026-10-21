# 🕳️ Quishing Lab — Demo educativa para feria universitaria

Demostración controlada de **quishing** (phishing por QR): un voluntario escanea un QR de
"concurso", interactúa con una landing y, en una revelación guiada, descubre qué información
expone una web y qué decisiones tomó. Todo corre **localmente en tu laptop** (solo memoria;
al cerrar el proceso no queda nada) y se expone temporalmente con Cloudflare Tunnel.

> ⚠️ Uso responsable: presenta siempre la revelación educativa al final, anuncia que es una
> demo y borra/reinicia entre sesiones. La credencial que se capture debe ser ficticia
> (el presentador escribe datos de prueba, p. ej. `hacker@demo.com` / `hunter2`).
> Lee [SECURITY.md](SECURITY.md) antes de usarla fuera de tu máquina.

> 🤝 ¿Quieres colaborar? La guía de desarrollo y UX/UI está en [CONTRIBUTING.md](CONTRIBUTING.md).

## Arranque con Docker (recomendado)

```bash
cp .env.example .env
# Edita .env: define un ADMIN_TOKEN largo, único y estable.
make up
make health
```

Abre el panel en `http://localhost:3000/admin` e introduce el valor de `ADMIN_TOKEN` de
`.env`. Ese token no cambia al reiniciar los contenedores, por lo que no aparecerán 401
causados por un token aleatorio nuevo. Si el navegador conserva un token inválido, el panel
lo elimina automáticamente y vuelve a pedirlo.

Comandos habituales:

```bash
make logs       # logs de la aplicación
make logs-victim  # logs de Juice Shop y WebGoat
make down       # detiene aplicación y túnel
make tunnel     # inicia app + Quick Tunnel y deja sus logs en pantalla
```

## Apps de práctica (intencionadamente vulnerables)

`make up` también levanta dos aplicaciones de entrenamiento oficialmente
vulnerables, pensadas para la parte de la demo que va más allá del QR:
XSS, robo de sesión y CSRF.

- **OWASP Juice Shop** — tienda online vulnerable en `http://localhost:4000`
  (en la LAN: `http://IP-del-portátil:4000`). Incluye el reto QR "Forged
  Coupon", DOM-XSS en el buscador y la sesión (JWT) guardada en
  `sessionStorage`, legible desde un XSS. Reset = recrear el contenedor:
  `docker compose up -d --force-recreate juice-shop`.
- **OWASP WebGoat** — curso guiado en `http://localhost:8080/WebGoat`, con su
  companion WebWolf (un "request bin" para recibir exfiltraciones) en
  `http://localhost:9090/WebWolf`. Solo escucha en localhost.

> ⚠️ **Nunca** expongas Juice Shop ni WebGoat por el túnel de Cloudflare: son
> vulnerables a propósito y cualquiera con la URL puede entrar. Deben quedarse
> en la LAN/VM. Si no los usas en una sesión:
> `docker compose stop juice-shop webgoat`.

### Demo extendida: robo de sesión desde un QR

El panel incluye un **arsenal QR** (debajo del feed) que demuestra que un QR
también puede robar una sesión sin pedir credenciales:

1. **QR 1 (cebo)** apunta a Juice Shop (`http://IP-LAN:4000/`). La víctima se
   registra e inicia sesión. Todo legítimo.
2. **QR 2 (robo)** abre el buscador de Juice Shop con un payload XSS que envía
   el JWT de sesión a `GET /api/loot` de este servidor. El panel cuenta las
   ejecuciones y las sesiones robadas, y lista cada JWT con el email de la
   víctima decodificado (click en el token = copiarlo).
3. **Remate:** en una pestaña nueva de Juice Shop,
   `sessionStorage.setItem('token','…')` con el JWT copiado → estás dentro de
   la cuenta de la víctima, sin saber su contraseña.

El **QR 3 (libre)** es para URLs propias, p. ej. la inyección SQL de
`/rest/products/search` de Juice Shop, que también cabe en un QR.

Reglas de oro: usar siempre la **IP LAN, nunca `localhost`** (`sessionStorage`
es por origen: si se mezclan, el token "no existe" y llega `loot=none`); Juice
Shop nunca por el túnel; y `Reiniciar` limpia también el botín. La IP LAN se
autodetecta al hacer `make up`; se fuerza con `LAN_IP=192.168.x.x make up`.

## Exponerlo con Cloudflare Tunnel

```bash
make tunnel
```

Busca en los logs de `make tunnel` la URL `https://….trycloudflare.com` que imprime
Cloudflare. Cópiala al campo **QR del concurso** del panel y pulsa **Generar QR**
(proyecta el QR para que lo escaneen). La URL cambia cada vez que se recrea el Quick Tunnel.

El contenedor `tunnel` usa el perfil de Compose `tunnel` y apunta internamente a `app:3000`;
no necesitas instalar `cloudflared` en la laptop. Para volver a mirar la URL:

```bash
make tunnel-logs
```

Los **Quick Tunnels** (`trycloudflare.com`) no ofrecen una entrega fiable de Server-Sent
Events. Por eso los teléfonos mantienen SSE cuando esté disponible, pero además consultan
por HTTP cada ~2 segundos las órdenes de **REVELAR** y **Reiniciar**. No necesitas cuatro
participantes: la demo funciona igual con una sola persona o con tantas como se conecten.

## Modo automático de permisos

La landing ya no muestra botones para "activar cámara/pantalla": al enviar el formulario (o al entrar si `ENABLE_FAKE_LOGIN=false`) intenta solicitar ambos permisos automáticamente. Esto **no elimina** los diálogos nativos del navegador ni los convierte en consentimiento invisible: si el navegador exige un gesto de usuario o la persona niega, el evento queda reflejado como rechazado en el panel.

## Arranque local alternativo

```bash
npm install
npm start
```

También usa el `.env` con el mismo `ADMIN_TOKEN` estable.

## Guion sugerido (5–7 min)

1. **Cebo (30 s):** QR en pantalla "Gana un Kit Hacker". Tú (o un voluntario consciente del gag) escaneas.
2. **Interacción (1–2 min):** en el teléfono, llenas el formulario (datos ficticios) y activas la cámara
   (el navegador mostrará su diálogo de permiso — es parte del mensaje).
3. **Panel (1 min):** proyectas el tablero: ves llegar `✍️ tecleando`, `🔑 ENVIÓ CREDENCIALES`,
   `✅ PERMISO CONCEDIDO`. Cada dato aparece en vivo.
4. **Revelación (1 min):** pulsas 🚨 REVELAR. Los teléfonos muestran "Este QR era una trampa" con su
   lista personal de datos filtrados.
5. **Defensas (2 min):** verificar dominios, gestor de contraseñas, permisos mínimos, desconfiar de
   premios/urgencias. Remata: "esto es lo que hacemos en ciberseguridad".

## Límites intencionales (diseño)

- **Sin captura oculta:** la cámara es solo vista previa local; ningún frame sale del dispositivo.
- **Sin datos persistentes:** todo en memoria; `Reiniciar` lo borra todo y recarga los teléfonos.
- Los permisos de cámara/geolocalización **los controla el navegador** — no hay forma (ni intención)
  de saltarlos; el momento del diálogo de permiso es didáctico.

- **Cookies:** la landing lee solo `document.cookie` del dominio de la demo, enmascara los valores y los muestra en la revelación. Las cookies `HttpOnly` **no** son visibles para JavaScript; esa limitación también se muestra porque es parte del aprendizaje.

## Estructura

```
server.js          backend Express + SSE (estado en memoria)
public/index.html  landing móvil (concurso → cámara → revelación)
public/admin.html  panel del expositor (contadores, tarjetas dinámicas, feed, QR)
```

## Checklist día de la feria

- [ ] `make up && make health` responde `ok` (app, juice-shop y webgoat)
- [ ] (Si los usarás) Juice Shop en `:4000` / WebGoat en `:8080` — y **nunca** en el túnel
- [ ] Túnel activo y HTTPS válido (la cámara exige contexto seguro)
- [ ] Probado en Android Chrome **y** iOS Safari
- [ ] Token del panel a la mano (léelo de `.env`, no lo compartas)
- [ ] Datos ficticios listos para escribir
- [ ] Después de la feria: Ctrl+C y `rm -rf` del proyecto → cero residuos

## Contribuir

Las mejoras son bienvenidas —UX/UI de la landing o el panel, nuevos retos del
arsenal QR, docencia. Mira [CONTRIBUTING.md](CONTRIBUTING.md) para el flujo de
trabajo y la guía de estilo.

## Seguridad

Si encuentras un fallo de seguridad en el propio lab (persistencia accidental,
fuga de secretos, aislamiento roto), repórtalo de forma privada siguiendo
[SECURITY.md](SECURITY.md). No abras issues públicos con detalles de
vulnerabilidades.
