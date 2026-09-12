/**
 * The design registry. Order = switcher order; the FIRST entry is the default
 * design served at BASE_PATH, the rest under `_d/<id>/`. Adding a design =
 * implement Design in designs/<id>/index.ts and register it here.
 */
import type { Design } from "./types";
import { bulletin } from "./bulletin/index";
import { chain } from "./chain/index";
import { consoleDesign } from "./console/index";
import { ledger } from "./ledger/index";
import { signal } from "./signal/index";

export const DESIGNS: Design[] = [ledger, consoleDesign, chain, signal, bulletin];
export const DEFAULT_DESIGN = DESIGNS[0]!;
