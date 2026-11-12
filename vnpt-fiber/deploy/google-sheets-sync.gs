// Add this as a separate Apps Script file in the owner's existing project.
// Keep the queue credential in Script Properties, never in source code.
const VNPT_SHEETS_QUEUE_URL = 'https://sktvegipvzngwsditzjx.supabase.co/functions/v1/vnpt-sheet-queue';
const VNPT_SHEETS_HEADERS = ['Mã yêu cầu','Thời gian đăng ký','Họ tên','Số điện thoại','Gói cước / nhu cầu','Phường','Địa chỉ','Trạng thái','Người phụ trách','Ghi chú','Nguồn','Chiến dịch'];

function batDongBoVNPT() {
  const properties = PropertiesService.getScriptProperties();
  if (!properties.getProperty('VNPT_SHEET_ID') || !properties.getProperty('VNPT_SHEET_QUEUE_KEY')) {
    throw new Error('THIEU_CAU_HINH_SHEET_HOAC_QUEUE_KEY');
  }
  dongBoNhuCauVNPT();
  if (!ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === 'dongBoNhuCauVNPT')) {
    ScriptApp.newTrigger('dongBoNhuCauVNPT').timeBased().everyMinutes(1).create();
  }
  console.log('VNPT_SHEETS_SYNC_ENABLED');
}

function dongBoNhuCauVNPT() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    const properties = PropertiesService.getScriptProperties();
    const key = properties.getProperty('VNPT_SHEET_QUEUE_KEY');
    const id = properties.getProperty('VNPT_SHEET_ID');
    if (!key || !id) throw new Error('MISSING_CONFIG');
    const sheet = SpreadsheetApp.openById(id).getSheetByName('Yeu cau tu van');
    if (!sheet) throw new Error('WRONG_SHEET');
    const headers = sheet.getRange(1,1,1,12).getValues()[0];
    if (headers.some((value,i) => value !== VNPT_SHEETS_HEADERS[i])) throw new Error('HEADERS_CHANGED');
    let count = 0;
    const started = Date.now();
    for (let n=0;n<5 && Date.now()-started<45000;n++) {
      const jobs = vnptSheetQueue_({action:'claim'},key);
      if (!Array.isArray(jobs) || jobs.length>1) throw new Error('INVALID_QUEUE');
      if (!jobs.length) break;
      const job = jobs[0];
      try {
        vnptAppendLead_(sheet,job);
        SpreadsheetApp.flush();
        if (vnptSheetQueue_({action:'finish',id:job.id,lease_id:job.lease_id,success:true},key) !== true) throw new Error('ACK_FAILED');
        count++;
      } catch (_) {
        try { vnptSheetQueue_({action:'finish',id:job.id,lease_id:job.lease_id,success:false},key); } catch (_) { /* Lease permits retry. */ }
        throw new Error('ROW_SYNC_FAILED');
      }
    }
    properties.setProperty('VNPT_LAST_SYNC_AT',new Date().toISOString());
    console.log('VNPT_SHEETS_SYNC_OK rows=' + count);
  } catch (_) {
    // Do not put customer data or credentials into execution logs.
    throw new Error('VNPT_SHEETS_SYNC_FAILED_KIEM_TRA_CAU_HINH_VA_HANG_DOI');
  } finally {
    lock.releaseLock();
  }
}

function vnptSheetQueue_(body,key) {
  const response = UrlFetchApp.fetch(VNPT_SHEETS_QUEUE_URL,{
    method:'post',contentType:'application/json',headers:{'X-VNPT-Sheet-Key':key},
    payload:JSON.stringify(body),muteHttpExceptions:true,followRedirects:false
  });
  if (response.getResponseCode()!==200) throw new Error('QUEUE_REQUEST_FAILED');
  return JSON.parse(response.getContentText());
}

function vnptSafeCell_(value) {
  const text = String(value == null ? '' : value);
  return /^[\s]*[=+@-]/.test(text) ? "'"+text : text;
}

function vnptAppendLead_(sheet,job) {
  if (!/^[0-9a-f-]{36}$/i.test(job.lead_id) || !/^0[35789][0-9]{8}$/.test(job.phone)) throw new Error('INVALID_LEAD');
  const last = sheet.getLastRow();
  // Acknowledgement can fail after writing. UUID deduplication keeps retries safe.
  if (last>1 && sheet.getRange(2,1,last-1,1).getDisplayValues().some(row=>row[0]===job.lead_id)) return false;
  const row = Math.max(2,last+1);
  if (row>sheet.getMaxRows()) sheet.insertRowsAfter(sheet.getMaxRows(),100);
  const stamp = new Date(job.created_at);
  if (isNaN(stamp.getTime())) throw new Error('INVALID_TIME');
  const values = [job.lead_id,stamp,job.full_name,job.phone,job.demand,job.ward,job.address||'',
    'Mới','',job.is_test ? 'KIỂM THỬ - KHÔNG LIÊN HỆ' : '',job.utm_source||'',job.utm_campaign||''];
  const safe = values.map(value=>value instanceof Date ? value : vnptSafeCell_(value));
  sheet.getRange(row,1,1,12).setNumberFormat('@');
  sheet.getRange(row,2).setNumberFormat('dd/MM/yyyy HH:mm');
  sheet.getRange(row,8).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Mới','Đã liên hệ','Đủ điều kiện','Đã lắp đặt','Đóng'],true).setAllowInvalid(false).build());
  sheet.getRange(row,1,1,12).setValues([safe]);
  return true;
}
