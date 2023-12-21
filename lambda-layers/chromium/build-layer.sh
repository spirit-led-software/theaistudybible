#!/bin/bash
layerUrl=$1

echo "Building layer from ${layerUrl}"

echo "Deleting old chromium.zip"
rm -rf chromium.zip

echo "Downloading chromium.zip"
curl -SL ${layerUrl} > chromium.zip

bucketName="revelationsai-lambda-layer-zips"

echo "Uploading chromium.zip to S3"
aws s3 cp chromium.zip "s3://${bucketName}/"

echo "Publishing layer"
aws lambda publish-layer-version --layer-name chromium --description "Chromium" --content "S3Bucket=${bucketName},S3Key=chromium.zip" --compatible-runtimes nodejs --compatible-architectures x86_64 --no-paginate

echo "Done!"