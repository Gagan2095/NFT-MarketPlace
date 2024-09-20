const {expect} = require('chai');
const {loadFixture} = require('@nomicfoundation/hardhat-network-helpers')
describe("ERC721Token", function () {
    async function deployContract() {
        const [owner,addr1,addr2] = await ethers.getSigners();
        const ERCTOKEN = await ethers.getContractFactory("ERC721TOKEN");
        const tokens = await ERCTOKEN.deploy(owner.address);
        return {tokens,owner,addr1,addr2};
    }
    it("Should assign the correct name",async function () {
        const {tokens} = await loadFixture(deployContract);
        expect(await tokens.name()).to.equal("ERC721Token");
    })
    it("Should assign the correct symbol",async function () {
        const {tokens} = await loadFixture(deployContract);
        expect(await tokens.symbol()).to.equal("E721T");
    })
    it("Should mint the token",async function () {
        const tokenId = 112;
        const {tokens,addr1} = await loadFixture(deployContract);
        await tokens.safeMint(addr1,tokenId);
        expect(await tokens.ownerOf(tokenId)).to.be.equal(addr1.address);
    })
    it("Should not mint by a normal user",async function () {
        const tokenId = 112;
        const {tokens,addr1,addr2} = await loadFixture(deployContract);
        await expect(tokens.connect(addr2).safeMint(addr1,tokenId)).to.be.revertedWithCustomError(tokens,"OwnableUnauthorizedAccount").withArgs(addr2)
    })
    it("Should assign the correct the owner",async function () {
        const {tokens,owner} = await loadFixture(deployContract);
        expect(await tokens.owner()).to.be.equal(owner.address);
    })
    deployContract();
})