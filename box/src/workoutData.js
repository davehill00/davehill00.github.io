export const ROUND_HEAVY_BAG = 0;
export const ROUND_DOUBLE_END_BAG = 1;

export const ROUNDTYPE_SCRIPTED = 0;
export const ROUNDTYPE_NUM_PUNCHES = 1;
export const ROUNDTYPE_TIMED = 2;
export let workoutData = [

    // WORKOUT 0
    // [
    
    //     {
    //         introText: "TEST WORKOUT #1:\n \u2022 Round 1: Do two things.\n \u2022 Round 2: Do three things.",
    //         uiShortText: "TEST WORKOUT #1",
    //         uiText: "TEST WORKOUT #1:<ul><li>Garbage in, garbage out!</li><li>MOAR GARBAGE!</li></ul>",
    //         uid: 0,
    //         stages:[],
    //         bagType: null
    //     },
    //     {
    //         introText: "TITLE:\n \u2022 Thing 1\n \u2022 Thing 2",
    //         stages: [
    //             {
    //                 startTimePercent: 0.0,
    //                 descriptionText: "THINGS TO DO DURING THE FIRST HALF"
    //             },
    //             {
    //                 startTimePercent: 0.5,
    //                 descriptionText: "THINGS TO DO DURING THE SECOND HALF"
    //             }
    //         ],
    //         bagType: ROUND_HEAVY_BAG,
    //         roundType: ROUNDTYPE_SCRIPTED
    //     },
    //     {
    //         introText: "TITLE:\n \u2022 Thing 1\n \u2022 Thing 2\n \u2022 Thing 3",
    //         stages: [
    //             {
    //                 startTimePercent: 0.0,
    //                 descriptionText: "THINGS TO DO DURING THE FIRST 33%"
    //             },
    //             {
    //                 startTimePercent: 0.33,
    //                 descriptionText: "THINGS TO DO DURING THE SECOND 33%"
    //             },
    //             {
    //                 startTimePercent: 0.67,
    //                 descriptionText: "THINGS TO DO DURING THE FINAL 33%"
    //             }
    //         ],
    //         bagType: ROUND_DOUBLE_END_BAG,
    //         roundType: ROUNDTYPE_SCRIPTED
    //     }
    // ],

    // WORKOUT 1
    [
        {
            introText: "DOUBLE-END BAG #1:\n" +
                " \u2022 6 rounds of double-end bag drills.\n" +
                " \u2022 Focus on accuracy then speed.\n" +
                " \u2022 The double-end bag can hit back, so keep your guard up!",
            uiShortText: "D.E.B. INSANITY",
            uiText: "DOUBLE-END BAG INSANITY:<br>6 rounds of drills. All double-end, all the time!<br>So much good stuff to do...<br><br> it'll blow your mind right out of your ear holes!!!",
            uid: 1,
            stages:[],
            bagType: null
        },
        {
            introText: "THROW 100 PUNCHES",
            numPunches: 100,
            bagType: ROUND_DOUBLE_END_BAG,
            roundType: ROUNDTYPE_NUM_PUNCHES
        },

        {
            introText: 
                "JAB THEN STRAIGHT:\n" +
                " \u2022 Throw JABs(1) and move around the bag for the first half.\n" +
                " \u2022 Throw STRAIGHTs(2) and move around the bag for the second half.",
            stages: [
                {
                    startTimePercent: 0.0,
                    descriptionText: "JAB(1) and move around the bag."
                },
                {
                    startTimePercent: 0.5,
                    descriptionText: "STRAIGHT(2) and move around the bag."
                }
            ],
            bagType: ROUND_DOUBLE_END_BAG,
            roundType: ROUNDTYPE_SCRIPTED
        },
        {
            introText: 
                "JAB, HOOK, STRAIGHT, HOOK:\n" +
                " \u2022 Throw JAB(1) then RIGHT HOOK(4) for the first half.\n" +
                " \u2022 Throw STRAIGHT(2) then LEFT HOOK(3) for the second half.\n",
            stages: [
                {
                    startTimePercent: 0.0,
                    descriptionText: "JAB(1) then RIGHT HOOK(4)"
                },
                {
                    startTimePercent: 0.5,
                    descriptionText: "STRAIGHT(2) then LEFT HOOK(3)"
                }
            ],
            bagType: ROUND_DOUBLE_END_BAG,
            roundType: ROUNDTYPE_SCRIPTED
        },
        {
            introText: 
                "THE OLD ONE-TWO PUNCH:\n" +
                " \u2022 Throw JAB(1) then STRAIGHT(2) for the first half.\n" +
                " \u2022 Throw 2 JABs(1) in quick succession then STRAIGHT(2) for the second half.\n",
            stages: [
                {
                    startTimePercent: 0.0,
                    descriptionText: "JAB(1) then STRAIGHT(2)."
                },
                {
                    startTimePercent: 0.5,
                    descriptionText: "JAB(1), JAB(1), STRAIGHT(2)."
                }
            ],
            bagType: ROUND_DOUBLE_END_BAG,
            roundType: ROUNDTYPE_SCRIPTED
        },
        {
            introText: 
                "CAPTAIN HOOK:\n" +
                " \u2022 Throw LEFT HOOKs(3) and move around the bag for the first half.\n" +
                " \u2022 Throw RIGHT HOOKs(4) and move around the bag for the second half.\n",
            stages: [
                {
                    startTimePercent: 0.0,
                    descriptionText: "LEFT HOOK(3) and move around the bag."
                },
                {
                    startTimePercent: 0.5,
                    descriptionText: "RIGHT HOOK(4) and move around the bag."
                }
            ],
            bagType: ROUND_DOUBLE_END_BAG,
            roundType: ROUNDTYPE_SCRIPTED
        },
        {
            introText: 
                "JAB-STRAIGHT COMBOS:\n" +
                " \u2022 Throw 2 JABs(1), then a STRAIGHT(2), then a JAB (1), then a STRAIGHT(2).\n",
            stages: [
                {
                    startTimePercent: 0.0,
                    descriptionText: "JAB(1), JAB(1), STRAIGHT(2), JAB(1), STRAIGHT (2)."
                }
            ],
            bagType: ROUND_DOUBLE_END_BAG,
            roundType: ROUNDTYPE_SCRIPTED
        },
    ],

    [
        {
            introText: "BASIC WORKOUT #1:\n" +
                " \u2022 5 rounds of drills.\n" +
                " \u2022 Heavy Bag + Double-End Bag",
            uiShortText: "BASIC WORKOUT #1",
            uiText: "BASIC WORKOUT #1:<ul><li>5 rounds of drills.</li><li>Mostly heavy bag with a dash of double-end mixed in.</li></ul>",
            uid: 2,
            stages:[],
            bagType: null
        },
        {
            introText: "WARM UP - THROW 200 PUNCHES",
            numPunches: 200,
            bagType: ROUND_HEAVY_BAG,
            roundType: ROUNDTYPE_NUM_PUNCHES
        },
        {
            introText: 
                "SPEED ROUND:\n" + 
                " \u2022 Alternate JAB(1) & STRAIGHT(2).\n" +
                " \u2022 Try for for 300+PPM.",
            bagType: ROUND_HEAVY_BAG,
            roundType: ROUNDTYPE_SCRIPTED,
            stages: [
                {
                    startTimePercent: 0.0,
                    descriptionText: "Start at 300PPM"
                },
                {
                    startTimePercent: 0.5,
                    descriptionText: "Increase to 350PPM"
                },
                {
                    startTimePercent: 0.85,
                    descriptionText: "Try for 400PPM!"
                },
            ]
        },
        {
            introText: 
                "DOUBLE-END COMBOS:\n" +
                " \u2022 Throw 1-2 and 1-1-2 combos.\n" +
                " \u2022 Move around the bag.",
            bagType: ROUND_DOUBLE_END_BAG,
            roundType: ROUNDTYPE_SCRIPTED,
            stages: [
                {
                    startTimePercent: 0.0,
                    descriptionText: "JAB(1) then STRAIGHT(2)"
                },
                {
                    startTimePercent: 0.5,
                    descriptionText: "JAB(1), JAB(1), STRAIGHT(2)"
                }
            ],
        },
        {
            introText: 
                "HEAVY BAG COMBOS:\n" +
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
                    startTimePercent: 0.2,
                    descriptionText: "1-2-3, 1-1-4-3"
                },
                {
                    startTimePercent: 0.6,
                    descriptionText: "1-2-3-2, 1-2-1-4"
                },
            ],
        },
        {
            introText:
                "HEAVY BAG FREESTYLE:\n"+
                " \u2022 Close it out however you want.",
            // stages: [
            //     {
            //         startTimePercent: 0.0,
            //         descriptionText: "Heavy Bag Freestyle"
            //     }
            // ],
            bagType: ROUND_HEAVY_BAG,
            roundType: ROUNDTYPE_TIMED,
        }
    ]

];