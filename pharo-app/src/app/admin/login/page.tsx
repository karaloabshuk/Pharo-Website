import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LoginForm from './LoginForm';

export default async function AdminLoginPage() {
  const session = await getSession();
  if (session?.role === 'ADMIN') {
    redirect('/admin');
  }

  return <LoginForm />;
}