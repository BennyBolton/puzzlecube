"use strict";



export class Best<T> {
    public value = null as T | null;
    private weight: number[];

    constructor(...weight: number[]) {
        this.weight = weight.length > 0 ? weight.slice() : [Infinity];
    }

    consider(option: T, ...weight: number[]) {
        for (let i = 0; i < this.weight.length; ++i) {
            if (i >= weight.length || weight[i] < this.weight[i]) {
                this.value = option;
                this.weight = weight;
            } else if (weight[i] > this.weight[i]) {
                return;
            }
        }
    }

    getWeight(i = 0) {
        return this.weight[i];
    }
}
