# SheetMind Desktop Frontend

This is the frontend component for the SheetMind desktop application, built using React, TypeScript, and Vite. State management is handled by Zustand, and UI components are styled using shadcn/ui.

## Prerequisites
- Node.js (v18+)
- npm (Node Package Manager)

## Setup and Installation

1. Navigate to the frontend directory:
   ```powershell
   cd desktop-application/frontend
   ```
2. Install dependencies:
   ```powershell
   npm install
   ```

## Development Server

To start the development server with Hot Module Replacement (HMR):
```powershell
npm run dev
```

## Build Instructions

To build the frontend for production (used by Electron):
```powershell
npm run build
```
The compiled assets will be placed in the `dist` directory.

## Technologies Used
- React
- TypeScript
- Vite
- Zustand (State Management)
- Tailwind CSS & shadcn/ui (Styling)
