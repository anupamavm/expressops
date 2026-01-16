# 📘 GitHub Actions to AWS EC2 Deployment Guide

## Overview

This guide explains how to set up automated deployment from GitHub Actions to an AWS EC2 instance using SSH authentication. It covers the complete authentication flow, security best practices, and troubleshooting steps for CI/CD deployments.

---

## Architecture

```
Developer
   │
   │ (git push)
   ▼
GitHub Repository
   │
   │ GitHub Actions Workflow
   │ (uses SSH private key from secrets)
   ▼
AWS EC2 Instance
   │
   │ (validates public key)
   │ (runs Docker containers)
   ▼
Express.js Application
```

---

## Understanding SSH Key-Based Authentication

SSH uses **asymmetric cryptography** with a key pair:

| Component       | Purpose                         | Location                                            |
| --------------- | ------------------------------- | --------------------------------------------------- |
| **Private Key** | Proves identity of the client   | Stored securely by the client (GitHub Secrets)      |
| **Public Key**  | Validates the client's identity | Stored on the server (EC2 `~/.ssh/authorized_keys`) |

**Authentication Process:**

1. Client initiates SSH connection with private key
2. Server checks if corresponding public key exists in `authorized_keys`
3. Cryptographic challenge-response validates the key pair
4. Connection is established if validation succeeds

---

## SSH Keys in This Setup

### 1. AWS EC2 Key Pair (`.pem`)

**Purpose:** Manual SSH access for developers

| Property   | Value                          |
| ---------- | ------------------------------ |
| Filename   | `express-key.pem`              |
| Created by | AWS Console during EC2 launch  |
| Used by    | Developers for manual login    |
| Storage    | Developer's local machine only |

⚠️ **Important:** This key should **never** be used in CI/CD pipelines or stored in GitHub.

**Usage:**

```bash
ssh -i ~/.ssh/express-key.pem ubuntu@<EC2_IP>
```

---

### 2. GitHub Actions Deployment Key (Ed25519)

**Purpose:** Automated deployment from GitHub Actions

| Property            | Value                          |
| ------------------- | ------------------------------ |
| Algorithm           | Ed25519 (modern, secure)       |
| Created by          | Developer (using `ssh-keygen`) |
| Used by             | GitHub Actions workflows       |
| Private Key Storage | GitHub Repository Secrets      |
| Public Key Storage  | EC2 `~/.ssh/authorized_keys`   |

**Key Generation:**

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_ed25519 -N ""
```

**Flags explained:**

- `-t ed25519`: Use Ed25519 algorithm (recommended)
- `-C`: Comment for identification
- `-f`: Output filename
- `-N ""`: No passphrase (required for automation)

---

## Key Storage Locations

### Developer Machine

```
~/.ssh/
├── express-key.pem                    # AWS EC2 key (manual access)
├── github_actions_ed25519             # GitHub Actions private key
└── github_actions_ed25519.pub         # GitHub Actions public key
```

### EC2 Instance

```
/home/ubuntu/.ssh/authorized_keys
```

Contains all authorized public keys:

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIAbcdefg... github-actions-deploy
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC... express-key (AWS)
```

### GitHub Repository

Navigate to: **Settings → Secrets and variables → Actions**

Required secrets:
| Secret Name | Contains | Format |
|-------------|----------|--------|
| `EC2_SSH_KEY` | Private key content | Full key including `-----BEGIN OPENSSH PRIVATE KEY-----` |
| `EC2_HOST` | EC2 public IP or hostname | `54.123.45.67` or `ec2-54-123-45-67.compute-1.amazonaws.com` |
| `EC2_USER` | SSH username | `ubuntu` (for Ubuntu AMI) or `ec2-user` (for Amazon Linux) |

---

## Authentication Flow

