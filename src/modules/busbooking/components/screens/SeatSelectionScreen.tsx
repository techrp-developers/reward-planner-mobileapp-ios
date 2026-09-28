import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import type { BusBookingStackParamList } from "../../navigation/BusBookingStack";
import ButtonAseat from "../../assets/icons/ButtonAseat.svg";
import ButtonBseat from "../../assets/icons/ButtonBseat.svg";
import Aformale from "../../assets/icons/Aformale.svg";
import Aforfemale from "../../assets/icons/Aforfemale.svg";
import Bookmseat from "../../assets/icons/bookmseat.svg";
import Bookfseat from "../../assets/icons/bookfseat.svg";
import Seatavailable from "../../assets/icons/seatavailable.svg";
import Seatselected from "../../assets/icons/seatselected.svg";
import Bookmale from "../../assets/icons/bookmale.svg";
import Bookfemale from "../../assets/icons/bookfemale.svg";
import AformaleSeater from "../../assets/icons/aformale (2).svg";
import AforfemaleSeater from "../../assets/icons/aforfemale (2).svg";
import type {
  SeatLayoutSeat,
} from "../../services/busBookingApi";


type DeckKey = "lower" | "upper";
type LayoutKind =
  | "seater"
  | "sleeper";

type SeatLayoutCode =
  | "1+1"
  | "1+2"
  | "2+1"
  | "2+2";

type SeatStatus =
  | "available"
  | "selected"
  | "male"
  | "female"
  | "booked"
  | "maleBooked"
  | "femaleBooked";

type SeatItem = {
  id: string;

  label: string;

  status?: SeatStatus;

  spacer?: boolean;

  aisle?: boolean;

  fare?: number;

  raw?: SeatLayoutSeat;
};

const lowerDeckSeats: SeatItem[][] = [
  [
    { id: "L1", label: "1A", status: "available" },
    { id: "L2", label: "1B", status: "available" },
    { id: "lower-gap-1", label: "", spacer: true },
    { id: "L3", label: "1C", status: "male" },
    { id: "L4", label: "1D", status: "femaleBooked" },
  ],
  [
    { id: "L5", label: "2A", status: "available" },
    { id: "L6", label: "2B", status: "available" },
    { id: "lower-gap-2", label: "", spacer: true },
    { id: "L7", label: "2C", status: "maleBooked" },
    { id: "L8", label: "2D", status: "available" },
  ],
  [
    { id: "L9", label: "3A", status: "available" },
    { id: "L10", label: "3B", status: "available" },
    { id: "lower-gap-3", label: "", spacer: true },
    { id: "L11", label: "3C", status: "available" },
    { id: "L12", label: "3D", status: "available" },
  ],
  [
    { id: "L13", label: "4A", status: "available" },
    { id: "L14", label: "4B", status: "available" },
    { id: "lower-gap-4", label: "", spacer: true },
    { id: "L15", label: "4C", status: "available" },
    { id: "L16", label: "4D", status: "available" },
  ],
  [
    { id: "L17", label: "5A", status: "available" },
    { id: "L18", label: "5B", status: "available" },
    { id: "lower-gap-5", label: "", spacer: true },
    { id: "L19", label: "5C", status: "available" },
    { id: "L20", label: "5D", status: "available" },
  ],
];

const upperDeckSeats: SeatItem[][] = [
  [
    { id: "U1", label: "11A", status: "available" },
    { id: "U2", label: "11B", status: "available" },
    { id: "upper-gap-1", label: "", spacer: true },
    { id: "U3", label: "11C", status: "male" },
    { id: "U4", label: "11D", status: "femaleBooked" },
  ],
  [
    { id: "U5", label: "12A", status: "available" },
    { id: "U6", label: "12B", status: "available" },
    { id: "upper-gap-2", label: "", spacer: true },
    { id: "U7", label: "12C", status: "female" },
    { id: "U8", label: "12D", status: "available" },
  ],
  [
    { id: "U9", label: "13A", status: "available" },
    { id: "U10", label: "13B", status: "available" },
    { id: "upper-gap-3", label: "", spacer: true },
    { id: "U11", label: "13C", status: "maleBooked" },
    { id: "U12", label: "13D", status: "available" },
  ],
  [
    { id: "U13", label: "14A", status: "available" },
    { id: "U14", label: "14B", status: "available" },
    { id: "upper-gap-4", label: "", spacer: true },
    { id: "U15", label: "14C", status: "available" },
    { id: "U16", label: "14D", status: "maleBooked" },
  ],
];

