var METoken = artifacts.require('./METoken.sol');
var ICO = artifacts.require('./ICO.sol');

var TOTAL_TOKENS = 51100000000000000000000000; // 51,100,000 ME
var MAX_TARGET = 50000000000000000000000000; // 50,000,000 ME
var ME_PER_UBQ = 100000000000000000000; // 100 ME
var FIVE_DAYS = 5 * 24 * 60 * 60;
var TWENTY_FIVE_DAYS = 25 * 24 * 60 * 60;
var SEND_UBQ =  200000;
var FIVE_DAY_BONUS = 20000000000000000000; // 20 ME
var RECEIVE_ME_AMOUNT = SEND_UBQ * ME_PER_UBQ + FIVE_DAY_BONUS;

contract('MainFlow', function(accounts) {

  var ubq = web3.eth;
  var owner = ubq.accounts[0];
  var wallet = ubq.accounts[1];
  var buyer = ubq.accounts[2];


  function printBalance() {
    const ownerBalance = web3.eth.getBalance(owner);
    const walletBalance = web3.eth.getBalance(wallet);
    const buyerBalance = web3.eth.getBalance(buyer);

    console.log("Owner balance", web3.fromWei(ownerBalance, "ether").toString(), " UBQ");
    console.log("Wallet balance", web3.fromWei(walletBalance, "ether").toString(), " UBQ");
    console.log("Buyer balance", web3.fromWei(buyerBalance, "ether").toString(), " UBQ");
  }


  it("Put 51,100,000 METokens in the owner account", function() {
    return METoken.deployed().then(function(instance) {
      return instance.balanceOf.call(owner);
    }).then(function(balance) {
      assert.equal(balance.valueOf(), TOTAL_TOKENS, "51,100,000 wasn't in the owner account.");
    });
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
        console.log("ICO started");
      });
    });
  });

  it("Buy 20,000,020 ME Tokens", function() {
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
        return ico.sendTransaction({from: buyer, to: ico.address, value: web3.toWei(SEND_UBQ, "ether")}).then(function(txn) {
          return METoken.deployed().then(function(token) {
            return token.balanceOf.call(buyer);
          });
       })
     }).then(function(balance) {
        console.log("Buyer balance: ", balance.valueOf(), " ME");
        assert.equal(balance.valueOf(), RECEIVE_ME_AMOUNT, RECEIVE_ME_AMOUNT + " wasn't in the first account");
     });
  });

  it("Try to reserve the payments {from: buyer}", function() {
    return METoken.deployed().then(function(token) {
      return token.balanceOf.call(buyer).then(function(balance) {
        return ICO.deployed().then(function(ico) {
          console.log('Buyer ME: ' + balance.valueOf());
          return token.approveAndCall(ico.address, balance.valueOf(), {from: buyer}).then(function() {
            assert(false, "Throw was supposed to throw but didn't.");
          })
        }).catch(function(error) {
          console.log("Throw was happened. Test succeeded.");
        });
      });
    });
  });

  it("Try to buy too more tokens {from: buyer}", function() {
    return ICO.deployed().then(function(ico) {
       return ico.sendTransaction({from: buyer, to: ico.address, value: web3.toWei(MAX_TARGET/ME_PER_UBQ + 1, "ether")}).then(function(txn) {
          assert(false, "Throw was supposed to throw but didn't.");
       })
     }).catch(function(error) {
        console.log("Throw was happened. Test succeeded.");
     });
  });

  it("Buy 100,000 ME Tokens without bonus", function() {
    web3.evm.increaseTime(FIVE_DAYS);
    return ICO.deployed().then(function(ico) {
       return ico.sendTransaction({from: buyer, to: ico.address, value: web3.toWei(1000, "ether")}).then(function(txn) {
          return METoken.deployed().then(function(token) {
            return token.balanceOf.call(buyer);
          });
       })
     }).then(function(balance) {
        console.log("Buyer balance: ", balance.valueOf(), " ME");
        assert.equal(balance.valueOf(), RECEIVE_ME_AMOUNT + (1000 * ME_PER_UBQ), RECEIVE_ME_AMOUNT + ME_PER_UBQ + " wasn't in the first account");
     });
  });

  it("Try to burn tokens", function() {
    return METoken.deployed().then(function(token) {
      return token.balanceOf.call(buyer).then(function(balance) {
        console.log("Buyer balance: ", balance.valueOf(), " ME");
        return token.burn(balance.valueOf()).then(function() {
          assert(false, "Throw was supposed to throw but didn't.");
        });
      });
    }).catch(function(error) {
      console.log("Throw was happened. Test succeeded.");
    });
  });

  it("Increase ICO time", function() {
    web3.evm.increaseTime(TWENTY_FIVE_DAYS);
  });


  it("Try to buy 100,000 ME Tokens {from: buyer}", function() {
    return ICO.deployed().then(function(ico) {
       return ico.sendTransaction({from: buyer, to: ico.address, value: web3.toWei(1000, "ether")}).then(function(txn) {
          assert(false, "Throw was supposed to throw but didn't.");
       })
     }).catch(function(error) {
        console.log("Throw was happened. Test succeeded.");
     });
  });

  it("Finalize ICO", function() {
    return ICO.deployed().then(function(ico) {
      return ico.finalize({from: owner}).then(function() {
        console.log("Finalize");
      });
    });
  });

  it("Try to invoke backMETokenOwner {from: buyer}", function() {
    return ICO.deployed().then(function(ico) {
      return ico.backMETokenOwner({from: buyer}).then(function() {
        assert(false, "Throw was supposed to throw but didn't.");
      }).catch(function(error) {
        console.log("Throw was happened. Test succeeded.");
      });
    });
  });

  it("Invoke backMETokenOwner {from: ICO contract}", function() {
    return ICO.deployed().then(function(ico) {
      return ico.backMETokenOwner().then(function() {
        return METoken.deployed().then(function(token) {
          return token.owner.call().then(function(tokenOwner) {
            console.log("ME Tokens owner was changed to: " + tokenOwner);
            assert.equal(tokenOwner, owner, "ME Token owner address must be equals to ICO owner address");
          })              
        })
      }).catch(function(error) {
        assert(false, "Throw was happened, but wasn't expected.");
      });
    });
  });


  it("Invoke backMETokenOwner one more time {from: ICO contract}", function() {
    return ICO.deployed().then(function(ico) {
      return ico.backMETokenOwner().then(function() {
        assert(false, "Throw was supposed to throw but didn't.");
      }).catch(function(error) {
        console.log("Throw was happened. Test succeeded.");
      });
    });
  });



  it("Get wallet balance", function() {
     printBalance();
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
