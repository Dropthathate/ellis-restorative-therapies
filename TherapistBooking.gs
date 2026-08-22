// Therapist-specific booking API. This file keeps the existing E.R.T SITE
// engagement automations intact while routing appointments to the selected therapist.

const HUNTER_EMAIL = 'ellisrestorative@gmail.com';
const HUNTER_CAMTC = 'CAMTC #103413';
const HUNTER_MORNING_SLOT_TIMES = ['9:00 AM', '10:30 AM', '12:00 PM'];
const HUNTER_WEEKDAY_OPEN_DAYS = [1, 2, 3, 4, 5];
const HUNTER_WEEKEND_CLOSE_MINUTES = 13 * 60;
const PORTAL_ACTIVITY_SHEET = 'PORTAL_ACTIVITY';
const PORTAL_ACTIVITY_TOKEN_PROPERTY = 'PORTAL_ACTIVITY_TOKEN';

const ERT_THERAPISTS = {
  zachary: {
    key: 'zachary',
    name: 'Zachary Ellis',
    calendarId: CALENDAR_ID,
    email: ADMIN_EMAIL,
    camtc: 'CAMTC #97101',
  },
  hunter: {
    key: 'hunter',
    name: 'Hunter Ellis',
    calendarId: HUNTER_EMAIL,
    email: HUNTER_EMAIL,
    camtc: HUNTER_CAMTC,
  },
};

function doGet(e) {
  try {
    const action = String(e.parameter.action || '');
    const callback = e.parameter.callback;
    const therapistKey = String(e.parameter.therapist || 'zachary');
    let result;

    if (action === 'availability') {
      result = getAvailability(Number(e.parameter.month), Number(e.parameter.year), therapistKey);
    } else if (action === 'slots') {
      result = getSlots(String(e.parameter.date || ''), Number(e.parameter.duration || 60), therapistKey);
    } else if (action === 'book') {
      result = handleBooking({
        therapist: therapistKey,
        name: e.parameter.name,
        phone: e.parameter.phone,
        email: e.parameter.email,
        date: e.parameter.date,
        time: e.parameter.time,
        duration: e.parameter.duration,
        price: e.parameter.price,
        notes: e.parameter.notes,
      });
    } else {
      result = { status: 'ERT ONLINE ✓' };
    }

    return toJsonp(result, callback);
  } catch (error) {
    return toJsonp({ success: false, error: error.message }, e.parameter.callback);
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');
    if (data.action === 'portal_question_alert') return jsonResponse(handlePortalQuestionAlert(data));
    if (data.action && data.action !== 'booking' && data.action !== 'book') {
      return jsonResponse({ success: false, error: 'Unknown request type.' });
    }
    return jsonResponse(handleBooking(data));
  } catch (error) {
    return jsonResponse({ success: false, error: error.message });
  }
}

function handlePortalQuestionAlert(data) {
  const expectedToken = PropertiesService.getScriptProperties().getProperty(PORTAL_ACTIVITY_TOKEN_PROPERTY);
  if (!expectedToken || String(data.token || '') !== expectedToken) return { success: false, error: 'Unauthorized portal activity request.' };

  const recipient = String(data.recipient || '');
  const questionId = cleanBookingText(data.questionId, 64);
  const targetEmail = recipient === 'Hunter Ellis' ? HUNTER_EMAIL : recipient === 'Zach' ? ADMIN_EMAIL : '';
  if (!targetEmail || !questionId) return { success: false, error: 'Invalid portal activity request.' };

  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  let activitySheet = spreadsheet.getSheetByName(PORTAL_ACTIVITY_SHEET);
  if (!activitySheet) {
    activitySheet = spreadsheet.insertSheet(PORTAL_ACTIVITY_SHEET);
    activitySheet.appendRow(['Timestamp', 'Activity Type', 'Question ID', 'Routed Therapist', 'Status']);
  }

  const questionIds = activitySheet.getLastRow() > 1 ? activitySheet.getRange(2, 3, activitySheet.getLastRow() - 1, 1).getValues().flat() : [];
  if (questionIds.includes(questionId)) return { success: true, duplicate: true };

  MailApp.sendEmail({
    to: targetEmail,
    subject: `New client portal question — ${recipient}`,
    body: `A client submitted a new Quick Question for ${recipient}.\n\nFor privacy, the message is not included in this email. Sign in to https://client.restorewithellis.com to view and acknowledge it.\n\nQuestion reference: ${questionId}`,
    name: 'Ellis Restorative Therapies',
  });
  activitySheet.appendRow([new Date(), 'Quick Question', questionId, recipient, 'Alert sent']);
  return { success: true };
}

function getAvailability(month, year, therapistKey) {
  const therapist = getTherapist(therapistKey);
  if (therapist.key === 'zachary') return legacyGetAvailability(month, year);
  return getHunterAvailability(month, year, therapist);
}

