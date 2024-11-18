import { customFetch } from '@/lib/actions/customFetch';
import useRouterHook from "../hooks/router-hook";
import useAuthStore from "../hooks/auth-store";
import { use } from 'react';

// 用户登录
export async function fetchLogin(email: string, password: string) {
    try {
        const result = await customFetch(`/api/login`, {
            method: "POST",
            body: JSON.stringify({ email, password }),
        });

        // 登录成功后设置用户数据
        const { setUserData } = useAuthStore.getState();
        console.log(result);
        setUserData({
            email,
            name: result.user.name,
            password,
            userType: result.user.user_type,
            token: result.token,
            id: result.user._id,
            apiKey: result.user.api_key,
        });

        alert("登录成功");
        return result;
    } catch (error) {
        alert("登录失败，请重试");
        throw new Error("Login failed.");
    }
}

// 用户注册
export async function fetchRegister(email: string, name: string, password: string, user_type: string) {
    try {
        alert(email + name + password + user_type);
        const result = await customFetch(`/api/register`, {
            method: "POST",
            body: JSON.stringify({ email, name, password, user_type }),
        });

        alert("注册成功");
        return result;
    } catch (error) {
        alert("注册失败，请重试");
        const errorDetails = error.message;
        throw new Error(`Registration failed: ${errorDetails}`);
    }
}
