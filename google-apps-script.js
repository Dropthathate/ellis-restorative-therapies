// ── Ellis Restorative Therapies · Google Apps Script ──
// Handles therapist-specific calendar availability, booking requests, and email signups.
// Deploy this file as a Web App after pasting it into the connected Apps Script project.

const TIME_ZONE = 'America/Los_Angeles';
const ERT_TAG = '[ERT]';
const ADMIN_EMAIL = 'restorewithellis@gmail.com';
const SCHEDULE_START = '2026-08-18';

// Hunter must share his Google Calendar with the account that owns this Apps Script
// (currently restorewithellis@gmail.com), with permission to view event details.
const THERAPISTS = {
  zachary: {
    key: 'zachary',
    name: 'Zachary Ellis',
    email: ADMIN_EMAIL,
    calendarId: ADMIN_EMAIL,
    camtc: 'CAMTC #97101',
    openDays: [1, 2, 3, 4], // Monday–Thursday
    slots: ['10:00 AM', '11:30 AM', '1:00 PM', '2:30 PM', '4:00 PM', '5:30 PM'],
  },
  hunter: {
    key: 'hunter',
    name: 'Hunter Ellis',
    email: 'hunterellissss@gmail.com',
    calendarId: 'hunterellissss@gmail.com',
    camtc: 'CAMTC #103413',
    openDays: [1, 2, 3, 4, 5], // Monday–Friday
    // These start times keep a two-hour session inside Hunter's 12:51 PM–8:00 PM weekday window.
    slots: ['12:51 PM', '3:21 PM', '5:51 PM'],
  },
};

function doGet(e) {
  try {
    const action = String(e.parameter.action || '');
    const therapistKey = String(e.parameter.therapist || 'zachary');

    if (action === 'availability') {
      return getAvailability(e.parameter.month, e.parameter.year, therapistKey);
    }
    if (action === 'slots') {
      return getSlots(String(e.parameter.date || ''), therapistKey);
    }
    return respond({ success: true, status: 'ERT booking script is running' });
  } catch (error) {
    return respond({ success: false, error: error.message });
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');
    if (data.action === 'booking') return handleBooking(data);
    if (data.action === 'emailSignup') return handleEmailSignup(data);
    return respond({ success: false, error: 'Unknown request type.' });
  } catch (error) {
    return respond({ success: false, error: error.message });
  }
}

function getAvailability(monthValue, yearValue, therapistKey) {
  const therapist = getTherapist(therapistKey);
  const month = Number(monthValue);
  const year = Number(yearValue);
  if (!Number.isInteger(month) || !Number.isInteger(year)) throw new Error('A valid month and year are required.');

  const startOfMonth = new Date(year, month, 1, 0, 0, 0);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);
  const bookedSlots = getERTEvents(therapist, startOfMonth, endOfMonth);
  const result = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let day = 1; day <= endOfMonth.getDate(); day += 1) {
    const date = new Date(year, month, day, 12, 0, 0);
    const dateKey = formatKey(date);
    if (date < today || dateKey < SCHEDULE_START || !therapist.openDays.includes(date.getDay())) continue;

    const booked = bookedSlots[dateKey] || [];
    const openCount = therapist.slots.filter((slot) => !booked.includes(slot)).length;
    if (openCount === 0) result[dateKey] = 'full';
    else if (openCount < therapist.slots.length) result[dateKey] = 'partial';
    else result[dateKey] = 'open';
  }

  return respond({ success: true, therapist: therapist.key, availability: result });
}

function getSlots(dateKey, therapistKey) {
  const therapist = getTherapist(therapistKey);
  if (!isBookableDate(dateKey, therapist)) return respond({ success: true, slots: [] });

  const start = new Date(`${dateKey}T00:00:00`);
  const end = new Date(`${dateKey}T23:59:59`);
  const bookedMap = getERTEvents(therapist, start, end);
  const booked = bookedMap[dateKey] || [];
  const slots = therapist.slots.filter((slot) => !booked.includes(slot));

  return respond({ success: true, therapist: therapist.key, slots: slots });
}

