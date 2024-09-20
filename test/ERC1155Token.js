const {expect} = require('chai');
const {loadFixture} = require('@nomicfoundation/hardhat-network-helpers')

const data = '0x12345678';

describe("ERC1155Token", function () {
    async function deployContract() {
        const [owner,addr1,addr2] = await ethers.getSigners();
        const ERCTOKEN = await ethers.getContractFactory("ERC1155TOKEN");
        const tokens = await ERCTOKEN.deploy(owner.address);
        return {tokens,owner,addr1,addr2};
    }
    it("should deploy the contract", async function () {
        const {tokens} = await loadFixture(deployContract);
        expect(await tokens.getAddress()).to.be.properAddress;
    });
    it("Should assign the correct owner",async function () {
        const {tokens,owner} = await loadFixture(deployContract);
        expect(await tokens.owner()).to.be.equal(owner.address);
    })
    it("Should mint the token ",async function () {
        const tokenId = 12;
        const {tokens,addr1} = await loadFixture(deployContract);
        await tokens.mint(addr1.address,tokenId,1,data)
        expect(await tokens.balanceOf(addr1,tokenId)).to.be.greaterThan(0);
    })
    it("Should not mint the token by a normal user",async function () {
        const tokenId = 12;
        const {tokens,addr1,addr2} = await loadFixture(deployContract);
        await expect(tokens.connect(addr2).mint(addr1.address,tokenId,1,data)).to.be.revertedWithCustomError(tokens,"OwnableUnauthorizedAccount").withArgs(addr2);
    })
    it("Should batch mint the tokens",async function () {
        const tokenIds = [1000];
        const amounts = [1];
        const {tokens,addr1} = await loadFixture(deployContract);
        await tokens.mintBatch(addr1.address,tokenIds,amounts,data)
        expect(await tokens.balanceOfBatch([addr1],tokenIds)).to.length.greaterThan(0);
    })
    it("Should not batch mint the token by a normal user",async function () {
        const tokenIds = [1000];
        const amounts = [1];
        const {tokens,addr1,addr2} = await loadFixture(deployContract);
        await expect(tokens.connect(addr2).mintBatch(addr1.address,tokenIds,amounts,data)).to.be.revertedWithCustomError(tokens,"OwnableUnauthorizedAccount").withArgs(addr2);
    })
    deployContract();
})
