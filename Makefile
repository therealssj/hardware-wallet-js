.DEFAULT_GOAL := help
.PHONY: run lint format build-hid build-protob build test

all: build

build: build-deps build-protob build-hid ## Build project

build-deps: ## Install build dependencies
	npm install

build-protob: build-deps ## Build message code from proto buffer specs
	npm make-protobuf-files

build-hid: build-deps ## Build hardware device detection
	npm make-device-detection

run: build
	npm start

lint: build-deps ## Check source code style
	npm lint

format: build-deps ## Format source code
	npm format

test: build-deps ## Run project test suite
	./node_modules/.bin/serial-mocha ./test/* --bail --exit

check: lint test # Perform self-tests

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
