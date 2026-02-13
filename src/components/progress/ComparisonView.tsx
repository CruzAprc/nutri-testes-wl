import { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, SlidersHorizontal, Columns2, Download, Share2, Camera } from 'lucide-react';
import { BeforeAfterSlider } from '../ui';
import { generateComparisonImage, shareOrDownload } from '../../utils/imageUtils';
import { useTheme } from '../../contexts/ThemeContext';
import type { ProgressPhoto } from '../../types/database';
import styles from './ComparisonView.module.css';

interface ComparisonViewProps {
  photos: ProgressPhoto[];
  availableMonths: string[];
  photosByMonth: Record<string, ProgressPhoto[]>;
}

const MONTH_NAMES_PT: Record<number, string> = {
  1: 'Janeiro',
  2: 'Fevereiro',
  3: 'Marco',
  4: 'Abril',
  5: 'Maio',
  6: 'Junho',
  7: 'Julho',
  8: 'Agosto',
  9: 'Setembro',
  10: 'Outubro',
  11: 'Novembro',
  12: 'Dezembro',
};

const TYPE_LABELS: Record<string, string> = {
  front: 'Frente',
  side: 'Lado',
  back: 'Costas',
};

function formatMonth(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const monthNum = parseInt(monthStr, 10);
  const name = MONTH_NAMES_PT[monthNum] || monthStr;
  return `${name} ${yearStr}`;
}

function formatMonthShort(monthKey: string): string {
  const [, monthStr] = monthKey.split('-');
  const monthNum = parseInt(monthStr, 10);
  return MONTH_NAMES_PT[monthNum] || monthStr;
}

function formatDateBR(dateStr: string): string {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/** Generate all 12 month keys for a given year: ["2025-01", ..., "2025-12"] */
function getAllMonthsForYear(year: number): string[] {
  return Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, '0');
    return `${year}-${m}`;
  });
}

