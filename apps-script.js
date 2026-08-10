/**
 * THE DESK — Apps Script receiver
 *
 * Paste this into Extensions → Apps Script on your Google Sheet, then
 * deploy it as a Web App (see README, section 5). It appends one row
 * to either the "Articles" or "Videos" tab, depending on what was
 * shared, in the same column order the app already expects.
 */
function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var p = e.parameter;

  if (p.type === 'video') {
    var videoSheet = ss.getSheetByName('Videos');
    videoSheet.appendRow([
      p.link || '',
      p.title || '',
      p.channelName || '',
      p.category || '',
      p.language || 'English',
      new Date()
    ]);
  } else {
    var articleSheet = ss.getSheetByName('Articles');
    articleSheet.appendRow([
      p.link || '',
      p.headline || '',
      p.journalist || '',
      p.outlet || '',
      p.category || '',
      p.language || 'English',
      new Date(),
      p.tab || ''
    ]);
  }

  return ContentService.createTextOutput('OK');
}
