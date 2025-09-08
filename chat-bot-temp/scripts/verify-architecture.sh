#!/bin/bash
# scripts/verify-architecture.sh
echo "=== Rule Engine Architecture Verification ==="

# Check project structure
echo "Project structure:"
find src/rule-engine -type d -print

# Check dependencies
echo "Dependencies:"
npm list --depth=0

# Check database connection
echo "Database connection:"
node -e "require('./src/config/database').testConnection().then(() => console.log('✓ Database OK')).catch(console.error)"

echo "=== Verification Completed ==="