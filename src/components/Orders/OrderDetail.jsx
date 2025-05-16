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
    <Container maxWidth="lg" sx={{ mt: 0, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, ml:0,mr:0 }}>
        <Box>       
         <IconButton 
            aria-label="atras" 
            color='primary'       
            onClick={() => navigate('/orders')}>
            <ArrowBackIcon fontSize="large" color='black'/>         
        </IconButton>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography color='black' variant="h4" component="h1" align='center'>
            {order?.nombre}
          </Typography>
        </Box>
        <Box>
        <IconButton 
          aria-label="resumen" 
          onClick={toggleSummary}
        >
            <ReceiptLongIcon color="primary" fontSize="large" />
        </IconButton>
      </Box>
    </Box>
    <Divider color='black'  sx={{ mt: 0, mb: 2 }} />
     <Box >
              <Typography color="black" align="center" variant="h5" gutterBottom>
                Mi Selección
              </Typography>
              <Divider sx={{ my: 0, fontWeight:"bold", }} />
            
              {selectedProducts.length > 0 ? (
                <Card >
                <List >
                  {selectedProducts .map((product, index) => (
                    <ListItem  key={index}>
                      <ListItemIcon 
                        edge='start'
                        onClick={(e) => {
                        e.stopPropagation();
                        toggleProductSelection(product);
                      }}
                        aria-label="eliminar"
                        sx={{mr:0,color:'red'}}
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
                <Typography align='center'>
                  Aun no has seleccionado ningún producto
                </Typography>
              )}
            </Box>
      <Box sx={{ width: '100%', mt:1}}>
        <Box sx={{ borderBottom: 2, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} centered aria-label="categorías de productos">
            <Tab label="Comida" icon={<LunchDiningIcon color="comida"/>} />
            <Tab label="Bebida" icon={<LocalCafeIcon color="bebida"/>} />
            <Tab label="Favoritos" icon={<GradeIcon color="favoritos"/>} />
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
          <Typography fontSize="2rem"  color="primary.dark" align="center">
            {order?.nombre}
           </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <OrderSummary order={order} />
        </DialogContent>
        <DialogActions>
          <Button color="secondary" onClick={toggleSummary}>CERRAR</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default OrderDetail;