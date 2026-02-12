import { useState, useRef, useCallback, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ChevronUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { Button, Input } from '../../components/ui';
import styles from './Login.module.css';

export function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { settings } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Swipe gesture state
  const [isRevealed, setIsRevealed] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const gestureStartRef = useRef<{ y: number; time: number } | null>(null);
  const formCardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const logoMainUrl = settings?.logo_main_url || '/logo.jpeg';
  const appName = settings?.app_name || 'MICHAEL CEZAR';
  const appDescription = settings?.app_description || 'NUTRICIONISTA';

  // Prevent default scroll during drag with native listener (passive: false)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isRevealed) return;

    function onTouchMove(e: TouchEvent) {
      if (gestureStartRef.current) {
        const delta = gestureStartRef.current.y - e.touches[0].clientY;
        if (delta > 0) {
          e.preventDefault();
        }
      }
    }

    container.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => container.removeEventListener('touchmove', onTouchMove);
  }, [isRevealed]);

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isRevealed) return;
    gestureStartRef.current = { y: e.touches[0].clientY, time: Date.now() };
    setIsDragging(true);
  }, [isRevealed]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!gestureStartRef.current || isRevealed) return;
    const delta = gestureStartRef.current.y - e.touches[0].clientY;
    if (delta > 0) {
      setDragOffset(delta);
    }
  }, [isRevealed]);

  const handleGestureEnd = useCallback(() => {
    if (!gestureStartRef.current || isRevealed) return;

    const elapsed = Date.now() - gestureStartRef.current.time;
    const velocity = dragOffset / Math.max(elapsed, 1);

    // Snap open if dragged >25% of viewport OR fast swipe (>0.5 px/ms)
    if (dragOffset > window.innerHeight * 0.25 || velocity > 0.5) {
      setIsRevealed(true);
    }

    setDragOffset(0);
    setIsDragging(false);
    gestureStartRef.current = null;
  }, [isRevealed, dragOffset]);

  // Mouse handlers for desktop
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isRevealed) return;
    gestureStartRef.current = { y: e.clientY, time: Date.now() };
    setIsDragging(true);
  }, [isRevealed]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!gestureStartRef.current || isRevealed || !isDragging) return;
    const delta = gestureStartRef.current.y - e.clientY;
    if (delta > 0) {
      setDragOffset(delta);
    }
  }, [isRevealed, isDragging]);

  // Dynamic styles - gesture-driven transforms
  const formCardStyle: React.CSSProperties = {
    transform: isRevealed
      ? 'translateY(0)'
      : isDragging && dragOffset > 0
        ? `translateY(max(0px, calc(100% - ${dragOffset}px)))`
        : 'translateY(100%)',
    transition: isDragging
      ? 'none'
      : 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
  };

  const headerParallax = isDragging && dragOffset > 0
    ? Math.min(dragOffset * 0.15, window.innerHeight * 0.12)
    : 0;

  const headerStyle: React.CSSProperties = {
    transform: isRevealed
      ? 'translateY(-12%)'
      : headerParallax > 0
        ? `translateY(-${headerParallax}px)`
        : 'translateY(0)',
    transition: isDragging
      ? 'none'
      : 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
  };

  // Opacity for welcome text: fades as card reveals
  const welcomeTextOpacity = isDragging && dragOffset > 0
    ? Math.max(0, 1 - dragOffset / (window.innerHeight * 0.3))
    : isRevealed
      ? 0
      : 1;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    if (!email.trim() || !password.trim()) {
      setError('Preencha todos os campos');
      setLoading(false);
      return;
    }

    try {
      const { error: signInError, isAdmin } = await signIn(email, password);

      if (signInError) {
        setError('Email ou senha incorretos');
        setLoading(false);
        return;
      }

      if (isAdmin) {
        setError('Use o painel administrativo para fazer login');
        setLoading(false);
        return;
      }

      navigate('/app', { replace: true });
    } catch {
      setError('Erro ao fazer login. Tente novamente.');
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    setError('');
    setSuccessMessage('');

    if (!email.trim()) {
      setError('Digite seu email para recuperar a senha');
      return;
    }

    setResetLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (resetError) {
        setError('Erro ao enviar email de recuperacao. Tente novamente.');
      } else {
        setSuccessMessage('Email de recuperacao enviado! Verifique sua caixa de entrada.');
      }
    } catch {
      setError('Erro ao enviar email de recuperacao. Tente novamente.');
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${!isRevealed ? styles.noTouch : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleGestureEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleGestureEnd}
      onMouseLeave={handleGestureEnd}
    >
      {/* Welcome / Header area */}
      <div className={styles.header} style={headerStyle}>
        <img src={logoMainUrl} alt="Logo" className={styles.welcomeLogo} />
        <h1
          className={styles.welcomeTitle}
          style={{ opacity: welcomeTextOpacity, transition: isDragging ? 'none' : 'opacity 0.4s ease' }}
        >
          {appName.toUpperCase()}
        </h1>
        <p
          className={styles.welcomeSubtitle}
          style={{ opacity: welcomeTextOpacity * 0.9, transition: isDragging ? 'none' : 'opacity 0.4s ease' }}
        >
          {appDescription.toUpperCase()}
        </p>

        {!isRevealed && (
          <div className={`${styles.swipeIndicator} ${isDragging ? styles.swipeHidden : ''}`}>
            <ChevronUp size={24} strokeWidth={2.5} />
            <span>Deslize para cima</span>
          </div>
        )}
      </div>

      {/* Login Form Card (Bottom Sheet) */}
      <div
        ref={formCardRef}
        className={styles.formCard}
        style={formCardStyle}
      >
        <div className={styles.dragHandle}>
          <div className={styles.handleBar} />
        </div>

        <h1 className={styles.title}>Bem-vindo</h1>
        <p className={styles.subtitle}>Entre com suas credenciais para continuar</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail size={20} />}
            autoComplete="email"
            required
          />

          <div className={styles.passwordWrapper}>
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={20} />}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className={styles.togglePassword}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {error && <p className={styles.error}>{error}</p>}
          {successMessage && <p className={styles.success}>{successMessage}</p>}

          <Button type="submit" fullWidth loading={loading}>
            Entrar
          </Button>

          <button
            type="button"
            className={styles.forgotPassword}
            onClick={handleForgotPassword}
            disabled={resetLoading}
          >
            {resetLoading ? 'Enviando...' : 'Esqueci minha senha'}
          </button>
        </form>
      </div>
    </div>
  );
}
