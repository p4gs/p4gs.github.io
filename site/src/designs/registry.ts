/**
 * The design registry. Order = switcher order; the FIRST entry is the default
 * design served at BASE_PATH, the rest under `_d/<id>/`. Adding a design =
 * implement Design in designs/<id>/index.ts and register it here.
 */
import type { Design } from "./types";
import { ledger } from "./ledger/index";
import { manual } from "./manual/index";

export const DESIGNS: Design[] = [ledger, manual];
export const DEFAULT_DESIGN = DESIGNS[0]!;
