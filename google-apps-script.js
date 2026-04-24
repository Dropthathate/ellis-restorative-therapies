// ── Ellis Restorative Therapies · Google Apps Script ──
// Handles: calendar availability, booking requests, email signups
//
// SETUP INSTRUCTIONS:
//
// 1. Go to https://sheets.google.com — create a new spreadsheet
//    Name it: "ERT — Site Data"
//    Create TWO tabs:
//      Tab 1: "Email List"   → headers: Timestamp | Email | Source
//      Tab 2: "Bookings"     → headers: Timestamp | Name | Phone | Email | Date | Time | Duration | Price | Notes
//
// 2. Click Extensions → Apps Script
//    Delete all existing code, paste THIS entire file, click Save
//    Name the project: "ERT Site"
//
// 3. Click Deploy → New Deployment
//    Type: Web app
//    Execute as: Me (restorewithellis@gmail.com)
//    Who has access: Anyone
//    Click Deploy → copy the Web App URL
//
// 4. Paste that URL into book.html → const BOOKING_URL = 'YOUR URL'
//    And into email-capture.js   → const SHEET_URL   = 'YOUR URL'
//    (same URL for both)
//
// HOW ZACHARY MANAGES BOOKINGS:
//   - Open Google Calendar
//   - Create an event at the booked time (e.g. 2:00 PM – 3:30 PM)
//   - Put [ERT] anywhere in the event title (e.g. "[ERT] Sarah Johnson")
//   - That slot will automatically show as booked on the website
//   - No other website changes needed — ever.
// ─────────────────────────────────────────────────────────────────────

// ── CONFIGURATION ──
const CALENDAR_ID   = 'restorewithellis@gmail.com'; // His Google Calendar
const ERT_TAG       = '[ERT]';                       // Tag to identify ERT bookings
const BOOKING_EMAIL = 'restorewithellis@gmail.com';

// Working hours by date range
// Format: { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD', slots: ['H:MM AM', ...] }
const SCHEDULE_RULES = [
  {
    start: '2026-04-21',
    end:   '2026-04-30',
    slots: ['10:00 AM','11:30 AM','1:00 PM','2:30 PM','4:00 PM','5:30 PM']
  },
  {
    start: '2026-05-01',
    end:   '2026-07-31',
    slots: ['12:30 PM','2:00 PM','3:30 PM','5:00 PM','6:30 PM']
  }
];

const CLOSED_DAYS = [0, 5, 6]; // Sun, Fri, Sat

// ─────────────────────────────────────────────────────────────────────

function doGet(e) {
  const action = e.parameter.action;

  if (action === 'availability') {
    return getAvailability(e.parameter.month, e.parameter.year);
  }

  if (action === 'slots') {
    return getSlots(e.parameter.date);
  }

  return respond({ status: 'ERT Site Script running ✓' });
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.type === 'booking')     return handleBooking(data);
    if (data.type === 'emailSignup') return handleEmailSignup(data);
    return respond({ success: false, error: 'Unknown type' });
  } catch (err) {
    return respond({ success: false, error: err.message });
  }
}

// ── GET MONTH AVAILABILITY ──
// Returns status for every day in the requested month
function getAvailability(monthStr, yearStr) {
  const month = parseInt(monthStr); // 0-indexed
  const year  = parseInt(yearStr);

  const startOfMonth = new Date(year, month, 1);
  const endOfMonth   = new Date(year, month + 1, 0, 23, 59, 59);

  // Get all [ERT] events this month
  const bookedSlots = getERTEvents(startOfMonth, endOfMonth);

  const result = {};
  const daysInMonth = endOfMonth.getDate();
  const today = new Date();
  today.setHours(0,0,0,0);

  for (let d = 1; d <= daysInMonth; d++) {
    const date    = new Date(year, month, d);
    const dateKey = formatKey(date);
    const dow     = date.getDay();

    if (date < today || CLOSED_DAYS.includes(dow)) continue;

    const rule = getRuleForDate(dateKey);
    if (!rule) continue; // not in any schedule range

    const allSlots    = rule.slots;
    const bookedToday = bookedSlots[dateKey] || [];
    const openCount   = allSlots.filter(s => !bookedToday.includes(s)).length;

    if (openCount === 0) {
      result[dateKey] = 'full';
    } else if (openCount < allSlots.length) {
      result[dateKey] = 'partial';
    } else {
      result[dateKey] = 'open';
    }
  }

  return respond({ success: true, availability: result });
}

// ── GET SLOTS FOR A SPECIFIC DATE ──
function getSlots(dateStr) {
  const rule = getRuleForDate(dateStr);
  if (!rule) return respond({ success: true, slots: [], booked: [] });

  const date  = new Date(dateStr + 'T12:00:00');
  const start = new Date(dateStr + 'T00:00:00');
  const end   = new Date(dateStr + 'T23:59:59');

  const bookedMap  = getERTEvents(start, end);
  const bookedList = bookedMap[dateStr] || [];
  const openSlots  = rule.slots.filter(s => !bookedList.includes(s));

  return respond({ success: true, slots: openSlots, booked: bookedList });
}