```
┌─────────────────────┐
│  GitHub Actions     │
│  Workflow Triggered │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────┐
│ Load EC2_SSH_KEY from Secrets   │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ Initiate SSH Connection to EC2  │
│ ssh ubuntu@<EC2_HOST>           │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ EC2 SSH Daemon Checks           │
│ ~/.ssh/authorized_keys          │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ Cryptographic Verification      │
│ Private key ↔ Public key match? │
└──────────┬──────────────────────┘
           │
     ┌─────┴─────┐
     │           │
   Match      No Match
     │           │
     ▼           ▼
  ✅ Access   ❌ Denied
  Granted
     │
     ▼
┌─────────────────────────────────┐
│ Execute Deployment Commands     │
│ (docker pull, run, etc.)        │
└─────────────────────────────────┘
```

---

## GitHub Actions Workflow Configuration

### Basic Deployment Workflow

```yaml
name: Deploy to EC2

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to EC2 via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ${{ secrets.EC2_USER }}
          key: ${{ secrets.EC2_SSH_KEY }}
          port: 22
          script: |
            cd ~/app
            git pull origin main
            npm install --production
            pm2 restart all
```

### Docker-Based Deployment

```yaml
- name: Deploy Docker Container
  uses: appleboy/ssh-action@v1.0.3
  with:
    host: ${{ secrets.EC2_HOST }}
    username: ${{ secrets.EC2_USER }}
    key: ${{ secrets.EC2_SSH_KEY }}
    script: |
      # Pull latest image
      docker pull ${{ secrets.DOCKER_USERNAME }}/expressops:latest

      # Stop and remove existing container
      docker stop expressops || true
      docker rm expressops || true

      # Run new container
      docker run -d \
        --name expressops \
        -p 3000:3000 \
        --restart unless-stopped \
        ${{ secrets.DOCKER_USERNAME }}/expressops:latest
```

---

## Security Best Practices

### 1. Key Management

✅ **DO:**

- Use separate keys for developers and CI/CD
- Generate passphrase-less keys only for automation
- Rotate keys regularly (every 90 days)
- Use Ed25519 algorithm (more secure than RSA)
- Store private keys only in GitHub Secrets

❌ **DON'T:**

- Share your personal AWS `.pem` key with GitHub Actions
- Commit private keys to the repository
- Use the same key across multiple environments
- Use RSA keys shorter than 4096 bits

### 2. EC2 Security Group Configuration

Restrict SSH access:

```
Type: SSH
Protocol: TCP
Port: 22
Source: GitHub Actions IP ranges (webhook IPs)
```

**GitHub Actions IP Ranges:**
You can restrict to GitHub's [Meta API](https://api.github.com/meta) IP addresses or use `0.0.0.0/0` with strong key authentication.

### 3. Principle of Least Privilege

The deployment key should only have:

- Access to the specific EC2 instance
- Minimum required permissions
- No sudo access (unless absolutely necessary)

### 4. Monitoring and Auditing

- Enable AWS CloudTrail for EC2
- Monitor `/var/log/auth.log` for SSH access
- Set up alerts for failed SSH attempts
- Review `authorized_keys` regularly

---

## Complete Setup Instructions

### Prerequisites

- AWS EC2 instance running (Ubuntu 22.04 or later recommended)
- EC2 instance's public IP address
- AWS `.pem` key file for initial access
- GitHub repository with Actions enabled

---

### Part 1: Initial EC2 Connection

**Step 1: Connect to EC2**

```bash
ssh -i express-key.pem ubuntu@<EC2_PUBLIC_IP>
```

Replace `<EC2_PUBLIC_IP>` with your actual EC2 public IP address.

---

### Part 2: Configure EC2 Server

**Step 2: Update Server Packages**

```bash
sudo apt update
```

This ensures all package lists are up-to-date.

**Step 3: Install Docker**

```bash
sudo apt install -y docker.io
```

**Step 4: Start Docker and Enable Auto-Start**

```bash
# Start Docker service
sudo systemctl start docker

# Enable Docker to start on system boot
sudo systemctl enable docker
```

**Step 5: Allow Docker Without sudo**

