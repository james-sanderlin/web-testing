let printCount = 0;

function handlePrint() {
  printCount++;
  document.getElementById('counter-value').textContent = printCount;
  window.print();
}
