import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CLOUDFLARE_ZONE_ID, DOMAIN } from './constants';
import { allLinks } from './defaults';
import { email } from './email';
import { buildLinks } from './helpers/link';
import * as queues from './queues';
import { cloudflareHelpers } from './resources';
import * as storage from './storage';
import { webAppBuildImage, webAppEnv, webAppImageRepo } from './www';

export let vps: hcloud.Server | undefined;
export let dockerProvider: docker.Provider | undefined;
export let webAppContainer: docker.Container | undefined;
export let webAppIpv4Record: cloudflare.Record | undefined;
export let webAppIpv6Record: cloudflare.Record | undefined;
if (!$dev) {
  const vpsIamPolicy = new aws.iam.Policy('VpsIamPolicy', {
    name: `${$app.name}-${$app.stage}-vps`,
    policy: {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: ['s3:*'],
          Resource: Object.values(storage).map((b) => b.nodes.bucket.arn),
        },
        {
          Effect: 'Allow',
          Action: ['sqs:*'],
          Resource: Object.values(queues).map((q) => q.arn),
        },
        {
          Effect: 'Allow',
          Action: ['ses:*'],
          Resource: [email.nodes.identity.arn],
        },
      ],
    },
  });
  const vpsIamUser = new aws.iam.User('VpsIamUser', {
    name: `${$app.name}-${$app.stage}-vps`,
  });
  new aws.iam.UserPolicyAttachment('VpsUserPolicyAttachment', {
    user: vpsIamUser.name,
    policyArn: vpsIamPolicy.arn,
  });
  const vpsAwsAccessKey = new aws.iam.AccessKey('VpsAccessKey', {
    user: vpsIamUser.name,
  });

  const privateKey = new tls.PrivateKey('PrivateKey', {
    algorithm: 'RSA',
    rsaBits: 4096,
  });
  const publicKey = new hcloud.SshKey('PublicKey', {
    publicKey: privateKey.publicKeyOpenssh,
  });

  vps = new hcloud.Server('Server', {
    location: 'ash',
    image: 'debian-12',
    serverType: 'cpx11',
    sshKeys: [publicKey.id],
    userData: [
      '#!/bin/bash',
      'apt-get update',
      'apt-get install -y docker.io apparmor',
      'systemctl enable --now docker',
      'usermod -aG docker debian',
    ].join('\n'),
  });

  const keyPath = privateKey.privateKeyOpenssh.apply((key) => {
    const path = 'key_rsa';
    writeFileSync(path, key, { mode: 0o600 });
    return resolve(path);
  });

  dockerProvider = new docker.Provider('DockerProvider', {
    host: $interpolate`ssh://root@${vps.ipv4Address}`,
    sshOpts: ['-i', keyPath, '-o', 'StrictHostKeyChecking=no'],
    registryAuth: [
      aws.ecr
        .getAuthorizationTokenOutput({
          registryId: webAppImageRepo.id,
        })
        .apply((auth) => ({
          address: auth.proxyEndpoint,
          username: auth.userName,
          password: $util.secret(auth.password),
        })),
    ],
  });

  const webAppPrivateKey = new tls.PrivateKey('WebAppPrivateKey', {
    algorithm: 'RSA',
    rsaBits: 2048,
  });
  const csr = new tls.CertRequest('WebAppCSR', {
    privateKeyPem: webAppPrivateKey.privateKeyPem,
    subject: {
      commonName: DOMAIN.value,
      organization: 'Spirit-Led Software',
      organizationalUnit: 'The AI Study Bible',
      country: 'US',
    },
    dnsNames: [DOMAIN.value, `www.${DOMAIN.value}`],
    ipAddresses: [vps!.ipv4Address, vps!.ipv6Address],
  });
  const cert = new cloudflare.OriginCaCertificate('WebAppCertificate', {
    csr: csr.certRequestPem,
    hostnames: [DOMAIN.value],
    requestType: 'origin-rsa',
    requestedValidity: 5475,
  });

  const envs = buildEnvs();
  webAppContainer = new docker.Container(
    'WebAppContainer',
    {
      image: webAppBuildImage.ref,
      ports: [{ internal: 3000, external: 443 }],
      envs,
      restart: 'always',
    },
    { provider: dockerProvider, dependsOn: [vps!] },
  );

  webAppIpv4Record = new cloudflare.Record('WebAppIpv4Record', {
    zoneId: CLOUDFLARE_ZONE_ID,
    type: 'A',
    name: $app.stage === 'production' ? '@' : $app.stage,
    value: vps!.ipv4Address,
    proxied: true,
  });
  webAppIpv6Record = new cloudflare.Record('WebAppIpv6Record', {
    zoneId: CLOUDFLARE_ZONE_ID,
    type: 'AAAA',
    name: $app.stage === 'production' ? '@' : $app.stage,
    value: vps!.ipv6Address,
    proxied: true,
  });

  if ($app.stage === 'production') {
    const ruleset = new cloudflare.Ruleset(
      `${$app.stage}-CacheRuleset`,
      {
        kind: 'zone',
        zoneId: CLOUDFLARE_ZONE_ID,
        name: `${$app.stage}-cacheruleset`,
        phase: 'http_request_cache_settings',
        rules: [
          {
            expression:
              '(http.request.uri.path.extension in {"7z" "avi" "avif" "apk" "bin" "bmp" "br" "bz2" "class" "css" "csv" "doc" "docx" "dmg" "ejs" "eot" "eps" "exe" "flac" "gif" "gz" "ico" "iso" "jar" "jpg" "jpeg" "js" "mid" "midi" "mkv" "mp3" "mp4" "ogg" "otf" "pdf" "pict" "pls" "png" "ppt" "pptx" "ps" "rar" "svg" "svgz" "swf" "tar" "tif" "tiff" "ttf" "webm" "webp" "woff" "woff2" "xls" "xlsx" "zip" "zst"}) or (http.request.uri.path matches "^\\/bible\\/(?!(highlights|notes|bookmarks))(.*[^\\/])$")',
            action: 'set_cache_settings',
            actionParameters: {
              cache: true,
              edgeTtl: {
                mode: 'override_origin',
                default: 60 * 60 * 24, // 1 day in seconds
              },
              browserTtl: { mode: 'respect_origin' },
            },
          },
        ],
      },
      { dependsOn: [webAppContainer] },
    );
    new cloudflareHelpers.PurgeCache(
      'PurgeCache',
      { zoneId: CLOUDFLARE_ZONE_ID, purge_everything: true },
      { dependsOn: [ruleset] },
    );
  }

  function buildEnvs() {
    const links = buildLinks(allLinks);
    const envs = $output([links]).apply(([links]) => [
      $interpolate`AWS_ACCESS_KEY_ID=${vpsAwsAccessKey.id}`,
      $interpolate`AWS_SECRET_ACCESS_KEY=${$util.secret(vpsAwsAccessKey.secret)}`,
      `AWS_DEFAULT_REGION=${$app.providers?.aws.region ?? 'us-east-1'}`,
      $interpolate`NITRO_SSL_CERT=${cert.certificate}`,
      $interpolate`NITRO_SSL_KEY=${$util.secret(webAppPrivateKey.privateKeyPem)}`,
      `SST_RESOURCE_App=${JSON.stringify({
        name: $app.name,
        stage: $app.stage,
      })}`,
      ...links.map((l) => `SST_RESOURCE_${l.name}=${JSON.stringify(l.properties)}`),
      ...Object.entries(webAppEnv).map(([k, v]) => `${k}=${v}`),
    ]);
    return envs;
  }
}
