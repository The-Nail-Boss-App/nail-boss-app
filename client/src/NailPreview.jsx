// ─────────────────────────────────────────────────────────────────────────────
// NailPreview.jsx
// Live SVG nail preview — tip faces down (artist orientation).
// Responds to: shape, length (0-100), width (0-100), color, effect.
// ─────────────────────────────────────────────────────────────────────────────

import React from "react";

const VB_W = 200;  // SVG viewBox width
const VB_H = 280;  // SVG viewBox height
const CX   = 100;  // center x

/**
 * Returns a closed SVG path string for the nail body.
 * The coordinate system is tip-up (base at bottom of viewBox).
 * We then rotate the whole SVG 180° so the tip faces down.
 *
 * @param {string} shape
 * @param {number} halfW    - half-width in SVG units
 * @param {number} nailH    - nail height in SVG units
 */
function buildPath(shape, halfW, nailH) {
  const baseY = 240;          // base of nail (near bottom of viewBox before rotation)
  const tipY  = baseY - nailH;
  const hw    = halfW;

  switch (shape) {
    case "Square":
      return [
        `M ${CX - hw} ${baseY}`,
        `L ${CX - hw} ${tipY}`,
        `L ${CX + hw} ${tipY}`,
        `L ${CX + hw} ${baseY}`,
        "Z",
      ].join(" ");

    case "Coffin":
      return [
        `M ${CX - hw}        ${baseY}`,
        `L ${CX - hw * 0.85} ${tipY + 18}`,
        `L ${CX - hw * 0.32} ${tipY}`,
        `L ${CX + hw * 0.32} ${tipY}`,
        `L ${CX + hw * 0.85} ${tipY + 18}`,
        `L ${CX + hw}        ${baseY}`,
        "Z",
      ].join(" ");

    case "Stiletto":
      return [
        `M ${CX - hw}        ${baseY}`,
        `L ${CX - hw * 0.12} ${tipY + 6}`,
        `L ${CX}             ${tipY}`,
        `L ${CX + hw * 0.12} ${tipY + 6}`,
        `L ${CX + hw}        ${baseY}`,
        "Z",
      ].join(" ");

    case "Oval":
      return [
        `M ${CX - hw} ${baseY}`,
        `C ${CX - hw} ${baseY - nailH * 0.28}`,
        `  ${CX - hw} ${tipY  + nailH * 0.28}`,
        `  ${CX}      ${tipY}`,
        `C ${CX + hw} ${tipY  + nailH * 0.28}`,
        `  ${CX + hw} ${baseY - nailH * 0.28}`,
        `  ${CX + hw} ${baseY}`,
        "Z",
      ].join(" ");

    case "Almond":
    default:
      return [
        `M ${CX - hw} ${baseY}`,
        `C ${CX - hw}        ${baseY - nailH * 0.48}`,
        `  ${CX - hw * 0.52} ${tipY  + nailH * 0.18}`,
        `  ${CX}             ${tipY  + nailH * 0.04}`,
        `C ${CX + hw * 0.52} ${tipY  + nailH * 0.18}`,
        `  ${CX + hw}        ${baseY - nailH * 0.48}`,
        `  ${CX + hw}        ${baseY}`,
        "Z",
      ].join(" ");
  }
}

/**
 * SVG <defs> for each effect.
 * uid keeps gradient IDs unique per instance so multiple previews on one page work.
 */
