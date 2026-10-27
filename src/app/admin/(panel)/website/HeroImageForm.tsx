'use client';

import { useActionState, useRef, useTransition } from 'react';

import { UploadIcon } from '@/components/icons';
import type { SiteImage } from '@/lib/site';

import styles from '../../admin.module.css';
import { resetHeroImage, uploadHeroImage, type HeroState } from './actions';

/** The home page photo: preview, replace (processed like listing photos), or go back to the original. */
export function HeroImageForm({ image, isDefault }: { image: SiteImage; isDefault: boolean }) {
  const [state, action, pending] = useActionState<HeroState, FormData>(uploadHeroImage, {});
  const [resetting, startReset] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <section className={styles.section} aria-labelledby="hero-photo">
      <div className={styles.sectionHead}>
        <h2 id="hero-photo" className={styles.sectionTitle}>
          Home page photo
        </h2>
        <p className={styles.sectionHint}>A wide landscape photo works best (at least 2000 px across). It is resized and stripped of location data.</p>
      </div>
      <div className={styles.heroPreview}>
        {/* Plain img: a preview of the stored file. */}
        <img src={image.src} alt="Current home page photo" />
      </div>
      {state.error && (
        <p className={`${styles.banner} ${styles.bannerError}`} role="alert" key={state.at}>
          {state.error}
        </p>
      )}
      {state.at && !state.error && (
        <p className={`${styles.banner} ${styles.bannerOk}`} role="status" key={state.at}>
          Photo replaced. It is live on the home page.
        </p>
      )}
      <form ref={formRef} action={action} className={styles.actions}>
        <label className={`${styles.btn} ${styles.btnGhost}`}>
          <UploadIcon size={16} />
          {pending ? 'Uploading…' : 'Replace photo'}
          <input
            type="file"
            name="hero"
            accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif"
            className="sr-only"
            disabled={pending}
            onChange={(e) => {
              if (e.currentTarget.files?.length) formRef.current?.requestSubmit();
            }}
          />
        </label>
        {!isDefault && (
          <button
            type="button"
            className={`${styles.btn} ${styles.btnGhost}`}
            disabled={resetting}
            onClick={() => {
              if (window.confirm('Go back to the original home page photo?')) startReset(() => resetHeroImage());
            }}
          >
            Use the original photo
          </button>
        )}
      </form>
    </section>
  );
}
