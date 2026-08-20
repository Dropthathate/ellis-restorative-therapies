# Hostinger Public Redesign Deployment Notes

## August 20, 2026 — file placement confirmation

The owner-provided File Manager screenshots confirm that the main `restorewithellis.com` `public_html` directory now contains the expected updated files:

| File | Screenshot status |
| --- | --- |
| `index.html` | Present and recently updated |
| `public-redesign.css` | Present and recently added |
| `book.html` | Present and recently updated |

The existing `proxy.php` and `styles.css` remain present. The next step is a public browser check of the live homepage followed by therapist-specific booking-link verification.

## Live verification

The redesigned public homepage is now live at `https://www.restorewithellis.com/`. Its public browser view shows the new portal-inspired hero, navigation, client-portal link, and equal profile content. The production Hunter profile route at `book.html?therapist=hunter` correctly makes **Hunter Ellis** the active therapist and displays the confirmed Hunter schedule. The remaining check is the production availability response itself; no booking submission has been made.

## Live availability verification

Both production availability endpoints returned valid data after deployment. Hunter’s endpoint returned open weekday dates that include August 19–21 and August 24–28, matching the confirmed Monday–Friday schedule. Zachary’s endpoint returned the appropriate Monday–Thursday pattern, including open dates on August 19–20 and 24–27 while Friday, August 21, remains closed. No booking form was submitted during this verification.

The final non-submission check is to exercise both rendered profile buttons on the deployed homepage itself. The page source and locally tested routes use `book.html?therapist=zachary` and `book.html?therapist=hunter` respectively.

The rendered **Book with Zachary** profile button has now been clicked successfully on the deployed homepage. It navigated to `https://www.restorewithellis.com/book.html?therapist=zachary` and showed Zachary Ellis as the active booking therapist. The equivalent visible Hunter button remains the final profile-route check.

The deployed homepage source was also checked directly and contains both live rendered therapist destinations: `book.html?therapist=zachary` and `book.html?therapist=hunter`. The Hunter destination was separately loaded in production and showed Hunter Ellis as the active booking therapist. Together with the valid availability responses, both therapist profile booking flows are verified without submitting a booking.
