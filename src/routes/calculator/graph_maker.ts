import Plotly from 'plotly.js-dist';
import { rameffect_er } from '$lib/ram_pressure_density_calculator.js';
import { Atmosphere } from '$lib/atmosphere.js';
import { cacheFetch } from '$lib/cache';

let hoverstyle = 'x';
let g_55_serie_1 = {
	"AileronEffectiveSpeed": 400.0,
	"RudderEffectiveSpeed": 420.003,
	"ElevatorsEffectiveSpeed": 450.0,
	"AileronPowerLoss": 2.3,
	"RudderPowerLoss": 1.8,
	"ElevatorPowerLoss": 2.15,
	"AlphaAileronMin": 0.1,
	"AlphaRudderMin": 0.1,
	"AlphaElevatorMin": 0.1,
	"AllowStrongControlsRestrictions": true,
	"RudderSens": 0.33,
	"ElevatorSens": 0.38,
	"AileronSens": 0.13,
	"GearActuatorSpeed": 0.2,
	"WingActuatorSpeed": 0.1,
	"CockpitDoorSpeedOpen": [
	 150.0,
	 300.0,
	 2.0,
	 18.0
	],
	"CockpitDoorSpeedClose": [
	 150.0,
	 300.0,
	 3.0,
	 0.1
	],
	"CockpitDoorBlockSpeed": 190.0,
	"AirBrakeSpeed": 0.5,
	"BayDoorSpeed": 1.0,
	"BombLauncherSpeed": 2.0,
	"dvFlapsIn": [
	 150.0,
	 280.0,
	 0.12,
	 0.19
	],
	"dvFlapsOut": [
	 150.0,
	 280.0,
	 0.19,
	 0.12
	],
	"flapsLimByMach": [
	 0.5,
	 0.7,
	 1.0,
	 1.0
	],
	"flapsLimByIas": [
	 200.0,
	 250.0,
	 1.0,
	 0.0
	],
	"Wingspan": 11.85,
	"SweptWingAngle": 0.0,
	"WingTaperRatio": 2.0,
	"Length": 9.372,
	"StabWidth": 3.0,
	"FinHeight": 1.5,
	"Crew": 1,
	"WingAngle": 0.6,
	"StabAngle": 0.5,
	"KeelAngle": 0.0,
	"AileronAngles": [
	 25.3,
	 10.3
	],
	"ElevatorAngles": [
	 30.0,
	 30.0
	],
	"InvertElevator": false,
	"FlapsRadiator": 0.0,
	"RudderAngles": [
	 28.0,
	 28.0
	],
	"Elevon": false,
	"VSlats": [
	 140.0,
	 160.0
	],
	"Vne": 840.0,
	"VneMach": 0.82,
	"MaxSpeedNearGround": 681.998,
	"MaxSpeedAtAltitude": 666.0,
	"CriticalSpeed": 50.0,
	"ArcadeLimitWepMultiplier": 1.6,
	"ArcadeHelpersSensitivity": 1.0,
	"AllowModsToChangeLongidutialBalance": true,
	"ArcadeRollCorrectionMultiplier": 1.0,
	"ArcadeMaxRollCoeff": 1.0,
	"ArcadeYawMutilpliers": [
	 1.0,
	 1.0,
	 1.0
	],
	"CockpitOpenedDoorBreakSpeed": 230.0,
	"MomentOfInertia": [
	 10000.0,
	 25000.0,
	 15000.0
	],
	"AvailableControls": {
	 "hasAileronControl": true,
	 "hasAileronTrimControl": false,
	 "hasAileronTrimGroundControl": true,
	 "dvAileronTrim": 0.125,
	 "hasElevatorControl": true,
	 "hasElevatorTrimControl": true,
	 "hasElevatorTrimGroundControl": false,
	 "dvElevatorTrim": 0.125,
	 "hasRudderControl": true,
	 "hasRudderTrimControl": false,
	 "hasRudderTrimGroundControl": true,
	 "dvRudderTrim": 0.125,
	 "hasFlapsControl": true,
	 "canTakeoffWithoutFlaps": true,
	 "hasTakeoffFlapsPosition": true,
	 "hasCombatFlapsPosition": true,
	 "hasAirbrake": false,
	 "hasGearControl": true,
	 "hasArrestorControl": false,
	 "hasWingFoldControl": false,
	 "hasCockpitDoorControl": true,
	 "hasWheelBrakeControl": true,
	 "hasLockGearControl": true,
	 "bHasBoosterSwitcher": false
	},
	"Areas": {
	 "WingLeftIn": 3.52,
	 "WingLeftMid": 3.52,
	 "WingLeftOut": 3.5,
	 "WingRightIn": 3.52,
	 "WingRightMid": 3.52,
	 "WingRightOut": 3.5,
	 "Aileron": 0.6721,
	 "Stabilizer": 1.727,
	 "Elevator": 1.246,
	 "Keel": 0.8614,
	 "Rudder": 0.6248,
	 "WingLeftCut": 0.2,
	 "WingRightCut": 0.3
	},
	"Focus": {
	 "FocusOffset": 0.0,
	 "WingVertPos": 0.3,
	 "AlphaShift": 0.01,
	 "FlapsShift": 0.09,
	 "AirbrakesShift": 0.0,
	 "GearShift": 0.0,
	 "WingInFocus": 0.9,
	 "WingMidFocus": 2.0,
	 "WingOutFocus": 3.6,
	 "WingV": 2.0,
	 "Stabilizer": 5.3,
	 "Keel": 5.3,
	 "Rudder": 9.3,
	 "Fuselage": [
	  0.7,
	  0.1,
	  0.0
	 ],
	 "LeftStab": [
	  -5.45,
	  0.25,
	  0.7
	 ],
	 "RightStab": [
	  -5.45,
	  0.25,
	  -0.7
	 ],
	 "VertStab": [
	  -5.35,
	  1.0,
	  0.0
	 ],
	 "WingVWingFocusMultiplier": 0.0,
	 "SineAOSMultiplier": 0.4
	},
	"Aerodynamics": {
	 "AileronCd": [
	  0.015,
	  0.0027
	 ],
	 "GearCd": 0.045,
	 "GearCentralCd": 0.0,
	 "RadiatorCd": 0.008,
	 "OilRadiatorCd": 0.002,
	 "BombBayCd": 0.0,
	 "FuseCd": 1e-06,
	 "AirbrakeCd": 0.0,
	 "CockpitDoorCd": 0.05321,
	 "FlapsPolarBlending1": [
	  0.0,
	  0.0
	 ],
	 "FlapsPolarBlending2": [
	  1.0,
	  1.0
	 ],
	 "ClToCmCoeff": 0.02,
	 "UseSpinLoss": true,
	 "SpinClLoss": 0.2,
	 "SpinCdLoss": 0.03,
	 "OswaldsEfficiencyNumber": 0.75,
	 "lineClCoeff": 0.08,
	 "AfterCritParabAngle": 2.0,
	 "AfterCritDeclineCoeff": 0.03,
	 "AfterCritMaxDistanceAngle": 30.0,
	 "ClAfterCrit": 0.8,
	 "MachFactor": 3,
	 "MachCrit1": 0.68,
	 "MachMax1": 1.0,
	 "MultMachMax1": 9.5,
	 "MultLineCoeff1": -3.8,
	 "MultLimit1": 1.0,
	 "MachCrit2": 0.685,
	 "MachMax2": 0.989,
	 "MultMachMax2": 9.7,
	 "MultLineCoeff2": -3.7,
	 "MultLimit2": 1.0,
	 "MachCrit3": 0.2,
	 "MachMax3": 1.0,
	 "MultMachMax3": 0.6,
	 "MultLineCoeff3": -0.44,
	 "MultLimit3": 0.25,
	 "MachCrit4": 0.2,
	 "MachMax4": 1.0,
	 "MultMachMax4": 0.6,
	 "MultLineCoeff4": -0.2,
	 "MultLimit4": 0.25,
	 "MachCrit5": 0.7,
	 "MachMax5": 1.5,
	 "MultMachMax5": 2.0,
	 "MultLineCoeff5": 1.1,
	 "MultLimit5": 5.0,
	 "MachCrit6": 0.55,
	 "MachMax6": 0.85,
	 "MultMachMax6": 0.35,
	 "MultLineCoeff6": -0.1,
	 "MultLimit6": 0.0,
	 "CombinedCl": true,
	 "DownwashType": 2,
	 "DownwashCoeff": 1.0,
	 "StabFlowInertia": 0.04,
	 "VertStabFlowInertia": 0.04,
	 "NoFlaps": {
	  "Cl0": 0.1,
	  "alphaCritHigh": 17.2,
	  "alphaCritLow": -14.0,
	  "ClCritHigh": 1.43,
	  "ClCritLow": -0.9,
	  "CdMin": 0.0079
	 },
	 "FullFlaps": {
	  "Cl0": 0.5,
	  "alphaCritHigh": 15.1,
	  "alphaCritLow": -17.0,
	  "ClCritHigh": 1.7,
	  "ClCritLow": -0.3,
	  "CdMin": 0.1
	 },
	 "Fuselage": {
	  "OswaldsEfficiencyNumber": 0.1,
	  "lineClCoeff": 0.015,
	  "AfterCritParabAngle": 2.0,
	  "AfterCritDeclineCoeff": 0.005,
	  "AfterCritMaxDistanceAngle": 30.0,
	  "ClAfterCrit": 0.11,
	  "MachFactor": 3,
	  "MachCrit1": 0.82,
	  "MachMax1": 1.0,
	  "MultMachMax1": 7.0,
	  "MultLineCoeff1": -5.2,
	  "MultLimit1": 1.0,
	  "MachCrit2": 0.82,
	  "MachMax2": 0.97,
	  "MultMachMax2": 6.7,
	  "MultLineCoeff2": -3.7,
	  "MultLimit2": 1.0,
	  "MachCrit3": 0.1,
	  "MachMax3": 1.0,
	  "MultMachMax3": 0.32,
	  "MultLineCoeff3": -0.44,
	  "MultLimit3": 0.25,
	  "MachCrit4": 0.1,
	  "MachMax4": 1.0,
	  "MultMachMax4": 0.4,
	  "MultLineCoeff4": -0.2,
	  "MultLimit4": 0.25,
	  "MachCrit5": 0.82,
	  "MachMax5": 1.5,
	  "MultMachMax5": 2.0,
	  "MultLineCoeff5": 1.1,
	  "MultLimit5": 5.0,
	  "MachCrit6": 0.0,
	  "MachMax6": 0.0,
	  "MultMachMax6": 0.0,
	  "MultLineCoeff6": 0.0,
	  "MultLimit6": 0.0,
	  "CombinedCl": true,
	  "Cl0": 0.0,
	  "alphaCritHigh": 17.0,
	  "alphaCritLow": -17.0,
	  "ClCritHigh": 0.11,
	  "ClCritLow": -0.11,
	  "CdMin": 0.0115
	 },
	 "Stab": {
	  "OswaldsEfficiencyNumber": 0.75,
	  "lineClCoeff": 0.065,
	  "AfterCritParabAngle": 3.0,
	  "AfterCritDeclineCoeff": 0.01,
	  "AfterCritMaxDistanceAngle": 30.0,
	  "ClAfterCrit": 0.8,
	  "MachFactor": 3,
	  "MachCrit1": 0.67,
	  "MachMax1": 1.0,
	  "MultMachMax1": 7.0,
	  "MultLineCoeff1": -5.2,
	  "MultLimit1": 1.0,
	  "MachCrit2": 0.67,
	  "MachMax2": 0.97,
	  "MultMachMax2": 6.7,
	  "MultLineCoeff2": -3.7,
	  "MultLimit2": 1.0,
	  "MachCrit3": 0.3,
	  "MachMax3": 1.0,
	  "MultMachMax3": 0.6,
	  "MultLineCoeff3": -0.44,
	  "MultLimit3": 0.25,
	  "MachCrit4": 0.3,
	  "MachMax4": 1.0,
	  "MultMachMax4": 0.6,
	  "MultLineCoeff4": -0.2,
	  "MultLimit4": 0.25,
	  "MachCrit5": 0.67,
	  "MachMax5": 1.5,
	  "MultMachMax5": 2.0,
	  "MultLineCoeff5": 1.1,
	  "MultLimit5": 5.0,
	  "MachCrit6": 0.0,
	  "MachMax6": 0.0,
	  "MultMachMax6": 0.0,
	  "MultLineCoeff6": 0.0,
	  "MultLimit6": 0.0,
	  "CombinedCl": true,
	  "Cl0": 0.0,
	  "alphaCritHigh": 17.0,
	  "alphaCritLow": -17.0,
	  "ClCritHigh": 1.1,
	  "ClCritLow": -1.1,
	  "CdMin": 0.01
	 },
	 "Fin": {
	  "OswaldsEfficiencyNumber": 0.75,
	  "lineClCoeff": 0.075,
	  "AfterCritParabAngle": 5.0,
	  "AfterCritDeclineCoeff": 0.001,
	  "AfterCritMaxDistanceAngle": 45.0,
	  "ClAfterCrit": 0.7,
	  "MachFactor": 3,
	  "MachCrit1": 0.7,
	  "MachMax1": 1.0,
	  "MultMachMax1": 7.0,
	  "MultLineCoeff1": -5.2,
	  "MultLimit1": 1.0,
	  "MachCrit2": 0.7,
	  "MachMax2": 0.97,
	  "MultMachMax2": 6.7,
	  "MultLineCoeff2": -3.7,
	  "MultLimit2": 1.0,
	  "MachCrit3": 0.3,
	  "MachMax3": 1.0,
	  "MultMachMax3": 0.6,
	  "MultLineCoeff3": -0.44,
	  "MultLimit3": 0.25,
	  "MachCrit4": 0.3,
	  "MachMax4": 1.0,
	  "MultMachMax4": 0.6,
	  "MultLineCoeff4": -0.2,
	  "MultLimit4": 0.25,
	  "MachCrit5": 0.7,
	  "MachMax5": 1.5,
	  "MultMachMax5": 2.0,
	  "MultLineCoeff5": 1.1,
	  "MultLimit5": 5.0,
	  "MachCrit6": 0.0,
	  "MachMax6": 0.0,
	  "MultMachMax6": 0.0,
	  "MultLineCoeff6": 0.0,
	  "MultLimit6": 0.0,
	  "CombinedCl": true,
	  "Cl0": 0.05,
	  "alphaCritHigh": 20.0,
	  "alphaCritLow": -20.0,
	  "ClCritHigh": 1.0,
	  "ClCritLow": -1.0,
	  "CdMin": 0.01
	 }
	},
	"Engine0": {
	 "Position": [
	  1.5,
	  0.07,
	  0.0
	 ],
	 "Direction": [
	  -0.0,
	  0.0
	 ],
	 "PropPos": [
	  2.3,
	  0.0,
	  0.0
	 ],
	 "Main": {
	  "FuelSystemNum": 0,
	  "Type": "Inline",
	  "Cylinders": 12,
	  "Mass": 720.0,
	  "Thrust": 10.7,
	  "ThrottleBoost": 1.001,
	  "AfterburnerBoost": 1.11,
	  "RPMMin": 500.0,
	  "RPMMax": 2800.0,
	  "RPMAfterburner": 2800.0,
	  "RPMMaxAllowed": 3150.0,
	  "FuelConsumptionOnIdle": 0.4,
	  "FuelConsumptionOnHalfThr": 0.21,
	  "FuelConsumptionOnFullThr": 0.23,
	  "FuelConsumptionOnWEP": 0.24,
	  "CarbueretorType": 2,
	  "CarbureutorCapacity": 0.268333,
	  "IsAutonomous": true,
	  "ExtinguisherNum": 0,
	  "MinThrMult": 0.11,
	  "MaxThrMult": 1.0,
	  "IsWaterCooled": true,
	  "EngineInertiaMoment": 1.0,
	  "EngineAcceleration": 4.0,
	  "RPMAmplitude0": [
	   2400.0,
	   0.0
	  ],
	  "RPMAmplitude1": [
	   0.0,
	   12.0
	  ],
	  "ConsumptionOmegaMax": 1.05,
	  "ConsumptionOmegaMinCoeff": 4.33812,
	  "ThrustOmegaMinCoeff": 0.00570897,
	  "TorqueOmegaMinCoeff": 1.0,
	  "TorqueZeroOmegaMult": 3.0,
	  "TurbineTimeConstant": 3.4,
	  "Power": 1280.0,
	  "ThrustMax": {
	   "ThrustMax0": 2700.0
	  },
	  "WEP_RPM": 2800.0,
	  "military_RPM": 2600.0,
	  "default_RPM": 2600.0,
	  "default-mil_RPM_EffectOnSupercharger": 1.0,
	  "WEP-mil_RPM_EffectOnSupercharger": 1.0538461538461539,
	  "Octane_MP": 1,
	  "WEP_MP": 1.42,
	  "Military_MP": 1.3,
	  "Power0": 1280.0,
	  "Deck_Altitude0": 0
	 },
	 "Propellor": {
	  "AllowAutoProp": false,
	  "IsControllable": true,
	  "HasFeatheringControl": false,
	  "UseAutoPropInertia": false,
	  "Reductor": 0.593,
	  "NumBlades": 3,
	  "AdvancedPropRadius": 1.5,
	  "PropPhi0": 18.0,
	  "PropWidth0": 0.18,
	  "PropPhi1": 7.8,
	  "PropWidth1": 0.2,
	  "PropPhi2": 0.0,
	  "PropWidth2": 0.19,
	  "PropPhi3": -6.6,
	  "PropWidth3": 0.14,
	  "InertiaMomentCoeff": 1.0,
	  "Diameter": 3.05,
	  "Mass": 150.0,
	  "GovernorType": 2,
	  "GovernorSpeed": 0.15,
	  "GovernorMinParam": 1540.0,
	  "GovernorMaxParam": 2600.0,
	  "GovernorAfterburnerParam": 2800.0,
	  "PhiMin": 22.0,
	  "PhiMax": 51.0,
	  "PhiAlpha0": 22.0,
	  "PhiFeather": 1.4042,
	  "Direction": 1,
	  "CoaxProps": false,
	  "ThrottleRPMAuto0": [
	   0.0,
	   1540.0
	  ],
	  "ThrottleRPMAuto1": [
	   0.5,
	   1700.0
	  ],
	  "ThrottleRPMAuto2": [
	   0.74,
	   2300.0
	  ],
	  "ThrottleRPMAuto3": [
	   1.0,
	   2600.0
	  ],
	  "ThrottleRPMAuto4": [
	   1.1,
	   2800.0
	  ],
	  "Polar": {
	   "lineClCoeff": 0.077,
	   "Cl0": 0.35,
	   "alphaCritHigh": 12.9,
	   "alphaCritLow": -10.4,
	   "ClCritHigh": 1.04,
	   "ClCritLow": -0.44,
	   "CdMin": 0.011,
	   "AfterCritParabAngle": 3.0,
	   "AfterCritDeclineCoeff": 0.00222,
	   "AfterCritMaxDistanceAngle": 36.0,
	   "ClAfterCrit": 0.8,
	   "MachFactor": 3,
	   "CombinedCl": true,
	   "MachCrit1": 0.79,
	   "MachMax1": 1.0,
	   "MultMachMax1": 4.0,
	   "MultLineCoeff1": -3.0,
	   "MultLimit1": 2.0,
	   "MachCrit2": 0.79,
	   "MachMax2": 0.995,
	   "MultMachMax2": 3.9,
	   "MultLineCoeff2": -2.0,
	   "MultLimit2": 2.0,
	   "MachCrit3": 0.25,
	   "MachMax3": 1.5,
	   "MultMachMax3": 0.6,
	   "MultLineCoeff3": -0.2,
	   "MultLimit3": 0.25,
	   "MachCrit4": 0.25,
	   "MachMax4": 1.5,
	   "MultMachMax4": 0.6,
	   "MultLineCoeff4": -0.2,
	   "MultLimit4": 0.7,
	   "MachCrit5": 0.01,
	   "MachMax5": 0.02,
	   "MultMachMax5": 3.0,
	   "MultLineCoeff5": 0.0,
	   "MultLimit5": 3.0,
	   "MachCrit6": 0.0,
	   "MachMax6": 0.0,
	   "MultMachMax6": 0.0,
	   "MultLineCoeff6": 0.0,
	   "MultLimit6": 0.0
	  }
	 },
	 "Afterburner": {
	  "IsControllable": true,
	  "Type": 6,
	  "NitroConsumption": 0.0
	 },
	 "Temperature": {
	  "RadiatorAuto": true,
	  "OilRadiatorAuto": true,
	  "NoIgnitionWaterHeatProducingFactor": 0.15,
	  "WaterRadiatorEffectPower": 5.0,
	  "WaterMinRadiatorThermalConductionCoeff": 0.84,
	  "WaterMinThermostatThermalConductionCoeff": 0.3,
	  "WaterMinLevelThermalConductionCoeff": 0.2,
	  "WaterThermalConductionCrossCoeffTable": [
	   0.4,
	   0.2,
	   0.02,
	   0.2
	  ],
	  "WaterBoilingTemperature": 166.5,
	  "WaterThermostatInertia": 20.0,
	  "WaterThermostatSetPoint": 60.0,
	  "NoFlowMode": 2,
	  "NoIgnitionOilHeatProducingFactor": 0.15,
	  "OilRadiatorEffectPower": 5.0,
	  "OilMinRadiatorThermalConductionCoeff": 0.81,
	  "OilMinThermostatThermalConductionCoeff": 0.3,
	  "OilMinLevelThermalConductionCoeff": 0.2,
	  "OilThermalConductionCrossCoeffTable": [
	   0.4,
	   0.2,
	   0.02,
	   0.2
	  ],
	  "OilBoilingTemperature": 360.0,
	  "OilThermostatInertia": 20.0,
	  "OilThermostatSetPoint": 50.0,
	  "DegradationTime_10_5": [
	   180.0,
	   171.0
	  ],
	  "HalfHealthWaterTemperatureToleranceDecrease": 11.5,
	  "HalfHealthOilTemperatureToleranceDecrease": 11.0,
	  "WaterAirDensityPower": -0.05,
	  "OilAirDensityPower": -0.05,
	  "CoolingEffectiveAirSpeed": 714.92,
	  "WaterTemperatureNoFlow": 119.058,
	  "OilTemperatureNoFlow": 99.2122,
	  "WaterTemperatureInertia": 0.8,
	  "OilTemperatureInertia": 0.85,
	  "Mode0": {
	   "Altitude": 1000.0,
	   "RPM": 400.0,
	   "ManifoldPressure": 0.766654,
	   "WaterTemperature": 60.5516,
	   "OilTemperature": 52.6259
	  },
	  "Mode1": {
	   "Altitude": 1000.0,
	   "RPM": 2300.0,
	   "ManifoldPressure": 1.15,
	   "WaterTemperature": 83.3484,
	   "OilTemperature": 73.4348
	  },
	  "Mode2": {
	   "Altitude": 1000.0,
	   "RPM": 2600.0,
	   "ManifoldPressure": 1.3,
	   "WaterTemperature": 90.2897,
	   "OilTemperature": 80.374
	  },
	  "Mode3": {
	   "Altitude": 1000.0,
	   "RPM": 2800.0,
	   "ManifoldPressure": 1.42,
	   "WaterTemperature": 99.2164,
	   "OilTemperature": 89.2979
	  },
	  "Load0": {
	   "WaterTemperature": 80.0,
	   "OilTemperature": 60.0
	  },
	  "Load1": {
	   "WaterTemperature": 90.0,
	   "OilTemperature": 80.0,
	   "WorkTime": 3600.0,
	   "RecoverTime": 1800.0
	  },
	  "Load2": {
	   "WaterTemperature": 95.0,
	   "OilTemperature": 85.0,
	   "WorkTime": 1800.0,
	   "RecoverTime": 900.0
	  },
	  "Load3": {
	   "WaterTemperature": 100.0,
	   "OilTemperature": 90.0,
	   "WorkTime": 360.0,
	   "RecoverTime": 240.0
	  },
	  "Load4": {
	   "WaterTemperature": 105.0,
	   "OilTemperature": 95.0,
	   "WorkTime": 180.0,
	   "RecoverTime": 175.0
	  },
	  "Load5": {
	   "WaterTemperature": 115.0,
	   "OilTemperature": 105.0,
	   "WorkTime": 60.0,
	   "RecoverTime": 60.0
	  },
	  "RadiatorMode0": {
	   "Throttle": 0.89,
	   "WaterTemperature": 90.5,
	   "OilTemperature": 80.5
	  },
	  "RadiatorMode1": {
	   "Throttle": 1.0,
	   "WaterTemperature": 95.5,
	   "OilTemperature": 85.5
	  },
	  "RadiatorMode2": {
	   "Throttle": 1.1,
	   "WaterTemperature": 105.5,
	   "OilTemperature": 95.5
	  }
	 },
	 "Compressor": {
	  "IsControllable": false,
	  "Type": 2,
	  "NumSteps": 1,
	  "RPM0": 400.0,
	  "ATA0": 0.65,
	  "RPM1": 2300.0,
	  "ATA1": 1.15,
	  "RPM2": 2600.0,
	  "ATA2": 1.3,
	  "ExactAltitudes": true,
	  "CompressorOmegaFactorSq": 0.0,
	  "CompressorPressureAtRPM0": 0.3,
	  "Altitude0": 5700.0,
	  "AfterburnerBoostMul0": 1.0,
	  "Power0": 1260.0,
	  "AltitudeConstRPM0": 2000.0,
	  "PowerConstRPM0": 1380.0,
	  "PowerConstRPMCurvature0": 0.9,
	  "Ceiling0": 10000.0,
	  "PowerAtCeiling0": 770.0,
	  "AfterburnerManifoldPressure": 1.42,
	  "SpeedManifoldMultiplier": 0.8,
	  "ExternalPressureLimit": false,
	  "AllowAutoTurboCharger": false,
	  "TurboChargerRPMMin": 0.0,
	  "TurboChargerRPMMaxAllowed": 18250.0,
	  "TurboChargerRPMMax": 25000.0,
	  "TurboChargerTimeConst": 1.0,
	  "Old_Power0": 1260.0,
	  "Old_Power_new_RPM0": 1260.0,
	  "Old_Altitude0": 5700.0,
	  "Old_Ceiling0": 10000.0,
	  "Old_PowerConstRPM0": 1380.0
	 },
	 "Mixer": {
	  "IsControllable": false,
	  "Type": 0,
	  "AltitudePressureToP0": 0.163463
	 },
	 "Controls": {
	  "hasThrottleControl": true,
	  "hasMagnetoControl": true,
	  "hasRadiatorControl": true,
	  "hasOilRadiatorControl": true,
	  "hasCommonRadiator": false
	 },
	 "Stages": {
	  "Stage1": {
	   "minTime": 0.5,
	   "maxTime": 1.0,
	   "fromRPM": 0.0,
	   "toRPM": 20.0
	  },
	  "Stage2": {
	   "minTime": 2.0,
	   "maxTime": 4.2,
	   "fromRPM": 20.0,
	   "toRPM": 35.0
	  },
	  "Stage3": {
	   "minTime": 0.1,
	   "maxTime": 0.2,
	   "fromRPM": 35.0,
	   "toRPM": 120.0
	  },
	  "Stage4": {
	   "minTime": 0.5,
	   "maxTime": 1.0,
	   "fromRPM": 120.0,
	   "toRPM": 120.0
	  },
	  "Stage5": {
	   "minTime": 0.5,
	   "maxTime": 1.0,
	   "fromRPM": 120.0,
	   "toRPM": 240.0
	  }
	 }
	},
	"Mass": {
	 "EmptyMass": 3090,
	 "MaxFuelMass0": 405.0,
	 "FuelAccumulatorCapacity0": 1.3,
	 "MinimalLoadFactor": 0.0,
	 "FuelAccumulatorFlowRate": 10.0,
	 "MaxNitro": 0.0,
	 "OilMass": 35.0,
	 "AdvancedMass": false,
	 "SeparateFuelTanks": true,
	 "Takeoff": 3900.0,
	 "CenterOfGravity": [
	  -0.02,
	  0.1,
	  0.0
	 ],
	 "WingCritOverload": [
	  -105000.0,
	  210000.0
	 ],
	 "GearDestructionIndSpeed": 260.0,
	 "AirbrakeDestructionIndSpeed": -1.0,
	 "FlapsDestructionIndSpeedP1": [
	  0.1,
	  460.0
	 ],
	 "FlapsDestructionIndSpeedP2": [
	  1.0,
	  260.0
	 ],
	 "Parts": {
	  "tank1_capacity": 67.5,
	  "tank1_system": 0,
	  "tank1_external": false,
	  "tank1_priority": 2,
	  "tank2_capacity": 67.5,
	  "tank2_system": 0,
	  "tank2_external": false,
	  "tank2_priority": 3,
	  "tank3_capacity": 67.5,
	  "tank3_system": 0,
	  "tank3_external": false,
	  "tank3_priority": 1,
	  "tank4_capacity": 67.5,
	  "tank4_system": 0,
	  "tank4_external": false,
	  "tank4_priority": 0,
	  "tank5_capacity": 67.5,
	  "tank5_system": 0,
	  "tank5_external": false,
	  "tank5_priority": 0,
	  "tank6_capacity": 67.5,
	  "tank6_system": 0,
	  "tank6_external": false,
	  "tank6_priority": 1,
	  "gear_r_dm": 33.0658,
	  "mgun2_dm": 16.7532,
	  "mgun1_dm": 16.7532,
	  "wing_r_dm": 137.337,
	  "water2_dm": 8.6535,
	  "wing1_r_dm": 98.6492,
	  "flap_r_dm": 33.5099,
	  "aileron_r_dm": 22.9466,
	  "wing2_r_dm": 80.696,
	  "gear_l_dm": 33.0658,
	  "spar1_r_dm": 13.2866,
	  "spar2_r_dm": 9.85149,
	  "spar1_l_dm": 13.2866,
	  "spar2_l_dm": 9.85147,
	  "spar_r_dm": 18.2748,
	  "spar_l_dm": 18.2748,
	  "wingcontrol_r_dm": 9.84268,
	  "tailcontrol_dm": 15.1151,
	  "wingcontrol_l_dm": 9.84271,
	  "armor2_dm": 4.22734,
	  "armor1_dm": 22.5835,
	  "armor3_dm": 9.17558,
	  "cannon1_dm": 35.3939,
	  "wing2_l_dm": 80.7357,
	  "wing1_l_dm": 98.6858,
	  "flap_l_dm": 33.51,
	  "aileron_l_dm": 22.9466,
	  "elevator_dm": 37.794,
	  "stab_dm": 65.6166,
	  "engine1_dm": 720.0,
	  "oil1_dm": 21.148,
	  "pilot_dm": 39.5707,
	  "fin_dm": 26.4422,
	  "cover2_dm": 18.0063,
	  "cover1_dm": 96.9454,
	  "fuse_dm": 149.2,
	  "tail_dm": 80.0426,
	  "water1_dm": 8.6535,
	  "oil2_dm": 7.46114,
	  "wing_l_dm": 137.151,
	  "rudder_dm": 36.1973,
	  "fuse1_dm": 108.6
	 },
	 "PartsWithSurface": {
	  "cover4_dm": -2.5496,
	  "cover3_dm": -3.30491,
	  "flap1_r_dm": -3.23378,
	  "flap2_r_dm": -2.81356,
	  "armor8_dm": -3.35445,
	  "armor6_dm": -0.735793,
	  "armor4_dm": -0.968435,
	  "armor7_dm": -5.65633,
	  "armor5_dm": -0.49926,
	  "flap1_l_dm": -3.23378,
	  "flap2_l_dm": -2.81356,
	  "gear_c_dm": -1.06453
	 },
	 "max_fuel_mass": 405,
	 "nitro_mass": 0,
	 "oil_mass": 35,
	 "pilot_mass": 90,
	 "all_ammo_mass": 0
	},
	"SelfSealingTanks": {
	 "tank1_dm": true,
	 "tank2_dm": true,
	 "tank3_dm": true,
	 "tank4_dm": true,
	 "tank5_dm": true,
	 "tank6_dm": true,
	 "tank7_dm": true,
	 "tank8_dm": true
	},
	"Gear": {
	 "SinkFactor": 800.0,
	 "SinkRateMult": 1.01129,
	 "WaterFriction": 1.0,
	 "WaterFrictionDefault": 2.5,
	 "UseCenterOfGravity": true,
	 "RetractableCentralGear": false,
	 "SteerableWheel": false,
	 "FullBrakeSlidingFrictionMult": 0.35,
	 "FrontalSpringsHeight": 0.3,
	 "TailSpringsHeight": 0.1,
	 "FrontalSpringsCoeff": 296674.0,
	 "TailSpringsCoeff": 296674.0,
	 "HasWheels": true,
	 "LeftWheelRadius": 0.339,
	 "RightWheelRadius": 0.339,
	 "CenterWheelRadius": 0.155,
	 "Height": 1.66337,
	 "Pitch": 12.85,
	 "WaterWaveHeightForCheck": [
	  0.0,
	  100.0
	 ],
	 "WaterSpeedPropCheckVal": [
	  0.1,
	  0.1
	 ]
	},
	"Passport": {
	 "mass": 0.0,
	 "climbSpeedNum": 1,
	 "alt0": 0.0,
	 "speedMax0": 0.0,
	 "speedWEP0": 0.0,
	 "climbSpeedIAS": true,
	 "turnTimeFlaps": 0,
	 "Alt": {},
	 "IAS": {}
	},
	"Test": {},
	"engine_count": 1,
	"modifications": {
	 "cd_98": {},
	 "CdMin_Fuse": {},
	 "new_cover": {},
	 "structure_str": {},
	 "hp_105": {},
	 "new_radiator": {},
	 "new_compressor": {},
	 "new_engine_injection": {}
	},
	"engines_are_same": true
   }

