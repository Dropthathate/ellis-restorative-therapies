const CALENDAR_ID = 'restorewithellis@gmail.com';
const ERT_TAG = '[ERT]';
const ADMIN_EMAIL = 'restorewithellis@gmail.com';
const SHEET_ID = '1ZidOcBIcd_ZMD_nJ4KF7iHSmENYq-I1KLNgb-m-3WlU';

function sanitizeCallback(cb) {
  if (!cb) return null;
  return /^[a-zA-Z_$][a-zA-Z0-9_$.]*$/.test(cb) ? cb : null;
}

function toJsonp(result, cb) {
  const safe = sanitizeCallback(cb);
  const body = JSON.stringify(result);
  const output = safe ? `${safe}(${body})` : body;
  return ContentService.createTextOutput(output).setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function legacyDoGet(e) {
  const action = e.parameter.action;
  const cb = e.parameter.callback;
  let result;

  if (action === 'availability') {
    result = getAvailability(parseInt(e.parameter.month), parseInt(e.parameter.year));
  } else if (action === 'slots') {
    // Grabs the duration (60, 90, or 120) from the frontend if sent. Defaults to 60.
    const duration = e.parameter.duration ? parseInt(e.parameter.duration) : 60;
    result = getSlots(e.parameter.date, duration); // FIXED: duration now actually passed through
  } else if (action === 'book') {
    result = handleBooking({
      name: e.parameter.name,
      phone: e.parameter.phone,
      email: e.parameter.email,
      date: e.parameter.date,
      time: e.parameter.time,
      duration: parseInt(e.parameter.duration)
    });
  } else {
    result = { status: "ERT ONLINE ✓" };
  }

  return toJsonp(result, cb);
}

function legacyDoPost(e) {
  const data = JSON.parse(e.postData.contents);
  const result = handleBooking(data);
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function legacyHandleBooking(data) {
  const duration = Number(data.duration);
  const start = new Date(`${data.date}T${to24(data.time)}`);
  const end = new Date(start.getTime() + duration * 60000);
  const cal = CalendarApp.getCalendarById(CALENDAR_ID);

  // Check for conflicts
  const conflict = cal.getEvents(start, end).filter(e => e.getTitle().includes(ERT_TAG));
  if (conflict.length) return { success: false, error: "Taken" };

  // Create Calendar Event
  const event = cal.createEvent(`${ERT_TAG} ${data.name}`, start, end);

  // Log to Google Sheet
  SpreadsheetApp.openById(SHEET_ID).getSheetByName("BOOKINGS").appendRow([
    new Date(), data.name, data.phone, data.email, data.date, data.time, duration, event.getId()
  ]);

  // 1. Instantly notify Zachary (Admin)
  MailApp.sendEmail(ADMIN_EMAIL, "New Booking", JSON.stringify(data));

  // 2. Instantly email the Client (New Confirmation Email)
  if (data.email) {
    const subject = "Appointment Confirmed: Ellis Restorative Therapies";

    const htmlBody = `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333333; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: #4a90e2; padding: 30px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0; font-size: 24px;">Appointment Confirmed!</h2>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; line-height: 1.6;">Hi ${data.name},</p>
          <p style="font-size: 16px; line-height: 1.6;">Your session with Zachary Ellis is officially on the books. We are looking forward to seeing you.</p>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 25px 0; border-left: 4px solid #4a90e2;">
            <p style="margin: 0 0 10px 0; font-size: 16px;"><strong>Date:</strong> ${data.date}</p>
            <p style="margin: 0 0 10px 0; font-size: 16px;"><strong>Time:</strong> ${data.time}</p>
            <p style="margin: 0; font-size: 16px;"><strong>Duration:</strong> ${duration} minutes</p>
          </div>
          <p style="font-size: 16px; line-height: 1.6;">If you need to reschedule or have any questions before your appointment, please reply directly to this email.</p>
          <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;">
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 0;">See you soon,</p>
          <p style="font-size: 16px; line-height: 1.6; margin-top: 5px;"><strong>Zachary Ellis</strong><br>Ellis Restorative Therapies</p>
        </div>
      </div>
    `;

    GmailApp.sendEmail(data.email, subject, '', {
      htmlBody: htmlBody,
      name: "Ellis Restorative Therapies"
    });
  }

  return { success: true };
}

function legacyGetAvailability(month, year) {
  const cal = CalendarApp.getCalendarById(CALENDAR_ID);
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  const events = cal.getEvents(start, end);
  const map = {};
  const today = new Date();
  today.setHours(0,0,0,0);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const dow = d.getDay();
    const isSummer = (month >= 4 && month <= 6);

    let closed = d < today || (dow === 0 || dow === 5 || dow === 6);

    // Get all events specifically on this day
    const dayEvents = events.filter(e =>
      e.getStartTime().getFullYear() === d.getFullYear() &&
      e.getStartTime().getMonth() === d.getMonth() &&
      e.getStartTime().getDate() === d.getDate()
    );

    // Check if Zachary added an event called "CLOSED"
    const isBlocked = dayEvents.some(e => e.getTitle().toUpperCase().includes('CLOSED'));

    const count = dayEvents.length;

    // If 'CLOSED' is found, force the day to show as closed on the website
    map[key] = (closed || isBlocked) ? "closed" : (count >= 4 ? "full" : "open");
  }

  return { availability: map };
}

// Converts a "h:mm AM/PM" string into total minutes since midnight, for easy comparison
function timeToMinutes(t) {
  let [time, mod] = t.split(" ");
  let [h, m] = time.split(":").map(Number);
  if (mod === "PM" && h !== 12) h += 12;
  if (mod === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

function legacyGetSlots(dateStr, duration) {
  duration = duration || 60; // FIXED: default when not passed, and now used below for real conflict math

  const parts = dateStr.split('-');
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1;
  const day = parseInt(parts[2]);
  const dateObj = new Date(year, month, day);
  const dow = dateObj.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat

  const isSummer = (month >= 4 && month <= 6);

  let all = isSummer
    ? ["12:30 PM","1:30 PM","2:30 PM","3:30 PM","4:30 PM","5:30 PM","6:30 PM","7:00 PM"]
    : ["10:00 AM","11:00 AM","12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM"];

  // RULE: no appointments before 1:00 PM Monday through Thursday
  const isMonToThu = (dow >= 1 && dow <= 4);
  if (isMonToThu) {
    const cutoff = timeToMinutes("1:00 PM");
    all = all.filter(t => timeToMinutes(t) >= cutoff);
  }

  const cal = CalendarApp.getCalendarById(CALENDAR_ID);
  const events = cal.getEvents(new Date(dateStr), new Date(dateStr + "T23:59:59"));

  const isBlocked = events.some(e => e.getTitle().toUpperCase().includes('CLOSED'));
  if (isBlocked) {
    return { slots: [] };
  }

  // Turnaround time between sessions
  const REST_BUFFER = 15;

  const availableSlots = all.filter(slotTimeStr => {
    const slotStart = new Date(`${dateStr}T${to24(slotTimeStr)}`);
    const slotEnd = new Date(slotStart.getTime() + duration * 60000); // FIXED: uses actual requested duration, not hardcoded 60

    // Check if this slot overlaps with ANY existing calendar event + buffer
    const hasConflict = events.some(e => {
      const eStart = new Date(e.getStartTime().getTime() - REST_BUFFER * 60000);
      const eEnd = new Date(e.getEndTime().getTime() + REST_BUFFER * 60000);
      return (slotStart < eEnd && slotEnd > eStart);
    });

    return !hasConflict;
  });

  return { slots: availableSlots };
}

function to24(t) {
  let [time, mod] = t.split(" ");
  let [h, m] = time.split(":");
  h = Number(h);
  if (mod === "PM" && h !== 12) h += 12;
  if (mod === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2,"0")}:${m}:00`;
}

function formatTime(date) {
  let h = date.getHours();
  let m = String(date.getMinutes()).padStart(2,"0");
  let mod = h >= 12 ? "PM" : "AM";
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${mod}`;
}

function testBooking2() {
  Logger.log(JSON.stringify(handleBooking({
    name: 'Test',
    phone: '2095550000',
    email: 'test@test.com',
    date: '2026-05-05',
    time: '1:30 PM',
    duration: 60
  })));
}

// TEST: verifies the Mon-Thu 1PM cutoff without touching the live calendar
function testMonToThuCutoff() {
  const testDates = {
    "2026-07-13": "Monday",
    "2026-07-14": "Tuesday",
    "2026-07-15": "Wednesday",
    "2026-07-16": "Thursday",
    "2026-07-17": "Friday"
  };

  Object.keys(testDates).forEach(dateStr => {
    const parts = dateStr.split('-');
    const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const dow = dateObj.getDay();
    const isMonToThu = (dow >= 1 && dow <= 4);

    const month = parseInt(parts[1]) - 1;
    const isSummer = (month >= 4 && month <= 6);
    let all = isSummer
      ? ["12:30 PM","1:30 PM","2:30 PM","3:30 PM","4:30 PM","5:30 PM","6:30 PM","7:00 PM"]
      : ["10:00 AM","11:00 AM","12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM"];

    if (isMonToThu) {
      const cutoff = timeToMinutes("1:00 PM");
      all = all.filter(t => timeToMinutes(t) >= cutoff);
    }

    Logger.log(`${dateStr} (${testDates[dateStr]}): ${JSON.stringify(all)}`);
  });
}

// -------------------------------------------------------------------------
// AUTOMATED EMAIL FUNCTIONS
// -------------------------------------------------------------------------

function sendWelcomeEmails() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("BOOKINGS");

  if (!sheet) {
    Logger.log("Sheet not found.");
    return;
  }

  const data = sheet.getDataRange().getValues();

  const NAME_COL = 1;   // Column B
  const EMAIL_COL = 3;  // Column D
  const STATUS_COL = 9; // Column J

  for (let i = 1; i < data.length; i++) {
    const name = data[i][NAME_COL];
    const email = data[i][EMAIL_COL];
    const status = data[i][STATUS_COL];

    // Bulletproof check: ignores spaces and capitals
    const safeStatus = String(status).trim().toLowerCase();

    if (email && safeStatus !== 'sent' && safeStatus !== 'unsubscribed') {
      const subject = "Welcome to Ellis Restorative Therapies";

      const htmlBody = `
        <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333333; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
          <img src="https://scontent-sjc3-1.xx.fbcdn.net/v/t39.30808-6/689009082_122126356503032489_9135241901317201693_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=833d8c&_nc_ohc=BwGuWC77oUUQ7kNvwE6s5rS&_nc_oc=AdpwV22fBeVbSE1AQS9RnQjKQXlsc2Gizgr0ZIZG-Jcup_DYaYXUJarK3u9_FcXFGf1i7Qxc1ztnc13NQxoLFG6h&_nc_zt=23&_nc_ht=scontent-sjc3-1.xx&_nc_gid=Rcxt-D2PcT9_2QLHn3pIfQ&_nc_ss=7b289&oh=00_Af6NXzuYEZl_HAH0RXxhAldlipoWmvjXiZYOFLsvnRGTig&oe=6A15C69C" alt="Ellis Restorative Therapies" style="width: 100%; max-width: 600px; height: auto; display: block; border-bottom: 3px solid #4a90e2;">
          <div style="padding: 30px;">
            <h2 style="color: #2c3e50; margin-top: 0; font-size: 24px;">Hi ${name},</h2>
            <p style="font-size: 16px; line-height: 1.6;">It was great connecting with you. I wanted to officially welcome you to Ellis Restorative Therapies and share a few ways we can work together.</p>
            <div style="text-align: center; margin: 35px 0;">
              <a href="https://www.restorewithellis.com" style="background-color: #4a90e2; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">Visit Our Website & Book</a>
            </div>
            <p style="font-size: 16px; line-height: 1.6;">If you'd like to stay updated or see what other clients are saying, I'd love for you to connect with me online:</p>
            <ul style="font-size: 16px; line-height: 1.8; margin-bottom: 30px;">
              <li><a href="https://www.facebook.com/profile.php?id=61580974690488" style="color: #4a90e2; font-weight: bold;">Follow us on Facebook</a></li>
              <li><a href="https://share.google/1OJNERSpSycYjchn5" style="color: #4a90e2; font-weight: bold;">Check out our Google Reviews</a></li>
            </ul>
            <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;">
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 0;">Best regards,</p>
            <p style="font-size: 16px; line-height: 1.6; margin-top: 5px;"><strong>Zachary Ellis</strong><br>Ellis Restorative Therapies</p>
          </div>
          <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
            <p style="font-size: 12px; color: #888888; margin: 0; line-height: 1.5;">
              You are receiving this email because you recently connected with Ellis Restorative Therapies.<br>
              If you no longer wish to receive these updates, please
              <a href="mailto:restorewithellis@gmail.com?subject=Unsubscribe%20Me" style="color: #888888; text-decoration: underline;">click here to unsubscribe</a>.
            </p>
          </div>
        </div>
      `;

      GmailApp.sendEmail(email, subject, '', {
        htmlBody: htmlBody,
        name: "Ellis Restorative Therapies"
      });

      sheet.getRange(i + 1, STATUS_COL + 1).setValue('Sent');
      Utilities.sleep(1000);
    }
  }
}

function sendReviewRequests() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("BOOKINGS");

  if (!sheet) {
    Logger.log("Sheet not found.");
    return;
  }

  const data = sheet.getDataRange().getValues();

  const NAME_COL = 1;       // Column B
  const EMAIL_COL = 3;      // Column D
  const DATE_COL = 4;       // Column E (Appt Date)
  const WELCOME_STATUS = 9; // Column J (To check for unsubs)
  const REVIEW_STATUS = 10; // Column K (New tracking column)

  // Calculate yesterday's date string (Format: YYYY-MM-DD)
  const timezone = Session.getScriptTimeZone();
  const today = new Date();
  today.setDate(today.getDate() - 1);
  const yesterdayStr = Utilities.formatDate(today, timezone, "yyyy-MM-dd");

  for (let i = 1; i < data.length; i++) {
    const name = data[i][NAME_COL];
    const email = data[i][EMAIL_COL];
    const apptDateRaw = data[i][DATE_COL];

    // Skip empty rows early
    if (!email || !apptDateRaw) continue;

    // Convert row's appointment date to standard string for accurate matching
    let apptDateStr = "";
    try {
      apptDateStr = Utilities.formatDate(new Date(apptDateRaw), timezone, "yyyy-MM-dd");
    } catch(e) {
      continue;
    }

    const welcomeStat = String(data[i][WELCOME_STATUS]).trim().toLowerCase();
    const reviewStat = String(data[i][REVIEW_STATUS]).trim().toLowerCase();

    // Only send if the appointment was yesterday, they haven't gotten the review email yet,
    // and they haven't explicitly unsubscribed in either status column.
    if (apptDateStr === yesterdayStr && reviewStat !== 'sent' && welcomeStat !== 'unsubscribed' && reviewStat !== 'unsubscribed') {

      const subject = "Checking in: How are you feeling?";

      const htmlBody = `
        <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333333; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
          <img src="https://scontent-sjc3-1.xx.fbcdn.net/v/t39.30808-6/700102258_122127196731032489_8672709083032214887_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=833d8c&_nc_ohc=ht40_pZ3rKgQ7kNvwHxubfj&_nc_oc=AdoDuln3hu0Kw1-NuKkyorF-x0-fNHae7qFaNK1nd217P3wRVPb7N48A8rmon3LQeIBh3ep3dQ-maLFg2V0rOXp0&_nc_zt=23&_nc_ht=scontent-sjc3-1.xx&_nc_gid=04_VzGUd5b9mG-nePJlF1g&_nc_ss=7b2a8&oh=00_Af7npX36RSlFt53IUla02uZUwSOG5BCI-85NMG3Yj7Q5bg&oe=6A168AF9" alt="Ellis Restorative Therapies" style="width: 100%; max-width: 600px; height: auto; display: block; border-bottom: 3px solid #4a90e2;">
          <div style="padding: 30px;">
            <h2 style="color: #2c3e50; margin-top: 0; font-size: 24px;">Hi ${name},</h2>
            <p style="font-size: 16px; line-height: 1.6;">Thank you for coming in to Ellis Restorative Therapies yesterday. I hope you're feeling great today.</p>
            <p style="font-size: 16px; line-height: 1.6;">My business grows primarily through word-of-mouth. If you enjoyed your session and have 60 seconds to spare, leaving a quick Google review makes a massive difference.</p>
            <div style="text-align: center; margin: 35px 0;">
              <a href="https://share.google/1OJNERSpSycYjchn5" style="background-color: #4a90e2; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">Leave a Google Review</a>
            </div>
            <p style="font-size: 16px; line-height: 1.6;">When you're ready for your next session, you can view my availability <a href="https://www.restorewithellis.com" style="color: #4a90e2; font-weight: bold;">here</a>.</p>
            <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;">
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 0;">Best regards,</p>
            <p style="font-size: 16px; line-height: 1.6; margin-top: 5px;"><strong>Zachary Ellis</strong><br>Ellis Restorative Therapies</p>
          </div>
          <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
            <p style="font-size: 12px; color: #888888; margin: 0; line-height: 1.5;">
              If you no longer wish to receive these updates, please
              <a href="mailto:restorewithellis@gmail.com?subject=Unsubscribe%20Me" style="color: #888888; text-decoration: underline;">click here to unsubscribe</a>.
            </p>
          </div>
        </div>
      `;

      GmailApp.sendEmail(email, subject, '', {
        htmlBody: htmlBody,
        name: "Ellis Restorative Therapies"
      });

      // Auto-stamp 'Sent' into Column K
      sheet.getRange(i + 1, REVIEW_STATUS + 1).setValue('Sent');
      Utilities.sleep(1000);
    }
  }
}

