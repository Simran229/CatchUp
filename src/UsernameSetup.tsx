import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

function UsernameSetup({ userId }: { userId: string }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!username.trim()) {
      setError('Username cannot be empty');
      setIsLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ username: username.trim() })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Error setting username. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        // backgroundColor: 'var(--background)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '2rem',
          backgroundColor: 'var(--surface)',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <h1
          style={{
            textAlign: 'center',
            color: 'var(--primary)',
          }}
        >
          Welcome!
        </h1>
        <p
          style={{
            textAlign: 'center',
            color: 'var(--text-secondary)',
          }}
        >
          Please choose a username to get started
        </p>

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--background)',
              color: 'var(--text-primary)',
              fontSize: '1rem',
              boxSizing: 'border-box',
            }}
          />

          {error && (
            <p
              style={{
                color: '#dc3545',
                textAlign: 'center',
                margin: 0,
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.85rem',
              backgroundColor: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              boxSizing: 'border-box',
            }}
          >
            {isLoading ? 'Setting up...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default UsernameSetup;
