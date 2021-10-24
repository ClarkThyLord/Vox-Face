import {
    BufferGeometry,
    BufferAttribute,
} from "three";

export default class FaceGeometry extends BufferGeometry {
    constructor(triangulation) {
        super();
        this.positions = new Float32Array(478 * 3);
        this.setAttribute("position", new BufferAttribute(this.positions, 3));
        this.setIndex(triangulation);
    }

    update(width, height, face) {
        let ptr = 0;
        for (const p of face.mesh) {
            this.positions[ptr + 0] = -p[0] + width / 2;
            this.positions[ptr + 1] = height - p[1] - height / 2;
            this.positions[ptr + 2] = -p[2];
            ptr += 3;
        }
        this.attributes.position.needsUpdate = true;
        this.computeVertexNormals();
    }
};