import { Observable } from 'rxjs';
import { ExtensionId, ExtensionSortOrder } from './enums';

export type AppState = Record<string, any>;

export abstract class StoreExtension {
    abstract id: ExtensionId;
    sortOrder: ExtensionSortOrder = ExtensionSortOrder.DEFAULT;

    abstract init(): MetaReducer<any> | void;
}

export interface ComponentStoreExtension extends StoreExtension {
    hasCsSupport: true;

    init(): MetaReducer<any>;
}

export interface ComponentStoreConfig {
    extensions: ComponentStoreExtension[];
}

export interface Action {
    type: string;
    // Allows any extra properties to be defined in an action.
    [x: string]: any;
}

export interface StoreConfig<T> {
    reducers?: ReducerDictionary<T>;
    initialState?: T;
    metaReducers?: MetaReducer<AppState>[];
    extensions?: StoreExtension[];
}

// Used for the Redux API: Store.feature / StoreModule.forFeature
export interface FeatureConfig<StateType> {
    initialState: StateType;
    metaReducers?: MetaReducer<StateType>[];
}

// Used for createFeatureStore, new FeatureStore
export interface FeatureStoreConfig {
    multi?: boolean;
}

export class Actions extends Observable<Action> {}

export type Reducer<StateType> = (state: StateType, action: Action) => StateType;

export type MetaReducer<StateType> = (reducer: Reducer<StateType>) => Reducer<StateType>;

export type ReducerDictionary<T> = {
    [p in keyof T]: Reducer<T[p]>;
};

export type StateOrCallback<StateType> =
    | Partial<StateType>
    | ((state: StateType) => Partial<StateType>);

export type MiniRxAction<T> = {
    stateOrCallback: StateOrCallback<T>; // Used in FeatureStore/ComponentStore reducer to calc new state
    type: string; // The action type visible in DevTools / Logging Extension
    featureId?: string; // Links the feature reducer to its corresponding FeatureStore
};

export interface ReducerState {
    featureReducers: ReducerDictionary<AppState>;
    metaReducers: MetaReducer<AppState>[];
}

export const enum OperationType {
    INIT = 'init',
    DESTROY = 'destroy',
    SET_STATE = 'set-state',
    CONNECTION = 'connection',
}

export type UpdateStateCallback<StateType> = (
    stateOrCallback: StateOrCallback<StateType>,
    operationType: OperationType,
    name: string | undefined
) => Action;
