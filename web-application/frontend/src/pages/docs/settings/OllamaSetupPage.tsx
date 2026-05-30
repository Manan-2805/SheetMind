import ImagePlaceholder from '@/components/docs/ImagePlaceholder';
import {
  Callout,
  DocCode,
  DocH1,
  DocH2,
  DocLi,
  DocOl,
  DocP,
} from '@/components/docs/MDXComponents';

export default function OllamaSetupPage() {
  return (
    <div>
      <DocH1>Ollama Setup</DocH1>
      <DocP>
        Run SheetMind completely offline by connecting to a local Ollama instance. Ollama lets you
        run large language models on your own hardware with zero internet dependency.
      </DocP>
      <ImagePlaceholder label="Settings — Ollama Configuration Panel" />
      <DocH2>Installing Ollama</DocH2>
      <DocOl>
        <DocLi>
          Visit <DocCode>ollama.ai</DocCode> and download the installer for your OS
        </DocLi>
        <DocLi>Follow the installation instructions</DocLi>
        <DocLi>After installation, Ollama runs as a background service on port 11434</DocLi>
      </DocOl>
      <DocH2>Configuring the Base URL</DocH2>
      <DocP>
        In SheetMind Settings, enter the Ollama base URL. The default is{' '}
        <DocCode>http://localhost:11434</DocCode>. If Ollama is running on a different machine or
        port, update the URL accordingly.
      </DocP>
      <DocH2>Test Connection</DocH2>
      <DocP>
        Click Test Connection to verify SheetMind can reach your Ollama instance. The test pings the
        Ollama API and reports whether the service is reachable.
      </DocP>
      <DocH2>Pulling a Model</DocH2>
      <DocP>
        Before using Ollama for queries, you need at least one model installed. SheetMind provides a
        Pull Model button that downloads a model through Ollama. Recommended models for SQL
        generation:
      </DocP>
      <DocOl>
        <DocLi>
          <DocCode>llama3.1:8b</DocCode> — Good balance of quality and speed (4.7 GB)
        </DocLi>
        <DocLi>
          <DocCode>codellama:13b</DocCode> — Optimized for code and SQL generation (7.4 GB)
        </DocLi>
        <DocLi>
          <DocCode>mistral:7b</DocCode> — Lightweight and fast (4.1 GB)
        </DocLi>
      </DocOl>
      <Callout type="tip">
        Ollama requires significant RAM. Plan for at least 8 GB of RAM for 7B models and 16 GB for
        13B models, in addition to the RAM SheetMind itself uses.
      </Callout>
    </div>
  );
}
