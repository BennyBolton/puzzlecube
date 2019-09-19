"use strict";


import { CubeConfig, CubeOrientation, Face, Axis } from "../model";
import { normalizeInt } from "../util";
import { BottomEdgeStage } from "./bottomedge";



export function *solveCube(config: CubeConfig) {
    let cube = new CubeOrientation(config, Face.Right, Face.Top, Face.Front);

    yield* solve3(cube);
}



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



function getEdge(cube: CubeOrientation, face1: Face, face2: Face) {
    let otherFace = (face1 + 2) % 6;
    if ((otherFace & Face.Axis) == (face2 & Face.Axis)) {
        otherFace = (face1 + 4) % 6;
    }
    return {
        color1: cube.getFace(face1, face2, otherFace).get(0, 1),
        color2: cube.getFace(face2, face1, otherFace).get(0, 1)
    };
}



function getCorner(cube: CubeOrientation, face1: Face, face2: Face, face3: Face) {
    return {
        color1: cube.getFace(face1, face2, face3).get(0, 0),
        color2: cube.getFace(face2, face1, face3).get(0, 0),
        color3: cube.getFace(face3, face1, face2).get(0, 0)
    };
}



function findEdge(cube: CubeOrientation, color1: number, color2: number) {
    for (let i = 0; i < 5; ++i) {
        for (let j = i + 1; j < 6; ++j) {
            if ((i & Face.Axis) == (j & Face.Axis)) continue;

            let { color1: c1, color2: c2 } = getEdge(cube, i, j);
            if (c1 == color1 && c2 == color2) {
                return { face1: i, face2: j };
            }
            if (c1 == color2 && c2 == color1) {
                return { face1: j, face2: i };
            }
        }
    }
    throw new Error("Unable to find edge");
}



function findCorner(cube: CubeOrientation, color1: number, color2: number, color3: number) {
    for (let x = 0; x < 2; ++x) {
        for (let y = 2; y < 4; ++y) {
            for (let z = 4; z < 6; ++z) {
                let { color1: c1, color2: c2, color3: c3 } =
                    getCorner(cube, x, y, z);

                if (c1 == color1) {
                    if (c2 == color2 && c3 == color3) {
                        return { face1: x, face2: y, face3: z };
                    }
                    if (c2 == color3 && c3 == color2) {
                        return { face1: x, face2: z, face3: y };
                    }
                } else if (c2 == color1) {
                    if (c1 == color2 && c3 == color3) {
                        return { face1: y, face2: x, face3: z };
                    }
                    if (c1 == color3 && c3 == color2) {
                        return { face1: y, face2: z, face3: x };
                    }
                } else if (c3 == color1) {
                    if (c1 == color2 && c2 == color3) {
                        return { face1: z, face2: x, face3: y };
                    }
                    if (c1 == color3 && c2 == color2) {
                        return { face1: z, face2: y, face3: x };
                    }
                }
            }
        }
    }
    throw new Error("Unable to find corner");
}



function cornerPosition(...faces: [Face, Face, Face]) {
    let x = false, z = false, y = false;
    for (let face of faces) {
        switch (face & Face.Axis) {
            case Axis.X: x = (face & Face.Positive) != 0; break;
            case Axis.Y: y = (face & Face.Positive) != 0; break;
            case Axis.Z: z = (face & Face.Positive) != 0; break;
        }
    }
    return { x, y, z };
}



function* solve3(cube: CubeOrientation) {
    if (cube.config.size > 2) {
        for (let i = 0; i < 4; ++i) {
            yield* solveTopEdge(cube.rotate(Face.Top, i));
        }
    }

    for (let i = 0; i < 4; ++i) {
        yield* solveTopCorner(cube.rotate(Face.Top, i));
    }

    if (cube.config.size > 2) {
        for (let i = 0; i < 4; ++i) {
            yield* solveSideEdge(cube.rotate(Face.Top, i));
        }
    }

    yield* solveBottomCornerPosition(cube);
    yield* solveBottomCornerRotation(cube);

    if (cube.config.size > 2) {
        yield* new BottomEdgeStage().runStage(cube);
    }
}



