import { stime } from "@thegraid/common-lib";
import { Player } from "@thegraid/hexlib";
import { AcqTile as Tile } from "./acq-tile";
import type { Corp } from "./corp";
import { GamePlay } from "./game-play";
import { AcqHex2 as Hex } from "./hex";
import { TP } from "./table-params";

export class AcqPlayer extends Player {
  declare static allPlayers: AcqPlayer[];
  declare gamePlay: GamePlay;

  get acqTiles() {
    return this.tileRack.map(hex => hex.tile as Tile)
  }

  /** TODO: stash tile on Player's panel, in empty hex. */
  drawTile() {
    const rack = this.tileRack.find(hex => !hex.tile) as Hex;
    if (!rack) return;
    const tile = Tile.source.takeUnit();
    tile?.placeTile(rack);
    console.log(stime(this, `.newTile: ${this.Aname}`), this.acqTiles.map(t => t?.Aname), this.acqTiles)
    return !!tile;
  }


  readonly tileRack: Hex[] = [];
  /**
   * 6 tiles, $coins, Certs for up to 7 companies.
   *
   * start: $6000
   * max 25 Certs per corp.
   */
  override makePlayerBits(): void {
    this.makeTileRack();
  }

  makeTileRack() {
    this.tileRack.length = 0;
    const panel = this.panel, map = this.gamePlay.hexMap;
    const xy = map.mapCont.hexCont.localToLocal(0, 0, panel); // offset from hexCont to panel
    for (let i = 0; i < 6; i++) {
      const hex = new Hex(map, .75, i, `H${i}`) // not on map!
      hex.cont.visible = false;
      this.tileRack.push(hex);
      hex.cont.x += (-xy.x + TP.hexRad);
      hex.cont.y += (-xy.y + 0);
      hex.legalMark.setOnHex(hex)
      // panel.addChild(hex.cont)
    }
  }

  /** pick new Corp from available; or surviver of merge */
  chooseCorp(corps: Corp[]) {
    // TODO: GUI
    return corps[0]; // the 'oldest' Corp
  }
}
