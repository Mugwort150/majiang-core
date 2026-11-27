// [7-01] 検証: 人数パラメータ化後の局進行が3人/4人で完走するか
const assert = require('assert');
const Majiang = require('../lib/index.js');

// Player基底の抽象action_*を最小実装したCPU。思考は「最後の合法打牌を選ぶ」だけ
class LoopTestPlayer extends Majiang.Player {
    action_kaiju()   { if (this._callback) this._callback({}) }
    action_qipai()   { if (this._callback) this._callback({}) }
    action_zimo(zimo, gangzimo) {
        if (! this._callback) return;
        if (zimo.l != this._menfeng) return this._callback({});
        if (this.allow_hule(this.shoupai, null)) return this._callback({ hule: '*' });
        const cands = this.get_dapai(this.shoupai);
        this._callback({ dapai: cands[0] });
    }
    action_dapai()   { if (this._callback) this._callback({}) }
    action_fulou()   { if (this._callback) this._callback({}) }
    action_gang()    { if (this._callback) this._callback({}) }
    action_hule()    { if (this._callback) this._callback({}) }
    action_pingju(pingju) {
        if (! this._callback) return;
        if (pingju.shoupai[this._menfeng]) this._callback({ daopai: '-' });
        else this._callback({});
    }
    action_jieju()   { if (this._callback) this._callback({}) }
}

for (const n of [3, 4]) {
    suite(`PoC: ${n}人戦の局完走`, () => {
        test(`${n}人で一局が流局または和了まで完走する`, function() {
            this.timeout(30000);
            const players = Array.from({ length: n }, () => new LoopTestPlayer());
            const game = new Majiang.Game(players, () => {}, Majiang.rule({ '場数': 0 }), 'poc-loop');
            game.view = { kaiju(){}, redraw(){}, update(){}, say(){}, summary(){} };
            game.do_sync();
            // 完走=対局終了まで到達し、順位と点数が人数分確定している
            assert.ok(game._paipu.log.length > 0, 'paipu logs should exist');
            assert.strictEqual(game._paipu.rank.length, n, 'rank should cover all players');
            assert.strictEqual(game._paipu.point.length, n, 'point should cover all players');
            assert.ok(game._paipu.rank.every(r => r >= 1 && r <= n), 'rank values valid');
            const sum = game._paipu.point.reduce((x, y) => x + parseFloat(y), 0);
            assert.ok(Math.abs(sum) < 0.01, `point sum should be zero: ${sum}`);
            console.log(`      ${n}人: logs=${game._paipu.log.length} rank=${game._paipu.rank}`);
        });
    });
}
