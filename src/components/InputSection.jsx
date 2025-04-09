import styles from '../App.module.css';

function InputSection({ input, setInput, threshold, setThreshold, analyzeContent, analyzeBatch, loading }) {
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        const lines = text.split('\n').filter((line) => line.trim());
        analyzeBatch(lines);
      };
      reader.readAsText(file);
    }
  };

  const handleAnalyze = () => {
    if (input.includes('\n')) {
      const lines = input.split('\n').filter((line) => line.trim());
      analyzeBatch(lines);
    } else {
      analyzeContent();
    }
  };

  return (
    <div className={styles.inputSection}>
      <div className={styles.threshold}>
        <label htmlFor="threshold">Harm Threshold (%):</label>
        <input
          type="number"
          id="threshold"
          min="0"
          max="100"
          value={threshold}
          onChange={(e) => setThreshold(Math.max(0, Math.min(100, e.target.value)))}
          disabled={loading}
        />
      </div>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter text or multiple lines to analyze..."
        className={styles.textarea}
        rows="6"
        aria-label="Content input"
      />
      <input
        type="file"
        accept=".txt,.csv"
        onChange={handleFileUpload}
        className={styles.fileInput}
        disabled={loading}
      />
      <button
        onClick={handleAnalyze}
        disabled={loading || !input.trim()}
        className={styles.button}
      >
        {loading ? 'Analyzing...' : 'Check for Harm'}
      </button>
    </div>
  );
}

export default InputSection;