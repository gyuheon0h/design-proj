import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
} from '@mui/material';
import axios from 'axios';
import SHA256 from 'crypto-js/sha256';
import { colors } from '../Styles';
import ErrorAlert from '../components/ErrorAlert';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      // TODO: add other validations
      setError('Passwords do not match');
      return;
    }

    try {
      const passwordHash = SHA256(password).toString(); // hashed password

      // TODO: change endpoint to not raw string
      const response = await axios.post(
        'http://${process.env.REACT_APP_API_BASE_URL}/api/auth/register',
        { username, email, passwordHash },
        {
          withCredentials: true, // Send cookies automatically
        },
      );

      if (response.status === 201) {
        navigate('/');
      } else {
        const errorData = await response;
        setError(`Registration failed: ${errorData.data}. Please try again.`);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(`An unexpected error occurred: ${error}`);
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
          Sign Up for Owl Share!
        </Typography>

        <Box component="form" onSubmit={handleRegister} sx={{ mt: 3 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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
            id="email"
            label="Email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            autoComplete="new-password"
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
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
            Register
          </Button>
          <Button component={Link} to="/">
            Or Sign In
          </Button>
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

export default Register;
