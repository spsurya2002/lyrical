import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { FixtureBanner } from './components/FixtureBanner.js';
import { SongPage } from './pages/SongPage.js';

/**
 * Route shell. The landing page and search arrive in their own phases; for now
 * the root lists the seeded songs so the song page is reachable.
 */
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/song/:slug" element={<SongPage />} />
      </Routes>
    </BrowserRouter>
  );
}

const SEEDED = [
  { slug: 'kun-faya-kun', label: 'Kun Faya Kun', note: 'fully grounded' },
  { slug: 'arziyan', label: 'Arziyan', note: '4 of 26 lines explained' },
  { slug: 'piya-haji-ali', label: 'Piya Haji Ali', note: 'below the source bar' },
  { slug: 'khwaja-mere-khwaja', label: 'Khwaja Mere Khwaja', note: 'one word, two meanings' },
  { slug: 'tere-bina', label: 'Tere Bina', note: 'stale explanation' },
];

function Home() {
  return (
    <main className="mx-auto max-w-[1240px] px-4 py-12 sm:px-6">
      <FixtureBanner />
      <h1 className="font-lyric text-display text-primary">LyricSense</h1>
      <p className="mt-4 max-w-measure text-body text-secondary">
        Hindi film songs, explained — word by word, line by line, grounded in real sources.
      </p>
      <ul className="mt-10 space-y-2">
        {SEEDED.map((song) => (
          <li key={song.slug}>
            <Link
              to={`/song/${song.slug}`}
              className="inline-flex items-baseline gap-3 rounded-md px-3 py-2 text-lg text-primary transition-colors hover:bg-surface"
            >
              <span className="font-lyric">{song.label}</span>
              <span className="text-xs text-muted">{song.note}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
