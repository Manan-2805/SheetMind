import { useRef } from 'react';
import { 
  Bold, Italic, Type, Palette, AlignLeft, AlignCenter, AlignRight, 
  Square, MinusSquare, PlusSquare, Grid
} from 'lucide-react';
import type { CellFormatting } from '@/types/ExcelEditor';

interface EditorToolbarProps {
  onFormatting: (fmt: CellFormatting) => void;
  onAddRow: () => void;
  onDeleteRow: () => void;
  onAddCol: () => void;
  onDeleteCol: () => void;
  onFreeze: (rows: number, cols: number) => void;
}

export function EditorToolbar({ 
  onFormatting, 
  onAddRow, 
  onDeleteRow, 
  onAddCol, 
  onDeleteCol,
  onFreeze
}: EditorToolbarProps) {
  const textColorRef = useRef<HTMLInputElement>(null);
  const bgColorRef = useRef<HTMLInputElement>(null);
  const freezeRRef = useRef<HTMLInputElement>(null);
  const freezeCRef = useRef<HTMLInputElement>(null);

  const toolbarBtnClass = "flex h-7 w-7 items-center justify-center rounded transition-colors hover:bg-bg-hover active:scale-95";
  const separatorClass = "mx-1 h-4 w-[1px] bg-border-default";

  return (
    <div 
      className="flex h-10 items-center gap-1 px-3"
      style={{ backgroundColor: "var(--color-bg-elevated)", borderBottom: "1px solid var(--color-border-default)" }}
    >
      {/* Group 1: Text */}
      <button onClick={() => onFormatting({ bold: true })} className={toolbarBtnClass} title="Bold">
        <Bold className="h-3.5 w-3.5" />
      </button>
      <button onClick={() => onFormatting({ italic: true })} className={toolbarBtnClass} title="Italic">
        <Italic className="h-3.5 w-3.5" />
      </button>
      <div className="flex items-center gap-1.5 ml-1 mr-1">
        <input 
          type="number" 
          defaultValue={11}
          min={8} max={72}
          className="h-7 w-12 rounded border border-border-default bg-bg-base px-1.5 text-xs outline-none focus:border-accent"
          onChange={(e) => onFormatting({ fontSize: parseInt(e.target.value) })}
        />
      </div>

      <div className={separatorClass} />

      {/* Group 2: Color */}
      <div className="relative">
        <button 
          onClick={() => textColorRef.current?.click()} 
          className={toolbarBtnClass} 
          title="Text Color"
        >
          <div className="flex flex-col items-center">
            <Type className="h-3.5 w-3.5" />
            <div className="h-0.5 w-3.5 mt-0.5 bg-primary" />
          </div>
        </button>
        <input 
          ref={textColorRef} 
          type="color" 
          className="invisible absolute" 
          onChange={(e) => onFormatting({ textColor: e.target.value })}
        />
      </div>
      <div className="relative">
        <button 
          onClick={() => bgColorRef.current?.click()} 
          className={toolbarBtnClass} 
          title="Background Color"
        >
          <div className="flex flex-col items-center">
            <Palette className="h-3.5 w-3.5" />
            <div className="h-0.5 w-3.5 mt-0.5 bg-accent" />
          </div>
        </button>
        <input 
          ref={bgColorRef} 
          type="color" 
          className="invisible absolute" 
          onChange={(e) => onFormatting({ bgColor: e.target.value })}
        />
      </div>

      <div className={separatorClass} />

      {/* Group 3: Borders */}
      <button 
        onClick={() => onFormatting({ borderTop: true, borderBottom: true, borderLeft: true, borderRight: true })} 
        className={toolbarBtnClass} 
        title="Border All"
      >
        <Grid className="h-3.5 w-3.5" />
      </button>
      <button 
        onClick={() => onFormatting({ borderTop: false, borderBottom: false, borderLeft: false, borderRight: false })} 
        className={toolbarBtnClass} 
        title="No Borders"
      >
        <Square className="h-3.5 w-3.5 text-tertiary" />
      </button>

      <div className={separatorClass} />

      {/* Group 4: Align */}
      <button onClick={() => onFormatting({ align: 'left' })} className={toolbarBtnClass} title="Align Left">
        <AlignLeft className="h-3.5 w-3.5" />
      </button>
      <button onClick={() => onFormatting({ align: 'center' })} className={toolbarBtnClass} title="Align Center">
        <AlignCenter className="h-3.5 w-3.5" />
      </button>
      <button onClick={() => onFormatting({ align: 'right' })} className={toolbarBtnClass} title="Align Right">
        <AlignRight className="h-3.5 w-3.5" />
      </button>

      <div className={separatorClass} />

      {/* Group 5: Freeze */}
      <div className="flex items-center gap-1.5 ml-1">
        <span className="text-[10px] text-tertiary uppercase">Freeze R</span>
        <input 
          ref={freezeRRef}
          type="number" 
          defaultValue={0} min={0} max={10}
          className="h-7 w-8 rounded border border-border-default bg-bg-base px-1 text-xs outline-none"
        />
        <span className="text-[10px] text-tertiary uppercase">Freeze C</span>
        <input 
          ref={freezeCRef}
          type="number" 
          defaultValue={0} min={0} max={10}
          className="h-7 w-8 rounded border border-border-default bg-bg-base px-1 text-xs outline-none"
        />
        <button 
          onClick={() => onFreeze(parseInt(freezeRRef.current?.value || '0'), parseInt(freezeCRef.current?.value || '0'))}
          className="text-[11px] font-medium text-accent hover:underline px-1"
        >
          Apply
        </button>
      </div>

      <div className={separatorClass} />

      {/* Group 6: Structure */}
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
