import styles from '../App.module.css';

function History({ history, clearHistory }) {
  if (history.length === 0) return null;

  const exportHistory = () => {
    const csvContent = [
      'Timestamp,Input,Score,Message,Sentiment,SentimentScore,Threshold',
      ...history.map((entry) =>
        `"${entry.timestamp}","${entry.input.replace(/"/g, '""')}",${entry.score},"${entry.message}",${entry.sentiment},${entry.sentimentScore},${entry.threshold}`
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'harm_detector_history.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.history}>
      <div className={styles.historyHeader}>
        <h2>History ({history.length}/10)</h2>
        <div>
          <button onClick={exportHistory} className={styles.exportButton}>
            Download History
          </button>
          <button onClick={clearHistory} className={styles.clearButton}>
            Clear
          </button>
        </div>
      </div>
      <div className={styles.historyList}>
        {history.map((entry, index) => (
          <div key={index} className={styles.historyItem}>
            <p>
              <span>Text:</span> {entry.input}
            </p>
            <p>
              <span>Score:</span> {entry.score}%
            </p>
            <p>
              <span>Threshold:</span> {entry.threshold}%
            </p>
            <p className={entry.score > entry.threshold ? styles.harmful : styles.safe}>
              {entry.message}
            </p>
            <p>
              <span>Sentiment:</span>{' '}
              <span className={entry.sentiment === 'Positive' ? styles.positive : styles.negative}>
                {entry.sentiment} ({entry.sentimentScore}%)
              </span>
            </p>
            <p className={styles.timestamp}>{entry.timestamp}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default History;