#!/bin/bash

# Excel to MSSQL Importer - Startup Script

echo "🚀 Starting Excel to MSSQL Importer..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    
    # Generate Laravel app key
    cd backend && php artisan key:generate --force
    cd ..
fi

# Set required environment variables
export MYSQL_PASSWORD="password"
export MSSQL_SERVER="${MSSQL_SERVER:-localhost}"
export MSSQL_DATABASE="${MSSQL_DATABASE:-tempdb}"

# Start Docker containers
echo "🐳 Starting Docker containers..."
docker-compose up -d

# Wait for MySQL to be ready
echo "⏳ Waiting for MySQL to initialize (30 seconds)..."
sleep 30

# Build and start Laravel application
cd backend
echo "🔨 Building Laravel application..."
composer install --no-dev --optimize-autoloader
php artisan config:cache
php artisan route:cache

echo ""
echo "✅ Excel Importer is ready!"
echo ""
echo "Access the application at:"
echo "  🌐 http://localhost:8000"
echo ""
echo "To stop the services:"
echo "  docker-compose down"
echo ""
echo "Logs:"
echo "  docker-compose logs -f app"
