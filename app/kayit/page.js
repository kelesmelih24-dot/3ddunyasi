import { Suspense } from 'react';
import AuthForm from '@/components/AuthForm';
export const metadata = { title: 'Hesap oluştur' };
export default function Page() { return <Suspense><AuthForm mode="kayit" /></Suspense>; }