// ── READ GOOGLE CALENDAR ──
function getERTEvents(startDate, endDate) {
  const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
  const events   = calendar.getEvents(startDate, endDate);
  const booked   = {};

  events.forEach(ev => {
    if (!ev.getTitle().includes(ERT_TAG)) return;

    const evStart   = ev.getStartTime();
    const dateKey   = formatKey(evStart);
    const timeLabel = formatTime(evStart);

    if (!booked[dateKey]) booked[dateKey] = [];
    booked[dateKey].push(timeLabel);
  });

  return booked;
}

// ── HANDLE BOOKING REQUEST ──
function handleBooking(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Bookings');
  sheet.appendRow([
    timestamp(), data.name||'', data.phone||'', data.email||'',
    data.date||'', data.time||'', data.duration||'', data.price||'', data.notes||''
  ]);

  // Notify Zachary
  MailApp.sendEmail({
    to: BOOKING_EMAIL,
    subject: `📅 New Booking Request — ${data.date} at ${data.time}`,
    body:
      `New booking request!\n\n` +
      `Name:     ${data.name}\n` +
      `Phone:    ${data.phone}\n` +
      `Email:    ${data.email}\n` +
      `Date:     ${data.date}\n` +
      `Time:     ${data.time}\n` +
      `Duration: ${data.duration} (${data.price})\n` +
      `Notes:    ${data.notes || 'None'}\n\n` +
      `To confirm: reply to client or add "[ERT] ${data.name}" to Google Calendar at ${data.time} on ${data.date}.`
  });

  // Confirm to client
  if (data.email && isValidEmail(data.email)) {
    MailApp.sendEmail({
      to: data.email,
      subject: 'Booking Request Received — Ellis Restorative Therapies',
      body:
        `Hi ${data.name},\n\n` +
        `Thanks for requesting an appointment. Here's what we have:\n\n` +
        `Date:     ${data.date}\n` +
        `Time:     ${data.time}\n` +
        `Session:  ${data.duration} (${data.price})\n\n` +
        `Zachary will confirm within a few hours. ` +
        `Questions? Call or text (209) 450-5296.\n\n` +
        `See you soon,\nEllis Restorative Therapies\nrestorewithellis.com`
    });
  }

  return respond({ success: true });
}

// ── HANDLE EMAIL SIGNUP ──
function handleEmailSignup(data) {
  const email  = (data.email  || '').trim();
  const source = (data.source || 'unknown').trim();
  if (!isValidEmail(email)) return respond({ success: false, error: 'Invalid email' });

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Email List');
  const rows  = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if ((rows[i][1]||'').toString().toLowerCase() === email.toLowerCase()) {
      return respond({ success: true, duplicate: true });
    }
  }

  sheet.appendRow([timestamp(), email, source]);
  MailApp.sendEmail({
    to: BOOKING_EMAIL,
    subject: '✅ New ERT Subscriber',
    body: `New email subscriber:\n\nEmail: ${email}\nSource: ${source}\nTime: ${timestamp()}`
  });

  return respond({ success: true });
}

// ── HELPERS ──
function getRuleForDate(dateStr) {
  return SCHEDULE_RULES.find(r => dateStr >= r.start && dateStr <= r.end) || null;
}

function formatKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatTime(date) {
  let h = date.getHours();
  const m = String(date.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

function timestamp() {
  return new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
}

function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function respond(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// SETUP INSTRUCTIONS (do this once):
//
// 1. Go to https://sheets.google.com — create a new spreadsheet
//    Name it: "ERT — Site Data"
//    Create TWO tabs (sheets) at the bottom:
//      Tab 1: rename to "Email List"
//        Row 1 headers: Timestamp | Email | Source
//      Tab 2: rename to "Bookings"
//        Row 1 headers: Timestamp | Name | Phone | Email | Date | Time | Duration | Price | Notes
//
// 2. Click Extensions → Apps Script
//    Delete all existing code and paste THIS entire file
//    Click Save, name the project "ERT Site"
//
// 3. Click Deploy → New Deployment
//    Type: Web app
//    Execute as: Me (restorewithellis@gmail.com)
//    Who has access: Anyone
//    Click Deploy → copy the Web App URL
//
// 4. Paste that URL into BOTH:
//    - email-capture.js  →  const SHEET_URL = '...'
//    - book.html         →  const BOOKING_URL = '...'
//    (it's the same URL for both)
// ──────────────────────────────────────────────────────

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (data.type === 'booking') {
      return handleBooking(data);
    } else {
      return handleEmailSignup(data);
    }
  } catch (err) {
    return respond({ success: false, error: err.message });
  }
}

function doGet(e) {
  return respond({ status: 'ERT Site Script is running ✓' });
}

// ── EMAIL SIGNUP ──
function handleEmailSignup(data) {
  const email  = (data.email  || '').toString().trim();
  const source = (data.source || 'unknown').toString().trim();

  if (!isValidEmail(email)) return respond({ success: false, error: 'Invalid email' });

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Email List');
  const rows  = sheet.getDataRange().getValues();

  // Duplicate check
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][1] && rows[i][1].toString().toLowerCase() === email.toLowerCase()) {
      return respond({ success: true, duplicate: true });
    }
  }

  sheet.appendRow([timestamp(), email, source]);

  MailApp.sendEmail({
    to: 'restorewithellis@gmail.com',
    subject: '✅ New ERT Email Subscriber',
    body: `New subscriber!\n\nEmail: ${email}\nSource: ${source}\nTime: ${timestamp()}`
  });

  return respond({ success: true });
}

