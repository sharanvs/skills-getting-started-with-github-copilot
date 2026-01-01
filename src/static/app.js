document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // escape HTML to avoid XSS when inserting participant names
  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset the activity select to avoid duplicate options on refresh
      activitySelect.innerHTML = `<option value="">-- Select an activity --</option>`;

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // build participants section (list with remove buttons) or show friendly info if empty
        const participantsHTML =
          Array.isArray(details.participants) && details.participants.length > 0
            ? `<h5>Participants</h5>
               <ul class="participants">
                 ${details.participants
                   .map(
                     (p) =>
                       `<li class="participant-item">${escapeHtml(p)}<button class="delete-btn" data-activity="${escapeHtml(
                         name
                       )}" data-email="${escapeHtml(p)}" aria-label="Remove ${escapeHtml(p)}">✕</button></li>`
                   )
                   .join("")}
               </ul>`
            : `<p class="info">No participants yet</p>`;

        activityCard.innerHTML = `
          <h4>${escapeHtml(name)}</h4>
          <p>${escapeHtml(details.description)}</p>
          <p><strong>Schedule:</strong> ${escapeHtml(details.schedule)}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

        // Attach delete handlers for any remove buttons inside this activity card
        activityCard.querySelectorAll(".delete-btn").forEach((btn) => {
          btn.addEventListener("click", async (e) => {
            const email = btn.getAttribute("data-email");
            const act = btn.getAttribute("data-activity");
            if (!confirm(`Unregister ${email} from ${act}?`)) return;
            try {
              const res = await fetch(
                `/activities/${encodeURIComponent(act)}/participants?email=${encodeURIComponent(email)}`,
                { method: "DELETE" }
              );
              const result = await res.json();
              if (res.ok) {
                messageDiv.textContent = result.message;
                messageDiv.className = "success";
                messageDiv.classList.remove("hidden");
                setTimeout(() => messageDiv.classList.add("hidden"), 3000);
                // Refresh the activities list to reflect removal
                fetchActivities();
              } else {
                messageDiv.textContent = result.detail || "Failed to unregister";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
              }
            } catch (err) {
              console.error("Error unregistering:", err);
              messageDiv.textContent = "Failed to unregister. Please try again.";
              messageDiv.className = "error";
              messageDiv.classList.remove("hidden");
            }
          });
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities immediately so UI reflects the new participant
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
