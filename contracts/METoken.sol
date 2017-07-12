pragma solidity ^0.4.11;


import '../framework/zeppelin-solidity/contracts/token/StandardToken.sol';
import '../framework/zeppelin-solidity/contracts/ownership/Ownable.sol';


contract METoken is StandardToken, Ownable {

    // Token Parameters
    string public constant name = "Melima";
    string public constant symbol = "ME";
    uint8 public constant decimals = 18;

    /* Maximum number of ME Tokens to sell */
    uint public constant MAX_TARGET = 50000000 * 10 ** 18; // 50,000,000 ME
    /* Reserved for developers, commit reward program and etc */
    uint public constant DEV_RESERVED = 1000000 * 10 ** 18; // 1,000,000 ME
    /* Affiliate and social distribution program */
    uint public constant AFFILIATE_PROGRAM = 100000 * 10 ** 18; // 100,000 ME

    function METoken() {
        totalSupply = MAX_TARGET + DEV_RESERVED + AFFILIATE_PROGRAM; // 51,100,000 ME
        balances[msg.sender] = totalSupply;
    }

    function burn(uint _value) onlyOwner returns (bool) {
        balances[msg.sender] = balances[msg.sender].sub(_value);
        totalSupply = totalSupply.sub(_value);
        Transfer(msg.sender, 0x0, _value);
        return true;
    }
}
    
    
