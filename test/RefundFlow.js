var METoken = artifacts.require('./METoken.sol');
var ICO = artifacts.require('./ICO.sol');

var TOTAL_TOKENS = 51100000000000000000000000; // 51,100,000 ME
var MAX_TARGET = 50000000000000000000000000; // 50,000,000 ME
var ME_PER_UBQ = 100000000000000000000; // 100 ME
var ICO_ENDS_IN = 30 * 24 * 60 * 60;
var FIFTEEN_DAYS = 15 * 24 * 60 * 60;
var FIVE_DAY_BONUS = 20000000000000000000; // 20 ME
var NOVICE_INVEST_BONUS = 30000000000000000000; // 30 ME

contract('RefundFlow', function(accounts) {

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

    console.log("Owner balance", web3.fromWei(ownerBalance, "ether").toString(), " UBQ");
    console.log("Wallet balance", web3.fromWei(walletBalance, "ether").toString(), " UBQ");
    console.log("Buyer balance", web3.fromWei(buyerBalance, "ether").toString(), " UBQ");
    console.log("ICO balance", web3.fromWei(icoBalance, "ether").toString(), " UBQ");
  }

  it("Start balance", function() {
     printBalance();
  });


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

  it("Try to start ICO contract {from: not Owner}", function() {
    return ICO.deployed().then(function(ico) {
      return ico.start({from: buyer}).then(function() {
        assert(false, "Throw was supposed to throw but didn't.");
      }).catch(function(error) {
        console.log("Throw was happened. Test succeeded");
      });
    });
  });

  it("Start ICO contract", function() {
    return ICO.deployed().then(function(ico) {
      return ico.start({from: owner}).then(function() {
        console.log("ICO started.");
      });
    });
  });

  it("Try to invest < MIN_INVEST_UBQ", function() {
    return ICO.deployed().then(function(ico) {
       return ico.sendTransaction({from: buyer, to: ico.address, value: web3.toWei(99, "finney")}).then(function(txn) {
          assert(false, "Throw was supposed to throw but didn't.");
       })
     }).catch(function(error) {
        console.log("Throw was happened. Test succeeded.");
     });
  });


  it("Stop ICO (from: not Owner)", function() {
    return ICO.deployed().then(function(ico) {
      return ico.pause({from: buyer}).then(function() {
         assert(false, "Throw was supposed to throw but didn't.");
      }).catch(function(error) {
        console.log("Throw was happened. Test succeeded.");
      })
    });
  });

  it("Stop ICO (from: Owner)", function() {
    return ICO.deployed().then(function(ico) {
      return ico.pause({from: owner}).then(function() {
         console.log("ICO stopped by owner. Test succeeded.");
      }).catch(function(error) {
        assert(false, "Throw was supposed to throw but didn't.");
      })
    });
  });

  it("Buy 1,000,000 ME Tokens", function() {
    return ICO.deployed().then(function(ico) {
      return ico.sendTransaction({from: buyer, to: ico.address, value: web3.toWei(10000, "ether")}).then(function(txn) {
        assert(false, "Throw was supposed to throw but didn't.");
      }).catch(function(error) {
        console.log("Throw was happened. Test succeeded.");
      })
    });
  });

  it("Try to release ICO (from: not Owner)", function() {
    return ICO.deployed().then(function(ico) {
      return ico.unpause({from: buyer}).then(function() {
        assert(false, "Throw was supposed to throw but didn't.");
      }).catch(function(error) {
        console.log("Throw was happened. Test succeeded.");
      })
    });
  });

  it("Release ICO (from: Owner)", function() {
    return ICO.deployed().then(function(ico) {
      return ico.unpause({from: owner}).then(function() {
        console.log("ICO was released. Test succeeded.");
      }).catch(function(error) {
        assert(false, "Throw was happened, but wasn't expected.");
      })
    });
  });

  it("Buy 10,000 ME Tokens with all bonuses", function() {
    return ICO.deployed().then(function(ico) {
       return ico.sendTransaction({from: buyer, to: ico.address, value: web3.toWei(100, "ether")}).then(function(txn) {
          return METoken.deployed().then(function(token) {
            return token.balanceOf.call(buyer);
          });
       })
     }).then(function(balance) {
        console.log("Buyer balance: ", balance.valueOf(), " ME");

        var count = 100 * ME_PER_UBQ + FIVE_DAY_BONUS + NOVICE_INVEST_BONUS;
        assert.equal(balance.valueOf(), count, "100 wasn't in the first account.");
     });
  });


  it("Try to finalize ICO, when ICO_ENDS_IN isn't reached", function() {
    return ICO.deployed().then(function(ico) {
      return ico.finalize({from: owner}).then(function() {
        assert(false, "Throw was supposed to throw but didn't.");
      }).catch(function(error) {
        console.log("Throw was happened. Test succeeded.");
      });
    });
  });

  it("Try to finalize ICO {from: not Owner}}", function() {
    web3.evm.increaseTime(ICO_ENDS_IN);

    return ICO.deployed().then(function(ico) {
      return ico.finalize({from: owner}).then(function() {
        assert(false, "Throw was supposed to throw but didn't.");
      }).catch(function(error) {
        console.log("Throw was happened. Test succeeded.");
      });
    });
  });

  it("Try to finalize ICO, when MIN_TARGET isn't reached", function() {

    return ICO.deployed().then(function(ico) {
      return ico.finalize({from: owner}).then(function() {
        assert(false, "Throw was supposed to throw but didn't.");
      }).catch(function(error) {
        console.log("Throw was happened. Test succeeded.");
      });
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

  it("Approve the payments {from: buyer}", function() {
    return METoken.deployed().then(function(token) {
      return token.balanceOf.call(buyer).then(function(balance) {
        return ICO.deployed().then(function(ico) {
          console.log('Buyer ME: ' + balance.valueOf());
          return token.approve(ico.address, balance.valueOf(), {from: buyer}).then(function() {
            console.log("Approve was happened. Test succeeded.");
            return token.allowance(buyer, ico.address).then(function(approvedCount) {
              console.log("Approved: " + approvedCount);              
            })
          })
        }).catch(function(error) {
          assert(false, "Throw was happened, but wasn't expected.");
        });
      });
    });
  });

  it("Reserve the payments {from: buyer}", function() {
    return METoken.deployed().then(function(token) {
      return token.balanceOf.call(buyer).then(function(balance) {
        return ICO.deployed().then(function(ico) {
          console.log('Buyer ME: ' + balance.valueOf());
          return token.totalSupply().then(function(totalSupply) {
            console.log('TotalSupply ME: ' + totalSupply);
          }).then(function() {
            return ico.refund(balance.valueOf(), {from: buyer}).then(function() {
              console.log("Reserved. Test succeeded.");
            })
         }).then(function() {
          return token.totalSupply().then(function(totalSupply) {
            console.log('TotalSupply ME: ' + totalSupply);

          })
          
         })
        }).catch(function(error) {
          assert(false, "Throw was happened, but wasn't expected.");
        });
      });
    });
  });

  it("Finalize ICO, after the passage of 45 days", function() {
    web3.evm.increaseTime(FIFTEEN_DAYS);

    return ICO.deployed().then(function(ico) {
      return ico.finalize({from: owner}).then(function() {
        console.log("Finalize succeeded.");
      });
    });
  });  

  it("End balance", function() {
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