// function rename_duplicates(chosenplanes_ingame) {
// 	const counts = {};
// 	return chosenplanes_ingame.map((str) => {
// 		const count = counts[str] || 2;
// 		counts[str] = count + 1;
// 		return count > 2 ? `${str}_${count - 1}?` : str;
// 	});
// }
export async function form_into_graph_maker_new(
	performance_type,
	graph_d,
	power_unit,
	weight_unit,
	power_modes,
	speed_type,
	speed,
	speed_unit,
	max_alt,
	alt_unit,
	air_temp,
	air_temp_unit,
	axis_layout,
	chosenplanes,
	chosenplanes_ingame,
	fuel_percents,
	plane_versions,
	colour_set,
	bg_col
	)
	{if (
		chosenplanes.length === 0 ||
		power_modes.length === 0 ||
		speed_type == null ||
		fuel_percents.some((element) => element > 100 || fuel_percents.some((element) => element < 0)) ||
		plane_versions.length === 0 ||
		performance_type == null ||
		graph_d == null) 
		{return	
	}

	const atmosphere = new Atmosphere();	

	let power_factor = 1;
	if (power_unit === 'kW') {
		power_factor = 1.341021859;
	} else if (power_unit === 'kcal/s') power_factor = 5.610835376;

	let weight_factor = 1;
	if (weight_unit === 'lb') {
		weight_factor = 0.453592;
	} else if (weight_unit === 'oz') {
		weight_factor = 0.0283495;
	} else if (weight_unit === '🐎⚖️') {
		weight_factor = 800;
	}

	let speed_factor = 1;
	if (speed_unit === 'mph') {
		speed_factor = 1.609344;
	} else if (speed_unit === 'kt') {
		speed_factor = 1.852;
	} else if (speed_unit === 'm/s') {
		speed_factor = 3.6;
	} else if (speed_unit === '🐎💨') {
		speed_factor = 40;
	}

	let alt_factor = 1;
	if (alt_unit === 'ft') {
		alt_factor = 0.3048;
	} else if (alt_unit === 'mile') {
		alt_factor = 1609.34;
	} else if (alt_unit === '🐎⬆️') {
		alt_factor = 1.8;
	} else if (alt_unit === 'yard') {
		alt_factor = 0.9144;
	}

	let air_tempC = air_temp;
	if (air_temp_unit === '°F') {
		air_tempC = (air_temp - 32) / 1.8;
	} else if (air_temp_unit === '°K') {
		air_tempC = air_temp - 273.15;
	} else if (air_temp_unit === '🐎🌡️') {
		air_tempC = air_temp * 38;
	}
	
	let speedkph = Math.round(speed * speed_factor);
	let max_altm = Math.round(max_alt * alt_factor);
	let named_power_curves_merged: { [key: string]: { [key: string]: { [key: number]: number } } } ={}; 

    // const url = `https://raw.githubusercontent.com/Alpakinator/wt-aircraft-performance-calculator/main/output_files/plane_mass_files/plane_mass_piston.json`;
	// const url =`https://raw.githubusercontent.com/Alpakinator/wt-aircraft-performance-calculator/main/output_files/out_blkx/blkx_${plane_versions[index]}/${plane}.json`
	let planefm_jsons = {};
	// try {
	// 	const fetchPromises = chosenplanes.map(async (plane, index) => {
	// 		const cacheKey = `${plane_versions[index]}_${plane}`;
	// 		const data = await cacheFetch<any>(
	// 			cacheKey,
	// 			() => fetch(
	// 				`https://raw.githubusercontent.com/Alpakinator/wtapc-data/main/output_files/out_blkx/blkx_${plane_versions[index]}/${plane}.json`
	// 			)
	// 		);
	// 		return { plane, data };
	// 	});
	
	// 	const results = await Promise.all(fetchPromises);
	
	// 	results.forEach(({ plane, data }) => {
	// 		planefm_jsons[plane] = data;
	// 	});
		
	// } catch (error) {
	// 	console.error('Error fetching plane data:', error);
	// 	throw error;
	// }
	console.log('test-fetch', planefm_jsons)

	console.log(g_55_serie_1)
	g_55_serie_1.Engine0.Compressor.SpeedManifoldMultiplier

	}




