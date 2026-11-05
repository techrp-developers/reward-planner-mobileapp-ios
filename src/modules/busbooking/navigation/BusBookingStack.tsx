import React from "react";
import { useBusTheme } from "../utils/useBusTheme";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import BookingHomeScreen from "../components/screens/BookingHomeScreen";
import type { BusListingFacets } from "../utils/busListingFilters";

export type BusBookingStackParamList = {
  DineOutModule: { moduleName?: string } | undefined;
  BookingHomeScreen: undefined;
  BusListingScreen: {
  buses: any[];
  emptyStateMessage?: string;

  traceId?: string | number | null;

  sourceCity: string;

  destinationCity: string;

  sourceCityCode: string;

  destinationCityCode: string;

  journeyDate: string;

  isWomenBooking?: boolean;

  selectedFilters?: string[];
};
  AllFilterScreen: {
    selectedOptions?: string[];
    // Built from the buses of the current search, so every option and count
    // on the filter screen reflects real inventory.
    facets: BusListingFacets;
  };
  BusOrdersScreen: undefined;
  BusOrderDetailScreen: {
    orderRef: string;
  };
  AboutBusScreen: { bus: any };
  SeatSelectionScreen: {
  bus: any;
  seatLayout: any;
  isWomenBooking?: boolean;
};
PassengerDetailsScreen: {
  bus: any;
  totalFare: number;

  selectedSeats: any[];

  boardingPoint?: any;

  droppingPoint?: any;

  traceId?: string;

  resultIndex?: string;

  isWomenBooking?: boolean;
};
BoardingDroppingSelectionScreen: {
  bus: any;
  totalFare: number;

  selectedSeats: any[];

  passengers?: any[];

  traceId?: string;

  resultIndex?: string;

  isWomenBooking?: boolean;
};
BusSummaryScreen: {
  bus: any;
  selectedSeats: any[];
  passengers: any[];
  boardingPoint: any;
  droppingPoint: any;
  blockResponse: any;
};


PaymentScreen: {
  bus: any;
  selectedSeats: any[];
  passengers?: any[];
  totalAmount: number;
  boardingPoint: any;
  droppingPoint: any;
  blockResponse: any;
};
};

const Stack = createNativeStackNavigator<BusBookingStackParamList>();

export default function BusBookingStack() {
  const busTheme = useBusTheme();
  return (
    <Stack.Navigator
      initialRouteName="DineOutModule"
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        gestureEnabled: true,
        contentStyle: { backgroundColor: busTheme.background },
      }}
    >
      <Stack.Screen name="DineOutModule" component={BookingHomeScreen} />
      <Stack.Screen name="BookingHomeScreen" component={BookingHomeScreen} />
      <Stack.Screen name="BusListingScreen" getComponent={() => require("../components/screens/BusListingScreen").default} />
      <Stack.Screen name="AllFilterScreen" getComponent={() => require("../components/screens/AllFilterScreen").default} />
      <Stack.Screen name="AboutBusScreen" getComponent={() => require("../components/screens/AboutBusScreen").default} />
      <Stack.Screen name="SeatSelectionScreen" getComponent={() => require("../components/screens/SeatSelectionScreen").default} />
      <Stack.Screen
        name="PassengerDetailsScreen"
        getComponent={() => require("../components/screens/PassengerDetailsScreen").default}
      />
      <Stack.Screen
        name="BoardingDroppingSelectionScreen"
        getComponent={() => require("../components/screens/BoardingDroppingSelectionScreen").default}
      />
      <Stack.Screen name="BusSummaryScreen" getComponent={() => require("../components/screens/BusSummaryScreen").default} />
      <Stack.Screen name="PaymentScreen" getComponent={() => require("../components/screens/PaymentScreen").default} />
      <Stack.Screen name="BusOrdersScreen" getComponent={() => require("../components/screens/BusOrdersScreen").default} />
      <Stack.Screen
        name="BusOrderDetailScreen"
        getComponent={() => require("../components/screens/BusOrderDetailScreen").default}
      />
    </Stack.Navigator>
  );
}
