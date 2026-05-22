import { Callout, DocH1, DocH2, DocLi, DocP, DocUl } from '@/components/docs/MDXComponents'
import ImagePlaceholder from '@/components/docs/ImagePlaceholder'

export default function ExcelEditorOverviewPage() {
  return (<div>
    <DocH1>Excel Editor</DocH1>
    <DocP>The Excel Editor gives you a full spreadsheet experience powered by Handsontable. Open any uploaded file, edit cells, format data, and use AI to make bulk changes. All edits are tracked with a change stack that lets you accept or reject individual changes.</DocP>
    <ImagePlaceholder label="Excel Editor — Full Interface with Toolbar" />
    <DocH2>Two Operating Modes</DocH2>
    <DocUl>
      <DocLi><strong>Manual Mode</strong> — Click cells to edit, use the toolbar to format, sort, and filter. All standard spreadsheet operations are available.</DocLi>
      <DocLi><strong>AI Mode</strong> — Describe data changes in plain English using the AI Mutation panel. SheetMind generates the changes, shows you a diff preview, and lets you accept or reject before applying.</DocLi>
    </DocUl>
    <DocH2>Prerequisites</DocH2>
    <DocP>Before using the Excel Editor, you need at least one uploaded file in Data Sources. The editor opens files from your Data Sources library, not directly from your filesystem.</DocP>
    <Callout type="info">AI Mutations require an LLM provider to be configured. Manual editing works without any LLM setup.</Callout>
  </div>)
}
