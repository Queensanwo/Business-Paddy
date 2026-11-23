type GraphResult = { ok: boolean; data?: Record<string, unknown>; code?: number };

export async function checkWhatsAppProvider(
  config: { phoneNumberId: string; businessAccountId: string; token: string },
  request: typeof fetch = fetch,
) {
  const version = process.env.META_GRAPH_VERSION || 'v21.0';
  async function read(path: string): Promise<GraphResult> {
    try {
      const response = await request(`https://graph.facebook.com/${version}/${path}`, {
        headers: { Authorization: `Bearer ${config.token}` },
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
      });
      const data = await response.json();
      if (!response.ok || data.error) return { ok: false, code: typeof data.error?.code === 'number' ? data.error.code : undefined };
      return { ok: true, data };
    } catch {
      return { ok: false };
    }
  }
  const [phone, subscription] = await Promise.all([
    read(`${encodeURIComponent(config.phoneNumberId)}?fields=id`),
    read(`${encodeURIComponent(config.businessAccountId)}/subscribed_apps`),
  ]);
  const expired = phone.code === 190 || subscription.code === 190;
  const permissionError = [10, 200].includes(phone.code ?? 0) || [10, 200].includes(subscription.code ?? 0);
  const rows = subscription.data?.data;
  const apps = Array.isArray(rows) ? rows.flatMap((row) => {
    const app = row?.whatsapp_business_api_data;
    return app && typeof app.id === 'string' ? [{ id: app.id, name: typeof app.name === 'string' ? app.name : 'Meta app' }] : [];
  }) : [];
  return {
    phoneAccessible: phone.ok && phone.data?.id === config.phoneNumberId,
    subscriptionChecked: subscription.ok && Array.isArray(rows),
    subscribedApps: apps,
    problem: expired ? 'Meta rejected the saved access token. It may have expired or been revoked.'
      : permissionError ? 'The saved token does not have permission to inspect the WhatsApp account.'
        : !phone.ok || !subscription.ok ? 'Meta could not complete every check. Check the account IDs and token permissions, then try again.'
          : Array.isArray(rows) && rows.length === 0 ? 'No app is subscribed to receive messages for this WhatsApp account.'
            : null,
  };
}
