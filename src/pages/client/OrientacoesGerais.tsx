import { useState, useCallback, useLayoutEffect, useEffect } from 'react';
import { Pill, FlaskConical, Utensils, FileText, ChevronDown, Lightbulb, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { usePageData } from '../../hooks';
import { PageContainer, Header, BottomNav } from '../../components/layout';
import styles from './OrientacoesGerais.module.css';

interface Guidelines {
  recommended_supplements: string | null;
  manipulated_supplements: string | null;
  free_meal_video_url: string | null;
  general_notes: string | null;
}

// Renderiza texto com suporte a listas (linhas que começam com "- " ou "• ")
function FormattedText({ text }: { text: string }) {
  const lines = text.split('\n').filter(l => l.trim());
  const isList = lines.every(l => l.trim().startsWith('- ') || l.trim().startsWith('• '));

  if (isList && lines.length > 0) {
    return (
      <ul className={styles.textList}>
        {lines.map((line, i) => (
          <li key={i} className={styles.textListItem}>
            <CheckCircle2 size={16} className={styles.listIcon} />
            <span>{line.replace(/^[-•]\s*/, '')}</span>
          </li>
        ))}
      </ul>
    );
  }

  return <p className={styles.cardText}>{text}</p>;
}

// Extract YouTube video ID
function getYouTubeVideoId(url: string | null): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&\s]+)/,
    /(?:youtu\.be\/)([^?\s]+)/,
    /(?:youtube\.com\/embed\/)([^?\s]+)/,
    /(?:youtube\.com\/shorts\/)([^?\s]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

interface GuidelineSection {
  id: string;
  icon: typeof Pill;
  title: string;
  subtitle: string;
  content: string;
  colorClass: string;
  type: 'text' | 'video';
  videoId?: string | null;
}

export function OrientacoesGerais() {
  const { profile } = useAuth();
  const [guidelines, setGuidelines] = useState<Guidelines | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Cache para exibição instantânea
  useLayoutEffect(() => {
    if (!profile?.id) return;
    try {
      const cached = localStorage.getItem(`orientacoes_cache_${profile.id}`);
      if (cached) {
        setGuidelines(JSON.parse(cached));
      }
    } catch {
      // Cache inválido
    }
  }, [profile?.id]);

  // Salvar cache
  useEffect(() => {
    if (!profile?.id || !guidelines) return;
    try {
      localStorage.setItem(`orientacoes_cache_${profile.id}`, JSON.stringify(guidelines));
    } catch {
      // Ignore
    }
  }, [guidelines, profile?.id]);

  const loadGuidelines = useCallback(async () => {
    if (!profile?.id) return;

    const { data, error } = await supabase
      .from('patient_guidelines')
      .select('*')
      .eq('client_id', profile.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading guidelines:', error);
    }

    setGuidelines(data);
  }, [profile?.id]);

  const { isInitialLoading: loading } = usePageData({
    userId: profile?.id,
    fetchData: loadGuidelines,
  });

  const toggleCard = (id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Montar seções disponíveis
  const sections: GuidelineSection[] = [];

  if (guidelines?.recommended_supplements) {
    sections.push({
      id: 'supplements',
      icon: Pill,
      title: 'Suplementos Recomendados',
      subtitle: 'Sua suplementação diária',
      content: guidelines.recommended_supplements,
      colorClass: styles.colorBlue,
      type: 'text',
    });
  }

  if (guidelines?.manipulated_supplements) {
    sections.push({
      id: 'manipulated',
      icon: FlaskConical,
      title: 'Manipulados',
      subtitle: 'Fórmulas personalizadas',
      content: guidelines.manipulated_supplements,
      colorClass: styles.colorPurple,
      type: 'text',
    });
  }

  if (guidelines?.free_meal_video_url) {
    const videoId = getYouTubeVideoId(guidelines.free_meal_video_url);
    if (videoId) {
      sections.push({
        id: 'freemeal',
        icon: Utensils,
        title: 'Refeição Livre',
        subtitle: 'Como funciona sua refeição livre',
        content: guidelines.free_meal_video_url,
        colorClass: styles.colorOrange,
        type: 'video',
        videoId,
      });
    }
  }

  if (guidelines?.general_notes) {
    sections.push({
      id: 'notes',
      icon: FileText,
      title: 'Observações Gerais',
      subtitle: 'Informações importantes',
      content: guidelines.general_notes,
      colorClass: styles.colorGray,
      type: 'text',
    });
  }

  const hasContent = sections.length > 0;

  // Auto-expandir todos os cards quando há poucas seções
  useEffect(() => {
    if (sections.length > 0 && sections.length <= 3 && expandedCards.size === 0) {
      setExpandedCards(new Set(sections.map(s => s.id)));
    }
  }, [sections.length]);

  return (
    <PageContainer>
      <Header title="Dicas e Orientações" subtitle="Recomendações do seu nutricionista" showBack />

      <main className={styles.content}>
        {loading && !guidelines ? (
          <div className={styles.skeletonContainer}>
            {[1, 2, 3].map(i => (
              <div key={i} className={styles.skeletonCard}>
                <div className={styles.skeletonAccent} />
                <div className={styles.skeletonBody}>
                  <div className={styles.skeletonIcon} />
                  <div className={styles.skeletonLines}>
                    <div className={styles.skeletonLine} style={{ width: '60%' }} />
                    <div className={styles.skeletonLine} style={{ width: '40%' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !hasContent ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIconWrapper}>
              <Lightbulb size={40} />
            </div>
            <h3 className={styles.emptyTitle}>Nenhuma orientação ainda</h3>
            <p className={styles.emptySubtitle}>
              Seu nutricionista irá adicionar dicas e recomendações personalizadas para você
            </p>
          </div>
        ) : (
          <div className={styles.cardsContainer}>
            {/* Resumo */}
            <div className={styles.summaryBanner}>
              <Lightbulb size={20} className={styles.summaryIcon} />
              <p className={styles.summaryText}>
                {sections.length} {sections.length === 1 ? 'orientação disponível' : 'orientações disponíveis'}
              </p>
            </div>

            {sections.map((section, index) => {
              const Icon = section.icon;
              const isExpanded = expandedCards.has(section.id);

              return (
                <div
                  key={section.id}
                  className={`${styles.guidelineCard} ${section.colorClass}`}
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  {/* Accent bar */}
                  <div className={styles.accentBar} />

                  {/* Card Header - Clicável */}
                  <button
                    className={styles.cardHeader}
                    onClick={() => toggleCard(section.id)}
                  >
                    <div className={styles.cardIconWrapper}>
                      <Icon size={22} />
                    </div>
                    <div className={styles.cardHeaderText}>
                      <h3 className={styles.cardTitle}>{section.title}</h3>
                      <p className={styles.cardSubtitle}>{section.subtitle}</p>
                    </div>
                    <div className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ''}`}>
                      <ChevronDown size={20} />
                    </div>
                  </button>

                  {/* Card Content - Expansível */}
                  <div className={`${styles.cardBody} ${isExpanded ? styles.cardBodyOpen : ''}`}>
                    <div className={styles.cardBodyInner}>
                      {section.type === 'video' && section.videoId ? (
                        <>
                          <p className={styles.videoDescription}>
                            Assista ao vídeo explicativo sobre sua refeição livre
                          </p>
                          <div className={styles.videoWrapper}>
                            <iframe
                              className={styles.videoFrame}
                              src={`https://www.youtube.com/embed/${section.videoId}?rel=0&modestbranding=1`}
                              title="Vídeo Refeição Livre"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        </>
                      ) : (
                        <FormattedText text={section.content} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </PageContainer>
  );
}
