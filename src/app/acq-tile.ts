import { C, F } from "@thegraid/common-lib";
import { CenterText, CircleShape, type Paintable } from "@thegraid/easeljs-lib";
import { HexShape, Tile, TileSource, type DragContext, type IHex2, type Table } from "@thegraid/hexlib";
import { AcqPlayer as Player, type AcqPlayer } from "./acq-player";
import type { Corp, CorpMgr } from "./corp";
import type { GamePlay } from "./game-play";
import { AcqHex2 as Hex2, type AcqHex2 } from "./hex";
import { TP } from "./table-params";
export class AcqTile extends Tile {
  declare static allTiles: AcqTile[];

  static source: TileSource<AcqTile>;

  // make a source for the given AcqTile[]
  static makeSource(hex: Hex2, tiles = AcqTile.allTiles) {
    const player = undefined as any as Player;
    const source = AcqTile.makeSource0(TileSource<AcqTile>, AcqTile, player, hex, 0);
    tiles.forEach(unit => source.availUnit(unit));
    source.nextUnit();  // unit.moveTo(source.hex)
    return source;
  }

  declare fromHex: AcqHex2
  declare gamePlay: GamePlay;

  constructor(Aname: string, player?: Player) {
    super(Aname, player);
    this.corpCircle.y = this.radius / 2;
    this.addChild(this.corpCircle);
    this.sizeText.y = this.radius / 2;
    this.addChild(this.sizeText);
    this.paint(C.BLACK);
  }

  transp = 'rgba(0,0,0,0)'
  corpCircle = new CircleShape(this.transp, this.radius * .22, '');
  sizeText = new CenterText('', TP.hexRad * .2, 'WHITE');
  corp?: Corp;
  setCorp(corp: Corp) {
    this.corp = corp;
  }
  showSize() {
    if (this.corp) {
      this.sizeText.text = `${this.corp.size}`;
      if (this.corp.size == 10) this.corpCircle.paint(C.grey);
      if (this.corp.size >= 11) this.corpCircle.paint(C.BLACK);
    }
  }

  override makeShape(): Paintable {
    return new HexShape()
  }

  // do NOT replace(/-/, '\n')
  override addTextChild(y0 = this.radius / 2, text = this.Aname, size = Tile.textSize, vis = false) {
    return super.addTextChild(y0, text, size, vis);
  }

  override textVis(vis?: boolean): void {
    this.nameText.color = 'WHITE';
    this.nameText.font = F.fontSpec(30)
    this.nameText.y = 0;
    super.textVis(true); // always show tile name
  }

  /** true if this.hex is in curPlayer.tileRack AND toHex, if given, is ALSO in tileRack. */
  onRack(toHex?: Hex2): false | [number, number] {
    const player = this.gamePlay.curPlayer as AcqPlayer;
    const rack = player.tileRack;
    const onRack = rack.includes(this.fromHex) && (toHex ? rack.includes(toHex) : true);
    return onRack && [rack.indexOf(this.fromHex), toHex ? rack.indexOf(toHex) : 0];
  }

  override markLegal(table: Table, setLegal = (hex: IHex2) => { hex.isLegal = false; }, ctx: DragContext = table.dragContext) {
    const allPlayers = Player.allPlayers;
    allPlayers.forEach(plyr => plyr.tileRack.forEach(setLegal))
    table.hexMap.forEachHex(setLegal);
  }

  // todo: check for joining 2 'safe' Corps.
  override isLegalTarget(toHex: Hex2, ctx?: DragContext): boolean {
    const toMap = (this.Aname == toHex.distText.text);
    const xMap = toMap && ((this.hex?.isOnMap && ctx?.lastShift) ?? false); // allow reposition
    const canAdd = toMap && (!toHex.tile) && this.gamePlay.corpMgr.canAdd(toHex);
    const onRack = !!this.onRack(toHex);
    return canAdd || onRack || xMap;
  }
  override cantBeMovedBy(player: AcqPlayer, ctx: DragContext): string | boolean | undefined {
    return (ctx?.lastShift || player.tileRack.includes(this.fromHex) || this.player === player) ? undefined : 'Not your Tile';
  }

  markCorp(mgr: CorpMgr, hexAry: AcqHex2[]) {
    let color = this.transp, white = C.WHITE;
    const hexes = hexAry.filter(toHex => this.isLegalTarget(toHex))
    if (hexes.length == 0) color = 'pink';
    const corps = mgr.allCorps.filter(corp => hexes.find(hex => corp.moats.has(hex)))
    if (corps.length > 1) {
      color = white;
    } else {
      if (corps.length == 1) color = corps[0].color;
      const inNew = hexes.find(hex => mgr.inNewCorp(hex).length > 0 && !corps.find(corp => corp.moats.has(hex)));
      if (inNew) color = white;
    }
    this.corpCircle.paint(color);
    return color;
  }

  slideRack(targetHex: Hex2) {
    const onRack = this.onRack(targetHex)
    if (!!onRack && !!targetHex.occupied) {
      // if drop rack->rack; slide other tiles out of the way
      const [it, io] = onRack;
      const player = this.gamePlay.curPlayer as AcqPlayer;
      const rack = player.tileRack;
      if (it < io) {
        for (let i = it; i < io; i++) {
          // [?, it, ?, ?, io, ?] ==> [?, ?, ?, io, it, ?]
          rack[i + 1].tile?.moveTo(rack[i]);
          continue;
        }
      } else {
        for (let i = it; i > io; i--) {
          // [?, io, ?, ?, it, ?] ==> [?, it, io, ?, ?, ?]
          rack[i-1].tile?.moveTo(rack[i]);
          continue;
        }
      }
      rack.map((hex, i) => {
        if (i !== io && hex.tile && hex.tile.hex !== hex) debugger;
      })
    }
  }

  override dropFunc(targetHex: IHex2, ctx: DragContext): void {
    this.slideRack(targetHex as Hex2);
    super.dropFunc(targetHex, ctx);
    this.gamePlay.doPlayerMove(targetHex, this);
  }
}
