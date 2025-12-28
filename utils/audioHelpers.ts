
/**
 * AUDIO PROCESSING UTILITIES
 * =============================================================================
 * Handles raw PCM audio conversion for Gemini Live API.
 * Separated from UI components to adhere to Single Responsibility Principle.
 * =============================================================================
 */

export function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    // Convert Float32 (-1.0 to 1.0) to Int16 (-32768 to 32767)
    int16[i] = data[i] * 32768;
  }
  return new Blob([int16], { type: 'audio/pcm' });
}

export function base64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length;
    const buffer = ctx.createBuffer(1, frameCount, 24000); 
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
        // Convert Int16 back to Float32 for Web Audio API
        channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
}