const seaterSeats: SeatItem[][] = [
  [
    { id: "S1", label: "1A", status: "available" },
    { id: "S2", label: "1B", status: "available" },
    { id: "seater-gap-1", label: "", spacer: true },
    { id: "S3", label: "1C", status: "female" },
    { id: "S4", label: "1D", status: "femaleBooked" },
  ],
  [
    { id: "S5", label: "2A", status: "available" },
    { id: "S6", label: "2B", status: "available" },
    { id: "seater-gap-2", label: "", spacer: true },
    { id: "S7", label: "2C", status: "male" },
    { id: "S8", label: "2D", status: "maleBooked" },
  ],
  [
    { id: "S9", label: "3A", status: "maleBooked" },
    { id: "S10", label: "3B", status: "available" },
    { id: "seater-gap-3", label: "", spacer: true },
    { id: "S11", label: "3C", status: "maleBooked" },
    { id: "S12", label: "3D", status: "available" },
  ],
  [
    { id: "S13", label: "4A", status: "available" },
    { id: "S14", label: "4B", status: "available" },
    { id: "seater-gap-4", label: "", spacer: true },
    { id: "S15", label: "4C", status: "available" },
    { id: "S16", label: "4D", status: "available" },
  ],
];

const getFareValue = (price: string) => Number(price.replace(/[^\d]/g, "")) || 0;
const formatSeatFareLabel = (fare?: number) => `Rs ${Number(fare || 0).toFixed(0)}/-`;

const toBoolean = (
  value: unknown
): boolean => {

  return (
    value === true ||
    value === "true" ||
    value === 1 ||
    value === "1"
  );
};
const getApiSeatFare = (
  seat: SeatLayoutSeat
): number => {

  const value =
    seat.SeatFare ??
    seat.Price?.OfferedFare ??
    seat.Price?.PublishedFare ??
    0;


  const amount =
    Number(value);


  return Number.isFinite(amount)
    ? amount
    : 0;
};

const isSleeperSeatRaw = (
  seat?: SeatLayoutSeat
) => {
  const seatType =
    String(
      seat?.SeatType || ""
    ).toLowerCase();

  const width =
    Number(
      seat?.Width ?? 0
    );

  return (
    seatType.includes("sleeper") ||
    seatType.includes("berth") ||
    toBoolean(
      seat?.DoubleBirth
    ) ||
    width >= 2
  );
};

const mapApiSeatToUiSeat = (
  seat: SeatLayoutSeat
): SeatItem => {

  const isAvailable =
    toBoolean(
      seat.SeatStatus
    );

  const isLadies =
    toBoolean(
      seat.IsLadiesSeat
    );

  const isMale =
    toBoolean(
      seat.IsMalesSeat
    );


  let status:
    SeatStatus =
    "available";


  /*
  |--------------------------------------------------------------------------
  | Booked Seat
  |--------------------------------------------------------------------------
  */

  if (!isAvailable) {

    if (isLadies) {

      status =
        "femaleBooked";

    } else if (isMale) {

      status =
        "maleBooked";

    } else {

      status =
        "booked";
    }

  } else {

    /*
    |--------------------------------------------------------------------------
    | Available Seat
    |--------------------------------------------------------------------------
    */

    if (isLadies) {

      status =
        "female";

    } else if (isMale) {

      status =
        "male";

    } else {

      status =
        "available";
    }
  }


  return {

    id:
      `${toBoolean(
        seat.IsUpper
      )
        ? "U"
        : "L"
      }-${seat.RowNo}-${seat.ColumnNo}-${seat.SeatName}`,

    label:
      String(
        seat.SeatName
      ),

    status,

    fare:
      getApiSeatFare(
        seat
      ),

    raw:
      seat,
  };
};

const getSeatSequenceValue = (
  seat: SeatLayoutSeat
) => {
  const seatName =
    String(
      seat.SeatName || ""
    ).trim();

  const numberMatch =
    seatName.match(/\d+/);

  if (numberMatch) {
    return Number(numberMatch[0]);
  }

  return Number.MAX_SAFE_INTEGER;
};

const getBusTypeText = (
  rawBus: any,
  fallbackSubtitle?: string
) => {
  return String(
    rawBus?.BusType ||
    rawBus?.busType ||
    rawBus?.VehicleType ||
    rawBus?.vehicleType ||
    rawBus?.CoachType ||
    rawBus?.coachType ||
    fallbackSubtitle ||
    ""
  ).toLowerCase();
};

const getBusLayoutMode = (
  rawBus: any,
  seats: SeatLayoutSeat[]
): LayoutKind => {
  const sleeperFlag =
    toBoolean(
      rawBus?.Sleeper
    );
  const seaterFlag =
    toBoolean(
      rawBus?.Seater
    );

  if (sleeperFlag) {
    return "sleeper";
  }

  if (seaterFlag) {
    return "seater";
  }

  const sleeperSeatCount =
    seats.filter((seat) =>
      isSleeperSeatRaw(seat)
    ).length;
  const seaterSeatCount =
    seats.length -
    sleeperSeatCount;

  if (
    sleeperSeatCount > 0 &&
    sleeperSeatCount >=
      seaterSeatCount
  ) {
    return "sleeper";
  }

  if (seaterSeatCount > 0) {
    return "seater";
  }

  return "seater";
};

