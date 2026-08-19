import '../styles/index.css';
import Providers from './providers';

export const metadata = {
  title: '냉파마스터',
  applicationName: '냉파마스터',
  description: '냉장고 식재료 관리와 레시피 추천 서비스',
  icons: {
    icon: '/brand/naengpa-master-logo-vertical.png',
    apple: '/brand/naengpa-master-logo-vertical.png',
  },
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
