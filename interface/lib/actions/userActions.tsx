import { customFetch } from '@/lib/actions/customFetch';
import useRouterHook from "../hooks/router-hook";
import useAuthStore from "../hooks/auth-store";

// 简单的通知函数
function showNotification(message: string, type: 'info' | 'success' | 'error' = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.style.position = 'fixed';
  notification.style.top = '20px';
  notification.style.right = '20px';
  notification.style.padding = '10px 20px';
  notification.style.borderRadius = '5px';
  notification.style.color = '#fff';
  notification.style.backgroundColor = type === 'info' ? '#4CAF50' :
                                          type === 'success' ? '#4CAF50' :
                                          type === 'error' ? '#f44336' : '#2196F3';
  notification.style.zIndex = '1000';

  const closeButton = document.createElement('button');
  closeButton.innerText = 'Close';
  closeButton.onclick = () => notification.remove();
  notification.appendChild(closeButton);

  const textNode = document.createTextNode(message);
  notification.appendChild(textNode);

  document.body.appendChild(notification);

  // 自动关闭通知
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

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

    showNotification("登录成功", 'success');
    return result;
  } catch (error) {
    showNotification("登录失败，请重试", 'error');
    throw new Error("Login failed.");
  }
}

// 用户注册
export async function fetchRegister(email: string, name: string, password: string, user_type: string) {
  try {
    const result = await customFetch(`/api/register`, {
      method: "POST",
      body: JSON.stringify({ email, name, password, user_type }),
    });

    showNotification("注册成功", 'success');
    return result;
  } catch (error) {
    showNotification("注册失败，请重试", 'error');
    const errorDetails = error.message;
    throw new Error(`Registration failed: ${errorDetails}`);
  }
}