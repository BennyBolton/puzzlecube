"use strict";


import { CubeConfig, CubeOrientation, Face } from "../model";
import { CubeStage } from "./cubestage";
import { Solve3Model } from "./solve3";



export function *solveCube(config: CubeConfig) {
    let cube = new CubeOrientation(config, Face.Right, Face.Top, Face.Front);

    yield* new CubeStage(Solve3Model).runStage(cube);
}
