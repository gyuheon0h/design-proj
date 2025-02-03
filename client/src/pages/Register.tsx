import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
} from '@mui/material';
import axios from 'axios';


const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      // TODO: add other validations
      alert('Passwords do not match');
      return;
    }

    console.log('Registering with:', { name: username, email, password });

    // TODO: handle actual registration logic

    try {
        const passwordHash = password; // TODO: actually hash it. just doing this now
        // so it's consistent with the backend

        // TODO: change endpoint to not raw string
        const response = await axios.post('http://localhost:5001/api/register', 
          {username, email, passwordHash},
          {
            withCredentials: true,  // Send cookies automatically
          }        
        );

    
        if (response.status === 201) {
          console.log("successful registration " + response.data);
          navigate('/home');
        } else {
            const errorData = await response;
            alert(`Error: ${errorData}`);
        }
      } catch (error) {
        console.error('Registration error:', error);
        alert('An unexpected error occurred.');
      }
    
  };

  return (
    <Container
      component="main"
      maxWidth="xs"
      sx={{
        display: 'flex',
        alignItems: 'center',
        minHeight: '100vh',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          width: '100%',
          borderRadius: '16px',
          //   transform: 'translateX(-10vw)' // bruh it keeps not being centered **KEEP THIS AS
          //                                 // VW NOT PX, OR ELSE NOT RESPONSIVE STYLING!!
        }}
      >
        <Typography component="h1" variant="h5" align="center" gutterBottom>
          SIGN UP
        </Typography>

        <Box component="form" onSubmit={handleRegister} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="username"
            name="username"
            autoComplete="name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="password"
            type="password"
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              mt: 3,
              mb: 2,
              backgroundColor: '#000',
              '&:hover': { backgroundColor: '#333' },
            }}
          >
            Create Account
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;
