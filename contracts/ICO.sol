pragma solidity ^0.4.11;


import '../framework/zeppelin-solidity/contracts/lifecycle/Pausable.sol';
import '../framework/zeppelin-solidity/contracts/payment/PullPayment.sol';
import './METoken.sol';


contract ICO is Pausable, PullPayment {

    using SafeMath for uint;

    struct Investor {
    uint tokenReceived;
    uint tokenSent;
    }

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

    // Variables
    METoken public token;
    /* Multisig contract that will receive the UBQ */
    address public multisigWallet;
    /* Number of UBQ received */
    uint public ubqReceived;
    /* Number of ME Tokens sent to investors */
    uint public tokenSentToUBQ;
    /* ICO start time */
    uint public startTime;
    /* ICO end time */
    uint public endTime;
    /* Is ICO still running */
    bool public icoClosed;

    // Mappings
    /* Investors indexed by their UBQ address */
    mapping (address => Investor) public investors;

    // Modifiers
    modifier minTargetNotReached() {
        if ((now < endTime) || tokenSentToUBQ >= MIN_TARGET) throw;
        _;
    }

    modifier respectTimeFrame() {
        if ((now < startTime) || (now > endTime)) throw;
        _;
    }

    // Events
    event LogReceivedUBQ(address addr, uint value);

    event LogTokensEmitted(address indexed from, uint amount);

    // Constructor
    function ICO(address _METokenAddress, address _to) {
        token = METoken(_METokenAddress);
        multisigWallet = _to;
    }

    // The fallback function corresponds to a donation in UBQ
    function() whenNotPaused respectTimeFrame payable {
        receiveUbq(msg.sender);
    }

    // ICO start
    function start() onlyOwner {
        if (startTime != 0) throw;

        startTime = now;
        endTime = now + ICO_ENDS_IN;
    }

    //	Receive UBQ
    function receiveUbq(address beneficiary) internal {
        if (msg.value < MIN_INVEST_UBQ) throw;
        // Don't accept funding under a predefined value

        uint ubqToSend = bonus(msg.value.mul(ME_PER_UBQ).div(1 ether));
        // Calculate ME Tokens amount per 1 UBQ
        if (ubqToSend.add(tokenSentToUBQ) > MAX_TARGET) throw;

        Investor investor = investors[beneficiary];
        token.transfer(beneficiary, ubqToSend);
        // Transfer ME Tokens right now

        investor.tokenSent = investor.tokenSent.add(ubqToSend);
        investor.tokenReceived = investor.tokenReceived.add(msg.value);
        // Update amount collected during the ICO by the investor

        ubqReceived = ubqReceived.add(msg.value);
        // Update the total amount collected during the ICO
        tokenSentToUBQ = tokenSentToUBQ.add(ubqToSend);

        // Send events
        LogTokensEmitted(msg.sender, ubqToSend);
        LogReceivedUBQ(beneficiary, ubqReceived);
    }

    function bonus(uint amount) internal constant returns (uint) {
        if (amount <= ONE_STAKE && (now < startTime.add(5 days))) return amount + FIVE_DAY_BONUS + NOVICE_INVEST_BONUS;
        else if (amount > ONE_STAKE && (now < startTime.add(5 days))) return amount + FIVE_DAY_BONUS;
        else if (amount <= ONE_STAKE && (now > startTime.add(5 days))) return amount + NOVICE_INVEST_BONUS;
        return amount;
    }

    // Finish the ICO, should be called after the refund period
    function finalize() onlyOwner public {

        if (now < endTime) {
            if (tokenSentToUBQ == MAX_TARGET) {
            }
            else {
                throw;
            }
        }

        if (tokenSentToUBQ < MIN_TARGET && now < endTime + 15 days) throw;
        // If MIN_TARGET is not reached investors have 15 days to get refund before we can finalise
        if (!multisigWallet.send(this.balance)) throw;
        // Move the remaining UBQ to the multisig wallet
        uint remains = token.balanceOf(this);
        if (remains > 0) {
            if (!token.burn(remains)) throw;
        }
        icoClosed = true;
    }

    // Failsafe drain
    function drain() onlyOwner {
        if (!owner.send(this.balance)) throw;
    }

    // Allow to change the team multisig address in the case of emergency.
    function setMultisig(address addr) onlyOwner public {
        if (addr == address(0)) throw;
        multisigWallet = addr;
    }

    function backMETokenOwner() onlyOwner public {
        token.transferOwnership(owner);
    }

    // Transfer remains to owner in case is impossible to do min invest
    function getRemainTokens() onlyOwner public {
        var remains = MAX_TARGET - tokenSentToUBQ;
        uint minTokensToSell = bonus(MIN_INVEST_UBQ.mul(ME_PER_UBQ) / (1 ether));

        if (remains > minTokensToSell) throw;

        Investor investor = investors[owner];
        token.transfer(owner, remains);
        // Transfer ME Tokens right now

        investor.tokenSent = investor.tokenSent.add(remains);

        tokenSentToUBQ = tokenSentToUBQ.add(remains);

        // Send events
        LogTokensEmitted(this, remains);
        LogReceivedUBQ(owner, ubqReceived);
    }


    /*
       * When MIN_TARGET is not reach:
       * 1) Investor call the "approve" function of the ME Token contract with the amount of all ME Tokens they got in order to be refund
       * 2) Investor call the "refund" function of the ICO with the same amount of ME Tokens
       * 3) Investor call the "withdrawPayments" function of the ICO contract to get a refund in UBQ
    */

    function refund(uint _value) minTargetNotReached public {

        if (_value != investors[msg.sender].tokenSent) throw;
        // compare value from investor balance

        token.transferFrom(msg.sender, address(this), _value);
        // get the token back to the ICO contract

        if (!token.burn(_value)) throw;
        // token sent for refund are burnt

        uint UBQToSend = investors[msg.sender].tokenReceived;
        investors[msg.sender].tokenReceived = 0;

        if (UBQToSend > 0) {
            asyncSend(msg.sender, UBQToSend);
            // pull payment to get refund in UBQ
        }
    }
}