function handleBooking(data) {
  const therapist = getTherapist(String(data.therapist || ''));
  const name = cleanText(data.name, 120);
  const phone = cleanText(data.phone, 40);
  const email = cleanText(data.email, 320).toLowerCase();
  const date = cleanText(data.date, 10);
  const time = cleanText(data.time, 20);
  const duration = cleanText(data.duration, 10);
  const price = cleanText(data.price, 20);
  const notes = cleanText(data.notes, 1000);

  if (!name || !phone || !isValidEmail(email) || !date || !time || !duration) {
    return respond({ success: false, error: 'Please complete the required booking details.' });
  }
  if (!isBookableDate(date, therapist) || !therapist.slots.includes(time)) {
    return respond({ success: false, error: 'That appointment time is no longer available.' });
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Bookings');
  if (!sheet) throw new Error('The Bookings sheet is missing.');
  sheet.appendRow([
    timestamp(), therapist.name, name, phone, email, date, time, duration, price, notes,
  ]);

  const recipientOptions = {
    to: therapist.email,
    subject: `New ${therapist.name} Booking Request — ${date} at ${time}`,
    body:
      `New booking request\n\n` +
      `Therapist: ${therapist.name} (${therapist.camtc})\n` +
      `Client:    ${name}\n` +
      `Phone:     ${phone}\n` +
      `Email:     ${email}\n` +
      `Date:      ${date}\n` +
      `Time:      ${time}\n` +
      `Session:   ${duration} minutes (${price})\n` +
      `Notes:     ${notes || 'None'}\n\n` +
      `To hold the time, add "${ERT_TAG} ${therapist.name} — ${name}" to the appropriate Google Calendar.`,
  };
  // Zachary remains informed of Hunter's incoming booking requests.
  if (therapist.email !== ADMIN_EMAIL) recipientOptions.cc = ADMIN_EMAIL;
  MailApp.sendEmail(recipientOptions);

  MailApp.sendEmail({
    to: email,
    subject: `Booking Request Received — ${therapist.name} | Ellis Restorative Therapies`,
    body:
      `Hi ${name},\n\n` +
      `Thanks for requesting a session with ${therapist.name}.\n\n` +
      `Therapist: ${therapist.name}\n` +
      `Date:      ${date}\n` +
      `Time:      ${time}\n` +
      `Session:   ${duration} minutes (${price})\n\n` +
      `${therapist.name} will review and confirm your request shortly. ` +
      `Questions? Call or text (209) 450-5296.\n\n` +
      `Ellis Restorative Therapies\nrestorewithellis.com`,
  });

  return respond({ success: true });
}

function handleEmailSignup(data) {
  const email = cleanText(data.email, 320).toLowerCase();
  const source = cleanText(data.source || 'website', 120);
  if (!isValidEmail(email)) return respond({ success: false, error: 'Please enter a valid email address.' });

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Email List');
  if (!sheet) throw new Error('The Email List sheet is missing.');
  const rows = sheet.getDataRange().getValues();
  for (let row = 1; row < rows.length; row += 1) {
    if (String(rows[row][1] || '').toLowerCase() === email) return respond({ success: true, duplicate: true });
  }

  sheet.appendRow([timestamp(), email, source]);
  MailApp.sendEmail({
    to: ADMIN_EMAIL,
    subject: 'New ERT Subscriber',
    body: `New subscriber\n\nEmail: ${email}\nSource: ${source}\nTime: ${timestamp()}`,
  });
  return respond({ success: true });
}

function getTherapist(key) {
  const therapist = THERAPISTS[key];
  if (!therapist) throw new Error('Please select a valid therapist.');
  return therapist;
}

function getERTEvents(therapist, startDate, endDate) {
  const calendar = CalendarApp.getCalendarById(therapist.calendarId);
  if (!calendar) {
    throw new Error(`${therapist.name}'s calendar is not available. Confirm calendar sharing and try again.`);
  }

  const booked = {};
  calendar.getEvents(startDate, endDate).forEach((event) => {
    if (!event.getTitle().includes(ERT_TAG)) return;
    const eventStart = event.getStartTime();
    const key = formatKey(eventStart);
    if (!booked[key]) booked[key] = [];
    booked[key].push(formatTime(eventStart));
  });
  return booked;
}

function isBookableDate(dateKey, therapist) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || dateKey < SCHEDULE_START) return false;
  const date = new Date(`${dateKey}T12:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today && therapist.openDays.includes(date.getDay());
}

function cleanText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function formatKey(date) {
  return Utilities.formatDate(date, TIME_ZONE, 'yyyy-MM-dd');
}

function formatTime(date) {
  return Utilities.formatDate(date, TIME_ZONE, 'h:mm a');
}

function timestamp() {
  return Utilities.formatDate(new Date(), TIME_ZONE, 'M/d/yyyy, h:mm a');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function respond(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

// Setup checklist:
// 1. In the connected spreadsheet, create an "Email List" tab with: Timestamp | Email | Source.
// 2. Create a "Bookings" tab with: Timestamp | Therapist | Name | Phone | Email | Date | Time | Duration | Price | Notes.
// 3. Share Hunter's Google Calendar with restorewithellis@gmail.com (view event details).
// 4. Paste this file into the Apps Script project, save, and Deploy → Manage deployments → Edit → New version.
// 5. Keep the web-app deployment set to execute as restorewithellis@gmail.com and allow public access for the booking relay.
