#!/bin/bash
echo "Building argon2 lambda layer..."
npm run install
mkdir -p nodejs
cp -r node_modules nodejs/
zip -r argon2-layer.zip nodejs
echo "Done!"