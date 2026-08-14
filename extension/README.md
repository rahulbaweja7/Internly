# Add to Applycation (Chrome extension)

Click the toolbar icon on any job listing page to open Applycation's Add Job
form pre-filled with the page's title, site name, and description.

No login of its own — it just opens a normal browser tab to your existing,
already-logged-in Applycation session. If you're not logged in, you'll land
on the login page; log in, then click the extension icon again on the
original tab.

## Load it locally

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select this `extension/` folder
4. Pin the extension from the toolbar puzzle-piece menu for easy access

## Pointing at a different environment

`background.js` has a single `FRONTEND_URL` constant at the top of the file
(defaults to `http://localhost:3000` for local dev). Change that one line
and reload the extension (the reload button on its card in
`chrome://extensions`) to point it at a deployed environment instead.
