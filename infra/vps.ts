import fs from 'node:fs';
import path from 'node:path';
import { CLOUDFLARE_IP_RANGES, CLOUDFLARE_ZONE, DOMAIN } from './constants';
import { allLinks } from './defaults';
import { buildLinks } from './helpers/link';
import * as queues from './queues';
import { cloudflareHelpers } from './resources';
import * as storage from './storage';
import { webAppBuildImage, webAppEnv, webAppImageRepo } from './www';

export let vps: hcloud.Server | undefined;
export let dockerProvider: docker.Provider | undefined;
export let webAppService: docker.Service | undefined;
export let nginxService: docker.Service | undefined;
if (!$dev) {
  const firewall = new hcloud.Firewall('VpsFirewall', {
    rules: [
      {
        direction: 'in',
        protocol: 'tcp',
        port: '22',
        sourceIps: ['0.0.0.0/0'],
      },
      {
        direction: 'in',
        protocol: 'tcp',
        port: '443',
        sourceIps: $util
          .all([CLOUDFLARE_IP_RANGES.ipv4CidrBlocks, CLOUDFLARE_IP_RANGES.ipv6CidrBlocks])
          .apply(([ipv4, ipv6]) => [...ipv4, ...ipv6]),
      },
    ],
  });

  const { vpsAwsAccessKey } = buildVpsIamUser();

  const privateKey = new tls.PrivateKey('VpsPrivateKey', {
    algorithm: 'RSA',
    rsaBits: 4096,
  });
  const publicKey = new hcloud.SshKey('VpsPublicKey', {
    publicKey: privateKey.publicKeyOpenssh,
  });
  vps = new hcloud.Server('Vps', {
    location: 'ash',
    image: 'debian-12',
    serverType: 'cpx11',
    sshKeys: [publicKey.id],
    firewallIds: firewall.id.apply((id) => [Number(id)]),
  });
  const vpsConnection = {
    host: vps.ipv4Address,
    user: 'root',
    privateKey: $util.secret(privateKey.privateKeyOpenssh),
  };

  const keyPath = $util.all([vps.name, privateKey.privateKeyOpenssh]).apply(([vpsName, key]) => {
    const keyPath = path.join(process.cwd(), `${vpsName}-key_rsa`);
    fs.writeFileSync(keyPath, key, { mode: 0o600 });
    return path.resolve(keyPath);
  });

  const { dockerProvider: createdDockerProvider, dockerSwarmInitCmd } = buildDockerProvider();
  dockerProvider = createdDockerProvider;

  const webAppNetwork = new docker.Network(
    'WebAppNetwork',
    {
      driver: 'overlay',
      attachable: true,
    },
    { provider: dockerProvider, dependsOn: [dockerSwarmInitCmd] },
  );
  webAppService = buildWebAppService();
  nginxService = buildNginxService();

  buildCloudflareRecordsAndCache();

  function buildVpsIamUser() {
    const vpsIamPolicy = new aws.iam.Policy('VpsIamPolicy', {
      policy: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:*'],
            Resource: Object.values(storage).flatMap((b) => [
              b.nodes.bucket.arn,
              $interpolate`${b.nodes.bucket.arn}/*`,
            ]),
          },
          {
            Effect: 'Allow',
            Action: ['sqs:*'],
            Resource: Object.values(queues).map((q) => q.arn),
          },
        ],
      },
    });
    const vpsIamUser = new aws.iam.User('VpsIamUser');
    new aws.iam.UserPolicyAttachment('VpsUserPolicyAttachment', {
      user: vpsIamUser.name,
      policyArn: vpsIamPolicy.arn,
    });
    const vpsAwsAccessKey = new aws.iam.AccessKey('VpsAccessKey', {
      user: vpsIamUser.name,
    });
    return { vpsIamUser, vpsAwsAccessKey };
  }

  function buildDockerProvider() {
    const dockerInstallCmd = new command.remote.Command(
      'VpsDockerInstall',
      {
        connection: vpsConnection,
        create: [
          'apt-get update',
          'apt-get install -y docker.io apparmor',
          'systemctl enable --now docker',
          'usermod -aG docker $(whoami)',
        ].join(' && '),
        delete: ['systemctl disable --now docker', 'apt-get remove -y docker.io apparmor'].join(
          ' && ',
        ),
      },
      { parent: vps },
    );

    const dockerProvider = new docker.Provider(
      'VpsDockerProvider',
      {
        host: $interpolate`ssh://root@${vps!.ipv4Address}`,
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
      },
      { dependsOn: [dockerInstallCmd], parent: vps },
    );

    const dockerSwarmInitCmd = new command.remote.Command(
      'VpsDockerSwarmInit',
      {
        connection: vpsConnection,
        create: 'docker swarm init',
        delete: 'docker swarm leave --force',
      },
      { dependsOn: [dockerInstallCmd], parent: vps },
    );

    return { dockerProvider, dockerInstallCmd, dockerSwarmInitCmd };
  }

  function buildCloudflareRecordsAndCache() {
    new cloudflare.Record(
      'WebAppIpv4Record',
      {
        zoneId: CLOUDFLARE_ZONE.zoneId,
        type: 'A',
        name: $app.stage === 'production' ? '@' : $app.stage,
        value: vps!.ipv4Address,
        proxied: true,
      },
      { dependsOn: [webAppService!, nginxService!] },
    );
    new cloudflare.Record(
      'WebAppIpv6Record',
      {
        zoneId: CLOUDFLARE_ZONE.zoneId,
        type: 'AAAA',
        name: $app.stage === 'production' ? '@' : $app.stage,
        value: vps!.ipv6Address,
        proxied: true,
      },
      { dependsOn: [webAppService!, nginxService!] },
    );
    if ($app.stage === 'production') {
      const ruleset = new cloudflare.Ruleset(
        `${$app.stage}-CacheRuleset`,
        {
          kind: 'zone',
          zoneId: CLOUDFLARE_ZONE.zoneId,
          name: `${$app.stage}-cacheruleset`,
          phase: 'http_request_cache_settings',
          rules: [
            {
              expression:
                '(http.request.uri.path.extension in {"7z" "avi" "avif" "apk" "bin" "bmp" "bz2" "class" "css" "csv" "doc" "docx" "dmg" "ejs" "eot" "eps" "exe" "flac" "gif" "gz" "ico" "iso" "jar" "jpg" "jpeg" "js" "mid" "midi" "mkv" "mp3" "mp4" "ogg" "otf" "pdf" "pict" "pls" "png" "ppt" "pptx" "ps" "rar" "svg" "svgz" "swf" "tar" "tif" "tiff" "ttf" "webm" "webp" "woff" "woff2" "xls" "xlsx" "zip" "zst"})',
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
        { dependsOn: [webAppService!, nginxService!] },
      );
      new cloudflareHelpers.PurgeCache(
        'PurgeCache',
        {
          zoneId: CLOUDFLARE_ZONE.zoneId,
          triggers: [webAppService!.id],
          purge_everything: true,
        },
        { dependsOn: [ruleset] },
      );
    }
  }

  function buildWebAppService() {
    const links = buildLinks(allLinks);
    return new docker.Service(
      'WebAppService',
      {
        taskSpec: {
          containerSpec: {
            image: webAppBuildImage!.ref,
            env: {
              AWS_ACCESS_KEY_ID: vpsAwsAccessKey.id,
              AWS_SECRET_ACCESS_KEY: $util.secret(vpsAwsAccessKey.secret),
              AWS_REGION: $app.providers?.aws.region ?? 'us-east-1',
              SST_RESOURCE_App: JSON.stringify({
                name: $app.name,
                stage: $app.stage,
              }),
              ...webAppEnv,
              ...$output(links).apply((links) =>
                links.reduce(
                  (acc, l) => {
                    acc[`SST_RESOURCE_${l.name}`] = JSON.stringify(l.properties);
                    return acc;
                  },
                  {} as Record<string, string>,
                ),
              ),
            },
            healthcheck: {
              tests: ['CMD-SHELL', 'curl -f http://localhost:3000/health || exit 1'],
              interval: '30s',
              timeout: '10s',
              retries: 3,
              startPeriod: '40s',
            },
          },
          restartPolicy: {
            condition: 'any',
            delay: '5s',
            maxAttempts: 10,
            window: '120s',
          },
          networksAdvanceds: [{ name: webAppNetwork.name }],
        },
        updateConfig: {
          parallelism: 1,
          delay: '10s',
          order: 'start-first',
          failureAction: 'rollback',
        },
      },
      { provider: dockerProvider, dependsOn: [dockerSwarmInitCmd] },
    );
  }

  function buildNginxService() {
    const webAppPrivateKey = new tls.PrivateKey('WebAppPrivateKey', { algorithm: 'RSA' });
    const webAppCsr = new tls.CertRequest('WebAppCSR', {
      privateKeyPem: webAppPrivateKey.privateKeyPem,
      subject: {
        commonName: DOMAIN.value,
        organization: 'Spirit-Led Software',
        organizationalUnit: 'The AI Study Bible',
        country: 'US',
      },
      dnsNames: [DOMAIN.value],
      ipAddresses: [vps!.ipv4Address, vps!.ipv6Address],
    });
    const webAppCert = new cloudflare.OriginCaCertificate('WebAppCertificate', {
      csr: webAppCsr.certRequestPem,
      hostnames: [DOMAIN.value],
      requestType: 'origin-rsa',
      requestedValidity: 5475,
    });
    const nginxCert = new docker.Secret(
      'NginxCert',
      { data: webAppCert.certificate.apply((cert) => Buffer.from(cert).toString('base64')) },
      { provider: dockerProvider, dependsOn: [dockerSwarmInitCmd] },
    );
    const nginxKey = new docker.Secret(
      'NginxKey',
      {
        data: $util
          .secret(webAppPrivateKey.privateKeyPem)
          .apply((key) => Buffer.from(key).toString('base64')),
      },
      { provider: dockerProvider, dependsOn: [dockerSwarmInitCmd] },
    );

    const webAppNginxConf = buildNginxConfig();
    const nginxConfig = new docker.ServiceConfig(
      'NginxConfig',
      { data: webAppNginxConf.apply((conf) => Buffer.from(conf).toString('base64')) },
      { provider: dockerProvider, dependsOn: [dockerSwarmInitCmd] },
    );

    const nginxImage = new docker.RemoteImage(
      'NginxImage',
      { name: 'nginx:latest' },
      { provider: dockerProvider },
    );
    return new docker.Service(
      'NginxService',
      {
        taskSpec: {
          containerSpec: {
            image: nginxImage.repoDigest,
            configs: [
              {
                configId: nginxConfig.id,
                configName: nginxConfig.name,
                fileName: '/etc/nginx/conf.d/default.conf',
              },
            ],
            secrets: [
              {
                secretId: nginxCert.id,
                secretName: nginxCert.name,
                fileName: '/etc/nginx/ssl/cert.pem',
              },
              {
                secretId: nginxKey.id,
                secretName: nginxKey.name,
                fileName: '/etc/nginx/ssl/key.pem',
              },
            ],
            healthcheck: {
              tests: ['CMD-SHELL', 'curl -kf https://localhost:443/health || exit 1'],
              interval: '30s',
              timeout: '10s',
              retries: 3,
              startPeriod: '40s',
            },
          },
          restartPolicy: {
            condition: 'any',
            delay: '5s',
            maxAttempts: 10,
            window: '120s',
          },
          networksAdvanceds: [{ name: webAppNetwork.name }],
        },
        endpointSpec: {
          ports: [{ targetPort: 443, publishedPort: 443 }],
        },
        updateConfig: {
          parallelism: 1,
          delay: '10s',
          order: 'start-first',
          failureAction: 'rollback',
        },
      },
      { provider: dockerProvider },
    );
  }

  function buildNginxConfig() {
    return $interpolate`
server {
  server_name ${DOMAIN.value} ${vps!.ipv4Address} ${vps!.ipv6Address};

  listen 443 ssl;
  listen [::]:443 ssl;
  http2 on;

  ssl_certificate /etc/nginx/ssl/cert.pem;
  ssl_certificate_key /etc/nginx/ssl/key.pem;

  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_prefer_server_ciphers on;
  ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
  ssl_session_cache shared:SSL:10m;
  ssl_session_timeout 1d;
  ssl_session_tickets off;

  location / {
    proxy_pass http://${webAppService!.name}:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port $server_port;

    proxy_http_version 1.1;
    proxy_set_header Connection "";

    proxy_connect_timeout 300s;
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;

    proxy_buffering off;
    proxy_request_buffering off;

    keepalive_timeout 300s;
    keepalive_requests 100;
  }
}
    `;
  }
}
