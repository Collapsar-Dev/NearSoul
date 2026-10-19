// Removes the static first screen (index.html #ns-splash) once Flutter has drawn its first frame.
window.addEventListener('flutter-first-frame', function () {
  var s = document.getElementById('ns-splash');
  if (s) s.remove();
});
