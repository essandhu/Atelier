import Link from 'next/link';

const NotFound = (): React.ReactElement => (
  <main style={{ padding: '2rem', fontFamily: 'Georgia, serif' }}>
    <h1>Not found</h1>
    <p>
      That page doesn&rsquo;t exist. <Link href="/">Return home</Link>.
    </p>
  </main>
);

export default NotFound;
