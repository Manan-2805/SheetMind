import { useCallback, useEffect, useState } from "react";
import { listForAutocomplete } from "@/api/dataSourcesApi";
import type { AutocompleteFile } from "@/types/DataSource";

let cachedFiles: AutocompleteFile[] | null = null;
let isFetching = false;

interface UseFileAutocompleteReturn {
  showAutocomplete: boolean;
  autocompleteQuery: string;
  triggerIndex: number;
  files: AutocompleteFile[];
  dismiss: () => void;
  detectTrigger: (text: string, cursorPos: number) => void;
  refresh: () => void;
}

export function useFileAutocomplete(): UseFileAutocompleteReturn {
  const [files, setFiles] = useState<AutocompleteFile[]>(cachedFiles || []);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteQuery, setAutocompleteQuery] = useState("");
  const [triggerIndex, setTriggerIndex] = useState(0);

  const fetchFiles = useCallback(async () => {
    if (isFetching) return;
    isFetching = true;
    try {
      const res = await listForAutocomplete();
      cachedFiles = res.files;
      setFiles(res.files);
    } catch (err) {
      console.error("Failed to fetch autocomplete files", err);
    } finally {
      isFetching = false;
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const detectTrigger = useCallback(
    (text: string, cursorPos: number) => {
      const beforeCursor = text.slice(0, cursorPos);
      const lastHash = beforeCursor.lastIndexOf("#");
      if (lastHash === -1) {
        setShowAutocomplete(false);
        return;
      }
      const afterHash = beforeCursor.slice(lastHash + 1);
      if (/\s/.test(afterHash)) {
        setShowAutocomplete(false);
        return;
      }
      setTriggerIndex(lastHash);
      setAutocompleteQuery(afterHash);
      setShowAutocomplete(true);
    },
    []
  );

  const dismiss = useCallback(() => setShowAutocomplete(false), []);

  return {
    showAutocomplete,
    autocompleteQuery,
    triggerIndex,
    files,
    dismiss,
    detectTrigger,
    refresh: fetchFiles,
  };
}
