const popup = document.getElementById('popupBox');

function showPopup(msg) {
  popup.textContent = msg;
  popup.style.display = 'block';
  setTimeout(() => {
    popup.style.display = 'none';
  }, 3500);
}

document.getElementById('verifyBtn').onclick = () => {
  showPopup('🔍 Starting verification...');
  // You can replace this with your actual verifyAssets() call later
};
