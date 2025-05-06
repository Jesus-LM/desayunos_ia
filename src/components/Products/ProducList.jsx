import React, { useState, useEffect } from 'react';
import { 
  Grid, Card, CardContent, Typography, IconButton, 
  TextField, InputAdornment, Box, CircularProgress, 
  Checkbox, FormControlLabel, Chip
} from '@mui/material';
import LunchDiningIcon from '@mui/icons-material/LunchDining';
import SearchIcon from '@mui/icons-material/Search';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import { collection, getDocs, query, where, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../hooks/useAuth';

const ProductList = ({ category, selectedProducts }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState([]);
  const { currentUser } = useAuth();

  // Cargar productos y favoritos del usuario
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        
        // Primero cargar los favoritos del usuario
        const userRef = doc(db, 'USUARIOS', currentUser.email);
        const userSnap = await getDoc(userRef);
        
        let userFavorites = [];
        if (userSnap.exists()) {
          userFavorites = userSnap.data().favoritos || [];
          setFavorites(userFavorites);
        }
        
        // Ahora cargar los productos según la categoría
        let productsQuery;
        
        if (category === 'FAVORITOS') {
          if (userFavorites.length === 0) {
            setProducts([]);
            setLoading(false);
            return;
          }
          
          // Cargar todos los productos y filtrar por favoritos
          productsQuery = collection(db, 'PRODUCTOS');
          const querySnapshot = await getDocs(productsQuery);
          
          const productsData = [];
          querySnapshot.forEach((doc) => {
            const productData = { id: doc.id, ...doc.data() };
            if (userFavorites.includes(doc.id)) {
              productsData.push(productData);
            }
          });
          
          setProducts(productsData);
        } else {
          // Cargar productos por tipo específico
          productsQuery = query(
            collection(db, 'PRODUCTOS'),
            where('tipo', '==', category)
          );
          
          const querySnapshot = await getDocs(productsQuery);
          const productsData = [];
          
          querySnapshot.forEach((doc) => {
            productsData.push({
              id: doc.id,
              ...doc.data(),
              isFavorite: userFavorites.includes(doc.id)
            });
          });
          
          setProducts(productsData);
        }
      } catch (error) {
        console.error("Error al cargar productos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, category]);

  // Filtrar productos por término de búsqueda
  const filteredProducts = products.filter(product => 
    product.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Verificar si un producto está seleccionado
  const isProductSelected = (productId) => {
    return selectedProducts.some(p => p.id === productId);
  };

  // Manejar cambio en favoritos
  const handleToggleFavorite = async (product) => {
    if (!currentUser) return;
    
    try {
      const userRef = doc(db, 'USUARIOS', currentUser.email);
      const isFavorite = favorites.includes(product.id);
      
      if (isFavorite) {
        // Quitar de favoritos
        await updateDoc(userRef, {
          favoritos: arrayRemove(product.id)
        });
        setFavorites(prev => prev.filter(id => id !== product.id));
      } else {
        // Añadir a favoritos
        await updateDoc(userRef, {
          favoritos: arrayUnion(product.id)
        });
        setFavorites(prev => [...prev, product.id]);
      }
      
      // Actualizar la vista de productos
      setProducts(prevProducts => 
        prevProducts.map(p => 
          p.id === product.id 
            ? { ...p, isFavorite: !isFavorite }
            : p
        )
      );
    } catch (error) {
      console.error("Error al actualizar favoritos:", error);
    }
  };

  // Renderizar el contenido
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Buscar productos..."
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {filteredProducts.length === 0 ? (
        <Box sx={{ textAlign: 'center', p: 3 }}>
          <Typography variant="body1" color="textSecondary">
            {category === 'FAVORITOS' 
              ? 'No tienes productos favoritos aún'
              : 'No se encontraron productos'}
          </Typography>
        </Box>
      ) : (
        <Grid container mb={2} spacing={2}>
          {filteredProducts.map((product) => (
            <Grid  display="flex" justifyContent="center" alignItems="center"  size={{ xs: 12, sm: 6, md:4 }} key={product.id}>
              <Card 
                elevation={isProductSelected(product.id) ? 3 : 1}
                sx={{
                  height: '100%',
                  width: '100%',
                  border: isProductSelected(product.id) ? '2px solid #3f51b5' : 'none',
                  position: 'relative'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" component="h3" noWrap>
                      {product.nombre}
                    </Typography>
                    <IconButton 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(product);
                      }}
                      color="warning"
                      size="small"
                    >
                      {favorites.includes(product.id) ? <StarIcon /> : <StarBorderIcon />}
                    </IconButton>
                  </Box>
                  
                  <Box sx={{ mt: 1, display: 'flex', justifyContent: 'left', alignItems: 'center' }}>
                    <Chip 
                      icon={product.tipo === 'comida' ? <LunchDiningIcon /> : <LocalCafeIcon />}
                      label={product.tipo}
                      color={product.tipo === 'comida' ? 'primary' : 'secondary'}
                      size="small"
                      variant="outlined"
                      sx={{ mr: 1 }}
                    />
                  </Box>
                  

                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default ProductList;