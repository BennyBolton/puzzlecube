"use strict";


import { Settings, CubeCanvas, shuffleCube } from "./application";
import { CubeAction } from "./cube";



class Status {
    private moves = 0;
    private start = 0;
    private interval: number | null = null;

    constructor(
        public readonly movesEl: HTMLElement,
        public readonly timeEl: HTMLElement
    ) {}

    countMove() {
        if (this.moves++ == 0) {
            this.start = Date.now();
            this.interval = setInterval(() => this.updateStatus(), 50);
        }
        this.updateStatus();
    }

    clear() {
        this.moves = 0;
        this.movesEl.innerText = "--";
        this.timeEl.innerText = "--";
        if (this.interval !== null) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    private updateStatus() {
        let dt = Date.now() - this.start;
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

    undo.onclick = () => canvas.undo();
    redo.onclick = () => canvas.redo();
    shuffle.onclick = () =>
        canvas.setActor(shuffler = shuffleCube(canvas.getConfig()));
    expand.onclick = () => settingsContainer.classList.toggle("expanded");

    canvas.onNewCube.bind(() => status.clear());
    canvas.onAction.bind((action, actor) =>
        actor && actor === shuffler ? status.clear() : status.countMove());
}
