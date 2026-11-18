/*
 *  Majiang.Shan
 */
"use strict";

const Majiang = { Shoupai: require('./shoupai') };

module.exports = class Shan {

    static zhenbaopai(p, rule) {
        if (! Majiang.Shoupai.valid_pai(p)) throw new Error(p);
        let s = p[0], n = + p[1] || 5;
        if (rule && (rule['人数'] ?? 4) == 3 && s == 'm') {
            if (n == 0 || (2 <= n && n <= 8)) throw new Error(p);
            return 'm' + (n == 1 ? 9 : 1);
        }
        return s == 'z' ? (n < 5  ? s + (n % 4 + 1) : s + ((n - 4) % 3 + 5))
                        : s + (n % 9 + 1);
    }

    constructor(rule) {

        this._rule = rule;
        let hongpai = rule['赤牌'];
        const sanma = (rule['人数'] ?? 4) == 3;

        let pai = [];
        for (let s of ['m','p','s','z']) {
            for (let n = 1; n <= (s == 'z' ? 7 : 9); n++) {
                if (sanma && s == 'm' && 2 <= n && n <= 8) continue;
                for (let i = 0; i < 4; i++) {
                    if (n == 5 && i < hongpai[s]) pai.push(s+0);
                    else                          pai.push(s+n);
                }
            }
        }

        this._pai = [];
        while (pai.length) {
            this._pai.push(pai.splice(Math.random()*pai.length, 1)[0]);
        }

        this._baopai     = [this._pai[4]];
        this._fubaopai   = rule['裏ドラあり'] ? [this._pai[9]] : null;
        this._weikaigang = false;
        this._closed     = false;
    }

    zimo() {
        if (this._closed)     throw new Error(this);
        if (this.paishu == 0) throw new Error(this);
        if (this._weikaigang) throw new Error(this);
        return this._pai.pop();
    }

    // 汎用拡張点: 山に通常の牌以外を混ぜる Shan 派生クラスが
    // 「引いた時点で公開され手番を消費する牌」を返せるようにする。
    // 消費牌は手牌に加えられない。
    is_consumed(p) { return false; }

    gangzimo() {
        if (this._closed)             throw new Error(this);
        if (this.paishu == 0)         throw new Error(this);
        if (this._weikaigang)         throw new Error(this);
        if (this._baopai.length == 5) throw new Error(this);
        this._weikaigang = this._rule['カンドラあり'];
        if (! this._weikaigang) this._baopai.push('');
        return this._pai.shift();
    }

    kaigang() {
        if (this._closed)                 throw new Error(this);
        if (! this._weikaigang)           throw new Error(this);
        this._baopai.push(this._pai[4]);
        if (this._fubaopai && this._rule['カン裏あり'])
            this._fubaopai.push(this._pai[9]);
        this._weikaigang = false;
        return this;
    }

    close() { this._closed = true; return this }

    get paishu() { return this._pai.length - 14 }

    get baopai() { return this._baopai.filter(x=>x) }

    get fubaopai() {
        return ! this._closed ? null
             : this._fubaopai ? this._fubaopai.concat()
             :                  null;
    }
}
