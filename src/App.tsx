import { useEffect, useState } from "react";
import "./App.css";

type Manga = {
  id: number;
  title: string;
  coverUrl: string;
};

type BatchResponse = {
  id: number;
  mangas: Manga[];
};

type MangaPage = {
  id: number;
  position: number;
  url: string;
};

type MangaResponse = {
  id: number;
  title: string;
  coverUrl: string;
  pages: MangaPage[];
};

const API_URL = "http://localhost:3000";

function App() {
  const [batch, setBatch] = useState<BatchResponse | null>(null);
  const [selectedManga, setSelectedManga] = useState<MangaResponse | null>(
    null,
  );

  const [loadingBatch, setLoadingBatch] = useState(true);
  const [loadingManga, setLoadingManga] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    const telegram = window.Telegram?.WebApp;

    telegram?.ready();
    telegram?.expand();
    const params = new URLSearchParams(window.location.search);
    const batchId = params.get("batch");

    if (!batchId) {
      setError("Batch ID не указан");
      setLoadingBatch(false);
      return;
    }

    async function loadBatch() {
      try {
        const response = await fetch(`${API_URL}/api/batch/${batchId}`);

        if (!response.ok) {
          const text = await response.text();

          throw new Error(`Ошибка ${response.status}: ${text}`);
        }

        const data: BatchResponse = await response.json();

        setBatch(data);
      } catch (error) {
        console.error(error);

        setError(
          error instanceof Error
            ? error.message
            : "Не удалось загрузить подборку",
        );
      } finally {
        setLoadingBatch(false);
      }
    }

    loadBatch();
  }, []);

  async function openManga(mangaId: number) {
    setLoadingManga(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/manga/${mangaId}`);

      if (!response.ok) {
        const text = await response.text();

        throw new Error(`Ошибка ${response.status}: ${text}`);
      }

      const data: MangaResponse = await response.json();

      setSelectedManga(data);

      window.scrollTo({
        top: 0,
        behavior: "instant",
      });
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error ? error.message : "Не удалось загрузить мангу",
      );
    } finally {
      setLoadingManga(false);
    }
  }

  function closeManga() {
    setSelectedManga(null);

    window.scrollTo({
      top: 0,
      behavior: "instant",
    });
  }

  if (loadingBatch) {
    return (
      <main className="page">
        <p className="status">Загрузка...</p>
      </main>
    );
  }

  if (error && !batch) {
    return (
      <main className="page">
        <p className="status">{error}</p>
      </main>
    );
  }

  if (selectedManga) {
    return (
      <main className="reader-page">
        <div className="reader-header">
          <button type="button" className="back-button" onClick={closeManga}>
            ← Назад
          </button>

          <div className="reader-title">{selectedManga.title}</div>
        </div>

        <div className="reader">
          <img
            src={`${API_URL}${selectedManga.coverUrl}`}
            alt={selectedManga.title}
            className="reader-image"
          />

          {selectedManga.pages.map((page) => (
            <img
              key={page.id}
              src={`${API_URL}${page.url}`}
              alt={`${selectedManga.title}, страница ${page.position}`}
              className="reader-image"
              loading="lazy"
            />
          ))}
        </div>
      </main>
    );
  }

  if (!batch) {
    return null;
  }

  return (
    <main className="page">
      {error && <p className="status error-status">{error}</p>}

      <div className="grid">
        {batch.mangas.map((manga) => (
          <button
            key={manga.id}
            className="manga-card"
            type="button"
            onClick={() => openManga(manga.id)}
            disabled={loadingManga}
          >
            <img
              src={`${API_URL}${manga.coverUrl}`}
              alt={manga.title}
              className="cover"
            />

            <div className="title">{manga.title}</div>
          </button>
        ))}
      </div>

      {loadingManga && <div className="loading-overlay">Загрузка манги...</div>}
    </main>
  );
}

export default App;
