// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
// Author: @Gagan2095
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ERC721TOKEN is ERC721, Ownable {
    constructor(
        address initialOwner
    ) ERC721("ERC721Token", "E721T") Ownable(initialOwner) {}
    function safeMint(address to, uint256 tokenId) public onlyOwner {
        _safeMint(to, tokenId);
    }
}
