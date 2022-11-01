/** @param {NS} ns */

export async function main(ns) {
	const MIN_BUY = 0.67;        // Forecast % that triggers a buy
	const MIN_SELL = 0.59;       // Forecast % that triggers a sell
	// const MAX_ALLOCATION = 0.8;  // Maximum % of wallet to use when buying
    const RESERVE_X = 0.1;

    let funds = ns.getServerMoneyAvailable("home")
    let reserve = Math.floor(ns.getServerMoneyAvailable("home") * RESERVE_X);

    const stock_symbols = ns.stock.getSymbols()

    ns.tprint("Stonks! Funds: " + ns.nFormat(funds, "$0.0a") + " Reserve: " + ns.nFormat(reserve, "$0.0a"));
	// var index = ns.args[0]?ns.args[0]:0;

    let change = false;

	while(true) {
		//var count = 1; // Number of stocks bought & sold
		//ns.tprint("- Starting Loop #" + count + " -");

        if(change) {
            ns.tprint("Portfolio:");
            let stonks = 0;
            for(const symbol of stock_symbols) {
                const position = ns.stock.getPosition(symbol);
                if(position[0] > 0) {
                    stonks++;
                    ns.tprint(symbol + " " + position[0] + " " + ns.stock.getForecast(symbol));
                }
            }

            if (stonks == 0) {
                funds = ns.getServerMoneyAvailable("home")
                reserve = Math.floor(ns.getServerMoneyAvailable("home") * RESERVE_X);
                // ns.tprint("Stonks! Funds: " + ns.nFormat(funds, "$0.0a") + " Reserve: " + ns.nFormat(reserve, "$0.0a"));
            }

            change = false;
        }

        // check if there's anything to sell
        for(const symbol of stock_symbols) {
            const position = ns.stock.getPosition(symbol);
            if(position[0] > 0) {
                if(ns.stock.getForecast(symbol) < MIN_SELL) {
                    const invested = position[1] * position[0];
                    const gain = ns.stock.getSaleGain(symbol, position[0], "long")
                    ns.stock.sellStock(symbol, position[0]);
                    ns.tprint("Sold " + symbol + ". Profit " + ns.nFormat(gain-invested, "$0.00a"));
                    change = true;
                }
            }
        }

        let stocks = []; 
        for(const symbol of stock_symbols){
            stocks.push({
                symbol: symbol,
                forecast: ns.stock.getForecast(symbol)
            });
        }

        stocks.sort((a, b) => parseFloat(a.forecast) - parseFloat(b.forecast));
        stocks.reverse();


        // check if there's anything to buy
        if (ns.getServerMoneyAvailable("home") <= reserve) {
            //ns.tprint("Insufficient funds.");
        }
        else {
            //for(const stock of stocks) {
            //    if(ns.stock.getPosition(stock.symbol)[0] == 0) {
            //        ns.tprint("Stock with best forecast: " + stock.symbol + " @" + stock.forecast)
            //        break;
            //    }
            //}

            for(const stock of stocks) {
                if(ns.stock.getForecast(stock.symbol) > MIN_BUY) {
                    let max_volume = Math.floor((ns.getServerMoneyAvailable("home") - reserve) / ns.stock.getPrice(stock.symbol));

                    let max_shares = ns.stock.getMaxShares(stock.symbol);
                    max_shares -= ns.stock.getPosition(stock.symbol)[0];

                    if(max_volume > max_shares){
                        max_volume = max_shares;
                    }

                    if (max_volume <= 0) {
                        // ns.tprint("No shares of " + stock.symbol + " available."); 
                        continue;
                    }

                    ns.tprint("Buying " + max_volume + " shares of " + stock.symbol);
                    ns.stock.buyStock(stock.symbol, max_volume);
                    change = true;
                }
                else {
                    break;
                }
            }
        }

        await ns.sleep(4000);
    }
}