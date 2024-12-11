import { db } from "./firebase_config.js"; // Replace with your actual Firebase config file
import { ref, onValue } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";

const scheduleTableBody = document.querySelector(".game-schedule tbody");
const tallyTableBody = document.querySelector(".current-tally tbody");
const bracketA = document.querySelector(".bracket-a");
const bracketB = document.querySelector(".bracket-b");

// Utility: Clear all child nodes
function clearChildren(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

// Listen for Schedule updates
function listenForSchedules() {
    const scheduleRef = ref(db, 'schedules');
    onValue(scheduleRef, (snapshot) => {
        if (snapshot.exists()) {
            const schedules = Object.values(snapshot.val());
            const now = new Date();

            // Helper function to parse date and time
            const parseDateTime = (date, time) => {
                const parsedDate = new Date(`${date} ${time}`);
                return isNaN(parsedDate) ? null : parsedDate;
            };

            // Sort schedules
            schedules.sort((a, b) => {
                const dateTimeA = parseDateTime(a.date, a.time);
                const dateTimeB = parseDateTime(b.date, b.time);

                // Handle invalid dates
                if (!dateTimeA || !dateTimeB) {
                    console.error("Invalid date/time detected:", a, b);
                    return 0; // Leave unsorted if invalid data is present
                }

                // Future and past sorting logic
                const isAFuture = dateTimeA >= now;
                const isBFuture = dateTimeB >= now;

                if (isAFuture && isBFuture) {
                    // Both are in the future, sort ascending
                    return dateTimeA - dateTimeB;
                } else if (!isAFuture && !isBFuture) {
                    // Both are in the past, sort descending
                    return dateTimeB - dateTimeA;
                } else {
                    // Future events come before past events
                    return isAFuture ? -1 : 1;
                }
            });

            // Clear and render sorted schedules
            clearChildren(scheduleTableBody);
            schedules.forEach((schedule) => {
                const row = document.createElement("tr");
                const dateCell = document.createElement("td");
                const teamsCell = document.createElement("td");
                const venueCell = document.createElement("td");
                const sportCell = document.createElement("td");

                dateCell.textContent = schedule.date + " | " + schedule.time || "N/A";
                teamsCell.textContent = schedule.teams || "N/A";
                venueCell.textContent = schedule.venue || "N/A";
                sportCell.textContent = schedule.sport || "N/A";

                row.appendChild(dateCell);
                row.appendChild(teamsCell);
                row.appendChild(venueCell);
                row.appendChild(sportCell);

                scheduleTableBody.appendChild(row);
            });
        } else {
            console.log("No schedules available");
        }
    });
}


// Listen for Tally updates
function listenForTally() {
    const tallyRef = ref(db, 'tally');
    onValue(tallyRef, (snapshot) => {
        if (snapshot.exists()) {
            const tallies = snapshot.val();
            clearChildren(tallyTableBody); // Clear existing rows
            Object.entries(tallies).forEach(([teamName, medals]) => {
                const row = document.createElement("tr");
                const teamNameCell = document.createElement("td");
                const goldCell = document.createElement("td");
                const silverCell = document.createElement("td");
                const bronzeCell = document.createElement("td");

                teamNameCell.textContent = teamName;
                goldCell.textContent = medals.gold || 0;
                silverCell.textContent = medals.silver || 0;
                bronzeCell.textContent = medals.bronze || 0;

                row.appendChild(teamNameCell);
                row.appendChild(goldCell);
                row.appendChild(silverCell);
                row.appendChild(bronzeCell);

                tallyTableBody.appendChild(row);
            });
        } else {
            console.log("No tally data available");
        }
    });
}

// Listen for Bracket updates
// Listen for Bracket updates
function listenForBrackets() {
    const bracketARef = ref(db, 'bracket-a');
    const bracketBRef = ref(db, 'bracket-b');

    // Bracket A
    onValue(bracketARef, (snapshot) => {
        if (snapshot.exists()) {
            const teams = Object.values(snapshot.val());
            clearChildren(bracketA); // Clear existing placeholders

            // Filter out teams with "Team" in their name
            const filteredTeams = teams.filter(team => !team.toLowerCase().includes("team"));

            filteredTeams.forEach((team) => {
                const teamDiv = document.createElement("div");
                teamDiv.className = "team-placeholder";
                teamDiv.textContent = team;
                bracketA.appendChild(teamDiv);
            });
        } else {
            console.log("No Bracket A data available");
        }
    });

    // Bracket B
    onValue(bracketBRef, (snapshot) => {
        if (snapshot.exists()) {
            const teams = Object.values(snapshot.val());
            clearChildren(bracketB); // Clear existing placeholders

            // Filter out teams with "Team" in their name
            const filteredTeams = teams.filter(team => !team.toLowerCase().includes("team"));

            filteredTeams.forEach((team) => {
                const teamDiv = document.createElement("div");
                teamDiv.className = "team-placeholder";
                teamDiv.textContent = team;
                bracketB.appendChild(teamDiv);
            });
        } else {
            console.log("No Bracket B data available");
        }
    });
}


// Initialize listeners
function initializeListeners() {
    listenForSchedules();
    listenForTally();
    listenForBrackets();
}

// Initialize listeners on page load
initializeListeners();



document.getElementById("login-btn").addEventListener("click", function(e) {
    e.preventDefault();
    window.location.href = "login.html";
})