import { Camera, Image } from 'lucide-react';
import type { ProgressPhoto } from '../../types/database';
import styles from './MonthlyGalleryRow.module.css';

interface MonthlyGalleryRowProps {
  months: string[];
  photosByMonth: Record<string, ProgressPhoto[]>;
  selectedMonth: string | null;
  onSelectMonth: (month: string) => void;
  onAddPhoto: () => void;
}

function formatMonthLabel(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const monthIndex = parseInt(monthStr, 10) - 1;
  const date = new Date(year, monthIndex, 1);
  const short = date.toLocaleDateString('pt-BR', { month: 'short' });
  return short.replace('.', '') + ' ' + year;
}

export default function MonthlyGalleryRow({
  months,
  photosByMonth,
  selectedMonth,
  onSelectMonth,
  onAddPhoto,
}: MonthlyGalleryRowProps) {
  return (
    <div className={styles.scrollContainer}>
      {months.map((month) => {
        const photos = photosByMonth[month] || [];
        const firstPhoto = photos[0];
        const isSelected = selectedMonth === month;

        return (
          <div
            key={month}
            className={`${styles.monthCard} ${isSelected ? styles.selected : ''}`}
            onClick={() => onSelectMonth(month)}
          >
            {firstPhoto ? (
              <img
                src={firstPhoto.photo_url}
                alt={formatMonthLabel(month)}
                className={styles.thumbnail}
                loading="lazy"
              />
            ) : (
              <div className={styles.noThumb}>
                <Image size={20} />
              </div>
            )}
            {photos.length > 0 && (
              <span className={styles.badge}>{photos.length}</span>
            )}
            <span className={styles.monthLabel}>{formatMonthLabel(month)}</span>
          </div>
        );
      })}

      <button
        type="button"
        className={styles.addCard}
        onClick={onAddPhoto}
      >
        <Camera size={20} />
        <span>Adicionar</span>
      </button>
    </div>
  );
}
