# Altcoin Atomic Trading Platform
Altcoin Exchange Inc. trading platform

## Refer to our wiki
https://github.com/AltCoinExchange/altcoin-atomic-trading-platform/wiki




Djenad Razic edited this page on 17 Oct 2018 · 3 revisions
Presumably that the hardware and software requirements are met, the installation steps are the following:

Installation
First, we need to install order matching engine with faucet cloning the following repository: git clone git@github.com:AltCoinExchange/order-matching-engine.git and start it:

start mongodb:
start the ethereum feeder service: node services/index.js
start the order matching engine: node index.js
And then start the UI

git clone git@github.com:AltCoinExchange/altcoin-atomic-trading-platform.git
cd altcoin-atomic-trading-platform/altcoinio
npm install (wait for a significant amount of time since the wallet package needs to be compiled)
start bitcoin node: bitcoind -server
start ethereum node: geth --rinkeby --ws --wsorigins="*" --syncmode=full --wsaddr=0.0.0.0 --wsport=8549 --rpc --rpcport=8548
add privkey.pem and fullchain.pem to the services folder
node services/mosca-server.js
npm run start
