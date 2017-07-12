var METoken = artifacts.require('./METoken.sol');
var ICO = artifacts.require('./ICO.sol');

var TOTAL_TOKENS = 51100000000000000000000000; // 51,100,000 ME
var MAX_TARGET = 50000000000000000000000000; // 50,000,000 ME
var ME_PER_UBQ = 100000000000000000000; // 100 ME
var FIVE_DAYS = 5 * 24 * 60 * 60;

contract('FastFlow', function(accounts) {

  var ubq = web3.eth;
  var owner = ubq.accounts[0];
  var wallet = ubq.accounts[1];
  var buyer = ubq.accounts[2];
  var thief = ubq.accounts[3];


  function printBalance() {
    const ownerBalance = web3.eth.getBalance(owner);
    const walletBalance = web3.eth.getBalance(wallet);
    const buyerBalance = web3.eth.getBalance(buyer);
    const icoBalance = web3.eth.getBalance(ICO.address);

    // console.log("Owner balance", web3.fromWei(ownerBalance, "ether").toString(), " UBQ");
    console.log("Wallet balance", web3.fromWei(walletBalance, "ether").toString(), " UBQ");
    // console.log("Buyer balance", web3.fromWei(buyerBalance, "ether").toString(), " UBQ");
    // console.log("ICO balance", web3.fromWei(icoBalance, "ether").toString(), " UBQ");


    return METoken.deployed().then(function(instance) {
      return instance.balanceOf.call(owner)
    .then(function(balance) {
      console.log("Owner balance: ", web3.fromWei(ownerBalance, "ether").toString(), " UBQ / ", balance.valueOf(), " ME");
      return instance.balanceOf.call(buyer); 
    }).then(function(balance) {
      console.log("Buyer balance: ", web3.fromWei(buyerBalance, "ether").toString(), " UBQ / ", balance.valueOf(), " ME");
      return instance.balanceOf.call(ICO.address);
    }).then(function(balance) {
      console.log("ICO balance: ", web3.fromWei(icoBalance, "ether").toString(), " UBQ / ", balance.valueOf(), " ME");
    })

  })


  }

  it("Put 51,100,000 METokens in the owner account", function() {
    return printBalance().then(function() {
      return METoken.deployed().then(function(instance) {
        return instance.balanceOf.call(owner);
      }).then(function(balance) {
        assert.equal(balance.valueOf(), TOTAL_TOKENS, "51,100,000 wasn't in the owner account.");
      });
    })
  });

  it("Send 50,000,000 METokens to ICO contract", function() {
    return METoken.deployed().then(function(token) {
      return token.transfer(ICO.address, MAX_TARGET, {from: owner}).then(function (txn) {
        return token.balanceOf.call(ICO.address);
      });
    }).then(function (balance) {
      console.log("ICO balance: " + balance);
      assert.equal(balance.valueOf(), MAX_TARGET, "50,000,000 wasn't in the ICO account");
    });
  });

  it("Start ICO contract", function() {
    return ICO.deployed().then(function(ico) {
      return ico.start({from: owner}).then(function() {
        console.log("ICO started.");
      });
    });
  });


  it("Buy 49,000,000 ME Tokens, without bonus", function() {
    web3.evm.increaseTime(FIVE_DAYS);

    var investSum = web3.toWei(490000, "ether");
    
    return ICO.deployed().then(function(ico) {
       return ico.sendTransaction({from: buyer, to: ico.address, value: investSum}).then(function(txn) {
          return METoken.deployed().then(function(token) {
            return token.balanceOf.call(buyer);
          });
       })
     }).then(function(balance) {
        console.log("Buyer balance: ", balance.valueOf(), " ME");

        var count = investSum * (ME_PER_UBQ) / (web3.toWei(1, "ether"));
        assert.equal(balance.valueOf(), count, "490,000 wasn't found in the first account.");
     });
  });


  it("Try to invoke getRemainTokens {from: owner}", function() {
    return ICO.deployed().then(function(ico) {
       return ico.getRemainTokens({from: owner}).then(function(txn) {
        assert(false, "Throw was supposed to throw but didn't.");
       })
     }).catch(function(error) {
        console.log("Throw was happened. Test succeeded. ");
     });
  });


  it("Buy million more ME Tokens, without bonus", function() {
    return METoken.deployed().then(function(token) {
      return token.balanceOf.call(buyer).then(function(oldBalance) {
        return ICO.deployed().then(function(ico) {
          return ico.sendTransaction({from: buyer, to: ico.address, value: web3.toWei(10000, "ether")});
        }).then(function(txn) {
          return token.balanceOf.call(buyer);
        }).then(function(newBalance) {
          var count = web3.toWei(10000, "ether") * (ME_PER_UBQ) / (web3.toWei(1, "ether"));

          var balanceMustBe = (newBalance.valueOf() - count);

          assert.equal(oldBalance.valueOf(), balanceMustBe, balanceMustBe + " is bad.");
        })        
      });
    });
  });

  it("Invoke getRemainTokens {from: owner}", function() {
    return printBalance().then(function() {

    return ICO.deployed().then(function(ico) {

       var logTokensEmittedEvent = ico.LogTokensEmitted();
        logTokensEmittedEvent.watch(function(err, result) {
          if (err) {
            console.log("Error event ", err);
            return;
          }
          console.log("LogTokensEmitted event = ",result.args.amount,result.args.from);
        }); 

        var logReceivedUBQ = ico.LogReceivedUBQ();
        logReceivedUBQ.watch(function(err, result) {
          if (err) {
            console.log("Error event ", err);
            return;
          }
          console.log("LogReceivedUBQ event = ",result.args.addr,result.args.value);
        }); 


       return ico.getRemainTokens({from: owner}).then(function(txn) {
          return METoken.deployed().then(function(token) {
            return token.balanceOf.call(ico.address);
          });
       })
     }).then(function(balance) {
        console.log("ICO balance: ", balance.valueOf(), " ME");
        assert.equal(balance.valueOf(), 0, "ICO balance must be empty.");
     });
    })
  });

  it("Finalize ICO", function() {
    return ICO.deployed().then(function(ico) {
      return ico.finalize({from: owner}).then(function() {
        console.log("Finalize");
      }).then(function() {
        printBalance();   
      });
    });
  });

  function rpc(method, arg) {
    var req = {
      jsonrpc: "2.0",
      method: method,
      id: new Date().getTime()
    };

    if (arg) req.params = arg;

    return new Promise((resolve, reject) => {
      web3.currentProvider.sendAsync(req, (err, result) => {
        if (err) return reject(err)
        if (result && result.error) {
          return reject(new Error("RPC Error: " + (result.error.message || result.error)))
        }
        resolve(result)
      });
    })
  }

  web3.evm = web3.evm || {}
  web3.evm.increaseTime = function (time) {
    return rpc('evm_increaseTime', [time]);
  }

});
