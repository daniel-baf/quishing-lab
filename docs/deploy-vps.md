# Despliegue en VPS (para la práctica)

Guía para montar el panel en una VPS con Docker Compose. El loot se guarda en
Postgres (contenedor con volumen), así que sobrevive reinicios del servidor o
del contenedor. Al terminar la práctica, un solo comando borra todo.

> ¿Usas GCP? Hay una opción con Terraform (`infra/`) que crea la VM + IP
> estática y deja todo preparado con la VM apagada: ver `infra/README.md`
> (atajos: `make infra-apply` / `make infra-up` / `make infra-destroy`).

## 1. VPS

Cualquier VPS barato sirve: 1 vCPU / 1 GB RAM / Ubuntu 22.04 o 24.04.
Crea el servidor y entra por SSH.

## 2. Docker

```bash
curl -fsSL https://get.docker.com | sh
docker compose version   # verifica
```

## 3. Firewall

Expón lo mínimo. El panel **no** necesita puerto abierto si usas el túnel
cloudflared (paso 6):

```bash
ufw allow OpenSSH
ufw enable
```

Si prefieres Caddy con tu propio dominio (paso 6 alternativo), añade también
`ufw allow 80,443/tcp`.

## 4. Configurar y arrancar

```bash
git clone <tu-fork-o-repo> quishing-lab && cd quishing-lab
cp .env.example .env
openssl rand -hex 32   # pega el resultado como ADMIN_TOKEN en .env
```

En `.env` deja `DATABASE_URL` **comentado**: el `docker-compose.yml` ya
inyecta por defecto `postgres://quishing:quishing@db:5432/quishing` hacia el
servicio `db`.

```bash
docker compose up -d --build
```

Verifica:

```bash
curl http://localhost:3000/health
# panel: http://<IP-VPS>:3000/admin?token=<ADMIN_TOKEN>
```

> Nota: el usuario/password de Postgres (`quishing`/`quishing`) solo viven en
> la red interna de Docker; el puerto 5432 no se publica al host.

## 5. Persistencia

El loot está en el volumen `pgdata`. Reinicios no pierden nada:

```bash
docker compose restart app     # el loot sigue ahí
docker compose logs -f app
```

## 6. Exponerlo (elige uno)

**Opción A — túnel cloudflared (sin abrir puertos, sin dominio propio):**

```bash
docker compose --profile tunnel up -d
docker compose --profile tunnel logs -f tunnel   # copia la URL https://...
```

**Opción B — Caddy con dominio propio (TLS automático):** añade un servicio
`caddy` al compose con tu dominio, abre 80/443 en `ufw`, y quita el mapeo
público del puerto 3000 si quieres que solo Caddy lo toque.

## 7. Limpiar todo al terminar

```bash
docker compose --profile tunnel down -v
```

`-v` borra también el volumen con la base de datos: cero rastros del loot.