function* solveTopEdge(cube: CubeOrientation) {
    let color = cube.getStandardFace(Face.Top).get(1, 1);
    let edgeColor = cube.getStandardFace(Face.Right).get(1, 1);

    let { face1, face2 } = findEdge(cube, color, edgeColor);
    if (face1 == Face.Top) {
        switch (face2) {
            case Face.Left: yield* runProcess(cube, "+UR+U-R"); break;
            case Face.Back: yield* runProcess(cube, "-URU-R"); break;
            case Face.Front: yield* runProcess(cube, "UR-U-R"); break;
        }
    } else if (face2 == Face.Top) {
        switch (face1) {
            case Face.Left: yield* runProcess(cube, "LUB-U"); break;
            case Face.Right: yield* runProcess(cube, "R-UFU"); break;
            case Face.Back: yield* runProcess(cube, "BR"); break;
            case Face.Front: yield* runProcess(cube, "-F-R"); break;
        }
    } else if (face1 == Face.Bottom) {
        switch (face2) {
            case Face.Left: yield* runProcess(cube, "+D+R"); break;
            case Face.Right: yield* runProcess(cube, "+R"); break;
            case Face.Back: yield* runProcess(cube, "D+R"); break;
            case Face.Front: yield* runProcess(cube, "-D+R"); break;
        }
    } else if (face2 == Face.Bottom) {
        switch (face1) {
            case Face.Left: yield* runProcess(cube, "D-BRB"); break;
            case Face.Right: yield* runProcess(cube, "RU-B-U"); break;
            case Face.Back: yield* runProcess(cube, "-BRB"); break;
            case Face.Front: yield* runProcess(cube, "F-R-F"); break;
        }
    } else {
        switch (face2) {
            case Face.Left: yield* runProcess(cube,
                face1 == Face.Front ? "+UL+U" : "+U-L+U"); break;
            case Face.Right: yield* runProcess(cube,
                face1 == Face.Front ? "-R" : "R"); break;
            case Face.Back: yield* runProcess(cube,
                face1 == Face.Right ? "U-B-U" : "UB-U"); break;
            case Face.Front: yield* runProcess(cube,
                face1 == Face.Right ? "-UFU" : "-U-FU"); break;
        }
    }
}



function* solveTopCorner(cube: CubeOrientation) {
    let color1: number, color2: number, color3: number;
    if (cube.config.size > 2) {
        color1 = cube.getStandardFace(Face.Top).get(1, 1);
        color2 = cube.getStandardFace(Face.Front).get(1, 1);
        color3 = cube.getStandardFace(Face.Right).get(1, 1);
    } else {
        let corner = getCorner(cube, Face.Back, Face.Top, Face.Right);
        color1 = corner.color2;
        color2 = corner.color1 ^ 1;
        color3 = corner.color3;
    }

    let { face1, face2, face3 } = findCorner(cube, color1, color2, color3);

    if (face1 == Face.Top) {
        switch (face2) {
            case Face.Left: yield* runProcess(cube, "-L-DLRD-R"); break;
            case Face.Right: yield* runProcess(cube, "BD-B-F-DF"); break;
            case Face.Back: yield* runProcess(cube, "L+D-L-F-DF"); break;
        }
    } else if (face1 == Face.Bottom) {
        switch (face2) {
            case Face.Left: yield* runProcess(cube, "RD-R-F-DF"); break;
            case Face.Right: yield* runProcess(cube, "R+D-R-DRD-R"); break;
            case Face.Back: yield* runProcess(cube, "-F+DFRD-R"); break;
            case Face.Front: yield* runProcess(cube, "R+D-R-F-DF"); break;
        }
    } else if (face2 == Face.Top) {
        switch (face1) {
            case Face.Left: yield* runProcess(cube, "L+D-L RD-R"); break;
            case Face.Right: yield* runProcess(cube, "-FDF RD-R"); break;
            case Face.Back: yield* runProcess(cube, "BD-B RD-R"); break;
            case Face.Front: yield* runProcess(cube, "-LDL-D RD-R"); break;
        }
    } else if (face3 == Face.Top) {
        switch (face1) {
            case Face.Left: yield* runProcess(cube, "-L-DL -F-DF"); break;
            case Face.Right: yield* runProcess(cube, "B-D-BD -F-DF"); break;
            case Face.Back: yield* runProcess(cube, "-B+DB -F-DF"); break;
            case Face.Front: yield* runProcess(cube, "-F-DFD -F-DF"); break;
        }
    } else if (face2 == Face.Bottom) {
        switch (face1) {
            case Face.Left: yield* runProcess(cube, "-D -F-DF"); break;
            case Face.Right: yield* runProcess(cube, "D -F-DF"); break;
            case Face.Back: yield* runProcess(cube, "+D -F-DF"); break;
            case Face.Front: yield* runProcess(cube, "-F-DF"); break;
        }
    } else {
        switch (face1) {
            case Face.Left: yield* runProcess(cube, "+D RD-R"); break;
            case Face.Right: yield* runProcess(cube, "RD-R"); break;
            case Face.Back: yield* runProcess(cube, "D RD-R"); break;
            case Face.Front: yield* runProcess(cube, "-D RD-R"); break;
        }
    }
}



