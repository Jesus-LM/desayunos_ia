import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Button, TextField, Typography, Container, Box, 
  CircularProgress, Paper, Snackbar, Alert 
} from '@mui/material';
import { crearPedido } from '../../firebase/firestore';
import { useAuth } from '../../hooks/useAuth';

const CreateOrder = () => {
  const [orderName, setOrderName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Validar que el usuario esté autenticado
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!orderName.trim()) {
      setError('El nombre del pedido no puede estar vacío');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Crear el pedido usando la función de firestore.js
      await crearPedido(
        orderName.trim(),
        currentUser.email,
        [] // Productos iniciales (vacío)
      );
      
      console.log('Pedido creado con éxito');
      
      setSuccess(true);
      setOrderName('');
      
      // Redirigir después de mostrar mensaje de éxito
      setTimeout(() => {
        navigate('/orders');
      }, 1500);
      
    } catch (err) {
      console.error('Error al crear pedido:', err);
      setError(`Error al crear el pedido: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
    setError('');
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom align="center">
          Crear Nuevo Pedido
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Nombre del pedido"
            variant="outlined"
            value={orderName}
            onChange={(e) => setOrderName(e.target.value)}
            disabled={loading}
            margin="normal"
            helperText="Elige un nombre descriptivo para el pedido"
            required
          />
          
          <Button 
            type="submit" 
            variant="contained" 
            fullWidth 
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Crear Pedido'}
          </Button>
        </Box>
      </Paper>
      
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar open={success} autoHideDuration={1500} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          ¡Pedido creado correctamente!
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CreateOrder;