import { db, auth } from "./firebase_config.js";
import { signOut } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { ref, update, get } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";

const btnSched = document.getElementById("nav_schedule");
const btnTally = document.getElementById("nav_tally");
const logoutBtn = document.getElementById("logout_btn");
const inputs = [
    input_1, input_2, input_3, input_4,
    input_5, input_6, input_7, input_8, input_9,
];
const setTeamBtn = document.getElementById("set_team_btn");

const bracket_a_ref = ref(db, "bracket-a");
const bracket_b_ref = ref(db, "bracket-b");


console.log(bracket_a_ref)

// Navigation button event handlers
btnTally.addEventListener("click", () => {
    window.location.href = "adminpageSetTally.html";
});
btnSched.addEventListener("click", () => {
    window.location.href = "admin_page.html";
});

logoutBtn.addEventListener("click" , () => {
    signOut(auth)
        .then(() => {
            console.log("User signed out successfully");
            window.location.href = "login.html"; // Change to your desired redirect URL
        })
        .catch((error) => {
            console.error("Error signing out:", error);
            alert("Error signing out: " + error.message);
        });
})

// Track which inputs have been modified
const modifiedInputs = new Set();
inputs.forEach((input) => {
    input.addEventListener("input", () => {
        modifiedInputs.add(input.id); // Track modified input
    });
});

// Function to clear input fields
function clearInputs() {
    inputs.forEach((input) => {
        input.value = "";
    });
}

// Function to update only modified inputs
function updateModifiedInputs() {
    const updatesA = {};
    const updatesB = {};

    modifiedInputs.forEach((inputId) => {
        const inputElement = document.getElementById(inputId);
        const value = inputElement.value.trim().toUpperCase();

        if (inputId.startsWith("input_1") || inputId.startsWith("input_2") ||
            inputId.startsWith("input_3") || inputId.startsWith("input_4")) {
            updatesA[inputId] = value;
        } else {
            updatesB[inputId] = value;
        }

        // Update the DOM for the modified input
        const teamId = `team_${inputId.split("_")[1]}`;
        const teamElement = document.getElementById(teamId);
        if (teamElement) {
            teamElement.innerText = value || `Team ${inputId.split("_")[1]}`;
        }
    });

    // Update the database for bracket A and B
    if (Object.keys(updatesA).length > 0) {
        update(bracket_a_ref, updatesA)
            .then(() => console.log("Bracket A updated successfully:", updatesA))
            .catch((error) => console.error("Error updating Bracket A:", error));
    }

    if (Object.keys(updatesB).length > 0) {
        update(bracket_b_ref, updatesB)
            .then(() => console.log("Bracket B updated successfully:", updatesB))
            .catch((error) => console.error("Error updating Bracket B:", error));
    }

    // Clear modified inputs tracker
    modifiedInputs.clear();
    clearInputs();
}

// Function to load initial data from the database
function loadDataFromDatabase() {
    get(bracket_a_ref).then((snapshot) => {
        if (snapshot.exists()) {
            const dataA = snapshot.val();
            console.log("Bracket A data loaded:", dataA);
            for (let i = 1; i <= 4; i++) {
                const teamElement = document.getElementById(`team_${i}`);
                if (teamElement) {
                    teamElement.innerText = dataA[`input_${i}`] || `Team ${i}`;
                }
            }
        } else {
            console.log("No data available for Bracket A");
        }
    }).catch((error) => {
        console.error("Error loading Bracket A data:", error);
    });

    get(bracket_b_ref).then((snapshot) => {
        if (snapshot.exists()) {
            const dataB = snapshot.val();
            console.log("Bracket B data loaded:", dataB);
            for (let i = 5; i <= 9; i++) {
                const teamElement = document.getElementById(`team_${i}`);
                if (teamElement) {
                    teamElement.innerText = dataB[`input_${i}`] || `Team ${i}`;
                }
            }
        } else {
            console.log("No data available for Bracket B");
        }
    }).catch((error) => {
        console.error("Error loading Bracket B data:", error);
    });
}

// Load data on page load
window.addEventListener("load", loadDataFromDatabase);

// Set Team Button Click Event
setTeamBtn.addEventListener("click", (event) => {
    event.preventDefault();
    updateModifiedInputs();
});
document.addEventListener("DOMContentLoaded", () => {
    // Select all clear buttons
    const clearBracketButtons = document.querySelectorAll(".clear-bracket-btn");

    // Add click event listeners to each button
    clearBracketButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
            // Retrieve the bracket identifier from the button's dataset
            const bracket = event.target.dataset.bracket;
    
            // Find the corresponding teams within the selected bracket
            const bracketElement = document.querySelector(`.${bracket.replace('_', '-')}`);
            if (bracketElement) {
                const teams = bracketElement.querySelectorAll(".team");
                const updates = {};
    
                // Calculate the starting number based on the bracket
                let startNumber = bracket === "bracket-a" ? 1 : 5;
    
                // Reset each team and prepare updates for the database
                teams.forEach((team, index) => {
                    const teamNumber = startNumber + index; // Adjusted to account for bracket offset
                    const newTeamName = `Team ${teamNumber}`;
                    team.textContent = newTeamName;
    
                    // Prepare updates for the database
                    updates[`input_${teamNumber}`] = newTeamName;
                });
    
                // Save cleared data to the database
                const bracketRef = bracket === "bracket-a" ? bracket_a_ref : bracket_b_ref;
                update(bracketRef, updates)
                    .then(() => {
                        console.log(`${bracket} cleared and updated successfully!`);
                    })
                    .catch((error) => {
                        console.error(`Error updating ${bracket}:`, error);
                    });
            } else {
                console.error(`Bracket ${bracket} not found!`);
            }
        });
    });    
});