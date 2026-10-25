/**
 * PIN COURT — Google Sheet receiver
 * Paste this into Extensions → Apps Script of your PIN COURT Google Sheet,
 * then Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone).
 * Full steps: SETUP-GUIDE.md
 */

// Email address that gets an alert for every new partner enquiry ('' to switch off).
var NOTIFY_EMAIL = '';

// Also send an email alert for each player sign-up? (Can get noisy.)
var NOTIFY_ON_PLAYERS = false;

var SHEETS = {
  player: {
    name: 'Players',
    headers: ['Timestamp (IST)', 'Name', 'Pincode', 'Area / society', 'Entry type', 'Squad size', 'Squad players',
              'Age group', 'Parent / guardian', 'Mobile', 'Email', 'Gender', 'Level', 'Categories', 'Wants to',
              'Consent', 'Repeat mobile?', 'Squad assigned', 'Status', 'Notes'],
    row: function (d, dup) {
      return [now_(), d.name, d.pincode, d.area, d.entryType, d.squadSize, d.squadPlayers,
              d.ageGroup, d.guardianName, d.mobile, d.email, d.gender, d.level, d.categories, d.interest,
              d.consent, dup ? 'Yes' : '', '', 'New', ''];
    }
  },
  sponsor: {
    name: 'Partners',
    headers: ['Timestamp (IST)', 'Company', 'Website', 'Contact name', 'Designation', 'Email', 'Mobile',
              'Interested in', 'Pincodes of interest', 'Message', 'Wants deck', 'Status', 'Owner', 'Notes'],
    row: function (d) {
      return [now_(), d.company, d.companyWebsite, d.name, d.designation, d.email, d.mobile,
              d.interest, d.pincodes, d.message, d.wantsDeck, 'New', '', ''];
    }
  }
};

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var d = JSON.parse(e.postData.contents || '{}');
    var cfg = SHEETS[d.type];
    if (!cfg) return json_({ ok: false, error: 'Unknown form type' });
    if (d.website) return json_({ ok: true }); // honeypot (bots)

    // clean every value: trim, cap length, stop spreadsheet-formula injection
    Object.keys(d).forEach(function (k) { d[k] = clean_(d[k]); });

    if (!d.name || !d.mobile) return json_({ ok: false, error: 'Missing required fields' });
    if (d.type === 'player' && !/^\d{6}$/.test(d.pincode.replace(/^'/, ''))) {
      return json_({ ok: false, error: 'Invalid pincode' });
    }

    var sh = sheet_(cfg);
    var dup = d.type === 'player' && mobileExists_(sh, d.mobile);
    sh.appendRow(cfg.row(d, dup));

    if (NOTIFY_EMAIL && (d.type === 'sponsor' || NOTIFY_ON_PLAYERS)) notify_(d);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Opening the web-app URL in a browser shows this — a quick "is it live?" check.
// ?action=pincodes returns sign-up counts per pincode (no personal data), for a future leaderboard.
function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'pincodes') {
    var sh = SpreadsheetApp.getActive().getSheetByName(SHEETS.player.name);
    var counts = {};
    if (sh && sh.getLastRow() > 1) {
      sh.getRange(2, SHEETS.player.headers.indexOf('Pincode') + 1, sh.getLastRow() - 1, 1).getValues().forEach(function (r) {
        var p = String(r[0]).replace(/^'/, '');
        if (p) counts[p] = (counts[p] || 0) + 1;
      });
    }
    return json_({ ok: true, pincodes: counts });
  }
  return json_({ ok: true, message: 'PIN COURT form receiver is live.' });
}

/* ---------- helpers ---------- */

function sheet_(cfg) {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(cfg.name);
  if (!sh) {
    sh = ss.insertSheet(cfg.name);
    sh.getRange(1, 1, 1, cfg.headers.length).setValues([cfg.headers])
      .setFontWeight('bold').setBackground('#103F2E').setFontColor('#FFF8E8');
    sh.setFrozenRows(1);
    sh.getRange('A:Z').setNumberFormat('@'); // keep pincodes / mobiles as text
  }
  return sh;
}

function mobileExists_(sh, mobile) {
  var last = sh.getLastRow();
  if (last < 2) return false;
  var col = SHEETS.player.headers.indexOf('Mobile') + 1;
  var want = String(mobile).replace(/\D/g, '');
  return sh.getRange(2, col, last - 1, 1).getValues()
    .some(function (r) { return String(r[0]).replace(/\D/g, '') === want; });
}

function clean_(v) {
  if (v === null || v === undefined) return '';
  v = String(v).trim().slice(0, 1500);
  if (/^[=+\-@]/.test(v)) v = "'" + v;
  return v;
}

function now_() {
  return Utilities.formatDate(new Date(), 'Asia/Kolkata', 'dd MMM yyyy, HH:mm');
}

function notify_(d) {
  var subject = d.type === 'sponsor'
    ? 'PIN COURT partner enquiry: ' + d.company
    : 'PIN COURT sign-up: ' + d.name + ' (' + d.pincode + ')';
  var body = Object.keys(d).filter(function (k) { return d[k] && k !== 'website'; })
    .map(function (k) { return k + ': ' + d[k]; }).join('\n');
  body += '\n\nSheet: ' + SpreadsheetApp.getActive().getUrl();
  MailApp.sendEmail({ to: NOTIFY_EMAIL, subject: subject, body: body, replyTo: d.email || undefined });
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

// Run this once from the editor (select "setup" → Run) to create both tabs and grant permissions.
function setup() {
  sheet_(SHEETS.player);
  sheet_(SHEETS.sponsor);
  var def = SpreadsheetApp.getActive().getSheetByName('Sheet1');
  if (def && def.getLastRow() === 0 && SpreadsheetApp.getActive().getSheets().length > 2) {
    SpreadsheetApp.getActive().deleteSheet(def);
  }
}
