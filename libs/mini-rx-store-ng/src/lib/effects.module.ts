// Credits go to Marko Stanimirović
// Copied from with small modifications: https://github.com/markostanimirovic/juliette/blob/1.2.0/projects/juliette-ng/src/lib/effects.module.ts

// MIT License
//
// Copyright (c) 2020 Marko Stanimirović
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import { InjectionToken, ModuleWithProviders, NgModule, Type, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Action, Store } from 'mini-rx-store';
import {
    fromClassesWithEffectsToClassProviders,
    fromObjectsWithEffectsToEffects,
} from './effects-mapper';
import { StoreFeatureModule, StoreRootModule } from './store.module';

const OBJECTS_WITH_EFFECTS = new InjectionToken('@mini-rx/objectsWithEffects');

@NgModule()
export class EffectsModule {
    private store = inject(Store);
    // ≥Make sure effects can select state from store, also if EffectsModule is registered before Store.forFeature
    private storeRootModule = inject(StoreRootModule, { optional: true });
    private storeFeatureModule = inject(StoreFeatureModule, { optional: true });

    constructor() {
        const objectsWithEffects: any = inject(OBJECTS_WITH_EFFECTS);

        const effects = fromObjectsWithEffectsToEffects(objectsWithEffects);
        effects.forEach((effect: Observable<Action>) => {
            this.store.effect(effect);
        });
    }

    static register(classesWithEffects: Type<any>[]): ModuleWithProviders<EffectsModule> {
        return {
            ngModule: EffectsModule,
            providers: [
                ...fromClassesWithEffectsToClassProviders(OBJECTS_WITH_EFFECTS, classesWithEffects),
            ],
        };
    }
}
