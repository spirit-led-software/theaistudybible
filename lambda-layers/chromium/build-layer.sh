#!/bin/bash

layerUrl=$(curl -s https://api.github.com/repos/Sparticuz/chromium/releases/latest \
| grep "browser_download_url.*-layer.zip" \
| cut -d : -f 2,3 \
| tr -d \")

echo "Building layer from ${layerUrl}"

echo "Deleting old chromium.zip"
rm -rf chromium.zip

echo "Installing @sparticuz/chromium"
npm install @sparticuz/chromium@latest --save

echo "Downloading chromium.zip"
curl -SL ${layerUrl} > chromium.zip

bucketName="theaistudybible-lambda-layer-zips"

echo "Uploading chromium.zip to S3"
aws s3 cp chromium.zip "s3://${bucketName}/"

echo "Publishing layer"
aws lambda publish-layer-version --layer-name chromium --description "Chromium" --content "S3Bucket=${bucketName},S3Key=chromium.zip" --compatible-runtimes "nodejs18.x" --compatible-architectures x86_64 --no-paginate 1>/dev/null

echo "Done!"
