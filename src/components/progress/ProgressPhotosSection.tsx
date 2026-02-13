import { useState, useEffect, useCallback, useMemo } from 'react';
import { Camera, Loader2, ImagePlus } from 'lucide-react';
import { Card } from '../ui';
import type { ProgressPhoto } from '../../types/database';
import {
  getProgressPhotos,
  insertProgressPhoto,
  deleteProgressPhoto,
  uploadProgressFile,
  getProgressFileUrl,
  deleteProgressFile,
} from '../../services/progressPhotos.service';
import { compressImage, downloadImageFromUrl, shareOrDownload } from '../../utils/imageUtils';
import MonthlyGalleryRow from './MonthlyGalleryRow';
import ExpandedMonthGallery from './ExpandedMonthGallery';
import { ComparisonView } from './ComparisonView';
import { PhotoUploadModal } from './PhotoUploadModal';
import { FullscreenPhotoViewer } from './FullscreenPhotoViewer';
import styles from './ProgressPhotosSection.module.css';

interface ProgressPhotosSectionProps {
  clientId: string;
}

export function ProgressPhotosSection({ clientId }: ProgressPhotosSectionProps) {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);

  const fetchPhotos = useCallback(async () => {
    const { data } = await getProgressPhotos(clientId);
    if (data) {
      setPhotos(data as ProgressPhoto[]);
    }
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const photosByMonth = useMemo(() => {
    const grouped: Record<string, ProgressPhoto[]> = {};
    for (const photo of photos) {
      const month = photo.taken_at.slice(0, 7);
      if (!grouped[month]) grouped[month] = [];
      grouped[month].push(photo);
    }
    return grouped;
  }, [photos]);

  const availableMonths = useMemo(() => {
    return Object.keys(photosByMonth).sort();
  }, [photosByMonth]);

  async function handleUpload(file: File, type: 'front' | 'side' | 'back', date: string) {
    const compressed = await compressImage(file);
    const fileName = `${clientId}/${date}/${type}-${Date.now()}.jpg`;

    const { error: uploadError } = await uploadProgressFile(fileName, compressed);
    if (uploadError) {
      throw new Error('Erro ao fazer upload da foto.');
    }

    const { data: { publicUrl } } = getProgressFileUrl(fileName);

    const { error: insertError } = await insertProgressPhoto({
      client_id: clientId,
      photo_url: publicUrl,
      photo_type: type,
      taken_at: date,
    });
    if (insertError) {
      throw new Error('Erro ao salvar foto.');
    }

    await fetchPhotos();
  }

  async function handleDelete(photo: ProgressPhoto) {
    const confirmed = window.confirm('Tem certeza que deseja excluir esta foto?');
    if (!confirmed) return;

    // Extract file path from URL
    const urlParts = photo.photo_url.split('/progress-photos/');
    if (urlParts[1]) {
      await deleteProgressFile(decodeURIComponent(urlParts[1]));
    }
    await deleteProgressPhoto(photo.id);
    await fetchPhotos();
  }

  async function handleDownload(url: string, fileName: string) {
    await downloadImageFromUrl(url, fileName);
  }

  async function handleShare(url: string) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      await shareOrDownload({
        blob,
        fileName: 'progresso.jpg',
        title: 'Meu progresso',
      });
    } catch {
      // Fallback: just download
      await downloadImageFromUrl(url, 'progresso.jpg');
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <Card className={styles.placeholder}>
          <Loader2 size={32} className={styles.spinning} />
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Monthly gallery row */}
      {availableMonths.length > 0 && (
        <MonthlyGalleryRow
          months={availableMonths}
          photosByMonth={photosByMonth}
          selectedMonth={expandedMonth}
          onSelectMonth={(month) =>
            setExpandedMonth(expandedMonth === month ? null : month)
          }
          onAddPhoto={() => setUploadModalOpen(true)}
        />
      )}

      {/* Expanded month gallery */}
      {expandedMonth && photosByMonth[expandedMonth] && (
        <ExpandedMonthGallery
          photos={photosByMonth[expandedMonth]}
          month={expandedMonth}
          onPhotoClick={(url) => setFullscreenPhoto(url)}
          onDelete={handleDelete}
          onDownload={handleDownload}
          onShare={handleShare}
          onAddPhoto={() => setUploadModalOpen(true)}
          onClose={() => setExpandedMonth(null)}
        />
      )}

      {/* Comparison view */}
      {photos.length >= 2 && (
        <ComparisonView
          photos={photos}
          availableMonths={availableMonths}
          photosByMonth={photosByMonth}
        />
      )}

      {/* Placeholder states */}
      {photos.length === 1 && (
        <Card className={styles.placeholder}>
          <img
            src={photos[0].photo_url}
            alt="Progresso"
            className={styles.singlePhoto}
          />
          <p className={styles.placeholderText}>
            Adicione mais uma foto para comparar seu progresso!
          </p>
        </Card>
      )}

      {photos.length === 0 && (
        <Card className={styles.placeholder}>
          <div className={styles.placeholderIcon}>
            <ImagePlus size={40} />
          </div>
          <p className={styles.placeholderTitle}>Acompanhe sua evolucao</p>
          <p className={styles.placeholderText}>
            Tire fotos regularmente para ver seu progresso ao longo do tempo
          </p>
        </Card>
      )}

      {/* Add photo button */}
      <button
        className={styles.addButton}
        onClick={() => setUploadModalOpen(true)}
      >
        <Camera size={18} />
        Adicionar foto
      </button>

      {/* Upload modal */}
      <PhotoUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUpload={handleUpload}
      />

      {/* Fullscreen viewer */}
      <FullscreenPhotoViewer
        isOpen={!!fullscreenPhoto}
        photoUrl={fullscreenPhoto}
        onClose={() => setFullscreenPhoto(null)}
      />
    </div>
  );
}
