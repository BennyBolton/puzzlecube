"use strict";


import { CubeSlice, CubeConfig } from "./config";
import { Canvas, Texture } from "../page";
import { Vector, Plane } from "../math";



const COLORS = [
    [0, 0, 1], // Blue
    [0, 1, 0], // Green
    [1, 1, 1], // White
    [1, 1, 0], // Yellow
    [1, 0.5, 0], // Orange
    [1, 0, 0]  // Red
];



export class CubeAction {
    constructor(
        public readonly slice: CubeSlice,
        public readonly angle: number
    ) {}
}



export class Cube {
    public readonly config: CubeConfig;

    private x = Vector.X;
    private y = Vector.Y;
    private z = Vector.Z;
    private readonly undoList = [] as CubeAction[];
    private readonly redoList = [] as CubeAction[];
    private animateSlice: CubeSlice | null = null;
    private animateAngle: number = 0;
    private animateProgress: number = 0;
    private actor?: Iterator<CubeAction>;
    public center = new Vector(0, 0, -3);

    constructor(public readonly dim: number) {
        this.config = new CubeConfig(dim);
    }

    private renderFace(c: Canvas, offset: number, v: Vector, iv: Vector, jv: Vector, cull: boolean) {
        v = this.center.add(v).add(iv, -1).add(jv, -1);
        iv = iv.scale(2 / this.config.dim);
        jv = jv.scale(2 / this.config.dim);

        for (let i = 0; i < this.config.dim; ++i) {
            for (let j = 0; j < this.config.dim; ++j) {
                let index = offset + i + j * this.config.dim;
                if (cull && this.animateSlice) {
                    let axisI = this.config.indexOnAxis(index, this.animateSlice.axis);
                    if (axisI == this.animateSlice.index) {
                        continue;
                    }
                }
                let color = COLORS[this.config.data[index]];
                c.setColor(color[0], color[1], color[2]);
                c.rect(
                    v.add(iv, i).add(jv, j),
                    v.add(iv, i + 1).add(jv, j),
                    v.add(iv, i + 1).add(jv, j + 1),
                    v.add(iv, i).add(jv, j + 1)
                );
            }
        }
    }

    private renderRow(c: Canvas, data: number[], row: number, v: Vector, iv: Vector, jv: Vector, j: number) {
        v = this.center.add(v).add(iv, -1).add(jv, -1);
        iv = iv.scale(2 / this.config.dim);
        jv = jv.scale(2 / this.config.dim);

        for (let i = 0; i < this.config.dim; ++i) {
            let color = COLORS[data[row * this.config.dim + i]];
            c.setColor(color[0], color[1], color[2]);
            c.rect(
                v.add(iv, i).add(jv, j),
                v.add(iv, i + 1).add(jv, j),
                v.add(iv, i + 1).add(jv, j + 1),
                v.add(iv, i).add(jv, j + 1)
            );
        }
    }

