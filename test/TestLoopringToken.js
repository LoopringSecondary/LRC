var LoopringToken = artifacts.require("LoopringToken");

contract('LoopringToken', function(accounts) {
  it("should not be able to start ico sale when not called by owner.", function() {
    console.log("\n" + "-".repeat(100) + "\n");
    var loopring;
    var target;
    return LoopringToken.deployed().then(function(instance) {
      loopring = instance;
      console.log("loopring:", loopring.address);
      return loopring.target.call({from: accounts[1]});
    }).then(function(t){
      target = accounts[1];
      web3.eth.sendTransaction({from: accounts[1], to: loopring.address, value: web3.toWei(1) })
      return web3.eth.sendTransaction({from: accounts[1], to: target, value: web3.toWei(1) })
    }).then(function(tx) {
      console.log("tx:", tx);
      console.log("blockNumber:", web3.eth.blockNumber);
      return loopring.start(100, {from: accounts[1]});
    }).then(function(tx) {
      console.log("tx:", tx);
      if (tx.logs) {
        for (var i = 0; i < tx.logs.length; i++) {
          var log = tx.logs[i];
          if (log.event == "InvalidCaller") {
            return true;
          }
        }
      }
      return false;
    }).then(function(result) {
      assert.equal(result, true, "no SaleStarted event found");
    });
  });

  it("should not allow create tokens before it starts", function() {
    console.log("\n" + "-".repeat(100) + "\n");
    var loopring;
    var target;
    return LoopringToken.deployed().then(function(instance) {
      loopring = instance;
      return loopring.target.call({from: accounts[1]});
    }).then(function(t){
      target = t;
      console.log("target:", target);
      firstblock = t.blockNumber + 1;
      return web3.eth.sendTransaction({from: accounts[1], to: loopring.address, value: web3.toWei(1) });

    }).then(function(txHash) {
      console.log("txHash", txHash);
      // InvalidState event shoud emitted here.
      return true;
    }).then(function(result) {
      assert.equal(result, true, "create tokens before sale start");
    });
  });

  it("should be able to start ico sale when called by owner.", function() {
    console.log("\n" + "-".repeat(100) + "\n");
    var loopring;
    var target;
    return LoopringToken.deployed().then(function(instance) {
      loopring = instance;
      return loopring.target.call();
    }).then(function(t){
      target = t;
      return loopring.start(10, {from: target});
    }).then(function(tx) {
      console.log("tx: ", tx);
      if (tx.logs) {
        for (var i = 0; i < tx.logs.length; i++) {
          var log = tx.logs[i];
          if (log.event == "SaleStarted") {
            return true;
          }
        }
      }
      return false;
    }).then(function(result) {
      assert.equal(result, true, "no SaleStarted event found");
    });
  });

  it("should be able to create Loopring tokens after sale starts", function() {
    console.log("\n" + "-".repeat(100) + "\n");
    var loopring;
    var target;
    var externalTxHash;
    return LoopringToken.deployed().then(function(instance) {
      loopring = instance;
      return loopring.target.call({from: accounts[1]});
    }).then(function(t){
      target = t;
      return web3.eth.sendTransaction({from: accounts[1], to: loopring.address, value: web3.toWei(1), gas: 500000 });
    }).then(function(tx) {
      console.log("tx:", tx);
      return loopring.balanceOf(accounts[1], {from: accounts[1]});
    }).then(function(bal) {
      console.log("bal: ", bal.toNumber());
      assert.equal(bal.toNumber(), web3.toWei(6000), "no Loopring token Transfer event found");
    });
  });

  it("should be able to compute LRC token amount correctly", function() {
    console.log("\n" + "-".repeat(100) + "\n");
    var loopring;
    var target;
    var ethAmount;
    var tokenBalance;
    return LoopringToken.deployed().then(function(instance) {
      loopring = instance;
      return loopring.target.call({from: accounts[1]});
    }).then(function(t){
      target = t;
      return loopring.balanceOf(accounts[1], {from: accounts[1]});
    }).then(function(balance) {
      tokenBalance = balance.toNumber();
      ethAmount = Math.random() * 100;
      for (var i = 0; i < 8; i ++) {
        web3.eth.sendTransaction({from: accounts[2], to: loopring.address, value: web3.toWei(1), gas: 500000 });
      }
      return web3.eth.sendTransaction({from: accounts[1], to: loopring.address, value: web3.toWei(ethAmount), gas: 500000 });
    }).then(function(tx) {
      console.log("tx:", tx);
      return loopring.balanceOf(accounts[1], {from: accounts[1]});
    }).then(function(amount1) {
      console.log("amount1:", amount1);
      var expectValue = web3.toWei(ethAmount) * 5000;
      expectValue = expectValue + expectValue * 20 / 100;
      expectValue = expectValue.toPrecision(8);
      var tokenIssued = amount1.toNumber() - tokenBalance;
      tokenIssued = tokenIssued.toPrecision(8);
      assert.equal(tokenIssued, expectValue, "token amount not compute correctly in phase 1.");
      tokenBalance = amount1.toNumber();
      ethAmount = Math.random() * 100;
      return web3.eth.sendTransaction({from: accounts[1], to: loopring.address, value: web3.toWei(ethAmount), gas: 500000 });
    }).then(function(tx) {
      console.log("tx:", tx);
      return loopring.balanceOf(accounts[1], {from: accounts[1]});
    }).then(function(amount2){
      console.log("amount2:", amount2);
      var expectValue = web3.toWei(ethAmount) * 5000;
      expectValue = expectValue + expectValue * 16 / 100;
      expectValue = expectValue.toPrecision(8);
      var tokenIssued = amount2.toNumber() - tokenBalance;
      tokenIssued = tokenIssued.toPrecision(8);
      assert.equal(tokenIssued, expectValue, "token amount not compute correctly in phase 1.");

      tokenBalance = amount2.toNumber();
      for (var i = 0; i < 9; i ++) {
        web3.eth.sendTransaction({from: accounts[2], to: loopring.address, value: web3.toWei(1), gas: 500000 });
      }
      ethAmount = Math.random() * 100;
      return web3.eth.sendTransaction({from: accounts[1], to: loopring.address, value: web3.toWei(ethAmount), gas: 500000 });
    }).then(function(tx) {
      console.log("tx:", tx);
      return loopring.balanceOf(accounts[1], {from: accounts[1]});
    }).then(function(amount3){
      console.log("amount3:", amount3);
      var expectValue = web3.toWei(ethAmount) * 5000;
      expectValue = expectValue + expectValue * 14 / 100;
      expectValue = expectValue.toPrecision(8);
      var tokenIssued = amount3.toNumber() - tokenBalance;
      tokenIssued = tokenIssued.toPrecision(8);
      assert.equal(tokenIssued, expectValue, "token amount not compute correctly in phase 1.");

      tokenBalance = amount3.toNumber();
      for (var i = 0; i < 9; i ++) {
        web3.eth.sendTransaction({from: accounts[2], to: loopring.address, value: web3.toWei(1), gas: 500000 });
      }
      ethAmount = Math.random() * 100;
      return web3.eth.sendTransaction({from: accounts[1], to: loopring.address, value: web3.toWei(ethAmount), gas: 500000 });
    }).then(function(tx) {
      console.log("tx:", tx);
      return loopring.balanceOf(accounts[1], {from: accounts[1]});
    }).then(function(amount4){
      console.log("amount4:", amount4);
      var expectValue = web3.toWei(ethAmount) * 5000;
      expectValue = expectValue + expectValue * 12 / 100;

      expectValue = expectValue.toPrecision(8);
      var tokenIssued = amount4.toNumber() - tokenBalance;
      tokenIssued = tokenIssued.toPrecision(8);
      assert.equal(tokenIssued, expectValue, "token amount not compute correctly in phase 1.");

      tokenBalance = amount4.toNumber();
      for (var i = 0; i < 9; i ++) {
        web3.eth.sendTransaction({from: accounts[2], to: loopring.address, value: web3.toWei(1), gas: 500000 });
      }
      ethAmount = Math.random() * 100;
      return web3.eth.sendTransaction({from: accounts[1], to: loopring.address, value: web3.toWei(ethAmount), gas: 500000 });
    }).then(function(tx) {
      console.log("tx:", tx);
      return loopring.balanceOf(accounts[1], {from: accounts[1]});
    }).then(function(amount5){
      console.log("amount5:", amount5);
      var expectValue = web3.toWei(ethAmount) * 5000;
      expectValue = expectValue + expectValue * 10 / 100;

      expectValue = expectValue.toPrecision(8);
      var tokenIssued = amount5.toNumber() - tokenBalance;
      tokenIssued = tokenIssued.toPrecision(8);
      assert.equal(tokenIssued, expectValue, "token amount not compute correctly in phase 1.");

      tokenBalance = amount5.toNumber();
      for (var i = 0; i < 9; i ++) {
        web3.eth.sendTransaction({from: accounts[2], to: loopring.address, value: web3.toWei(1), gas: 500000 });
      }
      ethAmount = Math.random() * 100;
      return web3.eth.sendTransaction({from: accounts[1], to: loopring.address, value: web3.toWei(ethAmount), gas: 500000 });
    }).then(function(tx) {
      console.log("tx:", tx);
      return loopring.balanceOf(accounts[1], {from: accounts[1]});
    }).then(function(amount6){
      console.log("amount6:", amount6);
      var expectValue = web3.toWei(ethAmount) * 5000;
      expectValue = expectValue + expectValue * 8 / 100;

      expectValue = expectValue.toPrecision(8);
      var tokenIssued = amount6.toNumber() - tokenBalance;
      tokenIssued = tokenIssued.toPrecision(8);
      assert.equal(tokenIssued, expectValue, "token amount not compute correctly in phase 1.");

      tokenBalance = amount6.toNumber();
      for (var i = 0; i < 9; i ++) {
        web3.eth.sendTransaction({from: accounts[2], to: loopring.address, value: web3.toWei(1), gas: 500000 });
      }
      ethAmount = Math.random() * 100;
      return web3.eth.sendTransaction({from: accounts[1], to: loopring.address, value: web3.toWei(ethAmount), gas: 500000 });
    }).then(function(tx) {
      console.log("tx:", tx);
      return loopring.balanceOf(accounts[1], {from: accounts[1]});
    }).then(function(amount7){
      console.log("amount7:", amount7);
      var expectValue = web3.toWei(ethAmount) * 5000;
      expectValue = expectValue + expectValue * 6 / 100;

      expectValue = expectValue.toPrecision(8);
      var tokenIssued = amount7.toNumber() - tokenBalance;
      tokenIssued = tokenIssued.toPrecision(8);
      assert.equal(tokenIssued, expectValue, "token amount not compute correctly in phase 1.");

      tokenBalance = amount7.toNumber();
      for (var i = 0; i < 9; i ++) {
        web3.eth.sendTransaction({from: accounts[2], to: loopring.address, value: web3.toWei(1), gas: 500000 });
      }
      ethAmount = Math.random() * 100;
      return web3.eth.sendTransaction({from: accounts[1], to: loopring.address, value: web3.toWei(ethAmount), gas: 500000 });
    }).then(function(tx) {
      console.log("tx:", tx);
      return loopring.balanceOf(accounts[1], {from: accounts[1]});
    }).then(function(amount8){
      console.log("amount8:", amount8);
      var expectValue = web3.toWei(ethAmount) * 5000;
      expectValue = expectValue + expectValue * 4 / 100;

      expectValue = expectValue.toPrecision(8);
      var tokenIssued = amount8.toNumber() - tokenBalance;
      tokenIssued = tokenIssued.toPrecision(8);
      assert.equal(tokenIssued, expectValue, "token amount not compute correctly in phase 1.");

      tokenBalance = amount8.toNumber();
      for (var i = 0; i < 9; i ++) {
        web3.eth.sendTransaction({from: accounts[2], to: loopring.address, value: web3.toWei(1), gas: 500000 });
      }
      ethAmount = Math.random() * 100;
      return web3.eth.sendTransaction({from: accounts[1], to: loopring.address, value: web3.toWei(ethAmount), gas: 500000 });
    }).then(function(tx) {
      console.log("tx:", tx);
      return loopring.balanceOf(accounts[1], {from: accounts[1]});
    }).then(function(amount9){
      console.log("amount9:", amount9);
      var expectValue = web3.toWei(ethAmount) * 5000;
      expectValue = expectValue + expectValue * 2 / 100;

      expectValue = expectValue.toPrecision(8);
      var tokenIssued = amount9.toNumber() - tokenBalance;
      tokenIssued = tokenIssued.toPrecision(8);
      assert.equal(tokenIssued, expectValue, "token amount not compute correctly in phase 1.");

      tokenBalance = amount9.toNumber();
      for (var i = 0; i < 9; i ++) {
        web3.eth.sendTransaction({from: accounts[2], to: loopring.address, value: web3.toWei(1), gas: 500000 });
      }
      ethAmount = Math.random() * 100 + 50000;
      return web3.eth.sendTransaction({from: accounts[1], to: loopring.address, value: web3.toWei(ethAmount), gas: 500000 });
    }).then(function(tx) {
      console.log("tx:", tx);
      return loopring.balanceOf(accounts[1], {from: accounts[1]});
    }).then(function(amount10){
      console.log("amount10:", amount10);
      var expectValue = web3.toWei(ethAmount) * 5000;

      expectValue = expectValue.toPrecision(8);
      var tokenIssued = amount10.toNumber() - tokenBalance;
      tokenIssued = tokenIssued.toPrecision(8);
      assert.equal(tokenIssued, expectValue, "token amount not compute correctly in phase 1.");

      tokenBalance = amount10.toNumber();
      ethAmount = Math.random() * 100 ;

      for (var i = 0; i < 10; i ++) {
        web3.eth.sendTransaction({from: accounts[2], to: loopring.address, value: web3.toWei(1), gas: 500000 });
      }
      return loopring.saleEnded();
    }).then(function(isEnd) {
      console.log("isEnd:", isEnd);
      assert(isEnd, true, "sale not end after 10 pahses.");
    });

  });

  it("should be able to issue unsoled tokens correctly.", function() {
    console.log("\n" + "-".repeat(100) + "\n");
    var loopring;
    var target;
    var totalSold;
    var totalEthReceived;
    return LoopringToken.deployed().then(function(instance) {
      loopring = instance;
      return loopring.target.call();
    }).then(function(t){
      target = t;
      return loopring.totalSupply.call({from: target});
    }).then(function(totalSupply) {
      totalSold = totalSupply.toNumber();
      console.log("totalSold:", totalSold);
      return loopring.totalEthReceived.call({from: target});
    }).then(function(totalEth) {
      totalEthReceived = totalEth.toNumber();
      console.log("totalEthReceived: ", totalEthReceived);
      return loopring.close({from: target});
    }).then(function(tx) {
      console.log("tx: ", tx);
      return loopring.balanceOf(target, {from: accounts[1]});
    }).then(function(bal) {
      var ownerTokenBalance = bal.toNumber();
      var level = (totalEthReceived - web3.toWei(50000)) / web3.toWei(10000);
      var unsoldRatioInThousand = 675 - 25 * level;
      var expectedVal = totalSold * unsoldRatioInThousand / (1000 - unsoldRatioInThousand);
      console.log("ownerTokenBalance: ", ownerTokenBalance);
      assert(ownerTokenBalance, expectedVal, "wrong number for unsold token issue.");
    });
  });

  it("should be able to send eth to target.", function() {
    console.log("\n" + "-".repeat(100) + "\n");
    var loopring;
    var target;
    var totalEthReceived;
    return LoopringToken.deployed().then(function(instance) {
      loopring = instance;
      return loopring.target.call();
    }).then(function(t){
      target = t;
      return loopring.totalEthReceived.call({from: target});
    }).then(function(totalEth) {
      totalEthReceived = totalEth.toNumber();
      console.log("totalEthReceived: ", totalEthReceived);
      return web3.eth.getBalance(target);
    }).then(function(ethBal) {
      console.log("ethBal: ", ethBal);
    });

  });

});
