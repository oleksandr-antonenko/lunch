#!/bin/bash
set -e

echo "Exporting OpenAPI spec..."
cd apps/api && pnpm run openapi:export
cd ../..

echo "Generating API client..."
cd packages/api-client && pnpm run generate
cd ../..

echo "Done! API client regenerated."
