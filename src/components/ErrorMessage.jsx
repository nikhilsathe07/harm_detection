import styles from '../App.module.css';

function ErrorMessage({ error }) {
  if (!error) return null;
  return (
    <div className={styles.error}>
      <img src="/icons8-error-100.png" alt="Error" className={styles.errorIcon} />
      <span>{error}</span>
    </div>
  );
}

export default ErrorMessage;