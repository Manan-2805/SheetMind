import { Link, useLocation } from 'react-router-dom'

interface SidebarItem {
  label: string
  path: string
}

interface SidebarSection {
  title: string
  items: SidebarItem[]
}

const sections: SidebarSection[] = [
  {
    title: 'Getting Started',
    items: [
      { label: 'Overview', path: '/docs/getting-started' },
      { label: 'First Launch & Setup', path: '/docs/getting-started/first-launch' },
      { label: 'Quick Start Guide', path: '/docs/getting-started/quick-start' },
    ],
  },
  {
    title: 'Chat Page',
    items: [
      { label: 'Overview', path: '/docs/chat' },
      { label: 'Using # File References', path: '/docs/chat/file-references' },
      { label: 'Working with Results', path: '/docs/chat/result-tables' },
      { label: 'Exporting Data', path: '/docs/chat/exporting' },
      { label: 'Saving Queries', path: '/docs/chat/saving-queries' },
      { label: 'Debug Info & Confidence', path: '/docs/chat/debug-info' },
    ],
  },
  {
    title: 'Data Sources',
    items: [
      { label: 'Overview', path: '/docs/data-sources' },
      { label: 'Uploading Excel Files', path: '/docs/data-sources/uploading' },
      { label: 'Managing Files', path: '/docs/data-sources/managing' },
    ],
  },
  {
    title: 'Excel Editor',
    items: [
      { label: 'Overview', path: '/docs/excel-editor' },
      { label: 'Opening Files', path: '/docs/excel-editor/opening-files' },
      { label: 'Formatting Toolbar', path: '/docs/excel-editor/toolbar' },
      { label: 'AI Mutations', path: '/docs/excel-editor/ai-mutations' },
      { label: 'Change Stack & Diff View', path: '/docs/excel-editor/change-stack' },
      { label: 'Saving Changes', path: '/docs/excel-editor/saving' },
    ],
  },
  {
    title: 'Dashboards',
    items: [
      { label: 'Overview', path: '/docs/dashboards' },
      { label: 'Creating a Dashboard', path: '/docs/dashboards/creating' },
      { label: 'Layout Picker', path: '/docs/dashboards/layout-picker' },
      { label: 'Binding Saved Queries', path: '/docs/dashboards/binding-queries' },
      { label: 'Exporting as PNG', path: '/docs/dashboards/exporting' },
    ],
  },
  {
    title: 'Saved Queries',
    items: [
      { label: 'Overview & Usage', path: '/docs/saved-queries' },
      { label: 'Favorites & Organization', path: '/docs/saved-queries/favorites' },
    ],
  },
  {
    title: 'Artifacts',
    items: [
      { label: 'Overview', path: '/docs/artifacts' },
      { label: 'Chart Exports', path: '/docs/artifacts/charts' },
    ],
  },
  {
    title: 'Settings',
    items: [
      { label: 'Overview', path: '/docs/settings' },
      { label: 'OpenAI Setup', path: '/docs/settings/openai-setup' },
      { label: 'Ollama Setup', path: '/docs/settings/ollama-setup' },
      { label: 'Data Management', path: '/docs/settings/data-management' },
    ],
  },
]

interface DocsSidebarProps {
  onClose?: () => void
}

export default function DocsSidebar({ onClose }: DocsSidebarProps) {
  const location = useLocation()

  return (
    <nav
      className="h-full overflow-y-auto py-6 border-r border-white/10 bg-black/30 backdrop-blur-md"
    >
      <div className="px-4 mb-6">
        <Link to="/" className="flex items-center gap-2" onClick={onClose}>
          <div className="h-5 w-5 rounded" style={{ backgroundColor: 'var(--color-primary)' }} />
          <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
            SheetMind
          </span>
        </Link>
      </div>

      {sections.map((section) => (
        <div key={section.title} className="mt-5">
          <div
            className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            {section.title}
          </div>
          {section.items.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`block py-[7px] pl-8 pr-4 text-[13px] font-medium transition-all duration-150 border-l-2 ${
                  isActive
                    ? 'text-brand bg-brand/10 border-brand'
                    : 'text-white/60 hover:text-white hover:bg-white/5 border-transparent'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
