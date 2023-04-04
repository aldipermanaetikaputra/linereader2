/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Mutex } from 'async-mutex';
import { ChunkReader, ChunkReaderOptions } from 'chunkreader2';
import Denque from 'denque';
import { TypedFastBitSet } from 'typedfastbitset';

export interface LineReaderOptions extends ChunkReaderOptions {
  lineSeparator?: LineSeparator;
  skipBlank?: boolean;
  skipNumbers?: (number | NumberRange)[];
}

class LineReader {
  private options: LineReaderOptions;
  private reader: ChunkReader;
  private mutex: Mutex;
  private buffer: Denque<[string, number]>;
  private cutted?: string;
  private separator?: LineSeparator;
  private count: number;
  private skips: TypedFastBitSet;

  public get filePath() {
    return this.reader.filePath;
  }

  public get bytesLength() {
    return this.reader.bytesLength;
  }

  public get lineSeparator() {
    return this.separator;
  }

  public get linesRead() {
    return this.count;
  }

  public get bytesRead() {
    return this.reader.bytesRead;
  }

  public get isClosed() {
    return this.reader.isClosed && this.cutted === undefined && this.buffer.length === 0;
  }

  public get isOpened() {
    return this.reader.isOpened;
  }

  constructor(options: LineReaderOptions) {
    this.options = options;
    this.separator = this.options.lineSeparator;
    this.reader = new ChunkReader(options);
    this.buffer = new Denque();
    this.mutex = new Mutex();
    this.count = 0;
    this.skips = new TypedFastBitSet();

    if (this.options.skipNumbers) {
      for (const skipNumber of this.options.skipNumbers) {
        if (Array.isArray(skipNumber)) {
          this.skips.addRange(skipNumber[0], skipNumber[1] + 1);
        } else {
          this.skips.add(skipNumber);
        }
      }
    }
  }

  private async setSeparator() {
    let separator: LineSeparator | undefined;

    while (!this.reader.isClosed) {
      const chunk = await this.reader.read();

      if (chunk.lastIndexOf('\r\n') !== -1) {
        separator = '\r\n';
        break;
      }

      const middleChunk = chunk.slice(1, chunk.length - 1);

      if (middleChunk.lastIndexOf('\n') !== -1) {
        separator = '\n';
        break;
      }

      if (middleChunk.lastIndexOf('\r') !== -1) {
        separator = '\r';
        break;
      }
    }

    this.reader.reset();
    this.separator = separator || '\r\n';
  }

  private async nextChunk() {
    if (!this.separator) await this.setSeparator();

    let chunks = '';
    let cutAt = 0;
    let cutted = false;

    while (!this.reader.isClosed) {
      const chunk = await this.reader.read();
      const foundAt = chunk.lastIndexOf(this.separator!);

      chunks += chunk;

      if (foundAt !== -1) {
        cutAt = chunks.length - chunk.length + foundAt;
        cutted = true;
        break;
      }
    }

    let data = (this.cutted || '') + (cutted ? chunks.slice(0, cutAt) : chunks);

    if (this.reader.isClosed) {
      if (cutted) data += chunks.slice(cutAt);
      this.cutted = undefined;
    } else {
      this.cutted = cutted ? chunks.slice(cutAt + this.separator!.length) : undefined;
    }

    return data;
  }

  public async readLinesWithNumbers(limit?: number) {
    return await this.mutex.runExclusive(async () => {
      if (!this.reader.isOpened) this.reader.open();
      if (!this.reader.bytesLength) return [];

      if (!limit || limit > this.buffer.length) {
        const output = (await this.nextChunk()) || '';

        if (output || !this.isClosed) {
          const texts = output.split(this.separator!);

          for (const text of texts) {
            const number = ++this.count;

            if (this.options.skipNumbers && this.skips.has(number)) continue;
            if (this.options.skipBlank && !text.trim().length) continue;

            this.buffer.push([text, number]);
          }
        }
      }

      const lines = this.buffer.remove(0, limit || this.buffer.length) || [];
      return lines;
    });
  }

  public async readLines(limit?: number) {
    const lines = await this.readLinesWithNumbers(limit);
    return lines.map(([text]) => text);
  }

  public async readLineWithNumber() {
    let line: [string, number] | undefined = undefined;
    while (!line && !this.isClosed) [line] = await this.readLinesWithNumbers(1);
    return line;
  }

  public async readLine() {
    const line = await this.readLineWithNumber();
    return line !== undefined ? line[0] : undefined;
  }

  public resetReader() {
    this.reader.reset();
    this.buffer.clear();
    delete this.cutted;
    delete this.separator;
    this.count = 0;
  }

  public openReader() {
    this.reader.open();
  }

  public closeReader() {
    this.reader.close();
  }
}

type NumberRange = [number, number];
type LineSeparator = '\r\n' | '\r' | '\n';

export default LineReader;
