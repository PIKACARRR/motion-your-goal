
import React, { useRef, useEffect } from "react";
import { toast } from 'react-toastify';
import '../style/SettingsPanel.css';

export default function GoogleAuthBar({
  globalAccessToken,
  globalUserName,
  setGlobalAccessToken,
  setGlobalUserName
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
          scope: "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.profile",
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
              console.log('[GoogleAuthBar] userinfo response', user);
              if (isMounted) {
                setGlobalUserName(user.name);
                localStorage.setItem("google_user_name", user.name);
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
  }, [setGlobalAccessToken, setGlobalUserName]);

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
    localStorage.removeItem("google_access_token");
    localStorage.removeItem("google_user_name");
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
