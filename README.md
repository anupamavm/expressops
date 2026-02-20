# ExpressOps - CI/CD Practice Project

A simple Express.js application for practicing CI/CD pipelines with GitHub Actions and Docker.

## Features

- ✅ Simple Express.js REST API
- ✅ Health check endpoint
- ✅ Jest testing setup
- ✅ ESLint configuration with prettier
- ✅ Docker support
- ✅ GitHub Actions CI/CD pipeline
- ✅ Error handling middleware

## Prerequisites

- Node.js 20.x or 22.x
- npm or yarn
- Docker (optional)

## Getting Started

### Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd expressops
```

2. Install dependencies:

```bash
npm install
```

3. Create environment file:

```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration.

### Running the Application

#### Development mode:

```bash
npm run dev
```

#### Production mode:

```bash
npm start
```

The server will start on `http://localhost:3000`

### API Endpoints

- **GET** `/api/health` - Health check endpoint
  - Returns service status, timestamp, and uptime

### Testing

Run tests:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

### Linting

Check code style:

```bash
npm run lint
```

Fix linting issues:

```bash
npm run lint:fix
```

## Docker

### Build Docker image:

```bash
docker build -t expressops .
```

### Run Docker container:

```bash
docker run -p 3000:3000 --env-file .env expressops
```

### Using Docker Compose (optional):

```bash
docker-compose up
```

## CI/CD Pipeline

This project uses GitHub Actions for CI/CD:

- **Test Job**: Runs on Node.js 18.x and 20.x
  - Linting
  - Unit tests
  - Code coverage

- **Build Job**: Creates and pushes Docker image to Docker Hub

- **Deploy Job**: Deploys to production (customize as needed)

### Setup GitHub Secrets

Add these secrets to your GitHub repository:

- `DOCKER_USERNAME` - Your Docker Hub username
- `DOCKER_PASSWORD` - Your Docker Hub password or access token

## Project Structure

```
expressops/
├── src/
│   ├── app.js                      # Express app configuration
│   ├── server.js                   # Server entry point
│   ├── routes/
│   │   └── health.js               # Health check routes
│   ├── controllers/
│   │   └── health.controller.js   # Health check controller
│   └── middlewares/
│       └── error.middleware.js    # Error handling middleware
├── tests/
│   └── health.test.js             # Health check tests
├── .github/
│   └── workflows/
│       └── ci-cd.yml              # CI/CD pipeline configuration
├── Dockerfile                      # Docker configuration
├── .dockerignore                   # Docker ignore file
├── .env.example                    # Environment variables template
├── .eslintrc.json                  # ESLint configuration
├── package.json                    # Project dependencies
└── README.md                       # This file
```
