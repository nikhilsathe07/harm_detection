import styles from '../App.module.css';

function BatchResult({ batchResults }) {
  if (batchResults.length === 0) return null;

  return (
    <div className={styles.batchResult}>
      <h2>Batch Analysis Results</h2>
      <table className={styles.batchTable}>
        <thead>
          <tr>
            <th>Text</th>
            <th>Score</th>
            <th>Status</th>
            <th>Sentiment</th>
          </tr>
        </thead>
        <tbody>
          {batchResults.map((result, index) => (
            <tr key={index}>
              <td>{result.text}</td>
              <td>{result.score}%</td>
              <td className={result.score > 50 ? styles.harmful : styles.safe}>
                {result.message}
              </td>
              <td className={result.sentiment === 'Positive' ? styles.positive : styles.negative}>
                {result.sentiment} ({result.sentimentScore}%)
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default BatchResult;