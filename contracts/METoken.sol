pragma solidity ^0.4.11;


import '../framework/zeppelin-solidity/contracts/token/StandardToken.sol';
import '../framework/zeppelin-solidity/contracts/ownership/Ownable.sol';


contract METoken is StandardToken, Ownable {

    // Token Parameters
    string public constant name = "Melima";
    string public constant symbol = "ME";
    uint8 public constant decimals = 18;

    function MeToken() {
        totalSupply = 51000000 * 10 ** 18;
        balances[msg.sender] = totalSupply;
    }

    function burn(uint _value) onlyOwner returns (bool) {
        balances[msg.sender] = balances[msg.sender].sub(_value);
        totalSupply = totalSupply.sub(_value);
        Transfer(msg.sender, 0x0, _value);
        return true;
    }
}
    
    
