import React, { useState, useEffect, useRef } from 'react';
import { Target, BarChart3, Calendar, List, Cog } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

export const Header: React.FC = () => {
  // 使用 selector 精确订阅需要的状态
  const currentPage = useUIStore(state => state.currentPage);
  const navigateTo = useUIStore(state => state.navigateTo);
  
  // 滚动方向检测状态
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const scrollThreshold = 20; // 滚动阈值，超过这个值才触发隐藏/显示
  const headerRef = useRef<HTMLElement>(null);
  
  // 处理滚动事件
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // 计算滚动方向和距离
      const scrollingDown = currentScrollY > lastScrollY;
      const scrollDifference = Math.abs(currentScrollY - lastScrollY);
      
      // 只有当滚动距离超过阈值时才改变状态
      if (scrollDifference > scrollThreshold) {
        // 向下滚动且不在页面顶部时隐藏
        if (scrollingDown && currentScrollY > 60) {
          setIsVisible(false);
        } else {
          // 向上滚动或在页面顶部时显示
          setIsVisible(true);
        }
        
        setLastScrollY(currentScrollY);
      }
    };
    
    // 添加滚动事件监听
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // 清理函数
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);
  const navItems = [
    { id: 'dashboard', label: '仪表板', icon: BarChart3 },
    { id: 'record', label: '记录', icon: Calendar },
    { id: 'habits', label: '习惯', icon: List },
    { id: 'settings', label: '设置', icon: Cog },
  ];

  return (
    <header 
      ref={headerRef}
      className={`bg-white/95 backdrop-blur-md border-b border-gray-200/80 sticky z-50 transition-all duration-500 ${
        isVisible 
          ? 'top-0 translate-y-0 shadow-lg shadow-gray-200/50' 
          : '-top-full translate-y-0 md:translate-y-0 md:top-0 md:-translate-y-full shadow-xl shadow-gray-300/60'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">习惯流</h1>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => navigateTo(item.id as 'dashboard' | 'habits' | 'record' | 'settings')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    currentPage === item.id
                      ? 'bg-blue-100 text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Empty space for layout balance */}
          <div className="w-10"></div>
        </div>

        {/* 移除重复的移动端导航栏 */}
        
        {/* 固定在底部的移动导航栏，当Header隐藏时显示 */}
        <div className={`fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200/80 md:hidden z-50 transition-all duration-500 shadow-2xl shadow-gray-300/40 ${isVisible ? 'translate-y-full' : 'translate-y-0'}`}>
          <div className="flex justify-around items-center py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    navigateTo(item.id as 'dashboard' | 'habits' | 'record' | 'settings');
                    // 点击导航项后确保Header可见
                    setIsVisible(true);
                  }}
                  className={`flex flex-col items-center p-2 ${
                    currentPage === item.id
                      ? 'text-blue-600'
                      : 'text-gray-500'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs mt-1">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};