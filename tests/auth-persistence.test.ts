import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';

test('remembered sessions persist and passkey enrollment requires a session', async () => {
  const { auth: configuredAuth } = await import('../src/server/auth');
  const { signupContext } = await import('../src/server/signupContext');
  const auth = betterAuth({
    ...configuredAuth.options,
    baseURL: 'http://localhost:3000',
    secret: 'disposable-test-secret-only-123456789123456789',
    database: memoryAdapter({ user: [], session: [], account: [], verification: [], passkey: [], twoFactor: [] }),
    emailAndPassword: { enabled: true },
    emailVerification: undefined,
    databaseHooks: {
      user: { create: { before: configuredAuth.options.databaseHooks!.user!.create!.before } },
    },
  });
  const origin = 'http://localhost:3000';
  const email = randomUUID() + '@example.invalid';
  const password = 'Disposable-auth-password-123!';
  const call = (path: string, body?: unknown, cookie?: string) => auth.handler(new Request(origin + '/api/auth' + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { origin, ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...(cookie ? { cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  }));
    const signup = await signupContext.run({ workspaceId: 'memory-only-test-workspace', role: 'OWNER' }, () =>
      call('/sign-up/email', { email, password, name: 'Auth test owner' }));
    assert.equal(signup.status, 200, await signup.clone().text());
    for (const rememberMe of [false, true]) {
      const response = await call('/sign-in/email', { email, password, rememberMe });
      assert.equal(response.status, 200, await response.clone().text());
      const cookies = response.headers.getSetCookie();
      const sessionCookie = cookies.find((cookie) => cookie.startsWith('better-auth.session_token='));
      assert.ok(sessionCookie);
      assert.equal(/Max-Age=2592000/i.test(sessionCookie), rememberMe);
      const cookie = cookies.map((value) => value.split(';')[0]).join('; ');
      assert.equal((await call('/get-session', undefined, cookie)).status, 200);
      assert.equal((await call('/passkey/list-user-passkeys', undefined, cookie)).status, 200);
      assert.equal((await call('/sign-out', {}, cookie)).status, 200);
      assert.equal(await (await call('/get-session', undefined, cookie)).json(), null);
    }
    assert.equal((await call('/passkey/generate-register-options')).status, 401);
    const options = await call('/passkey/generate-authenticate-options');
    assert.equal(options.status, 200);
    assert.equal((await options.json()).rpId, 'localhost');
});
