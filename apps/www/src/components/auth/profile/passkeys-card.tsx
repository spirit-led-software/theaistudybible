import {
  type WebAuthnUserCredential,
  createPasskeyCredential,
  createWebAuthnChallenge,
  deleteUserPasskeyCredential,
  getUserPasskeyCredentials,
  verifyWebAuthnChallenge,
} from '@/core/auth/providers/webauthn';
import { QueryBoundary } from '@/www/components/query-boundary';
import { useAuth } from '@/www/contexts/auth';
import { requireAuth } from '@/www/server/auth';
import { bigEndian } from '@oslojs/binary';
import { ECDSAPublicKey, p256 } from '@oslojs/crypto/ecdsa';
import { RSAPublicKey } from '@oslojs/crypto/rsa';
import { decodeBase64, encodeBase64 } from '@oslojs/encoding';
import {
  AttestationStatementFormat,
  ClientDataType,
  coseAlgorithmES256,
  coseAlgorithmRS256,
  coseEllipticCurveP256,
  parseAttestationObject,
  parseClientDataJSON,
} from '@oslojs/webauthn';
import { action, useAction } from '@solidjs/router';
import { GET } from '@solidjs/start';
import { createMutation, createQuery } from '@tanstack/solid-query';
import { murmurHash } from 'ohash';
import { For, createSignal } from 'solid-js';
import { toast } from 'solid-sonner';
import { Resource } from 'sst';
import { Button } from '../../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import { P } from '../../ui/typography';

const getPasskeys = GET(async () => {
  'use server';
  const { user } = requireAuth();
  const passkeys = await getUserPasskeyCredentials(user.id);
  return {
    passkeys: passkeys.map((passkey) => ({
      ...passkey,
      id: encodeBase64(passkey.id),
      publicKey: encodeBase64(passkey.publicKey),
    })),
  };
});

const deletePasskeyAction = action(async (passkeyId: string) => {
  'use server';
  const { user } = requireAuth();
  const success = await deleteUserPasskeyCredential(user.id, decodeBase64(passkeyId));
  return { success };
});

const createChallengeAction = action(async () => {
  'use server';
  const { user } = requireAuth();
  const credentialsId = new Uint8Array(8);
  bigEndian.putUint64(credentialsId, BigInt(murmurHash(user.email)), 0);

  const challenge = await createWebAuthnChallenge();
  return { challenge: encodeBase64(challenge), credentialsId };
});

const createPasskeyAction = action(
  async (input: {
    attestationObject: string;
    clientDataJSON: string;
    name: string;
  }) => {
    'use server';
    const { user } = requireAuth();

    const attestationObjectBytes = decodeBase64(input.attestationObject);
    const clientDataJSON = decodeBase64(input.clientDataJSON);

    const attestationObject = parseAttestationObject(attestationObjectBytes);
    const attestationStatement = attestationObject.attestationStatement;
    const authenticatorData = attestationObject.authenticatorData;

    if (attestationStatement.format !== AttestationStatementFormat.None) {
      throw new Error('Invalid attestation statement format');
    }
    if (!authenticatorData.verifyRelyingPartyIdHash(new URL(Resource.WebAppUrl.value).hostname)) {
      throw new Error('Invalid relying party ID hash');
    }
    if (!authenticatorData.userPresent || !authenticatorData.userVerified) {
      throw new Error('Invalid user presence or verification');
    }
    if (authenticatorData.credential === null) {
      throw new Error('Invalid credential');
    }

    const clientData = parseClientDataJSON(clientDataJSON);
    if (clientData.type !== ClientDataType.Create) {
      throw new Error('Invalid client data type');
    }

    if (!(await verifyWebAuthnChallenge(clientData.challenge))) {
      throw new Error('Invalid challenge');
    }
    if (clientData.origin !== Resource.WebAppUrl.value) {
      throw new Error('Invalid origin');
    }
    if (clientData.crossOrigin !== null && clientData.crossOrigin) {
      throw new Error('Invalid cross origin');
    }

    let credential: WebAuthnUserCredential;
    if (authenticatorData.credential.publicKey.algorithm() === coseAlgorithmES256) {
      const cosePublicKey = authenticatorData.credential.publicKey.ec2();
      if (cosePublicKey.curve !== coseEllipticCurveP256) {
        throw new Error('Unsupported algorithm');
      }
      const encodedPublicKey = new ECDSAPublicKey(
        p256,
        cosePublicKey.x,
        cosePublicKey.y,
      ).encodeSEC1Uncompressed();
      credential = {
        id: authenticatorData.credential.id,
        userId: user.id,
        algorithmId: coseAlgorithmES256,
        name: input.name,
        publicKey: encodedPublicKey,
      };
    } else if (authenticatorData.credential.publicKey.algorithm() === coseAlgorithmRS256) {
      const cosePublicKey = authenticatorData.credential.publicKey.rsa();
      const encodedPublicKey = new RSAPublicKey(cosePublicKey.n, cosePublicKey.e).encodePKCS1();
      credential = {
        id: authenticatorData.credential.id,
        userId: user.id,
        algorithmId: coseAlgorithmRS256,
        name: input.name,
        publicKey: encodedPublicKey,
      };
    } else {
      throw new Error('Unsupported algorithm');
    }

    const credentials = await getUserPasskeyCredentials(user.id);
    if (credentials.length >= 5) {
      throw new Error('Too many credentials');
    }

    const passkeyCredential = await createPasskeyCredential(credential);
    return { passkeyCredential };
  },
);

