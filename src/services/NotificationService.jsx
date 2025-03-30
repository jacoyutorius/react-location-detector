import React, { useState, useEffect } from 'react';
import './NotificationService.css';

/**
 * 通知を送信する
 * @param {string} title 通知のタイトル
 * @param {string} message 通知のメッセージ
 */
export const sendNotification = (title, message) => {
  // アプリ内通知用のイベントを発火
  const event = new CustomEvent('app-notification', {
    detail: { title, message }
  });
  window.dispatchEvent(event);
};

/**
 * アプリ内通知コンポーネント
 */
export const AppNotification = () => {
  const [notifications, setNotifications] = useState([]);
  
  useEffect(() => {
    // アプリ内通知イベントをリッスン
    const handleAppNotification = (event) => {
      const { title, message } = event.detail;
      const id = Date.now();
      
      // 通知を追加
      setNotifications(prev => [...prev, { id, title, message }]);
      
      // 5秒後に通知を削除
      setTimeout(() => {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, fadeOut: true } : n)
        );
        
        // フェードアウトアニメーション後に削除
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== id));
        }, 300);
      }, 5000);
    };
    
    window.addEventListener('app-notification', handleAppNotification);
    return () => window.removeEventListener('app-notification', handleAppNotification);
  }, []);
  
  if (notifications.length === 0) return null;
  
  return (
    <div className="app-notifications">
      {notifications.map(notification => (
        <div 
          key={notification.id} 
          className={`app-notification ${notification.fadeOut ? 'fade-out' : ''}`}
        >
          <h4>{notification.title}</h4>
          <p>{notification.message}</p>
        </div>
      ))}
    </div>
  );
};
