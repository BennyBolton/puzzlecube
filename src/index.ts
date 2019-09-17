"use strict";


import { Settings, CubeCanvas, shuffleCube } from "./application";
import { CubeAction } from "./model";



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
        if (this.moves++ == 0) {
            this.start = Date.now();
            this.interval = setInterval(() => this.updateStatus(), 50);
        }
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
    const errorContainer = document.getElementById("errorContainer");
    const errorMessage = document.getElementById("errorMessage");
    const render = document.getElementById("render") as HTMLCanvasElement;
    const undo = document.getElementById("undo");
    const reset = document.getElementById("reset");
    const redo = document.getElementById("redo");
    const shuffle = document.getElementById("shuffle");
    const expand = document.getElementById("expand");
    const settingsContainer = document.getElementById("settingsContainer");
    const moves = document.getElementById("moves");
    const time = document.getElementById("time");


    function handleError(err: Error) {
        errorMessage.innerText = err.stack || err.toString();
        errorContainer.classList.add("visible");
        console.error(err);
    }


    window.onerror = (msg, src, line, col, err) => handleError(err);
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
    shuffle.onclick = () =>
        canvas.setActor(shuffler = shuffleCube(canvas.cube));
    expand.onclick = () => settingsContainer.classList.toggle("expanded");

    canvas.onNewCube.bind(() => status.clear());
    canvas.onAction.bind((action, actor) =>
        actor && actor === shuffler ? status.clear() : status.countMove(action));
}