export async function form_into_graph_maker(
	performance_type,
	graph_d,
	power_unit,
	weight_unit,
	power_modes,
	speed_type,
	speed,
	speed_unit,
	max_alt,
	alt_unit,
	air_temp,
	air_temp_unit,
	axis_layout,
	chosenplanes,
	chosenplanes_ingame,
	fuel_percents,
	plane_versions,
	colour_set,
	bg_col
	) {
	if (
		chosenplanes.length === 0 ||
		power_modes.length === 0 ||
		speed_type == null ||
		fuel_percents.some((element) => element > 100 || fuel_percents.some((element) => element < 0)) ||
		plane_versions.length === 0 ||
		performance_type == null ||
		graph_d == null) 
		{return	
	}

	const atmosphere = new Atmosphere();	

	let power_factor = 1;
	if (power_unit === 'kW') {
		power_factor = 1.341021859;
	} else if (power_unit === 'kcal/s') power_factor = 5.610835376;

	let weight_factor = 1;
	if (weight_unit === 'lb') {
		weight_factor = 0.453592;
	} else if (weight_unit === 'oz') {
		weight_factor = 0.0283495;
	} else if (weight_unit === '🐎⚖️') {
		weight_factor = 800;
	}

	let speed_factor = 1;
	if (speed_unit === 'mph') {
		speed_factor = 1.609344;
	} else if (speed_unit === 'kt') {
		speed_factor = 1.852;
	} else if (speed_unit === 'm/s') {
		speed_factor = 3.6;
	} else if (speed_unit === '🐎💨') {
		speed_factor = 40;
	}

	let alt_factor = 1;
	if (alt_unit === 'ft') {
		alt_factor = 0.3048;
	} else if (alt_unit === 'mile') {
		alt_factor = 1609.34;
	} else if (alt_unit === '🐎⬆️') {
		alt_factor = 1.8;
	} else if (alt_unit === 'yard') {
		alt_factor = 0.9144;
	}

	let air_tempC = air_temp;
	if (air_temp_unit === '°F') {
		air_tempC = (air_temp - 32) / 1.8;
	} else if (air_temp_unit === '°K') {
		air_tempC = air_temp - 273.15;
	} else if (air_temp_unit === '🐎🌡️') {
		air_tempC = air_temp * 38;
	}
	
	let speedkph = Math.round(speed * speed_factor);
	let max_altm = Math.round(max_alt * alt_factor);

	let named_power_curves_merged: { [key: string]: { [key: string]: { [key: number]: number } } } ={}; 
	let all_values: any = [];
	let planejsons: any = {};
	let masses: any = {};

// ##########	
	let promises = chosenplanes.map((plane) => {
		let mass_promise = fetch(
			'https://raw.githubusercontent.com/Alpakinator/wt-aircraft-performance-calculator/main/output_files/plane_mass_files/plane_mass_piston.json'
		)
			.then((response) => {
				if (response.ok) {
					return response.json();
				} else {
					throw new Error('Failed to fetch mass data');
				}
			})
			.then((data) => {
				masses = data;
			})
			.catch((error) => {
				console.error(error);
			});

		let plane_promises = power_modes.map((power_mode) => {
			return fetch(
				`https://raw.githubusercontent.com/Alpakinator/wt-aircraft-performance-calculator/main/output_files/plane_power_files/${plane}_${power_mode}.json`
			)
				.then((response) => {
					if (response.ok) {
						return response.json().then((plane_power) => ({ plane_power, power_mode: power_mode }));
					} else if (
						Array.isArray(power_modes) &&
						power_modes.length === 1 &&
						power_modes[0] === 'WEP'
					) {
						return fetch(
							`https://raw.githubusercontent.com/Alpakinator/wt-aircraft-performance-calculator/main/output_files/plane_power_files/${plane}_military.json`
						).then((response) => {
							if (response.ok) {
								return response
									.json()
									.then((plane_power) => ({ plane_power, power_mode: 'military' }));
							}
						});
					} else {
						throw new Error(`Failed to fetch data for ${plane}`);
					}
				})
				.then((result) => {
					if (result) {
						const { plane_power, power_mode } = result;
						planejsons[plane + '_' + power_mode] = plane_power;
					}
				})
				.catch((error) => {
					console.error(error);
				});
		});
		console.log('proper', Promise.allSettled([...plane_promises, mass_promise]))
		return Promise.allSettled([...plane_promises, mass_promise]);
	});
	Promise.allSettled(promises).then(() => {
		
		// const chosenplanes_ingame_dup = rename_duplicates(chosenplanes_ingame);
		for (let file_name in planejsons) {
			let central_name = file_name.substring(0, file_name.lastIndexOf('_'));
			let index = chosenplanes.findIndex((x) => x === central_name);
			let power_curves_merged = {};
			let mode = file_name.slice(file_name.lastIndexOf('_') + 1);
			let speed_mult = planejsons[file_name]['speed_mult'];
			let ingame_name: string = chosenplanes_ingame[index];
			let power_merged_str_noram = planejsons[file_name]['power_at_alt'];
			if (performance_type === 'power') {
				for (let alt = 0; alt < max_altm; alt += 25) {
					let alt_RAM = rameffect_er(alt, air_tempC, speedkph, speed_type, speed_mult);
					power_curves_merged[alt / alt_factor] =
						power_merged_str_noram[Math.round(alt_RAM / 10) + 400] / power_factor;
					all_values.push(power_merged_str_noram[Math.round(alt_RAM / 10) + 400] / power_factor);
				}
			} else if (performance_type === 'power/weight') {
				ingame_name = ingame_name + ' [' + fuel_percents[index] + '%] ';
				let total_mass =
					masses[central_name]['empty_mass'] +
					masses[central_name]['max_fuel_mass'] * (fuel_percents[index] / 100) +
					masses[central_name]['nitro_mass'] +
					masses[central_name]['oil_mass'] +
					masses[central_name]['pilot_mass'] +
					masses[central_name]['all_ammo_mass'];
				// console.log(ingame_name, total_mass, weight_unit);
				let engine_count = planejsons[file_name]['engine_count'];
				for (let alt = 0; alt < max_altm; alt += 25) {
					let alt_RAM = rameffect_er(alt, air_tempC, speedkph, speed_type, speed_mult);
					let tas: number;
					if (speed_type === 'IAS') {
						tas = atmosphere.tas_from_ias(speed, alt)
					}	else {
						tas = speed
						}
					
					// console.log(alt,"|||", alt_RAM,"|||", atmosphere.ram_effect(alt, tas, speed_mult))
					power_curves_merged[alt / alt_factor] =
						((power_merged_str_noram[Math.round(alt_RAM / 10) + 400] /
							(total_mass * weight_factor)) *
							engine_count) /
						power_factor;
					all_values.push(
						((power_merged_str_noram[Math.round(alt_RAM / 10) + 400] /
							(total_mass * weight_factor)) *
							engine_count) /
							power_factor
					);
				}
			}
			// Add data for each plane without overwriting previous data
			named_power_curves_merged[ingame_name] = named_power_curves_merged[ingame_name] || {};
			// named_power_curves_merged[ingame_name][mode] = power_curves_merged;
			if (mode === 'WEP') {
				named_power_curves_merged[ingame_name] = {
					WEP: power_curves_merged,
					...named_power_curves_merged[ingame_name]
				};
			} else if (mode === 'military') {
				named_power_curves_merged[ingame_name] = {
					...named_power_curves_merged[ingame_name],
					military: power_curves_merged
				};
			}
		}

		let final_data = dict_dataframer(named_power_curves_merged, alt_unit);
		plotter(
			final_data,
			all_values,
			chosenplanes,
			power_unit,
			weight_unit,
			max_alt,
			alt_unit,
			speed,
			speed_type,
			speed_unit,
			air_temp,
			air_temp_unit,
			axis_layout,
			performance_type,
			colour_set,
			hoverstyle,
			bg_col
		);
	});
}

