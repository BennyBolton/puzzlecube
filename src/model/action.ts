"use strict";


import { CubeConfig, Face } from "./config";
import { CubeRing } from "./ring";
import { CubeFace } from "./face";



export class CubeAction {
    constructor(
        public readonly config: CubeConfig,
        public readonly face: Face,
        public readonly offset: number,
        public readonly angle: number
    ) {}

    act() {
        let ring = CubeRing.makeStandard(this.config, this.face, this.offset);
        let values = ring.getValues();
        ring.rotate(this.angle).setValues(values);

        if (this.offset == 0) {
            let face = CubeFace.makeStandard(this.config, this.face);
            values = face.getValues();
            face.rotate(this.angle).setValues(values);
        }
        if (this.offset == this.config.size - 1) {
            let face = CubeFace.makeStandard(this.config, this.face ^ Face.Positive);
            values = face.getValues();
            face.rotate(-this.angle).setValues(values);
        }
    }

    invert() {
        return new CubeAction(this.config, this.face, this.offset, -this.angle);
    }
}
