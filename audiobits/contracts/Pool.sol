// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title Community Pool
/// @notice Anyone can deposit `paymentToken` into a shared pool. Only the
///         designated payout authority (the backend's admin wallet) may
///         disburse the current balance to a set of winner addresses —
///         "rounds" are purely an off-chain (backend) bookkeeping concept.
contract Pool is ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable paymentToken;
    address public immutable payoutAuthority;

    event Deposited(address indexed depositor, uint256 amount, uint256 newBalance);
    event PaidOut(address[] winners, uint256[] amounts, uint256 totalPaid);

    error ZeroAmount();
    error NotPayoutAuthority();
    error ArrayLengthMismatch();
    error NoWinners();
    error InsufficientBalance();

    constructor(address tokenAddress, address payoutAuthority_) {
        paymentToken = IERC20(tokenAddress);
        payoutAuthority = payoutAuthority_;
    }

    /// @notice Deposit any amount into the pool. Caller must have approved
    ///         this contract for at least `amount` beforehand.
    function deposit(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        paymentToken.safeTransferFrom(msg.sender, address(this), amount);
        emit Deposited(msg.sender, amount, paymentToken.balanceOf(address(this)));
    }

    /// @notice Pay a set of winners a (typically equal) amount each. Only
    ///         callable by the payout authority. Reverts if the requested
    ///         total exceeds the pool's current balance.
    function payout(address[] calldata winners, uint256[] calldata amounts) external nonReentrant {
        if (msg.sender != payoutAuthority) revert NotPayoutAuthority();
        uint256 len = winners.length;
        if (len == 0) revert NoWinners();
        if (len != amounts.length) revert ArrayLengthMismatch();

        uint256 total = 0;
        for (uint256 i = 0; i < len; i++) {
            total += amounts[i];
        }
        if (total > paymentToken.balanceOf(address(this))) revert InsufficientBalance();

        for (uint256 i = 0; i < len; i++) {
            if (amounts[i] > 0) paymentToken.safeTransfer(winners[i], amounts[i]);
        }
        emit PaidOut(winners, amounts, total);
    }
}
