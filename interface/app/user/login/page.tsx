"use client";

import { useState, useCallback } from 'react';
import { fetchLogin } from '@/lib/actions';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = useCallback(async () => {
    console.log('Email:', email, 'Password:', password);
    const result = await fetchLogin(email, password);
    if (result.token) {
      router.push('/');
    }
  }, [email, password, router]);

  return (
    <div className='user_container'>
      <h2>登录</h2>
      <div className='input_field_container'>
        <input
          className='input_field'
          type="email"
          placeholder="邮箱"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className='input_field'
          type="password"
          placeholder="密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className='user_type_button' onClick={handleLogin}>
          登录
        </button>
      </div>

    </div>
  );
}
