import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore, collection, addDoc, getDoc, doc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDSRU9baE603YW6znjqW9YRSkOtlHPg3Hs",
  authDomain: "sahil-wedding-website.firebaseapp.com",
  projectId: "sahil-wedding-website", 
  storageBucket: "sahil-wedding-website.firebasestorage.app",
  messagingSenderId: "456629506216",
  appId: "1:456629506216:web:1e37b4fe3ff68dab18729d",
  measurementId: "G-24PLJ23TCZ"
};

// Initialize Firebase and Firestore with error handling
let app;
let db;
let devMode = false; // Set to false for production

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase:", error);
  devMode = true; // Fall back to devMode if Firebase initialization fails
  console.log("Fallback to development mode");
}

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
  },
};

// Store the validated invitation for later use
let validatedInvitation = null;

// Function to validate invitation code against database - now only checks last name
async function validateInvitation(lastName, code) {
  if (devMode) {
    // Local development mode - check against dummy database
    // For dev mode, convert to uppercase for case-insensitive comparison
    const uppercaseCode = code.toUpperCase();
    if (invitationDatabase.hasOwnProperty(uppercaseCode)) {
      const invitation = invitationDatabase[uppercaseCode];
      if (invitation.lastName.toLowerCase() === lastName.toLowerCase()) {
        return { valid: true, invitation };
      } else {
        return { valid: false, error: "Last name does not match our records for this invitation code." };
      }
    } else {
      return { valid: false, error: "Invalid invitation code. Please try again." };
    }
  } else {
    // Production mode - check against Firebase
    try {
      console.log("Checking invitation code:", code);
      // Do not convert code to uppercase for Firebase - maintain exact case
      const invitationRef = doc(db, "invitations", code);
      const invitationDoc = await getDoc(invitationRef);
      
      if (invitationDoc.exists()) {
        const invitation = invitationDoc.data();
        console.log("Found invitation:", invitation);
        
        // Convert maxGuests to number if it's a string
        invitation.maxGuests = parseInt(invitation.maxGuests, 10);
        
        if (invitation.lastName.toLowerCase() === lastName.toLowerCase()) {
          return { valid: true, invitation };
        } else {
          console.log("Last name mismatch:", {
            expected: { lastName: invitation.lastName },
            received: { lastName }
          });
          return { valid: false, error: "Last name does not match our records for this invitation code." };
        }
      } else {
        console.log("No invitation found for code:", code);
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
  
  const lastName = document.getElementById("rsvp-last-name").value.trim();
  const code = document.getElementById("invitation-code").value.trim();
  const errorDiv = document.getElementById("validation-error");
  
  // Show loading indication
  const submitButton = this.querySelector("button[type=submit]");
  const originalButtonText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = "Validating...";
  
  // Validate the invitation
  const result = await validateInvitation(lastName, code);
  
  // Reset button
  submitButton.disabled = false;
  submitButton.textContent = originalButtonText;
  
  if (result.valid) {
    // Store the validated invitation for later use
    validatedInvitation = result.invitation;
    
    // Hide validation form and show attendance selection form
    document.getElementById("rsvp-validation-form").style.display = "none";
    document.getElementById("rsvp-attendance-form").style.display = "block";
    errorDiv.style.display = "none";
  } else {
    // Show error message
    errorDiv.textContent = result.error;
    errorDiv.style.display = "block";
  }
});

// Handle the attendance selection form
document.getElementById("rsvp-attendance-form").addEventListener("submit", function(e) {
  e.preventDefault();
  
  const attendingYes = document.getElementById("attending-yes").checked;
  const attendingNo = document.getElementById("attending-no").checked;
  
  // Hide the attendance form
  document.getElementById("rsvp-attendance-form").style.display = "none";
  
  if (attendingYes) {
    // Show the details form if attending
    // Set maximum allowed guests
    const guestInput = document.getElementById("rsvp-guests");
    guestInput.setAttribute("max", validatedInvitation.maxGuests);
    
    // Show RSVP details form
    document.getElementById("rsvp-details-form").style.display = "block";
  } else if (attendingNo) {
    // Submit the decline RSVP and show thank you message
    const declineData = {
      lastName: validatedInvitation.lastName,
      firstName: validatedInvitation.firstName,
      invitationCode: document.getElementById("invitation-code").value.trim(),
      attending: false,
      timestamp: new Date().toISOString()
    };
    
    // Submit the decline to Firebase
    submitRSVP(declineData);
    
    // Show the decline thank you message
    document.getElementById("rsvp-decline").style.display = "block";
    
    // Reset the forms after a delay to allow the user to see the message
    setTimeout(() => {
      document.getElementById("rsvp-decline").style.display = "none";
      document.getElementById("rsvp-validation-form").reset();
      document.getElementById("rsvp-validation-form").style.display = "block";
    }, 5000);
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
    guestError.textContent = `You can only bring up to ${maxGuests} guests (including yourself, excluding children under 10).`;
    guestError.style.display = "block";
    return;
  } else {
    guestError.style.display = "none";
  }
  
  // Prepare RSVP data for submission
  const rsvpData = {
    fullName: document.getElementById("rsvp-full-name").value,
    email: document.getElementById("rsvp-email").value,
    lastName: validatedInvitation.lastName,
    firstName: validatedInvitation.firstName,
    invitedEvents: ["The Wedding"], // Always set to Wedding only
    guestCount: guestCount,
    invitationCode: document.getElementById("invitation-code").value.trim(),
    attending: true,
    arrivalDate: document.getElementById("arrival-date").value,
    departureDate: document.getElementById("departure-date").value,
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
