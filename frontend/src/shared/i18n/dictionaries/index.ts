import type { Locale } from "../config";
import { en } from "./en";
import { ru, type Dictionary } from "./ru";
import { tg } from "./tg";

export const dictionaries: Record<Locale, Dictionary> = { ru, tg, en };

export type { Dictionary };
