import { cleanCache__testOnly } from './convert-path-to-array-of-keys';
import { pathResolver, PathResolverOptions } from './index';

describe('pathResolver', () => {
  describe.each([true, false])('sync is %s', (isSync) => {
    async function pathResolverWithSync(obj: any, path: string, options?: PathResolverOptions) {
      if (!options) {
        options = {};
      }
      options.sync = isSync;

      const result = pathResolver(obj, path, options);

      if (isSync) {
        expect(typeof result?.then).not.toEqual('function');
      } else {
        expect(typeof result?.then).toEqual('function');
      }

      return result;
    }

    describe('options', () => {
      describe('options.missing', () => {
        it('should return the custom missing value when not finding', async () => {
          const kMissing = Symbol('kMissing');

          const value = await pathResolverWithSync({ one: 2 }, 'two', { missing: kMissing });

          expect(value).toEqual(kMissing);
        });
      });
    });

    describe('allowPrototypeAccess', () => {
      describe.each([false, undefined])('allowPrototypeAccess: %s', (allowPrototypeAccess) => {
        it('should throw an error when trying to access __proto__ of an object', async () => {
          class Person {
            public a = 1;
          }

          const data = new Person();
          // @ts-expect-error typescript doesn't have type for this
          data.__proto__.isAdmin = true;

          await expect(() => pathResolverWithSync(data, '__proto__.isAdmin', { allowPrototypeAccess })).rejects.toThrow(
            'using __proto__ is not allowed, you can enable it by passing allowPrototypeAccess: true',
          );
        });

        it('should throw an error when trying to access prototype of an object', async () => {
          function Person() {
            // NoOp
          }

          // noinspection JSUnusedGlobalSymbols
          Person.prototype.isAdmin = true;

          await expect(() => pathResolverWithSync(Person, 'prototype.isAdmin')).rejects.toThrow(
            'using prototype is not allowed, you can enable it by passing allowPrototypeAccess: true',
          );
        });

        describe('when path came from cache', () => {
          it('should throw an error when trying to access __proto__ of an object', async () => {
            class Person {
              public a = 1;
            }

            const data = new Person();
            // @ts-expect-error typescript doesn't have type for this
            data.__proto__.isAdmin = true;

            const path = '__proto__.isAdmin';

            // Just to have it in the cache
            await pathResolverWithSync(data, path, { allowPrototypeAccess: true });

            await expect(() => pathResolverWithSync(data, path, { allowPrototypeAccess })).rejects.toThrow(
              'using __proto__ is not allowed, you can enable it by passing allowPrototypeAccess: true',
            );
          });

          it('should throw an error when trying to access prototype of an object', async () => {
            function Person() {
              // NoOp
            }

            // noinspection JSUnusedGlobalSymbols
            Person.prototype.isAdmin = true;

            const path = 'prototype.isAdmin';

            // Just to have it in the cache
            await pathResolverWithSync(Person, path, { allowPrototypeAccess: true });

            await expect(() => pathResolverWithSync(Person, path, { allowPrototypeAccess })).rejects.toThrow(
              'using prototype is not allowed, you can enable it by passing allowPrototypeAccess: true',
            );
          });
        });
      });

      describe('allowPrototypeAccess: true', () => {
        it('should allow accessing __proto__ of an object', async () => {
          class Person {
            public a = 1;
          }

          const data = new Person();
          // @ts-expect-error typescript doesn't have type for this
          data.__proto__.isAdmin = true;

          const value = await pathResolverWithSync(data, '__proto__.isAdmin', { allowPrototypeAccess: true });
          expect(value).toEqual(true);
        });

        it('should allow accessing prototype of an object', async () => {
          function Person() {
            // NoOp
          }

          // noinspection JSUnusedGlobalSymbols
          Person.prototype.isAdmin = true;

          const value = await pathResolverWithSync(Person, 'prototype.isAdmin', { allowPrototypeAccess: true });
          expect(value).toEqual(true);
        });
      });
    });

    describe('accessing missing values', () => {
      it("should return undefined for path 'two' when the data is { one: 2 }", async () => {
        const value = await pathResolverWithSync({ one: 2 }, 'two');
        expect(value).toBeUndefined();
      });

      it("should return undefined for path 'one.something' when the data is { one: 2 }", async () => {
        const value = await pathResolverWithSync({ one: 2 }, 'one.something');
        expect(value).toBeUndefined();
      });

      it("should return undefined for path 'two.something' when the data is { one: 2 }", async () => {
        const value = await pathResolverWithSync({ one: 2 }, 'two.something');
        expect(value).toBeUndefined();
      });

      it("should return undefined for path 'one.something' when the data is { one: { hello: 'world' }", async () => {
        const value = await pathResolverWithSync({ one: { hello: 'world' } }, 'one.something');
        expect(value).toBeUndefined();
      });

      it("should return undefined for path 'one.0' when the data is { one: 2 }", async () => {
        const value = await pathResolverWithSync({ one: 2 }, 'one.0');
        expect(value).toBeUndefined();
      });

      it("should return undefined for path 'one.0' when the data is { one: 'hello' }", async () => {
        const value = await pathResolverWithSync({ one: 'hello' }, 'one.0');
        expect(value).toBeUndefined();
      });

      it("should return undefined for path 'one.0' when the data is { one: <function> }", async () => {
        const value = await pathResolverWithSync({ one: () => 2 }, 'one.0');
        expect(value).toBeUndefined();
      });

      it("should return undefined for path 'one.hello.world' when the data is { one: undefined } }", async () => {
        const value = await pathResolverWithSync({ one: undefined }, 'one.hello.world');
        expect(value).toBeUndefined();
      });

      it("should return undefined for path 'one.hello.world' when the data is { one: null } }", async () => {
        const value = await pathResolverWithSync({ one: null }, 'one.hello.world');
        expect(value).toBeUndefined();
      });

      it("should return undefined for path 'one.hello.world' when the data is { one: { hello: null } } }", async () => {
        const value = await pathResolverWithSync({ one: { hello: null } }, 'one.hello.world');
        expect(value).toBeUndefined();
      });

      it("should return undefined for path 'one.*' when the data is { one: { hello: 'world' } }", async () => {
        const value = await pathResolverWithSync({ one: {} }, 'one.*');
        expect(value).toBeUndefined();
      });
    });

    describe('top level', () => {
      it("should find the value 2 for path 'one' when the data is { one: 2 }", async () => {
        const value = await pathResolverWithSync({ one: 2 }, 'one');
        expect(value).toEqual(2);
      });

      it("should find the value [1, 2, 3] for path 'one' when the data is { one: [1, 2, 3] }", async () => {
        const value = await pathResolverWithSync({ one: [1, 2, 3] }, 'one');
        expect(value).toEqual([1, 2, 3]);
      });

      it("should find the value { something: 'good' } for path 'one' when the data is { one: { something: 'good' } }", async () => {
        const value = await pathResolverWithSync({ one: { something: 'good' } }, 'one');
        expect(value).toEqual({ something: 'good' });
      });

      it('should return undefined when trying the find missing value', async () => {
        const value = await pathResolverWithSync({ one: { something: 'good' } }, 'two');
        expect(value).toBeUndefined();
      });
    });

    describe('level 2', () => {
      it("should find the value 2 for path 'one.data' when the data is { one: { data: 2 } }", async () => {
        const value = await pathResolverWithSync({ one: { data: 2 } }, 'one.data');
        expect(value).toEqual(2);
      });

      it("should find the value [1, 2, 3] for path 'one' when the data is { one: [1, 2, 3] }", async () => {
        const value = await pathResolverWithSync({ one: [1, 2, 3] }, 'one');
        expect(value).toEqual([1, 2, 3]);
      });

      it("should find the value { something: 'good' } for path 'one' when the data is { one: { something: 'good' } }", async () => {
        const value = await pathResolverWithSync({ one: { something: 'good' } }, 'one');
        expect(value).toEqual({ something: 'good' });
      });

      it('should return undefined when trying the find missing value', async () => {
        const value = await pathResolverWithSync({ one: { something: 'good' } }, 'two');
        expect(value).toBeUndefined();
      });
    });

    describe('array elements', () => {
      it("should find the value at the 1st index for path 'one.0' when the data is { one: ['hello', 'world'] }", async () => {
        const value = await pathResolverWithSync({ one: ['hello', 'world'] }, 'one.0');
        expect(value).toEqual('hello');
      });

      it("should find the value at the 2nd index for path 'one.1' when the data is { one: ['hello', 'world'] }", async () => {
        const value = await pathResolverWithSync({ one: ['hello', 'world'] }, 'one.1');
        expect(value).toEqual('world');
      });

      it("should find the value at the 2nd index for path 'one.1' when the data is { one: [<function>, <function>] }", async () => {
        const value = await pathResolverWithSync({ one: [() => 'hello', () => 'world'] }, 'one.1');
        expect(value).toEqual('world');
      });

      it("should find the array for path 'one.*' when the data is { one: ['hello', 'world'] }", async () => {
        const value = await pathResolverWithSync({ one: ['hello', 'world'] }, 'one.*');
        expect(value).toEqual(['hello', 'world']);
      });

      it("should find the array for path 'one.*' when the data is { one: [{ id: '1st', data: 'hello' }, { id: '2nd', data: 'world' }] }", async () => {
        const value = await pathResolverWithSync(
          {
            one: [
              { id: '1st', data: 'hello' },
              { id: '2nd', data: 'world' },
            ],
          },
          'one.*',
        );
        expect(value).toEqual([
          { id: '1st', data: 'hello' },
          { id: '2nd', data: 'world' },
        ]);
      });

      it("should find the array for path 'one.*.id' when the data is { one: [{ id: '1st', data: 'hello' }, { id: '2nd', data: 'world' }] }", async () => {
        const value = await pathResolverWithSync(
          {
            one: [
              { id: '1st', data: 'hello' },
              { id: '2nd', data: 'world' },
            ],
          },
          'one.*.id',
        );
        expect(value).toEqual(['1st', '2nd']);
      });
    });

    describe('iterators', () => {
      function* createIterator(array: any[]): Iterator<any, void, unknown> {
        let nextIndex = 0;
        while (nextIndex < array.length) {
          yield array[nextIndex++];
        }
      }

      it("should not find the value at the 1st index for path 'one.0' when the data is { one: <iterable> }", async () => {
        const value = await pathResolverWithSync({ one: createIterator(['hello', 'world']) }, 'one.0');
        expect(value).toBeUndefined();
      });

      it("should get an array for path 'one.*' when the data is { one: <iterable> }", async () => {
        const value = await pathResolverWithSync({ one: createIterator(['hello', 'world']) }, 'one.*');
        expect(value).toEqual(['hello', 'world']);
      });

      it("should get an array for path 'one.*.id' when the data is { one: <object-iterable>", async () => {
        const value = await pathResolverWithSync(
          {
            one: createIterator([
              { id: '1st', data: 'hello' },
              { id: '2nd', data: 'world' },
            ]),
          },
          'one.*.id',
        );
        expect(value).toEqual(['1st', '2nd']);
      });
    });

    describe('special cases', () => {
      describe("'.' (dot) in the key", () => {
        describe("the '.' (dot) is the key", () => {
          it("should find the value 35 for path '\\.' when the data is { '.': 35 } }", async () => {
            const value = await pathResolverWithSync({ '.': 34 }, '\\.');
            expect(value).toEqual(34);
          });

          it("should find the value 34 for path '\\..here' when the data is { '.': { here: 34, '.': 35 } }", async () => {
            const value = await pathResolverWithSync({ '.': { here: 34, '.': 35 } }, '\\..here');
            expect(value).toEqual(34);
          });

          it("should find the value 35 for path '\\..\\.' when the data is { '.': { here: 34, '.': 35 } }", async () => {
            const value = await pathResolverWithSync({ '.': { here: 34, '.': 35 } }, '\\..\\.');
            expect(value).toEqual(35);
          });
        });

        it("should find the value { here: 38 } for path 's\\.o\\.m\\.e' when the data is { 's.o.m.e': { here: 38 } }", async () => {
          const value = await pathResolverWithSync({ 's.o.m.e': { here: 38 } }, 's\\.o\\.m\\.e');
          expect(value).toEqual({ here: 38 });
        });

        it("should find the value 38 for path 's\\.o\\.m\\.e.here' when the data is { 's.o.m.e': { here: 38 } }", async () => {
          const value = await pathResolverWithSync({ 's.o.m.e': { here: 38 } }, 's\\.o\\.m\\.e.here');
          expect(value).toEqual(38);
        });
      });

      describe("'*' in array as key", () => {
        it("should get the array and the '*' path 'obj' when the data is array with * as key", async () => {
          const arr = [1, 2, 3];
          (arr as any)['*'] = 34;

          const value = await pathResolverWithSync({ obj: arr }, 'obj');

          expect(value[0]).toEqual(1);
          expect(value[1]).toEqual(2);
          expect(value[2]).toEqual(3);
          expect(value['*']).toEqual(34);
        });

        it("should get the value 34 for path 'obj.\\*' when the data is array with * as key", async () => {
          const arr = [1, 2, 3];
          (arr as any)['*'] = 34;
          const value = await pathResolverWithSync({ obj: arr }, 'obj.\\*');
          expect(value).toEqual(34);
        });

        it('should get value when * is escaped', async () => {
          const value = await pathResolverWithSync({ 'on*e': 34 }, 'on\\*e');
          expect(value).toEqual(34);
        });

        it("should get the array values for path 'obj.*' when the data is array with * as key", async () => {
          const arr = [1, 2, 3];
          (arr as any)['*'] = 34;

          const value = await pathResolverWithSync({ obj: arr }, 'obj.*');

          expect(value).toEqual([1, 2, 3]);
          expect(value).not.toHaveProperty('*');
        });
      });

      it('should ignore the last \\ (backslash) if it doesnt escape anything', async () => {
        const value = await pathResolverWithSync({ one: 34 }, 'one.\\');
        expect(value).toEqual(34);
      });

      it('should ignore the backslash for escaping non-special character', async () => {
        const value = await pathResolverWithSync({ one: 34 }, 'on\\e');
        expect(value).toEqual(34);
      });

      describe('log warning', () => {
        beforeEach(() => {
          cleanCache__testOnly();
        });

        it("should log warning when there is no '.' (dot) AFTER *", async () => {
          const warningSpy = vi.spyOn(console, 'warn');

          await pathResolverWithSync({ one: 34 }, 'on*e');

          expect(warningSpy).lastCalledWith(
            "Path Resolver - must either put '.' (dot) AFTER '*' or escape that with '\\' (backslash)",
            {
              path: 'on*e',
            },
          );
        });

        it("should log warning when there is no '.' (dot) BEFORE *", async () => {
          const warningSpy = vi.spyOn(console, 'warn');

          await pathResolverWithSync({ 'on*': { two: 3 } }, 'on*.two');

          expect(warningSpy).lastCalledWith(
            "Path Resolver - must either put '.' (dot) BEFORE '*' or escape that with '\\' (backslash)",
            {
              path: 'on*.two',
            },
          );
        });
      });
    });
  });

  describe('async only', () => {
    describe('top level', () => {
      it("should find the value 'good' for path 'something' when the data is { something: <async-function that returns 'good'>}", async () => {
        const value = await pathResolver({ something: () => Promise.resolve('good') }, 'something');
        expect(value).toEqual('good');
      });
    });

    describe('level 2', () => {
      it("should find the value 'good' for path 'something.really' when the data is { something: <async function that returns { really: 'good' }> }", async () => {
        const value = await pathResolver({ something: () => Promise.resolve({ really: 'good' }) }, 'something.really');
        expect(value).toEqual('good');
      });
    });

    describe('array elements', () => {
      it("should find the value at the 2nd index for path 'one.1' when the data is { one: [<async-function>, <async-function>] }", async () => {
        const value = await pathResolver(
          { one: [() => Promise.resolve('hello'), () => Promise.resolve('world')] },
          'one.1',
        );
        expect(value).toEqual('world');
      });

      it("should find the array for path 'one.*.id' when the data is { one: <async-function> that returns [{ id: '1st', data: 'hello' }, { id: '2nd', data: 'world' }] }", async () => {
        const value = await pathResolver(
          {
            one: () =>
              Promise.resolve([
                { id: '1st', data: 'hello' },
                { id: '2nd', data: 'world' },
              ]),
          },
          'one.*.id',
        );
        expect(value).toEqual(['1st', '2nd']);
      });
    });

    describe('iterators', () => {
      function* createIterator(array: any[]): Iterator<any, void, unknown> {
        let nextIndex = 0;
        while (nextIndex < array.length) {
          yield array[nextIndex++];
        }
      }

      it("should get an array for path 'one.*.id' when the data is { one: <async-function> that returns <object-iterable> }", async () => {
        const value = await pathResolver(
          {
            one: () =>
              Promise.resolve(
                createIterator([
                  { id: '1st', data: 'hello' },
                  { id: '2nd', data: 'world' },
                ]),
              ),
          },
          'one.*.id',
        );
        expect(value).toEqual(['1st', '2nd']);
      });
    });
  });
});
