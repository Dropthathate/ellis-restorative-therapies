# Google Apps Script Session Notes

The Google account **restorewithellis@gmail.com** is signed in to the Apps Script dashboard. The **My Projects** page is still loading its project list, so the existing ERT booking automation has not yet been opened or deployed.

The therapist-specific source code is committed to the repository in `google-apps-script.js`. Deploying it will require opening the existing ERT Apps Script project, replacing the current duplicated legacy source with the committed version, and creating a new web-app deployment version while preserving the existing endpoint URL used by `proxy.php`.

## Updated finding

The live **E.R.T SITE** Apps Script contains approximately 23,219 characters across 495 lines. In addition to booking availability and confirmation logic, it includes calendar-event creation plus welcome, review-request, and reactivation email functions. The live source must therefore be **extended rather than replaced** so those existing workflows are retained.
