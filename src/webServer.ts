import { Buyer } from "./buyer";
import { Analzyer } from "./analyzer";
import { SocketServer } from "./socketServer";

const fs = require('fs');
export class WebServer
{
    public socketServer: SocketServer
    constructor(handler: Analzyer, listenPort: number)
    {
        var express = require('express');
        var app = express();
        
        this.socketServer = new SocketServer(handler);

        app.get('/',  (req, res) => {
            this.loadHandSeller(res);
        })
        app.listen(listenPort);

        console.log("Web server started on 0.0.0.0:" + listenPort);

        this.socketServer = new SocketServer(handler);
    }

    loadHandSeller(res)
    {
        var file = fs.readFileSync("hand_seller.html", 'utf8');
        res.send(file);
    }
}