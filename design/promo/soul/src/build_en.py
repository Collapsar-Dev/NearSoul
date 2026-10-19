import json, subprocess, os
F = os.path.abspath('../video/node_modules/ffmpeg-static/ffmpeg')
plan = json.load(open('en/plan.json')); D, order, X = plan['D'], plan['order'], plan['X']
FPS = 30
os.makedirs('en/clips', exist_ok=True)
for s in order:
    d = D[s]; n = int(round(d * FPS))
    # 2160×3840 source → 4320×7680 so zoompan's integer crop moves in quarter-pixel steps of the output (no jitter);
    # eased push-in of 3.5%.
    vf = (f"scale=4320:7680:flags=lanczos,"
          f"zoompan=z='1+0.035*(1-cos(PI*on/{n}))/2':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps={FPS},format=yuv420p")
    subprocess.run([F, '-y', '-loglevel', 'error', '-loop', '1', '-framerate', str(FPS), '-t', str(d), '-i', f'en/hi/{s}.png',
                    '-vf', vf, '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-r', str(FPS), f'en/clips/{s}.mp4'], check=True)
    print('clip', s, flush=True)
TR = ['fade', 'fadeblack', 'circleopen', 'slideleft', 'slideleft', 'smoothup', 'slideleft', 'slideleft', 'slideleft', 'circleclose']
inputs = sum([['-i', f'en/clips/{s}.mp4'] for s in order], [])
parts, prev, off = [], '[0:v]', 0.0
for i in range(1, len(order)):
    off = round(off + D[order[i-1]] - X, 3)
    parts.append(f"{prev}[{i}:v]xfade=transition={TR[i-1]}:duration={X}:offset={off}[v{i}]"); prev = f'[v{i}]'
subprocess.run([F, '-y', '-loglevel', 'error', *inputs, '-filter_complex', ';'.join(parts), '-map', prev,
                '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', 'en/video_silent.mp4'], check=True)
# Voice track: each line at its planned time
vo = plan['voice']; keys = list(vo)
vin = sum([['-i', f"en/vo/{'01' if k=='01a' else k}.wav"] for k in keys], [])
delays = ';'.join(f"[{i}:a]aresample=44100,adelay={int(vo[k]*1000)}|{int(vo[k]*1000)},volume=1.6[a{i}]" for i, k in enumerate(keys))
mixv = ''.join(f'[a{i}]' for i in range(len(keys))) + f"amix=inputs={len(keys)}:normalize=0,apad=whole_dur={plan['total']}[vo]"
subprocess.run([F, '-y', '-loglevel', 'error', *vin, '-filter_complex', delays + ';' + mixv, '-map', '[vo]', '-ac', '2', '-t', str(plan['total']), 'en/voice.wav'], check=True)
# Final mix: music ducks under the voice (sidechain), gentle compression on the voice, loudness for social (~-14 LUFS)
fc = ("[1:a]volume=0.55[m];[2:a]asplit=2[v1][v2];"
      "[m][v1]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=350[md];"
      "[v2]acompressor=threshold=0.1:ratio=3:attack=5:release=120,highpass=f=90[vc];"
      "[md][vc]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=9[a]")
subprocess.run([F, '-y', '-loglevel', 'error', '-i', 'en/video_silent.mp4', '-i', 'en/music.wav', '-i', 'en/voice.wav', '-filter_complex', fc,
                '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart',
                'en/nearsoul-promo-en.mp4'], check=True)
print('done')
