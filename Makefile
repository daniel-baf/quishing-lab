.PHONY: up down logs health tunnel tunnel-logs practice-up practice-down logs-practice health-practice

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

tunnel:
	LAN_IP=$${LAN_IP:-$$(ip route get 1.1.1.1 2>/dev/null | awk '{print $$7; exit}')} docker compose --profile tunnel up -d --build
	docker compose --profile tunnel logs -f tunnel

tunnel-logs:
	docker compose --profile tunnel logs -f tunnel
