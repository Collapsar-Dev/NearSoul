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

// Browser-tab icon for the logo chosen in Settings → Appearance (the home-screen icon can't change on the web).
window.nearsoulSetIcon = function (href) {
  let link = document.querySelector('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = href;
};

// CR-31: share a story image or a link (lib/core/platform/share_web.dart). Uses the phone's share sheet when the
// browser supports it (Instagram, Telegram, WhatsApp…), otherwise downloads the image / copies the link.
(function () {
  window.nearsoulShare = {
    image: async (bytes, filename, text) => {
      const file = new File([bytes], filename, { type: 'image/png' });
      try {
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], text });
          return 'shared';
        }
      } catch (e) {
        if (e && e.name === 'AbortError') return 'cancelled';
      }
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      return 'downloaded';
    },
    link: async (text, url) => {
      try {
        if (navigator.share) {
          await navigator.share({ text, url });
          return 'shared';
        }
      } catch (e) {
        if (e && e.name === 'AbortError') return 'cancelled';
      }
      try {
        await navigator.clipboard.writeText(`${text} ${url}`);
        return 'copied';
      } catch (_) {
        return 'failed';
      }
    },
  };
})();
