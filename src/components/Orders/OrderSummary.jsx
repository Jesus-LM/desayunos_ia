import React, { useMemo } from 'react';
import {
  Typography, Box, Divider, List, ListItem, ListItemText,
  Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Chip
} from '@mui/material';
import FastfoodIcon from '@mui/icons-material/Fastfood';
import LunchDiningIcon from '@mui/icons-material/LunchDining';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';

const OrderSummary = ({ order }) => {
  // Calcular el resumen de productos agrupados por tipo y ordenados
  const productSummary = useMemo(() => {
    if (!order || !order.participants) return [];
    
    // Primero vamos a extraer todos los productos de todos los participantes
    const allProducts = [];
    order.participants.forEach(participant => {
      if (participant.products && participant.products.length > 0) {
        participant.products.forEach(product => {
          allProducts.push({
            ...product,
            orderedBy: participant.userName || participant.userId
          });
        });
      }
    });
    
    // Agrupamos los productos por tipo y nombre
    const groupedProducts = {};
    
    allProducts.forEach(product => {
      const key = `${product.type}-${product.name}`;
      
      if (!groupedProducts[key]) {
        groupedProducts[key] = {
          id: product.id,
          name: product.name,
          type: product.type,
          count: 1,
          orderedBy: [product.orderedBy]
        };
      } else {
        groupedProducts[key].count += 1;
        if (!groupedProducts[key].orderedBy.includes(product.orderedBy)) {
          groupedProducts[key].orderedBy.push(product.orderedBy);
        }
      }
    });
    
    // Convertimos a array y ordenamos
    const result = Object.values(groupedProducts);
    
    // Ordenamos primero por tipo (COMIDA antes que BEBIDA) y luego alfabéticamente por nombre
    result.sort((a, b) => {
      if (a.type === 'COMIDA' && b.type !== 'COMIDA') return -1;
      if (a.type !== 'COMIDA' && b.type === 'COMIDA') return 1;
      return a.name.localeCompare(b.name);
    });
    
    return result;
  }, [order]);
  
  // Calcular totales por tipo
  const totals = useMemo(() => {
    const result = {
      COMIDA: 0,
      BEBIDA: 0,
      total: 0
    };
    
    productSummary.forEach(product => {
      if (product.type === 'COMIDA') {
        result.COMIDA += product.count;
      } else if (product.type === 'BEBIDA') {
        result.BEBIDA += product.count;
      }
      result.total += product.count;
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
              <TableCell><strong>Tipo</strong></TableCell>
              <TableCell><strong>Producto</strong></TableCell>
              <TableCell align="center"><strong>Cantidad</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {productSummary.length > 0 ? (
              productSummary.map((product, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Chip 
                      icon={product.type === 'COMIDA' ? <FastfoodIcon /> : <LocalCafeIcon />}
                      label={product.type}
                      color={product.type === 'COMIDA' ? 'primary' : 'secondary'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={product.count}
                      color="default"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {product.orderedBy.map((person, idx) => (
                        <Chip 
                          key={idx}
                          label={person}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
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
    </Box>
  );
};

export default OrderSummary;