"use strict";


import { CubeConfig, Face } from "./config";



export class CubeFace {
    constructor(
        public readonly config: CubeConfig,
        public readonly offset: number,
        public readonly iStep: number,
        public readonly jStep: number
    ) {}

    static make(config: CubeConfig, face: Face, iFrom: Face, jFrom: Face) {
        let offset = config.size * config.size * face;
        let iStep = 1, jStep = 1;

        let axisInOrder = (iFrom & Face.Axis) == ((face & Face.Axis) + 2) % 6;
        if (axisInOrder) {
            jStep = config.size;
        } else {
            iStep = config.size;
        }

        if ((iFrom & Face.Positive) == (axisInOrder ? (face & Face.Positive) : 0)) {
            offset += iStep * config.size - iStep;
            iStep = -iStep;
        }

        if ((jFrom & Face.Positive) == (axisInOrder ? 0 : (face & Face.Positive))) {
            offset += jStep * config.size - jStep;
            jStep = -jStep;
        }

        return new CubeFace(config, offset, iStep, jStep);
    }

    static makeStandard(config: CubeConfig, face: Face) {
        return new CubeFace(
            config,
            face * config.size * config.size,
            1,
            config.size
        );
    }

    get(i: number, j: number) {
        return this.config.data[this.offset + i * this.iStep + j * this.jStep];
    }

    getValues() {
        let res = new Array<number>(this.config.size * this.config.size);
        for (let i = 0; i < this.config.size; ++i) {
            for (let j = 0; j < this.config.size; ++j) {
                let x = this.offset + i * this.iStep + j * this.jStep;
                res[j * this.config.size + i] = this.config.data[x];
            }
        }
        return res;
    }

    setValues(values: ArrayLike<number>) {
        for (let i = 0; i < this.config.size; ++i) {
            for (let j = 0; j < this.config.size; ++j) {
                let x = this.offset + i * this.iStep + j * this.jStep;
                this.config.data[x] = values[j * this.config.size + i];
            }
        }
    }

    transform(swap: boolean, flipI: boolean, flipJ: boolean) {
        let offset = this.offset;
        let iStep = swap ? this.jStep : this.iStep;
        let jStep = swap ? this.iStep : this.jStep;

        if (flipI) {
            offset += iStep * this.config.size - iStep;
            iStep = -iStep;
        }
        if (flipJ) {
            offset += jStep * this.config.size - jStep;
            jStep = -jStep;
        }

        return new CubeFace(this.config, offset, iStep, jStep);
    }

    flipI() {
        return this.transform(false, true, false);
    }

    flipJ() {
        return this.transform(false, false, true);
    }

    rotate(angle: number) {
        angle %= 4;
        switch (angle < 0 ? angle + 4 : angle) {
            case 0: return this;
            case 1: return this.transform(true, false, true);
            case 2: return this.transform(false, true, true);
            case 3: return this.transform(true, true, false);
        }
    }
}
