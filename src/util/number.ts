"use strict";



export function normalizeInt(i: number, N: number) {
    i %= N;
    return i < 0 ? i + N : i;
}
