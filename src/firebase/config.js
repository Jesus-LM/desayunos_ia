// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCzxl2FNJFgbY_Qb7jVE6CUTm9bvaZTYoY",
    authDomain: "desayunos-ai-app.firebaseapp.com",
    projectId: "desayunos-ai-app",
    storageBucket: "desayunos-ai-app.firebasestorage.app",
    messagingSenderId: "665043402932",
    appId: "1:665043402932:web:714666613928802f87d7e1"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };