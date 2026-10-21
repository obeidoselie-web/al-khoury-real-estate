import type { Metadata } from 'next';
import Link from 'next/link';

import { getDictionary } from '@/i18n/dictionaries';
import { canAssignListing, canFeatureListing } from '@/lib/admin/permissions';
import { listAssignableStaff } from '@/lib/admin/queries';
import { requireUser } from '@/lib/auth/session';

import styles from '../../../admin.module.css';
import { saveListing } from '../actions';
import { ListingForm } from '../ListingForm';

export const metadata: Metadata = { title: 'New listing' };

export default async function NewListingPage() {
  const user = await requireUser();
  const staff = canAssignListing(user) ? await listAssignableStaff() : [];

  return (
    <>
      <header className={styles.pageHead}>
        <div>
          <Link href="/admin/listings" className={styles.crumb}>
            ‹ Listings
          </Link>
          <h1 className={styles.pageTitle}>New listing</h1>
          <p className={styles.pageSub}>Save it as a draft, add photos on the next screen, then publish.</p>
        </div>
      </header>
      <ListingForm
        action={saveListing.bind(null, null)}
        listing={null}
        staff={staff}
        regionLabels={getDictionary('en').regions}
        canAssign={canAssignListing(user)}
        canFeature={canFeatureListing(user)}
      />
    </>
  );
}
