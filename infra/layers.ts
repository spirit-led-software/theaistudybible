export const chromiumLayer = await aws.lambda.getLayerVersion({
  layerName: `chromium`,
});

export const llrtArm64Layer = await aws.lambda.getLayerVersion({
  layerName: `llrt-arm64`,
});

export const llrtX64Layer = await aws.lambda.getLayerVersion({
  layerName: `llrt-x64`,
});
