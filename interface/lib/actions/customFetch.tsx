import React, { createContext, useContext, useState } from 'react';

// 创建 NotificationContext
const NotificationContext = createContext(null);

// NotificationProvider 组件
export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    // 添加通知
    const addNotification = (message, type = 'info') => {
        setNotifications([...notifications, { message, type, id: Date.now() }]);
    };

    // 移除通知
    const removeNotification = (id) => {
        setNotifications(notifications.filter(notification => notification.id !== id));
    };

    return (
        <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
            {children}
            <div className="notification-container">
                {notifications.map(notification => (
                    <div key={notification.id} className={`notification ${notification.type}`}>
                        {notification.message}
                        <button onClick={() => removeNotification(notification.id)}>Close</button>
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
};

// 自定义通知函数
export function useNotification() {
    const { addNotification } = useContext(NotificationContext);
    return addNotification;
}

function handleUnauthorizedError() {
    localStorage.removeItem("token");

    // 使用自定义通知函数
    const addNotification = useNotification();
    addNotification("Your session has expired. Please log in again.", 'error');
    window.location.href = '/user/login';
}

export async function customFetch(url, options = {}) {
    const apiUrl = process.env.API_URL;
    const token = localStorage.getItem("token");

    const headers = {
        "Content-Type": "application/json",
        ...(token && { "Authorization": `Bearer ${token}` }),
        // ...options.headers,
    };

    console.log(`${apiUrl}${url}`);
    const response = await fetch(`${apiUrl}${url}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        handleUnauthorizedError();
        throw new Error('Unauthorized: Token has expired or is invalid.');
    }

    if (!response.ok) {
        const errorDetails = await response.json();
        throw new Error(`Error: ${response.status} ${response.statusText} - ${JSON.stringify(errorDetails)}`);
    }

    return response.json();
}