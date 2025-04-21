import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore, collection, addDoc, getDoc, doc, query, where, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

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
// Store existing RSVP document if found
let existingRsvpDoc = null;

// Function to validate invitation code against database and check for existing RSVP
async function validateInvitation(lastName, code) {
  if (devMode) {
    // Local development mode - check against dummy database
    // For dev mode, convert to uppercase for case-insensitive comparison
    const uppercaseCode = code.toUpperCase();
    if (invitationDatabase.hasOwnProperty(uppercaseCode)) {
      const invitation = invitationDatabase[uppercaseCode];
      if (invitation.lastName.toLowerCase() === lastName.toLowerCase()) {
        // For dev mode, simulate existing RSVP check
        if (uppercaseCode === "ALLACCESS") {
          // Simulate existing RSVP for ALLACCESS code
          existingRsvpDoc = {
            id: "dummy-doc-id",
            fullName: "Sahil Smith",
            email: "sahil@example.com",
            guestCount: 3,
            attending: true,
            invitedEvents: ["The Wedding"],
            arrivalDate: "Saturday Morning",
            departureDate: "Sunday Evening",
            notes: "I'm allergic to nuts.",
            timestamp: new Date().toISOString(),
            invitationCode: uppercaseCode,
            firstName: invitation.firstName,
            lastName: invitation.lastName
          };
        } else {
          existingRsvpDoc = null;
        }
        return { valid: true, invitation, existingRsvp: existingRsvpDoc !== null };
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
          // Check if there's an existing RSVP for this invitation code
          const rsvpsRef = collection(db, "rsvps");
          const q = query(rsvpsRef, where("invitationCode", "==", code));
          const querySnapshot = await getDocs(q);
          
          // Reset existing RSVP document
          existingRsvpDoc = null;
          
          // If any matching RSVPs are found, use the most recent one
          if (!querySnapshot.empty) {
            let mostRecent = null;
            querySnapshot.forEach((doc) => {
              const data = doc.data();
              if (!mostRecent || new Date(data.timestamp) > new Date(mostRecent.timestamp)) {
                mostRecent = { ...data, id: doc.id };
              }
            });
            existingRsvpDoc = mostRecent;
            console.log("Found existing RSVP:", existingRsvpDoc);
          }
          
          return { 
            valid: true, 
            invitation, 
            existingRsvp: existingRsvpDoc !== null 
          };
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

// Function to submit or update RSVP data in database
async function submitRSVP(rsvpData, isUpdate = false) {
  if (devMode) {
    // Local development mode - just log the data
    console.log(`RSVP Data ${isUpdate ? 'Updated' : 'Submitted'}:`, rsvpData);
    return { success: true };
  } else {
    // Production mode - submit to Firebase
    try {
      if (isUpdate && existingRsvpDoc) {
        // Update existing document
        const rsvpRef = doc(db, "rsvps", existingRsvpDoc.id);
        await updateDoc(rsvpRef, rsvpData);
        console.log("RSVP updated successfully");
      } else {
        // Create new document
      await addDoc(collection(db, "rsvps"), rsvpData);
        console.log("RSVP submitted successfully");
      }
      return { success: true };
    } catch (error) {
      console.error("Error with RSVP:", error);
      return { 
        success: false, 
        error: `An error occurred while ${isUpdate ? 'updating' : 'submitting'} your RSVP. Please try again later.` 
      };
    }
  }
}

// Function to fill form with existing RSVP data
function populateFormWithExistingRSVP() {
  if (!existingRsvpDoc) return;
  
  // Set initial attendance radio button
  if (existingRsvpDoc.attending) {
    document.getElementById("attending-yes").checked = true;
  } else {
    document.getElementById("attending-no").checked = true;
  }
  
  // Only populate detail fields if they were attending
  if (existingRsvpDoc.attending) {
    // Populate form fields with existing data
    document.getElementById("rsvp-full-name").value = existingRsvpDoc.fullName || '';
    document.getElementById("rsvp-email").value = existingRsvpDoc.email || '';
    document.getElementById("rsvp-guests").value = existingRsvpDoc.guestCount || 1;
    document.getElementById("arrival-date").value = existingRsvpDoc.arrivalDate || '';
    document.getElementById("departure-date").value = existingRsvpDoc.departureDate || '';
    document.getElementById("rsvp-notes").value = existingRsvpDoc.notes || '';
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
  
  // Validate the invitation and check for existing RSVP
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
    
    // Update heading to indicate if this is an edit
    const formHeading = document.querySelector('#rsvp-attendance-form h4');
    if (result.existingRsvp) {
      formHeading.textContent = "Update Your Previous RSVP";
      document.getElementById("rsvp-edit-notice").style.display = "block";
    } else {
      formHeading.textContent = "Will you be attending?";
      document.getElementById("rsvp-edit-notice").style.display = "none";
    }
    
    // If there's an existing RSVP, pre-fill the form
    if (result.existingRsvp) {
      populateFormWithExistingRSVP();
    }
    
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
    
    // Update heading to indicate if this is an edit
    const formHeading = document.querySelector('#rsvp-details-form h4');
    if (existingRsvpDoc) {
      formHeading.textContent = "Update Your RSVP Details";
      document.querySelector('#rsvp-details-form button[type="submit"]').textContent = "Update RSVP";
    } else {
      formHeading.textContent = "Your RSVP Details";
    }
    
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
    
    // Submit the decline to Firebase (update if existing)
    submitRSVP(declineData, existingRsvpDoc !== null);
    
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
  submitButton.textContent = existingRsvpDoc ? "Updating..." : "Submitting...";
  
  // Submit the RSVP (update if existing)
  const result = await submitRSVP(rsvpData, existingRsvpDoc !== null);
  
  // Reset button
  submitButton.disabled = false;
  submitButton.textContent = originalButtonText;
  
  if (result.success) {
    // Show success message
    document.getElementById("rsvp-details-form").style.display = "none";
    document.getElementById("rsvp-success").style.display = "block";
    
    // Update success message text
    const successHeading = document.querySelector('#rsvp-success h4');
    if (existingRsvpDoc) {
      successHeading.textContent = "Your RSVP has been updated!";
      document.getElementById("rsvp-success-confirmation").textContent = "Your updated information has been saved.";
      // Hide accommodation info for updates since they likely already saw it
      document.querySelector('#rsvp-success p:nth-of-type(2)').style.display = "none";
    } else {
      successHeading.textContent = "Thank you for your RSVP!";
      document.getElementById("rsvp-success-confirmation").textContent = "We're so excited you'll be joining us!";
      // Show accommodation info for new submissions
      document.querySelector('#rsvp-success p:nth-of-type(2)').style.display = "block";
    }
    
    // Reset the forms after a delay to allow the user to see the success message
    setTimeout(() => {
      document.getElementById("rsvp-validation-form").reset();
      document.getElementById("rsvp-success").style.display = "none";
      document.getElementById("rsvp-validation-form").style.display = "block";
      
      // Reset the form heading
      document.querySelector('#rsvp-details-form h4').textContent = "Your RSVP Details";
      document.querySelector('#rsvp-details-form button[type="submit"]').textContent = "Submit RSVP";
      
      // Reset existing RSVP document
      existingRsvpDoc = null;
    }, 5000);
  } else {
    // Show error message
    alert(result.error || "There was an error submitting your RSVP. Please try again.");
  }
});
