"use strict";


import { Vector } from "./vector";



export class UnitSpace {
    static Base = new UnitSpace(Vector.X, Vector.Y, Vector.Z);

    constructor(
        public readonly x: Vector,
        public readonly y: Vector,
        public readonly z: Vector
    ) {}

    rotate(axis: Vector, angle: number) {
        return new UnitSpace(
            this.x.rotate(axis, angle),
            this.y.rotate(axis, angle),
            this.z.rotate(axis, angle)
        );
    }

    map(v: Vector, c?: Vector): Vector;
    map(x: number, y: number, z: number, c?: Vector): Vector;
    map(x: Vector | number, y?: number | Vector, z?: number, c?: Vector) {
        if (x instanceof Vector) {
            c = y as Vector | undefined;
            z = x.z;
            y = x.y;
            x = x.x;
        } else {
            y = y as number;
            z = z as number;
        }
        if (!c) c = Vector.zero;
        return new Vector(
            this.x.x * x + this.y.x * y + this.z.x * z + c.x,
            this.x.y * x + this.y.y * y + this.z.y * z + c.y,
            this.x.z * x + this.y.z * y + this.z.z * z + c.z
        );
    }
}
