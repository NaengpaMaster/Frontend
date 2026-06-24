import '../styles/index.css';
import Providers from './providers';

export const metadata = {
  title: '냉파 마스터',
  description: '냉장고 식재료 관리와 레시피 추천 서비스',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