const getSeatLayoutCode = (
  busTypeText: string,
  seats: SeatLayoutSeat[]
): SeatLayoutCode => {
  const layoutMatch =
    busTypeText.match(
      /\b(1\+1|1\+2|2\+1|2\+2)\b/
    );

  if (layoutMatch?.[1]) {
    return layoutMatch[1] as SeatLayoutCode;
  }

  const rowMap =
    new Map<number, number[]>();

  seats.forEach((seat) => {
    const rowNo =
      Number(seat.RowNo);
    const columnNo =
      Number(seat.ColumnNo);

    if (
      !Number.isFinite(rowNo) ||
      !Number.isFinite(columnNo)
    ) {
      return;
    }

    const currentColumns =
      rowMap.get(rowNo) || [];

    if (
      !currentColumns.includes(
        columnNo
      )
    ) {
      currentColumns.push(columnNo);
      rowMap.set(
        rowNo,
        currentColumns
      );
    }
  });

  const rows =
    Array.from(
      rowMap.values()
    )
      .map((columns) =>
        [...columns].sort(
          (a, b) => a - b
        )
      )
      .filter(
        (columns) =>
          columns.length > 0
      );

  const maxSeatsPerRow =
    rows.reduce(
      (max, columns) =>
        Math.max(
          max,
          columns.length
        ),
      0
    );

  if (maxSeatsPerRow <= 2) {
    return "1+1";
  }

  if (maxSeatsPerRow >= 4) {
    return "2+2";
  }

  const hasOnePlusTwo =
    rows.some(
      (columns) =>
        columns.length === 3 &&
        columns[0] === 1 &&
        columns[1] >= 3
    );

  if (hasOnePlusTwo) {
    return "1+2";
  }

  return "2+1";
};

const getLayoutColumnCount = (
  seatLayoutCode: SeatLayoutCode
) => {
  switch (seatLayoutCode) {
    case "1+1":
      return 2;
    case "1+2":
    case "2+1":
      return 3;
    case "2+2":
    default:
      return 4;
  }
};

const getAisleInsertIndex = (
  seatLayoutCode: SeatLayoutCode
) => {
  switch (seatLayoutCode) {
    case "1+1":
    case "1+2":
      return 1;
    case "2+1":
    case "2+2":
    default:
      return 2;
  }
};

const buildSeatRows = (
  seats: SeatLayoutSeat[],
  seatLayoutCode: SeatLayoutCode,
  layoutKind: LayoutKind
): SeatItem[][] => {

  if (
    !Array.isArray(seats) ||
    seats.length === 0
  ) {

    return [];
  }


  /*
  |--------------------------------------------------------------------------
  | Sort Seats
  |--------------------------------------------------------------------------
  */

  const sorted =
    [...seats].sort(
      (a, b) => {
        const seatNumberDiff =
          getSeatSequenceValue(a) -
          getSeatSequenceValue(b);

        if (seatNumberDiff !== 0) {
          return seatNumberDiff;
        }

        const rowDiff =
          Number(a.RowNo) -
          Number(b.RowNo);

        if (rowDiff !== 0) {

          return rowDiff;
        }


        return (
          Number(a.ColumnNo) -
          Number(b.ColumnNo)
        );
      }
    );

  const columnsPerRow =
    getLayoutColumnCount(
      seatLayoutCode
    );
  const aisleInsertIndex =
    getAisleInsertIndex(
      seatLayoutCode
    );
  const rows: SeatItem[][] = [];

  let rowIndex = 0;

  while (rowIndex < sorted.length) {
    const remainingSeats =
      sorted.length - rowIndex;
    const shouldUseExpandedLastRow =
      layoutKind === "seater" &&
      remainingSeats ===
        columnsPerRow + 1;
    const isLastRow =
      shouldUseExpandedLastRow;
    const seatsInThisRow =
      isLastRow
        ? remainingSeats
        : columnsPerRow;
    const slotCount =
      isLastRow
        ? columnsPerRow + 1
        : columnsPerRow;
    const rowSeats =
      sorted.slice(
        rowIndex,
        rowIndex + seatsInThisRow
      );

    const physicalSlots =
      Array.from(
        { length: slotCount },
        (_, slotIndex) => {
          const seat =
            rowSeats[slotIndex];

          if (!seat) {
            return {
              id: `row-${rowIndex}-empty-${slotIndex}`,
              label: "",
              spacer: true,
            } as SeatItem;
          }

          return mapApiSeatToUiSeat(
            seat
          );
        }
      );

    const visualRow =
      isLastRow
        ? physicalSlots
        : [...physicalSlots];

    if (!isLastRow) {
      visualRow.splice(
        aisleInsertIndex,
        0,
        {
          id: `row-${rowIndex}-aisle`,
          label: "",
          spacer: true,
          aisle: true,
        }
      );
    }

    rows.push(
      visualRow
    );

    rowIndex +=
      seatsInThisRow;
  }

  return rows;
};

