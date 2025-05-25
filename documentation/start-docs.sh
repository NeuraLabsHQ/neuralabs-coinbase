#!/bin/bash

echo "Starting NeuraLabs Documentation..."
echo "=================================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo "Starting Docusaurus development server..."
echo "Documentation will be available at: http://localhost:3000"
echo ""

npm start