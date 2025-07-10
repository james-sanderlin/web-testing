// Download page logic placeholder
// Add any Download-specific JS here

// Download page logic
window.downloadBlob = function() {
  const now = Math.floor(Date.now() / 1000);
  const blob = new Blob([
    `Hello from Material Design!\nCurrent time (seconds): ${now}`
  ], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "material-download.txt";
  a.click();
  URL.revokeObjectURL(url);
};