function* solveSideEdge(cube: CubeOrientation) {
    let color1 = cube.getStandardFace(Face.Right).get(1, 1);
    let color2 = cube.getStandardFace(Face.Front).get(1, 1);

    let { face1, face2 } = findEdge(cube, color1, color2);

    if (face1 != Face.Bottom && face2 != Face.Bottom) {
        let inOrder = false, angle = 0;
        switch (face1) {
            case Face.Left: inOrder = face2 == Face.Back; angle = 2; break;
            case Face.Right: inOrder = face2 == Face.Front; break;
            case Face.Back: inOrder = face2 == Face.Right; angle = -1; break;
            case Face.Front: inOrder = face2 == Face.Left; angle = 1; break;
        }
        if (inOrder && angle == 0) return;
        if (!inOrder) --angle;

        yield* runProcess(cube.rotate(Face.Top, angle), "RD-R-D-F-DF");
        if (inOrder) {
            face1 = (face2 ^ Face.Positive);
            face2 = Face.Bottom;
        } else {
            face2 = (face1 ^ Face.Positive);
            face1 = Face.Bottom;
        }
    }

    if (face1 == Face.Bottom) {
        switch (face2) {
            case Face.Left: yield* runProcess(cube, "RD-R-D-F-DF"); break;
            case Face.Right: yield* runProcess(cube, "+D RD-R-D-F-DF"); break;
            case Face.Back: yield* runProcess(cube, "-D RD-R-D-F-DF"); break;
            case Face.Front: yield* runProcess(cube, "D RD-R-D-F-DF"); break;
        }
    } else if (face2 == Face.Bottom) {
        switch (face1) {
            case Face.Left: yield* runProcess(cube, "D -F-DFDRD-R"); break;
            case Face.Right: yield* runProcess(cube, "-D -F-DFDRD-R"); break;
            case Face.Back: yield* runProcess(cube, "-F-DFDRD-R"); break;
            case Face.Front: yield* runProcess(cube, "+D -F-DFDRD-R"); break;
        }
    }
}


