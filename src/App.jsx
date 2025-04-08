import { useState, useEffect } from "react";
import axios from "axios";
import styles from "./App.module.css";
import errorIcon from "../public/icons8-error-100.png";

function App() {
  const [input, setInput] = useState("");
  const [isUrl, setIsUrl] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  // Persist dark mode in localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem("darkMode") === "false";
    setDarkMode(savedMode);
  }, []);

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
    document.body.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const analyzeContent = async () => {
    if (!input.trim()) {
      setError("Please enter text or a URL to analyze.");
      return;
    }

    setLoading(true);
    setResult(null);
    setError("");

    try {
      let newResult;
      if (isUrl) {
        const response = await axios.post("http://localhost:5000/analyze-url", {
          url: input,
        });
        newResult = response.data;
      } else {

       
        const apiKey = import.meta.env.VITE_HUGGING_FACE_API_KEY; 

        const response = await fetch(
          "https://api-inference.huggingface.co/models/unitary/toxic-bert",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ inputs: input }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const toxicityScore = Array.isArray(data[0])
          ? data[0].find((item) => item.label === "toxic")?.score || 0
          : 0;

        newResult = {
          score: Math.round(toxicityScore * 100),
          message:
            toxicityScore > 0.5 ? "Content is harmful" : "Content appears safe",
        };
      }

      setResult(newResult);
      setHistory((prev) => [
        {
          input,
          isUrl,
          score: newResult.score,
          message: newResult.message,
          timestamp: new Date().toLocaleString(),
        },
        ...prev.slice(0, 9), // Limit to 10 entries
      ]);
    } catch (err) {
      setError(`Analysis failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => setHistory([]);
  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  return (
    <div className={`${styles.app} ${darkMode ? styles.dark : ""}`}>
      <header className={styles.header}>
        <h1>Harm Detector</h1>
        <p>Analyze text for potentially harmful content</p>
        <button
          onClick={toggleDarkMode}
          className={styles.themeToggle}
          title="Toggle theme"
        >
          {darkMode ? "☀️ Light" : "🌙 Dark"}
        </button>
      </header>

      <main className={styles.main}>
        <div className={styles.inputSection}>
          <div className={styles.toggle}></div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isUrl
                ? "Enter a URL (e.g., http://example.com)"
                : "Enter text to analyze..."
            }
            className={styles.textarea}
            rows="6"
            aria-label="Content input"
          />
          <button
            onClick={analyzeContent}
            disabled={loading || !input.trim()}
            className={styles.button}
          >
            {loading ? "Analyzing..." : "Check for Harm"}
          </button>
        </div>

        {error && (
          <div className={styles.error}>
            <img src={errorIcon} alt="Error" className={styles.errorIcon} />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className={styles.result}>
            <h2>Analysis Result</h2>
            <p>
              <span>Harm Score:</span>{" "}
              <span className={styles.score}>{result.score}%</span>
            </p>
            <p className={result.score > 50 ? styles.harmful : styles.safe}>
              {result.message}
            </p>
          </div>
        )}

        {history.length > 0 && (
          <div className={styles.history}>
            <div className={styles.historyHeader}>
              <h2>History ({history.length}/10)</h2>
              <button onClick={clearHistory} className={styles.clearButton}>
                Clear
              </button>
            </div>
            <div className={styles.historyList}>
              {history.map((entry, index) => (
                <div key={index} className={styles.historyItem}>
                  <p>
                    <span>{entry.isUrl ? "URL" : "Text"}:</span> {entry.input}
                  </p>
                  <p>
                    <span>Score:</span> {entry.score}%
                  </p>
                  <p
                    className={entry.score > 50 ? styles.harmful : styles.safe}
                  >
                    {entry.message}
                  </p>
                  <p className={styles.timestamp}>{entry.timestamp}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className={styles.footer}>© 2025 Harm Detector</footer>
    </div>
  );
}

export default App;
