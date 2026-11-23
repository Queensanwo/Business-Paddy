import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkWhatsAppProvider } from '../src/server/whatsappHealth';

const config = { phoneNumberId: 'phone-1', businessAccountId: 'account-1', token: 'private-test-token' };
function mockGraph(phone: unknown, subscription: unknown, status = 200) {
  return (async (url: string | URL | Request, options?: RequestInit) => {
    assert.equal(options?.cache, 'no-store');
    assert.equal((options?.headers as Record<string, string>).Authorization, `Bearer ${config.token}`);
    assert.ok(!String(url).includes(config.token));
    return Response.json(String(url).includes('subscribed_apps') ? subscription : phone, { status });
  }) as typeof fetch;
}
test('reports an expired token without exposing provider text or token', async () => {
  const result = await checkWhatsAppProvider(config, mockGraph({ error: { code: 190, message: config.token } }, { error: { code: 190 } }, 400));
  assert.equal(result.phoneAccessible, false);
  assert.match(result.problem!, /expired/);
  assert.ok(!JSON.stringify(result).includes(config.token));
});
test('identifies a missing message subscription separately from valid phone access', async () => {
  const result = await checkWhatsAppProvider(config, mockGraph({ id: 'phone-1' }, { data: [] }));
  assert.equal(result.phoneAccessible, true);
  assert.equal(result.subscriptionChecked, true);
  assert.match(result.problem!, /No app is subscribed/);
});
test('returns subscribed app identities without claiming end-to-end delivery', async () => {
  const result = await checkWhatsAppProvider(config, mockGraph({ id: 'phone-1' }, { data: [{ whatsapp_business_api_data: { id: 'app-1', name: 'Business Paddy' } }] }));
  assert.deepEqual(result.subscribedApps, [{ id: 'app-1', name: 'Business Paddy' }]);
  assert.equal(result.problem, null);
});
test('handles unreachable Meta without crashing or reporting success', async () => {
  const result = await checkWhatsAppProvider(config, (async () => { throw new Error('network'); }) as typeof fetch);
  assert.equal(result.phoneAccessible, false);
  assert.equal(result.subscriptionChecked, false);
  assert.ok(result.problem);
});
