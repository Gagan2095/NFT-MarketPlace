const {expect} = require('chai');
const {loadFixture} = require('@nomicfoundation/hardhat-network-helpers')

const data = "0x012345";
const zeroAddress = "0x0000000000000000000000000000000000000000";
const price = 20000000000n;

describe("MarketPlace", function () {

    async function deployContract() {
        const [owner,addr1,addr2] = await ethers.getSigners();
        const MarketPlace = await ethers.getContractFactory("MarketPlace");
        const ERC1155TOKEN = await ethers.getContractFactory("ERC1155TOKEN");
        const ERCT721OKEN = await ethers.getContractFactory("ERC721TOKEN");
        const ERC20TOKEN = await ethers.getContractFactory("ERC20TOKEN");
        const tokens = await MarketPlace.deploy();
        const erc1155 = await ERC1155TOKEN.deploy(owner.address);
        const erc721 = await ERCT721OKEN.deploy(owner.address);
        const erc20 = await ERC20TOKEN.deploy();
        return {owner,addr1,addr2, tokens, erc20, erc721, erc1155};
    }

    describe("createSaleERC1155",function () {
        it("Should create the sale",async function () {
            const {owner, tokens, erc1155, erc20} = await loadFixture(deployContract);
            await erc1155.mint(owner.address,13,5,data);
            const saleNFT = {
                tokenContractAddress: await erc1155.getAddress(),
                assets:5n, 
                assetPrice:price,
                erc20TokenAddress: await erc20.getAddress(),
            }
            await tokens.createSaleERC1155(saleNFT,13);
            const result = await tokens.ERC1155OnSale(13);
            expect(result[0]).to.equal(await erc1155.getAddress());
            expect(result[1]).to.equal(5n);
            expect(result[2]).to.equal(price);
            expect(result[3]).to.equal(await erc20.getAddress());
        })

        it("Should revert with Unauthorized error if msg.sender not the owner of the token",async function () {
            const {tokens,owner,addr1,erc1155} = await loadFixture(deployContract);
            await erc1155.mint(owner.address,13,5,data);
            const saleNFT = {
                tokenContractAddress: await erc1155.getAddress(),
                assets:5n, 
                assetPrice:price,
                erc20TokenAddress: zeroAddress,
            }
            await expect(tokens.connect(addr1).createSaleERC1155(saleNFT,13)).to.be.revertedWithCustomError(tokens,"Unauthorized").withArgs(addr1.address);
        })
    })

    describe("createSalesERC721",function () {
        it("Should create the sales",async function () {
            const {tokens,owner,erc721,erc20} = await loadFixture(deployContract);
            await erc721.safeMint(owner.address,113);
            const saleNFT = {
                tokenContractAddress: await erc721.getAddress(),
                assets:1n, 
                assetPrice:price,
                erc20TokenAddress: await erc20.getAddress(),
            }
            await tokens.createSalesERC721(saleNFT,113);
            const result = await tokens.ERC721OnSale(113);
            expect(result[0]).to.equal(await erc721.getAddress());
            expect(result[1]).to.equal(1n);
            expect(result[2]).to.equal(price);
            expect(result[3]).to.equal(await erc20.getAddress());
        })

        it("Should revert with Unauthorized error if msg.sender not the owner of the token",async function () {
            const {tokens,owner,addr1,erc721} = await loadFixture(deployContract);
            await erc721.safeMint(owner.address,113);
            const saleNFT = {
                tokenContractAddress: await erc721.getAddress(),
                assets:1n, 
                assetPrice:price,
                erc20TokenAddress: zeroAddress,
            }
            await expect(tokens.connect(addr1).createSalesERC721(saleNFT,113)).to.be.revertedWithCustomError(tokens,"Unauthorized").withArgs(addr1.address)
        })
    })

    describe("buyERC1155",function () {
        it("Should buy the NFTs by ERC-20 tokens",async function () {
            const {tokens,addr1,addr2,erc1155,erc20} = await loadFixture(deployContract);

            await erc20.transfer(addr1.address,2000000000000000000n)
            await erc1155.mint(addr2.address,13,5,data);
            const balanceBefore = await erc20.balanceOf(tokens.getAddress());

            const saleNFT = {
                tokenContractAddress: await erc1155.getAddress(),
                assets:1n, 
                assetPrice:price,
                erc20TokenAddress: await erc20.getAddress(),
            }
            await tokens.connect(addr2).createSaleERC1155(saleNFT, 13);
            await tokens.ERC1155OnSale(13);
            await erc20.connect(addr1).approve(tokens.getAddress(),20000000000);
            await erc1155.connect(addr2).setApprovalForAll(tokens.getAddress(),true);
            await tokens.connect(addr1).buyERC1155(13,1);
            const balanceAfter = await erc20.balanceOf(tokens.getAddress());
            expect(balanceAfter).to.be.equal(balanceBefore+((saleNFT.assets * saleNFT.assetPrice*55n)/10000n))
        })

        it("Should revert with InvalidNFT if the NFT is not on sale", async function () {
            const [owner,addr1,addr2] = await ethers.getSigners();
            const {tokens} = await loadFixture(deployContract);
            const {erc1155} = await loadFixture(deployContract);
    
            await erc1155.mint(addr2.address,13,5,data);
            const saleNFT = {
                tokenContractAddress: await erc1155.getAddress(),
                assets:1n, 
                assetPrice:price,
                erc20TokenAddress:zeroAddress,
            }
            await tokens.connect(addr2).createSaleERC1155(saleNFT, 13);
    
            await expect(tokens.connect(addr1).buyERC1155(14,1)).to.be.revertedWithCustomError(tokens,"InvalidNft").withArgs(14);
        })
        it("Should revert with InsufficientToken error if provided value of tokens is more than the sale",async function () {
            const [owner,addr1,addr2] = await ethers.getSigners();
            const {tokens} = await loadFixture(deployContract);
            const {erc1155} = await loadFixture(deployContract);
    
            await erc1155.mint(addr2.address,13,5,data);
            const saleNFT = {
                tokenContractAddress: await erc1155.getAddress(),
                assets:1n, 
                assetPrice:price,
                erc20TokenAddress:zeroAddress,
            }
            await tokens.connect(addr2).createSaleERC1155(saleNFT, 13);
    
            await expect(tokens.connect(addr1).buyERC1155(13,6)).to.be.revertedWithCustomError(tokens,"InsufficientToken");
        })
        it("Should buy with ether if ERC-20 token address not provided",async function () {
            const [owner,addr1,addr2] = await ethers.getSigners();
            const {tokens} = await loadFixture(deployContract)
            const {erc1155} = await loadFixture(deployContract);
            await erc1155.mint(addr2.address,13,5,data);
            const balanceBefore = await ethers.provider.getBalance(await tokens.getAddress())
            const saleNFT = {
                tokenContractAddress: await erc1155.getAddress(),
                assets:1n, 
                assetPrice:price,
                erc20TokenAddress: zeroAddress,
            }
            await tokens.connect(addr2).createSaleERC1155(saleNFT, 13);
            const result = await tokens.ERC1155OnSale(13);
            
            expect(result[0]).to.equal(await erc1155.getAddress());
            expect(result[1]).to.equal(1n);
            expect(result[2]).to.equal(price);
            expect(result[3]).to.equal(zeroAddress);
            await erc1155.connect(addr2).setApprovalForAll(tokens.getAddress(),true);
            await tokens.connect(addr1).buyERC1155(13,1,{value:price});
            if(55n * saleNFT.assetPrice * 1n > 10000)
                expect(await ethers.provider.getBalance(await tokens.getAddress())).to.be.equal(balanceBefore+((saleNFT.assets * saleNFT.assetPrice*55n)/10000n));
            else 
                expect(await ethers.provider.getBalance(await tokens.getAddress())).to.be.equal(balanceBefore);
        })
        it("Should revert with InsufficientFund",async function () {
            const [owner,addr1,addr2] = await ethers.getSigners();
            const {tokens} = await loadFixture(deployContract);
            const {erc1155} = await loadFixture(deployContract);
            const {erc20} = await loadFixture(deployContract);
    
            await erc20.transfer(addr1.address,20000000n)
    
            await erc1155.mint(addr2.address,13,5,data);

            const saleNFT = {
                tokenContractAddress: await erc1155.getAddress(),
                assets:1n, 
                assetPrice:price,
                erc20TokenAddress: await erc20.getAddress(),
            }
            await tokens.connect(addr2).createSaleERC1155(saleNFT, 13);
            const result = await tokens.ERC1155OnSale(13);
            expect(result[0]).to.equal(await erc1155.getAddress());
            expect(result[1]).to.equal(1n);
            expect(result[2]).to.equal(price);
            expect(result[3]).to.equal(await erc20.getAddress());
    
            await erc20.connect(addr1).approve(tokens.getAddress(),20000000000);
            await erc1155.connect(addr2).setApprovalForAll(tokens.getAddress(),true);
            await expect(tokens.connect(addr1).buyERC1155(13,1)).to.be.revertedWithCustomError(tokens,"InsufficientFund");
        })
    })

    describe("buyERC721", function () {
        it("Should increase the marketplace owner balance by 0.55% of asset price on buying token",async function () {
            const {tokens,addr1,addr2,erc721,erc20} = await loadFixture(deployContract);

            await erc20.transfer(addr1.address,200)
            await erc721.safeMint(addr2.address,13);
    
            const balanceBefore = await erc20.balanceOf(tokens.getAddress());
            const saleNFT = {
                tokenContractAddress: await erc721.getAddress(),
                assets:1, 
                assetPrice:20n,
                erc20TokenAddress: await erc20.getAddress(),
            }
            await tokens.connect(addr2).createSalesERC721(saleNFT, 13);
            await tokens.ERC721OnSale(13);
            await erc20.connect(addr1).approve(tokens.getAddress(),70);
            await erc721.connect(addr2).approve(tokens.getAddress(),13);
            await tokens.connect(addr1).buyERC721(13,1);
            if(55n * saleNFT.assetPrice * 1n > 10000)
                expect(await ethers.provider.getBalance(await tokens.getAddress())).to.be.equal(balanceBefore+((saleNFT.assets * saleNFT.assetPrice*55n)/10000n));
            else 
                expect(await ethers.provider.getBalance(await tokens.getAddress())).to.be.equal(balanceBefore);
        })
        it("Should revert if nft is not valid", async function () {
            const {tokens,owner,addr1,erc721,erc20} = await loadFixture(deployContract);
            await erc721.safeMint(owner.address,113);
            const saleNFT = {
                tokenContractAddress: await erc721.getAddress(),
                assets:1n, 
                assetPrice:price,
                erc20TokenAddress: await erc20.getAddress(),
            }
            await tokens.createSalesERC721(saleNFT,113);
            await expect(tokens.connect(addr1).buyERC721(13, 1)).to.be.revertedWithCustomError(tokens, "InvalidNft").withArgs(13);
        })
        it("Should revert if provided value is greater than the value on sale",async function () {
            const {tokens,owner,addr1,erc721,erc20} = await loadFixture(deployContract);
            await erc721.safeMint(owner.address,113);
            const saleNFT = {
                tokenContractAddress: await erc721.getAddress(),
                assets:1n, 
                assetPrice:price,
                erc20TokenAddress: await erc20.getAddress(),
            }
            await tokens.createSalesERC721(saleNFT,113);
            await expect(tokens.connect(addr1).buyERC721(113, 5)).to.be.revertedWithCustomError(tokens, "InsufficientToken");
        })
        it("Should buy with ether if ERC-20 token address not provided",async function () {
            const {tokens,addr1,addr2,erc721} = await loadFixture(deployContract)
            await erc721.safeMint(addr2.address,13);
            const balanceBefore = await ethers.provider.getBalance(await tokens.getAddress())
            const saleNFT = {
                tokenContractAddress: await erc721.getAddress(),
                assets:1n, 
                assetPrice:price,
                erc20TokenAddress: zeroAddress,
            }
            await tokens.connect(addr2).createSalesERC721(saleNFT, 13);
            await tokens.ERC721OnSale(13);
            await erc721.connect(addr2).approve(tokens.getAddress(),13);
            await tokens.connect(addr1).buyERC721(13,1,{value:price});
            if(55n * saleNFT.assetPrice * 1n > 10000)
                expect(await ethers.provider.getBalance(await tokens.getAddress())).to.be.equal(balanceBefore+((saleNFT.assets * saleNFT.assetPrice*55n)/10000n));
            else 
                expect(await ethers.provider.getBalance(await tokens.getAddress())).to.be.equal(balanceBefore);
        })
        it("Should not apply fee if total amount is less than 1000 ethers",async function () {
            const {tokens,addr1,addr2,erc721} = await loadFixture(deployContract)
            await erc721.safeMint(addr2.address,13);
            const balanceBefore = await ethers.provider.getBalance(await tokens.getAddress())
            const saleNFT = {
                tokenContractAddress: await erc721.getAddress(),
                assets:1n, 
                assetPrice:20n,
                erc20TokenAddress: zeroAddress,
            }
            await tokens.connect(addr2).createSalesERC721(saleNFT, 13);
            await tokens.ERC721OnSale(13);
            await erc721.connect(addr2).approve(tokens.getAddress(),13);
            await tokens.connect(addr1).buyERC721(13,1,{value:20n});
            expect(await ethers.provider.getBalance(await tokens.getAddress())).to.be.equal(balanceBefore);
        })
        it("Should revert with InsufficientFund",async function () {
            const {tokens,addr1,addr2,erc721,erc20} = await loadFixture(deployContract);
    
            await erc20.transfer(addr1.address,20000000n)
            await erc721.safeMint(addr2.address,13);

            const saleNFT = {
                tokenContractAddress: await erc721.getAddress(),
                assets:1n, 
                assetPrice:price,
                erc20TokenAddress: await erc20.getAddress(),
            }
            await tokens.connect(addr2).createSalesERC721(saleNFT, 13);
            await tokens.ERC721OnSale(13);
            await erc20.connect(addr1).approve(tokens.getAddress(),20000000000);
            await erc721.connect(addr2).setApprovalForAll(tokens.getAddress(),true);
            await expect(tokens.connect(addr1).buyERC721(13,1)).to.be.revertedWithCustomError(tokens,"InsufficientFund");
        })
    })

    describe("withdraw ethers",function () {
        it("Should revert with Unauthorized if msg.sender is not the owner",async function () {
            const {tokens,addr1} = await loadFixture(deployContract);
            await expect(tokens.connect(addr1).withdraw(200))
                    .to
                    .be
                    .revertedWithCustomError(tokens,"Unauthorized")
                    .withArgs(addr1.address);
        })
        it("Should revert with InsufficientFund if contract have not enough ethers",async function () {
            const {tokens} = await loadFixture(deployContract);
            await expect(tokens.withdraw(200)).to.be.revertedWithCustomError(tokens,"InsufficientFund");
        })
        it("Should withdraw the ether to the owner's account",async function () {
            const {tokens,addr1,addr2,erc721} = await loadFixture(deployContract)
            await erc721.safeMint(addr2.address,13);
            const saleNFT = {
                tokenContractAddress: await erc721.getAddress(),
                assets:1n, 
                assetPrice:price,
                erc20TokenAddress: zeroAddress,
            }
            await tokens.connect(addr2).createSalesERC721(saleNFT, 13);
            await tokens.ERC721OnSale(13);
            await erc721.connect(addr2).approve(tokens.getAddress(),13);
            await tokens.connect(addr1).buyERC721(13,1,{value:price});
            const bal = await ethers.provider.getBalance(tokens.target);
            await tokens.withdraw(bal);
            expect(await ethers.provider.getBalance(tokens.target)).to.be.equal(0);
        })
    })

    describe("withdraw ERC-20",function() {
        it("Should revert with Unauthorized if msg.sender is not the owner",async function () {
            const {tokens,addr1} = await loadFixture(deployContract);
            await expect(tokens.connect(addr1).withdrawERC20(200,zeroAddress))
                    .to
                    .be
                    .revertedWithCustomError(tokens,"Unauthorized")
                    .withArgs(addr1.address);
        })
        it("Should revert with InsufficientFund if contract have not enough erc20 tokens",async function () {
            const {tokens,erc20} = await loadFixture(deployContract);
            await expect(tokens.withdrawERC20(2000,await erc20.getAddress()))
                    .to
                    .be
                    .revertedWithCustomError(tokens,"InsufficientFund");
        })
        it("Should withdraw the ether to the owner's account",async function () {
            const {tokens,addr1,addr2,erc721,erc20} = await loadFixture(deployContract);
    
            await erc20.transfer(addr1.address,200)
            await erc721.safeMint(addr2.address,13);

            const saleNFT = {
                tokenContractAddress: await erc721.getAddress(),
                assets:1, 
                assetPrice:20,
                erc20TokenAddress: await erc20.getAddress(),
            }
            await tokens.connect(addr2).createSalesERC721(saleNFT, 13);
            await tokens.ERC721OnSale(13);
            await erc20.connect(addr1).approve(tokens.getAddress(),70);
            await erc721.connect(addr2).approve(tokens.getAddress(),13);
            await tokens.connect(addr1).buyERC721(13,1);
            const bal = await erc20.balanceOf(tokens.target);
            await tokens.withdrawERC20(bal,erc20.getAddress());
            expect(await erc20.balanceOf(tokens.target)).to.be.equal(0);
        })
    })

    it("Should assign the correct owner address",async function () {
        const [owner] = await ethers.getSigners();
        const {tokens} = await loadFixture(deployContract);
        expect(await tokens.owner()).to.equal(owner.address);
    })
    
    deployContract();
})