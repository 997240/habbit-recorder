import React, { useState, useEffect } from 'react';
import { LoginPage } from './components/auth/LoginPage';
import { Header } from './components/layout/Header';
import { Dashboard } from './components/dashboard/Dashboard';
import { HabitList } from './components/habits/HabitList';
import { HabitForm } from './components/habits/HabitForm';
import { RecordPage } from './components/record/RecordPage';
import { User, Habit, HabitRecord, AppState } from './types';
import { storage } from './utils/storage';
import { generateId, formatDate } from './utils/dateUtils';

function App() {
  const [state, setState] = useState<AppState>({
    user: null,
    habits: [],
    records: [],
    currentPage: 'dashboard',
    selectedDate: formatDate(new Date()),
    timeRange: 'week',
    customRange: { start: '', end: '' }
  });

  const [showHabitForm, setShowHabitForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>();

  // Load user data on app start
  useEffect(() => {
    const savedUser = storage.getUser();
    if (savedUser) {
      const habits = storage.getHabits(savedUser.id);
      const records = storage.getRecords(savedUser.id);
      setState(prev => ({
        ...prev,
        user: savedUser,
        habits,
        records
      }));
    }
  }, []);

  // Authentication handlers
  const handleLogin = (user: User) => {
    storage.setUser(user);
    const habits = storage.getHabits(user.id);
    const records = storage.getRecords(user.id);
    setState(prev => ({
      ...prev,
      user,
      habits,
      records
    }));
  };

  const handleLogout = () => {
    storage.clearUser();
    setState(prev => ({
      ...prev,
      user: null,
      habits: [],
      records: [],
      currentPage: 'dashboard'
    }));
  };

  // Navigation handler
  const handleNavigate = (page: 'dashboard' | 'habits' | 'record') => {
    setState(prev => ({ ...prev, currentPage: page }));
    setShowHabitForm(false);
    setEditingHabit(undefined);
  };

  // Habit management handlers
  const handleCreateHabit = () => {
    setEditingHabit(undefined);
    setShowHabitForm(true);
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setShowHabitForm(true);
  };

  const handleSaveHabit = (habitData: Omit<Habit, 'id' | 'userId' | 'createdAt'>) => {
    if (!state.user) return;

    if (editingHabit) {
      // Update existing habit
      const updatedHabit: Habit = {
        ...editingHabit,
        ...habitData
      };
      storage.updateHabit(updatedHabit);
      const updatedHabits = state.habits.map(h => h.id === updatedHabit.id ? updatedHabit : h);
      setState(prev => ({ ...prev, habits: updatedHabits }));
    } else {
      // Create new habit
      const newHabit: Habit = {
        id: generateId(),
        userId: state.user.id,
        createdAt: new Date().toISOString(),
        ...habitData
      };
      storage.addHabit(newHabit);
      setState(prev => ({ ...prev, habits: [...prev.habits, newHabit] }));
    }

    setShowHabitForm(false);
    setEditingHabit(undefined);
  };

  const handleToggleActive = (habitId: string) => {
    const habit = state.habits.find(h => h.id === habitId);
    if (habit) {
      const updatedHabit = { ...habit, isActive: !habit.isActive };
      storage.updateHabit(updatedHabit);
      const updatedHabits = state.habits.map(h => h.id === habitId ? updatedHabit : h);
      setState(prev => ({ ...prev, habits: updatedHabits }));
    }
  };

  const handleDeleteHabit = (habitId: string) => {
    storage.deleteHabit(habitId);
    const updatedHabits = state.habits.filter(h => h.id !== habitId);
    setState(prev => ({ ...prev, habits: updatedHabits }));
  };

  // Record management handler
  const handleSaveRecord = (recordData: Omit<HabitRecord, 'id' | 'createdAt'>) => {
    const newRecord: HabitRecord = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      ...recordData
    };

    storage.addRecord(newRecord);
    
    // Update records in state
    const existingIndex = state.records.findIndex(
      r => r.habitId === newRecord.habitId && r.date === newRecord.date
    );
    
    if (existingIndex !== -1) {
      const updatedRecords = [...state.records];
      updatedRecords[existingIndex] = newRecord;
      setState(prev => ({ ...prev, records: updatedRecords }));
    } else {
      setState(prev => ({ ...prev, records: [...prev.records, newRecord] }));
    }
  };

  // Render appropriate page
  const renderCurrentPage = () => {
    if (!state.user) return null;

    switch (state.currentPage) {
      case 'habits':
        return (
          <HabitList
            habits={state.habits}
            onCreateHabit={handleCreateHabit}
            onEditHabit={handleEditHabit}
            onToggleActive={handleToggleActive}
            onDeleteHabit={handleDeleteHabit}
          />
        );
      case 'record':
        return (
          <RecordPage
            habits={state.habits}
            records={state.records}
            onSaveRecord={handleSaveRecord}
          />
        );
      case 'dashboard':
      default:
        return (
          <Dashboard
            habits={state.habits}
            records={state.records}
          />
        );
    }
  };

  if (!state.user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <Header
        user={state.user}
        currentPage={state.currentPage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />
      
      <main className="container mx-auto px-4 py-8">
        {renderCurrentPage()}
      </main>

      {showHabitForm && (
        <HabitForm
          habit={editingHabit}
          onSave={handleSaveHabit}
          onCancel={() => {
            setShowHabitForm(false);
            setEditingHabit(undefined);
          }}
        />
      )}
    </div>
  );
}

export default App;