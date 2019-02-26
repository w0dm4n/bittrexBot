import { Analzyer } from "./analyzer";
import { Buyer } from "./buyer";

export class Market
{
    public orderHistory : any[] = [];
    public sellHistory : any[] = [];

    constructor(public marketName: string, public analyzer: Analzyer)
    {

    }

    public addSellHistory(orders: any[])
    {
        var max_depth = Number(process.env.MAX_ORDERS_DEPTH)

        orders.forEach(x => this.sellHistory.push(x));
        
        if (this.sellHistory.length > max_depth) {
            this.sellHistory.splice(0, (max_depth - 1));
        }
    }

    
    public addOrderHistoryAndCheckPrice(orders: any[])
    {
        var max_depth = Number(process.env.MAX_ORDERS_DEPTH)

        orders.forEach(x => this.orderHistory.push(x));

        if (this.orderHistory.length >= 2) {
            this.checkPercentPrice();
        }
        if (this.orderHistory.length > max_depth) {
            this.orderHistory.splice(0, (max_depth - 1));
        }
    }

    getLastSellOrderFromHistory() : any | undefined
    {
        return (this.sellHistory.length > 0) ?
        this.sellHistory[this.sellHistory.length - 1] : undefined;
    }

    getLastOrderFromHistory() : any | undefined
    {
        return (this.orderHistory.length > 0) ?
            this.orderHistory[this.orderHistory.length - 1] : undefined;
    }

    checkPercentPrice()
    {
        var target = Number(process.env.PERCENT_TARGET)

        var percent: number = 0.00
        var last: number = 0.0
        var lastOrder = this.getLastOrderFromHistory();

        for (var order of this.orderHistory)
        {
            if (last != 0.00) {
                percent += Analzyer.PercentageCalculator(order.Rate, last)
            }
            last = order.Rate;
        }
        if (percent >= target) {
            console.log(`MARKET ${this.marketName} percent ${percent}, going to buy it...`)
            if (!this.analyzer.currentPosition.status) {
                new Buyer(this.marketName, lastOrder.Rate, this.analyzer);
            } else {
                console.log(`Can't buy ${this.marketName} (Already in position !) ${new Date().toISOString()}`)
            }
        }
    }
}