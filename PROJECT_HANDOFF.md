# Ellis Restorative Therapies — Project Handoff

## Purpose and current status

The Ellis Restorative Therapies repository contains the public website for `restorewithellis.com`, therapist-specific booking flows, the client-portal landing page, static SEO assets, and the Google Apps Script integration used by the booking workflow. The redesigned public homepage is live, and both Zachary and Hunter booking routes have been verified in production without submitting a live appointment.

| Area | Current state | Owner action required |
|---|---|---|
| Public website | Live at `https://www.restorewithellis.com/`. | Maintain the files in Hostinger `public_html`. |
| Zachary booking route | Verified at `book.html?therapist=zachary`. | Submit a real test only when ready to create an appointment. |
| Hunter booking route | Verified at `book.html?therapist=hunter`. | Submit a real test only when ready to create an appointment. |
| Availability endpoints | Production responses validated for both practitioners. | Recheck after any calendar or Apps Script changes. |
| Client portal | Static, privacy-first portal package is ready. | Publish to `client.restorewithellis.com` when the subdomain document root is prepared. |

## Repository map

| Location | What it controls |
|---|---|
| `index.html` and `public-redesign.css` | The redesigned public homepage. |
| `book.html` | Therapist-selection and booking interface. |
| `google-apps-script.js` and `TherapistBooking.gs` | Booking availability, calendar logic, and email notifications. |
| `proxy.php` | Production bridge used by the booking interface. |
| `client-portal/` | Separate privacy-first portal landing page for the client subdomain. |
| `robots.txt`, `sitemap.xml`, `llms.txt`, `site.webmanifest` | Search discovery, crawler, and installable-site metadata. |
| `booking-deployment-checklist.md` | Exact booking / calendar deployment steps. |

## Public-site deployment

The public site is a static Hostinger deployment. Keep `index.html`, `public-redesign.css`, and `book.html` in the document root for `restorewithellis.com`; retain `proxy.php` and `styles.css` alongside them. After a visual change, open the public homepage, verify navigation and contact links, then test both visible profile buttons. Confirm they resolve to `book.html?therapist=zachary` and `book.html?therapist=hunter` respectively.

The live availability interface depends on the production Apps Script and calendar configuration. A local file preview can validate layout and client-side behavior, but it cannot prove calendar availability or email delivery.

## Booking workflow: owner setup and maintenance

The connected booking spreadsheet must use the following header row exactly:

`Timestamp | Therapist | Name | Phone | Email | Date | Time | Duration | Price | Notes`

Hunter’s Google Calendar must be shared with `restorewithellis@gmail.com` with permission to make changes to events. That account runs the Apps Script, reads booked times, and creates confirmed Hunter appointments. Zachary requests route to `restorewithellis@gmail.com`; Hunter requests route to `ellisrestorative@gmail.com`, with Zachary copied.

When changing booking logic, replace the Apps Script contents with the current `google-apps-script.js` version, then use **Deploy → Manage deployments → Edit → New version → Deploy**. Keep the web-app URL unchanged unless the booking page and proxy configuration are updated at the same time. Verify one Zachary and one Hunter request only when creating a real appointment is acceptable.

Hunter’s displayed availability is Monday through Friday, 9:00 a.m. to 1:00 p.m., plus first- and third-weekend mornings, 9:00 a.m. to 1:00 p.m. The booking code and Apps Script must agree on this schedule.

## Client portal deployment

The `client-portal/` folder is a static entry point for `client.restorewithellis.com`. Upload its `index.html`, `portal.css`, and `portal.js` files into the subdomain’s document root. Confirm the shared `logo.png` resolves; if the subdomain has a separate document root, copy the logo into `client-portal/` and change the image path to `logo.png`.

The portal should be tested on desktop and mobile, including the access-request email, both therapist booking links, and phone links. It is deliberately **not** a secure messaging system. Do not collect health details, payment data, or time-sensitive concerns on this static page. Do not describe messages as private or secure until authenticated client access, a restricted server-side message endpoint, access controls, retention rules, a response workflow, and a reviewed privacy notice are in place.

## Completion checklist

| Before considering the public site complete | Before calling the portal a secure care channel |
|---|---|
| Both profile buttons work on the live homepage. | Verified client authentication is deployed. |
| Both availability routes return expected schedules. | A restricted server-side messaging endpoint is operating. |
| Calendar sharing and Apps Script deployment are current. | Access control, retention, response timing, and notices have been reviewed. |
| No unverified medical, insurance, or credential claims appear in public copy. | The secure workflow has been tested with the people who will operate it. |

## Recommended next action

Treat the public site and booking workflow as ready for normal use, then publish and test the client portal as a transparent access-request page. Keep secure messaging as a separate, controlled project rather than extending the static portal beyond its stated boundary.
