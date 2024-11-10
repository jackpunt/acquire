import { permute, type XY, type XYWH } from "@thegraid/common-lib";
import type { ParamItem, ScaleableContainer } from "@thegraid/easeljs-lib";
import { ParamGUI } from "@thegraid/easeljs-lib";
import type { Container, Stage } from "@thegraid/easeljs-module";
import { GamePlay, IdHex, Scenario, Table as TableLib, Tile } from "@thegraid/hexlib";
import { AcqPlayer } from "./acq-player";
import { AcqTile } from "./acq-tile";
import type { AcqHex2 } from "./hex";
import { TP } from "./table-params";


/** to own file... */
class TablePlanner {
  constructor(gamePlay: GamePlay) {}
}

/** layout display components, setup callbacks to GamePlay.
 *
 */
export class Table extends TableLib {
  // override hexMap: HexMap & HexMapLib<IHex2>;

  constructor(stage: Stage) {
    super(stage);
  }
  // override gamePlay!: GamePlay;
  /** method invokes closure defined in enableHexInspector. */
  override toggleText(vis?: boolean) {
    const v = super.toggleText(vis)
    return v;
  }

  override layoutTable(gamePlay: GamePlay): void {
      super.layoutTable(gamePlay);
  }

  override layoutTable2() {
    this.initialVis = true;
    super.layoutTable2();
    const drawHex = this.newHex2(1, 1, 'drawHex') as AcqHex2;
    drawHex.distText.y = 0;
    // drawHex.cont.visible = false;
    permute(AcqTile.allTiles);
    AcqTile.makeSource(drawHex, AcqTile.allTiles);
    this.addDoneButton();
    return;
  }

  /**
   * last action of curPlayer is to draw their next tile.
   */
  override addDoneButton() {
    const rv = super.addDoneButton(undefined, 0, 50); // table.doneButton('Done')
    this.doneClick0 = this.doneClicked;
    this.doneClicked = (ev) => {
      this.playerDone(ev);
    };
    this.doneButton.activate(true)
    return rv;
  }
  doneClick0 = this.doneClicked;
  playerDone(evt: any) {
    const gp = GamePlay;
    const gamePlay = this.gamePlay;
    const curPlayer = gamePlay.curPlayer as AcqPlayer;
    const tile = AcqTile.source.takeUnit();
    curPlayer.newTile(tile);
    this.doneClick0(evt);
  }

  override layoutTurnlog(rowy = 8, colx?: number): void {
    super.layoutTurnlog(rowy, colx);
  }

  override panelLocsForNp(np: number): number[] {
    return [[], [0], [0, 2], [0, 1, 2], [0, 3, 4, 1], [0, 3, 4, 2, 1], [0, 3, 4, 5, 2, 1]][np];
  }

  override bindKeysToScale(scaleC: ScaleableContainer, ...views: XY[]): void {
    this.viewA.x = 442;
    const viewZ = { x: 240, y: -25, ssk: 'Z', isk: 'z', scale: 1.65 } // testing: 240->420, .65->1.65
    const viewX = { x: 240, y: -25, ssk: 'X', isk: 'x', scale: .8 }
    super.bindKeysToScale(scaleC, viewX, this.viewA, viewZ); // KeyBinder.keyBinder.setKey('z')
  }

  override makeGUIs(scale = TP.hexRad / 60, cx = -80, cy = 170, dy = 20) {
    super.makeGUIs(scale, cx, cy, dy);
  }
  override setupUndoButtons(xOffs: number, bSize: number, skipRad: number, bgr: XYWH, row = 8, col = -6): void {
    super.setupUndoButtons(xOffs, bSize, skipRad, bgr, row, col)
  }

  override makeParamGUI(parent: Container, x = 0, y = 0): ParamGUI {
    const gui = new ParamGUI(TP, { textAlign: 'right' });
    gui['Aname'] = gui.name = 'ParamGUI';

    const gameSetup = this.gamePlay.gameSetup;
    // idiom to sync TP-local to TP: mH, nH
    const setStateValue = (item: ParamItem) => {
      gui.setValue(item); // set in TP-local and GUI-Chooser
      TP.setParams(TP);   // move nHexes, hexRad into TP-lib
      const name = item.fieldName;
      const nh = (name === 'nHexes') ? TP.nHexes : TP.nHexes;
      // make game (and GUI) with new values:
      const state = { nh } as { nh?: number, dbp?: number, offP?: boolean }; // Scenario | HexAspect
      gameSetup.restart(state); // override GameSetup.resetState(state)
      return;
    }

    gui.makeParamSpec('hexRad', [30, 60, 90, 120], { fontColor: 'red' })
    gui.makeParamSpec('nHexes', [5, 6, 7, 8], { fontColor: 'red' })
    gui.spec("hexRad").onChange = setStateValue; TP.hexRad;
    gui.spec("nHexes").onChange = setStateValue; TP.nHexes;

    parent.addChild(gui)
    gui.x = x; gui.y = y;
    gui.makeLines();
    return gui;
  }

  override startGame(scenario: Scenario) {
    super.startGame(scenario); // allTiles.makeDragable()
    this.gamePlay.gameState.start();   // enable Table.GUI to drive game state.
  }
  // see also: ScenarioParser.saveState()
  // override logCurPlayer(curPlayer: Player) {
  //   const tn = this.gamePlay.turnNumber
  //   const robo = curPlayer.useRobo ? AT.ansiText(['red','bold'],"robo") : "----";
  //   const info = { turn: `#${tn}`, plyr: curPlayer.name, gamePlay: this.gamePlay }
  //   console.log(stime(this, `.logCurPlayer --${robo}--`), info);
  // }

  /**
   * All manual moves feed through this (drop & redo)
   * TablePlanner.logMove(); then dispatchEvent() --> gamePlay.doPlayerMove()
   *
   * New: let Ship (Drag & Drop) do this.
   */
  override doTableMove(ihex: IdHex) {
    super.doTableMove(ihex); // no-op
  }
  /** All moves (GUI & player) feed through this: */
  override moveTileToHex(tile: Tile, ihex: IdHex) {
    super.moveTileToHex(tile, ihex); // no-op
    // let hex = Hex.ofMap(ihex, this.hexMap)
    // this.hexMap.showMark(hex)
    // this.dispatchEvent(new HexEvent(S.add, hex, sc)) // -> GamePlay.playerMoveEvent(hex, sc)
  }

  override reCacheTiles() {
    this.cacheScale = Math.max(1, this.scaleCont.scaleX); // If zoomed in, use that higher scale
    TP.cacheTiles = this.cacheScale; //
    // console.log(stime('GamePlay', `.reCacheTiles: TP.cacheTiles=`), TP.cacheTiles, this.scaleCont.scaleX);
    Tile.allTiles.forEach(tile => {
      const rad = tile.radius
      tile.setBoundsNull();
      if (tile.cacheID) {
        tile.uncache();
        const b = tile.getBounds() ?? { x: -rad, y: -rad, width: 2 * rad, height: 2 * rad };
        tile.setBounds(b.x, b.y, b.width, b.height)
      } else {
        const scale = TP.cacheTiles
        const b = tile.getBounds() ?? { x: -rad, y: -rad, width: 2 * rad, height: 2 * rad };
        tile.cache(b.x, b.y, b.width, b.height, scale);
      }
    });
    this.hexMap.update();
  }
}
