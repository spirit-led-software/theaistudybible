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

echo "Cleaning up existing node_modules..."
rm -rf node_modules
rm -rf nodejs

echo "Building argon2 x86_64 lambda layer..."
npm install argon2@latest --save --target_arch=x86_64 --target_platform=linux --target_libc=glibc
mkdir -p nodejs
cp -r node_modules nodejs/
zip -r argon2-x86_64.zip nodejs

echo "Uploading layers to S3..."
aws s3 cp argon2-arm64.zip s3://revelationsai-lambda-layer-zips/
aws s3 cp argon2-x86_64.zip s3://revelationsai-lambda-layer-zips/

echo "Publishing layers..."
aws lambda publish-layer-version --layer-name argon2-arm64 --description "Argon2 for ARM64" --content "S3Bucket=revelationsai-lambda-layer-zips,S3Key=argon2-arm64.zip" --compatible-runtimes "nodejs20.x" "nodejs18.x" --compatible-architectures arm64 --no-paginate 1>/dev/null
aws lambda publish-layer-version --layer-name argon2-x86_64 --description "Argon2 for x86_64" --content "S3Bucket=revelationsai-lambda-layer-zips,S3Key=argon2-x86_64.zip" --compatible-runtimes "nodejs20.x" "nodejs18.x" --compatible-architectures x86_64 --no-paginate 1>/dev/null

echo "Done!"
