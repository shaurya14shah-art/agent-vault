/**
 * STUDIO ENVIRONMENT
 *
 * Reflections for the metal surfaces, generated on the GPU from three's own
 * RoomEnvironment. No HDR download, no CDN dependency — drei's
 * `<Environment preset>` fetches a file and will suspend the entire route if
 * the network is slow or absent, which is not an acceptable failure mode for
 * a page whose first frame is the product.
 */

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export default function StudioEnv({ intensity = 1 }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    pmrem.compileEquirectangularShader();

    const room = new RoomEnvironment();
    const target = pmrem.fromScene(room, 0.04);

    scene.environment = target.texture;
    scene.environmentIntensity = intensity;

    return () => {
      scene.environment = null;
      target.texture.dispose();
      pmrem.dispose();
      room.traverse((o) => {
        o.geometry?.dispose();
        o.material?.dispose();
      });
    };
  }, [gl, scene, intensity]);

  return null;
}
