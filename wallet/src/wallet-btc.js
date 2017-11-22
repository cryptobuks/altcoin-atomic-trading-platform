"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = require("./config/config");
var config_btc_1 = require("./config/config-btc");
var Mnemonic = require('bitcore-mnemonic');
var bitcore = require('bitcore');
var HDPrivateKey = bitcore.HDPrivateKey;
var PrivateKey = bitcore.PrivateKey;
var BtcWallet = (function () {
    function BtcWallet(code, regenerate) {
        if (regenerate === void 0) { regenerate = false; }
        if (regenerate === true) {
            this.hdPrivateKey = new HDPrivateKey(code);
        }
        else {
            var valid = Mnemonic.isValid(code);
            if (!valid) {
                throw Error('Not valid mnemonic code');
            }
            this.code = new Mnemonic(code);
        }
        this.derived = {};
        this.addressess = {};
    }
    BtcWallet.prototype.generateHDPrivateKey = function (passPhrase) {
        this.hdPrivateKey = this.code.toHDPrivateKey(passPhrase, config_1.BtcRpcConfiguration.network);
        return this.hdPrivateKey;
    };
    BtcWallet.prototype.deriveHdPrivateKey = function (deriveArg) {
        if (!this.hdPrivateKey) {
            throw new Error('No HdPrivateKey found to derive from, did you mean to use generateHDPrivateKey() ?');
        }
        var derived = this.hdPrivateKey.derive(deriveArg);
        this.derived[deriveArg] = derived;
        return derived;
    };
    BtcWallet.prototype.generateAddress = function (hdPublicKey) {
        if (!hdPublicKey) {
            throw new Error('hdPublicKey required to generate address');
        }
        var address = hdPublicKey.publicKey.toAddress();
        this.addressess[hdPublicKey] = address;
        return address;
    };
    BtcWallet.prototype.generateAddressFromWif = function (wif) {
        var WIF = new PrivateKey(wif);
        return WIF.toPublicKey().toAddress(config_btc_1.BtcConfiguration.network);
    };
    BtcWallet.prototype.getDerived = function () {
        return this.derived;
    };
    return BtcWallet;
}());
exports.BtcWallet = BtcWallet;