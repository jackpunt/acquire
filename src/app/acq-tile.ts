import { Tile, TileSource, type Player } from "@thegraid/hexlib";
import { AcqHex2 as Hex2 } from "./hex";

export class AcqTile extends Tile {

  static source: TileSource<AcqTile>;

  static makeSource(hex: Hex2, tiles: AcqTile[]) {
    const player = undefined as any as Player;
    const source = AcqTile.makeSource0(TileSource<AcqTile>, AcqTile, player, hex, 0);
    tiles.forEach(unit => source.availUnit(unit));
    source.nextUnit();  // unit.moveTo(source.hex)
    return source;
  }

  constructor(Aname: string, player?: Player) {
    super(Aname, player);
  }

  // do NOT replace(/-/, '\n')
  override addTextChild(y0 = this.radius / 2, text = this.Aname, size = Tile.textSize, vis = false) {
    return super.addTextChild(y0, text, size, vis);
  }
}
