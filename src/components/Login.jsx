import { useState } from 'react';
import axios from 'axios';
import styles from '../App.module.css';

function Login({ setUser, setError }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);



  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted with:', { username, password, isRegistering });
    try {
      const endpoint = isRegistering ? '/register' : '/login';
      console.log('Making request to:', `http://localhost:5001${endpoint}`);
      const response = await axios.post(`http://localhost:5001${endpoint}`, { username, password });
      console.log('API response:', response.data);
      if (isRegistering) {
        setError('Registration successful! Please log in.');
        setIsRegistering(false);
      } else {
        console.log('Setting user:', response.data);
        setUser(response.data);
      }
    } catch (err) {
      console.error('API call failed:', err.message, err.response?.data);
      setError(err.response?.data?.error || 'An error occurred');
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
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <button type="submit">{isRegistering ? 'Register' : 'Login'}</button>
      </form>
      <p style={{ marginTop: '1rem', textAlign: 'center' }}>
        {isRegistering ? 'Already have an account?' : 'Need an account?'}{' '}
        <button
          onClick={() => setIsRegistering(!isRegistering)}
          style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer' }}
        >
          {isRegistering ? 'Login' : 'Register'}
        </button>
      </p>
    </div>
  );
}

export default Login;