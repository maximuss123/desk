/**
 * THE DESK — Apps Script receiver
 *
 * Paste this into Extensions → Apps Script on your Articles Google
 * Sheet, then deploy it as a Web App (see README, section 5).
 * It appends one row to the "Articles" tab per submission, in the
 * same column order the app already expects.
 */
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Articles');
  var p = e.parameter;

  sheet.appendRow([
    p.link || '',
    p.headline || '',
    p.journalist || '',
    p.outlet || '',
    p.category || '',
    p.language || 'English',
    new Date(),
    p.tab || ''
  ]);

  return ContentService.createTextOutput('OK');
}
