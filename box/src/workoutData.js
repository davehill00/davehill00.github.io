export const ROUND_HEAVY_BAG = 0;
export const ROUND_DOUBLE_ENDED_BAG = 1;
export let workoutData = [

    // WORKOUT 0
    [
    
        {
            introText: "TEST WORKOUT #1:\n \u2022 Round 1: Do two things.\n \u2022 Round 2: Do three things.",
            stages:[],
            bagType: null
        },
        {
            introText: "TITLE:\n \u2022 Thing 1\n \u2022 Thing 2",
            stages: [
                {
                    startTimePercent: 0.0,
                    descriptionText: "THINGS TO DO DURING THE FIRST HALF"
                },
                {
                    startTimePercent: 0.5,
                    descriptionText: "THINGS TO DO DURING THE SECOND HALF"
                }
            ],
            bagType: ROUND_HEAVY_BAG
        },
        {
            introText: "TITLE:\n \u2022 Thing 1\n \u2022 Thing 2\n \u2022 Thing 3",
            stages: [
                {
                    startTimePercent: 0.0,
                    descriptionText: "THINGS TO DO DURING THE FIRST 33%"
                },
                {
                    startTimePercent: 0.33,
                    descriptionText: "THINGS TO DO DURING THE SECOND 33%"
                },
                {
                    startTimePercent: 0.67,
                    descriptionText: "THINGS TO DO DURING THE FINAL 33%"
                }
            ],
            bagType: ROUND_DOUBLE_ENDED_BAG
        }
    ],

    // WORKOUT 1
    [
        {
            introText: "DOUBLE-END BAG #1:\n" +
                " \u2022 5 rounds of double-end bag drills.\n" +
                " \u2022 Focus on accuracy then speed.\n" +
                " \u2022 The double-end bag can hit back, so keep your guard up!",
            stages:[],
            bagType: null
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
            bagType: ROUND_HEAVY_BAG
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
            bagType: ROUND_HEAVY_BAG
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
            bagType: ROUND_HEAVY_BAG
        },
        {
            introText: 
                "ROUND 4 - CAPTAIN HOOK:\n" +
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
            bagType: ROUND_HEAVY_BAG
        },
        {
            introText: 
                "ROUND 5 - JAB-STRAIGHT COMBOS:\n" +
                " \u2022 Throw 2 JABs(1), then a STRAIGHT(2), then a JAB (1), then a STRAIGHT(2).\n",
            stages: [
                {
                    startTimePercent: 0.0,
                    descriptionText: "JAB(1), JAB(1), STRAIGHT(2), JAB(1), STRAIGHT (2)."
                }
            ],
            bagType: ROUND_HEAVY_BAG
        },
    ]
];