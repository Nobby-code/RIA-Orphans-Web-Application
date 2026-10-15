(() => {
  function setupImagePreview(inputId, imageId, wrapperId) {
    const input = document.getElementById(inputId);
    const image = document.getElementById(imageId);
    const wrapper = document.getElementById(wrapperId);

    if (!input || !image || !wrapper) return;

    let currentObjectUrl = null;

    input.addEventListener("change", () => {
      const file = input.files?.[0];

      if (!file) return;

      if (!file.type.startsWith("image/")) {
        input.value = "";
        alert("Please select an image file.");
        return;
      }

      if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl);
      }

      currentObjectUrl = URL.createObjectURL(file);
      image.src = currentObjectUrl;
      wrapper.classList.remove("d-none");
    });
  }

  setupImagePreview(
    "programImage",
    "programImagePreview",
    "programImagePreviewWrapper"
  );

  setupImagePreview(
    "editProgramImage",
    "editProgramImagePreview",
    "editProgramImagePreviewWrapper"
  );
})();