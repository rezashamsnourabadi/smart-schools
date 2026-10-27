import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { AppProvider, useApp } from '../tests/fixtures/LegacyAppContext';
import { INITIAL_STUDENTS } from '../src/data/mockData';

const corruptKey = 'smart_school_hub_data_v2_students';
const corruptValue = '{"students":';
const stored = new Map<string, string>([[corruptKey, corruptValue]]);
let writes = 0;
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
  getItem: (key: string) => stored.get(key) ?? null,
  setItem: (key: string, value: string) => { writes += 1; stored.set(key, value); }
} });
const views: ReturnType<typeof useApp>[] = [];
function Probe() { views.push(useApp()); return null; }
renderToString(createElement(AppProvider, { children: createElement(Probe) }));
const view = views[0];
assert.ok(view, 'The provider should render even when one stored JSON value is invalid');
assert.equal(view.students.length, INITIAL_STUDENTS.length, 'The affected collection should use safe defaults in memory');
assert.match(view.activeToast?.message || '', /داده اصلی دست‌نخورده نگه داشته شده/);
assert.equal(stored.get(corruptKey), corruptValue, 'The unreadable original must remain untouched');
assert.equal(writes, 0, 'Server rendering must not write or overwrite user storage');
console.log('Malformed localStorage JSON, user-data preservation and visible warning: passed');
