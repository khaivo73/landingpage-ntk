import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
function receiver(){
 let writes=0,held=false;
 const context=vm.createContext({console,Date,
  ContentService:{MimeType:{JSON:'JSON'},createTextOutput:value=>({value,setMimeType(){return this;}})},
  PropertiesService:{getScriptProperties:()=>({getProperty:name=>name==='VNPT_SHEET_QUEUE_KEY'?'a'.repeat(72):'test-sheet'})},
  LockService:{getScriptLock:()=>({tryLock:()=>{held=true;return true;},releaseLock:()=>{held=false;}})},
  SpreadsheetApp:{openById:()=>({getSheetByName:()=>({getRange:()=>({getValues:()=>[vm.runInContext('VNPT_SHEETS_HEADERS',context)]})})}),flush(){}},
 });
 vm.runInContext(fs.readFileSync(new URL('../deploy/google-sheets-sync.gs',import.meta.url),'utf8'),context);
 vm.runInContext(fs.readFileSync(new URL('../deploy/google-sheets-webhook.gs',import.meta.url),'utf8'),context);
 context.vnptAppendLead_=()=>{writes++;return true;};
 return {post:body=>JSON.parse(context.doPost({postData:{contents:JSON.stringify(body)}}).value),writes:()=>writes,held:()=>held};
}
test('event webhook rejects unauthenticated writes',()=>{const r=receiver();assert.equal(r.post({key:'wrong',job:{}}).ok,false);assert.equal(r.writes(),0);});
test('event webhook validates connection without creating customer rows',()=>{const r=receiver();assert.equal(r.post({key:'a'.repeat(72),ping:true}).ready,true);assert.equal(r.writes(),0);});
test('event webhook acknowledges only authenticated completed writes and releases lock',()=>{const r=receiver();assert.equal(r.post({key:'a'.repeat(72),job:{}}).ok,true);assert.equal(r.writes(),1);assert.equal(r.held(),false);});
