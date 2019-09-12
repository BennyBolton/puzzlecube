"use strict";



export enum CubeColor {
    Blue,
    Green,
    White,
    Yellow,
    Orange,
    Red
}



export class CubeSlice {
    constructor(
        public readonly dim: number,
        public readonly axis: number,
        public readonly index: number
    ) {}

    toString() {
        return `CubeSlice(${this.dim}, ${this.axis}, ${this.index})`;
    }

    getRing() {
        const pf = this.dim * this.dim;
        const pr = this.dim;
        let offset: [number, number, number, number];
        let step: [number, number, number, number];
        switch (this.axis) {
            case 0:
                step = [pr, pr, -pr, -pr];
                offset = [
                    pf * 2 + this.index,
                    pf * 5 + this.index,
                    pf * 4 - pr + this.index,
                    pf * 5 - pr + this.index
                ];
                break;

            case 1:
                step = [1, pr, -1, -pr];
                offset = [
                    pf * 4 + this.index * pr,
                    pf * 1 + this.index,
                    pf * 5 + pr - 1 + this.index * pr,
                    pf * 1 - pr + this.index
                ];
                break;

            case 2:
                step = [1, 1, -1, -1];
                offset = [
                    pf * 0 + this.index * pr,
                    pf * 3 + this.index * pr,
                    pf * 1 + pr - 1 + this.index * pr,
                    pf * 2 + pr - 1 + this.index * pr
                ];
                break;

            default:
                throw new Error("Invalid axis");
        }
        let res = new Array<number>(this.dim * 4);
        for (let face = 0; face < 4; ++face) {
            for (let i = 0; i < this.dim; ++i) {
                res[face * this.dim + i] = offset[face] + i * step[face];
            }
        }
        return res;
    }
}



export class CubeConfig {
    public readonly data: CubeColor[];

    constructor(public readonly dim: number) {
        this.data = new Array(dim * dim * 6);

        for (let i = 0; i < 6; ++i) {
            for (let j = 0; j < dim * dim; ++j) {
                this.data[i * dim * dim + j] = i;
            }
        }
    }

    toString() {
        return `CubeConfig(${this.dim})`;
    }

    slice(axis: number, index: number) {
        return new CubeSlice(this.dim, axis, index);
    }

    adjust(slice: CubeSlice, angle: number) {
        angle %= 4;
        if (angle < 0) angle += 4;
        if (angle == 0) return;
        angle = 4 - angle;

        // ring rotation
        let ring = slice.getRing();
        let values = ring.map(i => this.data[i]);
        for (let i = 0; i < ring.length; ++i) {
            this.data[ring[i]] = values[(i + angle * this.dim) % values.length];
        }

        // face rotation
        if (slice.axis != 1) angle = 4 - angle;
        if (slice.index == 0) {
            this.adjustFace(this.dim * this.dim * slice.axis * 2, angle);
        }
        if (slice.index == this.dim - 1) {
            this.adjustFace(this.dim * this.dim * (slice.axis * 2 + 1), angle);
        }
    }

    private adjustFace(offset: number, angle: number) {
        let values = this.data.slice(offset, offset + this.dim * this.dim);
        for (let i = 0; i < this.dim; ++i) {
            for (let j = 0; j < this.dim; ++j) {
                let mi: number, mj: number;
                switch (angle) {
                    case 1: mi = this.dim - j - 1; mj = i; break;
                    case 2: mi = this.dim - i - 1; mj = this.dim - j - 1; break;
                    case 3: mi = j; mj = this.dim - i - 1; break;
                }
                this.data[offset + i + j * this.dim] = values[mi + mj * this.dim];
            }
        }
    }

    indexOnAxis(index: number, axis: number) {
        let s = this.dim * this.dim;
        let face = Math.floor(index / s);
        if (face == axis * 2) return 0;
        if (face == axis * 2 + 1) return this.dim - 1;

        if (axis == 0 || axis == 1 && face < 2) {
            return index % this.dim;
        } else {
            return Math.floor(index / this.dim) % this.dim;
        }
    }
}
