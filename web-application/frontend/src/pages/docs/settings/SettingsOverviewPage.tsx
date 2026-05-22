import { DocH1, DocH2, DocLi, DocP, DocUl } from '@/components/docs/MDXComponents'
import ImagePlaceholder from '@/components/docs/ImagePlaceholder'

export default function SettingsOverviewPage() {
  return (<div>
    <DocH1>Settings</DocH1>
    <DocP>The Settings page lets you configure your LLM provider, manage data storage, and customize SheetMind behavior.</DocP>
    <ImagePlaceholder label="Settings Page — Overview" />
    <DocH2>Settings Layout</DocH2>
    <DocP>The Settings page is organized into four sections, each accessible from tabs at the top of the page:</DocP>
    <DocUl>
      <DocLi><strong>OpenAI Setup</strong> — Configure your OpenAI API key and select a model</DocLi>
      <DocLi><strong>Ollama Setup</strong> — Configure local Ollama instance connection</DocLi>
      <DocLi><strong>Data Management</strong> — View storage usage, clear data, and manage backups</DocLi>
      <DocLi><strong>General</strong> — Appearance, result row limits, and other preferences</DocLi>
    </DocUl>
    <DocH2>Provider Selection</DocH2>
    <DocP>At the top of the Settings page, a toggle lets you switch between OpenAI and Ollama as your active LLM provider. Only one provider can be active at a time. Switching providers takes effect immediately for all new queries.</DocP>
  </div>)
}