function sendReactivationEmails() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("BOOKINGS");

  if (!sheet) {
    Logger.log("Sheet not found.");
    return;
  }

  const data = sheet.getDataRange().getValues();

  const NAME_COL = 1;       // Column B
  const EMAIL_COL = 3;      // Column D
  const DATE_COL = 4;       // Column E (Appt Date)
  const WELCOME_STATUS = 9; // Column J
  const REVIEW_STATUS = 10; // Column K
  const REACTIVATION_STATUS = 11; // Column L (New tracking column)

  // Calculate exactly 60 days ago
  const timezone = Session.getScriptTimeZone();
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - 60);
  const targetDateStr = Utilities.formatDate(targetDate, timezone, "yyyy-MM-dd");

  for (let i = 1; i < data.length; i++) {
    const name = data[i][NAME_COL];
    const email = data[i][EMAIL_COL];
    const apptDateRaw = data[i][DATE_COL];

    if (!email || !apptDateRaw) continue;

    let apptDateStr = "";
    try {
      apptDateStr = Utilities.formatDate(new Date(apptDateRaw), timezone, "yyyy-MM-dd");
    } catch(e) {
      continue;
    }

    const welcomeStat = String(data[i][WELCOME_STATUS]).trim().toLowerCase();
    const reviewStat = String(data[i][REVIEW_STATUS]).trim().toLowerCase();
    const reactStat = String(data[i][REACTIVATION_STATUS]).trim().toLowerCase();

    // Send if appt was 60 days ago, no reactivation sent yet, and not unsubscribed globally
    if (apptDateStr === targetDateStr && reactStat !== 'sent' && welcomeStat !== 'unsubscribed' && reviewStat !== 'unsubscribed' && reactStat !== 'unsubscribed') {

      const subject = "It's been a while! How are you feeling?";

      const htmlBody = `
        <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333333; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
          <img src="https://scontent-sjc6-1.xx.fbcdn.net/v/t39.30808-6/680659620_122125835241032489_3314055772666867349_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=127cfc&_nc_ohc=7ok35gh7WBYQ7kNvwHxDe2h&_nc_oc=Adr5O2pvA3tOLhyOGmhmWzQV3Hd4yGxpy0MnUUf8p44tAAieEEAQLv_69EVoumK-4fb46rprocTMjkbAiBqd_6MG&_nc_zt=23&_nc_ht=scontent-sjc6-1.xx&_nc_gid=v0JHVcA3O_ZLN8Xwp_Vo5g&_nc_ss=7b2a8&oh=00_Af6U0V0Wz7mrucDHF2stmMenS504G0PoIVDS86Mh48UNhw&oe=6A168683" alt="Ellis Restorative Therapies" style="width: 100%; max-width: 600px; height: auto; display: block; border-bottom: 3px solid #4a90e2;">
          <div style="padding: 30px;">
            <h2 style="color: #2c3e50; margin-top: 0; font-size: 24px;">Hi ${name},</h2>
            <p style="font-size: 16px; line-height: 1.6;">It's been a little while since your last session at Ellis Restorative Therapies. I wanted to check in and see how your body is holding up.</p>
            <p style="font-size: 16px; line-height: 1.6;">If you've been feeling any tightness or just need a reset, you can check my current availability below to book a tune-up.</p>
            <div style="text-align: center; margin: 35px 0;">
              <a href="https://www.restorewithellis.com" style="background-color: #4a90e2; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">Book a Tune-Up Session</a>
            </div>
            <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;">
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 0;">Best regards,</p>
            <p style="font-size: 16px; line-height: 1.6; margin-top: 5px;"><strong>Zachary Ellis</strong><br>Ellis Restorative Therapies</p>
          </div>
          <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
            <p style="font-size: 12px; color: #888888; margin: 0; line-height: 1.5;">
              If you no longer wish to receive these updates, please
              <a href="mailto:restorewithellis@gmail.com?subject=Unsubscribe%20Me" style="color: #888888; text-decoration: underline;">click here to unsubscribe</a>.
            </p>
          </div>
        </div>
      `;

      GmailApp.sendEmail(email, subject, '', {
        htmlBody: htmlBody,
        name: "Ellis Restorative Therapies"
      });

      // Auto-stamp 'Sent' into Column L
      sheet.getRange(i + 1, REACTIVATION_STATUS + 1).setValue('Sent');
      Utilities.sleep(1000);
    }
  }
}
