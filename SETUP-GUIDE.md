# PIN COURT website: setup guide

The site is plain HTML, CSS and JavaScript. There is no database and no server code. Form entries go straight into a Google Sheet through a small Google Apps Script. Hosting costs nothing beyond the domain.

## What's in the folder

| File | What it is |
|---|---|
| `index.html` | Players page: the "register your interest" form |
| `partners.html` | Become a partner page: partnership options and the enquiry form |
| `config.js` | **The only file you edit.** Paste the Google web-app URL here |
| `assets/` | Logos, fonts, styles, form script, favicon, social share image |
| `google-apps-script/Code.gs` | Code that receives the forms and writes them to the Sheet |

## Step 1: Create the Google Sheet (2 minutes)

1. Open Google Sheets with the account that should own the data (ideally a shared PIN COURT or Momentum Sports Gmail, not a personal one).
2. Create a blank sheet and name it **PIN COURT Registrations**.

## Step 2: Add the script (3 minutes)

1. In the sheet, go to **Extensions → Apps Script**.
2. Delete what's in the editor, then paste the full contents of `google-apps-script/Code.gs`.
3. Optional: on the line `var NOTIFY_EMAIL = '';`, put an email between the quotes to get an email for every partner enquiry.
4. Save (disk icon).
5. In the function dropdown at the top, choose **setup** and click **Run**. Google will ask for permission: choose your account, then **Advanced → Go to project (unsafe) → Allow**. The warning appears because you wrote the script yourself; it is not from a verified app.
6. Back in the sheet you'll now see two tabs, **Players** and **Partners**, with headers.

## Step 3: Publish the script as a web app (2 minutes)

1. In Apps Script: **Deploy → New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Set **Execute as: Me** and **Who has access: Anyone**.
4. Click **Deploy** and copy the **Web app URL** (it ends in `/exec`).
5. Open that URL in a browser. You should see `"PIN COURT form receiver is live."`
6. Open `config.js` and paste the URL between the quotes:
   ```js
   ENDPOINT: "https://script.google.com/macros/s/AKfy.../exec"
   ```

> **If you edit `Code.gs` later**, go to **Deploy → Manage deployments → ✏️ → Version: New version → Deploy**. This keeps the same URL. If you choose "New deployment" instead, the URL changes and you'll need to update `config.js`.

## Step 4: Upload the site

**On your friend's server:** upload everything in this folder (keeping the `assets` folder structure) to the web root of the domain, e.g. `public_html/`. Point the domain at it. Make sure HTTPS is switched on: most hosts offer free Let's Encrypt certificates, and browsers will flag a form on a non-HTTPS page.

**Free alternative (no server needed):** drag the folder onto [Netlify Drop](https://app.netlify.com/drop) or upload it to Cloudflare Pages, then connect your domain. Both give free HTTPS. The domain is then the only cost.

## Step 5: Test

1. Submit one test entry on each page.
2. Check that the rows appear in the Players and Partners tabs.
3. Delete the test rows.

## Using the data

- Each tab has **Status**, **Owner** and **Notes** columns for your team. The script never overwrites them.
- **Repeat mobile?** shows "Yes" when the same number registers twice, so you can remove duplicates.
- Pincodes and mobile numbers are stored as text, so leading digits are never lost.
- To work in Excel: **File → Download → Microsoft Excel (.xlsx)**. Or share the Google Sheet with the team.
- Open `<your web-app URL>?action=pincodes` to see sign-up counts per pincode (no personal data). This can drive a "pincode leaderboard" later.

## Privacy

The sheet holds names, mobiles and some under-18 details. Share it only with people who need it, and don't make it public. The consent line on the form covers contact about this tournament only.