interface PowerCurve {
	[key: number]: number;
}

interface NamedPowerCurves {
	[key: string]: {
		military?: PowerCurve;
		WEP?: PowerCurve;
	};
}

interface DataFrameRow {
	[key: string]: number[] | number | null | undefined;
}

export function dict_dataframer(
	named_power_curves_merged: NamedPowerCurves,
	alt_unit: string
): DataFrameRow[] {
	let altitudeValues: number[] = [];
	let enginePowerData: { [planeName: string]: { [mode: string]: number[] } } = {};

	// Iterate over each plane
	for (let planeName in named_power_curves_merged) {
		let powerCurvesMerged = named_power_curves_merged[planeName];

		// Iterate over each mode (WEP or mil)
		for (let mode in powerCurvesMerged) {
			// Initialize array for engine power values for the current plane and mode combination
			if (!enginePowerData[planeName]) {
				enginePowerData[planeName] = {};
			}

			// Initialize array for the current mode
			enginePowerData[planeName][mode] = [];

			// Iterate over altitude values for the current plane and mode combination
			for (let altitudeStr in powerCurvesMerged[mode]) {
				let altitude = Number(altitudeStr);

				// Store altitude values
				if (!altitudeValues.includes(altitude)) {
					altitudeValues.push(altitude);
				}

				// Store engine power values for the current plane and mode combination
				enginePowerData[planeName][mode].push(powerCurvesMerged[mode][altitudeStr]);
			}
		}
	}

	// Sort altitude values
	altitudeValues.sort((a, b) => a - b);

	// Construct final data frame rows
	let final_data: DataFrameRow[] = [];
	final_data.push({ 'Altitude [m]': altitudeValues });

	// Add engine power data for each plane and mode combination
	// for (let planeName in enginePowerData) {
	// 	let planeData = enginePowerData[planeName];
	// 	for (let mode in planeData) {
	// 		final_data.push({ [planeName + ' (' + mode + ')']: planeData[mode] });
	// 	}
	// }
	for (let planeName in enginePowerData) {
		let planeData = enginePowerData[planeName];
		final_data[planeName] = planeData;
	}

	return final_data;
}

