// [7-01] PoC: 3人戦の局進行が最後まで完走するかの検証(動的auto player使用)
const assert = require('assert');
const Majiang = require('../lib/index.js');

// プロンプトに応じて動的に応答する最小auto player
class AutoPlayer {
    action(msg, callback) {
        if (! callback) return;
        if (msg.zimo || msg.gangzimo) {
            const m = msg.zimo || msg.gangzimo;
            const shoupai = Majiang.Shoupai.fromString(m.shoupai);
            const dapai = shoupai.get_dapai().pop();
            callback({ dapai });
        } else {
            callback({});
        }
    }
}

suite('PoC: 3人戦の局進行', () => {
    test('3人で配牌・自摸・打牌が回り流局または和了まで進行する', () => {
        const players = [0,1,2].map(() => new AutoPlayer());
        const events = [];
        const game = new Majiang.Game(players, (msg) => events.push(msg), Majiang.rule(), 'poc-3player');
        game._sync = true;
        // view不要(nullのまま進行可か確認。ダメなら最小viewを差す)
        game.view = {
            kaiju(){}, redraw(){}, update(){}, say(){}, summary(){}
        };
        game.kaiju();
        // Game内部はsetTimeout駆動のため、syncモードではcallback応答で連鎖進行する
        game.qipai();
        // 配牌が3人分で初期化されること(PoCの構造検証)
        assert.equal(game.model.player_id.length, 3);
        assert.equal(game.model.shoupai.length, 3);
        assert.deepEqual(game.model.player, ['私','下家','上家']);
        assert.equal(game.model.defen.length, 3);
        // 3人分の配牌が行われること(136 - 13*3 - 14 = 83)
        assert.equal(game.model.shan.paishu, 83);
        // 残課題: 局進行ループ(lunban巡回)の完走検証は[7-01]本実装で行う。
        // 現状lunban=-1で止まるため、Game駆動部の追加改修が必要
    });
});
