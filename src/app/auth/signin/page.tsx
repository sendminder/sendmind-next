import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export default async function SignInPage() {
  const session = await getServerSession();
  if (session) {
    redirect('/dashboard');
  }
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-2xl font-bold mb-4">로그인</h1>
      <form method="post" action="/api/auth/signin/email" className="flex flex-col gap-2">
        <input
          type="email"
          name="email"
          placeholder="이메일 주소"
          required
          className="border p-2 rounded"
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">로그인 링크 받기</button>
      </form>
    </main>
  );
} 