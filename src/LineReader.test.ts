import fs from 'fs';
import tmp from 'tmp';
import LineReader from './LineReader.js';

const range = (min: number, max: number) => {
  return Array.from({ length: max - min + 1 }, (v, k) => k + min);
};
const random = (min: number, max: number) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
const lineSeparator = '\r\n';
const minLineLength = 4;
const maxLineLength = 1024;
const bufferSizes = [64, 4096, 65536];

describe('Reads 1000 lines without blank lines', () => {
  const file = tmp.fileSync();
  const total = 1000;
  const content = Array(total)
    .fill(null)
    .map(() => '_'.repeat(random(minLineLength, maxLineLength)))
    .join(lineSeparator);

  beforeAll(() => {
    fs.writeFileSync(file.name, content);
  });

  afterAll(() => {
    file.removeCallback();
  });

  it('should return correct line total while read without line reading limit', async () => {
    for (const bufferSize of bufferSizes) {
      const reader = new LineReader({
        filePath: file.name,
        bufferSize,
      });
      const receiveds = [];
      while (!reader.isClosed) {
        const received = await reader.readLinesWithNumbers();
        receiveds.push(...received);
      }
      expect(receiveds.length).toBe(total);
      expect(receiveds.map(([line]) => line).join(lineSeparator)).toBe(content);
      expect(receiveds.map(([, number]) => number)).toEqual(range(1, total));
    }
  });

  it('should return correct line total while read without line reading limit + skip blank lines', async () => {
    for (const bufferSize of bufferSizes) {
      const reader = new LineReader({
        filePath: file.name,
        bufferSize,
        skipBlank: true,
      });
      const receiveds = [];
      while (!reader.isClosed) {
        const received = await reader.readLinesWithNumbers();
        receiveds.push(...received);
      }
      expect(receiveds.length).toBe(total);
      expect(receiveds.map(([line]) => line).join(lineSeparator)).toBe(content);
      expect(receiveds.map(([, number]) => number)).toEqual(range(1, total));
    }
  });

  it('should return correct line total while read without line reading limit + skip random 50 lines', async () => {
    const skipTotal = 50;
    const skipNumbers: number[] = [];

    while (skipNumbers.length < skipTotal) {
      const number = random(0, total);
      if (!skipNumbers.includes(number)) {
        skipNumbers.push(number);
      }
    }

    for (const bufferSize of bufferSizes) {
      const reader = new LineReader({
        filePath: file.name,
        bufferSize,
        skipNumbers,
      });
      const receiveds = [];
      while (!reader.isClosed) {
        const received = await reader.readLinesWithNumbers();
        receiveds.push(...received);
      }
      expect(receiveds.length).toBe(total - skipNumbers.length);
      expect(receiveds.map(([, number]) => number)).toEqual(
        range(1, total).filter(number => !skipNumbers.includes(number))
      );
    }
  });

  it('should return correct line total while read without line reading limit + skip 1000 lines with range', async () => {
    const skipNumbers: ([number, number] | number)[] = [
      [1, total / 2 - 1],
      total / 2,
      [total / 2 + 1, total],
    ];

    for (const bufferSize of bufferSizes) {
      const reader = new LineReader({
        filePath: file.name,
        bufferSize,
        skipNumbers,
      });
      const receiveds = [];
      while (!reader.isClosed) {
        const received = await reader.readLinesWithNumbers();
        receiveds.push(...received);
      }
      expect(receiveds.length).toBe(0);
      expect(receiveds.map(([line]) => line).join(lineSeparator)).toBe('');
      expect(receiveds.map(([, number]) => number)).toEqual([]);
    }
  });

  it('should return correct line total while read without line reading limit + skip blank lines + skip random 50 lines', async () => {
    const skipTotal = 50;
    const skipNumbers: number[] = [];

    while (skipNumbers.length < skipTotal) {
      const number = random(0, total);
      if (!skipNumbers.includes(number)) {
        skipNumbers.push(number);
      }
    }

    for (const bufferSize of bufferSizes) {
      const reader = new LineReader({
        filePath: file.name,
        bufferSize,
        skipBlank: true,
        skipNumbers,
      });
      const receiveds = [];
      while (!reader.isClosed) {
        const received = await reader.readLinesWithNumbers();
        receiveds.push(...received);
      }
      expect(receiveds.length).toBe(total - skipNumbers.length);
      expect(receiveds.map(([, number]) => number)).toEqual(
        range(1, total).filter(number => !skipNumbers.includes(number))
      );
    }
  });

  it('should return correct line total while read without line reading limit + skip blank lines + skip 1000 lines with range', async () => {
    const skipNumbers: ([number, number] | number)[] = [
      [1, total / 2 - 1],
      total / 2,
      [total / 2 + 1, total],
    ];

    for (const bufferSize of bufferSizes) {
      const reader = new LineReader({
        filePath: file.name,
        bufferSize,
        skipBlank: true,
        skipNumbers,
      });
      const receiveds = [];
      while (!reader.isClosed) {
        const received = await reader.readLinesWithNumbers();
        receiveds.push(...received);
      }
      expect(receiveds.length).toBe(0);
      expect(receiveds.map(([line]) => line).join(lineSeparator)).toBe('');
      expect(receiveds.map(([, number]) => number)).toEqual([]);
    }
  });

  it('should return line text only while read without line reading limit', async () => {
    for (const bufferSize of bufferSizes) {
      const reader = new LineReader({
        filePath: file.name,
        bufferSize,
      });
      const receiveds = [];
      while (!reader.isClosed) {
        const received = await reader.readLines();
        receiveds.push(...received);
      }
      expect(receiveds.join(lineSeparator)).toBe(content);
    }
  });

  it('should return correct line total while read with one-line reading limit', async () => {
    for (const bufferSize of bufferSizes) {
      const reader = new LineReader({
        filePath: file.name,
        bufferSize,
      });
      const receiveds = [];
      while (!reader.isClosed) {
        const received = await reader.readLineWithNumber();
        if (received) receiveds.push(received);
      }
      expect(receiveds.length).toBe(total);
      expect(receiveds.map(([line]) => line).join(lineSeparator)).toBe(content);
      expect(receiveds.map(([, number]) => number)).toEqual(range(1, total));
    }
  });

  it('should return correct line total while read with one-line reading limit + skip blank lines', async () => {
    for (const bufferSize of bufferSizes) {
      const reader = new LineReader({
        filePath: file.name,
        bufferSize,
        skipBlank: true,
      });
      const receiveds = [];
      while (!reader.isClosed) {
        const received = await reader.readLineWithNumber();
        if (received) receiveds.push(received);
      }
      expect(receiveds.length).toBe(total);
      expect(receiveds.map(([line]) => line).join(lineSeparator)).toBe(content);
      expect(receiveds.map(([, number]) => number)).toEqual(range(1, total));
    }
  });

  it('should return correct line total while read with one-line reading limit + skip random 50 lines', async () => {
    const skipTotal = 50;
    const skipNumbers: number[] = [];

    while (skipNumbers.length < skipTotal) {
      const number = random(0, total);
      if (!skipNumbers.includes(number)) {
        skipNumbers.push(number);
      }
    }

    for (const bufferSize of bufferSizes) {
      const reader = new LineReader({
        filePath: file.name,
        bufferSize,
        skipNumbers,
      });
      const receiveds = [];
      while (!reader.isClosed) {
        const received = await reader.readLineWithNumber();
        if (received) receiveds.push(received);
      }
      expect(receiveds.length).toBe(total - skipNumbers.length);
      expect(receiveds.map(([, number]) => number)).toEqual(
        range(1, total).filter(number => !skipNumbers.includes(number))
      );
    }
  });

  it('should return correct line total while read with one-line reading limit + skip blank lines + skip random 50 lines', async () => {
    const skipTotal = 50;
    const skipNumbers: number[] = [];

    while (skipNumbers.length < skipTotal) {
      const number = random(0, total);
      if (!skipNumbers.includes(number)) {
        skipNumbers.push(number);
      }
    }

    for (const bufferSize of bufferSizes) {
      const reader = new LineReader({
        filePath: file.name,
        bufferSize,
        skipBlank: true,
        skipNumbers,
      });
      const receiveds = [];
      while (!reader.isClosed) {
        const received = await reader.readLineWithNumber();
        if (received) receiveds.push(received);
      }
      expect(receiveds.length).toBe(total - skipNumbers.length);
      expect(receiveds.map(([, number]) => number)).toEqual(
        range(1, total).filter(number => !skipNumbers.includes(number))
      );
    }
  });

  it('should return correct line total while read with one-line reading limit + skip 1000 lines with range', async () => {
    const skipNumbers: ([number, number] | number)[] = [
      [1, total / 2 - 1],
      total / 2,
      [total / 2 + 1, total],
    ];

    for (const bufferSize of bufferSizes) {
      const reader = new LineReader({
        filePath: file.name,
        bufferSize,
        skipNumbers,
      });
      const receiveds = [];
      while (!reader.isClosed) {
        const received = await reader.readLineWithNumber();
        if (received) receiveds.push(received);
      }
      expect(receiveds.length).toBe(0);
      expect(receiveds.map(([line]) => line).join(lineSeparator)).toBe('');
      expect(receiveds.map(([, number]) => number)).toEqual([]);
    }
  });

  it('should return correct line total while read with one-line reading limit + skip blank lines + skip 1000 lines with range', async () => {
    const skipNumbers: ([number, number] | number)[] = [
      [1, total / 2 - 1],
      total / 2,
      [total / 2 + 1, total],
    ];

    for (const bufferSize of bufferSizes) {
      const reader = new LineReader({
        filePath: file.name,
        bufferSize,
        skipBlank: true,
        skipNumbers,
      });
      const receiveds = [];
      while (!reader.isClosed) {
        const received = await reader.readLineWithNumber();
        if (received) receiveds.push(received);
      }
      expect(receiveds.length).toBe(0);
      expect(receiveds.map(([line]) => line).join(lineSeparator)).toBe('');
      expect(receiveds.map(([, number]) => number)).toEqual([]);
    }
  });

  it('should return line text only while read with one-line reading limit', async () => {
    for (const bufferSize of bufferSizes) {
      const reader = new LineReader({
        filePath: file.name,
        bufferSize,
      });
      const receiveds = [];
      while (!reader.isClosed) {
        const received = await reader.readLine();
        if (received) receiveds.push(received);
      }
      expect(receiveds.join(lineSeparator)).toBe(content);
    }
  });
});

