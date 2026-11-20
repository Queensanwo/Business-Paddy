import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test, mock } from 'node:test';
import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';

test('reset delivery errors are detected and accepted reset links work only once', async () => {
  const { auth: configuredAuth } = await import('../src/server/auth');
  const { signupContext } = await import('../src/server/signupContext');
  const previousKey = process.env.RESEND_API_KEY;
  process.env.RESEND_API_KEY = 're_disposable_test_only';
  let rejectEmail = true;
  let emailText = '';
  let sends = 0;
  const fetchMock = mock.method(globalThis, 'fetch', async (_input: unknown, init?: RequestInit) => {
    sends++;
    emailText = JSON.parse(String(init?.body)).text;
    return new Response(JSON.stringify(rejectEmail
      ? { name: 'validation_error', message: 'Test sender is restricted.', statusCode: 403 }
      : { id: 'test-email-id' }), { status: rejectEmail ? 403 : 200, headers: { 'content-type': 'application/json' } });
  });
  const logMock = mock.method(console, 'error', () => {});
  const auth = betterAuth({
    ...configuredAuth.options,
    baseURL: 'http://localhost:3000',
    secret: 'disposable-reset-test-secret-only-123456789',
    database: memoryAdapter({ user: [], session: [], account: [], verification: [], passkey: [], twoFactor: [] }),
    emailAndPassword: { enabled: true, sendResetPassword: configuredAuth.options.emailAndPassword!.sendResetPassword },
    emailVerification: undefined,
    databaseHooks: { user: { create: { before: configuredAuth.options.databaseHooks!.user!.create!.before } } },
  });
  const call = (path: string, body: unknown) => auth.handler(new Request('http://localhost:3000/api/auth' + path, {
    method: 'POST', headers: { origin: 'http://localhost:3000', 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }));
  try {
    const email = randomUUID() + '@example.invalid';
    const password = 'Disposable-original-password-123!';
    const signup = await signupContext.run({ workspaceId: 'memory-only-reset-fixture', role: 'OWNER' }, () =>
      call('/sign-up/email', { email, password, name: 'Reset test owner' }));
    assert.equal(signup.status, 200);
    await assert.rejects(configuredAuth.options.emailAndPassword!.sendResetPassword!({
      user: { id: 'test-owner', email, name: 'Reset test owner', emailVerified: false, createdAt: new Date(), updatedAt: new Date() },
      url: 'http://localhost:3000/reset-password?token=disposable', token: 'disposable',
    }), /could not be delivered/);
    // The auth library keeps reset responses generic to protect account privacy.
    assert.equal((await call('/request-password-reset', { email, redirectTo: '/reset-password' })).status, 200);
    rejectEmail = false;
    assert.equal((await call('/request-password-reset', { email, redirectTo: '/reset-password' })).status, 200);
    const resetUrl = emailText.match(/http:\/\/localhost:3000\/api\/auth\/reset-password\/[^\s]+/)?.[0];
    assert.ok(resetUrl);
    const token = new URL(resetUrl).pathname.split('/').pop();
    const newPassword = 'Disposable-new-password-123!';
    assert.equal((await call('/reset-password', { token, newPassword })).status, 200);
    assert.equal((await call('/sign-in/email', { email, password: newPassword })).status, 200);
    assert.equal((await call('/sign-in/email', { email, password })).status, 401);
    assert.equal((await call('/reset-password', { token, newPassword })).status, 400);
    const before = sends;
    assert.equal((await call('/request-password-reset', { email: randomUUID() + '@example.invalid' })).status, 200);
    assert.equal(sends, before, 'An unknown email must not trigger a provider request');
  } finally {
    fetchMock.mock.restore();
    logMock.mock.restore();
    if (previousKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previousKey;
  }
});
