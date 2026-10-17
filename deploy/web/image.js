// Re-encodes a picked photo to JPEG in the browser before upload (lib/core/platform/image_web.dart).
// Phones may hand over HEIC or very large files; the browser decodes them (Safari reads HEIC) and the
// server then always receives a normal JPEG. Resolves to null when the browser can't decode the file.
(function () {
  async function decode(blob) {
    try {
      return await createImageBitmap(blob, { imageOrientation: 'from-image' });
    } catch (_) {
      const url = URL.createObjectURL(blob);
      try {
        const img = new Image();
        img.src = url;
        await img.decode();
        return img;
      } finally {
        URL.revokeObjectURL(url);
      }
    }
  }
  window.nearsoulImage = {
    toJpeg: async (bytes, maxSide) => {
      try {
        const src = await decode(new Blob([bytes]));
        const w = src.width || src.naturalWidth;
        const h = src.height || src.naturalHeight;
        const k = Math.min(1, maxSide / Math.max(w, h));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(w * k);
        canvas.height = Math.round(h * k);
        canvas.getContext('2d').drawImage(src, 0, 0, canvas.width, canvas.height);
        const out = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.9));
        return out ? new Uint8Array(await out.arrayBuffer()) : null;
      } catch (_) {
        return null;
      }
    },
  };
})();
