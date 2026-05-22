import { Callout, DocCode, DocH1, DocH2, DocH3, DocLi, DocP, DocUl } from '@/components/docs/MDXComponents'
import ImagePlaceholder from '@/components/docs/ImagePlaceholder'

export default function ChatOverviewPage() {
  return (<div>
    <DocH1>Chat Page</DocH1>
    <DocP>The Chat page is where you interact with your Excel data using natural language. Type a question, reference one or more files, and SheetMind generates SQL, executes it, and displays results in a sortable table with export options.</DocP>
    <ImagePlaceholder label="Chat Page — Full Interface" />
    <DocH2>Page Layout</DocH2>
    <DocP>The Chat page has a clean two-panel layout. The main area displays your conversation history with alternating user messages and AI responses. At the bottom, the input bar allows you to type questions and reference files using the <DocCode>#</DocCode> autocomplete.</DocP>
    <DocH2>Empty State</DocH2>
    <DocP>When you first open the Chat page with no messages, you see a welcome message and a set of suggestion chips. These chips are pre-written example questions that demonstrate common query patterns. Click any chip to populate the input bar with that question.</DocP>
    <DocH2>Message Types</DocH2>
    <DocUl>
      <DocLi><strong>User messages</strong> — Your natural language questions, displayed on the right side</DocLi>
      <DocLi><strong>AI responses</strong> — Results from SheetMind, including the NL summary, result table, confidence score, and action bar</DocLi>
      <DocLi><strong>Error messages</strong> — Displayed when the LLM fails to generate valid SQL or the query execution fails</DocLi>
    </DocUl>
    <DocH2>The NL-to-SQL Pipeline</DocH2>
    <DocP>When you submit a question, SheetMind follows this pipeline:</DocP>
    <DocH3>1. File Resolution</DocH3>
    <DocP>SheetMind identifies which files and sheets you referenced using <DocCode>#</DocCode> mentions. It retrieves the schema (column names, types, row counts) for each referenced sheet.</DocP>
    <DocH3>2. Prompt Construction</DocH3>
    <DocP>Your question, along with the schema information, is assembled into a structured prompt sent to the configured LLM provider (OpenAI or Ollama).</DocP>
    <DocH3>3. SQL Generation</DocH3>
    <DocP>The LLM returns a SQL query along with a confidence score (1-5) and a natural language summary of what the query does.</DocP>
    <DocH3>4. Query Execution</DocH3>
    <DocP>SheetMind executes the generated SQL against the local DuckDB database and returns the results as a structured table.</DocP>
    <DocH3>5. Result Display</DocH3>
    <DocP>Results are rendered as a sortable table with the NL summary above it, the confidence score badge, and the action bar below for exporting, charting, or saving.</DocP>
    <Callout type="tip">For best results, be specific in your questions and always use <DocCode>#</DocCode> to reference the exact file and sheet you want to query.</Callout>
  </div>)
}
