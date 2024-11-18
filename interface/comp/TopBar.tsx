'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import useAuthStore from '@/lib/hooks/auth-store';
import Link from 'next/link';
import { fetchSetAPIKey, fetchLogin } from '@/lib/actions';
import { FaImages, FaFileAlt, FaCommentAlt, FaHistory, FaStar } from 'react-icons/fa';
import { FeedbackFish } from '@feedback-fish/react'
import './TopBar.css'

export default function TopBar() {
    const pathname = usePathname();
    const [key, setKey] = useState(0);
    useEffect(() => {
        setKey(prevKey => prevKey + 1);
    }, [pathname]);

    const authStore = useAuthStore();
    const [showForm, setShowForm] = useState(false);
    const [userType, setUserType] = useState(null);

    useEffect(() => {
        if (authStore.userType) {
            setUserType(authStore.userType);
        }
    }, [authStore.userType]);

    const handleLogout = () => {
        authStore.clearUserData();
    };

    const toggleForm = () => {
        setShowForm(!showForm);
    };

    const handleApiKeySubmit = async () => {
        if (authStore.apiKey) {
            await fetchSetAPIKey(authStore.apiKey);
            alert('API Key 已保存');
            await fetchLogin(authStore.email, authStore.password);
        } else {
            alert('请输入有效的 API Key');
        }
    };

    const [initials, setInitials] = useState('');
    useEffect(() => {
        if (authStore.name) {
            setInitials(authStore.name.substring(0, 2));
        }
    }, [authStore.name]);

    return (
        <>
            <div className="top-bar-wrapper">
                <h1 className="text-2xl font-bold ml-5" style={{ marginTop: '3rem' }}> InnoWeaver </h1>
                <hr style={{ width: '80%', marginLeft: '1rem', marginTop: '0.3rem' }} />

                <div className="flex flex-col items-start flex-grow w-full mt-4">
                    <Link className="router" href="/">
                        <FaCommentAlt className='text-lg' />
                        <div className='ml-3'>
                            Chat
                        </div>
                    </Link>
                    <Link className="router" href="/gallery">
                        <FaImages className='text-lg' />
                        <div className='ml-3'>
                            Gallery
                        </div>
                    </Link>
                    <Link className="router" href="/paper">
                        <FaFileAlt className='text-lg' />
                        <div className='ml-3'>
                            Papers
                        </div>
                    </Link>
                </div>

                <div className="flex flex-col items-start flex-grow w-full" style={{ marginTop: '30rem' }}>
                    <>
                        <Link className="router" href="/user/history">
                            <FaHistory className='text-lg' />
                            <div className='ml-3'>
                                History
                            </div>
                        </Link>
                        <Link className="router" href="/user/favlist">
                            <FaStar className='text-lg' />
                            <div className='ml-3'>
                                Favorite
                            </div>
                        </Link>
                    </>
                </div>

                <FeedbackFish projectId="99f3739e6a24ef" userId={authStore.email}>
                    <button className='ml-6 mb-3 font-semibold' style={{ color: '#00FFFF' }}>
                        反馈
                    </button>
                </FeedbackFish>
            </div>

            <div className="user-bar-wrapper">
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    width: '100%',
                }}>
                    {/* <div className='flex flex-col items-end w-full'> */}
                    <button className="avatar" onClick={toggleForm}>
                        {initials || 'DI'}
                    </button>
                    {showForm && (
                        <div className="form-wrapper">
                            <div className="form-container">
                                {/* 用户信息显示区域 */}
                                {["email", "name", "userType"].map((field) => (
                                    <div key={field} className="user-info-container">
                                        <p>
                                            <strong>{field.charAt(0).toUpperCase() + field.slice(1)}: </strong>
                                            {authStore[field]}
                                        </p>
                                    </div>
                                ))}

                                {/* API 输入和保存区域 */}
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

                                {/* 登录/登出按钮 */}
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
        </>
    );
}

TopBar.whyDidYouRender = true;
