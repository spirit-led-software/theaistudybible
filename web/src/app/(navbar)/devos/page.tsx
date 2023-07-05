import { getDevos } from '@/lib/client/devos';
import { redirect } from 'next/navigation';

export default async function DevoPageRoot() {
  const { devos, error } = await getDevos({
    next: {
      revalidate: 10,
    },
  });

  if (error) {
    throw error;
  }

  if (devos.length !== 0) {
    redirect(`/devos/${devos[0].id}`);
  }

  return <div>Coming Soon!</div>;
}
