# Object Path Resolver

**Object Path Resolver** is a TypeScript library that provides a flexible and efficient way to resolve nested property paths within JavaScript objects. It allows you to access deeply nested properties, arrays, and even iterate over them asynchronously. This README will guide you through using and understanding the library.

## Installation

You can install the `object-path-resolver` library using npm or yarn:

```bash
npm install object-path-resolver
```

or

```bash
yarn add object-path-resolver
```

## Usage

To use `object-path-resolver`, you need to import the necessary functions and types from the library. Here's a basic example of how to use it:

```typescript
import { pathResolver, PathResolverOptions } from 'object-path-resolver';

const data = {
    user: {
        profile: {
            name: 'John Doe',
            age: 30,
        },
        hobbies: ['reading', 'swimming'],
    }
};

const path = 'user.profile.name';
const result = pathResolver(data, path);

console.log(result); // Output: 'John Doe'
```

In this example, we imported the `pathResolver` function and used it to access the deeply nested property `user.profile.name` within the `data` object.


## Notes
- **Empty Strings as Keys**: `object-path-resolver` does not support empty strings as keys.
- **Special Characters**: Special characters such as backslash (`\`), dot (`.`), and asterisk (`*`) need to be escaped with a backslash (`\`) if you want to use them as plain actual key characters.
- **Indexes in iterators**: Indexes in iterators are not supported (a PR for this feature is welcome!)
- **prototype**: Accessing `prototype` or `__proto__` is not supported sue to security concerns (I will consider a PR for this feature if it is behind configuration).

## Features

### Synchronous and Asynchronous Resolution

`object-path-resolver` supports both synchronous and asynchronous property resolution. You can specify whether you want to resolve properties synchronously or asynchronously using the `sync` option:

```typescript
const syncResult = pathResolver(data, path, { sync: true }); // Synchronous
const asyncResult = pathResolver(data, path, { sync: false }); // Asynchronous
```

### Custom Missing Value

You can specify a custom value to return when the specified property is not found using the `missing` option:

```typescript
const missingValue = pathResolver(data, 'user.profile.location', { missing: 'Not found' });
console.log(missingValue); // Output: 'Not found'
```

### Array and Iteration Support

`object-path-resolver` supports accessing and iterating over array elements and iterable objects:

```typescript
const data = {
  items: [
    { name: 'Item 1', price: 10 },
    { name: 'Item 2', price: 20 },
  ],
};

const arrayResult = pathResolver(data, 'items.0.name');
console.log(arrayResult); // Output: 'Item 1'

const names = pathResolver(data, 'items.*.name');
console.log(names); // Output: ['Item 1', 'Item 2]

const iterableData = {
  items: (function* () {
    yield 'Item A';
    yield 'Item B';
  })(),
};

const iterableResult = pathResolver(iterableData, 'items.*');
console.log(iterableResult); // Output: ['Item A', 'Item B']
```

### Special Characters and Escaping

`object-path-resolver` handles special characters like dots (`.`) and asterisks (`*`) as part of property names. You can also escape these characters with a backslash (`\`) when needed:

```typescript
const specialCharacterResult = pathResolver(data, 'user.something.really.special');
console.log(specialCharacterResult); // Output: 'Value'

const escapedCharacterResult = pathResolver(data, 'user.something\\.really.special');
console.log(escapedCharacterResult); // Output: 'Value'
```

## Testing

The library includes test cases to ensure its functionality. You can run the provided tests. Here's an example of how to run the tests:

```bash
npm test
```

## Contributions

Contributions to the `object-path-resolver` library are welcome. If you find any issues or have suggestions for improvements, please feel free to open an issue or submit a pull request on the [GitHub repository](https://github.com/your-repo/object-path-resolver).

## License

This library is open-source and released under the MIT License. You can find the detailed license information in the [LICENSE](./LICENSE.md) file.

---

Thank you for using `object-path-resolver`! We hope it simplifies your JavaScript object property resolution tasks. If you have any questions or need further assistance, please don't hesitate to reach out.
