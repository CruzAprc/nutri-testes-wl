import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, ImagePlus } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { getBrasiliaDate } from '../../utils/date';
import styles from './PhotoUploadModal.module.css';

type PhotoType = 'front' | 'side' | 'back';

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, type: PhotoType, date: string) => Promise<void>;
  defaultDate?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const TYPE_LABELS: { value: PhotoType; label: string }[] = [
  { value: 'front', label: 'Frente' },
  { value: 'side', label: 'Lado' },
  { value: 'back', label: 'Costas' },
];

export function PhotoUploadModal({
  isOpen,
  onClose,
  onUpload,
  defaultDate,
}: PhotoUploadModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoType, setPhotoType] = useState<PhotoType>('front');
  const [date, setDate] = useState(defaultDate ?? getBrasiliaDate());
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setStep(1);
    setSelectedFile(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPhotoType('front');
    setDate(defaultDate ?? getBrasiliaDate());
    setUploading(false);
    setError(null);
  }, [defaultDate]);

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen, resetState]);

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Selecione um arquivo de imagem.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('A imagem deve ter no maximo 5MB.');
      return;
    }

    setError(null);
    setSelectedFile(file);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setStep(2);
  }

  async function handleSubmit() {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);
    try {
      await onUpload(selectedFile, photoType, date);
      onClose();
    } catch {
      setError('Erro ao enviar foto. Tente novamente.');
    } finally {
      setUploading(false);
    }
  }

  function handleClose() {
    if (!uploading) {
      onClose();
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Enviar foto"
      subtitle="Registre seu progresso"
    >
      {step === 1 && (
        <div className={styles.sourceButtons}>
          <button
            className={styles.sourceButton}
            onClick={() => cameraInputRef.current?.click()}
          >
            <span className={styles.sourceIcon}>
              <Camera size={22} />
            </span>
            Tirar foto
          </button>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className={styles.hiddenInput}
            onChange={handleFileSelected}
          />

          <button
            className={styles.sourceButton}
            onClick={() => galleryInputRef.current?.click()}
          >
            <span className={styles.sourceIcon}>
              <ImagePlus size={22} />
            </span>
            Escolher da galeria
          </button>
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className={styles.hiddenInput}
            onChange={handleFileSelected}
          />

          {error && <p className={styles.error}>{error}</p>}
        </div>
      )}

      {step === 2 && previewUrl && (
        <div className={styles.previewContainer}>
          <img
            src={previewUrl}
            alt="Preview"
            className={styles.preview}
          />

          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>Tipo da foto</span>
            <div className={styles.typeSelector}>
              {TYPE_LABELS.map(({ value, label }) => (
                <button
                  key={value}
                  className={`${styles.typePill} ${
                    photoType === value ? styles.typePillActive : ''
                  }`}
                  onClick={() => setPhotoType(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>Data</span>
            <input
              type="date"
              className={styles.dateInput}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <Button
            variant="primary"
            fullWidth
            loading={uploading}
            onClick={handleSubmit}
          >
            Enviar foto
          </Button>
        </div>
      )}
    </Modal>
  );
}
