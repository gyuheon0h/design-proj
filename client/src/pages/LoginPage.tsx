import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import SHA256 from 'crypto-js/sha256';
import { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Link,
} from '@mui/material';
import { colors } from '../Styles';
import ErrorAlert from '../components/ErrorAlert';

const Login = () => {
  const [username, setUsernameInput] = useState('');
  const [password, setPassword] = useState('');
  const { setUsername, setUserId } = useUser();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const hashedPassword = SHA256(password).toString();
      const response = await fetch('http://localhost:5001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, passwordHash: hashedPassword }),
      });

      if (response.ok) {
        const data = await response.json();
        setUsername(username);
        console.log('USERNAME', username);
        setUserId(data.userId);
        console.log('DATA', data);
        console.log('USERID', data.userId);
        navigate('/home');
      } else {
        const errorData = await response.json();
        setError(`Login failed: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error during login request:', error);
      setError(`Something went wrong: ${error}. Please try again.`);
    }
  };

  return (
    <Container
      component="main"
      maxWidth="xs"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: colors.white,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          padding: 4,
          width: '100%',
          borderRadius: '16px',
          backgroundColor: colors.lightBlue,
          textAlign: 'center',
        }}
      >
        <Typography
          component="h1"
          variant="h5"
          sx={{
            fontWeight: 'bold',
            color: colors.darkBlue,
            fontSize: 24,
          }}
        >
          Welcome to Owl Share!
        </Typography>

        <Box component="form" onSubmit={handleLogin} sx={{ mt: 3 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsernameInput(e.target.value)}
            sx={{
              backgroundColor: colors.white,
              borderRadius: '8px',
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
              },
            }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{
              backgroundColor: colors.white,
              borderRadius: '8px',
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
              },
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              mt: 3,
              mb: 2,
              backgroundColor: colors.darkBlue,
              color: colors.white,
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: '#0E147A',
              },
            }}
          >
            Login
          </Button>
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Link
              href="/register"
              variant="body2"
              sx={{ color: colors.darkBlue, textDecoration: 'underline' }}
            >
              New user? Register here.
            </Link>
          </Box>
        </Box>
      </Paper>
      {error && (
        <ErrorAlert
          open={!!error}
          message={error}
          onClose={() => setError(null)}
        />
      )}
    </Container>
  );
};

export default Login;
