.PHONY: build-cli-configs docker-build docker-run docker-run-interactive docker-stop

WS_PORT ?= 8080

build-cli-configs:
	@bash scripts/build-cli-configs.sh

docker-build:
	docker build -t 8x-productivity .

docker-run:
	docker run -d --rm \
		--name 8x-productivity \
		-e ANTHROPIC_API_KEY=$(ANTHROPIC_API_KEY) \
		-e OPENAI_API_KEY=$(OPENAI_API_KEY) \
		-e WS_API_KEY=$(WS_API_KEY) \
		-p $(WS_PORT):8080 \
		-v $$(pwd):/root/workspace \
		8x-productivity

docker-run-interactive:
	docker run -it --rm \
		-e ANTHROPIC_API_KEY=$(ANTHROPIC_API_KEY) \
		-e OPENAI_API_KEY=$(OPENAI_API_KEY) \
		-v $$(pwd):/root/workspace \
		8x-productivity bash

docker-stop:
	docker stop 8x-productivity
