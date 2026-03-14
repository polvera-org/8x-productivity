.PHONY: build-cli-configs docker-build docker-run

build-cli-configs:
	@bash scripts/build-cli-configs.sh

docker-build:
	docker build -t 8x-productivity .

docker-run:
	docker run -it --rm \
		-e ANTHROPIC_API_KEY=$(ANTHROPIC_API_KEY) \
		-e OPENAI_API_KEY=$(OPENAI_API_KEY) \
		-v $$(pwd):/root/workspace \
		8x-productivity