function calculateTickInterval(lowest: number, highest: number): number {
	// Get the range
	const range = highest - lowest;

	// Get order of magnitude using log10
	const magnitude = Math.floor(Math.log10(range));

	// Base tick size is 10^magnitude
	let tickSize = Math.pow(10, magnitude);

	// Adjust tick size based on range within order of magnitude
	if (range / tickSize <= 1) {
		tickSize = tickSize / 10;
	} else if (range / tickSize < 2) {
		tickSize = tickSize / 5;
	} else if (range / tickSize < 5) {
		tickSize = tickSize / 2;
	}

	return tickSize;
}

export function plotter(
	final_data,
	all_values,
	chosenplanes,
	power_unit,
	weight_unit,
	max_alt,
	alt_unit,
	speed,
	speed_type,
	speed_unit,
	air_temp,
	air_temp_unit,
	axis_layout,
	performance_type,
	colour_set,
	hoverstyle,
	bg_col
) {
	// console.log(final_data);
	let font_fam = 'Inter';
	const alt_vals = final_data[0]['Altitude [m]'];
	final_data.shift();
	// console.log(final_data)
	const final_object: {
		x: number;
		y: number;
		mode: string;
		line: { width: number; shape: string; dash: string };
		type: string;
		name: string;
		marker;
		hoverinfo;
		text;
		// hovertemplate;
	}[] = [];

	let highest_x, lowest_x, title, x_axis_title, x_axis_tick;
	let highest_y, lowest_y, y_axis_title, y_axis_tick;
	let no_bugwarning_angle,
		no_bugwarning_x,
		no_bugwarning_y,
		no_bugwarning_x_anchor,
		no_bugwarning_y_anchor;
	let air_temp_info = 'Temperature at sea level: ' + air_temp + ' ' + air_temp_unit;
	let plane: number;
	let colo_index = 0;
	let line_dashes = ['solid', 'dash'];
	if (axis_layout) {
		for (const plane in final_data) {
			let dash_index = 0;
			for (const mode in final_data[plane]) {
				let plane_mode = plane + ' (' + mode + ')';
				final_object.push({
					x: final_data[plane][mode],
					y: alt_vals,
					mode: 'lines',
					line: { width: 3, shape: 'linear', dash: line_dashes[dash_index] },
					type: 'linegl',
					name: plane_mode,
					marker: { color: colour_set[colo_index] },
					hoverinfo: 'x+y+text',
					text: plane_mode
					//         hovertemplate:
					// "%{text}" +
					// "%{yaxis.title.text}: %{y:}<br>" +
					// "%{xaxis.title.text}: %{x:}<br>" +
					// "<extra></extra>"
				});
				dash_index++;
			}
			colo_index++;
		}
		no_bugwarning_angle = 270;
		no_bugwarning_x = 1;
		no_bugwarning_y = 0;
		no_bugwarning_x_anchor = 'right';
		no_bugwarning_y_anchor = 'bottom';
		if (performance_type === 'power') {
			title =
				'Engine power at different altitudes, when flying at ' +
				speed +
				' ' +
				speed_unit +
				' ' +
				speed_type;
			highest_x = Math.max(...all_values);
			lowest_x = Math.min(...all_values);
			highest_x = Math.ceil(highest_x * 1.05);
			lowest_x = Math.floor(lowest_x * 0.95);
			if (lowest_x < 0) {
				lowest_x = 0;
			}
			x_axis_title = 'Power [' + power_unit + ']';
			x_axis_tick = calculateTickInterval(lowest_x, highest_x);
			lowest_y = 0;
			highest_y = max_alt;
			y_axis_title = 'Altitude [' + alt_unit + ']';
			y_axis_tick = calculateTickInterval(lowest_y, highest_y);
		} else if (performance_type === 'power/weight') {
			title =
				'Power-to-weight at different altitudes, when flying at ' +
				speed +
				' ' +
				speed_unit +
				' ' +
				speed_type;
			highest_x = Math.max(...all_values);
			lowest_x = Math.min(...all_values);
			highest_x = highest_x * 1.05;
			lowest_x = lowest_x * 0.95;
			if (lowest_x < 0) {
				lowest_x = 0;
			}
			x_axis_title = 'Power/Weight [' + power_unit + '/' + weight_unit + ']';
			x_axis_tick = calculateTickInterval(lowest_x, highest_x);
			lowest_y = 0;
			highest_y = max_alt;
			y_axis_title = 'Altitude [' + alt_unit + ']';
			y_axis_tick = calculateTickInterval(lowest_y, highest_y);
		}
	} else {
		for (const plane in final_data) {
			let dash_index = 0;
			for (const mode in final_data[plane]) {
				let plane_mode = plane + '(' + mode + ')';
				final_object.push({
					y: final_data[plane][mode],
					x: alt_vals,
					mode: 'lines',
					line: { width: 3, shape: 'linear', dash: line_dashes[dash_index] },
					type: 'linegl',
					name: plane_mode,
					marker: { color: colour_set[colo_index] },
					hoverinfo: 'x+y+text',
					text: plane_mode
					//         hovertemplate:
					//         "<b>%{text}</b><br><br>" +
					// "%{yaxis.title.text}: %{y:$,.0f}<br>" +
					// "%{xaxis.title.text}: %{x:}<br>" +
					// "Number Employed: %{marker.size:,}" +
					// "<extra></extra>"
				});
				dash_index++;
			}
			colo_index++;
		}
		no_bugwarning_angle = 0;
		no_bugwarning_x = 1;
		no_bugwarning_y = -0.008;
		no_bugwarning_x_anchor = 'right';
		no_bugwarning_y_anchor = 'bottom';
		if (performance_type === 'power') {
			title =
				'Engine power at different altitudes, when flying at ' +
				speed +
				' ' +
				speed_unit +
				' ' +
				speed_type;
			highest_y = Math.max(...all_values);
			lowest_y = Math.min(...all_values);
			highest_y = highest_y * 1.05;
			lowest_y = lowest_y * 0.95;
			if (lowest_y < 0) {
				lowest_y = 0;
			}
			y_axis_title = 'Power [' + power_unit + ']';
			y_axis_tick = calculateTickInterval(lowest_y, highest_y);
			lowest_x = 0;
			highest_x = max_alt;
			x_axis_title = 'Altitude [' + alt_unit + ']';
			x_axis_tick = calculateTickInterval(lowest_x, highest_x);
		} else if (performance_type === 'power/weight') {
			title =
				'Power-to-weight at different altitudes, when flying at ' +
				speed +
				' ' +
				speed_unit +
				' ' +
				speed_type;
			highest_y = Math.max(...all_values);
			lowest_y = Math.min(...all_values);
			highest_y = highest_y * 1.05;
			lowest_y = lowest_y * 0.95;
			if (lowest_y < 0) {
				lowest_y = 0;
			}
			y_axis_title = 'Power/Weight [' + power_unit + '/' + weight_unit + ']';
			y_axis_tick = calculateTickInterval(lowest_y, highest_y);
			lowest_x = 0;
			highest_x = max_alt;
			x_axis_title = 'Altitude [' + alt_unit + ']';
			x_axis_tick = calculateTickInterval(lowest_x, highest_x);
		}
	}
	var layout = {
		uirevision: 'true',
		paper_bgcolor: bg_col,
		plot_bgcolor: bg_col,
		autosize: true,
		title: { text: title, font: { size: 22 }, x: 0.5 },
		legend: {
			yanchor: 'top',
			y: 1,
			xanchor: 'right',
			x: 1,
			font: { size: 16, family: font_fam },
			title: null
		},
		showlegend: true,
		hoverlabel: { font: { color: '#fdfdfde6', size: 16 }, bordercolor: '#142E40', borderwidth: 1 },
		hovermode: hoverstyle,
		font: { family: font_fam, color: '#fdfdfde6' },
		margin: { l: 110, r: 25, b: 65, t: 60, pad: 5 },
		modebar: {
			orientation: 'v',
			xanchor: 'left',
			yanchor: 'bottom',
			bgcolor: 'rgba(0,0,0,0)',
			color: 'rgb(205, 215, 225)',
			activecolor: 'rgb(0, 111, 161)',
			font: { size: 24 },
			add: ['hoverclosest', 'hovercompare'],
			remove: ['autoscale']
		},
		dragmode: 'pan',
		annotations: [
			{
				text: air_temp_info,
				showarrow: false,
				font: { size: 14 },
				x: 0,
				y: -0.08,
				xref: 'paper',
				yref: 'paper',
				xanchor: 'left',
				yanchor: 'bottom'
			},
			{
				text: "Do not use in War Thunder bug reports, because it's not <br>a valid source. Otherwise Gaijin can ban datamining forever!",
				opacity: 0.35,
				showarrow: false,
				font: { size: 16, color: 'white', family: font_fam },
				x: no_bugwarning_x,
				y: no_bugwarning_y,
				xref: 'paper',
				yref: 'paper',
				xanchor: no_bugwarning_x_anchor,
				yanchor: no_bugwarning_y_anchor,
				textangle: no_bugwarning_angle
			}
		],
		xaxis: {
			gridcolor: '#1A242E',
			gridwidth: 2,
			zerolinecolor: '#1A242E',
			zerolinewidth: 3,
			font: { size: 18, family: 'CrimsonPro', color: '#fdfdfde6' },
			title: { text: x_axis_title, font: { size: 18 }, standoff: 20 },
			range: [lowest_x, highest_x],
			// autorange: true,
			dtick: x_axis_tick,
			tickfont: { size: 16 }
		},
		yaxis: {
			gridcolor: '#1A242E',
			gridwidth: 2,
			zerolinecolor: '#1A242E',
			zerolinewidth: 3,
			font: { size: 18, family: 'CrimsonPro', color: '#fdfdfde6' },
			title: { text: y_axis_title, font: { size: 18 }, standoff: 10 },
			range: [lowest_y, highest_y],
			// autorange: true,
			dtick: y_axis_tick,
			tickfont: { size: 16 }
		},
		images: [
			{
				x: 0,
				y: 0.0015,
				sizex: 0.11,
				sizey: 0.11,
				source: 'images/WTAPC_logo_nograph_text.png',
				opacity: 0.5,
				xanchor: 'left',
				xref: 'paper',
				yanchor: 'bottom',
				yref: 'paper'
			}
		]
	};
	var config = {
		scrollZoom: true,
		displayModeBar: true,
		displaylogo: false,
		responsive: true,
		showEditInChartStudio: true,
		plotlyServerURL: 'https://chart-studio.plotly.com',
		toImageButtonOptions: {
			filename: 'performance_plot',
			format: 'png'
		}
	};
	console.log(Plotly.react('graphid', final_object, layout, config));
	Plotly.react('graphid', final_object, layout, config);

	// return final_plot;
}

// { text: 'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>', "opacity": 0.06, showarrow: false, font: { size: 30, family: ['symbols_skyquake', "Intervar"]}, x: 0.53, y: 0, xref: "paper", yref: "paper", xanchor: "left", yanchor: "bottom"},

// }else if(power_unit === 'hh'){
// 	power_factor = 0.0000000488
// }
