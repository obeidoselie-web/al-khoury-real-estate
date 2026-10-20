import { NotFoundState } from '@/components/NotFoundState';

export default function PropertyNotFound() {
  return (
    <NotFoundState
      title="This property isn’t available."
      message="It may have been sold, let, or withdrawn — or the link is incorrect. Similar properties may still be listed."
    />
  );
}
