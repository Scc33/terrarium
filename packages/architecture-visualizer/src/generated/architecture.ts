import type { ArchitectureSnapshot } from '../model'

// Generated from the repository by scripts/generate.ts. Do not edit by hand.
export const architecture = {
  "version": 1,
  "revision": "c23bbbb",
  "repoRoot": "../..",
  "packages": [
    {
      "id": "engine",
      "name": "@terrarium/engine",
      "description": "Pure deterministic simulation, action legality, state, and the ordered quarterly tick.",
      "moduleCount": 44,
      "lines": 16145
    },
    {
      "id": "fixtures",
      "name": "@terrarium/fixtures",
      "description": "Shared country recipes and named action scripts used by tests and the runner.",
      "moduleCount": 3,
      "lines": 60
    },
    {
      "id": "observation",
      "name": "@terrarium/observation",
      "description": "Presentation-only projection from engine prints to the player-visible contract.",
      "moduleCount": 4,
      "lines": 892
    },
    {
      "id": "runner",
      "name": "@terrarium/runner",
      "description": "Headless execution and balance sweeps over the same public engine API.",
      "moduleCount": 14,
      "lines": 2863
    },
    {
      "id": "ui",
      "name": "@terrarium/ui",
      "description": "War-room interface; the worker is its only engine host and components consume published state.",
      "moduleCount": 112,
      "lines": 19176
    }
  ],
  "modules": [
    {
      "id": "packages/engine/src/actions/apply.ts",
      "label": "apply",
      "packageId": "engine",
      "category": "Actions",
      "summary": "Action application. Validates legality (dial bounds, PC affordability) and rejects loudly — an illegal action in a replay means a bug or a version mismatch, never a silent skip (§5).",
      "lines": 754,
      "exports": [
        {
          "name": "IllegalActionError",
          "kind": "class",
          "path": "packages/engine/src/actions/apply.ts",
          "line": 100
        },
        {
          "name": "reformWindowOpen",
          "kind": "function",
          "path": "packages/engine/src/actions/apply.ts",
          "line": 104
        },
        {
          "name": "vetoMultiplier",
          "kind": "function",
          "path": "packages/engine/src/actions/apply.ts",
          "line": 122
        },
        {
          "name": "politicalCostOfAction",
          "kind": "function",
          "path": "packages/engine/src/actions/apply.ts",
          "line": 475
        },
        {
          "name": "applyAction",
          "kind": "function",
          "path": "packages/engine/src/actions/apply.ts",
          "line": 572
        }
      ],
      "imports": [
        "packages/engine/src/actions/types.ts",
        "packages/engine/src/constants.ts",
        "packages/engine/src/events/file.ts",
        "packages/engine/src/events/ids.ts",
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
      "lines": 53,
      "exports": [
        {
          "name": "DialPath",
          "kind": "type",
          "path": "packages/engine/src/actions/types.ts",
          "line": 14
        },
        {
          "name": "Action",
          "kind": "type",
          "path": "packages/engine/src/actions/types.ts",
          "line": 31
        },
        {
          "name": "TurnActions",
          "kind": "interface",
          "path": "packages/engine/src/actions/types.ts",
          "line": 47
        },
        {
          "name": "ActionLog",
          "kind": "type",
          "path": "packages/engine/src/actions/types.ts",
          "line": 52
        }
      ],
      "imports": [
        "packages/engine/src/state/schema.ts"
      ],
      "importedBy": [
        "packages/engine/src/actions/apply.ts",
        "packages/engine/src/constants.ts",
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
      "lines": 1997,
      "exports": [
        {
          "name": "CAPITAL_ELASTICITY",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 22
        },
        {
          "name": "LABOR_ELASTICITY",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 23
        },
        {
          "name": "DEPRECIATION_Q",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 24
        },
        {
          "name": "UTILIZATION_AT_INIT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 25
        },
        {
          "name": "NORMAL_UTILIZATION",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 28
        },
        {
          "name": "GOV_PROCUREMENT_MANUF_SHARE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 32
        },
        {
          "name": "GOV_PROCUREMENT_SERVICES_SHARE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 33
        },
        {
          "name": "GOV_RESEARCH_MANUF_SHARE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 35
        },
        {
          "name": "GOV_RESEARCH_SERVICES_SHARE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 36
        },
        {
          "name": "INVESTMENT_DEMAND_MANUF_SHARE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 39
        },
        {
          "name": "INVESTMENT_DEMAND_SERVICES_SHARE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 40
        },
        {
          "name": "NOMINAL_GDP_FLOOR_SHARE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 43
        },
        {
          "name": "INVESTMENT_ALLOCATION_NEUTRAL_UTILIZATION",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 48
        },
        {
          "name": "INVESTMENT_ALLOCATION_PRESSURE_FLOOR",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 51
        },
        {
          "name": "IO_COEFF",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 55
        },
        {
          "name": "TATONNEMENT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 64
        },
        {
          "name": "SLACK_GAIN_RATIO",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 71
        },
        {
          "name": "UNIT_COST_FLOOR",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 74
        },
        {
          "name": "PRICE_DRIFT_EXPECTATIONS_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 77
        },
        {
          "name": "PRICE_NOISE_SD",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 79
        },
        {
          "name": "PRICE_FLOOR",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 81
        },
        {
          "name": "EMPLOYMENT_ADJUST",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 84
        },
        {
          "name": "HIRING_DEMAND_CAP",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 88
        },
        {
          "name": "EMPLOYMENT_CEILING",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 100
        },
        {
          "name": "OVERQUALIFIED_HIRING_PREFERENCE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 102
        },
        {
          "name": "WAGE_DEMAND_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 103
        },
        {
          "name": "WAGE_INFLATION_PASSTHROUGH",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 104
        },
        {
          "name": "NATURAL_UNEMPLOYMENT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 107
        },
        {
          "name": "WAGE_SLACK_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 108
        },
        {
          "name": "TFP_SLACK_GATE_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 112
        },
        {
          "name": "WAGE_MAX_UP",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 115
        },
        {
          "name": "WAGE_MAX_DOWN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 116
        },
        {
          "name": "WAGE_ABSOLUTE_FLOOR",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 119
        },
        {
          "name": "LABOR_SHARE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 120
        },
        {
          "name": "PARTICIPATION",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 122
        },
        {
          "name": "LABOR_SOURCE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 142
        },
        {
          "name": "SKILL_RANK",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 169
        },
        {
          "name": "MPC",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 178
        },
        {
          "name": "SAVINGS_DRAWDOWN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 185
        },
        {
          "name": "CONSUMPTION_CURRENT_INCOME_WEIGHT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 189
        },
        {
          "name": "CONSUMPTION_HABIT_WEIGHT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 190
        },
        {
          "name": "CONSUMPTION_WEIGHTS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 194
        },
        {
          "name": "ENGEL_ELASTICITY",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 231
        },
        {
          "name": "HOUSEHOLD_SUBSTITUTION",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 257
        },
        {
          "name": "ENGEL_INCOME_RATIO_MIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 261
        },
        {
          "name": "ENGEL_INCOME_RATIO_MAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 262
        },
        {
          "name": "CONSUMPTION_WEIGHT_FLOOR",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 267
        },
        {
          "name": "PROFIT_SHARE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 270
        },
        {
          "name": "BOND_HOLDING",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 279
        },
        {
          "name": "TRANSFER_SHARE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 288
        },
        {
          "name": "HABITUAL_INCOME_EMA_PERSISTENCE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 300
        },
        {
          "name": "HABITUAL_INCOME_EMA_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 301
        },
        {
          "name": "POVERTY_LINE_REAL",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 307
        },
        {
          "name": "taxEfficiency",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 311
        },
        {
          "name": "adminEffectiveness",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 313
        },
        {
          "name": "TARIFF_EFF_BASE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 316
        },
        {
          "name": "TARIFF_EFF_CAPACITY_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 317
        },
        {
          "name": "FUEL_EFF_BASE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 320
        },
        {
          "name": "FUEL_EFF_CAPACITY_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 321
        },
        {
          "name": "BOND_MARKET_DEPTH",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 323
        },
        {
          "name": "DEBT_CEILING",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 325
        },
        {
          "name": "DEBT_RISK_PREMIUM_AT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 327
        },
        {
          "name": "RISK_PREMIUM_SLOPE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 328
        },
        {
          "name": "SOVEREIGN_PRIVATE_PREMIUM_SHARE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 330
        },
        {
          "name": "FUND_YIELD",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 346
        },
        {
          "name": "BOND_CROWDING_RATE_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 349
        },
        {
          "name": "domesticBondFundingShare",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 350
        },
        {
          "name": "CAPACITY_COST_PER_POINT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 354
        },
        {
          "name": "CAPACITY_BUILD_QTRS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 355
        },
        {
          "name": "HOUSEHOLD_SURVEY_FUNDED_AT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 359
        },
        {
          "name": "HUMAN_DEVELOPMENT_LIFE_MIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 365
        },
        {
          "name": "HUMAN_DEVELOPMENT_LIFE_MAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 366
        },
        {
          "name": "HUMAN_DEVELOPMENT_INCOME_MIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 367
        },
        {
          "name": "HUMAN_DEVELOPMENT_INCOME_MAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 368
        },
        {
          "name": "INDICATOR_FUNDED_AT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 372
        },
        {
          "name": "INDUSTRY_CENSUS_FUNDED_AT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 458
        },
        {
          "name": "INDUSTRY_VALUE_ADDED_SD",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 466
        },
        {
          "name": "INDUSTRY_EMPLOYMENT_SD",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 468
        },
        {
          "name": "HOUSEHOLD_INCOME_SD",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 471
        },
        {
          "name": "HOUSEHOLD_POVERTY_GAP_SD",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 475
        },
        {
          "name": "STAT_REVISION_SETTLING_RATE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 483
        },
        {
          "name": "STAT_NOISE_CAPACITY_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 488
        },
        {
          "name": "STAT_FAST_LAG_CAPACITY",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 491
        },
        {
          "name": "STAT_ERROR_BAND_CAPACITY_GATE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 495
        },
        {
          "name": "STAT_ERROR_BAND_Z",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 498
        },
        {
          "name": "STAT_GDP_LEVEL_RELATIVE_SD",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 502
        },
        {
          "name": "STAT_REVISION_DELAYS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 505
        },
        {
          "name": "STAT_LAGS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 507
        },
        {
          "name": "CAPACITY_DECAY_BY_ID",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 511
        },
        {
          "name": "CONF_NEUTRAL",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 519
        },
        {
          "name": "CONF_ADAPT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 520
        },
        {
          "name": "CONF_MPC_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 521
        },
        {
          "name": "CONF_INV_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 522
        },
        {
          "name": "CONF_CONSUMER_TREND_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 525
        },
        {
          "name": "CONF_CONSUMER_UNEMPLOYMENT_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 526
        },
        {
          "name": "CONF_BUSINESS_UTILIZATION_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 529
        },
        {
          "name": "CONF_BUSINESS_PROFIT_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 530
        },
        {
          "name": "CONF_BUSINESS_PROFIT_REFERENCE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 531
        },
        {
          "name": "EXPECTATION_ADAPT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 534
        },
        {
          "name": "PRINT_PRICE_PRESSURE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 535
        },
        {
          "name": "INFLATION_EXPECTATIONS_MIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 536
        },
        {
          "name": "INFLATION_EXPECTATIONS_MAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 537
        },
        {
          "name": "INVESTMENT_RATE_SENSITIVITY",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 538
        },
        {
          "name": "NATURAL_REAL_RATE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 539
        },
        {
          "name": "INVESTMENT_SLACK_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 543
        },
        {
          "name": "INVESTMENT_NORMAL_UTILIZATION",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 547
        },
        {
          "name": "INVESTMENT_UTIL_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 548
        },
        {
          "name": "INVESTMENT_FACTOR_MAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 549
        },
        {
          "name": "INVESTMENT_FACTOR_MIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 550
        },
        {
          "name": "FDI_BASE_ANNUAL_GDP_SHARE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 557
        },
        {
          "name": "FDI_REFERENCE_POPULATION",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 561
        },
        {
          "name": "FDI_SIZE_ELASTICITY",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 562
        },
        {
          "name": "FDI_OPENNESS_FLOOR",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 564
        },
        {
          "name": "FDI_OPENNESS_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 565
        },
        {
          "name": "FDI_CATCHUP_FLOOR",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 566
        },
        {
          "name": "FDI_CATCHUP_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 567
        },
        {
          "name": "FDI_CATCHUP_FACTOR_MIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 569
        },
        {
          "name": "FDI_CATCHUP_FACTOR_MAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 570
        },
        {
          "name": "FDI_NORMAL_AFTER_TAX_PROFIT_SHARE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 573
        },
        {
          "name": "FDI_RETURN_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 574
        },
        {
          "name": "FDI_RETURN_FACTOR_MIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 576
        },
        {
          "name": "FDI_RETURN_FACTOR_MAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 577
        },
        {
          "name": "FDI_CONFIDENCE_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 578
        },
        {
          "name": "FDI_CONFIDENCE_FACTOR_MIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 580
        },
        {
          "name": "FDI_CONFIDENCE_FACTOR_MAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 581
        },
        {
          "name": "FDI_EXPORT_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 582
        },
        {
          "name": "FDI_REFERENCE_EXPORT_SHARE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 585
        },
        {
          "name": "FDI_EXPORT_FACTOR_MIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 586
        },
        {
          "name": "FDI_EXPORT_FACTOR_MAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 587
        },
        {
          "name": "FDI_IMPORTED_CAPITAL_SHARE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 590
        },
        {
          "name": "FDI_PRICE_INSTABILITY_AT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 594
        },
        {
          "name": "FDI_PRICE_INSTABILITY_DRAG",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 595
        },
        {
          "name": "FDI_MACRO_STABILITY_FLOOR",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 597
        },
        {
          "name": "FDI_OWNERSHIP_SATURATION",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 600
        },
        {
          "name": "FDI_OPENING_OWNERSHIP_BASE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 601
        },
        {
          "name": "FDI_CRISIS_MULTIPLIER",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 604
        },
        {
          "name": "FDI_PROFIT_REMIT_SHARE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 607
        },
        {
          "name": "FDI_ADMIN_FACTOR_FLOOR",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 610
        },
        {
          "name": "FDI_ADMIN_FACTOR_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 611
        },
        {
          "name": "FDI_TARIFF_DRAG",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 614
        },
        {
          "name": "FDI_TARIFF_FACTOR_MIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 615
        },
        {
          "name": "FDI_CYCLE_WEIGHT_FINANCIAL",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 619
        },
        {
          "name": "FDI_CYCLE_WEIGHT_MANUFACTURING",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 620
        },
        {
          "name": "FDI_CYCLE_WEIGHT_REGIONAL",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 621
        },
        {
          "name": "FDI_CYCLE_FACTOR_MIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 622
        },
        {
          "name": "FDI_CYCLE_FACTOR_MAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 623
        },
        {
          "name": "fdiStructuralAttraction",
          "kind": "function",
          "path": "packages/engine/src/constants.ts",
          "line": 629
        },
        {
          "name": "EMISSION_INTENSITY",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 655
        },
        {
          "name": "EMISSION_TECH_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 666
        },
        {
          "name": "POLLUTION_REFERENCE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 674
        },
        {
          "name": "POLLUTION_ADJUST",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 681
        },
        {
          "name": "POLLUTION_MORTALITY_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 686
        },
        {
          "name": "POLLUTION_DROUGHT_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 694
        },
        {
          "name": "POLLUTION_DROUGHT_MAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 696
        },
        {
          "name": "ENERGY_SHOCK_P",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 700
        },
        {
          "name": "ENERGY_SHOCK_JUMP",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 701
        },
        {
          "name": "DROUGHT_P",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 703
        },
        {
          "name": "DROUGHT_SEVERITY",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 704
        },
        {
          "name": "DROUGHT_EXTRA_QTRS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 705
        },
        {
          "name": "WORLD_PRICE_REVERT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 708
        },
        {
          "name": "FRONTIER_ERAS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 714
        },
        {
          "name": "TECH_EXPOSURE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 723
        },
        {
          "name": "CATCHUP_Q",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 731
        },
        {
          "name": "ABSORB_BASE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 735
        },
        {
          "name": "ABSORB_EDU_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 736
        },
        {
          "name": "ABSORB_OPENNESS_WEIGHT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 737
        },
        {
          "name": "ABSORB_OPENNESS_CAP",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 739
        },
        {
          "name": "FRONTIER_OWN_DRIFT_Q",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 741
        },
        {
          "name": "TECH_ATTAINED_BASE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 745
        },
        {
          "name": "TECH_ATTAINED_DEV_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 746
        },
        {
          "name": "RESEARCH_EFFECTIVE_SHARE_MAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 752
        },
        {
          "name": "RESEARCH_SKILL_FLOOR",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 753
        },
        {
          "name": "RESEARCH_CATCHUP_GAIN_Q",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 757
        },
        {
          "name": "RESEARCH_FRONTIER_GAIN_Q",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 762
        },
        {
          "name": "RESEARCH_FRONTIER_START",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 768
        },
        {
          "name": "RESEARCH_STOCK_DECAY_Q",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 780
        },
        {
          "name": "BREAKTHROUGH_SIZE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 792
        },
        {
          "name": "BREAKTHROUGH_HAZARD_MAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 793
        },
        {
          "name": "FERT_EDU_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 798
        },
        {
          "name": "EDUCATION_1946",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 799
        },
        {
          "name": "HUMAN_CAPITAL_ADJUST_Q",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 803
        },
        {
          "name": "LIVING_STANDARD_1946",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 809
        },
        {
          "name": "LIVING_STANDARD_LOG_FLOOR",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 814
        },
        {
          "name": "MEAN_LOG_CONSUMPTION_FLOOR",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 818
        },
        {
          "name": "MORT_BASE_ANNUAL",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 822
        },
        {
          "name": "MORT_INCOME_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 827
        },
        {
          "name": "MORT_SECULAR_Q",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 829
        },
        {
          "name": "MORT_FLOOR",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 830
        },
        {
          "name": "MORT_CEILING",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 833
        },
        {
          "name": "FERT_MAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 837
        },
        {
          "name": "FERT_MIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 838
        },
        {
          "name": "FERT_INCOME_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 839
        },
        {
          "name": "FERT_URBAN_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 840
        },
        {
          "name": "FERT_URBAN_NEUTRAL",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 843
        },
        {
          "name": "FERT_SURVIVAL_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 846
        },
        {
          "name": "FERT_SECULAR_Q",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 847
        },
        {
          "name": "FERTILE_YEARS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 848
        },
        {
          "name": "MIG_WORLD_FRONTIER_SHARE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 855
        },
        {
          "name": "MIG_PERFORMANCE_GAIN_Q",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 857
        },
        {
          "name": "MIG_PERFORMANCE_GAP_CAP",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 859
        },
        {
          "name": "MIG_LABOR_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 861
        },
        {
          "name": "MIG_EMIGRATION_CAP_Q",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 864
        },
        {
          "name": "IMMIGRATION_LIMIT_DEFAULT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 867
        },
        {
          "name": "IMMIGRATION_LIMIT_MAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 868
        },
        {
          "name": "MIG_LAND_FAVOR_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 873
        },
        {
          "name": "MIG_INDUSTRIAL_FAVOR_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 874
        },
        {
          "name": "MIG_UNION_FAVOR_LOSS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 875
        },
        {
          "name": "MIG_UNREST_FREE_RATE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 876
        },
        {
          "name": "UNREST_IMMIGRATION",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 877
        },
        {
          "name": "SUBSISTENCE_ABSORPTION_Q",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 884
        },
        {
          "name": "SUBSISTENCE_CAP",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 887
        },
        {
          "name": "URBANIZATION_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 890
        },
        {
          "name": "JOBS_PULL_UNEMPLOYMENT_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 895
        },
        {
          "name": "PROFESSIONAL_SCHOOLING_ELASTICITY",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 917
        },
        {
          "name": "PROFESSIONAL_SHARE_MAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 930
        },
        {
          "name": "SCHOOLING_BASELINE_FLOOR",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 942
        },
        {
          "name": "PROFESSIONALIZATION_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 947
        },
        {
          "name": "BASE_WORKER_SHARE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 950
        },
        {
          "name": "WELFARE_DISCOUNT_Q",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 954
        },
        {
          "name": "PROSPERITY_GRADE_CUTS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 963
        },
        {
          "name": "LEGITIMACY_GRADE_ELECTIONS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 972
        },
        {
          "name": "TRADE_ELASTICITY",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 979
        },
        {
          "name": "EXPORT_CAP_SHARE_OF_POTENTIAL",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 982
        },
        {
          "name": "EXPORT_BASE_SHARE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 983
        },
        {
          "name": "IMPORT_BASE_SHARE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 990
        },
        {
          "name": "EXPORT_CAPACITY_CAP",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1000
        },
        {
          "name": "RESERVES_INIT_QTRS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1001
        },
        {
          "name": "DEBT_TO_GDP_1946",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1005
        },
        {
          "name": "INCOME_TAX_1946",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1012
        },
        {
          "name": "CORPORATE_TAX_1946",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1013
        },
        {
          "name": "TARIFF_1946",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1014
        },
        {
          "name": "DEPRECIATION_WHEN_BROKE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1015
        },
        {
          "name": "INIT_TRANSFERS_SHARE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1020
        },
        {
          "name": "INIT_PROCUREMENT_SHARE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1021
        },
        {
          "name": "INIT_INVESTMENT_SHARE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1022
        },
        {
          "name": "INIT_BUDGET_DEFICIT_FACTOR",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1024
        },
        {
          "name": "INIT_TARIFF_CAPACITY_FLOOR",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1027
        },
        {
          "name": "INIT_TARIFF_CAPACITY_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1028
        },
        {
          "name": "FDI_OPENING_OWNERSHIP_CAP",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1031
        },
        {
          "name": "INIT_RETIREE_SAVINGS_MULTIPLE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1034
        },
        {
          "name": "INIT_HABIT_INCOME_DISCOUNT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1041
        },
        {
          "name": "INIT_APPROVAL_HONEYMOON",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1042
        },
        {
          "name": "INIT_INFLATION_EXPECTATIONS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1043
        },
        {
          "name": "INIT_UNEMPLOYMENT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1044
        },
        {
          "name": "FX_TARGET_ADJUST",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1067
        },
        {
          "name": "FX_PARITY_PASSTHROUGH",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1084
        },
        {
          "name": "FX_BALANCE_TILT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1106
        },
        {
          "name": "FX_BALANCE_NORM_ADAPT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1115
        },
        {
          "name": "FX_CARRY_TILT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1137
        },
        {
          "name": "POLICY_RATE_1946",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1144
        },
        {
          "name": "FX_TILT_MIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1149
        },
        {
          "name": "FX_TILT_MAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1150
        },
        {
          "name": "FX_WOBBLE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1155
        },
        {
          "name": "FX_COVER_ADJUST",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1167
        },
        {
          "name": "FX_RATE_MIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1176
        },
        {
          "name": "FX_RATE_MAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1177
        },
        {
          "name": "FX_INTERVENTION_MAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1183
        },
        {
          "name": "WORLD_PRICE_VOL",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1185
        },
        {
          "name": "PARTNER_CYCLE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1199
        },
        {
          "name": "PARTNER_ACTIVITY_MIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1212
        },
        {
          "name": "PARTNER_ACTIVITY_MAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1213
        },
        {
          "name": "PARTNER_BOOM_AT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1214
        },
        {
          "name": "PARTNER_SLUMP_AT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1215
        },
        {
          "name": "EXPORT_DEMAND_WEIGHTS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1219
        },
        {
          "name": "WORLD_SUPPLY_WEIGHTS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1229
        },
        {
          "name": "WORLD_SUPPLY_PRICE_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1238
        },
        {
          "name": "WORLD_PRICE_MIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1240
        },
        {
          "name": "WORLD_PRICE_MAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1241
        },
        {
          "name": "ASSET_REVERT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1258
        },
        {
          "name": "ASSET_FUND_PROFIT_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1259
        },
        {
          "name": "ASSET_NORMAL_PROFIT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1260
        },
        {
          "name": "ASSET_FUND_RATE_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1261
        },
        {
          "name": "ASSET_FUND_MIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1264
        },
        {
          "name": "ASSET_FUND_MAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1265
        },
        {
          "name": "ASSET_CREDIT_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1270
        },
        {
          "name": "ASSET_SPIRITS_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1271
        },
        {
          "name": "ASSET_VOL",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1272
        },
        {
          "name": "ASSET_MIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1273
        },
        {
          "name": "ASSET_MAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1274
        },
        {
          "name": "ASSET_BUBBLE_AT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1275
        },
        {
          "name": "CREDIT_BASE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1278
        },
        {
          "name": "CREDIT_RATE_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1279
        },
        {
          "name": "CREDIT_COLLATERAL_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1280
        },
        {
          "name": "CREDIT_SPIRITS_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1281
        },
        {
          "name": "CREDIT_ADJUST",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1282
        },
        {
          "name": "CREDIT_RATIO_MIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1285
        },
        {
          "name": "CREDIT_RATIO_MAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1286
        },
        {
          "name": "CAPITAL_REQUIREMENT_DEFAULT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1290
        },
        {
          "name": "CAPITAL_REQUIREMENT_MIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1291
        },
        {
          "name": "CAPITAL_REQUIREMENT_MAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1292
        },
        {
          "name": "BANK_TARGET_RATIO",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1293
        },
        {
          "name": "BANK_MARGIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1294
        },
        {
          "name": "BANK_SPREAD",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1295
        },
        {
          "name": "LOAN_LOSS_BASE_Q",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1296
        },
        {
          "name": "BANK_DIVIDEND_Q",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1297
        },
        {
          "name": "ASSET_PURCHASE_RATE_DEFAULT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1303
        },
        {
          "name": "ASSET_PURCHASE_RATE_MAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1304
        },
        {
          "name": "ASSET_PURCHASE_PRIVATE_RATE_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1305
        },
        {
          "name": "CRISIS_LEVERAGE_SAFE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1310
        },
        {
          "name": "CRISIS_ASSET_SAFE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1311
        },
        {
          "name": "CRISIS_BASE_P",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1312
        },
        {
          "name": "CRISIS_FRAGILITY_P",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1313
        },
        {
          "name": "CRISIS_IMPORT_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1316
        },
        {
          "name": "FINANCIAL_ACTIVITY_SAFE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1319
        },
        {
          "name": "CRISIS_DURATION",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1320
        },
        {
          "name": "CRISIS_SEVERITY_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1321
        },
        {
          "name": "CRISIS_SEVERITY_BASE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1322
        },
        {
          "name": "CRISIS_SEVERITY_IMPORT_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1323
        },
        {
          "name": "CRISIS_SEVERITY_MIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1324
        },
        {
          "name": "CRISIS_ASSET_CRASH",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1325
        },
        {
          "name": "CRISIS_WRITEOFF",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1326
        },
        {
          "name": "BANK_CAPITAL_FLOOR",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1328
        },
        {
          "name": "CRISIS_CREDIT_CRUNCH",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1329
        },
        {
          "name": "CRISIS_CONF_SHOCK",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1330
        },
        {
          "name": "CRISIS_SUDDEN_STOP_IMPORT_PRESSURE_AT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1333
        },
        {
          "name": "FIN_INVEST_Q_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1337
        },
        {
          "name": "FIN_CRUNCH_DRAG",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1338
        },
        {
          "name": "APPROVAL_DRIFT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1341
        },
        {
          "name": "LOSS_AVERSION",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1342
        },
        {
          "name": "APPROVAL_TARGET_BASE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1350
        },
        {
          "name": "APPROVAL_GROWTH_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1351
        },
        {
          "name": "APPROVAL_GROWTH_CAP",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1352
        },
        {
          "name": "APPROVAL_INFLATION_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1353
        },
        {
          "name": "APPROVAL_INFLATION_REFERENCE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1354
        },
        {
          "name": "APPROVAL_JOBLESS_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1355
        },
        {
          "name": "APPROVAL_JOBLESS_REFERENCE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1356
        },
        {
          "name": "APPROVAL_SHORTAGE_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1357
        },
        {
          "name": "PC_INCOME_SCALE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1358
        },
        {
          "name": "PC_INCOME_APPROVAL_NEUTRAL",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1360
        },
        {
          "name": "PC_INCOME_FLOOR",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1361
        },
        {
          "name": "PC_HEADLINE_SALIENCE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1364
        },
        {
          "name": "PC_HEADLINE_CAP",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1365
        },
        {
          "name": "ELECTION_WIN_THRESHOLD",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1366
        },
        {
          "name": "ELECTION_WIN_THRESHOLD_FLOOR",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1368
        },
        {
          "name": "ELECTION_OUTCOME_NOISE_SD",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1370
        },
        {
          "name": "PC_START",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1371
        },
        {
          "name": "PC_MAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1372
        },
        {
          "name": "PC_REPRESSION_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1376
        },
        {
          "name": "PC_UNREST_DRAG",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1378
        },
        {
          "name": "PC_COST_DIAL_BASE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1381
        },
        {
          "name": "PC_COST_DIAL_SLOPE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1382
        },
        {
          "name": "PC_COST_CAPACITY",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1383
        },
        {
          "name": "PC_COST_REFORM",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1386
        },
        {
          "name": "PC_COST_CAMPAIGN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1387
        },
        {
          "name": "TAX_RATE_INCOME_MAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1394
        },
        {
          "name": "TAX_RATE_CORPORATE_MAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1395
        },
        {
          "name": "TAX_RATE_TARIFF_MAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1396
        },
        {
          "name": "TAX_RATE_FUEL_MAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1397
        },
        {
          "name": "SPENDING_DIAL_MAX_GDP_SHARE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1399
        },
        {
          "name": "SPENDING_DIAL_SCALE_GDP_SHARE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1400
        },
        {
          "name": "SUBSIDY_DIAL_MAX_GDP_SHARE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1401
        },
        {
          "name": "SUBSIDY_DIAL_SCALE_GDP_SHARE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1402
        },
        {
          "name": "IMMIGRATION_LIMIT_DIAL_SCALE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1403
        },
        {
          "name": "POLICY_RATE_DIAL_MAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1404
        },
        {
          "name": "POLICY_RATE_DIAL_SCALE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1405
        },
        {
          "name": "ASSET_PURCHASE_RATE_DIAL_SCALE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1406
        },
        {
          "name": "FX_INTERVENTION_DIAL_SCALE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1412
        },
        {
          "name": "SURPLUS_PAYOUT_DIAL_SCALE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1416
        },
        {
          "name": "CAPITAL_REQUIREMENT_DIAL_SCALE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1417
        },
        {
          "name": "CAPACITY_INVESTMENT_MAX_GDP_SHARE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1419
        },
        {
          "name": "CAPACITY_MINISTRY_FULL_STRENGTH_GATE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1422
        },
        {
          "name": "Stance",
          "kind": "type",
          "path": "packages/engine/src/constants.ts",
          "line": 1428
        },
        {
          "name": "SUBSIDY_STANCE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1430
        },
        {
          "name": "DIAL_STANCE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1438
        },
        {
          "name": "REFORM_STANCE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1479
        },
        {
          "name": "SOC_ADJUST",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1494
        },
        {
          "name": "SOC_BASE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1495
        },
        {
          "name": "SOC_FRANCHISE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1496
        },
        {
          "name": "SOC_PRESS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1497
        },
        {
          "name": "SOC_LABOR",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1498
        },
        {
          "name": "SOC_COURTS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1499
        },
        {
          "name": "SOC_EDU",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1500
        },
        {
          "name": "SOC_URBAN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1501
        },
        {
          "name": "SOC_INEQ",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1502
        },
        {
          "name": "SOC_GINI_NEUTRAL",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1503
        },
        {
          "name": "SOC_REPRESSION",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1504
        },
        {
          "name": "STATE_CAPACITY_WEIGHT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1509
        },
        {
          "name": "STATE_REPRESSION_WEIGHT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1510
        },
        {
          "name": "CORRIDOR_HALF_WIDTH",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1513
        },
        {
          "name": "REPRESSION_DECAY_Q",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1517
        },
        {
          "name": "INSTITUTION_EROSION_Q",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1518
        },
        {
          "name": "REFORM_STEP",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1519
        },
        {
          "name": "REFORM_WINDOW_AT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1522
        },
        {
          "name": "REFORM_WINDOW_DISCOUNT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1523
        },
        {
          "name": "REFORM_WINDOW_VETO_RELIEF",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1524
        },
        {
          "name": "INSTITUTIONS_1946",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1528
        },
        {
          "name": "UNREST_ADAPT_UP",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1544
        },
        {
          "name": "UNREST_ADAPT_DOWN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1545
        },
        {
          "name": "UNREST_BASE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1546
        },
        {
          "name": "UNREST_DISCONTENT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1563
        },
        {
          "name": "UNREST_VOICELESS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1564
        },
        {
          "name": "UNREST_INEQ",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1565
        },
        {
          "name": "UNREST_GINI_NEUTRAL",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1566
        },
        {
          "name": "UNREST_CRISIS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1567
        },
        {
          "name": "UNREST_REPRESSION",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1571
        },
        {
          "name": "UNREST_DESPOTISM",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1576
        },
        {
          "name": "UNREST_ANARCHY",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1577
        },
        {
          "name": "REVOLT_AT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1581
        },
        {
          "name": "REVOLT_P",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1582
        },
        {
          "name": "COUP_AT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1585
        },
        {
          "name": "COUP_P",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1586
        },
        {
          "name": "LAND_POWER_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1592
        },
        {
          "name": "IND_POWER_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1593
        },
        {
          "name": "FIN_POWER_CREDIT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1594
        },
        {
          "name": "FIN_POWER_DEBT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1595
        },
        {
          "name": "UNION_POWER_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1596
        },
        {
          "name": "SOCIETY_CHECK",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1600
        },
        {
          "name": "BLOC_FAVOR_ADAPT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1601
        },
        {
          "name": "BLOC_FAVOR_BASE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1612
        },
        {
          "name": "FAVOR_LANDOWNERS_SUBSIDY",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1623
        },
        {
          "name": "FAVOR_LANDOWNERS_TARIFF",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1624
        },
        {
          "name": "FAVOR_LANDOWNERS_INCOME_TAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1625
        },
        {
          "name": "FAVOR_LANDOWNERS_CORPORATE_TAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1626
        },
        {
          "name": "FAVOR_LANDOWNERS_LABOR_RIGHTS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1627
        },
        {
          "name": "FAVOR_LANDOWNERS_SUFFRAGE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1628
        },
        {
          "name": "FAVOR_LANDOWNERS_REPRESSION",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1629
        },
        {
          "name": "FAVOR_INDUSTRIALISTS_SUBSIDY",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1631
        },
        {
          "name": "FAVOR_INDUSTRIALISTS_TARIFF",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1632
        },
        {
          "name": "FAVOR_INDUSTRIALISTS_CORPORATE_TAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1633
        },
        {
          "name": "FAVOR_INDUSTRIALISTS_REAL_RATE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1634
        },
        {
          "name": "FAVOR_INDUSTRIALISTS_LABOR_RIGHTS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1635
        },
        {
          "name": "FAVOR_INDUSTRIALISTS_FUEL_TAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1636
        },
        {
          "name": "FAVOR_INDUSTRIALISTS_COURTS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1637
        },
        {
          "name": "FAVOR_FINANCIERS_COURTS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1639
        },
        {
          "name": "FAVOR_FINANCIERS_REAL_RATE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1640
        },
        {
          "name": "FAVOR_FINANCIERS_REAL_RATE_CLAMP",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1643
        },
        {
          "name": "FAVOR_FINANCIERS_INFLATION",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1644
        },
        {
          "name": "FAVOR_FINANCIERS_INFLATION_NEUTRAL",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1645
        },
        {
          "name": "FAVOR_FINANCIERS_PRINTING",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1646
        },
        {
          "name": "FAVOR_FINANCIERS_DEBT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1647
        },
        {
          "name": "FAVOR_FINANCIERS_DEBT_NEUTRAL",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1648
        },
        {
          "name": "FAVOR_FINANCIERS_CORPORATE_TAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1649
        },
        {
          "name": "FAVOR_UNIONS_LABOR_RIGHTS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1651
        },
        {
          "name": "FAVOR_UNIONS_SUFFRAGE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1652
        },
        {
          "name": "FAVOR_UNIONS_TRANSFERS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1653
        },
        {
          "name": "FAVOR_UNIONS_UNEMPLOYMENT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1654
        },
        {
          "name": "FAVOR_UNIONS_FUEL_TAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1655
        },
        {
          "name": "FAVOR_UNIONS_REPRESSION",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1656
        },
        {
          "name": "FAVOR_UNIONS_INFLATION",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1657
        },
        {
          "name": "FAVOR_UNIONS_INFLATION_NEUTRAL",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1658
        },
        {
          "name": "BLOC_DEFIANCE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1661
        },
        {
          "name": "VETO_COST_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1663
        },
        {
          "name": "PLEDGE_QTRS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1665
        },
        {
          "name": "PLEDGE_VETO_MULT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1666
        },
        {
          "name": "FIN_FAVOR_PREMIUM",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1670
        },
        {
          "name": "FIN_FAVOR_DEPTH",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1671
        },
        {
          "name": "IND_FAVOR_INVEST",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1672
        },
        {
          "name": "UNION_FAVOR_WAGE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1673
        },
        {
          "name": "LAND_FAVOR_TAX",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1674
        },
        {
          "name": "ELITE_CAPTURE_NEUTRAL",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1682
        },
        {
          "name": "ELITE_VETO_ABSORB",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1683
        },
        {
          "name": "ELITE_ABSORB_CLAMP",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1684
        },
        {
          "name": "StatuteLevel",
          "kind": "interface",
          "path": "packages/engine/src/constants.ts",
          "line": 1709
        },
        {
          "name": "STATUTE_LEVELS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1724
        },
        {
          "name": "STATUTE_STANCE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1757
        },
        {
          "name": "STATUTE_PHASE_IN_QTRS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1772
        },
        {
          "name": "STATUTE_COMPLIANCE_ADMIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1777
        },
        {
          "name": "STATUTE_COMPLIANCE_COURTS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1778
        },
        {
          "name": "STATUTE_EVASION_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1780
        },
        {
          "name": "STATUTE_COMPLIANCE_FLOOR",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1785
        },
        {
          "name": "STATUTE_COMPLIANCE_CEILING",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1786
        },
        {
          "name": "STATUTE_CONGESTION",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1790
        },
        {
          "name": "COMPETITION_CAPTURE_RELIEF",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1802
        },
        {
          "name": "SCHOOLING_LABOR_WITHDRAWAL",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1816
        },
        {
          "name": "ABATEMENT_COST_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1829
        },
        {
          "name": "SCHOOLING_ATTAINMENT_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1834
        },
        {
          "name": "MINIMUM_WAGE_ANCHOR",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1848
        },
        {
          "name": "PC_COST_STATUTE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1852
        },
        {
          "name": "STATUTE_ENTRENCHMENT_QTRS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1856
        },
        {
          "name": "STATUTE_REPEAL_PREMIUM",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1857
        },
        {
          "name": "PLATFORM_SWING",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1861
        },
        {
          "name": "LARGESSE_BUMP",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1870
        },
        {
          "name": "LARGESSE_SWING_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1871
        },
        {
          "name": "COALITION_SWING_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1872
        },
        {
          "name": "SUPPRESSION_REPRESSION_STEP",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1873
        },
        {
          "name": "FRANCHISE_SUFFRAGE_STEP",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1874
        },
        {
          "name": "REPRESSION_VOTE_EDGE",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1877
        },
        {
          "name": "PLATFORM_BLOC_COST",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1879
        },
        {
          "name": "COALITION_FAVOR_GAIN",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1886
        },
        {
          "name": "COALITION_FAVOR_SNUB",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1887
        },
        {
          "name": "POSITION_GRADE_CUTS",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1892
        },
        {
          "name": "CARETAKER_CAPACITY_EVERY",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1909
        },
        {
          "name": "CARETAKER_CAPACITY_SPEND",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1910
        },
        {
          "name": "NEWS_REPORT_P",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1930
        },
        {
          "name": "NEWS_REPORTS_PER_QTR",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1933
        },
        {
          "name": "NEWS_COOLDOWN_Q",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1937
        },
        {
          "name": "NEWS_COOLDOWN_GROWTH",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1955
        },
        {
          "name": "NEWS_COOLDOWN_MAX_Q",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1957
        },
        {
          "name": "WORLD_PHASE_COOLDOWN_Q",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1969
        },
        {
          "name": "NEWS_THIN_PAGE_AT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1972
        },
        {
          "name": "NEWS_COLOUR_P",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1976
        },
        {
          "name": "NEWS_COLOUR_COOLDOWN_Q",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1979
        },
        {
          "name": "PRESS_CAPTURED_AT",
          "kind": "constant",
          "path": "packages/engine/src/constants.ts",
          "line": 1996
        }
      ],
      "imports": [
        "packages/engine/src/actions/types.ts",
        "packages/engine/src/state/schema.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "importedBy": [
        "packages/engine/src/actions/apply.ts",
        "packages/engine/src/countries.ts",
        "packages/engine/src/events/conditions.ts",
        "packages/engine/src/events/file.ts",
        "packages/engine/src/humanDevelopment.ts",
        "packages/engine/src/index.ts",
        "packages/engine/src/index.ts",
        "packages/engine/src/interregnum.ts",
        "packages/engine/src/pipeline/cohorts.ts",
        "packages/engine/src/pipeline/demography.ts",
        "packages/engine/src/pipeline/derive.ts",
        "packages/engine/src/pipeline/environment.ts",
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
        "packages/engine/src/pipeline/staffing.ts",
        "packages/engine/src/pipeline/statistics.ts",
        "packages/engine/src/pipeline/technology.ts",
        "packages/engine/src/pipeline/trade.ts",
        "packages/engine/src/pipeline/world.ts",
        "packages/engine/src/state/finance.ts",
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
      "lines": 567,
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
          "name": "CountryDraftRange",
          "kind": "interface",
          "path": "packages/engine/src/countries.ts",
          "line": 41
        },
        {
          "name": "COUNTRY_DRAFT_DOMAIN",
          "kind": "constant",
          "path": "packages/engine/src/countries.ts",
          "line": 56
        },
        {
          "name": "CountryProfile",
          "kind": "interface",
          "path": "packages/engine/src/countries.ts",
          "line": 71
        },
        {
          "name": "COUNTRY_CATALOG",
          "kind": "constant",
          "path": "packages/engine/src/countries.ts",
          "line": 159
        },
        {
          "name": "pyramidFor",
          "kind": "function",
          "path": "packages/engine/src/countries.ts",
          "line": 196
        },
        {
          "name": "MERIDIA_PARAMS",
          "kind": "constant",
          "path": "packages/engine/src/countries.ts",
          "line": 234
        },
        {
          "name": "generateParams",
          "kind": "function",
          "path": "packages/engine/src/countries.ts",
          "line": 336
        },
        {
          "name": "ProceduralCountryOptions",
          "kind": "interface",
          "path": "packages/engine/src/countries.ts",
          "line": 368
        },
        {
          "name": "generateCountryParams",
          "kind": "function",
          "path": "packages/engine/src/countries.ts",
          "line": 409
        },
        {
          "name": "materializeStructure",
          "kind": "function",
          "path": "packages/engine/src/countries.ts",
          "line": 463
        },
        {
          "name": "createCountryParams",
          "kind": "function",
          "path": "packages/engine/src/countries.ts",
          "line": 485
        },
        {
          "name": "countryProfile",
          "kind": "function",
          "path": "packages/engine/src/countries.ts",
          "line": 491
        },
        {
          "name": "InvalidCountryError",
          "kind": "class",
          "path": "packages/engine/src/countries.ts",
          "line": 495
        },
        {
          "name": "validateCountryParams",
          "kind": "function",
          "path": "packages/engine/src/countries.ts",
          "line": 503
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
      "id": "packages/engine/src/events/catalogue.ts",
      "label": "catalogue",
      "packageId": "engine",
      "category": "Engine core",
      "summary": "The catalogue: what every event is CALLED and how it READS. One entry per `EventId`, compile-enforced total, and the only place in the game where the wire's prose is authored.",
      "lines": 2157,
      "exports": [
        {
          "name": "Dispatch",
          "kind": "interface",
          "path": "packages/engine/src/events/catalogue.ts",
          "line": 58
        },
        {
          "name": "EventDef",
          "kind": "interface",
          "path": "packages/engine/src/events/catalogue.ts",
          "line": 63
        },
        {
          "name": "EVENT_CATALOGUE",
          "kind": "constant",
          "path": "packages/engine/src/events/catalogue.ts",
          "line": 77
        }
      ],
      "imports": [
        "packages/engine/src/events/eras.ts",
        "packages/engine/src/events/ids.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "importedBy": [
        "packages/engine/src/events/file.ts",
        "packages/engine/src/events/index.ts",
        "packages/engine/src/events/index.ts",
        "packages/engine/src/index.ts",
        "packages/engine/src/index.ts"
      ],
      "path": "packages/engine/src/events/catalogue.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/events/conditions.ts",
      "label": "conditions",
      "packageId": "engine",
      "category": "Engine core",
      "summary": "The news desk: which of the country's conditions get reported this quarter.",
      "lines": 828,
      "exports": [
        {
          "name": "EventContext",
          "kind": "interface",
          "path": "packages/engine/src/events/conditions.ts",
          "line": 68
        },
        {
          "name": "back",
          "kind": "function",
          "path": "packages/engine/src/events/conditions.ts",
          "line": 103
        },
        {
          "name": "medianAge",
          "kind": "function",
          "path": "packages/engine/src/events/conditions.ts",
          "line": 116
        },
        {
          "name": "RuleClass",
          "kind": "type",
          "path": "packages/engine/src/events/conditions.ts",
          "line": 153
        },
        {
          "name": "ConditionRule",
          "kind": "interface",
          "path": "packages/engine/src/events/conditions.ts",
          "line": 155
        },
        {
          "name": "CONDITION_RULES",
          "kind": "constant",
          "path": "packages/engine/src/events/conditions.ts",
          "line": 167
        },
        {
          "name": "cooldownFor",
          "kind": "function",
          "path": "packages/engine/src/events/conditions.ts",
          "line": 634
        },
        {
          "name": "reportBudget",
          "kind": "function",
          "path": "packages/engine/src/events/conditions.ts",
          "line": 661
        },
        {
          "name": "buildContext",
          "kind": "function",
          "path": "packages/engine/src/events/conditions.ts",
          "line": 673
        },
        {
          "name": "conditionDispatches",
          "kind": "function",
          "path": "packages/engine/src/events/conditions.ts",
          "line": 717
        }
      ],
      "imports": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/events/eras.ts",
        "packages/engine/src/events/file.ts",
        "packages/engine/src/events/ids.ts",
        "packages/engine/src/pipeline/derive.ts",
        "packages/engine/src/rng/rng.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "importedBy": [
        "packages/engine/src/events/index.ts",
        "packages/engine/src/events/index.ts",
        "packages/engine/src/index.ts",
        "packages/engine/src/index.ts",
        "packages/engine/src/pipeline/statistics.ts"
      ],
      "path": "packages/engine/src/events/conditions.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/events/eras.ts",
      "label": "eras",
      "packageId": "engine",
      "category": "Engine core",
      "summary": "The century has six presses, and the paper on the desk in 2043 is not the paper that was on it in 1947.",
      "lines": 148,
      "exports": [
        {
          "name": "PRESS_ERA_IDS",
          "kind": "constant",
          "path": "packages/engine/src/events/eras.ts",
          "line": 23
        },
        {
          "name": "PressEraId",
          "kind": "type",
          "path": "packages/engine/src/events/eras.ts",
          "line": 24
        },
        {
          "name": "PressEra",
          "kind": "interface",
          "path": "packages/engine/src/events/eras.ts",
          "line": 26
        },
        {
          "name": "PRESS_ERAS",
          "kind": "constant",
          "path": "packages/engine/src/events/eras.ts",
          "line": 38
        },
        {
          "name": "eraAtYear",
          "kind": "function",
          "path": "packages/engine/src/events/eras.ts",
          "line": 50
        },
        {
          "name": "eraAtTick",
          "kind": "constant",
          "path": "packages/engine/src/events/eras.ts",
          "line": 56
        },
        {
          "name": "eraOrdinal",
          "kind": "function",
          "path": "packages/engine/src/events/eras.ts",
          "line": 59
        },
        {
          "name": "OutletRoster",
          "kind": "interface",
          "path": "packages/engine/src/events/eras.ts",
          "line": 80
        },
        {
          "name": "OUTLETS",
          "kind": "constant",
          "path": "packages/engine/src/events/eras.ts",
          "line": 89
        }
      ],
      "imports": [
        "packages/engine/src/events/ids.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "importedBy": [
        "packages/engine/src/events/catalogue.ts",
        "packages/engine/src/events/conditions.ts",
        "packages/engine/src/events/file.ts",
        "packages/engine/src/events/index.ts",
        "packages/engine/src/events/index.ts",
        "packages/engine/src/index.ts",
        "packages/engine/src/index.ts"
      ],
      "path": "packages/engine/src/events/eras.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/events/file.ts",
      "label": "file",
      "packageId": "engine",
      "category": "Engine core",
      "summary": "Filing: turning an `EventId` into the `NewsItem` that goes into the save.",
      "lines": 140,
      "exports": [
        {
          "name": "dispatchesFor",
          "kind": "function",
          "path": "packages/engine/src/events/file.ts",
          "line": 44
        },
        {
          "name": "outletFor",
          "kind": "function",
          "path": "packages/engine/src/events/file.ts",
          "line": 60
        },
        {
          "name": "dispatchRng",
          "kind": "constant",
          "path": "packages/engine/src/events/file.ts",
          "line": 74
        },
        {
          "name": "fileDispatch",
          "kind": "function",
          "path": "packages/engine/src/events/file.ts",
          "line": 84
        },
        {
          "name": "fileDispatches",
          "kind": "function",
          "path": "packages/engine/src/events/file.ts",
          "line": 106
        },
        {
          "name": "quartersSinceFiled",
          "kind": "function",
          "path": "packages/engine/src/events/file.ts",
          "line": 111
        },
        {
          "name": "fileIfNotRecent",
          "kind": "function",
          "path": "packages/engine/src/events/file.ts",
          "line": 133
        }
      ],
      "imports": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/events/catalogue.ts",
        "packages/engine/src/events/eras.ts",
        "packages/engine/src/events/ids.ts",
        "packages/engine/src/rng/rng.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "importedBy": [
        "packages/engine/src/actions/apply.ts",
        "packages/engine/src/events/conditions.ts",
        "packages/engine/src/events/index.ts",
        "packages/engine/src/index.ts",
        "packages/engine/src/pipeline/finance.ts",
        "packages/engine/src/pipeline/institutions.ts",
        "packages/engine/src/pipeline/politics.ts",
        "packages/engine/src/pipeline/shocks.ts",
        "packages/engine/src/pipeline/technology.ts",
        "packages/engine/src/pipeline/trade.ts",
        "packages/engine/src/pipeline/world.ts"
      ],
      "path": "packages/engine/src/events/file.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/events/ids.ts",
      "label": "ids",
      "packageId": "engine",
      "category": "Engine core",
      "summary": "The event register: every dispatch the wire can ever carry, named once.",
      "lines": 243,
      "exports": [
        {
          "name": "DESK_IDS",
          "kind": "constant",
          "path": "packages/engine/src/events/ids.ts",
          "line": 25
        },
        {
          "name": "DeskId",
          "kind": "type",
          "path": "packages/engine/src/events/ids.ts",
          "line": 43
        },
        {
          "name": "PROMINENCE_IDS",
          "kind": "constant",
          "path": "packages/engine/src/events/ids.ts",
          "line": 51
        },
        {
          "name": "Prominence",
          "kind": "type",
          "path": "packages/engine/src/events/ids.ts",
          "line": 52
        },
        {
          "name": "EVENT_IDS",
          "kind": "constant",
          "path": "packages/engine/src/events/ids.ts",
          "line": 60
        },
        {
          "name": "EventId",
          "kind": "type",
          "path": "packages/engine/src/events/ids.ts",
          "line": 235
        },
        {
          "name": "isEventId",
          "kind": "function",
          "path": "packages/engine/src/events/ids.ts",
          "line": 240
        }
      ],
      "imports": [],
      "importedBy": [
        "packages/engine/src/actions/apply.ts",
        "packages/engine/src/events/catalogue.ts",
        "packages/engine/src/events/conditions.ts",
        "packages/engine/src/events/eras.ts",
        "packages/engine/src/events/file.ts",
        "packages/engine/src/events/index.ts",
        "packages/engine/src/events/index.ts",
        "packages/engine/src/index.ts",
        "packages/engine/src/index.ts",
        "packages/engine/src/pipeline/world.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "path": "packages/engine/src/events/ids.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/events/index.ts",
      "label": "index",
      "packageId": "engine",
      "category": "Engine core",
      "summary": "The event system (#160): what the wire can carry, how it is worded, and who decides that it runs.",
      "lines": 45,
      "exports": [],
      "imports": [
        "packages/engine/src/events/catalogue.ts",
        "packages/engine/src/events/catalogue.ts",
        "packages/engine/src/events/conditions.ts",
        "packages/engine/src/events/conditions.ts",
        "packages/engine/src/events/eras.ts",
        "packages/engine/src/events/eras.ts",
        "packages/engine/src/events/file.ts",
        "packages/engine/src/events/ids.ts",
        "packages/engine/src/events/ids.ts"
      ],
      "importedBy": [],
      "path": "packages/engine/src/events/index.ts",
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
      "id": "packages/engine/src/humanDevelopment.ts",
      "label": "humanDevelopment",
      "packageId": "engine",
      "category": "Engine core",
      "summary": "Terrarium's Human Development Index (ADR-0033).",
      "lines": 53,
      "exports": [
        {
          "name": "HumanDevelopmentInputs",
          "kind": "interface",
          "path": "packages/engine/src/humanDevelopment.ts",
          "line": 21
        },
        {
          "name": "humanDevelopmentDimensions",
          "kind": "function",
          "path": "packages/engine/src/humanDevelopment.ts",
          "line": 29
        },
        {
          "name": "humanDevelopmentIndex",
          "kind": "function",
          "path": "packages/engine/src/humanDevelopment.ts",
          "line": 50
        }
      ],
      "imports": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/math.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "importedBy": [
        "packages/engine/src/index.ts",
        "packages/engine/src/pipeline/statistics.ts"
      ],
      "path": "packages/engine/src/humanDevelopment.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/index.ts",
      "label": "index",
      "packageId": "engine",
      "category": "Engine core",
      "summary": "The whole engine is three functions (§2):",
      "lines": 421,
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
        "packages/engine/src/constants.ts",
        "packages/engine/src/countries.ts",
        "packages/engine/src/countries.ts",
        "packages/engine/src/countryDocument.ts",
        "packages/engine/src/countryDocument.ts",
        "packages/engine/src/events/catalogue.ts",
        "packages/engine/src/events/catalogue.ts",
        "packages/engine/src/events/conditions.ts",
        "packages/engine/src/events/conditions.ts",
        "packages/engine/src/events/eras.ts",
        "packages/engine/src/events/eras.ts",
        "packages/engine/src/events/file.ts",
        "packages/engine/src/events/ids.ts",
        "packages/engine/src/events/ids.ts",
        "packages/engine/src/hash.ts",
        "packages/engine/src/humanDevelopment.ts",
        "packages/engine/src/interregnum.ts",
        "packages/engine/src/pipeline/demography.ts",
        "packages/engine/src/pipeline/demography.ts",
        "packages/engine/src/pipeline/derive.ts",
        "packages/engine/src/pipeline/environment.ts",
        "packages/engine/src/pipeline/institutions.ts",
        "packages/engine/src/pipeline/pipeline.ts",
        "packages/engine/src/pipeline/politics.ts",
        "packages/engine/src/pipeline/shocks.ts",
        "packages/engine/src/pipeline/technology.ts",
        "packages/engine/src/pipeline/technology.ts",
        "packages/engine/src/pipeline/trade.ts",
        "packages/engine/src/pipeline/trade.ts",
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
        "packages/observation/src/dataExport.ts",
        "packages/observation/src/observe.ts",
        "packages/observation/src/published.ts",
        "packages/observation/src/published.ts",
        "packages/runner/src/batch.ts",
        "packages/runner/src/country-fuzz.ts",
        "packages/runner/src/debt.ts",
        "packages/runner/src/export-feedback-cli.ts",
        "packages/runner/src/export-feedback.ts",
        "packages/runner/src/policies.ts",
        "packages/runner/src/run.ts",
        "packages/runner/src/stability-cli.ts",
        "packages/runner/src/stability.ts",
        "packages/ui/src/App.tsx",
        "packages/ui/src/census.ts",
        "packages/ui/src/components/labels.ts",
        "packages/ui/src/components/series.ts",
        "packages/ui/src/countryDraft.ts",
        "packages/ui/src/devScenario.ts",
        "packages/ui/src/domains.ts",
        "packages/ui/src/finance.ts",
        "packages/ui/src/gameRules.ts",
        "packages/ui/src/households.ts",
        "packages/ui/src/incidence.ts",
        "packages/ui/src/industry.ts",
        "packages/ui/src/levers.ts",
        "packages/ui/src/manual.ts",
        "packages/ui/src/maturity.ts",
        "packages/ui/src/newspaper.ts",
        "packages/ui/src/panels/CensusOverlay.tsx",
        "packages/ui/src/panels/ControlRail.tsx",
        "packages/ui/src/panels/CountrySelect.tsx",
        "packages/ui/src/panels/DevConsole.tsx",
        "packages/ui/src/panels/FinanceOverlay.tsx",
        "packages/ui/src/panels/HeaderBar.tsx",
        "packages/ui/src/panels/HouseholdOverlay.tsx",
        "packages/ui/src/panels/IndustryOverlay.tsx",
        "packages/ui/src/panels/LedgerOverlay.tsx",
        "packages/ui/src/panels/NewsWire.tsx",
        "packages/ui/src/panels/PublicAssetBook.tsx",
        "packages/ui/src/panels/ReportCardOverlay.tsx",
        "packages/ui/src/panels/SettingsOverlay.tsx",
        "packages/ui/src/panels/WireOverlay.tsx",
        "packages/ui/src/panels/cabinet/CapacityRow.tsx",
        "packages/ui/src/panels/cabinet/SpendingRuleRow.tsx",
        "packages/ui/src/panels/cabinet/dials.ts",
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
        "packages/engine/src/humanDevelopment.ts",
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
        "packages/engine/src/pipeline/staffing.ts",
        "packages/engine/src/pipeline/statistics.ts",
        "packages/engine/src/pipeline/technology.ts",
        "packages/engine/src/pipeline/trade.ts",
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
      "lines": 255,
      "exports": [
        {
          "name": "cohorts",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/cohorts.ts",
          "line": 51
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
      "lines": 376,
      "exports": [
        {
          "name": "vitalRates",
          "kind": "function",
          "path": "packages/engine/src/pipeline/demography.ts",
          "line": 73
        },
        {
          "name": "classSizesFrom",
          "kind": "function",
          "path": "packages/engine/src/pipeline/demography.ts",
          "line": 94
        },
        {
          "name": "professionalCeiling",
          "kind": "function",
          "path": "packages/engine/src/pipeline/demography.ts",
          "line": 127
        },
        {
          "name": "MigrationFlow",
          "kind": "interface",
          "path": "packages/engine/src/pipeline/demography.ts",
          "line": 146
        },
        {
          "name": "migrationFlow",
          "kind": "function",
          "path": "packages/engine/src/pipeline/demography.ts",
          "line": 168
        },
        {
          "name": "demography",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/demography.ts",
          "line": 197
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
      "lines": 1090,
      "exports": [
        {
          "name": "periodLifeExpectancy",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 80
        },
        {
          "name": "lifeExpectancyAtBirth",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 112
        },
        {
          "name": "financierAnger",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 120
        },
        {
          "name": "sovereignRiskPremium",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 130
        },
        {
          "name": "bondIssuanceShare",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 140
        },
        {
          "name": "privateFundingSpread",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 150
        },
        {
          "name": "privateRealRate",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 160
        },
        {
          "name": "potentialOutput",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 169
        },
        {
          "name": "sectorValueAdded",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 188
        },
        {
          "name": "technologyAttainment",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 205
        },
        {
          "name": "laborForOutput",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 224
        },
        {
          "name": "effectivePrice",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 230
        },
        {
          "name": "schoolingWithdrawal",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 250
        },
        {
          "name": "laborForce",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 263
        },
        {
          "name": "totalLaborForce",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 275
        },
        {
          "name": "staffing",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 322
        },
        {
          "name": "skillTightness",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 350
        },
        {
          "name": "approvalIndex",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 368
        },
        {
          "name": "meanLogConsumption",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 385
        },
        {
          "name": "realConsumptionPerCapita",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 401
        },
        {
          "name": "householdSavingRate",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 414
        },
        {
          "name": "livingStandard",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 447
        },
        {
          "name": "HouseholdIncomeGroup",
          "kind": "interface",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 452
        },
        {
          "name": "HouseholdIncomeDistribution",
          "kind": "interface",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 460
        },
        {
          "name": "householdIncomeGroups",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 494
        },
        {
          "name": "householdIncomeDistribution",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 524
        },
        {
          "name": "giniIndex",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 600
        },
        {
          "name": "realIncomePerHead",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 630
        },
        {
          "name": "exchangeRateParity",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 669
        },
        {
          "name": "realExchangeRate",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 682
        },
        {
          "name": "termsOfTrade",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 691
        },
        {
          "name": "enfranchisementIndex",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 713
        },
        {
          "name": "discontentIndex",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 735
        },
        {
          "name": "urbanShare",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 751
        },
        {
          "name": "residence",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 779
        },
        {
          "name": "statePower",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 790
        },
        {
          "name": "corridorOffset",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 802
        },
        {
          "name": "corridorStrain",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 808
        },
        {
          "name": "inCorridor",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 816
        },
        {
          "name": "effectiveBlocPower",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 824
        },
        {
          "name": "eliteHostility",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 832
        },
        {
          "name": "eliteCapture",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 863
        },
        {
          "name": "creativeDestruction",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 876
        },
        {
          "name": "statutesInForce",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 888
        },
        {
          "name": "statuteCompliance",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 912
        },
        {
          "name": "statuteForce",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 953
        },
        {
          "name": "minimumWageFloor",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 988
        },
        {
          "name": "effectiveConsumptionWeights",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 1029
        },
        {
          "name": "cohortCpi",
          "kind": "function",
          "path": "packages/engine/src/pipeline/derive.ts",
          "line": 1084
        }
      ],
      "imports": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/math.ts",
        "packages/engine/src/pipeline/staffing.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "importedBy": [
        "packages/engine/src/actions/apply.ts",
        "packages/engine/src/events/conditions.ts",
        "packages/engine/src/index.ts",
        "packages/engine/src/pipeline/cohorts.ts",
        "packages/engine/src/pipeline/demography.ts",
        "packages/engine/src/pipeline/environment.ts",
        "packages/engine/src/pipeline/finance.ts",
        "packages/engine/src/pipeline/fiscal.ts",
        "packages/engine/src/pipeline/institutions.ts",
        "packages/engine/src/pipeline/labor.ts",
        "packages/engine/src/pipeline/politics.ts",
        "packages/engine/src/pipeline/prices.ts",
        "packages/engine/src/pipeline/production.ts",
        "packages/engine/src/pipeline/statistics.ts",
        "packages/engine/src/pipeline/technology.ts",
        "packages/engine/src/pipeline/trade.ts",
        "packages/engine/src/state/init.ts",
        "packages/engine/src/state/validate.ts"
      ],
      "path": "packages/engine/src/pipeline/derive.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/pipeline/environment.ts",
      "label": "environment",
      "packageId": "engine",
      "category": "Pipeline",
      "summary": "Step — the environment. What production costs outside the market (ADR-0028).",
      "lines": 73,
      "exports": [
        {
          "name": "emissionsPerHead",
          "kind": "function",
          "path": "packages/engine/src/pipeline/environment.ts",
          "line": 44
        },
        {
          "name": "environment",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/environment.ts",
          "line": 58
        }
      ],
      "imports": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/pipeline/derive.ts",
        "packages/engine/src/pipeline/pipeline.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "importedBy": [
        "packages/engine/src/index.ts",
        "packages/engine/src/pipeline/pipeline.ts",
        "packages/engine/src/state/init.ts"
      ],
      "path": "packages/engine/src/pipeline/environment.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/pipeline/finance.ts",
      "label": "finance",
      "packageId": "engine",
      "category": "Pipeline",
      "summary": "Step 3.5 — the financial sector. The credit cycle is the amplifier and the crisis clock in one. Each quarter: • banks set a credit target from the real rate, collateral (asset prices), and animal spirits — capped by their capital; credit adjusts toward it; • asset prices (a To…",
      "lines": 225,
      "exports": [
        {
          "name": "finance",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/finance.ts",
          "line": 72
        }
      ],
      "imports": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/events/file.ts",
        "packages/engine/src/math.ts",
        "packages/engine/src/pipeline/derive.ts",
        "packages/engine/src/pipeline/pipeline.ts",
        "packages/engine/src/state/schema.ts",
        "packages/engine/src/state/spending.ts"
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
      "lines": 179,
      "exports": [
        {
          "name": "fiscal",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/fiscal.ts",
          "line": 38
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
      "lines": 165,
      "exports": [
        {
          "name": "foreignInvestment",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/foreignInvestment.ts",
          "line": 52
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
      "id": "packages/engine/src/pipeline/indicatorSpecs.ts",
      "label": "indicatorSpecs",
      "packageId": "engine",
      "category": "Pipeline",
      "summary": "The measurement catalogue — one specification per published indicator: what the office is trying to measure, and how badly it measures it at zero capacity. Nothing here measures anything. `pipeline/statistics.ts` owns the machinery (funding gates, lags, revisions, the `obs:*`…",
      "lines": 363,
      "exports": [
        {
          "name": "DirectIndicatorSpec",
          "kind": "interface",
          "path": "packages/engine/src/pipeline/indicatorSpecs.ts",
          "line": 30
        },
        {
          "name": "HUMAN_DEVELOPMENT_COMPONENT_IDS",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/indicatorSpecs.ts",
          "line": 46
        },
        {
          "name": "HumanDevelopmentComponentId",
          "kind": "type",
          "path": "packages/engine/src/pipeline/indicatorSpecs.ts",
          "line": 52
        },
        {
          "name": "ConstructedIndicatorSpec",
          "kind": "interface",
          "path": "packages/engine/src/pipeline/indicatorSpecs.ts",
          "line": 54
        },
        {
          "name": "IndicatorSpec",
          "kind": "type",
          "path": "packages/engine/src/pipeline/indicatorSpecs.ts",
          "line": 60
        },
        {
          "name": "isDirectIndicatorSpec",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/indicatorSpecs.ts",
          "line": 62
        },
        {
          "name": "INDICATOR_SPECS",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/indicatorSpecs.ts",
          "line": 76
        }
      ],
      "imports": [
        "packages/engine/src/state/schema.ts"
      ],
      "importedBy": [
        "packages/engine/src/pipeline/statistics.ts"
      ],
      "path": "packages/engine/src/pipeline/indicatorSpecs.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/pipeline/institutions.ts",
      "label": "institutions",
      "packageId": "engine",
      "category": "Pipeline",
      "summary": "Step 8 — institutions and the Narrow Corridor. The half of the game that isn't the economy.",
      "lines": 467,
      "exports": [
        {
          "name": "franchiseOf",
          "kind": "function",
          "path": "packages/engine/src/pipeline/institutions.ts",
          "line": 138
        },
        {
          "name": "initialInstitutions",
          "kind": "function",
          "path": "packages/engine/src/pipeline/institutions.ts",
          "line": 324
        },
        {
          "name": "institutions",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/institutions.ts",
          "line": 362
        }
      ],
      "imports": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/events/file.ts",
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
      "lines": 151,
      "exports": [
        {
          "name": "labor",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/labor.ts",
          "line": 38
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
      "lines": 35,
      "exports": [
        {
          "name": "monetary",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/monetary.ts",
          "line": 17
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
      "lines": 68,
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
          "line": 36
        },
        {
          "name": "runTick",
          "kind": "function",
          "path": "packages/engine/src/pipeline/pipeline.ts",
          "line": 56
        }
      ],
      "imports": [
        "packages/engine/src/pipeline/cohorts.ts",
        "packages/engine/src/pipeline/demography.ts",
        "packages/engine/src/pipeline/environment.ts",
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
        "packages/engine/src/pipeline/environment.ts",
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
      "lines": 185,
      "exports": [
        {
          "name": "electionThreshold",
          "kind": "function",
          "path": "packages/engine/src/pipeline/politics.ts",
          "line": 74
        },
        {
          "name": "politics",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/politics.ts",
          "line": 78
        }
      ],
      "imports": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/events/file.ts",
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
      "lines": 103,
      "exports": [
        {
          "name": "prices",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/prices.ts",
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
      "path": "packages/engine/src/pipeline/prices.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/pipeline/production.ts",
      "label": "production",
      "packageId": "engine",
      "category": "Pipeline",
      "summary": "Step 1 — production. Builds this tick's demand from last tick's incomes and prices, solves the Leontief system for required gross output, and produces up to capacity. Excess demand is recorded for the price step; nothing here is a hand-authored effect arrow — a fuel tax reache…",
      "lines": 302,
      "exports": [
        {
          "name": "production",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/production.ts",
          "line": 57
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
      "lines": 92,
      "exports": [
        {
          "name": "droughtHazardMultiplier",
          "kind": "function",
          "path": "packages/engine/src/pipeline/shocks.ts",
          "line": 27
        },
        {
          "name": "shocks",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/shocks.ts",
          "line": 34
        }
      ],
      "imports": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/events/file.ts",
        "packages/engine/src/pipeline/pipeline.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "importedBy": [
        "packages/engine/src/index.ts",
        "packages/engine/src/pipeline/pipeline.ts"
      ],
      "path": "packages/engine/src/pipeline/shocks.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/pipeline/staffing.ts",
      "label": "staffing",
      "packageId": "engine",
      "category": "Pipeline",
      "summary": "Skill-demand allocation: who actually holds each sector's fixed posts.",
      "lines": 201,
      "exports": [
        {
          "name": "allocateStaffing",
          "kind": "function",
          "path": "packages/engine/src/pipeline/staffing.ts",
          "line": 54
        }
      ],
      "imports": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/math.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "importedBy": [
        "packages/engine/src/pipeline/derive.ts"
      ],
      "path": "packages/engine/src/pipeline/staffing.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/pipeline/statistics.ts",
      "label": "statistics",
      "packageId": "engine",
      "category": "Pipeline",
      "summary": "Step 8 — statistics. The office measures the quarter, files the worksheet, and releases whatever falls due: first prints after a lag, revisions at +2 and +5 quarters. Noise draws come from `obs:*` substreams keyed by (indicator, measured quarter, revision) — orthogonal to the…",
      "lines": 576,
      "exports": [
        {
          "name": "humanDevelopmentPrintsDue",
          "kind": "function",
          "path": "packages/engine/src/pipeline/statistics.ts",
          "line": 322
        },
        {
          "name": "statistics",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/statistics.ts",
          "line": 525
        }
      ],
      "imports": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/events/conditions.ts",
        "packages/engine/src/humanDevelopment.ts",
        "packages/engine/src/math.ts",
        "packages/engine/src/pipeline/derive.ts",
        "packages/engine/src/pipeline/indicatorSpecs.ts",
        "packages/engine/src/pipeline/pipeline.ts",
        "packages/engine/src/rng/rng.ts",
        "packages/engine/src/state/accounts.ts",
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
      "lines": 262,
      "exports": [
        {
          "name": "frontierGrowthAt",
          "kind": "function",
          "path": "packages/engine/src/pipeline/technology.ts",
          "line": 40
        },
        {
          "name": "absorptiveCapacity",
          "kind": "function",
          "path": "packages/engine/src/pipeline/technology.ts",
          "line": 59
        },
        {
          "name": "researchIntensity",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/technology.ts",
          "line": 77
        },
        {
          "name": "ResearchAllocation",
          "kind": "interface",
          "path": "packages/engine/src/pipeline/technology.ts",
          "line": 79
        },
        {
          "name": "researchAllocation",
          "kind": "function",
          "path": "packages/engine/src/pipeline/technology.ts",
          "line": 109
        },
        {
          "name": "breakthroughHazard",
          "kind": "function",
          "path": "packages/engine/src/pipeline/technology.ts",
          "line": 167
        },
        {
          "name": "technology",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/technology.ts",
          "line": 179
        }
      ],
      "imports": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/events/file.ts",
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
      "summary": "Step 4 — trade, and the foreign exchange market that settles it (ADR-0034).",
      "lines": 313,
      "exports": [
        {
          "name": "carryYieldSpread",
          "kind": "function",
          "path": "packages/engine/src/pipeline/trade.ts",
          "line": 95
        },
        {
          "name": "fillableIntervention",
          "kind": "function",
          "path": "packages/engine/src/pipeline/trade.ts",
          "line": 134
        },
        {
          "name": "FxSettlement",
          "kind": "interface",
          "path": "packages/engine/src/pipeline/trade.ts",
          "line": 156
        },
        {
          "name": "settleForeignExchange",
          "kind": "function",
          "path": "packages/engine/src/pipeline/trade.ts",
          "line": 169
        },
        {
          "name": "trade",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/trade.ts",
          "line": 253
        }
      ],
      "imports": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/events/file.ts",
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
      "path": "packages/engine/src/pipeline/trade.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/pipeline/world.ts",
      "label": "world",
      "packageId": "engine",
      "category": "Pipeline",
      "summary": "Step 2.5 — the rest of world. Four abstract trading partners, each an economy with its own business cycle, advance one quarter. Their strength sets two things the domestic economy then lives inside: • how much of your exports they buy (a partner in recession buys less); • the…",
      "lines": 144,
      "exports": [
        {
          "name": "world",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/world.ts",
          "line": 71
        }
      ],
      "imports": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/events/file.ts",
        "packages/engine/src/events/ids.ts",
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
        "packages/engine/src/events/conditions.ts",
        "packages/engine/src/events/file.ts",
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
      "id": "packages/engine/src/state/accounts.ts",
      "label": "accounts",
      "packageId": "engine",
      "category": "State",
      "summary": "Exact self-accounts. These projections add no economic behavior or surveys.",
      "lines": 35,
      "exports": [
        {
          "name": "treasuryFinancing",
          "kind": "function",
          "path": "packages/engine/src/state/accounts.ts",
          "line": 4
        },
        {
          "name": "publicAccountRecord",
          "kind": "function",
          "path": "packages/engine/src/state/accounts.ts",
          "line": 17
        }
      ],
      "imports": [
        "packages/engine/src/state/schema.ts"
      ],
      "importedBy": [
        "packages/engine/src/pipeline/statistics.ts",
        "packages/observation/src/observe.ts"
      ],
      "path": "packages/engine/src/state/accounts.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/state/finance.ts",
      "label": "finance",
      "packageId": "engine",
      "category": "State",
      "summary": "Financial stocks and their opening book.",
      "lines": 37,
      "exports": [
        {
          "name": "FinanceState",
          "kind": "interface",
          "path": "packages/engine/src/state/finance.ts",
          "line": 6
        },
        {
          "name": "initialFinance",
          "kind": "function",
          "path": "packages/engine/src/state/finance.ts",
          "line": 30
        }
      ],
      "imports": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "importedBy": [
        "packages/engine/src/state/init.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "path": "packages/engine/src/state/finance.ts",
      "line": 1
    },
    {
      "id": "packages/engine/src/state/init.ts",
      "label": "init",
      "packageId": "engine",
      "category": "State",
      "summary": "Country generation. A country is a parameter vector (ADR-0011); init() calibrates a TrueState from it so the economy starts near equilibrium — tfp is solved from target outputs rather than guessed, so tick 1 doesn't open with a shock.",
      "lines": 669,
      "exports": [
        {
          "name": "synthPyramid",
          "kind": "function",
          "path": "packages/engine/src/state/init.ts",
          "line": 123
        },
        {
          "name": "init",
          "kind": "function",
          "path": "packages/engine/src/state/init.ts",
          "line": 200
        }
      ],
      "imports": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/countries.ts",
        "packages/engine/src/math.ts",
        "packages/engine/src/pipeline/demography.ts",
        "packages/engine/src/pipeline/derive.ts",
        "packages/engine/src/pipeline/environment.ts",
        "packages/engine/src/pipeline/institutions.ts",
        "packages/engine/src/rng/rng.ts",
        "packages/engine/src/state/finance.ts",
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
      "lines": 1377,
      "exports": [
        {
          "name": "Qtr",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 10
        },
        {
          "name": "Money",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 11
        },
        {
          "name": "Ratio",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 12
        },
        {
          "name": "GAME_RULE_IDS",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 25
        },
        {
          "name": "GameRuleId",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 26
        },
        {
          "name": "GameRules",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 27
        },
        {
          "name": "STANDARD_RULES",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 30
        },
        {
          "name": "GameMode",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 42
        },
        {
          "name": "gameRules",
          "kind": "function",
          "path": "packages/engine/src/state/schema.ts",
          "line": 46
        },
        {
          "name": "SECTOR_IDS",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 51
        },
        {
          "name": "SectorId",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 52
        },
        {
          "name": "COHORT_IDS",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 54
        },
        {
          "name": "CohortId",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 61
        },
        {
          "name": "INCOME_QUINTILE_IDS",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 66
        },
        {
          "name": "IncomeQuintileId",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 67
        },
        {
          "name": "WORKING_CLASS_IDS",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 70
        },
        {
          "name": "WorkingClassId",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 76
        },
        {
          "name": "CAPACITY_IDS",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 78
        },
        {
          "name": "CapacityId",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 79
        },
        {
          "name": "REVENUE_SOURCE_IDS",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 91
        },
        {
          "name": "RevenueSourceId",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 92
        },
        {
          "name": "RevenueSplit",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 93
        },
        {
          "name": "TAX_RATE_IDS",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 105
        },
        {
          "name": "TaxRateId",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 107
        },
        {
          "name": "OUTLAY_IDS",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 113
        },
        {
          "name": "OutlayId",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 122
        },
        {
          "name": "OutlaySplit",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 123
        },
        {
          "name": "SPENDING_PROGRAM_IDS",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 127
        },
        {
          "name": "SpendingProgramId",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 128
        },
        {
          "name": "SpendingRule",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 139
        },
        {
          "name": "SpendingRuleMode",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 143
        },
        {
          "name": "SpendingRules",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 144
        },
        {
          "name": "STATUTE_IDS",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 163
        },
        {
          "name": "StatuteId",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 169
        },
        {
          "name": "Statute",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 177
        },
        {
          "name": "StatuteBook",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 183
        },
        {
          "name": "INSTITUTION_IDS",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 189
        },
        {
          "name": "InstitutionId",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 190
        },
        {
          "name": "BLOC_IDS",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 195
        },
        {
          "name": "BlocId",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 196
        },
        {
          "name": "PLATFORM_IDS",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 202
        },
        {
          "name": "PlatformId",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 203
        },
        {
          "name": "INDICATOR_IDS",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 205
        },
        {
          "name": "IndicatorId",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 292
        },
        {
          "name": "PARTNER_IDS",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 295
        },
        {
          "name": "PartnerId",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 296
        },
        {
          "name": "CountryParams",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 299
        },
        {
          "name": "CountryStructure",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 333
        },
        {
          "name": "AGE_BANDS",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 346
        },
        {
          "name": "RETIREMENT_BAND",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 349
        },
        {
          "name": "WORKING_BANDS",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 351
        },
        {
          "name": "FERTILE_BANDS",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 353
        },
        {
          "name": "DemographyState",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 355
        },
        {
          "name": "Cohort",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 393
        },
        {
          "name": "Sector",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 437
        },
        {
          "name": "IOTable",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 450
        },
        {
          "name": "MarketState",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 456
        },
        {
          "name": "DialState",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 469
        },
        {
          "name": "PolicyRecord",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 523
        },
        {
          "name": "CapacityBuild",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 547
        },
        {
          "name": "GovernmentState",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 554
        },
        {
          "name": "WorldPartner",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 592
        },
        {
          "name": "WorldState",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 597
        },
        {
          "name": "ExternalState",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 604
        },
        {
          "name": "EnvironmentState",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 697
        },
        {
          "name": "TechState",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 723
        },
        {
          "name": "Bloc",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 748
        },
        {
          "name": "InstitutionState",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 755
        },
        {
          "name": "ElectionResult",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 777
        },
        {
          "name": "PoliticalState",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 793
        },
        {
          "name": "FragilityLedger",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 813
        },
        {
          "name": "StatPrint",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 821
        },
        {
          "name": "HumanDevelopmentDimensions",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 835
        },
        {
          "name": "NEWS_KINDS",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 854
        },
        {
          "name": "NewsKind",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 895
        },
        {
          "name": "NewsTone",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 897
        },
        {
          "name": "NewsItem",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 913
        },
        {
          "name": "INDUSTRY_TABLE_IDS",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 939
        },
        {
          "name": "IndustryTableId",
          "kind": "type",
          "path": "packages/engine/src/state/schema.ts",
          "line": 940
        },
        {
          "name": "IndustryPrint",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 960
        },
        {
          "name": "HouseholdSurveyPrint",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 995
        },
        {
          "name": "StatRecord",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 1017
        },
        {
          "name": "StatsOffice",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 1179
        },
        {
          "name": "TickFlows",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 1194
        },
        {
          "name": "TrueState",
          "kind": "interface",
          "path": "packages/engine/src/state/schema.ts",
          "line": 1279
        },
        {
          "name": "SCHEMA_VERSION",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 1331
        },
        {
          "name": "ENGINE_VERSION",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 1332
        },
        {
          "name": "ELECTION_PERIOD",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 1333
        },
        {
          "name": "CAMPAIGN_WINDOW",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 1336
        },
        {
          "name": "END_OF_HISTORY_TICK",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 1338
        },
        {
          "name": "FIRST_YEAR",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 1343
        },
        {
          "name": "yearOfTick",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 1345
        },
        {
          "name": "tickForYear",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 1349
        },
        {
          "name": "LAST_APPOINTMENT_TICK",
          "kind": "constant",
          "path": "packages/engine/src/state/schema.ts",
          "line": 1354
        },
        {
          "name": "appointmentTick",
          "kind": "function",
          "path": "packages/engine/src/state/schema.ts",
          "line": 1369
        },
        {
          "name": "sectorIndex",
          "kind": "function",
          "path": "packages/engine/src/state/schema.ts",
          "line": 1374
        }
      ],
      "imports": [
        "packages/engine/src/events/ids.ts",
        "packages/engine/src/rng/rng.ts",
        "packages/engine/src/state/finance.ts"
      ],
      "importedBy": [
        "packages/engine/src/actions/apply.ts",
        "packages/engine/src/actions/types.ts",
        "packages/engine/src/constants.ts",
        "packages/engine/src/constants.ts",
        "packages/engine/src/countries.ts",
        "packages/engine/src/countryDocument.ts",
        "packages/engine/src/events/catalogue.ts",
        "packages/engine/src/events/conditions.ts",
        "packages/engine/src/events/eras.ts",
        "packages/engine/src/events/file.ts",
        "packages/engine/src/humanDevelopment.ts",
        "packages/engine/src/index.ts",
        "packages/engine/src/index.ts",
        "packages/engine/src/interregnum.ts",
        "packages/engine/src/math.ts",
        "packages/engine/src/pipeline/cohorts.ts",
        "packages/engine/src/pipeline/demography.ts",
        "packages/engine/src/pipeline/derive.ts",
        "packages/engine/src/pipeline/environment.ts",
        "packages/engine/src/pipeline/finance.ts",
        "packages/engine/src/pipeline/fiscal.ts",
        "packages/engine/src/pipeline/foreignInvestment.ts",
        "packages/engine/src/pipeline/indicatorSpecs.ts",
        "packages/engine/src/pipeline/institutions.ts",
        "packages/engine/src/pipeline/pipeline.ts",
        "packages/engine/src/pipeline/politics.ts",
        "packages/engine/src/pipeline/prices.ts",
        "packages/engine/src/pipeline/production.ts",
        "packages/engine/src/pipeline/shocks.ts",
        "packages/engine/src/pipeline/staffing.ts",
        "packages/engine/src/pipeline/statistics.ts",
        "packages/engine/src/pipeline/technology.ts",
        "packages/engine/src/pipeline/trade.ts",
        "packages/engine/src/pipeline/world.ts",
        "packages/engine/src/state/accounts.ts",
        "packages/engine/src/state/finance.ts",
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
        "packages/engine/src/pipeline/finance.ts",
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
      "lines": 216,
      "exports": [
        {
          "name": "InvariantError",
          "kind": "class",
          "path": "packages/engine/src/state/validate.ts",
          "line": 17
        },
        {
          "name": "validate",
          "kind": "function",
          "path": "packages/engine/src/state/validate.ts",
          "line": 23
        }
      ],
      "imports": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/pipeline/derive.ts",
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
      "lines": 11,
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
      "lines": 43,
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
          "name": "competitionActAtQ8",
          "kind": "constant",
          "path": "packages/fixtures/scripts/scripts.ts",
          "line": 21
        },
        {
          "name": "agriSubsidyAtQ8",
          "kind": "constant",
          "path": "packages/fixtures/scripts/scripts.ts",
          "line": 26
        },
        {
          "name": "investStatsAtQ4",
          "kind": "constant",
          "path": "packages/fixtures/scripts/scripts.ts",
          "line": 31
        },
        {
          "name": "ubiPush",
          "kind": "constant",
          "path": "packages/fixtures/scripts/scripts.ts",
          "line": 36
        },
        {
          "name": "scripts",
          "kind": "constant",
          "path": "packages/fixtures/scripts/scripts.ts",
          "line": 42
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
      "id": "packages/observation/src/dataExport.ts",
      "label": "dataExport",
      "packageId": "observation",
      "category": "Published projection",
      "summary": "The portable record of a run.",
      "lines": 148,
      "exports": [
        {
          "name": "DATA_EXPORT_FORMAT",
          "kind": "constant",
          "path": "packages/observation/src/dataExport.ts",
          "line": 33
        },
        {
          "name": "DATA_EXPORT_VERSION",
          "kind": "constant",
          "path": "packages/observation/src/dataExport.ts",
          "line": 34
        },
        {
          "name": "IndicatorRelease",
          "kind": "type",
          "path": "packages/observation/src/dataExport.ts",
          "line": 36
        },
        {
          "name": "PublishedSnapshot",
          "kind": "type",
          "path": "packages/observation/src/dataExport.ts",
          "line": 54
        },
        {
          "name": "HistoricalDataExport",
          "kind": "interface",
          "path": "packages/observation/src/dataExport.ts",
          "line": 58
        },
        {
          "name": "createHistoricalDataExport",
          "kind": "function",
          "path": "packages/observation/src/dataExport.ts",
          "line": 94
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/observation/src/published.ts"
      ],
      "importedBy": [
        "packages/observation/src/index.ts"
      ],
      "path": "packages/observation/src/dataExport.ts",
      "line": 1
    },
    {
      "id": "packages/observation/src/index.ts",
      "label": "index",
      "packageId": "observation",
      "category": "Published projection",
      "summary": "",
      "lines": 59,
      "exports": [],
      "imports": [
        "packages/observation/src/dataExport.ts",
        "packages/observation/src/observe.ts",
        "packages/observation/src/published.ts"
      ],
      "importedBy": [
        "packages/ui/src/accounts.ts",
        "packages/ui/src/budgetChart.ts",
        "packages/ui/src/census.ts",
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
        "packages/ui/src/finance.ts",
        "packages/ui/src/gameRules.ts",
        "packages/ui/src/households.ts",
        "packages/ui/src/incidence.ts",
        "packages/ui/src/industry.ts",
        "packages/ui/src/manual.ts",
        "packages/ui/src/maturity.ts",
        "packages/ui/src/maturity.ts",
        "packages/ui/src/newspaper.ts",
        "packages/ui/src/panels/AccountsOverlay.tsx",
        "packages/ui/src/panels/CensusOverlay.tsx",
        "packages/ui/src/panels/ControlRail.tsx",
        "packages/ui/src/panels/ElectionOverlay.tsx",
        "packages/ui/src/panels/ElectionResultOverlay.tsx",
        "packages/ui/src/panels/FinanceOverlay.tsx",
        "packages/ui/src/panels/HeaderBar.tsx",
        "packages/ui/src/panels/HouseholdOverlay.tsx",
        "packages/ui/src/panels/IndustryOverlay.tsx",
        "packages/ui/src/panels/Instruments.tsx",
        "packages/ui/src/panels/LedgerOverlay.tsx",
        "packages/ui/src/panels/LedgerOverlay.tsx",
        "packages/ui/src/panels/LedgerPanel.tsx",
        "packages/ui/src/panels/NewsWire.tsx",
        "packages/ui/src/panels/PolicyOverlay.tsx",
        "packages/ui/src/panels/PublicAssetBook.tsx",
        "packages/ui/src/panels/ReportCardOverlay.tsx",
        "packages/ui/src/panels/SettingsOverlay.tsx",
        "packages/ui/src/panels/StudyOverlay.tsx",
        "packages/ui/src/panels/WireOverlay.tsx",
        "packages/ui/src/panels/cabinet/BlocRow.tsx",
        "packages/ui/src/panels/cabinet/CapacityRow.tsx",
        "packages/ui/src/panels/cabinet/DialRow.tsx",
        "packages/ui/src/panels/cabinet/ReformRow.tsx",
        "packages/ui/src/panels/cabinet/SpendingRuleRow.tsx",
        "packages/ui/src/panels/cabinet/StatuteRow.tsx",
        "packages/ui/src/panels/cabinet/dials.ts",
        "packages/ui/src/policyRecord.ts",
        "packages/ui/src/publicAssets.ts",
        "packages/ui/src/shell/useSceneOverlays.ts",
        "packages/ui/src/spendingRules.ts",
        "packages/ui/src/stateFootprint.ts",
        "packages/ui/src/statutes.ts",
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
      "summary": "",
      "lines": 356,
      "exports": [
        {
          "name": "observe",
          "kind": "function",
          "path": "packages/observation/src/observe.ts",
          "line": 220
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/engine/src/state/accounts.ts",
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
      "lines": 329,
      "exports": [
        {
          "name": "PolicyPoint",
          "kind": "type",
          "path": "packages/observation/src/published.ts",
          "line": 56
        },
        {
          "name": "IndicatorPoint",
          "kind": "type",
          "path": "packages/observation/src/published.ts",
          "line": 59
        },
        {
          "name": "IndicatorSeries",
          "kind": "interface",
          "path": "packages/observation/src/published.ts",
          "line": 61
        },
        {
          "name": "IndustryPoint",
          "kind": "type",
          "path": "packages/observation/src/published.ts",
          "line": 73
        },
        {
          "name": "HouseholdIncomePoint",
          "kind": "type",
          "path": "packages/observation/src/published.ts",
          "line": 76
        },
        {
          "name": "Grade",
          "kind": "type",
          "path": "packages/observation/src/published.ts",
          "line": 78
        },
        {
          "name": "ReportCard",
          "kind": "interface",
          "path": "packages/observation/src/published.ts",
          "line": 82
        },
        {
          "name": "PublishedStatute",
          "kind": "interface",
          "path": "packages/observation/src/published.ts",
          "line": 122
        },
        {
          "name": "PublishedBloc",
          "kind": "interface",
          "path": "packages/observation/src/published.ts",
          "line": 147
        },
        {
          "name": "PublishedCorridor",
          "kind": "interface",
          "path": "packages/observation/src/published.ts",
          "line": 159
        },
        {
          "name": "PublishedCampaign",
          "kind": "interface",
          "path": "packages/observation/src/published.ts",
          "line": 171
        },
        {
          "name": "PublishedState",
          "kind": "interface",
          "path": "packages/observation/src/published.ts",
          "line": 181
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/engine/src/index.ts"
      ],
      "importedBy": [
        "packages/observation/src/dataExport.ts",
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
      "id": "packages/runner/src/country-fuzz-artifacts.ts",
      "label": "country-fuzz-artifacts",
      "packageId": "runner",
      "category": "Headless runner",
      "summary": "",
      "lines": 47,
      "exports": [
        {
          "name": "WrittenCountryFuzzArtifact",
          "kind": "interface",
          "path": "packages/runner/src/country-fuzz-artifacts.ts",
          "line": 6
        },
        {
          "name": "countryFuzzArtifactFilename",
          "kind": "function",
          "path": "packages/runner/src/country-fuzz-artifacts.ts",
          "line": 20
        },
        {
          "name": "writeCountryFuzzArtifact",
          "kind": "function",
          "path": "packages/runner/src/country-fuzz-artifacts.ts",
          "line": 26
        }
      ],
      "imports": [
        "packages/runner/src/country-fuzz.ts"
      ],
      "importedBy": [
        "packages/runner/src/country-fuzz-cli.ts"
      ],
      "path": "packages/runner/src/country-fuzz-artifacts.ts",
      "line": 1
    },
    {
      "id": "packages/runner/src/country-fuzz-cli.ts",
      "label": "country-fuzz-cli",
      "packageId": "runner",
      "category": "Headless runner",
      "summary": "",
      "lines": 83,
      "exports": [],
      "imports": [
        "packages/runner/src/country-fuzz-artifacts.ts",
        "packages/runner/src/country-fuzz.ts",
        "packages/runner/src/metrics.ts",
        "packages/runner/src/policies.ts"
      ],
      "importedBy": [],
      "path": "packages/runner/src/country-fuzz-cli.ts",
      "line": 1
    },
    {
      "id": "packages/runner/src/country-fuzz.ts",
      "label": "country-fuzz",
      "packageId": "runner",
      "category": "Headless runner",
      "summary": "Reproducible exploration of the country input space.",
      "lines": 507,
      "exports": [
        {
          "name": "COUNTRY_FUZZ_PROFILES",
          "kind": "constant",
          "path": "packages/runner/src/country-fuzz.ts",
          "line": 46
        },
        {
          "name": "CountryFuzzProfile",
          "kind": "type",
          "path": "packages/runner/src/country-fuzz.ts",
          "line": 47
        },
        {
          "name": "CountryFuzzSeeds",
          "kind": "interface",
          "path": "packages/runner/src/country-fuzz.ts",
          "line": 49
        },
        {
          "name": "SampledCountry",
          "kind": "interface",
          "path": "packages/runner/src/country-fuzz.ts",
          "line": 55
        },
        {
          "name": "CountryFuzzFinding",
          "kind": "type",
          "path": "packages/runner/src/country-fuzz.ts",
          "line": 66
        },
        {
          "name": "CountryFuzzFindingArtifact",
          "kind": "interface",
          "path": "packages/runner/src/country-fuzz.ts",
          "line": 79
        },
        {
          "name": "CountryFuzzFailureArtifact",
          "kind": "interface",
          "path": "packages/runner/src/country-fuzz.ts",
          "line": 87
        },
        {
          "name": "CountryFuzzArtifact",
          "kind": "type",
          "path": "packages/runner/src/country-fuzz.ts",
          "line": 104
        },
        {
          "name": "CountryFuzzOutcome",
          "kind": "type",
          "path": "packages/runner/src/country-fuzz.ts",
          "line": 106
        },
        {
          "name": "CountryFuzzRunOptions",
          "kind": "interface",
          "path": "packages/runner/src/country-fuzz.ts",
          "line": 120
        },
        {
          "name": "CountryFuzzSweepOptions",
          "kind": "interface",
          "path": "packages/runner/src/country-fuzz.ts",
          "line": 133
        },
        {
          "name": "CountryFuzzSweepResult",
          "kind": "interface",
          "path": "packages/runner/src/country-fuzz.ts",
          "line": 139
        },
        {
          "name": "countryFuzzSeeds",
          "kind": "function",
          "path": "packages/runner/src/country-fuzz.ts",
          "line": 171
        },
        {
          "name": "sampleCountry",
          "kind": "function",
          "path": "packages/runner/src/country-fuzz.ts",
          "line": 183
        },
        {
          "name": "CountryFuzzFailurePhase",
          "kind": "type",
          "path": "packages/runner/src/country-fuzz.ts",
          "line": 239
        },
        {
          "name": "runCountryFuzzCase",
          "kind": "function",
          "path": "packages/runner/src/country-fuzz.ts",
          "line": 350
        },
        {
          "name": "runCountryFuzzSweep",
          "kind": "function",
          "path": "packages/runner/src/country-fuzz.ts",
          "line": 491
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/runner/src/policies.ts",
        "packages/runner/src/run.ts"
      ],
      "importedBy": [
        "packages/runner/src/country-fuzz-artifacts.ts",
        "packages/runner/src/country-fuzz-cli.ts"
      ],
      "path": "packages/runner/src/country-fuzz.ts",
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
        "packages/runner/src/country-fuzz-cli.ts",
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
      "lines": 152,
      "exports": [
        {
          "name": "POLICY_IDS",
          "kind": "constant",
          "path": "packages/runner/src/policies.ts",
          "line": 16
        },
        {
          "name": "PolicyId",
          "kind": "type",
          "path": "packages/runner/src/policies.ts",
          "line": 17
        },
        {
          "name": "RunnerPolicy",
          "kind": "type",
          "path": "packages/runner/src/policies.ts",
          "line": 18
        },
        {
          "name": "developmentalPolicy",
          "kind": "constant",
          "path": "packages/runner/src/policies.ts",
          "line": 25
        },
        {
          "name": "randomPolicy",
          "kind": "constant",
          "path": "packages/runner/src/policies.ts",
          "line": 32
        },
        {
          "name": "regulatedPolicy",
          "kind": "constant",
          "path": "packages/runner/src/policies.ts",
          "line": 114
        },
        {
          "name": "policyFor",
          "kind": "function",
          "path": "packages/runner/src/policies.ts",
          "line": 149
        }
      ],
      "imports": [
        "packages/engine/src/index.ts"
      ],
      "importedBy": [
        "packages/runner/src/batch.ts",
        "packages/runner/src/country-fuzz-cli.ts",
        "packages/runner/src/country-fuzz.ts",
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
      "lines": 418,
      "exports": [
        {
          "name": "TrajectoryPoint",
          "kind": "interface",
          "path": "packages/runner/src/run.ts",
          "line": 33
        },
        {
          "name": "MacroDrivers",
          "kind": "interface",
          "path": "packages/runner/src/run.ts",
          "line": 59
        },
        {
          "name": "MacroEvent",
          "kind": "type",
          "path": "packages/runner/src/run.ts",
          "line": 78
        },
        {
          "name": "RunResult",
          "kind": "interface",
          "path": "packages/runner/src/run.ts",
          "line": 80
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
          "name": "RunObserver",
          "kind": "interface",
          "path": "packages/runner/src/run.ts",
          "line": 121
        },
        {
          "name": "RunOptions",
          "kind": "interface",
          "path": "packages/runner/src/run.ts",
          "line": 131
        },
        {
          "name": "eventsBetween",
          "kind": "function",
          "path": "packages/runner/src/run.ts",
          "line": 171
        },
        {
          "name": "trajectoryPoint",
          "kind": "function",
          "path": "packages/runner/src/run.ts",
          "line": 206
        },
        {
          "name": "runOne",
          "kind": "function",
          "path": "packages/runner/src/run.ts",
          "line": 371
        },
        {
          "name": "runOne",
          "kind": "function",
          "path": "packages/runner/src/run.ts",
          "line": 372
        },
        {
          "name": "runOne",
          "kind": "function",
          "path": "packages/runner/src/run.ts",
          "line": 373
        },
        {
          "name": "runSummary",
          "kind": "function",
          "path": "packages/runner/src/run.ts",
          "line": 381
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/runner/src/debt.ts"
      ],
      "importedBy": [
        "packages/runner/src/batch.ts",
        "packages/runner/src/country-fuzz.ts",
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
      "lines": 600,
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
          "line": 73
        },
        {
          "name": "QuietLaborContractionSummary",
          "kind": "interface",
          "path": "packages/runner/src/stability.ts",
          "line": 104
        },
        {
          "name": "QuietDownsideSummary",
          "kind": "interface",
          "path": "packages/runner/src/stability.ts",
          "line": 115
        },
        {
          "name": "ShockStability",
          "kind": "interface",
          "path": "packages/runner/src/stability.ts",
          "line": 144
        },
        {
          "name": "StabilityReport",
          "kind": "interface",
          "path": "packages/runner/src/stability.ts",
          "line": 154
        },
        {
          "name": "SurvivorTrendSummary",
          "kind": "interface",
          "path": "packages/runner/src/stability.ts",
          "line": 164
        },
        {
          "name": "summarizeTails",
          "kind": "function",
          "path": "packages/runner/src/stability.ts",
          "line": 187
        },
        {
          "name": "playableTrajectory",
          "kind": "function",
          "path": "packages/runner/src/stability.ts",
          "line": 205
        },
        {
          "name": "analyzeStability",
          "kind": "function",
          "path": "packages/runner/src/stability.ts",
          "line": 580
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
      "lines": 352,
      "exports": [
        {
          "name": "App",
          "kind": "function",
          "path": "packages/ui/src/App.tsx",
          "line": 57
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/ui/src/components/ui/index.ts",
        "packages/ui/src/countryDraft.ts",
        "packages/ui/src/manual.ts",
        "packages/ui/src/panels/AccountsOverlay.tsx",
        "packages/ui/src/panels/AtlasOverlay.tsx",
        "packages/ui/src/panels/CensusOverlay.tsx",
        "packages/ui/src/panels/ControlRail.tsx",
        "packages/ui/src/panels/CountrySelect.tsx",
        "packages/ui/src/panels/DevConsole.tsx",
        "packages/ui/src/panels/DraftingRoom.tsx",
        "packages/ui/src/panels/ElectionOverlay.tsx",
        "packages/ui/src/panels/ElectionResultOverlay.tsx",
        "packages/ui/src/panels/FinanceOverlay.tsx",
        "packages/ui/src/panels/HeaderBar.tsx",
        "packages/ui/src/panels/HouseholdOverlay.tsx",
        "packages/ui/src/panels/IndustryOverlay.tsx",
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
        "packages/ui/src/shell/useBootSequence.ts",
        "packages/ui/src/shell/useCabinetChrome.ts",
        "packages/ui/src/shell/useGlobalShortcuts.ts",
        "packages/ui/src/shell/useSceneOverlays.ts",
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
      "id": "packages/ui/src/atlas.ts",
      "label": "atlas",
      "packageId": "ui",
      "category": "UI core",
      "summary": "The engine atlas: the game's account of how the game is built.",
      "lines": 243,
      "exports": [
        {
          "name": "AtlasView",
          "kind": "type",
          "path": "packages/ui/src/atlas.ts",
          "line": 50
        },
        {
          "name": "AtlasViewSpec",
          "kind": "interface",
          "path": "packages/ui/src/atlas.ts",
          "line": 52
        },
        {
          "name": "ATLAS_VIEWS",
          "kind": "constant",
          "path": "packages/ui/src/atlas.ts",
          "line": 59
        },
        {
          "name": "AtlasSummary",
          "kind": "interface",
          "path": "packages/ui/src/atlas.ts",
          "line": 65
        },
        {
          "name": "atlasSummary",
          "kind": "function",
          "path": "packages/ui/src/atlas.ts",
          "line": 74
        },
        {
          "name": "sourceHref",
          "kind": "function",
          "path": "packages/ui/src/atlas.ts",
          "line": 93
        },
        {
          "name": "sourceLabel",
          "kind": "function",
          "path": "packages/ui/src/atlas.ts",
          "line": 97
        },
        {
          "name": "shortPath",
          "kind": "function",
          "path": "packages/ui/src/atlas.ts",
          "line": 102
        },
        {
          "name": "moduleIndex",
          "kind": "function",
          "path": "packages/ui/src/atlas.ts",
          "line": 106
        },
        {
          "name": "packageDepths",
          "kind": "function",
          "path": "packages/ui/src/atlas.ts",
          "line": 119
        },
        {
          "name": "packageLayers",
          "kind": "function",
          "path": "packages/ui/src/atlas.ts",
          "line": 142
        },
        {
          "name": "PackageTraffic",
          "kind": "interface",
          "path": "packages/ui/src/atlas.ts",
          "line": 152
        },
        {
          "name": "PackageRelations",
          "kind": "interface",
          "path": "packages/ui/src/atlas.ts",
          "line": 159
        },
        {
          "name": "packageRelations",
          "kind": "function",
          "path": "packages/ui/src/atlas.ts",
          "line": 164
        },
        {
          "name": "moduleCategories",
          "kind": "function",
          "path": "packages/ui/src/atlas.ts",
          "line": 181
        },
        {
          "name": "ModuleFilter",
          "kind": "interface",
          "path": "packages/ui/src/atlas.ts",
          "line": 185
        },
        {
          "name": "filterModules",
          "kind": "function",
          "path": "packages/ui/src/atlas.ts",
          "line": 198
        },
        {
          "name": "PIPELINE_NOTES",
          "kind": "constant",
          "path": "packages/ui/src/atlas.ts",
          "line": 218
        },
        {
          "name": "positionNote",
          "kind": "function",
          "path": "packages/ui/src/atlas.ts",
          "line": 231
        }
      ],
      "imports": [
        "packages/ui/src/components/ProjectLinks/links.ts"
      ],
      "importedBy": [
        "packages/ui/src/panels/AtlasOverlay.tsx",
        "packages/ui/src/panels/AtlasViews.tsx"
      ],
      "path": "packages/ui/src/atlas.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/budgetChart.ts",
      "label": "budgetChart",
      "packageId": "ui",
      "category": "UI core",
      "summary": "The treasury now has seven exact outlay lines, but a seven-colour pie is not readable in the dossier register. Preserve every book entry in PublishedState and combine the two state-building programmes only for chart geometry.",
      "lines": 68,
      "exports": [
        {
          "name": "OUTLAY_CHART_IDS",
          "kind": "constant",
          "path": "packages/ui/src/budgetChart.ts",
          "line": 15
        },
        {
          "name": "OutlayChartId",
          "kind": "type",
          "path": "packages/ui/src/budgetChart.ts",
          "line": 24
        },
        {
          "name": "OutlayChartValues",
          "kind": "type",
          "path": "packages/ui/src/budgetChart.ts",
          "line": 25
        },
        {
          "name": "outlayChartValues",
          "kind": "function",
          "path": "packages/ui/src/budgetChart.ts",
          "line": 30
        },
        {
          "name": "OUTLAY_FACE",
          "kind": "constant",
          "path": "packages/ui/src/budgetChart.ts",
          "line": 43
        },
        {
          "name": "OUTLAY_CHART_FACE",
          "kind": "constant",
          "path": "packages/ui/src/budgetChart.ts",
          "line": 56
        }
      ],
      "imports": [
        "packages/observation/src/index.ts",
        "packages/ui/src/shares.ts"
      ],
      "importedBy": [
        "packages/ui/src/panels/AccountsOverlay.tsx",
        "packages/ui/src/panels/LedgerOverlay.tsx",
        "packages/ui/src/stateFootprint.ts"
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
      "lines": 62,
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
          "line": 20
        },
        {
          "name": "CabinetNavigationKey",
          "kind": "type",
          "path": "packages/ui/src/cabinetNavigation.ts",
          "line": 21
        },
        {
          "name": "CABINET_NAVIGATION_KEYS",
          "kind": "constant",
          "path": "packages/ui/src/cabinetNavigation.ts",
          "line": 23
        },
        {
          "name": "CABINET_PANEL_ID",
          "kind": "constant",
          "path": "packages/ui/src/cabinetNavigation.ts",
          "line": 44
        },
        {
          "name": "cabinetTabId",
          "kind": "function",
          "path": "packages/ui/src/cabinetNavigation.ts",
          "line": 46
        },
        {
          "name": "cabinetGroupForKey",
          "kind": "function",
          "path": "packages/ui/src/cabinetNavigation.ts",
          "line": 52
        }
      ],
      "imports": [],
      "importedBy": [
        "packages/ui/src/levers.ts",
        "packages/ui/src/panels/ControlRail.tsx",
        "packages/ui/src/panels/cabinet/dials.ts",
        "packages/ui/src/shell/useCabinetChrome.ts"
      ],
      "path": "packages/ui/src/cabinetNavigation.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/census.ts",
      "label": "census",
      "packageId": "ui",
      "category": "UI core",
      "summary": "The national census read for the page — the arithmetic over the EXACT register, kept out of the component so it can be tested.",
      "lines": 207,
      "exports": [
        {
          "name": "CensusEntry",
          "kind": "type",
          "path": "packages/ui/src/census.ts",
          "line": 30
        },
        {
          "name": "GROWTH_LOOKBACK_QTRS",
          "kind": "constant",
          "path": "packages/ui/src/census.ts",
          "line": 39
        },
        {
          "name": "populationGrowth",
          "kind": "function",
          "path": "packages/ui/src/census.ts",
          "line": 51
        },
        {
          "name": "medianAge",
          "kind": "function",
          "path": "packages/ui/src/census.ts",
          "line": 69
        },
        {
          "name": "ageStructure",
          "kind": "function",
          "path": "packages/ui/src/census.ts",
          "line": 88
        },
        {
          "name": "ResidenceId",
          "kind": "type",
          "path": "packages/ui/src/census.ts",
          "line": 126
        },
        {
          "name": "RESIDENCE_FACE",
          "kind": "constant",
          "path": "packages/ui/src/census.ts",
          "line": 142
        },
        {
          "name": "RESIDENCE_IDS",
          "kind": "constant",
          "path": "packages/ui/src/census.ts",
          "line": 157
        },
        {
          "name": "ResidenceSplit",
          "kind": "interface",
          "path": "packages/ui/src/census.ts",
          "line": 159
        },
        {
          "name": "residenceSplit",
          "kind": "function",
          "path": "packages/ui/src/census.ts",
          "line": 177
        },
        {
          "name": "residenceRows",
          "kind": "function",
          "path": "packages/ui/src/census.ts",
          "line": 193
        },
        {
          "name": "residenceShares",
          "kind": "function",
          "path": "packages/ui/src/census.ts",
          "line": 204
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/observation/src/index.ts",
        "packages/ui/src/plot.ts",
        "packages/ui/src/shares.ts"
      ],
      "importedBy": [
        "packages/ui/src/panels/CensusOverlay.tsx"
      ],
      "path": "packages/ui/src/census.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/components/AnalogGauge/AnalogGauge.tsx",
      "label": "AnalogGauge",
      "packageId": "ui",
      "category": "Components",
      "summary": "Dossier-era instrument: an analog gauge on manila, brass-rimmed, with the latest figure rubber-stamped beneath. The needle can only tell you so much — that vagueness is the statistical office's actual competence, not a styling choice.",
      "lines": 270,
      "exports": [
        {
          "name": "AnalogGauge",
          "kind": "function",
          "path": "packages/ui/src/components/AnalogGauge/AnalogGauge.tsx",
          "line": 61
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
      "lines": 260,
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
          "line": 92
        },
        {
          "name": "formatUncertainty",
          "kind": "constant",
          "path": "packages/ui/src/components/labels.ts",
          "line": 98
        },
        {
          "name": "HUMAN_DEVELOPMENT_COMPONENTS",
          "kind": "constant",
          "path": "packages/ui/src/components/labels.ts",
          "line": 101
        },
        {
          "name": "humanDevelopmentBreakdown",
          "kind": "function",
          "path": "packages/ui/src/components/labels.ts",
          "line": 107
        },
        {
          "name": "complementReading",
          "kind": "function",
          "path": "packages/ui/src/components/labels.ts",
          "line": 119
        },
        {
          "name": "SECTOR_NAMES",
          "kind": "constant",
          "path": "packages/ui/src/components/labels.ts",
          "line": 129
        },
        {
          "name": "COHORT_NAMES",
          "kind": "constant",
          "path": "packages/ui/src/components/labels.ts",
          "line": 140
        },
        {
          "name": "COHORT_NOTES",
          "kind": "constant",
          "path": "packages/ui/src/components/labels.ts",
          "line": 157
        },
        {
          "name": "BLOC_NAMES",
          "kind": "constant",
          "path": "packages/ui/src/components/labels.ts",
          "line": 172
        },
        {
          "name": "BLOC_NOTES",
          "kind": "constant",
          "path": "packages/ui/src/components/labels.ts",
          "line": 180
        },
        {
          "name": "INSTITUTION_NAMES",
          "kind": "constant",
          "path": "packages/ui/src/components/labels.ts",
          "line": 191
        },
        {
          "name": "PLATFORM_NAMES",
          "kind": "constant",
          "path": "packages/ui/src/components/labels.ts",
          "line": 214
        },
        {
          "name": "PLATFORM_NOTES",
          "kind": "constant",
          "path": "packages/ui/src/components/labels.ts",
          "line": 230
        },
        {
          "name": "COUNT_NOTES",
          "kind": "constant",
          "path": "packages/ui/src/components/labels.ts",
          "line": 252
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
        "packages/ui/src/panels/ElectionResultOverlay.tsx",
        "packages/ui/src/panels/FinanceOverlay.tsx",
        "packages/ui/src/panels/cabinet/BlocRow.tsx",
        "packages/ui/src/panels/cabinet/CapacityRow.tsx",
        "packages/ui/src/panels/cabinet/IncidenceNote.tsx",
        "packages/ui/src/panels/cabinet/ReformRow.tsx",
        "packages/ui/src/panels/cabinet/StatuteRow.tsx"
      ],
      "path": "packages/ui/src/components/labels.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/components/ProjectLinks/links.ts",
      "label": "links",
      "packageId": "ui",
      "category": "Components",
      "summary": "Where the project lives, as plain data.",
      "lines": 12,
      "exports": [
        {
          "name": "REPOSITORY_URL",
          "kind": "constant",
          "path": "packages/ui/src/components/ProjectLinks/links.ts",
          "line": 10
        },
        {
          "name": "NEW_ISSUE_URL",
          "kind": "constant",
          "path": "packages/ui/src/components/ProjectLinks/links.ts",
          "line": 11
        }
      ],
      "imports": [],
      "importedBy": [
        "packages/ui/src/atlas.ts",
        "packages/ui/src/components/ProjectLinks/ProjectLinks.tsx"
      ],
      "path": "packages/ui/src/components/ProjectLinks/links.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/components/ProjectLinks/ProjectLinks.tsx",
      "label": "ProjectLinks",
      "packageId": "ui",
      "category": "Components",
      "summary": "Stable routes back to the public project. Kept in one component because the posting room and the records office both expose them: the first is the front door, while the second remains reachable once a run has started.",
      "lines": 45,
      "exports": [
        {
          "name": "ProjectLinks",
          "kind": "function",
          "path": "packages/ui/src/components/ProjectLinks/ProjectLinks.tsx",
          "line": 13
        }
      ],
      "imports": [
        "packages/ui/src/components/ProjectLinks/links.ts"
      ],
      "importedBy": [
        "packages/ui/src/panels/CountrySelect.tsx",
        "packages/ui/src/panels/SettingsOverlay.tsx"
      ],
      "path": "packages/ui/src/components/ProjectLinks/ProjectLinks.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/components/RackStrip/RackStrip.tsx",
      "label": "RackStrip",
      "packageId": "ui",
      "category": "Components",
      "summary": "One instrument, compressed to a single line — the rack's unit.",
      "lines": 137,
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
      "lines": 182,
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
          "line": 34
        },
        {
          "name": "RollingMonths",
          "kind": "type",
          "path": "packages/ui/src/components/series.ts",
          "line": 67
        },
        {
          "name": "rollingAverage",
          "kind": "function",
          "path": "packages/ui/src/components/series.ts",
          "line": 83
        },
        {
          "name": "STAMP_WINDOW_QTRS",
          "kind": "constant",
          "path": "packages/ui/src/components/series.ts",
          "line": 126
        },
        {
          "name": "MATERIAL_REVISION_BANDS",
          "kind": "constant",
          "path": "packages/ui/src/components/series.ts",
          "line": 134
        },
        {
          "name": "MATERIAL_REVISION_FACE_FRACTION",
          "kind": "constant",
          "path": "packages/ui/src/components/series.ts",
          "line": 136
        },
        {
          "name": "stampWorthyRevision",
          "kind": "function",
          "path": "packages/ui/src/components/series.ts",
          "line": 157
        },
        {
          "name": "quarterDelta",
          "kind": "function",
          "path": "packages/ui/src/components/series.ts",
          "line": 176
        },
        {
          "name": "qtrLabel",
          "kind": "constant",
          "path": "packages/ui/src/components/series.ts",
          "line": 181
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
        "packages/ui/src/finance.ts",
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
      "lines": 303,
      "exports": [
        {
          "name": "TerminalTicker",
          "kind": "function",
          "path": "packages/ui/src/components/TerminalTicker/TerminalTicker.tsx",
          "line": 103
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
      "lines": 108,
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
          "line": 30
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
      "lines": 33,
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
        "packages/ui/src/components/ui/PhaseChart/PhaseChart.tsx",
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
        "packages/ui/src/panels/AtlasOverlay.tsx",
        "packages/ui/src/panels/AtlasViews.tsx",
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
        "packages/ui/src/panels/HouseholdOverlay.tsx",
        "packages/ui/src/panels/IndustryOverlay.tsx",
        "packages/ui/src/panels/Instruments.tsx",
        "packages/ui/src/panels/LedgerOverlay.tsx",
        "packages/ui/src/panels/LedgerPanel.tsx",
        "packages/ui/src/panels/ManualOverlay.tsx",
        "packages/ui/src/panels/NewsWire.tsx",
        "packages/ui/src/panels/PolicyOverlay.tsx",
        "packages/ui/src/panels/PublicAssetBook.tsx",
        "packages/ui/src/panels/ReportCardOverlay.tsx",
        "packages/ui/src/panels/SettingsOverlay.tsx",
        "packages/ui/src/panels/StudyOverlay.tsx",
        "packages/ui/src/panels/StudyReport.tsx",
        "packages/ui/src/panels/Walkthrough.tsx",
        "packages/ui/src/panels/WireOverlay.tsx",
        "packages/ui/src/panels/cabinet/BlocRow.tsx",
        "packages/ui/src/panels/cabinet/CapacityRow.tsx",
        "packages/ui/src/panels/cabinet/DialRow.tsx",
        "packages/ui/src/panels/cabinet/IncidenceNote.tsx",
        "packages/ui/src/panels/cabinet/ReformRow.tsx",
        "packages/ui/src/panels/cabinet/SpendingRuleRow.tsx",
        "packages/ui/src/panels/cabinet/StatuteRow.tsx",
        "packages/ui/src/shell/useCabinetChrome.ts"
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
      "id": "packages/ui/src/components/ui/PhaseChart/PhaseChart.tsx",
      "label": "PhaseChart",
      "packageId": "ui",
      "category": "Components",
      "summary": "Two measured series plotted against each other, with a shaded corner.",
      "lines": 345,
      "exports": [
        {
          "name": "PhaseChartProps",
          "kind": "interface",
          "path": "packages/ui/src/components/ui/PhaseChart/PhaseChart.tsx",
          "line": 33
        },
        {
          "name": "PhaseChart",
          "kind": "function",
          "path": "packages/ui/src/components/ui/PhaseChart/PhaseChart.tsx",
          "line": 64
        }
      ],
      "imports": [
        "packages/ui/src/plot.ts"
      ],
      "importedBy": [
        "packages/ui/src/components/ui/index.ts"
      ],
      "path": "packages/ui/src/components/ui/PhaseChart/PhaseChart.tsx",
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
      "lines": 137,
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
          "line": 37
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
      "lines": 441,
      "exports": [
        {
          "name": "DRAFT_GROUP_IDS",
          "kind": "constant",
          "path": "packages/ui/src/countryDraft.ts",
          "line": 39
        },
        {
          "name": "DraftGroupId",
          "kind": "type",
          "path": "packages/ui/src/countryDraft.ts",
          "line": 40
        },
        {
          "name": "DRAFT_GROUPS",
          "kind": "constant",
          "path": "packages/ui/src/countryDraft.ts",
          "line": 44
        },
        {
          "name": "FieldFormat",
          "kind": "type",
          "path": "packages/ui/src/countryDraft.ts",
          "line": 72
        },
        {
          "name": "DraftField",
          "kind": "interface",
          "path": "packages/ui/src/countryDraft.ts",
          "line": 74
        },
        {
          "name": "DRAFT_FIELDS",
          "kind": "constant",
          "path": "packages/ui/src/countryDraft.ts",
          "line": 118
        },
        {
          "name": "fieldsInGroup",
          "kind": "constant",
          "path": "packages/ui/src/countryDraft.ts",
          "line": 226
        },
        {
          "name": "formatFieldValue",
          "kind": "function",
          "path": "packages/ui/src/countryDraft.ts",
          "line": 229
        },
        {
          "name": "readField",
          "kind": "function",
          "path": "packages/ui/src/countryDraft.ts",
          "line": 252
        },
        {
          "name": "writeField",
          "kind": "function",
          "path": "packages/ui/src/countryDraft.ts",
          "line": 271
        },
        {
          "name": "AGE_SHAPE_LABELS",
          "kind": "constant",
          "path": "packages/ui/src/countryDraft.ts",
          "line": 294
        },
        {
          "name": "draftFrom",
          "kind": "function",
          "path": "packages/ui/src/countryDraft.ts",
          "line": 319
        },
        {
          "name": "reviseDraft",
          "kind": "function",
          "path": "packages/ui/src/countryDraft.ts",
          "line": 331
        },
        {
          "name": "draftChanges",
          "kind": "function",
          "path": "packages/ui/src/countryDraft.ts",
          "line": 356
        },
        {
          "name": "draftPopulation",
          "kind": "constant",
          "path": "packages/ui/src/countryDraft.ts",
          "line": 369
        },
        {
          "name": "draftKey",
          "kind": "constant",
          "path": "packages/ui/src/countryDraft.ts",
          "line": 375
        },
        {
          "name": "SHARE_FRAGMENT_KEY",
          "kind": "constant",
          "path": "packages/ui/src/countryDraft.ts",
          "line": 384
        },
        {
          "name": "encodeShare",
          "kind": "constant",
          "path": "packages/ui/src/countryDraft.ts",
          "line": 400
        },
        {
          "name": "decodeShare",
          "kind": "function",
          "path": "packages/ui/src/countryDraft.ts",
          "line": 406
        },
        {
          "name": "sharedCountryFromUrl",
          "kind": "function",
          "path": "packages/ui/src/countryDraft.ts",
          "line": 424
        },
        {
          "name": "shareUrl",
          "kind": "function",
          "path": "packages/ui/src/countryDraft.ts",
          "line": 430
        },
        {
          "name": "shareFilename",
          "kind": "constant",
          "path": "packages/ui/src/countryDraft.ts",
          "line": 436
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
        "packages/ui/src/shell/useBootSequence.ts",
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
      "lines": 261,
      "exports": [
        {
          "name": "Domain",
          "kind": "interface",
          "path": "packages/ui/src/domains.ts",
          "line": 39
        },
        {
          "name": "Reading",
          "kind": "interface",
          "path": "packages/ui/src/domains.ts",
          "line": 45
        },
        {
          "name": "INDICATOR_FACE",
          "kind": "constant",
          "path": "packages/ui/src/domains.ts",
          "line": 58
        },
        {
          "name": "FACE_MARK",
          "kind": "constant",
          "path": "packages/ui/src/domains.ts",
          "line": 189
        },
        {
          "name": "niceBounds",
          "kind": "function",
          "path": "packages/ui/src/domains.ts",
          "line": 230
        },
        {
          "name": "gaugeDomain",
          "kind": "function",
          "path": "packages/ui/src/domains.ts",
          "line": 244
        },
        {
          "name": "readNeedle",
          "kind": "function",
          "path": "packages/ui/src/domains.ts",
          "line": 253
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
      "id": "packages/ui/src/finance.ts",
      "label": "finance",
      "packageId": "ui",
      "category": "UI core",
      "summary": "The financial system's arithmetic, out of the component.",
      "lines": 308,
      "exports": [
        {
          "name": "LEVERAGE_RAIL",
          "kind": "constant",
          "path": "packages/ui/src/finance.ts",
          "line": 44
        },
        {
          "name": "VALUATION_RAIL",
          "kind": "constant",
          "path": "packages/ui/src/finance.ts",
          "line": 45
        },
        {
          "name": "FINANCE_INDICATORS",
          "kind": "constant",
          "path": "packages/ui/src/finance.ts",
          "line": 48
        },
        {
          "name": "readSeries",
          "kind": "function",
          "path": "packages/ui/src/finance.ts",
          "line": 56
        },
        {
          "name": "tracePoints",
          "kind": "function",
          "path": "packages/ui/src/finance.ts",
          "line": 62
        },
        {
          "name": "CrisisEpisode",
          "kind": "interface",
          "path": "packages/ui/src/finance.ts",
          "line": 78
        },
        {
          "name": "crisisEpisodes",
          "kind": "function",
          "path": "packages/ui/src/finance.ts",
          "line": 86
        },
        {
          "name": "bubbleTicks",
          "kind": "function",
          "path": "packages/ui/src/finance.ts",
          "line": 105
        },
        {
          "name": "fragilityTrail",
          "kind": "function",
          "path": "packages/ui/src/finance.ts",
          "line": 118
        },
        {
          "name": "fragility",
          "kind": "function",
          "path": "packages/ui/src/finance.ts",
          "line": 140
        },
        {
          "name": "Standing",
          "kind": "type",
          "path": "packages/ui/src/finance.ts",
          "line": 144
        },
        {
          "name": "standingAt",
          "kind": "function",
          "path": "packages/ui/src/finance.ts",
          "line": 147
        },
        {
          "name": "STANDING_COPY",
          "kind": "constant",
          "path": "packages/ui/src/finance.ts",
          "line": 163
        },
        {
          "name": "StanceLine",
          "kind": "interface",
          "path": "packages/ui/src/finance.ts",
          "line": 189
        },
        {
          "name": "stanceLines",
          "kind": "function",
          "path": "packages/ui/src/finance.ts",
          "line": 238
        },
        {
          "name": "FinanceReading",
          "kind": "interface",
          "path": "packages/ui/src/finance.ts",
          "line": 254
        },
        {
          "name": "FLOOR_MARGIN",
          "kind": "constant",
          "path": "packages/ui/src/finance.ts",
          "line": 280
        },
        {
          "name": "readFinance",
          "kind": "function",
          "path": "packages/ui/src/finance.ts",
          "line": 282
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/observation/src/index.ts",
        "packages/ui/src/components/series.ts",
        "packages/ui/src/plot.ts"
      ],
      "importedBy": [
        "packages/ui/src/panels/FinanceOverlay.tsx"
      ],
      "path": "packages/ui/src/finance.ts",
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
      "id": "packages/ui/src/households.ts",
      "label": "households",
      "packageId": "ui",
      "category": "UI core",
      "summary": "The household-budget survey, arranged for reading.",
      "lines": 180,
      "exports": [
        {
          "name": "QUINTILE_FACE",
          "kind": "constant",
          "path": "packages/ui/src/households.ts",
          "line": 21
        },
        {
          "name": "HouseholdAvailability",
          "kind": "type",
          "path": "packages/ui/src/households.ts",
          "line": 57
        },
        {
          "name": "householdAvailability",
          "kind": "function",
          "path": "packages/ui/src/households.ts",
          "line": 59
        },
        {
          "name": "QuintileReading",
          "kind": "interface",
          "path": "packages/ui/src/households.ts",
          "line": 76
        },
        {
          "name": "HouseholdRelease",
          "kind": "interface",
          "path": "packages/ui/src/households.ts",
          "line": 90
        },
        {
          "name": "readHouseholds",
          "kind": "function",
          "path": "packages/ui/src/households.ts",
          "line": 103
        },
        {
          "name": "householdShares",
          "kind": "function",
          "path": "packages/ui/src/households.ts",
          "line": 129
        },
        {
          "name": "householdShareRows",
          "kind": "function",
          "path": "packages/ui/src/households.ts",
          "line": 140
        },
        {
          "name": "QuintileTrace",
          "kind": "interface",
          "path": "packages/ui/src/households.ts",
          "line": 150
        },
        {
          "name": "householdIncomeTraces",
          "kind": "function",
          "path": "packages/ui/src/households.ts",
          "line": 158
        },
        {
          "name": "latestIndicator",
          "kind": "function",
          "path": "packages/ui/src/households.ts",
          "line": 169
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/observation/src/index.ts",
        "packages/ui/src/plot.ts",
        "packages/ui/src/shares.ts"
      ],
      "importedBy": [
        "packages/ui/src/panels/HouseholdOverlay.tsx"
      ],
      "path": "packages/ui/src/households.ts",
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
        "packages/ui/src/panels/cabinet/DialRow.tsx",
        "packages/ui/src/panels/cabinet/IncidenceNote.tsx",
        "packages/ui/src/panels/cabinet/SpendingRuleRow.tsx"
      ],
      "path": "packages/ui/src/incidence.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/industry.ts",
      "label": "industry",
      "packageId": "ui",
      "category": "UI core",
      "summary": "The industrial census, arranged for reading — which industries make the economy, and who they employ.",
      "lines": 256,
      "exports": [
        {
          "name": "SECTOR_FACE",
          "kind": "constant",
          "path": "packages/ui/src/industry.ts",
          "line": 43
        },
        {
          "name": "IndustryLens",
          "kind": "type",
          "path": "packages/ui/src/industry.ts",
          "line": 75
        },
        {
          "name": "CensusAvailability",
          "kind": "type",
          "path": "packages/ui/src/industry.ts",
          "line": 90
        },
        {
          "name": "censusAvailability",
          "kind": "function",
          "path": "packages/ui/src/industry.ts",
          "line": 92
        },
        {
          "name": "IndustryReading",
          "kind": "interface",
          "path": "packages/ui/src/industry.ts",
          "line": 99
        },
        {
          "name": "IndustryRelease",
          "kind": "interface",
          "path": "packages/ui/src/industry.ts",
          "line": 127
        },
        {
          "name": "readIndustry",
          "kind": "function",
          "path": "packages/ui/src/industry.ts",
          "line": 158
        },
        {
          "name": "toShares",
          "kind": "function",
          "path": "packages/ui/src/industry.ts",
          "line": 204
        },
        {
          "name": "industryRows",
          "kind": "function",
          "path": "packages/ui/src/industry.ts",
          "line": 218
        },
        {
          "name": "GROWTH_MIN_QTRS",
          "kind": "constant",
          "path": "packages/ui/src/industry.ts",
          "line": 238
        },
        {
          "name": "industryGrowth",
          "kind": "function",
          "path": "packages/ui/src/industry.ts",
          "line": 240
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/observation/src/index.ts",
        "packages/ui/src/shares.ts"
      ],
      "importedBy": [
        "packages/ui/src/panels/IndustryOverlay.tsx"
      ],
      "path": "packages/ui/src/industry.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/layoutPreferences.ts",
      "label": "layoutPreferences",
      "packageId": "ui",
      "category": "UI core",
      "summary": "Browser-only layout preferences. These change how much of the war room is visible, never what the country does, so they live beside the wall pins in localStorage rather than in a save or the game store.",
      "lines": 28,
      "exports": [
        {
          "name": "CABINET_COLLAPSED_KEY",
          "kind": "constant",
          "path": "packages/ui/src/layoutPreferences.ts",
          "line": 7
        },
        {
          "name": "cabinetStartsCollapsed",
          "kind": "function",
          "path": "packages/ui/src/layoutPreferences.ts",
          "line": 12
        },
        {
          "name": "rememberCabinetCollapsed",
          "kind": "function",
          "path": "packages/ui/src/layoutPreferences.ts",
          "line": 20
        }
      ],
      "imports": [],
      "importedBy": [
        "packages/ui/src/shell/useCabinetChrome.ts"
      ],
      "path": "packages/ui/src/layoutPreferences.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/levers.ts",
      "label": "levers",
      "packageId": "ui",
      "category": "UI core",
      "summary": "What every lever on the desk actually does, in one place.",
      "lines": 315,
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
          "line": 184
        },
        {
          "name": "CAPACITY_COPY",
          "kind": "constant",
          "path": "packages/ui/src/levers.ts",
          "line": 195
        },
        {
          "name": "LeverGroupId",
          "kind": "type",
          "path": "packages/ui/src/levers.ts",
          "line": 239
        },
        {
          "name": "DrawerCopy",
          "kind": "interface",
          "path": "packages/ui/src/levers.ts",
          "line": 244
        },
        {
          "name": "LeverGroup",
          "kind": "interface",
          "path": "packages/ui/src/levers.ts",
          "line": 286
        },
        {
          "name": "LEVER_PATHS",
          "kind": "constant",
          "path": "packages/ui/src/levers.ts",
          "line": 292
        },
        {
          "name": "LEVER_GROUPS",
          "kind": "constant",
          "path": "packages/ui/src/levers.ts",
          "line": 303
        },
        {
          "name": "leverGroup",
          "kind": "function",
          "path": "packages/ui/src/levers.ts",
          "line": 312
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/ui/src/cabinetNavigation.ts",
        "packages/ui/src/components/labels.ts"
      ],
      "importedBy": [
        "packages/ui/src/manual.ts",
        "packages/ui/src/panels/cabinet/CapacityRow.tsx",
        "packages/ui/src/panels/cabinet/DialRow.tsx",
        "packages/ui/src/panels/cabinet/SpendingRuleRow.tsx",
        "packages/ui/src/panels/cabinet/dials.ts"
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
      "lines": 706,
      "exports": [
        {
          "name": "ManualEntry",
          "kind": "interface",
          "path": "packages/ui/src/manual.ts",
          "line": 86
        },
        {
          "name": "ManualSection",
          "kind": "interface",
          "path": "packages/ui/src/manual.ts",
          "line": 93
        },
        {
          "name": "MANUAL_CHAPTER_IDS",
          "kind": "constant",
          "path": "packages/ui/src/manual.ts",
          "line": 101
        },
        {
          "name": "ManualChapterId",
          "kind": "type",
          "path": "packages/ui/src/manual.ts",
          "line": 112
        },
        {
          "name": "ManualChapter",
          "kind": "interface",
          "path": "packages/ui/src/manual.ts",
          "line": 114
        },
        {
          "name": "MANUAL_CHAPTERS",
          "kind": "constant",
          "path": "packages/ui/src/manual.ts",
          "line": 634
        },
        {
          "name": "manualChapter",
          "kind": "function",
          "path": "packages/ui/src/manual.ts",
          "line": 638
        },
        {
          "name": "sectionAnchor",
          "kind": "function",
          "path": "packages/ui/src/manual.ts",
          "line": 652
        },
        {
          "name": "ManualHit",
          "kind": "interface",
          "path": "packages/ui/src/manual.ts",
          "line": 660
        },
        {
          "name": "searchManual",
          "kind": "function",
          "path": "packages/ui/src/manual.ts",
          "line": 680
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/observation/src/index.ts",
        "packages/ui/src/components/labels.ts",
        "packages/ui/src/gameRules.ts",
        "packages/ui/src/levers.ts",
        "packages/ui/src/maturity.ts",
        "packages/ui/src/statutes.ts",
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
        "packages/ui/src/panels/Instruments.tsx",
        "packages/ui/src/panels/cabinet/CapacityRow.tsx"
      ],
      "path": "packages/ui/src/maturity.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/newspaper.ts",
      "label": "newspaper",
      "packageId": "ui",
      "category": "UI core",
      "summary": "The paper: how a spike of dispatches becomes something a reader opens.",
      "lines": 226,
      "exports": [
        {
          "name": "DESK_ORDER",
          "kind": "constant",
          "path": "packages/ui/src/newspaper.ts",
          "line": 40
        },
        {
          "name": "Edition",
          "kind": "interface",
          "path": "packages/ui/src/newspaper.ts",
          "line": 46
        },
        {
          "name": "pageOrder",
          "kind": "function",
          "path": "packages/ui/src/newspaper.ts",
          "line": 69
        },
        {
          "name": "tickerHeadlines",
          "kind": "function",
          "path": "packages/ui/src/newspaper.ts",
          "line": 85
        },
        {
          "name": "editionTicks",
          "kind": "function",
          "path": "packages/ui/src/newspaper.ts",
          "line": 96
        },
        {
          "name": "editionAt",
          "kind": "function",
          "path": "packages/ui/src/newspaper.ts",
          "line": 104
        },
        {
          "name": "pageBands",
          "kind": "function",
          "path": "packages/ui/src/newspaper.ts",
          "line": 132
        },
        {
          "name": "latestEdition",
          "kind": "function",
          "path": "packages/ui/src/newspaper.ts",
          "line": 149
        },
        {
          "name": "adjacentEdition",
          "kind": "function",
          "path": "packages/ui/src/newspaper.ts",
          "line": 157
        },
        {
          "name": "ArchiveFilter",
          "kind": "interface",
          "path": "packages/ui/src/newspaper.ts",
          "line": 170
        },
        {
          "name": "archive",
          "kind": "function",
          "path": "packages/ui/src/newspaper.ts",
          "line": 180
        },
        {
          "name": "deskCounts",
          "kind": "function",
          "path": "packages/ui/src/newspaper.ts",
          "line": 200
        },
        {
          "name": "filedUnderCensorship",
          "kind": "function",
          "path": "packages/ui/src/newspaper.ts",
          "line": 215
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/observation/src/index.ts"
      ],
      "importedBy": [
        "packages/ui/src/panels/NewsWire.tsx",
        "packages/ui/src/panels/WireOverlay.tsx"
      ],
      "path": "packages/ui/src/newspaper.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/panels/AccountsOverlay.tsx",
      "label": "AccountsOverlay",
      "packageId": "ui",
      "category": "Panels",
      "summary": "The expenditure accounts, opened out — what the economy's output was FOR.",
      "lines": 297,
      "exports": [
        {
          "name": "AccountsOverlay",
          "kind": "function",
          "path": "packages/ui/src/panels/AccountsOverlay.tsx",
          "line": 72
        }
      ],
      "imports": [
        "packages/observation/src/index.ts",
        "packages/ui/src/accounts.ts",
        "packages/ui/src/budgetChart.ts",
        "packages/ui/src/components/series.ts",
        "packages/ui/src/components/ui/index.ts",
        "packages/ui/src/shares.ts",
        "packages/ui/src/stateFootprint.ts"
      ],
      "importedBy": [
        "packages/ui/src/App.tsx"
      ],
      "path": "packages/ui/src/panels/AccountsOverlay.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/panels/AtlasOverlay.tsx",
      "label": "AtlasOverlay",
      "packageId": "ui",
      "category": "Panels",
      "summary": "The engine atlas — the deepest floor of the same building the handbook is on.",
      "lines": 132,
      "exports": [
        {
          "name": "AtlasOverlay",
          "kind": "function",
          "path": "packages/ui/src/panels/AtlasOverlay.tsx",
          "line": 33
        }
      ],
      "imports": [
        "packages/ui/src/atlas.ts",
        "packages/ui/src/components/ui/index.ts",
        "packages/ui/src/panels/AtlasViews.tsx"
      ],
      "importedBy": [
        "packages/ui/src/App.tsx"
      ],
      "path": "packages/ui/src/panels/AtlasOverlay.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/panels/AtlasViews.tsx",
      "label": "AtlasViews",
      "packageId": "ui",
      "category": "Panels",
      "summary": "The atlas's three views, and the two links that stitch them together.",
      "lines": 501,
      "exports": [
        {
          "name": "PipelineView",
          "kind": "function",
          "path": "packages/ui/src/panels/AtlasViews.tsx",
          "line": 64
        },
        {
          "name": "SystemView",
          "kind": "function",
          "path": "packages/ui/src/panels/AtlasViews.tsx",
          "line": 182
        },
        {
          "name": "ModulesView",
          "kind": "function",
          "path": "packages/ui/src/panels/AtlasViews.tsx",
          "line": 314
        }
      ],
      "imports": [
        "packages/ui/src/atlas.ts",
        "packages/ui/src/components/ui/index.ts"
      ],
      "importedBy": [
        "packages/ui/src/panels/AtlasOverlay.tsx"
      ],
      "path": "packages/ui/src/panels/AtlasViews.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/panels/cabinet/BlocRow.tsx",
      "label": "BlocRow",
      "packageId": "ui",
      "category": "Panels",
      "summary": "The whip count. Bloc power is read off the economy each quarter, so this is a live picture of who is actually in the room — and the bar shows EFFECTIVE power, i.e. after an organised society's check, because that is the number that actually prices your levers. Alerts here use…",
      "lines": 44,
      "exports": [
        {
          "name": "BlocRow",
          "kind": "function",
          "path": "packages/ui/src/panels/cabinet/BlocRow.tsx",
          "line": 13
        }
      ],
      "imports": [
        "packages/observation/src/index.ts",
        "packages/ui/src/components/labels.ts",
        "packages/ui/src/components/ui/index.ts"
      ],
      "importedBy": [
        "packages/ui/src/panels/ControlRail.tsx"
      ],
      "path": "packages/ui/src/panels/cabinet/BlocRow.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/panels/cabinet/CapacityRow.tsx",
      "label": "CapacityRow",
      "packageId": "ui",
      "category": "Panels",
      "summary": "One capacity programme: eight quarters of funding for a ministry. The statistical office gets the extra line, because it is the one capacity whose return is an instrument appearing on the wall rather than a number moving.",
      "lines": 81,
      "exports": [
        {
          "name": "CapacityRow",
          "kind": "function",
          "path": "packages/ui/src/panels/cabinet/CapacityRow.tsx",
          "line": 15
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/observation/src/index.ts",
        "packages/ui/src/components/labels.ts",
        "packages/ui/src/components/ui/index.ts",
        "packages/ui/src/levers.ts",
        "packages/ui/src/maturity.ts",
        "packages/ui/src/store/gameStore.ts"
      ],
      "importedBy": [
        "packages/ui/src/panels/ControlRail.tsx"
      ],
      "path": "packages/ui/src/panels/cabinet/CapacityRow.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/panels/cabinet/DialRow.tsx",
      "label": "DialRow",
      "packageId": "ui",
      "category": "Panels",
      "summary": "An ordinary dial order: move the slider, see the delta, see who it reaches. The row stages an action rather than applying one — nothing here reaches the engine until the cabinet enacts.",
      "lines": 66,
      "exports": [
        {
          "name": "DialRow",
          "kind": "function",
          "path": "packages/ui/src/panels/cabinet/DialRow.tsx",
          "line": 15
        }
      ],
      "imports": [
        "packages/observation/src/index.ts",
        "packages/ui/src/components/ui/index.ts",
        "packages/ui/src/incidence.ts",
        "packages/ui/src/levers.ts",
        "packages/ui/src/panels/cabinet/IncidenceNote.tsx",
        "packages/ui/src/panels/cabinet/dials.ts",
        "packages/ui/src/store/gameStore.ts"
      ],
      "importedBy": [
        "packages/ui/src/panels/ControlRail.tsx"
      ],
      "path": "packages/ui/src/panels/cabinet/DialRow.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/panels/cabinet/dials.ts",
      "label": "dials",
      "packageId": "ui",
      "category": "Panels",
      "summary": "The slider's arithmetic — range, step, and how a reading is printed. This is the half of a dial that belongs to the control rather than to the policy, so it stays here; what the lever IS lives in `../../levers` beside the words the handbook prints about it.",
      "lines": 112,
      "exports": [
        {
          "name": "DialDef",
          "kind": "interface",
          "path": "packages/ui/src/panels/cabinet/dials.ts",
          "line": 23
        },
        {
          "name": "DialGroup",
          "kind": "interface",
          "path": "packages/ui/src/panels/cabinet/dials.ts",
          "line": 35
        },
        {
          "name": "DIALS",
          "kind": "constant",
          "path": "packages/ui/src/panels/cabinet/dials.ts",
          "line": 105
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/observation/src/index.ts",
        "packages/ui/src/cabinetNavigation.ts",
        "packages/ui/src/levers.ts",
        "packages/ui/src/panels/cabinet/format.ts"
      ],
      "importedBy": [
        "packages/ui/src/panels/ControlRail.tsx",
        "packages/ui/src/panels/cabinet/DialRow.tsx",
        "packages/ui/src/panels/cabinet/SpendingRuleRow.tsx"
      ],
      "path": "packages/ui/src/panels/cabinet/dials.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/panels/cabinet/format.ts",
      "label": "format",
      "packageId": "ui",
      "category": "Panels",
      "summary": "How a cabinet row prints a reading. These are the rail's own units — a rate as a percentage, an appropriation as cash — and they are shared by the dial mechanics beside them and by the rows that draw them.",
      "lines": 13,
      "exports": [
        {
          "name": "pct",
          "kind": "constant",
          "path": "packages/ui/src/panels/cabinet/format.ts",
          "line": 7
        },
        {
          "name": "pct1",
          "kind": "constant",
          "path": "packages/ui/src/panels/cabinet/format.ts",
          "line": 8
        },
        {
          "name": "pctSigned",
          "kind": "constant",
          "path": "packages/ui/src/panels/cabinet/format.ts",
          "line": 11
        },
        {
          "name": "money",
          "kind": "constant",
          "path": "packages/ui/src/panels/cabinet/format.ts",
          "line": 12
        }
      ],
      "imports": [],
      "importedBy": [
        "packages/ui/src/panels/cabinet/SpendingRuleRow.tsx",
        "packages/ui/src/panels/cabinet/dials.ts"
      ],
      "path": "packages/ui/src/panels/cabinet/format.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/panels/cabinet/IncidenceNote.tsx",
      "label": "IncidenceNote",
      "packageId": "ui",
      "category": "Panels",
      "summary": "Who a drafted programme change reaches, read off the ministry's own rules. Unfogged on purpose (see `../../incidence`): the schedule of claims is a thing the government wrote, so it owes no survey to know it. The money only — a preview of how households would FEEL about it wou…",
      "lines": 47,
      "exports": [
        {
          "name": "IncidenceNote",
          "kind": "function",
          "path": "packages/ui/src/panels/cabinet/IncidenceNote.tsx",
          "line": 13
        }
      ],
      "imports": [
        "packages/ui/src/components/labels.ts",
        "packages/ui/src/components/ui/index.ts",
        "packages/ui/src/incidence.ts"
      ],
      "importedBy": [
        "packages/ui/src/panels/cabinet/DialRow.tsx",
        "packages/ui/src/panels/cabinet/SpendingRuleRow.tsx"
      ],
      "path": "packages/ui/src/panels/cabinet/IncidenceNote.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/panels/cabinet/ReformRow.tsx",
      "label": "ReformRow",
      "packageId": "ui",
      "category": "Panels",
      "summary": "Institutional reforms are generational, ratcheting, and contested. The price on each button is what the engine will actually charge — veto premium and reform-window discount already in it — so the room's objection is legible before you pay.",
      "lines": 59,
      "exports": [
        {
          "name": "ReformRow",
          "kind": "function",
          "path": "packages/ui/src/panels/cabinet/ReformRow.tsx",
          "line": 12
        }
      ],
      "imports": [
        "packages/observation/src/index.ts",
        "packages/ui/src/components/labels.ts",
        "packages/ui/src/components/ui/index.ts",
        "packages/ui/src/store/gameStore.ts"
      ],
      "importedBy": [
        "packages/ui/src/panels/ControlRail.tsx"
      ],
      "path": "packages/ui/src/panels/cabinet/ReformRow.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/panels/cabinet/SpendingRuleRow.tsx",
      "label": "SpendingRuleRow",
      "packageId": "ui",
      "category": "Panels",
      "summary": "An appropriation, which is a rule rather than a number: fixed cash, indexed to the official inflation print, or a share of the officially published nominal GDP. The row shows the rule the cabinet has voted alongside what it resolves to this quarter, because those are different…",
      "lines": 137,
      "exports": [
        {
          "name": "SpendingRuleRow",
          "kind": "function",
          "path": "packages/ui/src/panels/cabinet/SpendingRuleRow.tsx",
          "line": 39
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/observation/src/index.ts",
        "packages/ui/src/components/ui/index.ts",
        "packages/ui/src/incidence.ts",
        "packages/ui/src/levers.ts",
        "packages/ui/src/panels/cabinet/IncidenceNote.tsx",
        "packages/ui/src/panels/cabinet/dials.ts",
        "packages/ui/src/panels/cabinet/format.ts",
        "packages/ui/src/spendingRules.ts",
        "packages/ui/src/store/gameStore.ts"
      ],
      "importedBy": [
        "packages/ui/src/panels/ControlRail.tsx"
      ],
      "path": "packages/ui/src/panels/cabinet/SpendingRuleRow.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/panels/cabinet/StatuteRow.tsx",
      "label": "StatuteRow",
      "packageId": "ui",
      "category": "Panels",
      "summary": "One statute on the books (ADR-0027).",
      "lines": 119,
      "exports": [
        {
          "name": "StatuteRow",
          "kind": "function",
          "path": "packages/ui/src/panels/cabinet/StatuteRow.tsx",
          "line": 23
        }
      ],
      "imports": [
        "packages/observation/src/index.ts",
        "packages/ui/src/components/labels.ts",
        "packages/ui/src/components/ui/index.ts",
        "packages/ui/src/statutes.ts",
        "packages/ui/src/store/gameStore.ts"
      ],
      "importedBy": [
        "packages/ui/src/panels/ControlRail.tsx"
      ],
      "path": "packages/ui/src/panels/cabinet/StatuteRow.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/panels/CensusOverlay.tsx",
      "label": "CensusOverlay",
      "packageId": "ui",
      "category": "Panels",
      "summary": "The national census — drill-down paperwork, not a home view. Two registers of knowledge sit side by side, and the difference is the whole fog mechanic: • the head count and the age pyramid are EXACT — census-grade, always yours, scrubbable across the whole century; • birth, de…",
      "lines": 502,
      "exports": [
        {
          "name": "CensusOverlay",
          "kind": "function",
          "path": "packages/ui/src/panels/CensusOverlay.tsx",
          "line": 370
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/observation/src/index.ts",
        "packages/ui/src/census.ts",
        "packages/ui/src/components/ui/index.ts",
        "packages/ui/src/plot.ts"
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
      "lines": 372,
      "exports": [
        {
          "name": "ControlRail",
          "kind": "function",
          "path": "packages/ui/src/panels/ControlRail.tsx",
          "line": 35
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/observation/src/index.ts",
        "packages/ui/src/cabinetNavigation.ts",
        "packages/ui/src/components/labels.ts",
        "packages/ui/src/components/ui/index.ts",
        "packages/ui/src/gameRules.ts",
        "packages/ui/src/panels/cabinet/BlocRow.tsx",
        "packages/ui/src/panels/cabinet/CapacityRow.tsx",
        "packages/ui/src/panels/cabinet/DialRow.tsx",
        "packages/ui/src/panels/cabinet/ReformRow.tsx",
        "packages/ui/src/panels/cabinet/SpendingRuleRow.tsx",
        "packages/ui/src/panels/cabinet/StatuteRow.tsx",
        "packages/ui/src/panels/cabinet/dials.ts",
        "packages/ui/src/statutes.ts",
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
      "lines": 644,
      "exports": [
        {
          "name": "CountrySelect",
          "kind": "function",
          "path": "packages/ui/src/panels/CountrySelect.tsx",
          "line": 327
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/ui/src/components/ProjectLinks/ProjectLinks.tsx",
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
      "summary": "The financial system: fogged market positions and private-bank buffers, exact policy minutes, and the central bank's own asset book. Crisis marks come from the wire even when the surveys behind a plot are unfunded.",
      "lines": 388,
      "exports": [
        {
          "name": "FinanceOverlay",
          "kind": "function",
          "path": "packages/ui/src/panels/FinanceOverlay.tsx",
          "line": 130
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/observation/src/index.ts",
        "packages/ui/src/components/labels.ts",
        "packages/ui/src/components/ui/index.ts",
        "packages/ui/src/components/ui/index.ts",
        "packages/ui/src/finance.ts",
        "packages/ui/src/panels/PublicAssetBook.tsx"
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
      "lines": 153,
      "exports": [
        {
          "name": "HeaderBar",
          "kind": "function",
          "path": "packages/ui/src/panels/HeaderBar.tsx",
          "line": 21
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
      "id": "packages/ui/src/panels/HouseholdOverlay.tsx",
      "label": "HouseholdOverlay",
      "packageId": "ui",
      "category": "Panels",
      "summary": "The Household Office — the distribution behind the poverty headline.",
      "lines": 232,
      "exports": [
        {
          "name": "HouseholdOverlay",
          "kind": "function",
          "path": "packages/ui/src/panels/HouseholdOverlay.tsx",
          "line": 42
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/observation/src/index.ts",
        "packages/ui/src/components/ui/index.ts",
        "packages/ui/src/households.ts"
      ],
      "importedBy": [
        "packages/ui/src/App.tsx"
      ],
      "path": "packages/ui/src/panels/HouseholdOverlay.tsx",
      "line": 1
    },
    {
      "id": "packages/ui/src/panels/IndustryOverlay.tsx",
      "label": "IndustryOverlay",
      "packageId": "ui",
      "category": "Panels",
      "summary": "The industrial census, opened out — what the economy is MADE of.",
      "lines": 266,
      "exports": [
        {
          "name": "IndustryOverlay",
          "kind": "function",
          "path": "packages/ui/src/panels/IndustryOverlay.tsx",
          "line": 71
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/observation/src/index.ts",
        "packages/ui/src/components/ui/index.ts",
        "packages/ui/src/industry.ts"
      ],
      "importedBy": [
        "packages/ui/src/App.tsx"
      ],
      "path": "packages/ui/src/panels/IndustryOverlay.tsx",
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
      "lines": 201,
      "exports": [
        {
          "name": "LedgerOverlay",
          "kind": "function",
          "path": "packages/ui/src/panels/LedgerOverlay.tsx",
          "line": 53
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/observation/src/index.ts",
        "packages/observation/src/index.ts",
        "packages/ui/src/budgetChart.ts",
        "packages/ui/src/components/ui/index.ts",
        "packages/ui/src/panels/PublicAssetBook.tsx",
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
      "lines": 63,
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
      "lines": 234,
      "exports": [
        {
          "name": "ManualOverlay",
          "kind": "function",
          "path": "packages/ui/src/panels/ManualOverlay.tsx",
          "line": 87
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
      "summary": "The ticker along the foot of the wall — teletype register (connecting tissue, neither dossier nor terminal). Rumor is the poor state's only instrument.",
      "lines": 73,
      "exports": [
        {
          "name": "NewsWire",
          "kind": "function",
          "path": "packages/ui/src/panels/NewsWire.tsx",
          "line": 40
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/observation/src/index.ts",
        "packages/ui/src/components/ui/index.ts",
        "packages/ui/src/newspaper.ts"
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
      "lines": 419,
      "exports": [
        {
          "name": "PolicyOverlay",
          "kind": "function",
          "path": "packages/ui/src/panels/PolicyOverlay.tsx",
          "line": 199
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
      "id": "packages/ui/src/panels/PublicAssetBook.tsx",
      "label": "PublicAssetBook",
      "packageId": "ui",
      "category": "Panels",
      "summary": "",
      "lines": 48,
      "exports": [
        {
          "name": "PublicAssetBook",
          "kind": "function",
          "path": "packages/ui/src/panels/PublicAssetBook.tsx",
          "line": 7
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/observation/src/index.ts",
        "packages/ui/src/components/ui/index.ts",
        "packages/ui/src/publicAssets.ts"
      ],
      "importedBy": [
        "packages/ui/src/panels/FinanceOverlay.tsx",
        "packages/ui/src/panels/LedgerOverlay.tsx"
      ],
      "path": "packages/ui/src/panels/PublicAssetBook.tsx",
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
      "lines": 114,
      "exports": [
        {
          "name": "SettingsOverlay",
          "kind": "function",
          "path": "packages/ui/src/panels/SettingsOverlay.tsx",
          "line": 10
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/observation/src/index.ts",
        "packages/ui/src/components/ProjectLinks/ProjectLinks.tsx",
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
      "summary": "The paper.",
      "lines": 362,
      "exports": [
        {
          "name": "WireOverlay",
          "kind": "function",
          "path": "packages/ui/src/panels/WireOverlay.tsx",
          "line": 338
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/observation/src/index.ts",
        "packages/ui/src/components/ui/index.ts",
        "packages/ui/src/newspaper.ts"
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
      "lines": 434,
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
        },
        {
          "name": "PhasePoint",
          "kind": "interface",
          "path": "packages/ui/src/plot.ts",
          "line": 354
        },
        {
          "name": "PhasePlot",
          "kind": "interface",
          "path": "packages/ui/src/plot.ts",
          "line": 360
        },
        {
          "name": "phasePlot",
          "kind": "function",
          "path": "packages/ui/src/plot.ts",
          "line": 385
        }
      ],
      "imports": [
        "packages/ui/src/shares.ts"
      ],
      "importedBy": [
        "packages/ui/src/census.ts",
        "packages/ui/src/components/ui/PhaseChart/PhaseChart.tsx",
        "packages/ui/src/components/ui/TimeSeriesChart/TimeSeriesChart.tsx",
        "packages/ui/src/finance.ts",
        "packages/ui/src/households.ts",
        "packages/ui/src/panels/CensusOverlay.tsx"
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
      "lines": 347,
      "exports": [
        {
          "name": "PolicyGroup",
          "kind": "type",
          "path": "packages/ui/src/policyRecord.ts",
          "line": 42
        },
        {
          "name": "PolicyUnit",
          "kind": "type",
          "path": "packages/ui/src/policyRecord.ts",
          "line": 61
        },
        {
          "name": "PolicyLine",
          "kind": "interface",
          "path": "packages/ui/src/policyRecord.ts",
          "line": 63
        },
        {
          "name": "statuteLevelName",
          "kind": "function",
          "path": "packages/ui/src/policyRecord.ts",
          "line": 123
        },
        {
          "name": "RULE_MODE_LABEL",
          "kind": "constant",
          "path": "packages/ui/src/policyRecord.ts",
          "line": 175
        },
        {
          "name": "POLICY_LINES",
          "kind": "constant",
          "path": "packages/ui/src/policyRecord.ts",
          "line": 185
        },
        {
          "name": "POLICY_LINES_BY_GROUP",
          "kind": "constant",
          "path": "packages/ui/src/policyRecord.ts",
          "line": 234
        },
        {
          "name": "PolicyChange",
          "kind": "interface",
          "path": "packages/ui/src/policyRecord.ts",
          "line": 246
        },
        {
          "name": "policyAt",
          "kind": "function",
          "path": "packages/ui/src/policyRecord.ts",
          "line": 274
        },
        {
          "name": "policyChanges",
          "kind": "function",
          "path": "packages/ui/src/policyRecord.ts",
          "line": 290
        },
        {
          "name": "formatPolicyValue",
          "kind": "function",
          "path": "packages/ui/src/policyRecord.ts",
          "line": 334
        },
        {
          "name": "formatRuleValue",
          "kind": "function",
          "path": "packages/ui/src/policyRecord.ts",
          "line": 344
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
      "id": "packages/ui/src/publicAssets.ts",
      "label": "publicAssets",
      "packageId": "ui",
      "category": "UI core",
      "summary": "Government-owned assets are exact books, not survey estimates. Keep each stock on its own face: the sovereign fund cannot be spent defending the currency.",
      "lines": 32,
      "exports": [
        {
          "name": "PublicAssetLine",
          "kind": "interface",
          "path": "packages/ui/src/publicAssets.ts",
          "line": 5
        },
        {
          "name": "publicAssetLines",
          "kind": "function",
          "path": "packages/ui/src/publicAssets.ts",
          "line": 13
        }
      ],
      "imports": [
        "packages/observation/src/index.ts"
      ],
      "importedBy": [
        "packages/ui/src/panels/PublicAssetBook.tsx"
      ],
      "path": "packages/ui/src/publicAssets.ts",
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
        "packages/ui/src/budgetChart.ts",
        "packages/ui/src/census.ts",
        "packages/ui/src/components/ui/DonutChart/DonutChart.tsx",
        "packages/ui/src/components/ui/StackedAreaChart/StackedAreaChart.tsx",
        "packages/ui/src/dev/ComponentGallery.tsx",
        "packages/ui/src/households.ts",
        "packages/ui/src/industry.ts",
        "packages/ui/src/panels/AccountsOverlay.tsx",
        "packages/ui/src/panels/LedgerOverlay.tsx",
        "packages/ui/src/panels/PolicyOverlay.tsx",
        "packages/ui/src/plot.ts"
      ],
      "path": "packages/ui/src/shares.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/shell/useBootSequence.ts",
      "label": "useBootSequence",
      "packageId": "ui",
      "category": "UI core",
      "summary": "How a session starts. Exactly one of four things happens on mount: a visual test asks for a named seed, a shared country arrives in the fragment, an autosave is found, or the posting room opens. `startup` is which of those is still outstanding — the war room shows the splash s…",
      "lines": 49,
      "exports": [
        {
          "name": "useBootSequence",
          "kind": "function",
          "path": "packages/ui/src/shell/useBootSequence.ts",
          "line": 14
        }
      ],
      "imports": [
        "packages/ui/src/countryDraft.ts",
        "packages/ui/src/store/gameStore.ts"
      ],
      "importedBy": [
        "packages/ui/src/App.tsx"
      ],
      "path": "packages/ui/src/shell/useBootSequence.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/shell/useCabinetChrome.ts",
      "label": "useCabinetChrome",
      "packageId": "ui",
      "category": "UI core",
      "summary": "The cabinet's chrome — whether the drawer is open, whether the desktop rail is collapsed, which drawer is showing, and where keyboard focus goes when any of that changes. None of it belongs to a run: the collapse is a preference of this BROWSER, kept beside the wall pins in lo…",
      "lines": 84,
      "exports": [
        {
          "name": "useCabinetChrome",
          "kind": "function",
          "path": "packages/ui/src/shell/useCabinetChrome.ts",
          "line": 18
        }
      ],
      "imports": [
        "packages/ui/src/cabinetNavigation.ts",
        "packages/ui/src/components/ui/index.ts",
        "packages/ui/src/layoutPreferences.ts"
      ],
      "importedBy": [
        "packages/ui/src/App.tsx"
      ],
      "path": "packages/ui/src/shell/useCabinetChrome.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/shell/useGlobalShortcuts.ts",
      "label": "useGlobalShortcuts",
      "packageId": "ui",
      "category": "UI core",
      "summary": "The keys that work anywhere in the war room. A century is four hundred quarters; making the player travel to a button four hundred times is a tax on the only verb the game has. Space advances, Escape closes whatever paperwork is on the desk, and backtick opens the maintenance…",
      "lines": 60,
      "exports": [
        {
          "name": "useGlobalShortcuts",
          "kind": "function",
          "path": "packages/ui/src/shell/useGlobalShortcuts.ts",
          "line": 14
        }
      ],
      "imports": [
        "packages/ui/src/store/gameStore.ts"
      ],
      "importedBy": [
        "packages/ui/src/App.tsx"
      ],
      "path": "packages/ui/src/shell/useGlobalShortcuts.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/shell/useSceneOverlays.ts",
      "label": "useSceneOverlays",
      "packageId": "ui",
      "category": "UI core",
      "summary": "The three overlays that come to the player rather than waiting to be found: the verdict when a run ends, the campaign when an election becomes available, and the count when the votes are in.",
      "lines": 60,
      "exports": [
        {
          "name": "useSceneOverlays",
          "kind": "function",
          "path": "packages/ui/src/shell/useSceneOverlays.ts",
          "line": 18
        }
      ],
      "imports": [
        "packages/observation/src/index.ts"
      ],
      "importedBy": [
        "packages/ui/src/App.tsx"
      ],
      "path": "packages/ui/src/shell/useSceneOverlays.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/spendingRules.ts",
      "label": "spendingRules",
      "packageId": "ui",
      "category": "UI core",
      "summary": "Pure UI arithmetic for the cabinet's recurring expenditure controls.",
      "lines": 77,
      "exports": [
        {
          "name": "OfficialNominalGdp",
          "kind": "interface",
          "path": "packages/ui/src/spendingRules.ts",
          "line": 13
        },
        {
          "name": "officialNominalGdpByQuarter",
          "kind": "function",
          "path": "packages/ui/src/spendingRules.ts",
          "line": 26
        },
        {
          "name": "latestOfficialNominalGdp",
          "kind": "function",
          "path": "packages/ui/src/spendingRules.ts",
          "line": 40
        },
        {
          "name": "equivalentRuleValue",
          "kind": "function",
          "path": "packages/ui/src/spendingRules.ts",
          "line": 49
        },
        {
          "name": "currentRuleValue",
          "kind": "function",
          "path": "packages/ui/src/spendingRules.ts",
          "line": 60
        },
        {
          "name": "proposedSpending",
          "kind": "function",
          "path": "packages/ui/src/spendingRules.ts",
          "line": 68
        }
      ],
      "imports": [
        "packages/engine/src/index.ts",
        "packages/observation/src/index.ts"
      ],
      "importedBy": [
        "packages/ui/src/panels/cabinet/SpendingRuleRow.tsx",
        "packages/ui/src/stateFootprint.ts"
      ],
      "path": "packages/ui/src/spendingRules.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/stateFootprint.ts",
      "label": "stateFootprint",
      "packageId": "ui",
      "category": "UI core",
      "summary": "How big the state is — the treasury's exact books read against the office's estimate of the economy they sit inside.",
      "lines": 116,
      "exports": [
        {
          "name": "FootprintPoint",
          "kind": "interface",
          "path": "packages/ui/src/stateFootprint.ts",
          "line": 46
        },
        {
          "name": "StateFootprint",
          "kind": "interface",
          "path": "packages/ui/src/stateFootprint.ts",
          "line": 61
        },
        {
          "name": "stateFootprint",
          "kind": "function",
          "path": "packages/ui/src/stateFootprint.ts",
          "line": 77
        },
        {
          "name": "footprintSeries",
          "kind": "function",
          "path": "packages/ui/src/stateFootprint.ts",
          "line": 102
        },
        {
          "name": "programmeRows",
          "kind": "function",
          "path": "packages/ui/src/stateFootprint.ts",
          "line": 111
        }
      ],
      "imports": [
        "packages/observation/src/index.ts",
        "packages/ui/src/budgetChart.ts",
        "packages/ui/src/spendingRules.ts"
      ],
      "importedBy": [
        "packages/ui/src/panels/AccountsOverlay.tsx"
      ],
      "path": "packages/ui/src/stateFootprint.ts",
      "line": 1
    },
    {
      "id": "packages/ui/src/statutes.ts",
      "label": "statutes",
      "packageId": "ui",
      "category": "UI core",
      "summary": "What every statute on the books actually does, in one place — the statute book's answer to `levers.ts`, and written for the same reason.",
      "lines": 93,
      "exports": [
        {
          "name": "StatuteCopy",
          "kind": "interface",
          "path": "packages/ui/src/statutes.ts",
          "line": 26
        },
        {
          "name": "STATUTE_COPY",
          "kind": "constant",
          "path": "packages/ui/src/statutes.ts",
          "line": 38
        },
        {
          "name": "STATUTE_DRAWER",
          "kind": "constant",
          "path": "packages/ui/src/statutes.ts",
          "line": 76
        },
        {
          "name": "complianceNote",
          "kind": "function",
          "path": "packages/ui/src/statutes.ts",
          "line": 87
        }
      ],
      "imports": [
        "packages/observation/src/index.ts"
      ],
      "importedBy": [
        "packages/ui/src/manual.ts",
        "packages/ui/src/panels/ControlRail.tsx",
        "packages/ui/src/panels/cabinet/StatuteRow.tsx"
      ],
      "path": "packages/ui/src/statutes.ts",
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
      "lines": 371,
      "exports": [
        {
          "name": "useGame",
          "kind": "constant",
          "path": "packages/ui/src/store/gameStore.ts",
          "line": 127
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
        "packages/ui/src/panels/SettingsOverlay.tsx",
        "packages/ui/src/panels/cabinet/CapacityRow.tsx",
        "packages/ui/src/panels/cabinet/DialRow.tsx",
        "packages/ui/src/panels/cabinet/ReformRow.tsx",
        "packages/ui/src/panels/cabinet/SpendingRuleRow.tsx",
        "packages/ui/src/panels/cabinet/StatuteRow.tsx",
        "packages/ui/src/shell/useBootSequence.ts",
        "packages/ui/src/shell/useGlobalShortcuts.ts"
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
      "lines": 344,
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
      "target": "packages/engine/src/events/file.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/actions/apply.ts",
      "target": "packages/engine/src/events/ids.ts",
      "typeOnly": true
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
      "target": "packages/engine/src/actions/types.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/constants.ts",
      "target": "packages/engine/src/state/schema.ts",
      "typeOnly": false
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
      "source": "packages/engine/src/events/catalogue.ts",
      "target": "packages/engine/src/events/eras.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/events/catalogue.ts",
      "target": "packages/engine/src/events/ids.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/events/catalogue.ts",
      "target": "packages/engine/src/state/schema.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/events/conditions.ts",
      "target": "packages/engine/src/constants.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/events/conditions.ts",
      "target": "packages/engine/src/events/eras.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/events/conditions.ts",
      "target": "packages/engine/src/events/file.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/events/conditions.ts",
      "target": "packages/engine/src/events/ids.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/events/conditions.ts",
      "target": "packages/engine/src/pipeline/derive.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/events/conditions.ts",
      "target": "packages/engine/src/rng/rng.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/events/conditions.ts",
      "target": "packages/engine/src/state/schema.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/events/eras.ts",
      "target": "packages/engine/src/events/ids.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/events/eras.ts",
      "target": "packages/engine/src/state/schema.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/events/file.ts",
      "target": "packages/engine/src/constants.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/events/file.ts",
      "target": "packages/engine/src/events/catalogue.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/events/file.ts",
      "target": "packages/engine/src/events/eras.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/events/file.ts",
      "target": "packages/engine/src/events/ids.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/events/file.ts",
      "target": "packages/engine/src/rng/rng.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/events/file.ts",
      "target": "packages/engine/src/state/schema.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/events/index.ts",
      "target": "packages/engine/src/events/catalogue.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/events/index.ts",
      "target": "packages/engine/src/events/catalogue.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/events/index.ts",
      "target": "packages/engine/src/events/conditions.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/events/index.ts",
      "target": "packages/engine/src/events/conditions.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/events/index.ts",
      "target": "packages/engine/src/events/eras.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/events/index.ts",
      "target": "packages/engine/src/events/eras.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/events/index.ts",
      "target": "packages/engine/src/events/file.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/events/index.ts",
      "target": "packages/engine/src/events/ids.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/events/index.ts",
      "target": "packages/engine/src/events/ids.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/humanDevelopment.ts",
      "target": "packages/engine/src/constants.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/humanDevelopment.ts",
      "target": "packages/engine/src/math.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/humanDevelopment.ts",
      "target": "packages/engine/src/state/schema.ts",
      "typeOnly": true
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
      "target": "packages/engine/src/constants.ts",
      "typeOnly": true
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
      "target": "packages/engine/src/events/catalogue.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/index.ts",
      "target": "packages/engine/src/events/catalogue.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/index.ts",
      "target": "packages/engine/src/events/conditions.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/index.ts",
      "target": "packages/engine/src/events/conditions.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/index.ts",
      "target": "packages/engine/src/events/eras.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/index.ts",
      "target": "packages/engine/src/events/eras.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/index.ts",
      "target": "packages/engine/src/events/file.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/index.ts",
      "target": "packages/engine/src/events/ids.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/index.ts",
      "target": "packages/engine/src/events/ids.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/index.ts",
      "target": "packages/engine/src/hash.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/index.ts",
      "target": "packages/engine/src/humanDevelopment.ts",
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
      "target": "packages/engine/src/pipeline/environment.ts",
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
      "target": "packages/engine/src/pipeline/shocks.ts",
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
      "target": "packages/engine/src/pipeline/trade.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/index.ts",
      "target": "packages/engine/src/pipeline/trade.ts",
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
      "target": "packages/engine/src/pipeline/staffing.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/derive.ts",
      "target": "packages/engine/src/state/schema.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/environment.ts",
      "target": "packages/engine/src/constants.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/environment.ts",
      "target": "packages/engine/src/pipeline/derive.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/environment.ts",
      "target": "packages/engine/src/pipeline/pipeline.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/pipeline/environment.ts",
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
      "target": "packages/engine/src/events/file.ts",
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
      "source": "packages/engine/src/pipeline/finance.ts",
      "target": "packages/engine/src/state/spending.ts",
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
      "source": "packages/engine/src/pipeline/indicatorSpecs.ts",
      "target": "packages/engine/src/state/schema.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/pipeline/institutions.ts",
      "target": "packages/engine/src/constants.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/institutions.ts",
      "target": "packages/engine/src/events/file.ts",
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
      "target": "packages/engine/src/pipeline/environment.ts",
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
      "target": "packages/engine/src/events/file.ts",
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
      "target": "packages/engine/src/events/file.ts",
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
      "source": "packages/engine/src/pipeline/staffing.ts",
      "target": "packages/engine/src/constants.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/staffing.ts",
      "target": "packages/engine/src/math.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/staffing.ts",
      "target": "packages/engine/src/state/schema.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/statistics.ts",
      "target": "packages/engine/src/constants.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/statistics.ts",
      "target": "packages/engine/src/events/conditions.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/statistics.ts",
      "target": "packages/engine/src/humanDevelopment.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/statistics.ts",
      "target": "packages/engine/src/math.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/statistics.ts",
      "target": "packages/engine/src/pipeline/derive.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/statistics.ts",
      "target": "packages/engine/src/pipeline/indicatorSpecs.ts",
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
      "target": "packages/engine/src/state/accounts.ts",
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
      "target": "packages/engine/src/events/file.ts",
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
      "target": "packages/engine/src/events/file.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/trade.ts",
      "target": "packages/engine/src/math.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/trade.ts",
      "target": "packages/engine/src/pipeline/derive.ts",
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
      "target": "packages/engine/src/events/file.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/pipeline/world.ts",
      "target": "packages/engine/src/events/ids.ts",
      "typeOnly": true
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
      "source": "packages/engine/src/state/accounts.ts",
      "target": "packages/engine/src/state/schema.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/state/finance.ts",
      "target": "packages/engine/src/constants.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/state/finance.ts",
      "target": "packages/engine/src/state/schema.ts",
      "typeOnly": true
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
      "target": "packages/engine/src/pipeline/derive.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/state/init.ts",
      "target": "packages/engine/src/pipeline/environment.ts",
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
      "target": "packages/engine/src/state/finance.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/state/init.ts",
      "target": "packages/engine/src/state/schema.ts",
      "typeOnly": false
    },
    {
      "source": "packages/engine/src/state/schema.ts",
      "target": "packages/engine/src/events/ids.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/state/schema.ts",
      "target": "packages/engine/src/rng/rng.ts",
      "typeOnly": true
    },
    {
      "source": "packages/engine/src/state/schema.ts",
      "target": "packages/engine/src/state/finance.ts",
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
      "target": "packages/engine/src/pipeline/derive.ts",
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
      "source": "packages/observation/src/dataExport.ts",
      "target": "packages/engine/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/observation/src/dataExport.ts",
      "target": "packages/observation/src/published.ts",
      "typeOnly": false
    },
    {
      "source": "packages/observation/src/index.ts",
      "target": "packages/observation/src/dataExport.ts",
      "typeOnly": false
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
      "target": "packages/engine/src/state/accounts.ts",
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
      "source": "packages/runner/src/country-fuzz-artifacts.ts",
      "target": "packages/runner/src/country-fuzz.ts",
      "typeOnly": true
    },
    {
      "source": "packages/runner/src/country-fuzz-cli.ts",
      "target": "packages/runner/src/country-fuzz-artifacts.ts",
      "typeOnly": false
    },
    {
      "source": "packages/runner/src/country-fuzz-cli.ts",
      "target": "packages/runner/src/country-fuzz.ts",
      "typeOnly": false
    },
    {
      "source": "packages/runner/src/country-fuzz-cli.ts",
      "target": "packages/runner/src/metrics.ts",
      "typeOnly": false
    },
    {
      "source": "packages/runner/src/country-fuzz-cli.ts",
      "target": "packages/runner/src/policies.ts",
      "typeOnly": false
    },
    {
      "source": "packages/runner/src/country-fuzz.ts",
      "target": "packages/engine/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/runner/src/country-fuzz.ts",
      "target": "packages/runner/src/policies.ts",
      "typeOnly": false
    },
    {
      "source": "packages/runner/src/country-fuzz.ts",
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
      "target": "packages/ui/src/panels/AtlasOverlay.tsx",
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
      "target": "packages/ui/src/panels/HouseholdOverlay.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/App.tsx",
      "target": "packages/ui/src/panels/IndustryOverlay.tsx",
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
      "target": "packages/ui/src/shell/useBootSequence.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/App.tsx",
      "target": "packages/ui/src/shell/useCabinetChrome.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/App.tsx",
      "target": "packages/ui/src/shell/useGlobalShortcuts.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/App.tsx",
      "target": "packages/ui/src/shell/useSceneOverlays.ts",
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
      "source": "packages/ui/src/atlas.ts",
      "target": "packages/ui/src/components/ProjectLinks/links.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/budgetChart.ts",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/budgetChart.ts",
      "target": "packages/ui/src/shares.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/census.ts",
      "target": "packages/engine/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/census.ts",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/census.ts",
      "target": "packages/ui/src/plot.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/census.ts",
      "target": "packages/ui/src/shares.ts",
      "typeOnly": false
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
      "source": "packages/ui/src/components/ProjectLinks/ProjectLinks.tsx",
      "target": "packages/ui/src/components/ProjectLinks/links.ts",
      "typeOnly": false
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
      "target": "packages/ui/src/components/ui/PhaseChart/PhaseChart.tsx",
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
      "source": "packages/ui/src/components/ui/PhaseChart/PhaseChart.tsx",
      "target": "packages/ui/src/plot.ts",
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
      "source": "packages/ui/src/finance.ts",
      "target": "packages/engine/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/finance.ts",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/finance.ts",
      "target": "packages/ui/src/components/series.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/finance.ts",
      "target": "packages/ui/src/plot.ts",
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
      "source": "packages/ui/src/households.ts",
      "target": "packages/engine/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/households.ts",
      "target": "packages/observation/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/households.ts",
      "target": "packages/ui/src/plot.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/households.ts",
      "target": "packages/ui/src/shares.ts",
      "typeOnly": false
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
      "source": "packages/ui/src/industry.ts",
      "target": "packages/engine/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/industry.ts",
      "target": "packages/observation/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/industry.ts",
      "target": "packages/ui/src/shares.ts",
      "typeOnly": false
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
      "target": "packages/ui/src/statutes.ts",
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
      "source": "packages/ui/src/newspaper.ts",
      "target": "packages/engine/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/newspaper.ts",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
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
      "target": "packages/ui/src/budgetChart.ts",
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
      "source": "packages/ui/src/panels/AccountsOverlay.tsx",
      "target": "packages/ui/src/shares.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/panels/AccountsOverlay.tsx",
      "target": "packages/ui/src/stateFootprint.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/AtlasOverlay.tsx",
      "target": "packages/ui/src/atlas.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/AtlasOverlay.tsx",
      "target": "packages/ui/src/components/ui/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/AtlasOverlay.tsx",
      "target": "packages/ui/src/panels/AtlasViews.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/AtlasViews.tsx",
      "target": "packages/ui/src/atlas.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/AtlasViews.tsx",
      "target": "packages/ui/src/components/ui/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/cabinet/BlocRow.tsx",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/panels/cabinet/BlocRow.tsx",
      "target": "packages/ui/src/components/labels.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/cabinet/BlocRow.tsx",
      "target": "packages/ui/src/components/ui/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/cabinet/CapacityRow.tsx",
      "target": "packages/engine/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/cabinet/CapacityRow.tsx",
      "target": "packages/observation/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/cabinet/CapacityRow.tsx",
      "target": "packages/ui/src/components/labels.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/cabinet/CapacityRow.tsx",
      "target": "packages/ui/src/components/ui/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/cabinet/CapacityRow.tsx",
      "target": "packages/ui/src/levers.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/cabinet/CapacityRow.tsx",
      "target": "packages/ui/src/maturity.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/cabinet/CapacityRow.tsx",
      "target": "packages/ui/src/store/gameStore.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/cabinet/DialRow.tsx",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/panels/cabinet/DialRow.tsx",
      "target": "packages/ui/src/components/ui/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/cabinet/DialRow.tsx",
      "target": "packages/ui/src/incidence.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/cabinet/DialRow.tsx",
      "target": "packages/ui/src/levers.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/cabinet/DialRow.tsx",
      "target": "packages/ui/src/panels/cabinet/dials.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/panels/cabinet/DialRow.tsx",
      "target": "packages/ui/src/panels/cabinet/IncidenceNote.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/cabinet/DialRow.tsx",
      "target": "packages/ui/src/store/gameStore.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/cabinet/dials.ts",
      "target": "packages/engine/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/cabinet/dials.ts",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/panels/cabinet/dials.ts",
      "target": "packages/ui/src/cabinetNavigation.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/panels/cabinet/dials.ts",
      "target": "packages/ui/src/levers.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/cabinet/dials.ts",
      "target": "packages/ui/src/panels/cabinet/format.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/cabinet/IncidenceNote.tsx",
      "target": "packages/ui/src/components/labels.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/cabinet/IncidenceNote.tsx",
      "target": "packages/ui/src/components/ui/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/cabinet/IncidenceNote.tsx",
      "target": "packages/ui/src/incidence.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/panels/cabinet/ReformRow.tsx",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/panels/cabinet/ReformRow.tsx",
      "target": "packages/ui/src/components/labels.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/cabinet/ReformRow.tsx",
      "target": "packages/ui/src/components/ui/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/cabinet/ReformRow.tsx",
      "target": "packages/ui/src/store/gameStore.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/cabinet/SpendingRuleRow.tsx",
      "target": "packages/engine/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/panels/cabinet/SpendingRuleRow.tsx",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/panels/cabinet/SpendingRuleRow.tsx",
      "target": "packages/ui/src/components/ui/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/cabinet/SpendingRuleRow.tsx",
      "target": "packages/ui/src/incidence.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/cabinet/SpendingRuleRow.tsx",
      "target": "packages/ui/src/levers.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/cabinet/SpendingRuleRow.tsx",
      "target": "packages/ui/src/panels/cabinet/dials.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/panels/cabinet/SpendingRuleRow.tsx",
      "target": "packages/ui/src/panels/cabinet/format.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/cabinet/SpendingRuleRow.tsx",
      "target": "packages/ui/src/panels/cabinet/IncidenceNote.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/cabinet/SpendingRuleRow.tsx",
      "target": "packages/ui/src/spendingRules.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/cabinet/SpendingRuleRow.tsx",
      "target": "packages/ui/src/store/gameStore.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/cabinet/StatuteRow.tsx",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/panels/cabinet/StatuteRow.tsx",
      "target": "packages/ui/src/components/labels.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/cabinet/StatuteRow.tsx",
      "target": "packages/ui/src/components/ui/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/cabinet/StatuteRow.tsx",
      "target": "packages/ui/src/statutes.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/cabinet/StatuteRow.tsx",
      "target": "packages/ui/src/store/gameStore.ts",
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
      "target": "packages/ui/src/census.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/CensusOverlay.tsx",
      "target": "packages/ui/src/components/ui/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/CensusOverlay.tsx",
      "target": "packages/ui/src/plot.ts",
      "typeOnly": true
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
      "target": "packages/ui/src/panels/cabinet/BlocRow.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/ControlRail.tsx",
      "target": "packages/ui/src/panels/cabinet/CapacityRow.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/ControlRail.tsx",
      "target": "packages/ui/src/panels/cabinet/DialRow.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/ControlRail.tsx",
      "target": "packages/ui/src/panels/cabinet/dials.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/ControlRail.tsx",
      "target": "packages/ui/src/panels/cabinet/ReformRow.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/ControlRail.tsx",
      "target": "packages/ui/src/panels/cabinet/SpendingRuleRow.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/ControlRail.tsx",
      "target": "packages/ui/src/panels/cabinet/StatuteRow.tsx",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/ControlRail.tsx",
      "target": "packages/ui/src/statutes.ts",
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
      "target": "packages/ui/src/components/ProjectLinks/ProjectLinks.tsx",
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
      "target": "packages/engine/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/FinanceOverlay.tsx",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/panels/FinanceOverlay.tsx",
      "target": "packages/ui/src/components/labels.ts",
      "typeOnly": false
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
      "source": "packages/ui/src/panels/FinanceOverlay.tsx",
      "target": "packages/ui/src/finance.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/FinanceOverlay.tsx",
      "target": "packages/ui/src/panels/PublicAssetBook.tsx",
      "typeOnly": false
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
      "source": "packages/ui/src/panels/HouseholdOverlay.tsx",
      "target": "packages/engine/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/HouseholdOverlay.tsx",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/panels/HouseholdOverlay.tsx",
      "target": "packages/ui/src/components/ui/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/HouseholdOverlay.tsx",
      "target": "packages/ui/src/households.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/IndustryOverlay.tsx",
      "target": "packages/engine/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/IndustryOverlay.tsx",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/panels/IndustryOverlay.tsx",
      "target": "packages/ui/src/components/ui/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/IndustryOverlay.tsx",
      "target": "packages/ui/src/industry.ts",
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
      "target": "packages/engine/src/index.ts",
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
      "target": "packages/ui/src/panels/PublicAssetBook.tsx",
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
      "target": "packages/engine/src/index.ts",
      "typeOnly": true
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
      "source": "packages/ui/src/panels/NewsWire.tsx",
      "target": "packages/ui/src/newspaper.ts",
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
      "source": "packages/ui/src/panels/PublicAssetBook.tsx",
      "target": "packages/engine/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/PublicAssetBook.tsx",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/panels/PublicAssetBook.tsx",
      "target": "packages/ui/src/components/ui/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/PublicAssetBook.tsx",
      "target": "packages/ui/src/publicAssets.ts",
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
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/panels/SettingsOverlay.tsx",
      "target": "packages/ui/src/components/ProjectLinks/ProjectLinks.tsx",
      "typeOnly": false
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
      "target": "packages/engine/src/index.ts",
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
      "source": "packages/ui/src/panels/WireOverlay.tsx",
      "target": "packages/ui/src/newspaper.ts",
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
      "source": "packages/ui/src/publicAssets.ts",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/saveFile.ts",
      "target": "packages/engine/src/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/shell/useBootSequence.ts",
      "target": "packages/ui/src/countryDraft.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/shell/useBootSequence.ts",
      "target": "packages/ui/src/store/gameStore.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/shell/useCabinetChrome.ts",
      "target": "packages/ui/src/cabinetNavigation.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/shell/useCabinetChrome.ts",
      "target": "packages/ui/src/components/ui/index.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/shell/useCabinetChrome.ts",
      "target": "packages/ui/src/layoutPreferences.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/shell/useGlobalShortcuts.ts",
      "target": "packages/ui/src/store/gameStore.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/shell/useSceneOverlays.ts",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
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
      "source": "packages/ui/src/stateFootprint.ts",
      "target": "packages/observation/src/index.ts",
      "typeOnly": true
    },
    {
      "source": "packages/ui/src/stateFootprint.ts",
      "target": "packages/ui/src/budgetChart.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/stateFootprint.ts",
      "target": "packages/ui/src/spendingRules.ts",
      "typeOnly": false
    },
    {
      "source": "packages/ui/src/statutes.ts",
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
      "count": 5,
      "typeOnlyCount": 1
    },
    {
      "source": "runner",
      "target": "engine",
      "count": 9,
      "typeOnlyCount": 1
    },
    {
      "source": "ui",
      "target": "engine",
      "count": 41,
      "typeOnlyCount": 8
    },
    {
      "source": "ui",
      "target": "observation",
      "count": 60,
      "typeOnlyCount": 48
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
        "sectors",
        "stats"
      ],
      "dependencies": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/events/file.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "exports": [
        {
          "name": "droughtHazardMultiplier",
          "kind": "function",
          "path": "packages/engine/src/pipeline/shocks.ts",
          "line": 27
        },
        {
          "name": "shocks",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/shocks.ts",
          "line": 34
        }
      ],
      "path": "packages/engine/src/pipeline/shocks.ts",
      "line": 34
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
        "environment",
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
          "line": 73
        },
        {
          "name": "classSizesFrom",
          "kind": "function",
          "path": "packages/engine/src/pipeline/demography.ts",
          "line": 94
        },
        {
          "name": "professionalCeiling",
          "kind": "function",
          "path": "packages/engine/src/pipeline/demography.ts",
          "line": 127
        },
        {
          "name": "MigrationFlow",
          "kind": "interface",
          "path": "packages/engine/src/pipeline/demography.ts",
          "line": 146
        },
        {
          "name": "migrationFlow",
          "kind": "function",
          "path": "packages/engine/src/pipeline/demography.ts",
          "line": 168
        },
        {
          "name": "demography",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/demography.ts",
          "line": 197
        }
      ],
      "path": "packages/engine/src/pipeline/demography.ts",
      "line": 197
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
        "packages/engine/src/events/file.ts",
        "packages/engine/src/math.ts",
        "packages/engine/src/pipeline/derive.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "exports": [
        {
          "name": "frontierGrowthAt",
          "kind": "function",
          "path": "packages/engine/src/pipeline/technology.ts",
          "line": 40
        },
        {
          "name": "absorptiveCapacity",
          "kind": "function",
          "path": "packages/engine/src/pipeline/technology.ts",
          "line": 59
        },
        {
          "name": "researchIntensity",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/technology.ts",
          "line": 77
        },
        {
          "name": "ResearchAllocation",
          "kind": "interface",
          "path": "packages/engine/src/pipeline/technology.ts",
          "line": 79
        },
        {
          "name": "researchAllocation",
          "kind": "function",
          "path": "packages/engine/src/pipeline/technology.ts",
          "line": 109
        },
        {
          "name": "breakthroughHazard",
          "kind": "function",
          "path": "packages/engine/src/pipeline/technology.ts",
          "line": 167
        },
        {
          "name": "technology",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/technology.ts",
          "line": 179
        }
      ],
      "path": "packages/engine/src/pipeline/technology.ts",
      "line": 179
    },
    {
      "order": 4,
      "name": "world",
      "description": "partner cycles set export demand and world prices — schema v9",
      "moduleId": "packages/engine/src/pipeline/world.ts",
      "summary": "Step 2.5 — the rest of world. Four abstract trading partners, each an economy with its own business cycle, advance one quarter. Their strength sets two things the domestic economy then lives inside: • how much of your exports they buy (a partner in recession buys less); • the…",
      "stateAreas": [
        "external",
        "stats"
      ],
      "dependencies": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/events/file.ts",
        "packages/engine/src/events/ids.ts",
        "packages/engine/src/math.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "exports": [
        {
          "name": "world",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/world.ts",
          "line": 71
        }
      ],
      "path": "packages/engine/src/pipeline/world.ts",
      "line": 71
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
        "sectors",
        "stats"
      ],
      "dependencies": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/events/file.ts",
        "packages/engine/src/math.ts",
        "packages/engine/src/pipeline/derive.ts",
        "packages/engine/src/state/schema.ts",
        "packages/engine/src/state/spending.ts"
      ],
      "exports": [
        {
          "name": "finance",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/finance.ts",
          "line": 72
        }
      ],
      "path": "packages/engine/src/pipeline/finance.ts",
      "line": 72
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
          "line": 52
        }
      ],
      "path": "packages/engine/src/pipeline/foreignInvestment.ts",
      "line": 52
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
          "line": 57
        }
      ],
      "path": "packages/engine/src/pipeline/production.ts",
      "line": 57
    },
    {
      "order": 8,
      "name": "environment",
      "description": "emissions from that output; the burden that damages elsewhere — schema v34",
      "moduleId": "packages/engine/src/pipeline/environment.ts",
      "summary": "Step — the environment. What production costs outside the market (ADR-0028).",
      "stateAreas": [
        "environment"
      ],
      "dependencies": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/pipeline/derive.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "exports": [
        {
          "name": "emissionsPerHead",
          "kind": "function",
          "path": "packages/engine/src/pipeline/environment.ts",
          "line": 44
        },
        {
          "name": "environment",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/environment.ts",
          "line": 58
        }
      ],
      "path": "packages/engine/src/pipeline/environment.ts",
      "line": 58
    },
    {
      "order": 9,
      "name": "trade",
      "description": "books external flows, reserves, exchange rate",
      "moduleId": "packages/engine/src/pipeline/trade.ts",
      "summary": "Step 4 — trade, and the foreign exchange market that settles it (ADR-0034).",
      "stateAreas": [
        "external",
        "flows",
        "stats"
      ],
      "dependencies": [
        "packages/engine/src/constants.ts",
        "packages/engine/src/events/file.ts",
        "packages/engine/src/math.ts",
        "packages/engine/src/pipeline/derive.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "exports": [
        {
          "name": "carryYieldSpread",
          "kind": "function",
          "path": "packages/engine/src/pipeline/trade.ts",
          "line": 95
        },
        {
          "name": "fillableIntervention",
          "kind": "function",
          "path": "packages/engine/src/pipeline/trade.ts",
          "line": 134
        },
        {
          "name": "FxSettlement",
          "kind": "interface",
          "path": "packages/engine/src/pipeline/trade.ts",
          "line": 156
        },
        {
          "name": "settleForeignExchange",
          "kind": "function",
          "path": "packages/engine/src/pipeline/trade.ts",
          "line": 169
        },
        {
          "name": "trade",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/trade.ts",
          "line": 253
        }
      ],
      "path": "packages/engine/src/pipeline/trade.ts",
      "line": 253
    },
    {
      "order": 10,
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
          "line": 38
        }
      ],
      "path": "packages/engine/src/pipeline/fiscal.ts",
      "line": 38
    },
    {
      "order": 11,
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
          "line": 17
        }
      ],
      "path": "packages/engine/src/pipeline/monetary.ts",
      "line": 17
    },
    {
      "order": 12,
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
          "line": 29
        }
      ],
      "path": "packages/engine/src/pipeline/prices.ts",
      "line": 29
    },
    {
      "order": 13,
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
          "line": 38
        }
      ],
      "path": "packages/engine/src/pipeline/labor.ts",
      "line": 38
    },
    {
      "order": 14,
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
          "line": 51
        }
      ],
      "path": "packages/engine/src/pipeline/cohorts.ts",
      "line": 51
    },
    {
      "order": 15,
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
        "packages/engine/src/events/file.ts",
        "packages/engine/src/math.ts",
        "packages/engine/src/pipeline/derive.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "exports": [
        {
          "name": "franchiseOf",
          "kind": "function",
          "path": "packages/engine/src/pipeline/institutions.ts",
          "line": 138
        },
        {
          "name": "initialInstitutions",
          "kind": "function",
          "path": "packages/engine/src/pipeline/institutions.ts",
          "line": 324
        },
        {
          "name": "institutions",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/institutions.ts",
          "line": 362
        }
      ],
      "path": "packages/engine/src/pipeline/institutions.ts",
      "line": 362
    },
    {
      "order": 16,
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
        "packages/engine/src/events/conditions.ts",
        "packages/engine/src/humanDevelopment.ts",
        "packages/engine/src/math.ts",
        "packages/engine/src/pipeline/derive.ts",
        "packages/engine/src/pipeline/indicatorSpecs.ts",
        "packages/engine/src/rng/rng.ts",
        "packages/engine/src/state/accounts.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "exports": [
        {
          "name": "humanDevelopmentPrintsDue",
          "kind": "function",
          "path": "packages/engine/src/pipeline/statistics.ts",
          "line": 322
        },
        {
          "name": "statistics",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/statistics.ts",
          "line": 525
        }
      ],
      "path": "packages/engine/src/pipeline/statistics.ts",
      "line": 525
    },
    {
      "order": 17,
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
        "packages/engine/src/events/file.ts",
        "packages/engine/src/math.ts",
        "packages/engine/src/pipeline/derive.ts",
        "packages/engine/src/state/schema.ts"
      ],
      "exports": [
        {
          "name": "electionThreshold",
          "kind": "function",
          "path": "packages/engine/src/pipeline/politics.ts",
          "line": 74
        },
        {
          "name": "politics",
          "kind": "constant",
          "path": "packages/engine/src/pipeline/politics.ts",
          "line": 78
        }
      ],
      "path": "packages/engine/src/pipeline/politics.ts",
      "line": 78
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
          "line": 36
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
          "line": 526
        },
        {
          "path": "packages/engine/src/pipeline/politics.ts",
          "line": 79
        },
        {
          "path": "packages/observation/src/observe.ts",
          "line": 220
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
          "line": 475
        },
        {
          "path": "packages/observation/src/observe.ts",
          "line": 12
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
