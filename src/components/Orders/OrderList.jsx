import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Typography, Container, Box, Grid, Card, CardContent, 
  CardActionArea, CircularProgress, Button, Chip, Divider 
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { collection, getDocs, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../hooks/useAuth';

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    const ordersRef = collection(db, 'PEDIDOS');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));

    // Usar onSnapshot para actualización en tiempo real
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ordersData = [];
      querySnapshot.forEach((doc) => {
        ordersData.push({
          id: doc.id,
          ...doc.data(),
          // Convertir timestamp a Date para mostrar fecha correctamente
          createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : new Date()
        });
      });
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error("Error al obtener pedidos:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Función para mostrar participantes de forma legible
  const renderParticipants = (participants) => {
    if (!participants || participants.length === 0) return "Sin participantes";
    
    return participants.map(p => p.userName || p.userId).join(', ');
  };

  // Formatear fecha para mostrar
  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 3 }}>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddCircleOutlineIcon />}
          component={RouterLink} 
          to="/orders/create"
        >
          Nuevo Pedido
        </Button>
      </Box>

      {orders.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
          <Typography variant="h6">
            No hay pedidos activos
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mt: 1 }}>
            ¡Crea un nuevo pedido para empezar!
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {orders.map((order) => (
            <Grid size={{xs:12, sm:6, md:4}} key={order.id}>
              <Card elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardActionArea 
                  component={RouterLink} 
                  to={`/orders/${order.id}`}
                  sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h5" component="h2" gutterBottom noWrap>
                      {order.name}
                    </Typography>
                    
                    <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: 'block' }}>
                      Creado: {formatDate(order.createdAt)}
                    </Typography>
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <Typography variant="body2" color="textSecondary">
                      <strong>Participantes:</strong>
                    </Typography>
                    
                    <Box sx={{ mt: 1 }}>
                      {order.participants && order.participants.length > 0 ? (
                        order.participants.map((participant, index) => (
                          <Chip 
                            key={index}
                            label={participant.userName || participant.userId}
                            size="small"
                            sx={{ m: 0.5 }}
                          />
                        ))
                      ) : (
                        <Typography variant="body2">Sin participantes</Typography>
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default OrderList;