// bun test src/problems/06-es5-extends/test/es5-extends.test.ts

export const myExtends = (SuperType: Function, SubType: Function) => {
  function MyType(...args: any[]) {
    const obj = Object.create(SubType.prototype)
    console.log('OBJ: ', obj)

    SuperType.apply(obj, args)
    SubType.apply(obj, args)

    console.log('OBJ2: ', obj)
    return obj
  }

  Object.setPrototypeOf(SubType.prototype, SuperType.prototype)
  Object.setPrototypeOf(MyType, SuperType)

  return MyType
}

// --- Examples ---
// Uncomment to test your implementation:

function Animal(this: any, name: string) {
  this.name = name
}
Animal.print = () => {
  console.log('Animal')
}
Animal.prototype.greet = function () {
  return `Hello, ${this.name}`
}

function Dog(this: any) {
  this.breed = 'Labrador'
}
Dog.prototype.bark = function () {
  return `${this.name} says Woof!`
}

const DogExtended = myExtends(Animal, Dog)
const dog = new (DogExtended as any)('Rex')
console.log(dog.name) // Expected: "Rex"
console.log(dog.breed) // Expected: "Labrador"
console.log(dog.greet()) // Expected: "Hello, Rex"
console.log(dog.bark()) // Expected: "Rex says Woof!"
console.log(dog instanceof Animal); // Expected: "Animal"


(DogExtended as any).print()
