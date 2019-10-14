"use strict";


import { CubeConfig, CubeOrientation, Face } from "../model";
import { Solve3Stage } from "./solve3";



export function *solveCube(config: CubeConfig) {
    let cube = new CubeOrientation(config, Face.Right, Face.Top, Face.Front);

    yield* new Solve3Stage().runStage(cube);
}
