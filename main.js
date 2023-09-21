"use strict";

import fs from "fs";
import path from "path";
import parse_wav from "./WAVParser.js";
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const file = fs.readFileSync(path.join(__dirname, './test.wav'));

parse_wav(new Uint8Array(file.buffer));
