// Event receiver. Deploy as owner; possession of the separate 72-character key is required.
function doPost(e) {
  const json = value => ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
  let lock, locked=false;
  try {
    const raw = e && e.postData && e.postData.contents;
    if (!raw || raw.length > 8192) return json({ok:false});
    const body = JSON.parse(raw);
    const properties = PropertiesService.getScriptProperties();
    const expected = properties.getProperty('VNPT_SHEET_QUEUE_KEY') || '';
    if (typeof body.key !== 'string' || body.key.length!==72 || expected.length!==72) return json({ok:false});
    let diff=0;
    for(let i=0;i<72;i++) diff |= body.key.charCodeAt(i)^expected.charCodeAt(i);
    if(diff!==0) return json({ok:false});
    if(body.ping===true) return json({ok:true,ready:true});
    lock=LockService.getScriptLock();
    locked=lock.tryLock(10000);
    if(!locked) return json({ok:false});
    const sheet=SpreadsheetApp.openById(properties.getProperty('VNPT_SHEET_ID')).getSheetByName('Yeu cau tu van');
    const headers=sheet.getRange(1,1,1,12).getValues()[0];
    if(headers.some((value,i)=>value!==VNPT_SHEETS_HEADERS[i])) return json({ok:false});
    const inserted=vnptAppendLead_(sheet,body.job);
    SpreadsheetApp.flush();
    return json({ok:true,inserted:inserted});
  } catch (_) {
    return json({ok:false});
  } finally {
    if(locked) lock.releaseLock();
  }
}

function doGet() {
  return ContentService.createTextOutput('VNPT notification receiver');
}

function tatKiemTraDinhKyVNPT() {
  ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='dongBoNhuCauVNPT')
    .forEach(t=>ScriptApp.deleteTrigger(t));
  console.log('VNPT_SHEETS_POLLING_DISABLED');
}
