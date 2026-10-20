import { NotFoundState } from '@/components/NotFoundState';

export default function NotFound() {
  return (
    <NotFoundState
      title="We can’t find that page."
      message="The link may be out of date or mistyped. You can still browse every available property."
    />
  );
}
