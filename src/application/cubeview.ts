"use strict";


import { CubeAction, CubeConfig } from "../cube";
import { Renderer } from "./renderer";
import { Vector, Line, Plane, UnitSpace } from "../math";



interface FacePosition {
    readonly face: number;
    readonly i: number;
    readonly j: number;
}



export class CubeView {
    private static readonly colors = [
        [0, 0, 1],
        [0, 1, 0],
        [1, 1, 1],
        [1, 1, 0],
        [1, 0.5, 0],
        [1, 0, 0]
    ];

    private static readonly faces = [
        { face: 0, v: Vector.X.neg(), iv: Vector.Y, jv: Vector.Z, flip: true },
        { face: 1, v: Vector.X,       iv: Vector.Y, jv: Vector.Z, flip: false },
        { face: 2, v: Vector.Y.neg(), iv: Vector.X, jv: Vector.Z, flip: false },
        { face: 3, v: Vector.Y,       iv: Vector.X, jv: Vector.Z, flip: true },
        { face: 4, v: Vector.Z.neg(), iv: Vector.X, jv: Vector.Y, flip: true },
        { face: 5, v: Vector.Z,       iv: Vector.X, jv: Vector.Y, flip: false },
    ];

    public readonly config = new CubeConfig(this.size);
    private center = Vector.zero;
    private space = UnitSpace.Base;
    private animation: CubeAction | null = null;
    private animationProgress = 0;
    private animationCb: (() => void) | null = null;

    constructor(public readonly size: number) {}

    action(action: CubeAction, cb?: () => void) {
        this.config.adjust(action.slice, action.angle);
        this.animation = action;
        this.animationProgress = 0;
        this.animationCb = cb;
    }

    move(center: Vector) {
        this.center = center;
    }

    rotate(axis: Vector, angle: number) {
        this.space = this.space.rotate(axis, angle);
    }

    intersectFace(face: number, line: Line) {
        let v = this.space.map(CubeView.faces[face].v);
        let iv = this.space.map(CubeView.faces[face].iv);
        let jv = this.space.map(CubeView.faces[face].jv);

        let plane = new Plane(this.center.add(v), v);
        let distance = plane.distanceTo(line);
        let p = line.advance(distance);
        let i = new Line(plane.point, iv).distanceTo(p) / 2 + 0.5;
        let j = new Line(plane.point, jv).distanceTo(p) / 2 + 0.5;

        return { i, j, distance };
    }

    intersect(line: Line) {
        let bestFace: null | FacePosition = null, closest = Infinity;
        for (let face = 0; face < 6; ++face) {
            let { i, j, distance } = this.intersectFace(face, line);

            if (i >= 0 && i <= 1 && j >= 0 && j <= 1 && distance < closest) {
                closest = distance;
                bestFace = { face, i, j };
            }
        };
        return bestFace;
    }

    render(ctx: Renderer, dt: number) {
        let rotationAxis = Vector.X, rotationAngle = 0;
        if (this.animation) {
            this.animationProgress += dt;
            if (this.animationProgress > 1) {
                let cb = this.animationCb;
                this.animationProgress = 1;
                this.animation = null;
                this.animationCb = null;
                if (cb) cb();
            }
        }

        if (this.animation) {
            switch (this.animation.slice.axis) {
                case 0: rotationAxis = this.space.x; break;
                case 1: rotationAxis = this.space.y; break;
                case 2: rotationAxis = this.space.z; break;
            }
            let progress = Math.cos(this.animationProgress * Math.PI) + 1;
            rotationAngle = this.animation.angle * Math.PI * progress / 4;
        }

        for (let { face, v, iv, jv, flip } of CubeView.faces) {
            let corner = this.space.map(v.add(iv, -1).add(jv, -1));
            iv = this.space.map(iv.scale(2 / this.size));
            jv = this.space.map(jv.scale(2 / this.size));

            let staticSpace = new UnitSpace(iv, jv, corner.add(this.center));
            let isAnimated: ((i: number, j: number) => boolean) | null = null;
            let animatedSpace = staticSpace;
            if (this.animation) {
                animatedSpace = new UnitSpace(
                    iv.rotate(rotationAxis, rotationAngle),
                    jv.rotate(rotationAxis, rotationAngle),
                    corner.rotate(rotationAxis, rotationAngle).add(this.center)
                );
                let { axis, index } = this.animation.slice;
                let faceAxis = Math.floor(face / 2);
                if (axis == faceAxis) {
                    if (index == (face % 2 ? this.size - 1 : 0)) {
                        isAnimated = () => true;
                    }
                } else {
                    if (axis == 0 || axis == 1 && faceAxis == 0) {
                        isAnimated = (i, j) => i == index;
                    } else {
                        isAnimated = (i, j) => j == index;
                    }
                }
            }

            let data = this.config.getFace(face);
            for (let i = 0; i < this.size; ++i) {
                for (let j = 0; j < this.size; ++j) {
                    let space = staticSpace;
                    if (isAnimated && isAnimated(i, j)) {
                        space = animatedSpace;
                    }
                    let color = CubeView.colors[data[j * this.size + i]];
                    ctx.setColor(color[0], color[1], color[2]);
                    ctx.rect(
                        space.map(i, j, 1),
                        flip ? space.y : space.x,
                        flip ? space.x : space.y
                    );
                }
            }
        }

        if (this.animation) {
            let { v, iv, jv, flip } = CubeView.faces[this.animation.slice.axis * 2];

            v = this.space.map(v);
            iv = this.space.map(iv.scale(2));
            jv = this.space.map(jv.scale(2));
            let corner = v.add(iv, -0.5).add(jv, -0.5).add(this.center);

            let av = v.rotate(rotationAxis, rotationAngle);
            let aiv = iv.rotate(rotationAxis, rotationAngle);
            let ajv = jv.rotate(rotationAxis, rotationAngle);
            let acorner = av.add(aiv, -0.5).add(ajv, -0.5).add(this.center);

            ctx.setColor(0, 0, 0);

            for (let i = 0; i < 2; ++i) {
                let index = this.animation.slice.index + i;
                if (index == 0 || index == this.size) continue;

                ctx.rect(
                    corner.add(v, -2 * index / this.size),
                    (i ? flip : !flip) ? jv : iv,
                    (i ? flip : !flip) ? iv : jv
                );

                ctx.rect(
                    acorner.add(av, -2 * index / this.size),
                    (i ? !flip : flip) ? ajv : aiv,
                    (i ? !flip : flip) ? aiv : ajv
                );
            }
        }
    }
}
