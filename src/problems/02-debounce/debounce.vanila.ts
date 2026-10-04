// bun test src/problems/02-debounce/test/debounce.test.ts

export function debounce<F extends (...args: any[]) => void>(
  fn: F,
  time: number,
): (...args: Parameters<F>) => void {
  let timerId: ReturnType<typeof setTimeout> | null = null

  return function debounced(this: unknown, ...args: Parameters<F>) {
    if (timerId) {
      clearTimeout(timerId)
    }

    timerId = setTimeout(() => {
      fn.apply(this, args)
    }, time)
  }
}

export function firstElement<T>(arr: T[]): T {
  return arr[0]
}

const firstString = firstElement<String>
const firstNum = firstElement<Number>

console.log(firstElement([1, 'a', {}, 2]))

// --- Examples ---
// Uncomment to test your implementation:

// const log = debounce((msg: string) => console.log(msg), 300)
// log('a') // cancelled by next call
// log('b') // cancelled by next call
// log('c') // only this one fires after 300ms → "c"
