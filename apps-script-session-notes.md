# Google Apps Script Session Notes

The Google account **restorewithellis@gmail.com** is signed in to the Apps Script dashboard. The **My Projects** page is still loading its project list, so the existing ERT booking automation has not yet been opened or deployed.

The therapist-specific source code is committed to the repository in `google-apps-script.js`. Deploying it will require opening the existing ERT Apps Script project, replacing the current duplicated legacy source with the committed version, and creating a new web-app deployment version while preserving the existing endpoint URL used by `proxy.php`.

## Updated finding

The live **E.R.T SITE** Apps Script contains approximately 23,219 characters across 495 lines. In addition to booking availability and confirmation logic, it includes calendar-event creation plus welcome, review-request, and reactivation email functions. The live source must therefore be **extended rather than replaced** so those existing workflows are retained.

## Applied update

The merged source has been saved in the **E.R.T SITE** Apps Script editor. It preserves the legacy engagement automation functions and adds therapist-specific booking, Hunter Ellis availability, calendar routing, and client/therapist confirmation logic. The saved code is not yet active at the existing web-app URL; a new deployment version must be published to activate it.

## Deployment verification

The public website’s configured relay endpoint and the visible E.R.T SITE deployment labels do not map one-to-one. To avoid altering a public URL before verification, the therapist-specific code is being tested through the head deployment endpoint first:

`https://script.google.com/macros/s/AKfycbyXHCMsyI-a8jhJNedfX--nQLXRxHywi8ndG0kpF8M/dev`

The separate **E.R.T Booking System** project was inspected and intentionally left unchanged; it returns a different master-script response and is not used for this test.

## Test results

- The test endpoint returned Zachary Ellis availability successfully for August 2026, including open weekday dates.
- Hunter Ellis availability cannot yet be tested because the execution account cannot access Hunter's primary Google Calendar. The test endpoint returned: `Hunter Ellis's Google Calendar is unavailable. Confirm calendar sharing first.`
- No booking or calendar-creation test has been submitted. That end-to-end test will be run only after calendar sharing is confirmed.

## Hunter account correction

Hunter’s calendar and booking-notification address was corrected from `hunterellissss@gmail.com` to `ellisrestorative@gmail.com` in the local booking module, deployment guide, and saved E.R.T SITE Apps Script source. The isolated availability test still reports the calendar as unavailable, which means the corrected account must now share its primary Google Calendar with `restorewithellis@gmail.com` using **Make changes to events** before testing can continue.

The Restore With Ellis Google Calendar account was checked after the reported share. Hunter’s calendar is not present under **Other calendars**, confirming that the permission has not yet been applied to the correct calendar/account or has not been saved.

## Successful calendar and booking test

The calendar share is now accessible to the isolated test deployment. Hunter’s August 2026 weekday availability returned correctly, and the future weekday slot endpoint returned `12:51 PM`, `3:21 PM`, and `5:51 PM` for a 60-minute session. A clearly labeled controlled booking was then submitted for **August 20, 2026 at 12:51 PM**, using the Restore With Ellis address as the test client. The test endpoint returned `success: true`; this exercises Hunter calendar placement, booking-sheet write, therapist notification delivery, Zachary copy delivery, and client confirmation delivery. The test event and associated booking row should be removed after confirmation checks are complete.

The controlled appointment was subsequently verified in the shared `ellisrestorative@gmail.com` calendar as **[ERT] Hunter Ellis — TEST BOOKING - DELETE** on August 20, 2026 from 12:51 PM to 1:51 PM. Gmail’s search interface did not finish rendering the filtered confirmation-message results, so direct visual confirmation of the inbox copy remains pending; the booking handler returned success only after requesting all three email sends.

After user confirmation, the controlled calendar event was deleted successfully. Google Calendar now reports 72 events for the month and the August 20 test event is no longer present. The matching clearly labeled test record remains to be removed from the Apps Script’s linked booking sheet.

The booking-sheet cleanup was completed through a narrowly scoped, one-time script routine after user confirmation. Its execution log reported **one** controlled test row removed; the temporary routine was then removed from the saved source.

## Production deployment caution

The E.R.T SITE Apps Script project received a dedicated production deployment on August 19, 2026: `https://script.google.com/macros/s/AKfycbzvdC1HrHxC9hfYOIXY3uscbqsNdbnthgYfmNMK-IwA76m5uU7zp4mDdTieEveLFYeN/exec`. Hunter availability was verified on that exact endpoint before the public website relay was updated to use it.
