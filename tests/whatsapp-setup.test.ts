import assert from 'node:assert/strict';
import { test } from 'node:test';
import { whatsappSetupStatus } from '../src/server/whatsappSetup';

const configured = {
  WHATSAPP_PHONE_NUMBER_ID: 'phone-id',
  WHATSAPP_BUSINESS_ACCOUNT_ID: 'business-id',
  WHATSAPP_TOKEN: 'private-access-token',
  META_APP_SECRET: 'private-app-secret',
  WHATSAPP_VERIFY_TOKEN: 'private-verify-token',
  WHATSAPP_TEST_WORKSPACE_ID: 'workspace-id',
};

test('setup identifies every unavailable setting without exposing secret values', () => {
  for (const name of Object.keys(configured)) {
    const status = whatsappSetupStatus('workspace-id', { ...configured, [name]: '' });
    assert.equal(status.ready, false);
    assert.deepEqual(status.settings.filter((setting) => !setting.present).map((setting) => setting.name), [name]);
    assert.doesNotMatch(JSON.stringify(status), /private-access-token|private-app-secret|private-verify-token/);
  }
});

test('setup requires an assigned workspace and nonempty settings', () => {
  assert.equal(whatsappSetupStatus('workspace-id', configured).ready, true);
  assert.equal(whatsappSetupStatus('another-workspace', configured).ready, false);
  assert.equal(whatsappSetupStatus('workspace-id', { ...configured, WHATSAPP_VERIFY_TOKEN: '  ' }).ready, false);
});
