const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../../src/modules/busbooking/services/busBookingApi.ts'), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
function setup(server = 'https://rewardplanners.com') {
  const requests = [], logs = [], exports = {};
  const state = { token: 'customer-access-test', success: true, status: 200, authReads: 0 };
  vm.runInNewContext(code, {
    exports, __DEV__: true, AbortController, setTimeout, clearTimeout,
    console: { log: (...args) => logs.push(args.join(' ')) },
    require: name => {
      if (name.endsWith('apiConfig')) return { SERVER_URL: server };
      if (name.endsWith('AuthAPI')) return { getAuthHeaders: async () => { state.authReads++; return state.token ? { Authorization: `Bearer ${state.token}` } : {}; } };
      throw new Error(`Unexpected dependency: ${name}`);
    },
    fetch: async (url, options) => {
      requests.push({ url, options });
      return { ok: state.status === 200, status: state.status, json: async () => ({
        success: state.success, message: 'test response', order_ref: 'BB-ORD-1001', localOrderId: 1, payableAmount: 500,
        data: { orderId: 'order_test', key: 'public-key', amount: 50000, balance: 100, creditLimit: 0 },
        token: state.token, diagnostic: state.token,
      }) };
    },
  });
  return { api: exports, requests, logs, state };
}
const identifiers = { traceId: 'trace', srdvIndex: 'index', resultIndex: 'result' };
const payment = { razorpay_order_id: 'order_test', razorpay_payment_id: 'pay_test', razorpay_signature: 'signature_test' };
test('cities is public and query is encoded, in live and local environments', async () => {
  for (const server of ['https://rewardplanners.com', 'http://localhost:5000']) {
    const { api, requests, state } = setup(server);
    await api.searchCitiesApi('Pu &');
    assert.equal(requests[0].url, `${server}/api/busbooking/cities?q=Pu%20%26`);
    assert.equal(requests[0].options.method || 'GET', 'GET');
    assert.equal(requests[0].options.headers.Authorization, undefined);
    assert.equal(state.authReads, 0);
  }
});
test('all customer endpoints use POST, customer auth, and the independent bus base', async () => {
  const { api, requests, logs } = setup();
  const block = { ...identifiers, passengers: [{ SeatName: 'A1', Seat: { SeatName: 'A1', Price: { BaseFare: 500 } } }] };
  const blocked = await api.blockSeatApi(block);
  assert.equal(blocked.orderRef, 'BB-ORD-1001');
  await api.searchBusesApi({ sourceCityCode:'8463', destinationCityCode:'9573', journeyDate:'2026-10-15', journeyTime:'09:30' });
  await api.getSeatLayoutApi(identifiers);
  await api.getBoardingDroppingPointsApi(identifiers);
  await api.createBusPaymentOrderApi({ order_ref: blocked.orderRef });
  await api.verifyBusPaymentApi(payment);
  await api.bookBusTicketApi({ order_ref: blocked.orderRef });
  await api.cancelBusTicketApi({ order_ref: blocked.orderRef, seatName:'A1', remarks:'Travel plans changed' });
  assert.deepEqual(requests.map(r => r.url.split('/').pop()), ['block','search','seat-layout','boarding-dropping-points','create-order','verify-payment','book','cancel']);
  for (const {url, options} of requests) {
    assert.ok(url.startsWith('https://rewardplanners.com/api/busbooking/'));
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.Authorization, 'Bearer customer-access-test');
    assert.equal(options.headers['Content-Type'], 'application/json');
  }
  assert.deepEqual(JSON.parse(requests[5].options.body), payment);
  assert.deepEqual(JSON.parse(requests[6].options.body), { order_ref:'BB-ORD-1001' });
  assert.deepEqual(JSON.parse(requests[0].options.body).passengers[0].Seat, block.passengers[0].Seat);
  assert.ok(logs.some(line => line.includes('[BusBooking][API]')));
  assert.ok(!logs.join('\n').includes('customer-access-test'));
  assert.ok(!logs.join('\n').includes('signature_test'));
});
test('administrator calls require explicit admin credentials, never the customer session', async () => {
  const {api, requests, state} = setup();
  await api.getBusBalanceApi('admin-access-test');
  await api.getBusBalanceLogApi('admin-access-test');
  assert.equal(state.authReads, 0);
  for (const request of requests) assert.equal(request.options.headers.Authorization, 'Bearer admin-access-test');
});
test('missing auth and invalid input prevent requests; rejected verification throws', async () => {
  const {api, state, requests} = setup();
  state.token = '';
  await assert.rejects(api.searchBusesApi({}), /log in/);
  state.token = 'customer-access-test';
  await assert.rejects(api.verifyBusPaymentApi({}), /missing/);
  await assert.rejects(api.cancelBusTicketApi({ order_ref:'o', seatName:'A1', remarks:'a'.repeat(501) }), /500/);
  await assert.rejects(api.blockSeatApi({passengers:[{SeatName:'A1'}]}), /seat details/);
  assert.equal(requests.length, 0);
  state.success = false; state.status = 400;
  await assert.rejects(api.verifyBusPaymentApi(payment), /test response/);
  assert.equal(requests.length, 1);
});
