"use strict";


import { Stage, StageModel, ModelAction } from "./stage";
import { CubeOrientation, Face } from "../model";
import { normalizeInt } from "../util";



type Edge = [number, number];
type Edges = [Edge, Edge, Edge, Edge];



function* runProcess(cube: CubeOrientation, process: string, ...args: (string | number)[]) {
    process = process.replace(/\$([0-9]+)/, (_, key) => {
        let i = +key;
        let arg = args[i];
        if (typeof arg == "number") {
            switch (normalizeInt(arg, 4)) {
                case 0: return "!";
                case 1: return "";
                case 2: return "+";
                case 3: return "-";
            }
            throw new Error("Internal error");
        } else if (arg) {
            return arg;
        } else {
            throw new Error(`Expected process parameter '${key}'`);
        }
    });
    let regex = /(-|\+|\!)?([LRFBUD])([1-9][0-9]*)?/g;
    let match = null as ReturnType<RegExp["exec"]>;
    while (match = regex.exec(process)) {
        let angle = 1;
        switch (match[1]) {
            case "!": return;
            case "-": angle = -1; break;
            case "+": angle = 2; break;
        }
        let face = Face.Left;
        switch (match[2]) {
            case "L": face = Face.Left; break;
            case "R": face = Face.Right; break;
            case "D": face = Face.Bottom; break;
            case "U": face = Face.Top; break;
            case "B": face = Face.Back; break;
            case "F": face = Face.Front; break;
        }
        let offset = +(match[3] || "1") - 1;
        yield cube.getAction(face, offset, angle);
    }
}



export class Action1 extends ModelAction<Model> {
    constructor() {
        super(1);
    }

    alterModel(model: Model) {
        return new Model(
            model.cube,
            [
                [model.edges[2][1], model.edges[2][0]],
                model.edges[0],
                [model.edges[1][1], model.edges[1][0]],
                model.edges[3]
            ],
            model.colors
        );
    }

    *alterCube(cube: CubeOrientation) {
        yield* runProcess(cube, "-F-LBL-BF-D-BDB");
    }
}



export class Action2 extends ModelAction<Model> {
    constructor() {
        super(1);
    }

    alterModel(model: Model) {
        return new Model(
            model.cube,
            [
                model.edges[2],
                [model.edges[0][1], model.edges[0][0]],
                [model.edges[1][1], model.edges[1][0]],
                model.edges[3]
            ],
            model.colors
        );
    }

    *alterCube(cube: CubeOrientation) {
        yield* runProcess(cube, "L-R-FR-L+DL-R-FR-L");
    }
}



export class Action3 extends ModelAction<Model> {
    constructor() {
        super(1);
    }

    alterModel(model: Model) {
        return new Model(
            model.cube,
            [
                model.edges[1],
                [model.edges[2][1], model.edges[2][0]],
                [model.edges[0][1], model.edges[0][0]],
                model.edges[3]
            ],
            model.colors
        );
    }

    *alterCube(cube: CubeOrientation) {
        yield* runProcess(cube, "-B-DBDB-F-L-BLF");
    }
}



export class Model extends StageModel<BottomEdgeStage> {
    constructor(
        readonly cube: CubeOrientation,
        readonly edges: Edges,
        readonly colors: number[]
    ) {
        super();
    }

    getCube() {
        return this.cube;
    }

    weigh() {
        let correct = 0, flipped = 0, wrong = 0, wrongFlipped = 0;
        for (let i = 0; i < 4; ++i) {
            let [ bottom, edge ] = this.edges[i];
            if (edge == this.colors[i]) {
                ++correct;
            } else if (bottom == this.colors[i]) {
                ++flipped;
            } else if (bottom == this.colors[4]) {
                ++wrong;
            } else {
                ++wrongFlipped;
            }
        }
        if (correct == 4) return 0;
        if (correct == 2) return 2;
        if (correct == 1) return wrongFlipped > 0 ? 1 : 2;
        return wrongFlipped > 0 ? 2 : 3;
    }

    *transform() {
        let [ e1, e2, e3, e4 ] = this.edges;
        let [ c1, c2, c3, c4, c5 ] = this.colors;
        let cube = this.cube;

        yield this;
        yield new Model(cube.rotate(Face.Bottom, 1), [e2, e3, e4, e1], [c2, c3, c4, c1, c5]);
        yield new Model(cube.rotate(Face.Bottom, 2), [e3, e4, e1, e2], [c3, c4, c1, c2, c5]);
        yield new Model(cube.rotate(Face.Bottom, 3), [e4, e1, e2, e3], [c4, c1, c2, c3, c5]);

        cube = this.cube.reorient(Face.Front, Face.Top, Face.Right);
        yield new Model(cube,                        [e4, e3, e2, e1], [c4, c3, c2, c1, c5]);
        yield new Model(cube.rotate(Face.Bottom, 1), [e3, e2, e1, e4], [c3, c2, c1, c4, c5]);
        yield new Model(cube.rotate(Face.Bottom, 2), [e2, e1, e4, e3], [c2, c1, c4, c3, c5]);
        yield new Model(cube.rotate(Face.Bottom, 3), [e1, e4, e3, e2], [c1, c4, c3, c2, c5]);
    }
}



export class BottomEdgeStage extends Stage<Model> {
    makeModel(cube: CubeOrientation) {
        let face = cube.getStandardFace(Face.Bottom);
        let ring1 = cube.getStandardRing(Face.Bottom, 0);
        let ring2 = cube.getStandardRing(Face.Bottom, 1);
        let end = cube.config.size - 1;

        return new Model(
            cube,
            [
                [face.get(1, end), ring1.getRow(2).get(1)],
                [face.get(end, 1), ring1.getRow(1).get(1)],
                [face.get(1, 0), ring1.getRow(0).get(1)],
                [face.get(0, 1), ring1.getRow(3).get(1)]
            ],
            [
                ring2.getRow(2).get(1),
                ring2.getRow(1).get(1),
                ring2.getRow(0).get(1),
                ring2.getRow(3).get(1),
                face.get(1, 1)
            ]
        );
    }

    *transform(cube: CubeOrientation) {
        yield cube;
    }

    *getActions() {
        yield new Action1();
        yield new Action2();
        yield new Action3();
    }
}
