import {
  BarChart2,
  BookOpen,
  Cpu,
  FileText,
  HardDrive,
  LayoutDashboard,
  Settings,
  Table,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { DocH1, DocP } from '@/components/docs/MDXComponents';

const sections = [
  {
    icon: BookOpen,
    title: 'Getting Started',
    description: 'Installation, first launch, and a quick start guide to get up and running.',
    path: '/docs/getting-started',
  },
  {
    icon: FileText,
    title: 'Chat Page',
    description:
      'Ask questions in plain English, work with results, export data, and save queries.',
    path: '/docs/chat',
  },
  {
    icon: HardDrive,
    title: 'Data Sources',
    description: 'Upload Excel files, manage your data library, and preview sheet contents.',
    path: '/docs/data-sources',
  },
  {
    icon: Table,
    title: 'Excel Editor',
    description: 'Open files in a full spreadsheet editor with AI-powered data mutations.',
    path: '/docs/excel-editor',
  },
  {
    icon: LayoutDashboard,
    title: 'Dashboards',
    description: 'Build visual dashboards powered by saved queries with drag-and-drop layouts.',
    path: '/docs/dashboards',
  },
  {
    icon: BarChart2,
    title: 'Saved Queries',
    description: 'Save, organize, and rerun your best queries from a convenient drawer.',
    path: '/docs/saved-queries',
  },
  {
    icon: Cpu,
    title: 'Artifacts',
    description: 'Access exported Excel files and charts from a persistent artifact store.',
    path: '/docs/artifacts',
  },
  {
    icon: Settings,
    title: 'Settings',
    description: 'Configure OpenAI or Ollama, manage data, and customize SheetMind behavior.',
    path: '/docs/settings',
  },
];

export default function DocsHomePage() {
  return (
    <div>
      <DocH1>SheetMind Documentation</DocH1>
      <DocP>
        Welcome to the SheetMind documentation. Here you will find comprehensive guides and
        reference material for every feature of the SheetMind desktop application. Whether you are
        setting up for the first time or looking to master advanced features like AI mutations and
        dashboards, these docs have you covered.
      </DocP>

      <div className="grid grid-cols-1 gap-4 mt-8 md:grid-cols-2">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.path}
              to={section.path}
              className="p-5 transition-all duration-200 block"
              style={{
                backgroundColor: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = 'var(--color-border-hover)')
              }
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
            >
              <div className="flex items-center gap-3">
                <Icon size={20} style={{ color: 'var(--color-primary-light)' }} />
                <span
                  className="text-base font-semibold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {section.title}
                </span>
              </div>
              <p
                className="mt-2 text-sm leading-relaxed"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {section.description}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
