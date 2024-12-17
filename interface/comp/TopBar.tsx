'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import useAuthStore from '@/lib/hooks/auth-store';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { fetchSetAPIKey, fetchLogin } from '@/lib/actions';
import { FaImages, FaFileAlt, FaCommentAlt, FaHistory, FaStar } from 'react-icons/fa';
import { FeedbackFish } from '@feedback-fish/react';
import './TopBar.css';
import * as styledComponents from './TopBar.styles'; // 引入TopBar.styles.tsx

// 自定义通知框组件
const Notification = ({ message, onClose }) => (
  <styledComponents.Notification>
    {message}
    <styledComponents.NotificationClose onClick={onClose}>
      Close
    </styledComponents.NotificationClose>
  </styledComponents.Notification>
);

export default function TopBar() {
  const pathname = usePathname();
  const [key, setKey] = useState(0);
  const authStore = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [userType, setUserType] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    setKey(prevKey => prevKey + 1);
    if (authStore.userType) {
      setUserType(authStore.userType);
    }
  }, [pathname, authStore.userType]);

  const handleLogout = () => {
    authStore.clearUserData();
  };

  const toggleForm = () => {
    setShowForm(!showForm);
  };

  const handleApiKeySubmit = async () => {
    if (authStore.apiKey) {
      await fetchSetAPIKey(authStore.apiKey);
      setNotification('API Key 已保存');
      setTimeout(() => {
        setNotification(null);
      }, 3000); // 3秒后自动关闭通知
      await fetchLogin(authStore.email, authStore.password);
    } else {
      setNotification('请输入有效的 API Key');
      setTimeout(() => {
        setNotification(null);
      }, 3000); // 3秒后自动关闭通知
    }
  };

  const [initials, setInitials] = useState('');
  useEffect(() => {
    if (authStore.name) {
      setInitials(authStore.name.substring(0, 2));
    }
  }, [authStore.name]);

  const [theme, setTheme] = useState(() => {
    if (typeof document !== "undefined") {
      return document.body.className || "light";
    }
    return "light";
  });

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.body.className = newTheme;
    const event = new CustomEvent("themeChange", { detail: newTheme });
    window.dispatchEvent(event);
  };

  return (
    <>
      <motion.div
        className="top-bar-wrapper"
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div className='mt-4 w-full'>
          <h1 className="text-2xl font-bold mt-8 ml-2">
            <span className='text-text-primary'>Inno</span>
            <span className='text-text-placeholder'>Weaver</span>
          </h1>
          <hr style={{ width: '80%' }} className='border-border-line mt-1 ml-2' />
        </div>

        <div className="flex flex-col items-start flex-grow w-full mt-6 font-semibold text-lg">
          <Link className="w-full flex items-center mb-4 p-2 rounded-2xl text-text-primary transition-colors duration-300 hover:bg-secondary"
            href="/">
            <FaCommentAlt className='text-xl' />
            <div className='ml-3'>
              Chat
            </div>
          </Link>
          <Link className="w-full flex items-center mb-4 p-2 rounded-2xl text-text-primary transition-colors duration-300 hover:bg-secondary"
            href="/gallery">
            <FaImages className='text-xl' />
            <div className='ml-3'>
              Gallery
            </div>
          </Link>
          <Link className="w-full flex items-center mb-4 p-2 rounded-2xl text-text-primary transition-colors duration-300 hover:bg-secondary"
            href="/paper">
            <FaFileAlt className='text-xl' />
            <div className='ml-3'>
              Papers
            </div>
          </Link>
        </div>

        <div className="flex flex-col justify-end items-end h-full w-full mb-6 font-semibold text-lg">
          <Link className="w-full flex items-center mb-4 p-2 rounded-2xl text-text-primary transition-colors duration-300 hover:bg-secondary"
            href="/user/history">
            <FaHistory className='text-xl' />
            <div className='ml-3'>
              History
            </div>
          </Link>
          <Link className="w-full flex items-center mb-4 p-2 rounded-2xl text-text-primary transition-colors duration-300 hover:bg-secondary"
            href="/user/favlist">
            <FaStar className='text-xl' />
            <div className='ml-3'>
              Favorite
            </div>
          </Link>
          <button
            onClick={toggleTheme}
            className="relative flex items-center p-2 mb-3 text-2xl rounded-full bg-secondary transition-colors duration-300"
            style={{ width: '8rem', borderRadius: '9999px', }}
          >
            <div
              className="absolute bg-primary shadow-md"
              style={{
                width: '2.5rem',
                height: '2.5rem',
                transform: theme === "dark" ? "translateX(0)" : "translateX(4.5rem)",
                transition: "transform 0.3s ease, background-color 0.3s ease",
                borderRadius: '9999px',
              }}
            ></div>
            <div className="flex justify-between w-full px-2">
              <span>☀️</span>
              <span>🌙</span>
            </div>
          </button>
        </div>

        <FeedbackFish projectId="99f3739e6a24ef" userId={authStore.email}>
          <button className='ml-6 mb-6 font-semibold text-lg' style={{ color: '#00FFFF' }}>
            反馈
          </button>
        </FeedbackFish>
      </motion.div>

      <div className="user-bar-wrapper">
        <div className='flex flex-col w-full' style={{ alignItems: "flex-end" }}>
          <button className="avatar" onClick={toggleForm}>
            {initials || 'DI'}
          </button>
          {showForm && (
            <div className="form-wrapper">
              <div className="form-container">
                {["email", "name", "userType"].map((field) => (
                  <div key={field} className="user-info-container">
                    <p>
                      <strong>{field.charAt(0).toUpperCase() + field.slice(1)}: </strong>
                      {authStore[field]}
                    </p>
                  </div>
                ))}

                <div className="api-container">
                  <p>API:</p>
                  <input
                    type="text"
                    placeholder={authStore.apiKey ? '' : "Enter OpenAI API Key"}
                    value={authStore.apiKey}
                    onChange={(e) => authStore.setUserData({ apiKey: e.target.value })}
                    className="api-input"
                  />
                  <button onClick={handleApiKeySubmit} className="api-save-button">
                    Save
                  </button>
                </div>

                <div className="buttons-container">
                  {localStorage.getItem('token') ? (
                    <button
                      className="submit-button bg-blue-500"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  ) : (
                    <>
                      <Link href="/user/login" className="submit-button bg-green-600">
                        Sign In
                      </Link>
                      <Link href="/user/register" className="submit-button bg-blue-500">
                        Sign Up
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notification */}
      {notification && <Notification message={notification} onClose={() => setNotification(null)} />}
    </>
  );
}

TopBar.whyDidYouRender = true;