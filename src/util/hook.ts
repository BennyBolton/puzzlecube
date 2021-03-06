"use strict";



export type Callback<T extends any[]> = (...args: T) => void;



export class Hook<T extends any[]> {
    private readonly listeners = new Set<Callback<T>>();
    private readonly oneTime = [] as Callback<T>[];

    bind(cb: Callback<T>) {
        this.listeners.add(cb);
    }

    unbind(cb: Callback<T>) {
        this.listeners.delete(cb);
    }

    once(cb: Callback<T>) {
        this.oneTime.push(cb);
    }

    emit(...args: T) {
        for (let cb of this.oneTime) {
            cb(...args);
        }
        this.oneTime.length = 0;

        for (let cb of this.listeners) {
            cb(...args);
        }
    }
}
