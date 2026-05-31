import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from '../components/Icons';
import { writeLog } from '../services/db';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Seed default users in localStorage if they don't exist
  useEffect(() => {
    const storedUsers = localStorage.getItem('bjb-users');
    if (!storedUsers) {
      const defaultUsers = [
        { username: 'officer', password: 'bjb', role: 'Officer', name: 'Asep Marketing' },
        { username: 'officer_siti', password: 'bjb', role: 'Officer', name: 'Siti Funding' },
        { username: 'officer_budi', password: 'bjb', role: 'Officer', name: 'Budi Kredit' },
        { username: 'manager', password: 'bjb', role: 'Manager', name: 'Pak Budi Manager' },
        { username: 'admin', password: 'bjb', role: 'Super Admin', name: 'Administrator Utama' }
      ];
      localStorage.setItem('bjb-users', JSON.stringify(defaultUsers));
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    const usersStr = localStorage.getItem('bjb-users') || '[]';
    const users = JSON.parse(usersStr);
    
    // Find matching user
    const matchedUser = users.find(
      (u) => u.username === username.trim().toLowerCase() && u.password === password
    );

    if (matchedUser) {
      // Save current active user session
      localStorage.setItem('user', JSON.stringify({ 
        username: matchedUser.username, 
        role: matchedUser.role, 
        name: matchedUser.name 
      }));
      // Write log
      await writeLog('LOGIN', 'Melakukan login ke aplikasi.', matchedUser);
      navigate('/');
    } else {
      setError('Username atau password salah!');
    }
  };

  return (
    <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 120px)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>
            <span style={{ color: 'var(--bjb-gold)', fontWeight: 800 }}>bjb</span> Field Login
          </h2>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>Masukkan kredensial akun Anda</p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--status-cold)', padding: '0.75rem', borderRadius: 'var(--radius)', fontSize: '0.85rem', marginBottom: '1rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <div className="flex gap-2 items-center" style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                className="form-input" 
                placeholder="officer / manager / admin" 
                style={{ paddingLeft: '2.5rem' }}
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="flex gap-2 items-center" style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="form-input" 
                placeholder="bjb" 
                style={{ paddingLeft: '2.5rem' }}
                required 
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full mt-2">
            Masuk ke Aplikasi
          </button>
        </form>

        <div style={{ marginTop: '1.25rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', backgroundColor: 'var(--bg-color)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius)', border: '1.5px solid var(--border)' }}>
          <strong>Akun Demo (Password: bjb):</strong><br />
          Officer: <code>officer</code> | Manager: <code>manager</code><br />
          Super Admin: <code>admin</code>
        </div>
      </div>
    </div>
  );
};

export default Login;
