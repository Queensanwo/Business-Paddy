// Run against the local app with a disposable database and outbound email disabled.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';

test('professional drafts stay private and published services reach the right inbox', async () => {
  const port = Number(process.env.PADDY_DISPOSABLE_HTTP_PORT ?? 3000);
  assert.ok(Number.isInteger(port) && port > 0 && port <= 65535, 'Use a valid localhost port.');
  const base = 'http://localhost:' + port;
  assert.equal(process.env.PADDY_DISPOSABLE_HTTP_TEST, 'yes', 'Opt in only on the disposable local app.');
  async function request(path, method = 'GET', body, cookie) {
    return fetch(base + path, {
      method,
      headers: { origin: base, 'sec-fetch-site': 'same-origin',
        ...(body ? { 'content-type': 'application/json' } : {}), ...(cookie ? { cookie } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  }
  const profile = { specialty: 'Photography', email: '', socials: [], portfolio: [],
    services: [{ id: randomUUID(), name: 'Portrait session', description: '', price: '' }] };
  const signup = await request('/api/register', 'POST', { workspaceKind: 'PROFESSIONAL',
    businessName: 'Profile HTTP fixture', name: 'Fixture owner', email: `${randomUUID()}@example.invalid`,
    password: 'Disposable-test-password-123!' });
  assert.equal(signup.status, 200, await signup.clone().text());
  const cookie = signup.headers.getSetCookie().map((entry) => entry.split(';')[0]).join('; ');
  assert.ok(cookie, 'Signup should start a session');
  const me = await request('/api/me', 'GET', undefined, cookie);
  assert.equal(me.status, 200);
  const { workspaceId } = await me.json();
  const publicSignup = { name: 'Untrusted signup', password: 'Disposable-test-password-123!' };
  for (const extra of [{ workspaceId, role: 'OWNER' }, {}]) {
    const denied = await request('/api/auth/sign-up/email', 'POST', {
      ...publicSignup, email: `${randomUUID()}@example.invalid`, ...extra,
    });
    assert.ok([400, 403].includes(denied.status), 'Direct signup must be refused');
    assert.equal(denied.headers.getSetCookie().length, 0);
  }
  const publicPath = '/api/sites/' + workspaceId;
  assert.equal((await request(publicPath)).status, 404);
  const photoForm = new FormData();
  photoForm.set('file', new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWioAAAAASUVORK5CYII=', 'base64')], { type: 'image/png' }), 'test.png');
  const upload = await fetch(base + '/api/site/photos', { method: 'POST',
    headers: { cookie, origin: base, 'sec-fetch-site': 'same-origin' }, body: photoForm });
  assert.equal(upload.status, 201, await upload.clone().text());
  const { id: photoId } = await upload.json();
  const photoPath = '/api/site/photos/' + photoId;
  const publicPhoto = photoPath + '?site=' + workspaceId;
  assert.equal((await request(photoPath, 'GET', undefined, cookie)).status, 200);
  assert.equal((await request(publicPhoto)).status, 404);
  const settings = { workspaceKind: 'PROFESSIONAL', siteEnabled: true, siteDescription: 'Public introduction', siteProfessionalProfile: profile };
  assert.equal((await request('/api/site', 'PUT', settings, cookie)).status, 200);
  const draft = { description: 'Private introduction', products: '', hours: '', contact: '',
    profile: { ...profile, portraitId: photoId, services: [{ ...profile.services[0], id: randomUUID(), name: 'Private offer' }] } };
  assert.equal((await request('/api/site', 'PUT', { professionalDraft: draft }, cookie)).status, 200);
  const saved = await request('/api/site', 'GET', undefined, cookie);
  assert.equal((await saved.json()).site.siteProfessionalDraft.description, draft.description);
  assert.equal((await request('/api/site')).status, 401);
  const publicResponse = await request(publicPath);
  assert.equal(publicResponse.status, 200);
  const publicText = await publicResponse.text();
  assert.match(publicText, /Public introduction/);
  assert.doesNotMatch(publicText, /Private introduction|Private offer/);
  assert.equal((await request(publicPhoto)).status, 404);
  const message = { workspaceId, name: 'Test visitor', text: 'Is next Saturday available?' };
  assert.equal((await request('/api/paddy-chat/start', 'POST', { ...message, serviceId: draft.profile.services[0].id })).status, 400);
  const chat = await request('/api/paddy-chat/start', 'POST', { ...message, serviceId: profile.services[0].id });
  assert.equal(chat.status, 200, await chat.clone().text());
  const { conversationId } = await chat.json();
  const inbox = await request('/api/inbox', 'GET', undefined, cookie);
  assert.equal(inbox.status, 200);
  const conversation = (await inbox.json()).conversations.find((entry) => entry.id === conversationId);
  assert.ok(conversation);
  assert.match(JSON.stringify(conversation), /Enquiry about: Portrait session/);
  const contact = { email: 'profile-lead@example.invalid', phone: '+234 800 123 4567', consent: true };
  assert.equal((await request('/api/paddy-chat/start', 'POST', { ...message, profileContact: { ...contact, consent: false } })).status, 400);
  assert.equal((await request('/api/paddy-chat/start', 'POST', { ...message, profileContact: contact })).status, 200);
  const customers = await request('/api/customers', 'GET', undefined, cookie);
  assert.equal(customers.status, 200);
  assert.match(await customers.text(), /profile-lead@example\.invalid/);
  assert.equal((await request('/api/site', 'PUT', { ...settings, siteProfessionalProfile: { ...profile, portraitId: photoId, accent: '#ffee00' } }, cookie)).status, 200);
  assert.equal((await request(publicPhoto)).status, 200);
  assert.equal((await request(photoPath + '?site=wrong-workspace')).status, 404);
  assert.equal((await request('/api/site', 'PUT', { siteEnabled: false }, cookie)).status, 200);
  assert.equal((await request(publicPath)).status, 404);
  assert.equal((await request(publicPhoto)).status, 404);
  assert.equal((await request('/api/paddy-chat/start', 'POST', { ...message, profileContact: contact })).status, 404);
});