```bash
# Add ubuntu user to docker group
sudo usermod -aG docker ubuntu

# Exit to apply group changes
exit
```

**Step 6: Reconnect to EC2**

```bash
ssh -i express-key.pem ubuntu@<EC2_PUBLIC_IP>
```

**Step 7: Test Docker Installation**

```bash
docker ps
```

✅ If you see an empty list (no error), Docker is ready!

---

### Part 3: SSH Access for GitHub Actions

GitHub Actions needs its own SSH key to authenticate with EC2.

**Step 8: Create SSH Key for GitHub Actions**

On your **local machine** (not EC2):

```bash
ssh-keygen -t ed25519 -C "github-actions"
```

When prompted:

- Press **Enter** to accept default file location (`~/.ssh/id_ed25519`)
- Press **Enter** twice to skip passphrase (required for automation)

**Files created:**

- `~/.ssh/id_ed25519` → Private key (keep secret)
- `~/.ssh/id_ed25519.pub` → Public key (share with EC2)

**Step 9: Copy Public Key**

```bash
cat ~/.ssh/id_ed25519.pub
```

Copy the entire output (starts with `ssh-ed25519 AAAA...`).

**Step 10: Add Public Key to EC2**

SSH into EC2:

```bash
ssh -i express-key.pem ubuntu@<EC2_PUBLIC_IP>
```

Open the authorized_keys file:

```bash
nano ~/.ssh/authorized_keys
```

- Paste the public key on a new line
- Press `Ctrl + O` to save
- Press `Enter` to confirm
- Press `Ctrl + X` to exit

**Step 11: Set Correct Permissions**

```bash
chmod 600 ~/.ssh/authorized_keys
```

This ensures only the owner can read/write the file.

---

### Part 4: Add Secrets to GitHub

**Step 12: Navigate to GitHub Repository Settings**

1. Go to your repository on GitHub
2. Click **Settings** (top menu)
3. In the left sidebar: **Secrets and variables** → **Actions**
4. Click **New repository secret**

**Step 13: Add Required Secrets**

Create three secrets with these exact names:

**Secret 1: EC2_HOST**

- **Name:** `EC2_HOST`
- **Value:** Your EC2 public IP address (e.g., `54.123.45.67`)

**Secret 2: EC2_USER**

- **Name:** `EC2_USER`
- **Value:** `ubuntu`

**Secret 3: EC2_SSH_KEY**

- **Name:** `EC2_SSH_KEY`
- **Value:** Contents of your private key

To get the private key, run on your local machine:

```bash
cat ~/.ssh/id_ed25519
```

Copy **everything**, including:

```
-----BEGIN OPENSSH PRIVATE KEY-----
... (all the content) ...
-----END OPENSSH PRIVATE KEY-----
```

Paste the entire content into the GitHub secret.

---

### Part 5: Test the Connection

**Step 14: Create Test Workflow**

Create file `.github/workflows/test-ssh.yml`:

```yaml
name: Test SSH Connection

on: workflow_dispatch

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Test SSH Connection
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ${{ secrets.EC2_USER }}
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            echo "✅ Connection successful!"
            echo "Logged in as: $(whoami)"
            echo "Current directory: $(pwd)"
            echo "Server info: $(uname -a)"
            echo "Docker version: $(docker --version)"
```

**Step 15: Run the Test**

1. Go to your repository's **Actions** tab
2. Select **Test SSH Connection** workflow
3. Click **Run workflow** → **Run workflow**
4. Wait for completion
5. Check logs for success message

✅ If you see "Connection successful!" and no errors, setup is complete!

---

## Troubleshooting

### Error: Permission Denied (publickey)

**Cause:** Public key not in EC2's `authorized_keys` or incorrect private key

**Solution:**

