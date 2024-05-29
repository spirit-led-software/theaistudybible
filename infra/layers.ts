export const chromiumLayer = await aws.lambda.getLayerVersion({
  layerName: `chromium`,
  version: 16
});
