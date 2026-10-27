#!/bin/bash
# First boot of the Lightsail instance (user data, runs as root once).
# Installs Docker and prepares the folder the deploy writes to.
# Lightsail prepends its own launch script, so this runs under sh, not bash:
# keep it POSIX (no pipefail).
set -eux

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get -y -o Dpkg::Options::=--force-confdef -o Dpkg::Options::=--force-confold full-upgrade
apt-get install -y docker.io docker-compose-v2
systemctl enable --now docker
usermod -aG docker ubuntu

# 2 GB of RAM: a swap file keeps an image load or a burst of sharp from being killed.
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >>/etc/fstab
fi

install -d -o ubuntu -g ubuntu -m 750 /opt/gameplay

# Load the upgraded kernel. User data runs once per instance, so this does not loop.
if [ -f /var/run/reboot-required ]; then
  reboot
fi
