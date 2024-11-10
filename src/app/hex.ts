import { H, Hex1 as Hex1Lib, Hex2 as Hex2Lib, Hex2Mixin, HexDir, Hex as HexLib, HexM, HexMap as HexMapLib, HexM as HexMLib } from "@thegraid/hexlib";
import { TP } from "./table-params";
import { AcqTile } from "./acq-tile";

/** Base Hex, has no connection to graphics.
 *
 */
export class AcqHex extends Hex1Lib {
  // constructor(map: HexMapLib<HexLib>, row: number, col: number, name?: string) {
  //   super(map, row, col, name);
  // }
}

export class AcqHex2Lib extends Hex2Mixin(AcqHex) { }

/** One Hex cell in the game, shown as a polyStar Shape */
export class AcqHex2 extends AcqHex2Lib {
  isAcqHex2 = true;
  /** Hex2 cell with graphics; shown as a polyStar Shape of radius @ (XY=0,0) */
  constructor(map: HexMLib<HexLib>, row: number, col: number, name?: string) {
    // AcqHex2() { super(); }
    // AcqHex2.super(...) == MatHex2Lib(...) -> Hex2Impl()
    // Hex2Impl() { super() == AcqHex() -> Hex1(); Hex2Impl.consCode(...) }
    // Hex2Impl.consCode() == override AcqHex2.consCode() { super.consCode() == Hex2Imp.consCode(); ... }
    super(map, row, col, name);
  }
  override showText(vis = !this.rcText.visible) {
    this.rcText.visible = vis;
    this.cont.updateCache();
  }
  // Mixin idiom compiles type 'this' into type 'any'; so must redeclare proper signatures:
  // because: new(...args: any[]) {...} is not a class, has no instances, so no 'this' value/type.

  override forEachLinkHex(func: (hex: this | undefined, dir: HexDir | undefined, hex0: this) => unknown, inclCenter = false) {
    super.forEachLinkHex(func)
  }
  override findLinkHex(pred: (hex: this | undefined, dir: HexDir, hex0: this) => boolean) {
    return super.findLinkHex(pred)
  }
  override findInDir(dir: HexDir, pred: (hex: this, dir: HexDir, hex0: this) => boolean): this | undefined {
    return super.findInDir(dir, pred)
  }
  override hexesInDir(dir: HexDir, rv: this[] = []): this[] {
    return super.hexesInDir(dir, rv)
  }
  override forEachHexDir(func: (hex: this, dir: HexDir, hex0: this) => unknown) {
    super.forEachHexDir(func);
  }
  override nextHex(dir: HexDir, ns: number = 1): this | undefined {
    return super.nextHex(dir, ns) as this | undefined;
  }
  override lastHex(ds: HexDir): this {
    return super.lastHex(ds)
  }

  override constructorCode(map: HexMLib<Hex2Lib>, row: number, col: number, name?: string) {
    super.constructorCode(map, row, col, name);        // Hex2Impl.constructorCode()
    if (row === undefined || col === undefined) return // nextHex? recycleHex?
  }
  override setRcText(row: number, col: number, rcf = 14 * TP.hexRad/60) {
    super.setRcText(row, col, rcf)
    const rct = this.rcText
    rct.y -= rcf * 2; // raise it up more
  }
}

export class HexMap extends HexMapLib<AcqHex> implements HexM<HexLib> {
  override makeAllDistricts(nh?: number, mh?: number): AcqHex[] {
    const hexAry = super.makeAllDistricts(nh, mh)
    this.labelHexes()
    const allTiles = AcqTile.allTiles; // to view in debugger
    return hexAry
  }
  labelHexes() {
    const sectors = ['C', 'D', 'E', 'F', 'G', 'B', ]; // c/EN/NE, etc
    const ch = this.centerHex as AcqHex2;
    const cw = (radial:number) => sectors[radial]; // clockwise(NE)=>N
    const setText = (hex: AcqHex2, text: string) => {
      hex.distText.y = 0
      hex.distText.text = text;
      hex.distText.color = 'WHITE';
      hex.showText(true);
      new AcqTile(text);
    }
    setText(ch, 'A-0');
    AcqTile.allTiles.length = 0;

    // [NE, E, SE, SW, W, NW]
    H.ewDirs.forEach((dir, n) => {
      const d2 = H.ewDirs[(n + 2) % 6]; // NW -> E
      const sn = cw(n); // sector name
      const sn0 = dir;
      // For each of the hex0 on the 6 central axies:
      ch.hexesInDir(dir).forEach((hex0, dr) => {
        const label = `${sn}-${dr + 1}`;
        setText(hex0, label);
        // extend across the triangle
        hex0.hexesInDir(d2).slice(0, dr).forEach(hex => {
          setText(hex, label);
        })
      })
    })
  }
}
/** Marker class for HexMap used by GamePlayD */
export class HexMapD extends HexMap {

}
