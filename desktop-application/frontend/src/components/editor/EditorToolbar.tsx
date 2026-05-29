import { MinusSquare, PlusSquare } from "lucide-react";
import { useRef } from "react";

interface EditorToolbarProps {
  onAddRow: () => void;
  onDeleteRow: () => void;
  onAddCol: () => void;
  onDeleteCol: () => void;
  onFreeze: (rows: number, cols: number) => void;
}

export function EditorToolbar({
  onAddRow,
  onDeleteRow,
  onAddCol,
  onDeleteCol,
  onFreeze,
}: EditorToolbarProps) {
  const freezeRRef = useRef<HTMLInputElement>(null);
  const freezeCRef = useRef<HTMLInputElement>(null);

  const toolbarBtnClass =
    "flex h-7 w-7 items-center justify-center rounded transition-colors hover:bg-bg-hover active:scale-95";
  const separatorClass = "mx-1 h-4 w-[1px] bg-border-default";

  return (
    <div
      className="flex h-10 items-center gap-1 px-3"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        borderBottom: "1px solid var(--color-border-default)",
      }}
    >
      {/* Freeze Controls */}
      <div className="flex items-center gap-1.5 ml-1">
        <span className="text-[10px] text-tertiary uppercase">Freeze R</span>
        <input
          ref={freezeRRef}
          type="number"
          defaultValue={0}
          min={0}
          max={10}
          className="h-7 w-8 rounded border border-border-default bg-bg-base px-1 text-xs outline-none"
        />
        <span className="text-[10px] text-tertiary uppercase">Freeze C</span>
        <input
          ref={freezeCRef}
          type="number"
          defaultValue={0}
          min={0}
          max={10}
          className="h-7 w-8 rounded border border-border-default bg-bg-base px-1 text-xs outline-none"
        />
        <button
          onClick={() =>
            onFreeze(
              parseInt(freezeRRef.current?.value || "0"),
              parseInt(freezeCRef.current?.value || "0")
            )
          }
          className="text-[11px] font-medium text-accent hover:underline px-1"
        >
          Apply
        </button>
      </div>

      <div className={separatorClass} />

      {/* Structure Controls */}
      <button onClick={onAddRow} className={toolbarBtnClass} title="Add Row Below">
        <PlusSquare className="h-3.5 w-3.5" />
      </button>
      <button onClick={onDeleteRow} className={toolbarBtnClass} title="Delete Selected Rows">
        <MinusSquare className="h-3.5 w-3.5 text-destructive" />
      </button>
      <button onClick={onAddCol} className={toolbarBtnClass} title="Add Column Right">
        <PlusSquare className="h-3.5 w-3.5 rotate-90" />
      </button>
      <button onClick={onDeleteCol} className={toolbarBtnClass} title="Delete Selected Columns">
        <MinusSquare className="h-3.5 w-3.5 text-destructive rotate-90" />
      </button>
    </div>
  );
}
