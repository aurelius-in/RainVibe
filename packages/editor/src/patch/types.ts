export interface ProposedEdit {
  filePath: string;
  diff: string;
}

export interface ApplyOptions {
  withNotes?: boolean;
}

