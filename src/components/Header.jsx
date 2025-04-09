import styles from '../App.module.css';

function Header() {
  return (
    <header className={styles.header}>
      <h1>Harm Detector</h1>
      <p>Analyze text or URLs for potentially harmful content</p>
    </header>
  );
}

export default Header;