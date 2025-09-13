import { useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Dashboard } from './components/dashboard/Dashboard';
import { HabitList } from './components/habits/HabitList';
import { HabitForm } from './components/habits/HabitForm';
import { RecordPage } from './components/record/RecordPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { useHabitStore } from './stores/habitStore';
import { useUIStore } from './stores/uiStore';

function App() {
  // 从 store 获取数据初始化方法
  const loadInitialData = useHabitStore(state => state.loadInitialData);
  const currentPage = useUIStore(state => state.currentPage);

  // 应用启动时加载数据
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Render appropriate page
  const renderCurrentPage = () => {

    switch (currentPage) {
      case 'habits':
        return <HabitList />;
      case 'record':
        return <RecordPage />;
      case 'settings':
        return <SettingsPage />;
      case 'dashboard':
      default:
        return <Dashboard />;
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {renderCurrentPage()}
      </main>

      <HabitForm />
    </div>
  );
}

export default App;