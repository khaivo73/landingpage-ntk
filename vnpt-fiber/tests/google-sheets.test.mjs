import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../deploy/google-sheets-sync.gs',import.meta.url),'utf8');
const validation={requireValueInList(){return this;},setAllowInvalid(){return this;},build(){return {};}};
const context=vm.createContext({console,Date,SpreadsheetApp:{newDataValidation:()=>validation}});
vm.runInContext(source,context);
const job={lead_id:'7942e6f7-ea71-4c56-8f24-100000000003',created_at:'2026-11-12T09:00:00Z',full_name:'=HYPERLINK("https://example.com")',phone:'0900000000',demand:'CAM MẬT',ward:'Bình Thủy',is_test:true};
function sheetMock(initial=[]) {
  const rows=[...initial];
  return {rows,writes:0,getLastRow:()=>rows.length+1,getMaxRows:()=>1000,
    getRange(row,col,count,width){ return {
      getDisplayValues:()=>rows.map(r=>[r[0]]),setNumberFormat(){return this;},setDataValidation(){return this;},
      setValues(values){rows.push(values[0]);sheet.writes++;return this;}
    };}
  };
}
let sheet;
test('Sheets protects formula-like values without altering mobile identifiers',()=>{
  sheet=sheetMock();context.vnptAppendLead_(sheet,job);
  assert.equal(sheet.rows[0][2],"'=HYPERLINK(\"https://example.com\")");
  assert.equal(sheet.rows[0][3],'0900000000');
  assert.equal(sheet.rows[0][4],'CAM MẬT');
  assert.equal(sheet.rows[0][1].getTime(),Date.parse(job.created_at));
  assert.match(sheet.rows[0][9],/KHÔNG LIÊN HỆ/);
});
test('Sheets retry does not duplicate or overwrite manual contact notes',()=>{
  sheet=sheetMock([[job.lead_id,'date','name','phone','package','ward','address','Đã liên hệ','owner','manual note']]);
  assert.equal(context.vnptAppendLead_(sheet,job),false);
  assert.equal(sheet.writes,0);
  assert.equal(sheet.rows[0][9],'manual note');
});
test('Sheets rejects invalid phone before writing',()=>{
  sheet=sheetMock();assert.throws(()=>context.vnptAppendLead_(sheet,{...job,phone:'123'}));assert.equal(sheet.writes,0);
});
test('Sheets escapes whitespace-prefixed formulas and preserves ordinary text',()=>{
  for(const value of [' =1+1','+cmd','@SUM(A1)','-formula']) assert.equal(context.vnptSafeCell_(value),"'"+value);
  assert.equal(context.vnptSafeCell_('CAM MẬT'),'CAM MẬT');
});
