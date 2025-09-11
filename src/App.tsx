import { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Dashboard } from './components/dashboard/Dashboard';
import { HabitList } from './components/habits/HabitList';
import { HabitForm } from './components/habits/HabitForm';
import { RecordPage } from './components/record/RecordPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { Habit, HabitRecord, AppState } from './types';
import { storage } from './utils/storage';
import { generateId, formatDate } from './utils/dateUtils';

function App() {
  const [state, setState] = useState<AppState>({
    habits: [],
    records: [],
    currentPage: 'dashboard',
    selectedDate: formatDate(new Date()),
    timeRange: 'week',
    customRange: { start: '', end: '' }
  });

  const [showHabitForm, setShowHabitForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>();

  // Load data on app start
  useEffect(() => {
    const habits = storage.getHabits();
    const records = storage.getRecords();
    setState(prev => ({
      ...prev,
      habits,
      records
    }));
  }, []);


  // Navigation handler
  const handleNavigate = (page: 'dashboard' | 'habits' | 'record' | 'settings') => {
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

  const handleSaveHabit = (habitData: Omit<Habit, 'id' | 'createdAt'>) => {
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
    // First check if a record already exists
    const existingRecord = state.records.find(
      r => r.habitId === recordData.habitId && r.date === recordData.date
    );

    const newRecord: HabitRecord = {
      id: existingRecord ? existingRecord.id : generateId(), // Reuse existing ID if updating
      createdAt: existingRecord ? existingRecord.createdAt : new Date().toISOString(), // Keep original creation time
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

  // Batch record management handler
  const handleSaveAllRecords = (recordsData: Array<Omit<HabitRecord, 'id' | 'createdAt'>>) => {
    // 批量处理所有记录
    const newRecords: HabitRecord[] = [];
    const updatedRecordIds: string[] = [];
    
    // 处理每条记录
    recordsData.forEach(recordData => {
      // 检查是否已存在
      const existingRecord = state.records.find(
        r => r.habitId === recordData.habitId && r.date === recordData.date
      );
      
      // 创建新记录对象
      const newRecord: HabitRecord = {
        id: existingRecord ? existingRecord.id : generateId(),
        createdAt: existingRecord ? existingRecord.createdAt : new Date().toISOString(),
        ...recordData
      };
      
      // 保存到localStorage
      storage.addRecord(newRecord);
      
      // 收集新记录，用于后续批量更新状态
      newRecords.push(newRecord);
      if (existingRecord) {
        updatedRecordIds.push(existingRecord.id);
      }
    });
    
    // 一次性更新React状态
    setState(prev => {
      // 过滤掉已更新的记录
      const filteredRecords = prev.records.filter(r => !updatedRecordIds.includes(r.id));
      // 添加所有新记录
      return {
        ...prev,
        records: [...filteredRecords, ...newRecords]
      };
    });
  };

  // Render appropriate page
  const renderCurrentPage = () => {

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
            onSaveAllRecords={handleSaveAllRecords}
          />
        );
      case 'settings':
        return <SettingsPage />;
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


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <Header
        currentPage={state.currentPage}
        onNavigate={handleNavigate}
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