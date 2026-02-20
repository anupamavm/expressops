output "instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.expressops.id
}

output "instance_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = var.use_elastic_ip ? aws_eip.expressops[0].public_ip : aws_instance.expressops.public_ip
}

output "instance_public_dns" {
  description = "Public DNS name of the EC2 instance"
  value       = aws_instance.expressops.public_dns
}

output "security_group_id" {
  description = "ID of the security group"
  value       = aws_security_group.expressops_sg.id
}

output "ssh_connection_command" {
  description = "SSH command to connect to the instance"
  value       = "ssh -i ~/.ssh/github_actions_ed25519 ubuntu@${var.use_elastic_ip ? aws_eip.expressops[0].public_ip : aws_instance.expressops.public_ip}"
}

output "application_url" {
  description = "URL to access the application"
  value       = "http://${var.use_elastic_ip ? aws_eip.expressops[0].public_ip : aws_instance.expressops.public_ip}:3000"
}

output "ec2_user" {
  description = "SSH username for EC2 instance"
  value       = "ubuntu"
}

output "key_pair_name" {
  description = "Name of the SSH key pair"
  value       = aws_key_pair.github_actions.key_name
}
