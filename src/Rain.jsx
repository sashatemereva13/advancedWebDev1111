// Rain.jsx
import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

/**
 * Thin vertical rain droplets as GPU point sprites.
 * - Circular/elliptical mask removes square corners.
 * - Narrow vertical core with tapered head/tail.
 * - Loops through a vertical box with subtle wind sway.
 */
export default function Rain({
  count = 1000, // number of droplets
  area = [50, 30], // x,z spread (width, depth) in world units
  height = 40, // vertical box height (world units)
  baseSize = 14, // on-screen size of each droplet in pixels
  speed = [1, 10], // min/max fall speed (units/sec)
  wind = 1.0, // sideways sway amplitude (units)
  windFreq = 1.1, // sway frequency (Hz)
  color = "#bbceed", // droplet color
  opacity = 0.1, // overall opacity
  blending = "additive", // "normal" | "additive"
  position = [0, 0, 0], // center of the emitter box
  // Shape controls
  coreWidth = 0.18, // 0..1 — narrower = thinner vertical line
  headFade = 0.22, // 0..1 — fade-in length at top
  tailFade = 0.28, // 0..1 — fade-out length at bottom
  ellipseX = 0.75, // ellipse mask horizontal scale (smaller = taller oval)
}) {
  const pointsRef = useRef();

  const { geometry, material } = useMemo(() => {
    // ---------- GEOMETRY ----------
    const geo = new THREE.BufferGeometry();

    // One vertex per droplet (actual placement happens in the vertex shader)
    const positions = new Float32Array(count * 3); // zeros are fine
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    // Per-droplet attributes
    const aOffset = new Float32Array(count * 2); // x,z offset within area
    const aY0 = new Float32Array(count); // start y within [0..height]
    const aSpeed = new Float32Array(count); // fall speed
    const aSeed = new Float32Array(count); // random phase for wind

    const [w, d] = area;
    const [sMin, sMax] = speed;

    for (let i = 0; i < count; i++) {
      aOffset[i * 2 + 0] = THREE.MathUtils.randFloatSpread(w); // -w/2..w/2
      aOffset[i * 2 + 1] = THREE.MathUtils.randFloatSpread(d); // -d/2..d/2
      aY0[i] = Math.random() * height;
      aSpeed[i] = THREE.MathUtils.lerp(sMin, sMax, Math.random());
      aSeed[i] = Math.random() * 1000.0;
    }

    geo.setAttribute("aOffset", new THREE.BufferAttribute(aOffset, 2));
    geo.setAttribute("aY0", new THREE.BufferAttribute(aY0, 1));
    geo.setAttribute("aSpeed", new THREE.BufferAttribute(aSpeed, 1));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(aSeed, 1));
    geo.computeBoundingSphere();

    // ---------- MATERIAL ----------
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false, // prevents harsh sorting artifacts when overlapping
      depthTest: true,
      blending:
        blending === "additive" ? THREE.AdditiveBlending : THREE.NormalBlending,
      uniforms: {
        uTime: { value: 0 },
        uArea: { value: new THREE.Vector2(area[0], area[1]) },
        uHeight: { value: height },
        uBaseSize: { value: baseSize },
        uWindAmp: { value: wind },
        uWindFreq: { value: windFreq },
        uColor: { value: new THREE.Color(color) },
        uOpacity: { value: opacity },
        uCoreWidth: { value: coreWidth },
        uHeadFade: { value: headFade },
        uTailFade: { value: tailFade },
        uEllipseX: { value: ellipseX },
      },
      vertexShader: /* glsl */ `
        attribute vec2  aOffset;     // xz offset in area
        attribute float aY0;         // start height (0..uHeight)
        attribute float aSpeed;      // fall speed
        attribute float aSeed;       // random phase
        uniform float uTime;
        uniform float uHeight;
        uniform float uBaseSize;
        uniform float uWindAmp;
        uniform float uWindFreq;
        varying float vFade;

        void main() {
          // Loop Y: (start - t*speed) mod height, then center around 0
          float y = mod(aY0 - uTime * aSpeed, uHeight) - (uHeight * 0.5);

          // Sideways wind sway with a slight Z coupling
          float phase = (uTime + aSeed) * uWindFreq;
          float sway  = sin(phase) * uWindAmp;

          vec3 pos = vec3(aOffset.x + sway, y, aOffset.y + sway * 0.15);

          // Standard MVP
          vec4 mv = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mv;

          // Perspective-correct point size
          gl_PointSize = uBaseSize * (300.0 / -mv.z);

          // Soften spawns near the very top of the loop
          float top = (y + (uHeight * 0.5)) / uHeight; // 0 at bottom, 1 at top
          vFade = smoothstep(0.08, 0.55, top);
        }
      `,
      fragmentShader: /* glsl */ `
        precision mediump float;
        uniform vec3  uColor;
        uniform float uOpacity;
        uniform float uCoreWidth; // 0..1 (smaller => thinner)
        uniform float uHeadFade;  // 0..1
        uniform float uTailFade;  // 0..1
        uniform float uEllipseX;  // <=1 shrinks X for a taller oval
        varying float vFade;

        void main() {
          vec2 uv = gl_PointCoord;       // [0..1] across the sprite

          // Elliptical mask to hide square corners (oval sprite)
          vec2 p = uv - 0.5;             // center at (0,0)
          p.x /= uEllipseX;              // squish horizontally
          float r = length(p);
          if (r > 0.5) discard;

          // Thin vertical core: distance from center X
          float dx = abs(uv.x - 0.5);
          // Smooth thin line — keep only within uCoreWidth from center
          float core = smoothstep(uCoreWidth, 0.0, dx);

          // Taper top & bottom (head/tail)
          float head = smoothstep(0.0, uHeadFade, uv.y);                 // fade-in at top
          float tail = smoothstep(1.0, 1.0 - uTailFade, uv.y);           // fade-out at bottom

          // Combine
          float alpha = core * head * tail * vFade * uOpacity;

          // Kill near-zero alpha (avoids faint box edges)
          if (alpha < 0.01) discard;

          gl_FragColor = vec4(uColor, alpha);
        }
      `,
    });

    return { geometry: geo, material: mat };
  }, [
    count,
    area,
    height,
    baseSize,
    speed,
    wind,
    windFreq,
    color,
    opacity,
    blending,
    coreWidth,
    headFade,
    tailFade,
    ellipseX,
  ]);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.material.uniforms.uTime.value += delta;
    }
  });

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={material}
      position={position}
      frustumCulled={false}
    />
  );
}
