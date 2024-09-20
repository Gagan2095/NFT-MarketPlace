const {expect} = require('chai');
const {loadFixture} = require('@nomicfoundation/hardhat-network-helpers')
describe("ERC20Token", function () {
    async function deployContract() {
        const ERCTOKEN = await ethers.getContractFactory("ERC20TOKEN");
        const [owner] = await ethers.getSigners();
        const tokens = await ERCTOKEN.deploy();
        return {tokens,owner};
    }
    it("Should assign the correct name",async function () {
        const {tokens} = await loadFixture(deployContract);
        expect(await tokens.name()).to.equal("ERC20Token");
    })
    it("Should assign the correct symbol",async function () {
        const {tokens} = await loadFixture(deployContract);
        expect(await tokens.symbol()).to.equal("E20T");
    })
    it("Should mint 1000 tokens",async function () {
        const {tokens,owner} = await loadFixture(deployContract);
        expect(await tokens.balanceOf(owner.address)).to.equal(1000n*10n**18n);
    })
    deployContract();
})