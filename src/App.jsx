import * as THREE from "three";
import Heart from "./Heart";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  Clouds,
  Cloud,
  Text, // <-- import Text
} from "@react-three/drei";
import Rain from "./Rain";

export default function App() {
  return (
    <Canvas camera={{ position: [0, 0, 40], fov: 42 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[0, 6, 20]} intensity={2.2} />
      {/* Pick ONE of these backgrounds: */}
      {/* A) HDRI background */}
      {/* <Environment preset="city" background blur={0.7} /> */}
      {/* B) Flat grey background (and still use env for reflections only) */}
      <color attach="background" args={["#63636b"]} />
      <Environment preset="city" /> {/* no 'background' here */}
      <Heart />
      <Rain />
      <Text
        position={[0, -10, 0]}
        font={"/fonts/canobis/Canobis.ttf"}
        fontSize={3}
        color="#222"
        anchorX="center"
        anchorY="middle"
      >
        Three of Swords
      </Text>
      <Clouds limit={400} range={50} speed={0.12}>
        <Cloud
          seed={1}
          segments={18}
          volume={10}
          opacity={0.35}
          color="#fff"
          position={[-5.0, 0.5, 0.8]}
        />
        <Cloud
          seed={2}
          segments={18}
          volume={9}
          opacity={0.34}
          color="#fff"
          position={[5.0, 0.2, 0.6]}
        />
        <Cloud
          seed={3}
          segments={18}
          volume={11}
          opacity={0.3}
          color="#fff"
          position={[-1.8, 0.1, -1.1]}
        />
        <Cloud
          seed={4}
          segments={18}
          volume={8}
          opacity={0.32}
          color="#fff"
          position={[1.9, -0.1, -1.0]}
        />
        <Cloud
          seed={5}
          segments={12}
          volume={6}
          opacity={0.28}
          color="#fff"
          position={[0.0, -0.2, 1.2]}
        />
        <Cloud
          seed={6}
          segments={12}
          volume={5}
          opacity={0.28}
          color="#fff"
          position={[0.2, 0.4, -1.2]}
        />
      </Clouds>
      <Clouds limit={400} range={100} speed={0.12}>
        <Cloud
          seed={1}
          segments={18}
          volume={10}
          opacity={0.35}
          color="#fff"
          position={[-20.0, 0.5, -5]}
        />
        <Cloud
          seed={2}
          segments={18}
          volume={9}
          opacity={0.34}
          color="#fff"
          position={[-10, -3, -5]}
        />
        <Cloud
          seed={3}
          segments={18}
          volume={11}
          opacity={0.3}
          color="#fff"
          position={[10, -2, -10]}
        />
        <Cloud
          seed={4}
          segments={18}
          volume={8}
          opacity={0.32}
          color="#fff"
          position={[-20, -3, -10]}
        />
        <Cloud
          seed={5}
          segments={12}
          volume={6}
          opacity={0.28}
          color="#fff"
          position={[20, -2, -7]}
        />
        <Cloud
          seed={6}
          segments={12}
          volume={5}
          opacity={0.28}
          color="#fff"
          position={[0.2, 0.4, -1.2]}
        />
      </Clouds>
      <OrbitControls />
    </Canvas>
  );
}
