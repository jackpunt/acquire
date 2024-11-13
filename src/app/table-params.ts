import { TP as TPLib, playerColorRecord } from "@thegraid/hexlib";

declare type Params = Record<string, any>;

export class TP extends TPLib {

  static override setParams(qParams?: Params, force?: boolean, target?: Params) {
    const TP0 = TP, TPlib = TPLib; // inspectable in debugger
    const rv = TPLib.setParams(qParams, force, target); // also set in local 'override' copy.
    // console.log(`TP.setParams:`, { qParams, TP0, TPlib, ghost: TP.ghost, gport: TP.gport, networkURL: TP.networkUrl });
    return rv;
  }
  static override useEwTopo = true;
  static override maxPlayers = 6;
  static override numPlayers = 2;
  static override cacheTiles = 0; // scale for cache (0 -> do not cache)

  static Black_White = playerColorRecord<'BLACK' | 'WHITE'>('BLACK', 'WHITE')
  static Blue_Red = playerColorRecord<'BLUE' | 'RED'>('BLUE', 'RED')
  static Red_Blue = playerColorRecord<'RED' | 'BLUE'>('RED', 'BLUE')
  /** ColorScheme names allowed in choice selector */
  static schemeNames = ['Red_Blue']


  static override bgColor: string = 'rgb(190,160,120)'; //tan = 'rgb(210,180,140)' //'sienna'//'wheat'// C.BROWN
  static borderColor: string = 'peru'//TP.bgColor; //'burlywood'
  static override meepleY0 = 0;

  static initialCoins = 6000;
  static multi = false; // multiple tile with same Aname
}
