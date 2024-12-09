import { auth } from "./firebase_config.js";
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/9.16.0/firebase-auth.js";

const emailInput = document.getElementById("user-email");
const passwordInput = document.getElementById("user-password");
const loginBtn = document.getElementById("login-submit");

loginBtn.addEventListener("click", () => {
    const email = emailInput.value.trim(); // Trim removes unnecessary whitespace
    const password = passwordInput.value.trim();

    // Check if email and password are not empty
    if (!email || !password) {
        alert("Email and password cannot be blank!");
        return;
    }else {
        signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log("User signed in:", userCredential.user);
            alert("Logged in successfully!");
        })
        .catch((error) => {
            console.error("Error signing in:", error.message);
            alert("Invalid credentials");
        });
    }
})

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User is logged in:", user.email);
        window.location.href = "admin_page.html";
    } else {
        console.log("No user is logged in");
    }
});