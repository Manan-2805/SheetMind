import { useCallback, useEffect, useRef, useState } from "react";

import { listForAutocomplete } from "@/api/dataSourcesApi";
import type { AutocompleteFile } from "@/types/DataSource";

interface UseFileAutocompleteReturn {
  showAutocomplete: boolean;
  autocompleteQuery: string;
  triggerIndex: number;
  files: AutocompleteFile[];
  dismiss: () => void;
  detectTrigger: (text: string, cursorPos: number) => void;
}

export function useFileAutocomplete(): UseFileAutocompleteReturn {
  const [files, setFiles] = useState<AutocompleteFile[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteQuery, setAutocompleteQuery] = useState("");
  const [triggerIndex, setTriggerIndex] = useState(0);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    listForAutocomplete()
      .then((res) => setFiles(res.files))
      .catch(() => {});
  }, []);

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
  };
}
