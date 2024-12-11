import { auth } from "./firebase_config.js";
import { signOut } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { db } from "./firebase_config.js";
import { ref, get, push, remove } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";

const logoutBtn = document.getElementById("logout_btn");
// const btnSched = document.getElementById("nav_schedule");
const btnTally = document.getElementById("nav_tally");
const btnBracket = document.getElementById("nav_bracket");

const allSchedule = [];

btnTally.addEventListener("click", () => {
  window.location.href = "adminpageSetTally.html"; 
})
btnBracket.addEventListener("click", () => {
  window.location.href = "adminpageSetBracket.html"; 
})
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

  

const bracket_a_ref = ref(db, "bracket-a");
const bracket_b_ref = ref(db, "bracket-b");

// Function to generate round-robin matchups
function generateRoundRobin(teams) {
    const matchups = [];
    for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
            matchups.push(`${teams[i]} vs ${teams[j]}`);
        }
    }
    return matchups;
}

// Function to load teams and create matchups for dropdown
async function createSingleDropdown() {
  try {
      const allMatchups = [];

      // Get teams for Bracket A
      const snapshotA = await get(bracket_a_ref);
      const teamsA = snapshotA.exists()
          ? Object.values(snapshotA.val())
              .filter((team) => team && !team.includes("Team")) // Filter out names containing "Team"
          : [];

      // Generate matchups for Bracket A
      const matchupsA = generateRoundRobin(teamsA);
      allMatchups.push(...matchupsA);

      // Get teams for Bracket B
      const snapshotB = await get(bracket_b_ref);
      const teamsB = snapshotB.exists()
          ? Object.values(snapshotB.val())
              .filter((team) => team && !team.includes("Team")) // Filter out names containing "Team"
          : [];

      // Generate matchups for Bracket B
      const matchupsB = generateRoundRobin(teamsB);
      allMatchups.push(...matchupsB);

      console.log("Filtered Matchups:", allMatchups);

      // Populate a single dropdown with all matchups
      const dropdown = document.getElementById("teams_dropdown");
      allMatchups.forEach((match) => {
          const option = document.createElement("option");
          option.value = match;
          option.textContent = match;
          dropdown.appendChild(option);
      });
  } catch (error) {
      console.error("Error creating dropdown:", error);
  }
}

// Call the function when the page loads
window.addEventListener("load", createSingleDropdown);

// Reusable function to create a table row
function createTableRow(game) {
  const row = document.createElement("tr");

  if (game.id) {
    row.setAttribute("data-id", game.id); // Use the unique ID from the database
  }

  // Define the table columns
  const columns = [
      game.name || "N/A",                 // Game Name
      game.teams || "N/A",                // Teams
      game.venue || "N/A",                // Venue
      game.sport || "N/A",                // Sport
      game.date || "N/A",                 // Date
      game.time || "N/A"                  // Time
  ];

  // Populate the row with data
  columns.forEach((col) => {
      const cell = document.createElement("td");
      cell.textContent = col;
      row.appendChild(cell);
  });

  // Create the actions cell
  const actionsCell = document.createElement("td");

  // Create the Edit button
  const editButton = document.createElement("button");
  editButton.className = "action-btn edit-btn";
  editButton.textContent = "Edit";
  editButton.addEventListener("click", () => editGame(row)); // Add event listener for Edit
  actionsCell.appendChild(editButton);

  // Create the Delete button
  const deleteButton = document.createElement("button");
  deleteButton.className = "action-btn delete-btn";
  deleteButton.textContent = "Delete";
  deleteButton.addEventListener("click", () => deleteGame(row)); // Add event listener for Delete
  actionsCell.appendChild(deleteButton);

  row.appendChild(actionsCell);

  return row;
}

// Function to populate the table
function populateTable(tableId, games) {
  const tableBody = document.querySelector(`${tableId} tbody`);
  tableBody.innerHTML = ""; // Clear existing rows

  games.forEach((game) => {
      const row = createTableRow(game);
      tableBody.appendChild(row);
  });
}

