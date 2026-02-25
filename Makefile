.PHONY: build build-local package

# Build via Docker (extension + webview inside image)
build:
	docker build -t vscode-extension-build .

# Build locally without Docker (out/extension.js + dist/index.js)
build-local:
	npm run build && npm run build:webview

# Build image then package VSIX into output/
package: build
	mkdir -p output
	docker run --rm -v "$(PWD)/output:/app/out" vscode-extension-build