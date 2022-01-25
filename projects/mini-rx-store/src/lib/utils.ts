import { OperatorFunction, pipe } from 'rxjs';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import { Action, MiniRxActionType, MetaReducer, Reducer } from './models';

export function ofType(...allowedTypes: string[]): OperatorFunction<Action, Action> {
    return filter((action: Action) =>
        allowedTypes.some((type) => {
            return type === action.type;
        })
    );
}

export function select<T, K>(mapFn: (state: T) => K) {
    return pipe(
        map((state: T) => mapFn(state)),
        distinctUntilChanged()
    );
}

export function combineMetaReducers<T>(metaReducers: MetaReducer<T>[]): MetaReducer<T> {
    return (reducer: Reducer<any>): Reducer<T> => {
        return metaReducers.reduceRight(
            (previousValue: Reducer<T>, currentValue: MetaReducer<T>) => {
                return currentValue(previousValue);
            },
            reducer
        );
    };
}

export function omit<T extends { [key: string]: any }>(object: T, keyToOmit: keyof T): Partial<T> {
    return Object.keys(object)
        .filter((key) => key !== keyToOmit)
        .reduce((prevValue, key) => {
            prevValue[key] = object[key];
            return prevValue;
        }, {});
}

export const miniRxNameSpace = '@mini-rx';

export function createMiniRxAction(
    miniRxActionType: MiniRxActionType,
    featureKeys?: string[]
): Action {
    return {
        type:
            miniRxNameSpace +
            '/' +
            miniRxActionType +
            (featureKeys ? '/' + featureKeys.join('/') : ''),
    };
}

export function isMiniRxAction(action: Action, miniRxActionType: MiniRxActionType) {
    return action.type.indexOf(miniRxNameSpace + '/' + miniRxActionType) === 0;
}

export function miniRxError(message: string) {
    throw new Error(miniRxNameSpace + ': ' + message);
}
