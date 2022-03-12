export const Queue = {
    enqueue: <T>(value: T, array: T[]): T[] => {
        let arr = [...array]
        arr.push(value)
        return arr
    },
    dequeue: <T>(array: T[]): [T, T[]] => {
        let arr = [...array]
        const value = arr[0]
        return [value, arr.splice(0, 1)]
    },
}
