import { Callout, DocCode, DocH1, DocH2, DocLi, DocP, DocTable, DocTd, DocTh, DocUl } from '@/components/docs/MDXComponents'
import ImagePlaceholder from '@/components/docs/ImagePlaceholder'

export default function DebugInfoPage() {
  return (<div>
    <DocH1>Debug Info & Confidence</DocH1>
    <DocP>Every AI-generated query includes debug information that helps you understand and verify the results. The debug footer appears below each result and provides transparency into the AI pipeline.</DocP>
    <ImagePlaceholder label="Debug Info Footer — Expanded View" />
    <DocH2>Debug Footer Contents</DocH2>
    <DocUl>
      <DocLi><strong>Generated SQL</strong> — The exact SQL query that was executed against your data</DocLi>
      <DocLi><strong>Token Usage</strong> — Number of input/output tokens consumed by the LLM</DocLi>
      <DocLi><strong>Processing Time</strong> — Total time from question submission to result display</DocLi>
      <DocLi><strong>Confidence Score</strong> — A 1-5 rating of how confident the AI is in the generated query</DocLi>
    </DocUl>
    <DocH2>Confidence Score Scale</DocH2>
    <DocTable>
      <thead><tr><DocTh>Score</DocTh><DocTh>Meaning</DocTh><DocTh>Action</DocTh></tr></thead>
      <tbody>
        <tr><DocTd>5</DocTd><DocTd>Very High</DocTd><DocTd>Result is almost certainly correct</DocTd></tr>
        <tr><DocTd>4</DocTd><DocTd>High</DocTd><DocTd>Result is likely correct</DocTd></tr>
        <tr><DocTd>3</DocTd><DocTd>Medium</DocTd><DocTd>Result might be correct, worth reviewing SQL</DocTd></tr>
        <tr><DocTd>2</DocTd><DocTd>Low</DocTd><DocTd>Result may be wrong, review SQL carefully</DocTd></tr>
        <tr><DocTd>1</DocTd><DocTd>Very Low</DocTd><DocTd>High chance of error, consider rephrasing question</DocTd></tr>
      </tbody>
    </DocTable>
    <Callout type="warning">When confidence is 1 or 2, a yellow warning banner appears above the result table. Always verify the generated SQL for low-confidence results.</Callout>
  </div>)
}
