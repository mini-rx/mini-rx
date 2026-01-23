import {
    EnvironmentProviders,
    inject,
    makeEnvironmentProviders,
    Type,
    provideEnvironmentInitializer,
} from '@angular/core';
import { Observable } from 'rxjs';
import {
    Action,
    Actions,
    AppState,
    ComponentStoreConfig,
    FeatureConfig,
    Reducer,
    StoreConfig,
} from '@mini-rx/common';
import { rxEffect, storeCore } from './store-core';
import { Store } from './store';
import { globalCsConfig } from './component-store';
import {
    fromClassesWithEffectsToClassProviders,
    fromObjectsWithEffectsToEffects,
} from './effects-mapper';
import {
    COMPONENT_STORE_CONFIG_PROVIDER,
    EFFECTS_PROVIDER,
    FEATURE_CONFIGS,
    FEATURE_NAMES,
    FEATURE_PROVIDER,
    FEATURE_REDUCERS,
    OBJECTS_WITH_EFFECTS,
    STORE_CONFIG,
    STORE_PROVIDER,
} from './injection-tokens';

// Store
function storeFactory(config: StoreConfig<AppState>) {
    return new Store(config);
}

function rootStoreProviderFactory(): void {
    inject(Store);
    inject(Actions);
}

export function provideStore<T>(config: StoreConfig<T>): EnvironmentProviders {
    return makeEnvironmentProviders([
        { provide: STORE_CONFIG, useValue: config },
        {
            provide: Store,
            useFactory: storeFactory,
            deps: [STORE_CONFIG],
        },
        {
            provide: Actions,
            useValue: storeCore.actions$,
        },
        { provide: STORE_PROVIDER, useFactory: rootStoreProviderFactory },
        provideEnvironmentInitializer(() => {
            const initializerFn = (() => {
                return () => inject(STORE_PROVIDER);
            })();
            return initializerFn();
        }),
    ]);
}

// Feature
function featureProviderFactory(): void {
    const featureNames = inject(FEATURE_NAMES);
    const reducers = inject(FEATURE_REDUCERS);
    const configs = inject(FEATURE_CONFIGS);

    featureNames.forEach((featureName, index) => {
        storeCore.addFeature(featureName, reducers[index], configs[index]);
    });
}

export function provideFeature<T>(
    featureName: string,
    reducer: Reducer<T>,
    config?: Partial<FeatureConfig<T>>
): EnvironmentProviders {
    return makeEnvironmentProviders([
        { provide: FEATURE_NAMES, multi: true, useValue: featureName },
        { provide: FEATURE_REDUCERS, multi: true, useValue: reducer },
        { provide: FEATURE_CONFIGS, multi: true, useValue: config },
        { provide: FEATURE_PROVIDER, useFactory: featureProviderFactory },
        provideEnvironmentInitializer(() => {
            const initializerFn = (() => {
                return () => inject(FEATURE_PROVIDER);
            })();
            return initializerFn();
        }),
    ]);
}

// Effects
function effectsProviderFactory(): void {
    const objectsWithEffects = inject(OBJECTS_WITH_EFFECTS);

    const effects = fromObjectsWithEffectsToEffects(objectsWithEffects);
    effects.forEach((effect: Observable<Action>) => {
        rxEffect(effect);
    });
}

export function provideEffects(classesWithEffects: Type<any>[]): EnvironmentProviders;
export function provideEffects(...classesWithEffects: Type<any>[]): EnvironmentProviders;
export function provideEffects(...classesWithEffects: any[]): EnvironmentProviders {
    return makeEnvironmentProviders([
        ...fromClassesWithEffectsToClassProviders(OBJECTS_WITH_EFFECTS, classesWithEffects),
        { provide: EFFECTS_PROVIDER, useFactory: effectsProviderFactory },
        provideEnvironmentInitializer(() => {
            const initializerFn = (() => {
                return () => inject(EFFECTS_PROVIDER);
            })();
            return initializerFn();
        }),
    ]);
}

// Component Store config
export function provideComponentStoreConfig(config: ComponentStoreConfig) {
    return makeEnvironmentProviders([
        {
            provide: COMPONENT_STORE_CONFIG_PROVIDER,
            useFactory: () => globalCsConfig.set(config),
        },
        provideEnvironmentInitializer(() => {
            const initializerFn = (() => {
                return () => inject(COMPONENT_STORE_CONFIG_PROVIDER);
            })();
            return initializerFn();
        }),
    ]);
}
