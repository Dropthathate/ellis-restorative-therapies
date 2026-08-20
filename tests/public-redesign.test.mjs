import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../public-redesign.css', import.meta.url), 'utf8');
const booking = readFileSync(new URL('../book.html', import.meta.url), 'utf8');

assert.equal(existsSync(new URL('../favicon.ico', import.meta.url)), true);

assert.match(index, /Zachary Ellis/);
assert.match(index, /Hunter Ellis/);
assert.match(index, /class="hero-crest"><img src="logo\.png"/);
assert.match(index, /brand-mark brand-mark-logo/);
assert.match(index, /CAMTC #97101/);
assert.match(index, /CAMTC #103413/);
assert.match(index, /book\.html\?therapist=zachary/);
assert.match(index, /book\.html\?therapist=hunter/);
assert.match(index, /https:\/\/client\.restorewithellis\.com/);
assert.doesNotMatch(index, /Google Reviewer|aggregateRating|HSA\/FSA/i);
assert.match(css, /\.therapist-grid/);
assert.match(css, /\.therapist-card/);
assert.match(css, /--ink:#cad5d3/);
assert.match(css, /--teal:#16717c/);
assert.match(css, /--gold:#963641/);
assert.match(booking, /new URLSearchParams\(window\.location\.search\)\.get\('therapist'\)/);
assert.match(booking, /THERAPISTS\[requestedTherapist\]/);

console.log('Public redesign and therapist-link assertions passed.');