export default function SeatSelectionScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<BusBookingStackParamList>>();
  const route = useRoute<RouteProp<BusBookingStackParamList, "SeatSelectionScreen">>();
 const [
  selectedDeck,
  setSelectedDeck
] =
  React.useState<DeckKey>(
    "lower"
  );


const [
  selectedSeats,
  setSelectedSeats
] =
  React.useState<string[]>(
    []
  );


/*
|--------------------------------------------------------------------------
| Navigation Data
|--------------------------------------------------------------------------
*/

const {
  bus,
  seatLayout,
  isWomenBooking,
} = route.params;


/*
|--------------------------------------------------------------------------
| Original Search Bus Data
|--------------------------------------------------------------------------
*/

const rawBus =
  bus.raw || {};


/*
|--------------------------------------------------------------------------
| Bus Type
|--------------------------------------------------------------------------
*/

const busTypeText =
  React.useMemo(
    () => getBusTypeText(rawBus, bus.subtitle),
    [rawBus, bus.subtitle]
  );

  const apiSeats =
  React.useMemo<SeatLayoutSeat[]>(
    () => {

      if (
        Array.isArray(
          seatLayout?.seats
        )
      ) {
        return seatLayout.seats;
      }

      return [];
    },
    [seatLayout]
  );

const seatLayoutCode =
  React.useMemo<SeatLayoutCode>(
    () =>
      getSeatLayoutCode(
        busTypeText,
        apiSeats
      ),
    [apiSeats, busTypeText]
  );

const layoutKind =
  React.useMemo<LayoutKind>(
    () =>
      getBusLayoutMode(
        rawBus,
        apiSeats
      ),
    [apiSeats, rawBus]
  );

const isSeaterBus =
  layoutKind === "seater";

const isSleeperBus =
  layoutKind === "sleeper";

const isSeaterLayout =
  layoutKind === "seater";

const seatVisualWidth =
  isSeaterLayout
    ? 48
    : 52;
const seatRowGap = 10;
const seatPanelInnerWidth = 298;
const driverIconWidth = 62;

const aisleSpacerWidth =
  React.useMemo(() => {
    switch (seatLayoutCode) {
      case "1+1":
        return 56;
      case "1+2":
      case "2+1":
        return 42;
      case "2+2":
      default:
        return isSeaterLayout
          ? 44
          : 36;
    }
  }, [isSeaterLayout, seatLayoutCode]);

const driverSpacerWidth =
  React.useMemo(() => {
    const columnsPerRow =
      getLayoutColumnCount(
        seatLayoutCode
      );
    const aisleIndex =
      getAisleInsertIndex(
        seatLayoutCode
      );
    const visualSlotCount =
      columnsPerRow + 1;
    const slotWidths =
      Array.from(
        { length: visualSlotCount },
        (_, index) =>
          index === aisleIndex
            ? aisleSpacerWidth
            : seatVisualWidth
      );
    const totalRowWidth =
      slotWidths.reduce(
        (sum, width) =>
          sum + width,
        0
      ) +
      seatRowGap *
        (visualSlotCount - 1);
    const rowLeftInset =
      Math.max(
        0,
        (seatPanelInnerWidth -
          totalRowWidth) / 2
      );
    const lastSeatIndex =
      visualSlotCount - 1;
    const beforeLastSeatWidth =
      slotWidths
        .slice(0, lastSeatIndex)
        .reduce(
          (sum, width) =>
            sum + width,
          0
        );
    const lastSeatCenterX =
      rowLeftInset +
      beforeLastSeatWidth +
      seatRowGap *
        lastSeatIndex +
      seatVisualWidth / 2;

    return Math.max(
      0,
      lastSeatCenterX -
        driverIconWidth / 2
    );
  }, [
    aisleSpacerWidth,
    seatLayoutCode,
    seatVisualWidth,
  ]);

console.log(
  "[BusBooking][SeatSelection] API Data",
  {
    busTypeText,
    layoutKind,
    seatLayoutCode,
    totalSeats:
      seatLayout?.totalSeats,

    availableSeats:
      seatLayout?.availableSeats,

    seatCount:
      apiSeats.length,
  }
);


/*
|--------------------------------------------------------------------------
| Upper Deck Available?
|--------------------------------------------------------------------------
*/

const hasUpperDeck =
  apiSeats.some(
    (seat) =>
      toBoolean(
        seat.IsUpper
      )
  );


/*
|--------------------------------------------------------------------------
| Lower Seats
|--------------------------------------------------------------------------
*/

const lowerSeats =
  React.useMemo(
    () => {

      return apiSeats.filter(
        (seat) =>
          !toBoolean(
            seat.IsUpper
          )
      );
    },

    [apiSeats]
  );


/*
|--------------------------------------------------------------------------
| Upper Seats
|--------------------------------------------------------------------------
*/

const upperSeats =
  React.useMemo(
    () => {

      return apiSeats.filter(
        (seat) =>
          toBoolean(
            seat.IsUpper
          )
      );
    },

    [apiSeats]
  );


