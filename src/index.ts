"use strict";


import { Settings, CubeCanvas, shuffleCube } from "./application";
import { solveCube } from "./solver";
import { CubeAction, CubeConfig } from "./model";



class Status {
    private moves = 0;
    private start = 0;
    private end: number | null = null;
    private interval: number | null = null;

    constructor(
        public readonly movesEl: HTMLElement,
        public readonly timeEl: HTMLElement
    ) {}

    countMove(action: CubeAction) {
        if (this.moves == 0) {
            this.start = Date.now();
            this.interval = setInterval(() => this.updateStatus(), 50);
        }
        this.moves += Math.abs(action.angle);
        if (this.end === null && action.config.isSolved()) {
            this.end = Date.now();
            if (this.interval) {
                clearInterval(this.interval);
                this.interval = null;
            }
        }
        this.updateStatus();
    }

    clear() {
        this.end = null;
        this.moves = 0;
        this.movesEl.innerText = "--";
        this.timeEl.innerText = "--";
        if (this.interval !== null) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    private updateStatus() {
        let time = this.end === null ? Date.now() : this.end;
        let dt = time - this.start;
        let csecs = (Math.floor(dt / 10) % 60).toString();
        if (csecs.length < 2) csecs = `0${csecs}`;
        let secs = (Math.floor(dt / 1000) % 60).toString();
        if (secs.length < 2) secs = `0${secs}`;
        let mins = (Math.floor(dt / 60000) % 60).toString();

        this.movesEl.innerText = this.moves.toString();
        this.timeEl.innerText = `${mins}:${secs}.${csecs}`;
    }
}



window.onload = () => {
    function getEl(id: string) {
        let el = document.getElementById(id);
        if (!el) {
            throw new Error(`Unable to find el '${id}'`);
        }
        return el;
    }
    const errorContainer = getEl("errorContainer");
    const errorMessage = getEl("errorMessage");
    const render = getEl("render") as HTMLCanvasElement;
    const undo = getEl("undo");
    const reset = getEl("reset");
    const redo = getEl("redo");
    const shuffle = getEl("shuffle");
    const solve = getEl("solve");
    const expand = getEl("expand");
    const settingsContainer = getEl("settingsContainer");
    const moves = getEl("moves");
    const time = getEl("time");


    function handleError(err: Error | string) {
        err = typeof err == "string" ? err : (err.stack || err.toString());
        errorMessage.innerText = err;
        errorContainer.classList.add("visible");
        console.error(err);
    }


    window.onerror = (msg, src, line, col, err) => handleError(err || msg.toString());
    window.onunhandledrejection = (ev: PromiseRejectionEvent) => 
        (handleError(ev.reason), ev.preventDefault());
    errorContainer.onclick = () => errorContainer.classList.remove("visible");


    let settings = new Settings("rubikSettings");

    for (let el of document.getElementsByClassName("setting")) {
        for (let child of el.children) {
            if (child instanceof HTMLInputElement) {
                settings.add(child);
            }
        }
    }


    let canvas = new CubeCanvas(settings, render);
    let status = new Status(moves, time);
    let shuffler: Iterator<CubeAction> | undefined;

    reset.onclick = () => canvas.reset();
    undo.onclick = () => canvas.undo();
    redo.onclick = () => canvas.redo();
    shuffle.onclick = () => canvas.setActor(shuffler = shuffleCube(canvas.cube));
    solve.onclick = () => canvas.setActor(solveCube(canvas.cube));
    expand.onclick = () => settingsContainer.classList.toggle("expanded");

    canvas.onNewCube.bind(() => status.clear());
    canvas.onAction.bind((action, actor) =>
        actor && actor === shuffler ? status.clear() : status.countMove(action));


    getEl("testSolver").onclick = () => {
        let cube = new CubeConfig(canvas.cube.size);
        let totalCount = 0, failed = 0, trials = 100, min = Infinity, max = -Infinity;
        let time = Date.now();
        for (let i = 0; i < trials; ++i) {
            if (Date.now() - time > 1000) {
                trials = i;
                break;
            }
            let count = 0;
            for (let action of shuffleCube(cube)) {
                action.act();
                if (++count >= 100) break;
            }
            count = 0;
            for (let action of solveCube(cube)) {
                action.act();
                count += Math.abs(action.angle);
            }
            if (!cube.isSolved()) ++failed;
            totalCount += count;
            if (count < min) min = count;
            if (count > max) max = count;
        }
        let result = JSON.stringify({
            avgTime: (Date.now() - time) / trials,
            trials, avg: totalCount / trials, min, max, failed
        }, null, 2);
        alert(result)
        console.log(result);
        if (failed > 0) {
            console.error(new Error("Didn't work"));
        }
    }
}
