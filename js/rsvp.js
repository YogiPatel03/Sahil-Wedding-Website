import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDoc, doc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Get the Firebase app instance that was initialized in index.html
const firebaseConfig = {
  apiKey: "AIzaSyDSRU9baE603YW6znjqW9YRSkOtlHPg3Hs",
  authDomain: "sahil-wedding-website.firebaseapp.com",
  projectId: "sahil-wedding-website", 
  storageBucket: "sahil-wedding-website.firebasestorage.app",
  messagingSenderId: "456629506216",
  appId: "1:456629506216:web:1e37b4fe3ff68dab18729d",
  measurementId: "G-24PLJ23TCZ"
};

// Initialize Firebase if not already initialized
let app;
try {
  app = firebase.app();
} catch (e) {
  app = initializeApp(firebaseConfig);
}

// Initialize Firestore
const db = getFirestore(app);

// For local development and testing
const devMode = true; // Set to false when deploying to production

// Dummy invitation database for local testing
const invitationDatabase = {
  "WELCOME2025": {
    firstName: "John",
    lastName: "Smith",
    allowedEvents: ["Sahil's Grah Shanti Pithi", "Bhumi's Grah Shanti Pithi", "The Wedding"],
    maxGuests: 5
  },
  "WEDONLY": {
    firstName: "Alice",
    lastName: "Johnson",
    allowedEvents: ["The Wedding"],
    maxGuests: 2
  },
  "DOUBLEFUN": {
    firstName: "Bob",
    lastName: "Brown",
    allowedEvents: ["The Wedding", "Bhumi's Grah Shanti Pithi"],
    maxGuests: 3
  },
  "ALLACCESS": {
    firstName: "Sahil",
    lastName: "Smith",
    allowedEvents: ["Sahil's Grah Shanti Pithi", "Bhumi's Grah Shanti Pithi", "The Wedding"],
    maxGuests: 8
  }
};

/*
  Helper function to build the allowed events checkboxes.
  Call this function after validating the invitation (in your invitation validation code)
  with the invitation object that includes an "allowedEvents" array.
  
  Example:
    const invitation = {
      firstName: "John",
      lastName: "Smith",
      allowedEvents: ["Sahil's Grah Shanti Pithi", "Bhomis Grah Shanti Pithi", "The Wedding"],
      maxGuests: 5
    };
    populateEventCheckboxes(invitation);
*/
function populateEventCheckboxes(invitation) {
  const eventsDiv = document.getElementById("rsvp-events");
  eventsDiv.innerHTML = ""; // Clear any previous content
  invitation.allowedEvents.forEach(eventName => {
    const checkboxContainer = document.createElement("div");
    checkboxContainer.className = "form-check";
    checkboxContainer.innerHTML = `
      <input class="form-check-input" type="checkbox" value="${eventName}" id="event-${eventName.replace(/\s+/g, '')}" checked>
      <label class="form-check-label" for="event-${eventName.replace(/\s+/g, '')}">
        ${eventName}
      </label>
    `;
    eventsDiv.appendChild(checkboxContainer);
  });
}

// Function to validate invitation code against database
async function validateInvitation(firstName, lastName, code) {
  if (devMode) {
    // Local development mode - check against dummy database
    if (invitationDatabase.hasOwnProperty(code)) {
      const invitation = invitationDatabase[code];
      if (invitation.firstName.toLowerCase() === firstName.toLowerCase() &&
          invitation.lastName.toLowerCase() === lastName.toLowerCase()) {
        return { valid: true, invitation };
      } else {
        return { valid: false, error: "Name does not match our records for this invitation code." };
      }
    } else {
      return { valid: false, error: "Invalid invitation code. Please try again." };
    }
  } else {
    // Production mode - check against Firebase
    try {
      const invitationRef = doc(db, "invitations", code);
      const invitationDoc = await getDoc(invitationRef);
      
      if (invitationDoc.exists()) {
        const invitation = invitationDoc.data();
        if (invitation.firstName.toLowerCase() === firstName.toLowerCase() &&
            invitation.lastName.toLowerCase() === lastName.toLowerCase()) {
          return { valid: true, invitation };
        } else {
          return { valid: false, error: "Name does not match our records for this invitation code." };
        }
      } else {
        return { valid: false, error: "Invalid invitation code. Please try again." };
      }
    } catch (error) {
      console.error("Error validating invitation:", error);
      return { valid: false, error: "An error occurred while validating your invitation. Please try again later." };
    }
  }
}

