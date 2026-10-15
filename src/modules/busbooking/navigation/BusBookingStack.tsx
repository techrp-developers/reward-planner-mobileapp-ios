import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import BookingHomeScreen from "../components/screens/BookingHomeScreen";
import BusListingScreen from "../components/screens/BusListingScreen";
import AllFilterScreen from "../components/screens/AllFilterScreen";
import AboutBusScreen from "../components/screens/AboutBusScreen";
import SeatSelectionScreen from "../components/screens/SeatSelectionScreen";
import PassengerDetailsScreen from "../components/screens/PassengerDetailsScreen";
import BoardingDroppingSelectionScreen from "../components/screens/BoardingDroppingSelectionScreen";
import BusSummaryScreen from "../components/screens/BusSummaryScreen";
import PaymentScreen from "../components/screens/PaymentScreen";
import BusOrdersScreen from "../components/screens/BusOrdersScreen";
import BusOrderDetailScreen from "../components/screens/BusOrderDetailScreen";
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

  journeyTime: string;

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

  srdvIndex?: string;

  resultIndex?: string;

  isWomenBooking?: boolean;
};
BoardingDroppingSelectionScreen: {
  bus: any;
  totalFare: number;

  selectedSeats: any[];

  passengers?: any[];

  traceId?: string;

  srdvIndex?: string;

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
  return (
    <Stack.Navigator
      initialRouteName="DineOutModule"
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="DineOutModule" component={BookingHomeScreen} />
      <Stack.Screen name="BookingHomeScreen" component={BookingHomeScreen} />
      <Stack.Screen name="BusListingScreen" component={BusListingScreen} />
      <Stack.Screen name="AllFilterScreen" component={AllFilterScreen} />
      <Stack.Screen name="AboutBusScreen" component={AboutBusScreen} />
      <Stack.Screen name="SeatSelectionScreen" component={SeatSelectionScreen} />
      <Stack.Screen
        name="PassengerDetailsScreen"
        component={PassengerDetailsScreen}
      />
      <Stack.Screen
        name="BoardingDroppingSelectionScreen"
        component={BoardingDroppingSelectionScreen}
      />
      <Stack.Screen name="BusSummaryScreen" component={BusSummaryScreen} />
      <Stack.Screen name="PaymentScreen" component={PaymentScreen} />
      <Stack.Screen name="BusOrdersScreen" component={BusOrdersScreen} />
      <Stack.Screen
        name="BusOrderDetailScreen"
        component={BusOrderDetailScreen}
      />
    </Stack.Navigator>
  );
}
