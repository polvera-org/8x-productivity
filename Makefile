.PHONY: install build sync-all

install:
	npm install

build:
	npm run build

sync-all: build
	@bash scripts/sync-solohacker-image.sh
