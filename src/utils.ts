export type Result<TOk, TError> =
    | { IsOk: true, Ok: TOk }
    | { IsOk: false, Error: TError }

export const Result = {
    ok: <TOk, TError>(value: TOk): Result<TOk, TError> => {
        return { IsOk: true, Ok: value }
    },
    error: <TOk, TError>(value: TError): Result<TOk, TError> => {
        return { IsOk: false, Error: value }
    },
    forceOk: <TOk>(result: Result<TOk, any>) => {
        if (result.IsOk)
            return result.Ok
        else throw 'Result is not Ok'
    },
    forceError: <TError>(result: Result<any, TError>) => {
        if (!result.IsOk)
            return result.Error
        else throw 'Result is not Error'
    },
    fromOk: <TOk, TError, UError>(result: Result<TOk, TError>): Result<TOk, UError> => {
        if (result.IsOk)
            return Result.ok(result.Ok)
        else throw 'Result is not Ok'
    },
    fromError: <TOk, UOk, TError>(result: Result<TOk, TError>): Result<UOk, TError> => {
        if (!result.IsOk)
            return Result.error(result.Error)
        else throw 'Result is not Error'
    },
    map: <TOk, UOk, TError>(fn: (ok: TOk) => UOk, result: Result<TOk, TError>): Result<UOk, TError> => {
        if (result.IsOk)
            return Result.ok(fn(result.Ok))
        else
            return Result.fromError(result)
    },
    bind: <TOk, UOk, TError>(fn: (ok: TOk) => Result<UOk, TError>, result: Result<TOk, TError>): Result<UOk, TError> => {
        if (result.IsOk)
            return fn(result.Ok)
        else return Result.fromError(result)
    },
    fromTry: <TOk, TError = any>(fn: () => TOk): Result<TOk, TError> => {
        try {
            return Result.ok(fn())
        }
        catch (error) {
            return Result.error(error as TError)
        }
    },
    all: <TOk, TError>(results: Result<TOk, TError>[]): Result<TOk[], TError[]> => {
        const okMask = results.map(r => r.IsOk)
        if (okMask.reduce((acc, i) => acc || i))
            return Result.ok(Arr.filterMask(results, okMask)
                .map(Result.forceOk))
        else
            return Result.error(Arr.filterMask(results, okMask.map(not))
                .map(Result.forceError))
    }
}

export const Arr = {
    zip: <T1, T2>(array1: T1[], array2: T2[]): [T1, T2][] => {
        if (array1.length != array2.length)
            throw 'Arrays must be of equal length in order to zip'
        return array1.map((v, i) => [v, array2[i]])
    },
    zipSelf: <T1, T2>(fn: (v: T1, i: number) => T2, array: T1[]): [T1, T2][] => {
        return Arr.zip(array, array.map(fn))
    },
    filterMask: <T>(array: T[], mask: boolean[]): T[] => {
        if (array.length != mask.length)
            throw 'Mask must be of equal length to the array'
        return Arr.zip(array, mask)
            .filter(([_, m]) => m)
            .map(([v, _]) => v)
    },
    filterOut: <T>(fn: ((v: T) => boolean), array: T[]): [T[], T[]] => {
        let vIn = []
        let vOut = []

        for (const v of array) {
            if (fn(v))
                vIn.push(v)
            else
                vOut.push(v)
        }

        return [vIn, vOut]
    },
    decons: <T>(array: T[]): [T, T[]] => {
        if (array.length > 0) {
            const a = [...array]
            const head = a.shift()
            return [head!, a]
        }
        else throw 'Cannot decons an empty array.'
    },
    random: <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)]
}

export const Obj = {
    hasKeys: (keys: string[], obj: any): boolean => {
        if (obj !== undefined && obj !== null) {
            for (const key of keys)
                if (!(key in obj)) return false
            return true
        }
        else return false
    },
}

export const Record = {
    toPairs: <TKey extends string | number | symbol, TValue>(record: Record<TKey, TValue>): [TKey, TValue][] => {
        let zip: [TKey, TValue][] = []

        for (const key in record)
            zip.push([key, record[key]])

        return zip
    },
    fromPairs: <TKey extends string | number | symbol, TValue>(zip: [TKey, TValue][]): Record<TKey, TValue> => {
        let record = {} as Record<TKey, TValue>

        for (const [k, v] of zip)
            record[k] = v

        return record
    }
}

export const not = (a: any) => !a
export const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))
export const splitTimes = (splitter: string, times: number, str: string): string[] => {
    const split = str.split(splitter)
    let parts = split.slice(0, times)
    parts.push(split.slice(times).join(splitter))
    return parts
}
export const tryJSON = (str: string): any | undefined => {
    try {
        return JSON.parse(str)
    }
    catch {
        return undefined
    }
}
