#!/bin/bash

echo "Running NeuraLabs Test Suite"
echo "============================"

# Check environment
if [ -z "$PACKAGE_ID" ]; then
    echo "Error: PACKAGE_ID not set. Please deploy contract first."
    exit 1
fi

# Run Move tests
echo -e "\n1. Running Move unit tests..."
cd ../
sui move test

# Run Python integration tests
echo -e "\n2. Running Python integration tests..."
cd scripts
conda activate neuralabs-exec
pytest test_integration.py -v

# Run JavaScript tests
echo -e "\n3. Running JavaScript Seal tests..."
npm test seal-integration.test.js

# Run E2E tests
echo -e "\n4. Running end-to-end tests..."
python e2e_workflow_test.py

echo -e "\nTest suite complete!"