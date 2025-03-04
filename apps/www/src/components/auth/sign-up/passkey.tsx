import { lucia } from '@/core/auth';
import {
  type WebAuthnUserCredential,
  createPasskeyCredential,
  createWebAuthnChallenge,
  getUserPasskeyCredentials,
  verifyWebAuthnChallenge,
} from '@/core/auth/providers/webauthn';
import { db } from '@/core/database';
import { userSettings, users } from '@/core/database/schema';
import { fnv1a } from '@/core/utils/hash';
import { useAuth } from '@/www/hooks/use-auth';
import { createForm, zodForm } from '@modular-forms/solid';
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
import { action, redirect, useAction } from '@solidjs/router';
import { createMutation } from '@tanstack/solid-query';
import { eq } from 'drizzle-orm';
import { KeyIcon } from 'lucide-solid';
import { createSignal } from 'solid-js';
import { toast } from 'solid-sonner';
import { Resource } from 'sst';
import { z } from 'zod';
import { Button } from '../../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../ui/dialog';
import {
  TextField,
  TextFieldErrorMessage,
  TextFieldInput,
  TextFieldLabel,
} from '../../ui/text-field';

const passkeySchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

const createChallengeAction = action(async (email: string) => {
  'use server';
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (existingUser) {
    throw new Error('A user with this email already exists');
  }

  const credentialsId = new Uint8Array(8);
  bigEndian.putUint64(credentialsId, fnv1a(email), 0);

  const challenge = await createWebAuthnChallenge();
  return { challenge: encodeBase64(challenge), credentialsId };
});

const signUpWithPasskeyAction = action(
  async (
    input: {
      email: string;
      attestationObject: string;
      clientDataJSON: string;
    },
    redirectUrl = '/',
  ) => {
    'use server';
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

    const [user] = await db.insert(users).values({ email: input.email }).returning();
    await db.insert(userSettings).values({ userId: user.id });

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
        name: user.email,
        publicKey: encodedPublicKey,
      };
    } else if (authenticatorData.credential.publicKey.algorithm() === coseAlgorithmRS256) {
      const cosePublicKey = authenticatorData.credential.publicKey.rsa();
      const encodedPublicKey = new RSAPublicKey(cosePublicKey.n, cosePublicKey.e).encodePKCS1();
      credential = {
        id: authenticatorData.credential.id,
        userId: user.id,
        algorithmId: coseAlgorithmRS256,
        name: user.email,
        publicKey: encodedPublicKey,
      };
    } else {
      throw new Error('Unsupported algorithm');
    }

    const credentials = await getUserPasskeyCredentials(user.id);
    if (credentials.length >= 5) {
      throw new Error('Too many credentials');
    }

    await createPasskeyCredential(credential);

    const sessionToken = lucia.sessions.generateSessionToken();
    const session = await lucia.sessions.createSession(sessionToken, user.id);
    const sessionCookie = lucia.cookies.createSessionCookie(sessionToken, session);

    return redirect(redirectUrl, {
      headers: { 'Set-Cookie': sessionCookie.serialize() },
    });
  },
);

export type PasskeyFormProps = {
  redirectUrl?: string;
};

export function PasskeyForm(props: PasskeyFormProps) {
  const createChallenge = useAction(createChallengeAction);
  const signUpWithPasskey = useAction(signUpWithPasskeyAction);

  const { refetch } = useAuth();

  const [form, { Form, Field }] = createForm<z.infer<typeof passkeySchema>>({
    validate: zodForm(passkeySchema),
  });

  const [isOpen, setIsOpen] = createSignal(false);

  const onSubmit = createMutation(() => ({
    mutationFn: async ({ email }: z.infer<typeof passkeySchema>) => {
      const { challenge, credentialsId } = await createChallenge(email);

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: decodeBase64(challenge),
          user: {
            displayName: email,
            name: email,
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
      await signUpWithPasskey(
        {
          email,
          attestationObject: encodedAttestationObject,
          clientDataJSON: encodedClientDataJSON,
        },
        props.redirectUrl,
      );
    },
    onSuccess: () => refetch(),
    onError: (error) => toast.error(error.message),
  }));

  return (
    <Dialog open={isOpen()} onOpenChange={setIsOpen}>
      <DialogTrigger as={Button}>
        <KeyIcon class='mr-2 size-4' />
        Passkey
      </DialogTrigger>
      <DialogContent class='max-w-sm'>
        <DialogHeader>
          <DialogTitle>Sign Up with Passkey</DialogTitle>
          <DialogDescription>Sign up using passwordless authentication.</DialogDescription>
        </DialogHeader>
        <Form onSubmit={(values) => onSubmit.mutate(values)} class='flex flex-col gap-4'>
          <Field name='email'>
            {(field, props) => (
              <TextField
                value={field.value}
                validationState={field.error ? 'invalid' : 'valid'}
                class='w-full'
              >
                <TextFieldLabel>Email</TextFieldLabel>
                <TextFieldInput
                  {...props}
                  type='email'
                  placeholder='your@email.com'
                  autocomplete='email'
                  class='p-2 text-sm sm:text-base'
                />
                <TextFieldErrorMessage class='text-xs sm:text-sm'>
                  {field.error}
                </TextFieldErrorMessage>
              </TextField>
            )}
          </Field>
          <div class='flex justify-end gap-2'>
            <Button variant='outline' onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={form.validating || form.submitting || onSubmit.isPending}
            >
              Submit
            </Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
