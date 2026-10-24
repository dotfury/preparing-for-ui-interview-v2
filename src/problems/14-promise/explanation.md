# MyPromise

`MyPromise` is an interview implementation of the standard `Promise`. These are the pieces it needs, then how a chain uses them, then what the generics mean.

## What you implement

- **Three states.** `status` is `'pending'`, `'fulfilled'`, or `'rejected'`. A promise starts `pending` and settles once.
- **One stored result.** `value` holds the fulfillment value or the rejection reason. `status` says which.
- **A lock.** `isResolved` makes the first `resolve` or `reject` win. Later calls return immediately.
- **`resolve` and `reject`.** Both call `#settle`. `resolve` settles as fulfilled. `reject` passes status `rejected`. They are arrow fields so the executor can call them and `this` still points at the instance.
- **`#settle`.** Sets the lock, writes `value` and `status`, then runs handlers. If the value is another `MyPromise`, it waits and stores that promise's fulfillment value instead of storing the promise object.
- **The constructor.** Takes an executor, `(resolve, reject) => {}`, and runs it synchronously. A throw is passed to `reject`.
- **A handler queue.** `handlers` is the list of reactions waiting on this promise. Each handler is a bridge to the next promise: the user's `onFulfilled` and `onRejected`, plus that next promise's `resolve` and `reject`.
- **`then`.** Always returns a new `MyPromise`, which is what makes chaining work. It fills in default callbacks, builds the child promise, stores the child's `resolve` and `reject` on the handler, and pushes the handler. If this promise is already settled, it runs the queue. Otherwise the handler waits.
- **Default callbacks.** A missing `onFulfilled` becomes `(value) => value`, so the value is forwarded. A missing `onRejected` becomes `(reason) => { throw reason }`, so the rejection continues down the chain.
- **`catch`.** `this.then(null, onRejected)`. Passing `null` selects the pass-through fulfillment callback, so a success skips the catch handler and keeps its value.
- **`execute`.** Chooses `onFulfilled` or `onRejected` from `status`, and runs each one in a `queueMicrotask`. The callback's return value fulfills the child. A returned `MyPromise` is followed with `value.then(resolve, reject)`. A throw rejects the child. The queue is cleared so each handler runs once.
- **`MyPromise.resolve` and `MyPromise.reject`.** Construct a promise and settle it inside the executor. Callbacks attached afterward still run as microtasks.

## How the pieces interact

Settlement and reactions run on different turns. The executor, `#settle`, and the write to `status` / `value` happen on the current stack. Callbacks passed to `then` and `catch` run later, in a microtask. A promise can already be fulfilled on the next line while its `then` callback has not run.

`then` never changes the promise you called it on. It subscribes a child. The child stays `pending` until a handler calls the `resolve` or `reject` captured from the child's constructor.

A fulfilled chain:

```ts
new MyPromise((resolve) => resolve(1))
  .then((v) => v + 1)
  .then((v) => console.log(v))
```

1. The executor calls `resolve(1)`. `#settle` writes `fulfilled` and `1` immediately. The handler list is empty, so `execute` does nothing.
2. The first `then` creates child `p2` and a handler whose `onFulfilled` is `(v) => v + 1`. The parent is already fulfilled, so `execute` schedules that callback and clears the queue. `p2` is still `pending`.
3. The second `then` runs on `p2`, which is still `pending`, so the `console.log` handler just waits in `p2`'s queue.
4. The microtask runs `(v) => v + 1` with `1` and returns `2`. The handler calls `p2`'s `resolve(2)`, which settles `p2` and schedules the log.
5. The next microtask prints `2`. Each link in the chain is one microtask, so the callbacks never pile up on the same stack.

A rejection uses the same path with the other callback:

1. `reject('error')` stores the reason and sets `rejected`.
2. A `then` with only a fulfillment callback installs the default `(reason) => { throw reason }`. `execute` runs that throw inside a microtask and rejects the child.
3. `catch` is a `then` whose rejection callback returns `'recovered'`. A normal return value fulfills the next promise, so the chain continues with `'recovered'`.
4. The original promise stays rejected. Recovery is the child fulfilling.

Several `then` calls on one promise each get their own handler and their own child. They all see the same settled value. Handlers registered before settlement flush together when `#settle` calls `execute`. Handlers registered after settlement each schedule their own microtask.

## The generics

- **`MyPromise<T>`.** `T` is the fulfillment type.
- **`Executor<T>`.** The constructor callback. `resolve` accepts `T | PromiseLike<T>`, a plain value or anything with a `then` method. `reject` takes `any` because a reason is not a `T`.
- **`then<R = T>(onFulfilled, onRejected?)`.** `R` is the child promise's fulfillment type, so `then` returns `MyPromise<R>`. It defaults to `T`, which keeps the type when the callback just forwards the value.
- **`OnFulfilled<T, R>` and `OnRejected<R>`.** A fulfillment callback receives the current value and returns `R`. A rejection callback receives the reason and also returns `R`. Both branches of one `then` share `R`. `null` and `undefined` are in the union so a caller can skip a callback. `catch` uses that to pass `null`.
- **`THandler`.** The internal bridge. Its functions are `any` because one object has to hold callbacks from `MyPromise<T>` and the `resolve` / `reject` of a `MyPromise<R>`.

In practice:

- `new MyPromise((resolve) => resolve(1))` infers `MyPromise<unknown>`. `T | PromiseLike<T>` does not pin `T` to `1`, so the constructor needs an annotation: `new MyPromise<number>(...)`. `MyPromise.resolve(1)` infers `MyPromise<number>` because its type parameter is the argument itself.
- `MyPromise.reject('no')` is typed `MyPromise<string>`. Here the type parameter is the reason, and the promise is rejected with that reason.
- The fulfillment callback is contextually typed as receiving `T | PromiseLike<T>`. Narrow the value, for example with `typeof v === 'number'`, before treating it as `T`.
- If the two callbacks return different types, give `R` explicitly: `then<number | string>(...)`.
- A callback that returns a `MyPromise<string>` makes the next type `MyPromise<MyPromise<string>>`. At runtime `execute` unwraps a returned `MyPromise`, so the child fulfills with the inner value.
- `catch(() => 'recovered')` on a `MyPromise<number>` is typed `MyPromise<string>`, from the recovery callback. If the original promise fulfills, the pass-through callback still forwards the number.
