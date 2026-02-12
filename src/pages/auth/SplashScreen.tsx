import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import styles from './SplashScreen.module.css';

export function SplashScreen() {
  const navigate = useNavigate();
  const { user, loading, isAdmin } = useAuth();
  const { settings } = useTheme();
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (loading) return;

    // Start fade-out animation before navigating
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 600);

    // Navigate after fade-out completes
    const navTimer = setTimeout(() => {
      if (user) {
        if (isAdmin) {
          navigate('/admin', { replace: true });
        } else {
          navigate('/app', { replace: true });
        }
      } else {
        navigate('/login', { replace: true });
      }
    }, 1000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(navTimer);
    };
  }, [user, loading, isAdmin, navigate]);

  const logoUrl = settings?.logo_main_url || '/logo.jpeg';
  const appName = settings?.app_name || 'MICHAEL CEZAR';
  const appDescription = settings?.app_description || 'NUTRICIONISTA';

  return (
    <div className={`${styles.container} ${fadeOut ? styles.fadeOut : ''}`}>
      <img src={logoUrl} alt="Logo" className={styles.logo} />
      <h1 className={styles.title}>{appName.toUpperCase()}</h1>
      <p className={styles.subtitle}>{appDescription.toUpperCase()}</p>
    </div>
  );
}
