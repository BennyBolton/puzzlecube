"use strict";


import { SubStage, Stage } from "./stage";
import { CubeOrientation, Face } from "../model";
import { Sequence } from "./sequence";



function getCubeConfig(cube: CubeOrientation) {
    let N = cube.config.size - 1;

    let left = cube.getStandardFace(Face.Left);
    let right = cube.getStandardFace(Face.Right);
    let bottom = cube.getStandardFace(Face.Bottom);
    let top = cube.getStandardFace(Face.Top);
    let back = cube.getStandardFace(Face.Back);
    let front = cube.getStandardFace(Face.Front);

    let leftColor = cube.mapFace(Face.Left);
    let rightColor = cube.mapFace(Face.Right);
    let bottomColor = cube.mapFace(Face.Bottom);
    let topColor = cube.mapFace(Face.Top);
    let backColor = cube.mapFace(Face.Back);
    let frontColor = cube.mapFace(Face.Front);
    if (cube.config.size > 2) {
        leftColor = left.get(1, 1);
        rightColor = right.get(1, 1);
        bottomColor = bottom.get(1, 1);
        topColor = top.get(1, 1);
        backColor = back.get(1, 1);
        frontColor = front.get(1, 1);
    }

    return {
        N, left, right, bottom, top, back, front,
        leftColor, rightColor, bottomColor, topColor, backColor, frontColor
    };
}



const topEdge: SubStage = {
    weigh(cube: CubeOrientation) {
        if (cube.config.size < 3) return 0;

        let {
            N, left, front, right, back, top,
            leftColor, frontColor, rightColor, backColor, topColor
        } = getCubeConfig(cube);

        let expect = [leftColor, frontColor, rightColor, backColor];
        let actual = [
            top.get(1, 0) == topColor ? left.get(0, 1) : null,
            top.get(N, 1) == topColor ? front.get(1, N) : null,
            top.get(1, N) == topColor ? right.get(N, 1) : null,
            top.get(0, 1) == topColor ? back.get(1, N) : null
        ];
        let best = Infinity;
        for (let angle = 0; angle < 4; ++angle) {
            let weight = 4;
            for (let i = 0; i < 4; ++i) {
                if (actual[i] !== null) {
                    if (actual[i] == expect[(i + angle) % 4]) {
                        --weight;
                    } else {
                        ++weight;
                    }
                }
            }
            best = Math.min(best, weight);
        }
        return best;
    },

    *getSequences() {
        yield new Sequence("L");
        yield new Sequence("UL");
        yield new Sequence("U2L");
        yield new Sequence("U'L");

        yield new Sequence("L2");
        yield new Sequence("DL2");
        yield new Sequence("D2L2");

        yield new Sequence("FL");
        yield new Sequence("FUL");
        yield new Sequence("FU2L");
        yield new Sequence("FU'L");

        yield new Sequence("F'L");
        yield new Sequence("F'LF");
        yield new Sequence("F'U'L");
        yield new Sequence("UF'L");
        yield new Sequence("UF'LF");
    }
};


const topCorner: SubStage = {
    weigh(cube: CubeOrientation) {
        let {
            N, left, front, right, back, top,
            leftColor, frontColor, rightColor, backColor, topColor
        } = getCubeConfig(cube);

        let edges = [leftColor, frontColor, rightColor, backColor];
        if (cube.config.size > 2) {
            edges = [left.get(0, 1), front.get(1, N), right.get(N, 1), back.get(1, N)];
        }
        let topCorners = [
            [edges[0], top.get(N, 0), left.get(0, N), front.get(0, N)],
            [edges[1], top.get(N, N), front.get(N, N), right.get(N, N)],
            [edges[2], top.get(0, N), right.get(N, 0), back.get(0, N)],
            [edges[3], top.get(0, 0), back.get(N, N), left.get(0, 0)]
        ];

        let weight = 8;
        for (let [ edge, top, left, right ] of topCorners) {
            if (top == topColor && left == edge) {
                weight -= 2;
            } else if (top == topColor || left == topColor || right == topColor) {
                weight += 2;
            }
        }
        if (edges[0] != leftColor) {
            ++weight;
        }
        return weight;
    },

    *getSequences() {
        yield new Sequence("U");
        yield new Sequence("U2");

        yield new Sequence("FDF'");
        yield new Sequence("DFDF'");
        yield new Sequence("D2FDF'");
        yield new Sequence("D'FDF'");

        yield new Sequence("FD'F'");
        yield new Sequence("DFD'F'");
        yield new Sequence("D2FD'F'");
        yield new Sequence("D'FD'F'");

        yield new Sequence("FDF'L'D'L");
        yield new Sequence("DFDF'L'D'L");
        yield new Sequence("D2FDF'L'D'L");
        yield new Sequence("D'FDF'L'D'L");
    }
};


const sideEdge: SubStage = {
    weigh(cube: CubeOrientation) {
        if (cube.config.size < 3) return 0;

        let {
            N, bottomColor
        } = getCubeConfig(cube);

        let weight = 4;
        let ring = cube.getStandardRing(Face.Top, 1);
        for (let i = 0; i < 4; ++i) {
            let r1 = ring.getRow(i);
            let r2 = ring.getRow((i + 1) % 4);
            if (r1.get(1) == r1.get(N) && r2.get(0) == r2.get(1)) {
                --weight;
            } else if (r1.get(N) != bottomColor && r2.get(0) != bottomColor) {
                ++weight;
            }
        }
        return weight;
    },

    *getSequences() {
        yield new Sequence("FDF'D'L'D'L");
        yield new Sequence("DFDF'D'L'D'L");
        yield new Sequence("D2FDF'D'L'D'L");
        yield new Sequence("D'FDF'D'L'D'L");
    }
};


