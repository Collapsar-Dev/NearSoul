// Phone-frame preview of the web app (/mobile): size presets, rotate, reload.
(function () {
  const frame = document.getElementById('app');
  const sizes = document.querySelectorAll('button[data-w]');
  function set(w, h) {
    frame.width = w;
    frame.height = h;
  }
  sizes.forEach((b) =>
    b.addEventListener('click', () => {
      sizes.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      set(b.dataset.w, b.dataset.h);
    }),
  );
  document.getElementById('rotate').addEventListener('click', () => set(frame.height, frame.width));
  document.getElementById('reload').addEventListener('click', () => frame.contentWindow.location.reload());
})();
