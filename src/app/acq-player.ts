import { CenterText, UtilButton, type TextInRectOptions, type UtilButtonOptions } from "@thegraid/easeljs-lib";
import { Player, type PlayerPanel } from "@thegraid/hexlib";
import { AcqTile as Tile } from "./acq-tile";
import { type Corp } from "./corp";
import { GamePlay } from "./game-play";
import { AcqHex2 as Hex } from "./hex";
import { TP } from "./table-params";
function nf(n: number) { return `${n !== undefined ? (n === Math.floor(n)) ? n : n.toFixed(1) : ''}`; }

class BuyButton extends UtilButton {
  constructor(public panel: PlayerPanel, public labelFunc: () => string, opts: UtilButtonOptions & TextInRectOptions & { row?: number, col?: number }) {
    super(labelFunc(), opts)
    this.init(opts.row, opts.col); // opts = { row: 2, col: corp.rank }
  }

  init(row = 0, col = 0) {
    const panel = this.panel
    const { dir, dydr, wide, gap } = panel.metrics, ncol = 5;
    const cwide = wide / ncol;
    {
      // reset label: Text bounds:
      const fs = this.label.getMeasuredLineHeight(), bdr = this.dx0; // .3 or from opts
      const { x, y, width, height } = this.label.getBounds();
      const twidth = cwide - gap - (2 * fs * bdr), dx = (twidth - width) / 2;
      this.label.setBounds(x - dx, y, twidth, height);
      this.setBounds(undefined, 0, 0, 0);
      this.paint(undefined, true);
    }
    const di = (1 - dir) / 2, edge = di * wide;
    this.x = edge + cwide * dir * (col + .9);
    this.y = dydr * (2 + row * .5);
    panel.addChild(this);
  }
}
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
    // console.log(stime(this, `.newTile: ${this.Aname}`), this.acqTiles.map(t => t?.Aname), this.acqTiles)
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
    super.makePlayerBits(); // coinCounter
    this.coins = 6000
    this.makeTileRack();
    this.addToPanel();
    {
      // test buy:
      this.gamePlay.corpMgr.allCorps.forEach(corp => {
        const num = corp.buy(this, 1);
      })
    }
    this.updateBuyLabels()
  }

  updateBuyLabels() {
    this.gamePlay.corpMgr.allCorps.forEach(corp => {
      this.setBuyLabel(corp);
    })
    this.showTotals();
  }

  xyFromMap(row = 0, col = 0, panel = this.panel, map = this.gamePlay.hexMap) {
    const xywh = Hex.xywh(undefined, undefined, row, col)
    const xy = map.mapCont.hexCont.localToLocal(xywh.x, xywh.y, panel, xywh); // offset from hexCont to panel
    return xywh;
  }

  makeTileRack() {
    this.tileRack.length = 0;
    const panel = this.panel, ndx = this.index;
    const map = this.gamePlay.hexMap, row = .73, n = 6 - 1;
    const { x, y } = this.xyFromMap(0, 0); // offset from hexCont to panel
    const { wide } = panel.metrics
    const { x: xn } = Hex.xywh(undefined, undefined, 0, n)
    const dx = (wide - xn) / 2;
    for (let i = 0; i <= n; i++) {
      const hex = new Hex(map, row, i, `${ndx}H${i}`) // not on map!
      this.tileRack.push(hex);
      hex.cont.x += (-x + dx);
      hex.cont.y += (-y + 0);
      hex.cont.visible = false;
      hex.legalMark.setOnHex(hex)
      // panel.addChild(hex.cont)
    }
  }
  // TODO: subclass PlayerPanel, do it there..
  // `Cash: ${this.coins}` `Stock: ${sharesValue}` `Total: ${..}`
  // for each rank: `${Corp} ${shares}@${price}` [Button with popup: Buy]
  addToPanel() {
    const panel = this.panel;
    const r0 = [0, 0, 0];
    this.gamePlay.corpMgr.allCorps.forEach(corp => {
      const opts = { bgColor: corp.color, visible: true, row: r0[corp.rank], col: corp.rank, fontSize: TP.hexRad * .4 };
      const plyr = this, lfunc = () => `${corp.shares(plyr)}@${corp.price}`
      const box = new BuyButton(panel, lfunc, opts)
      this.buyButtons.set(corp, box);
      box.labelFunc();
      r0[corp.rank] += 1
    })
    this.makeTotal()
  }
  // TODO: use BuyButton; with transp bgColor, no click
  totals = [] as CenterText[];
  totalfs = [
    () => `Cash: ${this.coins}`,
    () => `Stock: ${this.sharesValue}`,
    () => `Total: ${this.sharesValue + this.coins}`,
  ]
  makeTotal() {
    const panel = this.panel, col = 2, fs = TP.hexRad * .4;;
    const cashBox = new CenterText(this.totalfs[0](), fs)
    const stockBox = new CenterText(this.totalfs[1](), fs)
    const totalBox = new CenterText(this.totalfs[2](), fs)
    const totals = this.totals = [cashBox, stockBox, totalBox] as CenterText[];
    const { dxdc, dydr } = this.xyFromMap(0, 0)
    totals.forEach((box, i) => {
      box.y = dydr * (i * .5 + 2);
      box.x = dxdc * (col * panel.dir + panel.wide / 2);
      panel.addChild(box)
    })
    return;
  }
  showTotals() {
    this.totals.forEach((box, i) => { box.text = `${this.totalfs[i]()}` })
  }

  buyButtons = new Map<Corp, BuyButton>();

  setBuyLabel(corp: Corp) {
    const box = this.buyButtons.get(corp);
    if (box) box.label_text = box.labelFunc();
  }

  get corpShares() {
    const rv = this.gamePlay.corpMgr.allCorps.map(cv => [cv, cv.shares(this)] as [Corp, number]).filter((s, v) => (v > 0));
    return rv;
  }
  get sharesValue() {
    // const rv = this.gamePlay.corpMgr.allCorps.reduce((pv, cv) => pv + cv.shares(this), 0);
    const rv = this.corpShares.reduce((pv, [corp, num]) => (pv + num * corp.price), 0);
    return rv;

  }

  /** pick new Corp from available; or surviver of merge */
  chooseCorp(corps: Corp[]) {
    // TODO: GUI
    return corps[0]; // the 'oldest' Corp
  }
}
