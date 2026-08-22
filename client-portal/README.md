# ERT Client Portal Source Package

This folder is a **privacy-first portal landing page** for `client.restorewithellis.com`. It gives clients one place to request access, book with either practitioner, and understand the appropriate channel for their question.

## What the portal does now

| Client need | Portal behavior |
|---|---|
| Request portal access | Collects only an email address locally, then opens a pre-addressed access-request email to ERT. The public page does not send, store, or ask for health details. |
| Book with Zachary | Sends clients to `book.html?therapist=zachary`. |
| Book with Hunter | Sends clients to `book.html?therapist=hunter`. |
| Private care question | Explains that verified secure access is required before a care-related message is shared. |
| General question | Directs clients to call or text and explicitly tells them not to send health history, diagnoses, treatment details, payment data, or other sensitive information through a general channel. |
| Urgent concern | States that the portal is not monitored continuously and directs clients to call 911 or seek immediate care. |

## Important privacy boundary

This static package **does not claim to provide secure messaging**. It deliberately avoids a public question textarea and does not collect private care details. It may be published immediately as a transparent portal-entry page.

Before changing any copy to say messages are private or secure, ERT needs all of the following:

1. **Authenticated access** such as a one-time login link or verified client account.
2. **A server-side message endpoint** that is restricted to authenticated clients and authorized ERT staff.
3. **Access controls and retention rules** that define who can read messages and how long they are retained.
4. **A response workflow** that supports the displayed response expectation of one to two business days.
5. **A reviewed privacy notice** that matches the actual hosting, messaging, and notification practices.

## Hostinger publication

1. Upload this `client-portal` folder to the document root for `client.restorewithellis.com`.
2. Confirm that `index.html`, `portal.css`, and `portal.js` are all at that document root and that `../logo.png` resolves to the shared ERT logo. If the subdomain has a separate document root, copy `logo.png` into the portal folder and update the image path to `logo.png`.
3. Load `https://client.restorewithellis.com` and test the portal access form, both booking links, phone links, and mobile layout.
4. Do not publish private-message functionality until the secure backend described above is connected and verified.

## Copy that should remain visible

> Private questions are handled through secure client access.
>
> This public page does not collect health details, payment information, or time-sensitive concerns.
>
> The portal is not monitored continuously. Do not use it for emergencies or time-sensitive medical concerns.
