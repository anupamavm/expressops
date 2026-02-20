# 🚀 Quick Start: Terraform Infrastructure Setup

This is a condensed guide to get your infrastructure up and running in ~10 minutes.

## Prerequisites Checklist

- [ ] AWS account with admin access
- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] Terraform installed (>= 1.6.0)
- [ ] GitHub repository access

---

## 5-Step Setup

### 1️⃣ Generate SSH Key

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_ed25519 -N ""
```

### 2️⃣ Add GitHub Secrets

Go to: `GitHub Repo → Settings → Secrets and variables → Actions`

Add these:

```
AWS_ACCESS_KEY_ID          = <from AWS IAM>
AWS_SECRET_ACCESS_KEY      = <from AWS IAM>
GITHUB_ACTIONS_PUBLIC_KEY  = <contents of ~/.ssh/github_actions_ed25519.pub>
```

### 3️⃣ Configure Terraform Variables

```bash
cd terraform/
cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars
```

Update:

```hcl
github_actions_public_key = "ssh-ed25519 AAAA... github-actions-deploy"
```

### 4️⃣ Run Infrastructure Workflow

**Option A: GitHub Actions (Recommended)**

1. Go to `Actions → Infrastructure Provisioning`
2. Click `Run workflow`
3. Select `plan` → Review output
4. Run again with `apply` → Creates infrastructure

**Option B: Local**

```bash
cd terraform/
terraform init
terraform plan
terraform apply
```

### 5️⃣ Update Remaining GitHub Secrets

Get values:

```bash
terraform output instance_public_ip
terraform output ec2_user
```

Add to GitHub Secrets:

```
EC2_HOST       = <output from instance_public_ip>
EC2_USER       = ubuntu
EC2_SSH_KEY    = <contents of ~/.ssh/github_actions_ed25519>  # PRIVATE key!
```

---

## ✅ Verify Setup

```bash
# SSH into EC2
ssh -i ~/.ssh/github_actions_ed25519 ubuntu@<EC2_IP>

# Check Docker is installed
docker --version

# Exit
exit
```

---

## 🚀 Deploy Your App

```bash
# Push code to main branch
git push origin main

# CI/CD pipeline will automatically deploy to your new EC2 instance
```

Access at: `http://<EC2_IP>:3000`

---

## 📊 Cost

- **Free tier:** $0/month (first 12 months)
- **After:** ~$10-12/month

---

## 🧹 Cleanup

To destroy all infrastructure:

```bash
# Via GitHub Actions
Actions → Infrastructure Provisioning → Run workflow → Select "destroy"

# Or locally
cd terraform/
terraform destroy
```

---

## 🆘 Troubleshooting

**Can't SSH:** Wait 2-3 minutes for user-data to complete

**Terraform errors:** Check AWS credentials with `aws sts get-caller-identity`

**Docker not installed:** Check logs: `cat /var/log/cloud-init-output.log`

---

## 📚 Full Documentation

See [terraform-setup-guide.md](./terraform-setup-guide.md) for detailed instructions.

---

**That's it! You now have automated infrastructure provisioning! 🎉**
