import { catchError, EMPTY, from, map, mergeMap, Observable, of } from 'rxjs';
import { Action } from '../lib/models';

export function mapResponse<R1 extends Action, R2 extends Action, T>(
    mapFn: (next: T) => R1 | R1[],
    errorFn: (error: any) => R2 | R2[] | void
): (source: Observable<T>) => Observable<R1 | R2> {
    return (source) =>
        source.pipe(
            map((v) => mapFn(v)),
            mergeMap((mapFnResult) => {
                return Array.isArray(mapFnResult) ? from(mapFnResult) : of(mapFnResult);
            }),
            catchError((err) => {
                const errorFnResult = errorFn(err);
                return errorFnResult
                    ? Array.isArray(errorFnResult)
                        ? from(errorFnResult)
                        : of(errorFnResult)
                    : EMPTY;
            })
        );
}