export function ComparisonView({
  photos,
  availableMonths,
  photosByMonth,
}: ComparisonViewProps) {
  const { settings } = useTheme();

  const [beforeMonth, setBeforeMonth] = useState<string | null>(null);
  const [afterMonth, setAfterMonth] = useState<string | null>(null);
  const [beforeType, setBeforeType] = useState<'front' | 'side' | 'back'>('front');
  const [afterType, setAfterType] = useState<'front' | 'side' | 'back'>('front');
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side'>('slider');
  const [openDropdown, setOpenDropdown] = useState<'before' | 'after' | null>(null);
  const [saving, setSaving] = useState(false);
  const [beforeYear, setBeforeYear] = useState<number>(new Date().getFullYear());
  const [afterYear, setAfterYear] = useState<number>(new Date().getFullYear());

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Derive the set of years that have photos + current year
  const availableYears = useMemo(() => {
    const yearSet = new Set<number>();
    const currentYear = new Date().getFullYear();
    yearSet.add(currentYear);
    for (const m of availableMonths) {
      yearSet.add(parseInt(m.split('-')[0], 10));
    }
    return Array.from(yearSet).sort();
  }, [availableMonths]);

  const showYearSelector = availableYears.length > 1;

  // All 12 months for the selected before/after year
  const beforeAllMonths = useMemo(() => getAllMonthsForYear(beforeYear), [beforeYear]);
  const afterAllMonths = useMemo(() => getAllMonthsForYear(afterYear), [afterYear]);

  // Set of months that have photos (for quick lookup)
  const monthsWithPhotos = useMemo(() => new Set(availableMonths), [availableMonths]);

  // Initialize months when availableMonths changes
  useEffect(() => {
    if (availableMonths.length > 0) {
      setBeforeMonth((prev) => prev ?? availableMonths[0]);
      setAfterMonth((prev) => prev ?? availableMonths[availableMonths.length - 1]);

      // Initialize years from the first/last photo months
      const firstYear = parseInt(availableMonths[0].split('-')[0], 10);
      const lastYear = parseInt(availableMonths[availableMonths.length - 1].split('-')[0], 10);
      setBeforeYear((prev) => prev || firstYear);
      setAfterYear((prev) => prev || lastYear);
    }
  }, [availableMonths]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!openDropdown) return;
    function handleMouseDown(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [openDropdown]);

  function getPhotoForMonth(monthKey: string | null, type: string): ProgressPhoto | null {
    if (!monthKey) return null;
    const monthPhotos = photosByMonth[monthKey];
    if (!monthPhotos) return null;
    const matches = monthPhotos.filter(
      (p) => p.taken_at.startsWith(monthKey) && p.photo_type === type
    );
    return matches.length > 0 ? matches[matches.length - 1] : null;
  }

  function getAvailableTypes(monthKey: string | null): string[] {
    if (!monthKey) return [];
    const monthPhotos = photosByMonth[monthKey];
    if (!monthPhotos) return [];
    const types = new Set(monthPhotos.map((p) => p.photo_type));
    return Array.from(types);
  }

  const beforePhoto = useMemo(() => getPhotoForMonth(beforeMonth, beforeType), [beforeMonth, beforeType, photosByMonth]);
  const afterPhoto = useMemo(() => getPhotoForMonth(afterMonth, afterType), [afterMonth, afterType, photosByMonth]);
  const beforeTypes = useMemo(() => getAvailableTypes(beforeMonth), [beforeMonth, photosByMonth]);
  const afterTypes = useMemo(() => getAvailableTypes(afterMonth), [afterMonth, photosByMonth]);

  const allTypes = useMemo(() => {
    const set = new Set([...beforeTypes, ...afterTypes]);
    return Array.from(set);
  }, [beforeTypes, afterTypes]);

  const showTypeTabs = allTypes.length > 1;
  const hasBothPhotos = Boolean(beforePhoto && afterPhoto);

  async function handleSave() {
    if (!beforePhoto || !afterPhoto) return;
    setSaving(true);
    try {
      const blob = await generateComparisonImage({
        beforeUrl: beforePhoto.photo_url,
        afterUrl: afterPhoto.photo_url,
        beforeDate: formatDateBR(beforePhoto.taken_at),
        afterDate: formatDateBR(afterPhoto.taken_at),
        appName: settings?.app_name,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comparacao-${formatDateBR(beforePhoto.taken_at).replace(/\//g, '-')}_${formatDateBR(afterPhoto.taken_at).replace(/\//g, '-')}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Silently handle errors
    } finally {
      setSaving(false);
    }
  }

  async function handleShare() {
    if (!beforePhoto || !afterPhoto) return;
    setSaving(true);
    try {
      const blob = await generateComparisonImage({
        beforeUrl: beforePhoto.photo_url,
        afterUrl: afterPhoto.photo_url,
        beforeDate: formatDateBR(beforePhoto.taken_at),
        afterDate: formatDateBR(afterPhoto.taken_at),
        appName: settings?.app_name,
      });
      await shareOrDownload({
        blob,
        fileName: `comparacao-${formatDateBR(beforePhoto.taken_at).replace(/\//g, '-')}_${formatDateBR(afterPhoto.taken_at).replace(/\//g, '-')}.jpg`,
        title: 'Minha evolucao',
      });
    } catch {
      // Silently handle errors
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.container}>
      {/* View mode toggle */}
      <div className={styles.viewModeToggle}>
        <button
          className={`${styles.viewModeBtn} ${viewMode === 'slider' ? styles.viewModeBtnActive : ''}`}
          onClick={() => setViewMode('slider')}
        >
          <SlidersHorizontal size={16} />
          Slider
        </button>
        <button
          className={`${styles.viewModeBtn} ${viewMode === 'side-by-side' ? styles.viewModeBtnActive : ''}`}
          onClick={() => setViewMode('side-by-side')}
        >
          <Columns2 size={16} />
          Lado a Lado
        </button>
      </div>

      {/* Month selector row */}
      <div className={styles.monthRow} ref={dropdownRef}>
        {/* Before month pill */}
        <div className={styles.monthPillWrapper}>
          <button
            className={styles.monthPill}
            onClick={() => setOpenDropdown(openDropdown === 'before' ? null : 'before')}
          >
            <span className={styles.monthPillLabel}>Antes:</span>
            <span className={styles.monthPillValue}>
              {beforeMonth ? formatMonth(beforeMonth) : '—'}
            </span>
            <ChevronDown
              size={16}
              className={`${styles.monthPillIcon} ${openDropdown === 'before' ? styles.monthPillIconOpen : ''}`}
            />
          </button>
          {openDropdown === 'before' && (
            <div className={styles.monthDropdown}>
              {showYearSelector && (
                <div className={styles.yearSelector}>
                  <button
                    className={styles.yearBtn}
                    disabled={availableYears.indexOf(beforeYear) === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      const idx = availableYears.indexOf(beforeYear);
                      if (idx > 0) setBeforeYear(availableYears[idx - 1]);
                    }}
                  >
                    <ChevronDown size={14} className={styles.yearChevronLeft} />
                  </button>
                  <span className={styles.yearLabel}>{beforeYear}</span>
                  <button
                    className={styles.yearBtn}
                    disabled={availableYears.indexOf(beforeYear) === availableYears.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      const idx = availableYears.indexOf(beforeYear);
                      if (idx < availableYears.length - 1) setBeforeYear(availableYears[idx + 1]);
                    }}
                  >
                    <ChevronDown size={14} className={styles.yearChevronRight} />
                  </button>
                </div>
              )}
              {beforeAllMonths.map((m) => {
                const hasPhotos = monthsWithPhotos.has(m);
                const isActive = m === beforeMonth;
                return (
                  <button
                    key={m}
                    className={`${styles.monthDropdownItem} ${isActive ? styles.monthDropdownItemActive : ''} ${!hasPhotos ? styles.monthDropdownItemEmpty : ''}`}
                    onClick={() => {
                      setBeforeMonth(m);
                      setOpenDropdown(null);
                    }}
                  >
                    <span>{formatMonthShort(m)}</span>
                    {hasPhotos ? (
                      <Camera size={12} className={styles.monthPhotoIcon} />
                    ) : (
                      <span className={styles.monthNoPhoto}>sem foto</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* After month pill */}
        <div className={styles.monthPillWrapper}>
          <button
            className={styles.monthPill}
            onClick={() => setOpenDropdown(openDropdown === 'after' ? null : 'after')}
          >
            <span className={styles.monthPillLabel}>Depois:</span>
            <span className={styles.monthPillValue}>
              {afterMonth ? formatMonth(afterMonth) : '—'}
            </span>
            <ChevronDown
              size={16}
              className={`${styles.monthPillIcon} ${openDropdown === 'after' ? styles.monthPillIconOpen : ''}`}
            />
          </button>
          {openDropdown === 'after' && (
            <div className={styles.monthDropdown}>
              {showYearSelector && (
                <div className={styles.yearSelector}>
                  <button
                    className={styles.yearBtn}
                    disabled={availableYears.indexOf(afterYear) === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      const idx = availableYears.indexOf(afterYear);
                      if (idx > 0) setAfterYear(availableYears[idx - 1]);
                    }}
                  >
                    <ChevronDown size={14} className={styles.yearChevronLeft} />
                  </button>
                  <span className={styles.yearLabel}>{afterYear}</span>
                  <button
                    className={styles.yearBtn}
                    disabled={availableYears.indexOf(afterYear) === availableYears.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      const idx = availableYears.indexOf(afterYear);
                      if (idx < availableYears.length - 1) setAfterYear(availableYears[idx + 1]);
                    }}
                  >
                    <ChevronDown size={14} className={styles.yearChevronRight} />
                  </button>
                </div>
              )}
              {afterAllMonths.map((m) => {
                const hasPhotos = monthsWithPhotos.has(m);
                const isActive = m === afterMonth;
                return (
                  <button
                    key={m}
                    className={`${styles.monthDropdownItem} ${isActive ? styles.monthDropdownItemActive : ''} ${!hasPhotos ? styles.monthDropdownItemEmpty : ''}`}
                    onClick={() => {
                      setAfterMonth(m);
                      setOpenDropdown(null);
                    }}
                  >
                    <span>{formatMonthShort(m)}</span>
                    {hasPhotos ? (
                      <Camera size={12} className={styles.monthPhotoIcon} />
                    ) : (
                      <span className={styles.monthNoPhoto}>sem foto</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Type tabs */}
      {showTypeTabs && (
        <div className={styles.typeTabs}>
          {(['front', 'side', 'back'] as const)
            .filter((t) => allTypes.includes(t))
            .map((t) => (
              <button
                key={t}
                className={`${styles.typeTab} ${beforeType === t ? styles.typeTabActive : ''}`}
                onClick={() => {
                  setBeforeType(t);
                  setAfterType(t);
                }}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
        </div>
      )}

      {/* Comparison display */}
      <div className={styles.comparisonArea}>
        {hasBothPhotos ? (
          viewMode === 'slider' ? (
            <BeforeAfterSlider
              beforeImage={beforePhoto!.photo_url}
              afterImage={afterPhoto!.photo_url}
            />
          ) : (
            <div className={styles.sideBySide}>
              <div className={styles.sideBySideItem}>
                <img
                  src={beforePhoto!.photo_url}
                  alt="Antes"
                  className={styles.sideBySideImage}
                />
                <span className={styles.sideBySideLabel}>ANTES</span>
              </div>
              <div className={styles.sideBySideItem}>
                <img
                  src={afterPhoto!.photo_url}
                  alt="Depois"
                  className={styles.sideBySideImage}
                />
                <span className={styles.sideBySideLabel}>DEPOIS</span>
              </div>
            </div>
          )
        ) : (
          <div className={styles.emptyState}>
            {(!beforePhoto && beforeMonth && !monthsWithPhotos.has(beforeMonth)) ||
            (!afterPhoto && afterMonth && !monthsWithPhotos.has(afterMonth))
              ? 'Sem foto neste mes'
              : 'Selecione meses com fotos do mesmo tipo para comparar'}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className={styles.actions}>
        <button
          className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
          disabled={!hasBothPhotos || saving}
          onClick={handleSave}
        >
          <Download size={16} />
          {saving ? 'Salvando...' : 'Salvar comparacao'}
        </button>
        <button
          className={styles.actionBtn}
          disabled={!hasBothPhotos || saving}
          onClick={handleShare}
        >
          <Share2 size={16} />
          Compartilhar
        </button>
      </div>
    </div>
  );
}
