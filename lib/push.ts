import webpush from 'web-push';

type StoredSubscription = { endpoint: string; subscription: PushSubscription };

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT;

let configured = false;

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
      } catch (error: any) {
        if (error?.statusCode === 404 || error?.statusCode === 410) {
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
