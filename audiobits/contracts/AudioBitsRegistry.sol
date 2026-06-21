// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title On-Chain Artist Registry
/// @notice Registers artists and their songs on-chain, including song metadata
///         and a file-hash uniqueness check to prevent duplicate uploads.
contract AudioBitsRegistry {
    uint256 public constant MAX_NAME_LEN = 50;
    uint256 public constant MAX_TITLE_LEN = 100;

    address public immutable contractOwner;

    struct Artist {
        string name;
        address wallet;
    }

    struct Song {
        string title;
        uint256 artistId;
        bytes32 fileHash;
    }

    uint256 public artistCounter;
    uint256 public songCounter;

    mapping(uint256 => Artist) public artists;
    mapping(address => uint256) public artistByWallet;
    mapping(uint256 => Song) public songs;
    mapping(bytes32 => uint256) public fileHashToSong;

    event ArtistRegistered(uint256 indexed artistId, address indexed wallet, string name);
    event SongRegistered(uint256 indexed songId, uint256 indexed artistId, bytes32 fileHash, string title);

    error InvalidName();
    error NameTooLong();
    error AlreadyRegistered();
    error ArtistNotFound();
    error SongNotFound();
    error NotArtist();
    error DuplicateFileHash();

    constructor() {
        contractOwner = msg.sender;
    }

    /// @notice Register the caller as a new artist.
    /// @param name Display name for the artist (1-50 characters).
    /// @return artistId The newly assigned artist ID.
    function registerArtist(string calldata name) external returns (uint256 artistId) {
        if (bytes(name).length == 0) revert InvalidName();
        if (bytes(name).length > MAX_NAME_LEN) revert NameTooLong();
        if (artistByWallet[msg.sender] != 0) revert AlreadyRegistered();

        artistId = ++artistCounter;
        artists[artistId] = Artist({name: name, wallet: msg.sender});
        artistByWallet[msg.sender] = artistId;

        emit ArtistRegistered(artistId, msg.sender, name);
    }

    /// @notice Register a new song for the calling artist.
    /// @param title Song title (1-100 characters).
    /// @param fileHash Content hash of the song file, used to prevent duplicates.
    /// @return songId The newly assigned song ID.
    function registerSong(string calldata title, bytes32 fileHash) external returns (uint256 songId) {
        if (bytes(title).length == 0) revert InvalidName();
        if (bytes(title).length > MAX_TITLE_LEN) revert NameTooLong();
        if (fileHashToSong[fileHash] != 0) revert DuplicateFileHash();

        uint256 artistId = artistByWallet[msg.sender];
        if (artistId == 0) revert NotArtist();

        songId = ++songCounter;
        songs[songId] = Song({title: title, artistId: artistId, fileHash: fileHash});
        fileHashToSong[fileHash] = songId;

        emit SongRegistered(songId, artistId, fileHash, title);
    }

    /// @notice Fetch song data by ID.
    function getSong(uint256 songId) external view returns (Song memory) {
        if (songId == 0 || songId > songCounter) revert SongNotFound();
        return songs[songId];
    }

    /// @notice Fetch artist data by ID.
    function getArtist(uint256 artistId) external view returns (Artist memory) {
        if (artistId == 0 || artistId > artistCounter) revert ArtistNotFound();
        return artists[artistId];
    }

    /// @notice Look up an artist's ID by their wallet address.
    function getArtistIdByWallet(address wallet) external view returns (uint256) {
        uint256 artistId = artistByWallet[wallet];
        if (artistId == 0) revert ArtistNotFound();
        return artistId;
    }
}
