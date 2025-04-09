import styles from './App.module.css';
import Home from './pages/Home.jsx';

function App() {
  return (
    <div className={`${styles.app} ${styles.dark}`}>
      <Home />
    </div>
  );
}

export default App;