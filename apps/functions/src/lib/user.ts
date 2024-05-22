import { clerkClient } from '@clerk/clerk-sdk-node';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';

export async function getSessionClaimsFromEvent(event: APIGatewayProxyEventV2) {
  try {
    return await clerkClient.verifyToken(event.headers?.authorization?.split('Bearer ')[1] ?? '');
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}
