# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React-based habit tracking application written in TypeScript. The app allows users to create habits, record daily progress, and visualize their data through charts. All data is stored locally using browser localStorage.

## Development Commands

- **Start development server**: `npm run dev`
- **Build for production**: `npm run build`
- **Run linting**: `npm run lint`
- **Preview production build**: `npm run preview`

## Architecture

### Core Data Flow
The app follows a single-state architecture pattern:
- `App.tsx` contains the main application state using React hooks
- State management is centralized with all habits and records stored in `AppState`
- Data persistence is handled through `utils/storage.ts` using localStorage
- No external state management library is used

### Key Components Structure

**Main App (`src/App.tsx`)**:
- Central state management for habits, records, and UI state
- Navigation and page routing logic
- All CRUD operations for habits and records

**Data Models (`src/types/index.ts`)**:
- `Habit`: Represents a trackable habit with type, target, and metadata
- `HabitRecord`: Individual daily records linked to habits
- `AppState`: Complete application state including current page and filters

**Storage Layer (`src/utils/storage.ts`)**:
- localStorage wrapper with type safety
- Handles all data persistence operations
- Supports batch operations for performance

**Component Categories**:
- **Layout**: `Header.tsx` for navigation
- **Dashboard**: `Dashboard.tsx` with `HabitChart.tsx` for data visualization
- **Habits**: `HabitList.tsx` and `HabitForm.tsx` for habit management
- **Record**: `RecordPage.tsx` for daily progress logging
- **Settings**: `SettingsPage.tsx` for app configuration

### Habit Types
The app supports four habit types:
- `numeric`: Track quantities (e.g., glasses of water)
- `duration`: Track time spent (e.g., exercise minutes)
- `time-based`: Track specific times (e.g., wake up time)
- `check-in`: Simple completion tracking (done/not done)

### Data Persistence
- All data is stored in browser localStorage with keys:
  - `habit_tracker_habits`: Array of all habits
  - `habit_tracker_records`: Array of all habit records
- The storage layer handles duplicate record prevention (one record per habit per day)
- No external database or API integration

### UI Framework
- **Styling**: Tailwind CSS for all styling
- **Icons**: Lucide React for iconography
- **Charts**: Recharts library for data visualization
- **Date handling**: date-fns for date utilities

## Development Notes

### State Management Pattern
- All state mutations go through centralized handlers in `App.tsx`
- Components are purely presentational and communicate via props
- Record updates support both individual and batch operations for performance

### LocalStorage Integration
- The `storage.ts` module provides a clean abstraction over localStorage
- All operations are synchronous as localStorage is sync
- Data is serialized/deserialized automatically

### Component Communication
- Parent-child communication through props and callbacks
- No context API or prop drilling beyond one level
- Page navigation handled through simple state switching

### Key Implementation Details
- Habit records are unique per habit per date (automatic deduplication)
- Charts support both bar and line chart types with time range filtering
- Form components handle both creation and editing modes
- Settings page exists but implementation may be minimal