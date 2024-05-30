#!/bin/bash

echo "=============================================="
echo "Building x64 layer"
layerUrl=$(curl -s https://api.github.com/repos/awslabs/llrt/releases/latest \
| grep "browser_download_url.*-lambda-x64.zip" \
| cut -d : -f 2,3 \
| tr -d \")

echo "Building layer from ${layerUrl}"

echo "Deleting old llrt-x64.zip"
rm -rf llrt-x64.zip

echo "Downloading zip"
curl -SL ${layerUrl} > llrt-x64.zip

bucketName="theaistudybible-lambda-layer-zips"

echo "Uploading zip to S3"
aws s3 cp llrt-x64.zip "s3://${bucketName}/"

echo "Publishing layer"
aws lambda publish-layer-version --layer-name llrt-x64 --description "LLRT" --content "S3Bucket=${bucketName},S3Key=llrt-x64.zip" --compatible-runtimes "provided.al2023" --compatible-architectures x86_64 --no-paginate 1>/dev/null

echo "Done!"


echo "=============================================="
echo "Building arm64 layer"
layerUrl=$(curl -s https://api.github.com/repos/awslabs/llrt/releases/latest \
| grep "browser_download_url.*-lambda-arm64.zip" \
| cut -d : -f 2,3 \
| tr -d \")

echo "Building layer from ${layerUrl}"

echo "Deleting old llrt-arm64.zip"
rm -rf llrt-arm64.zip

echo "Downloading zip"
curl -SL ${layerUrl} > llrt-arm64.zip

bucketName="theaistudybible-lambda-layer-zips"

echo "Uploading zip to S3"
aws s3 cp llrt-arm64.zip "s3://${bucketName}/"

echo "Publishing layer"
aws lambda publish-layer-version --layer-name llrt-arm64 --description "LLRT" --content "S3Bucket=${bucketName},S3Key=llrt-arm64.zip" --compatible-runtimes "provided.al2023" --compatible-architectures arm64 --no-paginate 1>/dev/null

echo "Done!"
