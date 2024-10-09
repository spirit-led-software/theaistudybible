import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  CLOUDFLARE_IPV4_RANGES,
  CLOUDFLARE_IPV6_RANGES,
  CLOUDFLARE_ZONE_ID,
  DOMAIN,
} from './constants';
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
export let nginxContainer: docker.Container | undefined;
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

  const vpsConnection = {
    host: vps.ipv4Address,
    user: 'root',
    privateKey: $util.secret(privateKey.privateKeyOpenssh),
  };

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

  // Wait for docker to be ready, which seems unnecessary, but is necessary
  const waitForDockerReadyCmd = new command.remote.Command(
    'WaitForDockerReady',
    {
      connection: vpsConnection,
      create: 'until docker ps | grep -q "CONTAINER ID"; do sleep 1; done',
      update: 'until docker ps | grep -q "CONTAINER ID"; do sleep 1; done',
      delete: 'true',
    },
    { dependsOn: [dockerProvider, vps] },
  );

  const webAppNetwork = new docker.Network(
    'WebAppNetwork',
    { driver: 'bridge' },
    { provider: dockerProvider, dependsOn: [waitForDockerReadyCmd] },
  );

  const links = buildLinks(allLinks);
  const envs = $output(links).apply((links) => [
    $interpolate`AWS_ACCESS_KEY_ID=${vpsAwsAccessKey.id}`,
    $interpolate`AWS_SECRET_ACCESS_KEY=${$util.secret(vpsAwsAccessKey.secret)}`,
    `AWS_DEFAULT_REGION=${$app.providers?.aws.region ?? 'us-east-1'}`,
    `SST_RESOURCE_App=${JSON.stringify({
      name: $app.name,
      stage: $app.stage,
    })}`,
    ...links.map((l) => `SST_RESOURCE_${l.name}=${JSON.stringify(l.properties)}`),
    ...Object.entries(webAppEnv).map(([k, v]) => `${k}=${v}`),
  ]);
  webAppContainer = new docker.Container(
    'WebAppContainer',
    {
      image: webAppBuildImage.ref,
      envs,
      restart: 'always',
      networksAdvanced: [{ name: webAppNetwork.name }],
    },
    { provider: dockerProvider },
  );

  const webAppPrivateKey = new tls.PrivateKey('WebAppPrivateKey', {
    algorithm: 'RSA',
    rsaBits: 2048,
  });
  const webAppCsr = new tls.CertRequest('WebAppCSR', {
    privateKeyPem: webAppPrivateKey.privateKeyPem,
    subject: {
      commonName: DOMAIN.value,
      organization: 'Spirit-Led Software',
      organizationalUnit: 'The AI Study Bible',
      country: 'US',
    },
    dnsNames: [DOMAIN.value],
    ipAddresses: [vps.ipv4Address, vps.ipv6Address],
  });
  const webAppCert = new cloudflare.OriginCaCertificate('WebAppCertificate', {
    csr: webAppCsr.certRequestPem,
    hostnames: [DOMAIN.value],
    requestType: 'origin-rsa',
    requestedValidity: 5475,
  });

  const webAppNginxConf = $interpolate`
server {
  listen 443 ssl;
  server_name ${DOMAIN.value} ${vps.ipv4Address} ${vps.ipv6Address};
  ssl_certificate /etc/nginx/ssl/cert.pem;
  ssl_certificate_key /etc/nginx/ssl/key.pem;

  ${CLOUDFLARE_IPV4_RANGES.map((range) => `allow ${range};`).join('\n\t')}
  ${CLOUDFLARE_IPV6_RANGES.map((range) => `allow ${range};`).join('\n\t')}
  deny all;

  location / {
    proxy_pass http://${webAppContainer.name}:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
`;
  const createNginxFilesCmd = new command.remote.Command('CreateNginxFiles', {
    connection: vpsConnection,
    create: $interpolate`
      mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled /etc/nginx/ssl && 
      echo "${webAppNginxConf}" > /etc/nginx/sites-available/default && 
      ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default && 
      echo "${webAppCert.certificate}" > /etc/nginx/ssl/cert.pem && 
      echo "${$util.secret(webAppPrivateKey.privateKeyPem)}" > /etc/nginx/ssl/key.pem && 
      chmod 600 /etc/nginx/sites-available/default /etc/nginx/ssl/cert.pem /etc/nginx/ssl/key.pem
    `,
    update: $interpolate`
      mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled /etc/nginx/ssl && 
      echo "${webAppNginxConf}" > /etc/nginx/sites-available/default && 
      ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default && 
      echo "${webAppCert.certificate}" > /etc/nginx/ssl/cert.pem && 
      echo "${$util.secret(webAppPrivateKey.privateKeyPem)}" > /etc/nginx/ssl/key.pem && 
      chmod 600 /etc/nginx/sites-available/default /etc/nginx/ssl/cert.pem /etc/nginx/ssl/key.pem
    `,
    delete:
      'rm -f /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default /etc/nginx/ssl/cert.pem /etc/nginx/ssl/key.pem',
  });

  const nginxImage = new docker.RemoteImage(
    'NginxImage',
    { name: 'nginx:latest' },
    { provider: dockerProvider },
  );
  nginxContainer = new docker.Container(
    'NginxContainer',
    {
      image: nginxImage.repoDigest,
      ports: [{ internal: 443, external: 443 }],
      volumes: [
        { hostPath: '/etc/nginx/sites-available', containerPath: '/etc/nginx/sites-available' },
        { hostPath: '/etc/nginx/sites-enabled', containerPath: '/etc/nginx/sites-enabled' },
        { hostPath: '/etc/nginx/ssl', containerPath: '/etc/nginx/ssl' },
      ],
      restart: 'always',
      networksAdvanced: [{ name: webAppNetwork.name }],
    },
    { provider: dockerProvider, dependsOn: [createNginxFilesCmd] },
  );

  new cloudflare.Record('WebAppIpv4Record', {
    zoneId: CLOUDFLARE_ZONE_ID,
    type: 'A',
    name: $app.stage === 'production' ? '@' : $app.stage,
    value: vps.ipv4Address,
    proxied: true,
  });
  new cloudflare.Record('WebAppIpv6Record', {
    zoneId: CLOUDFLARE_ZONE_ID,
    type: 'AAAA',
    name: $app.stage === 'production' ? '@' : $app.stage,
    value: vps.ipv6Address,
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
}
