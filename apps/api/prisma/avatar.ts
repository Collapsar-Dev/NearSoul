/**
 * Illustrated demo portraits (ALPHA-002, CR-37). Clearly fictional people drawn from shapes, never photos of real
 * people: no consent, licence or likeness issues. Deterministic for a given random source.
 */
export type Gender = 'woman' | 'man' | 'non_binary';
type R = () => number;

const pick = <T>(r: R, list: readonly T[]): T => list[Math.floor(r() * list.length)]!;
// One family of soft lavender / pink pastels so every portrait looks like part of the same set (CR-38).
const BG = [['#EFE6FF', '#C9B4FF'], ['#FBE3F0', '#D8C4FF'], ['#E6E0FF', '#B9A6F5'], ['#F6E8FF', '#E3B8F2'], ['#EDE9FF', '#C4CCFF'], ['#FFE7F1', '#CDB8FF']] as const;
const SKIN = [['#FBE3D3', '#E9BFA6'], ['#F2CDB2', '#D9A587'], ['#E3B08C', '#C48D69'], ['#C98E66', '#A86F4C'], ['#9E6845', '#7F4F33'], ['#74472D', '#5A3520']] as const;
const HAIR = [['#2A1B14', '#4A3326'], ['#3B2418', '#6B4430'], ['#6E4426', '#9C6A40'], ['#B9844A', '#E1B074'], ['#E2C27E', '#F5DFA6'], ['#151515', '#3A3A3A'], ['#8F2F2A', '#C2553F'], ['#5B4A6E', '#8A77A3']] as const;
const IRIS = ['#5B3A1E', '#3E6B4F', '#4C78A8', '#7A5A2E', '#2E2E2E', '#6F7F8C'] as const;
const LIPS = ['#C9606B', '#B4475A', '#D98078', '#A85162', '#E08F8F'] as const;
const CLOTH = ['#7B3FE4', '#5B3BB0', '#2F2A4A', '#F4F1FA', '#E8578A', '#9C7BEA', '#3D3566', '#C9B8F5'] as const;