    render(c: Canvas, dt: number, pieceTex: Texture) {
        c.setTexture(pieceTex);
        let s = this.config.dim * this.config.dim;
        this.renderFace(c, 0 * s, this.x.neg(), this.y, this.z, true);
        this.renderFace(c, 1 * s, this.x,       this.y, this.z, true);
        this.renderFace(c, 2 * s, this.y.neg(), this.x, this.z, true);
        this.renderFace(c, 3 * s, this.y,       this.x, this.z, true);
        this.renderFace(c, 4 * s, this.z.neg(), this.x, this.y, true);
        this.renderFace(c, 5 * s, this.z,       this.x, this.y, true);
        if (this.animateSlice) {
            let v: Vector, iv: Vector, jv: Vector;
            switch (this.animateSlice.axis) {
                case 0: v = this.x; iv = this.z; jv = this.y; break;
                case 1: v = this.y; iv = this.x; jv = this.z; break;
                case 2: v = this.z; iv = this.y; jv = this.x; break;

                default:
                    throw new Error("Invalid axis");
            }

            let values = this.animateSlice.getRing()
                .map(i => this.config.data[i]);

            c.setColor(0, 0, 0);
            for (let i = this.animateSlice.index; i < this.animateSlice.index + 2; ++i) {
                if (i == 0 || i == this.dim) continue;
                let t = this.center.add(v, 2 * i / this.dim - 1);
                c.rect(
                    t.add(iv, -1).add(jv, -1),
                    t.add(iv,  1).add(jv, -1),
                    t.add(iv,  1).add(jv,  1),
                    t.add(iv, -1).add(jv,  1)
                );
            }
            let progress = (Math.cos(this.animateProgress * Math.PI) + 1) / 2;
            let angle = this.animateAngle * progress * Math.PI / 2;
            iv = iv.rotate(v, angle);
            jv = jv.rotate(v, angle);
            for (let i = this.animateSlice.index; i < this.animateSlice.index + 2; ++i) {
                if (i == 0 || i == this.dim) continue;
                let t = this.center.add(v, 2 * i / this.dim - 1);
                c.rect(
                    t.add(iv, -1).add(jv, -1),
                    t.add(iv,  1).add(jv, -1),
                    t.add(iv,  1).add(jv,  1),
                    t.add(iv, -1).add(jv,  1)
                );
            }

            this.renderRow(c, values, 0, jv.neg(), iv,       v, this.animateSlice.index);
            this.renderRow(c, values, 1, iv,       jv,       v, this.animateSlice.index);
            this.renderRow(c, values, 2, jv,       iv.neg(), v, this.animateSlice.index);
            this.renderRow(c, values, 3, iv.neg(), jv.neg(), v, this.animateSlice.index);

            if (this.animateSlice.axis != 1) {
                let t = iv;
                iv = jv;
                jv = t;
            }

            if (this.animateSlice.index == 0) {
                this.renderFace(c, this.animateSlice.axis * 2 * s, v.neg(), iv, jv, false);
            } else if (this.animateSlice.index == this.config.dim - 1) {
                this.renderFace(c, this.animateSlice.axis * 2 * s + s, v, iv, jv, false);
            }

            this.animateProgress += dt / 300;
            if (this.animateProgress >= 1) {
                this.animateSlice = null;
                this.nextMove();
            }
        }
    }

    rotate(axis: Vector, angle: number) {
        this.x = this.x.rotate(axis, angle);
        this.y = this.y.rotate(axis, angle);
        this.z = this.z.rotate(axis, angle);
    }

    private animate(slice: CubeSlice, angle: number) {
        this.animateSlice = slice;
        this.animateAngle = -angle;
        this.animateProgress = 0;
    }

    adjust(action: CubeAction) {
        this.config.adjust(action.slice, action.angle);
        this.undoList.push(action);
        this.redoList.length = 0;
        this.animate(action.slice, -action.angle);
    }

    setActor(actor: Iterable<CubeAction> | null) {
        this.actor = actor ? actor[Symbol.iterator]() : undefined;
        if (actor) this.nextMove();
    }

    nextMove() {
        if (!this.actor) return;
        let { value, done } = this.actor.next();
        if (done) {
            this.actor = null;
        } else {
            this.adjust(value);
        }
    }

    canUndo() {
        return this.undoList.length > 1;
    }

    undo() {
        this.setActor(null);
        let action = this.undoList.pop();
        if (action) {
            this.config.adjust(action.slice, -action.angle);
            this.redoList.push(action);
            this.animate(action.slice, action.angle);
        }

    }

    redo() {
        this.setActor(null);
        let action = this.redoList.pop();
        if (action) {
            this.config.adjust(action.slice, action.angle);
            this.undoList.push(action);
            this.animate(action.slice, -action.angle);
        }
    }

    getFaces() {
        return [
            { plane: new Plane(this.center.add(this.x, -1), this.x), iv: this.y, jv: this.z },
            { plane: new Plane(this.center.add(this.x,  1), this.x), iv: this.y, jv: this.z },
            { plane: new Plane(this.center.add(this.y, -1), this.y), iv: this.x, jv: this.z },
            { plane: new Plane(this.center.add(this.y,  1), this.y), iv: this.x, jv: this.z },
            { plane: new Plane(this.center.add(this.z, -1), this.z), iv: this.x, jv: this.y },
            { plane: new Plane(this.center.add(this.z,  1), this.z), iv: this.x, jv: this.y }
        ];
    }
}
