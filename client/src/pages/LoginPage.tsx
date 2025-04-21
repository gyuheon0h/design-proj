import { useUser } from '../context/UserContext';
import { useNavigate, Link } from 'react-router-dom';
import SHA256 from 'crypto-js/sha256';
import { useState } from 'react';
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
import { colors } from '../Styles';
import ErrorAlert from '../components/ErrorAlert';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

const Login = () => {
  const [username, setUsernameInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { setUsername, setUserId } = useUser();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const hashedPassword = SHA256(password).toString();
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ username, passwordHash: hashedPassword }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        setUsername(username);
        setUserId(data.userId);
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

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Container
      maxWidth={false}
      disableGutters
      sx={{ height: '100vh', overflow: 'hidden' }}
    >
      <Grid container sx={{ height: '100%' }}>
        {/* Left Panel - Login Form */}
        <Grid
          item
          xs={12}
          md={6}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 450, p: 3 }}>
            <Box sx={{ textAlign: 'center', mb: 6 }}>
              <Box
                component="img"
                src="/owl_icon.png"
                alt="Owl Logo"
                sx={{ width: 60, height: 60, mb: 2 }}
              />
              <Typography
                variant="h4"
                gutterBottom
                sx={{ fontWeight: 600, color: colors.textPrimary }}
              >
                Welcome Back
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Please sign in to your account
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleLogin}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                placeholder="Username"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsernameInput(e.target.value)}
                sx={{
                  backgroundColor: 'white',
                  mb: 3,
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
                name="password"
                placeholder="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{
                  backgroundColor: 'white',
                  mb: 2,
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
                        {showPassword ? (
                          <VisibilityOffIcon />
                        ) : (
                          <VisibilityIcon />
                        )}
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
                Sign In
              </Button>

              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Typography variant="body2" color="textSecondary">
                  Don't have an account?{' '}
                  <Link
                    to="/register"
                    style={{
                      color: colors.accentBlue,
                      textDecoration: 'none',
                      fontWeight: 600,
                    }}
                  >
                    Sign Up
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Box>
        </Grid>

        {/* Right Panel - Branding/Illustration */}
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
              Owl Share
            </Typography>
            <Typography variant="h3" sx={{ mb: 6 }}>
              Store, share, and collaborate on files with ease
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
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0.1,
              background:
                'radial-gradient(circle, transparent 20%, #1a237e 20%, #1a237e 80%, transparent 80%, transparent), radial-gradient(circle, transparent 20%, #1a237e 20%, #1a237e 80%, transparent 80%, transparent) 50px 50px, linear-gradient(#3949ab 4px, transparent 4px) 0 -2px, linear-gradient(90deg, #3949ab 4px, transparent 4px) -2px 0',
              backgroundSize: '100px 100px, 100px 100px, 50px 50px, 50px 50px',
            }}
          />
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

export default Login;
