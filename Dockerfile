FROM node:20-alpine AS build

WORKDIR /app

# Copy package files first for better cache use
COPY package.json package-lock.json* ./

# Install dependencies (use ci when lockfile present)
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source and build
COPY . .
RUN npm run build

# Install vsce globally for packaging
RUN npm install -g @vscode/vsce

# Package the extension into the output directory
CMD ["sh", "-c", "vsce package -o out/extension.vsix"]
