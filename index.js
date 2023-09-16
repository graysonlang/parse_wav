const A = require('arcsecond');
const B = require('arcsecond-binary');
const fs = require('fs');
const path = require('path');

const file = fs.readFileSync(path.join(__dirname, './test.wav'));

console.log(file);


// import { A } from "arcsecond";
// import { B } from "arcsecond-binary";
// console.log("Hello via Bun!");
