"use strict";


import { Hook, Throttle } from "../util";



export class Settings {
    private settings = {} as any;

    public readonly onChange = new Hook<[]>();
    private readonly throttle = new Throttle();

    constructor(private readonly name: string) {
        let settings = localStorage.getItem(name);
        if (settings) this.settings = JSON.parse(settings);
    }

    add(el: HTMLInputElement) {
        if (this.settings[el.id] === undefined) {
            this.settings[el.id] = el.value;
        } else {
            el.value = this.settings[el.id];
        }
        el.onchange = el.oninput = ev => {
            this.settings[el.id] = el.value;
            this.change();
        };
    }

    get(id: string): string {
        return this.settings[id];
    }

    private change() {
        this.throttle.call(() => {
            localStorage.setItem(this.name, JSON.stringify(this.settings));
            this.onChange.emit();
        });
    }
}
