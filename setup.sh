#!/bin/bash

# Scholark Setup Script
# This script sets up the Scholark project with all necessary dependencies

echo "🚀 Setting up Scholark..."

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install pnpm first:"
    echo "npm install -g pnpm"
    exit 1
fi

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ bun is not installed. Please install bun first:"
    echo "curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ docker is not installed. Please install docker first."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install docker-compose first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "🔧 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️ Please update the .env file with your Google OAuth credentials."
fi

# Start Docker containers
echo "🐳 Starting Docker containers..."
pnpm docker:up

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Generate database schema
echo "🗃️ Generating database schema..."
pnpm db:generate

# Run database migrations
echo "🔄 Running database migrations..."
pnpm db:migrate

# Install concurrently if not already installed
echo "📦 Installing concurrently..."
pnpm add -D concurrently

echo "✅ Setup completed successfully!"
echo ""
echo "🚀 To start the development server, run:"
echo "pnpm dev"
echo ""
echo "🌐 Then open your browser and navigate to: http://localhost:3000"
echo ""
echo "📊 To view and edit the database, run:"
echo "pnpm db:studio"
