import React from 'react';
import { useEffect,useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { 
  AppBar, Toolbar, Typography, IconButton, Container, 
  Box, Menu, MenuItem, Avatar, Button, Divider 
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import EditIcon from '@mui/icons-material/Edit';
import FastfoodIcon from '@mui/icons-material/Fastfood';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useAuth } from '../../hooks/useAuth';
import { getUsuario } from '../../firebase/firestore';

const MainLayout = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [userData,setUserData] = useState(null)
    
  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser && currentUser.email) {
        try {
          const usuario = await getUsuario(currentUser.email);
          if (usuario) {
            setUserData(usuario);
          }
        } catch (error) {
          console.error("Error al obtener datos del usuario:", error);
        }
      }
    };
    
    fetchUserData();
  }, [currentUser]);
  
  // Determinar qué nombre mostrar
  const displayName = userData?.nombre || currentUser?.displayName || currentUser?.email;

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
        <Toolbar
          sx={{
            
            display: 'flex',
            justifyContent: 'space-between'
          }}
        >
          <Typography  variant="h6" component="div" >
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
            Pedidos Desayunos
          </Typography>
          
          {currentUser && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ mr: 1, display: { xs: 'none', sm: 'block' } }}>
                {displayName}
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
        <Box onClick={handleLogout}
          sx={{ px: 2, py: 1 , display:'flex', 
              justifyContent:'center', alignContent:'space-between'
              }}>
          <Typography variant="subtitle1">Editar
          </Typography>
          <EditIcon
          />
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