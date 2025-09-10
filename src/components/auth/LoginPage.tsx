import React from 'react';
import { LogIn, Target, BarChart3, Calendar } from 'lucide-react';
import { User } from '../../types';
import { generateId } from '../../utils/dateUtils';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  // Simulate Google OAuth login
  const handleGoogleLogin = () => {
    // In a real app, this would redirect to Google OAuth
    const mockUser: User = {
      id: generateId(),
      name: '演示用户',
      email: 'demo@example.com',
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?w=100&h=100&fit=crop&crop=face',
      googleId: 'google_' + generateId()
    };
    onLogin(mockUser);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-6">
              <Target className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">习惯流</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              通过智能习惯追踪和精美的数据分析，将您的日常习惯转化为持久的成就。
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/20 shadow-lg">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">智能习惯类型</h3>
              <p className="text-gray-600">追踪数值、时长、时间点和简单签到，支持自定义单位和目标。</p>
            </div>

            <div className="text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/20 shadow-lg">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">可视化分析</h3>
              <p className="text-gray-600">精美的图表和热力图帮助您了解进度并识别模式。</p>
            </div>

            <div className="text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/20 shadow-lg">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">灵活记录</h3>
              <p className="text-gray-600">快速每日记录，支持补录遗漏的日期和可选的备注信息。</p>
            </div>
          </div>

          {/* Login Button */}
          <div className="text-center">
            <button
              onClick={handleGoogleLogin}
              className="inline-flex items-center gap-3 px-8 py-4 bg-white text-gray-700 font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 hover:border-gray-300 group"
            >
              <div className="w-6 h-6 bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 rounded-full flex items-center justify-center">
                <LogIn className="w-4 h-4 text-white" />
              </div>
              <span className="group-hover:scale-105 transition-transform">使用 Google 登录</span>
            </button>
            <p className="text-sm text-gray-500 mt-4">
              在生产环境中，这将使用真实的 Google OAuth 2.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};