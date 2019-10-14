"use strict";


import { Sequence } from "./sequence";
import { CubeOrientation } from "../model";
import { Best } from "../util";



export interface SubStage {
    transform?(cube: CubeOrientation): Iterable<CubeOrientation>;
    weigh(cube: CubeOrientation): number;
    getSequences(cube: CubeOrientation, weight: number): Iterable<Sequence>;
}



export abstract class Stage {
    private readonly subStages: SubStage[];

    constructor(...subStages: SubStage[]) {
        this.subStages = subStages;
    }

    *realign(cube: CubeOrientation): Iterable<CubeOrientation> {
        yield cube;
    };

    *transform(cube: CubeOrientation): Iterable<CubeOrientation> {
        yield cube;
    }

    *runStage(baseCube: CubeOrientation) {
        let best = new Best<CubeOrientation>();
        for (let cube of this.realign(baseCube)) {
            let subStage = 0, weight = 0;
            for (; subStage < this.subStages.length; ++subStage) {
                weight = this.subStages[subStage].weigh(cube);
                if (weight > 0) break;
            }
            best.consider(cube, -subStage, weight);
        }
        if (!best.value) return;
        baseCube = best.value;

        for (let subStage of this.subStages.slice(-best.getWeight())) {
            let baseWeight = subStage.weigh(baseCube);
            while (baseWeight > 0) {
                let best = new Best<[CubeOrientation, Sequence]>(baseWeight, 0);
                let transformations;
                if (subStage.transform) {
                    transformations = subStage.transform(baseCube);
                } else {
                    transformations = this.transform(baseCube);
                }
                for (let cube of transformations) {
                    let sequences = subStage.getSequences(cube, baseWeight);
                    for (let sequence of sequences) {
                        let trial = cube.clone();
                        for (let action of sequence.getActions(trial)) {
                            action.act();
                        }
                        let weight = subStage.weigh(trial);
                        best.consider(
                            [cube, sequence],
                            weight, sequence.getLength()
                        );
                    }
                }

                if (!best.value) break;
                let [ cube, sequence ] = best.value;

                yield* sequence.getActions(cube);

                baseCube = cube;
                baseWeight = best.getWeight();
            }
        }
    }
}
