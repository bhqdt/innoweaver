"use client";

// pages/user/[id].js
import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

const UserPage = () => {
    const router = useRouter();
    const { id } = useParams();

    // useEffect(() => {
    //     // 在页面加载时重定向到 localhost:3000
    //     if (id) {
    //         router.push('/');  // 重定向到主页
    //     }
    // }, [id, router]);  // 依赖于 id 和 router

    // return null; // 该页面不需要渲染内容
};

export default UserPage;
