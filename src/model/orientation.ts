"use strict";


import { CubeConfig, Face } from "./config";
import { CubeRow } from "./row";
import { CubeFace } from "./face";
import { CubeRing } from "./ring";



export class CubeOrientation {
    constructor(
        public readonly config: CubeConfig,
        public readonly right: Face = Face.Right,
        public readonly top: Face = Face.Top,
        public readonly front: Face = Face.Front
    ) {}

    reorient(right: Face, top: Face, front: Face) {
        return new CubeOrientation(
            this.config,
            this.mapFace(right),
            this.mapFace(top),
            this.mapFace(front)
        );
    }

    mapFace(face: Face): Face {
        switch (face) {
            case Face.Left: return this.right ^ 1;
            case Face.Right: return this.right;
            case Face.Bottom: return this.top ^ 1;
            case Face.Top: return this.top;
            case Face.Back: return this.front ^ 1;
            case Face.Front: return this.front;
        }
    }

    getRow(along: Face, from: Face, iFace: Face, i: number) {
        return CubeRow.make(
            this.config,
            this.mapFace(along),
            this.mapFace(from),
            this.mapFace(iFace),
            i
        );
    }

    getFace(face: Face, iFrom: Face, jFrom: Face) {
        return CubeFace.make(
            this.config,
            this.mapFace(face),
            this.mapFace(iFrom),
            this.mapFace(jFrom)
        );
    }

    getRing(along: Face, from: Face, iFace: Face, i: number) {
        return CubeRing.make(
            this.config,
            this.mapFace(along),
            this.mapFace(from),
            this.mapFace(iFace),
            i
        );
    }
}
