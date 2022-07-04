import { ethers } from "ethers";
import * as dotenv from "dotenv";

import { CONTRACT_ADDRESS } from "./constants";
import { PARTIAL_ABI } from "./abi";

dotenv.config();

var init = function () {
  let url = process.env.WEBSOCKET || "";
  let privateKey = process.env.PRIVATE_KEY || "";
  var customWsProvider = new ethers.providers.WebSocketProvider(url);
  var wallet = new ethers.Wallet(privateKey);
  const parser = new ethers.utils.Interface(PARTIAL_ABI);

  wallet = wallet.connect(customWsProvider);

  var contract = new ethers.Contract(
    CONTRACT_ADDRESS.production,
    PARTIAL_ABI,
    wallet
  );

  customWsProvider.on("pending", (tx) => {
    customWsProvider.getTransaction(tx).then(async function (transaction) {
      if (
        transaction &&
        transaction.to &&
        transaction?.to?.toLowerCase() ===
          CONTRACT_ADDRESS.production.toLowerCase()
      ) {
        const decodedTx = parser.parseTransaction({ data: transaction?.data });
        console.log(decodedTx);
        if (decodedTx.name === "now") {
          console.log(transaction);
          try {
            // determine if the tx will succeed or fail
            const tx = await contract.callStatic.setGreeting("Hola, mundo!");
            console.log("tx = ", tx);
            // tx will succeed
            const t = await contract.setGreeting("Hola, mundo!");
            console.log("t = ", t);
            await t.wait();
            let greet = await contract.greet();
            console.log("greet = ", greet);
          } catch (error) {
            // tx will fail
            console.log("err = ", error);
          }
        }
      }
    });
  });

  customWsProvider._websocket.on("error", async () => {
    console.log(`Unable to connect to ${"moralis"} retrying in 3s...`);
    setTimeout(init, 3000);
  });
  customWsProvider._websocket.on("close", async (code: any) => {
    console.log(
      `Connection lost with code ${code}! Attempting reconnect in 3s...`
    );
    customWsProvider._websocket.terminate();
    setTimeout(init, 3000);
  });
};

init();
