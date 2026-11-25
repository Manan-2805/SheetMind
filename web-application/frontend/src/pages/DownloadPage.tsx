import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import api from '@/lib/api';

const installers = [
  { platform: 'Linux', format: 'AppImage · x64', file: 'SheetMind-linux-x64.AppImage' },
  {
    platform: 'Windows',
    format: 'Setup executable · x64',
    file: 'SheetMind-windows-x64-setup.exe',
  },
];

export default function DownloadPage() {
  const [availableFiles, setAvailableFiles] = useState<Set<string> | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all(
      installers.map(async ({ file }) => {
        try {
          const response = await api.head(`/downloads/${file}`, {
            baseURL: '/',
            signal: controller.signal,
          });
          return response.headers['content-type'] === 'application/octet-stream' ? file : '';
        } catch {
          return '';
        }
      })
    ).then((files) => {
      if (!controller.signal.aborted) setAvailableFiles(new Set(files.filter(Boolean)));
    });
    return () => controller.abort();
  }, []);

  return (
    <main className="min-h-screen bg-[#0c0c0c] px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl">
        <nav aria-label="Download page" className="mb-12 flex gap-6 text-sm text-white/70">
          <Link to="/" className="hover:text-white">
            SheetMind
          </Link>
          <Link to="/docs" className="hover:text-white">
            Documentation
          </Link>
        </nav>
        <h1 className="text-4xl font-semibold tracking-tight">Download SheetMind</h1>
        <div className="mt-8 grid gap-4 sm:grid-cols-2" aria-live="polite">
          {installers.map(({ platform, format, file }) => (
            <section key={file} className="rounded-2xl border border-white/15 bg-white/5 p-6">
              <h2 className="text-lg font-semibold">{platform}</h2>
              <p className="mt-1 text-sm text-white/70">{format}</p>
              {availableFiles?.has(file) ? (
                <a
                  className="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90"
                  href={`/downloads/${file}`}
                  download
                >
                  Download for {platform}
                </a>
              ) : (
                <p className="mt-5 text-sm text-white/70">
                  {availableFiles ? 'Installer unavailable' : 'Checking availability…'}
                </p>
              )}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
