import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import ProtectedRoute from '@/components/common/ProtectedRoute';

const LandingPage = lazy(() => import('@/pages/LandingPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const AuthCallbackPage = lazy(() => import('@/pages/AuthCallbackPage'));
const WelcomePage = lazy(() => import('@/pages/WelcomePage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const ServerErrorPage = lazy(() => import('@/pages/ServerErrorPage'));
const MaintenancePage = lazy(() => import('@/pages/MaintenancePage'));

const DocsLayout = lazy(() => import('@/components/docs/DocsLayout'));
const DocsHomePage = lazy(() => import('@/pages/docs/DocsHomePage'));
const OverviewPage = lazy(() => import('@/pages/docs/getting-started/OverviewPage'));
const FirstLaunchPage = lazy(() => import('@/pages/docs/getting-started/FirstLaunchPage'));
const QuickStartPage = lazy(() => import('@/pages/docs/getting-started/QuickStartPage'));
const ChatOverviewPage = lazy(() => import('@/pages/docs/chat/ChatOverviewPage'));
const FileReferencesPage = lazy(() => import('@/pages/docs/chat/FileReferencesPage'));
const ResultTablesPage = lazy(() => import('@/pages/docs/chat/ResultTablesPage'));
const ExportingPage = lazy(() => import('@/pages/docs/chat/ExportingPage'));
const SavingQueriesPage = lazy(() => import('@/pages/docs/chat/SavingQueriesPage'));
const DebugInfoPage = lazy(() => import('@/pages/docs/chat/DebugInfoPage'));
const DataSourcesOverviewPage = lazy(
  () => import('@/pages/docs/data-sources/DataSourcesOverviewPage')
);
const UploadingPage = lazy(() => import('@/pages/docs/data-sources/UploadingPage'));
const ManagingFilesPage = lazy(() => import('@/pages/docs/data-sources/ManagingFilesPage'));
const ExcelEditorOverviewPage = lazy(
  () => import('@/pages/docs/excel-editor/ExcelEditorOverviewPage')
);
const OpeningFilesPage = lazy(() => import('@/pages/docs/excel-editor/OpeningFilesPage'));
const ToolbarPage = lazy(() => import('@/pages/docs/excel-editor/ToolbarPage'));
const AIMutationsPage = lazy(() => import('@/pages/docs/excel-editor/AIMutationsPage'));
const ChangeStackPage = lazy(() => import('@/pages/docs/excel-editor/ChangeStackPage'));
const SavingChangesPage = lazy(() => import('@/pages/docs/excel-editor/SavingChangesPage'));
const DashboardsOverviewPage = lazy(() => import('@/pages/docs/dashboards/DashboardsOverviewPage'));
const CreatingDashboardPage = lazy(() => import('@/pages/docs/dashboards/CreatingDashboardPage'));
const LayoutPickerPage = lazy(() => import('@/pages/docs/dashboards/LayoutPickerPage'));
const BindingQueriesPage = lazy(() => import('@/pages/docs/dashboards/BindingQueriesPage'));
const ExportingDashboardPage = lazy(() => import('@/pages/docs/dashboards/ExportingDashboardPage'));
const SavedQueriesOverviewPage = lazy(
  () => import('@/pages/docs/saved-queries/SavedQueriesOverviewPage')
);
const FavoritesPage = lazy(() => import('@/pages/docs/saved-queries/FavoritesPage'));
const ArtifactsOverviewPage = lazy(() => import('@/pages/docs/artifacts/ArtifactsOverviewPage'));
const ChartsPage = lazy(() => import('@/pages/docs/artifacts/ChartsPage'));
const SettingsOverviewPage = lazy(() => import('@/pages/docs/settings/SettingsOverviewPage'));
const OpenAISetupPage = lazy(() => import('@/pages/docs/settings/OpenAISetupPage'));
const OllamaSetupPage = lazy(() => import('@/pages/docs/settings/OllamaSetupPage'));
const DataManagementPage = lazy(() => import('@/pages/docs/settings/DataManagementPage'));

function LoadingFallback() {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ backgroundColor: 'var(--color-bg-base)' }}
    >
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
        style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
      />
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <LandingPage />
      </Suspense>
    ),
  },
  {
    path: '/login',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: '/auth/callback',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <AuthCallbackPage />
      </Suspense>
    ),
  },
  {
    path: '/welcome',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <ProtectedRoute>
          <WelcomePage />
        </ProtectedRoute>
      </Suspense>
    ),
  },
  {
    path: '/docs',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <DocsLayout />
      </Suspense>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <DocsHomePage />
          </Suspense>
        ),
      },
      {
        path: 'getting-started',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <OverviewPage />
          </Suspense>
        ),
      },
      {
        path: 'getting-started/first-launch',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <FirstLaunchPage />
          </Suspense>
        ),
      },
      {
        path: 'getting-started/quick-start',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <QuickStartPage />
          </Suspense>
        ),
      },
      {
        path: 'chat',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ChatOverviewPage />
          </Suspense>
        ),
      },
      {
        path: 'chat/file-references',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <FileReferencesPage />
          </Suspense>
        ),
      },
      {
        path: 'chat/result-tables',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ResultTablesPage />
          </Suspense>
        ),
      },
      {
        path: 'chat/exporting',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ExportingPage />
          </Suspense>
        ),
      },
      {
        path: 'chat/saving-queries',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <SavingQueriesPage />
          </Suspense>
        ),
      },
      {
        path: 'chat/debug-info',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <DebugInfoPage />
          </Suspense>
        ),
      },
      {
        path: 'data-sources',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <DataSourcesOverviewPage />
          </Suspense>
        ),
      },
      {
        path: 'data-sources/uploading',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <UploadingPage />
          </Suspense>
        ),
      },
      {
        path: 'data-sources/managing',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ManagingFilesPage />
          </Suspense>
        ),
      },
      {
        path: 'excel-editor',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ExcelEditorOverviewPage />
          </Suspense>
        ),
      },
      {
        path: 'excel-editor/opening-files',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <OpeningFilesPage />
          </Suspense>
        ),
      },
      {
        path: 'excel-editor/toolbar',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ToolbarPage />
          </Suspense>
        ),
      },
      {
        path: 'excel-editor/ai-mutations',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <AIMutationsPage />
          </Suspense>
        ),
      },
      {
        path: 'excel-editor/change-stack',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ChangeStackPage />
          </Suspense>
        ),
      },
      {
        path: 'excel-editor/saving',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <SavingChangesPage />
          </Suspense>
        ),
      },
      {
        path: 'dashboards',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <DashboardsOverviewPage />
          </Suspense>
        ),
      },
      {
        path: 'dashboards/creating',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <CreatingDashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'dashboards/layout-picker',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <LayoutPickerPage />
          </Suspense>
        ),
      },
      {
        path: 'dashboards/binding-queries',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <BindingQueriesPage />
          </Suspense>
        ),
      },
      {
        path: 'dashboards/exporting',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ExportingDashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'saved-queries',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <SavedQueriesOverviewPage />
          </Suspense>
        ),
      },
      {
        path: 'saved-queries/favorites',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <FavoritesPage />
          </Suspense>
        ),
      },
      {
        path: 'artifacts',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ArtifactsOverviewPage />
          </Suspense>
        ),
      },
      {
        path: 'artifacts/charts',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ChartsPage />
          </Suspense>
        ),
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <SettingsOverviewPage />
          </Suspense>
        ),
      },
      {
        path: 'settings/openai-setup',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <OpenAISetupPage />
          </Suspense>
        ),
      },
      {
        path: 'settings/ollama-setup',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <OllamaSetupPage />
          </Suspense>
        ),
      },
      {
        path: 'settings/data-management',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <DataManagementPage />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: '/500',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <ServerErrorPage />
      </Suspense>
    ),
  },
  {
    path: '/maintenance',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <MaintenancePage />
      </Suspense>
    ),
  },
  {
    path: '*',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <NotFoundPage />
      </Suspense>
    ),
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
