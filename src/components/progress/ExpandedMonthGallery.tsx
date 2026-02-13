import { useState, useEffect, useCallback } from 'react';
import { X, MoreVertical, Download, Share2, Trash2, Plus } from 'lucide-react';
import type { ProgressPhoto } from '../../types/database';
import styles from './ExpandedMonthGallery.module.css';

interface ExpandedMonthGalleryProps {
  photos: ProgressPhoto[];
  month: string;
  onPhotoClick: (url: string) => void;
  onDelete: (photo: ProgressPhoto) => void;
  onDownload: (url: string, fileName: string) => void;
  onShare: (url: string) => void;
  onAddPhoto: () => void;
  onClose: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  front: 'Frente',
  side: 'Lado',
  back: 'Costas',
};

function formatMonthFull(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const monthIndex = parseInt(monthStr, 10) - 1;
  const date = new Date(year, monthIndex, 1);
  const name = date.toLocaleDateString('pt-BR', { month: 'long' });
  return name.charAt(0).toUpperCase() + name.slice(1) + ' ' + year;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

export default function ExpandedMonthGallery({
  photos,
  month,
  onPhotoClick,
  onDelete,
  onDownload,
  onShare,
  onAddPhoto,
  onClose,
}: ExpandedMonthGalleryProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const closeMenu = useCallback(() => {
    setOpenMenuId(null);
  }, []);

  useEffect(() => {
    if (!openMenuId) return;

    const handleClick = () => closeMenu();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [openMenuId, closeMenu]);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.monthTitle}>{formatMonthFull(month)}</span>
        <button type="button" className={styles.closeBtn} onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className={styles.grid}>
        {photos.length === 0 && (
          <div className={styles.emptyState}>Nenhuma foto neste mes</div>
        )}
        {photos.map((photo) => (
          <div key={photo.id} className={styles.photoCell}>
            <img
              src={photo.photo_url}
              alt={TYPE_LABELS[photo.photo_type] || photo.photo_type}
              className={styles.photoImg}
              loading="lazy"
              onClick={() => onPhotoClick(photo.photo_url)}
            />
            <span className={styles.typePill}>
              {TYPE_LABELS[photo.photo_type] || photo.photo_type}
            </span>
            <span className={styles.dateOverlay}>
              {formatDate(photo.taken_at)}
            </span>
            <button
              type="button"
              className={styles.menuBtn}
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuId(openMenuId === photo.id ? null : photo.id);
              }}
            >
              <MoreVertical size={14} />
            </button>
            {openMenuId === photo.id && (
              <div
                className={styles.menuWrapper}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={styles.dropdown}>
                  <button
                    type="button"
                    className={styles.dropdownItem}
                    onClick={() => {
                      closeMenu();
                      onDownload(photo.photo_url, `foto_${photo.photo_type}_${photo.taken_at}.jpg`);
                    }}
                  >
                    <Download size={14} />
                    Baixar
                  </button>
                  <button
                    type="button"
                    className={styles.dropdownItem}
                    onClick={() => {
                      closeMenu();
                      onShare(photo.photo_url);
                    }}
                  >
                    <Share2 size={14} />
                    Compartilhar
                  </button>
                  <button
                    type="button"
                    className={styles.dropdownItemDanger}
                    onClick={() => {
                      closeMenu();
                      onDelete(photo);
                    }}
                  >
                    <Trash2 size={14} />
                    Excluir
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        className={styles.addButton}
        onClick={onAddPhoto}
      >
        <Plus size={16} />
        Adicionar foto
      </button>
    </div>
  );
}
