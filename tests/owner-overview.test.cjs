const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

class InboxApiError extends Error { constructor(status, message) { super(message); this.status = status; } }
const source = ts.transpileModule(fs.readFileSync('src/app/api/owner/overview/route.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
function route({ role = 'OWNER', denied = false, failed = false, empty = false } = {}) {
  const calls = [];
  const record = (model, method) => (args) => { calls.push({ model, method, args }); return {}; };
  const prisma = {
    conversation: { groupBy: record('conversation', 'groupBy'), count: record('conversation', 'count'), findMany: record('conversation', 'findMany') },
    user: { findMany: record('user', 'findMany') },
    $transaction: async () => {
      if (failed) throw new Error('private database details');
      if (empty) return [[], [], [], [], 0, []];
      return [
        [{ status: 'NEW', _count: { _all: 2 } }, { status: 'RESOLVED', _count: { _all: 1 } }],
        [{ rating: 'HELPFUL', _count: { _all: 1 } }, { rating: 'NOT_HELPFUL', _count: { _all: 1 } }],
        [{ assigneeId: null, _count: { _all: 1 } }, { assigneeId: 'worker', _count: { _all: 1 } }],
        [{ id: 'worker', name: 'Team member' }], 3,
        [{ id: 'chat', channel: 'PADDY_CHAT', status: 'NEW', updatedAt: new Date(), customer: { name: 'Customer' }, assignee: null, rating: 'HELPFUL', feedbackComment: 'Thank you', feedbackAt: new Date(), guestToken: 'must-not-leak', messages: [{ kind: 'STAFF', senderName: 'Team (automatic reply)', text: 'a'.repeat(400), createdAt: new Date() }] }],
      ];
    },
  };
  const module = { exports: {} };
  vm.runInNewContext(source, {
    exports: module.exports, module, URL, console: { error() {} },
    require: (id) => {
      if (id === 'next/server') return { NextResponse: { json: (data, options = {}) => ({ data, status: options.status ?? 200, headers: options.headers }) } };
      if (id === '@/lib/db') return { prisma };
      if (id === '@/server/inboxStore') return { InboxApiError };
      if (id === '@/server/requireStaff') return { requireStaff: async () => { if (denied) throw new InboxApiError(401, 'Sign in required.'); return { role, workspaceId: 'workspace-a' }; } };
      throw new Error(`Unexpected import: ${id}`);
    },
  });
  return { GET: module.exports.GET, calls };
}

test('requires login and rejects every non-owner role before querying conversations', async () => {
  for (const config of [{ denied: true }, { role: 'MANAGER' }, { role: 'AGENT' }, { role: 'TRAINEE' }]) {
    const r = route(config); const response = await r.GET({ url: 'https://example.test/api/owner/overview' });
    assert.equal(response.status, config.denied ? 401 : 403); assert.equal(r.calls.length, 0);
  }
});
test('every database read stays in the authenticated workspace, ignoring supplied workspace IDs', async () => {
  const r = route(); const result = await r.GET({ url: 'https://example.test/api/owner/overview?workspaceId=other&filter=attention&page=2' });
  assert.equal(result.status, 200); assert.equal(r.calls.length, 6);
  for (const call of r.calls) assert.equal(call.args.where.workspaceId, 'workspace-a');
  const list = r.calls.find((c) => c.model === 'conversation' && c.method === 'findMany').args;
  assert.equal(list.take, 20); assert.equal(list.skip, 20);
  assert.ok(list.where.status.in.includes('ESCALATED'));
  assert.equal(list.select.guestToken, undefined);
  assert.equal(list.select.messages.take, 8);
  assert.match(result.headers['Cache-Control'], /no-store/);
  assert.equal(result.data.conversations[0].guestToken, undefined);
});
test('uses submitted ratings, labels automatic greetings and bounds excerpts', async () => {
  const { GET } = route(); const { data } = await GET({ url: 'https://example.test/api/owner/overview' });
  assert.equal(data.overview.satisfaction, 50); assert.equal(data.overview.rated, 2);
  assert.equal(data.overview.open, 2); assert.equal(data.overview.unassigned, 1);
  assert.equal(data.team[0].open, 1);
  assert.equal(data.conversations[0].excerpts[0].automatic, true);
  assert.equal(data.conversations[0].excerpts[0].text.length, 281);
});
test('empty workspaces have zero counts and no invented satisfaction score', async () => {
  const { GET } = route({ empty: true }); const { data } = await GET({ url: 'https://example.test/api/owner/overview' });
  assert.equal(data.overview.satisfaction, null); assert.equal(data.overview.rated, 0); assert.equal(data.overview.open, 0);
});
test('rejects invalid filters and pagination before database work', async () => {
  for (const query of ['page=0', 'page=-1', 'page=1.5', 'page=abc', 'page=10001', 'filter=other']) {
    const r = route(); assert.equal((await r.GET({ url: `https://example.test/api/owner/overview?${query}` })).status, 400); assert.equal(r.calls.length, 0);
  }
});
test('feedback view is scoped to supported submitted ratings', async () => {
  const r = route(); await r.GET({ url: 'https://example.test/api/owner/overview?filter=feedback' });
  const list = r.calls.find((c) => c.model === 'conversation' && c.method === 'findMany');
  assert.equal(JSON.stringify(list.args.where.rating.in), JSON.stringify(['HELPFUL', 'NOT_HELPFUL']));
});
test('database failures return a retryable error without internal details', async () => {
  const { GET } = route({ failed: true }); const result = await GET({ url: 'https://example.test/api/owner/overview' });
  assert.equal(result.status, 500); assert.doesNotMatch(result.data.error, /private database/);
});
