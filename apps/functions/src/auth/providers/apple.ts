import { generators, Issuer } from 'openid-client';
import { useCookie, useDomainName, useFormData, usePath } from 'sst/node/api';
import { createAdapter } from 'sst/node/auth';
import type { OidcBasicConfig } from 'sst/node/auth/adapter/oidc';

export interface AppleConfig extends OidcBasicConfig {
  scope: string;
  clientSecret: string;
}

export const AppleAdapter = createAdapter((config: AppleConfig) => {
  return async function () {
    const [step] = usePath().slice(-1);
    const callback =
      'https://' + [useDomainName(), ...usePath().slice(0, -1), 'callback'].join('/');

    const issuer = await Issuer.discover('https://appleid.apple.com');
    const client = new issuer.Client({
      client_id: config.clientID,
      client_secret: config.clientSecret,
      redirect_uris: [callback],
      response_types: ['code']
    });

    if (step === 'authorize') {
      const code_verifier = generators.codeVerifier();
      const state = generators.state();
      const code_challenge = generators.codeChallenge(code_verifier);

      const url = client.authorizationUrl({
        scope: config.scope,
        response_mode: 'form_post',
        state,
        code_challenge,
        code_challenge_method: 'S256'
      });

      const expires = new Date(Date.now() + 1000 * 120).toUTCString();
      return {
        statusCode: 302,
        cookies: [
          `auth-code-verifier=${code_verifier}; HttpOnly; expires=${expires}`,
          `auth-state=${state}; HttpOnly; expires=${expires}`
        ],
        headers: {
          location: url
        }
      };
    }

    if (step === 'callback') {
      const form = useFormData();
      if (!form) throw new Error('Missing body');
      const params = Object.fromEntries(form.entries());

      const code_verifier = useCookie('auth-code-verifier');
      const state = useCookie('auth-state');

      const tokenset = await client.callback(callback, params, {
        code_verifier,
        state
      });

      return config.onSuccess(tokenset, client);
    }

    throw new Error('Invalid auth request');
  };
});
