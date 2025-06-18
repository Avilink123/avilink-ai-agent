#!/bin/bash

# Avilink AI Agent Setup Script
# This script helps set up the development environment

set -e

echo "🚀 Setting up Avilink AI Agent..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created. Please edit it with your API keys."
else
    echo "✅ .env file already exists."
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p uploads logs scripts

# Set permissions
chmod +x scripts/*.sh

echo "🔧 Building Docker containers..."
docker-compose build

echo "🗄️ Starting database..."
docker-compose up -d postgres redis

echo "⏳ Waiting for database to be ready..."
sleep 10

echo "🔄 Running database migrations..."
docker-compose run --rm avilink-app npx prisma migrate deploy

echo "🌱 Seeding database (if seed script exists)..."
docker-compose run --rm avilink-app npx prisma db seed || echo "No seed script found, skipping..."

echo "✅ Setup complete!"
echo ""
echo "🎉 Avilink AI Agent is ready to run!"
echo ""
echo "To start the application:"
echo "  docker-compose up"
echo ""
echo "To start in detached mode:"
echo "  docker-compose up -d"
echo ""
echo "To view logs:"
echo "  docker-compose logs -f avilink-app"
echo ""
echo "The application will be available at: http://localhost:3000"
echo ""
echo "⚠️  Don't forget to:"
echo "1. Edit the .env file with your API keys"
echo "2. Configure your LLM provider settings"
echo "3. Set up your search API keys for DeepSearch functionality"