import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ExternalIcon } from '@/components/icons';
import { getDictionary } from '@/i18n/dictionaries';
import { STATUS_LABELS } from '@/lib/admin/format';
import { canAssignListing, canDeleteListing, canEditListing, canFeatureListing } from '@/lib/admin/permissions';
import { getListingForEdit, listAssignableStaff } from '@/lib/admin/queries';
import { requireUser } from '@/lib/auth/session';

import styles from '../../../admin.module.css';
import { deleteListing, saveListing } from '../actions';
import { ConfirmButton } from '../../ConfirmButton';
import { ListingForm } from '../ListingForm';
import { PhotoManager } from '../PhotoManager';

export const metadata: Metadata = { title: 'Edit listing' };

export default async function EditListingPage({ params, searchParams }: PageProps<'/admin/listings/[id]'>) {
  const user = await requireUser();
  const { id } = await params;
  const { created } = await searchParams;
  const found = await getListingForEdit(id);
  if (!found || !canEditListing(user, found.listing)) notFound();
  const { listing, photos } = found;
  const staff = canAssignListing(user) ? await listAssignableStaff() : [];

  return (
    <>
      <header className={styles.pageHead}>
        <div>
          <Link href="/admin/listings" className={styles.crumb}>
            ‹ Listings
          </Link>
          <h1 className={styles.pageTitle}>{listing.titleEn || 'Untitled listing'}</h1>
          <p className={styles.pageSub}>
            <span className={`${styles.pill} ${styles[`pill_${listing.status}`]}`}>{STATUS_LABELS[listing.status]}</span>{' '}
            /listings/{listing.id}
          </p>
        </div>
        {listing.status === 'published' && (
          <div className={styles.actions}>
            <a href={`/en/listings/${listing.id}`} target="_blank" rel="noopener" className={`${styles.btn} ${styles.btnGhost}`}>
              <ExternalIcon size={16} />
              View on site
            </a>
            <a href={`/ar/listings/${listing.id}`} target="_blank" rel="noopener" className={`${styles.btn} ${styles.btnGhost}`} lang="ar">
              بالعربية
            </a>
          </div>
        )}
      </header>

      {created && (
        <p className={`${styles.banner} ${styles.bannerOk}`} role="status" style={{ marginBottom: 'var(--space-4)' }}>
          Draft created. Add photos below, then set the status to Published.
        </p>
      )}

      <div className={styles.form}>
        <PhotoManager listingId={listing.id} photos={photos} />
        <ListingForm
          action={saveListing.bind(null, listing.id)}
          listing={listing}
          staff={staff}
          regionLabels={getDictionary('en').regions}
          canAssign={canAssignListing(user)}
          canFeature={canFeatureListing(user)}
          aside={
            canDeleteListing(user) ? (
              <ConfirmButton
                action={deleteListing.bind(null, listing.id)}
                message={`Delete “${listing.titleEn}” and its photos permanently? Archiving keeps it instead.`}
                className={`${styles.btn} ${styles.btnDanger}`}
              >
                Delete
              </ConfirmButton>
            ) : null
          }
        />
      </div>
    </>
  );
}
