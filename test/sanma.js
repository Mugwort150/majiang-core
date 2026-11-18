const assert = require('assert');

const Majiang = require('../dev/');

const RULE3 = () => Majiang.rule({
    '人数':   3,
    '場数':   1,
    '赤牌':   { m: 0, p: 0, s: 0 },
    '役満パオあり': false,
    '連荘方式': 0,
});

class AutoPlayer {
    action(msg, callback) { if (callback) callback({}); }
}

function param3(menfeng, changbang = 0, rule = RULE3()) {
    return {
        rule:       rule,
        zhuangfeng: 0,
        menfeng:    menfeng,
        hupai:      {},
        baopai:     [],
        jicun:      { changbang: changbang, lizhibang: 0 },
    };
}

// 門前ツモ(1) + 三暗刻(2) + 三色同刻(2) = 5翻 満貫(base 2000)の手
function tsumo_mangan() {
    return Majiang.Shoupai.fromString('m999p999p456s1199').zimo('s9');
}
// 三暗刻(2) + 三色同刻(2) = 4翻 60符 満貫のロン手
function ron_mangan() {
    return Majiang.Shoupai.fromString('m999p999s999z11p23');
}

suite('三人戦', ()=>{

    suite('Majiang.rule', ()=>{
        test('デフォルトが三人戦用になること', ()=>{
            const rule = RULE3();
            assert.equal(rule['人数'], 3);
            assert.equal(rule['配給原点'], 35000);
            assert.equal(rule['返し点'], 40000);
            assert.equal(rule['ノーテン罰点'], 2000);
            assert.equal(rule['本場支払点'], 100);
            assert.deepEqual(rule['順位点'], ['20.0','0.0','-20.0']);
            assert.equal(rule['役満パオあり'], false);
        });
        test('デフォルトが四人戦を変えないこと', ()=>{
            const rule = Majiang.rule();
            assert.equal(rule['人数'], 4);
            assert.equal(rule['配給原点'], 25000);
            assert.equal(rule['返し点'], 30000);
            assert.equal(rule['ノーテン罰点'], 3000);
            assert.equal(rule['役満パオあり'], true);
            assert.deepEqual(rule['赤牌'], { m: 1, p: 1, s: 1 });
        });
        test('不正な人数は例外となること', ()=>{
            assert.throws(()=> Majiang.rule({ '人数': 2 }), RangeError);
            assert.throws(()=> Majiang.rule({ '人数': 5 }), RangeError);
        });
        test('三人戦の役満パオは例外となること', ()=>{
            assert.throws(()=> Majiang.rule(
                { '人数': 3, '役満パオあり': true }));
        });
        test('順位点の要素数が人数と違えば例外となること', ()=>{
            assert.throws(()=> Majiang.rule(
                { '人数': 3, '順位点': ['20.0','10.0','-10.0','-20.0'] }));
            assert.throws(()=> Majiang.rule(
                { '人数': 4, '順位点': ['20.0','0.0','-20.0'] }));
        });
        test('三人戦で赤萬子は例外となること', ()=>{
            assert.throws(()=> Majiang.rule(
                { '人数': 3, '赤牌': { m: 1, p: 0, s: 0 } }));
        });
        test('本場支払点100以外は例外となること', ()=>{
            assert.throws(()=> Majiang.rule({ '本場支払点': 300 }));
            assert.throws(()=> Majiang.rule(
                { '人数': 3, '本場支払点': 1000 }));
        });
    });

    suite('Majiang.Shan', ()=>{
        test('三人戦は108枚・萬子2〜8なし・王牌14枚', ()=>{
            const shan = new Majiang.Shan(RULE3());
            const all  = shan._pai.concat();
            assert.equal(all.length, 108);
            assert.ok(! all.find(p=> p.match(/^m[2-8]/)));
            assert.ok(! all.find(p=> p == 'm0'));
            for (let p of ['m1','m9','p1','p9','s1','s9','z1','z7'])
                assert.equal(all.filter(x=> x == p).length, 4, p);
            for (let i = 0; i < 39; i++) shan.zimo();
            assert.equal(shan.paishu, 55);
        });
        test('三人戦のドラ表示牌は m1⇔m9', ()=>{
            assert.equal(Majiang.Shan.zhenbaopai('m1', RULE3()), 'm9');
            assert.equal(Majiang.Shan.zhenbaopai('m9', RULE3()), 'm1');
            assert.equal(Majiang.Shan.zhenbaopai('p5', RULE3()), 'p6');
            assert.equal(Majiang.Shan.zhenbaopai('z1', RULE3()), 'z2');
            assert.throws(()=> Majiang.Shan.zhenbaopai('m5', RULE3()));
            // 四人戦は従来どおり
            assert.equal(Majiang.Shan.zhenbaopai('m1', Majiang.rule()), 'm2');
            assert.equal(Majiang.Shan.zhenbaopai('m9', Majiang.rule()), 'm1');
        });
    });

    suite('Majiang.Util.tingpai', ()=>{
        test('三人戦では萬子2〜8を待ちに含まない', ()=>{
            const shoupai = Majiang.Shoupai.fromString(
                'm89p123s123z111z22');
            const wait4 = Majiang.Util.tingpai(shoupai, Majiang.Util.xiangting,
                                               Majiang.rule());
            assert.deepEqual(wait4, ['m7']);
            const wait3 = Majiang.Util.tingpai(shoupai, Majiang.Util.xiangting,
                                               RULE3());
            assert.deepEqual(wait3, []);
        });
        test('三人戦でも m1/m9 待ちはそのまま返る', ()=>{
            const shoupai = Majiang.Shoupai.fromString(
                'm11p123s123z111z22');
            assert.deepEqual(
                Majiang.Util.tingpai(shoupai, Majiang.Util.xiangting, RULE3()),
                ['m1','z2']);
        });
        test('三人戦でチーは常に不可', ()=>{
            const shoupai = Majiang.Shoupai.fromString('p34s123z111z22m199');
            assert.deepEqual(
                Majiang.Game.get_chi_mianzi(RULE3(), shoupai, 'p5-', 55), []);
            assert.ok(
                Majiang.Game.get_chi_mianzi(Majiang.rule(), shoupai,
                                            'p5-', 70).length > 0);
        });
    });

    suite('Majiang.Board', ()=>{
        test('三人戦の配牌は3席分で山は55', ()=>{
            const board = new Majiang.Board();
            board.kaiju({
                id: 0, rule: RULE3(), title: 'test',
                player: ['A','B','C'], qijia: 0,
            });
            board.qipai({
                zhuangfeng: 0, jushu: 0, changbang: 0, lizhibang: 0,
                defen: [35000,35000,35000], baopai: 'p1',
                shoupai: ['m111999p111s11z11', '', ''],
            });
            assert.equal(board.shan.paishu, 55);
            assert.equal(board.shoupai.length, 3);
            assert.equal(board.player_id.length, 3);
            assert.equal(board.defen.length, 3);
            assert.deepEqual([0,1,2].map(id=> board.menfeng(id)), [0,1,2]);
            board.jushu = 2;
            assert.deepEqual([0,1,2].map(id=> board.menfeng(id)), [1,2,0]);
        });
    });

    suite('Majiang.Util.hule(三人戦)', ()=>{
        test('子のツモ満貫は 4000+2000 = 6000点(ツモ損)', ()=>{
            const hule = Majiang.Util.hule(tsumo_mangan(), null, param3(1));
            assert.equal(hule.defen, 6000);
            assert.deepEqual(hule.fenpei, [-4000, 6000, -2000]);
        });
        test('親のツモ満貫は 4000+4000 = 8000点', ()=>{
            const hule = Majiang.Util.hule(tsumo_mangan(), null, param3(0));
            assert.equal(hule.defen, 8000);
            assert.deepEqual(hule.fenpei, [8000, -4000, -4000]);
        });
        test('子のツモ満貫・1本場は +6200/-4100/-2100', ()=>{
            const hule = Majiang.Util.hule(tsumo_mangan(), null, param3(1,1));
            assert.equal(hule.defen, 6000);
            assert.deepEqual(hule.fenpei, [-4100, 6200, -2100]);
        });
        test('子のロン満貫・1本場は +8300/-8300', ()=>{
            const shoupai = ron_mangan();
            assert.ok(! shoupai.toString().match(/m[2-8]/));
            const hule = Majiang.Util.hule(shoupai, 'p4+', param3(1,1));
            assert.equal(hule.fu, 60);
            assert.equal(hule.fanshu, 4);
            assert.equal(hule.defen, 8000);
            assert.deepEqual(hule.fenpei, [0, 8300, -8300]);
        });
        test('四人戦の分計は従来どおり(スナップショット)', ()=>{
            const rule4 = Majiang.rule({ '赤牌': { m: 0, p: 0, s: 0 } });
            let hule = Majiang.Util.hule(tsumo_mangan(), null, param3(1,0,rule4));
            assert.equal(hule.defen, 8000);
            assert.deepEqual(hule.fenpei, [-4000, 8000, -2000, -2000]);
            hule = Majiang.Util.hule(tsumo_mangan(), null, param3(0,0,rule4));
            assert.equal(hule.defen, 12000);
            assert.deepEqual(hule.fenpei, [12000, -4000, -4000, -4000]);
            hule = Majiang.Util.hule(ron_mangan(), 'p4+', param3(1,1,rule4));
            assert.equal(hule.defen, 8000);
            assert.deepEqual(hule.fenpei, [0, 8300, -8300, 0]);
        });
    });

    suite('Majiang.Game(三人戦)', ()=>{
        test('東風戦は東1〜3局で終局し点数総計・順位点が整合する', ()=>{
            let paipu;
            const players = [0,1,2].map(()=> new AutoPlayer());
            const game = new Majiang.Game(players, p => paipu = p,
                                          RULE3(), 'sanma-test');
            game.dwell = 0;
            game.do_sync();
            assert.ok(paipu);
            const jushu_list = paipu.log.map(log =>
                log.find(d=> d.qipai).qipai.jushu);
            assert.ok(jushu_list.every(j => j >= 0 && j <= 2),
                `jushu: ${jushu_list}`);
            assert.deepEqual([...new Set(jushu_list)].sort((a,b)=>a-b), [0,1,2]);
            assert.equal(paipu.defen.length, 3);
            assert.equal(paipu.defen.reduce((x,y)=> x + y), 105000);
            assert.equal(paipu.rank.length, 3);
            assert.deepEqual([...paipu.rank].sort((a,b)=>a-b), [1,2,3]);
            assert.equal(paipu.point.length, 3);
            const sum = paipu.point.reduce((x,y)=> x + +y, 0);
            assert.ok(Math.abs(sum) < 0.001, `point sum: ${sum}`);
            // 返し点40000で最下位のポイントが計算されていること
            const idx = paipu.rank.indexOf(3);
            const expected3 = (paipu.defen[idx] - 40000) / 1000 - 20;
            assert.ok(Math.abs(+paipu.point[idx] - expected3) < 0.051,
                `${paipu.point[idx]} vs ${expected3}`);
        });
        test('プレイヤー数が人数と不一致なら例外', ()=>{
            assert.throws(()=>
                new Majiang.Game([0,1,2,3].map(()=> new AutoPlayer()),
                                 null, RULE3()));
            assert.throws(()=>
                new Majiang.Game([0,1].map(()=> new AutoPlayer()),
                                 null, RULE3()));
        });
    });
});
