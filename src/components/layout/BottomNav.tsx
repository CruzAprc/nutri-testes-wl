import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Home, ClipboardList, TrendingUp, Utensils, Dumbbell, User } from 'lucide-react';
import styles from './BottomNav.module.css';

const navItems = [
  { to: '/app', icon: Home, label: 'Home' },
  { to: '/app/orientacoes', icon: ClipboardList, label: 'Dicas' },
  { to: '/app/dieta', icon: Utensils, label: 'Dieta' },
  { to: '/app/treino', icon: Dumbbell, label: 'Treino' },
  { to: '/app/progresso', icon: TrendingUp, label: 'Progresso' },
  { to: '/app/perfil', icon: User, label: 'Perfil' },
];

function getActiveIndex(pathname: string): number {
  if (pathname === '/app') return 0;
  const idx = navItems.findIndex((item, i) => i > 0 && pathname.startsWith(item.to));
  return idx >= 0 ? idx : 0;
}

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const tabsRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const activeIndex = getActiveIndex(location.pathname);
  const [blobX, setBlobX] = useState(0);
  const [trailX, setTrailX] = useState(0);

  // Measure real tab center position
  function getTabX(index: number): number {
    const tab = tabRefs.current[index];
    const container = tabsRef.current;
    if (!tab || !container) return 0;
    const containerRect = container.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();
    // Return left edge position so blob center aligns with tab center
    return tabRect.left - containerRect.left + tabRect.width / 2 - 24;
  }

  function getTrailTabX(index: number): number {
    const tab = tabRefs.current[index];
    const container = tabsRef.current;
    if (!tab || !container) return 0;
    const containerRect = container.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();
    return tabRect.left - containerRect.left + tabRect.width / 2 - 16;
  }

  // Set initial position
  useLayoutEffect(() => {
    requestAnimationFrame(() => {
      const x = getTabX(activeIndex);
      const tx = getTrailTabX(activeIndex);
      setBlobX(x);
      setTrailX(tx);
    });
  }, []);

  // Update on route change
  useEffect(() => {
    const x = getTabX(activeIndex);
    const tx = getTrailTabX(activeIndex);
    setBlobX(x);
    // Trail follows with delay
    setTimeout(() => setTrailX(tx), 80);
  }, [activeIndex]);

  // Update on resize
  useEffect(() => {
    const handleResize = () => {
      const x = getTabX(activeIndex);
      const tx = getTrailTabX(activeIndex);
      setBlobX(x);
      setTrailX(tx);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeIndex]);

  function handleTabClick(index: number, to: string) {
    navigate(to);
  }

  return (
    <nav className={styles.navbar}>
      {/* SVG Filter - invisivel */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="goo-filter">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 25 -12"
            />
          </filter>
        </defs>
      </svg>

      {/* Container com filter goo - APENAS os blobs ficam aqui */}
      <div className={styles.gooContainer}>
        <div
          className={styles.blob}
          style={{ transform: `translateX(${blobX}px)` }}
        />
        <div
          className={styles.blobTrail}
          style={{ transform: `translateX(${trailX}px)` }}
        />
      </div>

      {/* Icones - SEM filter, layer acima */}
      <div className={styles.tabs} ref={tabsRef}>
        {navItems.map(({ to, icon: Icon, label }, i) => (
          <button
            key={to}
            ref={el => { tabRefs.current[i] = el; }}
            onClick={() => handleTabClick(i, to)}
            className={`${styles.tab} ${i === activeIndex ? styles.tabActive : ''}`}
            type="button"
          >
            <Icon size={22} strokeWidth={i === activeIndex ? 2 : 1.5} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
