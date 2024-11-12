import { KeyBinder } from "@thegraid/easeljs-lib";
import { GamePlay as GamePlayLib, GameSetup, GameState, Player as PlayerLib, type Scenario } from "@thegraid/hexlib";
import { AcqPlayer as Player } from "./acq-player";
// import { GameState } from "./game-state";
import { stime } from "@thegraid/common-lib";
import { AcqTile as Tile } from "./acq-tile";
import { CorpMgr } from "./corp";
import { AcqHex as Hex, HexMap, type AcqHex2 } from "./hex";
import { Table } from "./table";
import { TP } from "./table-params";

/**
 * GamePlay with Table & GUI (KeyBinder, ParamGUI & Dragger)
 *
 * Implement game, enforce the rules, manage GameStats & hexMap; no GUI/Table required.
 */
export class GamePlay extends GamePlayLib {
  declare gameSetup: GameSetup;
  declare readonly hexMap: HexMap;
  declare table: Table;
  declare curPlayer: Player;

  override readonly gameState: GameState = new GameState(this); // {play, buy, discard, draw}
  override get allPlayers() { return Player.allPlayers; };

  constructor(gameSetup: GameSetup, scenario: Scenario) {
    super(gameSetup, scenario)
    this.hexMap.labelHexesAndMakeTiles(); // after Tile.gamePlay = this;
    this.corpMgr.makeAllCorps();
  }

  corpMgr: CorpMgr = new CorpMgr();

  override startTurn(): void {
    this.forEachPlayer(plyr => {
      plyr.tileRack.forEach(hex => {
        hex.tile?.markCorp(this.corpMgr, this.hexMap.hexAry as AcqHex2[])
      })
    })
  }

  override doPlayerMove(hex: Hex, tile: Tile): void {
    // check for corp -> paint
    hex.isOnMap && tile.corpCircle.paint(tile.transp);
    if (this.turnNumber > 0)
      this.corpMgr.addHex(hex, this.curPlayer);
  }

  // from table.doneButton clicked, or programatically
  playerDone() {
    const plyr = this.curPlayer;
    plyr.tileRack.forEach(hex => {
      if (hex.tile?.corpCircle.colorn === 'pink') {
        hex.tile.moveTo(undefined); // remove from game.
      }
    })
    while (plyr.tileRack.find(hex => !hex.tile) && plyr.drawTile()) {
    }

  }

  // Args to f are local Player, not PlayerLib
  override forEachPlayer(f: (p: Player, index: number, players: Player[]) => void): void {
    return super.forEachPlayer(f as (p: PlayerLib, index: number, player: PlayerLib[]) => void)
  }

  override logNextPlayer(from: string): void {
    const { logAt } = this.logWriterInfo();
    this.table.logText(`${stime.fs()} ${this.curPlayer.Aname}`, from, false);
    ; (document.getElementById('readFileName') as HTMLTextAreaElement).value = logAt;
  }

  override setNextPlayer(turnNumber?: number): void {
    super.setNextPlayer(turnNumber);
  }

  /** makeMove ('m' key): advance one [lrt] Ship on its path. */
  override makeMove(auto?: boolean, ev?: any, incb?: number): void {
    if (this.gamePhase?.Aname !== 'Move') return;
    super.makeMove(auto, ev, incb); // --> Player.playerMove() --> ship.moveOnPath()
  }

  override bindKeys() {
    let table = this.table
    let roboPause = () => { this.forEachPlayer(p => this.pauseGame(p) )}
    let roboResume = () => { this.forEachPlayer(p => this.resumeGame(p) )}
    let roboStep = () => {
      let p = this.curPlayer, op = this.nextPlayer(p)
      this.pauseGame(op); this.resumeGame(p);
    }
    KeyBinder.keyBinder.setKey('p', () => roboPause())
    KeyBinder.keyBinder.setKey('r', () => roboResume())
    KeyBinder.keyBinder.setKey('s', () => roboStep())
    KeyBinder.keyBinder.setKey('R', () => this.runRedo = true)
    KeyBinder.keyBinder.setKey('q', () => this.runRedo = false)
    KeyBinder.keyBinder.setKey(/1-9/, (e: string) => { TP.maxBreadth = Number.parseInt(e) })

    KeyBinder.keyBinder.setKey('M-z', { thisArg: this, func: this.undoMove })
    KeyBinder.keyBinder.setKey('b', { thisArg: this, func: this.undoMove })
    KeyBinder.keyBinder.setKey('f', { thisArg: this, func: this.redoMove })
    // KeyBinder.keyBinder.setKey('S', { thisArg: this, func: this.skipMove })
    // KeyBinder.keyBinder.setKey('M-K', { thisArg: this, func: this.resignMove })// S-M-k
    KeyBinder.keyBinder.setKey('Escape', {thisArg: table, func: table.stopDragging}) // Escape
    KeyBinder.keyBinder.setKey('C-s', () => this.gameSetup.restart({}))// C-s START
    KeyBinder.keyBinder.setKey('C-c', () => this.stopPlayer())         // C-c Stop Planner
    // KeyBinder.keyBinder.setKey('C', () => this.table.reCacheTiles())   // reCacheTiles
    // auto move:
    KeyBinder.keyBinder.setKey('m', () => this.makeMove(true))
    // KeyBinder.keyBinder.setKey('M', () => this.makeMoveAgain(true))
    KeyBinder.keyBinder.setKey('n', () => this.autoMove(false))
    KeyBinder.keyBinder.setKey('N', () => this.autoMove(true))
    KeyBinder.keyBinder.setKey('c', () => this.autoPlay(0))
    KeyBinder.keyBinder.setKey('v', () => this.autoPlay(1))

    // click the confirm/cancel buttons:
    KeyBinder.keyBinder.setKey('c', () => this.clickConfirm(false));
    KeyBinder.keyBinder.setKey('y', () => this.clickConfirm(true));
    KeyBinder.keyBinder.setKey('d', () => this.clickDone());

    // diagnostics:
    KeyBinder.keyBinder.setKey('I', () => this.table.enableHexInspector())
    KeyBinder.keyBinder.setKey('t', () => this.table.toggleText())

    KeyBinder.keyBinder.setKey('M-r', () => { this.gameSetup.netState = "ref" })
    KeyBinder.keyBinder.setKey('M-J', () => { this.gameSetup.netState = "new" })
    KeyBinder.keyBinder.setKey('M-j', () => { this.gameSetup.netState = "join" })
    KeyBinder.keyBinder.setKey('M-d', () => { this.gameSetup.netState = "no" })
    // table.undoShape.on(S.click, () => this.undoMove(), this)
    // table.redoShape.on(S.click, () => this.redoMove(), this)
    // table.skipShape.on(S.click, () => this.skipMove(), this)
  }

}
