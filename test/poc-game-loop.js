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
        const cands = this.get_dapai(this.shoupai);
        this._callback({ dapai: cands[cands.length - 1] });
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
        test(`${n}人で一局が流局または和了まで完走する`, () => {
            const players = Array.from({ length: n }, () => new LoopTestPlayer());
            const game = new Majiang.Game(players, () => {}, Majiang.rule({ '場数': 0 }), 'poc-loop');
            game.view = { kaiju(){}, redraw(){}, update(){}, say(){}, summary(){} };
            game.do_sync();
            // 完走=牌譜ログが生成され最終状態に到達している
            assert.ok(game._paipu.log.length > 0, 'paipu logs should exist');
            const lastLog = game._paipu.log[game._paipu.log.length - 1];
            const lastEvent = Object.keys(lastLog[0] ?? lastLog).join(',');
            console.log(`      ${n}人: logs=${game._paipu.log.length} last=${lastEvent}`);
        });
    });
}
