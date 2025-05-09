import React, { useMemo, useState, useEffect } from 'react';
import {
  Typography, Box, Divider, List, ListItem, ListItemText, ListItemButton,
  Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Chip,Card,CardContent, Button,Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import LunchDiningIcon from '@mui/icons-material/LunchDining';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';


const OrderSummary = ({ order: initialOrder }) => {
  const [order, setOrder] = useState(initialOrder);
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
 
  useEffect(() => {
    if (!initialOrder || !initialOrder.id) return;
    
    // Configurar un listener en tiempo real para el documento del pedido
    const orderRef = doc(db, 'PEDIDOS', initialOrder.id);
    const unsubscribe = onSnapshot(orderRef, (docSnap) => {
      if (docSnap.exists()) {
        setOrder({ id: docSnap.id, ...docSnap.data() });
      }
    }, (error) => {
      console.error("Error al escuchar cambios del pedido:", error);

    });
    
    // Limpiar el listener cuando el componente se desmonte
    return () => unsubscribe();
  }, [initialOrder]);

  const handleUserClick = (usuario) => {
    setSelectedUser(usuario);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // Calcular el resumen de productos agrupados por tipo y ordenados
  const productSummary = useMemo(() => {
    if (!order || !order.usuarios) return [];
    
    // Primero vamos a extraer todos los productos de todos los participantes
    const allProducts = [];
    order.usuarios.forEach(usuario => {
      if (usuario.productos && usuario.productos.length > 0) {
        usuario.productos.forEach(producto => {
          allProducts.push({
            ...producto,
            orderedBy: usuario.nombre
          });
        });
      }
    });
    
    // Agrupamos los productos por tipo y nombre
    const groupedProducts = {};
    
    allProducts.forEach(producto => {
      const key = `${producto.tipo}-${producto.nombre}`;
      
      if (!groupedProducts[key]) {
        groupedProducts[key] = {
          id: producto.id,
          nombre: producto.nombre,
          tipo: producto.tipo,
          cantidad: 1,
          orderedBy: [producto.orderedBy]
        };
      } else {
        groupedProducts[key].cantidad += 1;
        if (!groupedProducts[key].orderedBy.includes(producto.orderedBy)) {
          groupedProducts[key].orderedBy.push(producto.orderedBy);
        }
      }
    });
    
    // Convertimos a array y ordenamos
    const result = Object.values(groupedProducts);
    
    // Ordenamos primero por tipo (COMIDA antes que BEBIDA) y luego alfabéticamente por nombre
    result.sort((a, b) => {
      if (a.tipo === 'COMIDA' && b.tipo !== 'COMIDA') return -1;
      if (a.tipo !== 'COMIDA' && b.tipo === 'COMIDA') return 1;
      return a.nombre.localeCompare(b.nombre);
    });
    
    return result;
  }, [order]);
  
  // Calcular totales por tipo
  const totals = useMemo(() => {
    const result = {
      COMIDA: 0,
      BEBIDA: 0,
    };
    
    productSummary.forEach(producto => {
      if (producto.tipo === 'comida') {
        result.COMIDA += producto.cantidad;
      } else if (producto.tipo === 'bebida') {
        result.BEBIDA += producto.cantidad;
      }
    });
    
    return result;
  }, [productSummary]);
  
  if (!order) {
    return <Typography>Cargando resumen...</Typography>;
  }
  
  return (
    <Box>
      <Typography display="flex" justifyContent="center" variant="h6" gutterBottom>
        Resumen total del pedido
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 3 }}>
        <Box sx={{ textAlign: 'center' }}>
          <LunchDiningIcon color="primary" sx={{ fontSize: 40 }} />
          <Typography variant="h5">{totals.COMIDA}</Typography>
          <Typography variant="body2" color="textSecondary">Comidas</Typography>
        </Box>
        
        <Box sx={{ textAlign: 'center' }}>
          <LocalCafeIcon color="secondary" sx={{ fontSize: 40 }} />
          <Typography variant="h5">{totals.BEBIDA}</Typography>
          <Typography variant="body2" color="textSecondary">Bebidas</Typography>
        </Box>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <TableContainer component={Paper}>
        <Table aria-label="tabla de resumen de productos">
          <TableHead>
            <TableRow>
              <TableCell><strong>Producto</strong></TableCell>
              <TableCell align="center"><strong>Cantidad</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {productSummary.length > 0 ? (
              productSummary.map((product, index) => (
                <TableRow key={index}>
                  <TableCell>{product.nombre}</TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={product.cantidad}
                      color="default"
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography variant="body2" color="textSecondary">
                    No hay productos en este pedido
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

       <Divider sx={{ my: 2 }} />
            
            <Card sx={{ mb: 4 }}>
              <CardContent>
                
                <Typography textAlign='center' variant="body1" gutterBottom>
                  <strong>Participantes ({order?.usuarios?.length || 0})</strong>
                </Typography>
                
                <List dense>
                  {order?.usuarios?.map((usuario, index) => (
                    <ListItem 
                      key={index}            
                    >
                      <ListItemButton 
                        key={index}
                        onClick={() => handleUserClick(usuario)}
                      >
                        <ListItemText 
                          primary={usuario.nombre || usuario.id} 
                          secondary={`${usuario.productos?.length || 0} productos seleccionados`} 
                        />
                      </ListItemButton>
                      
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
      {/* Diálogo para mostrar productos de un participante */}
            <Dialog
              open={dialogOpen}
              onClose={handleCloseDialog}
              aria-labelledby="user-products-dialog-title"
              maxWidth="sm"
              fullWidth
            >
              <DialogTitle id="user-products-dialog-title">
                <Typography variant="h6" component="div" align="center">
                  Productos seleccionados por {selectedUser?.nombre || selectedUser?.id}
                </Typography>
              </DialogTitle>
              <DialogContent dividers>
                {selectedUser && selectedUser.productos && selectedUser.productos.length > 0 ? (
                  <List>
                    {selectedUser.productos.map((producto, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={producto.nombre}
                          secondary={producto.tipo}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography align="center" color="textSecondary">
                    Este participante no ha seleccionado productos
                  </Typography>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseDialog} color="primary">
                  Cerrar
                </Button>
              </DialogActions>
            </Dialog>

    </Box>
  );
};

export default OrderSummary;