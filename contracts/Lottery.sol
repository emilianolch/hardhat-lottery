// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";

error Lottery__NotOwner();
error Lottery__NotClosed();
error Lottery__NotEnoughETH();
error Lottery__TransferFiled();
error Lottery__NotOpen();
error Lottery__UpkeepNotNeeded(
    uint currentBalance,
    uint numPlayers,
    uint8 lotteryState
);

contract Lottery is VRFConsumerBaseV2, AutomationCompatibleInterface {
    // Type declarations
    enum LotteryState {
        OPEN,
        CALCULATING,
        CLOSED
    }

    // State variables
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;
    address private immutable i_owner;
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;
    uint private s_entranceFee;
    uint private s_interval; // Interval in seconds between raffles.
    uint8 private s_prizeRate; // Percentage of total funds sent to the winner.
    address payable[] private s_players;
    LotteryState private s_lotteryState;
    bool private s_willClose; // Close the lottery immediately after picking a winner.
    uint private s_lastTimestamp;
    address private s_recentWinner;

    // Events
    event LotteryEnter(address indexed player);
    event WinnerPick(address winner);

    modifier onlyOwner() {
        if (msg.sender != i_owner) revert Lottery__NotOwner();
        _;
    }

    modifier onlyClosed() {
        if (s_lotteryState != LotteryState.CLOSED) revert Lottery__NotClosed();
        _;
    }

    constructor(
        address vrfCoordinator,
        uint entranceFee,
        bytes32 gasLane,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        uint interval,
        uint8 prizeRate
    ) VRFConsumerBaseV2(vrfCoordinator) {
        i_owner = msg.sender;
        s_entranceFee = entranceFee;
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinator);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        s_interval = interval;
        s_prizeRate = prizeRate;
        s_lotteryState = LotteryState.OPEN;
        s_willClose = false;
        s_lastTimestamp = block.timestamp;
    }

    function enterLottery() public payable {
        if (msg.value < s_entranceFee) {
            revert Lottery__NotEnoughETH();
        }
        if (s_lotteryState != LotteryState.OPEN) {
            revert Lottery__NotOpen();
        }
        s_players.push(payable(msg.sender));
        emit LotteryEnter(msg.sender);
    }

    function checkUpkeep(
        bytes memory /* checkData */
    )
        public
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        bool isOpen = (s_lotteryState == LotteryState.OPEN);
        bool timePassed = block.timestamp - s_lastTimestamp > s_interval;
        bool hasPlayers = s_players.length > 0;
        bool hasBalance = address(this).balance > 0;
        upkeepNeeded = isOpen && timePassed && hasPlayers && hasBalance;
        performData = "";
    }

    function performUpkeep(
        bytes calldata /* performData */
    ) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        if (!upkeepNeeded) {
            revert Lottery__UpkeepNotNeeded(
                address(this).balance,
                s_players.length,
                uint8(s_lotteryState)
            );
        }
        s_lotteryState = LotteryState.CALCULATING;
        i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
    }

    function fulfillRandomWords(
        uint, /* requestId */
        uint[] memory randomWords
    ) internal override {
        uint i = randomWords[0] % s_players.length;
        address payable recentWinner = s_players[i];
        s_recentWinner = recentWinner;
        s_players = new address payable[](0);
        if (s_willClose) {
            s_lotteryState = LotteryState.CLOSED;
            s_willClose = false;
        } else {
            s_lotteryState = LotteryState.OPEN;
        }
        s_lastTimestamp = block.timestamp;
        uint prize = (address(this).balance * s_prizeRate) / 100;
        (bool success, ) = recentWinner.call{value: prize}("");
        if (!success) {
            revert Lottery__TransferFiled();
        }
        emit WinnerPick(recentWinner);
    }

    function open() public onlyOwner {
        s_lotteryState = LotteryState.OPEN;
    }

    function willClose() public onlyOwner {
        if (s_players.length == 0) {
            s_lotteryState = LotteryState.CLOSED;
        } else {
            s_willClose = true;
        }
    }

    function setEntranceFee(uint entranceFee) public onlyOwner onlyClosed {
        s_entranceFee = entranceFee;
    }

    function setInterval(uint interval) public onlyOwner onlyClosed {
        s_interval = interval;
    }

    function setPrizeRate(uint8 prizeRate) public onlyOwner onlyClosed {
        s_prizeRate = prizeRate;
    }

    function getEntranceFee() public view returns (uint) {
        return s_entranceFee;
    }

    function getPlayer(uint i) public view returns (address) {
        return s_players[i];
    }

    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }

    function getNumberOfPlayers() public view returns (uint) {
        return s_players.length;
    }

    function getLatestTimestamp() public view returns (uint) {
        return s_lastTimestamp;
    }

    function getRequestConfirmations() public pure returns (uint16) {
        return REQUEST_CONFIRMATIONS;
    }

    function getLotteryState() public view returns (LotteryState) {
        return s_lotteryState;
    }

    function getWillClose() public view returns (bool) {
        return s_willClose;
    }

    function getInterval() public view returns (uint) {
        return s_interval;
    }

    function getPrizeRate() public view returns (uint8) {
        return s_prizeRate;
    }
}
