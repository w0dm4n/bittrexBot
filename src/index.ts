import { Market } from "./market"
import { Analzyer } from "./analyzer";
import * as dotenv from "dotenv";

const bt = require('node-bittrex-api');

(async () => {
  dotenv.config();

  bt.options({
    'apikey' : process.env.API_PUB,
    'apisecret' : process.env.API_PRIV,
  });
  bt.websocketGlobalTickers = true;

  console.log(`Starting analyzer...`);
  var analyzer = new Analzyer(bt, process.env.MARKET);
  await analyzer.startAnalyze();
})();