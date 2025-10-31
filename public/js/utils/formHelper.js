export function attachValidation(input, validateFn, message) {
  input.addEventListener("input", () => {
    const value = input.value.trim();

    if (value.length === 0) {
      clearError(input);
      return;
    }

    if (!validateFn(value)) {
      showError(input, message);
    } else {
      clearError(input);
    }
  });
}

export function showError(input, msg) {
  const parent = input.closest(".input-with-btn") || input;
  let errorEl = parent.parentNode.querySelector(".error");

  if (!errorEl) {
    errorEl = document.createElement("p");
    errorEl.className = "error";
    parent.insertAdjacentElement("afterend", errorEl);
  }

  errorEl.innerHTML = "*" + msg;
}
export function clearError(input) {
  const parent = input.closest(".input-with-btn") || input;
  const errorEl = parent.parentNode.querySelector(".error");
  if (errorEl) errorEl.remove();
}

// 객체로 묶어서 export
export const FormHelper = {
  attachValidation,
  showError,
  clearError,
};
