import { useState, useEffect } from 'react';
import Header from '../components/Header.jsx';
import InputSection from '../components/InputSection.jsx';
import Result from '../components/Result.jsx';
import BatchResult from '../components/BatchResult.jsx';
import History from '../components/History.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import styles from '../App.module.css';

function Home() {
  const [input, setInput] = useState('');
  const [threshold, setThreshold] = useState(50);
  const [result, setResult] = useState(null);
  const [batchResults, setBatchResults] = useState([]);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const MAX_LENGTH = 2000;

  // Load history from localStorage on mount
  useEffect(() => {
    const storedHistory = localStorage.getItem('history');
    if (storedHistory) {
      setHistory(JSON.parse(storedHistory));
    }
  }, []);

  const analyzeContent = async (text = input, isBatch = false) => {
    if (!text.trim()) {
      setError('Please enter text to analyze.');
      return;
    }

    setLoading(true);
    if (!isBatch) setResult(null);
    setError('');

    try {
      console.log('Analyzing content:', text);
      const truncatedText = text.length > MAX_LENGTH ? text.substring(0, MAX_LENGTH) : text;
      const newResult = await analyzeText(truncatedText);
      console.log('Analysis result:', newResult);

      if (isBatch) {
        return newResult;
      } else {
        setResult(newResult);
        const newHistoryEntry = {
          input: text,
          score: newResult.score,
          message: newResult.message,
          sentiment: newResult.sentiment,
          sentimentScore: newResult.sentimentScore,
          timestamp: new Date().toLocaleString(),
          threshold,
        };
        console.log('Adding to local history:', newHistoryEntry);
        setHistory((prev) => {
          const newHistory = [newHistoryEntry, ...prev.slice(0, 9)];
          localStorage.setItem('history', JSON.stringify(newHistory)); // Save to localStorage
          return newHistory;
        });
      }
    } catch (err) {
      console.error('Analyze content error:', err.message);
      setError(`Analysis failed: ${err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const analyzeText = async (text) => {
    const apiKey = import.meta.env.VITE_HUGGING_FACE_API_KEY;
    if (!apiKey) {
      throw new Error('API key is missing. Check your .env file.');
    }

    const toxicityResponse = await fetch(
      'https://api-inference.huggingface.co/models/unitary/toxic-bert',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: text }),
      }
    );

    if (!toxicityResponse.ok) {
      const errorText = await toxicityResponse.text();
      throw new Error(`Toxicity API Error ${toxicityResponse.status}: ${errorText}`);
    }

    const toxicityData = await toxicityResponse.json();
    const toxicityScore = Array.isArray(toxicityData[0])
      ? toxicityData[0].find(item => item.label === 'toxic')?.score || 0
      : 0;

    const sentimentResponse = await fetch(
      'https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: text }),
      }
    );

    if (!sentimentResponse.ok) {
      const errorText = await toxicityResponse.text();
      throw new Error(`Sentiment API Error ${sentimentResponse.status}: ${errorText}`);
    }

    const sentimentData = await sentimentResponse.json();
    const sentimentResult = Array.isArray(sentimentData[0]) ? sentimentData[0] : [];
    const positiveScore = sentimentResult.find(item => item.label === 'POSITIVE')?.score || 0;
    const negativeScore = sentimentResult.find(item => item.label === 'NEGATIVE')?.score || 0;
    const sentiment = positiveScore > negativeScore ? 'Positive' : 'Negative';
    const sentimentScore = Math.round((positiveScore > negativeScore ? positiveScore : negativeScore) * 100);

    return {
      score: Math.round(toxicityScore * 100),
      message: toxicityScore * 100 > threshold ? 'Content is harmful' : 'Content appears safe',
      sentiment,
      sentimentScore,
    };
  };

  const analyzeBatch = async (texts) => {
    setLoading(true);
    setBatchResults([]);
    setError('');

    try {
      const results = await Promise.all(
        texts.map(async (text) => {
          const truncatedText = text.length > MAX_LENGTH ? text.substring(0, MAX_LENGTH) : text;
          const result = await analyzeContent(truncatedText, true);
          return { text, ...result };
        })
      );
      const validResults = results.filter((r) => r !== null);
      setBatchResults(validResults);

      const historyEntries = validResults.map((result) => ({
        input: result.text,
        score: result.score,
        message: result.message,
        sentiment: result.sentiment,
        sentimentScore: result.sentimentScore,
        timestamp: new Date().toLocaleString(),
        threshold,
      }));
      setHistory((prev) => {
        const newHistory = [...historyEntries, ...prev.slice(0, 9 - historyEntries.length)];
        localStorage.setItem('history', JSON.stringify(newHistory)); // Save to localStorage
        return newHistory;
      });
    } catch (err) {
      setError(`Batch analysis failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Clear history and localStorage
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('history');
  };

  // useEffect(() => {
  //   if (!input.trim()) return;
  //   const debounce = setTimeout(() => {
  //     analyzeContent(input).catch(err => console.error('Real-time analysis error:', err));
  //   }, 10000);
  //   return () => clearTimeout(debounce);
  // }, [input, threshold]);

  return (
    <>
      <Header />
      <main className={styles.main}>
        <InputSection
          input={input}
          setInput={setInput}
          threshold={threshold}
          setThreshold={setThreshold}
          analyzeContent={analyzeContent}
          analyzeBatch={analyzeBatch}
          loading={loading}
        />
        <ErrorMessage error={error} />
        <Result result={result} />
        <BatchResult batchResults={batchResults} />
        <History history={history} clearHistory={clearHistory} />
      </main>
      <footer className={styles.footer}>
        © 2025 Harm Detector - College Project
      </footer>
    </>
  );
}

export default Home;