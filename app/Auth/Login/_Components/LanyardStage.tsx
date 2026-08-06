"use client";

import dynamic from "next/dynamic";

/*
 * The lanyard is WebGL + a physics sim, so it must not be server-rendered:
 * Lanyard.tsx touches `document` while composing the card texture and rapier
 * only exists in the browser. `ssr: false` is rejected inside Server
 * Components, so this thin Client Component owns the dynamic import and the
 * login page (a Server Component) renders this instead.
 */
const Lanyard = dynamic(() => import("./Lanyard"), { ssr: false });

export function LanyardStage() {
  return (
    <Lanyard
      position={[0, 0, 13]}
      gravity={[0, -40, 0]}
      frontImage="/assets/lanyard/card-front.png"
      backImage="/assets/lanyard/card-back.png"
      imageFit="cover"
      lanyardImage="/assets/lanyard/band.png"
      lanyardWidth={1}
    />
  );
}
