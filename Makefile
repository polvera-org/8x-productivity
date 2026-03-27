.PHONY: build build-a0-agents build-openclaw-agents sync-solohacker-image sync-all

build:
	@python3 scripts/build.py

build-a0-agents:
	@python3 scripts/build.py

build-openclaw-agents:
	@python3 scripts/build.py

sync-solohacker-image:
	@bash scripts/sync-solohacker-image.sh

sync-all: build sync-solohacker-image
