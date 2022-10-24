// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

error NotEnoughETH();

contract Lottery {
    // State variables
    uint private immutable i_entranceFee;
    address payable[] private s_players;

    // Events
    // Name events with the function name reversed
    event LotteryEnter(address indexed player);

    constructor(uint entranceFee) {
        i_entranceFee = entranceFee;
    }

    function enterLottery() public payable {
        if (msg.value < i_entranceFee) {
            revert NotEnoughETH();
        }
        s_players.push(payable(msg.sender));
        emit LotteryEnter(msg.sender);
    }

    // function pickRandomWinner() {

    // }

    function getEntranceFee() public view returns (uint) {
        return i_entranceFee;
    }

    function getPlayer(uint i) public view returns (address) {
        return s_players[i];
    }
}
