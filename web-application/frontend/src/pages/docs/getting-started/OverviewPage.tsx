import ImagePlaceholder from '@/components/docs/ImagePlaceholder';
import { Callout, DocH1, DocH2, DocH3, DocLi, DocP, DocUl } from '@/components/docs/MDXComponents';

export default function OverviewPage() {
  return (
    <div>
      <DocH1>Overview</DocH1>
      <DocP>
        SheetMind is an AI-powered desktop application that transforms how you interact with Excel
        data. Instead of writing complex formulas or learning SQL, you simply ask questions in plain
        English. SheetMind converts your natural language queries into SQL, executes them against
        your uploaded files, and returns sortable, exportable results instantly.
      </DocP>

      <ImagePlaceholder label="SheetMind Desktop Application — Main Interface" />

      <DocH2>What SheetMind Does</DocH2>
      <DocP>
        SheetMind is a local-first application that runs entirely on your computer. It provides a
        complete suite of tools for working with Excel data:
      </DocP>
      <DocUl>
        <DocLi>Natural language querying of Excel files using AI-generated SQL</DocLi>
        <DocLi>Full spreadsheet editor with AI-powered data mutations</DocLi>
        <DocLi>Interactive dashboards powered by saved queries</DocLi>
        <DocLi>Chart builder with 10+ chart types</DocLi>
        <DocLi>Multi-user local accounts with isolated data</DocLi>
        <DocLi>Support for OpenAI and Ollama LLM providers</DocLi>
      </DocUl>

      <DocH2>System Requirements</DocH2>
      <DocUl>
        <DocLi>Windows 10/11, macOS 12+, or Linux (Ubuntu 20.04+)</DocLi>
        <DocLi>4 GB RAM minimum (8 GB recommended)</DocLi>
        <DocLi>500 MB free disk space for the application</DocLi>
        <DocLi>Additional disk space for your Excel files and database</DocLi>
        <DocLi>Internet connection required only for OpenAI API access</DocLi>
      </DocUl>

      <DocH2>Key Concepts</DocH2>

      <DocH3>DuckDB — The Local Database</DocH3>
      <DocP>
        When you upload an Excel file, SheetMind imports its data into a local DuckDB database.
        DuckDB is an embedded analytical database engine optimized for fast queries on structured
        data. This means your queries run instantly against an indexed, optimized copy of your data
        — not against the raw Excel file.
      </DocP>

      <DocH3>Saved Queries</DocH3>
      <DocP>
        Any query result can be saved with a label for later reuse. Saved queries are the foundation
        for dashboards — each dashboard widget is powered by a saved query that runs fresh every
        time the dashboard opens.
      </DocP>

      <DocH3>Local-First Architecture</DocH3>
      <DocP>
        All data stays on your machine. SheetMind does not upload your files, query history, or
        results to any server. The only network requests made are to the LLM provider (OpenAI or
        your local Ollama instance) for generating SQL queries.
      </DocP>

      <Callout type="info">
        SheetMind requires an LLM provider to be configured before you can ask questions. See the
        Settings section for OpenAI or Ollama setup instructions.
      </Callout>
    </div>
  );
}
