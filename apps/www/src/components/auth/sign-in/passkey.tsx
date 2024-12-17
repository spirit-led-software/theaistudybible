import { lucia } from '@/core/auth';
import {
  createWebAuthnChallenge,
  getPasskeyCredential,
  verifyWebAuthnChallenge,
} from '@/core/auth/providers/webauthn';
import {
  decodePKIXECDSASignature,
  decodeSEC1PublicKey,
  p256,
  verifyECDSASignature,
} from '@oslojs/crypto/ecdsa';
import {
  decodePKCS1RSAPublicKey,
  sha256ObjectIdentifier,
  verifyRSASSAPKCS1v15Signature,
} from '@oslojs/crypto/rsa';
import { sha256 } from '@oslojs/crypto/sha2';
import { decodeBase64, encodeBase64 } from '@oslojs/encoding';
import {
  coseAlgorithmES256,
  coseAlgorithmRS256,
  createAssertionSignatureMessage,
  parseAuthenticatorData,
  parseClientDataJSON,
} from '@oslojs/webauthn';
import { action, redirect, useAction } from '@solidjs/router';
import { createMutation } from '@tanstack/solid-query';
import { toast } from 'solid-sonner';
import { Resource } from 'sst';
import { Button, type ButtonProps } from '../../ui/button';

const createChallengeAction = action(async () => {
  'use server';
  const challenge = await createWebAuthnChallenge();
  return { challenge: encodeBase64(challenge) };
});

const signInWithPasskeyAction = action(
  async (
    input: {
      rawId: string;
      sig: string;
      authenticatorData: string;
      clientDataJSON: string;
    },
    redirectUrl = '/',
  ) => {
    'use server';
    const rawIdBytes = decodeBase64(input.rawId);
    const sigBytes = decodeBase64(input.sig);
    const authenticatorDataBytes = decodeBase64(input.authenticatorData);
    const clientDataJSONBytes = decodeBase64(input.clientDataJSON);

    const authenticatorData = parseAuthenticatorData(authenticatorDataBytes);
    if (!authenticatorData.verifyRelyingPartyIdHash(new URL(Resource.WebAppUrl.value).hostname)) {
      throw new Error('Invalid relying party ID hash');
    }
    if (!authenticatorData.userPresent || !authenticatorData.userVerified) {
      throw new Error('Invalid user presence or verification');
    }

    const clientData = parseClientDataJSON(clientDataJSONBytes);
    if (!(await verifyWebAuthnChallenge(clientData.challenge))) {
      throw new Error('Invalid challenge');
    }
    if (clientData.origin !== Resource.WebAppUrl.value) {
      throw new Error('Invalid origin');
    }
    if (clientData.crossOrigin !== null && clientData.crossOrigin) {
      throw new Error('Invalid cross origin');
    }

    const credential = await getPasskeyCredential(rawIdBytes);
    if (!credential) {
      throw new Error('Invalid credential');
    }

    let validSignature: boolean;
    if (credential.algorithmId === coseAlgorithmES256) {
      const ecdsaSignature = decodePKIXECDSASignature(sigBytes);
      const ecdsaPublicKey = decodeSEC1PublicKey(p256, credential.publicKey);
      const hash = sha256(
        createAssertionSignatureMessage(authenticatorDataBytes, clientDataJSONBytes),
      );
      validSignature = verifyECDSASignature(ecdsaPublicKey, hash, ecdsaSignature);
    } else if (credential.algorithmId === coseAlgorithmRS256) {
      const rsaPublicKey = decodePKCS1RSAPublicKey(credential.publicKey);
      const hash = sha256(
        createAssertionSignatureMessage(authenticatorDataBytes, clientDataJSONBytes),
      );
      validSignature = verifyRSASSAPKCS1v15Signature(
        rsaPublicKey,
        sha256ObjectIdentifier,
        hash,
        sigBytes,
      );
    } else {
      throw new Error('Unsupported algorithm');
    }

    if (!validSignature) {
      throw new Error('Invalid signature');
    }

    const session = await lucia.createSession(credential.userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    throw redirect(redirectUrl, {
      headers: { 'Set-Cookie': sessionCookie.serialize() },
    });
  },
);

export type PasskeyButtonProps = Omit<ButtonProps, 'onClick'> & {
  redirectUrl?: string;
  onSuccess?: () => void;
};

export const PasskeyButton = (props: PasskeyButtonProps) => {
  const createChallenge = useAction(createChallengeAction);
  const signInWithPasskey = useAction(signInWithPasskeyAction);

  const onClick = createMutation(() => ({
    mutationFn: async () => {
      const { challenge } = await createChallenge();

      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: decodeBase64(challenge),
          userVerification: 'required',
        },
      });

      if (!(credential instanceof PublicKeyCredential)) {
        toast.error('Failed to create public key');
        return;
      }
      if (!(credential.response instanceof AuthenticatorAssertionResponse)) {
        toast.error('Unexpected error');
        return;
      }

      const encodedId = encodeBase64(new Uint8Array(credential.rawId));
      const encodedSig = encodeBase64(new Uint8Array(credential.response.signature));
      const encodedAuthenticatorData = encodeBase64(
        new Uint8Array(credential.response.authenticatorData),
      );
      const encodedClientDataJSON = encodeBase64(
        new Uint8Array(credential.response.clientDataJSON),
      );

      await signInWithPasskey({
        rawId: encodedId,
        sig: encodedSig,
        authenticatorData: encodedAuthenticatorData,
        clientDataJSON: encodedClientDataJSON,
      });
    },
    onSuccess: () => props.onSuccess?.(),
    onError: (error) => toast.error(error.message),
  }));

  return (
    <Button onClick={() => onClick.mutate()} {...props}>
      Sign In
    </Button>
  );
};
