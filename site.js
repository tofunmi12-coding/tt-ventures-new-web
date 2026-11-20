/* Shared site enhancements compatible with the strict Content Security Policy. */
(() => {
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
