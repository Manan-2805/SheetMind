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

export default function OpenAISetupPage() {
  return (
    <div>
      <DocH1>OpenAI Setup</DocH1>
      <DocP>
        Connect SheetMind to OpenAI's API for powerful GPT-4 query generation. This requires an
        OpenAI API key and an active internet connection.
      </DocP>
      <ImagePlaceholder label="Settings — OpenAI Configuration Panel" />
      <DocH2>Getting an API Key</DocH2>
      <DocOl>
        <DocLi>
          Go to <DocCode>platform.openai.com</DocCode>
        </DocLi>
        <DocLi>Sign in or create an account</DocLi>
        <DocLi>Navigate to API Keys</DocLi>
        <DocLi>Create a new key and copy it</DocLi>
      </DocOl>
      <DocH2>Entering Your Key</DocH2>
      <DocP>
        Paste your API key into the API Key field in the OpenAI Setup section. The key is stored
        locally and never sent to any server other than OpenAI's API endpoint.
      </DocP>
      <DocH2>Test Connection</DocH2>
      <DocP>
        Click the Test Connection button to verify your key works. SheetMind sends a small test
        request to the OpenAI API and reports success or failure. Common failures include invalid
        key, expired key, or insufficient quota.
      </DocP>
      <DocH2>Model Selection</DocH2>
      <DocP>
        Use the Model dropdown to select which GPT model to use. Available options depend on your
        API key permissions. Recommended models for best query quality:
      </DocP>
      <DocOl>
        <DocLi>
          <DocCode>gpt-4o</DocCode> — Best balance of quality and speed
        </DocLi>
        <DocLi>
          <DocCode>gpt-4.1</DocCode> — Highest quality for complex queries
        </DocLi>
        <DocLi>
          <DocCode>gpt-3.5-turbo</DocCode> — Fastest and most affordable for simple queries
        </DocLi>
      </DocOl>
      <Callout type="warning">
        API usage incurs costs on your OpenAI account. SheetMind displays token usage for each query
        in the debug footer so you can monitor consumption.
      </Callout>
    </div>
  );
}
