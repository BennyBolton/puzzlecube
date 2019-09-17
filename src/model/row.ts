"use strict";


import { CubeConfig, Axis, Face } from "./config";



export class CubeRow {
    constructor(
        public readonly config: CubeConfig,
        public readonly offset: number,
        public readonly step: number,
    ) {}

    static make(config: CubeConfig, face: Face, from: Face, iFrom: Face, i: number) {
        let offset = config.size * config.size * face;
        let step = 1, iStep = 1;

        let axisInOrder = (from & Face.Axis) == ((face & Face.Axis) + 2) % 6;
        if (axisInOrder) {
            iStep = config.size;
        } else {
            step = config.size;
        }

        if ((from & Face.Positive) == (axisInOrder ? (face & Face.Positive) : 1)) {
            offset += step * config.size - step;
            step = -step;
        }

        if ((iFrom & Face.Positive) == (axisInOrder ? 1 : (face & Face.Positive))) {
            offset += iStep * config.size - iStep;
            iStep = -iStep;
        }

        return new CubeRow(config, offset + i * iStep, step);
    }

    get(i: number) {
        return this.config.data[this.offset + i * this.step];
    }

    getValues() {
        let res = new Array<number>(this.config.size);
        for (let i = 0; i < this.config.size; ++i) {
            res[i] = this.config.data[this.offset + i * this.step];
        }
        return res;
    }

    setValues(values: ArrayLike<number>, offset = 0) {
        for (let i = 0; i < this.config.size; ++i) {
            this.config.data[this.offset + i * this.step] = values[i + offset];
        }
    }
}
