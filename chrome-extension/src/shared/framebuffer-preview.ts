export type FrameBufferLike = {
  bpp: number;
  width: number;
  height: number;
  red_offset: number;
  red_length: number;
  green_offset: number;
  green_length: number;
  blue_offset: number;
  blue_length: number;
  alpha_offset: number;
  alpha_length: number;
  data: Uint8Array;
};

function normalizeColorChannel(value: number, length: number) {
  if (length <= 0) return 255;
  const max = (1 << length) - 1;
  return Math.round((value / max) * 255);
}

function readFrameBufferChannel(pixel: number, offset: number, length: number) {
  if (length <= 0) return 255;
  return normalizeColorChannel((pixel >>> offset) & ((1 << length) - 1), length);
}

export async function frameBufferToObjectUrl(frame: FrameBufferLike) {
  if (!frame.width || !frame.height || !frame.data.length) return null;
  const bytesPerPixel = Math.max(1, Math.floor(frame.bpp / 8));
  const rgba = new Uint8ClampedArray(frame.width * frame.height * 4);
  const view = new DataView(frame.data.buffer, frame.data.byteOffset, frame.data.byteLength);

  for (let index = 0; index < frame.width * frame.height; index += 1) {
    const source = index * bytesPerPixel;
    const target = index * 4;
    let pixel = 0;
    if (bytesPerPixel >= 4) {
      pixel = view.getUint32(source, true);
    } else if (bytesPerPixel === 2) {
      pixel = view.getUint16(source, true);
    } else {
      pixel = frame.data[source] ?? 0;
    }
    rgba[target] = readFrameBufferChannel(pixel, frame.red_offset, frame.red_length);
    rgba[target + 1] = readFrameBufferChannel(pixel, frame.green_offset, frame.green_length);
    rgba[target + 2] = readFrameBufferChannel(pixel, frame.blue_offset, frame.blue_length);
    rgba[target + 3] = frame.alpha_length ? readFrameBufferChannel(pixel, frame.alpha_offset, frame.alpha_length) : 255;
  }

  const canvas = document.createElement("canvas");
  canvas.width = frame.width;
  canvas.height = frame.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.putImageData(new ImageData(rgba, frame.width, frame.height), 0, 0);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.72));
  return blob ? URL.createObjectURL(blob) : null;
}
