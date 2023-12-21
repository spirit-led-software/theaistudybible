#!/bin/bash
echo "Cleaning up existing node_modules..."
rm -rf node_modules
rm -rf nodejs
rm -rf argon2-*.zip

echo "Building argon2 arm64 lambda layer..."
npm install argon2@latest --save --target_arch=arm64 --target_platform=linux --target_libc=glibc
mkdir -p nodejs
cp -r node_modules nodejs/
zip -r argon2-arm64.zip nodejs
echo "Done!"

echo "Cleaning up existing node_modules..."
rm -rf node_modules
rm -rf nodejs

echo "Building argon2 x86_64 lambda layer..."
npm install argon2@latest --save --target_arch=x86_64 --target_platform=linux --target_libc=glibc
mkdir -p nodejs
cp -r node_modules nodejs/
zip -r argon2-x86_64.zip nodejs
echo "Done!"

echo "Uploading layers to S3..."
aws s3 cp argon2-arm64.zip s3://revelationsai-lambda-layer-zips/
aws s3 cp argon2-x86_64.zip s3://revelationsai-lambda-layer-zips/
