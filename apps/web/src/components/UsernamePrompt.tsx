import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { updateUsername } from '../services/api';

function UsernamePrompt() {
  const { isAuthenticated, needsUsername, isLoading, refreshProfile } = useAuth();
  const [username, setUsername] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (value: string) => updateUsername(value),
    onSuccess: () => {
      setUsername('');
      setErrorMessage(null);
      refreshProfile?.();
    },
    onError: (error: any) => {
      setErrorMessage(error?.message || 'Failed to save username');
    },
  });

  if (!isAuthenticated || !needsUsername || isLoading) {
    return null;
  }

  const handleSubmit = (event?: React.FormEvent) => {
    event?.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) {
      setErrorMessage('Username cannot be empty');
      return;
    }
    mutation.mutate(trimmed);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: '#111827',
          border: '1px solid #ef4444',
          borderRadius: 8,
          padding: '32px 28px',
          maxWidth: 420,
          width: '100%',
          color: '#fff',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
        }}
      >
        <h2 style={{ margin: '0 0 12px 0', color: '#ef4444', fontSize: 24 }}>
          Claim your username
        </h2>
        <p style={{ margin: '0 0 20px 0', fontSize: 14, lineHeight: 1.6 }}>
          Usernames are required before you can submit theories or vote. Pick
          something unique (letters, numbers, underscores).
        </p>
        <label
          htmlFor="username"
          style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#f87171' }}
        >
          Username
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setErrorMessage(null);
          }}
          disabled={mutation.isPending}
          placeholder="eg. hawkins_hero"
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 4,
            border: '1px solid #ef4444',
            background: '#0f172a',
            color: '#fff',
            fontSize: 14,
          }}
        />
        {errorMessage && (
          <p style={{ color: '#f87171', fontSize: 12, marginTop: 8 }}>{errorMessage}</p>
        )}
        <button
          type="submit"
          disabled={mutation.isPending}
          style={{
            marginTop: 20,
            width: '100%',
            padding: '10px 12px',
            borderRadius: 4,
            border: 'none',
            background: '#ef4444',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          {mutation.isPending ? 'Saving...' : 'Save username'}
        </button>
      </form>
    </div>
  );
}

export default UsernamePrompt;
