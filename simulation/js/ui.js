export function createProgressBar() {
  const progressBar = document.createElement('div');
  progressBar.style.position = 'absolute';
  progressBar.style.top = '10px';
  progressBar.style.left = '10px';
  progressBar.style.width = '300px';
  progressBar.style.height = '20px';
  progressBar.style.border = '2px solid #000';
  progressBar.style.backgroundColor = '#ddd';
  document.body.appendChild(progressBar);

  const progressFill = document.createElement('div');
  progressFill.style.height = '100%';
  progressFill.style.width = '0%';
  progressFill.style.backgroundColor = '#4caf50';
  progressBar.appendChild(progressFill);

  return progressFill;
}
