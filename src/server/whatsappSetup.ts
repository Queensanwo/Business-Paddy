const REQUIRED_SETTINGS = [
  'WHATSAPP_PHONE_NUMBER_ID',
  'WHATSAPP_BUSINESS_ACCOUNT_ID',
  'WHATSAPP_TOKEN',
  'META_APP_SECRET',
  'WHATSAPP_VERIFY_TOKEN',
  'WHATSAPP_TEST_WORKSPACE_ID',
] as const;

export function whatsappSetupStatus(workspaceId: string, environment: NodeJS.ProcessEnv = process.env) {
  const settings = REQUIRED_SETTINGS.map((name) => ({
    name,
    present: Boolean(environment[name]?.trim()),
  }));
  const workspaceMatches = environment.WHATSAPP_TEST_WORKSPACE_ID?.trim() === workspaceId;
  return { settings, workspaceMatches, ready: settings.every((setting) => setting.present) && workspaceMatches };
}