// Function to submit RSVP data to database
async function submitRSVP(rsvpData) {
  if (devMode) {
    // Local development mode - just log the data
    console.log("RSVP Data Submitted:", rsvpData);
    return { success: true };
  } else {
    // Production mode - submit to Firebase
    try {
      await addDoc(collection(db, "rsvps"), rsvpData);
      return { success: true };
    } catch (error) {
      console.error("Error submitting RSVP:", error);
      return { 
        success: false, 
        error: "An error occurred while submitting your RSVP. Please try again later." 
      };
    }
  }
}

// Handle the invitation validation form submission
document.getElementById("rsvp-validation-form").addEventListener("submit", async function(e) {
  e.preventDefault();
  
  const firstName = document.getElementById("rsvp-first-name").value.trim();
  const lastName = document.getElementById("rsvp-last-name").value.trim();
  const code = document.getElementById("invitation-code").value.trim().toUpperCase();
  const errorDiv = document.getElementById("validation-error");
  
  // Show loading indication
  const submitButton = this.querySelector("button[type=submit]");
  const originalButtonText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = "Validating...";
  
  // Validate the invitation
  const result = await validateInvitation(firstName, lastName, code);
  
  // Reset button
  submitButton.disabled = false;
  submitButton.textContent = originalButtonText;
  
  if (result.valid) {
    // Populate RSVP Details form
    document.getElementById("rsvp-full-name").value = `${result.invitation.firstName} ${result.invitation.lastName}`;
    
    // Set maximum allowed guests
    const guestInput = document.getElementById("rsvp-guests");
    guestInput.setAttribute("max", result.invitation.maxGuests);
    
    // Build allowed events checkboxes
    populateEventCheckboxes(result.invitation);
    
    // Hide validation form and show RSVP details form
    document.getElementById("rsvp-validation-form").style.display = "none";
    document.getElementById("rsvp-details-form").style.display = "block";
    errorDiv.style.display = "none";
  } else {
    // Show error message
    errorDiv.textContent = result.error;
    errorDiv.style.display = "block";
  }
});

// Handle the RSVP details form submission
document.getElementById("rsvp-details-form").addEventListener("submit", async function(e) {
  e.preventDefault();
  
  const guestCount = parseInt(document.getElementById("rsvp-guests").value, 10);
  const maxGuests = parseInt(document.getElementById("rsvp-guests").getAttribute("max"), 10);
  const guestError = document.getElementById("guest-error");
  
  // Validate guest count
  if (guestCount > maxGuests) {
    guestError.textContent = `You can only bring up to ${maxGuests - 1} additional guest(s) (including yourself, the maximum allowed is ${maxGuests}).`;
    guestError.style.display = "block";
    return;
  } else {
    guestError.style.display = "none";
  }
  
  // Prepare RSVP data for submission
  const rsvpData = {
    fullName: document.getElementById("rsvp-full-name").value,
    email: document.getElementById("rsvp-email").value,
    invitedEvents: Array.from(document.querySelectorAll("#rsvp-events input[type=checkbox]"))
                    .filter(cb => cb.checked)
                    .map(cb => cb.value),
    guestCount: guestCount,
    invitationCode: document.getElementById("invitation-code").value.trim().toUpperCase(),
    notes: document.getElementById("rsvp-notes").value.trim(),
    timestamp: new Date().toISOString()
  };
  
  // Show loading indication
  const submitButton = this.querySelector("button[type=submit]");
  const originalButtonText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";
  
  // Submit the RSVP
  const result = await submitRSVP(rsvpData);
  
  // Reset button
  submitButton.disabled = false;
  submitButton.textContent = originalButtonText;
  
  if (result.success) {
    // Show success message
    document.getElementById("rsvp-details-form").style.display = "none";
    document.getElementById("rsvp-success").style.display = "block";
    
    // Reset the forms after a delay to allow the user to see the success message
    setTimeout(() => {
      document.getElementById("rsvp-validation-form").reset();
      document.getElementById("rsvp-success").style.display = "none";
      document.getElementById("rsvp-validation-form").style.display = "block";
    }, 5000);
  } else {
    // Show error message
    alert(result.error || "There was an error submitting your RSVP. Please try again.");
  }
});
