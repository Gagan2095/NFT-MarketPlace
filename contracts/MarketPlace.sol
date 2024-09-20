// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20TOKEN} from "./ERC20Token.sol";
import {ERC721TOKEN} from "./ERC721Token.sol";
import {ERC1155TOKEN} from "./ERC1155Token.sol";
import 'hardhat/console.sol';
/// @title NFT marketplace for ERC721 and ERC1155 tokens
/// @notice enable user to avail tokens for sale and buyer to buy them
contract MarketPlace {
    /// @title on sale NFT data
    /// @notice user will give some information about the NFT
    struct saleNFTERC721 {
        address tokenContractAddress;
        uint assets;
        uint assetPrice;
        address erc20TokenAddress;
    }
    struct saleNFTERC1155 {
        address tokenContractAddress;
        uint assets;
        uint assetPrice;
        address erc20TokenAddress;
    }

    /// @notice owner of the marketplace contract 
    address payable public immutable owner;

    mapping(uint => saleNFTERC721) public ERC721OnSale;

    mapping(uint => saleNFTERC1155) public ERC1155OnSale;

    mapping(uint => address) public tokenOwner;

    /// @notice if user not the owner of the token and try to avail token on sale 
    error Unauthorized(address addr);

    /// @notice if a token is not in the marketplace
    error InvalidNft(uint tokenId);

    /// @notice if the value of the token on the sale is less than the value user wants to buy
    error InsufficientToken();

    /// @notice if user have not enough funds to buy the token
    error InsufficientFund();

    // @notice if the sale not created for the token Id
    error NftNotOnSale(uint tokenId);

    constructor()  {
        owner = payable(msg.sender);
    }

    receive() external payable { }

    /// @notice avail an ERC1155 token for sale
    /// @param asset information provided by the user about the token
    /// @param tokenId id of the NFT token
    function createSaleERC1155(saleNFTERC1155 memory asset, uint tokenId) external {
        ERC1155TOKEN erc1155 = ERC1155TOKEN(asset.tokenContractAddress);
        if (erc1155.balanceOf(msg.sender, tokenId) > 0) {
            ERC1155OnSale[tokenId] = asset;
            tokenOwner[tokenId] = msg.sender;
        } else {
            revert Unauthorized(msg.sender);
        }
    }

    /// @notice avail an ERC721 token for sale
    /// @param asset information provided by the user about the token
    /// @param tokenId id of the NFT token
    function createSalesERC721(saleNFTERC721 memory asset, uint tokenId) external {
        ERC721TOKEN erc721 = ERC721TOKEN(asset.tokenContractAddress);
        asset.assets = 1;
        if (erc721.ownerOf(tokenId) == msg.sender) {
            ERC721OnSale[tokenId] = asset;
            tokenOwner[tokenId] = msg.sender;
        } else {
            revert Unauthorized(msg.sender);
        }
    }

    /// @notice buyer can buy the ERC1155 tokens available on sale
    /// @param tokenId id of the NFT token
    /// @param value how many tokens does user wants to buy
    function buyERC1155(uint tokenId, uint value) external payable {
        saleNFTERC1155 memory nft = ERC1155OnSale[tokenId];
        ERC20TOKEN erc20 = ERC20TOKEN(nft.erc20TokenAddress);
        ERC1155TOKEN erc1155 = ERC1155TOKEN(nft.tokenContractAddress);

        // checking if the token is on sale or not
        if (nft.tokenContractAddress == address(0))
            revert InvalidNft(tokenId);

        // checking if the provided value is not greater than the value on sale
        if (nft.assets < value)
            revert InsufficientToken();

        // if ERC20 token address is zero address then simple transfer
        if (nft.erc20TokenAddress == address(0)) {
            address payable addr = payable(tokenOwner[tokenId]); 
            
            uint fee = (55 * nft.assetPrice * value)/10000; 
            addr.transfer((value * nft.assetPrice)-fee);
            ERC1155OnSale[tokenId].assets -= value;
            erc1155.safeTransferFrom(
                tokenOwner[tokenId],
                msg.sender,
                tokenId,
                value,
                ""
            );
        }
        else if (erc20.balanceOf(msg.sender) >= nft.assetPrice) {
            uint fee = (55 * nft.assetPrice * value)/10000; 
            erc20.transferFrom(
                msg.sender,
                tokenOwner[tokenId],
                (value * nft.assetPrice)-fee
            );
            erc20.transferFrom(msg.sender, address(this), fee);
            erc1155.safeTransferFrom(
                    tokenOwner[tokenId],
                    msg.sender,
                    tokenId,
                    value,
                    ""
                );
            
        } else revert InsufficientFund();
    }

    /// @notice buyer can buy the ERC721 tokens available on sale
    /// @param tokenId id of the NFT token
    /// @param value how many tokens does user wants to buy
    function buyERC721(uint tokenId, uint value) external payable {
        saleNFTERC721 memory nft = ERC721OnSale[tokenId];
        ERC20TOKEN erc20 = ERC20TOKEN(nft.erc20TokenAddress);
        ERC721TOKEN erc721 = ERC721TOKEN(nft.tokenContractAddress);

        // checking if the token is on sale or not
        if (nft.tokenContractAddress == address(0))
            revert InvalidNft(tokenId);

        // checking if the provided value is not greater than the value on sale
        if (nft.assets < value)
            revert InsufficientToken();
        // if ERC20 token address is zero address then simple transfer
        if (nft.erc20TokenAddress == address(0)) {
            address payable addr = payable(tokenOwner[tokenId]); 
            if(55 * nft.assetPrice * value > 10000) {
                uint fee = (55 * nft.assetPrice * value)/10000; 
                addr.transfer((value * nft.assetPrice)-fee);
                ERC721OnSale[tokenId].assets -= value;
            } else {
                addr.transfer(value * nft.assetPrice);
            }
            
            erc721.safeTransferFrom(tokenOwner[tokenId], msg.sender, tokenId);
        }
        else if (erc20.balanceOf(msg.sender) >= nft.assetPrice) {
            uint fee =( 55 * nft.assetPrice * value)/10000; 
            erc20.transferFrom(
                msg.sender,
                tokenOwner[tokenId],
                (value * nft.assetPrice)-fee
            );
            erc20.transferFrom(msg.sender, address(this), fee);
            erc721.safeTransferFrom(tokenOwner[tokenId], msg.sender, tokenId);
            
        } else revert InsufficientFund();
    }

    function withdraw(uint amount) external {
        if(msg.sender != owner) 
            revert Unauthorized(msg.sender);
        else if(amount>address(this).balance) 
            revert InsufficientFund();
        else
            owner.transfer(amount);
    }
    
    function withdrawERC20(uint amount, address ERC20Address) external {
        if(msg.sender != owner) 
            revert Unauthorized(msg.sender);
        
        ERC20TOKEN erc20 = ERC20TOKEN(ERC20Address);

        if(amount > erc20.balanceOf(address(this))) 
            revert InsufficientFund();
        else
            erc20.transfer(msg.sender,amount);
    }
}
