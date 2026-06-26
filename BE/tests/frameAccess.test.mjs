import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const controllerSource = readFileSync(
  new URL('../controllers/frame.controller.ts', import.meta.url),
  'utf8',
);

const getMyUnlockedFramesStart = controllerSource.indexOf('export const getMyUnlockedFrames');
const getMyUnlockedFramesEnd = controllerSource.indexOf('export const getAllFramesAdmin');

assert.notEqual(getMyUnlockedFramesStart, -1);
assert.notEqual(getMyUnlockedFramesEnd, -1);

const getMyUnlockedFramesSource = controllerSource.slice(
  getMyUnlockedFramesStart,
  getMyUnlockedFramesEnd,
);

test('my unlocked frames include default frames for every user', () => {
  assert.match(getMyUnlockedFramesSource, /isDefault:\s*true/);
});

test('my unlocked frames include user.unlockedCheckinFrameIds', () => {
  assert.match(getMyUnlockedFramesSource, /_id:\s*{\s*\$in:\s*unlockedFrameIds\s*}/);
});

test('my unlocked frames do not include every free frame', () => {
  assert.doesNotMatch(getMyUnlockedFramesSource, /unlockType:\s*["']free["']/);
  assert.doesNotMatch(getMyUnlockedFramesSource, /frame\.unlockType\s*===\s*["']free["']/);
});
