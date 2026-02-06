#!/bin/bash
# Production Setup Script for Molt of Empires
# Run this after initial deployment to configure production settings

set -e

echo "========================================"
echo "  Molt of Empires - Production Setup"
echo "========================================"
echo ""

# Check if .env exists, create from example if not
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "[+] Created .env from .env.example"
    else
        echo "[!] No .env or .env.example found"
        exit 1
    fi
fi

# 1. Rotate ADMIN_SECRET
echo ""
echo "=== Step 1: Rotate ADMIN_SECRET ==="
NEW_SECRET=$(openssl rand -hex 32)
echo "[+] Generated new secret: ${NEW_SECRET:0:16}..."

if grep -q "^ADMIN_SECRET=$" .env || grep -q "^ADMIN_SECRET=\"\"$" .env; then
    # Empty secret, just set it
    sed -i "s/^ADMIN_SECRET=.*/ADMIN_SECRET=$NEW_SECRET/" .env
    echo "[+] ADMIN_SECRET set in .env"
else
    read -p "ADMIN_SECRET already set. Replace it? [y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sed -i "s/^ADMIN_SECRET=.*/ADMIN_SECRET=$NEW_SECRET/" .env
        echo "[+] ADMIN_SECRET rotated in .env"
    else
        echo "[-] Skipped ADMIN_SECRET rotation"
    fi
fi

# 2. Set CORS_ALLOWED_ORIGINS
echo ""
echo "=== Step 2: Configure CORS ==="
read -p "Enter your production domain (e.g., https://molt-of-empires.com): " DOMAIN

if [ -n "$DOMAIN" ]; then
    sed -i "s|^CORS_ALLOWED_ORIGINS=.*|CORS_ALLOWED_ORIGINS=$DOMAIN|" .env
    echo "[+] CORS_ALLOWED_ORIGINS set to: $DOMAIN"
else
    echo "[-] Skipped CORS configuration"
fi

# 3. Setup PM2
echo ""
echo "=== Step 3: Setup PM2 ==="

if ! command -v pm2 &> /dev/null; then
    echo "[*] Installing PM2..."
    npm install -g pm2
    echo "[+] PM2 installed"
else
    echo "[+] PM2 already installed"
fi

# Stop existing instance if running
pm2 stop molt-of-empires 2>/dev/null || true
pm2 delete molt-of-empires 2>/dev/null || true

# Start with PM2
echo "[*] Starting server with PM2..."
pm2 start server.js --name molt-of-empires

# Save PM2 process list for startup
pm2 save

# Setup startup script
echo "[*] Configuring PM2 startup..."
pm2 startup 2>/dev/null || echo "[!] Run 'pm2 startup' manually if needed"

echo ""
echo "========================================"
echo "  Setup Complete!"
echo "========================================"
echo ""
echo "Server status:"
pm2 status molt-of-empires
echo ""
echo "Useful commands:"
echo "  pm2 logs molt-of-empires  - View logs"
echo "  pm2 restart molt-of-empires - Restart server"
echo "  pm2 stop molt-of-empires - Stop server"
echo ""
