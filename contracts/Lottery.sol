// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";

error Lottery__NotEnoughETH();
error Lottery__TransferFiled();
error Lottery__NotOpen();
error Lottery__UpkeepNotNeeded(
    uint256 currentBalance,
    uint256 numPlayers,
    uint8 lotteryState
);

contract Lottery is VRFConsumerBaseV2, AutomationCompatibleInterface {
    // Type declarations
    enum LotteryState {
        OPEN,
        CALCULATING
    }

    // State variables
    uint private immutable i_entranceFee;
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;
    uint256 private immutable i_interval;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    // Lottery variables
    address payable[] private s_players;
    LotteryState private s_lotteryState;
    uint256 private s_lastTimestamp;
    address private s_recentWinner;

    // Events
    event LotteryEnter(address indexed player);
    event WinnerPick(address winner);

    constructor(
        address vrfCoordinator,
        uint entranceFee,
        bytes32 gasLane,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        uint256 interval
    ) VRFConsumerBaseV2(vrfCoordinator) {
        i_entranceFee = entranceFee;
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinator);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        s_lotteryState = LotteryState.OPEN;
        s_lastTimestamp = block.timestamp;
        i_interval = interval;
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

    function checkUpkeep(
        bytes memory /* checkData */
    )
        public
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        bool isOpen = (s_lotteryState == LotteryState.OPEN);
        bool timePassed = block.timestamp - s_lastTimestamp > i_interval;
        bool hasPlayers = s_players.length > 0;
        bool hasBalance = address(this).balance > 0;
        upkeepNeeded = isOpen && timePassed && hasPlayers && hasBalance;
        performData = "";
    }

    function enterLottery() public payable {
        if (msg.value < i_entranceFee) {
            revert Lottery__NotEnoughETH();
        }
        if (s_lotteryState != LotteryState.OPEN) {
            revert Lottery__NotOpen();
        }
        s_players.push(payable(msg.sender));
        emit LotteryEnter(msg.sender);
    }

    function fulfillRandomWords(
        uint256, /* requestId */
        uint256[] memory randomWords
    ) internal override {
        uint256 i = randomWords[0] % s_players.length;
        address payable recentWinner = s_players[i];
        s_recentWinner = recentWinner;
        s_players = new address payable[](0);
        s_lotteryState = LotteryState.OPEN;
        s_lastTimestamp = block.timestamp;
        (bool success, ) = recentWinner.call{value: address(this).balance}("");
        if (!success) {
            revert Lottery__TransferFiled();
        }
        emit WinnerPick(recentWinner);
    }

    function getEntranceFee() public view returns (uint) {
        return i_entranceFee;
    }

    function getPlayer(uint i) public view returns (address) {
        return s_players[i];
    }

    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }

    function getNumberOfPlayers() public view returns (uint256) {
        return s_players.length;
    }

    function getLatestTimestamp() public view returns (uint256) {
        return s_lastTimestamp;
    }

    function getRequestConfirmations() public pure returns (uint16) {
        return REQUEST_CONFIRMATIONS;
    }

    function getLotteryState() public view returns (LotteryState) {
        return s_lotteryState;
    }

    function getInterval() public view returns (uint256) {
        return i_interval;
    }
}
