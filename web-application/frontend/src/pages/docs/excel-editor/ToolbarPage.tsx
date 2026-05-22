import { DocH1, DocH2, DocH3, DocLi, DocP, DocUl } from '@/components/docs/MDXComponents'
import ImagePlaceholder from '@/components/docs/ImagePlaceholder'

export default function ToolbarPage() {
  return (<div>
    <DocH1>Formatting Toolbar</DocH1>
    <DocP>The Excel Editor toolbar provides all standard spreadsheet formatting tools. The toolbar is divided into logical groups for easy access.</DocP>
    <ImagePlaceholder label="Excel Editor Toolbar" />
    <DocH2>Font Group</DocH2>
    <DocUl>
      <DocLi><strong>Bold</strong> (Ctrl+B) — Toggle bold on selected cells</DocLi>
      <DocLi><strong>Italic</strong> (Ctrl+I) — Toggle italic on selected cells</DocLi>
      <DocLi><strong>Underline</strong> (Ctrl+U) — Toggle underline</DocLi>
      <DocLi><strong>Font Color</strong> — Open color picker for text color</DocLi>
      <DocLi><strong>Background Color</strong> — Open color picker for cell fill</DocLi>
    </DocUl>
    <DocH2>Alignment Group</DocH2>
    <DocUl>
      <DocLi>Align Left, Center, Right</DocLi>
      <DocLi>Vertical alignment: Top, Middle, Bottom</DocLi>
      <DocLi>Text wrap toggle</DocLi>
    </DocUl>
    <DocH2>Cell Group</DocH2>
    <DocUl>
      <DocLi><strong>Merge Cells</strong> — Merge selected cell range</DocLi>
      <DocLi><strong>Borders</strong> — Add/remove cell borders</DocLi>
      <DocLi><strong>Number Format</strong> — General, Number, Currency, Percentage, Date</DocLi>
    </DocUl>
    <DocH2>View Group</DocH2>
    <DocUl>
      <DocLi><strong>Freeze Rows</strong> — Freeze the top N rows for scrolling</DocLi>
      <DocLi><strong>Freeze Columns</strong> — Freeze the left N columns</DocLi>
      <DocLi><strong>Sort Ascending/Descending</strong> — Sort by selected column</DocLi>
      <DocLi><strong>Filter</strong> — Toggle column filter dropdowns</DocLi>
    </DocUl>
  </div>)
}
