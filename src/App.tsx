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

type SupportProgress = {
  stars: number;
  goal: number;
};

const API_URL = "https://api.173.249.59.215.sslip.io";
const BOT_USERNAME = "YOURSUNBAEBOT";

function App() {
  const telegramStartParam =
    window.Telegram?.WebApp?.initDataUnsafe?.start_param;

  const urlBatch =
    new URLSearchParams(window.location.search).get("batch");

  const rawBatch = telegramStartParam || urlBatch;

  const batchId = rawBatch?.startsWith("batch_")
    ? rawBatch.replace("batch_", "")
    : rawBatch;

  const [batch, setBatch] = useState<BatchResponse | null>(null);
  const [selectedManga, setSelectedManga] = useState<MangaResponse | null>(
    null,
  );

  const [loadingBatch, setLoadingBatch] = useState(Boolean(batchId));
  const [loadingManga, setLoadingManga] = useState(false);

  const [error, setError] = useState("");

  const [supportProgress, setSupportProgress] =
    useState<SupportProgress | null>(null);

  useEffect(() => {
    const telegram = window.Telegram?.WebApp;

    telegram?.ready();
    telegram?.expand();

    if (!batchId) {
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
            : "Sorry, couldn't load the batch. Please try again later.",
        );
      } finally {
        setLoadingBatch(false);
      }
    }

    loadBatch();
  }, [batchId]);

  useEffect(() => {
    async function loadSupportProgress() {
      try {
        const response = await fetch(`${API_URL}/api/support-progress`);

        if (!response.ok) {
          return;
        }

        const data: SupportProgress = await response.json();

        setSupportProgress(data);
      } catch (error) {
        console.error("Failed to load support progress:", error);
      }
    }

    loadSupportProgress();
  }, []);

  const supportPercent = supportProgress
    ? Math.min(100, (supportProgress.stars / supportProgress.goal) * 100)
    : 0;

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
        error instanceof Error
          ? error.message
          : "Sorry, couldn't load the manga. Please try again later.",
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

  function openSupport() {
    const url = `https://t.me/${BOT_USERNAME}?start=support`;

    const telegram = window.Telegram?.WebApp;

    if (telegram?.openTelegramLink) {
      telegram.openTelegramLink(url);
      return;
    }

    window.open(url, "_blank");
  }

  if (loadingBatch) {
    return (
      <main className="page">
        <p className="status">Loading...</p>
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

        <div className="reader-support">
          <div className="reader-support-icon">💜</div>

          <h2>Enjoyed the manga?</h2>

          <p>
            Support the project and help us keep the reader running and bring
            you more manga.
          </p>

          {supportProgress && (
            <div className="support-progress">
              <div className="support-progress-header">
                <span>Monthly goal</span>

                <strong>
                  {supportProgress.stars} / {supportProgress.goal} ⭐
                </strong>
              </div>

              <div className="support-progress-track">
                <div
                  className="support-progress-fill"
                  style={{
                    width: `${supportPercent}%`,
                  }}
                />
              </div>
            </div>
          )}

          <button
            type="button"
            className="reader-support-button"
            onClick={openSupport}
          >
            Support the Project
          </button>

          <span className="reader-support-note">
            Every contribution helps 💜
          </span>
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
      <div className="support-banner">
        <span>Support the project, so it doesn't close...</span>

        <button type="button" className="support-link" onClick={openSupport}>
          Read more
        </button>
      </div>
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

      {loadingManga && <div className="loading-overlay">Loading...</div>}
    </main>
  );
}

export default App;
