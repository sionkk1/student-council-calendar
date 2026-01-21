import webpush from 'web-push';

export type StoredSubscription = { endpoint: string; subscription: PushSubscription };
type WebPushError = { statusCode?: number };

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT;

let configured = false;

const getStatusCode = (error: unknown) => {
  if (error && typeof error === 'object' && 'statusCode' in error) {
    const value = (error as WebPushError).statusCode;
    return typeof value === 'number' ? value : undefined;
  }
  return undefined;
};

export function ensureWebPushConfig() {
  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    throw new Error('Missing VAPID configuration');
  }
  if (!configured) {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    configured = true;
  }
}

export async function sendToSubscriptions(
  subscriptions: StoredSubscription[],
  payload: Record<string, unknown>
) {
  ensureWebPushConfig();
  const body = JSON.stringify(payload);
  const expiredEndpoints: string[] = [];

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub.subscription, body);
      } catch (error: unknown) {
        const statusCode = getStatusCode(error);
        if (statusCode === 404 || statusCode === 410) {
          expiredEndpoints.push(sub.endpoint);
        }
        throw error;
      }
    })
  );

  return {
    results,
    expiredEndpoints,
  };
}
