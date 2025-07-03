import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session) {
    redirect('/auth/signin');
  }
  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
        <p>로그인한 사용자만 볼 수 있는 페이지입니다.</p>
      </main>
    </>
  );
} 