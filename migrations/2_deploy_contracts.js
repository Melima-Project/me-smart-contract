var SafeMath = artifacts.require('../framework/zeppelin-solidity/contracts/math/SafeMath.sol');
var METoken = artifacts.require('./METoken.sol');
var ICO = artifacts.require('./ICO.sol');


module.exports = function(deployer) {

    var ubq = web3.eth;
	var owner = ubq.accounts[0];
	var wallet = ubq.accounts[1];
	console.log("Owner address: " + owner);
	console.log("Wallet address: " + wallet);	

	deployer.deploy(SafeMath, { from: owner });
	deployer.link(SafeMath, METoken);
	return deployer.deploy(METoken, { from: owner }).then(function() {
		console.log("ME Token address: " + METoken.address);
		return deployer.deploy(ICO, METoken.address, wallet, { from: owner }).then(function() {
			console.log("ICO address: " + ICO.address);
			return METoken.deployed().then(function(coin) {
				return coin.owner.call().then(function(owner) {
					console.log("METoken owner : " + owner);
					return coin.transferOwnership(ICO.address, {from: owner}).then(function(txn) {
						console.log("METoken owner was changed: " + ICO.address);
					});
				})
			});
		});
	});
};