describe('Reads 1000 lines with random 500 blank lines', () => {
  const separator = '\r\n';
  const file = tmp.fileSync();
  const total = 1000;
  const lines = Array(total)
    .fill(null)
    .map(() => '_'.repeat(random(minLineLength, maxLineLength)));
  const blank = 500;

  for (let i = 0; i < blank; i++) {
    lines.splice(random(0, lines.length), 0, '');
  }

  const content = lines.join(separator);

  beforeAll(() => {
    fs.writeFileSync(file.name, content);
  });

  afterAll(() => {
    file.removeCallback();
  });

  it('should return correct line total while read without line reading limit', async () => {
    for (const bufferSize of bufferSizes) {
      const reader = new LineReader({
        filePath: file.name,
        bufferSize,
      });
      const receiveds = [];
      while (!reader.isClosed) {
        const received = await reader.readLinesWithNumbers();
        receiveds.push(...received);
      }
      expect(receiveds.length).toBe(total + blank);
      expect(receiveds.map(([line]) => line).join(lineSeparator)).toBe(content);
      expect(receiveds.map(([, number]) => number)).toEqual(range(1, total + blank));
    }
  });

  it('should return correct line total while read without line reading limit + skip blank lines', async () => {
    for (const bufferSize of bufferSizes) {
      const reader = new LineReader({
        filePath: file.name,
        bufferSize,
        skipBlank: true,
      });
      const receiveds = [];
      while (!reader.isClosed) {
        const received = await reader.readLinesWithNumbers();
        receiveds.push(...received);
      }
      expect(receiveds.length).toBe(total);
      expect(receiveds.map(([line]) => line).join(lineSeparator)).toBe(
        lines.filter(Boolean).join(lineSeparator)
      );
      expect(receiveds.map(([, number]) => number)).toEqual(
        lines.map((line, i) => (line ? i + 1 : 0)).filter(Boolean)
      );
    }
  });

  it('should return correct line total while read without line reading limit + skip random 50 lines', async () => {
    const skipTotal = 50;
    const skipNumbers: number[] = [];

    while (skipNumbers.length < skipTotal) {
      const number = random(0, total + blank);
      if (!skipNumbers.includes(number)) {
        skipNumbers.push(number);
      }
    }

    for (const bufferSize of bufferSizes) {
      const reader = new LineReader({
        filePath: file.name,
        bufferSize,
        skipNumbers,
      });
      const receiveds = [];
      while (!reader.isClosed) {
        const received = await reader.readLinesWithNumbers();
        receiveds.push(...received);
      }
      expect(receiveds.length).toBe(total + blank - skipTotal);
      expect(receiveds.map(([line]) => line).join(lineSeparator)).toBe(
        lines.filter((_, i) => !skipNumbers.includes(i + 1)).join(lineSeparator)
      );
      expect(receiveds.map(([, number]) => number)).toEqual(
        range(1, total + blank).filter(number => !skipNumbers.includes(number))
      );
    }
  });

  it('should return correct line total while read without line reading limit + skip blank lines + skip random 50 lines', async () => {
    const skipTotal = 50;
    const skipNumbers: number[] = [];

    while (skipNumbers.length < skipTotal) {
      const number = random(0, total + blank);
      if (!skipNumbers.includes(number) && lines[number - 1]) {
        skipNumbers.push(number);
      }
    }

    for (const bufferSize of bufferSizes) {
      const reader = new LineReader({
        filePath: file.name,
        bufferSize,
        skipBlank: true,
        skipNumbers,
      });
      const receiveds = [];
      while (!reader.isClosed) {
        const received = await reader.readLinesWithNumbers();
        receiveds.push(...received);
      }
      expect(receiveds.length).toBe(total - skipTotal);
      expect(receiveds.map(([line]) => line).join(lineSeparator)).toBe(
        lines.filter((e, i) => Boolean(e) && !skipNumbers.includes(i + 1)).join(lineSeparator)
      );
      expect(receiveds.map(([, number]) => number)).toEqual(
        lines
          .map((line, i) => (line ? i + 1 : 0))
          .filter(e => Boolean(e) && !skipNumbers.includes(e))
      );
    }
  });

  it('should return correct line total while read without line reading limit + skip 1000 lines with range', async () => {
    const skipNumbers: ([number, number] | number)[] = [
      [1, total / 2 - 1],
      total / 2,
      [total / 2 + 1, total],
    ];

    for (const bufferSize of bufferSizes) {
      const reader = new LineReader({
        filePath: file.name,
        bufferSize,
        skipNumbers,
      });
      const receiveds = [];
      while (!reader.isClosed) {
        const received = await reader.readLinesWithNumbers();
        receiveds.push(...received);
      }
      expect(receiveds.length).toBe(blank);
      expect(receiveds.map(([line]) => line).join(lineSeparator)).toBe(
        lines.slice(total).join(lineSeparator)
      );
      expect(receiveds.map(([, number]) => number)).toEqual(range(total + 1, total + blank));
    }
  });

  it('should return correct line total while read without line reading limit + skip blank lines + skip 1000 lines with range', async () => {
    const skipNumbers: ([number, number] | number)[] = [
      [1, total / 2 - 1],
      total / 2,
      [total / 2 + 1, total],
    ];

    for (const bufferSize of bufferSizes) {
      const reader = new LineReader({
        filePath: file.name,
        bufferSize,
        skipBlank: true,
        skipNumbers,
      });
      const receiveds = [];
      while (!reader.isClosed) {
        const received = await reader.readLinesWithNumbers();
        receiveds.push(...received);
      }
      expect(receiveds.length).toBe(lines.slice(total).filter(Boolean).length);
      expect(receiveds.map(([line]) => line).join(lineSeparator)).toBe(
        lines.slice(total).filter(Boolean).join(lineSeparator)
      );
      expect(receiveds.map(([, number]) => number)).toEqual(
        lines
          .slice(total)
          .map((e, i) => (e ? total + i + 1 : 0))
          .filter(Boolean)
      );
    }
  });

  it('should return line text only while read without line reading limit', async () => {
    for (const bufferSize of bufferSizes) {
      const reader = new LineReader({
        filePath: file.name,
        bufferSize,
      });
      const receiveds = [];
      while (!reader.isClosed) {
        const received = await reader.readLines();
        receiveds.push(...received);
      }
      expect(receiveds.join(lineSeparator)).toBe(content);
    }
  });

  it('should return correct line total while read with one-line reading limit', async () => {
    for (const bufferSize of bufferSizes) {
      const reader = new LineReader({
        filePath: file.name,
        bufferSize,
      });
      const receiveds = [];
      while (!reader.isClosed) {
        const received = await reader.readLineWithNumber();
        if (received) receiveds.push(received);
      }
      expect(receiveds.length).toBe(total + blank);
      expect(receiveds.map(([line]) => line).join(lineSeparator)).toBe(content);
      expect(receiveds.map(([, number]) => number)).toEqual(range(1, total + blank));
    }
  });

  it('should return correct line total while read with one-line reading limit + skip blank lines', async () => {
    for (const bufferSize of bufferSizes) {
      const reader = new LineReader({
        filePath: file.name,
        bufferSize,
        skipBlank: true,
      });
      const receiveds = [];
      while (!reader.isClosed) {
        const received = await reader.readLineWithNumber();
        if (received) receiveds.push(received);
      }
      expect(receiveds.length).toBe(total);
      expect(receiveds.map(([line]) => line).join(lineSeparator)).toBe(
        lines.filter(Boolean).join(lineSeparator)
      );
      expect(receiveds.map(([, number]) => number)).toEqual(
        lines.map((line, i) => (line ? i + 1 : 0)).filter(Boolean)
      );
    }
  });

  it('should return correct line total while read with one-line reading limit + skip random 50 lines', async () => {
    const skipTotal = 50;
    const skipNumbers: number[] = [];

    while (skipNumbers.length < skipTotal) {
      const number = random(0, total + blank);
      if (!skipNumbers.includes(number)) {
        skipNumbers.push(number);
      }
    }

    for (const bufferSize of bufferSizes) {
      const reader = new LineReader({
        filePath: file.name,
        bufferSize,
        skipNumbers,
      });
      const receiveds = [];
      while (!reader.isClosed) {
        const received = await reader.readLineWithNumber();
        if (received) receiveds.push(received);
      }
      expect(receiveds.length).toBe(total + blank - skipTotal);
      expect(receiveds.map(([line]) => line).join(lineSeparator)).toBe(
        lines.filter((_, i) => !skipNumbers.includes(i + 1)).join(lineSeparator)
      );
      expect(receiveds.map(([, number]) => number)).toEqual(
        range(1, total + blank).filter(number => !skipNumbers.includes(number))
      );
    }
  });

  it('should return correct line total while read with one-line reading limit + skip blank lines + skip random 50 lines', async () => {
    const skipTotal = 50;
    const skipNumbers: number[] = [];

    while (skipNumbers.length < skipTotal) {
      const number = random(0, total + blank);
      if (!skipNumbers.includes(number) && lines[number - 1]) {
        skipNumbers.push(number);
      }
    }

    for (const bufferSize of bufferSizes) {
      const reader = new LineReader({
        filePath: file.name,
        bufferSize,
        skipBlank: true,
        skipNumbers,
      });
      const receiveds = [];
      while (!reader.isClosed) {
        const received = await reader.readLineWithNumber();
        if (received) receiveds.push(received);
      }
      expect(receiveds.length).toBe(total - skipTotal);
      expect(receiveds.map(([line]) => line).join(lineSeparator)).toBe(
        lines.filter((e, i) => Boolean(e) && !skipNumbers.includes(i + 1)).join(lineSeparator)
      );
      expect(receiveds.map(([, number]) => number)).toEqual(
        lines
          .map((line, i) => (line ? i + 1 : 0))
          .filter(e => Boolean(e) && !skipNumbers.includes(e))
      );
    }
  });

  it('should return correct line total while read with one-line reading limit + skip 1000 lines with range', async () => {
    const skipNumbers: ([number, number] | number)[] = [
      [1, total / 2 - 1],
      total / 2,
      [total / 2 + 1, total],
    ];

    for (const bufferSize of bufferSizes) {
      const reader = new LineReader({
        filePath: file.name,
        bufferSize,
        skipNumbers,
      });
      const receiveds = [];
      while (!reader.isClosed) {
        const received = await reader.readLineWithNumber();
        if (received) receiveds.push(received);
      }
      expect(receiveds.length).toBe(blank);
      expect(receiveds.map(([line]) => line).join(lineSeparator)).toBe(
        lines.slice(total).join(lineSeparator)
      );
      expect(receiveds.map(([, number]) => number)).toEqual(range(total + 1, total + blank));
    }
  });

  it('should return correct line total while read with one-line reading limit + skip blank lines + skip 1000 lines with range', async () => {
    const skipNumbers: ([number, number] | number)[] = [
      [1, total / 2 - 1],
      total / 2,
      [total / 2 + 1, total],
    ];

    for (const bufferSize of bufferSizes) {
      const reader = new LineReader({
        filePath: file.name,
        bufferSize,
        skipBlank: true,
        skipNumbers,
      });
      const receiveds = [];
      while (!reader.isClosed) {
        const received = await reader.readLineWithNumber();
        if (received) receiveds.push(received);
      }
      expect(receiveds.length).toBe(lines.slice(total).filter(Boolean).length);
      expect(receiveds.map(([line]) => line).join(lineSeparator)).toBe(
        lines.slice(total).filter(Boolean).join(lineSeparator)
      );
      expect(receiveds.map(([, number]) => number)).toEqual(
        lines
          .slice(total)
          .map((e, i) => (e ? total + i + 1 : 0))
          .filter(Boolean)
      );
    }
  });

  it('should return line text only while read with one-line reading limit', async () => {
    for (const bufferSize of bufferSizes) {
      const reader = new LineReader({
        filePath: file.name,
        bufferSize,
      });
      const receiveds = [];
      while (!reader.isClosed) {
        const received = await reader.readLine();
        receiveds.push(received);
      }
      expect(receiveds.join(lineSeparator)).toBe(content);
    }
  });
});
