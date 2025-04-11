import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  TextField,
  Button,
  Box,
  InputAdornment,
  IconButton,
} from '@mui/material';
import axios from 'axios';
import SHA256 from 'crypto-js/sha256';
import { colors } from '../Styles';
import ErrorAlert from '../components/ErrorAlert';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      const passwordHash = SHA256(password).toString();

      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/api/auth/register`,
        { username, email, passwordHash },
        {
          withCredentials: true,
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

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <Container maxWidth={false} disableGutters sx={{ height: '100vh', overflow: 'hidden' }}>
      <Grid container sx={{ height: '100%' }}>
        {/* Left Panel - Branding/Illustration */}
        <Grid 
          item 
          xs={false} 
          md={6} 
          sx={{
            background: `linear-gradient(135deg, ${colors.accentBlue} 0%, #2541b2 100%)`,
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <Box 
            sx={{ 
              p: 5, 
              color: 'white', 
              textAlign: 'center',
              maxWidth: '80%',
              zIndex: 1,
            }}
          >
            <Typography variant="h6" gutterBottom fontWeight={700}>
              Join Owl Share
            </Typography>
            <Typography variant="h3" sx={{ mb: 4 }}>
              Create your account to get started
            </Typography>
            
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                position: 'relative',
                height: '300px',
                width: '300px',
                margin: '0 auto',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <Box
                component="img"
                src="/owl_icon.png"
                alt="Owl Logo"
                sx={{ width: '180px', height: '180px' }}
              />
            </Box>
          </Box>
          
          {/* Background pattern elements */}
          <Box sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            opacity: 0.1,
            background: 'radial-gradient(circle, transparent 20%, #1a237e 20%, #1a237e 80%, transparent 80%, transparent), radial-gradient(circle, transparent 20%, #1a237e 20%, #1a237e 80%, transparent 80%, transparent) 50px 50px, linear-gradient(#3949ab 4px, transparent 4px) 0 -2px, linear-gradient(90deg, #3949ab 4px, transparent 4px) -2px 0',
            backgroundSize: '100px 100px, 100px 100px, 50px 50px, 50px 50px',
          }} />
        </Grid>

        {/* Right Panel - Registration Form */}
        <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ width: '100%', maxWidth: 450, p: 3 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: colors.textPrimary }}>
                Create Account
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Fill in your information to get started
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleRegister}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                placeholder="Username"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                sx={{
                  mb: 2,
                  backgroundColor: 'white',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                placeholder="Email Address"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{
                  mb: 2,
                  backgroundColor: 'white',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                placeholder="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{
                  mb: 2,
                  backgroundColor: 'white',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleTogglePasswordVisibility}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                placeholder="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                sx={{
                  mb: 2,
                  backgroundColor: 'white',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle confirm password visibility"
                        onClick={handleToggleConfirmPasswordVisibility}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  backgroundColor: colors.accentBlue,
                  color: 'white',
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '16px',
                  '&:hover': {
                    backgroundColor: '#2a70e2',
                  },
                }}
              >
                Create Account
              </Button>
              
              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Typography variant="body2" color="textSecondary">
                  Already have an account?{' '}
                  <Link to="/" style={{ color: colors.accentBlue, textDecoration: 'none', fontWeight: 600 }}>
                    Sign In
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>
      
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