function* solveBottomCornerPosition(cube: CubeOrientation) {
    let left: number, right: number, back: number,
        front: number, bottom: number;
    if (cube.config.size > 2) {
        left = cube.getStandardFace(Face.Left).get(1, 1);
        right = cube.getStandardFace(Face.Right).get(1, 1);
        back = cube.getStandardFace(Face.Back).get(1, 1);
        front = cube.getStandardFace(Face.Front).get(1, 1);
        bottom = cube.getStandardFace(Face.Bottom).get(1, 1);
    } else {
        let corner = getCorner(cube, Face.Back, Face.Top, Face.Right);
        left = corner.color3 ^ 1;
        right = corner.color3;
        back = corner.color1;
        front = corner.color1 ^ 1;
        bottom = corner.color2 ^ 1;
    }

    let corners = [
        findCorner(cube, bottom, right, front),
        findCorner(cube, bottom, back, right),
        findCorner(cube, bottom, left, back),
        findCorner(cube, bottom, front, left)
    ].map(({ face1, face2, face3 }) => cornerPosition(face1, face2, face3))
        .map(({ x, z }) => (x ? (z ? 0 : 1) : z ? 3 : 2));

    function inOrder(i1: number, i2: number) {
        return corners[i2] == (corners[i1] + 1) % 4;
    }

    if (inOrder(0, 1)) {
        if (inOrder(2, 3)) {
            yield* runProcess(cube, "$0D", corners[0]);
        } else {
            cube = cube.rotate(Face.Bottom, corners[2]);
            yield* runProcess(cube, "RD-R-F-DFR-D-R $0D", 2 + corners[0]);
        }
    } else if (inOrder(1, 0)) {
        if (inOrder(2, 3)) {
            cube = cube.rotate(Face.Bottom, corners[0]);
            yield* runProcess(cube, "RD-R-F-DFR-D-R $0D", 2 + corners[1]);
        } else {
            cube = cube.rotate(Face.Bottom, corners[0]);
            yield* runProcess(cube, "RD-R-F+DFR-D-R $0D", corners[1]);
        }
    } else {
        if (inOrder(2, 1)) {
            cube = cube.rotate(Face.Bottom, corners[1]);
            yield* runProcess(cube, "RD-R-F-DFR-D-R $0D", 2 + corners[0]);
        } else {
            cube = cube.rotate(Face.Bottom, corners[3]);
            yield* runProcess(cube, "RD-R-F-DFR-D-R $0D", 2 + corners[3]);
        }
    }
}



function* solveBottomCornerRotation(cube: CubeOrientation) {
    let left: number, right: number, back: number,
        front: number, bottom: number;
    if (cube.config.size > 2) {
        left = cube.getStandardFace(Face.Left).get(1, 1);
        right = cube.getStandardFace(Face.Right).get(1, 1);
        back = cube.getStandardFace(Face.Back).get(1, 1);
        front = cube.getStandardFace(Face.Front).get(1, 1);
        bottom = cube.getStandardFace(Face.Bottom).get(1, 1);
    } else {
        let corner = getCorner(cube, Face.Back, Face.Top, Face.Right);
        left = corner.color3 ^ 1;
        right = corner.color3;
        back = corner.color1;
        front = corner.color1 ^ 1;
        bottom = corner.color2 ^ 1;
    }

    let angles = [
        findCorner(cube, bottom, right, front),
        findCorner(cube, bottom, back, right),
        findCorner(cube, bottom, left, back),
        findCorner(cube, bottom, front, left)
    ].map(({ face1, face2, face3 }) => {
        if (face1 == Face.Bottom) return 0;
        if (face2 == Face.Bottom) return 1;
        if (face3 == Face.Bottom) return 2;
        throw new Error("Unable to determine corner angle");
    });

    for (let angle = 0; angle < 4; ++angle) {
        let arrangement = 0;
        for (let i = 0; i < 4; ++i) {
            arrangement *= 16;
            arrangement += angles[(i + angle) % 4];
        }
        switch (arrangement) {
            case 0x0000: return;

            case 0x0111:
                cube = cube.rotate(Face.Bottom, angle);
                yield* runProcess(cube, "+D-L+DLD-LDL");
                return;

            case 0x0222:
                cube = cube.rotate(Face.Bottom, angle);
                yield* runProcess(cube, "-L-DL-D-L+DL+D");
                return;

            case 0x1200:
                cube = cube.rotate(Face.Bottom, angle);
                yield* runProcess(cube, "-L-DL-D-L+DL -F+DFD-FDF");
                return;

            case 0x1020:
                cube = cube.rotate(Face.Bottom, angle);
                yield* runProcess(cube, "-L-DL-D-L+DL -R+DRD-RDR");
                return;

            case 0x1002:
                cube = cube.rotate(Face.Bottom, angle);
                yield* runProcess(cube, "-L-DL-D-L+DL -B+DBD-BDB");
                return;

            case 0x2112:
                cube = cube.rotate(Face.Bottom, angle);
                yield* runProcess(cube, "-L-DL-D-L+DL -F-DF-D-F+DF");
                return;

            case 0x2121:
                cube = cube.rotate(Face.Bottom, angle);
                yield* runProcess(cube, "-L-DL-D-LDL-D-L+DL");
                return;
        }
    }
}
