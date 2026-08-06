import sharp from "sharp";

/*
 * Renders the two ID-card face textures used by the 3D lanyard on the login
 * screen. Run with `node scripts/generate-card-textures.mjs`; output lands in
 * public/assets/lanyard/ and is committed, so this only needs re-running when
 * the card artwork changes.
 *
 * The size matches one half of the card.glb texture atlas: the model UV-maps
 * the front face to the left half and the back face to the right half, and
 * Lanyard.tsx composites these images into those halves at runtime.
 *
 * Text is rendered by librsvg via sharp, which resolves fonts from the OS
 * rather than the web. Poppins/Supreme (the app's Fontshare faces) are not
 * installed system-wide, so the card art deliberately uses a generic UI sans
 * stack instead of silently falling back to a serif.
 */

// Brand palette — keep in sync with the --color-N custom properties in globals.css.
const c1 = "#191b21";
const c2 = "#484b5b";
const c3 = "#7f88a9";
const c4 = "#b9bdcc";
const c5 = "#f0f1f5";

const W = 839;
const H = 1266;

const FONT = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

/*
 * Top-right RFID motif on the front face. The dot, the two solid glyph arcs and
 * the three hairline background rings all share this centre and this angular
 * span, so the cluster reads as one signal instead of two families pointing at
 * each other.
 */
const RFID_X = W - 120;
const RFID_Y = 165;
const RFID_START = 91;
const RFID_SWEEP = 128;

