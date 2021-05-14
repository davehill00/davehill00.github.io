export const ROUND_HEAVY_BAG = 0;
export const ROUND_DOUBLE_END_BAG = 1;

export const ROUNDTYPE_SCRIPTED = 0;
export const ROUNDTYPE_NUM_PUNCHES = 1;
export const ROUNDTYPE_TIMED = 2;
export const ROUNDTYPE_SPEED = 3;
export const ROUNDTYPE_NUM_PUNCHES_TIMEADJUSTED = 4;

export let workoutData = [

    // WORKOUT 1
    //[
    //     {
    //         introText: "DOUBLE-END BAG #1:\n" +
    //             " \u2022 6 rounds of double-end bag drills.\n" +
    //             " \u2022 Focus on accuracy then speed.\n" +
    //             " \u2022 The double-end bag can hit back, so keep your guard up!",
    //         uiShortText: "D.E.B. INSANITY",
    //         uiText: "DOUBLE-END BAG INSANITY:<br>6 rounds of drills. All double-end, all the time!<br>So much good stuff to do...<br><br> it'll blow your mind right out of your ear holes!!!",
    //         uid: 1,
    //         stages:[],
    //         bagType: null
    //     },
    //     {
    //         introText: "THROW 100 PUNCHES",
    //         numPunches: 100,
    //         bagType: ROUND_DOUBLE_END_BAG,
    //         roundType: ROUNDTYPE_NUM_PUNCHES
    //     },

    //     {
    //         introText: 
    //             "JAB THEN STRAIGHT:\n" +
    //             " \u2022 Throw JABs(1) and move around the bag for the first half.\n" +
    //             " \u2022 Throw STRAIGHTs(2) and move around the bag for the second half.",
    //         stages: [
    //             {
    //                 startTimePercent: 0.0,
    //                 descriptionText: "JAB(1) and move around the bag."
    //             },
    //             {
    //                 startTimePercent: 0.5,
    //                 descriptionText: "STRAIGHT(2) and move around the bag."
    //             }
    //         ],
    //         bagType: ROUND_DOUBLE_END_BAG,
    //         roundType: ROUNDTYPE_SCRIPTED
    //     },
    //     {
    //         introText: 
    //             "JAB, HOOK, STRAIGHT, HOOK:\n" +
    //             " \u2022 Throw JAB(1) then RIGHT HOOK(4) for the first half.\n" +
    //             " \u2022 Throw STRAIGHT(2) then LEFT HOOK(3) for the second half.\n",
    //         stages: [
    //             {
    //                 startTimePercent: 0.0,
    //                 descriptionText: "JAB(1) then RIGHT HOOK(4)"
    //             },
    //             {
    //                 startTimePercent: 0.5,
    //                 descriptionText: "STRAIGHT(2) then LEFT HOOK(3)"
    //             }
    //         ],
    //         bagType: ROUND_DOUBLE_END_BAG,
    //         roundType: ROUNDTYPE_SCRIPTED
    //     },
    //     {
    //         introText: 
    //             "THE OLD ONE-TWO PUNCH:\n" +
    //             " \u2022 Throw JAB(1) then STRAIGHT(2) for the first half.\n" +
    //             " \u2022 Throw 2 JABs(1) in quick succession then STRAIGHT(2) for the second half.\n",
    //         stages: [
    //             {
    //                 startTimePercent: 0.0,
    //                 descriptionText: "JAB(1) then STRAIGHT(2)."
    //             },
    //             {
    //                 startTimePercent: 0.5,
    //                 descriptionText: "JAB(1), JAB(1), STRAIGHT(2)."
    //             }
    //         ],
    //         bagType: ROUND_DOUBLE_END_BAG,
    //         roundType: ROUNDTYPE_SCRIPTED
    //     },
    //     {
    //         introText: 
    //             "CAPTAIN HOOK:\n" +
    //             " \u2022 Throw LEFT HOOKs(3) and move around the bag for the first half.\n" +
    //             " \u2022 Throw RIGHT HOOKs(4) and move around the bag for the second half.\n",
    //         stages: [
    //             {
    //                 startTimePercent: 0.0,
    //                 descriptionText: "LEFT HOOK(3) and move around the bag."
    //             },
    //             {
    //                 startTimePercent: 0.5,
    //                 descriptionText: "RIGHT HOOK(4) and move around the bag."
    //             }
    //         ],
    //         bagType: ROUND_DOUBLE_END_BAG,
    //         roundType: ROUNDTYPE_SCRIPTED
    //     },
    //     {
    //         introText: 
    //             "JAB-STRAIGHT COMBOS:\n" +
    //             " \u2022 Throw 2 JABs(1), then a STRAIGHT(2), then a JAB (1), then a STRAIGHT(2).\n",
    //         stages: [
    //             {
    //                 startTimePercent: 0.0,
    //                 descriptionText: "JAB(1), JAB(1), STRAIGHT(2), JAB(1), STRAIGHT (2)."
    //             }
    //         ],
    //         bagType: ROUND_DOUBLE_END_BAG,
    //         roundType: ROUNDTYPE_SCRIPTED
    //     },
    // ],
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
            introText: "WARM UP - THROW 100 PUNCHES",
            numPunches: 100,
            bagType: ROUND_HEAVY_BAG,
            roundType: ROUNDTYPE_NUM_PUNCHES
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
                    descriptionText: "1-2-1"
                },

                {
                    startTimePercent: 0.75,
                    descriptionText: "1-2-1-4"
                }

            ]
        },
        {
            introText: 
                "DOUBLE-END HOOKS:\n" +
                " \u2022 JAB(1) then HOOK(4).\n" +
                " \u2022 STRAIGHT(2) then HOOK(3).",
            bagType: ROUND_DOUBLE_END_BAG,
            roundType: ROUNDTYPE_SCRIPTED,
            stages:[
                {
                    startTimePercent: 0.0,
                    descriptionText: "1-4"
                },
                {
                    startTimePercent: 0.5,
                    descriptionText: "2-3"
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
                " \u2022 5 round of drills.\n" +
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
                "HEAVY BAG FREESTYLE:\n"+
                " \u2022 Close it out however you want.",
            bagType: ROUND_HEAVY_BAG,
            roundType: ROUNDTYPE_TIMED,
        }
    ],
    [
        {
            introText: "COMBO WORKOUT 2:\n" +
                " \u2022 6 round of drills.\n" +
                " \u2022 Warm up, then focus on combos.",
            uiShortText: "COMBO WORKOUT 2",
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
                    descriptionText: "1-2-1"
                },
                {
                    startTimePercent: 0.25,
                    descriptionText: "1-2-1-4"
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
                "STILL MORE COMBOS:\n" +
                " \u2022 Try some more complex combos.\n" +
                " \u2022 Focus on form, then increase speed.",
            bagType: ROUND_HEAVY_BAG,
            roundType: ROUNDTYPE_SCRIPTED,
            stages: [
                {
                    startTimePercent: 0.0,
                    descriptionText: "1-2-3-2"
                },
                {
                    startTimePercent: 0.25,
                    descriptionText: "1-4-3-2"
                },
                {
                    startTimePercent: 0.5,
                    descriptionText: "1-1-2-3-4"
                },
                {
                    startTimePercent: 0.75,
                    descriptionText: "1-2-1-1-4-3"
                }
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
    
];