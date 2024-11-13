import { AcqHex as Hex } from "./hex";
import type { AcqPlayer } from "./acq-player";
import type { AcqTile } from "./acq-tile";
import { C } from "@thegraid/common-lib";

/** expect GameSetup/GamePlay/Table to have a singleton CorpMgr */
export class CorpMgr {
  allCorps: Corp[] = [];
  get activeCorps() { return this.allCorps.filter(corp => corp.size > 0) }
  get soldOut() { return this.activeCorps.length >= this.corpSpecs.length }

  makeAllCorps() {
    this.allCorps.length = 0;
    this.activeCorps.length = 0;
    this.corpSpecs.forEach(spec => this.allCorps.push(new Corp(this, spec.name, spec.rank, spec.color)))
  }
  /**
   *
   * @param n number of hexes [2 <= n <= 41];
   * @param rank 0, 1, 2;
   * @returns price per share
   */
  price(n0: number, rank: number) {
    const n = Math.min(n0, 41);
    if (n < 2) return 0;
    const nd = Math.floor((n + 59) / 10); // nd: 6, 7, 8, 9, 10
    const nn = (n < 6 ? n : nd);
    return (rank + nn) * 100;
  }
  // sml2 = { 2: 200, 3: 300, 4: 400, 5: 500, '6-10': 600, '11-20': 700, '21-30': 800, '31-40': 900, 41: 1000 };
  // mid3 = { 2: 300, 3: 400, 4: 500, 5: 600, '6-10': 700, '11-20': 800, '21-30': 900, '31-40': 1000, 41: 1100 };
  // big2 = { 2: 400, 3: 500, 4: 600, 5: 700, '6-10': 800, '11-20': 900, '21-30': 1000, '31-40': 1100, 41: 1200 };

  corpSpecs = [
    { name: 'Sackson', color: 'Crimson', rank: 0 },
    { name: 'Zeta', color: 'gold', rank: 0 },
    { name: 'America', color: 'RoyalBlue', rank: 1 },
    { name: 'Fusion', color: 'green', rank: 1 },
    { name: 'Hydra', color: 'DarkOrange', rank: 1 },
    { name: 'Phoenix', color: 'DarkOrchid', rank: 2 },
    { name: 'Quantum', color: 'DarkCyan', rank: 2 },
  ]

  /** return [single] Hexes joining new Corp */
  inNewCorp(hex: Hex) {
    return hex.linkHexes.filter(lh => !!lh?.tile) as Hex[];
  }

  /** false if hex would join two or more safe Corps */
  canAdd(hex: Hex) {
    const corps = this.allCorps.filter(corp => corp.moats.has(hex));
    const twoSafe = (corps.filter(corp => corp.isSafe).length >= 2);
    const tooMany = (corps.length == 0) && this.inNewCorp(hex).length > 0 && this.soldOut;
    return !(twoSafe || tooMany);
  }

  makeCorp(inCorp: Hex[], plyr: AcqPlayer) {
    // Assert: canAdd(hex) verified !tooMany
    const avail = this.allCorps.filter(corp => corp.size == 0);
    const corp = plyr.chooseCorp(avail);
    inCorp.forEach(hex => corp.add(hex));
    return corp;
  }

  // adjust for newly added Hex on map:
  addHex(hex: Hex, plyr: AcqPlayer) {
    const corps = this.allCorps.filter(corp => corp.moats.has(hex));
    let corp: Corp;
    if (corps.length == 0) {
      const inCorp = this.inNewCorp(hex);
      if (inCorp.length == 0) return;     // no effect on Corps!
      corp = this.makeCorp(inCorp, plyr)  // show Corp on map
    } else if (corps.length == 1) {
      corp = corps[0]
    } else {
      corps.sort((a, b) => b.size - a.size); // descending
      const size = corps[0].size;
      const corpm = corps.filter(corp => corp.size === size); // all the biggest
      corp = (corpm.length > 1) ? plyr.chooseCorp(corpm) : corpm[0];
      const subs = corps.filter(sub => sub !== corp); // subsidiaries
      subs.forEach(sub => {
        sub.hexes.forEach(hex => corp.add(hex)); // absorb each hex from subs
        sub.clear();         // return to pool of available Corps
      })
      // TODO: payout to shareholders of subs!
      this.inNewCorp(hex).forEach(hex => corp.add(hex));
    }
    corp?.add(hex);
    corp?.calcMoat();
    corp?.hexes.forEach(hex => {
      const tile = hex.tile as AcqTile;
      tile.showSize();
    })
    return corp;
  }
}

export class Corp {
  // Corp ISA Set<Hex>; with a moat:
  readonly hexes: Set<Hex> = new Set<Hex>()
  readonly moats: Set<Hex> = new Set<Hex>()

  constructor(public mgr: CorpMgr, public Aname: string, public rank: number, public color: string) {

  }

  get size() { return this.hexes.size }
  get price() { return this.mgr.price(this.size, this.rank) }
  get isSafe() { return this.size >= 11 }
  _shares = 25;
  /** shares available */
  get available() { return this._shares; }
  shareMap: Map<AcqPlayer, number> = new Map();

  /** shares owned by Player */
  shares(player: AcqPlayer) {
    return this.shareMap.get(player) ?? 0;
  }
  buy(player: AcqPlayer, n = 1) {
    const max =  Math.min(n, this.available);
    const num = Math.min(max, Math.floor(player.coins / this.price));
    const cost = this.price * num;
    player.coins -= cost;
    this._shares -= num;
    const balance = num + this.shares(player);
    this.shareMap.set(player, balance);
    return balance;
   }

   sell(player: AcqPlayer, n = 25) {
    const own = this.shares(player);
    const num = Math.max(n, own);
    const cost = this.price * num;
    player.coins += cost;
    this._shares += num;
    const balance = own - num;
    this.shareMap.set(player, balance);
   }

  calcMoat() {
    this.moats.clear();
    this.hexes.forEach(hex => {
      hex.linkHexes.forEach(lhex => {
        if (lhex?.tile) {
          // check for unincorporated adjacent hexes [from turn0 placements!]
          if (!this.hexes.has(lhex)) {
            this.add(lhex); // QQQ: will this.hexes.forEach() find & include this new addition?
          }
        } else {
          this.moats.add(lhex as Hex)
        }
      });
    })
    this.hexes.forEach(hex => this.moats.delete(hex));
  }
  clear() {
    this.hexes.clear();
    this.moats.clear();
  }
  add(hex: Hex) {
    this.hexes.add(hex);
    const tile = hex.tile as AcqTile;
    tile?.setCorp(this);
    tile?.showSize();
    tile?.paint(this.color);
  }
  has(hex: Hex) {
    this.hexes.has(hex);
  }
  joins(hex: Hex) {
    this.moats.has(hex);
  }
}

export class Cert {
  constructor(public corp: Corp, public shares = 1) {

  }
  get value() {
    return this.corp.price * this.shares;
  }
}
