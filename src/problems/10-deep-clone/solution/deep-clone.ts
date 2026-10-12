const getType = (value: any) => {
  if (value == null) {
    return `${value}`
  }
  return (Object.getPrototypeOf(value)?.constructor?.name ?? 'object').toLowerCase()
}

type TCollection = Map<any, any> | Set<any> | Record<any, any> | Array<any>

const addIntoTarget = (target: TCollection, value: any, key?: string | number) => {
  if (target instanceof Map) {
    target.set(key, value)
  } else if (target instanceof Set) {
    target.add(value)
  } else {
    ;(target as Record<string | number, any>)[key as string] = value
  }
}

const createTarget = (type: string): TCollection => {
  switch (type) {
    case 'map':
      return new Map()
    case 'set':
      return new Set()
    case 'object':
      return {}
    case 'array':
      return []
    default:
      throw Error('Unknown collection type')
  }
}

const each = (target: TCollection, callback: (value: any, key?: string | number) => void) => {
  if (target instanceof Map || target instanceof Set) {
    target.forEach(callback)
  } else {
    Object.entries(target).forEach(([key, val]) => callback(val, key))
  }
}

export function deepClone<T>(value: T, cache = new Map()): T {
  const type = getType(value)
  if (cache.has(value)) {
    return cache.get(value)
  }
  switch (type) {
    case 'map':
    case 'set':
    case 'object':
    case 'array': {
      const target = createTarget(type)
      cache.set(value, target)
      each(value as TCollection, (val, key) => {
        addIntoTarget(target, deepClone(val, cache), key)
      })
      return target as T
    }
    case 'date':
      return new Date((value as Date).getTime()) as T
    default:
      return value as T
  }
}
