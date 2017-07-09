var Migrations = artifacts.require('./local/Migrations.sol');

module.exports = function(deployer) {
  deployer.deploy(Migrations);
};
