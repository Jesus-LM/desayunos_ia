import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { 
  AppBar, Toolbar, Typography, IconButton, Container, 
  Box, Menu, MenuItem, Avatar, Button, Divider 
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import FastfoodIcon from '@mui/icons-material/Fastfood';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useAuth } from '../../hooks/useAuth';

const MainLayout = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [userMenuAnchor, setUserMenuAnchor] = React.useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleNavigate = (path) => {
    handleMenuClose();
    navigate(path);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <>
      <AppBar position="static" color="primary">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={handleMenuOpen}
          >
            <MenuIcon />
          </IconButton>
          
          <FastfoodIcon sx={{ mr: 1 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            App de Pedidos Colectivos
          </Typography>
          
          {currentUser && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ mr: 1, display: { xs: 'none', sm: 'block' } }}>
                {currentUser.displayName || currentUser.email}
              </Typography>
              <IconButton 
                color="inherit"
                onClick={handleUserMenuOpen}
              >
                {currentUser.photoURL ? (
                  <Avatar src={currentUser.photoURL} sx={{ width: 32, height: 32 }} />
                ) : (
                  <AccountCircleIcon />
                )}
              </IconButton>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Menú principal */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleNavigate('/orders')}>Ver pedidos</MenuItem>
        <MenuItem onClick={() => handleNavigate('/orders/create')}>Crear pedido</MenuItem>
      </Menu>

      {/* Menú de usuario */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle1">{currentUser?.displayName || 'Usuario'}</Typography>
          <Typography variant="body2" color="text.secondary">{currentUser?.email}</Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleLogout}>Cerrar sesión</MenuItem>
      </Menu>

      {/* Contenido principal */}
      <Container component="main" sx={{ pt: 3, pb: 4 }}>
        <Outlet />
      </Container>
    </>
  );
};

export default MainLayout;