import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const source = readFileSync(new URL('TherapistBooking.gs', root), 'utf8');
const context = {
  CALENDAR_ID: 'restorewithellis@gmail.com',
  ADMIN_EMAIL: 'restorewithellis@gmail.com',
  ERT_TAG: '[ERT]',
  SHEET_ID: 'test-sheet',
  Date,
};

vm.runInNewContext(`${source}\nglobalThis.scheduleForTest = getHunterScheduleForDate; globalThis.slotsForTest = getHunterSlotTimes;`, context);

const scheduleFor = (date) => context.scheduleForTest(new Date(`${date}T12:00:00`));
const slotsFor = (date, duration) => Array.from(context.slotsForTest(date, duration));

assert.equal(scheduleFor('2026-08-01').label, 'first-or-third-weekend');
assert.equal(scheduleFor('2026-08-02').label, 'first-or-third-weekend');
assert.equal(scheduleFor('2026-08-08'), null);
assert.equal(scheduleFor('2026-08-15').label, 'first-or-third-weekend');
assert.equal(scheduleFor('2026-08-16').label, 'first-or-third-weekend');
assert.equal(scheduleFor('2026-08-22'), null);
assert.equal(scheduleFor('2026-08-17').label, 'weekday');
assert.equal(scheduleFor('2026-03-01'), null);
assert.equal(scheduleFor('2026-03-07').label, 'first-or-third-weekend');
assert.equal(scheduleFor('2026-03-08').label, 'first-or-third-weekend');
assert.equal(scheduleFor('2026-03-21').label, 'first-or-third-weekend');
assert.equal(scheduleFor('2026-03-22').label, 'first-or-third-weekend');
assert.equal(scheduleFor('2026-09-05').label, 'first-or-third-weekend');
assert.equal(scheduleFor('2026-09-06').label, 'first-or-third-weekend');
assert.equal(scheduleFor('2026-09-12'), null);
assert.equal(scheduleFor('2026-09-19').label, 'first-or-third-weekend');
assert.equal(scheduleFor('2026-09-20').label, 'first-or-third-weekend');
assert.equal(scheduleFor('2026-09-26'), null);

assert.deepEqual(slotsFor('2026-08-01', 60), ['9:00 AM', '10:30 AM', '12:00 PM']);
assert.deepEqual(slotsFor('2026-08-01', 90), ['9:00 AM', '10:30 AM']);
assert.deepEqual(slotsFor('2026-08-01', 120), ['9:00 AM', '10:30 AM']);
assert.deepEqual(slotsFor('2026-08-08', 60), []);
assert.deepEqual(slotsFor('2026-08-17', 60), ['12:51 PM', '3:21 PM', '5:51 PM']);

console.log('Hunter first- and third-weekend availability assertions passed.');
