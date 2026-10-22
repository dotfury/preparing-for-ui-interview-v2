/**
 * 2.6 Merge
 *
 * Merge two types into a new type. Keys of the second type overrides the first type.
 *
 * @example
 * type Foo = { a: number; b: string }
 * type Bar = { b: number; c: boolean }
 *
 * type Result = Merge<Foo, Bar>
 * // { a: number; b: number; c: boolean }
 */

import type { Equal, Expect } from '@course/types'

/* _____________ Your Code Here _____________ */

// Your implementation here
type Merge<T extends {}, F extends {}> = {
  [Property in keyof (T & F)]: Property extends keyof F
    ? F[Property]
    : Property extends keyof T
      ? T[Property]
      : never
}
/* _____________ Test Cases _____________ */

type Foo = { a: number; b: string }
type Bar = { b: number; c: boolean }

type cases = [Expect<Equal<Merge<Foo, Bar>, { a: number; b: number; c: boolean }>>]
