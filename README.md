# homepage

Personal portfolio site with a separate browser-only utilities page at `utilities/`.

The utilities page is static and runs entirely in the browser so it does not need any server-side compute.
## Booking

`book.html` shows free time for a week and lets visitors book any start and end inside it. `/api/availability` returns only free intervals, never event details. `/api/book` checks the time again and adds the meeting to Google Calendar with the visitor as a guest, so Google emails them the invite.

Free time is the weekly windows in `api/_lib/hours.js` (also slot step, min/max length, notice and how far ahead) minus busy time from the Google calendars in `BUSY_CALENDAR_IDS` and the university feed minus series toggled off in the dashboard.

Vercel environment variables:

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`: OAuth client and refresh token with the `https://www.googleapis.com/auth/calendar` scope
- `GOOGLE_CALENDAR_ID` (optional, default `primary`): where bookings are added
- `BUSY_CALENDAR_IDS` (optional, default the booking calendar): comma-separated Google calendars that block time. Leave out the university calendars, since the feed is read directly.

## University calendar filter

`calendar-admin.html` (not linked from the nav) is a password-protected week view of the university calendar feed. Clicking an event toggles its weekly series off or on. `/api/uni-feed?token=...` serves the feed without the series that are off, for Google Calendar to subscribe to.

Vercel environment variables:

- `UNI_ICS_URL`: the university calendar's ICS link
- `ADMIN_PASSWORD`: password for the dashboard
- `FEED_TOKEN`: long random string required in the filtered feed URL
- `KV_REST_API_URL`, `KV_REST_API_TOKEN`: set automatically when an Upstash Redis store is connected to the project
