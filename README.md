# 🚍 Entebus web executive

[![Svelte](https://img.shields.io/badge/Svelte-‡-FF3E00?logo=svelte&logoColor=white)](https://svelte.dev/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5+-7952B3?logo=bootstrap&logoColor=white)](https://getbootstrap.com/)
[![Docker](https://img.shields.io/badge/Docker-ready-0db7ed?logo=docker)](https://www.docker.com/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-ready-326ce5?logo=kubernetes)](https://kubernetes.io/)

The **Entebus web executive** is a high-performance web application with [Svelte](https://svelte.dev/).
Designed for **containerized environments** (Docker + Kubernetes), it ensures scalability, resilience, and modern developer experience.

## ✨ Features

⚡ **High-performance** with Svelte  
🅱️ **Bootstrap support** for additional styles  
🐳 Ready-to-use **Docker image** with CI-friendly tags  
☸️ Deployment ready for **Kubernetes**

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18+)
- npm (v9+)
- Docker
- Kubernetes (optional for deployment)

### VS Code (plugins)

- Svelte for VS Code
- Prettier
- ESLint

### Usage

Run the following commands from the project root:

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Build the project for production
npm run build

# Preview the production build locally
npm run preview
```

## 🔧 OpenAPI Client Generation

This project uses OpenAPI Generator to automatically create a TypeScript API client from the backend’s OpenAPI specification.

**Steps to generate API client**

```bash
#Check Java installation
java -version

#If Java is not installed, install JDK 17 or higher:
sudo apt update
sudo apt install openjdk-17-jdk -y

# Run the command below to generate the client:
npm run generate:api

#The generated files will appear inside:
src/lib/api/
```

**Package script used**

"generate:api": "openapi-generator-cli generate -i ./openapi/openapi.json -g typescript-fetch -o ./src/lib/api --skip-validate-spec"

## 🐳 Docker Image

**Docker Image**

Build, run, and push the image:
The image is tagged using the format: <branch-name>-<commit-id> (for latest image you may add optional tag <branch-name>-latest).
bash

# Building the docker image

```
docker build -t <registry>/<namespace>/entebus-web-executive:<branch>-<commit-id> \
             -t <registry>/<namespace>entebus-web-executive:<branch>-latest .

# Running the docker image
docker run -d --name <container-name> -p <host-port>:<container-port> \
    <registry>/<namespace>/entebus-web-executive:<branch>-latest

# Login to remote docker repository (only needed once)
docker login <registry>

# Push the docker image to nexus repository
docker push <registry>/<namespace>/entebus-web-executive:<branch>-latest
docker push <registry>/<namespace>/entebus-web-executive:<branch>-<commit-id>

# Pull the docker image from nexus repository
docker pull <registry>/<namespace>/entebus-web-executive:<branch>-<commit-id>
```

## 🤝 Contributing

Contributions are welcome! 🚀
Please check out our [Contributing Guide](CONTRIBUTING.md) for guidelines on setting up your dev environment, coding standards, and submitting PRs. This project follows a [Code of Conduct](CODE_OF_CONDUCT.md) to ensure a welcoming community for everyone.

## 📜 License

This project is licensed under the [MIT License](LICENSE).
Feel free to use, modify, and distribute under the terms of the license.

## 📧 Contact

Developed with ❤️ by Nixbug Softwares OPC Pvt Ltd (contact@nixbug.com).
For issues or feature requests, please open a GitHub issue.
