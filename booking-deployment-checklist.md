# Therapist-Specific Booking Deployment Checklist

## Implemented behavior

The booking page now requires clients to select **Zachary Ellis** or **Hunter Ellis** before selecting an appointment date and time. Hunter is shown with **CAMTC #103413**, Monday–Friday availability from **9:00 AM to 1:00 PM**, first- and third-weekend morning availability from **9:00 AM to 1:00 PM**, and the same 60-, 90-, and 120-minute prices as Zachary.

Booking requests include the selected therapist. Hunter requests route to `ellisrestorative@gmail.com` and Zachary is copied on those notices. Zachary requests route to `restorewithellis@gmail.com`. Client confirmations identify the selected therapist.

## Required owner setup

1. In the connected Google spreadsheet, ensure the **Bookings** sheet uses these headers: `Timestamp | Therapist | Name | Phone | Email | Date | Time | Duration | Price | Notes`.
2. Share Hunter’s Google Calendar with `restorewithellis@gmail.com`, allowing that account to **make changes to events**. The Apps Script runs as this account, reads events to hide booked times, and creates confirmed Hunter appointments.
3. Open the Google Apps Script project, replace its content with the updated `google-apps-script.js`, then choose **Deploy → Manage deployments → Edit → New version → Deploy**. Keep its web-app URL unchanged.
4. Confirm an appointment request for Zachary and Hunter separately. Verify the selected therapist receives the booking request, Zachary is copied on Hunter requests, and the client receives the therapist-specific confirmation.
5. The booking module should expose Hunter’s weekend appointment options only on the first and third Saturdays and Sundays of each calendar month, and only from 9:00 AM–1:00 PM.

## Validation notes

The booking page JavaScript passed a local syntax check. The therapist toggle was visually verified: choosing Hunter changes the displayed therapist context to Hunter Ellis, CAMTC #103413, the Monday–Friday 9:00 AM–1:00 PM schedule, and the first- and third-weekend 9:00 AM–1:00 PM schedule. Live availability and notification delivery require the Apps Script deployment and calendar-sharing steps above; they cannot run from a local file preview.
