const ERC998ERC1155TopDownPresetMinterPauser = artifacts.require("ERC998ERC1155TopDownPresetMinterPauser");
const ERC1155PresetMinterPauser = artifacts.require("ERC1155PresetMinterPauser");
const web3 = require('web3');

contract("ERC998ERC1155TopDownPresetMinterPauser", accounts => {
  let admin;
  let erc998;
  let erc1155;
  let composable1 = 1;
  let composable2 = 2;
  let multiToken1 = 0;
  let multiToken2 = 1;
  let multiToken3 = 2;
  let user1 = accounts[1];
  let user2 = accounts[2];

  before(async () => {
    admin = accounts[0];
    let multiTokenMaxSuply = 10;

    erc1155 = await ERC1155PresetMinterPauser.new("https://ERC1155.com/{id}", { from: admin });
    erc1155.mint(admin, multiToken1, multiTokenMaxSuply, "0x");
    erc1155.mint(admin, multiToken2, multiTokenMaxSuply, "0x");
    erc1155.mint(admin, multiToken3, multiTokenMaxSuply, "0x");
  });

  beforeEach(async () => {
    erc998 = await ERC998ERC1155TopDownPresetMinterPauser.new("erc998", "ERC998", "https://ERC998.com/{id}", { from: admin });
    await erc998.mint(user1, composable1, { from: admin });
    await erc998.mint(user2, composable2, { from: admin });
  })

  it("receive child", async () => {
    await erc1155.safeTransferFrom(admin, erc998.address, multiToken1, 1, web3.utils.encodePacked(composable1));
    assert.equal(await erc998.childBalance(composable1, erc1155.address, multiToken1), 1);
  });

  it("transfer child to other erc998", async () => {
    await erc1155.safeTransferFrom(admin, erc998.address, multiToken1, 1, web3.utils.encodePacked(composable1));
    await erc998.safeTransferChildFrom(composable1, erc998.address, erc1155.address, multiToken1, 1, web3.utils.encodePacked(composable2), { from: user1 });
    assert.equal(await erc998.childBalance(composable1, erc1155.address, multiToken1), 0);
    assert.equal(await erc998.childBalance(composable2, erc1155.address, multiToken1), 1);
  });

  it("batched receive", async () => {
    await erc1155.safeBatchTransferFrom(admin, erc998.address, [multiToken2, multiToken3], [1, 1], web3.utils.encodePacked(composable1));

    assert.equal(await erc998.childBalance(composable1, erc1155.address, multiToken2), 1);
    assert.equal(await erc998.childBalance(composable1, erc1155.address, multiToken3), 1);
  });

  it("batched child transfer", async () => {
    await erc1155.safeBatchTransferFrom(admin, erc998.address, [multiToken2, multiToken3], [1, 1], web3.utils.encodePacked(composable1));
    await erc998.safeBatchTransferChildFrom(composable1, erc998.address, erc1155.address, [multiToken2, multiToken3], [1, 1], web3.utils.encodePacked(composable2), { from: user1 });

    assert.equal(await erc998.childBalance(composable1, erc1155.address, multiToken2), 0);
    assert.equal(await erc998.childBalance(composable1, erc1155.address, multiToken3), 0);

    assert.equal(await erc998.childBalance(composable2, erc1155.address, multiToken2), 1);
    assert.equal(await erc998.childBalance(composable2, erc1155.address, multiToken3), 1);
  });

  it("childAmountAt and childIdAtIndex", async () => {
    await erc1155.safeBatchTransferFrom(admin, erc998.address, [multiToken2, multiToken3], [3, 3], web3.utils.encodePacked(composable1));

    const childContracts = await erc998.childContractsFor(composable1);
    assert.equal(childContracts.length, 1);
    assert.equal(childContracts[0], erc1155.address);


    const childIds = await erc998.childIdsForOn(composable1, erc1155.address);
    assert.equal(childIds[0], multiToken2);
    assert.equal(childIds[1], multiToken3);

    assert.equal(await erc998.childBalance(composable1, erc1155.address, multiToken2), 3);
    assert.equal(await erc998.childBalance(composable1, erc1155.address, multiToken3), 3);
  });
});