const bottomCornerPosition: SubStage = {
    weigh(cube: CubeOrientation) {
        let {
            N, left, front, right, back, bottom,
            leftColor, frontColor, rightColor, backColor, bottomColor
        } = getCubeConfig(cube);

        let expected = [leftColor, frontColor, rightColor, backColor];
        let corners = [
            [bottom.get(0, 0), front.get(0, 0), left.get(N, N)],
            [bottom.get(0, N), right.get(0, N), front.get(N, 0)],
            [bottom.get(N, N), back.get(0, 0), right.get(0, 0)],
            [bottom.get(N, 0), left.get(N, 0), back.get(N, 0)]
        ];
        for (let angle = 0; angle < 4; ++angle) {
            let correct = true;
            for (let i = 0; i < 4; ++i) {
                let [c1, c2, c3] = corners[i];
                if (c1 == bottomColor) {
                    correct = correct && c3 == expected[(i + angle) % 4];
                } else if (c2 == bottomColor) {
                    correct = correct && c1 == expected[(i + angle) % 4];
                } else {
                    correct = correct && c2 == expected[(i + angle) % 4];
                }
            }
            if (correct) return 0;
        }
        return 1;
    },

    *getSequences() {
        yield new Sequence("RDR'F'D'FRD'R'");
        yield new Sequence("RDR'F'D2FRD'R'");
    }
};


const bottomCornerRotation: SubStage = {
    weigh(cube: CubeOrientation) {
        let {
            N, left, front, right, back, bottom,
            leftColor, frontColor, rightColor, backColor, bottomColor
        } = getCubeConfig(cube);

        let expected = [leftColor, frontColor, rightColor, backColor];
        let corners = [
            bottom.get(0, 0), bottom.get(0, N), bottom.get(N, N), bottom.get(N, 0)
        ];

        let correct = 0;
        for (let color of corners) {
            if (color == bottomColor) ++correct;
        }
        let weight = 0;
        switch (correct) {
            case 0: weight = 4; break;
            case 1: weight = 2; break;
            case 2: weight = 4; break;
            case 4: weight = 0; break;
        }
        if (left.get(N, N) != expected[0]) {
            ++weight;
        }
        return weight;
    },

    *getSequences(cube: CubeOrientation) {
        yield new Sequence("D");
        yield new Sequence("D2");

        yield new Sequence("RDR'DRD2R'");
        yield new Sequence("RD2R'D'RD'R'");
    }
};


const bottomEdge: SubStage = {
    weigh(cube: CubeOrientation) {
        if (cube.config.size < 3) return 0;

        let {
            N, left, front, right, back, bottom,
            leftColor, frontColor, rightColor, backColor, bottomColor
        } = getCubeConfig(cube);

        let expected = [leftColor, frontColor, rightColor, backColor];
        let edges = [
            [bottom.get(1, 0), left.get(N, 1)],
            [bottom.get(0, 1), front.get(1, 0)],
            [bottom.get(1, N), right.get(0, 1)],
            [bottom.get(N, 1), back.get(1, 0)]
        ];
        let correct = 0, wrongFlipped = 0;
        for (let i = 0; i < 4; ++i) {
            let [ bottom, edge ] = edges[i];
            if (edge == expected[i]) {
                ++correct;
            } else if (bottom != bottomColor && bottom != expected[i]) {
                ++wrongFlipped;
            }
        }

        let weight = 0;
        switch (correct) {
            case 2: weight = 2; break;
            case 1: weight = wrongFlipped > 0 ? 1 : 2; break;
            case 0: weight = wrongFlipped > 0 ? 2 : 3; break;
        }
        return weight;
    },

    *getSequences(cube: CubeOrientation) {
        yield new Sequence("B'D'BDBF'L'B'LF");
        yield new Sequence("F'L'BLB'FD'B'DB");
        yield new Sequence("LR'F'RL'D2LR'F'RL'");
    }
};



export class Solve3Stage extends Stage {
    constructor() {
        super(
            topEdge,
            topCorner,
            sideEdge,
            bottomCornerPosition,
            bottomCornerRotation,
            bottomEdge
        );
    }

    *realign(cube: CubeOrientation) {
        yield cube;
        yield cube.rotate(Face.Front, 1);
        yield cube.rotate(Face.Front, 2);
        yield cube.rotate(Face.Front, 3);

        yield cube.rotate(Face.Right, 1);
        yield cube.rotate(Face.Right, 3);
    }

    *transform(cube: CubeOrientation) {
        yield cube;
        yield cube.rotate(Face.Top, 1);
        yield cube.rotate(Face.Top, 2);
        yield cube.rotate(Face.Top, 3);

        yield cube = cube.reorient(Face.Front, Face.Top, Face.Right);
        yield cube.rotate(Face.Top, 1);
        yield cube.rotate(Face.Top, 2);
        yield cube.rotate(Face.Top, 3);
    }
}
