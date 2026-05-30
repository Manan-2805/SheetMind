import ImagePlaceholder from '@/components/docs/ImagePlaceholder';
import {
  Callout,
  DocCode,
  DocH1,
  DocH2,
  DocLi,
  DocOl,
  DocP,
  DocUl,
} from '@/components/docs/MDXComponents';

export default function FirstLaunchPage() {
  return (
    <div>
      <DocH1>First Launch & Setup</DocH1>
      <DocP>
        The first time you launch SheetMind, you will be guided through initial setup. This page
        explains what to expect and how to configure the application for first use.
      </DocP>

      <DocH2>Creating Your Username</DocH2>
      <DocP>
        On first launch, SheetMind displays a welcome screen asking you to create a local username.
        This username identifies your account on the machine and isolates your data from other
        users. No password is required — accounts are local-only.
      </DocP>
      <ImagePlaceholder label="First Launch — Username Creation Screen" />

      <DocH2>Account Selection on Return Visits</DocH2>
      <DocP>
        When you open SheetMind after the first launch, you will see an account selection screen
        listing all local user accounts. Click your username to continue. Each account has its own
        isolated set of uploaded files, chat history, saved queries, dashboards, and settings.
      </DocP>
      <ImagePlaceholder label="Account Selection Screen" />

      <DocH2>Where Data is Stored</DocH2>
      <DocP>
        SheetMind stores all application data in a local directory on your machine. The exact
        location depends on your operating system:
      </DocP>
      <DocUl>
        <DocLi>
          Windows: <DocCode>%APPDATA%\SheetMind</DocCode>
        </DocLi>
        <DocLi>
          macOS: <DocCode>~/Library/Application Support/SheetMind</DocCode>
        </DocLi>
        <DocLi>
          Linux: <DocCode>~/.local/share/SheetMind</DocCode>
        </DocLi>
      </DocUl>

      <DocH2>LLM Provider Setup</DocH2>
      <DocP>
        Before you can ask your first question, you must configure at least one LLM provider.
        SheetMind supports two options:
      </DocP>
      <DocOl>
        <DocLi>
          <strong>OpenAI</strong> — Enter your API key in Settings. Requires an internet connection.
          Supports models like GPT-4o and GPT-4.1.
        </DocLi>
        <DocLi>
          <strong>Ollama</strong> — Install Ollama on your machine and configure the base URL in
          Settings. Runs completely offline with local models.
        </DocLi>
      </DocOl>

      <Callout type="warning">
        You must complete LLM setup before using the Chat page or AI Mutations in the Excel Editor.
        Without a configured provider, SheetMind cannot generate SQL queries from natural language.
      </Callout>
    </div>
  );
}
