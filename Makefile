.PHONY: build package

build:
	docker build -t vscode-extension-build .

package: build
	mkdir -p output
	docker run --rm -v "$(PWD)/output:/app/out" vscode-extension-build