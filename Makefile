.PHONY: up down logs health tunnel tunnel-logs

up:
	docker compose up -d --build app

down:
	docker compose --profile tunnel down

logs:
	docker compose logs -f app

health:
	curl --fail --silent --show-error http://localhost:$${PORT:-3000}/health

tunnel:
	docker compose --profile tunnel up -d --build
	docker compose --profile tunnel logs -f tunnel

tunnel-logs:
	docker compose --profile tunnel logs -f tunnel