export function avatarSvg(gender: Gender, r: R, variant: number): string {
  const woman = gender === 'woman' || (gender === 'non_binary' && r() < 0.5);
  const [bg1, bg2] = pick(r, BG);
  const [skin, skinShade] = pick(r, SKIN);
  const [hair, hairHi] = pick(r, HAIR);
  const iris = pick(r, IRIS);
  const cloth = pick(r, CLOTH);
  const cloth2 = pick(r, CLOTH);
  const lips = woman ? pick(r, LIPS) : skinShade;
  const glasses = r() < 0.18;
  const freckles = false;
  const smileTeeth = r() < 0.35;
  const lookX = variant ? 3 : r() < 0.5 ? -3 : 3;
  const tilt = (r() - 0.5) * 6 + (variant ? 2 : -2);
  const womanStyles = ['long', 'wavy', 'bob', 'bun', 'pony', 'curly', 'bangs'] as const;
  const manStyles = ['crop', 'side', 'quiff', 'buzz', 'curlyTop', 'bunM', 'medium'] as const;
  const style = woman ? pick(r, womanStyles) : pick(r, manStyles);
  const beard = !woman ? pick(r, ['none', 'none', 'stubble', 'short', 'full', 'mustache'] as const) : 'none';
  const neckline = pick(r, woman ? (['crew', 'v', 'off', 'turtle'] as const) : (['crew', 'v', 'collar', 'hoodie'] as const));
  const earrings = woman && r() < 0.55;
  const necklace = false;

  // Clockwise outline: forehead → right cheek → chin → left cheek.
  const jaw = woman ? 'C510 600 455 652 400 654 C345 652 290 600 272 520' : 'C514 612 458 666 400 668 C342 666 286 612 268 520';
  const face = `M268 440 C268 330 330 290 400 290 C470 290 532 330 532 440 L530 520 ${jaw} Z`;
  const bokeh = Array.from({ length: 2 }, () => `<circle cx="${Math.round(r() * 800)}" cy="${Math.round(r() * 820)}" r="${40 + Math.round(r() * 130)}" fill="#fff" opacity="${(0.07 + r() * 0.12).toFixed(2)}"/>`).join('');

  // Hair behind the head (long styles) and on top.
  const back: Record<string, string> = {
    long: `<path d="M240 420 C220 620 230 820 270 900 L530 900 C570 820 580 620 560 420 C560 300 480 250 400 250 C320 250 240 300 240 420 Z" fill="url(#hair)"/>`,
    wavy: `<path d="M235 420 C205 560 250 640 215 740 C200 800 250 880 290 900 L510 900 C550 880 600 800 585 740 C550 640 595 560 565 420 C560 300 480 250 400 250 C320 250 240 300 235 420 Z" fill="url(#hair)"/>`,
    bob: `<path d="M245 430 C235 540 245 610 280 640 L520 640 C555 610 565 540 555 430 C550 310 480 262 400 262 C320 262 250 310 245 430 Z" fill="url(#hair)"/>`,
    pony: `<path d="M520 380 C640 420 640 640 580 760 C560 700 560 560 520 470 Z" fill="url(#hair)"/>`,
    curly: Array.from({ length: 16 }, (_, i) => `<circle cx="${250 + (i % 8) * 43}" cy="${300 + Math.floor(i / 8) * 260 + (i % 2) * 20}" r="70" fill="url(#hair)"/>`).join(''),
    bunM: '', bun: '', bangs: `<path d="M245 430 C230 600 250 760 285 820 L515 820 C550 760 570 600 555 430 C550 310 480 262 400 262 C320 262 250 310 245 430 Z" fill="url(#hair)"/>`,
    medium: `<path d="M262 430 C255 520 262 580 285 600 L515 600 C538 580 545 520 538 430 Z" fill="url(#hair)"/>`,
  };
  const top: Record<string, string> = {
    long: `<path d="M262 450 C250 320 320 262 400 262 C480 262 552 320 538 450 C520 380 470 340 412 336 C380 360 320 380 262 450 Z" fill="url(#hair)"/>`,
    wavy: `<path d="M258 455 C246 318 318 258 400 258 C482 258 556 318 542 455 C525 390 490 350 440 335 C400 365 330 385 258 455 Z" fill="url(#hair)"/>`,
    bob: `<path d="M262 450 C250 320 320 268 400 268 C480 268 550 320 538 450 C510 390 470 352 400 350 C340 352 292 390 262 450 Z" fill="url(#hair)"/>`,
    bun: `<circle cx="400" cy="232" r="62" fill="url(#hair)"/><path d="M266 440 C256 322 324 272 400 272 C476 272 544 322 534 440 C510 372 466 336 400 334 C334 336 290 372 266 440 Z" fill="url(#hair)"/>`,
    pony: `<path d="M264 445 C252 320 322 266 400 266 C478 266 548 320 536 445 C512 376 468 338 400 336 C332 338 288 376 264 445 Z" fill="url(#hair)"/>`,
    curly: Array.from({ length: 9 }, (_, i) => `<circle cx="${292 + i * 27}" cy="${300 + (i % 2) * 18}" r="48" fill="url(#hair)"/>`).join(''),
    bangs: `<path d="M262 452 C250 318 322 264 400 264 C478 264 550 318 538 452 C530 420 520 400 505 392 C470 400 430 404 400 404 C360 404 320 400 290 392 C278 405 268 425 262 452 Z" fill="url(#hair)"/>`,
    crop: `<path d="M270 420 C262 320 326 280 400 280 C474 280 538 320 530 420 C515 368 470 344 400 344 C330 344 285 368 270 420 Z" fill="url(#hair)"/>`,
    side: `<path d="M268 425 C258 312 326 272 404 272 C484 272 545 318 532 425 C522 360 486 330 430 326 C380 330 330 352 300 372 C286 385 276 402 268 425 Z" fill="url(#hair)"/><path d="M430 326 C455 300 500 300 520 330" stroke="${hairHi}" stroke-width="6" fill="none" opacity="0.6"/>`,
    quiff: `<path d="M268 425 C258 318 320 272 395 262 C450 240 520 262 535 330 C540 360 534 395 530 425 C516 372 474 346 404 344 C330 346 286 370 268 425 Z" fill="url(#hair)"/>`,
    buzz: `<path d="M272 410 C268 320 330 286 400 286 C470 286 532 320 528 410 C512 366 468 348 400 348 C332 348 288 366 272 410 Z" fill="url(#hair)" opacity="0.85"/>`,
    curlyTop: Array.from({ length: 10 }, (_, i) => `<circle cx="${280 + i * 27}" cy="${312 + (i % 2) * 14}" r="38" fill="url(#hair)"/>`).join(''),
    bunM: `<circle cx="400" cy="248" r="40" fill="url(#hair)"/><path d="M268 425 C260 316 326 278 400 278 C474 278 540 316 532 425 C512 364 468 340 400 340 C332 340 288 364 268 425 Z" fill="url(#hair)"/>`,
    medium: `<path d="M262 450 C250 318 322 266 400 266 C478 266 550 318 538 450 C520 380 470 342 400 340 C330 342 280 380 262 450 Z" fill="url(#hair)"/>`,
  };

  const neck = `<path d="M352 600 L352 720 C380 740 420 740 448 720 L448 600 Z" fill="${skinShade}"/>`;
  const body = `<path d="M130 1000 C140 820 260 740 400 740 C540 740 660 820 670 1000 Z" fill="${cloth}"/>`;
  const necks: Record<string, string> = {
    crew: `<path d="M340 742 C360 772 440 772 460 742" stroke="${cloth2}" stroke-width="10" fill="none" opacity="0.7"/>`,
    v: `<path d="M340 740 L400 830 L460 740 Z" fill="${skinShade}"/>`,
    off: `<path d="M250 790 C320 760 480 760 550 790 L560 820 C480 800 320 800 240 820 Z" fill="${skinShade}"/>`,
    turtle: `<rect x="345" y="690" width="110" height="70" rx="26" fill="${cloth}"/><path d="M350 712 L450 712 M350 734 L450 734" stroke="#000" opacity="0.12" stroke-width="4"/>`,
    collar: `<path d="M340 742 L382 800 L360 812 Z M460 742 L418 800 L440 812 Z" fill="${cloth2}"/>`,
    hoodie: `<path d="M300 760 C320 700 480 700 500 760 C470 790 330 790 300 760 Z" fill="${cloth2}" opacity="0.9"/><path d="M372 790 L366 870 M428 790 L434 870" stroke="#fff" stroke-width="5" opacity="0.8"/>`,
  };

  const eyeY = 470;
  const eye = (cx: number) => `
    <ellipse cx="${cx + lookX}" cy="${eyeY}" rx="12" ry="15" fill="#241a2e"/>
    <circle cx="${cx + lookX + 4}" cy="${eyeY - 5}" r="4" fill="#fff"/>
    ${woman ? `<path d="M${cx + 10} ${eyeY - 12} q8 -6 14 -4" stroke="#241a2e" stroke-width="4" fill="none" stroke-linecap="round"/>` : ''}`;
  const brow = (cx: number, dir: number) => `<path d="M${cx - 34} ${eyeY - 36 + dir * 2} Q${cx} ${eyeY - (woman ? 56 : 50)} ${cx + 34} ${eyeY - 38 - dir * 2}" stroke="${hair}" stroke-width="${woman ? 6 : 9}" fill="none" stroke-linecap="round"/>`;
  const mouth = smileTeeth
    ? `<path d="M360 560 Q400 600 440 560 Q400 572 360 560 Z" fill="#fff" stroke="${lips}" stroke-width="7" stroke-linejoin="round"/>`
    : woman
      ? `<path d="M362 560 Q382 548 400 556 Q418 548 438 560 Q400 590 362 560 Z" fill="${lips}"/><path d="M366 561 Q400 572 434 561" stroke="#7a2f3b" stroke-width="2.5" fill="none" opacity="0.6"/>`
      : `<path d="M366 562 Q400 584 434 562" stroke="#6d3a2c" stroke-width="7" fill="none" stroke-linecap="round"/>`;
  const beards: Record<string, string> = {
    none: '',
    stubble: `<path d="M282 520 C298 612 346 660 400 662 C454 660 502 612 518 520 C500 600 455 630 400 630 C345 630 300 600 282 520 Z" fill="${hair}" opacity="0.25"/>`,
    short: `<path d="M282 515 C296 615 346 665 400 667 C454 665 504 615 518 515 C505 585 470 615 440 600 Q400 592 360 600 C330 615 295 585 282 515 Z" fill="${hair}"/><path d="M356 548 Q400 532 444 548 Q400 542 356 548 Z" fill="${hair}" stroke="${hair}" stroke-width="10"/>`,
    full: `<path d="M272 480 C272 640 330 690 400 694 C470 690 528 640 528 480 C516 590 470 616 440 602 Q400 592 360 602 C330 616 284 590 272 480 Z" fill="${hair}"/><path d="M352 548 Q400 528 448 548 Q400 540 352 548 Z" fill="${hair}" stroke="${hair}" stroke-width="12"/>`,
    mustache: `<path d="M350 548 Q378 530 400 542 Q422 530 450 548 Q426 556 400 548 Q374 556 350 548 Z" fill="${hair}" stroke="${hair}" stroke-width="6"/>`,
  };

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="${variant ? 1 : 0.4}" y2="1"><stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/></linearGradient>
    <linearGradient id="hair" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${hair}"/><stop offset="1" stop-color="${hair}"/></linearGradient>
    <radialGradient id="light" cx="0.38" cy="0.32" r="0.7"><stop offset="0" stop-color="#fff" stop-opacity="0.35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <radialGradient id="vig" cx="0.5" cy="0.45" r="0.75"><stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.22"/></radialGradient>
  </defs>
  <rect width="800" height="1000" fill="url(#bg)"/>${bokeh}
  <g transform="translate(400 520) scale(1.12) translate(-400 -620) rotate(${tilt.toFixed(1)} 400 700)">
    ${back[style] ?? ''}
    ${neck}${body}${necks[neckline]}
    ${necklace ? `<path d="M352 742 C370 800 430 800 448 742" stroke="#E8C66A" stroke-width="3" fill="none"/><circle cx="400" cy="798" r="7" fill="#E8C66A"/>` : ''}
    <ellipse cx="266" cy="490" rx="20" ry="32" fill="${skinShade}"/><ellipse cx="534" cy="490" rx="20" ry="32" fill="${skinShade}"/>
    ${earrings ? `<circle cx="262" cy="528" r="${r() < 0.5 ? 7 : 13}" fill="none" stroke="#E8C66A" stroke-width="4"/><circle cx="538" cy="528" r="${r() < 0.5 ? 7 : 13}" fill="none" stroke="#E8C66A" stroke-width="4"/>` : ''}
    <path d="${face}" fill="${skin}"/>
    <path d="M300 600 C340 650 460 650 500 600 C470 640 330 640 300 600 Z" fill="${skinShade}" opacity="0.35"/>
    ${beards[beard]}
    ${brow(345, 1)}${brow(455, -1)}
    ${eye(345)}${eye(455)}
    <path d="M396 486 C390 512 384 522 392 528 Q402 532 410 527" stroke="${skinShade}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <ellipse cx="318" cy="530" rx="26" ry="14" fill="#FF7E95" opacity="${woman ? 0.32 : 0.16}"/><ellipse cx="482" cy="530" rx="26" ry="14" fill="#FF7E95" opacity="${woman ? 0.32 : 0.16}"/>
    ${freckles ? Array.from({ length: 12 }, () => `<circle cx="${330 + Math.round(r() * 140)}" cy="${505 + Math.round(r() * 30)}" r="2.5" fill="${skinShade}"/>`).join('') : ''}
    ${mouth}
    ${top[style] ?? ''}
    ${glasses ? `<g fill="#ffffff22" stroke="#1d1d1d" stroke-width="6"><rect x="300" y="440" width="92" height="66" rx="${r() < 0.5 ? 30 : 12}"/><rect x="408" y="440" width="92" height="66" rx="${r() < 0.5 ? 30 : 12}"/></g><path d="M392 466 L408 466" stroke="#1d1d1d" stroke-width="6"/>` : ''}
  </g>
  <text x="760" y="110" font-family="Arial, sans-serif" font-size="30" fill="#fff" opacity="0.75" text-anchor="end">DEMO PROFILE</text>
</svg>`;
}