async function createScheduleTable() {
  try {
      const schedulesRef = ref(db, "schedules");

      // Fetch data from the database
      const snapshot = await get(schedulesRef);
      const now = new Date();

      // Extract schedule data with their IDs
      const schedules = snapshot.exists()
          ? Object.entries(snapshot.val()).map(([id, data]) => ({
              id, // Add the unique ID
              ...data // Spread the schedule data
          }))
          : [];

      // Sort schedules by date and time in descending order (latest first)
      schedules.sort((a, b) => {
          // Convert date and time strings into valid Date objects
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

      // Populate the `allSchedule` array
      allSchedule.push(...schedules);

      // Populate the table
      populateTable("#schedule-table", schedules);
  } catch (error) {
      console.error("Error fetching schedules:", error);
  }
}



// Populate the table on page load
window.addEventListener("DOMContentLoaded", () => {
  // populateTable("#schedule-table", games);
  createScheduleTable()
});

function deleteGame(row) {
  const scheduleId = row.getAttribute("data-id"); // Get the unique ID
  const gameName = row.cells[0].textContent; // Get the game name from the first cell

  const confirmation = confirm(`Are you sure you want to delete game: ${gameName}?`);
  if (confirmation) {
      // Call your Firebase delete function
      deleteSchedule(scheduleId);
      console.log(deleteSchedule)

      // Remove the row from the table
      row.remove();
  }
}
async function deleteSchedule(scheduleId) {
  try {
      const scheduleRef = ref(db, `schedules/${scheduleId}`);
      await remove(scheduleRef);
      console.log(`Schedule with ID ${scheduleId} deleted successfully.`);
  } catch (error) {
      console.error("Error deleting schedule:", error);
  }
}

async function setScheduleToDatabase(event) {
  event.preventDefault(); // Prevent form submission behavior

  // Retrieve form inputs
  const gameName = document.getElementById("input_game_name").value.trim();
  const teamsDropdown = document.getElementById("teams_dropdown");
  const selectedTeams =  teamsDropdown.value; // Value of selected teams
  const venuesDropdown = document.getElementById("venues");
  const selectedVenue = formatDropdownValue(venuesDropdown.value); // Value of selected venue
  const eventsDropdown = document.getElementById("events");
  const selectedEvent = formatDropdownValue(eventsDropdown.value); // Value of selected sport/event
  const dateInput = document.querySelector(".date-time input[type='date']").value;
  const timeInput = formatTimeWithAMPM(document.querySelector(".date-time input[type='time']").value);

  // Validate inputs
  if (!gameName) {
      alert("Please enter a game name.");
      return;
  }
  if (selectedTeams === "select-team") {
      alert("Please select teams.");
      return;
  }
  if (!dateInput || !timeInput) {
      alert("Please select both date and time.");
      return;
  }

  // Create schedule object
  const schedule = {
      name: gameName,
      teams: selectedTeams,
      venue: selectedVenue,
      sport: selectedEvent,
      date: dateInput,
      time: timeInput,
  };

  try {
    // Push schedule to the database
    const schedulesRef = ref(db, "schedules");
    const newScheduleRef = await push(schedulesRef, schedule);

    // Get the unique key generated by Firebase
    const uniqueId = newScheduleRef.key;
    console.log(uniqueId);

    // Add the unique ID to the schedule object
    schedule.id = uniqueId;

    // Push the updated schedule object to allSchedule
    allSchedule.push(schedule);

    // Sort schedules
    const now = new Date();
    allSchedule.sort((a, b) => {
        const dateTimeA = parseDateTime(a.date, a.time);
        const dateTimeB = parseDateTime(b.date, b.time);

        if (!dateTimeA || !dateTimeB) {
            console.error("Invalid date/time detected:", a, b);
            return 0;
        }

        const isAFuture = dateTimeA >= now;
        const isBFuture = dateTimeB >= now;

        if (isAFuture && isBFuture) {
            return dateTimeA - dateTimeB;
        } else if (!isAFuture && !isBFuture) {
            return dateTimeB - dateTimeA;
        } else {
            return isAFuture ? -1 : 1;
        }
    });

    populateTable("#schedule-table", allSchedule);

    // Clear the form after submission
    clearFormInputs();
    alert("Schedule successfully added!");
} catch (error) {
    console.error("Error setting schedule to database:", error);
    alert("Failed to add schedule. Please try again.");
}
}

function parseDateTime(date, time) {
  try {
      // Convert 12-hour time (with AM/PM) into 24-hour format
      const [timePart, modifier] = time.split(" ");
      let [hours, minutes] = timePart.split(":").map(Number);

      if (modifier === "PM" && hours < 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;

      // Combine date and converted time into a single Date object
      const parsedDateTime = new Date(`${date}T${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`);
      return isNaN(parsedDateTime.getTime()) ? null : parsedDateTime;
  } catch (error) {
      console.error("Error parsing date/time:", date, time, error);
      return null; // Return null if parsing fails
  }
}
// Function to clear form inputs
function clearFormInputs() {
  document.getElementById("input_game_name").value = "";
  document.getElementById("teams_dropdown").value = "select-team";
  document.getElementById("venues").value = "computer-lab";
  document.getElementById("events").value = "arnis";
  document.querySelector(".date-time input[type='date']").value = "";
  document.querySelector(".date-time input[type='time']").value = "";
}

function formatDropdownValue(value) {
  return value
      .split('-') // Split the value by dashes
      .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
      .join(' '); // Join the words with a space
}

let editingScheduleId = null; // Global variable to track the schedule being edited

function editGame(row) {
    // Get the schedule ID from the row
    const scheduleId = row.getAttribute("data-id");
    const cells = row.cells;

    // Prefill the form with data from the selected schedule
    document.getElementById("input_game_name").value = cells[0].textContent; // Game Name
    document.getElementById("teams_dropdown").value = cells[1].textContent; // Teams
    document.getElementById("venues").value = formatDropdownValue(cells[2].textContent); // Venue
    document.getElementById("events").value = formatDropdownValue(cells[3].textContent); // Sport
    document.querySelector(".date-time input[type='date']").value = cells[4].textContent; // Date
    document.querySelector(".date-time input[type='time']").value = formatTimeForInput(cells[5].textContent); // Time

    // Change button text to "Update Schedule"
    const scheduleButton = document.getElementById("set-schedule-btn");
    scheduleButton.textContent = "Update Schedule";

    // Store the ID of the schedule being edited
    editingScheduleId = scheduleId;

    // Update event listener for updating the schedule
    scheduleButton.removeEventListener("click", setScheduleToDatabase);
    scheduleButton.addEventListener("click", updateScheduleToDatabase);
}

async function updateScheduleToDatabase(event) {
    event.preventDefault(); // Prevent form submission

    if (!editingScheduleId) {
        alert("No schedule selected for editing.");
        return;
    }

    // Retrieve updated form inputs
    const gameName = document.getElementById("input_game_name").value.trim();
    const teamsDropdown = document.getElementById("teams_dropdown");
    const selectedTeams = teamsDropdown.value;
    const venuesDropdown = document.getElementById("venues");
    const selectedVenue = formatDropdownValue(venuesDropdown.value);
    const eventsDropdown = document.getElementById("events");
    const selectedEvent = formatDropdownValue(eventsDropdown.value);
    const dateInput = document.querySelector(".date-time input[type='date']").value;
    const timeInput = formatTimeWithAMPM(document.querySelector(".date-time input[type='time']").value);

    // Validate inputs
    if (!gameName) {
        alert("Please enter a game name.");
        return;
    }
    if (selectedTeams === "select-team") {
        alert("Please select teams.");
        return;
    }
    if (!dateInput || !timeInput) {
        alert("Please select both date and time.");
        return;
    }

    // Create the updated schedule object
    const updatedSchedule = {
        name: gameName,
        teams: selectedTeams,
        venue: selectedVenue,
        sport: selectedEvent,
        date: dateInput,
        time: timeInput,
    };

    try {
        // Update the schedule in Firebase
        const scheduleRef = ref(db, `schedules/${editingScheduleId}`);
        await push(scheduleRef, updatedSchedule);

        // Update the schedule in the local array
        const index = allSchedule.findIndex(schedule => schedule.id === editingScheduleId);
        if (index !== -1) {
            allSchedule[index] = { id: editingScheduleId, ...updatedSchedule };
        }

        // Refresh the table with updated data
        populateTable("#schedule-table", allSchedule);

        // Reset form and button state
        clearFormInputs();
        document.getElementById("set-schedule-btn").textContent = "Set Schedule";
        document.getElementById("set-schedule-btn").removeEventListener("click", updateScheduleToDatabase);
        document.getElementById("set-schedule-btn").addEventListener("click", setScheduleToDatabase);

        editingScheduleId = null; // Reset editing state
        alert("Schedule updated successfully!");
    } catch (error) {
        console.error("Error updating schedule:", error);
        alert("Failed to update schedule. Please try again.");
    }
}

function formatTimeForInput(time) {
    // Convert time from "12:30 PM" format to "12:30" (for input[type='time'])
    const [timePart, modifier] = time.split(" ");
    let [hours, minutes] = timePart.split(":").map(Number);
    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function formatTimeWithAMPM(time) {
  // Split the time string into hours and minutes
  const [hour, minute] = time.split(':').map(Number);

  // Determine AM or PM
  const period = hour >= 12 ? 'PM' : 'AM';

  // Convert to 12-hour format
  const formattedHour = hour % 12 || 12; // If hour is 0 or 12, display 12

  return `${formattedHour}:${minute.toString().padStart(2, '0')} ${period}`;
}

// Attach event listener to the form button
document.getElementById("set-schedule-btn").addEventListener("click", setScheduleToDatabase);

document.getElementById("getAllSchedule").addEventListener("click", () => console.log(allSchedule))