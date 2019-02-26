import { Market } from "./market";
import { UDPServer } from "./udpServer";
import { WebServer } from './webServer'

export class Analzyer
{
    public marketsDictionnary: Market[] = [];
    public marketsIndex: string[] = [];
    public balance: number;

    public currentPosition = {
        marketName: undefined,
        status: false,
        sold: false,
        buyPriceRate: undefined,
        firstBuyIndex: 0,
        sellPriceRate: 0
    };
    
    public udpServer: UDPServer
    public webServer: WebServer

    constructor(public bt: any, public marketSide: string)
    {
    
    }

    async startAnalyze() : Promise<any> 
    { 
        return new Promise<any>(async (res, reject) => {
            this.balance = await this.getBalance(this.marketSide) * 0.10;

            console.log(`Loaded a balance of ${this.balance.toFixed(8)} ${process.env.MARKET}..`)
       
            await this.getMarkets();
            var udpServer = new UDPServer(this, Number(process.env.UDP_LISTEN_PORT));
            udpServer.listenMessage();
            this.webServer = new WebServer(this, Number(process.env.WEB_PORT));

            await this.subscribeToMarkets();
            res()
        })
       
    }
    static PercentageCalculator(oldNumber: number, newNumber: number): number
    {
        var decreaseValue = oldNumber - newNumber
        return (decreaseValue / oldNumber) * 100
    }

    getBalance(coin: string): Promise<any> {
        return new Promise<any>((res, rej) => {
            this.bt.getbalance({ currency : coin }, (data, err) => {
                try {
                    if (err) { throw err }
                    res(data.result.Available);
                } catch (e) { console.log(e) }
              });
        });
    }

    getMarkets(): Promise<any> {
        return new Promise<any>((res, reject) => {
            this.bt.getmarketsummaries((data: any, err) => {
                if (err) {
                  return console.error(err);
                }
    
                for (var market of data.result) {
                    if (market.MarketName.indexOf(this.marketSide) != -1) {
                        this.marketsDictionnary[market.MarketName] = new Market(market.MarketName, this);
                        this.marketsIndex.push(market.MarketName);
                    }
                }
                console.log(`Subscribing to ${this.marketsIndex.length} markets..`)
                res();
              });
        });
    }


    subscribeToMarkets()
    {
       this.bt.websockets.subscribe(this.marketsIndex, (data) => {
            if (data.M === 'updateExchangeState') {
              data.A.forEach((data_for) => {
                  var market = this.marketsDictionnary[data_for.MarketName];
                  var newBuyOrders: any[] = [];
                  var newSellOrders: any[] = [];
                if (data_for.Fills.length > 0) {

                    for (var f of data_for.Fills){
                        if (f.OrderType === 'BUY') {
                            newBuyOrders.push(f);
                        } else if (f.OrderType === 'SELL') {
                            newSellOrders.push(f);
                        }
                    }

                    if (market != null) {
                        if (newSellOrders.length > 0) {
                            market.addSellHistory(newSellOrders);
                        }
                        if (newBuyOrders.length > 0) {
                             market.addOrderHistoryAndCheckPrice(newBuyOrders)
                        }
                    }
                }
              });
            }
          });
    }
}