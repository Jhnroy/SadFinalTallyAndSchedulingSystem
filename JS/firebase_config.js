import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyByY9E9dFEVCOZDYoye1BLnYML7IkJW8f8",
    authDomain: "sdo-application.firebaseapp.com",
    projectId: "sdo-application",
    storageBucket: "sdo-application.firebasestorage.app",
    messagingSenderId: "359061056327",
    appId: "1:359061056327:web:5d7b142dcb6ea9f7377a62",
    measurementId: "G-EMQ4ZHPBGZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

export {auth, db};