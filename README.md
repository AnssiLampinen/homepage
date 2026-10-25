# homepage

Personal portfolio site with a separate browser-only utilities page at `utilities/`.

The utilities page is static and runs entirely in the browser so it does not need any server-side compute.
## University calendar filter

`calendar-admin.html` (not linked from the nav) is a password-protected week view of the university calendar feed. Clicking an event toggles its weekly series off or on. `/api/uni-feed?token=...` serves the feed without the series that are off, for Google Calendar to subscribe to.

Vercel environment variables:

- `UNI_ICS_URL`: the university calendar's ICS link
- `ADMIN_PASSWORD`: password for the dashboard
- `FEED_TOKEN`: long random string required in the filtered feed URL
- `KV_REST_API_URL`, `KV_REST_API_TOKEN`: set automatically when an Upstash Redis store is connected to the project
