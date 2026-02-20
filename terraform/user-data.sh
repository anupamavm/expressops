#!/bin/bash
set -e

# Update system packages
apt-get update -y
apt-get upgrade -y

# Install essential tools
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    software-properties-common \
    unattended-upgrades

# Configure automatic security updates
dpkg-reconfigure -plow unattended-upgrades

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Add ubuntu user to docker group
usermod -aG docker ubuntu

# Enable Docker service
systemctl enable docker
systemctl start docker

# Install Docker Compose
DOCKER_COMPOSE_VERSION="2.24.5"
curl -L "https://github.com/docker/compose/releases/download/v$${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Configure Docker daemon for production
cat > /etc/docker/daemon.json <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "live-restore": true
}
EOF

# Restart Docker with new configuration
systemctl restart docker

# Set up SSH for GitHub Actions
mkdir -p /home/ubuntu/.ssh
chmod 700 /home/ubuntu/.ssh
touch /home/ubuntu/.ssh/authorized_keys
chmod 600 /home/ubuntu/.ssh/authorized_keys
chown -R ubuntu:ubuntu /home/ubuntu/.ssh

# Configure firewall (UFW)
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 3000/tcp  # Application port

# Install CloudWatch agent (optional, for monitoring)
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
dpkg -i -E ./amazon-cloudwatch-agent.deb
rm amazon-cloudwatch-agent.deb

# Create a script to check Docker health
cat > /usr/local/bin/docker-health-check.sh <<'EOF'
#!/bin/bash
if ! docker ps > /dev/null 2>&1; then
    echo "Docker is not running. Attempting to restart..."
    systemctl restart docker
fi
EOF
chmod +x /usr/local/bin/docker-health-check.sh

# Add cron job for Docker health check
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/docker-health-check.sh") | crontab -

# Clean up
apt-get autoremove -y
apt-get clean

# Create a marker file to indicate user-data has completed
echo "User data script completed at $(date)" > /var/log/user-data-complete.log

# Log environment for debugging
echo "Environment: ${environment}" >> /var/log/user-data-complete.log
echo "Docker version: $(docker --version)" >> /var/log/user-data-complete.log
echo "Docker Compose version: $(docker-compose --version)" >> /var/log/user-data-complete.log
