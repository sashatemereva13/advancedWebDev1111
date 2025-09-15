// Heart.jsx — GLB, keep original materials, with beating animation
import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

export default function Heart({
  url = "/model/heart.glb", // put the file in /public/models/
  bpm = 78,
  amp = 0.05,
  stretch = 0.4,
  castShadow = true,
  receiveShadow = false,
  center = true,
  targetSize = 1.8,
}) {
  const group = useRef();
  const { scene } = useGLTF(url);

  useEffect(() => {
    // keep original materials; just enable shadows and (optionally) env intensity
    scene.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = castShadow;
        o.receiveShadow = receiveShadow;
        if (o.material && "envMapIntensity" in o.material) {
          o.material.envMapIntensity = 1.2; // tweak if you use <Environment />
        }
      }
    });

    // center and scale the model once for predictable sizing
    if (center) {
      const box = new THREE.Box3().setFromObject(scene);
      const c = box.getCenter(new THREE.Vector3());
      scene.position.sub(c);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const s = targetSize / maxDim;
      scene.scale.setScalar(s);
    }
  }, [scene, castShadow, receiveShadow, center, targetSize]);

  // Lub-dub beat animation (squash & stretch)
  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.getElapsedTime();
    const freq = bpm / 60;
    const phase = (t * freq) % 1;
    const p1 = Math.exp(-20 * (phase - 0.05) ** 2);
    const p2 = Math.exp(-30 * (phase - 0.35) ** 2);
    const beat = (p1 * 1.0 + p2 * 0.6) * amp;

    const sY = 1 + beat * (1 + stretch);
    const sXZ = 1 + beat * (1 - stretch);
    group.current.scale.set(sXZ, sY, sXZ);
  });

  return <primitive scale={0.5} ref={group} object={scene} />;
}

useGLTF.preload("/models/heart.glb");
