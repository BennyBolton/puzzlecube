"use strict";


import { CubeConfig, CubeAction } from "../model";



function randInt(start: number, end: number, exclude: number) {
    let inRange = false;
    if (exclude >= start && exclude < end) {
        --end;
        inRange = true;
    }
    let x = Math.floor(Math.random() * (end - start)) + start;
    return inRange && x >= exclude ? x + 1 : x;
}



export function *shuffleCube(cube: CubeConfig) {
    let face = -1;
    let index = -1;
    while (true) {
        yield new CubeAction(
            cube,
            (face = randInt(0, 3, face)) * 2,
            index = randInt(0, cube.size, index),
            Math.random() > 0.5 ? -1 : 1
        );
    }
}
