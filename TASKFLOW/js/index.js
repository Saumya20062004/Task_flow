document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("verifyForm");
  const fullNameInput = document.getElementById("fullName");
  const dobInput = document.getElementById("dob");
  const errorText = document.getElementById("error");

  // Auto redirect if already verified
  const existingUser = localStorage.getItem("taskflowUser");
  if (existingUser) {
    window.location.href = "app.html";
    return;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const fullName = fullNameInput.value.trim();
    const dob = new Date(dobInput.value);
    const age = calculateAge(dob);

    if (!fullName || !dobInput.value) {
      errorText.textContent = "Please fill out all fields.";
      return;
    }

    if (age < 11) {
      errorText.textContent = "You must be older than 10 to continue.";
      return;
    }

    // Save to localStorage
    const userData = {
      name: fullName,
      dob: dobInput.value,
    };
    localStorage.setItem("taskflowUser", JSON.stringify(userData));

    // Redirect to app.html
    window.location.href = "app.html";
  });

  function calculateAge(dob) {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  }
});
