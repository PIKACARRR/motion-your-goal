import React, { useRef, useEffect } from "react";
import { toast } from 'react-toastify';
import '../style/SettingsPanel.css';

export default function GoogleAuthBar({
  globalAccessToken,
  globalUserName,
  setGlobalAccessToken,
  setGlobalUserName,
  setGlobalUserEmail // 新增 email setter
}) {
  const accessToken = globalAccessToken;
  const userName = globalUserName;
  const tokenClient = useRef(null);

  useEffect(() => {
    let isMounted = true;
    console.log('[GoogleAuthBar] useEffect mount, isMounted:', isMounted);
    const initializeGoogleClient = () => {
      console.log('[GoogleAuthBar] initializeGoogleClient called');
      if (window.google && window.google.accounts && window.google.accounts.oauth2) {
        console.log('[GoogleAuthBar] Google OAuth2 available, initializing tokenClient');
        tokenClient.current = window.google.accounts.oauth2.initTokenClient({
          client_id: "164779046247-32plpf686mbgasdick4hhvp5bh8aj3k2.apps.googleusercontent.com",
          // 🔥 增加更多權限範圍
          scope: "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email openid",
          prompt: "consent",
          callback: async (tokenResponse) => {
            console.log('[GoogleAuthBar] tokenClient callback', tokenResponse);
            if (!isMounted) {
              console.warn('[GoogleAuthBar] isMounted false, return');
              return;
            }
            if (tokenResponse.error) {
              console.error('[GoogleAuthBar] tokenResponse.error', tokenResponse.error);
              toast.error("登入失敗: " + tokenResponse.error);
              return;
            }
            setGlobalAccessToken(tokenResponse.access_token);
            localStorage.setItem("google_access_token", tokenResponse.access_token);
            
            try {
              const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
              });
              const user = await res.json();
              
              console.log('=== Google 使用者資訊詳細 ===');
              console.log('完整 user 物件:', user);
              console.log('user.name:', user.name);
              console.log('user.email:', user.email);
              console.log('user.sub (Google ID):', user.sub);
              console.log('user.given_name:', user.given_name);
              console.log('user.family_name:', user.family_name);
              console.log('============================');
              
              if (isMounted) {
                setGlobalUserName(user.name);
                localStorage.setItem("google_user_name", user.name);
                
                // 🔥 多重策略取得唯一識別
                let userIdentifier = null;
                
                if (user.email) {
                  // 策略 1: 使用 email
                  userIdentifier = user.email;
                  console.log('✅ 使用 email 作為識別:', userIdentifier);
                } else if (user.sub) {
                  // 策略 2: 使用 Google ID + 部分名稱
                  const safeName = user.name ? user.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '') : 'user';
                  userIdentifier = `${safeName}_${user.sub.slice(-8)}`;
                  console.log('⚠️ email 為空，使用 Google ID:', userIdentifier);
                } else {
                  // 策略 3: 使用名稱 + 時間戳
                  const safeName = user.name ? user.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '') : 'user';
                  userIdentifier = `${safeName}_${Date.now()}`;
                  console.log('⚠️ 無 email 和 ID，使用名稱+時間:', userIdentifier);
                }
                
                if (setGlobalUserEmail && userIdentifier) {
                  setGlobalUserEmail(userIdentifier);
                  localStorage.setItem("google_user_email", userIdentifier);
                  
                  // 確認是否成功寫入
                  setTimeout(() => {
                    const savedEmail = localStorage.getItem("google_user_email");
                    console.log('📄 localStorage 確認 identifier:', savedEmail);
                  }, 100);
                  
                } else {
                  console.error('❌ 無法設定用戶識別:', { 
                    setGlobalUserEmail: !!setGlobalUserEmail, 
                    userIdentifier 
                  });
                }
                toast.success(`登入成功：${user.name}`);
              } else {
                console.warn('[GoogleAuthBar] isMounted false after userinfo, return');
              }
            } catch (error) {
              console.error('[GoogleAuthBar] userinfo fetch error', error);
              toast.error("獲取使用者資訊失敗");
            }
          },
          error_callback: (error) => {
            console.error('[GoogleAuthBar] error_callback', error);
            toast.error("登入過程發生錯誤: " + error.type);
          }
        });
      } else {
        console.warn('[GoogleAuthBar] Google OAuth2 not ready, retrying...');
        setTimeout(() => {
          if (isMounted) initializeGoogleClient();
        }, 100);
      }
    };
    initializeGoogleClient();
    return () => {
      isMounted = false;
      console.log('[GoogleAuthBar] useEffect cleanup, isMounted set to', isMounted);
    };
  }, [setGlobalAccessToken, setGlobalUserName, setGlobalUserEmail]);

  const handleLogin = () => {
    console.log('[GoogleAuthBar] handleLogin called, tokenClient.current:', tokenClient.current);
    if (tokenClient.current) {
      try {
        tokenClient.current.requestAccessToken();
        console.log('[GoogleAuthBar] requestAccessToken called');
      } catch (error) {
        console.error('[GoogleAuthBar] requestAccessToken error', error);
        toast.error("登入請求失敗: " + error.message);
      }
    } else {
      console.error('[GoogleAuthBar] Google 登入服務未準備就緒');
      toast.error("Google 登入服務未準備就緒，請稍後再試");
    }
  };
  
  const handleLogout = () => {
    console.log('[GoogleAuthBar] handleLogout called');
    setGlobalAccessToken(null);
    setGlobalUserName(null);
    if (setGlobalUserEmail) setGlobalUserEmail(null);
    localStorage.removeItem("google_access_token");
    localStorage.removeItem("google_user_name");
    localStorage.removeItem("google_user_email");
    toast.info("已登出");
  };

  return (
    <div style={{ position: "absolute", top: 10, right: 40, zIndex: 9999 }}>
      {console.log('[GoogleAuthBar] render', { accessToken, userName })}
      {!accessToken ? (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={handleLogin} style={{ background: '#4285F4', color: 'white', border: 'none', borderRadius: 6, padding: '8px 18px', fontSize: 18, cursor: 'pointer' }}>登入 Google</button>
        </div>
      ) : (
        <div className="login-status">
          ✅ {userName} 已登入
          <button onClick={handleLogout} style={{ marginLeft: 10, background: '#eee', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 16, cursor: 'pointer' }}>登出</button>
        </div>
      )}
    </div>
  );
}