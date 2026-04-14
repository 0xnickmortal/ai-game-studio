'use client';

import React, { useState, useEffect } from 'react';

interface LandingPageProps {
  hasInvalidCode?: boolean;
}

type Lang = 'en' | 'zh';

const i18n = {
  en: {
    nav: 'Private Preview',
    badge: '✦  AI · Godot · Multi-Agent',
    headline: ['From idea to playable game,', 'in a single conversation.'],
    sub: 'AI Game Studio orchestrates 48 specialized agents — designers, programmers, artists — through Claude Code to brainstorm, design, and prototype your game end to end.',
    inputPlaceholder: 'Enter invite code',
    enter: 'Enter →',
    invalid: 'Invalid invite code',
    hint: "Don't have a code? Reach out for access.",
    features: [
      { title: 'Brainstorm', desc: 'Concept ideation guided by a creative director agent' },
      { title: 'Design',     desc: 'GDDs, mechanics, art direction, level layouts' },
      { title: 'Prototype',  desc: 'Working Godot project — playable in minutes' },
    ],
    footer: '© 2026 AI Game Studio',
    status: 'System operational',
  },
  zh: {
    nav: '内测版本',
    badge: '✦  AI · Godot · 多智能体',
    headline: ['从一个想法到可玩游戏，', '只需一次对话。'],
    sub: 'AI Game Studio 通过 Claude Code 协调 48 个专业 AI 代理——设计师、程序员、美术师——为你完成从创意构思到可玩原型的全流程。',
    inputPlaceholder: '输入邀请码',
    enter: '进入 →',
    invalid: '邀请码无效',
    hint: '没有邀请码？联系我们获取访问权限。',
    features: [
      { title: '创意构思', desc: '由创意总监 AI 引导的概念头脑风暴' },
      { title: '游戏设计', desc: 'GDD、玩法机制、美术方向、关卡布局' },
      { title: '原型开发', desc: '完整 Godot 项目，几分钟内可玩' },
    ],
    footer: '© 2026 AI Game Studio',
    status: '服务运行中',
  },
} as const;

export default function LandingPage({ hasInvalidCode }: LandingPageProps) {
  const [lang, setLang] = useState<Lang>('en');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  // Restore language preference + browser locale fallback
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('landing-lang') : null;
    if (saved === 'zh' || saved === 'en') {
      setLang(saved);
    } else if (typeof navigator !== 'undefined' && navigator.language?.startsWith('zh')) {
      setLang('zh');
    }
  }, []);

  // Sync invalid code error after language is set
  useEffect(() => {
    setError(hasInvalidCode ? i18n[lang].invalid : '');
  }, [hasInvalidCode, lang]);

  const t = i18n[lang];

  const switchLang = (next: Lang) => {
    setLang(next);
    try { localStorage.setItem('landing-lang', next); } catch { /* ignore */ }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setError('');
    window.location.href = `/?code=${encodeURIComponent(code.trim())}`;
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#000',
        color: '#f7f8f8',
        fontFamily: '"Inter", -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top nav */}
      <nav
        style={{
          padding: '20px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #27272a',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 4,
              background: '#5e6ad2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '-0.3px',
            }}
          >
            AI
          </div>
          <span style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.16px' }}>
            AI Game Studio
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Language toggle */}
          <div
            style={{
              display: 'flex',
              border: '1px solid #27272a',
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            {(['en', 'zh'] as const).map((l) => (
              <button
                key={l}
                onClick={() => switchLang(l)}
                style={{
                  background: lang === l ? 'rgba(255,255,255,0.06)' : 'transparent',
                  color: lang === l ? '#fff' : '#767d88',
                  border: 'none',
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: '0.35px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s ease',
                }}
              >
                {l === 'en' ? 'EN' : '中'}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 11, color: '#767d88', textTransform: 'uppercase', letterSpacing: '0.35px' }}>
            {t.nav}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px 24px',
          width: '100%',
          maxWidth: 880,
          margin: '0 auto',
          textAlign: 'center',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: '#767d88',
            textTransform: 'uppercase',
            letterSpacing: '0.35px',
            marginBottom: 24,
            padding: '4px 10px',
            border: '1px solid #27272a',
            borderRadius: 4,
            display: 'inline-block',
          }}
        >
          {t.badge}
        </div>

        <h1
          style={{
            fontSize: 'clamp(32px, 5vw, 52px)',
            fontWeight: 400,
            lineHeight: 1.05,
            letterSpacing: '-1.4px',
            margin: 0,
            marginBottom: 24,
            color: '#fff',
          }}
        >
          {t.headline[0]}<br />
          {t.headline[1]}
        </h1>

        <p
          style={{
            fontSize: 17,
            lineHeight: 1.5,
            letterSpacing: '-0.16px',
            color: '#a7a7a7',
            maxWidth: 560,
            margin: '0 0 48px',
          }}
        >
          {t.sub}
        </p>

        {/* Invite code form */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            gap: 8,
            width: '100%',
            maxWidth: 420,
            marginBottom: 16,
          }}
        >
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t.inputPlaceholder}
            autoFocus
            style={{
              flex: 1,
              background: 'transparent',
              border: '1px solid #27272a',
              borderRadius: 4,
              padding: '11px 14px',
              fontSize: 14,
              fontFamily: 'inherit',
              letterSpacing: '-0.16px',
              color: '#f7f8f8',
              outline: 'none',
              transition: 'border-color 0.15s ease',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#5e6ad2')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#27272a')}
          />
          <button
            type="submit"
            disabled={!code.trim()}
            style={{
              background: code.trim() ? '#5e6ad2' : '#1a1a1a',
              color: code.trim() ? '#fff' : '#767d88',
              border: 'none',
              borderRadius: 4,
              padding: '0 20px',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: code.trim() ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s ease',
            }}
          >
            {t.enter}
          </button>
        </form>

        {error && (
          <div style={{ fontSize: 12, color: '#e74c3c', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div style={{ fontSize: 12, color: '#767d88' }}>
          {t.hint}
        </div>

        {/* Feature grid */}
        <div
          style={{
            marginTop: 80,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
            width: '100%',
          }}
        >
          {t.features.map((f) => (
            <div
              key={f.title}
              style={{
                padding: '20px 16px',
                border: '1px solid #27272a',
                borderRadius: 8,
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.35px',
                  color: '#5e6ad2',
                  marginBottom: 8,
                  fontWeight: 500,
                }}
              >
                {f.title}
              </div>
              <div style={{ fontSize: 13, color: '#d0d4d4', lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          padding: '20px 32px',
          borderTop: '1px solid #27272a',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 11,
          color: '#767d88',
        }}
      >
        <span>{t.footer}</span>
        <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#27a644' }} />
          {t.status}
        </span>
      </footer>
    </div>
  );
}