const lowerDeckRows =
  React.useMemo(
    () =>
      buildSeatRows(
        lowerSeats,
        seatLayoutCode,
        layoutKind
      ),

    [layoutKind, lowerSeats, seatLayoutCode]
  );


const upperDeckRows =
  React.useMemo(
    () =>
      buildSeatRows(
        upperSeats,
        seatLayoutCode,
        layoutKind
      ),

    [layoutKind, seatLayoutCode, upperSeats]
  );


/*
|--------------------------------------------------------------------------
| Current Visible Rows
|--------------------------------------------------------------------------
*/

const seatRows =
  selectedDeck === "upper" &&
  hasUpperDeck

    ? upperDeckRows

    : lowerDeckRows;

const groupedSeatRows =
  React.useMemo(
    () => {
      const groups: SeatItem[][][] = [];

      for (let index = 0; index < seatRows.length; index += 2) {
        groups.push(
          seatRows.slice(index, index + 2)
        );
      }

      return groups;
    },
    [seatRows]
  );

const selectedSeatDetails =
  React.useMemo(
    () => {

      return apiSeats.filter(
        (seat) =>

          selectedSeats.includes(
            String(
              seat.SeatName
            )
          )
      );
    },

    [
      apiSeats,
      selectedSeats,
    ]
  );


const totalFare =
  React.useMemo(
    () => {

      return selectedSeatDetails.reduce(
        (
          total,
          seat
        ) => {

          return (
            total +
            getApiSeatFare(
              seat
            )
          );
        },

        0
      );
    },

    [selectedSeatDetails]
  );


const startingFare =
  React.useMemo(
    () => {

      const firstAvailableSeat =
        apiSeats.find(
          (seat) =>
            toBoolean(
              seat.SeatStatus
            )
        );


      if (!firstAvailableSeat) {

        return getFareValue(
          bus.price
        );
      }


      return getApiSeatFare(
        firstAvailableSeat
      );
    },

    [
      apiSeats,
      bus.price,
    ]
  );

const handleToggleSeat =
  React.useCallback(
    (seat: SeatItem) => {

      /*
      |--------------------------------------------------------------------------
      | Cannot Select Booked Seat
      |--------------------------------------------------------------------------
      */

      if (
        seat.spacer ||
        seat.status ===
          "booked" ||
        seat.status ===
          "maleBooked" ||
        seat.status ===
          "femaleBooked"
      ) {

        return;
      }


      setSelectedSeats(
        (current) => {

          if (
            current.includes(
              seat.label
            )
          ) {

            return current.filter(
              (item) =>
                item !==
                seat.label
            );
          }


          return [
            ...current,
            seat.label,
          ];
        }
      );
    },

    []
  );

