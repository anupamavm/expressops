# ExpressOps - CI/CD Practice Project

A simple Express.js application for practicing CI/CD pipelines with GitHub Actions and Docker.

## Features

- ✅ Simple Express.js REST API
- ✅ Health check endpoint
- ✅ Calculator API endpoints
- ✅ Jest testing setup with coverage
- ✅ ESLint configuration with prettier
- ✅ Docker support
- ✅ GitHub Actions CI/CD pipeline
- ✅ Terraform infrastructure provisioning
- ✅ Security scanning (CodeQL, Trivy, Gitleaks)
- ✅ Automated deployment to AWS EC2
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

## Infrastructure Provisioning

This project includes automated infrastructure provisioning using **Terraform** and **GitHub Actions**.

### Quick Start

See [Terraform Quick Start Guide](./docs/terraform-quick-start.md) for a 5-step setup.

### What Gets Provisioned

- AWS EC2 instance (Ubuntu 22.04, t2.micro)
- Security groups (SSH, HTTP, HTTPS, port 3000)
- SSH key pair for GitHub Actions
- Elastic IP (optional)
- Docker pre-installed via user data script

### Provision Infrastructure

**Option 1: GitHub Actions (Recommended)**

1. Add AWS credentials to GitHub Secrets
2. Go to `Actions → Infrastructure Provisioning`
3. Run workflow with `apply` action

**Option 2: Local**

```bash
cd terraform/    # Express app configuration
│   ├── server.js                       # Server entry point
│   ├── routes/
│   │   ├── health.js                   # Health check routes
│   │   └── calculator.js               # Calculator routes
│   ├── controllers/
│   │   ├── health.controller.js       # Health check controller
│   │   └── calculator.controller.js   # Calculator controller
│   └── middlewares/
│       └── error.middleware.js        # Error handling middleware
├── tests/
│   ├── health.test.js                 # Health check tests
│   ├── calculator.test.js             # Calculator tests
│   └── error.test.js                  # Error handling tests
├── terraform/
│   ├── main.tf                        # Main infrastructure resources
│   ├── variables.tf                   # Input variables
│   ├── outputs.tf                     # Output values
│   ├── user-data.sh                   # EC2 bootstrap script
│   ├── terraform.tfvars.example       # Example variables
│   └── README.md                      # Terraform documentation
├── .github/
│   └── workflows/
│       ├── ci-cd.yml                  # CI/CD pipeline
│       └── infrastructure.yml         # Infrastructure provisioning
├── docs/
│   ├── terraform-setup-guide.md       # Detailed Terraform guide
│   ├── terraform-quick-start.md       # Quick start guide
│   └── github-actions-ec2-deployment.md # Deployment documentation
├── Dockerfile                          # Docker configuration
├── docker-compose.yml                  # Docker Compose config
├── .dockerignore                       # Docker ignore file
├── .env.example                        # Environment variables template
├── eslint.config.js                    # ESLint configuration
├── jest.config.js                      # Jest configuration
├── package.json                        # Project dependencies
└── README.md                           # This file
```

## Documentation

- [Terraform Quick Start](./docs/terraform-quick-start.md) - Get started in 5 steps
- [Terraform Setup Guide](./docs/terraform-setup-guide.md) - Comprehensive infrastructure guide
- [GitHub Actions to EC2 Deployment](./docs/github-actions-ec2-deployment.md) - SSH deployment guide

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

ISC
Runs on application code changes:

- **Security Job**: CodeQL analysis, npm audit, secret scanning
- **Test Job**: Runs on Node.js 20.x and 22.x
  - Code formatting check
  - Linting
  - Unit tests
  - Code coverage
- **Build Job**: Creates and pushes Docker image to Docker Hub
- **Deploy Job**: Deploys to AWS EC2 via SSH (main branch only)

#### 2. **Infrastructure Provisioning** ([.github/workflows/infrastructure.yml](.github/workflows/infrastructure.yml))

Runs on Terraform file changes or manual trigger:

- Terraform plan/apply/destroy
- Provisions AWS infrastructure
- Outputs connection details

### Setup GitHub Secrets

#### Required for CI/CD:

| Secret            | Description                         |
| ----------------- | ----------------------------------- |
| `DOCKER_USERNAME` | Docker Hub username                 |
| `DOCKER_PASSWORD` | Docker Hub password or access token |

#### Required for Infrastructure:

| Secret                      | Description                   |
| --------------------------- | ----------------------------- |
| `AWS_ACCESS_KEY_ID`         | AWS access key                |
| `AWS_SECRET_ACCESS_KEY`     | AWS secret key                |
| `GITHUB_ACTIONS_PUBLIC_KEY` | SSH public key for deployment |

#### Required for Deployment (after provisioning):

| Secret        | Description                     |
| ------------- | ------------------------------- |
| `EC2_HOST`    | EC2 instance public IP          |
| `EC2_USER`    | SSH username (usually "ubuntu") |
| `EC2_SSH_KEY` | SSH private key for deployment  |

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
