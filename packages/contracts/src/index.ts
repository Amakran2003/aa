export { answerBlock, askInput, assistantAnswer } from "./assistant/answer.ts";
export type { AnswerBlock } from "./assistant/answer.ts";
export { loginInput, productLink, sessionCookie } from "./auth/login.ts";
export type { LoginInput } from "./auth/login.ts";
export type {
  BestOffer,
  Currency,
  FactoryCard,
  FactoryRole,
  FieldGroup,
  Market,
  MarketProbe,
  Offer,
  PriceTier,
  ProductSheet,
  Rates,
  RelatedProduct,
  SampleOffer,
  SampleShipping,
  SheetField,
  SupplierSignals,
} from "./fiche/sheet.ts";
export { SEARCH_VERSION } from "./fiche/sheet.ts";
export { MAX_SUPPLIERS, PARCOURS_STEPS } from "./parcours/parcours.ts";
export type { Candidate, ParcoursStep, Simulation, SimulationSample, SimulationUnit } from "./parcours/parcours.ts";
export {
  COST_LABEL,
  COST_LINES,
  COST_UNIT,
  LOT_COSTS,
  SETTING_LABEL,
  budgetTotalInput,
  costInput,
  projectInput,
} from "./marge/margin.ts";
export type {
  CellSource,
  CostCell,
  CostInput,
  CostLine,
  MarginResult,
  MarginVerdict,
  MarginView,
  MissingItem,
  ProjectInput,
  ProjectSettings,
  SettingKey,
} from "./marge/margin.ts";
