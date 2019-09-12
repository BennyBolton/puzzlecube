"use strict";


import * as $ from "jquery";



class Settings {
    private settings = {} as any;
    private readonly cbs = [] as (() => void)[];

    constructor(public readonly name: string) {
        let settings = localStorage.getItem(name);
        if (settings) this.settings = JSON.parse(settings);
    }

    add(el: HTMLElement & { value?: string }) {
        if (this.settings[el.id] === undefined) {
            this.settings[el.id] = el.value;
        } else {
            el.value = this.settings[el.id];
        }
        el.onchange = ev => {
            this.settings[el.id] = el.value;
            this.change();
        };
    }

    get(id: string) {
        return this.settings[id];
    }

    onChange(cb: () => void) {
        this.cbs.push(cb);
    }

    private change() {
        localStorage.setItem(this.name, JSON.stringify(this.settings));
        for (let cb of this.cbs) {
            cb();
        }
    }
}


export class Page {
    public readonly ready: Promise<undefined>;

    private isReady = false;
    private settings = new Settings("rubikSettings");

    constructor() {
        this.ready = new Promise(res =>
            $.ready.then(() => {
                $(".setting").each((i, el) => this.settings.add(el));
                this.isReady = true;
                res();
            })
        );
    }

    setting(id: string) {
        this.assertReady();
        return this.settings.get(id);
    }

    onSettingsChange(cb: () => void) {
        this.settings.onChange(cb);
    }

    get<T extends HTMLElement>(id: string) {
        this.assertReady();
        return $(`#${id}`)[0] as T;
    }

    private assertReady() {
        if (!this.isReady) {
            throw new Error("Page not ready");
        }
    }
}
