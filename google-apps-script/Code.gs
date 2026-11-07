/**
 * PIN COURT — Google Sheet receiver
 * Create the Sheet while signed in as pincourt.tennis@gmail.com, then paste this into
 * Extensions → Apps Script, run "setup" once, and Deploy → New deployment → Web app
 * (Execute as: Me, Who has access: Anyone). Full steps: SETUP-GUIDE.md
 */

// Email alert for every new partner enquiry ('' to switch off).
var NOTIFY_EMAIL = 'pincourt.tennis@gmail.com';

// Also email an alert for each player sign-up? (Can get noisy.)
var NOTIFY_ON_PLAYERS = false;

// Ages are worked out on the (tentative) first day of the event.
var EVENT_DATE = new Date(2027, 0, 23);

var SHEETS = {
  player: {
    name: 'Players',
    headers: ['Timestamp (IST)', 'Name', 'Mobile (WhatsApp)', 'Email', 'Date of birth', 'Age on event day',
              'Junior / Senior', 'Under 18?', 'Parent / guardian', 'Gender', 'Pincode', 'Locality',
              'WhatsApp consent', 'Lives in pincode (proof available)', 'Amateur declaration',
              'Repeat mobile?', 'Squad assigned', 'Status', 'Notes'],
    widths: [140, 180, 130, 200, 105, 95, 105, 85, 170, 80, 85, 160, 110, 150, 130, 105, 130, 100, 220],
    row: function (d, dup) {
      var age = ageOn_(d.dob, EVENT_DATE);
      return [now_(), d.name, d.mobile, d.email, d.dob, age === '' ? '' : age,
              age === '' ? '' : (age < 16 ? 'Junior (U16)' : 'Senior (16+)'),
              age === '' ? '' : (ageOn_(d.dob, new Date()) < 18 ? 'Yes' : 'No'),
              d.guardianName, d.gender, d.pincode, d.area,
              d.whatsappConsent, d.residenceDeclaration, d.amateurDeclaration,
              dup ? 'Yes' : '', '', 'New', ''];
    }
  },
  sponsor: {
    name: 'Partners',
    headers: ['Timestamp (IST)', 'Company / name', 'Website', 'Contact name', 'Designation', 'Email', 'Mobile',
              'Interested in', 'Pincodes of interest', 'Message', 'Wants deck', 'Status', 'Owner', 'Notes'],
    widths: [140, 180, 160, 160, 130, 200, 120, 220, 170, 280, 90, 100, 110, 220],
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
    if (d.type === 'player' && !/^40[01]\d{3}$/.test(d.pincode.replace(/^'/, ''))) {
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
    var counts = {}, col = SHEETS.player.headers.indexOf('Pincode') + 1;
    if (sh && sh.getLastRow() > 1) {
      sh.getRange(2, col, sh.getLastRow() - 1, 1).getValues().forEach(function (r) {
        var p = String(r[0]).replace(/^'/, '');
        if (p) counts[p] = (counts[p] || 0) + 1;
      });
    }
    return json_({ ok: true, pincodes: counts });
  }
  return json_({ ok: true, message: 'PIN COURT form receiver is live.' });
}

/* ---------- one-time setup: tabs, filters, summary ---------- */

// Run once from the editor (select "setup" → Run). Safe to run again.
function setup() {
  var ss = SpreadsheetApp.getActive();
  ss.setSpreadsheetTimeZone('Asia/Kolkata');
  var p = sheet_(SHEETS.player), s = sheet_(SHEETS.sponsor);
  [p, s].forEach(function (sh) { if (!sh.getFilter()) sh.getRange(1, 1, sh.getMaxRows(), sh.getLastColumn()).createFilter(); });
  // highlight repeat mobiles
  var dupCol = SHEETS.player.headers.indexOf('Repeat mobile?') + 1;
  var rule = SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Yes')
    .setBackground('#FDECEA').setFontColor('#B42318').setRanges([p.getRange(2, dupCol, p.getMaxRows() - 1, 1)]).build();
  p.setConditionalFormatRules([rule]);
  summary_(ss);
  var def = ss.getSheetByName('Sheet1');
  if (def && def.getLastRow() === 0) ss.deleteSheet(def);
}

function summary_(ss) {
  var sh = ss.getSheetByName('Summary') || ss.insertSheet('Summary', 0);
  sh.clear();
  var H = SHEETS.player.headers, col = function (name) {
    return 'Players!' + columnLetter_(H.indexOf(name) + 1) + '2:' + columnLetter_(H.indexOf(name) + 1);
  };
  var rows = [
    ['PIN COURT — sign-up summary', ''],
    ['Updates automatically as entries arrive.', ''],
    ['', ''],
    ['Total player sign-ups', '=COUNTA(' + col('Name') + ')'],
    ['Partner enquiries', '=COUNTA(Partners!B2:B)'],
    ['Repeat mobiles (check these)', '=COUNTIF(' + col('Repeat mobile?') + ',"Yes")'],
    ['', ''],
    ['Gender', ''],
    ['Male', '=COUNTIF(' + col('Gender') + ',"Male")'],
    ['Female', '=COUNTIF(' + col('Gender') + ',"Female")'],
    ['Other', '=COUNTIF(' + col('Gender') + ',"Other")'],
    ['', ''],
    ['Age group (on event day)', ''],
    ['Junior (U16)', '=COUNTIF(' + col('Junior / Senior') + ',"Junior (U16)")'],
    ['Senior (16+)', '=COUNTIF(' + col('Junior / Senior') + ',"Senior (16+)")'],
    ['Under 18 (guardian on form)', '=COUNTIF(' + col('Under 18?') + ',"Yes")']
  ];
  sh.getRange(1, 1, rows.length, 2).setValues(rows);
  sh.getRange('A1').setFontSize(16).setFontWeight('bold').setFontColor('#103F2E');
  sh.getRange('A2').setFontColor('#4E6B5F');
  ['A4:B6', 'A9:B11', 'A14:B16'].forEach(function (r) { sh.getRange(r).setBorder(true, true, true, true, true, true, '#D9D3C2', null); });
  ['A8', 'A13'].forEach(function (r) { sh.getRange(r).setFontWeight('bold').setFontColor('#103F2E'); });
  sh.getRange('B4:B16').setFontWeight('bold').setHorizontalAlignment('center');

  // sign-ups by pincode, biggest first
  sh.getRange('D1').setValue('Sign-ups by pincode').setFontWeight('bold').setFontColor('#103F2E').setFontSize(13);
  sh.getRange('D3').setFormula('=IFERROR(QUERY({' + col('Pincode') + ',' + col('Locality') + '},' +
    '"select Col1, count(Col1) where Col1 is not null group by Col1 order by count(Col1) desc label Col1 \'Pincode\', count(Col1) \'Players\'",0),"No entries yet")');
  // latest 10 sign-ups
  sh.getRange('G1').setValue('Latest sign-ups').setFontWeight('bold').setFontColor('#103F2E').setFontSize(13);
  sh.getRange('G3').setFormula('=IFERROR(QUERY(Players!A2:L,"select A, B, K, L, J where B is not null order by A desc limit 10",0),"No entries yet")');
  sh.getRange('G2:K2').setValues([['When', 'Name', 'Pincode', 'Locality', 'Gender']]).setFontWeight('bold');
  sh.setColumnWidth(1, 230); sh.setColumnWidth(2, 70); sh.setColumnWidth(3, 30);
  sh.setColumnWidth(4, 90); sh.setColumnWidth(5, 70); sh.setColumnWidth(6, 30);
  sh.setColumnWidths(7, 5, 130);
  sh.setFrozenRows(2);
}

/* ---------- helpers ---------- */

function sheet_(cfg) {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(cfg.name);
  if (!sh) {
    sh = ss.insertSheet(cfg.name);
    sh.getRange(1, 1, 1, cfg.headers.length).setValues([cfg.headers])
      .setFontWeight('bold').setBackground('#103F2E').setFontColor('#FFF8E8').setWrap(true).setVerticalAlignment('middle');
    sh.setRowHeight(1, 42);
    sh.setFrozenRows(1);
    sh.setFrozenColumns(2);
    sh.getRange('A:Z').setNumberFormat('@'); // keep pincodes / mobiles as text
    cfg.widths.forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
  }
  return sh;
}

function mobileExists_(sh, mobile) {
  var last = sh.getLastRow();
  if (last < 2) return false;
  var col = SHEETS.player.headers.indexOf('Mobile (WhatsApp)') + 1;
  var want = String(mobile).replace(/\D/g, '');
  return sh.getRange(2, col, last - 1, 1).getValues()
    .some(function (r) { return String(r[0]).replace(/\D/g, '') === want; });
}

function ageOn_(dob, onDate) {
  var m = String(dob || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return '';
  var a = onDate.getFullYear() - (+m[1]);
  var md = (onDate.getMonth() + 1) - (+m[2]);
  if (md < 0 || (md === 0 && onDate.getDate() < +m[3])) a--;
  return a;
}

function columnLetter_(n) {
  var s = '';
  while (n > 0) { var r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

function clean_(v) {
  if (v === null || v === undefined) return '';
  v = String(v).trim().slice(0, 1500);
  if (/^[=+\-@]/.test(v)) v = "'" + v;
  return v;
}

function now_() {
  return Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd HH:mm');
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
