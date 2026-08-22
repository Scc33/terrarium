import type { ArchitectureSnapshot } from '../model'

// Generated from the repository by scripts/generate.ts. Do not edit by hand.
export const architecture = {
  "version": 1,
  "revision": "6cc1772",
  "repoRoot": "../..",
  "packages": [
    {
      "id": "engine",
      "name": "@terrarium/engine",
      "description": "Pure deterministic simulation, action legality, state, and the ordered quarterly tick.",
      "moduleCount": 32,
      "lines": 8232
    },
    {
      "id": "fixtures",
      "name": "@terrarium/fixtures",
      "description": "Shared country recipes and named action scripts used by tests and the runner.",
      "moduleCount": 3,
      "lines": 47
    },
    {
      "id": "observation",
      "name": "@terrarium/observation",
      "description": "Presentation-only projection from engine prints to the player-visible contract.",
      "moduleCount": 3,
      "lines": 502
    },
    {
      "id": "runner",
      "name": "@terrarium/runner",
      "description": "Headless execution and balance sweeps over the same public engine API.",
      "moduleCount": 11,
      "lines": 2066
    },
    {
      "id": "ui",
      "name": "@terrarium/ui",
      "description": "War-room interface; the worker is its only engine host and components consume published state.",
      "moduleCount": 81,
      "lines": 13829
    }
  ],
  "modules": [
    {
      "id": "packages/engine/src/actions/apply.ts",
      "label": "apply",
      "packageId": "engine",
      "category": "Actions",
      "summary": "Action application. Validates legality (dial bounds, PC affordability) and rejects loudly — an illegal action in a replay means a bug or a version mismatch, never a silent skip (§5).",
      "lines": 603,
      "exports": [
        {
          "name": "IllegalActionError",
          "kind": "class",
          "path": "packages/engine/src/actions/apply.ts",
          "line": 71
        },
        {
          "name": "reformWindowOpen",
          "kind": "function",
          "path": "packages/engine/src/actions/apply.ts",
          "line": 120
        },
        {
          "name": "vetoMultiplier",
          "kind": "function",
          "path": "packages/engine/src/actions/apply.ts",
          "line": 138
        },
        {
          "name": "politicalCostOfAction",
          "kind": "function",
          "path": "packages/engine/src/actions/apply.ts",
          "line": 371
        },
        {
          "name": "applyAction",
          "kind": "function",
          "path": "packages/engine/src/actions/apply.ts",
          "line": 451
        }
      ],
      "imports": [
        "packages/engine/src/actions/types.ts",
        "packages/engine/src/constants.ts",
        "packages/engine/src/math.ts",
        "packages/engine/src/pipeline/derive.ts",
        "packages/engine/src/state/schema.ts",
        "packages/engine/src/state/spending.ts"
      ],
      "importedBy": [
        "packages/engine/src/index.ts",
        "packages/engine/src/interregnum.ts"
      ],
      "path": "packages/engine/src/actions/apply.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/actions/types.ts",
      "label": "types",
      "packageId": "engine",
      "category": "Actions",
      "summary": "",
      "lines": 46,
      "exports": [
        {
          "name": "DialPath",
          "kind": "type",
          "path": "packages/engine/src/actions/types.ts",
          "line": 13
        },
        {
          "name": "Action",
          "kind": "type",
          "path": "packages/engine/src/actions/types.ts",
          "line": 28
        },
        {
          "name": "TurnActions",
          "kind": "interface",
          "path": "packages/engine/src/actions/types.ts",
          "line": 40
        },
        {
          "name": "ActionLog",
          "kind": "type",
          "path": "packages/engine/src/actions/types.ts",
          "line": 45
        }
      ],
      "imports": [
        "packages/engine/src/state/schema.ts"
      ],
      "importedBy": [
        "packages/engine/src/actions/apply.ts",
        "packages/engine/src/index.ts",
        "packages/engine/src/interregnum.ts"
      ],
      "path": "packages/engine/src/actions/types.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/constants.ts",
      "label": "constants",
      "packageId": "engine",
      "category": "Engine core",
      "summary": "Tuning knobs. Every behavioral constant in the sim lives here so balance work happens in one file. Values target a stable passive run for a mid-poor 1946 economy (the long-run stability criterion).",
      "lines": 909,
      "exports": [
        {
          "name": "CAPITAL_ELASTICITY",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 19
        },
        {
          "name": "LABOR_ELASTICITY",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 20
        },
        {
          "name": "DEPRECIATION_Q",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 21
        },
        {
          "name": "UTILIZATION_AT_INIT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 22
        },
        {
          "name": "NORMAL_UTILIZATION",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 25
        },
        {
          "name": "IO_COEFF",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 29
        },
        {
          "name": "TATONNEMENT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 38
        },
        {
          "name": "SLACK_GAIN_RATIO",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 45
        },
        {
          "name": "EMPLOYMENT_ADJUST",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 48
        },
        {
          "name": "WAGE_DEMAND_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 49
        },
        {
          "name": "WAGE_INFLATION_PASSTHROUGH",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 50
        },
        {
          "name": "NATURAL_UNEMPLOYMENT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 53
        },
        {
          "name": "WAGE_SLACK_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 54
        },
        {
          "name": "WAGE_MAX_UP",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 57
        },
        {
          "name": "WAGE_MAX_DOWN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 58
        },
        {
          "name": "LABOR_SHARE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 59
        },
        {
          "name": "PARTICIPATION",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 62
        },
        {
          "name": "LABOR_SOURCE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 71
        },
        {
          "name": "MPC",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 80
        },
        {
          "name": "SAVINGS_DRAWDOWN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 87
        },
        {
          "name": "CONSUMPTION_WEIGHTS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 91
        },
        {
          "name": "PROFIT_SHARE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 100
        },
        {
          "name": "BOND_HOLDING",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 109
        },
        {
          "name": "TRANSFER_SHARE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 118
        },
        {
          "name": "taxEfficiency",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 128
        },
        {
          "name": "adminEffectiveness",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 130
        },
        {
          "name": "BOND_MARKET_DEPTH",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 132
        },
        {
          "name": "DEBT_CEILING",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 134
        },
        {
          "name": "DEBT_RISK_PREMIUM_AT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 136
        },
        {
          "name": "RISK_PREMIUM_SLOPE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 137
        },
        {
          "name": "SOVEREIGN_PRIVATE_PREMIUM_SHARE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 139
        },
        {
          "name": "BOND_CROWDING_RATE_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 142
        },
        {
          "name": "domesticBondFundingShare",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 143
        },
        {
          "name": "CAPACITY_COST_PER_POINT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 147
        },
        {
          "name": "CAPACITY_BUILD_QTRS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 148
        },
        {
          "name": "INDICATOR_FUNDED_AT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 152
        },
        {
          "name": "CAPACITY_DECAY_BY_ID",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 211
        },
        {
          "name": "CONF_NEUTRAL",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 219
        },
        {
          "name": "CONF_ADAPT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 220
        },
        {
          "name": "CONF_MPC_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 221
        },
        {
          "name": "CONF_INV_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 222
        },
        {
          "name": "EXPECTATION_ADAPT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 225
        },
        {
          "name": "PRINT_PRICE_PRESSURE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 226
        },
        {
          "name": "INVESTMENT_RATE_SENSITIVITY",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 227
        },
        {
          "name": "NATURAL_REAL_RATE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 228
        },
        {
          "name": "INVESTMENT_SLACK_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 232
        },
        {
          "name": "INVESTMENT_FACTOR_MAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 233
        },
        {
          "name": "FDI_BASE_ANNUAL_GDP_SHARE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 240
        },
        {
          "name": "FDI_REFERENCE_POPULATION",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 244
        },
        {
          "name": "FDI_SIZE_ELASTICITY",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 245
        },
        {
          "name": "FDI_OPENNESS_FLOOR",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 247
        },
        {
          "name": "FDI_OPENNESS_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 248
        },
        {
          "name": "FDI_CATCHUP_FLOOR",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 249
        },
        {
          "name": "FDI_CATCHUP_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 250
        },
        {
          "name": "FDI_NORMAL_AFTER_TAX_PROFIT_SHARE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 253
        },
        {
          "name": "FDI_RETURN_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 254
        },
        {
          "name": "FDI_CONFIDENCE_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 255
        },
        {
          "name": "FDI_EXPORT_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 256
        },
        {
          "name": "FDI_IMPORTED_CAPITAL_SHARE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 259
        },
        {
          "name": "FDI_PRICE_INSTABILITY_AT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 263
        },
        {
          "name": "FDI_PRICE_INSTABILITY_DRAG",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 264
        },
        {
          "name": "FDI_OWNERSHIP_SATURATION",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 267
        },
        {
          "name": "FDI_OPENING_OWNERSHIP_BASE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 268
        },
        {
          "name": "FDI_CRISIS_MULTIPLIER",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 271
        },
        {
          "name": "FDI_PROFIT_REMIT_SHARE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 274
        },
        {
          "name": "fdiStructuralAttraction",
          "kind": "function",
          "path": "packages/engine/src/constants.ts",
          "line": 280
        },
        {
          "name": "ENERGY_SHOCK_P",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 298
        },
        {
          "name": "ENERGY_SHOCK_JUMP",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 299
        },
        {
          "name": "DROUGHT_P",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 301
        },
        {
          "name": "DROUGHT_SEVERITY",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 302
        },
        {
          "name": "DROUGHT_EXTRA_QTRS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 303
        },
        {
          "name": "WORLD_PRICE_REVERT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 306
        },
        {
          "name": "FRONTIER_ERAS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 312
        },
        {
          "name": "TECH_EXPOSURE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 321
        },
        {
          "name": "CATCHUP_Q",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 329
        },
        {
          "name": "ABSORB_BASE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 333
        },
        {
          "name": "ABSORB_EDU_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 334
        },
        {
          "name": "ABSORB_OPENNESS_WEIGHT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 335
        },
        {
          "name": "FRONTIER_OWN_DRIFT_Q",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 337
        },
        {
          "name": "TECH_ATTAINED_BASE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 341
        },
        {
          "name": "TECH_ATTAINED_DEV_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 342
        },
        {
          "name": "RESEARCH_EFFECTIVE_SHARE_MAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 348
        },
        {
          "name": "RESEARCH_SKILL_FLOOR",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 349
        },
        {
          "name": "RESEARCH_CATCHUP_GAIN_Q",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 353
        },
        {
          "name": "RESEARCH_FRONTIER_GAIN_Q",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 358
        },
        {
          "name": "RESEARCH_FRONTIER_START",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 364
        },
        {
          "name": "RESEARCH_STOCK_DECAY_Q",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 376
        },
        {
          "name": "BREAKTHROUGH_SIZE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 388
        },
        {
          "name": "BREAKTHROUGH_HAZARD_MAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 389
        },
        {
          "name": "FERT_EDU_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 394
        },
        {
          "name": "EDUCATION_1946",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 395
        },
        {
          "name": "HUMAN_CAPITAL_ADJUST_Q",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 399
        },
        {
          "name": "LIVING_STANDARD_1946",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 405
        },
        {
          "name": "MORT_BASE_ANNUAL",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 409
        },
        {
          "name": "MORT_INCOME_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 414
        },
        {
          "name": "MORT_SECULAR_Q",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 416
        },
        {
          "name": "MORT_FLOOR",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 417
        },
        {
          "name": "FERT_MAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 421
        },
        {
          "name": "FERT_MIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 422
        },
        {
          "name": "FERT_INCOME_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 423
        },
        {
          "name": "FERT_URBAN_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 424
        },
        {
          "name": "FERT_SURVIVAL_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 427
        },
        {
          "name": "FERT_SECULAR_Q",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 428
        },
        {
          "name": "FERTILE_YEARS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 429
        },
        {
          "name": "MIG_WORLD_FRONTIER_SHARE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 436
        },
        {
          "name": "MIG_PERFORMANCE_GAIN_Q",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 438
        },
        {
          "name": "MIG_PERFORMANCE_GAP_CAP",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 440
        },
        {
          "name": "MIG_LABOR_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 442
        },
        {
          "name": "MIG_EMIGRATION_CAP_Q",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 445
        },
        {
          "name": "IMMIGRATION_LIMIT_DEFAULT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 448
        },
        {
          "name": "IMMIGRATION_LIMIT_MAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 449
        },
        {
          "name": "MIG_LAND_FAVOR_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 454
        },
        {
          "name": "MIG_INDUSTRIAL_FAVOR_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 455
        },
        {
          "name": "MIG_UNION_FAVOR_LOSS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 456
        },
        {
          "name": "MIG_UNREST_FREE_RATE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 457
        },
        {
          "name": "UNREST_IMMIGRATION",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 458
        },
        {
          "name": "SUBSISTENCE_ABSORPTION_Q",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 465
        },
        {
          "name": "SUBSISTENCE_CAP",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 468
        },
        {
          "name": "URBANIZATION_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 471
        },
        {
          "name": "BASE_WORKER_SHARE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 474
        },
        {
          "name": "WELFARE_DISCOUNT_Q",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 478
        },
        {
          "name": "PROSPERITY_GRADE_CUTS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 487
        },
        {
          "name": "LEGITIMACY_GRADE_ELECTIONS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 496
        },
        {
          "name": "TRADE_ELASTICITY",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 503
        },
        {
          "name": "EXPORT_BASE_SHARE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 504
        },
        {
          "name": "IMPORT_BASE_SHARE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 511
        },
        {
          "name": "RESERVES_INIT_QTRS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 518
        },
        {
          "name": "DEBT_TO_GDP_1946",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 522
        },
        {
          "name": "DEPRECIATION_WHEN_BROKE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 523
        },
        {
          "name": "WORLD_PRICE_VOL",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 524
        },
        {
          "name": "PARTNER_CYCLE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 538
        },
        {
          "name": "PARTNER_ACTIVITY_MIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 551
        },
        {
          "name": "PARTNER_ACTIVITY_MAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 552
        },
        {
          "name": "PARTNER_BOOM_AT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 553
        },
        {
          "name": "PARTNER_SLUMP_AT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 554
        },
        {
          "name": "EXPORT_DEMAND_WEIGHTS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 558
        },
        {
          "name": "WORLD_SUPPLY_WEIGHTS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 568
        },
        {
          "name": "WORLD_SUPPLY_PRICE_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 577
        },
        {
          "name": "ASSET_REVERT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 594
        },
        {
          "name": "ASSET_FUND_PROFIT_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 595
        },
        {
          "name": "ASSET_NORMAL_PROFIT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 596
        },
        {
          "name": "ASSET_FUND_RATE_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 597
        },
        {
          "name": "ASSET_CREDIT_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 602
        },
        {
          "name": "ASSET_SPIRITS_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 603
        },
        {
          "name": "ASSET_VOL",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 604
        },
        {
          "name": "ASSET_MIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 605
        },
        {
          "name": "ASSET_MAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 606
        },
        {
          "name": "ASSET_BUBBLE_AT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 607
        },
        {
          "name": "CREDIT_BASE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 610
        },
        {
          "name": "CREDIT_RATE_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 611
        },
        {
          "name": "CREDIT_COLLATERAL_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 612
        },
        {
          "name": "CREDIT_SPIRITS_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 613
        },
        {
          "name": "CREDIT_ADJUST",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 614
        },
        {
          "name": "CAPITAL_REQUIREMENT_DEFAULT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 618
        },
        {
          "name": "CAPITAL_REQUIREMENT_MIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 619
        },
        {
          "name": "CAPITAL_REQUIREMENT_MAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 620
        },
        {
          "name": "BANK_TARGET_RATIO",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 621
        },
        {
          "name": "BANK_MARGIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 622
        },
        {
          "name": "BANK_SPREAD",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 623
        },
        {
          "name": "LOAN_LOSS_BASE_Q",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 624
        },
        {
          "name": "BANK_DIVIDEND_Q",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 625
        },
        {
          "name": "ASSET_PURCHASE_RATE_DEFAULT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 631
        },
        {
          "name": "ASSET_PURCHASE_RATE_MAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 632
        },
        {
          "name": "ASSET_PURCHASE_PRIVATE_RATE_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 633
        },
        {
          "name": "CRISIS_LEVERAGE_SAFE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 638
        },
        {
          "name": "CRISIS_ASSET_SAFE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 639
        },
        {
          "name": "CRISIS_BASE_P",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 640
        },
        {
          "name": "CRISIS_FRAGILITY_P",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 641
        },
        {
          "name": "CRISIS_IMPORT_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 644
        },
        {
          "name": "CRISIS_DURATION",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 645
        },
        {
          "name": "CRISIS_SEVERITY_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 646
        },
        {
          "name": "CRISIS_ASSET_CRASH",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 647
        },
        {
          "name": "CRISIS_WRITEOFF",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 648
        },
        {
          "name": "CRISIS_CREDIT_CRUNCH",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 649
        },
        {
          "name": "CRISIS_CONF_SHOCK",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 650
        },
        {
          "name": "FIN_INVEST_Q_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 654
        },
        {
          "name": "FIN_CRUNCH_DRAG",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 655
        },
        {
          "name": "APPROVAL_DRIFT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 658
        },
        {
          "name": "LOSS_AVERSION",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 659
        },
        {
          "name": "PC_INCOME_SCALE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 660
        },
        {
          "name": "PC_INCOME_FLOOR",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 661
        },
        {
          "name": "PC_HEADLINE_SALIENCE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 664
        },
        {
          "name": "PC_HEADLINE_CAP",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 665
        },
        {
          "name": "ELECTION_WIN_THRESHOLD",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 666
        },
        {
          "name": "PC_START",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 667
        },
        {
          "name": "PC_MAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 668
        },
        {
          "name": "PC_REPRESSION_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 672
        },
        {
          "name": "PC_UNREST_DRAG",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 674
        },
        {
          "name": "PC_COST_DIAL_BASE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 677
        },
        {
          "name": "PC_COST_DIAL_SLOPE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 678
        },
        {
          "name": "PC_COST_CAPACITY",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 679
        },
        {
          "name": "PC_COST_REFORM",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 682
        },
        {
          "name": "PC_COST_CAMPAIGN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 683
        },
        {
          "name": "SOC_ADJUST",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 692
        },
        {
          "name": "SOC_BASE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 693
        },
        {
          "name": "SOC_FRANCHISE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 694
        },
        {
          "name": "SOC_PRESS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 695
        },
        {
          "name": "SOC_LABOR",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 696
        },
        {
          "name": "SOC_COURTS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 697
        },
        {
          "name": "SOC_EDU",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 698
        },
        {
          "name": "SOC_URBAN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 699
        },
        {
          "name": "SOC_INEQ",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 700
        },
        {
          "name": "SOC_GINI_NEUTRAL",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 701
        },
        {
          "name": "SOC_REPRESSION",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 702
        },
        {
          "name": "STATE_CAPACITY_WEIGHT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 707
        },
        {
          "name": "STATE_REPRESSION_WEIGHT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 708
        },
        {
          "name": "CORRIDOR_HALF_WIDTH",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 711
        },
        {
          "name": "REPRESSION_DECAY_Q",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 715
        },
        {
          "name": "INSTITUTION_EROSION_Q",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 716
        },
        {
          "name": "REFORM_STEP",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 717
        },
        {
          "name": "REFORM_WINDOW_AT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 720
        },
        {
          "name": "REFORM_WINDOW_DISCOUNT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 721
        },
        {
          "name": "REFORM_WINDOW_VETO_RELIEF",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 722
        },
        {
          "name": "INSTITUTIONS_1946",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 726
        },
        {
          "name": "UNREST_ADAPT_UP",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 742
        },
        {
          "name": "UNREST_ADAPT_DOWN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 743
        },
        {
          "name": "UNREST_BASE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 744
        },
        {
          "name": "UNREST_DISCONTENT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 761
        },
        {
          "name": "UNREST_VOICELESS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 762
        },
        {
          "name": "UNREST_INEQ",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 763
        },
        {
          "name": "UNREST_GINI_NEUTRAL",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 764
        },
        {
          "name": "UNREST_CRISIS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 765
        },
        {
          "name": "UNREST_REPRESSION",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 769
        },
        {
          "name": "UNREST_DESPOTISM",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 774
        },
        {
          "name": "UNREST_ANARCHY",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 775
        },
        {
          "name": "REVOLT_AT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 779
        },
        {
          "name": "REVOLT_P",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 780
        },
        {
          "name": "COUP_AT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 783
        },
        {
          "name": "COUP_P",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 784
        },
        {
          "name": "LAND_POWER_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 790
        },
        {
          "name": "IND_POWER_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 791
        },
        {
          "name": "FIN_POWER_CREDIT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 792
        },
        {
          "name": "FIN_POWER_DEBT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 793
        },
        {
          "name": "UNION_POWER_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 794
        },
        {
          "name": "SOCIETY_CHECK",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 798
        },
        {
          "name": "BLOC_FAVOR_ADAPT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 799
        },
        {
          "name": "BLOC_FAVOR_BASE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 810
        },
        {
          "name": "BLOC_DEFIANCE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 817
        },
        {
          "name": "VETO_COST_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 819
        },
        {
          "name": "PLEDGE_QTRS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 821
        },
        {
          "name": "PLEDGE_VETO_MULT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 822
        },
        {
          "name": "FIN_FAVOR_PREMIUM",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 826
        },
        {
          "name": "FIN_FAVOR_DEPTH",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 827
        },
        {
          "name": "IND_FAVOR_INVEST",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 828
        },
        {
          "name": "UNION_FAVOR_WAGE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 829
        },
        {
          "name": "LAND_FAVOR_TAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 830
        },
        {
          "name": "ELITE_CAPTURE_NEUTRAL",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 838
        },
        {
          "name": "ELITE_VETO_ABSORB",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 839
        },
        {
          "name": "ELITE_ABSORB_CLAMP",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 840
        },
        {
          "name": "PLATFORM_SWING",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 859
        },
        {
          "name": "LARGESSE_BUMP",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 868
        },
        {
          "name": "LARGESSE_SWING_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 869
        },
        {
          "name": "COALITION_SWING_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 870
        },
        {
          "name": "SUPPRESSION_REPRESSION_STEP",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 871
        },
        {
          "name": "FRANCHISE_SUFFRAGE_STEP",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 872
        },
        {
          "name": "REPRESSION_VOTE_EDGE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 875
        },
        {
          "name": "PLATFORM_BLOC_COST",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 877
        },
        {
          "name": "COALITION_FAVOR_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 884
        },
        {
          "name": "COALITION_FAVOR_SNUB",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 885
        },
        {
          "name": "POSITION_GRADE_CUTS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 890
        },
        {
          "name": "CARETAKER_CAPACITY_EVERY",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 907
        },
        {
          "name": "CARETAKER_CAPACITY_SPEND",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 908
        }
      ],
      "imports": [
        "packages/engine/src/state/schema.ts"
      ],
      "importedBy": [
        "packages/engine/src/actions/apply.ts",
        "packages/engine/src/countries.ts",
        "packages/engine/src/index.ts",
        "packages/engine/src/interregnum.ts",
        "packages/engine/src/pipeline/cohorts.ts",
        "packages/engine/src/pipeline/demography.ts",
        "packages/engine/src/pipeline/derive.ts",
        "packages/engine/src/pipeline/finance.ts",
        "packages/engine/src/pipeline/fiscal.ts",
        "packages/engine/src/pipeline/foreignInvestment.ts",
        "packages/engine/src/pipeline/institutions.ts",
        "packages/engine/src/pipeline/labor.ts",
        "packages/engine/src/pipeline/monetary.ts",
        "packages/engine/src/pipeline/politics.ts",
        "packages/engine/src/pipeline/prices.ts",
        "packages/engine/src/pipeline/production.ts",
        "packages/engine/src/pipeline/shocks.ts",
        "packages/engine/src/pipeline/statistics.ts",
        "packages/engine/src/pipeline/technology.ts",
        "packages/engine/src/pipeline/trade.ts",
        "packages/engine/src/pipeline/world.ts",
        "packages/engine/src/state/init.ts",
        "packages/engine/src/state/validate.ts"
      ],
      "path": "packages/engine/src/constants.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/countries.ts",
      "label": "countries",
      "packageId": "engine",
      "category": "Engine core",
      "summary": "Replayable country scenarios.",
      "lines": 539,
      "exports": [
        {
          "name": "CURATED_COUNTRY_IDS",
          "kind": "constant",
          "path": "packages/engine/src/countries.ts",
          "line": 32
        },
        {
          "name": "CuratedCountryId",
          "kind": "type",
          "path": "packages/engine/src/countries.ts",
          "line": 33
        },
        {
          "name": "CountryScenarioId",
          "kind": "type",
          "path": "packages/engine/src/countries.ts",
          "line": 34
        },
        {
          "name": "COUNTRY_ARCHETYPE_IDS",
          "kind": "constant",
          "path": "packages/engine/src/countries.ts",
          "line": 36
        },
        {
          "name": "CountryArchetypeId",
          "kind": "type",
          "path": "packages/engine/src/countries.ts",
          "line": 37
        },
        {
          "name": "CountryDifficulty",
          "kind": "type",
          "path": "packages/engine/src/countries.ts",
          "line": 39
        },
        {
          "name": "CountryProfile",
          "kind": "interface",
          "path": "packages/engine/src/countries.ts",
          "line": 43
        },
        {
          "name": "COUNTRY_CATALOG",
          "kind": "constant",
          "path": "packages/engine/src/countries.ts",
          "line": 131
        },
        {
          "name": "pyramidFor",
          "kind": "function",
          "path": "packages/engine/src/countries.ts",
          "line": 168
        },
        {
          "name": "MERIDIA_PARAMS",
          "kind": "constant",
          "path": "packages/engine/src/countries.ts",
          "line": 206
        },
        {
          "name": "generateParams",
          "kind": "function",
          "path": "packages/engine/src/countries.ts",
          "line": 308
        },
        {
          "name": "ProceduralCountryOptions",
          "kind": "interface",
          "path": "packages/engine/src/countries.ts",
          "line": 340
        },
        {
          "name": "generateCountryParams",
          "kind": "function",
          "path": "packages/engine/src/countries.ts",
          "line": 381
        },
        {
          "name": "materializeStructure",
          "kind": "function",
          "path": "packages/engine/src/countries.ts",
          "line": 435
        },
        {
          "name": "createCountryParams",
          "kind": "function",
          "path": "packages/engine/src/countries.ts",
          "line": 457
        },
        {
          "name": "countryProfile",
          "kind": "function",
          "path": "packages/engine/src/countries.ts",
          "line": 463
        },
        {
          "name": "InvalidCountryError",
          "kind": "class",
          "path": "packages/engine/src/countries.ts",
          "line": 467
        },
        {
          "name": "validateCountryParams",
          "kind": "function",
          "path": "packages/engine/src/countries.ts",
          "line": 475
        }
      ],
      "imports": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/math.ts",
        "packages/engine/src/rng/rng.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "importedBy": [
        "packages/engine/src/countryDocument.ts",
        "packages/engine/src/index.ts",
        "packages/engine/src/index.ts",
        "packages/engine/src/state/init.ts"
      ],
      "path": "packages/engine/src/countries.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/countryDocument.ts",
      "label": "countryDocument",
      "packageId": "engine",
      "category": "Engine core",
      "summary": "The country document — a 1946 settlement someone wrote down, in a form they can hand to somebody else.",
      "lines": 286,
      "exports": [
        {
          "name": "COUNTRY_DOCUMENT_FORMAT",
          "kind": "constant",
          "path": "packages/engine/src/countryDocument.ts",
          "line": 48
        },
        {
          "name": "COUNTRY_DOCUMENT_VERSION",
          "kind": "constant",
          "path": "packages/engine/src/countryDocument.ts",
          "line": 51
        },
        {
          "name": "CountryDossier",
          "kind": "interface",
          "path": "packages/engine/src/countryDocument.ts",
          "line": 71
        },
        {
          "name": "CountryDocument",
          "kind": "interface",
          "path": "packages/engine/src/countryDocument.ts",
          "line": 78
        },
        {
          "name": "createCountryDocument",
          "kind": "function",
          "path": "packages/engine/src/countryDocument.ts",
          "line": 133
        },
        {
          "name": "countryFromDocument",
          "kind": "function",
          "path": "packages/engine/src/countryDocument.ts",
          "line": 175
        },
        {
          "name": "parseCountryDocument",
          "kind": "function",
          "path": "packages/engine/src/countryDocument.ts",
          "line": 222
        }
      ],
      "imports": [
        "packages/engine/src/countries.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "importedBy": [
        "packages/engine/src/index.ts",
        "packages/engine/src/index.ts"
      ],
      "path": "packages/engine/src/countryDocument.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/hash.ts",
      "label": "hash",
      "packageId": "engine",
      "category": "Engine core",
      "summary": "Deterministic state hashing for golden replays. Numbers are rounded to 10 significant digits before hashing so serialization noise can't flake a test; object key order follows construction order, which the pipeline keeps stable.",
      "lines": 24,
      "exports": [
        {
          "name": "stableStringify",
          "kind": "function",
          "path": "packages/engine/src/hash.ts",
          "line": 8
        },
        {
          "name": "hashState",
          "kind": "function",
          "path": "packages/engine/src/hash.ts",
          "line": 15
        }
      ],
      "imports": [],
      "importedBy": [
        "packages/engine/src/index.ts"
      ],
      "path": "packages/engine/src/hash.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/index.ts",
      "label": "index",
      "packageId": "engine",
      "category": "Engine core",
      "summary": "The whole engine is three functions (§2):",
      "lines": 311,
      "exports": [
        {
          "name": "init",
          "kind": "function",
          "path": "packages/engine/src/index.ts",
          "line": 28
        },
        {
          "name": "applyActions",
          "kind": "function",
          "path": "packages/engine/src/index.ts",
          "line": 37
        },
        {
          "name": "step",
          "kind": "function",
          "path": "packages/engine/src/index.ts",
          "line": 41
        },
        {
          "name": "InvalidSaveError",
          "kind": "class",
          "path": "packages/engine/src/index.ts",
          "line": 49
        },
        {
          "name": "SaveFile",
          "kind": "interface",
          "path": "packages/engine/src/index.ts",
          "line": 56
        },
        {
          "name": "createSave",
          "kind": "function",
          "path": "packages/engine/src/index.ts",
          "line": 75
        },
        {
          "name": "replay",
          "kind": "function",
          "path": "packages/engine/src/index.ts",
          "line": 106
        }
      ],
      "imports": [
        "packages/engine/src/actions/apply.ts",
        "packages/engine/src/actions/types.ts",
        "packages/engine/src/constants.ts",
        "packages/engine/src/countries.ts",
        "packages/engine/src/countries.ts",
        "packages/engine/src/countryDocument.ts",
        "packages/engine/src/countryDocument.ts",
        "packages/engine/src/hash.ts",
        "packages/engine/src/interregnum.ts",
        "packages/engine/src/pipeline/demography.ts",
        "packages/engine/src/pipeline/demography.ts",
        "packages/engine/src/pipeline/derive.ts",
        "packages/engine/src/pipeline/institutions.ts",
        "packages/engine/src/pipeline/pipeline.ts",
        "packages/engine/src/pipeline/politics.ts",
        "packages/engine/src/pipeline/technology.ts",
        "packages/engine/src/pipeline/technology.ts",
        "packages/engine/src/rng/rng.ts",
        "packages/engine/src/rng/rng.ts",
        "packages/engine/src/state/init.ts",
        "packages/engine/src/state/schema.ts",
        "packages/engine/src/state/schema.ts",
        "packages/engine/src/state/validate.ts"
      ],
      "importedBy": [
        "packages/fixtures/countries/standard.ts",
        "packages/fixtures/scripts/scripts.ts",
        "packages/observation/src/observe.ts",
        "packages/observation/src/published.ts",
        "packages/observation/src/published.ts",
        "packages/runner/src/batch.ts",
        "packages/runner/src/debt.ts",
        "packages/runner/src/export-feedback-cli.ts",
        "packages/runner/src/export-feedback.ts",
        "packages/runner/src/policies.ts",
        "packages/runner/src/run.ts",
        "packages/runner/src/stability-cli.ts",
        "packages/runner/src/stability.ts",
        "packages/ui/src/App.tsx",
        "packages/ui/src/components/labels.ts",
        "packages/ui/src/components/series.ts",
        "packages/ui/src/countryDraft.ts",
        "packages/ui/src/devScenario.ts",
        "packages/ui/src/domains.ts",
        "packages/ui/src/gameRules.ts",
        "packages/ui/src/incidence.ts",
        "packages/ui/src/levers.ts",
        "packages/ui/src/manual.ts",
        "packages/ui/src/maturity.ts",
        "packages/ui/src/panels/CensusOverlay.tsx",
        "packages/ui/src/panels/ControlRail.tsx",
        "packages/ui/src/panels/CountrySelect.tsx",
        "packages/ui/src/panels/DevConsole.tsx",
        "packages/ui/src/panels/HeaderBar.tsx",
        "packages/ui/src/panels/ReportCardOverlay.tsx",
        "packages/ui/src/panels/SettingsOverlay.tsx",
        "packages/ui/src/policyRecord.ts",
        "packages/ui/src/saveFile.ts",
        "packages/ui/src/spendingRules.ts",
        "packages/ui/src/store/gameStore.ts",
        "packages/ui/src/store/gameStore.ts",
        "packages/ui/src/worker/protocol.ts",
        "packages/ui/src/worker/sim.worker.ts",
        "packages/ui/src/worker/trial.ts"
      ],
      "path": "packages/engine/src/index.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/interregnum.ts",
      "label": "interregnum",
      "packageId": "engine",
      "category": "Engine core",
      "summary": "The years before you (ADR-0021).",
      "lines": 174,
      "exports": [
        {
          "name": "Appointment",
          "kind": "interface",
          "path": "packages/engine/src/interregnum.ts",
          "line": 62
        },
        {
          "name": "APPOINTMENTS",
          "kind": "constant",
          "path": "packages/engine/src/interregnum.ts",
          "line": 78
        },
        {
          "name": "caretakerActions",
          "kind": "function",
          "path": "packages/engine/src/interregnum.ts",
          "line": 131
        },
        {
          "name": "runInterregnum",
          "kind": "function",
          "path": "packages/engine/src/interregnum.ts",
          "line": 151
        }
      ],
      "imports": [
        "packages/engine/src/actions/apply.ts",
        "packages/engine/src/actions/types.ts",
        "packages/engine/src/constants.ts",
        "packages/engine/src/pipeline/pipeline.ts",
        "packages/engine/src/rng/rng.ts",
        "packages/engine/src/state/init.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "importedBy": [
        "packages/engine/src/index.ts"
      ],
      "path": "packages/engine/src/interregnum.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/math.ts",
      "label": "math",
      "packageId": "engine",
      "category": "Engine core",
      "summary": "",
      "lines": 50,
      "exports": [
        {
          "name": "clamp",
          "kind": "function",
          "path": "packages/engine/src/math.ts",
          "line": 3
        },
        {
          "name": "solveLinear",
          "kind": "function",
          "path": "packages/engine/src/math.ts",
          "line": 8
        },
        {
          "name": "leontiefGross",
          "kind": "function",
          "path": "packages/engine/src/math.ts",
          "line": 29
        },
        {
          "name": "sectorRecord",
          "kind": "function",
          "path": "packages/engine/src/math.ts",
          "line": 37
        },
        {
          "name": "sumRecord",
          "kind": "function",
          "path": "packages/engine/src/math.ts",
          "line": 45
        }
      ],
      "imports": [
        "packages/engine/src/state/schema.ts"
      ],
      "importedBy": [
        "packages/engine/src/actions/apply.ts",
        "packages/engine/src/countries.ts",
        "packages/engine/src/pipeline/cohorts.ts",
        "packages/engine/src/pipeline/demography.ts",
        "packages/engine/src/pipeline/derive.ts",
        "packages/engine/src/pipeline/finance.ts",
        "packages/engine/src/pipeline/fiscal.ts",
        "packages/engine/src/pipeline/foreignInvestment.ts",
        "packages/engine/src/pipeline/institutions.ts",
        "packages/engine/src/pipeline/labor.ts",
        "packages/engine/src/pipeline/monetary.ts",
        "packages/engine/src/pipeline/politics.ts",
        "packages/engine/src/pipeline/prices.ts",
        "packages/engine/src/pipeline/production.ts",
        "packages/engine/src/pipeline/technology.ts",
        "packages/engine/src/pipeline/world.ts",
        "packages/engine/src/state/init.ts",
        "packages/engine/src/state/spending.ts"
      ],
      "path": "packages/engine/src/math.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/pipeline/cohorts.ts",
      "label": "cohorts",
      "packageId": "engine",
      "category": "Pipeline",
      "summary": "Step 7 — cohorts. Incomes land, savings absorb the difference, and approval drifts toward *experienced* conditions: real income growth (loss-averse), own-basket inflation, joblessness, and queues for goods that never arrived. Whatever the statistics office printed, the bread l…",
      "lines": 181,
      "exports": [
        {
          "name": "cohorts",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/cohorts.ts",
          "line": 29
        }
      ],
      "imports": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/math.ts",
        "packages/engine/src/pipeline/derive.ts",
        "packages/engine/src/pipeline/pipeline.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "importedBy": [
        "packages/engine/src/pipeline/pipeline.ts"
      ],
      "path": "packages/engine/src/pipeline/cohorts.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/pipeline/demography.ts",
      "label": "demography",
      "packageId": "engine",
      "category": "Pipeline",
      "summary": "Step 1.5 — demography. The century IS the transition window: a young 1946 pyramid ages quarter by quarter under endogenous fertility (falls with income, cities, surviving children, and a slow norms drift), income-driven mortality, and migration as a pressure valve. Cohort size…",
      "lines": 256,
      "exports": [
        {
          "name": "vitalRates",
          "kind": "function",
          "path": "packages/engine/src/pipeline/demography.ts",
          "line": 63
        },
        {
          "name": "classSizesFrom",
          "kind": "function",
          "path": "packages/engine/src/pipeline/demography.ts",
          "line": 82
        },
        {
          "name": "MigrationFlow",
          "kind": "interface",
          "path": "packages/engine/src/pipeline/demography.ts",
          "line": 96
        },
        {
          "name": "migrationFlow",
          "kind": "function",
          "path": "packages/engine/src/pipeline/demography.ts",
          "line": 118
        },
        {
          "name": "demography",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/demography.ts",
          "line": 144
        }
      ],
      "imports": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/math.ts",
        "packages/engine/src/pipeline/derive.ts",
        "packages/engine/src/pipeline/pipeline.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "importedBy": [
        "packages/engine/src/index.ts",
        "packages/engine/src/index.ts",
        "packages/engine/src/pipeline/pipeline.ts",
        "packages/engine/src/state/init.ts"
      ],
      "path": "packages/engine/src/pipeline/demography.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/pipeline/derive.ts",
      "label": "derive",
      "packageId": "engine",
      "category": "Pipeline",
      "summary": "Shared derived quantities used by several steps. Pure reads, no mutation.",
      "lines": 454,
      "exports": [
        {
          "name": "financierAnger",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 42
        },
        {
          "name": "sovereignRiskPremium",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 52
        },
        {
          "name": "bondIssuanceShare",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 62
        },
        {
          "name": "privateFundingSpread",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 72
        },
        {
          "name": "privateRealRate",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 82
        },
        {
          "name": "potentialOutput",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 91
        },
        {
          "name": "technologyAttainment",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 101
        },
        {
          "name": "laborForOutput",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 120
        },
        {
          "name": "effectivePrice",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 126
        },
        {
          "name": "laborForce",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 131
        },
        {
          "name": "totalLaborForce",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 141
        },
        {
          "name": "approvalIndex",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 147
        },
        {
          "name": "meanLogConsumption",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 161
        },
        {
          "name": "realConsumptionPerCapita",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 177
        },
        {
          "name": "householdSavingRate",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 190
        },
        {
          "name": "livingStandard",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 219
        },
        {
          "name": "giniIndex",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 227
        },
        {
          "name": "realIncomePerHead",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 272
        },
        {
          "name": "termsOfTrade",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 301
        },
        {
          "name": "enfranchisementIndex",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 323
        },
        {
          "name": "discontentIndex",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 345
        },
        {
          "name": "urbanShare",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 361
        },
        {
          "name": "statePower",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 369
        },
        {
          "name": "corridorOffset",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 381
        },
        {
          "name": "corridorStrain",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 387
        },
        {
          "name": "inCorridor",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 395
        },
        {
          "name": "effectiveBlocPower",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 403
        },
        {
          "name": "eliteHostility",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 411
        },
        {
          "name": "eliteCapture",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 426
        },
        {
          "name": "creativeDestruction",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 439
        },
        {
          "name": "cohortCpi",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 448
        }
      ],
      "imports": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/math.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "importedBy": [
        "packages/engine/src/actions/apply.ts",
        "packages/engine/src/index.ts",
        "packages/engine/src/pipeline/cohorts.ts",
        "packages/engine/src/pipeline/demography.ts",
        "packages/engine/src/pipeline/finance.ts",
        "packages/engine/src/pipeline/fiscal.ts",
        "packages/engine/src/pipeline/institutions.ts",
        "packages/engine/src/pipeline/labor.ts",
        "packages/engine/src/pipeline/politics.ts",
        "packages/engine/src/pipeline/prices.ts",
        "packages/engine/src/pipeline/production.ts",
        "packages/engine/src/pipeline/statistics.ts",
        "packages/engine/src/pipeline/technology.ts"
      ],
      "path": "packages/engine/src/pipeline/derive.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/pipeline/finance.ts",
      "label": "finance",
      "packageId": "engine",
      "category": "Pipeline",
      "summary": "Step 3.5 — the financial sector. The credit cycle is the amplifier and the crisis clock in one. Each quarter: • banks set a credit target from the real rate, collateral (asset prices), and animal spirits — capped by their capital; credit adjusts toward it; • asset prices (a To…",
      "lines": 200,
      "exports": [
        {
          "name": "finance",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/finance.ts",
          "line": 60
        }
      ],
      "imports": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/math.ts",
        "packages/engine/src/pipeline/derive.ts",
        "packages/engine/src/pipeline/pipeline.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "importedBy": [
        "packages/engine/src/pipeline/pipeline.ts"
      ],
      "path": "packages/engine/src/pipeline/finance.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/pipeline/fiscal.ts",
      "label": "fiscal",
      "packageId": "engine",
      "category": "Pipeline",
      "summary": "Step 3 — fiscal. Tax collection is capacity-gated: the state taxes what it can see, not true GDP. Spending executes with leakage. Deficits the bond market won't absorb are monetized — the printing press is not a button the player pushes, it's what happens when the arithmetic f…",
      "lines": 124,
      "exports": [
        {
          "name": "fiscal",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/fiscal.ts",
          "line": 27
        }
      ],
      "imports": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/math.ts",
        "packages/engine/src/pipeline/derive.ts",
        "packages/engine/src/pipeline/pipeline.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "importedBy": [
        "packages/engine/src/pipeline/pipeline.ts"
      ],
      "path": "packages/engine/src/pipeline/fiscal.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/pipeline/foreignInvestment.ts",
      "label": "foreignInvestment",
      "packageId": "engine",
      "category": "Pipeline",
      "summary": "Step 3.75 — foreign direct investment. Direct investors build productive capital rather than buying a liquid claim, so the flow is sticky and enters the ordinary investment order book. Attraction is systemic: small-country scale, trade access, catch-up room, administration, re…",
      "lines": 137,
      "exports": [
        {
          "name": "foreignInvestment",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/foreignInvestment.ts",
          "line": 33
        }
      ],
      "imports": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/math.ts",
        "packages/engine/src/pipeline/pipeline.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "importedBy": [
        "packages/engine/src/pipeline/pipeline.ts"
      ],
      "path": "packages/engine/src/pipeline/foreignInvestment.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/pipeline/institutions.ts",
      "label": "institutions",
      "packageId": "engine",
      "category": "Pipeline",
      "summary": "Step 8 — institutions and the Narrow Corridor. The half of the game that isn't the economy.",
      "lines": 443,
      "exports": [
        {
          "name": "franchiseOf",
          "kind": "function",
          "path": "packages/engine/src/pipeline/institutions.ts",
          "line": 106
        },
        {
          "name": "initialInstitutions",
          "kind": "function",
          "path": "packages/engine/src/pipeline/institutions.ts",
          "line": 291
        },
        {
          "name": "institutions",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/institutions.ts",
          "line": 329
        }
      ],
      "imports": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/math.ts",
        "packages/engine/src/pipeline/derive.ts",
        "packages/engine/src/pipeline/pipeline.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "importedBy": [
        "packages/engine/src/index.ts",
        "packages/engine/src/pipeline/pipeline.ts",
        "packages/engine/src/state/init.ts"
      ],
      "path": "packages/engine/src/pipeline/institutions.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/pipeline/labor.ts",
      "label": "labor",
      "packageId": "engine",
      "category": "Pipeline",
      "summary": "Step 6 — labor & capital. Employment chases demanded output with friction; wages respond to labor-market tightness plus inflation pass-through. Investment goods bought this tick become capital, allocated where utilization is pressing against the ceiling.",
      "lines": 121,
      "exports": [
        {
          "name": "labor",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/labor.ts",
          "line": 26
        }
      ],
      "imports": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/math.ts",
        "packages/engine/src/pipeline/derive.ts",
        "packages/engine/src/pipeline/pipeline.ts"
      ],
      "importedBy": [
        "packages/engine/src/pipeline/pipeline.ts"
      ],
      "path": "packages/engine/src/pipeline/labor.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/pipeline/monetary.ts",
      "label": "monetary",
      "packageId": "engine",
      "category": "Pipeline",
      "summary": "Step 4 — monetary. Inflation expectations adapt toward realized inflation, and the printing press feeds them directly: money-financed deficits raise expected inflation before they even hit prices. Rate transmission happens in production (investment reads the real rate).",
      "lines": 30,
      "exports": [
        {
          "name": "monetary",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/monetary.ts",
          "line": 12
        }
      ],
      "imports": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/math.ts",
        "packages/engine/src/pipeline/pipeline.ts"
      ],
      "importedBy": [
        "packages/engine/src/pipeline/pipeline.ts"
      ],
      "path": "packages/engine/src/pipeline/monetary.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/pipeline/pipeline.ts",
      "label": "pipeline",
      "packageId": "engine",
      "category": "Pipeline",
      "summary": "The tick is an ordered fold over pipeline steps (§4). Order is explicit and versioned — reordering is a schema-version event. Steps communicate only through state; each gets its own RNG substream keyed by (seed, step name, tick), so adding a draw in one step never shifts anoth…",
      "lines": 66,
      "exports": [
        {
          "name": "PipelineStep",
          "kind": "interface",
          "path": "packages/engine/src/pipeline/pipeline.ts",
          "line": 13
        },
        {
          "name": "TICK_ORDER",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/pipeline.ts",
          "line": 35
        },
        {
          "name": "runTick",
          "kind": "function",
          "path": "packages/engine/src/pipeline/pipeline.ts",
          "line": 54
        }
      ],
      "imports": [
        "packages/engine/src/pipeline/cohorts.ts",
        "packages/engine/src/pipeline/demography.ts",
        "packages/engine/src/pipeline/finance.ts",
        "packages/engine/src/pipeline/fiscal.ts",
        "packages/engine/src/pipeline/foreignInvestment.ts",
        "packages/engine/src/pipeline/institutions.ts",
        "packages/engine/src/pipeline/labor.ts",
        "packages/engine/src/pipeline/monetary.ts",
        "packages/engine/src/pipeline/politics.ts",
        "packages/engine/src/pipeline/prices.ts",
        "packages/engine/src/pipeline/production.ts",
        "packages/engine/src/pipeline/shocks.ts",
        "packages/engine/src/pipeline/statistics.ts",
        "packages/engine/src/pipeline/technology.ts",
        "packages/engine/src/pipeline/trade.ts",
        "packages/engine/src/pipeline/world.ts",
        "packages/engine/src/rng/rng.ts",
        "packages/engine/src/state/schema.ts",
        "packages/engine/src/state/spending.ts"
      ],
      "importedBy": [
        "packages/engine/src/index.ts",
        "packages/engine/src/interregnum.ts",
        "packages/engine/src/pipeline/cohorts.ts",
        "packages/engine/src/pipeline/demography.ts",
        "packages/engine/src/pipeline/finance.ts",
        "packages/engine/src/pipeline/fiscal.ts",
        "packages/engine/src/pipeline/foreignInvestment.ts",
        "packages/engine/src/pipeline/institutions.ts",
        "packages/engine/src/pipeline/labor.ts",
        "packages/engine/src/pipeline/monetary.ts",
        "packages/engine/src/pipeline/politics.ts",
        "packages/engine/src/pipeline/prices.ts",
        "packages/engine/src/pipeline/production.ts",
        "packages/engine/src/pipeline/shocks.ts",
        "packages/engine/src/pipeline/statistics.ts",
        "packages/engine/src/pipeline/technology.ts",
        "packages/engine/src/pipeline/trade.ts",
        "packages/engine/src/pipeline/world.ts"
      ],
      "path": "packages/engine/src/pipeline/pipeline.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/pipeline/politics.ts",
      "label": "politics",
      "packageId": "engine",
      "category": "Pipeline",
      "summary": "Step 10 — politics. Political capital accrues from enfranchisement-weighted approval; elections every 16 quarters are the forcing function. Salience (ADR-0003): the growth term reads the statistics office's CURRENT headline — credit is banked when the number prints, and a late…",
      "lines": 182,
      "exports": [
        {
          "name": "electionThreshold",
          "kind": "function",
          "path": "packages/engine/src/pipeline/politics.ts",
          "line": 70
        },
        {
          "name": "politics",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/politics.ts",
          "line": 74
        }
      ],
      "imports": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/math.ts",
        "packages/engine/src/pipeline/derive.ts",
        "packages/engine/src/pipeline/pipeline.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "importedBy": [
        "packages/engine/src/index.ts",
        "packages/engine/src/pipeline/pipeline.ts"
      ],
      "path": "packages/engine/src/pipeline/politics.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/pipeline/prices.ts",
      "label": "prices",
      "packageId": "engine",
      "category": "Pipeline",
      "summary": "Step 5 — prices. Tâtonnement with a cost anchor: excess demand pulls prices up, excess supply down, and prices also drift toward unit cost × markup — that second term is how a fuel tax works its way from the refinery through the trucking industry into bread.",
      "lines": 73,
      "exports": [
        {
          "name": "prices",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/prices.ts",
          "line": 14
        }
      ],
      "imports": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/math.ts",
        "packages/engine/src/pipeline/derive.ts",
        "packages/engine/src/pipeline/pipeline.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "importedBy": [
        "packages/engine/src/pipeline/pipeline.ts"
      ],
      "path": "packages/engine/src/pipeline/prices.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/pipeline/production.ts",
      "label": "production",
      "packageId": "engine",
      "category": "Pipeline",
      "summary": "Step 1 — production. Builds this tick's demand from last tick's incomes and prices, solves the Leontief system for required gross output, and produces up to capacity. Excess demand is recorded for the price step; nothing here is a hand-authored effect arrow — a fuel tax reache…",
      "lines": 267,
      "exports": [
        {
          "name": "production",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/production.ts",
          "line": 43
        }
      ],
      "imports": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/math.ts",
        "packages/engine/src/pipeline/derive.ts",
        "packages/engine/src/pipeline/pipeline.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "importedBy": [
        "packages/engine/src/pipeline/pipeline.ts"
      ],
      "path": "packages/engine/src/pipeline/production.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/pipeline/shocks.ts",
      "label": "shocks",
      "packageId": "engine",
      "category": "Pipeline",
      "summary": "Step 0 — shocks. The crisis clock. Rare exogenous ruptures land here, at the head of the tick, so every later step lives in the shocked world: an oil crisis is a jump in the world energy price (imports dear, exports tempting — the tâtonnement and the I/O table do the rest, thr…",
      "lines": 73,
      "exports": [
        {
          "name": "shocks",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/shocks.ts",
          "line": 15
        }
      ],
      "imports": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/pipeline/pipeline.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "importedBy": [
        "packages/engine/src/pipeline/pipeline.ts"
      ],
      "path": "packages/engine/src/pipeline/shocks.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/pipeline/statistics.ts",
      "label": "statistics",
      "packageId": "engine",
      "category": "Pipeline",
      "summary": "Step 8 — statistics. The office measures the quarter, files the worksheet, and releases whatever falls due: first prints after a lag, revisions at +2 and +5 quarters. Noise draws come from `obs:*` substreams keyed by (indicator, measured quarter, revision) — orthogonal to the…",
      "lines": 554,
      "exports": [
        {
          "name": "INDICATOR_SPECS",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/statistics.ts",
          "line": 51
        },
        {
          "name": "statistics",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/statistics.ts",
          "line": 537
        }
      ],
      "imports": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/pipeline/derive.ts",
        "packages/engine/src/pipeline/pipeline.ts",
        "packages/engine/src/rng/rng.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "importedBy": [
        "packages/engine/src/pipeline/pipeline.ts"
      ],
      "path": "packages/engine/src/pipeline/statistics.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/pipeline/technology.ts",
      "label": "technology",
      "packageId": "engine",
      "category": "Pipeline",
      "summary": "Step 2.5 — technology. Two trees: the global frontier advances on a roughly historical schedule whether you exist or not; what you have ATTAINED chases each sector's slice of it at a speed set by absorptive capacity — schools first, openness second. Poor countries close the ga…",
      "lines": 258,
      "exports": [
        {
          "name": "frontierGrowthAt",
          "kind": "function",
          "path": "packages/engine/src/pipeline/technology.ts",
          "line": 38
        },
        {
          "name": "absorptiveCapacity",
          "kind": "function",
          "path": "packages/engine/src/pipeline/technology.ts",
          "line": 57
        },
        {
          "name": "researchIntensity",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/technology.ts",
          "line": 72
        },
        {
          "name": "ResearchAllocation",
          "kind": "interface",
          "path": "packages/engine/src/pipeline/technology.ts",
          "line": 74
        },
        {
          "name": "researchAllocation",
          "kind": "function",
          "path": "packages/engine/src/pipeline/technology.ts",
          "line": 104
        },
        {
          "name": "breakthroughHazard",
          "kind": "function",
          "path": "packages/engine/src/pipeline/technology.ts",
          "line": 162
        },
        {
          "name": "technology",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/technology.ts",
          "line": 181
        }
      ],
      "imports": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/math.ts",
        "packages/engine/src/pipeline/derive.ts",
        "packages/engine/src/pipeline/pipeline.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "importedBy": [
        "packages/engine/src/index.ts",
        "packages/engine/src/index.ts",
        "packages/engine/src/pipeline/pipeline.ts"
      ],
      "path": "packages/engine/src/pipeline/technology.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/pipeline/trade.ts",
      "label": "trade",
      "packageId": "engine",
      "category": "Pipeline",
      "summary": "Step 4 — trade. Books the external flows production decided on, moves reserves, and depreciates the currency when they run out. World prices and export demand are set upstream by the `world` step; this step just settles the balance of payments at them.",
      "lines": 47,
      "exports": [
        {
          "name": "trade",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/trade.ts",
          "line": 12
        }
      ],
      "imports": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/pipeline/pipeline.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "importedBy": [
        "packages/engine/src/pipeline/pipeline.ts"
      ],
      "path": "packages/engine/src/pipeline/trade.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/pipeline/world.ts",
      "label": "world",
      "packageId": "engine",
      "category": "Pipeline",
      "summary": "Step 2.5 — the rest of world. Four abstract trading partners, each an economy with its own business cycle, advance one quarter. Their strength sets two things the domestic economy then lives inside: • how much of your exports they buy (a partner in recession buys less); • the…",
      "lines": 125,
      "exports": [
        {
          "name": "world",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/world.ts",
          "line": 63
        }
      ],
      "imports": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/math.ts",
        "packages/engine/src/pipeline/pipeline.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "importedBy": [
        "packages/engine/src/pipeline/pipeline.ts"
      ],
      "path": "packages/engine/src/pipeline/world.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/rng/rng.ts",
      "label": "rng",
      "packageId": "engine",
      "category": "Randomness",
      "summary": "RNG discipline (§6 of the architecture doc): one root seed; every consumer derives a named substream keyed by (seed, label, tick). A step's draws are isolated — adding a draw in one step never shifts another step's sequence.",
      "lines": 84,
      "exports": [
        {
          "name": "Seed",
          "kind": "type",
          "path": "packages/engine/src/rng/rng.ts",
          "line": 11
        },
        {
          "name": "Rng",
          "kind": "interface",
          "path": "packages/engine/src/rng/rng.ts",
          "line": 13
        },
        {
          "name": "rngFor",
          "kind": "function",
          "path": "packages/engine/src/rng/rng.ts",
          "line": 77
        }
      ],
      "imports": [],
      "importedBy": [
        "packages/engine/src/countries.ts",
        "packages/engine/src/index.ts",
        "packages/engine/src/index.ts",
        "packages/engine/src/interregnum.ts",
        "packages/engine/src/pipeline/pipeline.ts",
        "packages/engine/src/pipeline/statistics.ts",
        "packages/engine/src/state/init.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "path": "packages/engine/src/rng/rng.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/state/init.ts",
      "label": "init",
      "packageId": "engine",
      "category": "State",
      "summary": "Country generation. A country is a parameter vector (ADR-0011); init() calibrates a TrueState from it so the economy starts near equilibrium — tfp is solved from target outputs rather than guessed, so tick 1 doesn't open with a shock.",
      "lines": 458,
      "exports": [
        {
          "name": "synthPyramid",
          "kind": "function",
          "path": "packages/engine/src/state/init.ts",
          "line": 91
        },
        {
          "name": "init",
          "kind": "function",
          "path": "packages/engine/src/state/init.ts",
          "line": 160
        }
      ],
      "imports": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/countries.ts",
        "packages/engine/src/math.ts",
        "packages/engine/src/pipeline/demography.ts",
        "packages/engine/src/pipeline/institutions.ts",
        "packages/engine/src/rng/rng.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "importedBy": [
        "packages/engine/src/index.ts",
        "packages/engine/src/interregnum.ts"
      ],
      "path": "packages/engine/src/state/init.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/state/schema.ts",
      "label": "schema",
      "packageId": "engine",
      "category": "State",
      "summary": "State schema (§3 of the architecture doc). One root object, plain data — structured-clone-able, hashable, diffable. Reserved fields ship at zero.",
      "lines": 849,
      "exports": [
        {
          "name": "Qtr",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 8
        },
        {
          "name": "Money",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 9
        },
        {
          "name": "Ratio",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 10
        },
        {
          "name": "GAME_RULE_IDS",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 23
        },
        {
          "name": "GameRuleId",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 24
        },
        {
          "name": "GameRules",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 25
        },
        {
          "name": "STANDARD_RULES",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 28
        },
        {
          "name": "GameMode",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 40
        },
        {
          "name": "gameRules",
          "kind": "function",
          "path": "packages/engine/src/state/schema.ts",
          "line": 44
        },
        {
          "name": "SECTOR_IDS",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 49
        },
        {
          "name": "SectorId",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 50
        },
        {
          "name": "COHORT_IDS",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 52
        },
        {
          "name": "CohortId",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 59
        },
        {
          "name": "WORKING_CLASS_IDS",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 62
        },
        {
          "name": "WorkingClassId",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 68
        },
        {
          "name": "CAPACITY_IDS",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 70
        },
        {
          "name": "CapacityId",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 71
        },
        {
          "name": "REVENUE_SOURCE_IDS",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 77
        },
        {
          "name": "RevenueSourceId",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 78
        },
        {
          "name": "RevenueSplit",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 79
        },
        {
          "name": "OUTLAY_IDS",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 85
        },
        {
          "name": "OutlayId",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 94
        },
        {
          "name": "OutlaySplit",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 95
        },
        {
          "name": "SPENDING_PROGRAM_IDS",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 99
        },
        {
          "name": "SpendingProgramId",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 100
        },
        {
          "name": "SpendingRule",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 111
        },
        {
          "name": "SpendingRuleMode",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 115
        },
        {
          "name": "SpendingRules",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 116
        },
        {
          "name": "INSTITUTION_IDS",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 122
        },
        {
          "name": "InstitutionId",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 123
        },
        {
          "name": "BLOC_IDS",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 128
        },
        {
          "name": "BlocId",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 129
        },
        {
          "name": "PLATFORM_IDS",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 135
        },
        {
          "name": "PlatformId",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 136
        },
        {
          "name": "INDICATOR_IDS",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 138
        },
        {
          "name": "IndicatorId",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 198
        },
        {
          "name": "PARTNER_IDS",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 201
        },
        {
          "name": "PartnerId",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 202
        },
        {
          "name": "CountryParams",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 205
        },
        {
          "name": "CountryStructure",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 239
        },
        {
          "name": "AGE_BANDS",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 252
        },
        {
          "name": "RETIREMENT_BAND",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 255
        },
        {
          "name": "WORKING_BANDS",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 257
        },
        {
          "name": "FERTILE_BANDS",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 259
        },
        {
          "name": "DemographyState",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 261
        },
        {
          "name": "Cohort",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 291
        },
        {
          "name": "Sector",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 309
        },
        {
          "name": "IOTable",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 322
        },
        {
          "name": "MarketState",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 328
        },
        {
          "name": "DialState",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 341
        },
        {
          "name": "PolicyRecord",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 371
        },
        {
          "name": "CapacityBuild",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 382
        },
        {
          "name": "GovernmentState",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 389
        },
        {
          "name": "WorldPartner",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 406
        },
        {
          "name": "WorldState",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 411
        },
        {
          "name": "ExternalState",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 418
        },
        {
          "name": "TechState",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 438
        },
        {
          "name": "FinanceState",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 457
        },
        {
          "name": "Bloc",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 483
        },
        {
          "name": "InstitutionState",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 490
        },
        {
          "name": "ElectionResult",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 512
        },
        {
          "name": "PoliticalState",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 528
        },
        {
          "name": "FragilityLedger",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 548
        },
        {
          "name": "StatPrint",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 556
        },
        {
          "name": "NewsItem",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 566
        },
        {
          "name": "StatRecord",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 575
        },
        {
          "name": "StatsOffice",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 691
        },
        {
          "name": "TickFlows",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 700
        },
        {
          "name": "TrueState",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 755
        },
        {
          "name": "SCHEMA_VERSION",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 803
        },
        {
          "name": "ENGINE_VERSION",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 804
        },
        {
          "name": "ELECTION_PERIOD",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 805
        },
        {
          "name": "CAMPAIGN_WINDOW",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 808
        },
        {
          "name": "END_OF_HISTORY_TICK",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 810
        },
        {
          "name": "FIRST_YEAR",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 815
        },
        {
          "name": "yearOfTick",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 817
        },
        {
          "name": "tickForYear",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 821
        },
        {
          "name": "LAST_APPOINTMENT_TICK",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 826
        },
        {
          "name": "appointmentTick",
          "kind": "function",
          "path": "packages/engine/src/state/schema.ts",
          "line": 841
        },
        {
          "name": "sectorIndex",
          "kind": "function",
          "path": "packages/engine/src/state/schema.ts",
          "line": 846
        }
      ],
      "imports": [
        "packages/engine/src/rng/rng.ts"
      ],
      "importedBy": [
        "packages/engine/src/actions/apply.ts",
        "packages/engine/src/actions/types.ts",
        "packages/engine/src/constants.ts",
        "packages/engine/src/countries.ts",
        "packages/engine/src/countryDocument.ts",
        "packages/engine/src/index.ts",
        "packages/engine/src/index.ts",
        "packages/engine/src/interregnum.ts",
        "packages/engine/src/math.ts",
        "packages/engine/src/pipeline/cohorts.ts",
        "packages/engine/src/pipeline/demography.ts",
        "packages/engine/src/pipeline/derive.ts",
        "packages/engine/src/pipeline/finance.ts",
        "packages/engine/src/pipeline/fiscal.ts",
        "packages/engine/src/pipeline/foreignInvestment.ts",
        "packages/engine/src/pipeline/institutions.ts",
        "packages/engine/src/pipeline/pipeline.ts",
        "packages/engine/src/pipeline/politics.ts",
        "packages/engine/src/pipeline/prices.ts",
        "packages/engine/src/pipeline/production.ts",
        "packages/engine/src/pipeline/shocks.ts",
        "packages/engine/src/pipeline/statistics.ts",
        "packages/engine/src/pipeline/technology.ts",
        "packages/engine/src/pipeline/trade.ts",
        "packages/engine/src/pipeline/world.ts",
        "packages/engine/src/state/init.ts",
        "packages/engine/src/state/spending.ts",
        "packages/engine/src/state/validate.ts"
      ],
      "path": "packages/engine/src/state/schema.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/state/spending.ts",
      "label": "spending",
      "packageId": "engine",
      "category": "State",
      "summary": "Recurring expenditure rules. The economy still consumes one resolved money-per-quarter number per programme; this module is the single place standing rules turn into those numbers.",
      "lines": 162,
      "exports": [
        {
          "name": "officialNominalGdp",
          "kind": "function",
          "path": "packages/engine/src/state/spending.ts",
          "line": 38
        },
        {
          "name": "latestInitialInflationQuarter",
          "kind": "function",
          "path": "packages/engine/src/state/spending.ts",
          "line": 51
        },
        {
          "name": "spendingRuleTarget",
          "kind": "function",
          "path": "packages/engine/src/state/spending.ts",
          "line": 57
        },
        {
          "name": "createSpendingRule",
          "kind": "function",
          "path": "packages/engine/src/state/spending.ts",
          "line": 70
        },
        {
          "name": "scaleSpendingRule",
          "kind": "function",
          "path": "packages/engine/src/state/spending.ts",
          "line": 94
        },
        {
          "name": "resolveSpendingRules",
          "kind": "function",
          "path": "packages/engine/src/state/spending.ts",
          "line": 145
        }
      ],
      "imports": [
        "packages/engine/src/math.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "importedBy": [
        "packages/engine/src/actions/apply.ts",
        "packages/engine/src/pipeline/pipeline.ts"
      ],
      "path": "packages/engine/src/state/spending.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/state/validate.ts",
      "label": "validate",
      "packageId": "engine",
      "category": "State",
      "summary": "Invariant checks (dev builds and test suites). Throws with a pointed message — a violated invariant is a bug in a step, never a shrug.",
      "lines": 146,
      "exports": [
        {
          "name": "InvariantError",
          "kind": "class",
          "path": "packages/engine/src/state/validate.ts",
          "line": 15
        },
        {
          "name": "validate",
          "kind": "function",
          "path": "packages/engine/src/state/validate.ts",
          "line": 21
        }
      ],
      "imports": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "importedBy": [
        "packages/engine/src/index.ts"
      ],
      "path": "packages/engine/src/state/validate.ts",
      "line": 1
    },
    {
      "id": "packages/fixtures/countries/standard.ts",
      "label": "standard",
      "packageId": "fixtures",
      "category": "Fixtures",
      "summary": "",
      "lines": 6,
      "exports": [
        {
          "name": "standardCountry",
          "kind": "constant",
          "path": "packages/fixtures/countries/standard.ts",
          "line": 5
        }
      ],
      "imports": [
        "packages/engine/src/index.ts"
      ],
      "importedBy": [
        "packages/fixtures/index.ts"
      ],
      "path": "packages/fixtures/countries/standard.ts",
      "line": 1
    },
    {
      "id": "packages/fixtures/index.ts",
      "label": "index",
      "packageId": "fixtures",
      "category": "Fixtures",
      "summary": "",
      "lines": 10,
      "exports": [],
      "imports": [
        "packages/fixtures/countries/standard.ts",
        "packages/fixtures/scripts/scripts.ts"
      ],
      "importedBy": [],
      "path": "packages/fixtures/index.ts",
      "line": 1
    },
    {
      "id": "packages/fixtures/scripts/scripts.ts",
      "label": "scripts",
      "packageId": "fixtures",
      "category": "Fixtures",
      "summary": "",
      "lines": 31,
      "exports": [
        {
          "name": "passive",
          "kind": "constant",
          "path": "packages/fixtures/scripts/scripts.ts",
          "line": 6
        },
        {
          "name": "fuelTaxAtQ8",
          "kind": "constant",
          "path": "packages/fixtures/scripts/scripts.ts",
          "line": 9
        },
        {
          "name": "agriSubsidyAtQ8",
          "kind": "constant",
          "path": "packages/fixtures/scripts/scripts.ts",
          "line": 14
        },
        {
          "name": "investStatsAtQ4",
          "kind": "constant",
          "path": "packages/fixtures/scripts/scripts.ts",
          "line": 19
        },
        {
          "name": "ubiPush",
          "kind": "constant",
          "path": "packages/fixtures/scripts/scripts.ts",
          "line": 24
        },
        {
          "name": "scripts",
          "kind": "constant",
          "path": "packages/fixtures/scripts/scripts.ts",
          "line": 30
        }
      ],
      "imports": [
        "packages/engine/src/index.ts"
      ],
      "importedBy": [
        "packages/fixtures/index.ts"
      ],
      "path": "packages/fixtures/scripts/scripts.ts",
      "line": 1
    },
    {
      "id": "packages/observation/src/index.ts",
      "label": "index",
      "packageId": "observation",
      "category": "Published projection",
      "summary": "",
      "lines": 34,
      "exports": [],
      "imports": [
        "packages/observation/src/observe.ts",
        "packages/observation/src/published.ts"
      ],
      "importedBy": [
        "packages/ui/src/accounts.ts",
        "packages/ui/src/budgetChart.ts",
        "packages/ui/src/components/AnalogGauge/AnalogGauge.tsx",
        "packages/ui/src/components/BlankPlate/BlankPlate.tsx",
        "packages/ui/src/components/CorridorPlot/CorridorPlot.tsx",
        "packages/ui/src/components/Gauge/Gauge.tsx",
        "packages/ui/src/components/RackStrip/RackStrip.tsx",
        "packages/ui/src/components/TerminalTicker/TerminalTicker.tsx",
        "packages/ui/src/components/labels.ts",
        "packages/ui/src/components/series.ts",
        "packages/ui/src/dev/galleryFixtures.ts",
        "packages/ui/src/domains.ts",
        "packages/ui/src/gameRules.ts",
        "packages/ui/src/incidence.ts",
        "packages/ui/src/manual.ts",
        "packages/ui/src/maturity.ts",
        "packages/ui/src/maturity.ts",
        "packages/ui/src/panels/AccountsOverlay.tsx",
        "packages/ui/src/panels/CensusOverlay.tsx",
        "packages/ui/src/panels/ControlRail.tsx",
        "packages/ui/src/panels/ElectionOverlay.tsx",
        "packages/ui/src/panels/ElectionResultOverlay.tsx",
        "packages/ui/src/panels/FinanceOverlay.tsx",
        "packages/ui/src/panels/HeaderBar.tsx",
        "packages/ui/src/panels/Instruments.tsx",
        "packages/ui/src/panels/LedgerOverlay.tsx",
        "packages/ui/src/panels/LedgerOverlay.tsx",
        "packages/ui/src/panels/LedgerPanel.tsx",
        "packages/ui/src/panels/NewsWire.tsx",
        "packages/ui/src/panels/PolicyOverlay.tsx",
        "packages/ui/src/panels/ReportCardOverlay.tsx",
        "packages/ui/src/panels/SettingsOverlay.tsx",
        "packages/ui/src/panels/StudyOverlay.tsx",
        "packages/ui/src/panels/WireOverlay.tsx",
        "packages/ui/src/policyRecord.ts",
        "packages/ui/src/spendingRules.ts",
        "packages/ui/src/store/gameStore.ts",
        "packages/ui/src/store/gameStore.ts",
        "packages/ui/src/wallPlan.ts",
        "packages/ui/src/worker/protocol.ts",
        "packages/ui/src/worker/sim.worker.ts"
      ],
      "path": "packages/observation/src/index.ts",
      "line": 1
    },
    {
      "id": "packages/observation/src/observe.ts",
      "label": "observe",
      "packageId": "observation",
      "category": "Published projection",
      "summary": "observe() — a pure projection of what the government can see (ADR-0003). The fog itself (lag, noise, revisions, funding gates) lives in the engine's statistics step, because politics now reads the prints too; this function only attaches presentation and assembles the desk: pub…",
      "lines": 257,
      "exports": [
        {
          "name": "observe",
          "kind": "function",
          "path": "packages/observation/src/observe.ts",
          "line": 155
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/observation/src/published.ts"
      ],
      "importedBy": [
        "packages/observation/src/index.ts"
      ],
      "path": "packages/observation/src/observe.ts",
      "line": 1
    },
    {
      "id": "packages/observation/src/published.ts",
      "label": "published",
      "packageId": "observation",
      "category": "Published projection",
      "summary": "PublishedState — the ONLY types the ui package may import (§3.1). Everything here is what a government of the period could actually know: its own dials and books exactly, the economy only through its statistical apparatus, plus rumors. The prints themselves are made in the eng…",
      "lines": 211,
      "exports": [
        {
          "name": "PolicyPoint",
          "kind": "type",
          "path": "packages/observation/src/published.ts",
          "line": 45
        },
        {
          "name": "IndicatorPoint",
          "kind": "type",
          "path": "packages/observation/src/published.ts",
          "line": 48
        },
        {
          "name": "IndicatorSeries",
          "kind": "interface",
          "path": "packages/observation/src/published.ts",
          "line": 50
        },
        {
          "name": "Grade",
          "kind": "type",
          "path": "packages/observation/src/published.ts",
          "line": 57
        },
        {
          "name": "ReportCard",
          "kind": "interface",
          "path": "packages/observation/src/published.ts",
          "line": 61
        },
        {
          "name": "PublishedBloc",
          "kind": "interface",
          "path": "packages/observation/src/published.ts",
          "line": 90
        },
        {
          "name": "PublishedCorridor",
          "kind": "interface",
          "path": "packages/observation/src/published.ts",
          "line": 102
        },
        {
          "name": "PublishedCampaign",
          "kind": "interface",
          "path": "packages/observation/src/published.ts",
          "line": 114
        },
        {
          "name": "PublishedState",
          "kind": "interface",
          "path": "packages/observation/src/published.ts",
          "line": 124
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/engine/src/index.ts"
      ],
      "importedBy": [
        "packages/observation/src/index.ts",
        "packages/observation/src/observe.ts"
      ],
      "path": "packages/observation/src/published.ts",
      "line": 1
    },
    {
      "id": "packages/runner/src/batch.ts",
      "label": "batch",
      "packageId": "runner",
      "category": "Headless runner",
      "summary": "Batch runner — the balance dashboard's data source and the M0 DoD probe: N random-policy runs, wall time, NaN count, explosion count.",
      "lines": 115,
      "exports": [
        {
          "name": "BatchResult",
          "kind": "interface",
          "path": "packages/runner/src/batch.ts",
          "line": 24
        },
        {
          "name": "BatchRunResult",
          "kind": "type",
          "path": "packages/runner/src/batch.ts",
          "line": 31
        },
        {
          "name": "UnhashedBatchRunResult",
          "kind": "type",
          "path": "packages/runner/src/batch.ts",
          "line": 32
        },
        {
          "name": "SummaryBatchResult",
          "kind": "type",
          "path": "packages/runner/src/batch.ts",
          "line": 33
        },
        {
          "name": "BatchOptions",
          "kind": "interface",
          "path": "packages/runner/src/batch.ts",
          "line": 35
        },
        {
          "name": "runBatch",
          "kind": "function",
          "path": "packages/runner/src/batch.ts",
          "line": 68
        },
        {
          "name": "runBatchWithoutHashes",
          "kind": "function",
          "path": "packages/runner/src/batch.ts",
          "line": 80
        },
        {
          "name": "runSummaryBatch",
          "kind": "function",
          "path": "packages/runner/src/batch.ts",
          "line": 89
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/runner/src/metrics.ts",
        "packages/runner/src/policies.ts",
        "packages/runner/src/report.ts",
        "packages/runner/src/run.ts"
      ],
      "importedBy": [
        "packages/runner/src/report.ts",
        "packages/runner/src/stability-cli.ts"
      ],
      "path": "packages/runner/src/batch.ts",
      "line": 1
    },
    {
      "id": "packages/runner/src/debt.ts",
      "label": "debt",
      "packageId": "runner",
      "category": "Headless runner",
      "summary": "Pure fiscal diagnostics shared by the batch report and investigation tools.",
      "lines": 49,
      "exports": [
        {
          "name": "DEBT_FREE_RATIO",
          "kind": "constant",
          "path": "packages/runner/src/debt.ts",
          "line": 5
        },
        {
          "name": "debtToGdp",
          "kind": "function",
          "path": "packages/runner/src/debt.ts",
          "line": 8
        },
        {
          "name": "firstDebtFreeQuarter",
          "kind": "function",
          "path": "packages/runner/src/debt.ts",
          "line": 12
        },
        {
          "name": "FiscalRatios",
          "kind": "interface",
          "path": "packages/runner/src/debt.ts",
          "line": 18
        },
        {
          "name": "standingProgrammeOutlays",
          "kind": "function",
          "path": "packages/runner/src/debt.ts",
          "line": 26
        },
        {
          "name": "fiscalRatios",
          "kind": "function",
          "path": "packages/runner/src/debt.ts",
          "line": 38
        }
      ],
      "imports": [
        "packages/engine/src/index.ts"
      ],
      "importedBy": [
        "packages/runner/src/run.ts"
      ],
      "path": "packages/runner/src/debt.ts",
      "line": 1
    },
    {
      "id": "packages/runner/src/export-feedback-cli.ts",
      "label": "export-feedback-cli",
      "packageId": "runner",
      "category": "Headless runner",
      "summary": "",
      "lines": 64,
      "exports": [],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/runner/src/export-feedback.ts"
      ],
      "importedBy": [],
      "path": "packages/runner/src/export-feedback-cli.ts",
      "line": 1
    },
    {
      "id": "packages/runner/src/export-feedback.ts",
      "label": "export-feedback",
      "packageId": "runner",
      "category": "Headless runner",
      "summary": "Test-only causal harness for ordinary foreign-demand volatility.",
      "lines": 508,
      "exports": [
        {
          "name": "ExportFeedbackPath",
          "kind": "type",
          "path": "packages/runner/src/export-feedback.ts",
          "line": 39
        },
        {
          "name": "ExportFeedbackExperiment",
          "kind": "interface",
          "path": "packages/runner/src/export-feedback.ts",
          "line": 45
        },
        {
          "name": "ExportFeedbackHorizon",
          "kind": "interface",
          "path": "packages/runner/src/export-feedback.ts",
          "line": 54
        },
        {
          "name": "EraExportFeedback",
          "kind": "interface",
          "path": "packages/runner/src/export-feedback.ts",
          "line": 73
        },
        {
          "name": "ExportFeedbackReport",
          "kind": "interface",
          "path": "packages/runner/src/export-feedback.ts",
          "line": 81
        },
        {
          "name": "runExportFeedbackExperiment",
          "kind": "function",
          "path": "packages/runner/src/export-feedback.ts",
          "line": 228
        },
        {
          "name": "analyzeExportFeedback",
          "kind": "function",
          "path": "packages/runner/src/export-feedback.ts",
          "line": 480
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/runner/src/run.ts",
        "packages/runner/src/stability.ts"
      ],
      "importedBy": [
        "packages/runner/src/export-feedback-cli.ts"
      ],
      "path": "packages/runner/src/export-feedback.ts",
      "line": 1
    },
    {
      "id": "packages/runner/src/metrics.ts",
      "label": "metrics",
      "packageId": "runner",
      "category": "Headless runner",
      "summary": "",
      "lines": 50,
      "exports": [
        {
          "name": "quantile",
          "kind": "function",
          "path": "packages/runner/src/metrics.ts",
          "line": 5
        },
        {
          "name": "summarize",
          "kind": "function",
          "path": "packages/runner/src/metrics.ts",
          "line": 13
        },
        {
          "name": "cagr",
          "kind": "function",
          "path": "packages/runner/src/metrics.ts",
          "line": 26
        },
        {
          "name": "meanAnnualInflation",
          "kind": "function",
          "path": "packages/runner/src/metrics.ts",
          "line": 34
        },
        {
          "name": "meanUnemployment",
          "kind": "function",
          "path": "packages/runner/src/metrics.ts",
          "line": 39
        },
        {
          "name": "priceAt",
          "kind": "function",
          "path": "packages/runner/src/metrics.ts",
          "line": 45
        }
      ],
      "imports": [
        "packages/runner/src/run.ts"
      ],
      "importedBy": [
        "packages/runner/src/batch.ts",
        "packages/runner/src/report.ts",
        "packages/runner/src/stability.ts"
      ],
      "path": "packages/runner/src/metrics.ts",
      "line": 1
    },
    {
      "id": "packages/runner/src/policies.ts",
      "label": "policies",
      "packageId": "runner",
      "category": "Headless runner",
      "summary": "Named runner policies. These are sampling strategies, not engine rules.",
      "lines": 71,
      "exports": [
        {
          "name": "POLICY_IDS",
          "kind": "constant",
          "path": "packages/runner/src/policies.ts",
          "line": 12
        },
        {
          "name": "PolicyId",
          "kind": "type",
          "path": "packages/runner/src/policies.ts",
          "line": 13
        },
        {
          "name": "RunnerPolicy",
          "kind": "type",
          "path": "packages/runner/src/policies.ts",
          "line": 14
        },
        {
          "name": "developmentalPolicy",
          "kind": "constant",
          "path": "packages/runner/src/policies.ts",
          "line": 21
        },
        {
          "name": "randomPolicy",
          "kind": "constant",
          "path": "packages/runner/src/policies.ts",
          "line": 28
        },
        {
          "name": "policyFor",
          "kind": "function",
          "path": "packages/runner/src/policies.ts",
          "line": 67
        }
      ],
      "imports": [
        "packages/engine/src/index.ts"
      ],
      "importedBy": [
        "packages/runner/src/batch.ts",
        "packages/runner/src/stability-cli.ts"
      ],
      "path": "packages/runner/src/policies.ts",
      "line": 1
    },
    {
      "id": "packages/runner/src/report.ts",
      "label": "report",
      "packageId": "runner",
      "category": "Headless runner",
      "summary": "",
      "lines": 70,
      "exports": [
        {
          "name": "printReport",
          "kind": "function",
          "path": "packages/runner/src/report.ts",
          "line": 14
        }
      ],
      "imports": [
        "packages/runner/src/batch.ts",
        "packages/runner/src/metrics.ts"
      ],
      "importedBy": [
        "packages/runner/src/batch.ts"
      ],
      "path": "packages/runner/src/report.ts",
      "line": 1
    },
    {
      "id": "packages/runner/src/run.ts",
      "label": "run",
      "packageId": "runner",
      "category": "Headless runner",
      "summary": "Single headless run: seed + script → trajectory or streamed summary. The detailed trajectory remains the unit for property and stability analysis; the ordinary batch report reduces it as the simulation runs.",
      "lines": 346,
      "exports": [
        {
          "name": "TrajectoryPoint",
          "kind": "interface",
          "path": "packages/runner/src/run.ts",
          "line": 29
        },
        {
          "name": "MacroDrivers",
          "kind": "interface",
          "path": "packages/runner/src/run.ts",
          "line": 54
        },
        {
          "name": "MacroEvent",
          "kind": "type",
          "path": "packages/runner/src/run.ts",
          "line": 73
        },
        {
          "name": "RunResult",
          "kind": "interface",
          "path": "packages/runner/src/run.ts",
          "line": 82
        },
        {
          "name": "RunResultWithoutHash",
          "kind": "type",
          "path": "packages/runner/src/run.ts",
          "line": 97
        },
        {
          "name": "RunSummary",
          "kind": "interface",
          "path": "packages/runner/src/run.ts",
          "line": 102
        },
        {
          "name": "RunOptions",
          "kind": "interface",
          "path": "packages/runner/src/run.ts",
          "line": 118
        },
        {
          "name": "eventsBetween",
          "kind": "function",
          "path": "packages/runner/src/run.ts",
          "line": 135
        },
        {
          "name": "trajectoryPoint",
          "kind": "function",
          "path": "packages/runner/src/run.ts",
          "line": 161
        },
        {
          "name": "runOne",
          "kind": "function",
          "path": "packages/runner/src/run.ts",
          "line": 299
        },
        {
          "name": "runOne",
          "kind": "function",
          "path": "packages/runner/src/run.ts",
          "line": 300
        },
        {
          "name": "runOne",
          "kind": "function",
          "path": "packages/runner/src/run.ts",
          "line": 301
        },
        {
          "name": "runSummary",
          "kind": "function",
          "path": "packages/runner/src/run.ts",
          "line": 309
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/runner/src/debt.ts"
      ],
      "importedBy": [
        "packages/runner/src/batch.ts",
        "packages/runner/src/export-feedback.ts",
        "packages/runner/src/metrics.ts",
        "packages/runner/src/stability.ts"
      ],
      "path": "packages/runner/src/run.ts",
      "line": 1
    },
    {
      "id": "packages/runner/src/stability-cli.ts",
      "label": "stability-cli",
      "packageId": "runner",
      "category": "Headless runner",
      "summary": "Long-horizon balance harness: pnpm stability -- --runs 120 --policy all --country all",
      "lines": 68,
      "exports": [],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/runner/src/batch.ts",
        "packages/runner/src/policies.ts",
        "packages/runner/src/stability-report.ts",
        "packages/runner/src/stability.ts"
      ],
      "importedBy": [],
      "path": "packages/runner/src/stability-cli.ts",
      "line": 1
    },
    {
      "id": "packages/runner/src/stability-report.ts",
      "label": "stability-report",
      "packageId": "runner",
      "category": "Headless runner",
      "summary": "",
      "lines": 132,
      "exports": [
        {
          "name": "printStabilityReport",
          "kind": "function",
          "path": "packages/runner/src/stability-report.ts",
          "line": 11
        }
      ],
      "imports": [
        "packages/runner/src/stability.ts"
      ],
      "importedBy": [
        "packages/runner/src/stability-cli.ts"
      ],
      "path": "packages/runner/src/stability-report.ts",
      "line": 1
    },
    {
      "id": "packages/runner/src/stability.ts",
      "label": "stability",
      "packageId": "runner",
      "category": "Headless runner",
      "summary": "Long-horizon macro diagnostics, kept pure so the definitions themselves can be pinned independently of a large stochastic sweep.",
      "lines": 593,
      "exports": [
        {
          "name": "StabilityEra",
          "kind": "interface",
          "path": "packages/runner/src/stability.ts",
          "line": 8
        },
        {
          "name": "STABILITY_ERAS",
          "kind": "constant",
          "path": "packages/runner/src/stability.ts",
          "line": 15
        },
        {
          "name": "MACRO_EVENTS",
          "kind": "constant",
          "path": "packages/runner/src/stability.ts",
          "line": 24
        },
        {
          "name": "SHOCK_EXCLUSION_QTRS",
          "kind": "constant",
          "path": "packages/runner/src/stability.ts",
          "line": 33
        },
        {
          "name": "StabilityRun",
          "kind": "interface",
          "path": "packages/runner/src/stability.ts",
          "line": 35
        },
        {
          "name": "TailSummary",
          "kind": "interface",
          "path": "packages/runner/src/stability.ts",
          "line": 43
        },
        {
          "name": "EraStability",
          "kind": "interface",
          "path": "packages/runner/src/stability.ts",
          "line": 55
        },
        {
          "name": "QuietDriverSummary",
          "kind": "interface",
          "path": "packages/runner/src/stability.ts",
          "line": 72
        },
        {
          "name": "QuietLaborContractionSummary",
          "kind": "interface",
          "path": "packages/runner/src/stability.ts",
          "line": 103
        },
        {
          "name": "QuietDownsideSummary",
          "kind": "interface",
          "path": "packages/runner/src/stability.ts",
          "line": 114
        },
        {
          "name": "ShockStability",
          "kind": "interface",
          "path": "packages/runner/src/stability.ts",
          "line": 143
        },
        {
          "name": "StabilityReport",
          "kind": "interface",
          "path": "packages/runner/src/stability.ts",
          "line": 153
        },
        {
          "name": "SurvivorTrendSummary",
          "kind": "interface",
          "path": "packages/runner/src/stability.ts",
          "line": 163
        },
        {
          "name": "summarizeTails",
          "kind": "function",
          "path": "packages/runner/src/stability.ts",
          "line": 185
        },
        {
          "name": "playableTrajectory",
          "kind": "function",
          "path": "packages/runner/src/stability.ts",
          "line": 203
        },
        {
          "name": "analyzeStability",
          "kind": "function",
          "path": "packages/runner/src/stability.ts",
          "line": 573
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/runner/src/metrics.ts",
        "packages/runner/src/run.ts"
      ],
      "importedBy": [
        "packages/runner/src/export-feedback.ts",
        "packages/runner/src/stability-cli.ts",
        "packages/runner/src/stability-report.ts"
      ],
      "path": "packages/runner/src/stability.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/accounts.ts",
      "label": "accounts",
      "packageId": "ui",
      "category": "UI core",
      "summary": "The expenditure accounts, arranged for reading — who the economy's output is actually for.",
      "lines": 132,
      "exports": [
        {
          "name": "ACCOUNT_IDS",
          "kind": "constant",
          "path": "packages/ui/src/accounts.ts",
          "line": 27
        },
        {
          "name": "AccountId",
          "kind": "type",
          "path": "packages/ui/src/accounts.ts",
          "line": 28
        },
        {
          "name": "ACCOUNT_FACE",
          "kind": "constant",
          "path": "packages/ui/src/accounts.ts",
          "line": 32
        },
        {
          "name": "AccountReading",
          "kind": "interface",
          "path": "packages/ui/src/accounts.ts",
          "line": 50
        },
        {
          "name": "readAccounts",
          "kind": "function",
          "path": "packages/ui/src/accounts.ts",
          "line": 73
        },
        {
          "name": "toShares",
          "kind": "function",
          "path": "packages/ui/src/accounts.ts",
          "line": 94
        },
        {
          "name": "accountRows",
          "kind": "function",
          "path": "packages/ui/src/accounts.ts",
          "line": 105
        },
        {
          "name": "publishedSum",
          "kind": "function",
          "path": "packages/ui/src/accounts.ts",
          "line": 129
        }
      ],
      "imports": [
        "packages/observation/src/index.ts",
        "packages/ui/src/components/series.ts",
        "packages/ui/src/shares.ts"
      ],
      "importedBy": [
        "packages/ui/src/panels/AccountsOverlay.tsx"
      ],
      "path": "packages/ui/src/accounts.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/App.tsx",
      "label": "App",
      "packageId": "ui",
      "category": "UI core",
      "summary": "The war room, on one screen: header letterhead, the instrument wall with the ledger and corridor docked, the control rail, and the wire along the bottom. Overlays are ministry paperwork on top — the ledger's full books, the wire's spike, the study, the records office.",
      "lines": 385,
      "exports": [
        {
          "name": "App",
          "kind": "function",
          "path": "packages/ui/src/App.tsx",
          "line": 53
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/ui/src/cabinetNavigation.ts",
        "packages/ui/src/components/ui/index.ts",
        "packages/ui/src/countryDraft.ts",
        "packages/ui/src/manual.ts",
        "packages/ui/src/panels/AccountsOverlay.tsx",
        "packages/ui/src/panels/CensusOverlay.tsx",
        "packages/ui/src/panels/ControlRail.tsx",
        "packages/ui/src/panels/CountrySelect.tsx",
        "packages/ui/src/panels/DevConsole.tsx",
        "packages/ui/src/panels/DraftingRoom.tsx",
        "packages/ui/src/panels/ElectionOverlay.tsx",
        "packages/ui/src/panels/ElectionResultOverlay.tsx",
        "packages/ui/src/panels/FinanceOverlay.tsx",
        "packages/ui/src/panels/HeaderBar.tsx",
        "packages/ui/src/panels/Instruments.tsx",
        "packages/ui/src/panels/LedgerOverlay.tsx",
        "packages/ui/src/panels/ManualOverlay.tsx",
        "packages/ui/src/panels/NewsWire.tsx",
        "packages/ui/src/panels/PolicyOverlay.tsx",
        "packages/ui/src/panels/ReportCardOverlay.tsx",
        "packages/ui/src/panels/SettingsOverlay.tsx",
        "packages/ui/src/panels/StudyOverlay.tsx",
        "packages/ui/src/panels/Walkthrough.tsx",
        "packages/ui/src/panels/WireOverlay.tsx",
        "packages/ui/src/store/gameStore.ts",
        "packages/ui/src/walkthrough.ts"
      ],
      "importedBy": [
        "packages/ui/src/main.tsx"
      ],
      "path": "packages/ui/src/App.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/budgetChart.ts",
      "label": "budgetChart",
      "packageId": "ui",
      "category": "UI core",
      "summary": "The treasury now has seven exact outlay lines, but a seven-colour pie is not readable in the dossier register. Preserve every book entry in PublishedState and combine the two state-building programmes only for chart geometry.",
      "lines": 34,
      "exports": [
        {
          "name": "OUTLAY_CHART_IDS",
          "kind": "constant",
          "path": "packages/ui/src/budgetChart.ts",
          "line": 9
        },
        {
          "name": "OutlayChartId",
          "kind": "type",
          "path": "packages/ui/src/budgetChart.ts",
          "line": 18
        },
        {
          "name": "OutlayChartValues",
          "kind": "type",
          "path": "packages/ui/src/budgetChart.ts",
          "line": 19
        },
        {
          "name": "outlayChartValues",
          "kind": "function",
          "path": "packages/ui/src/budgetChart.ts",
          "line": 24
        }
      ],
      "imports": [
        "packages/observation/src/index.ts"
      ],
      "importedBy": [
        "packages/ui/src/panels/LedgerOverlay.tsx"
      ],
      "path": "packages/ui/src/budgetChart.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/cabinetNavigation.ts",
      "label": "cabinetNavigation",
      "packageId": "ui",
      "category": "UI core",
      "summary": "",
      "lines": 56,
      "exports": [
        {
          "name": "CABINET_GROUPS",
          "kind": "constant",
          "path": "packages/ui/src/cabinetNavigation.ts",
          "line": 1
        },
        {
          "name": "CabinetGroup",
          "kind": "type",
          "path": "packages/ui/src/cabinetNavigation.ts",
          "line": 15
        },
        {
          "name": "CabinetNavigationKey",
          "kind": "type",
          "path": "packages/ui/src/cabinetNavigation.ts",
          "line": 16
        },
        {
          "name": "CABINET_NAVIGATION_KEYS",
          "kind": "constant",
          "path": "packages/ui/src/cabinetNavigation.ts",
          "line": 18
        },
        {
          "name": "CABINET_PANEL_ID",
          "kind": "constant",
          "path": "packages/ui/src/cabinetNavigation.ts",
          "line": 38
        },
        {
          "name": "cabinetTabId",
          "kind": "function",
          "path": "packages/ui/src/cabinetNavigation.ts",
          "line": 40
        },
        {
          "name": "cabinetGroupForKey",
          "kind": "function",
          "path": "packages/ui/src/cabinetNavigation.ts",
          "line": 46
        }
      ],
      "imports": [],
      "importedBy": [
        "packages/ui/src/App.tsx",
        "packages/ui/src/levers.ts",
        "packages/ui/src/panels/ControlRail.tsx"
      ],
      "path": "packages/ui/src/cabinetNavigation.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/components/AnalogGauge/AnalogGauge.tsx",
      "label": "AnalogGauge",
      "packageId": "ui",
      "category": "Components",
      "summary": "Dossier-era instrument: an analog gauge on manila, brass-rimmed, with the latest figure rubber-stamped beneath. The needle can only tell you so much — that vagueness is the statistical office's actual competence, not a styling choice.",
      "lines": 252,
      "exports": [
        {
          "name": "AnalogGauge",
          "kind": "function",
          "path": "packages/ui/src/components/AnalogGauge/AnalogGauge.tsx",
          "line": 55
        }
      ],
      "imports": [
        "packages/observation/src/index.ts",
        "packages/ui/src/components/WallTile/WallTile.tsx",
        "packages/ui/src/components/labels.ts",
        "packages/ui/src/components/series.ts",
        "packages/ui/src/components/ui/index.ts",
        "packages/ui/src/domains.ts"
      ],
      "importedBy": [
        "packages/ui/src/components/Gauge/Gauge.tsx",
        "packages/ui/src/dev/ComponentGallery.tsx"
      ],
      "path": "packages/ui/src/components/AnalogGauge/AnalogGauge.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/components/BlankPlate/BlankPlate.tsx",
      "label": "BlankPlate",
      "packageId": "ui",
      "category": "Components",
      "summary": "An unmeasured indicator is a blank brass plate — a feature, not an empty state to apologize for. It names the instrument and what would make it exist; no \"coming soon\" softness.",
      "lines": 82,
      "exports": [
        {
          "name": "BlankPlate",
          "kind": "function",
          "path": "packages/ui/src/components/BlankPlate/BlankPlate.tsx",
          "line": 17
        }
      ],
      "imports": [
        "packages/observation/src/index.ts",
        "packages/ui/src/components/WallTile/WallTile.tsx",
        "packages/ui/src/components/labels.ts",
        "packages/ui/src/maturity.ts"
      ],
      "importedBy": [
        "packages/ui/src/components/Gauge/Gauge.tsx",
        "packages/ui/src/dev/ComponentGallery.tsx"
      ],
      "path": "packages/ui/src/components/BlankPlate/BlankPlate.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/components/CorridorPlot/CorridorPlot.tsx",
      "label": "CorridorPlot",
      "packageId": "ui",
      "category": "Components",
      "summary": "The Narrow Corridor — the closest thing this game has to a map, docked permanently. Connecting-tissue register: hand-drawn strategy-map linework, its own quiet palette, neither dossier brass nor terminal phosphor.",
      "lines": 173,
      "exports": [
        {
          "name": "CorridorPlot",
          "kind": "function",
          "path": "packages/ui/src/components/CorridorPlot/CorridorPlot.tsx",
          "line": 49
        }
      ],
      "imports": [
        "packages/observation/src/index.ts",
        "packages/ui/src/components/WallTile/WallTile.tsx",
        "packages/ui/src/components/ui/index.ts"
      ],
      "importedBy": [
        "packages/ui/src/panels/Instruments.tsx"
      ],
      "path": "packages/ui/src/components/CorridorPlot/CorridorPlot.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/components/Gauge/Gauge.tsx",
      "label": "Gauge",
      "packageId": "ui",
      "category": "Components",
      "summary": "The maturity switch — one instrument identity, rendered at its current era.",
      "lines": 38,
      "exports": [
        {
          "name": "Gauge",
          "kind": "function",
          "path": "packages/ui/src/components/Gauge/Gauge.tsx",
          "line": 17
        }
      ],
      "imports": [
        "packages/observation/src/index.ts",
        "packages/ui/src/components/AnalogGauge/AnalogGauge.tsx",
        "packages/ui/src/components/BlankPlate/BlankPlate.tsx",
        "packages/ui/src/components/TerminalTicker/TerminalTicker.tsx",
        "packages/ui/src/maturity.ts"
      ],
      "importedBy": [
        "packages/ui/src/panels/Instruments.tsx"
      ],
      "path": "packages/ui/src/components/Gauge/Gauge.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/components/labels.ts",
      "label": "labels",
      "packageId": "ui",
      "category": "Components",
      "summary": "Every name an instrument goes by, in one place.",
      "lines": 232,
      "exports": [
        {
          "name": "IndicatorNames",
          "kind": "interface",
          "path": "packages/ui/src/components/labels.ts",
          "line": 15
        },
        {
          "name": "NAMES",
          "kind": "constant",
          "path": "packages/ui/src/components/labels.ts",
          "line": 37
        },
        {
          "name": "readingDigits",
          "kind": "constant",
          "path": "packages/ui/src/components/labels.ts",
          "line": 86
        },
        {
          "name": "complementReading",
          "kind": "function",
          "path": "packages/ui/src/components/labels.ts",
          "line": 91
        },
        {
          "name": "SECTOR_NAMES",
          "kind": "constant",
          "path": "packages/ui/src/components/labels.ts",
          "line": 101
        },
        {
          "name": "COHORT_NAMES",
          "kind": "constant",
          "path": "packages/ui/src/components/labels.ts",
          "line": 112
        },
        {
          "name": "COHORT_NOTES",
          "kind": "constant",
          "path": "packages/ui/src/components/labels.ts",
          "line": 129
        },
        {
          "name": "BLOC_NAMES",
          "kind": "constant",
          "path": "packages/ui/src/components/labels.ts",
          "line": 144
        },
        {
          "name": "BLOC_NOTES",
          "kind": "constant",
          "path": "packages/ui/src/components/labels.ts",
          "line": 152
        },
        {
          "name": "INSTITUTION_NAMES",
          "kind": "constant",
          "path": "packages/ui/src/components/labels.ts",
          "line": 163
        },
        {
          "name": "PLATFORM_NAMES",
          "kind": "constant",
          "path": "packages/ui/src/components/labels.ts",
          "line": 186
        },
        {
          "name": "PLATFORM_NOTES",
          "kind": "constant",
          "path": "packages/ui/src/components/labels.ts",
          "line": 202
        },
        {
          "name": "COUNT_NOTES",
          "kind": "constant",
          "path": "packages/ui/src/components/labels.ts",
          "line": 224
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/observation/src/index.ts"
      ],
      "importedBy": [
        "packages/ui/src/components/AnalogGauge/AnalogGauge.tsx",
        "packages/ui/src/components/BlankPlate/BlankPlate.tsx",
        "packages/ui/src/components/RackStrip/RackStrip.tsx",
        "packages/ui/src/components/TerminalTicker/TerminalTicker.tsx",
        "packages/ui/src/countryDraft.ts",
        "packages/ui/src/dev/ComponentGallery.tsx",
        "packages/ui/src/levers.ts",
        "packages/ui/src/manual.ts",
        "packages/ui/src/panels/ControlRail.tsx",
        "packages/ui/src/panels/ElectionOverlay.tsx",
        "packages/ui/src/panels/ElectionResultOverlay.tsx"
      ],
      "path": "packages/ui/src/components/labels.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/components/RackStrip/RackStrip.tsx",
      "label": "RackStrip",
      "packageId": "ui",
      "category": "Components",
      "summary": "One instrument, compressed to a single line — the rack's unit.",
      "lines": 127,
      "exports": [
        {
          "name": "RackStrip",
          "kind": "function",
          "path": "packages/ui/src/components/RackStrip/RackStrip.tsx",
          "line": 51
        }
      ],
      "imports": [
        "packages/observation/src/index.ts",
        "packages/ui/src/components/labels.ts",
        "packages/ui/src/components/series.ts",
        "packages/ui/src/components/ui/index.ts",
        "packages/ui/src/domains.ts",
        "packages/ui/src/maturity.ts",
        "packages/ui/src/wallPlan.ts"
      ],
      "importedBy": [
        "packages/ui/src/panels/Instruments.tsx"
      ],
      "path": "packages/ui/src/components/RackStrip/RackStrip.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/components/series.ts",
      "label": "series",
      "packageId": "ui",
      "category": "Components",
      "summary": "Shared shaping of IndicatorSeries for rendering — latest print per quarter, plus whether a revision moved a number the player already saw.",
      "lines": 178,
      "exports": [
        {
          "name": "ShapedPoint",
          "kind": "interface",
          "path": "packages/ui/src/components/series.ts",
          "line": 12
        },
        {
          "name": "shapeSeries",
          "kind": "function",
          "path": "packages/ui/src/components/series.ts",
          "line": 33
        },
        {
          "name": "RollingMonths",
          "kind": "type",
          "path": "packages/ui/src/components/series.ts",
          "line": 64
        },
        {
          "name": "rollingAverage",
          "kind": "function",
          "path": "packages/ui/src/components/series.ts",
          "line": 80
        },
        {
          "name": "STAMP_WINDOW_QTRS",
          "kind": "constant",
          "path": "packages/ui/src/components/series.ts",
          "line": 122
        },
        {
          "name": "MATERIAL_REVISION_BANDS",
          "kind": "constant",
          "path": "packages/ui/src/components/series.ts",
          "line": 130
        },
        {
          "name": "MATERIAL_REVISION_FACE_FRACTION",
          "kind": "constant",
          "path": "packages/ui/src/components/series.ts",
          "line": 132
        },
        {
          "name": "stampWorthyRevision",
          "kind": "function",
          "path": "packages/ui/src/components/series.ts",
          "line": 153
        },
        {
          "name": "quarterDelta",
          "kind": "function",
          "path": "packages/ui/src/components/series.ts",
          "line": 172
        },
        {
          "name": "qtrLabel",
          "kind": "constant",
          "path": "packages/ui/src/components/series.ts",
          "line": 177
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/observation/src/index.ts"
      ],
      "importedBy": [
        "packages/ui/src/accounts.ts",
        "packages/ui/src/components/AnalogGauge/AnalogGauge.tsx",
        "packages/ui/src/components/RackStrip/RackStrip.tsx",
        "packages/ui/src/components/TerminalTicker/TerminalTicker.tsx",
        "packages/ui/src/components/ui/LineChart/LineChart.tsx",
        "packages/ui/src/panels/AccountsOverlay.tsx",
        "packages/ui/src/panels/StudyOverlay.tsx"
      ],
      "path": "packages/ui/src/components/series.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/components/TerminalTicker/TerminalTicker.tsx",
      "label": "TerminalTicker",
      "packageId": "ui",
      "category": "Components",
      "summary": "Terminal-era instrument: dense phosphor line on near-black, tight bands, live-feeling readout. Superseded first prints stay on screen with a strikethrough beside the reprint — the machine remembers what it told you. No shadows, no gradients, no rounding: hairlines only.",
      "lines": 290,
      "exports": [
        {
          "name": "TerminalTicker",
          "kind": "function",
          "path": "packages/ui/src/components/TerminalTicker/TerminalTicker.tsx",
          "line": 96
        }
      ],
      "imports": [
        "packages/observation/src/index.ts",
        "packages/ui/src/components/WallTile/WallTile.tsx",
        "packages/ui/src/components/labels.ts",
        "packages/ui/src/components/series.ts",
        "packages/ui/src/components/ui/index.ts",
        "packages/ui/src/domains.ts"
      ],
      "importedBy": [
        "packages/ui/src/components/Gauge/Gauge.tsx",
        "packages/ui/src/dev/ComponentGallery.tsx"
      ],
      "path": "packages/ui/src/components/TerminalTicker/TerminalTicker.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/components/ui/Button/Button.tsx",
      "label": "Button",
      "packageId": "ui",
      "category": "Components",
      "summary": "",
      "lines": 63,
      "exports": [
        {
          "name": "ButtonVariant",
          "kind": "type",
          "path": "packages/ui/src/components/ui/Button/Button.tsx",
          "line": 4
        },
        {
          "name": "ButtonSize",
          "kind": "type",
          "path": "packages/ui/src/components/ui/Button/Button.tsx",
          "line": 5
        },
        {
          "name": "ButtonProps",
          "kind": "interface",
          "path": "packages/ui/src/components/ui/Button/Button.tsx",
          "line": 23
        },
        {
          "name": "Button",
          "kind": "constant",
          "path": "packages/ui/src/components/ui/Button/Button.tsx",
          "line": 30
        }
      ],
      "imports": [
        "packages/ui/src/components/ui/Tooltip/Tooltip.tsx"
      ],
      "importedBy": [
        "packages/ui/src/components/ui/Modal/Modal.tsx",
        "packages/ui/src/components/ui/index.ts"
      ],
      "path": "packages/ui/src/components/ui/Button/Button.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/components/ui/ChartFrame/ChartFrame.tsx",
      "label": "ChartFrame",
      "packageId": "ui",
      "category": "Components",
      "summary": "",
      "lines": 68,
      "exports": [
        {
          "name": "ChartLegendItem",
          "kind": "interface",
          "path": "packages/ui/src/components/ui/ChartFrame/ChartFrame.tsx",
          "line": 3
        },
        {
          "name": "ChartFrameProps",
          "kind": "interface",
          "path": "packages/ui/src/components/ui/ChartFrame/ChartFrame.tsx",
          "line": 9
        },
        {
          "name": "ChartFrame",
          "kind": "function",
          "path": "packages/ui/src/components/ui/ChartFrame/ChartFrame.tsx",
          "line": 23
        }
      ],
      "imports": [],
      "importedBy": [
        "packages/ui/src/components/ui/index.ts"
      ],
      "path": "packages/ui/src/components/ui/ChartFrame/ChartFrame.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/components/ui/DisclosureSection/DisclosureSection.tsx",
      "label": "DisclosureSection",
      "packageId": "ui",
      "category": "Components",
      "summary": "",
      "lines": 33,
      "exports": [
        {
          "name": "DisclosureSection",
          "kind": "function",
          "path": "packages/ui/src/components/ui/DisclosureSection/DisclosureSection.tsx",
          "line": 3
        }
      ],
      "imports": [],
      "importedBy": [
        "packages/ui/src/components/ui/index.ts"
      ],
      "path": "packages/ui/src/components/ui/DisclosureSection/DisclosureSection.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/components/ui/DonutChart/DonutChart.tsx",
      "label": "DonutChart",
      "packageId": "ui",
      "category": "Components",
      "summary": "A share of a whole, in ink on paper: a donut and the table that reads it.",
      "lines": 101,
      "exports": [
        {
          "name": "DonutChartProps",
          "kind": "interface",
          "path": "packages/ui/src/components/ui/DonutChart/DonutChart.tsx",
          "line": 17
        },
        {
          "name": "DonutChart",
          "kind": "function",
          "path": "packages/ui/src/components/ui/DonutChart/DonutChart.tsx",
          "line": 28
        }
      ],
      "imports": [
        "packages/ui/src/components/ui/Tooltip/Tooltip.tsx",
        "packages/ui/src/shares.ts"
      ],
      "importedBy": [
        "packages/ui/src/components/ui/index.ts"
      ],
      "path": "packages/ui/src/components/ui/DonutChart/DonutChart.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/components/ui/EmptyState/EmptyState.tsx",
      "label": "EmptyState",
      "packageId": "ui",
      "category": "Components",
      "summary": "",
      "lines": 12,
      "exports": [
        {
          "name": "EmptyState",
          "kind": "function",
          "path": "packages/ui/src/components/ui/EmptyState/EmptyState.tsx",
          "line": 3
        }
      ],
      "imports": [],
      "importedBy": [
        "packages/ui/src/components/ui/index.ts"
      ],
      "path": "packages/ui/src/components/ui/EmptyState/EmptyState.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/components/ui/index.ts",
      "label": "index",
      "packageId": "ui",
      "category": "Components",
      "summary": "",
      "lines": 32,
      "exports": [],
      "imports": [
        "packages/ui/src/components/ui/Button/Button.tsx",
        "packages/ui/src/components/ui/ChartFrame/ChartFrame.tsx",
        "packages/ui/src/components/ui/DisclosureSection/DisclosureSection.tsx",
        "packages/ui/src/components/ui/DonutChart/DonutChart.tsx",
        "packages/ui/src/components/ui/EmptyState/EmptyState.tsx",
        "packages/ui/src/components/ui/LineChart/LineChart.tsx",
        "packages/ui/src/components/ui/Metric/Metric.tsx",
        "packages/ui/src/components/ui/Modal/Modal.tsx",
        "packages/ui/src/components/ui/OverlayLayout/OverlayLayout.tsx",
        "packages/ui/src/components/ui/Panel/Panel.tsx",
        "packages/ui/src/components/ui/ProgressBar/ProgressBar.tsx",
        "packages/ui/src/components/ui/SectionBar/SectionBar.tsx",
        "packages/ui/src/components/ui/SectionHeading/SectionHeading.tsx",
        "packages/ui/src/components/ui/SegmentedControl/SegmentedControl.tsx",
        "packages/ui/src/components/ui/SliderField/SliderField.tsx",
        "packages/ui/src/components/ui/StackedAreaChart/StackedAreaChart.tsx",
        "packages/ui/src/components/ui/TimeSeriesChart/TimeSeriesChart.tsx",
        "packages/ui/src/components/ui/Tooltip/Tooltip.tsx",
        "packages/ui/src/components/ui/Tooltip/placement.ts",
        "packages/ui/src/components/ui/useFocusTrap.ts"
      ],
      "importedBy": [
        "packages/ui/src/App.tsx",
        "packages/ui/src/components/AnalogGauge/AnalogGauge.tsx",
        "packages/ui/src/components/CorridorPlot/CorridorPlot.tsx",
        "packages/ui/src/components/RackStrip/RackStrip.tsx",
        "packages/ui/src/components/TerminalTicker/TerminalTicker.tsx",
        "packages/ui/src/components/WallTile/WallTile.tsx",
        "packages/ui/src/dev/ComponentGallery.tsx",
        "packages/ui/src/panels/AccountsOverlay.tsx",
        "packages/ui/src/panels/CensusOverlay.tsx",
        "packages/ui/src/panels/ControlRail.tsx",
        "packages/ui/src/panels/CountrySelect.tsx",
        "packages/ui/src/panels/DevConsole.tsx",
        "packages/ui/src/panels/DraftingRoom.tsx",
        "packages/ui/src/panels/ElectionOverlay.tsx",
        "packages/ui/src/panels/ElectionResultOverlay.tsx",
        "packages/ui/src/panels/FinanceOverlay.tsx",
        "packages/ui/src/panels/FinanceOverlay.tsx",
        "packages/ui/src/panels/HeaderBar.tsx",
        "packages/ui/src/panels/Instruments.tsx",
        "packages/ui/src/panels/LedgerOverlay.tsx",
        "packages/ui/src/panels/LedgerPanel.tsx",
        "packages/ui/src/panels/ManualOverlay.tsx",
        "packages/ui/src/panels/NewsWire.tsx",
        "packages/ui/src/panels/PolicyOverlay.tsx",
        "packages/ui/src/panels/ReportCardOverlay.tsx",
        "packages/ui/src/panels/SettingsOverlay.tsx",
        "packages/ui/src/panels/StudyOverlay.tsx",
        "packages/ui/src/panels/StudyReport.tsx",
        "packages/ui/src/panels/Walkthrough.tsx",
        "packages/ui/src/panels/WireOverlay.tsx"
      ],
      "path": "packages/ui/src/components/ui/index.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/components/ui/LineChart/LineChart.tsx",
      "label": "LineChart",
      "packageId": "ui",
      "category": "Components",
      "summary": "The compact labelled line — a `TimeSeriesChart` preset for dense bays.",
      "lines": 86,
      "exports": [
        {
          "name": "LineChartProps",
          "kind": "interface",
          "path": "packages/ui/src/components/ui/LineChart/LineChart.tsx",
          "line": 15
        },
        {
          "name": "LineChart",
          "kind": "function",
          "path": "packages/ui/src/components/ui/LineChart/LineChart.tsx",
          "line": 33
        }
      ],
      "imports": [
        "packages/ui/src/components/series.ts",
        "packages/ui/src/components/ui/TimeSeriesChart/TimeSeriesChart.tsx"
      ],
      "importedBy": [
        "packages/ui/src/components/ui/index.ts"
      ],
      "path": "packages/ui/src/components/ui/LineChart/LineChart.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/components/ui/Metric/Metric.tsx",
      "label": "Metric",
      "packageId": "ui",
      "category": "Components",
      "summary": "",
      "lines": 36,
      "exports": [
        {
          "name": "MetricTone",
          "kind": "type",
          "path": "packages/ui/src/components/ui/Metric/Metric.tsx",
          "line": 4
        },
        {
          "name": "MetricProps",
          "kind": "interface",
          "path": "packages/ui/src/components/ui/Metric/Metric.tsx",
          "line": 14
        },
        {
          "name": "Metric",
          "kind": "function",
          "path": "packages/ui/src/components/ui/Metric/Metric.tsx",
          "line": 23
        }
      ],
      "imports": [
        "packages/ui/src/components/ui/Tooltip/Tooltip.tsx"
      ],
      "importedBy": [
        "packages/ui/src/components/ui/index.ts"
      ],
      "path": "packages/ui/src/components/ui/Metric/Metric.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/components/ui/Modal/Modal.tsx",
      "label": "Modal",
      "packageId": "ui",
      "category": "Components",
      "summary": "",
      "lines": 38,
      "exports": [
        {
          "name": "ModalSize",
          "kind": "type",
          "path": "packages/ui/src/components/ui/Modal/Modal.tsx",
          "line": 5
        },
        {
          "name": "Modal",
          "kind": "function",
          "path": "packages/ui/src/components/ui/Modal/Modal.tsx",
          "line": 13
        }
      ],
      "imports": [
        "packages/ui/src/components/ui/Button/Button.tsx",
        "packages/ui/src/components/ui/useFocusTrap.ts"
      ],
      "importedBy": [
        "packages/ui/src/components/ui/index.ts"
      ],
      "path": "packages/ui/src/components/ui/Modal/Modal.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/components/ui/OverlayLayout/OverlayLayout.tsx",
      "label": "OverlayLayout",
      "packageId": "ui",
      "category": "Components",
      "summary": "",
      "lines": 26,
      "exports": [
        {
          "name": "OverlayLayout",
          "kind": "function",
          "path": "packages/ui/src/components/ui/OverlayLayout/OverlayLayout.tsx",
          "line": 3
        }
      ],
      "imports": [],
      "importedBy": [
        "packages/ui/src/components/ui/index.ts"
      ],
      "path": "packages/ui/src/components/ui/OverlayLayout/OverlayLayout.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/components/ui/Panel/Panel.tsx",
      "label": "Panel",
      "packageId": "ui",
      "category": "Components",
      "summary": "",
      "lines": 46,
      "exports": [
        {
          "name": "PanelTone",
          "kind": "type",
          "path": "packages/ui/src/components/ui/Panel/Panel.tsx",
          "line": 3
        },
        {
          "name": "PanelProps",
          "kind": "interface",
          "path": "packages/ui/src/components/ui/Panel/Panel.tsx",
          "line": 13
        },
        {
          "name": "Panel",
          "kind": "function",
          "path": "packages/ui/src/components/ui/Panel/Panel.tsx",
          "line": 22
        }
      ],
      "imports": [],
      "importedBy": [
        "packages/ui/src/components/ui/index.ts"
      ],
      "path": "packages/ui/src/components/ui/Panel/Panel.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/components/ui/ProgressBar/ProgressBar.tsx",
      "label": "ProgressBar",
      "packageId": "ui",
      "category": "Components",
      "summary": "",
      "lines": 10,
      "exports": [
        {
          "name": "ProgressBar",
          "kind": "function",
          "path": "packages/ui/src/components/ui/ProgressBar/ProgressBar.tsx",
          "line": 1
        }
      ],
      "imports": [],
      "importedBy": [
        "packages/ui/src/components/ui/index.ts"
      ],
      "path": "packages/ui/src/components/ui/ProgressBar/ProgressBar.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/components/ui/SectionBar/SectionBar.tsx",
      "label": "SectionBar",
      "packageId": "ui",
      "category": "Components",
      "summary": "",
      "lines": 40,
      "exports": [
        {
          "name": "SectionBarProps",
          "kind": "interface",
          "path": "packages/ui/src/components/ui/SectionBar/SectionBar.tsx",
          "line": 4
        },
        {
          "name": "SectionBar",
          "kind": "function",
          "path": "packages/ui/src/components/ui/SectionBar/SectionBar.tsx",
          "line": 13
        }
      ],
      "imports": [
        "packages/ui/src/components/ui/Tooltip/Tooltip.tsx"
      ],
      "importedBy": [
        "packages/ui/src/components/ui/index.ts"
      ],
      "path": "packages/ui/src/components/ui/SectionBar/SectionBar.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/components/ui/SectionHeading/SectionHeading.tsx",
      "label": "SectionHeading",
      "packageId": "ui",
      "category": "Components",
      "summary": "",
      "lines": 14,
      "exports": [
        {
          "name": "SectionHeading",
          "kind": "function",
          "path": "packages/ui/src/components/ui/SectionHeading/SectionHeading.tsx",
          "line": 3
        }
      ],
      "imports": [],
      "importedBy": [
        "packages/ui/src/components/ui/index.ts"
      ],
      "path": "packages/ui/src/components/ui/SectionHeading/SectionHeading.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/components/ui/SegmentedControl/SegmentedControl.tsx",
      "label": "SegmentedControl",
      "packageId": "ui",
      "category": "Components",
      "summary": "",
      "lines": 61,
      "exports": [
        {
          "name": "SegmentOption",
          "kind": "interface",
          "path": "packages/ui/src/components/ui/SegmentedControl/SegmentedControl.tsx",
          "line": 3
        },
        {
          "name": "SegmentedControl",
          "kind": "function",
          "path": "packages/ui/src/components/ui/SegmentedControl/SegmentedControl.tsx",
          "line": 10
        }
      ],
      "imports": [
        "packages/ui/src/components/ui/Tooltip/Tooltip.tsx"
      ],
      "importedBy": [
        "packages/ui/src/components/ui/index.ts"
      ],
      "path": "packages/ui/src/components/ui/SegmentedControl/SegmentedControl.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/components/ui/SliderField/SliderField.tsx",
      "label": "SliderField",
      "packageId": "ui",
      "category": "Components",
      "summary": "",
      "lines": 76,
      "exports": [
        {
          "name": "SliderFieldProps",
          "kind": "interface",
          "path": "packages/ui/src/components/ui/SliderField/SliderField.tsx",
          "line": 4
        },
        {
          "name": "SliderField",
          "kind": "function",
          "path": "packages/ui/src/components/ui/SliderField/SliderField.tsx",
          "line": 20
        }
      ],
      "imports": [
        "packages/ui/src/components/ui/Tooltip/Tooltip.tsx"
      ],
      "importedBy": [
        "packages/ui/src/components/ui/index.ts"
      ],
      "path": "packages/ui/src/components/ui/SliderField/SliderField.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/components/ui/StackedAreaChart/StackedAreaChart.tsx",
      "label": "StackedAreaChart",
      "packageId": "ui",
      "category": "Components",
      "summary": "The same shares, over the whole century: a stacked band chart in ink on paper. The pie beside it answers \"what is the mix now\"; this answers \"what did the mix do when I moved the dial\", which is the question a headline total can never answer.",
      "lines": 127,
      "exports": [
        {
          "name": "StackedAreaChartProps",
          "kind": "interface",
          "path": "packages/ui/src/components/ui/StackedAreaChart/StackedAreaChart.tsx",
          "line": 15
        },
        {
          "name": "StackedAreaChart",
          "kind": "function",
          "path": "packages/ui/src/components/ui/StackedAreaChart/StackedAreaChart.tsx",
          "line": 29
        }
      ],
      "imports": [
        "packages/ui/src/components/ui/Tooltip/Tooltip.tsx",
        "packages/ui/src/shares.ts"
      ],
      "importedBy": [
        "packages/ui/src/components/ui/index.ts"
      ],
      "path": "packages/ui/src/components/ui/StackedAreaChart/StackedAreaChart.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/components/ui/TimeSeriesChart/TimeSeriesChart.tsx",
      "label": "TimeSeriesChart",
      "packageId": "ui",
      "category": "Components",
      "summary": "The one time-series painter. Every line, area and ribbon in the game goes through it — the wall's terminal ticker, the treasury ledger, the expenditure accounts, the finance overlay, the census.",
      "lines": 642,
      "exports": [
        {
          "name": "ChartRegister",
          "kind": "type",
          "path": "packages/ui/src/components/ui/TimeSeriesChart/TimeSeriesChart.tsx",
          "line": 50
        },
        {
          "name": "ChartTrace",
          "kind": "interface",
          "path": "packages/ui/src/components/ui/TimeSeriesChart/TimeSeriesChart.tsx",
          "line": 52
        },
        {
          "name": "ChartRule",
          "kind": "interface",
          "path": "packages/ui/src/components/ui/TimeSeriesChart/TimeSeriesChart.tsx",
          "line": 69
        },
        {
          "name": "TimeSeriesChartProps",
          "kind": "interface",
          "path": "packages/ui/src/components/ui/TimeSeriesChart/TimeSeriesChart.tsx",
          "line": 80
        },
        {
          "name": "TimeSeriesChart",
          "kind": "function",
          "path": "packages/ui/src/components/ui/TimeSeriesChart/TimeSeriesChart.tsx",
          "line": 174
        }
      ],
      "imports": [
        "packages/ui/src/plot.ts"
      ],
      "importedBy": [
        "packages/ui/src/components/ui/LineChart/LineChart.tsx",
        "packages/ui/src/components/ui/index.ts"
      ],
      "path": "packages/ui/src/components/ui/TimeSeriesChart/TimeSeriesChart.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/components/ui/Tooltip/placement.ts",
      "label": "placement",
      "packageId": "ui",
      "category": "Components",
      "summary": "",
      "lines": 46,
      "exports": [
        {
          "name": "TooltipSide",
          "kind": "type",
          "path": "packages/ui/src/components/ui/Tooltip/placement.ts",
          "line": 1
        },
        {
          "name": "placeTooltip",
          "kind": "function",
          "path": "packages/ui/src/components/ui/Tooltip/placement.ts",
          "line": 20
        }
      ],
      "imports": [],
      "importedBy": [
        "packages/ui/src/components/ui/Tooltip/Tooltip.tsx",
        "packages/ui/src/components/ui/Tooltip/Tooltip.tsx",
        "packages/ui/src/components/ui/index.ts"
      ],
      "path": "packages/ui/src/components/ui/Tooltip/placement.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/components/ui/Tooltip/Tooltip.tsx",
      "label": "Tooltip",
      "packageId": "ui",
      "category": "Components",
      "summary": "One tooltip for the whole game.",
      "lines": 302,
      "exports": [
        {
          "name": "TooltipProps",
          "kind": "interface",
          "path": "packages/ui/src/components/ui/Tooltip/Tooltip.tsx",
          "line": 93
        },
        {
          "name": "Tooltip",
          "kind": "function",
          "path": "packages/ui/src/components/ui/Tooltip/Tooltip.tsx",
          "line": 105
        },
        {
          "name": "TooltipLabel",
          "kind": "function",
          "path": "packages/ui/src/components/ui/Tooltip/Tooltip.tsx",
          "line": 279
        }
      ],
      "imports": [
        "packages/ui/src/components/ui/Tooltip/placement.ts",
        "packages/ui/src/components/ui/Tooltip/placement.ts"
      ],
      "importedBy": [
        "packages/ui/src/components/ui/Button/Button.tsx",
        "packages/ui/src/components/ui/DonutChart/DonutChart.tsx",
        "packages/ui/src/components/ui/Metric/Metric.tsx",
        "packages/ui/src/components/ui/SectionBar/SectionBar.tsx",
        "packages/ui/src/components/ui/SegmentedControl/SegmentedControl.tsx",
        "packages/ui/src/components/ui/SliderField/SliderField.tsx",
        "packages/ui/src/components/ui/StackedAreaChart/StackedAreaChart.tsx",
        "packages/ui/src/components/ui/index.ts"
      ],
      "path": "packages/ui/src/components/ui/Tooltip/Tooltip.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/components/ui/useFocusTrap.ts",
      "label": "useFocusTrap",
      "packageId": "ui",
      "category": "Components",
      "summary": "",
      "lines": 78,
      "exports": [
        {
          "name": "useFocusTrap",
          "kind": "function",
          "path": "packages/ui/src/components/ui/useFocusTrap.ts",
          "line": 20
        }
      ],
      "imports": [],
      "importedBy": [
        "packages/ui/src/components/ui/Modal/Modal.tsx",
        "packages/ui/src/components/ui/index.ts"
      ],
      "path": "packages/ui/src/components/ui/useFocusTrap.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/components/WallTile/WallTile.tsx",
      "label": "WallTile",
      "packageId": "ui",
      "category": "Components",
      "summary": "The frame every instrument on the wall sits in — and the one place the wall's layout contract is written down.",
      "lines": 103,
      "exports": [
        {
          "name": "WallTile",
          "kind": "function",
          "path": "packages/ui/src/components/WallTile/WallTile.tsx",
          "line": 77
        }
      ],
      "imports": [
        "packages/ui/src/components/ui/index.ts"
      ],
      "importedBy": [
        "packages/ui/src/components/AnalogGauge/AnalogGauge.tsx",
        "packages/ui/src/components/BlankPlate/BlankPlate.tsx",
        "packages/ui/src/components/CorridorPlot/CorridorPlot.tsx",
        "packages/ui/src/components/TerminalTicker/TerminalTicker.tsx",
        "packages/ui/src/panels/LedgerPanel.tsx"
      ],
      "path": "packages/ui/src/components/WallTile/WallTile.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/countryDraft.ts",
      "label": "countryDraft",
      "packageId": "ui",
      "category": "UI core",
      "summary": "The drafting room's arithmetic — what a country's fields are, what they are allowed to be, and how a draft becomes a document somebody else can open.",
      "lines": 440,
      "exports": [
        {
          "name": "DRAFT_GROUP_IDS",
          "kind": "constant",
          "path": "packages/ui/src/countryDraft.ts",
          "line": 38
        },
        {
          "name": "DraftGroupId",
          "kind": "type",
          "path": "packages/ui/src/countryDraft.ts",
          "line": 39
        },
        {
          "name": "DRAFT_GROUPS",
          "kind": "constant",
          "path": "packages/ui/src/countryDraft.ts",
          "line": 43
        },
        {
          "name": "FieldFormat",
          "kind": "type",
          "path": "packages/ui/src/countryDraft.ts",
          "line": 71
        },
        {
          "name": "DraftField",
          "kind": "interface",
          "path": "packages/ui/src/countryDraft.ts",
          "line": 73
        },
        {
          "name": "DRAFT_FIELDS",
          "kind": "constant",
          "path": "packages/ui/src/countryDraft.ts",
          "line": 117
        },
        {
          "name": "fieldsInGroup",
          "kind": "constant",
          "path": "packages/ui/src/countryDraft.ts",
          "line": 225
        },
        {
          "name": "formatFieldValue",
          "kind": "function",
          "path": "packages/ui/src/countryDraft.ts",
          "line": 228
        },
        {
          "name": "readField",
          "kind": "function",
          "path": "packages/ui/src/countryDraft.ts",
          "line": 251
        },
        {
          "name": "writeField",
          "kind": "function",
          "path": "packages/ui/src/countryDraft.ts",
          "line": 270
        },
        {
          "name": "AGE_SHAPE_LABELS",
          "kind": "constant",
          "path": "packages/ui/src/countryDraft.ts",
          "line": 293
        },
        {
          "name": "draftFrom",
          "kind": "function",
          "path": "packages/ui/src/countryDraft.ts",
          "line": 318
        },
        {
          "name": "reviseDraft",
          "kind": "function",
          "path": "packages/ui/src/countryDraft.ts",
          "line": 330
        },
        {
          "name": "draftChanges",
          "kind": "function",
          "path": "packages/ui/src/countryDraft.ts",
          "line": 355
        },
        {
          "name": "draftPopulation",
          "kind": "constant",
          "path": "packages/ui/src/countryDraft.ts",
          "line": 368
        },
        {
          "name": "draftKey",
          "kind": "constant",
          "path": "packages/ui/src/countryDraft.ts",
          "line": 374
        },
        {
          "name": "SHARE_FRAGMENT_KEY",
          "kind": "constant",
          "path": "packages/ui/src/countryDraft.ts",
          "line": 383
        },
        {
          "name": "encodeShare",
          "kind": "constant",
          "path": "packages/ui/src/countryDraft.ts",
          "line": 399
        },
        {
          "name": "decodeShare",
          "kind": "function",
          "path": "packages/ui/src/countryDraft.ts",
          "line": 405
        },
        {
          "name": "sharedCountryFromUrl",
          "kind": "function",
          "path": "packages/ui/src/countryDraft.ts",
          "line": 423
        },
        {
          "name": "shareUrl",
          "kind": "function",
          "path": "packages/ui/src/countryDraft.ts",
          "line": 429
        },
        {
          "name": "shareFilename",
          "kind": "constant",
          "path": "packages/ui/src/countryDraft.ts",
          "line": 435
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/ui/src/components/labels.ts"
      ],
      "importedBy": [
        "packages/ui/src/App.tsx",
        "packages/ui/src/panels/CountrySelect.tsx",
        "packages/ui/src/panels/DraftingRoom.tsx",
        "packages/ui/src/panels/StudyReport.tsx",
        "packages/ui/src/panels/StudyReport.tsx",
        "packages/ui/src/store/gameStore.ts"
      ],
      "path": "packages/ui/src/countryDraft.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/dev/ComponentGallery.tsx",
      "label": "ComponentGallery",
      "packageId": "ui",
      "category": "Development tools",
      "summary": "",
      "lines": 220,
      "exports": [
        {
          "name": "ComponentGallery",
          "kind": "function",
          "path": "packages/ui/src/dev/ComponentGallery.tsx",
          "line": 47
        }
      ],
      "imports": [
        "packages/ui/src/components/AnalogGauge/AnalogGauge.tsx",
        "packages/ui/src/components/BlankPlate/BlankPlate.tsx",
        "packages/ui/src/components/TerminalTicker/TerminalTicker.tsx",
        "packages/ui/src/components/labels.ts",
        "packages/ui/src/components/ui/index.ts",
        "packages/ui/src/dev/galleryFixtures.ts",
        "packages/ui/src/shares.ts"
      ],
      "importedBy": [
        "packages/ui/src/main.tsx"
      ],
      "path": "packages/ui/src/dev/ComponentGallery.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/dev/galleryFixtures.ts",
      "label": "galleryFixtures",
      "packageId": "ui",
      "category": "Development tools",
      "summary": "Deterministic published series for the component gallery.",
      "lines": 309,
      "exports": [
        {
          "name": "BOARD_SLOT",
          "kind": "constant",
          "path": "packages/ui/src/dev/galleryFixtures.ts",
          "line": 45
        },
        {
          "name": "GALLERY_NOW",
          "kind": "constant",
          "path": "packages/ui/src/dev/galleryFixtures.ts",
          "line": 48
        },
        {
          "name": "GALLERY_INSTRUMENTS",
          "kind": "constant",
          "path": "packages/ui/src/dev/galleryFixtures.ts",
          "line": 283
        }
      ],
      "imports": [
        "packages/observation/src/index.ts"
      ],
      "importedBy": [
        "packages/ui/src/dev/ComponentGallery.tsx"
      ],
      "path": "packages/ui/src/dev/galleryFixtures.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/devScenario.ts",
      "label": "devScenario",
      "packageId": "ui",
      "category": "UI core",
      "summary": "Dev scenarios — \"start me in 1975 with a big, rich, well-surveyed country.\"",
      "lines": 85,
      "exports": [
        {
          "name": "YEAR_ZERO",
          "kind": "constant",
          "path": "packages/ui/src/devScenario.ts",
          "line": 19
        },
        {
          "name": "yearOfTick",
          "kind": "constant",
          "path": "packages/ui/src/devScenario.ts",
          "line": 21
        },
        {
          "name": "quarterOfTick",
          "kind": "constant",
          "path": "packages/ui/src/devScenario.ts",
          "line": 23
        },
        {
          "name": "tickLabel",
          "kind": "constant",
          "path": "packages/ui/src/devScenario.ts",
          "line": 25
        },
        {
          "name": "tickForYear",
          "kind": "function",
          "path": "packages/ui/src/devScenario.ts",
          "line": 28
        },
        {
          "name": "DevScenario",
          "kind": "interface",
          "path": "packages/ui/src/devScenario.ts",
          "line": 33
        },
        {
          "name": "DEFAULT_SCENARIO",
          "kind": "constant",
          "path": "packages/ui/src/devScenario.ts",
          "line": 49
        },
        {
          "name": "applyScenario",
          "kind": "function",
          "path": "packages/ui/src/devScenario.ts",
          "line": 58
        }
      ],
      "imports": [
        "packages/engine/src/index.ts"
      ],
      "importedBy": [
        "packages/ui/src/panels/DevConsole.tsx",
        "packages/ui/src/panels/StudyReport.tsx",
        "packages/ui/src/store/gameStore.ts",
        "packages/ui/src/worker/protocol.ts",
        "packages/ui/src/worker/sim.worker.ts"
      ],
      "path": "packages/ui/src/devScenario.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/domains.ts",
      "label": "domains",
      "packageId": "ui",
      "category": "UI core",
      "summary": "The printed face of every dial.",
      "lines": 199,
      "exports": [
        {
          "name": "Domain",
          "kind": "interface",
          "path": "packages/ui/src/domains.ts",
          "line": 37
        },
        {
          "name": "Reading",
          "kind": "interface",
          "path": "packages/ui/src/domains.ts",
          "line": 43
        },
        {
          "name": "INDICATOR_FACE",
          "kind": "constant",
          "path": "packages/ui/src/domains.ts",
          "line": 56
        },
        {
          "name": "FACE_MARK",
          "kind": "constant",
          "path": "packages/ui/src/domains.ts",
          "line": 133
        },
        {
          "name": "niceBounds",
          "kind": "function",
          "path": "packages/ui/src/domains.ts",
          "line": 168
        },
        {
          "name": "gaugeDomain",
          "kind": "function",
          "path": "packages/ui/src/domains.ts",
          "line": 182
        },
        {
          "name": "readNeedle",
          "kind": "function",
          "path": "packages/ui/src/domains.ts",
          "line": 191
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/observation/src/index.ts"
      ],
      "importedBy": [
        "packages/ui/src/components/AnalogGauge/AnalogGauge.tsx",
        "packages/ui/src/components/RackStrip/RackStrip.tsx",
        "packages/ui/src/components/TerminalTicker/TerminalTicker.tsx"
      ],
      "path": "packages/ui/src/domains.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/env.d.ts",
      "label": "env.d",
      "packageId": "ui",
      "category": "UI core",
      "summary": "",
      "lines": 12,
      "exports": [],
      "imports": [],
      "importedBy": [],
      "path": "packages/ui/src/env.d.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/gameRules.ts",
      "label": "gameRules",
      "packageId": "ui",
      "category": "UI core",
      "summary": "How the desk reads the rules of the run.",
      "lines": 96,
      "exports": [
        {
          "name": "RuleCopy",
          "kind": "interface",
          "path": "packages/ui/src/gameRules.ts",
          "line": 17
        },
        {
          "name": "RULE_COPY",
          "kind": "constant",
          "path": "packages/ui/src/gameRules.ts",
          "line": 29
        },
        {
          "name": "activeRuleMarks",
          "kind": "function",
          "path": "packages/ui/src/gameRules.ts",
          "line": 63
        },
        {
          "name": "CapitalReading",
          "kind": "interface",
          "path": "packages/ui/src/gameRules.ts",
          "line": 71
        },
        {
          "name": "capitalReading",
          "kind": "function",
          "path": "packages/ui/src/gameRules.ts",
          "line": 80
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/observation/src/index.ts"
      ],
      "importedBy": [
        "packages/ui/src/manual.ts",
        "packages/ui/src/panels/ControlRail.tsx",
        "packages/ui/src/panels/CountrySelect.tsx",
        "packages/ui/src/panels/HeaderBar.tsx"
      ],
      "path": "packages/ui/src/gameRules.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/incidence.ts",
      "label": "incidence",
      "packageId": "ui",
      "category": "UI core",
      "summary": "Fiscal incidence — who a drafted order actually reaches.",
      "lines": 83,
      "exports": [
        {
          "name": "IncidenceRow",
          "kind": "interface",
          "path": "packages/ui/src/incidence.ts",
          "line": 27
        },
        {
          "name": "Incidence",
          "kind": "interface",
          "path": "packages/ui/src/incidence.ts",
          "line": 35
        },
        {
          "name": "transferIncidence",
          "kind": "function",
          "path": "packages/ui/src/incidence.ts",
          "line": 59
        },
        {
          "name": "dialIncidence",
          "kind": "function",
          "path": "packages/ui/src/incidence.ts",
          "line": 79
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/observation/src/index.ts"
      ],
      "importedBy": [
        "packages/ui/src/panels/ControlRail.tsx"
      ],
      "path": "packages/ui/src/incidence.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/levers.ts",
      "label": "levers",
      "packageId": "ui",
      "category": "UI core",
      "summary": "What every lever on the desk actually does, in one place.",
      "lines": 295,
      "exports": [
        {
          "name": "LeverCopy",
          "kind": "interface",
          "path": "packages/ui/src/levers.ts",
          "line": 33
        },
        {
          "name": "LEVER_COPY",
          "kind": "constant",
          "path": "packages/ui/src/levers.ts",
          "line": 77
        },
        {
          "name": "CapacityCopy",
          "kind": "interface",
          "path": "packages/ui/src/levers.ts",
          "line": 170
        },
        {
          "name": "CAPACITY_COPY",
          "kind": "constant",
          "path": "packages/ui/src/levers.ts",
          "line": 181
        },
        {
          "name": "LeverGroupId",
          "kind": "type",
          "path": "packages/ui/src/levers.ts",
          "line": 222
        },
        {
          "name": "DrawerCopy",
          "kind": "interface",
          "path": "packages/ui/src/levers.ts",
          "line": 224
        },
        {
          "name": "LeverGroup",
          "kind": "interface",
          "path": "packages/ui/src/levers.ts",
          "line": 266
        },
        {
          "name": "LEVER_PATHS",
          "kind": "constant",
          "path": "packages/ui/src/levers.ts",
          "line": 272
        },
        {
          "name": "LEVER_GROUPS",
          "kind": "constant",
          "path": "packages/ui/src/levers.ts",
          "line": 283
        },
        {
          "name": "leverGroup",
          "kind": "function",
          "path": "packages/ui/src/levers.ts",
          "line": 292
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/ui/src/cabinetNavigation.ts",
        "packages/ui/src/components/labels.ts"
      ],
      "importedBy": [
        "packages/ui/src/manual.ts",
        "packages/ui/src/panels/ControlRail.tsx"
      ],
      "path": "packages/ui/src/levers.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/main.tsx",
      "label": "main",
      "packageId": "ui",
      "category": "UI core",
      "summary": "",
      "lines": 14,
      "exports": [],
      "imports": [
        "packages/ui/src/App.tsx",
        "packages/ui/src/dev/ComponentGallery.tsx"
      ],
      "importedBy": [],
      "path": "packages/ui/src/main.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/manual.ts",
      "label": "manual",
      "packageId": "ui",
      "category": "UI core",
      "summary": "The ministry handbook: everything the game knows how to explain about itself, as data rather than as markup.",
      "lines": 539,
      "exports": [
        {
          "name": "ManualEntry",
          "kind": "interface",
          "path": "packages/ui/src/manual.ts",
          "line": 70
        },
        {
          "name": "ManualSection",
          "kind": "interface",
          "path": "packages/ui/src/manual.ts",
          "line": 77
        },
        {
          "name": "MANUAL_CHAPTER_IDS",
          "kind": "constant",
          "path": "packages/ui/src/manual.ts",
          "line": 85
        },
        {
          "name": "ManualChapterId",
          "kind": "type",
          "path": "packages/ui/src/manual.ts",
          "line": 95
        },
        {
          "name": "ManualChapter",
          "kind": "interface",
          "path": "packages/ui/src/manual.ts",
          "line": 97
        },
        {
          "name": "MANUAL_CHAPTERS",
          "kind": "constant",
          "path": "packages/ui/src/manual.ts",
          "line": 467
        },
        {
          "name": "manualChapter",
          "kind": "function",
          "path": "packages/ui/src/manual.ts",
          "line": 471
        },
        {
          "name": "sectionAnchor",
          "kind": "function",
          "path": "packages/ui/src/manual.ts",
          "line": 485
        },
        {
          "name": "ManualHit",
          "kind": "interface",
          "path": "packages/ui/src/manual.ts",
          "line": 493
        },
        {
          "name": "searchManual",
          "kind": "function",
          "path": "packages/ui/src/manual.ts",
          "line": 513
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/observation/src/index.ts",
        "packages/ui/src/components/labels.ts",
        "packages/ui/src/gameRules.ts",
        "packages/ui/src/levers.ts",
        "packages/ui/src/maturity.ts",
        "packages/ui/src/wallPlan.ts"
      ],
      "importedBy": [
        "packages/ui/src/App.tsx",
        "packages/ui/src/panels/ManualOverlay.tsx"
      ],
      "path": "packages/ui/src/manual.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/maturity.ts",
      "label": "maturity",
      "packageId": "ui",
      "category": "UI core",
      "summary": "Instrument maturity is derived HERE, once, from PublishedState — never in individual components. If a threshold or a new tier arrives, this is the one place that changes.",
      "lines": 112,
      "exports": [
        {
          "name": "Maturity",
          "kind": "type",
          "path": "packages/ui/src/maturity.ts",
          "line": 11
        },
        {
          "name": "InstrumentAvailability",
          "kind": "type",
          "path": "packages/ui/src/maturity.ts",
          "line": 12
        },
        {
          "name": "InstrumentAccess",
          "kind": "interface",
          "path": "packages/ui/src/maturity.ts",
          "line": 14
        },
        {
          "name": "InstrumentUnlock",
          "kind": "interface",
          "path": "packages/ui/src/maturity.ts",
          "line": 22
        },
        {
          "name": "InstrumentStatusCounts",
          "kind": "interface",
          "path": "packages/ui/src/maturity.ts",
          "line": 27
        },
        {
          "name": "TERMINAL_AT",
          "kind": "constant",
          "path": "packages/ui/src/maturity.ts",
          "line": 34
        },
        {
          "name": "accessForInstrument",
          "kind": "function",
          "path": "packages/ui/src/maturity.ts",
          "line": 45
        },
        {
          "name": "deriveInstrumentAccess",
          "kind": "function",
          "path": "packages/ui/src/maturity.ts",
          "line": 68
        },
        {
          "name": "countInstrumentStatuses",
          "kind": "function",
          "path": "packages/ui/src/maturity.ts",
          "line": 84
        },
        {
          "name": "instrumentStatusSummary",
          "kind": "function",
          "path": "packages/ui/src/maturity.ts",
          "line": 91
        },
        {
          "name": "nextInstrumentUnlock",
          "kind": "function",
          "path": "packages/ui/src/maturity.ts",
          "line": 100
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/observation/src/index.ts",
        "packages/observation/src/index.ts"
      ],
      "importedBy": [
        "packages/ui/src/components/BlankPlate/BlankPlate.tsx",
        "packages/ui/src/components/Gauge/Gauge.tsx",
        "packages/ui/src/components/RackStrip/RackStrip.tsx",
        "packages/ui/src/manual.ts",
        "packages/ui/src/panels/ControlRail.tsx",
        "packages/ui/src/panels/Instruments.tsx"
      ],
      "path": "packages/ui/src/maturity.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/panels/AccountsOverlay.tsx",
      "label": "AccountsOverlay",
      "packageId": "ui",
      "category": "Panels",
      "summary": "The expenditure accounts, opened out — what the economy's output was FOR.",
      "lines": 156,
      "exports": [
        {
          "name": "AccountsOverlay",
          "kind": "function",
          "path": "packages/ui/src/panels/AccountsOverlay.tsx",
          "line": 42
        }
      ],
      "imports": [
        "packages/observation/src/index.ts",
        "packages/ui/src/accounts.ts",
        "packages/ui/src/components/series.ts",
        "packages/ui/src/components/ui/index.ts"
      ],
      "importedBy": [
        "packages/ui/src/App.tsx"
      ],
      "path": "packages/ui/src/panels/AccountsOverlay.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/panels/CensusOverlay.tsx",
      "label": "CensusOverlay",
      "packageId": "ui",
      "category": "Panels",
      "summary": "The national census — drill-down paperwork, not a home view. Two registers of knowledge sit side by side, and the difference is the whole fog mechanic: • the head count and the age pyramid are EXACT — census-grade, always yours, scrubbable across the whole century; • birth, de…",
      "lines": 291,
      "exports": [
        {
          "name": "CensusOverlay",
          "kind": "function",
          "path": "packages/ui/src/panels/CensusOverlay.tsx",
          "line": 206
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/observation/src/index.ts",
        "packages/ui/src/components/ui/index.ts"
      ],
      "importedBy": [
        "packages/ui/src/App.tsx"
      ],
      "path": "packages/ui/src/panels/CensusOverlay.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/panels/ControlRail.tsx",
      "label": "ControlRail",
      "packageId": "ui",
      "category": "Panels",
      "summary": "The cabinet workspace: one decision domain at a time, with the draft and enact flow pinned below it. It is a right rail on full desktops and the same focused drawer at smaller laptop and tablet widths.",
      "lines": 772,
      "exports": [
        {
          "name": "ControlRail",
          "kind": "function",
          "path": "packages/ui/src/panels/ControlRail.tsx",
          "line": 492
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/observation/src/index.ts",
        "packages/ui/src/cabinetNavigation.ts",
        "packages/ui/src/components/labels.ts",
        "packages/ui/src/components/ui/index.ts",
        "packages/ui/src/gameRules.ts",
        "packages/ui/src/incidence.ts",
        "packages/ui/src/levers.ts",
        "packages/ui/src/maturity.ts",
        "packages/ui/src/spendingRules.ts",
        "packages/ui/src/store/gameStore.ts"
      ],
      "importedBy": [
        "packages/ui/src/App.tsx"
      ],
      "path": "packages/ui/src/panels/ControlRail.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/panels/CountrySelect.tsx",
      "label": "CountrySelect",
      "packageId": "ui",
      "category": "Panels",
      "summary": "The posting room: choose which country's 1946 settlement to inherit before the worker creates any true state. This is game furniture, not a settings form — six dossiers, one sealed appointment.",
      "lines": 637,
      "exports": [
        {
          "name": "CountrySelect",
          "kind": "function",
          "path": "packages/ui/src/panels/CountrySelect.tsx",
          "line": 326
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/ui/src/components/ui/index.ts",
        "packages/ui/src/countryDraft.ts",
        "packages/ui/src/gameRules.ts"
      ],
      "importedBy": [
        "packages/ui/src/App.tsx"
      ],
      "path": "packages/ui/src/panels/CountrySelect.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/panels/DevConsole.tsx",
      "label": "DevConsole",
      "packageId": "ui",
      "category": "Panels",
      "summary": "The maintenance hatch. Deliberately NOT diegetic: this is the one surface in the app that is not part of the fiction, and it is styled to be unmistakable about that — no brass, no manila, no instrument register. If a dev tool ever reads as game furniture, someone will eventual…",
      "lines": 278,
      "exports": [
        {
          "name": "DevConsole",
          "kind": "function",
          "path": "packages/ui/src/panels/DevConsole.tsx",
          "line": 85
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/ui/src/components/ui/index.ts",
        "packages/ui/src/devScenario.ts",
        "packages/ui/src/store/gameStore.ts",
        "packages/ui/src/worker/protocol.ts"
      ],
      "importedBy": [
        "packages/ui/src/App.tsx"
      ],
      "path": "packages/ui/src/panels/DevConsole.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/panels/DraftingRoom.tsx",
      "label": "DraftingRoom",
      "packageId": "ui",
      "category": "Panels",
      "summary": "The drafting room: where a posting gets written instead of chosen.",
      "lines": 276,
      "exports": [
        {
          "name": "DraftingRoom",
          "kind": "function",
          "path": "packages/ui/src/panels/DraftingRoom.tsx",
          "line": 45
        }
      ],
      "imports": [
        "packages/ui/src/components/ui/index.ts",
        "packages/ui/src/countryDraft.ts",
        "packages/ui/src/panels/StudyReport.tsx",
        "packages/ui/src/store/gameStore.ts"
      ],
      "importedBy": [
        "packages/ui/src/App.tsx"
      ],
      "path": "packages/ui/src/panels/DraftingRoom.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/panels/ElectionOverlay.tsx",
      "label": "ElectionOverlay",
      "packageId": "ui",
      "category": "Panels",
      "summary": "The election, as a scene.",
      "lines": 277,
      "exports": [
        {
          "name": "ElectionOverlay",
          "kind": "function",
          "path": "packages/ui/src/panels/ElectionOverlay.tsx",
          "line": 109
        }
      ],
      "imports": [
        "packages/observation/src/index.ts",
        "packages/ui/src/components/labels.ts",
        "packages/ui/src/components/ui/index.ts",
        "packages/ui/src/store/gameStore.ts"
      ],
      "importedBy": [
        "packages/ui/src/App.tsx"
      ],
      "path": "packages/ui/src/panels/ElectionOverlay.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/panels/ElectionResultOverlay.tsx",
      "label": "ElectionResultOverlay",
      "packageId": "ui",
      "category": "Panels",
      "summary": "The night itself. A campaign that got its own scene deserves a result that gets one too — the wire line (\"The government is returned at the polls\") tells you the outcome but never the arithmetic, and the arithmetic is what teaches you whether the platform you mortgaged somethi…",
      "lines": 122,
      "exports": [
        {
          "name": "ElectionResultOverlay",
          "kind": "function",
          "path": "packages/ui/src/panels/ElectionResultOverlay.tsx",
          "line": 17
        }
      ],
      "imports": [
        "packages/observation/src/index.ts",
        "packages/ui/src/components/labels.ts",
        "packages/ui/src/components/ui/index.ts"
      ],
      "importedBy": [
        "packages/ui/src/App.tsx"
      ],
      "path": "packages/ui/src/panels/ElectionResultOverlay.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/panels/FinanceOverlay.tsx",
      "label": "FinanceOverlay",
      "packageId": "ui",
      "category": "Panels",
      "summary": "The financial system — drill-down paperwork, and a fog lesson with a twist. A banking crisis ALWAYS makes the papers (onset is on the wire, unfogged — a bank run is not a thing you can hide), so even an unfunded government sees, in oxblood, that the crash happened. But the bui…",
      "lines": 183,
      "exports": [
        {
          "name": "FinanceOverlay",
          "kind": "function",
          "path": "packages/ui/src/panels/FinanceOverlay.tsx",
          "line": 121
        }
      ],
      "imports": [
        "packages/observation/src/index.ts",
        "packages/ui/src/components/ui/index.ts",
        "packages/ui/src/components/ui/index.ts"
      ],
      "importedBy": [
        "packages/ui/src/App.tsx"
      ],
      "path": "packages/ui/src/panels/FinanceOverlay.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/panels/HeaderBar.tsx",
      "label": "HeaderBar",
      "packageId": "ui",
      "category": "Panels",
      "summary": "Thin ministry letterhead: who you are, when it is, what you can spend — and the treasury's exact books inline (the only numbers you get raw).",
      "lines": 125,
      "exports": [
        {
          "name": "HeaderBar",
          "kind": "function",
          "path": "packages/ui/src/panels/HeaderBar.tsx",
          "line": 20
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/observation/src/index.ts",
        "packages/ui/src/components/ui/index.ts",
        "packages/ui/src/gameRules.ts"
      ],
      "importedBy": [
        "packages/ui/src/App.tsx"
      ],
      "path": "packages/ui/src/panels/HeaderBar.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/panels/Instruments.tsx",
      "label": "Instruments",
      "packageId": "ui",
      "category": "Panels",
      "summary": "The instrument wall — the home view, in three bands.",
      "lines": 113,
      "exports": [
        {
          "name": "Instruments",
          "kind": "function",
          "path": "packages/ui/src/panels/Instruments.tsx",
          "line": 28
        }
      ],
      "imports": [
        "packages/observation/src/index.ts",
        "packages/ui/src/components/CorridorPlot/CorridorPlot.tsx",
        "packages/ui/src/components/Gauge/Gauge.tsx",
        "packages/ui/src/components/RackStrip/RackStrip.tsx",
        "packages/ui/src/components/ui/index.ts",
        "packages/ui/src/maturity.ts",
        "packages/ui/src/panels/LedgerPanel.tsx",
        "packages/ui/src/store/gameStore.ts",
        "packages/ui/src/wallPlan.ts"
      ],
      "importedBy": [
        "packages/ui/src/App.tsx"
      ],
      "path": "packages/ui/src/panels/Instruments.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/panels/LedgerOverlay.tsx",
      "label": "LedgerOverlay",
      "packageId": "ui",
      "category": "Panels",
      "summary": "The treasury ledger, opened out. Everything here is EXACT — these are the government's books on itself, the one corner of the world that arrives on time, unrevised and true — so it is drawn flat in ink, with no error band and no revision stamp anywhere.",
      "lines": 202,
      "exports": [
        {
          "name": "LedgerOverlay",
          "kind": "function",
          "path": "packages/ui/src/panels/LedgerOverlay.tsx",
          "line": 79
        }
      ],
      "imports": [
        "packages/observation/src/index.ts",
        "packages/observation/src/index.ts",
        "packages/ui/src/budgetChart.ts",
        "packages/ui/src/components/ui/index.ts",
        "packages/ui/src/shares.ts"
      ],
      "importedBy": [
        "packages/ui/src/App.tsx"
      ],
      "path": "packages/ui/src/panels/LedgerOverlay.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/panels/LedgerPanel.tsx",
      "label": "LedgerPanel",
      "packageId": "ui",
      "category": "Panels",
      "summary": "The treasury ledger, docked in the instrument wall. Exact — these are the government's own books, the one part of the world it can see clearly. Two lines and three totals is all the bay affords; the composition of each side lives one click away in `LedgerOverlay`.",
      "lines": 60,
      "exports": [
        {
          "name": "LedgerPanel",
          "kind": "function",
          "path": "packages/ui/src/panels/LedgerPanel.tsx",
          "line": 12
        }
      ],
      "imports": [
        "packages/observation/src/index.ts",
        "packages/ui/src/components/WallTile/WallTile.tsx",
        "packages/ui/src/components/ui/index.ts"
      ],
      "importedBy": [
        "packages/ui/src/panels/Instruments.tsx"
      ],
      "path": "packages/ui/src/panels/LedgerPanel.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/panels/ManualOverlay.tsx",
      "label": "ManualOverlay",
      "packageId": "ui",
      "category": "Panels",
      "summary": "The ministry handbook — the in-game manual (#80), the place the methodology is written down (#32), and where the opening walkthrough hands the player when it runs out of cards (#33).",
      "lines": 218,
      "exports": [
        {
          "name": "ManualOverlay",
          "kind": "function",
          "path": "packages/ui/src/panels/ManualOverlay.tsx",
          "line": 80
        }
      ],
      "imports": [
        "packages/ui/src/components/ui/index.ts",
        "packages/ui/src/manual.ts"
      ],
      "importedBy": [
        "packages/ui/src/App.tsx"
      ],
      "path": "packages/ui/src/panels/ManualOverlay.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/panels/NewsWire.tsx",
      "label": "NewsWire",
      "packageId": "ui",
      "category": "Panels",
      "summary": "The news wire — teletype register (connecting tissue, neither dossier nor terminal). Rumor is the poor state's only instrument.",
      "lines": 43,
      "exports": [
        {
          "name": "NewsWire",
          "kind": "function",
          "path": "packages/ui/src/panels/NewsWire.tsx",
          "line": 11
        }
      ],
      "imports": [
        "packages/observation/src/index.ts",
        "packages/ui/src/components/ui/index.ts"
      ],
      "importedBy": [
        "packages/ui/src/App.tsx"
      ],
      "path": "packages/ui/src/panels/NewsWire.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/panels/PolicyOverlay.tsx",
      "label": "PolicyOverlay",
      "packageId": "ui",
      "category": "Panels",
      "summary": "THE POLICY RECORD — what you set, over the whole century.",
      "lines": 413,
      "exports": [
        {
          "name": "PolicyOverlay",
          "kind": "function",
          "path": "packages/ui/src/panels/PolicyOverlay.tsx",
          "line": 193
        }
      ],
      "imports": [
        "packages/observation/src/index.ts",
        "packages/ui/src/components/ui/index.ts",
        "packages/ui/src/policyRecord.ts",
        "packages/ui/src/shares.ts"
      ],
      "importedBy": [
        "packages/ui/src/App.tsx"
      ],
      "path": "packages/ui/src/panels/PolicyOverlay.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/panels/ReportCardOverlay.tsx",
      "label": "ReportCardOverlay",
      "packageId": "ui",
      "category": "Panels",
      "summary": "The historians' verdict. A run ends (deposition or 2050) with a report card whose axes are graded separately and never summed: one number would secretly author a \"correct\" ideology.",
      "lines": 211,
      "exports": [
        {
          "name": "ReportCardOverlay",
          "kind": "function",
          "path": "packages/ui/src/panels/ReportCardOverlay.tsx",
          "line": 98
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/observation/src/index.ts",
        "packages/ui/src/components/ui/index.ts"
      ],
      "importedBy": [
        "packages/ui/src/App.tsx"
      ],
      "path": "packages/ui/src/panels/ReportCardOverlay.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/panels/SettingsOverlay.tsx",
      "label": "SettingsOverlay",
      "packageId": "ui",
      "category": "Panels",
      "summary": "Records office: saves in, saves out, the methodology, and the drastic drawer.",
      "lines": 91,
      "exports": [
        {
          "name": "SettingsOverlay",
          "kind": "function",
          "path": "packages/ui/src/panels/SettingsOverlay.tsx",
          "line": 9
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/observation/src/index.ts",
        "packages/ui/src/components/ui/index.ts",
        "packages/ui/src/store/gameStore.ts"
      ],
      "importedBy": [
        "packages/ui/src/App.tsx"
      ],
      "path": "packages/ui/src/panels/SettingsOverlay.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/panels/StudyOverlay.tsx",
      "label": "StudyOverlay",
      "packageId": "ui",
      "category": "Panels",
      "summary": "The Study — where the minister pins published prints to the corkboard and draws curves through them. The Phillips scatter uses only what the statistical office has actually released: no survey, no dot. Drawn in the hand-annotated map register.",
      "lines": 105,
      "exports": [
        {
          "name": "StudyOverlay",
          "kind": "function",
          "path": "packages/ui/src/panels/StudyOverlay.tsx",
          "line": 16
        }
      ],
      "imports": [
        "packages/observation/src/index.ts",
        "packages/ui/src/components/series.ts",
        "packages/ui/src/components/ui/index.ts"
      ],
      "importedBy": [
        "packages/ui/src/App.tsx"
      ],
      "path": "packages/ui/src/panels/StudyOverlay.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/panels/StudyReport.tsx",
      "label": "StudyReport",
      "packageId": "ui",
      "category": "Panels",
      "summary": "The feasibility study, as a page of the file.",
      "lines": 240,
      "exports": [
        {
          "name": "StudyState",
          "kind": "interface",
          "path": "packages/ui/src/panels/StudyReport.tsx",
          "line": 21
        },
        {
          "name": "StudyReport",
          "kind": "function",
          "path": "packages/ui/src/panels/StudyReport.tsx",
          "line": 88
        }
      ],
      "imports": [
        "packages/ui/src/components/ui/index.ts",
        "packages/ui/src/countryDraft.ts",
        "packages/ui/src/countryDraft.ts",
        "packages/ui/src/devScenario.ts",
        "packages/ui/src/worker/trial.ts"
      ],
      "importedBy": [
        "packages/ui/src/panels/DraftingRoom.tsx"
      ],
      "path": "packages/ui/src/panels/StudyReport.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/panels/Walkthrough.tsx",
      "label": "Walkthrough",
      "packageId": "ui",
      "category": "Panels",
      "summary": "The opening walkthrough (#33), as a card in the corner rather than a modal.",
      "lines": 130,
      "exports": [
        {
          "name": "Walkthrough",
          "kind": "function",
          "path": "packages/ui/src/panels/Walkthrough.tsx",
          "line": 44
        }
      ],
      "imports": [
        "packages/ui/src/components/ui/index.ts",
        "packages/ui/src/walkthrough.ts"
      ],
      "importedBy": [
        "packages/ui/src/App.tsx"
      ],
      "path": "packages/ui/src/panels/Walkthrough.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/panels/WireOverlay.tsx",
      "label": "WireOverlay",
      "packageId": "ui",
      "category": "Panels",
      "summary": "The full dispatch spike — every rumor the wire ever carried.",
      "lines": 38,
      "exports": [
        {
          "name": "WireOverlay",
          "kind": "function",
          "path": "packages/ui/src/panels/WireOverlay.tsx",
          "line": 8
        }
      ],
      "imports": [
        "packages/observation/src/index.ts",
        "packages/ui/src/components/ui/index.ts"
      ],
      "importedBy": [
        "packages/ui/src/App.tsx"
      ],
      "path": "packages/ui/src/panels/WireOverlay.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/plot.ts",
      "label": "plot",
      "packageId": "ui",
      "category": "UI core",
      "summary": "Time-series geometry — scales, ticks and paths for every line, area and ribbon in the game.",
      "lines": 339,
      "exports": [
        {
          "name": "PlotPoint",
          "kind": "interface",
          "path": "packages/ui/src/plot.ts",
          "line": 37
        },
        {
          "name": "BandPoint",
          "kind": "interface",
          "path": "packages/ui/src/plot.ts",
          "line": 43
        },
        {
          "name": "PlotBox",
          "kind": "interface",
          "path": "packages/ui/src/plot.ts",
          "line": 47
        },
        {
          "name": "YAxisSpec",
          "kind": "interface",
          "path": "packages/ui/src/plot.ts",
          "line": 60
        },
        {
          "name": "Axis",
          "kind": "interface",
          "path": "packages/ui/src/plot.ts",
          "line": 72
        },
        {
          "name": "PlotRange",
          "kind": "interface",
          "path": "packages/ui/src/plot.ts",
          "line": 81
        },
        {
          "name": "TimePlot",
          "kind": "interface",
          "path": "packages/ui/src/plot.ts",
          "line": 90
        },
        {
          "name": "tickStep",
          "kind": "function",
          "path": "packages/ui/src/plot.ts",
          "line": 126
        },
        {
          "name": "niceTicks",
          "kind": "function",
          "path": "packages/ui/src/plot.ts",
          "line": 146
        },
        {
          "name": "yAxis",
          "kind": "function",
          "path": "packages/ui/src/plot.ts",
          "line": 168
        },
        {
          "name": "timePlot",
          "kind": "function",
          "path": "packages/ui/src/plot.ts",
          "line": 204
        },
        {
          "name": "axisDecimals",
          "kind": "function",
          "path": "packages/ui/src/plot.ts",
          "line": 283
        },
        {
          "name": "nearestPoint",
          "kind": "function",
          "path": "packages/ui/src/plot.ts",
          "line": 294
        },
        {
          "name": "rangeBetween",
          "kind": "function",
          "path": "packages/ui/src/plot.ts",
          "line": 315
        }
      ],
      "imports": [
        "packages/ui/src/shares.ts"
      ],
      "importedBy": [
        "packages/ui/src/components/ui/TimeSeriesChart/TimeSeriesChart.tsx"
      ],
      "path": "packages/ui/src/plot.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/policyRecord.ts",
      "label": "policyRecord",
      "packageId": "ui",
      "category": "UI core",
      "summary": "The minute book: what the cabinet SET, quarter by quarter.",
      "lines": 262,
      "exports": [
        {
          "name": "PolicyGroup",
          "kind": "type",
          "path": "packages/ui/src/policyRecord.ts",
          "line": 36
        },
        {
          "name": "PolicyUnit",
          "kind": "type",
          "path": "packages/ui/src/policyRecord.ts",
          "line": 41
        },
        {
          "name": "PolicyLine",
          "kind": "interface",
          "path": "packages/ui/src/policyRecord.ts",
          "line": 43
        },
        {
          "name": "RULE_MODE_LABEL",
          "kind": "constant",
          "path": "packages/ui/src/policyRecord.ts",
          "line": 112
        },
        {
          "name": "POLICY_LINES",
          "kind": "constant",
          "path": "packages/ui/src/policyRecord.ts",
          "line": 122
        },
        {
          "name": "POLICY_LINES_BY_GROUP",
          "kind": "constant",
          "path": "packages/ui/src/policyRecord.ts",
          "line": 157
        },
        {
          "name": "PolicyChange",
          "kind": "interface",
          "path": "packages/ui/src/policyRecord.ts",
          "line": 167
        },
        {
          "name": "policyAt",
          "kind": "function",
          "path": "packages/ui/src/policyRecord.ts",
          "line": 195
        },
        {
          "name": "policyChanges",
          "kind": "function",
          "path": "packages/ui/src/policyRecord.ts",
          "line": 211
        },
        {
          "name": "formatPolicyValue",
          "kind": "function",
          "path": "packages/ui/src/policyRecord.ts",
          "line": 253
        },
        {
          "name": "formatRuleValue",
          "kind": "function",
          "path": "packages/ui/src/policyRecord.ts",
          "line": 259
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/observation/src/index.ts"
      ],
      "importedBy": [
        "packages/ui/src/panels/PolicyOverlay.tsx"
      ],
      "path": "packages/ui/src/policyRecord.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/saveFile.ts",
      "label": "saveFile",
      "packageId": "ui",
      "category": "UI core",
      "summary": "Whether a save this browser is still holding can be opened, and what to say when it can't.",
      "lines": 125,
      "exports": [
        {
          "name": "looksLikeSave",
          "kind": "function",
          "path": "packages/ui/src/saveFile.ts",
          "line": 38
        },
        {
          "name": "replayWindow",
          "kind": "function",
          "path": "packages/ui/src/saveFile.ts",
          "line": 81
        },
        {
          "name": "saveSchema",
          "kind": "function",
          "path": "packages/ui/src/saveFile.ts",
          "line": 99
        },
        {
          "name": "unreadableSaveMessage",
          "kind": "function",
          "path": "packages/ui/src/saveFile.ts",
          "line": 122
        }
      ],
      "imports": [
        "packages/engine/src/index.ts"
      ],
      "importedBy": [
        "packages/ui/src/store/gameStore.ts",
        "packages/ui/src/worker/sim.worker.ts"
      ],
      "path": "packages/ui/src/saveFile.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/shares.ts",
      "label": "shares",
      "packageId": "ui",
      "category": "UI core",
      "summary": "Shares of a whole — the geometry behind every composition view.",
      "lines": 199,
      "exports": [
        {
          "name": "Share",
          "kind": "interface",
          "path": "packages/ui/src/shares.ts",
          "line": 16
        },
        {
          "name": "Slice",
          "kind": "interface",
          "path": "packages/ui/src/shares.ts",
          "line": 25
        },
        {
          "name": "DonutGeom",
          "kind": "interface",
          "path": "packages/ui/src/shares.ts",
          "line": 32
        },
        {
          "name": "SHARE_INKS",
          "kind": "constant",
          "path": "packages/ui/src/shares.ts",
          "line": 47
        },
        {
          "name": "donutSlices",
          "kind": "function",
          "path": "packages/ui/src/shares.ts",
          "line": 81
        },
        {
          "name": "StackRow",
          "kind": "interface",
          "path": "packages/ui/src/shares.ts",
          "line": 109
        },
        {
          "name": "StackBox",
          "kind": "interface",
          "path": "packages/ui/src/shares.ts",
          "line": 114
        },
        {
          "name": "StackBand",
          "kind": "interface",
          "path": "packages/ui/src/shares.ts",
          "line": 123
        },
        {
          "name": "StackPlot",
          "kind": "interface",
          "path": "packages/ui/src/shares.ts",
          "line": 130
        },
        {
          "name": "stackPlot",
          "kind": "function",
          "path": "packages/ui/src/shares.ts",
          "line": 149
        },
        {
          "name": "thin",
          "kind": "function",
          "path": "packages/ui/src/shares.ts",
          "line": 191
        }
      ],
      "imports": [],
      "importedBy": [
        "packages/ui/src/accounts.ts",
        "packages/ui/src/components/ui/DonutChart/DonutChart.tsx",
        "packages/ui/src/components/ui/StackedAreaChart/StackedAreaChart.tsx",
        "packages/ui/src/dev/ComponentGallery.tsx",
        "packages/ui/src/panels/LedgerOverlay.tsx",
        "packages/ui/src/panels/PolicyOverlay.tsx",
        "packages/ui/src/plot.ts"
      ],
      "path": "packages/ui/src/shares.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/spendingRules.ts",
      "label": "spendingRules",
      "packageId": "ui",
      "category": "UI core",
      "summary": "Pure UI arithmetic for the cabinet's recurring expenditure controls.",
      "lines": 57,
      "exports": [
        {
          "name": "OfficialNominalGdp",
          "kind": "interface",
          "path": "packages/ui/src/spendingRules.ts",
          "line": 6
        },
        {
          "name": "latestOfficialNominalGdp",
          "kind": "function",
          "path": "packages/ui/src/spendingRules.ts",
          "line": 12
        },
        {
          "name": "equivalentRuleValue",
          "kind": "function",
          "path": "packages/ui/src/spendingRules.ts",
          "line": 29
        },
        {
          "name": "currentRuleValue",
          "kind": "function",
          "path": "packages/ui/src/spendingRules.ts",
          "line": 40
        },
        {
          "name": "proposedSpending",
          "kind": "function",
          "path": "packages/ui/src/spendingRules.ts",
          "line": 48
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/observation/src/index.ts"
      ],
      "importedBy": [
        "packages/ui/src/panels/ControlRail.tsx"
      ],
      "path": "packages/ui/src/spendingRules.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/store/db.ts",
      "label": "db",
      "packageId": "ui",
      "category": "Persistence & store",
      "summary": "Minimal IndexedDB key-value wrapper for autosaves (§8).",
      "lines": 33,
      "exports": [
        {
          "name": "dbPut",
          "kind": "function",
          "path": "packages/ui/src/store/db.ts",
          "line": 15
        },
        {
          "name": "dbGet",
          "kind": "function",
          "path": "packages/ui/src/store/db.ts",
          "line": 25
        }
      ],
      "imports": [],
      "importedBy": [
        "packages/ui/src/store/gameStore.ts"
      ],
      "path": "packages/ui/src/store/db.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/store/gameStore.ts",
      "label": "gameStore",
      "packageId": "ui",
      "category": "Persistence & store",
      "summary": "",
      "lines": 368,
      "exports": [
        {
          "name": "useGame",
          "kind": "constant",
          "path": "packages/ui/src/store/gameStore.ts",
          "line": 124
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/engine/src/index.ts",
        "packages/observation/src/index.ts",
        "packages/observation/src/index.ts",
        "packages/ui/src/countryDraft.ts",
        "packages/ui/src/devScenario.ts",
        "packages/ui/src/saveFile.ts",
        "packages/ui/src/store/db.ts",
        "packages/ui/src/wallPlan.ts",
        "packages/ui/src/worker/protocol.ts",
        "packages/ui/src/worker/trial.ts"
      ],
      "importedBy": [
        "packages/ui/src/App.tsx",
        "packages/ui/src/panels/ControlRail.tsx",
        "packages/ui/src/panels/DevConsole.tsx",
        "packages/ui/src/panels/DraftingRoom.tsx",
        "packages/ui/src/panels/ElectionOverlay.tsx",
        "packages/ui/src/panels/Instruments.tsx",
        "packages/ui/src/panels/SettingsOverlay.tsx"
      ],
      "path": "packages/ui/src/store/gameStore.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/walkthrough.ts",
      "label": "walkthrough",
      "packageId": "ui",
      "category": "UI core",
      "summary": "The first-quarter walkthrough: a short tour of the war room, given once.",
      "lines": 172,
      "exports": [
        {
          "name": "TourTarget",
          "kind": "type",
          "path": "packages/ui/src/walkthrough.ts",
          "line": 30
        },
        {
          "name": "TourPlace",
          "kind": "type",
          "path": "packages/ui/src/walkthrough.ts",
          "line": 35
        },
        {
          "name": "WalkthroughStep",
          "kind": "interface",
          "path": "packages/ui/src/walkthrough.ts",
          "line": 37
        },
        {
          "name": "WALKTHROUGH_STEPS",
          "kind": "constant",
          "path": "packages/ui/src/walkthrough.ts",
          "line": 46
        },
        {
          "name": "placeSide",
          "kind": "constant",
          "path": "packages/ui/src/walkthrough.ts",
          "line": 111
        },
        {
          "name": "targetSide",
          "kind": "constant",
          "path": "packages/ui/src/walkthrough.ts",
          "line": 126
        },
        {
          "name": "stepAt",
          "kind": "function",
          "path": "packages/ui/src/walkthrough.ts",
          "line": 135
        },
        {
          "name": "isLastStep",
          "kind": "constant",
          "path": "packages/ui/src/walkthrough.ts",
          "line": 139
        },
        {
          "name": "BRIEFED_KEY",
          "kind": "constant",
          "path": "packages/ui/src/walkthrough.ts",
          "line": 145
        },
        {
          "name": "hasBeenBriefed",
          "kind": "function",
          "path": "packages/ui/src/walkthrough.ts",
          "line": 147
        },
        {
          "name": "markBriefed",
          "kind": "function",
          "path": "packages/ui/src/walkthrough.ts",
          "line": 157
        },
        {
          "name": "forgetBriefing",
          "kind": "function",
          "path": "packages/ui/src/walkthrough.ts",
          "line": 165
        }
      ],
      "imports": [],
      "importedBy": [
        "packages/ui/src/App.tsx",
        "packages/ui/src/panels/Walkthrough.tsx"
      ],
      "path": "packages/ui/src/walkthrough.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/wallPlan.ts",
      "label": "wallPlan",
      "packageId": "ui",
      "category": "UI core",
      "summary": "The wall's height budget — the module that keeps the war room on one screen.",
      "lines": 173,
      "exports": [
        {
          "name": "REFERENCE_VIEWPORT",
          "kind": "constant",
          "path": "packages/ui/src/wallPlan.ts",
          "line": 31
        },
        {
          "name": "CHROME",
          "kind": "constant",
          "path": "packages/ui/src/wallPlan.ts",
          "line": 34
        },
        {
          "name": "BOARD_SLOT_MIN_H",
          "kind": "constant",
          "path": "packages/ui/src/wallPlan.ts",
          "line": 46
        },
        {
          "name": "RACK_ROW_H",
          "kind": "constant",
          "path": "packages/ui/src/wallPlan.ts",
          "line": 48
        },
        {
          "name": "DOCKED_MIN_H",
          "kind": "constant",
          "path": "packages/ui/src/wallPlan.ts",
          "line": 50
        },
        {
          "name": "SECTION_BAR_H",
          "kind": "constant",
          "path": "packages/ui/src/wallPlan.ts",
          "line": 52
        },
        {
          "name": "BOARD_SLOTS",
          "kind": "constant",
          "path": "packages/ui/src/wallPlan.ts",
          "line": 54
        },
        {
          "name": "DESKTOP_RACK_COLS",
          "kind": "constant",
          "path": "packages/ui/src/wallPlan.ts",
          "line": 61
        },
        {
          "name": "DEFAULT_PINS",
          "kind": "constant",
          "path": "packages/ui/src/wallPlan.ts",
          "line": 66
        },
        {
          "name": "WallPlan",
          "kind": "interface",
          "path": "packages/ui/src/wallPlan.ts",
          "line": 68
        },
        {
          "name": "wallBudgetPx",
          "kind": "function",
          "path": "packages/ui/src/wallPlan.ts",
          "line": 82
        },
        {
          "name": "wallWidthPx",
          "kind": "function",
          "path": "packages/ui/src/wallPlan.ts",
          "line": 87
        },
        {
          "name": "rackColumns",
          "kind": "function",
          "path": "packages/ui/src/wallPlan.ts",
          "line": 91
        },
        {
          "name": "resolveBoard",
          "kind": "function",
          "path": "packages/ui/src/wallPlan.ts",
          "line": 106
        },
        {
          "name": "toggleBoardPin",
          "kind": "function",
          "path": "packages/ui/src/wallPlan.ts",
          "line": 122
        },
        {
          "name": "planWall",
          "kind": "function",
          "path": "packages/ui/src/wallPlan.ts",
          "line": 135
        },
        {
          "name": "wallFits",
          "kind": "function",
          "path": "packages/ui/src/wallPlan.ts",
          "line": 156
        },
        {
          "name": "rackHeadroom",
          "kind": "function",
          "path": "packages/ui/src/wallPlan.ts",
          "line": 165
        }
      ],
      "imports": [
        "packages/observation/src/index.ts"
      ],
      "importedBy": [
        "packages/ui/src/components/RackStrip/RackStrip.tsx",
        "packages/ui/src/manual.ts",
        "packages/ui/src/panels/Instruments.tsx",
        "packages/ui/src/store/gameStore.ts"
      ],
      "path": "packages/ui/src/wallPlan.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/worker/protocol.ts",
      "label": "protocol",
      "packageId": "ui",
      "category": "Worker boundary",
      "summary": "The single shared contract between UI and sim worker (§1.1). Payloads are typed exclusively with PublishedState, action types, and save files — the true state never crosses this boundary.",
      "lines": 72,
      "exports": [
        {
          "name": "ClientMessage",
          "kind": "type",
          "path": "packages/ui/src/worker/protocol.ts",
          "line": 15
        },
        {
          "name": "WorkerMessage",
          "kind": "type",
          "path": "packages/ui/src/worker/protocol.ts",
          "line": 35
        },
        {
          "name": "DevNode",
          "kind": "interface",
          "path": "packages/ui/src/worker/protocol.ts",
          "line": 66
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/observation/src/index.ts",
        "packages/ui/src/devScenario.ts",
        "packages/ui/src/worker/trial.ts"
      ],
      "importedBy": [
        "packages/ui/src/panels/DevConsole.tsx",
        "packages/ui/src/store/gameStore.ts",
        "packages/ui/src/worker/sim.worker.ts"
      ],
      "path": "packages/ui/src/worker/protocol.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/worker/sim.worker.ts",
      "label": "sim.worker",
      "packageId": "ui",
      "category": "Worker boundary",
      "summary": "The engine host. Owns trueState; emits PublishedState only — the fog is architecturally mandatory, not a UI courtesy (ADR-0003 and ADR-0004).",
      "lines": 342,
      "exports": [],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/observation/src/index.ts",
        "packages/ui/src/devScenario.ts",
        "packages/ui/src/saveFile.ts",
        "packages/ui/src/worker/protocol.ts",
        "packages/ui/src/worker/trial.ts"
      ],
      "importedBy": [],
      "path": "packages/ui/src/worker/sim.worker.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/worker/trial.ts",
      "label": "trial",
      "packageId": "ui",
      "category": "Worker boundary",
      "summary": "The feasibility study — `pnpm batch`, in the browser, for a country nobody has ever run.",
      "lines": 253,
      "exports": [
        {
          "name": "TRIAL_SEEDS",
          "kind": "constant",
          "path": "packages/ui/src/worker/trial.ts",
          "line": 51
        },
        {
          "name": "TRIAL_TICKS",
          "kind": "constant",
          "path": "packages/ui/src/worker/trial.ts",
          "line": 54
        },
        {
          "name": "TRIAL_REFERENCE",
          "kind": "constant",
          "path": "packages/ui/src/worker/trial.ts",
          "line": 56
        },
        {
          "name": "TrialBand",
          "kind": "interface",
          "path": "packages/ui/src/worker/trial.ts",
          "line": 58
        },
        {
          "name": "TrialFailure",
          "kind": "type",
          "path": "packages/ui/src/worker/trial.ts",
          "line": 64
        },
        {
          "name": "TrialLeg",
          "kind": "interface",
          "path": "packages/ui/src/worker/trial.ts",
          "line": 66
        },
        {
          "name": "TrialReport",
          "kind": "interface",
          "path": "packages/ui/src/worker/trial.ts",
          "line": 86
        },
        {
          "name": "TrialProgress",
          "kind": "interface",
          "path": "packages/ui/src/worker/trial.ts",
          "line": 93
        },
        {
          "name": "trialSeed",
          "kind": "constant",
          "path": "packages/ui/src/worker/trial.ts",
          "line": 113
        },
        {
          "name": "runTrial",
          "kind": "function",
          "path": "packages/ui/src/worker/trial.ts",
          "line": 230
        }
      ],
      "imports": [
        "packages/engine/src/index.ts"
      ],
      "importedBy": [
        "packages/ui/src/panels/StudyReport.tsx",
        "packages/ui/src/store/gameStore.ts",
        "packages/ui/src/worker/protocol.ts",
        "packages/ui/src/worker/sim.worker.ts"
      ],
      "path": "packages/ui/src/worker/trial.ts",
      "line": 1
    },
    {
      "id": "packages/ui/vite.config.ts",
      "label": "vite.config",
      "packageId": "ui",
      "category": "UI core",
      "summary": "",
      "lines": 30,
      "exports": [],
      "imports": [],
      "importedBy": [],
      "path": "packages/ui/vite.config.ts",
      "line": 1
    }
  ],
  "moduleEdges": [
    {
      "source": "packages/engine/src/actions/apply.ts",
      "target": "packages/engine/src/actions/types.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/actions/apply.ts",
      "target": "packages/engine/src/constants.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/actions/apply.ts",
      "target": "packages/engine/src/math.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/actions/apply.ts",
      "target": "packages/engine/src/pipeline/derive.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/actions/apply.ts",
      "target": "packages/engine/src/state/schema.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/actions/apply.ts",
      "target": "packages/engine/src/state/spending.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/actions/types.ts",
      "target": "packages/engine/src/state/schema.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/constants.ts",
      "target": "packages/engine/src/state/schema.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/countries.ts",
      "target": "packages/engine/src/constants.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/countries.ts",
      "target": "packages/engine/src/math.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/countries.ts",
      "target": "packages/engine/src/rng/rng.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/countries.ts",
      "target": "packages/engine/src/state/schema.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/countryDocument.ts",
      "target": "packages/engine/src/countries.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/countryDocument.ts",
      "target": "packages/engine/src/state/schema.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/index.ts",
      "target": "packages/engine/src/actions/apply.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/index.ts",
      "target": "packages/engine/src/actions/types.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/index.ts",
      "target": "packages/engine/src/constants.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/index.ts",
      "target": "packages/engine/src/countries.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/index.ts",
      "target": "packages/engine/src/countries.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/index.ts",
      "target": "packages/engine/src/countryDocument.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/index.ts",
      "target": "packages/engine/src/countryDocument.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/index.ts",
      "target": "packages/engine/src/hash.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/index.ts",
      "target": "packages/engine/src/interregnum.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/index.ts",
      "target": "packages/engine/src/pipeline/demography.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/index.ts",
      "target": "packages/engine/src/pipeline/demography.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/index.ts",
      "target": "packages/engine/src/pipeline/derive.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/index.ts",
      "target": "packages/engine/src/pipeline/institutions.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/index.ts",
      "target": "packages/engine/src/pipeline/pipeline.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/index.ts",
      "target": "packages/engine/src/pipeline/politics.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/index.ts",
      "target": "packages/engine/src/pipeline/technology.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/index.ts",
      "target": "packages/engine/src/pipeline/technology.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/index.ts",
      "target": "packages/engine/src/rng/rng.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/index.ts",
      "target": "packages/engine/src/rng/rng.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/index.ts",
      "target": "packages/engine/src/state/init.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/index.ts",
      "target": "packages/engine/src/state/schema.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/index.ts",
      "target": "packages/engine/src/state/schema.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/index.ts",
      "target": "packages/engine/src/state/validate.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/interregnum.ts",
      "target": "packages/engine/src/actions/apply.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/interregnum.ts",
      "target": "packages/engine/src/actions/types.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/interregnum.ts",
      "target": "packages/engine/src/constants.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/interregnum.ts",
      "target": "packages/engine/src/pipeline/pipeline.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/interregnum.ts",
      "target": "packages/engine/src/rng/rng.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/interregnum.ts",
      "target": "packages/engine/src/state/init.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/interregnum.ts",
      "target": "packages/engine/src/state/schema.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/math.ts",
      "target": "packages/engine/src/state/schema.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/cohorts.ts",
      "target": "packages/engine/src/constants.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/cohorts.ts",
      "target": "packages/engine/src/math.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/cohorts.ts",
      "target": "packages/engine/src/pipeline/derive.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/cohorts.ts",
      "target": "packages/engine/src/pipeline/pipeline.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/pipeline/cohorts.ts",
      "target": "packages/engine/src/state/schema.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/demography.ts",
      "target": "packages/engine/src/constants.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/demography.ts",
      "target": "packages/engine/src/math.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/demography.ts",
      "target": "packages/engine/src/pipeline/derive.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/demography.ts",
      "target": "packages/engine/src/pipeline/pipeline.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/pipeline/demography.ts",
      "target": "packages/engine/src/state/schema.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/derive.ts",
      "target": "packages/engine/src/constants.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/derive.ts",
      "target": "packages/engine/src/math.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/derive.ts",
      "target": "packages/engine/src/state/schema.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/finance.ts",
      "target": "packages/engine/src/constants.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/finance.ts",
      "target": "packages/engine/src/math.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/finance.ts",
      "target": "packages/engine/src/pipeline/derive.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/finance.ts",
      "target": "packages/engine/src/pipeline/pipeline.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/pipeline/finance.ts",
      "target": "packages/engine/src/state/schema.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/fiscal.ts",
      "target": "packages/engine/src/constants.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/fiscal.ts",
      "target": "packages/engine/src/math.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/fiscal.ts",
      "target": "packages/engine/src/pipeline/derive.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/fiscal.ts",
      "target": "packages/engine/src/pipeline/pipeline.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/pipeline/fiscal.ts",
      "target": "packages/engine/src/state/schema.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/foreignInvestment.ts",
      "target": "packages/engine/src/constants.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/foreignInvestment.ts",
      "target": "packages/engine/src/math.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/foreignInvestment.ts",
      "target": "packages/engine/src/pipeline/pipeline.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/pipeline/foreignInvestment.ts",
      "target": "packages/engine/src/state/schema.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/institutions.ts",
      "target": "packages/engine/src/constants.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/institutions.ts",
      "target": "packages/engine/src/math.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/institutions.ts",
      "target": "packages/engine/src/pipeline/derive.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/institutions.ts",
      "target": "packages/engine/src/pipeline/pipeline.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/pipeline/institutions.ts",
      "target": "packages/engine/src/state/schema.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/labor.ts",
      "target": "packages/engine/src/constants.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/labor.ts",
      "target": "packages/engine/src/math.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/labor.ts",
      "target": "packages/engine/src/pipeline/derive.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/labor.ts",
      "target": "packages/engine/src/pipeline/pipeline.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/pipeline/monetary.ts",
      "target": "packages/engine/src/constants.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/monetary.ts",
      "target": "packages/engine/src/math.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/monetary.ts",
      "target": "packages/engine/src/pipeline/pipeline.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/pipeline/pipeline.ts",
      "target": "packages/engine/src/pipeline/cohorts.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/pipeline.ts",
      "target": "packages/engine/src/pipeline/demography.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/pipeline.ts",
      "target": "packages/engine/src/pipeline/finance.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/pipeline.ts",
      "target": "packages/engine/src/pipeline/fiscal.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/pipeline.ts",
      "target": "packages/engine/src/pipeline/foreignInvestment.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/pipeline.ts",
      "target": "packages/engine/src/pipeline/institutions.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/pipeline.ts",
      "target": "packages/engine/src/pipeline/labor.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/pipeline.ts",
      "target": "packages/engine/src/pipeline/monetary.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/pipeline.ts",
      "target": "packages/engine/src/pipeline/politics.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/pipeline.ts",
      "target": "packages/engine/src/pipeline/prices.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/pipeline.ts",
      "target": "packages/engine/src/pipeline/production.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/pipeline.ts",
      "target": "packages/engine/src/pipeline/shocks.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/pipeline.ts",
      "target": "packages/engine/src/pipeline/statistics.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/pipeline.ts",
      "target": "packages/engine/src/pipeline/technology.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/pipeline.ts",
      "target": "packages/engine/src/pipeline/trade.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/pipeline.ts",
      "target": "packages/engine/src/pipeline/world.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/pipeline.ts",
      "target": "packages/engine/src/rng/rng.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/pipeline.ts",
      "target": "packages/engine/src/state/schema.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/pipeline/pipeline.ts",
      "target": "packages/engine/src/state/spending.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/politics.ts",
      "target": "packages/engine/src/constants.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/politics.ts",
      "target": "packages/engine/src/math.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/politics.ts",
      "target": "packages/engine/src/pipeline/derive.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/politics.ts",
      "target": "packages/engine/src/pipeline/pipeline.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/pipeline/politics.ts",
      "target": "packages/engine/src/state/schema.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/prices.ts",
      "target": "packages/engine/src/constants.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/prices.ts",
      "target": "packages/engine/src/math.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/prices.ts",
      "target": "packages/engine/src/pipeline/derive.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/prices.ts",
      "target": "packages/engine/src/pipeline/pipeline.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/pipeline/prices.ts",
      "target": "packages/engine/src/state/schema.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/production.ts",
      "target": "packages/engine/src/constants.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/production.ts",
      "target": "packages/engine/src/math.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/production.ts",
      "target": "packages/engine/src/pipeline/derive.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/production.ts",
      "target": "packages/engine/src/pipeline/pipeline.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/pipeline/production.ts",
      "target": "packages/engine/src/state/schema.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/shocks.ts",
      "target": "packages/engine/src/constants.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/shocks.ts",
      "target": "packages/engine/src/pipeline/pipeline.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/pipeline/shocks.ts",
      "target": "packages/engine/src/state/schema.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/pipeline/statistics.ts",
      "target": "packages/engine/src/constants.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/statistics.ts",
      "target": "packages/engine/src/pipeline/derive.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/statistics.ts",
      "target": "packages/engine/src/pipeline/pipeline.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/pipeline/statistics.ts",
      "target": "packages/engine/src/rng/rng.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/statistics.ts",
      "target": "packages/engine/src/state/schema.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/technology.ts",
      "target": "packages/engine/src/constants.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/technology.ts",
      "target": "packages/engine/src/math.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/technology.ts",
      "target": "packages/engine/src/pipeline/derive.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/technology.ts",
      "target": "packages/engine/src/pipeline/pipeline.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/pipeline/technology.ts",
      "target": "packages/engine/src/state/schema.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/trade.ts",
      "target": "packages/engine/src/constants.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/trade.ts",
      "target": "packages/engine/src/pipeline/pipeline.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/pipeline/trade.ts",
      "target": "packages/engine/src/state/schema.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/world.ts",
      "target": "packages/engine/src/constants.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/world.ts",
      "target": "packages/engine/src/math.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/world.ts",
      "target": "packages/engine/src/pipeline/pipeline.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/pipeline/world.ts",
      "target": "packages/engine/src/state/schema.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/state/init.ts",
      "target": "packages/engine/src/constants.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/state/init.ts",
      "target": "packages/engine/src/countries.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/state/init.ts",
      "target": "packages/engine/src/math.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/state/init.ts",
      "target": "packages/engine/src/pipeline/demography.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/state/init.ts",
      "target": "packages/engine/src/pipeline/institutions.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/state/init.ts",
      "target": "packages/engine/src/rng/rng.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/state/init.ts",
      "target": "packages/engine/src/state/schema.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/state/schema.ts",
      "target": "packages/engine/src/rng/rng.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/state/spending.ts",
      "target": "packages/engine/src/math.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/state/spending.ts",
      "target": "packages/engine/src/state/schema.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/state/validate.ts",
      "target": "packages/engine/src/constants.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/state/validate.ts",
      "target": "packages/engine/src/state/schema.ts",
      "typeOnly": false
    },
    {
      "source": "packages/fixtures/countries/standard.ts",
      "target": "packages/engine/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/fixtures/index.ts",
      "target": "packages/fixtures/countries/standard.ts",
      "typeOnly": false
    },
    {
      "source": "packages/fixtures/index.ts",
      "target": "packages/fixtures/scripts/scripts.ts",
      "typeOnly": false
    },
    {
      "source": "packages/fixtures/scripts/scripts.ts",
      "target": "packages/engine/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/observation/src/index.ts",
      "target": "packages/observation/src/observe.ts",
      "typeOnly": false
    },
    {
      "source": "packages/observation/src/index.ts",
      "target": "packages/observation/src/published.ts",
      "typeOnly": false
    },
    {
      "source": "packages/observation/src/observe.ts",
      "target": "packages/engine/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/observation/src/observe.ts",
      "target": "packages/observation/src/published.ts",
      "typeOnly": true
    },
    {
      "source": "packages/observation/src/published.ts",
      "target": "packages/engine/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/observation/src/published.ts",
      "target": "packages/engine/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/runner/src/batch.ts",
      "target": "packages/engine/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/runner/src/batch.ts",
      "target": "packages/runner/src/metrics.ts",
      "typeOnly": false
    },
    {
      "source": "packages/runner/src/batch.ts",
      "target": "packages/runner/src/policies.ts",
      "typeOnly": false
    },
    {
      "source": "packages/runner/src/batch.ts",
      "target": "packages/runner/src/report.ts",
      "typeOnly": false
    },
    {
      "source": "packages/runner/src/batch.ts",
      "target": "packages/runner/src/run.ts",
      "typeOnly": false
    },
    {
      "source": "packages/runner/src/debt.ts",
      "target": "packages/engine/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/runner/src/export-feedback-cli.ts",
      "target": "packages/engine/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/runner/src/export-feedback-cli.ts",
      "target": "packages/runner/src/export-feedback.ts",
      "typeOnly": false
    },
    {
      "source": "packages/runner/src/export-feedback.ts",
      "target": "packages/engine/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/runner/src/export-feedback.ts",
      "target": "packages/runner/src/run.ts",
      "typeOnly": false
    },
    {
      "source": "packages/runner/src/export-feedback.ts",
      "target": "packages/runner/src/stability.ts",
      "typeOnly": false
    },
    {
      "source": "packages/runner/src/metrics.ts",
      "target": "packages/runner/src/run.ts",
      "typeOnly": true
    },
    {
      "source": "packages/runner/src/policies.ts",
      "target": "packages/engine/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/runner/src/report.ts",
      "target": "packages/runner/src/batch.ts",
      "typeOnly": true
    },
    {
      "source": "packages/runner/src/report.ts",
      "target": "packages/runner/src/metrics.ts",
      "typeOnly": false
    },
    {
      "source": "packages/runner/src/run.ts",
      "target": "packages/engine/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/runner/src/run.ts",
      "target": "packages/runner/src/debt.ts",
      "typeOnly": false
    },
    {
      "source": "packages/runner/src/stability-cli.ts",
      "target": "packages/engine/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/runner/src/stability-cli.ts",
      "target": "packages/runner/src/batch.ts",
      "typeOnly": false
    },
    {
      "source": "packages/runner/src/stability-cli.ts",
      "target": "packages/runner/src/policies.ts",
      "typeOnly": false
    },
    {
      "source": "packages/runner/src/stability-cli.ts",
      "target": "packages/runner/src/stability-report.ts",
      "typeOnly": false
    },
    {
      "source": "packages/runner/src/stability-cli.ts",
      "target": "packages/runner/src/stability.ts",
      "typeOnly": false
    },
    {
      "source": "packages/runner/src/stability-report.ts",
      "target": "packages/runner/src/stability.ts",
      "typeOnly": true
    },
    {
      "source": "packages/runner/src/stability.ts",
      "target": "packages/engine/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/runner/src/stability.ts",
      "target": "packages/runner/src/metrics.ts",
      "typeOnly": false
    },
    {
      "source": "packages/runner/src/stability.ts",
      "target": "packages/runner/src/run.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/accounts.ts",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/accounts.ts",
      "target": "packages/ui/src/components/series.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/accounts.ts",
      "target": "packages/ui/src/shares.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/App.tsx",
      "target": "packages/engine/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/App.tsx",
      "target": "packages/ui/src/cabinetNavigation.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/App.tsx",
      "target": "packages/ui/src/components/ui/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/App.tsx",
      "target": "packages/ui/src/countryDraft.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/App.tsx",
      "target": "packages/ui/src/manual.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/App.tsx",
      "target": "packages/ui/src/panels/AccountsOverlay.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/App.tsx",
      "target": "packages/ui/src/panels/CensusOverlay.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/App.tsx",
      "target": "packages/ui/src/panels/ControlRail.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/App.tsx",
      "target": "packages/ui/src/panels/CountrySelect.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/App.tsx",
      "target": "packages/ui/src/panels/DevConsole.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/App.tsx",
      "target": "packages/ui/src/panels/DraftingRoom.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/App.tsx",
      "target": "packages/ui/src/panels/ElectionOverlay.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/App.tsx",
      "target": "packages/ui/src/panels/ElectionResultOverlay.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/App.tsx",
      "target": "packages/ui/src/panels/FinanceOverlay.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/App.tsx",
      "target": "packages/ui/src/panels/HeaderBar.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/App.tsx",
      "target": "packages/ui/src/panels/Instruments.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/App.tsx",
      "target": "packages/ui/src/panels/LedgerOverlay.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/App.tsx",
      "target": "packages/ui/src/panels/ManualOverlay.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/App.tsx",
      "target": "packages/ui/src/panels/NewsWire.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/App.tsx",
      "target": "packages/ui/src/panels/PolicyOverlay.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/App.tsx",
      "target": "packages/ui/src/panels/ReportCardOverlay.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/App.tsx",
      "target": "packages/ui/src/panels/SettingsOverlay.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/App.tsx",
      "target": "packages/ui/src/panels/StudyOverlay.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/App.tsx",
      "target": "packages/ui/src/panels/Walkthrough.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/App.tsx",
      "target": "packages/ui/src/panels/WireOverlay.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/App.tsx",
      "target": "packages/ui/src/store/gameStore.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/App.tsx",
      "target": "packages/ui/src/walkthrough.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/budgetChart.ts",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/components/AnalogGauge/AnalogGauge.tsx",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/components/AnalogGauge/AnalogGauge.tsx",
      "target": "packages/ui/src/components/labels.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/AnalogGauge/AnalogGauge.tsx",
      "target": "packages/ui/src/components/series.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/AnalogGauge/AnalogGauge.tsx",
      "target": "packages/ui/src/components/ui/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/AnalogGauge/AnalogGauge.tsx",
      "target": "packages/ui/src/components/WallTile/WallTile.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/AnalogGauge/AnalogGauge.tsx",
      "target": "packages/ui/src/domains.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/BlankPlate/BlankPlate.tsx",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/components/BlankPlate/BlankPlate.tsx",
      "target": "packages/ui/src/components/labels.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/BlankPlate/BlankPlate.tsx",
      "target": "packages/ui/src/components/WallTile/WallTile.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/BlankPlate/BlankPlate.tsx",
      "target": "packages/ui/src/maturity.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/components/CorridorPlot/CorridorPlot.tsx",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/components/CorridorPlot/CorridorPlot.tsx",
      "target": "packages/ui/src/components/ui/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/CorridorPlot/CorridorPlot.tsx",
      "target": "packages/ui/src/components/WallTile/WallTile.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/Gauge/Gauge.tsx",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/components/Gauge/Gauge.tsx",
      "target": "packages/ui/src/components/AnalogGauge/AnalogGauge.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/Gauge/Gauge.tsx",
      "target": "packages/ui/src/components/BlankPlate/BlankPlate.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/Gauge/Gauge.tsx",
      "target": "packages/ui/src/components/TerminalTicker/TerminalTicker.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/Gauge/Gauge.tsx",
      "target": "packages/ui/src/maturity.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/components/labels.ts",
      "target": "packages/engine/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/components/labels.ts",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/components/RackStrip/RackStrip.tsx",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/components/RackStrip/RackStrip.tsx",
      "target": "packages/ui/src/components/labels.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/RackStrip/RackStrip.tsx",
      "target": "packages/ui/src/components/series.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/RackStrip/RackStrip.tsx",
      "target": "packages/ui/src/components/ui/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/RackStrip/RackStrip.tsx",
      "target": "packages/ui/src/domains.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/RackStrip/RackStrip.tsx",
      "target": "packages/ui/src/maturity.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/components/RackStrip/RackStrip.tsx",
      "target": "packages/ui/src/wallPlan.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/series.ts",
      "target": "packages/engine/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/series.ts",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/components/TerminalTicker/TerminalTicker.tsx",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/components/TerminalTicker/TerminalTicker.tsx",
      "target": "packages/ui/src/components/labels.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/TerminalTicker/TerminalTicker.tsx",
      "target": "packages/ui/src/components/series.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/TerminalTicker/TerminalTicker.tsx",
      "target": "packages/ui/src/components/ui/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/TerminalTicker/TerminalTicker.tsx",
      "target": "packages/ui/src/components/WallTile/WallTile.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/TerminalTicker/TerminalTicker.tsx",
      "target": "packages/ui/src/domains.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/ui/Button/Button.tsx",
      "target": "packages/ui/src/components/ui/Tooltip/Tooltip.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/ui/DonutChart/DonutChart.tsx",
      "target": "packages/ui/src/components/ui/Tooltip/Tooltip.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/ui/DonutChart/DonutChart.tsx",
      "target": "packages/ui/src/shares.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/ui/index.ts",
      "target": "packages/ui/src/components/ui/Button/Button.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/ui/index.ts",
      "target": "packages/ui/src/components/ui/ChartFrame/ChartFrame.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/ui/index.ts",
      "target": "packages/ui/src/components/ui/DisclosureSection/DisclosureSection.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/ui/index.ts",
      "target": "packages/ui/src/components/ui/DonutChart/DonutChart.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/ui/index.ts",
      "target": "packages/ui/src/components/ui/EmptyState/EmptyState.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/ui/index.ts",
      "target": "packages/ui/src/components/ui/LineChart/LineChart.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/ui/index.ts",
      "target": "packages/ui/src/components/ui/Metric/Metric.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/ui/index.ts",
      "target": "packages/ui/src/components/ui/Modal/Modal.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/ui/index.ts",
      "target": "packages/ui/src/components/ui/OverlayLayout/OverlayLayout.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/ui/index.ts",
      "target": "packages/ui/src/components/ui/Panel/Panel.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/ui/index.ts",
      "target": "packages/ui/src/components/ui/ProgressBar/ProgressBar.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/ui/index.ts",
      "target": "packages/ui/src/components/ui/SectionBar/SectionBar.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/ui/index.ts",
      "target": "packages/ui/src/components/ui/SectionHeading/SectionHeading.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/ui/index.ts",
      "target": "packages/ui/src/components/ui/SegmentedControl/SegmentedControl.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/ui/index.ts",
      "target": "packages/ui/src/components/ui/SliderField/SliderField.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/ui/index.ts",
      "target": "packages/ui/src/components/ui/StackedAreaChart/StackedAreaChart.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/ui/index.ts",
      "target": "packages/ui/src/components/ui/TimeSeriesChart/TimeSeriesChart.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/ui/index.ts",
      "target": "packages/ui/src/components/ui/Tooltip/placement.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/ui/index.ts",
      "target": "packages/ui/src/components/ui/Tooltip/Tooltip.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/ui/index.ts",
      "target": "packages/ui/src/components/ui/useFocusTrap.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/ui/LineChart/LineChart.tsx",
      "target": "packages/ui/src/components/series.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/ui/LineChart/LineChart.tsx",
      "target": "packages/ui/src/components/ui/TimeSeriesChart/TimeSeriesChart.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/ui/Metric/Metric.tsx",
      "target": "packages/ui/src/components/ui/Tooltip/Tooltip.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/ui/Modal/Modal.tsx",
      "target": "packages/ui/src/components/ui/Button/Button.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/ui/Modal/Modal.tsx",
      "target": "packages/ui/src/components/ui/useFocusTrap.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/ui/SectionBar/SectionBar.tsx",
      "target": "packages/ui/src/components/ui/Tooltip/Tooltip.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/ui/SegmentedControl/SegmentedControl.tsx",
      "target": "packages/ui/src/components/ui/Tooltip/Tooltip.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/ui/SliderField/SliderField.tsx",
      "target": "packages/ui/src/components/ui/Tooltip/Tooltip.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/ui/StackedAreaChart/StackedAreaChart.tsx",
      "target": "packages/ui/src/components/ui/Tooltip/Tooltip.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/ui/StackedAreaChart/StackedAreaChart.tsx",
      "target": "packages/ui/src/shares.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/ui/TimeSeriesChart/TimeSeriesChart.tsx",
      "target": "packages/ui/src/plot.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/ui/Tooltip/Tooltip.tsx",
      "target": "packages/ui/src/components/ui/Tooltip/placement.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/components/ui/Tooltip/Tooltip.tsx",
      "target": "packages/ui/src/components/ui/Tooltip/placement.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/components/WallTile/WallTile.tsx",
      "target": "packages/ui/src/components/ui/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/countryDraft.ts",
      "target": "packages/engine/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/countryDraft.ts",
      "target": "packages/ui/src/components/labels.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/dev/ComponentGallery.tsx",
      "target": "packages/ui/src/components/AnalogGauge/AnalogGauge.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/dev/ComponentGallery.tsx",
      "target": "packages/ui/src/components/BlankPlate/BlankPlate.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/dev/ComponentGallery.tsx",
      "target": "packages/ui/src/components/labels.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/dev/ComponentGallery.tsx",
      "target": "packages/ui/src/components/TerminalTicker/TerminalTicker.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/dev/ComponentGallery.tsx",
      "target": "packages/ui/src/components/ui/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/dev/ComponentGallery.tsx",
      "target": "packages/ui/src/dev/galleryFixtures.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/dev/ComponentGallery.tsx",
      "target": "packages/ui/src/shares.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/dev/galleryFixtures.ts",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/devScenario.ts",
      "target": "packages/engine/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/domains.ts",
      "target": "packages/engine/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/domains.ts",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/gameRules.ts",
      "target": "packages/engine/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/gameRules.ts",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/incidence.ts",
      "target": "packages/engine/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/incidence.ts",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/levers.ts",
      "target": "packages/engine/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/levers.ts",
      "target": "packages/ui/src/cabinetNavigation.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/levers.ts",
      "target": "packages/ui/src/components/labels.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/main.tsx",
      "target": "packages/ui/src/App.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/main.tsx",
      "target": "packages/ui/src/dev/ComponentGallery.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/manual.ts",
      "target": "packages/engine/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/manual.ts",
      "target": "packages/observation/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/manual.ts",
      "target": "packages/ui/src/components/labels.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/manual.ts",
      "target": "packages/ui/src/gameRules.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/manual.ts",
      "target": "packages/ui/src/levers.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/manual.ts",
      "target": "packages/ui/src/maturity.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/manual.ts",
      "target": "packages/ui/src/wallPlan.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/maturity.ts",
      "target": "packages/engine/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/maturity.ts",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/maturity.ts",
      "target": "packages/observation/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/AccountsOverlay.tsx",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/panels/AccountsOverlay.tsx",
      "target": "packages/ui/src/accounts.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/AccountsOverlay.tsx",
      "target": "packages/ui/src/components/series.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/AccountsOverlay.tsx",
      "target": "packages/ui/src/components/ui/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/CensusOverlay.tsx",
      "target": "packages/engine/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/CensusOverlay.tsx",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/panels/CensusOverlay.tsx",
      "target": "packages/ui/src/components/ui/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/ControlRail.tsx",
      "target": "packages/engine/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/ControlRail.tsx",
      "target": "packages/observation/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/ControlRail.tsx",
      "target": "packages/ui/src/cabinetNavigation.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/ControlRail.tsx",
      "target": "packages/ui/src/components/labels.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/ControlRail.tsx",
      "target": "packages/ui/src/components/ui/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/ControlRail.tsx",
      "target": "packages/ui/src/gameRules.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/ControlRail.tsx",
      "target": "packages/ui/src/incidence.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/ControlRail.tsx",
      "target": "packages/ui/src/levers.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/ControlRail.tsx",
      "target": "packages/ui/src/maturity.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/ControlRail.tsx",
      "target": "packages/ui/src/spendingRules.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/ControlRail.tsx",
      "target": "packages/ui/src/store/gameStore.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/CountrySelect.tsx",
      "target": "packages/engine/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/CountrySelect.tsx",
      "target": "packages/ui/src/components/ui/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/CountrySelect.tsx",
      "target": "packages/ui/src/countryDraft.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/CountrySelect.tsx",
      "target": "packages/ui/src/gameRules.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/DevConsole.tsx",
      "target": "packages/engine/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/DevConsole.tsx",
      "target": "packages/ui/src/components/ui/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/DevConsole.tsx",
      "target": "packages/ui/src/devScenario.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/DevConsole.tsx",
      "target": "packages/ui/src/store/gameStore.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/DevConsole.tsx",
      "target": "packages/ui/src/worker/protocol.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/panels/DraftingRoom.tsx",
      "target": "packages/ui/src/components/ui/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/DraftingRoom.tsx",
      "target": "packages/ui/src/countryDraft.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/DraftingRoom.tsx",
      "target": "packages/ui/src/panels/StudyReport.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/DraftingRoom.tsx",
      "target": "packages/ui/src/store/gameStore.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/ElectionOverlay.tsx",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/panels/ElectionOverlay.tsx",
      "target": "packages/ui/src/components/labels.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/ElectionOverlay.tsx",
      "target": "packages/ui/src/components/ui/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/ElectionOverlay.tsx",
      "target": "packages/ui/src/store/gameStore.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/ElectionResultOverlay.tsx",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/panels/ElectionResultOverlay.tsx",
      "target": "packages/ui/src/components/labels.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/ElectionResultOverlay.tsx",
      "target": "packages/ui/src/components/ui/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/FinanceOverlay.tsx",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/panels/FinanceOverlay.tsx",
      "target": "packages/ui/src/components/ui/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/FinanceOverlay.tsx",
      "target": "packages/ui/src/components/ui/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/panels/HeaderBar.tsx",
      "target": "packages/engine/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/HeaderBar.tsx",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/panels/HeaderBar.tsx",
      "target": "packages/ui/src/components/ui/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/HeaderBar.tsx",
      "target": "packages/ui/src/gameRules.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/Instruments.tsx",
      "target": "packages/observation/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/Instruments.tsx",
      "target": "packages/ui/src/components/CorridorPlot/CorridorPlot.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/Instruments.tsx",
      "target": "packages/ui/src/components/Gauge/Gauge.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/Instruments.tsx",
      "target": "packages/ui/src/components/RackStrip/RackStrip.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/Instruments.tsx",
      "target": "packages/ui/src/components/ui/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/Instruments.tsx",
      "target": "packages/ui/src/maturity.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/Instruments.tsx",
      "target": "packages/ui/src/panels/LedgerPanel.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/Instruments.tsx",
      "target": "packages/ui/src/store/gameStore.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/Instruments.tsx",
      "target": "packages/ui/src/wallPlan.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/LedgerOverlay.tsx",
      "target": "packages/observation/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/LedgerOverlay.tsx",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/panels/LedgerOverlay.tsx",
      "target": "packages/ui/src/budgetChart.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/LedgerOverlay.tsx",
      "target": "packages/ui/src/components/ui/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/LedgerOverlay.tsx",
      "target": "packages/ui/src/shares.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/LedgerPanel.tsx",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/panels/LedgerPanel.tsx",
      "target": "packages/ui/src/components/ui/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/LedgerPanel.tsx",
      "target": "packages/ui/src/components/WallTile/WallTile.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/ManualOverlay.tsx",
      "target": "packages/ui/src/components/ui/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/ManualOverlay.tsx",
      "target": "packages/ui/src/manual.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/NewsWire.tsx",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/panels/NewsWire.tsx",
      "target": "packages/ui/src/components/ui/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/PolicyOverlay.tsx",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/panels/PolicyOverlay.tsx",
      "target": "packages/ui/src/components/ui/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/PolicyOverlay.tsx",
      "target": "packages/ui/src/policyRecord.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/PolicyOverlay.tsx",
      "target": "packages/ui/src/shares.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/ReportCardOverlay.tsx",
      "target": "packages/engine/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/ReportCardOverlay.tsx",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/panels/ReportCardOverlay.tsx",
      "target": "packages/ui/src/components/ui/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/SettingsOverlay.tsx",
      "target": "packages/engine/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/panels/SettingsOverlay.tsx",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/panels/SettingsOverlay.tsx",
      "target": "packages/ui/src/components/ui/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/SettingsOverlay.tsx",
      "target": "packages/ui/src/store/gameStore.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/StudyOverlay.tsx",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/panels/StudyOverlay.tsx",
      "target": "packages/ui/src/components/series.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/StudyOverlay.tsx",
      "target": "packages/ui/src/components/ui/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/StudyReport.tsx",
      "target": "packages/ui/src/components/ui/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/StudyReport.tsx",
      "target": "packages/ui/src/countryDraft.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/panels/StudyReport.tsx",
      "target": "packages/ui/src/countryDraft.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/StudyReport.tsx",
      "target": "packages/ui/src/devScenario.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/StudyReport.tsx",
      "target": "packages/ui/src/worker/trial.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/panels/Walkthrough.tsx",
      "target": "packages/ui/src/components/ui/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/Walkthrough.tsx",
      "target": "packages/ui/src/walkthrough.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/WireOverlay.tsx",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/panels/WireOverlay.tsx",
      "target": "packages/ui/src/components/ui/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/plot.ts",
      "target": "packages/ui/src/shares.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/policyRecord.ts",
      "target": "packages/engine/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/policyRecord.ts",
      "target": "packages/observation/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/saveFile.ts",
      "target": "packages/engine/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/spendingRules.ts",
      "target": "packages/engine/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/spendingRules.ts",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/store/gameStore.ts",
      "target": "packages/engine/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/store/gameStore.ts",
      "target": "packages/engine/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/store/gameStore.ts",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/store/gameStore.ts",
      "target": "packages/observation/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/store/gameStore.ts",
      "target": "packages/ui/src/countryDraft.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/store/gameStore.ts",
      "target": "packages/ui/src/devScenario.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/store/gameStore.ts",
      "target": "packages/ui/src/saveFile.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/store/gameStore.ts",
      "target": "packages/ui/src/store/db.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/store/gameStore.ts",
      "target": "packages/ui/src/wallPlan.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/store/gameStore.ts",
      "target": "packages/ui/src/worker/protocol.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/store/gameStore.ts",
      "target": "packages/ui/src/worker/trial.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/wallPlan.ts",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/worker/protocol.ts",
      "target": "packages/engine/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/worker/protocol.ts",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/worker/protocol.ts",
      "target": "packages/ui/src/devScenario.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/worker/protocol.ts",
      "target": "packages/ui/src/worker/trial.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/worker/sim.worker.ts",
      "target": "packages/engine/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/worker/sim.worker.ts",
      "target": "packages/observation/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/worker/sim.worker.ts",
      "target": "packages/ui/src/devScenario.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/worker/sim.worker.ts",
      "target": "packages/ui/src/saveFile.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/worker/sim.worker.ts",
      "target": "packages/ui/src/worker/protocol.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/worker/sim.worker.ts",
      "target": "packages/ui/src/worker/trial.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/worker/trial.ts",
      "target": "packages/engine/src/index.ts",
      "typeOnly": false
    }
  ],
  "packageEdges": [
    {
      "source": "fixtures",
      "target": "engine",
      "count": 2,
      "typeOnlyCount": 1
    },
    {
      "source": "observation",
      "target": "engine",
      "count": 3,
      "typeOnlyCount": 1
    },
    {
      "source": "runner",
      "target": "engine",
      "count": 8,
      "typeOnlyCount": 1
    },
    {
      "source": "ui",
      "target": "engine",
      "count": 26,
      "typeOnlyCount": 6
    },
    {
      "source": "ui",
      "target": "observation",
      "count": 41,
      "typeOnlyCount": 33
    }
  ],
  "pipeline": [
    {
      "order": 1,
      "name": "shocks",
      "description": "the crisis clock: ruptures land before anyone works — schema v4",
      "moduleId": "packages/engine/src/pipeline/shocks.ts",
      "summary": "Step 0 — shocks. The crisis clock. Rare exogenous ruptures land here, at the head of the tick, so every later step lives in the shocked world: an oil crisis is a jump in the world energy price (imports dear, exports tempting — the tâtonnement and the I/O table do the rest, thr…",
      "stateAreas": [
        "external",
        "meta",
        "sectors",
        "stats"
      ],
      "dependencies": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "exports": [
        {
          "name": "shocks",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/shocks.ts",
          "line": 15
        }
      ],
      "path": "packages/engine/src/pipeline/shocks.ts",
      "line": 15
    },
    {
      "order": 2,
      "name": "demography",
      "description": "the pyramid ages; cohort sizes are derived from it — schema v6",
      "moduleId": "packages/engine/src/pipeline/demography.ts",
      "summary": "Step 1.5 — demography. The century IS the transition window: a young 1946 pyramid ages quarter by quarter under endogenous fertility (falls with income, cities, surviving children, and a slow norms drift), income-driven mortality, and migration as a pressure valve. Cohort size…",
      "stateAreas": [
        "cohorts",
        "demography",
        "flows",
        "gov",
        "market",
        "meta"
      ],
      "dependencies": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/math.ts",
        "packages/engine/src/pipeline/derive.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "exports": [
        {
          "name": "vitalRates",
          "kind": "function",
          "path": "packages/engine/src/pipeline/demography.ts",
          "line": 63
        },
        {
          "name": "classSizesFrom",
          "kind": "function",
          "path": "packages/engine/src/pipeline/demography.ts",
          "line": 82
        },
        {
          "name": "MigrationFlow",
          "kind": "interface",
          "path": "packages/engine/src/pipeline/demography.ts",
          "line": 96
        },
        {
          "name": "migrationFlow",
          "kind": "function",
          "path": "packages/engine/src/pipeline/demography.ts",
          "line": 118
        },
        {
          "name": "demography",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/demography.ts",
          "line": 144
        }
      ],
      "path": "packages/engine/src/pipeline/demography.ts",
      "line": 144
    },
    {
      "order": 3,
      "name": "technology",
      "description": "the frontier advances; attainment chases it — schema v7",
      "moduleId": "packages/engine/src/pipeline/technology.ts",
      "summary": "Step 2.5 — technology. Two trees: the global frontier advances on a roughly historical schedule whether you exist or not; what you have ATTAINED chases each sector's slice of it at a speed set by absorptive capacity — schools first, openness second. Poor countries close the ga…",
      "stateAreas": [
        "meta",
        "sectors",
        "stats",
        "tech"
      ],
      "dependencies": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/math.ts",
        "packages/engine/src/pipeline/derive.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "exports": [
        {
          "name": "frontierGrowthAt",
          "kind": "function",
          "path": "packages/engine/src/pipeline/technology.ts",
          "line": 38
        },
        {
          "name": "absorptiveCapacity",
          "kind": "function",
          "path": "packages/engine/src/pipeline/technology.ts",
          "line": 57
        },
        {
          "name": "researchIntensity",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/technology.ts",
          "line": 72
        },
        {
          "name": "ResearchAllocation",
          "kind": "interface",
          "path": "packages/engine/src/pipeline/technology.ts",
          "line": 74
        },
        {
          "name": "researchAllocation",
          "kind": "function",
          "path": "packages/engine/src/pipeline/technology.ts",
          "line": 104
        },
        {
          "name": "breakthroughHazard",
          "kind": "function",
          "path": "packages/engine/src/pipeline/technology.ts",
          "line": 162
        },
        {
          "name": "technology",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/technology.ts",
          "line": 181
        }
      ],
      "path": "packages/engine/src/pipeline/technology.ts",
      "line": 181
    },
    {
      "order": 4,
      "name": "world",
      "description": "partner cycles set export demand and world prices — schema v9",
      "moduleId": "packages/engine/src/pipeline/world.ts",
      "summary": "Step 2.5 — the rest of world. Four abstract trading partners, each an economy with its own business cycle, advance one quarter. Their strength sets two things the domestic economy then lives inside: • how much of your exports they buy (a partner in recession buys less); • the…",
      "stateAreas": [
        "external",
        "meta",
        "stats"
      ],
      "dependencies": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/math.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "exports": [
        {
          "name": "world",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/world.ts",
          "line": 63
        }
      ],
      "path": "packages/engine/src/pipeline/world.ts",
      "line": 63
    },
    {
      "order": 5,
      "name": "finance",
      "description": "credit, asset prices, banking crises — the fragility clock — schema v10",
      "moduleId": "packages/engine/src/pipeline/finance.ts",
      "summary": "Step 3.5 — the financial sector. The credit cycle is the amplifier and the crisis clock in one. Each quarter: • banks set a credit target from the real rate, collateral (asset prices), and animal spirits — capped by their capital; credit adjusts toward it; • asset prices (a To…",
      "stateAreas": [
        "external",
        "finance",
        "flows",
        "gov",
        "ledger",
        "meta",
        "sectors",
        "stats"
      ],
      "dependencies": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/math.ts",
        "packages/engine/src/pipeline/derive.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "exports": [
        {
          "name": "finance",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/finance.ts",
          "line": 60
        }
      ],
      "path": "packages/engine/src/pipeline/finance.ts",
      "line": 60
    },
    {
      "order": 6,
      "name": "foreignInvestment",
      "description": "inward productive capital and its foreign ownership — schema v23",
      "moduleId": "packages/engine/src/pipeline/foreignInvestment.ts",
      "summary": "Step 3.75 — foreign direct investment. Direct investors build productive capital rather than buying a liquid claim, so the flow is sticky and enters the ordinary investment order book. Attraction is systemic: small-country scale, trade access, catch-up room, administration, re…",
      "stateAreas": [
        "demography",
        "external",
        "finance",
        "flows",
        "gov",
        "ledger",
        "market",
        "params",
        "sectors",
        "tech"
      ],
      "dependencies": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/math.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "exports": [
        {
          "name": "foreignInvestment",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/foreignInvestment.ts",
          "line": 33
        }
      ],
      "path": "packages/engine/src/pipeline/foreignInvestment.ts",
      "line": 33
    },
    {
      "order": 7,
      "name": "production",
      "description": "output given prices, capital, labor, I/O table",
      "moduleId": "packages/engine/src/pipeline/production.ts",
      "summary": "Step 1 — production. Builds this tick's demand from last tick's incomes and prices, solves the Leontief system for required gross output, and produces up to capacity. Excess demand is recorded for the price step; nothing here is a hand-authored effect arrow — a fuel tax reache…",
      "stateAreas": [
        "cohorts",
        "external",
        "finance",
        "flows",
        "gov",
        "institutions",
        "io",
        "ledger",
        "market",
        "params",
        "sectors"
      ],
      "dependencies": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/math.ts",
        "packages/engine/src/pipeline/derive.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "exports": [
        {
          "name": "production",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/production.ts",
          "line": 43
        }
      ],
      "path": "packages/engine/src/pipeline/production.ts",
      "line": 43
    },
    {
      "order": 8,
      "name": "trade",
      "description": "books external flows, reserves, exchange rate",
      "moduleId": "packages/engine/src/pipeline/trade.ts",
      "summary": "Step 4 — trade. Books the external flows production decided on, moves reserves, and depreciates the currency when they run out. World prices and export demand are set upstream by the `world` step; this step just settles the balance of payments at them.",
      "stateAreas": [
        "external",
        "flows",
        "market"
      ],
      "dependencies": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "exports": [
        {
          "name": "trade",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/trade.ts",
          "line": 12
        }
      ],
      "path": "packages/engine/src/pipeline/trade.ts",
      "line": 12
    },
    {
      "order": 9,
      "name": "fiscal",
      "description": "capacity-gated collection; spending with leakage; the press",
      "moduleId": "packages/engine/src/pipeline/fiscal.ts",
      "summary": "Step 3 — fiscal. Tax collection is capacity-gated: the state taxes what it can see, not true GDP. Spending executes with leakage. Deficits the bond market won't absorb are monetized — the printing press is not a button the player pushes, it's what happens when the arithmetic f…",
      "stateAreas": [
        "flows",
        "gov",
        "institutions",
        "io",
        "ledger",
        "market",
        "sectors"
      ],
      "dependencies": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/math.ts",
        "packages/engine/src/pipeline/derive.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "exports": [
        {
          "name": "fiscal",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/fiscal.ts",
          "line": 27
        }
      ],
      "path": "packages/engine/src/pipeline/fiscal.ts",
      "line": 27
    },
    {
      "order": 10,
      "name": "monetary",
      "description": "expectations adapt; printing feeds them",
      "moduleId": "packages/engine/src/pipeline/monetary.ts",
      "summary": "Step 4 — monetary. Inflation expectations adapt toward realized inflation, and the printing press feeds them directly: money-financed deficits raise expected inflation before they even hit prices. Rate transmission happens in production (investment reads the real rate).",
      "stateAreas": [
        "flows",
        "ledger"
      ],
      "dependencies": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/math.ts"
      ],
      "exports": [
        {
          "name": "monetary",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/monetary.ts",
          "line": 12
        }
      ],
      "path": "packages/engine/src/pipeline/monetary.ts",
      "line": 12
    },
    {
      "order": 11,
      "name": "prices",
      "description": "tâtonnement with cost anchor",
      "moduleId": "packages/engine/src/pipeline/prices.ts",
      "summary": "Step 5 — prices. Tâtonnement with a cost anchor: excess demand pulls prices up, excess supply down, and prices also drift toward unit cost × markup — that second term is how a fuel tax works its way from the refinery through the trucking industry into bread.",
      "stateAreas": [
        "flows",
        "gov",
        "io",
        "ledger",
        "market",
        "sectors"
      ],
      "dependencies": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/math.ts",
        "packages/engine/src/pipeline/derive.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "exports": [
        {
          "name": "prices",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/prices.ts",
          "line": 14
        }
      ],
      "path": "packages/engine/src/pipeline/prices.ts",
      "line": 14
    },
    {
      "order": 12,
      "name": "labor",
      "description": "employment, wages, capital accumulation",
      "moduleId": "packages/engine/src/pipeline/labor.ts",
      "summary": "Step 6 — labor & capital. Employment chases demanded output with friction; wages respond to labor-market tightness plus inflation pass-through. Investment goods bought this tick become capital, allocated where utilization is pressing against the ceiling.",
      "stateAreas": [
        "external",
        "flows",
        "institutions",
        "market",
        "sectors",
        "tech"
      ],
      "dependencies": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/math.ts",
        "packages/engine/src/pipeline/derive.ts"
      ],
      "exports": [
        {
          "name": "labor",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/labor.ts",
          "line": 26
        }
      ],
      "path": "packages/engine/src/pipeline/labor.ts",
      "line": 26
    },
    {
      "order": 13,
      "name": "cohorts",
      "description": "incomes, savings, approval drifts toward experienced truth",
      "moduleId": "packages/engine/src/pipeline/cohorts.ts",
      "summary": "Step 7 — cohorts. Incomes land, savings absorb the difference, and approval drifts toward *experienced* conditions: real income growth (loss-averse), own-basket inflation, joblessness, and queues for goods that never arrived. Whatever the statistics office printed, the bread l…",
      "stateAreas": [
        "cohorts",
        "demography",
        "flows",
        "gov",
        "ledger",
        "market",
        "meta",
        "politics",
        "score",
        "sectors"
      ],
      "dependencies": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/math.ts",
        "packages/engine/src/pipeline/derive.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "exports": [
        {
          "name": "cohorts",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/cohorts.ts",
          "line": 29
        }
      ],
      "path": "packages/engine/src/pipeline/cohorts.ts",
      "line": 29
    },
    {
      "order": 14,
      "name": "institutions",
      "description": "societal power, the veto players, revolutionary pressure — schema v11",
      "moduleId": "packages/engine/src/pipeline/institutions.ts",
      "summary": "Step 8 — institutions and the Narrow Corridor. The half of the game that isn't the economy.",
      "stateAreas": [
        "cohorts",
        "institutions",
        "meta",
        "params",
        "politics",
        "score",
        "stats"
      ],
      "dependencies": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/math.ts",
        "packages/engine/src/pipeline/derive.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "exports": [
        {
          "name": "franchiseOf",
          "kind": "function",
          "path": "packages/engine/src/pipeline/institutions.ts",
          "line": 106
        },
        {
          "name": "initialInstitutions",
          "kind": "function",
          "path": "packages/engine/src/pipeline/institutions.ts",
          "line": 291
        },
        {
          "name": "institutions",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/institutions.ts",
          "line": 329
        }
      ],
      "path": "packages/engine/src/pipeline/institutions.ts",
      "line": 329
    },
    {
      "order": 15,
      "name": "statistics",
      "description": "the office measures, publishes, revises — schema v3",
      "moduleId": "packages/engine/src/pipeline/statistics.ts",
      "summary": "Step 8 — statistics. The office measures the quarter, files the worksheet, and releases whatever falls due: first prints after a lag, revisions at +2 and +5 quarters. Noise draws come from `obs:*` substreams keyed by (indicator, measured quarter, revision) — orthogonal to the…",
      "stateAreas": [
        "meta",
        "stats"
      ],
      "dependencies": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/pipeline/derive.ts",
        "packages/engine/src/rng/rng.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "exports": [
        {
          "name": "INDICATOR_SPECS",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/statistics.ts",
          "line": 51
        },
        {
          "name": "statistics",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/statistics.ts",
          "line": 537
        }
      ],
      "path": "packages/engine/src/pipeline/statistics.ts",
      "line": 537
    },
    {
      "order": 16,
      "name": "politics",
      "description": "PC accrual from PUBLISHED numbers, elections, revolt and coup",
      "moduleId": "packages/engine/src/pipeline/politics.ts",
      "summary": "Step 10 — politics. Political capital accrues from enfranchisement-weighted approval; elections every 16 quarters are the forcing function. Salience (ADR-0003): the growth term reads the statistics office's CURRENT headline — credit is banked when the number prints, and a late…",
      "stateAreas": [
        "institutions",
        "meta",
        "politics",
        "stats"
      ],
      "dependencies": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/math.ts",
        "packages/engine/src/pipeline/derive.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "exports": [
        {
          "name": "electionThreshold",
          "kind": "function",
          "path": "packages/engine/src/pipeline/politics.ts",
          "line": 70
        },
        {
          "name": "politics",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/politics.ts",
          "line": 74
        }
      ],
      "path": "packages/engine/src/pipeline/politics.ts",
      "line": 74
    }
  ],
  "seams": [
    {
      "id": "ordered-fold",
      "title": "One ordered, versioned tick",
      "summary": "Every subsystem receives the state left by the prior step. Reordering the fold changes the model and the save schema.",
      "locations": [
        {
          "path": "packages/engine/src/pipeline/pipeline.ts",
          "line": 35
        }
      ]
    },
    {
      "id": "fog-before-politics",
      "title": "The fog is causal",
      "summary": "Statistics creates published prints inside the engine immediately before politics, so political outcomes react to headlines rather than hidden truth.",
      "locations": [
        {
          "path": "packages/engine/src/pipeline/statistics.ts",
          "line": 538
        },
        {
          "path": "packages/engine/src/pipeline/politics.ts",
          "line": 75
        },
        {
          "path": "packages/observation/src/observe.ts",
          "line": 155
        }
      ]
    },
    {
      "id": "worker-boundary",
      "title": "True state stops at the worker",
      "summary": "The worker owns the engine state and posts the published projection. UI components cannot reach the simulation heap.",
      "locations": [
        {
          "path": "packages/ui/src/worker/sim.worker.ts",
          "line": 35
        },
        {
          "path": "packages/ui/src/worker/protocol.ts",
          "line": 1
        }
      ]
    },
    {
      "id": "action-price",
      "title": "Quote and charge share one price",
      "summary": "Political cost is calculated in one engine function and reused both when previewing a decision and when applying it.",
      "locations": [
        {
          "path": "packages/engine/src/actions/apply.ts",
          "line": 371
        },
        {
          "path": "packages/observation/src/observe.ts",
          "line": 11
        }
      ]
    },
    {
      "id": "rng-substreams",
      "title": "Randomness is isolated by subsystem",
      "summary": "Each step receives a seed, step-name, and tick substream, so a new draw in one subsystem does not shift another.",
      "locations": [
        {
          "path": "packages/engine/src/pipeline/pipeline.ts",
          "line": 9
        },
        {
          "path": "packages/engine/src/rng/rng.ts",
          "line": 77
        }
      ]
    }
  ]
} satisfies ArchitectureSnapshot
