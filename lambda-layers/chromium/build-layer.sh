#!/bin/bash
echo "Cleaning up existing node_modules..."
rm -rf node_modules
rm -rf nodejs
rm -rf chromium-*.zip

echo "Building chromium arm64 lambda layer..."
npm install @sparticuz/chromium@latest --save --target_arch=arm64 --target_platform=linux --target_libc=glibc
mkdir -p nodejs
cp -r node_modules nodejs/
zip -r chromium-arm64.zip nodejs
echo "Done!"

echo "Cleaning up existing node_modules..."
rm -rf node_modules
rm -rf nodejs

echo "Building chromium x86_64 lambda layer..."
npm install @sparticuz/chromium@latest --save --target_arch=x86_64 --target_platform=linux --target_libc=glibc
mkdir -p nodejs
cp -r node_modules nodejs/
zip -r chromium-x86_64.zip nodejs
echo "Done!"

echo "Uploading layers to S3..."
aws s3 cp chromium-arm64.zip s3://revelationsai-lambda-layer-zips/
aws s3 cp chromium-x86_64.zip s3://revelationsai-lambda-layer-zips/