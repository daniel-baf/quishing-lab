# Contribuir a Quishing Lab

¡Gracias por tu interés! Este es un proyecto **puramente educativo** para enseñar cómo
funciona un ataque de quishing (phishing por QR) y cómo se roban sesiones en el
navegador, en un entorno controlado. Toda contribución debe mantener ese espíritu:
didáctico, transparente y seguro.

## Reglas de oro (no negociables)

1. **Nunca subas secretos.** `.env` está en `.gitignore`; debe seguir así. Usa solo
   `.env.example` como referencia.
2. **Datos ficticios siempre.** En demos y pruebas usa credenciales de juguete
   (p. ej. `hacker@demo.com` / `hunter2`).
3. **Sin ataques reales.** Este código no se usa contra personas sin su
   consentimiento explícito. Ver `SECURITY.md`.
4. **Juice Shop y WebGoat nunca se exponen a Internet.** Solo LAN/localhost.

## Preparar el entorno

```bash
git clone git@github.com:daniel-baf/quishing-lab.git
cd quishing-lab
cp .env.example .env   # define un ADMIN_TOKEN largo y aleatorio
make up && make health # Docker (recomendado)
```

Alternativa sin Docker:

```bash
npm install
npm run dev
```

Panel del expositor: `http://localhost:3000/admin` (pide el `ADMIN_TOKEN` de `.env`).

## Flujo de trabajo

1. Crea una rama desde `main`:
   - `feature/ux-panel-feed` — mejoras de UX/UI
   - `fix/…` — correcciones
   - `docs/…` — documentación
2. Commits pequeños con mensaje claro. El repo usa prefijos tipo
   [Conventional Commits](https://www.conventionalcommits.org/es/): `feat:`,
   `fix:`, `chore:`, `docs:`.
3. Abre un PR descriptivo: qué cambia, por qué, y cómo probarlo.

## Mapa del código

| Archivo | Qué contiene |
|---|---|
| `server.js` | Backend Express + SSE; todo el estado vive en memoria (efímero por diseño) |
| `public/index.html` | Landing móvil (cebo → formulario → revelación educativa) |
| `public/admin.html` | Panel del expositor (contadores, feed en vivo, arsenal QR) |
| `public/styles.css` | Estilos compartidos |
| `Makefile` / `docker-compose.yml` / `Dockerfile` | Infra: app + túnel + Juice Shop + WebGoat |

## Guía para mejoras de UX/UI

- La **landing** es *mobile-first* (se escanea con el teléfono): dedos grandes,
  texto legible, pasos cortos.
- El **panel** se proyecta en pantalla grande: contraste alto, tipografía grande,
  estado visible a distancia.
- Tono: revelar, no asustar. La pantalla final debe dejar claro qué se expuso y
  cómo defenderse.
- Sin frameworks ni build step: HTML/CSS/JS vanilla, para que cualquiera lo lea
  en clase y entienda cada línea.

## Checklist antes de pedir review

- [ ] `make up && make health` responde `ok`
- [ ] Probado en móvil real (Android Chrome **y** iOS Safari si toca la landing)
- [ ] Sin secretos en el diff (`git diff` limpio de tokens)
- [ ] README actualizado si el cambio modifica comportamiento o comandos
- [ ] Solo datos ficticios en las pruebas
