const test=require('node:test'),assert=require('node:assert/strict');
const {splitSubpaths}=require('../home.js');
test('independent relative moves become absolute starts without altering line geometry',()=>{
 assert.deepEqual(splitSubpaths('M10 20h30m-15 8 4 9'),['M 10 20 h 30','M 25 28 l 4 9']);
});
test('closing a contour resets the origin before the next relative move',()=>{
 assert.deepEqual(splitSubpaths('M10 20h30v30Zm5 6v9'),['M 10 20 h 30 v 30 Z','M 15 26 v 9']);
});
test('curve and arc endpoints are carried into following independent strokes',()=>{
 assert.deepEqual(splitSubpaths('M3 5a2 2 0 0 0 7 8m1 2v9'),['M 3 5 a 2 2 0 0 0 7 8','M 11 15 v 9']);
 assert.deepEqual(splitSubpaths('M10 10c1 2 3 4 5 6m2 3q2 2 4 5m1 1h5'),['M 10 10 c 1 2 3 4 5 6','M 17 19 q 2 2 4 5','M 22 25 h 5']);
});
test('implicit segments and compact signed or exponent coordinates remain valid',()=>{
 assert.deepEqual(splitSubpaths('m1e1-2 3 4m.5-.5H40'),['M 10 -2 l 3 4','M 13.5 1.5 H 40']);
 assert.deepEqual(splitSubpaths(''),[]);
});
