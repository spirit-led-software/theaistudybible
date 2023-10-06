import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { fail } from '@sveltejs/kit';
import { Bucket } from 'sst/node/bucket';
import type { Actions } from './$types';

type ActionData = { banner?: string };

const s3Client = new S3Client({});

export const actions: Actions = {
	default: async ({ request }) => {
		try {
			const formData = await request.formData();
			const name = formData.get('name') as string;
			const url = formData.get('url') as string;
			const file = formData.get('file') as File;

			if (!name || !url || !file) {
				return fail(400, {
					error: {
						banner: 'Missing required fields'
					} as ActionData
				});
			}

			const putObjectCommand = new PutObjectCommand({
				Bucket: Bucket.indexFileBucket.bucketName,
				Key: file.name,
				Body: Buffer.from(await file.arrayBuffer()),
				ContentType: file.type,
				Metadata: {
					name,
					url
				}
			});

			const putRequest = await s3Client.send(putObjectCommand);
			if (putRequest.$metadata.httpStatusCode !== 200) {
				return fail(500, {
					error: {
						banner: `Failed to upload file to S3: ${putRequest.$metadata}`
					} as ActionData
				});
			}
			console.log('Successfully uploaded file to S3:', putRequest.$metadata);

			return {
				success: {
					banner: 'Index File Operation Started'
				} as ActionData
			};
		} catch (error) {
			return fail(500, {
				error: {
					banner: `Error: ${error}`
				} as ActionData
			});
		}
	}
};
