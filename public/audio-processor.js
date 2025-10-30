/**
 * This script runs in a separate thread to process audio efficiently.
 */

// Helper to downsample audio to 16kHz, which is standard for speech processing.
function downsampleBuffer(buffer, inputSampleRate, outputSampleRate) {
  if (outputSampleRate === inputSampleRate) {
    return buffer;
  }
  const sampleRateRatio = inputSampleRate / outputSampleRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    let accum = 0,
      count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = accum / count;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

// Helper to convert audio from 32-bit float to 16-bit signed integer format.
function float32ToInt16(buffer) {
  let l = buffer.length;
  const buf = new Int16Array(l);
  while (l--) {
    buf[l] = Math.min(1, buffer[l]) * 0x7FFF;
  }
  return buf;
}

class AudioProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    // Receive the sample rate from the main component.
    this.inputSampleRate = options.processorOptions.inputSampleRate;
  }

  /**
   * This method is called by the browser for each chunk of audio.
   * @param {Float32Array[][]} inputs - The audio data from the microphone.
   */
  process(inputs) {
    // ADD THIS LOG:
    console.log('[AudioWorklet] Process method called.'); 
    
    const inputData = inputs[0][0];

    if (inputData) {
      // 1. Downsample the audio to 16kHz.
      const downsampledData = downsampleBuffer(inputData, this.inputSampleRate, 16000);
      // 2. Convert to the 16-bit PCM format required by the server.
      const pcm16Data = float32ToInt16(downsampledData);
      // 3. Send the processed audio buffer back to the main React component.
      this.port.postMessage(pcm16Data.buffer);
    }
    // Return true to keep the processor alive.
    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);