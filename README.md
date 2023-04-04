# line-reader2

Asynchronous, buffered, line-by-line file reader with customizable buffer size and separator.

## Install

NPM

```sh
npm install line-reader2
```

yarn

```sh
yarn add line-reader2
```

## Usage

#### Import

ES6

```js
import { LineReader } from 'line-reader2';
```

CommonJS

```js
const { LineReader } = require('line-reader2');
```

#### Example

```js
const reader = new LineReader({
  filePath: './file.txt',
  bufferSize: 1024,
  lineSeparator: '\n',
  skipBlank: true,
});

while (!reader.isClosed) {
  const chunk = await reader.read();
  console.log(chunk);
}
```

## API

#### `new LineReader(options: LineReaderOptions): LineReader`

The options you can pass are:

| Name                   | Type                                                                                                          | Default  | Description                                                                                                                                                                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| filePath               | `string`                                                                                                      | none     | The path or location of your file _(required)_                                                                                                                                                                                                           |
| bufferSize             | `number`                                                                                                      | `1024`   | Chunk/buffer size in bytes                                                                                                                                                                                                                               |
| bufferEncoding         | `'ascii' \| 'utf8' \| 'utf-8' \| 'utf16le' \| 'ucs2' \| 'ucs-2' \| 'base64' \| 'latin1' \| 'binary' \| 'hex'` | `'utf8'` | Character encoding to use on `read()` operation                                                                                                                                                                                                          |
| removeInvisibleUnicode | `boolean`                                                                                                     | `false`  | Remove all (or perhaps just "common") non-printable Unicode characters except line breaks. Using regex: `/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g`                                                                                                      |
| lineSeparator          | `'\r\n' \| '\n' \| '\r`                                                                                       | none     | Separator to separate between lines. Will be automatically determined between `'\r\n'`, `'\n'`, or `'\r` on the first `read` operation.                                                                                                                  |
| skipBlank              | `boolean`                                                                                                     | `false`  | Used to skip blank lines (including whitespace lines).                                                                                                                                                                                                   |
| skipNumbers            | `Array<number \| [number, number]>`                                                                           | `[]`     | Used to skip lines with the specified line number. It can be a specific number or a range (`[start, end]` exclusively). Example: `[1,2,3,4,5,[6,10]]` will skip line numbers 1 to 10 (10 lines total). Line numbers start from 1 to the number of lines. |

### Instance Methods

#### `readLines(limit?: number): Promise<string[]>`

Asynchronously read next lines of current file stream with the maximum number of lines specified in `limit` (default: unlimited depending on successfully read lines with `bufferSize` specified).

Example:

```js
console.log('read lines with buffer size = 10');

const reader = new LineReader({
  filePath: './file.txt',
  bufferSize: 10,
});

while (!reader.isClosed) {
  const lines = await reader.readLines();
  console.log(lines);
}

console.log('read lines with lines limit = 1');

const reader2 = new LineReader({
  filePath: './file.txt',
});

while (!reader2.isClosed) {
  const lines = await reader2.readLines(1);
  console.log(lines);
}

console.log('read lines with skip numbers = [1, 3, 5]');

const reader3 = new LineReader({
  filePath: './file.txt',
  skipNumbers: [1, 3, 5],
});

while (!reader3.isClosed) {
  const lines = await reader3.readLines();
  console.log(lines);
}

console.log('read lines with skip blank = true');

const reader4 = new LineReader({
  filePath: './file.txt',
  skipBlank: true,
});

while (!reader4.isClosed) {
  const lines = await reader4.readLines();
  console.log(lines);
}
```

`./file.txt`

```txt
1111
2222
3333
4444
5555

7777
```

Output:

```
read lines with buffer size = 10
['1111', '2222']
['3333', '4444']
['5555', '', '7777']
read lines with lines limit = 1
['1111']
['2222']
['3333']
['4444']
['5555']
['']
['7777']
read lines with skip numbers = [1, 3, 5]
['2222', '4444', '', '7777]
read lines with skip blank = true
['1111', '2222', '3333', '4444', '5555', '7777']
```

Example with custom-separator:

```js
const reader = new LineReader({
  filePath: './custom-separator.txt',
  lineSeparator: ',',
});

while (!reader.isClosed) {
  const lines = await reader.readLines();
  console.log(lines);
}
```

`./custom-separator.txt`

```txt
1111,2222,3333,4444,5555,,7777
```

Output:

```
['1111', '2222', '3333', '4444', '5555', '', '7777']
```

**NOTE:** All read methods can be called concurrently with safe because it used [async-mutex](https://github.com/DirtyHairy/async-mutex) module to handle Mutual Exclusion.

#### `readLine(): Promise<string>`

Asynchronously read next single line of current file stream.

Example:

```js
const reader = new LineReader({
  filePath: './file.txt',
  skipBlank: true,
});

while (!reader.isClosed) {
  const line = await reader.readLine();
  console.log(line);
}
```

`./file.txt`

```txt
1111
2222
3333

5555
```

Output:

```
1111
2222
3333
5555
```

#### `readLinesWithNumbers(limit?: number): Promise<[string, number][]>`

Asynchronously read next lines of current file stream and include the line number with the maximum number of lines specified in `limit` (default: unlimited depending on successfully read lines with `bufferSize` specified).

Example:

```js
const reader = new LineReader({
  filePath: './file.txt',
  bufferSize: 1024,
  skipNumbers: [1, [5, 7]],
  skipBlank: true,
});

while (!reader.isClosed) {
  const lines = await reader.readLinesWithNumbers(2);
  console.log(lines);
}
```

`./file.txt`

```txt
1111
2222
3333
4444
5555

7777
8888
9999
```

Output:

```
[['2222', 2], ['3333', 3]]
[['4444', 4], ['8888', 8]]
[['9999', 9]]
```

#### `readLineWithNumber(): Promise<[string, number]>`

Asynchronously read next single line of current file stream and include the line number.

Example:

```js
const reader = new LineReader({
  filePath: './file.txt',
  skipBlank: true,
});

while (!reader.isClosed) {
  const [line, number] = await reader.readLineWithNumber();
  console.log(number, line);
}
```

`./file.txt`

```txt
1111
2222
3333

5555
```

Output:

```
1 1111
2 2222
3 3333
5 5555
```

#### `resetReader(): void`

Reset the reader, so it will repeat the reading from the beginning.

Example:

```js
const reader = new LineReader({
  filePath: './file.txt',
});

for (let i = 0; i < 2; i++) {
  const lines = await reader.readLines(1);
  console.log(lines);
}

console.log('reset');
reader.resetReader();

while (!reader.isClosed) {
  const lines = await reader.readLines();
  console.log(lines);
}
```

`./file.txt`

```txt
1111
2222
3333
4444
```

Output:

```
['1111']
['2222']
reset
['1111', '2222', '3333', '4444']
```

#### `openReader(): void`

Manually open the file descriptor. This method will be called automatically on the first `read` operation. Throws an error when file doesn't exist.

#### `closeReader(): void`

Manually close the file descriptor. This method will be called automatically on the last `read` operation (last file stream).

### Instance Property

The property of `LineReader` instance you can access are:

| Name        | Type      | Description                                                                         |
| ----------- | --------- | ----------------------------------------------------------------------------------- |
| bytesLength | `number`  | Size of the file in bytes. Value assigned on `openReader()` operation               |
| bytesRead   | `number`  | Size of the bytes read in the file by `read` operation                              |
| linesRead   | `number`  | Total lines read by reader                                                          |
| isOpened    | `boolean` | Indicates whether the reader has opened the file or `openReader()` has been called  |
| isClosed    | `boolean` | Indicates whether the reader has closed the file or `closeReader()` has been called |

## Testing

This library is well tested. You can test the code as follows:

NPM

```sh
npm test
```

yarn

```sh
yarn test
```

## Related

- [chunk-reader2](https://github.com/aldipermanaetikaputra/chunk-reader2) - Asynchronous, buffered, chunk-by-chunk file reader with customizable buffer size. **(This library internally uses this package)**

## Contribute

If you have anything to contribute, or functionality that you lack - you are more than welcome to participate in this!

## License

Feel free to use this library under the conditions of the MIT license.
