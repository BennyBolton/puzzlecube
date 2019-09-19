"use strict";


import { CubeConfig, Face } from "./config";
import { CubeRow } from "./row";
import { normalizeInt } from "../util";



export class CubeRing {
    constructor(
        public readonly config: CubeConfig,
        public readonly row1: CubeRow,
        public readonly row2: CubeRow,
        public readonly row3: CubeRow,
        public readonly row4: CubeRow,
    ) {};

    static make(config: CubeConfig, face: Face, offset: number, iFrom: Face, jFrom: Face) {
        return new CubeRing(
            config,
            CubeRow.make(config, jFrom, iFrom, face, offset),
            CubeRow.make(config, iFrom ^ Face.Positive, jFrom, face, offset),
            CubeRow.make(config, jFrom ^ Face.Positive, iFrom ^ Face.Positive, face, offset),
            CubeRow.make(config, iFrom, jFrom ^ Face.Positive, face, offset)
        );
    }

    static makeStandard(config: CubeConfig, face: Face, offset: number) {
        switch (face) {
            case Face.Left: return this.make(config, face, offset, Face.Top, Face.Back);
            case Face.Right: return this.make(config, face, offset, Face.Bottom, Face.Back);
            case Face.Bottom: return this.make(config, face, offset, Face.Front, Face.Left);
            case Face.Top: return this.make(config, face, offset, Face.Back, Face.Left);
            case Face.Back: return this.make(config, face, offset, Face.Right, Face.Bottom);
            case Face.Front: return this.make(config, face, offset, Face.Left, Face.Bottom);
        }
        throw new Error("Invalid face");
    }

    getRow(i: number) {
        switch (i) {
            case 0: return this.row1;
            case 1: return this.row2;
            case 2: return this.row3;
            case 3: return this.row4;
        }
        throw new Error("Invalid row index");
    }

    get(i: number) {
        switch (Math.floor(i / this.config.size)) {
            case 0: return this.row1.get(i % this.config.size);
            case 1: return this.row2.get(i % this.config.size);
            case 2: return this.row3.get(i % this.config.size);
            case 3: return this.row4.get(i % this.config.size);
        }
    }

    getValues() {
        let res = new Array<number>(this.config.size * 4);
        for (let i = 0; i < this.config.size; ++i) {
            res[0 * this.config.size + i] = this.row1.get(i);
            res[1 * this.config.size + i] = this.row2.get(i);
            res[2 * this.config.size + i] = this.row3.get(i);
            res[3 * this.config.size + i] = this.row4.get(i);
        }
        return res;
    }

    setValues(values: ArrayLike<number>) {
        for (let i = 0; i < this.config.size; ++i) {
            this.row1.setValues(values, 0 * this.config.size);
            this.row2.setValues(values, 1 * this.config.size);
            this.row3.setValues(values, 2 * this.config.size);
            this.row4.setValues(values, 3 * this.config.size);
        }
    }

    rotate(angle: number) {
        const rows = [this.row1, this.row2, this.row3, this.row4];
        angle = normalizeInt(angle, 4);

        return new CubeRing(
            this.config,
            this.getRow((angle + 0) % 4),
            this.getRow((angle + 1) % 4),
            this.getRow((angle + 2) % 4),
            this.getRow((angle + 3) % 4)
        );
    }
}
