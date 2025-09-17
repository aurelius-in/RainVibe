export interface IndexedChunk {
  filePath: string;
  lang: string;
  text: string;
}

export function simpleChunk(filePath: string, text: string): IndexedChunk[] {
  return [{ filePath, lang: 'txt', text }];
}

