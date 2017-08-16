<p align="center"><a href="https://melima.hda.me/"><img src="https://avatars2.githubusercontent.com/u/29970755?v=4&s=140"></p></a><p align="center"><strong>Open-source ordering system</strong><br><br> <a href="https://melima.hda.me/">Homepage</a> | <a href="https://twitter.com/Melima_Project">Twitter</a> | <a href="https://www.reddit.com/r/melima/">Reddit</a> | <a href="https://melima.slack.com/">Slack</a> | <a href="https://steemit.com/@melima">Steemit</a></p>

# me-smart-contract
##### Melima Project Smart Contract - available for public access and audit right here

## Contract (ICO) details
Contract use [zeppelin-solidity](https://github.com/OpenZeppelin/zeppelin-solidity)  
Framework included just as submodule under [framework directory](https://github.com/Melima-Project/me-smart-contract/tree/master/framework)  
Contract also provides [tests](https://github.com/Melima-Project/me-smart-contract/tree/master/test), [migrations](https://github.com/Melima-Project/me-smart-contract/tree/master/migrations) and `./testrpc-accounts.sh` file for [testrpc](https://github.com/ethereumjs/testrpc)  

### METoken.sol
[METoken.sol](https://github.com/Melima-Project/me-smart-contract/blob/master/contracts/METoken.sol) use 2 imports from zeppelin-solidity framework
- `import '../framework/zeppelin-solidity/contracts/token/StandardToken.sol';`
- `import '../framework/zeppelin-solidity/contracts/ownership/Ownable.sol';`

ME (Melima) Token use 18 decimals, just like UBQ or ETH

```javascript
 uint8 public constant decimals = 18;
```

Totally 51,100,000 tokens will be created on the start. 1,000,000 ME will be reserved for developers and future git pull requests rewards.  
Another 100,000 ME will be send to developer account, and will be distributed after successful ICO in affiliate program between participants from bitcointalk and other sources (like Ubiq slack channel).  
Remaining 50,000,000 ME will be send to the ICO contract. At the end remaining tokens will be burned.

```javascript
    /* Maximum number of ME Tokens to sell */    
    uint public constant MAX_TARGET = 50000000 * 10 ** 18; // 50,000,000 ME    
    /* Reserved for developers, commit reward program and etc */    
    uint public constant DEV_RESERVED = 1000000 * 10 ** 18; // 1,000,000 ME    
    /* Affiliate and social distribution program */    
    uint public constant AFFILIATE_PROGRAM = 100000 * 10 ** 18; // 100,000 ME 
```
### ICO.sol
[ICO.sol](https://github.com/Melima-Project/me-smart-contract/blob/master/contracts/ICO.sol) use 2 imports from zeppelin-solidity
- `import '../framework/zeppelin-solidity/contracts/lifecycle/Pausable.sol';`
- `import '../framework/zeppelin-solidity/contracts/payment/PullPayment.sol';`

And [METoken.sol](https://github.com/Melima-Project/me-smart-contract/blob/master/contracts/METoken.sol)

Contract have minimum and maximum target. Minimum target for successful contract is 20,000,000 ME and maximum target is 50,000,000.
Contract gives 100 ME per UBQ. Minimum amount to invest is 0.1 UBQ, all lesser amounts are rejected.  
Participants have 20 ME bonus in first five days, and "quick" bonus is the same regardless invested sum.  
Contract also includes 30 ME bonus for any amount less or equal one stack. One stack is 10,000 ME (or 100 UBQ, as per ICO conversion rate).  
Main idea here is that poor investor gets more tokens. But only investors who invested for one stack or more could apply for future rewards.
ICO runs for 30 days, and in case minimum target is not reached, ICO fails and all investments should be refunded.

```javascript
    // ICO Parameters    
    /* Minimum number of ME Tokens to sell */   
    uint public constant MIN_TARGET = 20000000 * 10 ** 18; // 20,000,000 ME    
    /* Maximum number of ME Tokens to sell */    
    uint public constant MAX_TARGET = 50000000 * 10 ** 18; // 50,000,000 ME 
    /* Number of ME Tokens per Ether */    
    uint public constant ME_PER_UBQ = 100 * 10 ** 18; // 100 ME    
    /* ICO full run period */    
    uint public constant ICO_ENDS_IN = 30 days;   
    /* Minimum amount to invest */   
    uint public constant MIN_INVEST_UBQ = 100 finney; // 0.1 UBQ   
    /* First 5 days bonus + 20 ME */   
    uint public constant FIVE_DAY_BONUS = 20 * 10 ** 18; // 20 ME    
    /* Bonus for <= 10 UBQ investments + 30 ME */   
    uint public constant NOVICE_INVEST_BONUS = 30 * 10 ** 18; // 30 ME  
    uint public constant ONE_STAKE = 10000000000000000000000; // 10,000 ME
```
### Tests
- [FastFlow.js](https://github.com/Melima-Project/me-smart-contract/blob/master/test/FastFlow.js) - Fast ICO flow test
- [MainFlow.js](https://github.com/Melima-Project/me-smart-contract/blob/master/test/MainFlow.js) - Normal ICO flow test
- [RefundFlow.js](https://github.com/Melima-Project/me-smart-contract/blob/master/test/RefundFlow.js) - Refund test

## Information for contract readers/testers and auditors
Please, provide suggestions as issues and fixes as pull requests. If you have complex audit file (like *.txt, *.md or *.pdf with audit) you better pull request file in separate audit folder.

### Running things

```bash
# Preinstall
npm install -g ethereumjs-testrpc
npm install -g truffle@beta
npm install zeppelin-solidity

# Go for it
git clone https://github.com/Melima-Project/me-smart-contract/
cd me-smart-contract/
git submodule init
git submodule update
truffle compile

# In separate VT tab, running testrpc
cd /me-smart-contract
./testrpc-accounts.sh

# Continue
truffle migrate 
truffle test ./test/FastFlow.js
truffle test ./test/MainFlow.js
truffle test ./test/RefundFlow.js

# Retest
./testrpc-accounts.sh
truffle migrate --reset
truffle test ...
```


