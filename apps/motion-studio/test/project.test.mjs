import test from 'node:test';
import assert from 'node:assert/strict';
import {validateProject,demo} from '../lib/project.mjs';
import {sceneAt,totalDuration} from '../public/engine.js';
test('valid project is normalized without untrusted fields',()=>{const p=validateProject({...demo,arbitrary:'drop'});assert.equal(p.arbitrary,undefined);assert.equal(p.scenes.length,3)});
test('rejects excessive duration and unsafe asset paths',()=>{const p=structuredClone(demo);p.scenes[0].image='http://localhost/private';assert.throws(()=>validateProject(p),/Tài nguyên/);p.scenes[0].image='/assets/../../secret.png';assert.throws(()=>validateProject(p));p.scenes=Array.from({length:5},()=>({...demo.scenes[0],duration:15}));assert.throws(()=>validateProject(p),/60/)});
test('rejects NaN, missing scenes, unsupported FPS and audio masquerading as image',()=>{for(const mutate of [p=>p.scenes=[],p=>p.fps=100,p=>p.volume=NaN,p=>p.scenes[0].duration=-1,p=>p.scenes[0].image='/assets/abc.mp3']){const p=structuredClone(demo);mutate(p);assert.throws(()=>validateProject(p))}});
test('timeline picks the next scene exactly at boundary',()=>{assert.equal(totalDuration(demo),12);assert.equal(sceneAt(demo,3.99).index,0);assert.equal(sceneAt(demo,4).index,1);assert.equal(sceneAt(demo,8).index,2);assert.equal(sceneAt(demo,12).local,4)});
