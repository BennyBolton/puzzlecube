"use strict";


import { CubeConfig, CubeAction, CubeSlice } from "../cube";



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
    let axis = -1;
    let index = -1;
    while (true) {
        axis = randInt(0, 3, axis);
        index = randInt(0, cube.dim, index);
        let angle = Math.random() > 0.5 ? -1 : 1;
        yield new CubeAction(
            new CubeSlice(cube.dim, axis, index),
            angle
        );
    }
}
