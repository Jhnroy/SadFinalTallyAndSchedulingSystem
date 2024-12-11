import { db, auth } from "./firebase_config.js";
import { signOut } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { ref, set, update, get } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";

const btnSched = document.getElementById("nav_schedule");
const btnBracket = document.getElementById("nav_bracket");
const logoutBtn = document.getElementById("logout_btn");
const bracketARef = ref(db, 'bracket-a');
const bracketBRef = ref(db, 'bracket-b');
const dropdown = document.getElementById("team-dropdown");
const teamTally = document.getElementById("team-tally");

btnSched.addEventListener("click", () => {
  window.location.href = "admin_page.html"; 
});
btnBracket.addEventListener("click", () => {
  window.location.href = "adminpageSetBracket.html"; 
});

logoutBtn.addEventListener("click", () => {
  signOut(auth)
      .then(() => {
          console.log("User signed out successfully");
          window.location.href = "login.html";
      })
      .catch((error) => {
          console.error("Error signing out:", error);
          alert("Error signing out: " + error.message);
      });
});

async function loadTeams() {
  try {
      // Fetch tally data to determine which teams are already added
      const tallySnapshot = await get(ref(db, 'tally'));
      const existingTeams = tallySnapshot.exists() ? Object.keys(tallySnapshot.val()) : [];

      // Fetch bracket-a and bracket-b teams
      const [bracketASnapshot, bracketBSnapshot] = await Promise.all([
          get(bracketARef),
          get(bracketBRef)
      ]);

      const teams = new Set(); // Use a Set to avoid duplicates

      if (bracketASnapshot.exists()) {
          Object.values(bracketASnapshot.val()).forEach(team => teams.add(team));
      }

      if (bracketBSnapshot.exists()) {
          Object.values(bracketBSnapshot.val()).forEach(team => teams.add(team));
      }

      // Exclude teams already present in the tally
      const availableTeams = Array.from(teams).filter(team => !existingTeams.includes(team));

      // Populate dropdown with available teams
      dropdown.innerHTML = ""; // Clear existing options
      availableTeams.forEach(team => {
          const option = document.createElement("option");
          option.value = team;
          option.textContent = team;
          dropdown.appendChild(option);
      });
  } catch (error) {
      console.error("Error loading teams:", error);
  }
}


// Handle form submission to add a team
async function addTeamToDatabase(teamName) {
    const teamRef = ref(db, `tally/${teamName}`);
    await set(teamRef, {
        gold: 0,
        silver: 0,
        bronze: 0
    });
}

document.querySelector(".team-input").addEventListener("submit", async (event) => {
    event.preventDefault();

    const selectedTeam = dropdown.value;
    if (!selectedTeam) {
        alert("Please select a team.");
        return;
    }

    // Add the selected team to the database and UI
    await addTeamToDatabase(selectedTeam);
    addTeamRow(selectedTeam);

    // Remove the selected team from the dropdown
    const selectedOption = dropdown.querySelector(`option[value="${selectedTeam}"]`);
    selectedOption.remove();

    dropdown.value = "";
});


// Update medal count in the database and UI
async function updateMedalCount(teamName, medalType, change) {
  const teamRef = ref(db, `tally/${teamName}`);
  try {
      // Fetch current tally data for the team
      const snapshot = await get(teamRef);
      if (!snapshot.exists()) {
          console.error(`Team ${teamName} not found in the database.`);
          return;
      }

      const teamData = snapshot.val();
      const currentCount = teamData[medalType] || 0; // Default to 0 if undefined
      let newCount = currentCount + change;

      // Prevent count from dropping below zero
      if (newCount < 0) {
          console.warn(`${medalType} count for ${teamName} cannot drop below zero.`);
          return;
      }

      // Update the count in the database
      await update(teamRef, { [medalType]: newCount });

      // Update the UI
      const teamRow = Array.from(teamTally.children).find(row =>
          row.querySelector(".team-name").textContent === teamName
      );
      if (teamRow) {
          const medalSpan = teamRow.querySelector(`.medal-count[data-type="${medalType}"]`);
          medalSpan.textContent = `${medalType.charAt(0).toUpperCase() + medalType.slice(1)}: ${newCount}`;
      }

      console.log(`Updated ${medalType} count for ${teamName} to ${newCount}`);
  } catch (error) {
      console.error(`Error updating ${medalType} count for ${teamName}:`, error);
  }
}


// Load existing tally data from Firebase
async function loadTally() {
  try {
      const tallySnapshot = await get(ref(db, 'tally'));
      if (!tallySnapshot.exists()) return;

      const tallyData = tallySnapshot.val();

      Object.keys(tallyData).forEach(teamName => {
          const teamData = tallyData[teamName];
          addTeamRow(teamName, teamData);
      });
  } catch (error) {
      console.error("Error loading tally data:", error);
  }
}

// Add a new team row (modified to include initial medal data)
function addTeamRow(teamName, medalData = { gold: 0, silver: 0, bronze: 0 }) {
  const row = document.createElement("div");
  row.className = "team-row";
  row.style.margin = "10px 0";

  // Team Name
  const teamNameSpan = document.createElement("span");
  teamNameSpan.className = "team-name";
  teamNameSpan.textContent = teamName;
  row.appendChild(teamNameSpan);

  // Medal Counts
  const medalCounts = ["gold", "silver", "bronze"];
  medalCounts.forEach((medal) => {
      const medalSpan = document.createElement("span");
      medalSpan.className = "medal-count";
      medalSpan.dataset.type = medal;
      medalSpan.textContent = `${medal.charAt(0).toUpperCase() + medal.slice(1)}: ${medalData[medal] || 0}`;
      row.appendChild(medalSpan);
  });

  // Action Buttons
  const actionButtons = document.createElement("span");
  actionButtons.className = "action-buttons";

  medalCounts.forEach((medal) => {
      const incrementButton = document.createElement("button");
      incrementButton.className = `btn ${medal}`;
      incrementButton.textContent = `${medal.charAt(0).toUpperCase() + medal.slice(1)} +`;
      incrementButton.addEventListener("click", () => updateMedalCount(teamName, medal, 1));
      actionButtons.appendChild(incrementButton);

      const decrementButton = document.createElement("button");
      decrementButton.className = `btn minus ${medal}`;
      decrementButton.textContent = `${medal.charAt(0).toUpperCase() + medal.slice(1)} -`;
      decrementButton.addEventListener("click", () => updateMedalCount(teamName, medal, -1));
      actionButtons.appendChild(decrementButton);
  });

  row.appendChild(actionButtons);

  teamTally.appendChild(row);
}

// Load teams and tally on page load
(async function initializePage() {
  await loadTeams(); // Load dropdown options
  await loadTally(); // Load existing tally data
})();
