import type { AutocompleteFile } from "@/types/DataSource";

export function extractReferencedFiles(content: string, files: AutocompleteFile[]): string[] {
  if (!content || files.length === 0) return [];

  const refs: string[] = [];
  const seen = new Set<string>();

  for (const file of files) {
    let matchedSheet = false;
    for (const sheet of file.sheets) {
      const token1 = `#${file.filename}::${sheet}`;
      const token2 = `#${file.filename}:${sheet}`;
      if (content.includes(token1) || content.includes(token2)) {
        const ref = `${file.filename}::${sheet}`;
        if (!seen.has(ref)) {
          refs.push(ref);
          seen.add(ref);
        }
        matchedSheet = true;
      }
    }

    if (!matchedSheet && content.includes(`#${file.filename}`)) {
      const ref = file.filename;
      if (!seen.has(ref)) {
        refs.push(ref);
        seen.add(ref);
      }
    }
  }

  return refs;
}
