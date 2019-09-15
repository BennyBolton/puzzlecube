"use strict";


import { Settings, CubeCanvas, shuffleCube } from "./application";



window.onload = () => {
    const errorContainer = document.getElementById("errorContainer");
    const errorMessage = document.getElementById("errorMessage");
    const render = document.getElementById("render") as HTMLCanvasElement;
    const undo = document.getElementById("undo");
    const redo = document.getElementById("redo");
    const shuffle = document.getElementById("shuffle");
    const expand = document.getElementById("expand");
    const settingsContainer = document.getElementById("settingsContainer");


    function handleError(err: Error) {
        errorMessage.innerText = err.stack || err.toString();
        errorContainer.classList.add("visible");
        console.error(err);
    }


    window.onerror = (msg, src, line, col, err) => handleError(err);
    window.onunhandledrejection = (ev: PromiseRejectionEvent) => 
        (handleError(ev.reason), ev.preventDefault());


    let settings = new Settings("rubikSettings");

    for (let el of document.getElementsByClassName("setting")) {
        for (let child of el.children) {
            if (child instanceof HTMLInputElement) {
                settings.add(child);
            }
        }
    }


    let canvas = new CubeCanvas(settings, render);


    undo.onclick = () => canvas.undo();
    redo.onclick = () => canvas.redo();
    shuffle.onclick = () => canvas.setActor(shuffleCube(canvas.getConfig()));
    expand.onclick = () => settingsContainer.classList.toggle("expanded");
    errorContainer.onclick = () => errorContainer.classList.remove("visible");
}
