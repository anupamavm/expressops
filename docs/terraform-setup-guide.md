# 🏗️ Terraform Infrastructure Provisioning Guide

## Overview

This guide walks you through setting up automated infrastructure provisioning for ExpressOps using Terraform and GitHub Actions. The setup creates an EC2 instance with Docker pre-installed, ready for your application deployment.

---

## 📋 Table of Contents

1. [Architecture](#architecture)
2. [Prerequisites](#prerequisites)
3. [Setup Steps](#setup-steps)
4. [GitHub Actions Workflow](#github-actions-workflow)
5. [Managing Infrastructure](#managing-infrastructure)
6. [Cost Optimization](#cost-optimization)
7. [Troubleshooting](#troubleshooting)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Your Workstation                        │
│  - Edit terraform/*.tf files                               │
│  - Push changes to GitHub                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ git push
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   GitHub Repository                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │        GitHub Actions Workflow                       │  │
│  │  1. terraform init                                   │  │
│  │  2. terraform plan                                   │  │
│  │  3. terraform apply                                  │  │
│  └──────────────────┬───────────────────────────────────┘  │
└─────────────────────┼───────────────────────────────────────┘
                      │
                      │ AWS API Calls
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                         AWS Cloud                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Resources Created:                                  │  │
│  │  - EC2 Instance (Ubuntu 22.04)                       │  │
│  │  - Security Group (SSH, HTTP, HTTPS, 3000)          │  │
│  │  - SSH Key Pair (for GitHub Actions)                │  │
│  │  - Elastic IP (optional)                            │  │
│  │  - EBS Volume (20GB, encrypted)                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  User Data Script runs on first boot:                      │
│  - Install Docker & Docker Compose                         │
│  - Configure firewall (UFW)                                │
│  - Set up automatic security updates                       │
│  - Install CloudWatch agent                                │
└─────────────────────────────────────────────────────────────┘
                      │
                      │ SSH Deployment
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              CI/CD Pipeline (Existing)                      │
│  - Build Docker image                                      │
│  - Push to Docker Hub                                      │
│  - Deploy to EC2                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### 1. AWS Account Setup

- Active AWS account
- IAM user with appropriate permissions
- AWS Access Key ID and Secret Access Key

**Required IAM Permissions:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["ec2:*", "s3:*", "dynamodb:*"],
      "Resource": "*"
    }
  ]
}
```

### 2. Tools Installation

```bash
# Terraform
brew install terraform  # macOS
# or download from https://www.terraform.io/downloads

# AWS CLI
brew install awscli  # macOS
# or download from https://aws.amazon.com/cli/

# Verify installations
terraform --version  # Should be >= 1.6.0
aws --version
```

### 3. Configure AWS CLI

```bash
aws configure
# Enter:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (e.g., us-east-1)
# - Output format (json)
```

---

## Setup Steps

### Step 1: Generate SSH Key for GitHub Actions

This key will be used by GitHub Actions to deploy your application to EC2.

```bash
# Generate Ed25519 key (modern, secure)
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_ed25519 -N ""

# View the public key (needed for Terraform)
cat ~/.ssh/github_actions_ed25519.pub

# View the private key (needed for GitHub Secrets)
cat ~/.ssh/github_actions_ed25519
```

**Important:** Keep both keys safe! The private key will go in GitHub Secrets.

---

### Step 2: Configure Terraform Variables

```bash
cd terraform/

# Copy example file
cp terraform.tfvars.example terraform.tfvars

# Edit the file
nano terraform.tfvars  # or use your preferred editor
```

**Required configuration:**

```hcl
# terraform.tfvars
aws_region  = "us-east-1"
environment = "prod"
instance_type = "t2.micro"

# Paste the ENTIRE public key (from step 1)
github_actions_public_key = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA... github-actions-deploy"

# Optional: Restrict SSH to your IP for better security
ssh_allowed_ips = ["YOUR_IP/32"]  # or ["0.0.0.0/0"] for anywhere
```

---

### Step 3: Add GitHub Secrets

Navigate to your repository: **Settings → Secrets and variables → Actions**

Add these secrets:

| Secret Name                 | Value                     | How to Get                              |
| --------------------------- | ------------------------- | --------------------------------------- |
| `AWS_ACCESS_KEY_ID`         | AWS access key            | AWS IAM Console                         |
| `AWS_SECRET_ACCESS_KEY`     | AWS secret key            | AWS IAM Console                         |
| `GITHUB_ACTIONS_PUBLIC_KEY` | SSH public key            | `cat ~/.ssh/github_actions_ed25519.pub` |
| `DOCKER_USERNAME`           | Docker Hub username       | Your Docker Hub account                 |
| `DOCKER_PASSWORD`           | Docker Hub password/token | Docker Hub Settings                     |

**The following will be added AFTER provisioning:**

| Secret Name   | Value           | How to Get                            |
| ------------- | --------------- | ------------------------------------- |
| `EC2_HOST`    | EC2 public IP   | `terraform output instance_public_ip` |
| `EC2_USER`    | SSH username    | `terraform output ec2_user`           |
| `EC2_SSH_KEY` | SSH private key | `cat ~/.ssh/github_actions_ed25519`   |

---

### Step 4: Test Terraform Locally (Optional but Recommended)

```bash
cd terraform/

# Initialize Terraform
terraform init

# Format code
terraform fmt

# Validate configuration
terraform validate

# See what will be created
terraform plan

# Create resources (only if you want to do it manually)
terraform apply
```

---

### Step 5: Run Infrastructure Workflow

#### Option A: Manual Trigger (Recommended for First Time)

1. Go to GitHub: **Actions → Infrastructure Provisioning**
2. Click **Run workflow**
3. Select action: **plan** (to preview)
4. Review the plan output
5. Run again with action: **apply** (to create)

#### Option B: Automatic Trigger

```bash
# Push terraform changes to main branch
git add terraform/
git commit -m "feat: add terraform infrastructure"
git push origin main

# Workflow runs automatically
```

---

### Step 6: Retrieve EC2 Connection Details

After successful provisioning:

1. Go to GitHub Actions output
2. Copy the connection details
3. Add to GitHub Secrets:

```bash
# From workflow output or run locally:
cd terraform/
terraform output instance_public_ip
terraform output ec2_user
terraform output application_url
```

Add these to GitHub Secrets:

- `EC2_HOST` = value from `instance_public_ip`
- `EC2_USER` = value from `ec2_user`
- `EC2_SSH_KEY` = contents of `~/.ssh/github_actions_ed25519`

---

### Step 7: Verify EC2 Setup

```bash
# SSH into your new EC2 instance
ssh -i ~/.ssh/github_actions_ed25519 ubuntu@<EC2_PUBLIC_IP>

# Check Docker is installed
docker --version
docker-compose --version

# Check user-data completed
cat /var/log/user-data-complete.log

# Exit
exit
```

---

### Step 8: Deploy Your Application

Now your existing CI/CD pipeline will work!

```bash
# Push code to trigger deployment
git push origin main

# The CI/CD workflow will:
# 1. Run tests
# 2. Build Docker image
# 3. Push to Docker Hub
# 4. Deploy to your new EC2 instance
```

---

## GitHub Actions Workflow

### Infrastructure Workflow Triggers

The infrastructure workflow runs when:

1. **Manual trigger** (workflow_dispatch)
   - Go to Actions tab
   - Select "Infrastructure Provisioning"
   - Click "Run workflow"

2. **Push to main** with changes in:
   - `terraform/**`
   - `.github/workflows/infrastructure.yml`

3. **Pull Request** with changes in:
   - `terraform/**`
   - Shows plan in PR comments

### Workflow Actions

- **plan** - Preview infrastructure changes (safe, no modifications)
- **apply** - Create or update infrastructure
- **destroy** - Delete all infrastructure resources

---

## Managing Infrastructure

### View Current Infrastructure

```bash
cd terraform/
terraform show
```

### Update Infrastructure

1. Edit `terraform/*.tf` files
2. Run `terraform plan` to preview changes
3. Commit and push to trigger workflow
4. Or run manually with `terraform apply`

### Destroy Infrastructure

**Warning:** This deletes everything!

```bash
# Via GitHub Actions
# Actions → Infrastructure Provisioning → Run workflow → Select "destroy"

# Or locally
cd terraform/
terraform destroy
```

---

## Remote State (Production Setup)

For production environments, store Terraform state in S3:

### 1. Create S3 Backend Resources

```bash
# Create S3 bucket
aws s3 mb s3://expressops-terraform-state --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket expressops-terraform-state \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket expressops-terraform-state \
  --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name expressops-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### 2. Enable Backend in Terraform

Edit `terraform/main.tf` and uncomment the backend block:

```hcl
terraform {
  backend "s3" {
    bucket         = "expressops-terraform-state"
    key            = "infrastructure/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "expressops-terraform-locks"
    encrypt        = true
  }
}
```

### 3. Migrate State

```bash
cd terraform/
terraform init -migrate-state
```

---

## Cost Optimization

### Free Tier (First 12 Months)

- ✅ **EC2 t2.micro:** 750 hours/month free
- ✅ **EBS:** 30GB free
- ✅ **Data Transfer:** 15GB out free
- ✅ **Elastic IP:** Free while attached

**Total:** $0/month for the first year

### After Free Tier

| Resource              | Cost/Month  |
| --------------------- | ----------- |
| t2.micro EC2          | ~$8.50      |
| 20GB EBS gp3          | ~$1.60      |
| Elastic IP (attached) | $0          |
| Data Transfer         | ~$1-2       |
| **Total**             | **~$10-12** |

### Cost Saving Tips

1. **Stop instance when not in use:**

   ```bash
   aws ec2 stop-instances --instance-ids <INSTANCE_ID>
   ```

2. **Use t3.micro instead of t2.micro** (better performance, similar price)

3. **Disable Elastic IP** if you don't need static IP:

   ```hcl
   use_elastic_ip = false
   ```

4. **Use Spot Instances** (more complex, but 70% cheaper)

5. **Set up billing alerts** in AWS Console

---

## Troubleshooting

### Issue: Terraform init fails

**Error:** `Error: Failed to get existing workspaces`

**Solution:**

```bash
rm -rf .terraform/
terraform init
```

### Issue: AWS credentials not working

**Error:** `Error: No valid credential sources found`

**Solution:**

```bash
# Check AWS credentials
aws sts get-caller-identity

# Reconfigure if needed
aws configure
```

### Issue: SSH key format error

**Error:** `InvalidKeyPair.Format`

**Solution:**

- Ensure you're using the **public key** in terraform.tfvars
- Should start with `ssh-ed25519` or `ssh-rsa`
- Copy the entire key including the comment at the end

### Issue: Instance not accessible

**Possible causes:**

1. User data still running (wait 2-3 minutes)
2. Security group blocking your IP
3. Wrong SSH key

**Debug:**

```bash
# Check instance status
aws ec2 describe-instance-status --instance-ids <INSTANCE_ID>

# Check user data logs (via AWS Console)
# EC2 → Instances → Select instance → Actions → Monitor and troubleshoot → Get system log
```

### Issue: Docker not installed on EC2

**Solution:**

```bash
# SSH into instance
ssh -i ~/.ssh/github_actions_ed25519 ubuntu@<EC2_IP>

# Check user-data log
sudo cat /var/log/cloud-init-output.log

# Manually install if needed
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu
```

---

## Security Best Practices

### 1. Restrict SSH Access

Update `terraform.tfvars`:

```hcl
ssh_allowed_ips = ["YOUR_IP/32"]
```

### 2. Use Separate Keys

- ❌ Don't use the same SSH key for manual access and automation
- ✅ Use separate keys (manual key vs GitHub Actions key)

### 3. Rotate Keys Regularly

Every 90 days:

1. Generate new SSH key
2. Update terraform.tfvars
3. Run `terraform apply`
4. Update GitHub Secrets
5. Delete old key from EC2

### 4. Enable AWS CloudTrail

Monitor all API calls and infrastructure changes

### 5. Use IAM Roles Instead of Access Keys

For production, use OIDC/GitHub Actions OIDC instead of long-lived credentials

---

## Next Steps

After infrastructure is provisioned:

1. ✅ **Test SSH Connection**

   ```bash
   ssh -i ~/.ssh/github_actions_ed25519 ubuntu@<EC2_IP>
   ```

2. ✅ **Update GitHub Secrets** (EC2_HOST, EC2_USER, EC2_SSH_KEY)

3. ✅ **Run CI/CD Pipeline**

   ```bash
   git push origin main
   ```

4. ✅ **Access Your Application**

   ```
   http://<EC2_IP>:3000
   ```

5. ✅ **Set Up Monitoring** (CloudWatch, logs)

6. ✅ **Configure Domain** (Route53, optional)

7. ✅ **Add HTTPS** (Let's Encrypt, optional)

---

## Comparison: Manual vs Terraform

| Aspect                | Manual Setup     | Terraform Setup     |
| --------------------- | ---------------- | ------------------- |
| **Time to provision** | 30-60 minutes    | 5 minutes           |
| **Reproducibility**   | ❌ Error-prone   | ✅ Consistent       |
| **Documentation**     | ❌ Often missing | ✅ Self-documenting |
| **Tear down**         | ❌ Manual, risky | ✅ One command      |
| **Version control**   | ❌ No history    | ✅ Full history     |
| **Collaboration**     | ❌ Difficult     | ✅ Easy via PRs     |
| **Disaster recovery** | ❌ Slow          | ✅ Fast             |

---

## Additional Resources

- [Terraform AWS Provider Docs](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS EC2 Best Practices](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-best-practices.html)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker on Ubuntu](https://docs.docker.com/engine/install/ubuntu/)

---

## FAQ

**Q: Can I use this for production?**  
A: Yes, but add remote state (S3), restrict SSH IPs, and consider using AWS managed services (ECS, RDS) for better scalability.

**Q: How do I add more EC2 instances?**  
A: Modify `main.tf` to use `count` or `for_each`, or consider using an Auto Scaling Group.

**Q: Can I use a different cloud provider?**  
A: Yes! Terraform supports GCP, Azure, DigitalOcean, etc. Just change the provider and resources.

**Q: What if I want to use RDS instead of local database?**  
A: Add RDS resources to `main.tf` and update your application connection string.

**Q: How do I roll back infrastructure changes?**  
A: Use git to revert terraform files, then run `terraform apply` again.

---

**🎉 Congratulations!** You now have fully automated infrastructure provisioning for your ExpressOps application!
