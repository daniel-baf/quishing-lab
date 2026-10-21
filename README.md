# 🕳️ Quishing Lab — Demo educativa para feria universitaria

Demostración controlada de **quishing** (phishing por QR): un voluntario escanea un QR de
"concurso", interactúa con una landing y, en una revelación guiada, descubre qué información
expone una web y qué decisiones tomó. Todo corre **localmente en tu laptop** (solo memoria;
al cerrar el proceso no queda nada) y se expone temporalmente con Cloudflare Tunnel.

> ⚠️ Uso responsable: presenta siempre la revelación educativa al final, anuncia que es una
> demo y borra/reinicia entre sesiones. La credencial que se capture debe ser ficticia
> (el presentador escribe datos de prueba, p. ej. `hacker@demo.com` / `hunter2`).

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
make down       # detiene aplicación y túnel
make tunnel     # inicia app + Quick Tunnel y deja sus logs en pantalla
```

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

## Estructura

```
server.js          backend Express + SSE (estado en memoria)
public/index.html  landing móvil (concurso → cámara → revelación)
public/admin.html  panel del expositor (contadores, tarjetas dinámicas, feed, QR)
```

## Checklist día de la feria

- [ ] `make up && make health` responde `ok`
- [ ] Túnel activo y HTTPS válido (la cámara exige contexto seguro)
- [ ] Probado en Android Chrome **y** iOS Safari
- [ ] Token del panel a la mano (léelo de `.env`, no lo compartas)
- [ ] Datos ficticios listos para escribir
- [ ] Después de la feria: Ctrl+C y `rm -rf` del proyecto → cero residuos
