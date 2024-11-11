import { stime } from "@thegraid/common-lib";
import { Player } from "@thegraid/hexlib";
import { AcqTile } from "./acq-tile";
import { AcqHex2 } from "./hex";

export class AcqPlayer extends Player {
  declare static allPlayers: AcqPlayer[];

  get acqTiles() {
    return this.tileRack.map(hex => hex.tile as AcqTile)
  }

  /** TODO: stash tile on Player's panel, in empty hex. */
  drawTile() {
    const rack = this.tileRack.find(hex => !hex.tile) as AcqHex2;
    if (!rack) return;
    const tile = AcqTile.source.takeUnit();
    tile.placeTile(rack);
    console.log(stime(this, `.newTile: ${this.Aname}`), this.acqTiles.map(t => t?.Aname), this.acqTiles)
  }

  /**
   *
   * @param 2 <= n <= 41;
   * @param size 0, 1, 2;
   * @returns
   */
  price(n: number, size: number) {
    const nd = Math.floor((n + 59) / 10); // nd: 6, 7, 8, 9, 10
    const nn = (n < 6 ? n : nd);
    return (size + nn) * 100;
  }
  /** red(Sackson), yellow(Zeta) */
  smal2 = {2: 200, 3: 300, 4: 400, 5: 500, '6-10': 600, '11-20': 700, '21-30': 800, '31-40': 900, 41: 1000 };
  /** blue(America), green(Fusion), tan(Hydra) */
  mid3 = {2: 300, 3: 400, 4: 500, 5: 600, '6-10': 700, '11-20': 800, '21-30': 800, '31-40': 1000, 41: 1100 };
  /** purple(Phoenix), teal(Quantum) */
  big2 = {2: 400, 3: 500, 4: 600, 5: 700, '6-10': 800, '11-20': 900, '21-30': 1000, '31-40': 1100, 41: 1200 };

  readonly tileRack: AcqHex2[] = [];
  /**
   * 6 tiles, $coins, Certs for up to 7 companies.
   *
   * start: $6000
   * max 25 Certs per corp.
   */
  override makePlayerBits(): void {
    this.tileRack.length = 0;
    const panel = this.panel, map = this.gamePlay.hexMap;
    const xy = map.mapCont.hexCont.localToLocal(0, 0, panel); // offset from hexCont to panel
    for (let i = 0; i < 6; i++) {
      const hex = new AcqHex2(map, 2, i, `H${i}`) // not on map!
      hex.cont.visible = false;
      this.tileRack.push(hex);
      hex.cont.x -= xy.x
      hex.cont.y -= xy.y;
      hex.legalMark.setOnHex(hex)
      // panel.addChild(hex.cont)
    }
  }
}