const handleContinue =
  React.useCallback(
    () => {

      if (
        selectedSeats.length === 0
      ) {
        return;
      }


      const traceId =
        seatLayout?.traceId;

      const srdvIndex =
        seatLayout?.srdvIndex;

      const resultIndex =
        seatLayout?.resultIndex;


      console.log(
        "[BusBooking][SeatSelection] Continue",
        {
          selectedSeats,

          traceId,

          srdvIndex,

          resultIndex,
        }
      );


      if (
        !traceId ||
        !srdvIndex ||
        !resultIndex
      ) {

        console.log(
          "[BusBooking][SeatSelection] Missing booking identifiers"
        );

        return;
      }


      navigation.navigate(
        "BoardingDroppingSelectionScreen",
        {
          bus: { ...bus, selectedSeatDetails },

          selectedSeats,

          passengers: [],

          traceId:
            String(
              traceId
            ),

          srdvIndex:
            String(
              srdvIndex
            ),

          resultIndex:
            String(
              resultIndex
            ),

          isWomenBooking:
            isWomenBooking,
        }
      );
    },

    [
      selectedSeatDetails,
      bus,
      navigation,
      seatLayout,
      selectedSeats,
      isWomenBooking,
    ]
  );

  const isSeatRenderedAsSeater = React.useCallback(
    (_seat: SeatItem) => {
      return isSeaterLayout;
    },
    [isSeaterLayout]
  );

  const renderSeatIcon = React.useCallback((seat: SeatItem, isSelected: boolean) => {
    if (isSeatRenderedAsSeater(seat)) {
      if (isSelected) {
        return <Seatselected width={29} height={38} />;
      }

switch (seat.status) {

  case "male":
    return (
      <AformaleSeater
        width={29}
        height={38}
      />
    );

  case "female":
    return (
      <AforfemaleSeater
        width={29}
        height={38}
      />
    );

  case "maleBooked":
    return (
      <Bookmale
        width={29}
        height={38}
      />
    );

  case "femaleBooked":
    return (
      <Bookfemale
        width={29}
        height={38}
      />
    );

  case "booked":
    return (
      <View style={styles.bookedSeatFaded}>
        <Seatavailable
          width={29}
          height={38}
        />
      </View>
    );

  default:
    return (
      <Seatavailable
        width={29}
        height={38}
      />
    );
}
    }

    if (isSelected) {
      return <ButtonBseat width={48} height={88} />;
    }

    switch (seat.status) {
      case "male":
        return <Aformale width={48} height={88} />;
      case "female":
        return <Aforfemale width={48} height={88} />;
      case "maleBooked":
        return <Bookmseat width={48} height={88} />;
      case "femaleBooked":
        return <Bookfseat width={48} height={88} />;
      case "booked":
        return (
          <View style={styles.bookedSeatBlockSleeper} />
        );
      case "selected":
        return <ButtonBseat width={48} height={88} />;
      case "available":
      default:
        return <ButtonAseat width={48} height={88} />;
    }
  }, [isSeatRenderedAsSeater]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color="#77737B" />
        </TouchableOpacity>

        <View style={styles.headerTextWrap}>
          <Text style={styles.operatorText}>{bus.operator}</Text>
          <Text style={styles.subtitleText}>{bus.subtitle}</Text>
        </View>

      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isWomenBooking && (
          <View style={styles.womenBookingBanner}>
            <MaterialCommunityIcons name="gender-female" size={16} color="#CE1538" />
            <Text style={styles.womenBookingBannerText}>
              Ladies Booking preference active (female passenger details default)
            </Text>
          </View>
        )}

        <View style={styles.routeCard}>
          <Text style={styles.routeLabel}>Route</Text>
          <View style={styles.routeRow}>
            <Text style={styles.routePointText}>{bus.from}</Text>
            <MaterialCommunityIcons name="arrow-right" size={18} color="#D31637" />
            <Text style={styles.routePointText}>{bus.to}</Text>
          </View>
        </View>

       {hasUpperDeck ? (
          <View style={styles.deckTabsWrap}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setSelectedDeck("lower")}
              style={styles.deckTab}
            >
              {selectedDeck === "lower" ? (
                <LinearGradient
                  colors={["#D31637", "#B20C28"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.deckTabActive}
                >
                  <Text style={styles.deckTabTextActive}>Lower Deck</Text>
                </LinearGradient>
              ) : (
                <View style={styles.deckTabInactive}>
                  <Text style={styles.deckTabTextInactive}>Lower Deck</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setSelectedDeck("upper")}
              style={styles.deckTab}
            >
              {selectedDeck === "upper" ? (
                <LinearGradient
                  colors={["#D31637", "#B20C28"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.deckTabActive}
                >
                  <Text style={styles.deckTabTextActive}>Upper Deck</Text>
                </LinearGradient>
              ) : (
                <View style={styles.deckTabInactive}>
                  <Text style={styles.deckTabTextInactive}>Upper Deck</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
      ) : null}

        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summaryTitle}>{bus.departure} - {bus.arrival}</Text>
            <Text style={styles.summaryMeta}>{bus.duration} - {bus.price}</Text>
          </View>
          <View style={styles.seatLeftBadge}>
           <Text
  style={
    styles.seatLeftText
  }
>
  {
    seatLayout
      ?.availableSeats ?? 0
  } SEATS LEFT
</Text>
          </View>
        </View>

        <View style={[styles.seatPanel, isSeaterLayout ? styles.seatPanelSeater : null]}>
          <View
            style={[
              styles.driverRow,
              isSeaterLayout
                ? styles.driverRowSeater
                : null,
            ]}
          >
            <View style={{ width: driverSpacerWidth }} />
            <View style={styles.driverIconWrap}>
              <MaterialCommunityIcons
                name="steering"
                size={46}
                color="#B4B0B5"
              />
            </View>
          </View>

          <View style={[styles.seatGrid, isSeaterLayout ? styles.seatGridSeater : null]}>
            {groupedSeatRows.map((group, groupIndex) => (
              <React.Fragment key={`seat-group-${groupIndex}`}>
                <View
                  style={[
                    styles.seatRowGroup,
                    groupIndex < groupedSeatRows.length - 1
                      ? styles.seatRowGroupSpaced
                      : null,
                  ]}
                >
                  {group.map((row, rowInGroupIndex) => {
                    return (
                      <View
                        key={row.map((seat) => seat.id).join("-")}
                        style={[
                          styles.seatRow,
                          isSeaterLayout ? styles.seatRowSeater : null,
                          rowInGroupIndex === 0
                            ? styles.seatRowInsideGroup
                            : null,
                        ]}
                      >
                        {row.map((seat, seatIndex) => {
                          const isSeatSeater =
                            !seat.spacer &&
                            isSeatRenderedAsSeater(seat);

                          return (
                            <React.Fragment key={seat.id}>
                              {seat.aisle ? (
                                <View
                                  style={{
                                    width: aisleSpacerWidth,
                                  }}
                                />
                              ) : seat.spacer ? (
                                <View
                                  style={
                                    isSeaterLayout
                                      ? styles.seatItemSeaterEmpty
                                      : styles.seatItemEmpty
                                  }
                                />
                              ) : (
                              <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={() => handleToggleSeat(seat)}
                                style={isSeatSeater ? styles.seatItemSeater : styles.seatItem}
                              >
                                {renderSeatIcon(
                                  seat,
                                  selectedSeats.includes(seat.label)
                                )}
                                {!seat.spacer ? (
                                  <Text
                                    style={styles.seatFareText}
                                  >
                                      {formatSeatFareLabel(seat.fare || startingFare)}
                                    </Text>
                                  ) : null}
                                </TouchableOpacity>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </View>
                    );
                  })}
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>

        <View style={styles.seatGuideSection}>
          <Text style={styles.seatGuideTitle}>Know Your Seat Types</Text>

          <View style={styles.seatGuideCard}>
            <View style={styles.seatGuideHeaderRow}>
              <Text style={styles.seatGuideHeaderText}>Type</Text>
              <Text style={styles.seatGuideHeaderText}>
                {isSeaterLayout
                  ? "Seater"
                  : "Sleeper"}
              </Text>
            </View>

            <View style={styles.seatGuideItemRow}>
              <Text style={styles.seatGuideLabel}>Available</Text>
              {isSeaterLayout ? (
                <Seatavailable width={22} height={28} />
              ) : (
                <ButtonAseat width={24} height={44} />
              )}
            </View>

            <View style={styles.seatGuideItemRow}>
              <Text style={styles.seatGuideLabel}>Selected</Text>
              {isSeaterLayout ? (
                <Seatselected width={22} height={28} />
              ) : (
                <ButtonBseat width={24} height={44} />
              )}
            </View>

            <View style={styles.seatGuideItemRow}>
              <Text style={styles.seatGuideLabel}>Booked</Text>
              {isSeaterLayout ? (
                <View style={styles.bookedSeatFaded}>
                  <Seatavailable width={22} height={28} />
                </View>
              ) : (
                <View style={styles.bookedSeatBlockSleeper} />
              )}
            </View>

            <View style={styles.seatGuideItemRow}>
              <Text style={styles.seatGuideLabel}>Available only for female passenger</Text>
              {isSeaterLayout ? (
                <AforfemaleSeater width={22} height={28} />
              ) : (
                <Aforfemale width={24} height={44} />
              )}
            </View>

            <View style={styles.seatGuideItemRow}>
              <Text style={styles.seatGuideLabel}>Booked by female passenger</Text>
              {isSeaterLayout ? (
                <Bookfemale width={22} height={28} />
              ) : (
                <Bookfseat width={24} height={44} />
              )}
            </View>

            <View style={styles.seatGuideItemRow}>
              <Text style={styles.seatGuideLabel}>Available for male passenger</Text>
              {isSeaterLayout ? (
                <AformaleSeater width={22} height={28} />
              ) : (
                <Aformale width={24} height={44} />
              )}
            </View>

            <View style={styles.seatGuideItemRowLast}>
              <Text style={styles.seatGuideLabel}>Booked by male passenger</Text>
              {isSeaterLayout ? (
                <Bookmale width={22} height={28} />
              ) : (
                <Bookmseat width={24} height={44} />
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomLabel}>TOTAL FARE</Text>
          <Text style={styles.bottomFare}>
          Rs {
  selectedSeats.length === 0

    ? startingFare.toLocaleString(
        "en-IN",
        {
          maximumFractionDigits: 2,
        }
      )

    : totalFare.toLocaleString(
        "en-IN",
        {
          maximumFractionDigits: 2,
        }
      )
}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={selectedSeats.length === 0 ? 1 : 0.9}
          disabled={selectedSeats.length === 0}
          onPress={handleContinue}
          style={styles.continueButtonWrap}
        >
          <LinearGradient
            colors={selectedSeats.length === 0 ? ["#E8A8B3", "#D28A97"] : ["#D31637", "#B20C28"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueButton}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <MaterialCommunityIcons name="arrow-right" size={18} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F3F2F8",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 34,
  },
  header: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  headerTextWrap: {
    flex: 1,
  },
  operatorText: {
    color: "#343038",
    fontSize: 17,
    fontWeight: "700",
  },
  subtitleText: {
    marginTop: 2,
    color: "#8A8490",
    fontSize: 13,
    fontWeight: "500",
  },
  routeCard: {
    marginTop: 14,
    marginHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  routeLabel: {
    color: "#9D97A1",
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 8,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  routePointText: {
    flex: 1,
    color: "#423E45",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  deckTabsWrap: {
    marginTop: 14,
    marginHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#F8EAEA",
    padding: 4,
    flexDirection: "row",
  },
  deckTab: {
    flex: 1,
  },
  deckTabActive: {
    minHeight: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  deckTabInactive: {
    minHeight: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  deckTabTextActive: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  deckTabTextInactive: {
    color: "#C61D36",
    fontSize: 13,
    fontWeight: "700",
  },
  summaryRow: {
    marginTop: 18,
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryTitle: {
    color: "#38333B",
    fontSize: 16,
    fontWeight: "700",
  },
  summaryMeta: {
    marginTop: 4,
    color: "#8B8691",
    fontSize: 12,
    fontWeight: "500",
  },
  seatLeftBadge: {
    backgroundColor: "#FFE5E9",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  seatLeftText: {
    color: "#CB1733",
    fontSize: 10,
    fontWeight: "800",
  },
  womenBookingBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FCE7EA",
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  womenBookingBannerText: {
    color: "#CE1538",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
  },
  legendWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 8,
    columnGap: 14,
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 6,
    borderWidth: 1,
  },
  legendSwatchAvailable: {
    backgroundColor: "#FFFFFF",
    borderColor: "#9D9A9A",
  },
  legendSwatchSelected: {
    backgroundColor: "#575151",
    borderColor: "#575151",
  },
  legendSwatchMale: {
    backgroundColor: "#0F4B97",
    borderColor: "#0F4B97",
  },
  legendSwatchFemale: {
    backgroundColor: "#E83BA1",
    borderColor: "#E83BA1",
  },
  legendSwatchMaleOutline: {
    backgroundColor: "#FCEEEE",
    borderColor: "#4B78D1",
  },
  legendSwatchFemaleOutline: {
    backgroundColor: "#FCEEEE",
    borderColor: "#FF6AB7",
  },
  legendText: {
    color: "#554F57",
    fontSize: 10,
    fontWeight: "500",
  },
  seatPanel: {
    alignSelf: "center",
    width: 330,
    marginTop: 12,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8E3DE",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  seatPanelSeater: {
    width: 330,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  driverRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 18,
  },
  driverRowSeater: {
    marginBottom: 18,
  },
  driverSideSpacer: {
    width: 228,
  },
  driverSideSpacerSeater: {
    width: 254,
  },
  driverIconWrap: {
    width: 62,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
  },
  seatGrid: {
    gap: 0,
    alignItems: "center",
  },
  seatGridSeater: {
    gap: 0,
  },
  seatRowGroup: {
    marginBottom: 0,
  },
  seatRowGroupSpaced: {
    marginBottom: 0,
  },
  seatRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    gap: 10,
  },
  seatRowSeater: {
    gap: 10,
  },
  seatRowInsideGroup: {
    marginBottom: 0,
  },
  seatSpacer: {
    width: 46,
  },
  seatSpacerSeater: {
    width: 70,
  },
  seatItem: {
    width: 52,
    height: 90,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  seatItemEmpty: {
    width: 52,
    height: 90,
  },
  seatItemSeater: {
    width: 48,
    minHeight: 78,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  seatItemSeaterEmpty: {
    width: 48,
    minHeight: 78,
  },
  seatLabel: {
    position: "absolute",
    top: 6,
    right: 8,
    color: "#6A6670",
    fontSize: 8,
    fontWeight: "700",
  },
  seatLabelSeater: {
    marginTop: 4,
    color: "#6A6670",
    fontSize: 8,
    fontWeight: "700",
  },
  seatLabelBooked: {
    color: "#B55C68",
  },
  bookedSeatFaded: {
    opacity: 0.3,
  },
  bookedSeatBlockSeater: {
    width: 29,
    height: 38,
    borderRadius: 8,
    backgroundColor: "#5F5960",
  },
  bookedSeatBlockSleeper: {
    width: 40,
    height: 76,
    borderRadius: 10,
    backgroundColor: "#D98A99",
  },
  seatLabelSelected: {
    color: "#2F2B31",
  },
  seatLabelSelectedSleeper: {
    color: "#FFFFFF",
  },
  seatFareText: {
    marginTop: 1,
    color: "#6C666E",
    fontSize: 9,
    fontWeight: "500",
  },
  seatFareTextSelected: {
    color: "#6C666E",
  },
  seatGuideSection: {
    marginTop: 18,
    marginHorizontal: 10,
  },
  seatGuideTitle: {
    textAlign: "center",
    color: "#343038",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 12,
  },
  seatGuideCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E9E0DB",
    overflow: "hidden",
  },
  seatGuideHeaderRow: {
    minHeight: 50,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFDFC",
    borderBottomWidth: 1,
    borderBottomColor: "#EFE6E1",
  },
  seatGuideHeaderText: {
    color: "#302B33",
    fontSize: 15,
    fontWeight: "800",
  },
  seatGuideItemRow: {
    minHeight: 84,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F2EBE6",
  },
  seatGuideItemRowLast: {
    minHeight: 84,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  seatGuideLabel: {
    flex: 1,
    paddingRight: 16,
    color: "#4A4550",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: "#EEE7E2",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bottomLabel: {
    color: "#A29CA6",
    fontSize: 10,
    fontWeight: "600",
  },
  bottomFare: {
    marginTop: 4,
    color: "#3C3740",
    fontSize: 28 / 1.5,
    fontWeight: "800",
  },
  continueButtonWrap: {
    minWidth: 170,
  },
  continueButton: {
    height: 48,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 18,
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
