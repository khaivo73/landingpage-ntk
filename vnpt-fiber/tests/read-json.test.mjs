import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readSmallJson} from '../lib/read-json.ts';
const req=(body,headers={})=>new Request('https://example.test/api/leads',{method:'POST',headers,body});
test('decodes valid UTF-8 Vietnamese payload',async()=>assert.deepEqual(await readSmallJson(req(JSON.stringify({name:'Khách thử nghiệm'}))),{name:'Khách thử nghiệm'}));
test('rejects malformed JSON',async()=>await assert.rejects(()=>readSmallJson(req('{bad')),e=>e.status===400));
test('rejects oversized body without trusting Content-Length',async()=>await assert.rejects(()=>readSmallJson(req('x'.repeat(9000))),e=>e.status===413));
test('rejects oversized declared length before reading',async()=>await assert.rejects(()=>readSmallJson(req('{}',{'content-length':'9000'})),e=>e.status===413));
