import { setInterval, setTimeout } from 'timers';
import { Analzyer } from './analyzer';

const socket = require('socket.io');
const http = require('http');
const fs = require('fs');

export class SocketServer
{
    public io: any;
    public firstPriceIndex: number;

    constructor(public analyzer: Analzyer)
    {
        this.io = null;
        this.firstPriceIndex = 0;

        this.startListener(process.env.SOCKET_PORT);
    }

    startListener(port)
    {
        var server = http.createServer((req, res) => {  });

        this.io = socket.listen(server);
        server.listen(port);

        this.loopActions();
        this.io.sockets.on('connection',  (socket) => {
            //this.io.sockets.send({action:"first_price", coin:this.analyzer.currentPosition.marketName, price:0.4584});
            socket.on("message", async (content) => {
                if (content.action == "sell") {
                    const currentPosition = this.analyzer.currentPosition;
                    if (currentPosition.status) {
                        var coin = currentPosition.marketName.split('-')[1]
                        var balance = await this.analyzer.getBalance(coin)
                        var rate = currentPosition.buyPriceRate * 0.50

                        this.analyzer.bt.selllimit({ market : currentPosition.marketName, quantity: balance, rate : rate },  (data, err) => {
                            if (err) {
                                console.log(err)
                                return;
                            }
                            if (data.result.uuid) {
                                console.log(`Sell order successfully done with volume ${balance} ${coin} at price ${rate}`)
                                this.analyzer.currentPosition.sellPriceRate = rate
                                this.analyzer.currentPosition.sold = true;

                                setTimeout(() => {
                                    this.analyzer.bt.cancel({ uuid: data.result.uuid}, (data, err) => { if (err == null) { console.log(`SELL ORDER NOT FILLED GO CHECK IT OUT !`)} })
                                }, 2000);
                            } else {
                                console.log(`Error ocurred on sell order.. check this ASAP !`)
                            }
                        });
                    }
                }
            });
        });
    }

    loopActions()
    {
        setInterval(() => {
            const currentPosition = this.analyzer.currentPosition;
            if (currentPosition.status) {
                if (currentPosition.sold) {
                    this.io.sockets.send({action:"sold", coin:currentPosition.marketName, price:currentPosition.sellPriceRate});
                }

                if (currentPosition.buyPriceRate !== undefined) {
                    if (currentPosition.firstBuyIndex <= 5) {
                        this.io.sockets.send({action:"first_price", coin:currentPosition.marketName, price:currentPosition.buyPriceRate});
                        currentPosition.firstBuyIndex++;
                    }
                }

                var lastSell = this.analyzer.marketsDictionnary[currentPosition.marketName].getLastSellOrderFromHistory()
                var lastBuy = this.analyzer.marketsDictionnary[currentPosition.marketName].getLastOrderFromHistory()
                if (lastSell !== undefined) {
                    this.io.sockets.send({action:"selling", coin: currentPosition.marketName, price: lastSell.Rate})
                } 
                else if (lastBuy !== undefined) {
                    this.io.sockets.send({action:"selling", coin: currentPosition.marketName, price: lastBuy.Rate})
                }
                else
                {
                    this.analyzer.bt.getmarketsummary({market: currentPosition.marketName}, (data, err) => {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        var lastPrice = data.result[0].Last
                        this.io.sockets.send({action:"selling", coin: currentPosition.marketName, price: lastPrice})
                    })
                }
            }
        }, 150);
    }
}
