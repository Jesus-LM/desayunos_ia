import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, IconButton, Typography, Box, CircularProgress, Tabs, Tab,
  Button, Card, CardContent, Divider, List, ListItem, ListItemText,
  Dialog, DialogTitle, DialogContent, DialogActions, Fab,
  ListItemIcon,Paper
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LunchDiningIcon from '@mui/icons-material/LunchDining';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import ReceiptLongIcon from '@mui/icons-material/Summarize';
import GradeIcon from '@mui/icons-material/Grade';
import CancelIcon from '@mui/icons-material/Cancel';
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
<Box sx={{ 
    width: '100%',
    maxWidth: '100vw',
    overflow: 'hidden',
    px: 2, // Padding lateral mínimo
    mt: 0, 
    mb: 4,
    boxSizing: 'border-box'
  }}>
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      mb: 3,
      position: 'relative',
      width: '100%',
      minHeight: '56px' // Altura mínima para los Fab
    }}>
      {/* Fab Atrás - Posición fija desde la izquierda */}
      <Fab 
        sx={{
          position: 'absolute',              
          left: 0, // Cambiar de 4 a 0
          top: '50%',
          transform: 'translateY(-50%)'
        }}
        aria-label="atras" 
        size='small'
        color='secondary'       
        onClick={() => navigate('/orders')}
      >
        <ArrowBackIcon fontSize="large"/>         
      </Fab>
   
      {/* Título - Centrado con margen para los Fab */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        px: 7, // Espacio para los Fab
        textAlign: 'center',
        width: '100%'
      }}>
        <Typography 
          color='primary.dark' 
          variant="h4"
          component="h1" 
          sx={{
            fontSize: { xs: '1.75rem', sm: '2rem' },
            lineHeight: 1.2,
            width: '100%'
          }}
        >
          {order?.nombre}
        </Typography>
      </Box>
      
      {/* Fab Resumen - Solo si es creador */}
      {order.creadoPor === currentUser.email && (
        <Fab 
          color='primary'
          size='small'
          sx={{
            position: 'absolute',              
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)'
          }}
          aria-label="resumen" 
          onClick={toggleSummary}
        >
          <ReceiptLongIcon fontSize="large" />
        </Fab>
      )}
    </Box>
    

    <Box>
      <Typography
        mb={2} 
        textAlign="center" 
        variant='h5' 
        sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }}
      >
        <strong>Mi Selección</strong>
      </Typography>
    </Box>
    
    <Card sx={{
      mt: 1,
      borderRadius: 2,
      border: '2px solid #3f51b5',
      width: '100%',
      maxWidth: '100%',
      overflow: 'hidden'
    }} elevation={5}>
      {selectedProducts.length > 0 ? (
        selectedProducts.sort((a, b) => a.nombre.localeCompare(b.nombre)).map((producto, index) => (
          <Box 
            key={index} 
            sx={{ 
              backgroundColor: 'white',
              display: 'flex', 
              alignItems: 'center',
              py: 0.5,
              px: 1,
              width: '100%',
              boxSizing: 'border-box'
            }}
          >
            <Box sx={{ width: '10%', minWidth: '32px' }}>
              <ClearIcon   
                sx={{ 
                  verticalAlign: 'middle',
                  fontSize: { xs: '1.5rem', sm: '1.75rem' }
                }}
                color="secondary" 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleProductSelection(producto);
                }} 
              />
            </Box>
            <Box sx={{ 
              width: '90%',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              <Typography 
                sx={{ 
                  fontSize: { xs: '1.2rem', sm: '1.5rem' },
                  wordBreak: 'break-word'
                }}
              >
                {producto.nombre}
              </Typography>
            </Box>                   
          </Box>
        ))
      ) : (
        <Typography 
          align='center'
          sx={{ 
            p: 2,
            fontSize: { xs: '1.2rem', sm: '1.5rem' }
          }}
        >
          Aún no has seleccionado ningún producto
        </Typography>
      )}
    </Card>
           
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
          <Button 
                  variant="outlined" 
                  color="secondary" 
                  size="small"
                  startIcon={<CancelIcon />}
                  sx={{fontSize: '1rem', borderRadius:2,textTransform: 'none'}} 
                  onClick={toggleSummary}>
                    Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrderDetail;