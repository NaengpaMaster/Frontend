import type { Metadata } from 'next';
import '../styles/index.css';

export const metadata: Metadata = {
  title: '냉파 마스터',
  description: '냉장고 식재료 관리와 레시피 추천 서비스',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
