import assert from 'node:assert/strict';
import {test} from 'node:test';
import {isAllowedOrigin} from '../origin';

const configuredOrigin = 'http://localhost:3000';
const machineAddresses = ['127.0.0.1', '192.168.1.104', 'fd00::1234'];

test('development accepts this machine LAN addresses and loopback on the public port', () => {
  for (const origin of ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://[::1]:3000', 'http://192.168.1.104:3000', 'http://[fd00::1234]:3000']) {
    assert.equal(isAllowedOrigin(origin, configuredOrigin, 'development', machineAddresses), true, origin);
  }
});

test('development rejects other LAN devices, unrelated websites and misleading origins', () => {
  for (const origin of ['http://192.168.1.105:3000', 'https://example.com', 'http://192.168.1.104:3001', 'https://192.168.1.104:3000', 'http://192.168.1.104:3000.evil.test', 'http://localhost.evil.test:3000', 'http://user@192.168.1.104:3000', 'http://192.168.1.104:3000/path', 'null']) {
    assert.equal(isAllowedOrigin(origin, configuredOrigin, 'development', machineAddresses), false, origin);
  }
});

test('production and test environments accept only the explicitly configured origin', () => {
  for (const environment of ['production', 'test'] as const) {
    assert.equal(isAllowedOrigin('https://schools.example', 'https://schools.example', environment, machineAddresses), true);
    for (const origin of ['http://192.168.1.104:3000', 'http://localhost:3000', 'https://other.example']) {
      assert.equal(isAllowedOrigin(origin, 'https://schools.example', environment, machineAddresses), false, origin);
    }
  }
});