// ── BOOKING REQUEST ──
function handleBooking(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Bookings');

  sheet.appendRow([
    timestamp(),
    data.name     || '',
    data.phone    || '',
    data.email    || '',
    data.date     || '',
    data.time     || '',
    data.duration || '',
    data.price    || '',
    data.notes    || ''
  ]);

  // Notify Zachary
  MailApp.sendEmail({
    to: 'restorewithellis@gmail.com',
    subject: `📅 New Booking Request — ${data.date} at ${data.time}`,
    body: `New booking request from the website!\n\n` +
          `Name:     ${data.name}\n` +
          `Phone:    ${data.phone}\n` +
          `Email:    ${data.email}\n` +
          `Date:     ${data.date}\n` +
          `Time:     ${data.time}\n` +
          `Duration: ${data.duration} (${data.price})\n` +
          `Notes:    ${data.notes || 'None'}\n\n` +
          `Reply to confirm or reschedule.`
  });

  // Confirmation to client
  if (data.email && isValidEmail(data.email)) {
    MailApp.sendEmail({
      to: data.email,
      subject: 'Your Booking Request — Ellis Restorative Therapies',
      body: `Hi ${data.name},\n\n` +
            `Thanks for requesting an appointment! Here's what we have on file:\n\n` +
            `Date:     ${data.date}\n` +
            `Time:     ${data.time}\n` +
            `Duration: ${data.duration} (${data.price})\n\n` +
            `Zachary will confirm your appointment within a few hours. ` +
            `If you need to reach him sooner, call or text (209) 450-5296.\n\n` +
            `See you soon,\nEllis Restorative Therapies\n` +
            `restorewithellis.com`
    });
  }

  return respond({ success: true });
}

// ── Helpers ──
function respond(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function timestamp() {
  return new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
}
//
// 1. Go to https://sheets.google.com and create a new spreadsheet
//    Name it: "ERT Email List"
//    In Row 1, add these headers: Timestamp | Email | Source
//
// 2. In the spreadsheet, click Extensions → Apps Script
//
// 3. Delete all existing code and paste THIS entire file
//
// 4. Click Save (floppy disk icon), name the project "ERT Email Capture"
//
// 5. Click Deploy → New Deployment
//    - Type: Web app
//    - Description: ERT Email Capture
//    - Execute as: Me (restorewithellis@gmail.com)
//    - Who has access: Anyone
//    Click Deploy
//
// 6. Copy the Web App URL it gives you — looks like:
//    https://script.google.com/macros/s/AKfycb.../exec
//
// 7. Open email-capture.js and paste that URL into SHEET_URL at the top
//
// 8. Done! Every new subscriber will appear in the spreadsheet instantly.
// ─────────────────────────────────────────────────────────────────────

const SHEET_NAME = 'Sheet1'; // Change if you renamed the tab

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const email  = (data.email  || '').toString().trim();
    const source = (data.source || 'unknown').toString().trim();

    if (!email || !isValidEmail(email)) {
      return respond({ success: false, error: 'Invalid email' });
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

    // Check for duplicate
    const existing = sheet.getDataRange().getValues();
    for (let i = 1; i < existing.length; i++) {
      if (existing[i][1] && existing[i][1].toString().toLowerCase() === email.toLowerCase()) {
        return respond({ success: true, duplicate: true });
      }
    }

    // Append new row
    sheet.appendRow([
      new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }),
      email,
      source
    ]);

    // Optional: send Zachary a notification email
    sendNotification(email, source);

    return respond({ success: true });

  } catch (err) {
    return respond({ success: false, error: err.message });
  }
}

function doGet(e) {
  // Health check — visiting the URL in browser should return OK
  return respond({ status: 'ERT Email Capture is running' });
}

function respond(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sendNotification(email, source) {
  // Optional — comment this out if you don't want notification emails
  MailApp.sendEmail({
    to: 'restorewithellis@gmail.com',
    subject: '✅ New ERT Subscriber',
    body: `New email subscriber:\n\nEmail: ${email}\nSource: ${source}\nTime: ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}\n\nView your list: https://sheets.google.com`
  });
}
