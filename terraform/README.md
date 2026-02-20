# Terraform Infrastructure for ExpressOps

This directory contains Terraform configuration for provisioning AWS infrastructure for the ExpressOps application.

## 📁 Files

- `main.tf` - Main infrastructure resources (EC2, Security Groups, Key Pairs)
- `variables.tf` - Input variable definitions
- `outputs.tf` - Output values after apply
- `user-data.sh` - Bootstrap script for EC2 instance
- `terraform.tfvars.example` - Example variables file
- `.gitignore` - Terraform-specific gitignore

## 🚀 Quick Start

### Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** configured with credentials
3. **Terraform** installed (>= 1.6.0)
4. **SSH Key Pair** for GitHub Actions

### Step 1: Generate SSH Key for GitHub Actions

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_ed25519 -N ""
```

This creates:

- `~/.ssh/github_actions_ed25519` (private key - store in GitHub Secrets)
- `~/.ssh/github_actions_ed25519.pub` (public key - use in terraform.tfvars)

### Step 2: Configure Variables

```bash
cd terraform/
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and set:

- `github_actions_public_key` - contents of `~/.ssh/github_actions_ed25519.pub`
- `ssh_allowed_ips` - your IP addresses for SSH access
- Other variables as needed

### Step 3: Initialize Terraform

```bash
terraform init
```

### Step 4: Plan Infrastructure

```bash
terraform plan
```

Review the planned changes carefully.

### Step 5: Apply Infrastructure

```bash
terraform apply
```

Type `yes` to confirm and create resources.

### Step 6: Get Outputs

```bash
terraform output
```

Save these values:

- `instance_public_ip` → GitHub Secret `EC2_HOST`
- `ec2_user` → GitHub Secret `EC2_USER`
- Private key content → GitHub Secret `EC2_SSH_KEY`

## 🔐 GitHub Secrets Setup

After provisioning, add these secrets to your GitHub repository:

| Secret Name   | Value            | Where to Get                                   |
| ------------- | ---------------- | ---------------------------------------------- |
| `EC2_HOST`    | Public IP of EC2 | `terraform output instance_public_ip`          |
| `EC2_USER`    | SSH username     | `terraform output ec2_user` (usually "ubuntu") |
| `EC2_SSH_KEY` | Private SSH key  | Contents of `~/.ssh/github_actions_ed25519`    |

## 📊 Resources Created

- **EC2 Instance** - t2.micro Ubuntu 22.04 server
- **Security Group** - Firewall rules (SSH, HTTP, HTTPS, port 3000)
- **SSH Key Pair** - For GitHub Actions authentication
- **Elastic IP** (optional) - Static IP address
- **User Data** - Automatically installs Docker and dependencies

## 💰 Cost Estimation

**Free Tier Eligible:**

- t2.micro instance: Free for 750 hours/month (first year)
- EBS storage: Free for 30GB

**After Free Tier:**

- t2.micro: ~$8-10/month
- EBS 20GB: ~$2/month
- Elastic IP: Free while attached, $3.60/month if unattached

**Total:** ~$0/month (first year) or ~$10-12/month after

## 🧹 Cleanup

To destroy all resources:

```bash
terraform destroy
```

Type `yes` to confirm deletion.

## 🔧 Customization

### Change Instance Type

Edit `terraform.tfvars`:

```hcl
instance_type = "t3.small"  # More powerful instance
```

### Restrict SSH Access

Edit `terraform.tfvars`:

```hcl
ssh_allowed_ips = ["YOUR_IP/32"]  # Only your IP
```

### Disable Elastic IP

Edit `terraform.tfvars`:

```hcl
use_elastic_ip = false
```

## 📝 Remote State (Optional but Recommended)

For production, store Terraform state in S3:

### 1. Create S3 Bucket and DynamoDB Table

```bash
aws s3 mb s3://expressops-terraform-state --region us-east-1
aws s3api put-bucket-versioning --bucket expressops-terraform-state --versioning-configuration Status=Enabled
aws s3api put-bucket-encryption --bucket expressops-terraform-state --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

aws dynamodb create-table \
    --table-name expressops-terraform-locks \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1
```

### 2. Uncomment Backend in main.tf

Edit `main.tf` and uncomment the backend block.

### 3. Reinitialize Terraform

```bash
terraform init -migrate-state
```

## 🔍 Troubleshooting

### Cannot connect to EC2

1. Check security group allows your IP
2. Verify SSH key is correct
3. Wait ~2-3 minutes for user-data to complete

### User data didn't run

Check logs on EC2:

```bash
ssh -i ~/.ssh/github_actions_ed25519 ubuntu@<EC2_IP>
cat /var/log/cloud-init-output.log
cat /var/log/user-data-complete.log
```

### Docker not installed

User data may still be running. Check:

```bash
tail -f /var/log/cloud-init-output.log
```

## 📚 Next Steps

1. ✅ Provision infrastructure with Terraform
2. ✅ Add GitHub Secrets (EC2_HOST, EC2_USER, EC2_SSH_KEY)
3. ✅ Run CI/CD pipeline to deploy application
4. ✅ Access your app at `http://<EC2_IP>:3000`
