'use client';

import { useActionState, useRef, useState, useTransition } from 'react';

import { ArrowDownIcon, ArrowUpIcon, TrashIcon, UploadIcon } from '@/components/icons';
import type { ListingPhotoRow } from '@/db/schema';

import styles from '../../admin.module.css';
import { deletePhoto, movePhoto, updatePhotoAlt, uploadPhotos, type PhotoUploadState } from './actions';

/**
 * Upload, order and describe a listing's photos. The first photo is the cover on cards and shares.
 * Every control is a real form, so it also works before hydration.
 */
export function PhotoManager({ listingId, photos }: { listingId: string; photos: ListingPhotoRow[] }) {
  const [upload, uploadAction, uploading] = useActionState<PhotoUploadState, FormData>(uploadPhotos.bind(null, listingId), {});
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const remove = (photo: ListingPhotoRow) => {
    if (!window.confirm('Delete this photo? This cannot be undone.')) return;
    startTransition(async () => {
      const result = await deletePhoto(listingId, photo.id);
      setError(result.error ?? null);
    });
  };

  return (
    <section className={styles.section} aria-labelledby="sec-photos" aria-busy={busy || uploading}>
      <div className={styles.sectionHead}>
        <h2 id="sec-photos" className={styles.sectionTitle}>
          Photos <span className={styles.optional}>({photos.length})</span>
        </h2>
        <p className={styles.sectionHint}>
          The first photo is the cover. Photos are resized to 2400px, converted to WebP and stripped of location data.
        </p>
      </div>

      {(error || upload.error) && (
        <p className={`${styles.banner} ${styles.bannerError}`} role="alert">
          {error ?? upload.error}
        </p>
      )}
      {upload.uploaded ? (
        <p className={`${styles.banner} ${styles.bannerOk}`} role="status" key={upload.at}>
          {upload.uploaded} photo{upload.uploaded === 1 ? '' : 's'} added. Check the descriptions below.
        </p>
      ) : null}

      <form ref={formRef} action={uploadAction}>
        <label
          className={`${styles.dropzone} ${dragging ? styles.dropzoneActive : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (!inputRef.current || e.dataTransfer.files.length === 0) return;
            inputRef.current.files = e.dataTransfer.files;
            formRef.current?.requestSubmit();
          }}
        >
          <UploadIcon size={28} />
          <span>
            <strong>{uploading ? 'Uploading…' : 'Choose photos'}</strong> or drop them here
          </span>
          <span className={styles.hint}>JPEG, PNG, WebP or HEIC · up to 12 MB each · 8 at a time</span>
          <input
            ref={inputRef}
            type="file"
            name="photos"
            accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif"
            multiple
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              if (e.currentTarget.files?.length) formRef.current?.requestSubmit();
            }}
          />
        </label>
        <noscript>
          <button type="submit" className={`${styles.btn} ${styles.btnGhost}`}>
            Upload
          </button>
        </noscript>
      </form>

      {photos.length > 0 && (
        <ol className={styles.photos}>
          {photos.map((photo, index) => (
            <li key={photo.id} className={styles.photo}>
              <div className={styles.photoImg}>
                {/* Plain img: thumbnails of the stored file, no optimisation needed. */}
                <img src={photo.src} alt={photo.altEn} loading="lazy" />
                {index === 0 && <span className={`badge ${styles.cover}`}>Cover</span>}
              </div>
              <form action={updatePhotoAlt.bind(null, listingId, photo.id)} className={styles.form} style={{ gap: 'var(--space-2)' }}>
                <label className={styles.field}>
                  <span className={styles.hint}>Description (English)</span>
                  <input name="altEn" defaultValue={photo.altEn} className={styles.input} maxLength={200} />
                </label>
                <label className={styles.field}>
                  <span className={styles.hint}>Description (Arabic)</span>
                  <input name="altAr" defaultValue={photo.altAr} className={styles.input} dir="rtl" lang="ar" maxLength={200} />
                </label>
                <div className={styles.photoTools}>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    disabled={index === 0 || busy}
                    onClick={() => startTransition(() => movePhoto(listingId, photo.id, 'up'))}
                    aria-label={`Move photo ${index + 1} earlier`}
                  >
                    <ArrowUpIcon size={16} />
                  </button>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    disabled={index === photos.length - 1 || busy}
                    onClick={() => startTransition(() => movePhoto(listingId, photo.id, 'down'))}
                    aria-label={`Move photo ${index + 1} later`}
                  >
                    <ArrowDownIcon size={16} />
                  </button>
                  {index > 0 && (
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`}
                      disabled={busy}
                      onClick={() => startTransition(() => movePhoto(listingId, photo.id, 'cover'))}
                    >
                      Make cover
                    </button>
                  )}
                  <span className={styles.spacer} />
                  <button type="submit" className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`}>
                    Save
                  </button>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={() => remove(photo)}
                    disabled={busy}
                    aria-label={`Delete photo ${index + 1}`}
                  >
                    <TrashIcon size={16} />
                  </button>
                </div>
              </form>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