```bash
# On EC2, check authorized_keys
cat ~/.ssh/authorized_keys

# Verify permissions
ls -la ~/.ssh/
# Should show: drwx------ for .ssh/
# Should show: -rw------- for authorized_keys

# Fix permissions if needed
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### Error: Load key invalid format

**Cause:** Private key format issue or contains extra characters

**Solution:**

- Ensure the entire key is copied, including header and footer
- Check for no extra spaces or newlines
- Key should start with `-----BEGIN OPENSSH PRIVATE KEY-----`
- Key should end with `-----END OPENSSH PRIVATE KEY-----`

### Error: Connection Timeout

**Cause:** Security group not allowing SSH or EC2 stopped

**Solution:**

```bash
# Check EC2 is running
aws ec2 describe-instance-status --instance-ids i-xxxxx

# Verify security group allows SSH from GitHub Actions
# Check port 22 is open in EC2 Security Group
```

### Error: Host Key Verification Failed

**Cause:** EC2 host key not recognized

**Solution:**
Add `StrictHostKeyChecking=no` in workflow (use cautiously):

```yaml
with:
  host: ${{ secrets.EC2_HOST }}
  username: ${{ secrets.EC2_USER }}
  key: ${{ secrets.EC2_SSH_KEY }}
  script_stop: true
  command_timeout: 10m
```

Or add host key to known_hosts:

```yaml
- name: Add EC2 to known hosts
  run: |
    mkdir -p ~/.ssh
    ssh-keyscan -H ${{ secrets.EC2_HOST }} >> ~/.ssh/known_hosts
```

### Common Issues Checklist

- [ ] Private key is complete with header/footer
- [ ] Public key exists in EC2 `authorized_keys`
- [ ] File permissions: `~/.ssh` (700), `authorized_keys` (600)
- [ ] Security group allows port 22
- [ ] EC2 instance is running
- [ ] Correct username (ubuntu/ec2-user)
- [ ] No passphrase on the private key

---

## Advanced: Alternative Deployment Methods

### AWS Systems Manager (SSM) Session Manager

**Advantages:**

- No SSH keys required
- No open port 22
- Built-in logging
- IAM-based authentication

**Setup:**

```yaml
- name: Configure AWS Credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
    aws-region: us-east-1

- name: Execute Commands via SSM
  run: |
    aws ssm send-command \
      --instance-ids ${{ secrets.EC2_INSTANCE_ID }} \
      --document-name "AWS-RunShellScript" \
      --parameters 'commands=["cd /app && git pull && pm2 restart all"]'
```

### GitHub OIDC with AWS IAM Roles

Eliminates long-lived credentials:

```yaml
permissions:
  id-token: write
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsRole
          aws-region: us-east-1
```

---

## Key Differences: Developer vs CI/CD Access

| Aspect             | Developer Access | GitHub Actions Access          |
| ------------------ | ---------------- | ------------------------------ |
| **Key Type**       | AWS `.pem` (RSA) | Custom Ed25519                 |
| **Passphrase**     | Optional         | None (required for automation) |
| **Storage**        | Local machine    | GitHub Secrets                 |
| **Access Pattern** | Interactive      | Automated                      |
| **Rotation**       | Rarely           | Regularly (90 days)            |
| **Scope**          | Full access      | Limited to deployment          |

---

## Conclusion

This SSH-based deployment setup provides:

✅ Automated CI/CD pipeline  
✅ Secure key-based authentication  
✅ Clear separation between developer and automation access  
✅ Foundation for DevSecOps practices

Once you're comfortable with this approach, consider migrating to:

- AWS SSM Session Manager (no SSH keys)
- GitHub OIDC with IAM roles (no long-lived credentials)
- AWS CodeDeploy for blue-green deployments

---

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS EC2 Key Pairs](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-key-pairs.html)
- [SSH Key Best Practices](https://www.ssh.com/academy/ssh/public-key-authentication)
- [AWS SSM Session Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html)

---

**Need Help?**

- Check the troubleshooting section above
- Review GitHub Actions logs in the Actions tab
- Check EC2 `/var/log/auth.log` for SSH connection attempts
- Verify all secrets are correctly configured in GitHub
