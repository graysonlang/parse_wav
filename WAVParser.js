"use strict";

const A = require("arcsecond");
// import * as A from "arcsecond";
import * as B from "arcsecond-binary";

export default function parse_wav(buffer) {
  const riffChunkSize = B.u32LE.chain((size) => {
    let length = buffer.byteLength
    if (size !== length - 8) {
      return A.fail(`Invalid file size: ${length}, expected ${size}`);
    }
    return A.succeedWith(size);
  });

  const riffChunk = A.sequenceOf([
    A.str('RIFF'),
    riffChunkSize,
    A.str('WAVE')
  ]);

  const fmtSubChunk = A.coroutine(run => {
    const id = run(A.str('fmt '));
    const subChunk1Size = run(B.u32LE);
    const audioFormat = run(B.u16LE);
    const numChannels = run(B.u16LE);
    const sampleRate = run(B.u32LE);
    const byteRate = run(B.u32LE);
    const blockAlign = run(B.u16LE);
    const bitsPerSample = run(B.u16LE);

    const expectedByteRate = sampleRate * numChannels * bitsPerSample / 8;
    if (byteRate !== expectedByteRate) {
      run(A.fail(`Invalid byte rate: ${byteRate}, expected ${expectedByteRate}`));
    }

    const expectedBlockAlign = numChannels * bitsPerSample / 8;
    if (blockAlign !== expectedBlockAlign) {
      run(A.fail(`Invalide block align: ${blockAlign}, expected ${expectedBlockAlign}`));
    }

    const fmtChunkData = {
      id,
      subChunk1Size,
      audioFormat,
      numChannels,
      sampleRate,
      byteRate,
      blockAlign,
      bitsPerSample
    };

    run(A.setData(fmtChunkData));
    return fmtChunkData;
  });

  const dataSubChunk = A.coroutine(run => {
    const id = run(A.str('data'));
    const size = run(B.u32LE);
    const fmtData = run(A.getData);

    const samples = size / fmtData.numChannels / (fmtData.bitsPerSample / 8);
    const channelData = Array.from({length: fmtData.numChannels}, () => []);

    let sampleParser;
    if (fmtData.bitsPerSample === 8) {
      sampleParser = B.s8;
    } else if (fmtData.bitsPerSample === 16) {
      sampleParser = B.s16LE;
    } else if (fmtData.bitsPerSample === 32) {
      sampleParser = B.s32LE;
    } else {
      run(A.fail(`Unsupported bits per sample: ${fmtData.bitsPerSample}`));
    }

    for (let sampleIndex = 0; sampleIndex < samples; ++sampleIndex) {
      for (let i = 0; i < fmtData.numChannels; ++i) {
        const sampleValue = run(sampleParser);
        channelData[i].push(sampleValue);
      }
    }

    return {
      id,
      size,
      channelData,
    };
  });

  const parser = A.sequenceOf([
    riffChunk,
    fmtSubChunk,
    dataSubChunk,
    A.endOfInput
  ]).map(([riffChunk, fmtSubChunk, dataSubChunk]) => ({
    riffChunk,
    fmtSubChunk,
    dataSubChunk,
  }));

  const output = parser.run(buffer);
  if (output.isError) {
    throw new Error(output.error);
  }

  console.log(output.result);
  // console.log(output.result.dataSubChunk.channelData[0].slice(0, 100));
}
