import React, { useState } from 'react';
import { Download, Trash2, Database, AlertTriangle, Upload } from 'lucide-react';
import { storage } from '../../utils/storage';
export const SettingsPage: React.FC = () => {
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      // 导出数据的简化版本
      const data = {
        habits: storage.getAllHabits(),
        records: storage.getAllRecords()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `habit-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert('数据导出成功');
    } catch (error) {
      console.error('Export error:', error);
      alert('导出失败，请重试');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportMessage('');

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          
          // 检查数据有效性
          if (!(data.habits && Array.isArray(data.habits)) && 
              !(data.records && Array.isArray(data.records))) {
            throw new Error('导入的数据格式不正确');
          }
          
          // 在导入前先清空现有数据
          storage.clearAll();
          
          // 导入习惯
          if (data.habits && Array.isArray(data.habits)) {
            // 一次性设置所有习惯，而不是一个个添加
            storage.setHabits(data.habits);
          }
          
          // 导入记录
          if (data.records && Array.isArray(data.records)) {
            // 一次性设置所有记录，而不是一个个添加
            storage.setRecords(data.records);
          }
          
          setImportMessage('数据导入成功，页面将在2秒后刷新');
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } catch (error) {
          console.error('Parse error:', error);
          setImportMessage('导入失败，数据格式不正确');
        }
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error('Import error:', error);
      setImportMessage('导入失败，请重试');
    } finally {
      setImporting(false);
      // 清空文件输入
      event.target.value = '';
    }
  };

  const handleClearData = async () => {
    if (!confirm('确定要清空所有数据吗？此操作不可恢复！建议先导出备份。')) return;
    
    try {
      // 清空所有数据
      storage.clearAll();
      
      alert('数据已清空');
      window.location.reload();
    } catch (error) {
      console.error('Clear data error:', error);
      alert('清空失败，请重试');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">设置</h1>

      <div className="space-y-6">
        {/* 数据管理 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Database className="h-5 w-5 mr-2 text-blue-600" />
            <h2 className="text-xl font-semibold">数据管理</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-2">导出数据</h4>
              <p className="text-sm text-gray-600 mb-3">
                将所有习惯和记录数据导出为 JSON 文件，可用于备份或迁移到其他设备。
              </p>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleExport}
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 flex items-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  导出数据
                </button>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">导入数据</h4>
              <p className="text-sm text-gray-600 mb-3">
                从之前导出的 JSON 文件恢复数据。注意：这将覆盖当前所有数据。
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={importing}
                className="hidden"
              />
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing}
                  className="px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {importing ? '导入中...' : '选择文件导入'}
                </button>
                {importing && (
                  <span className="text-sm text-gray-500">处理中...</span>
                )}
              </div>
              {importMessage && (
                <p className={`text-sm mt-2 ${importMessage.includes('成功') ? 'text-green-600' : 'text-red-600'}`}>
                  {importMessage}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 应用信息 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">应用信息</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">版本</span>
              <span>1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">存储方式</span>
              <span>本地浏览器 (localStorage)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">数据位置</span>
              <span>仅存储在您的设备上</span>
            </div>
          </div>
        </div>

        {/* 隐私说明 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">隐私保护</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p>✅ 所有数据都存储在您的本地浏览器中</p>
            <p>✅ 不会上传任何数据到服务器</p>
            <p>✅ 支持完全离线使用</p>
            <p>✅ 您完全掌控自己的数据</p>
            <p>⚠️ 清除浏览器数据会丢失所有记录，请定期导出备份</p>
          </div>
        </div>

        {/* 危险操作 */}
        <div className="bg-white rounded-xl border border-red-200 p-6">
          <div className="flex items-center mb-4 text-red-600">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <h2 className="text-xl font-semibold">危险操作</h2>
          </div>
          <div>
            <h4 className="font-medium mb-2 text-red-600">清空所有数据</h4>
            <p className="text-sm text-gray-600 mb-3">
              这将永久删除所有习惯和记录数据，此操作不可恢复。
            </p>
            <button
              onClick={handleClearData}
              className="px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all duration-200 flex items-center"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              清空所有数据
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}