// firebase/firestore.js
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  query, 
  orderBy, 
  serverTimestamp, 
  addDoc,
  where
} from 'firebase/firestore';
import { db } from './config';

// ---- USUARIOS ----

// Obtener un usuario por su email
export const getUsuario = async (email) => {
  try {
    const docRef = doc(db, 'USUARIOS', email);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.log("No existe el usuario!");
      return null;
    }
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    throw error;
  }
};

// Actualizar favoritos de un usuario
export const toggleFavorito = async (email, productoId) => {
  try {
    const usuarioRef = doc(db, 'USUARIOS', email);
    const usuarioSnap = await getDoc(usuarioRef);
    
    if (usuarioSnap.exists()) {
      const favoritos = usuarioSnap.data().favoritos || [];
      
      if (favoritos.includes(productoId)) {
        // Eliminar de favoritos
        await updateDoc(usuarioRef, {
          favoritos: arrayRemove(productoId)
        });
      } else {
        // Añadir a favoritos
        await updateDoc(usuarioRef, {
          favoritos: arrayUnion(productoId)
        });
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error al actualizar favoritos:", error);
    throw error;
  }
};

// ---- PRODUCTOS ----

// Obtener todos los productos
export const getProductos = async () => {
  try {
    const q = query(collection(db, 'PRODUCTOS'), orderBy('nombre'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error al obtener productos:", error);
    throw error;
  }
};

// Obtener productos por tipo (comida o bebida)
export const getProductosPorTipo = async (tipo) => {
  try {
    const q = query(
      collection(db, 'PRODUCTOS'), 
      where('tipo', '==', tipo),
      orderBy('nombre')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error(`Error al obtener productos de tipo ${tipo}:`, error);
    throw error;
  }
};

// Obtener productos favoritos de un usuario
export const getProductosFavoritos = async (email) => {
  try {
    const usuario = await getUsuario(email);
    if (!usuario || !usuario.favoritos || usuario.favoritos.length === 0) {
      return [];
    }
    
    // Obtener cada producto favorito
    const favoritos = [];
    for (const productoId of usuario.favoritos) {
      const productoRef = doc(db, 'PRODUCTOS', productoId);
      const productoSnap = await getDoc(productoRef);
      
      if (productoSnap.exists()) {
        favoritos.push({
          id: productoSnap.id,
          ...productoSnap.data()
        });
      }
    }
    
    // Ordenar alfabéticamente por nombre
    return favoritos.sort((a, b) => a.nombre.localeCompare(b.nombre));
  } catch (error) {
    console.error("Error al obtener favoritos:", error);
    throw error;
  }
};

// ---- PEDIDOS ----

// Crear un nuevo pedido
export const crearPedido = async (nombrePedido, usuarioEmail, productos = []) => {
  try {
    console.log(`Intentando crear pedido: ${nombrePedido} para usuario: ${usuarioEmail}`);
    
    // Intentar obtener el usuario (si no existe usaremos solo el email)
    let nombreUsuario = usuarioEmail;
    try {
      const usuario = await getUsuario(usuarioEmail);
      if (usuario && usuario.nombre) {
        nombreUsuario = usuario.nombre;
      }
    } catch (e) {
      console.log("No se pudo obtener el usuario, usando email como nombre");
    }
    
    // Crear el pedido usando addDoc para generar un ID aleatorio
    const pedidoRef = collection(db, 'PEDIDOS');
    
    // Esta estructura combina ambos formatos para compatibilidad
    const nuevoPedido = {
      // Campos antiguos (usados en el componente)
      name: nombrePedido,
      createdAt: serverTimestamp(),
      createdBy: usuarioEmail,
      participants: [{
        userId: usuarioEmail,
        userName: nombreUsuario,
        products: productos
      }],
      
      // Campos nuevos (usados en las funciones existentes)
      nombre: nombrePedido,
      fechaCreacion: serverTimestamp(),
      usuarios: [{
        email: usuarioEmail,
        nombre: nombreUsuario,
        productos: productos
      }]
    };
    
    const docRef = await addDoc(pedidoRef, nuevoPedido);
    console.log("Pedido creado con ID:", docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error("Error al crear pedido:", error);
    throw error;
  }
};

// Obtener todos los pedidos
export const getPedidos = async () => {
  try {
    // Consulta que funciona con ambos formatos (name o nombre)
    const q = query(collection(db, 'PEDIDOS'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Asegurarnos que tenemos una estructura consistente
      return {
        id: doc.id,
        name: data.name || data.nombre,
        createdAt: data.createdAt || data.fechaCreacion,
        participants: data.participants || data.usuarios?.map(u => ({
          userId: u.email,
          userName: u.nombre,
          products: u.productos
        })) || [],
        ...data
      };
    });
  } catch (error) {
    console.error("Error al obtener pedidos:", error);
    throw error;
  }
};

// Obtener un pedido específico
export const getPedido = async (pedidoId) => {
  try {
    const docRef = doc(db, 'PEDIDOS', pedidoId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Asegurarnos que tenemos una estructura consistente
      return {
        id: docSnap.id,
        name: data.name || data.nombre,
        createdAt: data.createdAt || data.fechaCreacion,
        participants: data.participants || data.usuarios?.map(u => ({
          userId: u.email,
          userName: u.nombre,
          products: u.productos
        })) || [],
        ...data
      };
    } else {
      console.log("No existe el pedido!");
      return null;
    }
  } catch (error) {
    console.error("Error al obtener pedido:", error);
    throw error;
  }
};

// Unirse a un pedido existente
export const unirseAPedido = async (pedidoId, usuarioEmail, productos) => {
  try {
    let nombreUsuario = usuarioEmail;
    try {
      const usuario = await getUsuario(usuarioEmail);
      if (usuario && usuario.nombre) {
        nombreUsuario = usuario.nombre;
      }
    } catch (e) {
      console.log("No se pudo obtener el usuario, usando email como nombre");
    }
    
    const pedidoRef = doc(db, 'PEDIDOS', pedidoId);
    const pedidoSnap = await getDoc(pedidoRef);
    
    if (!pedidoSnap.exists()) {
      throw new Error('El pedido no existe');
    }
    
    const pedidoData = pedidoSnap.data();
    
    // Manejar estructura antigua (participants)
    if (pedidoData.participants) {
      const participantIndex = pedidoData.participants.findIndex(p => p.userId === usuarioEmail);
      
      if (participantIndex !== -1) {
        // Si el usuario ya está en el pedido, actualizar sus productos
        const updatedParticipants = [...pedidoData.participants];
        updatedParticipants[participantIndex] = {
          ...updatedParticipants[participantIndex],
          products: productos || []
        };
        
        await updateDoc(pedidoRef, {
          participants: updatedParticipants
        });
      } else {
        // Añadir el usuario al pedido
        await updateDoc(pedidoRef, {
          participants: arrayUnion({
            userId: usuarioEmail,
            userName: nombreUsuario,
            products: productos || []
          })
        });
      }
    }
    
    // Manejar estructura nueva (usuarios)
    if (pedidoData.usuarios) {
      const usuarioIndex = pedidoData.usuarios.findIndex(u => u.email === usuarioEmail);
      
      if (usuarioIndex !== -1) {
        // Si el usuario ya está en el pedido, actualizar sus productos
        const usuariosActualizados = [...pedidoData.usuarios];
        usuariosActualizados[usuarioIndex] = {
          ...usuariosActualizados[usuarioIndex],
          productos: productos || []
        };
        
        await updateDoc(pedidoRef, {
          usuarios: usuariosActualizados
        });
      } else {
        // Añadir el usuario al pedido
        await updateDoc(pedidoRef, {
          usuarios: arrayUnion({
            email: usuarioEmail,
            nombre: nombreUsuario,
            productos: productos || []
          })
        });
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error al unirse al pedido:", error);
    throw error;
  }
};

// Actualizar productos de un usuario en un pedido
export const actualizarProductosEnPedido = async (pedidoId, usuarioEmail, productos) => {
  try {
    const pedidoRef = doc(db, 'PEDIDOS', pedidoId);
    const pedidoSnap = await getDoc(pedidoRef);
    
    if (!pedidoSnap.exists()) {
      throw new Error('El pedido no existe');
    }
    
    const pedidoData = pedidoSnap.data();
    
    // Manejar estructura antigua (participants)
    if (pedidoData.participants) {
      const participantIndex = pedidoData.participants.findIndex(p => p.userId === usuarioEmail);
      
      if (participantIndex !== -1) {
        const updatedParticipants = [...pedidoData.participants];
        updatedParticipants[participantIndex] = {
          ...updatedParticipants[participantIndex],
          products: productos
        };
        
        await updateDoc(pedidoRef, {
          participants: updatedParticipants
        });
      }
    }
    
    // Manejar estructura nueva (usuarios)
    if (pedidoData.usuarios) {
      const usuarioIndex = pedidoData.usuarios.findIndex(u => u.email === usuarioEmail);
      
      if (usuarioIndex !== -1) {
        const usuariosActualizados = [...pedidoData.usuarios];
        usuariosActualizados[usuarioIndex] = {
          ...usuariosActualizados[usuarioIndex],
          productos: productos
        };
        
        await updateDoc(pedidoRef, {
          usuarios: usuariosActualizados
        });
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error al actualizar productos en el pedido:", error);
    throw error;
  }
};

// Obtener resumen total de un pedido (agrupado por categoría y ordenado alfabéticamente)
export const getResumenPedido = async (pedidoId) => {
  try {
    const pedido = await getPedido(pedidoId);
    if (!pedido) return null;
    
    const resumen = {
      comida: {},
      bebida: {}
    };
    
    // Para cada usuario/participante en el pedido
    const participantes = pedido.participants || pedido.usuarios || [];
    
    for (const participante of participantes) {
      // Obtener los productos (pueden estar en diferentes ubicaciones según la estructura)
      const productos = participante.products || participante.productos || [];
      
      // Para cada producto en el pedido del usuario
      for (const productoId of productos) {
        const productoRef = doc(db, 'PRODUCTOS', productoId);
        const productoSnap = await getDoc(productoRef);
        
        if (productoSnap.exists()) {
          const producto = productoSnap.data();
          const categoria = (producto.tipo || producto.type || 'otro').toLowerCase();
          
          if (!resumen[categoria]) {
            resumen[categoria] = {};
          }
          
          if (!resumen[categoria][productoId]) {
            resumen[categoria][productoId] = {
              nombre: producto.nombre || producto.name,
              cantidad: 1
            };
          } else {
            resumen[categoria][productoId].cantidad += 1;
          }
        }
      }
    }
    
    // Convertir el objeto a un array para poder ordenarlo
    const resultado = {};
    for (const categoria in resumen) {
      resultado[categoria] = Object.values(resumen[categoria])
        .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
    }
    
    return resultado;
  } catch (error) {
    console.error("Error al obtener resumen del pedido:", error);
    throw error;
  }
};