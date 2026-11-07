# PIN COURT website: setup and go-live guide

The site is plain HTML, CSS and JavaScript, already hosted free on GitHub Pages:
**https://pushkalkapoor6-byte.github.io/pincourt-mumbai/**

Form entries go into a Google Sheet owned by **pincourt.tennis@gmail.com**. There is no database and no monthly bill.

## What's in the folder

| File | What it is |
|---|---|
| `index.html` | Players page and the register-interest form |
| `partners.html` | Become a partner page and the partner enquiry form |
| `config.js` | **The only file you edit.** Paste the Google web-app link here |
| `assets/` | Logos, fonts, styles, scripts, favicon, share image |
| `google-apps-script/Code.gs` | Script that receives the forms and writes them to the Sheet |

## Step 1: Create the Google Sheet (2 minutes)

1. Open a browser window signed in **only** as pincourt.tennis@gmail.com (an incognito window avoids mixing accounts).
2. Go to sheets.google.com, create a blank sheet and name it **PIN COURT Registrations**.

## Step 2: Add the script (3 minutes)

1. In the sheet: **Extensions → Apps Script**.
2. Delete what's in the editor and paste the full contents of `google-apps-script/Code.gs`. Save.
3. In the function dropdown at the top, choose **setup** and click **Run**.
4. Google asks for permission: choose pincourt.tennis@gmail.com, then **Advanced → Go to project (unsafe) → Allow**. The warning appears because the script is your own, not a published app.
5. Back in the sheet you'll see three tabs:
   - **Summary**: totals, gender, junior/senior split, sign-ups by pincode and the latest 10 entries. Updates by itself.
   - **Players**: one row per sign-up, with filter buttons on every column header.
   - **Partners**: one row per partner enquiry. Each new enquiry is also emailed to pincourt.tennis@gmail.com.

## Step 3: Publish the script (2 minutes)

1. In Apps Script: **Deploy → New deployment**, click the gear, choose **Web app**.
2. **Execute as: Me**, **Who has access: Anyone**. Click **Deploy**.
3. Copy the **Web app URL** (it ends in `/exec`). Opening it should show "PIN COURT form receiver is live."

## Step 4: Connect the website (1 minute)

1. On GitHub, open the repository → `config.js` → pencil icon.
2. Paste the URL between the quotes: `ENDPOINT: "https://script.google.com/macros/s/…/exec"`
3. **Commit changes**. The live site updates within a minute.
4. Submit one test entry on each page, check the rows arrive, then delete them.

If you edit `Code.gs` later, use **Deploy → Manage deployments → ✏️ → New version** so the link stays the same.

## Using the data

- **Filter:** click the funnel icon on any column header in Players (for example, Pincode = 400050, or Gender = Female).
- **Excel:** File → Download → Microsoft Excel (.xlsx).
- **Team access:** Share the sheet with named team members only. It holds phone numbers and dates of birth, including for under-18s.
- Columns **Squad assigned**, **Status** and **Notes** are for your team. The script never overwrites them.
- **Repeat mobile?** turns red when the same number registers twice.

## Going live on your own domain (optional)

Hosting stays free on GitHub Pages; only a domain costs money.

1. Buy a domain from any registrar (for example `pincourt.in`). Compare the **renewal** price, not just the first-year offer.
2. In the registrar's DNS settings, add:
   - Four **A** records for `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - One **CNAME** record for `www` pointing to `pushkalkapoor6-byte.github.io`
3. On GitHub: repository → **Settings → Pages → Custom domain**, enter the domain, Save. Tick **Enforce HTTPS** once it becomes available (can take up to a day).
4. Tell Claude the domain, so the WhatsApp preview image and links are updated.

Free alternatives if you ever leave GitHub: Cloudflare Pages or Netlify (drag the folder in, connect the domain).
