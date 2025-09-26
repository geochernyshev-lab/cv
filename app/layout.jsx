export const metadata = {
  title: 'ResumeTailor Pro — Live Match & Gaps',
  description: 'Подгонка резюме под вакансию за 60 секунд'
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body style={{margin:0,fontFamily:'Inter, system-ui, sans-serif', background:'#0b1220', color:'#e6e9ef'}}>
        {children}
      </body>
    </html>
  );
}
