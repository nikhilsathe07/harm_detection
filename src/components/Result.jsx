import styles from '../App.module.css';

function Result({ result }) {
  if (!result) return null;
  return (
    <div className={styles.result}>
      <h2>Analysis Result</h2>
      <p>
        <span>Harm Score:</span> <span className={styles.score}>{result.score}%</span>
      </p>
      <p className={result.score > 50 ? styles.harmful : styles.safe}>{result.message}</p>
      <p>
        <span>Sentiment:</span>{' '}
        <span className={`${styles.sentiment} ${result.sentiment === 'Positive' ? styles.positive : styles.negative}`}>
          {result.sentiment} ({result.sentimentScore}%)
        </span>
      </p>
    </div>
  );
}

export default Result;