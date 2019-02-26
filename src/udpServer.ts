import { Analzyer } from "./analyzer";
import { Market } from "./market";
import { Buyer } from "./buyer";

const udp = require('dgram');

export class UDPServer
{
    public server: any
    constructor(public analyzer: Analzyer, public listenPort: number)
    {
        let host = "0.0.0.0";

        this.server = udp.createSocket('udp4');
    
        this.server.on('error', (error) => {
            console.log(`Error (UDP Socket server): ${error}`);
            this.server.close();
        });

        this.server.on('listening', () => {
            console.log(`UDP socket server listening on ${host}:${listenPort}`);
          });
        this.server.bind(listenPort);

    }

    listenMessage()
    {
        this.server.on('message', (msg) => {
            if (msg != null && msg.toString().length > 0)
            {
                let coin = msg.toString().toUpperCase().trim();
                const market = `${process.env.MARKET}-${coin}`

                if (this.analyzer.currentPosition.status) {
                    console.log(`Can't buy ${market} (Already in position on ${this.analyzer.currentPosition.marketName}) ${new Date().toISOString()}`)
                    return;
                }
                const marketObject: Market | undefined = this.analyzer.marketsDictionnary[market]
                if (marketObject !== undefined) {
                    console.log(`Received a buy call for market ${market} (${new Date().toISOString()})...`)
                    var lastOrder = marketObject.getLastOrderFromHistory();
                    if (lastOrder !== undefined) {
                        new Buyer(market, lastOrder.Rate, this.analyzer);
                    } else
                    {
                        this.analyzer.bt.getmarketsummary({market: market.toLowerCase()}, (data, err) => {
                            if (err) { console.log(err); return; }
                            new Buyer(market, data.result[0].Last, this.analyzer);
                        })
                    }
                } else {
                    console.log(`Invalid buy call for market ${market}`)
                }
            }
        });
    }
};