/** Arc of `sweep` degrees, starting at the 3 o'clock position, drawn clockwise. */
function arc(cx, cy, r, startDeg, sweepDeg) {
  const toPoint = (deg) => {
    const rad = (deg * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };
  const [x1, y1] = toPoint(startDeg);
  const [x2, y2] = toPoint(startDeg + sweepDeg);
  const largeArc = Math.abs(sweepDeg) > 180 ? 1 : 0;
  const sweepFlag = sweepDeg > 0 ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} ${sweepFlag} ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

/*
 * The mark: an "A" drawn as one heavy rounded stroke, a dot in its counter, and
 * three concentric arcs radiating off the apex to suggest an RFID read.
 */
function logo({ x, y, scale = 1, dark = c1, accent = c3 }) {
  return `
  <g transform="translate(${x}, ${y}) scale(${scale})">
    <path d="M -74 84 L 0 -80 L 74 84"
      fill="none" stroke="${dark}" stroke-width="27"
      stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M -40 26 Q 0 58 40 26"
      fill="none" stroke="${dark}" stroke-width="27" stroke-linecap="round"/>
    <circle cx="0" cy="-4" r="13" fill="${dark}"/>
    <!--
      Arcs are concentric on the apex (0, -80) and centred on the 45° up-right
      diagonal, so they radiate from the point of the A rather than cutting
      across it. Inner radius clears the apex: 13.5 (half the A stroke) + 10.5
      (half the arc stroke) + breathing room.
    -->
    <g fill="none" stroke="${accent}" stroke-width="21" stroke-linecap="round">
      <path d="${arc(0, -80, 44, -82, 74)}"/>
      <path d="${arc(0, -80, 78, -82, 74)}"/>
    </g>
  </g>`;
}

/*
 * Front — light card with the mark and wordmark, and a dark foot band whose top
 * edge is a shallow S-curve, mirrored by a lighter wave just above it.
 */
const frontSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${c5}"/>

  <!-- Concentric rings echoing the mark, bled off the top-right corner. -->
  <g fill="none" stroke="${c3}" stroke-width="3" opacity="0.35">
    <path d="${arc(RFID_X, RFID_Y, 120, RFID_START, RFID_SWEEP)}"/>
    <path d="${arc(RFID_X, RFID_Y, 170, RFID_START, RFID_SWEEP)}"/>
    <path d="${arc(RFID_X, RFID_Y, 220, RFID_START, RFID_SWEEP)}"/>
  </g>

  <!-- Small RFID glyph, sitting at the centre those rings radiate from. -->
  <g transform="translate(${RFID_X}, ${RFID_Y})" fill="none" stroke="${c2}" stroke-width="13" stroke-linecap="round" opacity="0.85">
    <circle cx="0" cy="0" r="9" fill="${c2}" stroke="none"/>
    <path d="${arc(0, 0, 34, RFID_START, RFID_SWEEP)}"/>
    <path d="${arc(0, 0, 62, RFID_START, RFID_SWEEP)}"/>
  </g>

  ${logo({ x: W / 2, y: 560, scale: 1.35 })}

  <text x="${W / 2}" y="795" text-anchor="middle" font-family="${FONT}"
    font-size="54" font-weight="700" letter-spacing="4" fill="${c1}">SMART ATTENDANCE</text>

  <line x1="${W / 2 - 46}" y1="828" x2="${W / 2 + 46}" y2="828" stroke="${c3}" stroke-width="2.5"/>

  <text x="${W / 2}" y="872" text-anchor="middle" font-family="${FONT}"
    font-size="25" font-weight="600" letter-spacing="2.2" fill="${c3}">RFID STUDENT ATTENDANCE SYSTEM</text>

  <!-- Lighter wave riding above the foot band. -->
  <path d="M 0 1010 C 250 1074, 470 900, ${W} 966 L ${W} 1266 L 0 1266 Z" fill="${c3}" opacity="0.55"/>
  <path d="M 0 1050 C 250 1114, 470 940, ${W} 1006 L ${W} 1266 L 0 1266 Z" fill="${c1}"/>

  <g transform="translate(74, 1120)">
    <!-- ID-badge glyph with a signal arc. Arc radii keep the outer sweep inside
         the badge frame: 27 + 13 = 40, clear of the rect's inner edge at 44.3. -->
    <g fill="none" stroke="${c5}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">
      <rect x="0" y="0" width="46" height="40" rx="6"/>
      <circle cx="15" cy="15" r="6"/>
      <path d="M 7 32 Q 15 24 23 32"/>
      <path d="${arc(27, 15, 7, -62, 124)}"/>
      <path d="${arc(27, 15, 13, -62, 124)}"/>
    </g>
    <text x="70" y="16" font-family="${FONT}" font-size="21" font-weight="600"
      letter-spacing="1.1" fill="${c5}">SMARTER ATTENDANCE</text>
    <text x="70" y="42" font-family="${FONT}" font-size="21" font-weight="600"
      letter-spacing="1.1" fill="${c4}">BETTER EDUCATION</text>
  </g>
</svg>`;

/*
 * Back — dark card carrying the same mark in outline, a hairline grid, and the
 * ownership strip.
 */
const backSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <pattern id="grid" width="58" height="58" patternUnits="userSpaceOnUse">
      <path d="M 58 0 L 0 0 0 58" fill="none" stroke="${c3}" stroke-width="1" opacity="0.12"/>
    </pattern>
  </defs>

  <rect width="${W}" height="${H}" fill="${c1}"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>

  <circle cx="${W * 0.72}" cy="${H * 0.26}" r="190" fill="${c2}" opacity="0.16"/>
  <circle cx="${W * 0.22}" cy="${H * 0.74}" r="150" fill="${c3}" opacity="0.1"/>

  ${logo({ x: W / 2, y: H / 2 - 40, scale: 1.15, dark: c5, accent: c3 })}

  <text x="${W / 2}" y="${H / 2 + 190}" text-anchor="middle" font-family="${FONT}"
    font-size="30" font-weight="700" letter-spacing="6" fill="${c4}">SMART ATTENDANCE</text>

  <path d="M 0 ${H - 150} C 250 ${H - 86}, 470 ${H - 260}, ${W} ${H - 194} L ${W} ${H} L 0 ${H} Z"
    fill="${c2}" opacity="0.4"/>

  <text x="${W / 2}" y="${H - 74}" text-anchor="middle" font-family="${FONT}"
    font-size="24" font-weight="600" letter-spacing="3" fill="${c5}">STUDENT ID CARD</text>
  <text x="${W / 2}" y="${H - 40}" text-anchor="middle" font-family="${FONT}"
    font-size="19" letter-spacing="1.2" fill="${c4}">Property of the institution — if found, please return</text>
</svg>`;

await sharp(Buffer.from(frontSVG))
  .png()
  .toFile("public/assets/lanyard/card-front.png");

await sharp(Buffer.from(backSVG))
  .png()
  .toFile("public/assets/lanyard/card-back.png");

/*
 * Band — the lanyard strap, rendered as a 1025×250 repeating texture with the
 * mark tiled across it. The band is drawn in brand colors to match the card.
 */
const bandW = 1025;
const bandH = 250;

const bandSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${bandW}" height="${bandH}" viewBox="0 0 ${bandW} ${bandH}">
  <defs>
    <linearGradient id="bandGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${c2};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${c1};stop-opacity:1" />
    </linearGradient>
  </defs>

  <rect width="${bandW}" height="${bandH}" fill="url(#bandGrad)"/>

  <!-- Hairline edges read as the stitched seam of a woven strap. -->
  <rect x="0" y="14" width="${bandW}" height="3" fill="${c3}" opacity="0.45"/>
  <rect x="0" y="${bandH - 17}" width="${bandW}" height="3" fill="${c3}" opacity="0.45"/>

  <!-- Marks tiled at an even pitch so the texture repeats without a visible seam. -->
  ${Array.from({ length: 5 }, (_, i) => {
    const pitch = bandW / 5;
    const x = pitch / 2 + i * pitch;
    const y = bandH / 2;
    return logo({ x, y, scale: 0.28, dark: c5, accent: c3 });
  }).join("")}
</svg>`;

await sharp(Buffer.from(bandSVG))
  .png()
  .toFile("public/assets/lanyard/band.png");

console.log("Wrote public/assets/lanyard/card-front.png, card-back.png, and band.png");
