import * as THREE from 'three';

export class CoordinateMapper {
  private camera: THREE.PerspectiveCamera;
  private width: number;
  private height: number;

  constructor(camera: THREE.PerspectiveCamera, width: number, height: number) {
    this.camera = camera;
    this.width = width;
    this.height = height;
  }

  updateDimensions(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  /**
   * Converts MediaPipe landmark (0..1, mirrored for selfie cam) to Normalized Device Coordinates (-1..1)
   */
  landmarkToNDC(x: number, y: number, mirror = true): { ndcX: number; ndcY: number } {
    const screenX = mirror ? 1.0 - x : x;
    const screenY = y;
    const ndcX = screenX * 2.0 - 1.0;
    const ndcY = -(screenY * 2.0 - 1.0); // WebGL Y is inverted relative to screen
    return { ndcX, ndcY };
  }

  /**
   * Converts normalized screen coordinates (0..1, 0..1) to Three.js 3D World space at given target Z plane
   */
  screenToWorld(
    screenX: number,
    screenY: number,
    targetZ = 0,
    out = new THREE.Vector3()
  ): THREE.Vector3 {
    const ndcX = screenX * 2.0 - 1.0;
    const ndcY = -(screenY * 2.0 - 1.0);

    // Compute visible plane half-dimensions at targetZ
    const distance = this.camera.position.z - targetZ;
    const vFovRad = (this.camera.fov * Math.PI) / 180;
    const halfHeight = Math.tan(vFovRad / 2) * distance;
    const halfWidth = halfHeight * this.camera.aspect;

    out.set(ndcX * halfWidth, ndcY * halfHeight, targetZ);
    return out;
  }

  /**
   * Converts 3D world position to 2D pixel coordinates on screen
   */
  worldToPixel(worldPos: THREE.Vector3): { x: number; y: number } {
    const v = worldPos.clone().project(this.camera);
    const x = ((v.x + 1) / 2) * this.width;
    const y = ((-v.y + 1) / 2) * this.height;
    return { x, y };
  }
}
