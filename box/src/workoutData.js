import { PUNCH_JAB, PUNCH_LEFT_HOOK, PUNCH_RIGHT_HOOK, PUNCH_RIGHT_UPPERCUT, PUNCH_LEFT_UPPERCUT, PUNCH_STRAIGHT } from "./punchDetector";

export const ROUND_HEAVY_BAG = 0;
export const ROUND_DOUBLE_END_BAG = 1;

export const ROUNDTYPE_SCRIPTED = 0;
export const ROUNDTYPE_NUM_PUNCHES = 1;
export const ROUNDTYPE_TIMED = 2;
export const ROUNDTYPE_SPEED = 3;
export const ROUNDTYPE_NUM_PUNCHES_TIMEADJUSTED = 4;
export const ROUNDTYPE_NUM_SPECIFIC_PUNCHES = 5;

export let workoutData = [
    [
        {
            introText: "INTRO WORKOUT:\n" +
                " \u2022 Practice the basic punches.\n" + 
                " \u2022 5 rounds of drills.",
            uiShortText: "INTRO WORKOUT",
            uiText: "INTRO WORKOUT:<ul><li>Practice the basic punches.</li><li>5 rounds of drills.</li></ul>",
            uid: 10,
            stages:[],
            bagType: null
        },
        
        {
            introText: "JAB and STRAIGHT:\n" + 
                " \u2022 Focus on form, then ramp up the speed.",
            bagType: ROUND_HEAVY_BAG,
            roundType: ROUNDTYPE_SCRIPTED,
            stages:
            [
                {
                    startTimePercent: 0.0,
                    descriptionText: "JAB: 1"
                },
                {
                    startTimePercent: 0.25,
                    descriptionText: "STRAIGHT: 2"
                },
                {
                    startTimePercent: 0.5,
                    descriptionText: "DOUBLE JAB: 1-1"
                },
                {
                    startTimePercent: 0.75,
                    descriptionText: "JAB then STRAIGHT:\n1-2"
                }
            ]
        },
        {
            introText: "LEAD and REAR HOOK:\n" + 
            " \u2022 Focus on form, then ramp up the speed.",
            bagType: ROUND_HEAVY_BAG,
            roundType: ROUNDTYPE_SCRIPTED,
            stages:
            [
                {
                    startTimePercent: 0.0,
                    descriptionText: "LEAD HOOK: 3"
                },
                {
                    startTimePercent: 0.25,
                    descriptionText: "REAR HOOK: 4"
                },
                {
                    startTimePercent: 0.5,
                    descriptionText: "STRAIGHT then L.HOOK:\n2-3"
                },
                {
                    startTimePercent: 0.75,
                    descriptionText: "JAB then R.HOOK:\n1-4"
                }
            ]
        },
        {
            introText: "LEAD and REAR UPPERCUT:\n" + 
            " \u2022 Focus on form, then ramp up the speed.",
            bagType: ROUND_HEAVY_BAG,
            roundType: ROUNDTYPE_SCRIPTED,
            stages:
            [
                {
                    startTimePercent: 0.0,
                    descriptionText: "LEFT UPPERCUT: 5"
                },
                {
                    startTimePercent: 0.25,
                    descriptionText: "RIGHT UPPERCUT: 6"
                },
                {
                    startTimePercent: 0.5,
                    descriptionText: "STRAIGHT then L.UPPER:\n2-5"
                },

                {
                    startTimePercent: 0.75,
                    descriptionText: "JAB then R.UPPER:\n1-6"
                }
            ]
        },
        {
            bagType: ROUND_HEAVY_BAG,
            roundType: ROUNDTYPE_SPEED,
            stages:[
                {
                    startTimePercent: 0.0,
                    targetPPM: 200,
                },
                {
                    startTimePercent: 0.25,
                    targetPPM: 250,
                },
                {
                    startTimePercent: 0.75,
                    targetPPM: 300,
                }
            ]
        },
        {
            bagType: ROUND_HEAVY_BAG,
            roundType: ROUNDTYPE_NUM_SPECIFIC_PUNCHES,
            stages:
            [
                {
                    punchType: PUNCH_JAB,
                    numPunches: 25,
                },
                {
                    punchType: PUNCH_STRAIGHT,
                    numPunches: 25
                },
                {
                    punchType: PUNCH_LEFT_HOOK,
                    numPunches: 25,
                },
                {
                    punchType: PUNCH_RIGHT_HOOK,
                    numPunches: 25,
                },
                {
                    punchType: PUNCH_LEFT_UPPERCUT,
                    numPunches: 25
                },
                {
                    punchType: PUNCH_RIGHT_UPPERCUT,
                    numPunches: 25
                }
            ]
        }
    ],

    [
        {
            introText: "INTERMEDIATE WORKOUT:\n" +
                " \u2022 2- and 3-punch combos.\n" + 
                " \u2022 Double-end bag speed round.\n" + 
                " \u2022 7 rounds of drills.",
            uiShortText: "INT. WORKOUT",
            uiText: "INTERMEDIATE WORKOUT:<ul><li>2- and 3-punch combos</li><li>Double-end bag speed round.</li><li>7 rounds of drills.</li></ul>",
            uid: 11,
            stages:[],
            bagType: null
        },
        { // WARM UP
            numPunchesPerMinute: 100,
            bagType: ROUND_HEAVY_BAG,
            roundType: ROUNDTYPE_NUM_PUNCHES_TIMEADJUSTED
        },
        {
            introText: "2-PUNCH COMBOS:\n" + 
                " \u2022 Focus on form, then ramp up the speed.\n" +
                " \u2022 Keep your guard up.",
            bagType: ROUND_HEAVY_BAG,
            roundType: ROUNDTYPE_SCRIPTED,
            stages:
            [
                {
                    startTimePercent: 0.0,
                    descriptionText: "1-1"
                },
                {
                    startTimePercent: 0.25,
                    descriptionText: "1-2"
                },
                {
                    startTimePercent: 0.5,
                    descriptionText: "1-4"
                },
                {
                    startTimePercent: 0.75,
                    descriptionText: "1-6"
                }
            ]
        },
        {
            introText: "2-PUNCH COMBOS:\n" + 
                " \u2022 Focus on form, then ramp up the speed.",
            bagType: ROUND_DOUBLE_END_BAG,
            roundType: ROUNDTYPE_SCRIPTED,
            stages:
            [
                {
                    startTimePercent: 0.0,
                    descriptionText: "1-1"
                },
                {
                    startTimePercent: 0.25,
                    descriptionText: "1-2"
                },
                {
                    startTimePercent: 0.5,
                    descriptionText: "1-4"
                },
                {
                    startTimePercent: 0.75,
                    descriptionText: "1-6"
                }
            ]
        },
        {
            bagType: ROUND_DOUBLE_END_BAG,
            roundType: ROUNDTYPE_SPEED,
            stages:[
                {
                    startTimePercent: 0.0,
                    targetPPM: 250,
                },
                {
                    startTimePercent: 0.25,
                    targetPPM: 275,
                },
                {
                    startTimePercent: 0.75,
                    targetPPM: 300,
                }
            ]
        },
        {
            introText: "3-PUNCH COMBOS:\n" + 
                " \u2022 Focus on form, then ramp up the speed.",
            bagType: ROUND_HEAVY_BAG,
            roundType: ROUNDTYPE_SCRIPTED,
            stages:
            [
                {
                    startTimePercent: 0.0,
                    descriptionText: "1-1-2"
                },
                {
                    startTimePercent: 0.5,
                    descriptionText: "1-1-4"
                },
                {
                    startTimePercent: 0.25,
                    descriptionText: "1-2-3"
                },
                {
                    startTimePercent: 0.75,
                    descriptionText: "1-2-5"
                }
            ]
        },
        {
            introText: "3-PUNCH COMBOS:\n" + 
                " \u2022 Focus on form, then ramp up the speed.\n" +
                " \u2022 Keep your guard up.",
            bagType: ROUND_DOUBLE_END_BAG,
            roundType: ROUNDTYPE_SCRIPTED,
            stages:
            [
                {
                    startTimePercent: 0.0,
                    descriptionText: "1-1-2"
                },
                {
                    startTimePercent: 0.5,
                    descriptionText: "1-1-4"
                },
                {
                    startTimePercent: 0.25,
                    descriptionText: "1-2-3"
                },
                {
                    startTimePercent: 0.75,
                    descriptionText: "1-2-5"
                }
            ]
        },
        {
            introText:
                "HEAVY BAG FREESTYLE:\n"+
                " \u2022 Put those 2- and 3-punch combos together.",
            bagType: ROUND_HEAVY_BAG,
            roundType: ROUNDTYPE_TIMED,
        }
    ],
    

    [
        {
            introText: "ADVANCED WORKOUT:\n" +
                " \u2022 More complex combos.\n" + 
                " \u2022 Double-end bag speed round.\n" + 
                " \u2022 7 rounds of drills.",
            uiShortText: "ADV. WORKOUT",
            uiText: "ADVANCED WORKOUT:<ul><li>More complex combos</li><li>Double-end bag speed round.</li><li>7 rounds of drills.</li></ul>",
            uid: 12,
            stages:[],
            bagType: null
        },
        { // WARM UP
            numPunchesPerMinute: 150,
            bagType: ROUND_HEAVY_BAG,
            roundType: ROUNDTYPE_NUM_PUNCHES_TIMEADJUSTED
        },
        {
            introText: "3-PUNCH COMBOS:\n" + 
                " \u2022 Focus on form, then ramp up the speed.\n",
            bagType: ROUND_HEAVY_BAG,
            roundType: ROUNDTYPE_SCRIPTED,
            stages:
            [
                {
                    startTimePercent: 0.0,
                    descriptionText: "1-2-3"
                },
                {
                    startTimePercent: 0.25,
                    descriptionText: "1-4-5"
                },
                {
                    startTimePercent: 0.5,
                    descriptionText: "2-3-6"
                },
                {
                    startTimePercent: 0.75,
                    descriptionText: "1-3-2"
                }
            ]
        },
        {
            introText: "4-PUNCH COMBOS:\n" + 
                " \u2022 Focus on form, then ramp up the speed.",
            bagType: ROUND_HEAVY_BAG,
            roundType: ROUNDTYPE_SCRIPTED,
            stages:
            [
                {
                    startTimePercent: 0.0,
                    descriptionText: "1-2-1-4"
                },
                {
                    startTimePercent: 0.25,
                    descriptionText: "1-2-3-4"
                },
                {
                    startTimePercent: 0.5,
                    descriptionText: "1-1-2-3"
                },
                {
                    startTimePercent: 0.75,
                    descriptionText: "1-2-1-6"
                }
            ]
        },
        {
            introText: "3-PUNCH COMBOS:\n" + 
                " \u2022 Focus on form, then ramp up the speed.\n" +
                " \u2022 Keep your guard up.",
            bagType: ROUND_DOUBLE_END_BAG,
            roundType: ROUNDTYPE_SCRIPTED,
            stages:
            [
                {
                    startTimePercent: 0.0,
                    descriptionText: "1-1-2"
                },
                {
                    startTimePercent: 0.25,
                    descriptionText: "1-2-1"
                },
                {
                    startTimePercent: 0.5,
                    descriptionText: "1-1-4"
                },
                {
                    startTimePercent: 0.75,
                    descriptionText: "1-2-3"
                }
            ]
        },
        {
            introText: "5-PUNCH COMBOS:\n" + 
                " \u2022 Focus on form, then ramp up the speed.",
            bagType: ROUND_HEAVY_BAG,
            roundType: ROUNDTYPE_SCRIPTED,
            stages:
            [
                {
                    startTimePercent: 0.0,
                    descriptionText: "1-1-2-3-4"
                },
                {
                    startTimePercent: 0.25,
                    descriptionText: "1-2-1-4-5"
                },
                {
                    startTimePercent: 0.5,
                    descriptionText: "1-4-3-6-6"
                },
                {
                    startTimePercent: 0.75,
                    descriptionText: "1-3-2-2-1"
                }
            ]
        },
        {
            bagType: ROUND_DOUBLE_END_BAG,
            roundType: ROUNDTYPE_SPEED,
            stages:[
                {
                    startTimePercent: 0.0,
                    targetPPM: 275,
                },
                {
                    startTimePercent: 0.25,
                    targetPPM: 300,
                },
                {
                    startTimePercent: 0.75,
                    targetPPM: 325,
                }
            ]
        },
        {
            introText:
                "HEAVY BAG FREESTYLE:\n"+
                " \u2022 Close it out however you want.",
            bagType: ROUND_HEAVY_BAG,
            roundType: ROUNDTYPE_TIMED,
        }
    ],
    /*
    [
        {
            introText: "BASIC WORKOUT:\n" +
                " \u2022 5 rounds of drills.\n" +
                " \u2022 A little of everything to keep it interesting.",
            uiShortText: "BASIC WORKOUT",
            uiText: "BASIC WORKOUT:<ul><li>5 rounds of drills.</li><li>A little of everything to keep it interesting.</li></ul>",
            uid: 4,
            stages:[],
            bagType: null
        },
        {
            numPunchesPerMinute: 100,
            bagType: ROUND_HEAVY_BAG,
            roundType: ROUNDTYPE_NUM_PUNCHES_TIMEADJUSTED
        },
        {
            numPunchesPerMinute: 100,
            bagType: ROUND_DOUBLE_END_BAG,
            roundType: ROUNDTYPE_NUM_PUNCHES_TIMEADJUSTED
        },
        {
            introText: 
                "BASIC COMBOS:\n" +
                " \u2022 Focus on form, then ramp up the speed.",
            bagType: ROUND_HEAVY_BAG,
            roundType: ROUNDTYPE_SCRIPTED,
            stages:[
                {
                    startTimePercent: 0.0,
                    descriptionText: "1-2, 1-1-2"
                },
                {
                    startTimePercent: 0.25,
                    descriptionText: "1-2-3"
                },
                {
                    startTimePercent: 0.5,
                    descriptionText: "1-2-1-4"
                },

                {
                    startTimePercent: 0.75,
                    descriptionText: "1-2-3-4"
                }

            ]
        },
        {
            introText: 
                "DOUBLE-END COMBOS:\n" +
                " \u2022 Focus on form, then ramp up the speed.",
            bagType: ROUND_DOUBLE_END_BAG,
            roundType: ROUNDTYPE_SCRIPTED,
            stages:[
                {
                    startTimePercent: 0.0,
                    descriptionText: "1-2"
                },
                {
                    startTimePercent: 0.25,
                    descriptionText: "1-1-2"
                },
                {
                    startTimePercent: 0.5,
                    descriptionText: "1-2-1"
                },
                {
                    startTimePercent: 0.75,
                    descriptionText: "1-2-5"
                }
            ]
        },
        {
            // introText: 
            //     "DOUBLE-END SPEED:\n" +
            //     " \u2022 Start at 300PPM\n" + 
            //     " \u2022 Ramp up to 350PPM\n" + 
            //     " \u2022 Finish off at 400PPM\n",
            stages:[
                {
                    startTimePercent: 0.0,
                    targetPPM: 200,
                },
                {
                    startTimePercent: 0.25,
                    targetPPM: 250,
                },
                {
                    startTimePercent: 0.75,
                    targetPPM: 300,
                }
            ],
            bagType: ROUND_HEAVY_BAG,
            roundType: ROUNDTYPE_SPEED
        },
        {
            introText:
                "HEAVY BAG FREESTYLE:\n"+
                " \u2022 Close it out however you want.",
            bagType: ROUND_HEAVY_BAG,
            roundType: ROUNDTYPE_TIMED,
        }
    ],
    [
        {
            introText: "COMBO WORKOUT:\n" +
                " \u2022 6 round of drills.\n" +
                " \u2022 Warm up, then focus on combos.",
            uiShortText: "COMBO WORKOUT",
            uiText: "COMBO WORKOUT:<ul><li>5 rounds of drills.</li><li>Warm up, then focus on combos.</li><li>Mostly heavy bag with a dash of double-end mixed in.</li></ul>",
            uid: 2,
            stages:[],
            bagType: null
        },
        {
            introText: "WARM UP - THROW 100 PUNCHES",
            numPunches: 100,
            bagType: ROUND_HEAVY_BAG,
            roundType: ROUNDTYPE_NUM_PUNCHES
        },
        {
            // introText: 
            //     "SPEED ROUND:\n" + 
            //     " \u2022 Alternate JAB(1) & STRAIGHT(2).\n" +
            //     " \u2022 Start at 350PPM, ramp to 375PPM, finish at 400PPM\n",
            bagType: ROUND_HEAVY_BAG,
            roundType: ROUNDTYPE_SPEED,
            stages:[
                {
                    startTimePercent: 0.0,
                    // descriptionText: "Target is 350+PPM",
                    targetPPM: 350,
                },
                {
                    startTimePercent: 0.25,
                    // descriptionText: "Target is 375+PPM",
                    targetPPM: 375,
                },
                {
                    startTimePercent: 0.75,
                    // descriptionText: "Finish at 400+PPM",
                    targetPPM: 400,
                }
            ]
        },
        {
            introText: 
                "HEAVY BAG COMBOS:\n" +
                " \u2022 Try some different combos.\n" +
                " \u2022 Focus on form, then increase speed.",
            bagType: ROUND_HEAVY_BAG,
            roundType: ROUNDTYPE_SCRIPTED,
            stages: [
                {
                    startTimePercent: 0.0,
                    descriptionText: "1-2-3"
                },
                {
                    startTimePercent: 0.25,
                    descriptionText: "1-1-4-3"
                },
                {
                    startTimePercent: 0.5,
                    descriptionText: "1-2-3-2"
                },
                {
                    startTimePercent: 0.75,
                    descriptionText: "1-2-1-4"
                }
            ],
        },
        {
            introText: 
                "DOUBLE-END COMBOS:\n" +
                " \u2022 Try some different combos.\n" +
                " \u2022 Focus on form, then increase speed.",
            bagType: ROUND_DOUBLE_END_BAG,
            roundType: ROUNDTYPE_SCRIPTED,
            stages: [
                {
                    startTimePercent: 0.0,
                    descriptionText: "1-2, 1-1-2"
                },
                {
                    startTimePercent: 0.25,
                    descriptionText: "2-3"
                },
                {
                    startTimePercent: 0.5,
                    descriptionText: "1-4"
                },
                {
                    startTimePercent: 0.75,
                    descriptionText: "1-2-3"
                },
            ],
        },
        {
            introText: 
                "UPPER CUT COMBOS:\n" +
                " \u2022 Work in some upper cuts.\n" +
                " \u2022 Focus on form, then increase speed.",
            bagType: ROUND_DOUBLE_END_BAG,
            roundType: ROUNDTYPE_SCRIPTED,
            stages: [
                {
                    startTimePercent: 0.0,
                    descriptionText: "1-1-2-5"
                },                {
                    startTimePercent: 0.25,
                    descriptionText: "1-2-1-6"
                },
                {
                    startTimePercent: 0.5,
                    descriptionText: "1-1-2-3-6"
                },
                {
                    startTimePercent: 0.75,
                    descriptionText: "1-2-1-4-5-6"
                },

            ],
        },
        {
            introText:
                "HEAVY BAG FREESTYLE:\n"+
                " \u2022 Close it out however you want.",
            bagType: ROUND_HEAVY_BAG,
            roundType: ROUNDTYPE_TIMED,
        }
    ],




    [
        {
            introText: "COMBO WORKOUT:\n" +
                " \u2022 6 round of drills.\n" +
                " \u2022 Warm up, then focus on combos.",
            uiShortText: "COMBO WORKOUT",
            uiText: "COMBO WORKOUT 2:<ul><li>6 rounds of drills.</li><li>Warm up, then focus on combos.</li><li>Mostly heavy bag with a dash of double-end mixed in.</li></ul>",
            uid: 5,
            stages:[],
            bagType: null
        },
        {
            numPunchesPerMinute: 100,
            bagType: ROUND_HEAVY_BAG,
            roundType: ROUNDTYPE_NUM_PUNCHES_TIMEADJUSTED
        },
        {
            introText: 
                "BASIC COMBOS:\n" +
                " \u2022 Try some simple combos.\n" +
                " \u2022 Focus on form, then increase speed.",
            bagType: ROUND_HEAVY_BAG,
            roundType: ROUNDTYPE_SCRIPTED,
            stages: [
                {
                    startTimePercent: 0.0,
                    descriptionText: "1-2"
                },
                {
                    startTimePercent: 0.25,
                    descriptionText: "1-1-2"
                },
                {
                    startTimePercent: 0.5,
                    descriptionText: "1-2-1"
                },
                {
                    startTimePercent: 0.75,
                    descriptionText: "1-2-3"
                }
            ],
        },
        {
            introText: 
                "MORE COMBOS:\n" +
                " \u2022 Try some different combos.\n" +
                " \u2022 Focus on form, then increase speed.",
            bagType: ROUND_HEAVY_BAG,
            roundType: ROUNDTYPE_SCRIPTED,
            stages: [
                {
                    startTimePercent: 0.0,
                    descriptionText: "1-2-1-4"
                },
                {
                    startTimePercent: 0.25,
                    descriptionText: "1-1-2-3"
                },
                {
                    startTimePercent: 0.5,
                    descriptionText: "1-2-3-4"
                },
                {
                    startTimePercent: 0.75,
                    descriptionText: "1-2-1-4-3"
                }
            ],
        },
        {
            introText: 
                "DOUBLE-END COMBOS:\n" +
                " \u2022 Try some simple combos.\n" +
                " \u2022 Things are trickier on the double-end bag.",
            bagType: ROUND_DOUBLE_END_BAG,
            roundType: ROUNDTYPE_SCRIPTED,
            stages: [
                {
                    startTimePercent: 0.0,
                    descriptionText: "1-2, 1-1-2"
                },
                {
                    startTimePercent: 0.25,
                    descriptionText: "2-3"
                },
                {
                    startTimePercent: 0.5,
                    descriptionText: "1-4"
                },
                {
                    startTimePercent: 0.75,
                    descriptionText: "1-2-3"
                },
            ],
        },
        {
            introText: 
                "UPPER CUT COMBOS:\n" +
                " \u2022 Work in some upper cuts.\n" +
                " \u2022 Focus on form, then increase speed.",
            bagType: ROUND_DOUBLE_END_BAG,
            roundType: ROUNDTYPE_SCRIPTED,
            stages: [
                {
                    startTimePercent: 0.0,
                    descriptionText: "1-1-2-5"
                },                {
                    startTimePercent: 0.25,
                    descriptionText: "1-2-1-6"
                },
                {
                    startTimePercent: 0.5,
                    descriptionText: "1-1-2-3-6"
                },
                {
                    startTimePercent: 0.75,
                    descriptionText: "1-2-1-4-5-6"
                },

            ],
        },
        // {
        //     introText: 
        //         "STILL MORE COMBOS:\n" +
        //         " \u2022 Try some more complex combos.\n" +
        //         " \u2022 Focus on form, then increase speed.",
        //     bagType: ROUND_HEAVY_BAG,
        //     roundType: ROUNDTYPE_SCRIPTED,
        //     stages: [
        //         {
        //             startTimePercent: 0.0,
        //             descriptionText: "1-2-3-2"
        //         },
        //         {
        //             startTimePercent: 0.25,
        //             descriptionText: "1-4-3-2"
        //         },
        //         {
        //             startTimePercent: 0.5,
        //             descriptionText: "1-1-2-3-4"
        //         },
        //         {
        //             startTimePercent: 0.75,
        //             descriptionText: "1-2-1-1-4-3"
        //         }
        //     ],
        // },
        {
            introText:
                "HEAVY BAG FREESTYLE:\n"+
                " \u2022 Close it out however you want.",
            bagType: ROUND_HEAVY_BAG,
            roundType: ROUNDTYPE_TIMED,
        }
    ],
    [
        {
            introText: "NEED FOR SPEED:\n" +
                " \u2022 2 rounds of speed drills.\n" +
                " \u2022 Heavy Bag, then Double-End Bag.",
            uiShortText: "NEED FOR SPEED",
            uiText: "NEED FOR SPEED:<ul><li>2 rounds of speed drills.</li><li>Heavy Bag, then Double-End Bag.</li></ul>",
            uid: 3,
            stages:[],
            bagType: null
        },
        {
            // introText: null,
                // "HEAVY BAG SPEED:\n" +
                // " \u2022 Start at 350PPM\n" + 
                // " \u2022 Ramp up to 400PPM\n" + 
                // " \u2022 Finish off at 450PPM\n",
            stages:[
                {
                    startTimePercent: 0.0,
                    // descriptionText: "Stay above 350 PPM",
                    targetPPM: 350,
                },
                {
                    startTimePercent: 0.25,
                    // descriptionText: "Go for 400 PPM",
                    targetPPM: 400,
                },
                {
                    startTimePercent: 0.75,
                    // descriptionText: "Finish at 450PPM",
                    targetPPM: 450,
                }
            ],
            bagType: ROUND_HEAVY_BAG,
            roundType: ROUNDTYPE_SPEED
        },
        {
            // introText: null,
                // "DOUBLE-END SPEED:\n" +
                // " \u2022 Start at 300PPM\n" + 
                // " \u2022 Ramp up to 350PPM\n" + 
                // " \u2022 Finish off at 400PPM\n",
            stages:[
                {
                    startTimePercent: 0.0,
                    // descriptionText: "Stay above 300 PPM",
                    targetPPM: 300,
                },
                {
                    startTimePercent: 0.25,
                    // descriptionText: "Go for 350 PPM",
                    targetPPM: 350,
                },
                {
                    startTimePercent: 0.75,
                    // descriptionText: "Finish at 400PPM",
                    targetPPM: 400,
                }
            ],
            bagType: ROUND_DOUBLE_END_BAG,
            roundType: ROUNDTYPE_SPEED
        }
    ],
    */
];