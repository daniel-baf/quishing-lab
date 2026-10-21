.PHONY: up down logs logs-victim health tunnel tunnel-logs

up:
	LAN_IP=$${LAN_IP:-$$(ip route get 1.1.1.1 2>/dev/null | awk '{print $$7; exit}')} docker compose up -d --build

down:
	docker compose --profile tunnel down

logs:
	docker compose logs -f app

logs-victim:
	docker compose logs -f juice-shop webgoat

health:
	@echo -n "app:        "; curl --fail --silent --show-error http://localhost:$${PORT:-3000}/health; echo
	@echo -n "juice-shop: "; curl --fail --silent --output /dev/null --write-out "%{http_code}\n" http://localhost:4000/
	@echo -n "webgoat:    "; curl --fail --silent --output /dev/null --write-out "%{http_code}\n" http://127.0.0.1:8080/WebGoat

tunnel:
	docker compose --profile tunnel up -d --build
	docker compose --profile tunnel logs -f tunnel

tunnel-logs:
	docker compose --profile tunnel logs -f tunnel
