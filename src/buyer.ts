import { Analzyer } from "./analyzer";

export class Buyer
{
     toFixedNumber = (toFixTo = 2, base = 10) => num => {
        const pow = Math.pow(base, toFixTo)
        return +(Math.round(num * pow) / pow)
      }

    constructor(public market: string, public Rate: number, public analyzer: Analzyer)
    {
        this.analyzer.currentPosition.status = true;
        this.analyzer.currentPosition.marketName = market;

        var percentMultiplicator = Number(process.env.BUY_PERCENT) / Math.pow(10, 2)
        const buyPrice = this.toFixedNumber(8)(Rate + (Rate * percentMultiplicator))
        const volume =  this.toFixedNumber(8)(analyzer.balance / buyPrice);

        console.log(`Going to buy ${market} at price ${buyPrice.toFixed(8)} (last price was ${Rate.toFixed(8)} with volume ${volume} (${new Date().toISOString()})`)

             
        var buyRequest = new Date();

        this.analyzer.bt.buylimit({ market : market, quantity : volume, rate :  buyPrice },  (data, err) => {
           if (err) {
               console.log(err)
               return;
           }
           var res = (new Date()).valueOf() - (buyRequest).valueOf()

           if (data.result.uuid) {
                console.log(`Order made successfully on market ${this.market} (${res} MS)`);
                this.analyzer.currentPosition.buyPriceRate = Rate;
                setTimeout(() => {
                    this.analyzer.bt.cancel({ uuid: data.result.uuid}, (data, err) => { if (err == null) { console.log(`ORDER NOT FILLED, CANCELLED !`)} })
                }, 1000);
           } else {
               console.log(`Error on buy request`);
               console.log(data);
           }
          });
    }
}