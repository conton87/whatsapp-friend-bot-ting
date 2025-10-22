import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NotFound() {
  return (
    <Card className="mt-12 text-center">
      <CardHeader>
        <CardTitle>Plan not found</CardTitle>
        <CardDescription>
          We couldn’t find that plan. Double-check the link or{' '}
          <Link href="/" className="text-brand underline">
            start a new one
          </Link>
          .
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
