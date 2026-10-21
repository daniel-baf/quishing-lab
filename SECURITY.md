# Política de seguridad

## Propósito del proyecto

Quishing Lab es una **demo educativa** para ferias y aulas: muestra cómo funciona
un QR malicioso (quishing) y cómo un XSS roba la sesión de una web, todo en un
entorno controlado, con revelación final y datos ficticios. Parte de su código
*simula* phishing a propósito: esa es la lección, no la función.

## Reglas de uso

- Uso **exclusivo** en entornos controlados (clase, feria universitaria, CTF) y
  con consentimiento de quienes participan.
- **Nunca** usar contra terceros sin su consentimiento explícito. El phishing no
  consentido es ilegal en la mayoría de jurisdicciones, aunque "solo sea una
  demo".
- Las credenciales capturadas en las demos deben ser ficticias.
- Las apps de práctica (OWASP Juice Shop, WebGoat) son vulnerables **a
  propósito**: jamás exponerlas por el túnel de Cloudflare ni en una IP pública.
  Solo LAN/localhost, y paradas (`docker compose stop juice-shop webgoat`) si no
  se usan.

## Diseño defensivo del propio lab (decisiones intencionales)

- **Estado solo en memoria:** al cerrar el proceso no queda nada; `Reiniciar`
  borra todo. No añadir persistencia.
- **Sin captura oculta:** la cámara es solo vista previa local; ningún frame sale
  del dispositivo de la víctima.
- **Endpoint-trampa sin auth (`/api/loot`)**: es intencional (la víctima no tiene
  sesión con esta app) y sigue siendo efímero, con rate limit y tope de
  elementos. No "arreglarlo" añadiendo login; documentado en `server.js`.
- Los valores de cookies se almacenan **ya enmascarados** por el cliente.
- `ADMIN_TOKEN` obligatorio para el panel; `.env` fuera del control de versiones.

## Reportar una vulnerabilidad

Si encuentras un problema de seguridad en el propio lab —por ejemplo, que algo
persista tras reiniciar, que un secreto pueda filtrarse, o que el aislamiento
descrito arriba no se cumpla— **no abras un issue público con los detalles**:

1. Abre un **Security Advisory privado** en GitHub:
   *Repositorio → Security → Advisories → New draft advisory*.
2. Describe el impacto y pasos mínimos para reproducirlo.
3. Si es urgente y tienes otro canal con los mantenedores, avisa por ahí
   referenciando el borrador.

Respondemos lo antes posible y publicaremos el fix con crédito, salvo que pidas
lo contrario.
