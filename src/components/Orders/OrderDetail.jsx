import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, IconButton, Typography, Box, CircularProgress, Tabs, Tab,
  Button, Card, CardContent, Divider, List, ListItem, ListItemText,
  Dialog, DialogTitle, DialogContent, DialogActions,
  ListItemIcon
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LunchDiningIcon from '@mui/icons-material/LunchDining';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import ReceiptLongIcon from '@mui/icons-material/Summarize';
import GradeIcon from '@mui/icons-material/Grade';
import ClearIcon from '@mui/icons-material/Clear';
import { doc, getDoc} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../hooks/useAuth';
import ProductList from '../Products/ProductList';
import OrderSummary from './OrderSummary'
import { unirseAPedido,actualizarProductosEnPedido } from '../../firebase/firestore';

const OrderDetail = () => {
  const { orderId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(2);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [summaryOpen, setSummaryOpen] = useState(false);


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
          if (userParticipant) {
            setSelectedProducts(userParticipant.productos || []);
            // Si el usuario no está participando, unirlo automáticamente
          await unirseAPedido(orderId, currentUser.email, []);
          // Volver a cargar el pedido para ver la actualización
          const updatedOrderSnap = await getDoc(orderRef);
          setOrder({ 
            id: updatedOrderSnap.id, 
            ...updatedOrderSnap.data() 
          });
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
const toggleProductSelection = async (product) => {
  // Usar la función de actualización para obtener el estado más reciente
  setSelectedProducts(prevSelected => {
    const isAlreadySelected = prevSelected.some(p => p.id === product.id);
    const newSelectedProducts = isAlreadySelected
      ? prevSelected.filter(p => p.id !== product.id)
      : [...prevSelected, product];
    
    // Actualizar la base de datos con el nuevo estado
    actualizarProductosEnPedido(orderId, currentUser.email, newSelectedProducts)
      .catch(error => console.error("Error al actualizar productos:", error));
    
    return newSelectedProducts;
  });
};

// Añadir este efecto para sincronizar cambios locales con la base de datos
useEffect(() => {
  // No ejecutar en la carga inicial
  if (!loading && order) {
    const syncProductsWithDatabase = async () => {
      try {
        await actualizarProductosEnPedido(orderId, currentUser.email, selectedProducts);
      } catch (error) {
        console.error("Error al sincronizar productos:", error);
      }
    };
    
    // Usar un temporizador para evitar actualizaciones excesivas
    const timeoutId = setTimeout(() => {
      syncProductsWithDatabase();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }
}, [selectedProducts, orderId, currentUser, loading, order]);


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
              category="comida" 
              toggleSelection={toggleProductSelection} 
              selectedProducts={selectedProducts}
            />
          )}
          {activeTab === 1 && (
            <ProductList 
              category="bebida" 
              toggleSelection={toggleProductSelection} 
              selectedProducts={selectedProducts}
            />
          )}
          {activeTab === 2 && (
            <ProductList 
              category="favoritos" 
              toggleSelection={toggleProductSelection} 
              selectedProducts={selectedProducts}
            />
          )}
            <Box >
              <Typography fontWeight="bold" color="primary" align="center" variant="h5" gutterBottom>
                Mi Selección
              </Typography>
              <Divider sx={{ my: 2, fontWeight:"bold", }} />
            
              {selectedProducts.length > 0 ? (
                <Card >
                <List >
                  {selectedProducts .map((product, index) => (
                    <ListItem  key={index}>
                      <ListItemIcon 
                        edge='end'
                        aria-label="eliminar"
                        sx={{color:'red', mr:0}}
                      >
                        <ClearIcon  />

                      </ListItemIcon>
                      <ListItemText sx={{margin:0}}
                        primary={product.nombre} 
                        />
                      
                    </ListItem>
                   
                  ))}
                  
                </List>
                </Card>
              ) : (
                <Typography>
                  No has seleccionado ningún producto todavía
                </Typography>
              )}
            </Box>
          
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