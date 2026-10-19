# NearSoul promo video: how it is built

- `scenes.py` — 11 scenes as HTML (brand gradient, ghost logo, real app screenshots) → rendered to PNG at 2160×3840 via headless Chromium (CDP).
- `music.mjs` — original background track synthesized in Node (no samples, no third-party audio): `node music.mjs music.wav 37.4 4.04` (length, drop time).
- Voice: Piper TTS (MIT), Russian female voice `ru_RU-irina-medium`. **Its dataset licence is listed as "Unknown"** (trained on RHVoice data): fine for internal demos; for paid ads record a human voice or license a voice.
- `build2.py` — per-scene eased 3.5% push-in on a 4× upscaled source (no zoompan jitter), crossfades, voice placed per `plan.json`, music ducked under the voice (sidechain), loudness −14 LUFS.