function EffectDefs({ effect, baseColor, effectColor, uid }) {
  switch (effect) {
    case "Gradient":
      return (
        <defs>
          <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={effectColor} />
            <stop offset="100%" stopColor={baseColor}   />
          </linearGradient>
        </defs>
      );
    case "Chrome":
      return (
        <defs>
          <linearGradient id={uid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#fff"        stopOpacity=".85" />
            <stop offset="28%"  stopColor={baseColor}                     />
            <stop offset="62%"  stopColor={effectColor}                   />
            <stop offset="100%" stopColor="#fff"        stopOpacity=".5"  />
          </linearGradient>
        </defs>
      );
    case "CatEye":
      return (
        <defs>
          <radialGradient id={uid} cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor={effectColor} stopOpacity=".95" />
            <stop offset="38%"  stopColor={effectColor} stopOpacity=".35" />
            <stop offset="100%" stopColor={baseColor}                     />
          </radialGradient>
        </defs>
      );
    case "Marble":
      return (
        <defs>
          <linearGradient id={uid} x1=".15" y1="0" x2=".85" y2="1">
            <stop offset="0%"   stopColor={baseColor}                     />
            <stop offset="38%"  stopColor={effectColor} stopOpacity=".6"  />
            <stop offset="68%"  stopColor={baseColor}   stopOpacity=".9"  />
            <stop offset="100%" stopColor={effectColor} stopOpacity=".45" />
          </linearGradient>
        </defs>
      );
    default:
      return null;
  }
}

export default function NailPreview({
  shape        = "Almond",
  length       = 50,      // 1-100
  width        = 50,      // 1-100
  baseColor    = "#E8A0BF",
  effectColor  = "#FFFFFF",
  effect       = "Solid",
  size         = 160,     // rendered width in px (height scales proportionally)
  uid          = "nail",
}) {
  // Map slider values (1-100) to SVG units
  const nailH  = 80  + (length / 100) * 110;  // 80 → 190 px in viewBox
  const halfW  = 28  + (width  / 100) * 42;   //  28 → 70 px half-width

  const path     = buildPath(shape, halfW, nailH);
  const fillColor = effect === "Solid" ? baseColor : `url(#${uid})`;

  const baseY = 240;
  const tipY  = baseY - nailH;

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      width={size}
      height={size * (VB_H / VB_W)}
      xmlns="http://www.w3.org/2000/svg"
      aria-label={`${shape} nail preview`}
      /* 180° rotation so tip faces down (artist orientation) */
      style={{ transform: "rotate(180deg)", filter: "drop-shadow(0 6px 18px rgba(60,20,50,.18))", display: "block" }}
    >
      <EffectDefs
        effect={effect}
        baseColor={baseColor}
        effectColor={effectColor}
        uid={uid}
      />

      {/* Main nail body */}
      <path d={path} fill={fillColor} />

      {/* Marble veins */}
      {effect === "Marble" && (
        <>
          <path
            d={`M ${CX - halfW * 0.55} ${baseY} C ${CX - halfW * 0.25} ${baseY - nailH * 0.42} ${CX + halfW * 0.1} ${tipY + nailH * 0.38} ${CX + halfW * 0.42} ${tipY}`}
            stroke={effectColor} strokeWidth="2.5" strokeOpacity=".45" fill="none"
          />
          <path
            d={`M ${CX + halfW * 0.28} ${baseY - nailH * 0.08} C ${CX} ${baseY - nailH * 0.52} ${CX - halfW * 0.18} ${tipY + nailH * 0.22} ${CX - halfW * 0.08} ${tipY + nailH * 0.04}`}
            stroke={effectColor} strokeWidth="1.5" strokeOpacity=".32" fill="none"
          />
        </>
      )}

      {/* Cat Eye vertical line */}
      {effect === "CatEye" && (
        <ellipse
          cx={CX}
          cy={(tipY + baseY) / 2}
          rx={halfW * 0.14}
          ry={nailH  * 0.37}
          fill={effectColor}
          fillOpacity=".7"
        />
      )}

      {/* Specular highlight */}
      <path
        d={`M ${CX - halfW * 0.48} ${baseY - nailH * 0.1}
            C ${CX - halfW * 0.44} ${baseY - nailH * 0.52}
              ${CX - halfW * 0.05} ${tipY  + nailH * 0.14}
              ${CX}                ${tipY  + nailH * 0.05}`}
        fill="white"
        fillOpacity=".16"
      />

      {/* Cuticle shadow at the base (appears at the tip after 180° rotation) */}
      <ellipse
        cx={CX}
        cy={baseY + 3}
        rx={halfW * 0.82}
        ry={10}
        fill="rgba(0,0,0,.13)"
      />
    </svg>
  );
}
