import { KeyBinder } from "@thegraid/easeljs-lib";
import { GamePlay as GamePlayLib, GameSetup, GameState, Player as PlayerLib, type Scenario } from "@thegraid/hexlib";
import { AcqPlayer as Player } from "./acq-player";
// import { GameState } from "./game-state";
import { stime } from "@thegraid/common-lib";
import { HexMap } from "./hex";
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
