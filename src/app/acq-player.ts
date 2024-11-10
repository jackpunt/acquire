import { Player } from "@thegraid/hexlib";
import type { AcqTile } from "./acq-tile";
import { stime } from "@thegraid/common-lib";

export class AcqPlayer extends Player {
  acqTiles: AcqTile[] = [];

  /** TODO: stash tile on Player's panel, in empty hex. */
  newTile(tile: AcqTile) {
    this.acqTiles.push(tile)
    console.log(stime(this, `.newTile: ${this.Aname}`), this.acqTiles)
  }
}
