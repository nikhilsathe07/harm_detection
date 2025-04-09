import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../App.module.css';

function Login({ setUser }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const PORT = 5000; // Match server port

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      console.log('Found stored user:', JSON.parse(storedUser));
      setUser(JSON.parse(storedUser));
    }
  }, [setUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted:', { username, password, confirmPassword, isRegistering });
    setError('');
    setLoading(true);

    if (isRegistering && password !== confirmPassword) {
      setError('Passwords do not match');
      console.log('Validation failed: Passwords do not match');
      setLoading(false);
      return;
    }

    if (!username || !password) {
      setError('Please fill in all fields');
      console.log('Validation failed: Missing fields');
      setLoading(false);
      return;
    }

    try {
      const endpoint = isRegistering ? '/register' : '/login';
      console.log('Sending request to:', `http://localhost:${PORT}${endpoint}`);
      const response = await axios.post(`http://localhost:${PORT}${endpoint}`, { username, password });
      console.log('API response:', response.data);
      const userData = response.data;

      localStorage.setItem('user', JSON.stringify(userData));
      console.log('User set in localStorage:', userData);
      setUser(userData);

      if (isRegistering) {
        console.log('Registration successful, switching to login view');
        setIsRegistering(false);
      }
    } catch (err) {
      console.error('API error:', err.message, err.response?.data);
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.login}>
      <h2>{isRegistering ? 'Register' : 'Login'}</h2>
      <form onSubmit={handleSubmit} className={styles.loginForm}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          required
          disabled={loading}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          disabled={loading}
        />
        {isRegistering && (
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm Password"
            required
            disabled={loading}
          />
        )}
        {error && <p style={{ color: '#dc2626', margin: '0.5rem 0' }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : isRegistering ? 'Register' : 'Login'}
        </button>
      </form>
      <p style={{ marginTop: '1rem', textAlign: 'center' }}>
        {isRegistering ? 'Already have an account?' : 'Need an account?'}{' '}
        <button
          onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
          style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer' }}
          disabled={loading}
        >
          {isRegistering ? 'Login' : 'Register'}
        </button>
      </p>
    </div>
  );
}

export default Login;