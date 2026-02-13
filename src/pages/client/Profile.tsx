import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Scale, Ruler, Target, Calendar, Pencil, Check, X, TrendingDown, TrendingUp, Camera, Loader2, ImagePlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { PageContainer, Header, BottomNav } from '../../components/layout';
import { Card, Button, BeforeAfterSlider } from '../../components/ui';
import type { WeightHistory, ProgressPhoto } from '../../types/database';
import { getBrasiliaDate } from '../../utils/date';
import styles from './Profile.module.css';

export function Profile() {
  const navigate = useNavigate();
  const { profile, signOut, refreshProfile } = useAuth();
  const { settings } = useTheme();
  const [weightHistory, setWeightHistory] = useState<WeightHistory[]>([]);
  const [loggingOut, setLoggingOut] = useState(false);
  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [savingWeight, setSavingWeight] = useState(false);
  const [weightSaved, setWeightSaved] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [progressPhotos, setProgressPhotos] = useState<ProgressPhoto[]>([]);
  const [uploadingProgress, setUploadingProgress] = useState(false);
  const [beforeDateIdx, setBeforeDateIdx] = useState(0);
  const [afterDateIdx, setAfterDateIdx] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressFileInputRef = useRef<HTMLInputElement>(null);

  const logoUrl = settings?.logo_icon_url || settings?.logo_main_url || '/logo-icon.png';

  const fetchProgressPhotos = useCallback(async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('progress_photos')
      .select('*')
      .eq('client_id', profile.id)
      .order('taken_at', { ascending: true });

    if (data) {
      setProgressPhotos(data);
      if (data.length >= 2) {
        setBeforeDateIdx(0);
        setAfterDateIdx(data.length - 1);
      }
    }
  }, [profile?.id]);

  useEffect(() => {
    if (profile?.id) {
      fetchWeightHistory();
      fetchProgressPhotos();
    }
  }, [profile?.id, fetchProgressPhotos]);

  async function fetchWeightHistory() {
    const { data } = await supabase
      .from('weight_history')
      .select('*')
      .eq('client_id', profile!.id)
      .order('recorded_at', { ascending: false })
      .limit(10);

    if (data) setWeightHistory(data);
  }

  async function handleSaveWeight() {
    if (!newWeight || isNaN(parseFloat(newWeight))) {
      return;
    }

    setSavingWeight(true);
    const today = getBrasiliaDate();
    const weightValue = parseFloat(newWeight);

    try {
      // Update current weight in profile
      await supabase
        .from('profiles')
        .update({
          current_weight_kg: weightValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile!.id);

      // Check if there's already a weight log for today
      const { data: existingLog } = await supabase
        .from('weight_history')
        .select('id')
        .eq('client_id', profile!.id)
        .gte('recorded_at', today)
        .lt('recorded_at', today + 'T23:59:59')
        .maybeSingle();

      if (existingLog) {
        // Update today's entry
        await supabase
          .from('weight_history')
          .update({ weight_kg: weightValue })
          .eq('id', existingLog.id);
      } else {
        // Create new entry
        await supabase
          .from('weight_history')
          .insert({
            client_id: profile!.id,
            weight_kg: weightValue,
          });
      }

      setWeightSaved(true);
      setIsEditingWeight(false);

      // Refresh profile and history
      if (refreshProfile) {
        await refreshProfile();
      }
      await fetchWeightHistory();

      // Reset saved indicator after 2 seconds
      setTimeout(() => setWeightSaved(false), 2000);

    } catch (error) {
      console.error('Error saving weight:', error);
    } finally {
      setSavingWeight(false);
    }
  }

  function startEditingWeight() {
    setNewWeight(currentWeight.toString());
    setIsEditingWeight(true);
  }

  function cancelEditingWeight() {
    setIsEditingWeight(false);
    setNewWeight('');
  }

  function handlePhotoClick() {
    fileInputRef.current?.click();
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB.');
      return;
    }

    setUploadingPhoto(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Delete old photo if exists
      if (profile.photo_url) {
        const oldPath = profile.photo_url.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('avatars').remove([`avatars/${oldPath}`]);
        }
      }

      // Upload new photo
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        alert('Erro ao fazer upload da foto. Tente novamente.');
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new photo URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          photo_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (updateError) {
        console.error('Update error:', updateError);
        alert('Erro ao atualizar perfil. Tente novamente.');
        return;
      }

      // Refresh profile to show new photo
      if (refreshProfile) {
        await refreshProfile();
      }

    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Erro ao fazer upload da foto. Tente novamente.');
    } finally {
      setUploadingPhoto(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function handleProgressPhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB.');
      return;
    }

    setUploadingProgress(true);
    try {
      const today = getBrasiliaDate();
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}/${today}/front-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('progress-photos')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        alert('Erro ao fazer upload. Tente novamente.');
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('progress-photos')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from('progress_photos')
        .insert({
          client_id: profile.id,
          photo_url: publicUrl,
          photo_type: 'front' as const,
          taken_at: today,
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        alert('Erro ao salvar referência da foto.');
        return;
      }

      await fetchProgressPhotos();
    } catch (error) {
      console.error('Error uploading progress photo:', error);
      alert('Erro ao fazer upload. Tente novamente.');
    } finally {
      setUploadingProgress(false);
      if (progressFileInputRef.current) {
        progressFileInputRef.current.value = '';
      }
    }
  }

  // Unique dates for progress photo selector
  const progressDates = [...new Set(progressPhotos.map(p => p.taken_at))];
  const formatProgressDate = (dateStr: string) =>
    new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  const currentWeight = profile?.current_weight_kg || 0;
  const startingWeight = profile?.starting_weight_kg || currentWeight;
  const goalWeight = profile?.goal_weight_kg || 0;
  const weightDiff = startingWeight - currentWeight;
  const remainingToGoal = goalWeight > 0 ? currentWeight - goalWeight : 0;
  const height = profile?.height_cm ? profile.height_cm / 100 : 0;
  const bmi = height > 0 ? currentWeight / (height * height) : 0;

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      month: 'short',
      year: 'numeric',
    });
  }

  return (
    <PageContainer>
      <header className={styles.header}>
        <img
          src={logoUrl}
          alt="Logo"
          className={styles.logo}
        />
        <div className={styles.avatarSection}>
          <div className={styles.avatarWrapper}>
            <div className={styles.avatar}>
              {profile?.photo_url ? (
                <img src={profile.photo_url} alt="" />
              ) : (
                <span>{profile?.full_name?.charAt(0) || 'U'}</span>
              )}
            </div>
            <button
              className={styles.avatarEditBtn}
              onClick={handlePhotoClick}
              disabled={uploadingPhoto}
              aria-label="Alterar foto de perfil"
            >
              {uploadingPhoto ? (
                <Loader2 size={16} className={styles.spinning} />
              ) : (
                <Camera size={16} />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className={styles.hiddenInput}
            />
          </div>
          <h1 className={styles.name}>{profile?.full_name}</h1>
          <p className={styles.since}>
            Aluno desde {formatDate(profile?.coaching_start_date || profile?.created_at || null)}
          </p>
        </div>
      </header>

      <main className={styles.content}>
        {/* Weight Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Peso</h2>

          <Card className={styles.weightCard}>
            <button
              onClick={startEditingWeight}
              className={styles.weightEditIcon}
              aria-label="Editar peso"
            >
              <Pencil size={18} />
            </button>

            <span className={styles.weightLabel}>Peso Atual</span>

            {isEditingWeight ? (
              <div className={styles.weightEditRow}>
                <div className={styles.weightInputWrapper}>
                  <input
                    type="number"
                    step="0.1"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    className={styles.weightInput}
                    placeholder="0.0"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveWeight();
                      if (e.key === 'Escape') cancelEditingWeight();
                    }}
                  />
                  <span className={styles.weightInputUnit}>kg</span>
                </div>
                <div className={styles.weightEditButtons}>
                  <button
                    onClick={handleSaveWeight}
                    disabled={savingWeight}
                    className={styles.weightSaveBtn}
                  >
                    {savingWeight ? '...' : <Check size={18} />}
                  </button>
                  <button
                    onClick={cancelEditingWeight}
                    className={styles.weightCancelBtn}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.weightDisplayRow}>
                <div className={styles.weightValue}>
                  <span className={styles.weightNumber}>{currentWeight.toFixed(1)}</span>
                  <span className={styles.weightUnit}>kg</span>
                </div>
              </div>
            )}

            {weightSaved && (
              <p className={styles.weightSavedMsg}>Peso atualizado!</p>
            )}

            <div className={styles.weightDivider} />

            <div className={styles.weightStatsRow}>
              <span className={styles.weightStatInline}>
                Peso Inicial: {startingWeight > 0 ? `${startingWeight.toFixed(1)}kg` : '--'}
              </span>
              <span className={styles.weightStatInline}>
                Meta: {goalWeight > 0 ? `${goalWeight.toFixed(1)}kg` : '--'}
              </span>
            </div>

            {/* Progress Badges */}
            {weightDiff !== 0 && (
              <div className={`${styles.progressBadge} ${weightDiff > 0 ? styles.progressPositive : styles.progressNegative}`}>
                {weightDiff > 0 ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                <span>
                  {weightDiff > 0
                    ? `Voce ja perdeu ${weightDiff.toFixed(1)} kg!`
                    : `Voce ganhou ${Math.abs(weightDiff).toFixed(1)} kg`
                  }
                </span>
              </div>
            )}

            {remainingToGoal > 0 && (
              <div className={styles.goalBadge}>
                <Target size={16} />
                <span>Faltam {remainingToGoal.toFixed(1)} kg para sua meta</span>
              </div>
            )}
          </Card>
        </section>

        {/* Stats Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Minhas Medidas</h2>

          <Card className={styles.statsCard}>
            <div className={styles.statsGrid}>
              <div className={styles.stat}>
                <div className={styles.statIcon}>
                  <Ruler size={18} />
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>Altura</span>
                  <span className={styles.statValue}>{height.toFixed(2)}m</span>
                </div>
              </div>

              <div className={styles.stat}>
                <div className={styles.statIcon}>
                  <Target size={18} />
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>IMC</span>
                  <span className={styles.statValue}>{bmi.toFixed(1)}</span>
                </div>
              </div>

              <div className={styles.stat}>
                <div className={styles.statIcon}>
                  <Calendar size={18} />
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>Idade</span>
                  <span className={styles.statValue}>{profile?.age || '-'} anos</span>
                </div>
              </div>

              <div className={styles.stat}>
                <div className={styles.statIcon}>
                  <Scale size={18} />
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>Variacao</span>
                  <span className={styles.statValue}>
                    {weightDiff !== 0 ? `${weightDiff > 0 ? '-' : '+'}${Math.abs(weightDiff).toFixed(1)}kg` : '0kg'}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Progress Photos Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Meu Progresso Visual</h2>

          {progressPhotos.length >= 2 ? (
            <>
              <div className={styles.datePills}>
                <div className={styles.datePill}>
                  <span className={styles.datePillLabel}>Antes:</span>
                  <select
                    className={styles.dateSelect}
                    value={beforeDateIdx}
                    onChange={(e) => setBeforeDateIdx(Number(e.target.value))}
                  >
                    {progressDates.map((date, i) => (
                      <option key={date} value={progressPhotos.findIndex(p => p.taken_at === date)}>
                        {formatProgressDate(date)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.datePill}>
                  <span className={styles.datePillLabel}>Depois:</span>
                  <select
                    className={styles.dateSelect}
                    value={afterDateIdx}
                    onChange={(e) => setAfterDateIdx(Number(e.target.value))}
                  >
                    {progressDates.map((date, i) => (
                      <option key={date} value={progressPhotos.findIndex(p => p.taken_at === date)}>
                        {formatProgressDate(date)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <BeforeAfterSlider
                beforeImage={progressPhotos[beforeDateIdx]?.photo_url}
                afterImage={progressPhotos[afterDateIdx]?.photo_url}
              />
            </>
          ) : progressPhotos.length === 1 ? (
            <Card className={styles.progressPlaceholder}>
              <img
                src={progressPhotos[0].photo_url}
                alt="Progresso"
                className={styles.singleProgressPhoto}
              />
              <p className={styles.progressPlaceholderText}>
                Adicione mais uma foto para comparar seu progresso!
              </p>
            </Card>
          ) : (
            <Card className={styles.progressPlaceholder}>
              <div className={styles.progressPlaceholderIcon}>
                <ImagePlus size={40} />
              </div>
              <p className={styles.progressPlaceholderTitle}>Acompanhe sua evolução</p>
              <p className={styles.progressPlaceholderText}>
                Tire fotos regularmente para ver seu progresso ao longo do tempo
              </p>
            </Card>
          )}

          <button
            className={styles.addProgressPhotoBtn}
            onClick={() => progressFileInputRef.current?.click()}
            disabled={uploadingProgress}
          >
            {uploadingProgress ? (
              <Loader2 size={18} className={styles.spinning} />
            ) : (
              <Camera size={18} />
            )}
            {uploadingProgress ? 'Enviando...' : 'Adicionar foto'}
          </button>
          <input
            ref={progressFileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleProgressPhotoUpload}
            className={styles.hiddenInput}
          />
        </section>

        {profile?.goals && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Meu Objetivo</h2>
            <Card>
              <p className={styles.goalText}>{profile.goals}</p>
            </Card>
          </section>
        )}

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Historico de Peso</h2>

          {weightHistory.length > 0 ? (
            <div className={styles.historyList}>
              {weightHistory.slice(0, 5).map((record, index) => {
                const prevRecord = weightHistory[index + 1];
                const diff = prevRecord ? Number(record.weight_kg) - Number(prevRecord.weight_kg) : 0;

                return (
                  <Card key={record.id} className={styles.historyItem}>
                    <span className={styles.historyDate}>
                      {new Date(record.recorded_at).toLocaleDateString('pt-BR')}
                    </span>
                    <div className={styles.historyWeightRow}>
                      <span className={styles.historyWeight}>{Number(record.weight_kg).toFixed(1)}kg</span>
                      {diff !== 0 && (
                        <span className={`${styles.historyTrend} ${diff < 0 ? styles.trendDown : styles.trendUp}`}>
                          {diff < 0 ? '↓' : '↑'}
                        </span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className={styles.emptyState}>
              <p>Nenhum registro de peso</p>
            </Card>
          )}
        </section>

        <Button
          variant="danger"
          fullWidth
          loading={loggingOut}
          onClick={() => {
            setLoggingOut(true);
            // signOut limpa estado imediatamente, navegação acontece logo após
            signOut().finally(() => {
              navigate('/login', { replace: true });
            });
          }}
        >
          <LogOut size={18} />
          Sair da Conta
        </Button>
      </main>

      <BottomNav />
    </PageContainer>
  );
}