function getSlots(dateStr, duration, therapistKey) {
  const therapist = getTherapist(therapistKey);
  const validatedDuration = validateDuration(duration);
  if (therapist.key === 'zachary') return legacyGetSlots(dateStr, validatedDuration);
  return getHunterSlots(dateStr, validatedDuration, therapist);
}

function handleBooking(data) {
  const therapist = getTherapist(String(data.therapist || 'zachary'));
  const name = cleanBookingText(data.name, 120);
  const phone = cleanBookingText(data.phone, 40);
  const email = cleanBookingText(data.email, 320).toLowerCase();
  const date = cleanBookingText(data.date, 10);
  const time = cleanBookingText(data.time, 20);
  const duration = validateDuration(Number(data.duration));
  const price = cleanBookingText(data.price, 20) || `$${Math.round((duration / 60) * 100)}`;
  const notes = cleanBookingText(data.notes, 1000);

  if (!name || !phone || !isValidBookingEmail(email) || !isDateKey(date) || !time) {
    return { success: false, error: 'Please complete all booking details.' };
  }

  const available = getSlots(date, duration, therapist.key).slots || [];
  if (!available.includes(time)) return { success: false, error: 'Taken' };

  const start = new Date(`${date}T${to24(time)}`);
  const end = new Date(start.getTime() + duration * 60000);
  const calendar = getTherapistCalendar(therapist);
  const event = calendar.createEvent(`${ERT_TAG} ${therapist.name} — ${name}`, start, end);

  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('BOOKINGS');
  if (!sheet) throw new Error('The BOOKINGS sheet is missing.');
  // Preserve columns A–H for the existing welcome, review, and reactivation automations.
  sheet.appendRow([new Date(), name, phone, email, date, time, duration, event.getId(), therapist.name, price, notes]);

  sendTherapistBookingNotice(therapist, { name, phone, email, date, time, duration, price, notes });
  sendClientBookingConfirmation(therapist, { name, email, date, time, duration, price });

  return { success: true };
}

function getHunterAvailability(month, year, therapist) {
  if (!Number.isInteger(month) || !Number.isInteger(year)) throw new Error('Invalid calendar month.');
  const calendar = getTherapistCalendar(therapist);
  const start = new Date(year, month, 1, 0, 0, 0);
  const end = new Date(year, month + 1, 0, 23, 59, 59);
  const events = calendar.getEvents(start, end);
  const result = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let day = 1; day <= end.getDate(); day += 1) {
    const date = new Date(year, month, day, 12, 0, 0);
    const dateKey = bookingDateKey(date);
    const schedule = getHunterScheduleForDate(date);
    if (date < today || !schedule) {
      result[dateKey] = 'closed';
      continue;
    }

    const dayEvents = events.filter((event) => bookingDateKey(event.getStartTime()) === dateKey);
    if (dayEvents.some((event) => event.getTitle().toUpperCase().includes('CLOSED'))) {
      result[dateKey] = 'closed';
      continue;
    }

    const availableSlots = getOpenSlots(dateKey, 60, getHunterSlotTimes(dateKey, 60), dayEvents);
    result[dateKey] = availableSlots.length === 0 ? 'full' : availableSlots.length < getHunterSlotTimes(dateKey, 60).length ? 'partial' : 'open';
  }

  return { availability: result };
}

function getHunterSlots(dateStr, duration, therapist) {
  if (!isHunterBookingDate(dateStr)) return { slots: [] };
  const calendar = getTherapistCalendar(therapist);
  const start = new Date(`${dateStr}T00:00:00`);
  const end = new Date(`${dateStr}T23:59:59`);
  const events = calendar.getEvents(start, end);
  if (events.some((event) => event.getTitle().toUpperCase().includes('CLOSED'))) return { slots: [] };
  return { slots: getOpenSlots(dateStr, duration, getHunterSlotTimes(dateStr, duration), events) };
}

function getHunterScheduleForDate(date) {
  const dayOfWeek = date.getDay();
  if (HUNTER_WEEKDAY_OPEN_DAYS.includes(dayOfWeek)) {
    return { label: 'weekday', slotTimes: HUNTER_MORNING_SLOT_TIMES, closeMinutes: HUNTER_WEEKEND_CLOSE_MINUTES };
  }
  if ((dayOfWeek === 0 || dayOfWeek === 6) && isHunterFirstOrThirdWeekend(date)) {
    return { label: 'first-or-third-weekend', slotTimes: HUNTER_MORNING_SLOT_TIMES, closeMinutes: HUNTER_WEEKEND_CLOSE_MINUTES };
  }
  return null;
}

