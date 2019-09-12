"use strict";



export class Vector {
    static readonly zero = new Vector(0, 0, 0);
    static readonly X = new Vector(1, 0, 0);
    static readonly Y = new Vector(0, 1, 0);
    static readonly Z = new Vector(0, 0, 1);

    constructor(
        public readonly x: number,
        public readonly y: number,
        public readonly z: number
    ) {}

    static unit(x: number, y: number, z: number) {
        let m = Math.hypot(x, y, z);
        return new Vector(x / m, y / m, z / m);
    }

    length() {
        return Math.sqrt(this.dot(this));
    }

    dot(v: Vector) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }

    normalize() {
        return Vector.unit(this.x, this.y, this.z);
    }

    scale(s: number) {
        return new Vector(this.x * s, this.y * s, this.z * s);
    }

    neg() {
        return this.scale(-1);
    }

    add(v: Vector, s: number = 1) {
        return new Vector(
            this.x + v.x * s,
            this.y + v.y * s,
            this.z + v.z * s
        );
    }

    rotate(v: Vector, x: number) {
        let sx = Math.sin(x), cx = Math.cos(x);
        let m = [
            cx + v.x * v.x * (1 - cx),       v.x * v.y * (1 - cx) - v.z * sx, v.x * v.z * (1 - cx) + v.y * sx,
            v.y * v.x * (1 - cx) + v.z * sx, cx + v.y * v.y * (1 - cx),       v.y * v.z * (1 - cx) - v.x * sx,
            v.z * v.x * (1 - cx) - v.y * sx, v.z * v.y * (1 - cx) + v.x * sx, cx + v.z * v.z * (1 - cx)
        ]
        return new Vector(
            m[0] * this.x + m[1] * this.y + m[2] * this.z,
            m[3] * this.x + m[4] * this.y + m[5] * this.z,
            m[6] * this.x + m[7] * this.y + m[8] * this.z
        );
    }
}