export function PasskeysCard() {
  const deletePasskey = useAction(deletePasskeyAction);
  const createChallenge = useAction(createChallengeAction);
  const createPasskey = useAction(createPasskeyAction);

  const { user } = useAuth();

  const [isAddingPasskey, setIsAddingPasskey] = createSignal(false);
  const [passkeyName, setPasskeyName] = createSignal('');

  const passkeysQuery = createQuery(() => ({
    queryKey: ['passkeys'],
    queryFn: () => getPasskeys(),
  }));

  const deletePasskeyMutation = createMutation(() => ({
    mutationFn: (passkeyId: string) => deletePasskey(passkeyId),
    onSuccess: () => {
      toast.success('Passkey deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSettled: () => {
      passkeysQuery.refetch();
    },
  }));

  const addPasskeyMutation = createMutation(() => ({
    mutationFn: async () => {
      const { challenge, credentialsId } = await createChallenge();

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: decodeBase64(challenge),
          user: {
            displayName: user()!.email,
            name: user()!.email,
            id: credentialsId,
          },
          rp: {
            name: 'The AI Study Bible',
            id: window.location.hostname,
          },
          pubKeyCredParams: [
            {
              type: 'public-key',
              alg: coseAlgorithmES256,
            },
            {
              type: 'public-key',
              alg: coseAlgorithmRS256,
            },
          ],
          attestation: 'none',
          authenticatorSelection: {
            userVerification: 'required',
            residentKey: 'required',
            requireResidentKey: true,
          },
        },
      });

      if (!(credential instanceof PublicKeyCredential)) {
        throw new Error('Failed to create public key');
      }
      if (!(credential.response instanceof AuthenticatorAttestationResponse)) {
        throw new Error('Unexpected error');
      }

      const encodedAttestationObject = encodeBase64(
        new Uint8Array(credential.response.attestationObject),
      );
      const encodedClientDataJSON = encodeBase64(
        new Uint8Array(credential.response.clientDataJSON),
      );

      await createPasskey({
        attestationObject: encodedAttestationObject,
        clientDataJSON: encodedClientDataJSON,
        name: passkeyName() || user()!.email,
      });
    },
    onSuccess: () => {
      setIsAddingPasskey(false);
      toast.success('Passkey added successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSettled: () => {
      passkeysQuery.refetch();
    },
  }));

  return (
    <Card class='h-full w-full'>
      <CardHeader>
        <CardTitle>Passkeys</CardTitle>
        <CardDescription>Manage your passkeys for passwordless authentication.</CardDescription>
      </CardHeader>
      <CardContent class='space-y-4'>
        <QueryBoundary
          query={passkeysQuery}
          notFoundFallback={<div class='text-center text-muted-foreground'>No passkeys found</div>}
        >
          {({ passkeys }) => (
            <div class='space-y-2'>
              <For each={passkeys} fallback={<P>No passkeys found</P>}>
                {(passkey) => (
                  <div class='flex items-center justify-between rounded-lg border p-3'>
                    <div>
                      <div class='font-medium'>{passkey.name}</div>
                      <div class='text-muted-foreground text-sm'>
                        Created on {new Date(passkey.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Button
                      variant='destructive'
                      size='sm'
                      onClick={() => deletePasskeyMutation.mutate(passkey.id)}
                      disabled={deletePasskeyMutation.isPending}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </For>
            </div>
          )}
        </QueryBoundary>

        <Dialog
          open={isAddingPasskey()}
          onOpenChange={(open) => {
            setIsAddingPasskey(open);
            if (!open) setPasskeyName('');
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Passkey</DialogTitle>
              <DialogDescription>
                Optionally give your passkey a name to help identify it later, then follow your
                device's prompts
              </DialogDescription>
            </DialogHeader>
            <div class='space-y-4'>
              <div class='space-y-2'>
                <label for='passkey-name' class='font-medium text-sm'>
                  Passkey Name <span class='text-muted-foreground'>(optional)</span>
                </label>
                <input
                  id='passkey-name'
                  type='text'
                  placeholder='e.g., Work Laptop, Phone'
                  value={passkeyName()}
                  onInput={(e) => setPasskeyName(e.currentTarget.value)}
                  class='w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2'
                />
              </div>
              <div class='flex justify-end gap-2'>
                <Button variant='outline' onClick={() => setIsAddingPasskey(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => addPasskeyMutation.mutate()}
                  disabled={addPasskeyMutation.isPending}
                >
                  Continue
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
      <CardFooter class='flex justify-end'>
        <Button onClick={() => setIsAddingPasskey(true)} disabled={addPasskeyMutation.isPending}>
          Add Passkey
        </Button>
      </CardFooter>
    </Card>
  );
}
