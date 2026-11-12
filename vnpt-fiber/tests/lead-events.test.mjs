import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readdir,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {prepareLeadEvent,activateLeadEvent} from '../lib/lead-events.ts';
test('form event is durable but does not wake worker before activation',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'vnpt-event-'));
 try {
  await mkdir(path.join(root,'pending'));await mkdir(path.join(root,'ready'));
  const id='7942e6f7-ea71-4c56-8f24-100000000003';
  const event=await prepareLeadEvent(id,root);
  assert.equal((await readdir(path.join(root,'ready'))).length,0);
  assert.equal(await readFile(event.pending,'utf8'),'{}');
  await activateLeadEvent(event);
  assert.deepEqual(await readdir(path.join(root,'ready')),[id+'.json']);
  await activateLeadEvent(event); // concurrent duplicate activation is safe
 } finally {await rm(root,{recursive:true,force:true});}
});
test('event path traversal is rejected',async()=>{
 await assert.rejects(prepareLeadEvent('../invalid','/tmp'),/INVALID_EVENT_ID/);
});
test('missing spool fails before persistence rather than silently dropping wakeup',async()=>{
 await assert.rejects(prepareLeadEvent('7942e6f7-ea71-4c56-8f24-100000000003','/not-a-vnpt-directory'));
});
