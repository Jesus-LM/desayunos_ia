import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, IconButton, Typography, Box, CircularProgress, Tabs, Tab,
  Button, Card, CardContent, Divider, List, ListItem, ListItemText,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LunchDiningIcon from '@mui/icons-material/LunchDining';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import ReceiptLongIcon from '@mui/icons-material/Summarize';
import GradeIcon from '@mui/icons-material/Grade';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../hooks/useAuth';
import ProductList from '../Products/ProducList';
import OrderSummary from './OrderSummary'

const OrderDetail = () => {
  const { orderId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [userParticipating, setUserParticipating] = useState(false);
  const [userProductsInOrder, setUserProductsInOrder] = useState([]);

  // Cargar datos del pedido
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const fetchOrderData = async () => {
      try {
        const orderRef = doc(db, 'PEDIDOS', orderId);
        const orderSnap = await getDoc(orderRef);
        
        if (orderSnap.exists()) {
          const orderData = { 
            id: orderSnap.id, 
            ...orderSnap.data() 
          };
          
          setOrder(orderData);
          
          // Verificar si el usuario ya está participando
          const userParticipant = orderData.usuarios?.find(
            p => p.id === currentUser.email
          );
          
          setUserParticipating(!!userParticipant);
          
          if (userParticipant) {
            setUserProductsInOrder(userParticipant.productos || []);
          }
        } else {
          navigate('/orders');
        }
      } catch (error) {
        console.error("Error al cargar el pedido:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [orderId, currentUser, navigate]);

  // Manejar cambio de pestaña
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Añadir o quitar producto de la selección
  const toggleProductSelection = (product) => {
    setSelectedProducts(prevSelected => {
      const isAlreadySelected = prevSelected.some(p => p.id === product.id);
      
      if (isAlreadySelected) {
        return prevSelected.filter(p => p.id !== product.id);
      } else {
        return [...prevSelected, product];
      }
    });
  };

  // Unirse al pedido o actualizar productos
  const handleSaveOrder = async () => {
    try {
      setLoading(true);
      const orderRef = doc(db, 'PEDIDOS', orderId);
      
      if (!userParticipating) {
        // Añadir usuario como nuevo participante
        await updateDoc(orderRef, {
          usuarios: arrayUnion({
            id: currentUser.email,
            nombre: currentUser.displayName || currentUser.email,
            productos: selectedProducts
          })
        });
        setUserParticipating(true);
      } else {
        // Actualizar productos del usuario
        const updatedOrder = { ...order };
        const participantIndex = updatedOrder.usuarios.findIndex(
          p => p.id === currentUser.email
        );
        
        if (participantIndex !== -1) {
          updatedOrder.usuarios[participantIndex].productos = selectedProducts;
          
          await updateDoc(orderRef, {
            usuarios: updatedOrder.usuarios
          });
        }
      }
      
      setUserProductsInOrder(selectedProducts);
      setLoading(false);
    } catch (error) {
      console.error("Error al guardar el pedido:", error);
      setLoading(false);
    }
  };

  // Abrir/cerrar diálogo de resumen
  const toggleSummary = () => {
    setSummaryOpen(!summaryOpen);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>       
         <IconButton 
            aria-label="atras" 
            color="primary"       
            onClick={() => navigate('/orders')}>
            <ArrowBackIcon fontSize="large" />         
        </IconButton>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            {order?.nombre}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <IconButton 
          aria-label="resumen" 
          color="primary"
          onClick={toggleSummary}
        >
            <ReceiptLongIcon fontSize="large" />
        </IconButton>
      </Box>
    </Box>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="body1" color="textSecondary">
            <strong>Fecha:</strong> {order?.fechaCreacion ? new Date(order.fechaCreacion.seconds * 1000).toLocaleString() : 'Desconocido'}
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="body1" gutterBottom>
            <strong>Participantes ({order?.usuarios?.length || 0}):</strong>
          </Typography>
          
          <List dense>
            {order?.usuarios?.map((usuario, index) => (
              <ListItem key={index}>
                <ListItemText 
                  primary={usuario.nombre || usuario.id} 
                  secondary={`${usuario.productos?.length || 0} productos seleccionados`} 
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} centered aria-label="categorías de productos">
            <Tab label= "Comida" icon={<LunchDiningIcon/>} />
            <Tab label="Bebida" icon={<LocalCafeIcon />} />
            <Tab label="Favoritos" icon={<GradeIcon />} />
          </Tabs>
        </Box>
        
        <Box sx={{ py: 3 }}>
          {activeTab === 0 && (
            <ProductList 
              category="COMIDA" 
              toggleSelection={toggleProductSelection} 
              selectedProducts={selectedProducts}
            />
          )}
          {activeTab === 1 && (
            <ProductList 
              category="BEBIDA" 
              toggleSelection={toggleProductSelection} 
              selectedProducts={selectedProducts}
            />
          )}
          {activeTab === 2 && (
            <ProductList 
              category="FAVORITOS" 
              toggleSelection={toggleProductSelection} 
              selectedProducts={selectedProducts}
            />
          )}
            <Box >
              <Typography fontWeight="bold" color="primary" align="center" variant="h5" gutterBottom>
                Mi Selección
              </Typography>
              <Divider sx={{ my: 2 }} />
            
              {userProductsInOrder.length > 0 ? (
                <List>
                  {userProductsInOrder.map((product, index) => (
                    <ListItem key={index}>
                      <ListItemText 
                        primary={product.nombre} 
                        secondary={product.tipo} 
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography>
                  No has seleccionado ningún producto todavía
                </Typography>
              )}
            </Box>
          
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSaveOrder}
            disabled={loading}
            sx={{ px: 4 }}
          >
            {userParticipating ? 'Actualizar Mi Pedido' : 'Unirme al Pedido'}
          </Button>
        </Box>
      </Box>

      {/* Diálogo para mostrar el resumen del pedido */}
      <Dialog 
        open={summaryOpen} 
        onClose={toggleSummary}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          <Typography fontSize="2rem" fontWeight="bold" color="primary" align="center">
            {order?.nombre}
           </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <OrderSummary order={order} />
        </DialogContent>
        <DialogActions>
          <Button onClick={toggleSummary}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default OrderDetail;