function getHunterSlotTimes(dateStr, duration) {
  if (!isDateKey(dateStr)) return [];
  const date = new Date(`${dateStr}T12:00:00`);
  const schedule = getHunterScheduleForDate(date);
  if (!schedule) return [];
  if (!schedule.closeMinutes) return schedule.slotTimes;
  return schedule.slotTimes.filter((slot) => hunterTimeToMinutes(slot) + duration <= schedule.closeMinutes);
}

function isHunterFirstOrThirdWeekend(date) {
  const saturday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - (date.getDay() === 0 ? 1 : 0), 12, 0, 0);
  if (saturday.getMonth() !== date.getMonth()) return false;
  const weekendNumber = Math.floor((saturday.getDate() - 1) / 7) + 1;
  return weekendNumber === 1 || weekendNumber === 3;
}

function hunterTimeToMinutes(time) {
  const match = String(time).match(/^(\d{1,2}):(\d{2})\s(AM|PM)$/);
  if (!match) throw new Error('Invalid appointment time.');
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  if (match[3] === 'PM' && hour !== 12) hour += 12;
  if (match[3] === 'AM' && hour === 12) hour = 0;
  return hour * 60 + minute;
}

function getOpenSlots(dateStr, duration, slots, events) {
  const restBufferMinutes = 15;
  return slots.filter((slot) => {
    const start = new Date(`${dateStr}T${to24(slot)}`);
    const end = new Date(start.getTime() + duration * 60000);
    return !events.some((event) => {
      const eventStart = new Date(event.getStartTime().getTime() - restBufferMinutes * 60000);
      const eventEnd = new Date(event.getEndTime().getTime() + restBufferMinutes * 60000);
      return start < eventEnd && end > eventStart;
    });
  });
}

function sendTherapistBookingNotice(therapist, booking) {
  const recipients = therapist.key === 'hunter' ? `${therapist.email},${ADMIN_EMAIL}` : ADMIN_EMAIL;
  MailApp.sendEmail({
    to: recipients,
    subject: `New booking — ${therapist.name} · ${booking.date} at ${booking.time}`,
    body:
      `Therapist: ${therapist.name} (${therapist.camtc})\n` +
      `Client: ${booking.name}\nPhone: ${booking.phone}\nEmail: ${booking.email}\n` +
      `Date: ${booking.date}\nTime: ${booking.time}\n` +
      `Session: ${booking.duration} minutes (${booking.price})\n` +
      `Notes: ${booking.notes || 'None'}\n\n` +
      `The appointment has been added to ${therapist.name}'s calendar.`,
    name: 'Ellis Restorative Therapies',
  });
}

function sendClientBookingConfirmation(therapist, booking) {
  const safeName = escapeBookingHtml(booking.name);
  const safeTherapist = escapeBookingHtml(therapist.name);
  GmailApp.sendEmail(booking.email, `Appointment Confirmed: ${therapist.name} | Ellis Restorative Therapies`, '', {
    name: 'Ellis Restorative Therapies',
    htmlBody:
      `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#243033;border:1px solid #d8e0dd;border-radius:8px;overflow:hidden">` +
      `<div style="background:#173a3b;padding:28px;text-align:center"><h2 style="color:#fff;margin:0">Appointment Confirmed</h2></div>` +
      `<div style="padding:28px"><p>Hi ${safeName},</p><p>Your session with <strong>${safeTherapist}</strong> is confirmed.</p>` +
      `<div style="background:#f4f8f6;padding:18px;border-left:4px solid #4d9b92;margin:22px 0">` +
      `<p style="margin:0 0 8px"><strong>Date:</strong> ${escapeBookingHtml(booking.date)}</p>` +
      `<p style="margin:0 0 8px"><strong>Time:</strong> ${escapeBookingHtml(booking.time)}</p>` +
      `<p style="margin:0"><strong>Session:</strong> ${booking.duration} minutes (${escapeBookingHtml(booking.price)})</p></div>` +
      `<p>Questions or changes? Call or text (209) 450-5296.</p><p>Ellis Restorative Therapies</p></div></div>`,
  });
}

function getTherapist(key) {
  const therapist = ERT_THERAPISTS[key];
  if (!therapist) throw new Error('Please select a valid therapist.');
  return therapist;
}

function getTherapistCalendar(therapist) {
  const calendar = CalendarApp.getCalendarById(therapist.calendarId);
  if (!calendar) throw new Error(`${therapist.name}'s Google Calendar is unavailable. Confirm calendar sharing first.`);
  return calendar;
}

function validateDuration(duration) {
  const value = Number(duration);
  if (![60, 90, 120].includes(value)) throw new Error('Please select a valid session length.');
  return value;
}

function cleanBookingText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function isValidBookingEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isDateKey(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isHunterBookingDate(dateStr) {
  if (!isDateKey(dateStr)) return false;
  const date = new Date(`${dateStr}T12:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today && Boolean(getHunterScheduleForDate(date));
}

function bookingDateKey(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function escapeBookingHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
