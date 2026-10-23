.PHONY: up down logs health tunnel tunnel-logs tunnel-url practice-up practice-down logs-practice health-practice

PRACTICE_COMPOSE = docker compose -f docker-compose.practice.yml

# Full demo: the QR arsenal panel + the intentionally vulnerable practice
# stack it attacks (Juice Shop bait + WebGoat). `make up` is all you need.
up:
	LAN_IP=$${LAN_IP:-$$(ip route get 1.1.1.1 2>/dev/null | awk '{print $$7; exit}')} docker compose up -d --build
	$(PRACTICE_COMPOSE) up -d

down:
	docker compose --profile tunnel down
	$(PRACTICE_COMPOSE) down

logs:
	docker compose logs -f app

health:
	@echo -n "app: "; curl --fail --silent --show-error http://localhost:$${PORT:-3000}/health; echo

# Intentionally vulnerable practice stack (Juice Shop + WebGoat), in its own
# Compose file so it can be controlled separately. LAN/localhost only — never
# tunnel these.
practice-up:
	$(PRACTICE_COMPOSE) up -d

practice-down:
	$(PRACTICE_COMPOSE) down

logs-practice:
	$(PRACTICE_COMPOSE) logs -f

health-practice:
	@echo -n "juice-shop: "; curl --fail --silent --output /dev/null --write-out "%{http_code}\n" http://localhost:4000/
	@echo -n "webgoat:    "; curl --fail --silent --output /dev/null --write-out "%{http_code}\n" http://127.0.0.1:8080/WebGoat

# Quick Tunnels for the panel AND the store (victims outside the LAN). The
# store tunnel needs the practice stack up, so it is started here too.
tunnel: practice-up
	LAN_IP=$${LAN_IP:-$$(ip route get 1.1.1.1 2>/dev/null | awk '{print $$7; exit}')} docker compose --profile tunnel up -d --build
	docker compose --profile tunnel logs -f tunnel tunnel-store

tunnel-logs:
	docker compose --profile tunnel logs -f tunnel tunnel-store

# Print just the public https://….trycloudflare.com URLs the Quick Tunnels got.
tunnel-url:
	@echo -n "panel:  "; docker compose --profile tunnel logs tunnel 2>&1 | grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' | tail -1
	@echo -n "tienda: "; docker compose --profile tunnel logs tunnel-store 2>&1 | grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' | tail -1
