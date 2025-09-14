import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// 控制自定义启动页显示时间
const hideSplashScreen = () => {
  // 设置延迟时间，这里设置为3秒，您可以根据需要调整
  const SPLASH_DURATION = 1000; // 1秒，单位毫秒
  
  setTimeout(() => {
    const splashScreen = document.getElementById('custom-splash-screen');
    if (splashScreen) {
      // 先淡出效果
      splashScreen.style.opacity = '0';
      
      // 等待淡出动画完成后移除元素
      setTimeout(() => {
        splashScreen.style.display = 'none';
      }, 500); // 500毫秒对应CSS中的transition时间
    }
  }, SPLASH_DURATION);
};

// 在页面加载完成后执行
window.addEventListener('load', hideSplashScreen);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
