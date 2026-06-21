// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IAudioBitsRegistry {
    struct Artist {
        string name;
        address wallet;
    }

    struct Song {
        string title;
        uint256 artistId;
        bytes32 fileHash;
    }

    function getSong(uint256 songId) external view returns (Song memory);
    function getArtist(uint256 artistId) external view returns (Artist memory);
}

/// @title Royalty Payout
/// @notice Lets anyone pay royalties (in a fixed ERC-20 token) for a song registered
///         in AudioBitsRegistry. Funds are split among payees according to per-song
///         basis-point shares set by the song's artist, and accumulate as a pull-based
///         balance that each payee withdraws themselves.
contract RoyaltyPayout {
    using SafeERC20 for IERC20;

    uint256 public constant TOTAL_SHARES_BPS = 10_000;
    uint256 public constant MAX_PAYEES = 20;

    IAudioBitsRegistry public immutable registry;
    IERC20 public immutable paymentToken;

    struct Split {
        address[] payees;
        uint256[] sharesBps;
    }

    mapping(uint256 => Split) private songSplits;
    mapping(address => uint256) public pendingBalance;

    event SplitSet(uint256 indexed songId, address[] payees, uint256[] sharesBps);
    event RoyaltyPaid(uint256 indexed songId, address indexed payer, uint256 amount);
    event Withdrawn(address indexed payee, uint256 amount);

    error SongNotFound();
    error NotSongArtist();
    error InvalidSplit();
    error ZeroAmount();
    error NothingToWithdraw();

    constructor(address registryAddress, address tokenAddress) {
        registry = IAudioBitsRegistry(registryAddress);
        paymentToken = IERC20(tokenAddress);
    }

    /// @notice Set (or replace) the royalty split for a song. Only the song's
    ///         registered artist may call this. Shares are in basis points and
    ///         must sum to exactly 10,000 (100%).
    function setSplit(uint256 songId, address[] calldata payees, uint256[] calldata sharesBps) external {
        if (_isSongArtist(songId, msg.sender) == false) revert NotSongArtist();

        uint256 len = payees.length;
        if (len == 0 || len > MAX_PAYEES || len != sharesBps.length) revert InvalidSplit();

        uint256 total = 0;
        for (uint256 i = 0; i < len; i++) {
            if (payees[i] == address(0) || sharesBps[i] == 0) revert InvalidSplit();
            total += sharesBps[i];
        }
        if (total != TOTAL_SHARES_BPS) revert InvalidSplit();

        songSplits[songId] = Split({payees: payees, sharesBps: sharesBps});
        emit SplitSet(songId, payees, sharesBps);
    }

    /// @notice Pay royalties for a song. Caller must have approved this contract
    ///         to spend at least `amount` of the payment token. Funds are credited
    ///         to payees' pending balances according to the song's split — or, if
    ///         no split was ever set, 100% to the song's registered artist.
    function payRoyalty(uint256 songId, uint256 amount) external {
        if (amount == 0) revert ZeroAmount();

        IAudioBitsRegistry.Song memory song = registry.getSong(songId);

        paymentToken.safeTransferFrom(msg.sender, address(this), amount);

        Split storage split = songSplits[songId];
        uint256 len = split.payees.length;

        if (len == 0) {
            address artistWallet = registry.getArtist(song.artistId).wallet;
            pendingBalance[artistWallet] += amount;
        } else {
            uint256 distributed = 0;
            for (uint256 i = 0; i < len; i++) {
                uint256 share = i == len - 1
                    ? amount - distributed // last payee absorbs rounding remainder
                    : (amount * split.sharesBps[i]) / TOTAL_SHARES_BPS;
                distributed += share;
                pendingBalance[split.payees[i]] += share;
            }
        }

        emit RoyaltyPaid(songId, msg.sender, amount);
    }

    /// @notice Withdraw the caller's full accumulated royalty balance.
    function withdraw() external {
        uint256 amount = pendingBalance[msg.sender];
        if (amount == 0) revert NothingToWithdraw();

        pendingBalance[msg.sender] = 0;
        paymentToken.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    /// @notice Read the configured split for a song (empty arrays if unset/default).
    function getSplit(uint256 songId) external view returns (address[] memory payees, uint256[] memory sharesBps) {
        Split storage split = songSplits[songId];
        return (split.payees, split.sharesBps);
    }

    function _isSongArtist(uint256 songId, address account) private view returns (bool) {
        IAudioBitsRegistry.Song memory song = registry.getSong(songId);
        return registry.getArtist(song.artistId).wallet == account;
    }
}
